const SPREADSHEET_ID = '1Au44gyw_mYwzwRx--TsyOatkWCGwywhtU2n8D1eKXz0';
const TASKS_SHEET = 'Tasks';
const HISTORY_SHEET = 'Change History';
const COMPLETIONS_SHEET = 'Task Completions';
const EVIDENCE_SHEET = 'Evidence';
const SCOPE_SHEET = 'Scope Verification';
const DECISIONS_SHEET = 'Decision Log';
const EXPERIMENTS_SHEET = 'Experiments';
const EVENTS_SHEET = 'Events';
const DEMAND_CLUSTERS_SHEET = 'Demand Clusters';
const DEMAND_INTENTS_SHEET = 'Demand Intents';

const TASK_HEADERS = ['ID','Task','Phase','Owner','Priority','Start','Due','Duration (days)','Status','Progress %','Dependencies','Milestone','Gate','Next Action','Overdue'];

function getToken_(){
  return PropertiesService.getScriptProperties().getProperty('SHARED_TOKEN');
}
function assertToken_(token){
  const expected=getToken_();
  if(!expected) throw new Error('SHARED_TOKEN is not configured');
  if(String(token||'')!==expected) throw new Error('Unauthorized');
}
function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function sheet_(name){return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name)}
function ensureSheet_(name,headers){
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(headers && sh.getLastRow()===0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  return sh;
}
function doGet(e){
  try{
    assertToken_(e && e.parameter && e.parameter.token);
    const action=(e.parameter.action||'get').toLowerCase();
    if(action==='get') return json_({ok:true,tasks:readTasks_(),updatedAt:new Date().toISOString()});
    if(action==='history') return json_({ok:true,history:readHistory_(Number(e.parameter.limit||150))});
    if(action==='workspace') return json_({ok:true,completions:readCompletions_()});
    if(action==='experiments') return json_({ok:true,experiments:readExperiments_()});
    if(action==='events') return json_({ok:true,events:readEvents_(Number(e.parameter.limit||150))});
    if(action==='clusters') return json_({ok:true,clusters:readDemandClusters_(),updatedAt:new Date().toISOString()});
    throw new Error('Unsupported action');
  }catch(err){return json_({ok:false,error:String(err.message||err)})}
}
function doPost(e){
  try{
    const body=JSON.parse((e&&e.postData&&e.postData.contents)||'{}');
    assertToken_(body.token);
    const action=String(body.action||'').toLowerCase();
    if(action==='replace'){
      const tasks=replaceTasks_(body.tasks||[],body.actor||'Dashboard user',body.source||'WANT Web');
      return json_({ok:true,tasks:tasks,updatedAt:new Date().toISOString()});
    }
    if(action==='complete'){
      return json_(completeTask_(body));
    }
    if(action==='experiment'){
      return json_(saveExperiment_(body));
    }
    if(action==='deleteexperiment'){
      return json_(deleteExperiment_(body));
    }
    if(action==='event'){
      return json_(appendEvent_(body));
    }
    if(action==='createdemand'){
      return json_(createDemand_(body));
    }
    if(action==='supportdemand'){
      return json_(supportDemand_(body));
    }
    throw new Error('Unsupported action');
  }catch(err){return json_({ok:false,error:String(err.message||err)})}
}
function readTasks_(){
  const sh=sheet_(TASKS_SHEET); if(!sh) return [];
  const last=sh.getLastRow(); if(last<2)return[];
  return sh.getRange(2,1,last-1,TASK_HEADERS.length).getValues().map(r=>({
    id:String(r[0]||''),title:String(r[1]||''),phase:String(r[2]||''),owner:String(r[3]||''),
    priority:String(r[4]||''),start:dateIso_(r[5]),due:dateIso_(r[6]),status:String(r[8]||'Backlog'),
    progress:Number(r[9]||0)*((Number(r[9]||0)<=1)?100:1),depends:String(r[10]||''),milestone:String(r[11]||''),
    gate:String(r[12]||''),next:String(r[13]||'')
  })).filter(t=>t.id);
}
function taskRows_(tasks){
  return tasks.map(t=>{
    const s=parseDate_(t.start),d=parseDate_(t.due);
    const duration=(s&&d)?Math.floor((d-s)/86400000)+1:'';
    const p=Math.max(0,Math.min(100,Number(t.progress||0)))/100;
    const overdue=(t.status!=='Done'&&d&&endOfDay_(d)<new Date())?'OVERDUE':'';
    return [t.id,t.title,t.phase,t.owner,t.priority,s||'',d||'',duration,t.status,p,t.depends||'',t.milestone||'',t.gate||'',t.next||'',overdue];
  });
}
function replaceTasks_(incoming,actor,source){
  const old=readTasks_(), normalized=(incoming||[]).map(t=>({
    id:String(t.id||'').trim(),title:String(t.title||'').trim(),phase:String(t.phase||''),owner:String(t.owner||''),
    priority:String(t.priority||'High'),start:String(t.start||''),due:String(t.due||''),status:String(t.status||'Backlog'),
    progress:Number(t.progress||0),depends:String(t.depends||''),milestone:String(t.milestone||''),gate:String(t.gate||''),next:String(t.next||'')
  })).filter(t=>t.id);
  enforceDependencyTransitions_(normalized);
  const sh=sheet_(TASKS_SHEET);
  sh.getRange(2,1,Math.max(1,sh.getMaxRows()-1),TASK_HEADERS.length).clearContent();
  if(normalized.length){
    sh.getRange(2,1,normalized.length,TASK_HEADERS.length).setValues(taskRows_(normalized));
    sh.getRange(2,10,normalized.length,1).setNumberFormat('0%');
    sh.getRange(2,6,normalized.length,2).setNumberFormat('dd/MM/yyyy');
  }
  logDiffs_(old,normalized,actor,source);
  return normalized;
}
function enforceDependencyTransitions_(tasks){
  const map={}; tasks.forEach(t=>map[t.id]=t);
  tasks.forEach(t=>{
    const deps=depIds_(t);
    if(!deps.length||t.status==='Done')return;
    const blocked=deps.some(id=>!map[id]||map[id].status!=='Done');
    if(blocked && ['Ready','In Progress','Review'].indexOf(t.status)>=0) t.status='Blocked';
  });
}
function completeTask_(body){
  const id=String(body.taskId||'').trim(), completion=body.completion||{}, actor=body.actor||'Dashboard user', source=body.source||'WANT Web';
  if(!id) throw new Error('Task ID required');
  const tasks=readTasks_(), t=tasks.find(x=>x.id===id); if(!t) throw new Error('Task not found');
  const open=depIds_(t).filter(dep=>{const d=tasks.find(x=>x.id===dep);return !d||d.status!=='Done'});
  if(open.length) throw new Error('Task is locked by dependencies: '+open.join(', '));
  if(!String(completion.outcome||'').trim()) throw new Error('Completion outcome is required');
  if(!completion.acceptance) throw new Error('Acceptance criteria confirmation is required');
  if(!String(completion.evidence_url||'').trim()&&!String(completion.evidence_note||'').trim()&&!String(completion.evidence_title||'').trim()) throw new Error('Evidence is required');

  const previous=JSON.parse(JSON.stringify(t));
  t.status='Done';t.progress=100;if(completion.next)t.next=String(completion.next);
  upsertCompletion_(id,completion,actor,source);
  appendEvidence_(id,completion,actor);
  if(String(completion.decision||'').trim()) appendDecision_(completion.decision,id,completion,actor);
  if(completion.experiment&&completion.experiment.hypothesis) saveExperiment_({experiment:completion.experiment,actor:actor,source:source});
  if(completion.close_gate) closeScopeGate_(completion.gate||t.gate,completion,actor);
  autoReadyDependents_(tasks,id);
  replaceTasks_(tasks,actor,source);
  return {ok:true,tasks:tasks,completion:completion,automations:automationSummary_(tasks,id),updatedAt:new Date().toISOString()};
}
function depIds_(t){return String(t.depends||'').split(',').map(s=>s.trim()).filter(Boolean)}
function autoReadyDependents_(tasks,completedId){
  const map={};tasks.forEach(t=>map[t.id]=t);
  const today=new Date(); today.setHours(23,59,59,999);
  tasks.forEach(t=>{
    if(t.status!=='Backlog'||!depIds_(t).includes(completedId))return;
    if(depIds_(t).every(id=>map[id]&&map[id].status==='Done')){
      const s=parseDate_(t.start); if(!s||s<=today)t.status='Ready';
    }
  });
}
function automationSummary_(tasks,id){
  return tasks.filter(t=>depIds_(t).includes(id)).map(t=>({id:t.id,status:t.status}));
}
function upsertCompletion_(taskId,c,actor,source){
  const headers=['Task ID','Outcome','Evidence Title','Evidence URL','Evidence Note','Learning','Decision','Next Action','Gate','Acceptance Confirmed','Completed At','Actor','Source'];
  const sh=ensureSheet_(COMPLETIONS_SHEET,headers);
  const values=sh.getLastRow()>1?sh.getRange(2,1,sh.getLastRow()-1,1).getValues().flat():[];
  const idx=values.findIndex(x=>String(x)===taskId);
  const row=[taskId,c.outcome||'',c.evidence_title||'',c.evidence_url||'',c.evidence_note||'',c.learning||'',c.decision||'',c.next||'',c.gate||'',!!c.acceptance,new Date(),actor,source];
  if(idx>=0) sh.getRange(idx+2,1,1,row.length).setValues([row]); else sh.appendRow(row);
}
function readCompletions_(){
  const sh=ensureSheet_(COMPLETIONS_SHEET,['Task ID','Outcome','Evidence Title','Evidence URL','Evidence Note','Learning','Decision','Next Action','Gate','Acceptance Confirmed','Completed At','Actor','Source']);
  if(sh.getLastRow()<2)return{};
  const rows=sh.getRange(2,1,sh.getLastRow()-1,13).getValues(),out={};
  rows.forEach(r=>{if(r[0])out[String(r[0])]={outcome:r[1],evidence_title:r[2],evidence_url:r[3],evidence_note:r[4],learning:r[5],decision:r[6],next:r[7],gate:r[8],acceptance:!!r[9],completedAt:r[10] instanceof Date?r[10].toISOString():String(r[10]||''),actor:r[11],source:r[12]}});
  return out;
}
function appendEvidence_(taskId,c,actor){
  if(!c.evidence_title&&!c.evidence_url&&!c.evidence_note)return;
  const sh=ensureSheet_(EVIDENCE_SHEET,['Evidence ID','Task ID','Type','Title','URL','Notes','Added At','Actor','Verification Status']);
  const id='EV-'+Utilities.getUuid().slice(0,8).toUpperCase();
  const type=c.evidence_url?'Link':'Note';
  sh.appendRow([id,taskId,type,c.evidence_title||'Evidence',c.evidence_url||'',c.evidence_note||'',new Date(),actor,'Accepted']);
}
function appendDecision_(decision,taskId,c,actor){
  const sh=sheet_(DECISIONS_SHEET); if(!sh)return;
  const last=Math.max(1,sh.getLastRow()), ids=last>1?sh.getRange(2,1,last-1,1).getValues().flat():[];
  const max=ids.reduce((m,x)=>Math.max(m,Number(String(x).replace(/\D/g,''))||0),0);
  const id='D-'+String(max+1).padStart(3,'0');
  sh.appendRow([id,new Date(),decision,'Task completion','Generated from '+taskId+'. '+String(c.outcome||''),actor,'','Active']);
}
function closeScopeGate_(gate,c,actor){
  const id=(String(gate||'').match(/BR-\d+/)||[])[0]; if(!id)return;
  const sh=sheet_(SCOPE_SHEET); if(!sh)return;
  const width=Math.max(sh.getLastColumn(),10);
  const h=sh.getRange(1,1,1,width).getValues()[0];
  const ensure=(name)=>{let i=h.indexOf(name);if(i<0){i=h.length;h.push(name);sh.getRange(1,i+1).setValue(name)}return i};
  const evidenceCol=ensure('Evidence'),closedAtCol=ensure('Closed At'),closedByCol=ensure('Closed By');
  const last=sh.getLastRow();if(last<2)return;
  const rows=sh.getRange(2,1,last-1,Math.max(sh.getLastColumn(),10)).getValues();
  const rowIndex=rows.findIndex(r=>String(r[0])===id);if(rowIndex<0)return;
  sh.getRange(rowIndex+2,5).setValue('CLOSED');
  sh.getRange(rowIndex+2,evidenceCol+1).setValue(c.evidence_url||c.evidence_note||c.evidence_title||'Task completion evidence');
  sh.getRange(rowIndex+2,closedAtCol+1).setValue(new Date());
  sh.getRange(rowIndex+2,closedByCol+1).setValue(actor);
}
function readHistory_(limit){
  const sh=ensureSheet_(HISTORY_SHEET,['Timestamp','Task ID','Action','Field','Previous','New','Actor','Source']);
  const last=sh.getLastRow();if(last<2)return[];
  const n=Math.min(Math.max(1,limit||150),last-1);
  return sh.getRange(last-n+1,1,n,8).getDisplayValues().reverse().map(r=>({timestamp:r[0],taskId:r[1],action:r[2],field:r[3],previous:r[4],new:r[5],actor:r[6],source:r[7]}));
}
function logDiffs_(oldTasks,newTasks,actor,source){
  const oldMap={},newMap={};oldTasks.forEach(t=>oldMap[t.id]=t);newTasks.forEach(t=>newMap[t.id]=t);
  const rows=[],fields=[['title','Task'],['phase','Phase'],['owner','Owner'],['priority','Priority'],['start','Start'],['due','Due'],['status','Status'],['progress','Progress %'],['depends','Dependencies'],['milestone','Milestone'],['gate','Gate'],['next','Next Action']];
  Object.keys(newMap).forEach(id=>{
    if(!oldMap[id])rows.push([new Date(),id,'CREATE','Task','',newMap[id].title,actor,source]);
    else fields.forEach(([k,label])=>{if(String(oldMap[id][k]??'')!==String(newMap[id][k]??''))rows.push([new Date(),id,'UPDATE',label,oldMap[id][k]??'',newMap[id][k]??'',actor,source])});
  });
  Object.keys(oldMap).filter(id=>!newMap[id]).forEach(id=>rows.push([new Date(),id,'DELETE','Task',oldMap[id].title,'',actor,source]));
  if(rows.length){const sh=ensureSheet_(HISTORY_SHEET,['Timestamp','Task ID','Action','Field','Previous','New','Actor','Source']);sh.getRange(sh.getLastRow()+1,1,rows.length,8).setValues(rows)}
}



function demandClusterHeaders_(){
  return ['Cluster ID','Category','Subcategory','Title','Neighborhood','Radius','Frequency','Price','Timing','Must Have','Intent Baseline','Supporters','Clients','Description','Origin','Status','Created At','Updated At'];
}
function demandIntentHeaders_(){
  return ['Intent ID','Cluster ID','Role','Session ID','Intent','Frequency','Price','Radius','Timing','Source Context','Created At'];
}
function cleanDemandValue_(v,maxLen){return String(v==null?'':v).trim().slice(0,maxLen||500)}
function seedDemandRows_(){
  const now=new Date();
  return [
    ['academia-24h-bueno','Fitness & Bem-estar','Academia','Academia 24h com estacionamento','Setor Bueno','Até 1 km','3–4x por semana','R$ 200–300','Antes das 8h e depois das 18h','Musculação completa, estacionamento e horário estendido','Eu seria cliente',18,12,'Pessoas do Bueno buscando uma academia completa, próxima e compatível com rotina cedo ou tarde.','seed','active',now,now],
    ['cafe-cedo-marista','Alimentação & Conveniência','Café / padaria','Café e padaria artesanal que abra cedo','Setor Marista','Até 1 km','3–4x por semana','Até R$ 100','6h30–9h','Café de qualidade, padaria artesanal e abertura cedo','Provavelmente usaria',11,7,'Demanda por café de rotina antes do trabalho, com boa execução e horário compatível.','seed','active',now,now],
    ['lavajato-bueno','Mobilidade & Conveniência Automotiva','Lavajato','Lavajato rápido com agendamento','Setor Bueno','Até 2 km','2–3x por mês','R$ 100–200','Durante horário comercial','Agendamento, previsibilidade e lavagem em até 1h','Eu seria cliente',9,6,'Busca por serviço automotivo previsível, próximo e sem fila incerta.','seed','active',now,now]
  ];
}
function ensureDemandSheets_(){
  const clusters=ensureSheet_(DEMAND_CLUSTERS_SHEET,demandClusterHeaders_());
  ensureSheet_(DEMAND_INTENTS_SHEET,demandIntentHeaders_());
  if(clusters.getLastRow()<2){
    const rows=seedDemandRows_();
    clusters.getRange(2,1,rows.length,demandClusterHeaders_().length).setValues(rows);
  }
  return clusters;
}
function clusterRowToObject_(r){
  return {id:String(r[0]||''),category:String(r[1]||''),subcategory:String(r[2]||''),title:String(r[3]||''),neighborhood:String(r[4]||''),radius:String(r[5]||''),frequency:String(r[6]||''),price:String(r[7]||''),timing:String(r[8]||''),musthave:String(r[9]||''),intent:String(r[10]||''),supporters:Number(r[11]||0),clients:Number(r[12]||0),description:String(r[13]||''),origin:String(r[14]||''),status:String(r[15]||'active'),created_at:r[16] instanceof Date?r[16].toISOString():String(r[16]||''),updated_at:r[17] instanceof Date?r[17].toISOString():String(r[17]||'')};
}
function readDemandClusters_(){
  const sh=ensureDemandSheets_(),last=sh.getLastRow();if(last<2)return[];
  return sh.getRange(2,1,last-1,demandClusterHeaders_().length).getValues().map(clusterRowToObject_).filter(c=>c.id&&c.status!=='archived').sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));
}
function findClusterRow_(sh,id){
  const last=sh.getLastRow();if(last<2)return null;
  const found=sh.getRange(2,1,last-1,1).createTextFinder(String(id)).matchEntireCell(true).findNext();
  return found?found.getRow():null;
}
function intentExists_(sh,intentId){
  const last=sh.getLastRow();if(last<2)return false;
  return !!sh.getRange(2,1,last-1,1).createTextFinder(String(intentId)).matchEntireCell(true).findNext();
}
function requireDemandFields_(d,fields){fields.forEach(k=>{if(!cleanDemandValue_(d[k],500))throw new Error('Demand '+k+' is required')})}
function createDemand_(body){
  const d=body.demand||{};
  requireDemandFields_(d,['id','category','subcategory','title','neighborhood','radius','frequency','price','intent','session_id','intent_id']);
  const lock=LockService.getScriptLock();lock.waitLock(8000);
  try{
    const clusters=ensureDemandSheets_(), intents=ensureSheet_(DEMAND_INTENTS_SHEET,demandIntentHeaders_());
    const existingRow=findClusterRow_(clusters,d.id);
    if(existingRow){return {ok:true,duplicate:true,cluster:clusterRowToObject_(clusters.getRange(existingRow,1,1,demandClusterHeaders_().length).getValues()[0])}}
    if(intentExists_(intents,d.intent_id))throw new Error('Intent ID already exists for another cluster');
    const now=new Date(),supporters=1,clients=String(d.intent)==='Eu seria cliente'?1:0;
    const row=[cleanDemandValue_(d.id,160),cleanDemandValue_(d.category,120),cleanDemandValue_(d.subcategory,120),cleanDemandValue_(d.title,240),cleanDemandValue_(d.neighborhood,120),cleanDemandValue_(d.radius,120),cleanDemandValue_(d.frequency,120),cleanDemandValue_(d.price,120),cleanDemandValue_(d.timing,160),cleanDemandValue_(d.musthave,1000),cleanDemandValue_(d.intent,120),supporters,clients,cleanDemandValue_(d.description,1000),'user','active',now,now];
    clusters.appendRow(row);
    intents.appendRow([cleanDemandValue_(d.intent_id,160),cleanDemandValue_(d.id,160),'creator',cleanDemandValue_(d.session_id,160),cleanDemandValue_(d.intent,120),cleanDemandValue_(d.frequency,120),cleanDemandValue_(d.price,120),cleanDemandValue_(d.radius,120),cleanDemandValue_(d.timing,160),'creator',now]);
    return {ok:true,duplicate:false,cluster:clusterRowToObject_(row),createdAt:now.toISOString()};
  }finally{lock.releaseLock()}
}
function supportDemand_(body){
  const s=body.support||{};
  requireDemandFields_(s,['cluster_id','intent_id','session_id','intent','frequency','price']);
  const lock=LockService.getScriptLock();lock.waitLock(8000);
  try{
    const clusters=ensureDemandSheets_(), intents=ensureSheet_(DEMAND_INTENTS_SHEET,demandIntentHeaders_());
    const rowNum=findClusterRow_(clusters,s.cluster_id);if(!rowNum)throw new Error('Cluster not found');
    if(intentExists_(intents,s.intent_id)){
      return {ok:true,duplicate:true,cluster:clusterRowToObject_(clusters.getRange(rowNum,1,1,demandClusterHeaders_().length).getValues()[0])};
    }
    const row=clusters.getRange(rowNum,1,1,demandClusterHeaders_().length).getValues()[0];
    row[11]=Number(row[11]||0)+1;
    if(String(s.intent)==='Eu seria cliente')row[12]=Number(row[12]||0)+1;
    row[17]=new Date();
    clusters.getRange(rowNum,1,1,row.length).setValues([row]);
    intents.appendRow([cleanDemandValue_(s.intent_id,160),cleanDemandValue_(s.cluster_id,160),'supporter',cleanDemandValue_(s.session_id,160),cleanDemandValue_(s.intent,120),cleanDemandValue_(s.frequency,120),cleanDemandValue_(s.price,120),cleanDemandValue_(s.radius||row[5],120),cleanDemandValue_(s.timing||row[8],160),cleanDemandValue_(s.source_context||'cluster_page',120),new Date()]);
    return {ok:true,duplicate:false,cluster:clusterRowToObject_(row),updatedAt:new Date().toISOString()};
  }finally{lock.releaseLock()}
}

function eventHeaders_(){
  return ['Timestamp','Event ID','Event','Session ID','Cluster ID','Category','Neighborhood','Intent','Frequency','Price','Radius','Timing','Source Context','Qualification Completeness','Client Timestamp','Metadata'];
}
function cleanEventValue_(v,maxLen){
  return String(v==null?'':v).trim().slice(0,maxLen||500);
}
function allowedEvent_(name){
  return ['landing_view','create_demand_started','category_selected','location_selected','demand_submitted','cluster_viewed','support_started','demand_supported','demand_qualified','share_clicked','notify_me_selected'].indexOf(name)>=0;
}
function appendEvent_(body){
  const e=body.event||{};
  const eventName=cleanEventValue_(e.event,80), eventId=cleanEventValue_(e.event_id,120), sessionId=cleanEventValue_(e.session_id,160);
  if(!eventId) throw new Error('Event ID required');
  if(!allowedEvent_(eventName)) throw new Error('Unsupported event');
  if(!sessionId) throw new Error('Session ID required');
  const sh=ensureSheet_(EVENTS_SHEET,eventHeaders_());
  const lock=LockService.getScriptLock(); lock.waitLock(5000);
  try{
    const last=sh.getLastRow();
    if(last>1){
      const found=sh.getRange(2,2,last-1,1).createTextFinder(eventId).matchEntireCell(true).findNext();
      if(found) return {ok:true,event_id:eventId,duplicate:true};
    }
    const known=['event_id','event','session_id','cluster_id','category','neighborhood','intent','frequency','price','radius','timing','source_context','qualification_completeness','client_timestamp'];
    const meta={};Object.keys(e).forEach(k=>{if(known.indexOf(k)<0)meta[k]=e[k]});
    const qc=Math.max(0,Math.min(100,Number(e.qualification_completeness||0)));
    sh.appendRow([
      new Date(),eventId,eventName,sessionId,cleanEventValue_(e.cluster_id,160),cleanEventValue_(e.category,120),
      cleanEventValue_(e.neighborhood,120),cleanEventValue_(e.intent,120),cleanEventValue_(e.frequency,120),
      cleanEventValue_(e.price,120),cleanEventValue_(e.radius,120),cleanEventValue_(e.timing,160),
      cleanEventValue_(e.source_context,120),qc||'',cleanEventValue_(e.client_timestamp,80),JSON.stringify(meta).slice(0,4000)
    ]);
    return {ok:true,event_id:eventId,duplicate:false,receivedAt:new Date().toISOString()};
  }finally{lock.releaseLock()}
}
function readEvents_(limit){
  const sh=ensureSheet_(EVENTS_SHEET,eventHeaders_()),last=sh.getLastRow();if(last<2)return[];
  const n=Math.min(Math.max(1,limit||150),Math.min(1000,last-1));
  return sh.getRange(last-n+1,1,n,16).getDisplayValues().reverse().map(r=>({
    timestamp:r[0],event_id:r[1],event:r[2],session_id:r[3],cluster_id:r[4],category:r[5],neighborhood:r[6],
    intent:r[7],frequency:r[8],price:r[9],radius:r[10],timing:r[11],source_context:r[12],
    qualification_completeness:r[13],client_timestamp:r[14],metadata:r[15]
  }));
}

function experimentHeaders_(){
  return ['ID','Hipótese','Teste','Métrica primária','Threshold/Decision rule','Owner','Status','Resultado','Decisão','Linked Task','Gate','Evidence','Updated At'];
}
function ensureExperimentColumns_(){
  const sh=ensureSheet_(EXPERIMENTS_SHEET,experimentHeaders_());
  const h=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),13)).getValues()[0];
  const target=experimentHeaders_();
  target.forEach((name,i)=>{if(String(h[i]||'')!==name)sh.getRange(1,i+1).setValue(name)});
  return sh;
}
function readExperiments_(){
  const sh=ensureExperimentColumns_();const last=sh.getLastRow();if(last<2)return[];
  return sh.getRange(2,1,last-1,13).getDisplayValues().map(r=>({
    id:r[0],hypothesis:r[1],test:r[2],metric:r[3],rule:r[4],owner:r[5],status:r[6]||'Not Started',
    result:r[7],decision:r[8],task:r[9],gate:r[10],evidence:r[11],updatedAt:r[12]
  })).filter(e=>e.id);
}
function saveExperiment_(body){
  const e=body.experiment||{},actor=body.actor||'Dashboard user',source=body.source||'WANT Web';
  ['id','hypothesis','test','metric','rule'].forEach(k=>{if(!String(e[k]||'').trim())throw new Error('Experiment '+k+' is required')});
  const sh=ensureExperimentColumns_(),last=sh.getLastRow();
  const ids=last>1?sh.getRange(2,1,last-1,1).getDisplayValues().flat():[];
  const idx=ids.findIndex(x=>String(x)===String(e.id));
  const row=[e.id,e.hypothesis,e.test,e.metric,e.rule,e.owner||'',e.status||'Not Started',e.result||'',e.decision||'',e.task||'',e.gate||'',e.evidence||'',new Date()];
  if(idx>=0)sh.getRange(idx+2,1,1,13).setValues([row]);else sh.appendRow(row);
  const hist=ensureSheet_(HISTORY_SHEET,['Timestamp','Task ID','Action','Field','Previous','New','Actor','Source']);
  hist.appendRow([new Date(),e.task||e.id,idx>=0?'UPDATE':'CREATE','Experiment','',e.id,actor,source]);
  return {ok:true,experiments:readExperiments_(),updatedAt:new Date().toISOString()};
}
function deleteExperiment_(body){
  const id=String(body.experimentId||'').trim();if(!id)throw new Error('Experiment ID required');
  const sh=ensureExperimentColumns_(),last=sh.getLastRow();if(last<2)return{ok:true,experiments:[]};
  const ids=sh.getRange(2,1,last-1,1).getDisplayValues().flat(),idx=ids.findIndex(x=>String(x)===id);
  if(idx>=0)sh.deleteRow(idx+2);
  const hist=ensureSheet_(HISTORY_SHEET,['Timestamp','Task ID','Action','Field','Previous','New','Actor','Source']);
  hist.appendRow([new Date(),id,'DELETE','Experiment',id,'',body.actor||'Dashboard user',body.source||'WANT Web']);
  return {ok:true,experiments:readExperiments_(),updatedAt:new Date().toISOString()};
}

function parseDate_(v){
  if(!v)return null;if(v instanceof Date)return v;
  const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;
  return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0);
}
function endOfDay_(d){const x=new Date(d);x.setHours(23,59,59,999);return x}
function dateIso_(v){
  if(!v)return'';if(v instanceof Date)return Utilities.formatDate(v,'America/Sao_Paulo','yyyy-MM-dd');
  const d=new Date(v);return isNaN(d)?String(v):Utilities.formatDate(d,'America/Sao_Paulo','yyyy-MM-dd');
}
