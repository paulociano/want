const ENDPOINT='/api/sheets?action=clusters';
let clusters=[], filtered=[], currentId=null;

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function confidence(c){
  const supporters=Number(c.supporters||0), clients=Number(c.clients||0);
  if(!Number.isFinite(supporters) || supporters<=0) return {key:'unknown',label:'Sem leitura',why:'Ainda não há volume suficiente para interpretar este sinal.'};
  const ratio=supporters?clients/supporters:0;
  if(supporters>=15 && ratio>=.55) return {key:'strong',label:'Forte',why:'Volume e intenção explícita já formam um sinal operacional consistente para conversa comercial.'};
  if(supporters>=8 && ratio>=.45) return {key:'medium',label:'Moderada',why:'Existe recorrência de interesse, mas o cluster ainda deve ganhar volume antes de sustentar decisões maiores.'};
  return {key:'initial',label:'Inicial',why:'Sinal real, porém ainda em formação. Útil para exploração e entrevistas, não para inferência ampla.'};
}
function ratio(c){const s=Number(c.supporters||0),cl=Number(c.clients||0);return s?Math.round((cl/s)*100):0}
function freqWeight(v=''){
  if(/5x|mais por semana/i.test(v)) return 95;
  if(/3.?4x por semana/i.test(v)) return 80;
  if(/1.?2x por semana/i.test(v)) return 65;
  if(/2.?3x por mês/i.test(v)) return 42;
  return 25;
}
function radiusWeight(v=''){
  if(/500 m/i.test(v)) return 90;
  if(/1 km/i.test(v)) return 75;
  if(/2 km/i.test(v)) return 58;
  if(/3 km/i.test(v)) return 45;
  return 35;
}
function sortSignals(a,b){
  const order={strong:3,medium:2,initial:1,unknown:0};
  const d=order[confidence(b).key]-order[confidence(a).key];
  return d || Number(b.supporters||0)-Number(a.supporters||0);
}
async function load(){
  $('updatedLabel').textContent='Atualizando…';
  try{
    const res=await fetch(ENDPOINT,{cache:'no-store'});
    const data=await res.json();
    if(!res.ok||!data.ok) throw new Error(data.error||'Falha ao carregar clusters');
    clusters=(data.clusters||[]).filter(c=>c.status!=='inactive').sort(sortSignals);
    buildFilters();
    applyFilters();
    $('updatedLabel').textContent='Atualizado agora · fonte compartilhada';
  }catch(err){
    $('updatedLabel').textContent='Falha ao atualizar';
    $('opportunityList').innerHTML=`<div class="empty">Não foi possível carregar os dados: ${esc(err.message)}</div>`;
  }
}
function buildFilters(){
  const cats=[...new Set(clusters.map(c=>c.category).filter(Boolean))].sort();
  const areas=[...new Set(clusters.map(c=>c.neighborhood).filter(Boolean))].sort();
  const c=$('categoryFilter'), n=$('neighborhoodFilter');
  const cv=c.value,nv=n.value;
  c.innerHTML='<option value="">Todas as categorias</option>'+cats.map(x=>`<option>${esc(x)}</option>`).join('');
  n.innerHTML='<option value="">Todos os bairros</option>'+areas.map(x=>`<option>${esc(x)}</option>`).join('');
  c.value=cv;n.value=nv;
}
function applyFilters(){
  const cat=$('categoryFilter').value, area=$('neighborhoodFilter').value;
  filtered=clusters.filter(c=>(!cat||c.category===cat)&&(!area||c.neighborhood===area));
  renderKpis();renderList();
  if(!currentId || !filtered.some(c=>c.id===currentId)) currentId=filtered[0]?.id||null;
  renderDetail();
}
function renderKpis(){
  $('kpiSignals').textContent=filtered.length;
  $('kpiPeople').textContent=filtered.reduce((s,c)=>s+Number(c.supporters||0),0);
  $('kpiClients').textContent=filtered.reduce((s,c)=>s+Number(c.clients||0),0);
  $('kpiAreas').textContent=new Set(filtered.map(c=>c.neighborhood).filter(Boolean)).size;
  $('resultCount').className='conf initial';
  $('resultCount').textContent=`${filtered.length} sinais`;
}
function renderList(){
  const box=$('opportunityList');
  if(!filtered.length){box.innerHTML='<div class="empty">Nenhuma oportunidade para estes filtros.</div>';return}
  box.innerHTML=filtered.map(c=>{
    const conf=confidence(c);
    return `<button class="opp ${c.id===currentId?'active':''}" data-id="${esc(c.id)}">
      <div class="opp-title"><b>${esc(c.title)}</b><span>${esc(c.category)} · ${esc(c.neighborhood)}</span></div>
      <div class="cell"><small>Ticket</small><b>${esc(c.price||'—')}</b></div>
      <div class="cell"><small>Frequência</small><b>${esc(c.frequency||'—')}</b></div>
      <div class="cell"><small>Raio</small><b>${esc(c.radius||'—')}</b></div>
      <span class="conf ${conf.key}">${conf.label}</span>
    </button>`;
  }).join('');
  box.querySelectorAll('.opp').forEach(el=>el.onclick=()=>{currentId=el.dataset.id;renderList();renderDetail()});
}
function renderDetail(){
  const c=filtered.find(x=>x.id===currentId);
  if(!c){$('detail').innerHTML='<div class="empty">Selecione uma oportunidade.</div>';return}
  const conf=confidence(c), clientRatio=ratio(c), freq=freqWeight(c.frequency), rad=radiusWeight(c.radius);
  const readout=[
    ['Ticket declarado',c.price||'Não informado'],
    ['Frequência dominante',c.frequency||'Não informada'],
    ['Raio de conveniência',c.radius||'Não informado'],
    ['Momento de uso',c.timing||'Não informado']
  ];
  $('detail').innerHTML=`
    <div class="detail-top"><div><span class="pill">${esc(c.category)} · ${esc(c.neighborhood)}</span><h2>${esc(c.title)}</h2><p class="desc">${esc(c.description||'Sinal local agregado no WANT.')}</p></div><span class="conf ${conf.key}">${conf.label}</span></div>
    <div class="signal-grid">
      <div class="signal-cell"><small>Pessoas</small><b>${Number(c.supporters||0)}</b></div>
      <div class="signal-cell"><small>Seriam clientes</small><b>${Number(c.clients||0)}</b></div>
      <div class="signal-cell"><small>Conversão de intenção</small><b>${clientRatio}%</b></div>
    </div>
    <div class="conf-card">
      <div class="conf-row"><div><small>Confiança do sinal</small><h3>${conf.label}</h3></div><span>${esc(c.origin==='user'?'Sinal orgânico':'Cluster de demonstração')}</span></div>
      <p>${esc(conf.why)}</p>
      <div class="mini-bars">
        <div class="bar-row"><span>Intenção</span><div class="bar"><i style="width:${clientRatio}%"></i></div><b>${clientRatio}%</b></div>
        <div class="bar-row"><span>Recorrência</span><div class="bar"><i style="width:${freq}%"></i></div><b>${freq}</b></div>
        <div class="bar-row"><span>Proximidade</span><div class="bar"><i style="width:${rad}%"></i></div><b>${rad}</b></div>
      </div>
    </div>
    <div class="section-title">Leitura comercial</div>
    <div class="readout">${readout.map(([k,v])=>`<div class="read-item"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>
    <div class="section-title">Atributos indispensáveis</div>
    <div class="musthave">${esc(c.musthave||'Ainda não há atributos consolidados para este cluster.')}</div>
    <div class="actions"><button class="btn" id="copySummary">Copiar resumo comercial</button><button class="btn primary" id="openConsumer">Abrir cluster consumidor</button></div>`;
  $('copySummary').onclick=()=>copySummary(c,conf);
  $('openConsumer').onclick=()=>window.open(`/landing/?cluster=${encodeURIComponent(c.id)}`,'_blank','noopener');
}
async function copySummary(c,conf){
  const text=`WANT · Sinal local\n${c.title}\n${c.neighborhood} · ${c.category}\nPessoas: ${c.supporters||0}\nSeriam clientes: ${c.clients||0}\nTicket: ${c.price||'—'}\nFrequência: ${c.frequency||'—'}\nRaio: ${c.radius||'—'}\nConfiança operacional: ${conf.label}\nAtributos: ${c.musthave||'—'}`;
  try{await navigator.clipboard.writeText(text);$('copySummary').textContent='Resumo copiado ✓';setTimeout(()=>$('copySummary').textContent='Copiar resumo comercial',1800)}
  catch{window.prompt('Copie o resumo:',text)}
}
$('categoryFilter').onchange=applyFilters;
$('neighborhoodFilter').onchange=applyFilters;
$('refreshBtn').onclick=load;
load();
