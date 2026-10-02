const WANT_BUILD='6.8.0-public';
const LS_CACHE='want_mvp_clusters_cache_v2',LS_EVENTS='want_mvp_events_v1',LS_SESSION='want_mvp_session_v1';
const API_ENDPOINT='/api/sheets';
const TRACK_ENDPOINT='/api/sheets?action=event';
const seedFallback=[
{id:'academia-24h-bueno',category:'Fitness & Bem-estar',subcategory:'Academia',title:'Academia 24h com estacionamento',neighborhood:'Setor Bueno',radius:'Até 1 km',frequency:'3–4x por semana',price:'R$ 200–300',timing:'Antes das 8h e depois das 18h',musthave:'Musculação completa, estacionamento e horário estendido',intent:'Eu seria cliente',supporters:18,clients:12,description:'Pessoas do Bueno buscando uma academia completa, próxima e compatível com rotina cedo ou tarde.'},
{id:'cafe-cedo-marista',category:'Alimentação & Conveniência',subcategory:'Café / padaria',title:'Café e padaria artesanal que abra cedo',neighborhood:'Setor Marista',radius:'Até 1 km',frequency:'3–4x por semana',price:'Até R$ 100',timing:'6h30–9h',musthave:'Café de qualidade, padaria artesanal e abertura cedo',intent:'Provavelmente usaria',supporters:11,clients:7,description:'Demanda por café de rotina antes do trabalho, com boa execução e horário compatível.'},
{id:'lavajato-bueno',category:'Mobilidade & Conveniência Automotiva',subcategory:'Lavajato',title:'Lavajato rápido com agendamento',neighborhood:'Setor Bueno',radius:'Até 2 km',frequency:'2–3x por mês',price:'R$ 100–200',timing:'Durante horário comercial',musthave:'Agendamento, previsibilidade e lavagem em até 1h',intent:'Eu seria cliente',supporters:9,clients:6,description:'Busca por serviço automotivo previsível, próximo e sem fila incerta.'}
];
let clusters=[];let step=1,intent='Eu seria cliente',createdId=null,currentClusterId=null,pendingCreate=null,pendingSupport=null;

const qs=new URLSearchParams(location.search);
const acquisitionSource=(qs.get('src')||qs.get('utm_source')||'organic').slice(0,80);
const experimentCohort=(qs.get('cohort')||'').slice(0,80);
function attribution(){return {acquisition_source:acquisitionSource,...(experimentCohort?{experiment_cohort:experimentCohort}:{})}}

function sessionId(){let id=localStorage.getItem(LS_SESSION);if(!id){id='S-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));localStorage.setItem(LS_SESSION,id)}return id}
function eventId(){return 'EVT-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))}
function intentId(){return 'INT-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2))}
function qualificationCompleteness(data){const required=['neighborhood','radius','frequency','price','intent'];const filled=required.filter(k=>String(data[k]||'').trim()).length;return Math.round((filled/required.length)*100)}
function cacheClusters(){localStorage.setItem(LS_CACHE,JSON.stringify(clusters.slice(0,100)))}
function cachedClusters(){try{return JSON.parse(localStorage.getItem(LS_CACHE)||'[]')}catch{return[]}}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
async function apiGet(action){const r=await fetch(`${API_ENDPOINT}?action=${encodeURIComponent(action)}`,{headers:{'Accept':'application/json'},cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||`api_${action}_failed`);return d}
async function apiPost(action,payload){const r=await fetch(`${API_ENDPOINT}?action=${encodeURIComponent(action)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||`api_${action}_failed`);return d}
function upsertCluster(c){const i=clusters.findIndex(x=>x.id===c.id);if(i>=0)clusters[i]=c;else clusters.unshift(c);cacheClusters();renderClusters();return c}
async function loadClusters(){
  try{const d=await apiGet('clusters');clusters=Array.isArray(d.clusters)?d.clusters:[];cacheClusters()}
  catch(err){const cached=cachedClusters();clusters=cached.length?cached:seedFallback;toast('Sem conexão com a base compartilhada. Exibindo cache local.')}
  renderClusters();
}
function track(name,props={}){
  const payload={event_id:eventId(),event:name,session_id:sessionId(),client_timestamp:new Date().toISOString(),...attribution(),...props};
  const local=JSON.parse(localStorage.getItem(LS_EVENTS)||'[]');local.push({...payload,delivery:'pending'});localStorage.setItem(LS_EVENTS,JSON.stringify(local.slice(-500)));
  fetch(TRACK_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'event',event:payload}),keepalive:true})
    .then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||'tracking_failed');markEventDelivered(payload.event_id,true)})
    .catch(()=>markEventDelivered(payload.event_id,false));
  return payload;
}
function markEventDelivered(id,ok){const events=JSON.parse(localStorage.getItem(LS_EVENTS)||'[]');const i=events.findIndex(x=>x.event_id===id);if(i>=0){events[i].delivery=ok?'sent':'failed';localStorage.setItem(LS_EVENTS,JSON.stringify(events))}}
function flushPendingEvents(){const events=JSON.parse(localStorage.getItem(LS_EVENTS)||'[]');events.filter(x=>x.delivery!=='sent').slice(-50).forEach(payload=>{const clean={...payload};delete clean.delivery;fetch(TRACK_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'event',event:clean}),keepalive:true}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error('tracking_failed');markEventDelivered(clean.event_id,true)}).catch(()=>{})})}
function trackQualified(base={}){const completeness=qualificationCompleteness(base);if(completeness===100)track('demand_qualified',{...base,qualification_completeness:completeness})}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.remove('hidden');setTimeout(()=>el.classList.add('hidden'),2600)}

function signalStage(c){
  const n=Number(c.supporters||0);
  if(n>=15)return {label:'Demanda qualificada',pct:92};
  if(n>=8)return {label:'Ganhando força',pct:66};
  return {label:'Sinal inicial',pct:38};
}

function renderClusters(){const grid=document.getElementById('clusterGrid');if(!clusters.length){grid.innerHTML='<article class="cluster-card"><h3>Nenhuma demanda ainda</h3><p>Crie a primeira demanda compartilhada do piloto.</p></article>';return}grid.innerHTML=clusters.slice(0,6).map(c=>{const stage=signalStage(c);return `<article class="cluster-card"><div class="cluster-top"><span class="pill">${esc(c.category)}</span><span class="pill">${esc(c.neighborhood)}</span></div><div class="signal-stage"><i></i>${stage.label}</div><div class="demand-strip" aria-hidden="true"><i style="width:${stage.pct}%"></i></div><h3>${esc(c.title)}</h3><p>${esc(c.description||c.musthave)}</p><div class="cluster-metrics"><span class="metric"><b>${Number(c.supporters||0)}</b> pessoas</span><span class="metric"><b>${Number(c.clients||0)}</b> seriam clientes</span><span class="metric">${esc(c.radius)}</span></div><button class="btn" onclick="openCluster('${esc(c.id)}')">Ver sinal local</button></article>`}).join('')}
function openCreate(){track('create_demand_started');document.getElementById('createOverlay').classList.remove('hidden');step=1;showStep();setTimeout(()=>document.getElementById('closeCreate').focus(),0)}
function closeCreate(){pendingCreate=null;document.getElementById('createOverlay').classList.add('hidden');const trigger=document.getElementById('heroCreate');if(trigger)trigger.focus()}
function showStep(){document.querySelectorAll('.form-step').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)===step));document.getElementById('progressBar').style.width=(step*25)+'%';document.getElementById('prevStep').style.visibility=step===1?'hidden':'visible';document.getElementById('nextStep').textContent=step===4?'Criar minha demanda':'Continuar'}
function validateStep(){if(step===1){if(!category.value||!subcategory.value.trim()||!want.value.trim())return toast('Preencha categoria, subcategoria e necessidade.'),false;track('category_selected',{category:category.value})}if(step===2){if(!neighborhood.value)return toast('Selecione o bairro.'),false;track('location_selected',{neighborhood:neighborhood.value})}return true}
function slug(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,55)}
async function createDemand(){
  const nextBtn=document.getElementById('nextStep');nextBtn.disabled=true;nextBtn.textContent='Criando...';
  const c=pendingCreate||(pendingCreate={id:slug(want.value)+'-'+Date.now().toString().slice(-6),category:category.value,subcategory:subcategory.value.trim(),title:want.value.trim(),neighborhood:neighborhood.value,radius:radius.value,frequency:frequency.value,price:price.value,timing:timing.value.trim(),musthave:musthave.value.trim(),intent,supporters:1,clients:intent==='Eu seria cliente'?1:0,description:musthave.value.trim()||'Nova demanda criada no piloto do WANT.',session_id:sessionId(),intent_id:intentId()});
  try{
    const d=await apiPost('createDemand',{demand:c});const saved=d.cluster||c;pendingCreate=null;createdId=saved.id;upsertCluster(saved);
    track('demand_submitted',{cluster_id:saved.id,category:saved.category,neighborhood:saved.neighborhood,intent:saved.intent,frequency:saved.frequency,price:saved.price,radius:saved.radius,timing:saved.timing,source_context:'creator'});
    trackQualified({cluster_id:saved.id,category:saved.category,neighborhood:saved.neighborhood,intent:saved.intent,frequency:saved.frequency,price:saved.price,radius:saved.radius,timing:saved.timing,source_context:'creator'});
    document.querySelectorAll('.form-step').forEach(x=>x.classList.remove('active'));document.getElementById('wizardActions').classList.add('hidden');document.getElementById('progressBar').style.width='100%';document.getElementById('successPane').classList.remove('hidden');document.getElementById('createdSummary').innerHTML=`<b>${esc(saved.title)}</b><div class="summary-row"><span>Local</span><span>${esc(saved.neighborhood)}</span></div><div class="summary-row"><span>Raio</span><span>${esc(saved.radius)}</span></div><div class="summary-row"><span>Frequência</span><span>${esc(saved.frequency)}</span></div><div class="summary-row"><span>Preço</span><span>${esc(saved.price)}</span></div>`;
  }catch(err){toast('Não foi possível salvar a demanda compartilhada. Tente novamente.');console.error(err)}
  finally{nextBtn.disabled=false;nextBtn.textContent='Criar minha demanda'}
}
function openCluster(id){const c=clusters.find(x=>x.id===id);if(!c){toast('Essa demanda não foi encontrada na base compartilhada.');return}currentClusterId=id;track('cluster_viewed',{cluster_id:id});homeView.classList.add('hidden');clusterView.classList.remove('hidden');cpCategory.textContent=c.category+' · '+c.neighborhood;cpTitle.textContent=c.title;cpDesc.textContent=c.description||c.musthave;cpCount.textContent=Number(c.supporters||0);cpFacts.innerHTML=`<div class="fact"><small>Seriam clientes</small><b>${Number(c.clients||0)}</b></div><div class="fact"><small>Raio</small><b>${esc(c.radius)}</b></div><div class="fact"><small>Faixa</small><b>${esc(c.price)}</b></div>`;history.replaceState(null,'','?cluster='+encodeURIComponent(id));window.scrollTo(0,0)}
function goHome(){clusterView.classList.add('hidden');homeView.classList.remove('hidden');history.replaceState(null,'',location.pathname);document.getElementById('clusterSection').scrollIntoView({behavior:'smooth'})}
function share(id,sourceContext='cluster_page'){const url=location.origin+location.pathname+'?cluster='+encodeURIComponent(id)+'&src=shared_cluster';const c=clusters.find(x=>x.id===id);track('share_clicked',{cluster_id:id,category:c&&c.category,neighborhood:c&&c.neighborhood,source_context:sourceContext});if(navigator.share){navigator.share({title:'WANT · Demanda local',url}).catch(()=>{})}else if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>toast('Link copiado.'))}else{prompt('Copie este link:',url)}}
async function support(){
  const c=clusters.find(x=>x.id===currentClusterId);if(!c)return;
  track('support_started',{cluster_id:c.id});const btn=document.getElementById('supportBtn');btn.disabled=true;btn.textContent='Salvando...';
  const payload=(pendingSupport&&pendingSupport.cluster_id===c.id)?pendingSupport:(pendingSupport={cluster_id:c.id,intent_id:intentId(),session_id:sessionId(),intent:supportIntent.value,frequency:supportFreq.value,price:supportPrice.value,radius:c.radius,timing:c.timing,source_context:'cluster_page'});
  try{
    const d=await apiPost('supportDemand',{support:payload});pendingSupport=null;const saved=upsertCluster(d.cluster||c);
    track('demand_supported',{cluster_id:saved.id,category:saved.category,neighborhood:saved.neighborhood,intent:payload.intent,frequency:payload.frequency,price:payload.price,radius:saved.radius,timing:saved.timing,source_context:'cluster_page'});
    trackQualified({cluster_id:saved.id,category:saved.category,neighborhood:saved.neighborhood,intent:payload.intent,frequency:payload.frequency,price:payload.price,radius:saved.radius,timing:saved.timing,source_context:'supporter'});
    openCluster(saved.id);toast(d.duplicate?'Esse apoio já tinha sido registrado.':'Sua intenção foi adicionada à base compartilhada.');btn.disabled=true;btn.textContent='Demanda apoiada ✓';
  }catch(err){btn.disabled=false;btn.textContent='Apoiar esta demanda';toast('Não foi possível registrar seu apoio. Tente novamente.');console.error(err)}
}

document.getElementById('heroCreate').onclick=openCreate;document.getElementById('navCreate').onclick=openCreate;document.getElementById('heroBrowse').onclick=()=>document.getElementById('clusterSection').scrollIntoView({behavior:'smooth'});document.getElementById('browseBtn').onclick=()=>document.getElementById('clusterSection').scrollIntoView({behavior:'smooth'});document.getElementById('closeCreate').onclick=closeCreate;document.getElementById('prevStep').onclick=()=>{if(step>1){step--;showStep()}};document.getElementById('nextStep').onclick=()=>{if(!validateStep())return;if(step<4){step++;showStep()}else createDemand()};document.querySelectorAll('.choice').forEach(b=>b.onclick=e=>{e.preventDefault();intent=b.dataset.intent;document.querySelectorAll('.choice').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(intent==='Quero ser avisado quando existir')track('notify_me_selected')});document.getElementById('backHome').onclick=goHome;document.getElementById('supportBtn').onclick=support;document.getElementById('shareBtn').onclick=()=>share(currentClusterId,'cluster_page');document.getElementById('openCreated').onclick=()=>{closeCreate();document.getElementById('successPane').classList.add('hidden');document.getElementById('wizardActions').classList.remove('hidden');openCluster(createdId)};document.getElementById('shareCreated').onclick=()=>share(createdId,'creator_confirmation');


const clusterCreateCta=document.getElementById('clusterCreateCta');
if(clusterCreateCta)clusterCreateCta.onclick=openCreate;
const howBrowseCta=document.getElementById('howBrowseCta');
if(howBrowseCta)howBrowseCta.onclick=()=>document.getElementById('clusterSection').scrollIntoView({behavior:'smooth'});
const communityCreate=document.getElementById('communityCreate');
if(communityCreate)communityCreate.onclick=openCreate;
const communityBrowse=document.getElementById('communityBrowse');
if(communityBrowse)communityBrowse.onclick=()=>document.getElementById('clusterSection').scrollIntoView({behavior:'smooth'});

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.getElementById('createOverlay').classList.contains('hidden'))closeCreate()});
window.addEventListener('online',()=>{flushPendingEvents();loadClusters()});
(async function init(){flushPendingEvents();track('landing_view',{source_context:new URLSearchParams(location.search).has('cluster')?'shared_cluster_link':'direct'});await loadClusters();const q=new URLSearchParams(location.search).get('cluster');if(q)openCluster(q)})();
