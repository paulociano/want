const EVENTS='/api/sheets?action=events&limit=1000';
const PILOT_SRC='pilot_e01_e03';
const COHORT='bueno_marista_oct2026';
const MIN_N=20;
const $=id=>document.getElementById(id);
const pct=(n,d)=>d?Math.round(n/d*100):0;

function parseMeta(e){
  try{return e.metadata?JSON.parse(e.metadata):{}}catch{return{}}
}
function sourceOf(e){return parseMeta(e).acquisition_source||''}
function cohortOf(e){return parseMeta(e).experiment_cohort||''}
function uniq(arr){return [...new Set(arr)]}
function sessionsWith(events,names){return uniq(events.filter(e=>names.includes(e.event)).map(e=>e.session_id).filter(Boolean))}
function decision(n,rate,kind){
  if(n<MIN_N)return {cls:'collecting',label:`Coletando · ${n}/${MIN_N}`};
  if(kind==='e01') return rate>=30?{cls:'keep',label:'Manter fluxo'}:rate>=15?{cls:'iterate',label:'Iterar mensagem/onboarding'}:{cls:'review',label:'Reavaliar proposta/fluxo'};
  if(kind==='e02') return rate>=20?{cls:'keep',label:'Manter compartilhamento'}:rate>=10?{cls:'iterate',label:'Iterar CTA/contexto'}:{cls:'review',label:'Reavaliar mecanismo'};
  return rate>=70?{cls:'keep',label:'Manter fluxo'}:rate>=50?{cls:'iterate',label:'Reduzir fricção/copy'}:{cls:'review',label:'Revisar formulário'};
}
function card(id,title,rate,numerator,denominator,rows,rule,kind){
  const d=decision(denominator,rate);
  $(id).innerHTML=`<div class="head"><div><span class="tag">${id.toUpperCase()}</span><h2>${title}</h2></div></div>
    <div class="metric">${rate}%</div><div class="sub">${numerator} de ${denominator} sessões</div>
    <div class="progress"><i style="width:${Math.min(100,denominator/MIN_N*100)}%"></i></div>
    ${rows.map(([k,v])=>`<div class="row"><span>${k}</span><b>${v}</b></div>`).join('')}
    <div class="rule">${rule}</div><div class="state ${d.cls}">${d.label}</div>`;
}
function renderSessions(events){
  const by={};
  events.forEach(e=>{(by[e.session_id]??=[]).push(e)});
  const rows=Object.entries(by).sort((a,b)=>String(b[1][0]?.timestamp).localeCompare(String(a[1][0]?.timestamp))).slice(0,30);
  if(!rows.length){$('sessions').innerHTML='<div class="empty">Ainda não há sessões reais atribuídas à coorte.</div>';return}
  $('sessions').innerHTML=`<table><thead><tr><th>Sessão</th><th>Entrada</th><th>Criou</th><th>Apoiou</th><th>Qualificou</th><th>Compartilhou</th></tr></thead><tbody>${rows.map(([sid,evs])=>{
    const has=x=>evs.some(e=>e.event===x);
    const when=evs.find(e=>e.event==='landing_view')?.timestamp||evs[0]?.timestamp||'—';
    return `<tr><td>${sid.slice(0,18)}…</td><td>${when}</td><td>${has('demand_submitted')?'✓':'—'}</td><td>${has('demand_supported')?'✓':'—'}</td><td>${has('demand_qualified')?'✓':'—'}</td><td>${has('share_clicked')?'✓':'—'}</td></tr>`}).join('')}</tbody></table>`;
}
async function load(){
  $('refresh').textContent='Atualizando…';
  const r=await fetch(EVENTS,{cache:'no-store'}); const d=await r.json();
  const all=(d.events||[]);
  const ev=all.filter(e=>sourceOf(e)===PILOT_SRC && (!cohortOf(e)||cohortOf(e)===COHORT));
  const land=sessionsWith(ev,['landing_view']);
  const submitted=sessionsWith(ev,['demand_submitted']);
  const eligibleShare=sessionsWith(ev,['demand_submitted','demand_supported']);
  const shared=sessionsWith(ev,['share_clicked']).filter(s=>eligibleShare.includes(s));
  const starters=sessionsWith(ev,['create_demand_started','support_started']);
  const qualified=sessionsWith(ev,['demand_qualified']).filter(s=>starters.includes(s));
  const e01=pct(submitted.length,land.length), e02=pct(shared.length,eligibleShare.length), e03=pct(qualified.length,starters.length);
  card('e01','Declaração de demanda',e01,submitted.length,land.length,[['Landing sessions',land.length],['Demandas criadas',submitted.length],['Amostra mínima',MIN_N]],'≥30% manter · 15–29% iterar · <15% reavaliar','e01');
  card('e02','Compartilhamento',e02,shared.length,eligibleShare.length,[['Sessões elegíveis',eligibleShare.length],['Compartilharam',shared.length],['Amostra mínima',MIN_N]],'≥20% manter · 10–19% iterar · <10% reavaliar','e02');
  card('e03','Qualificação',e03,qualified.length,starters.length,[['Starters',starters.length],['Qualificados',qualified.length],['Amostra mínima',MIN_N]],'≥70% manter · 50–69% iterar · <50% revisar','e03');
  renderSessions(ev);
  $('refresh').textContent='Atualizar';
}
const origin=location.origin;
$('pilotLink').value=`${origin}/landing/?src=${PILOT_SRC}&cohort=${COHORT}`;
$('internalLink').value=`${origin}/landing/?src=internal&cohort=${COHORT}`;
document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{const input=$(b.dataset.copy);await navigator.clipboard.writeText(input.value);const old=b.textContent;b.textContent='Copiado ✓';setTimeout(()=>b.textContent=old,1200)});
$('refresh').onclick=load;
load().catch(()=>{$('sessions').innerHTML='<div class="empty">Não foi possível carregar os eventos.</div>';$('refresh').textContent='Atualizar'});
