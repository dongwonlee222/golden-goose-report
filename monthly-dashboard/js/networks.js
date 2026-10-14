import { formatKrw, formatUsd, formatCount } from './format.js?v=20260929-2';

export function renderNetworks(container, {payload, selection}) {
  if (!payload || !selection) return;
  const available=(payload.networkDaily || []).filter(r=>r.country===selection.country && r.date.startsWith(selection.month));
  const section=document.createElement('section');
  section.className='network-detail';
  const title=document.createElement('h3'); title.textContent='매체별 광고 실적'; section.append(title);
  container.append(section);
  if(!available.length){const p=document.createElement('p');p.textContent='이 월·국가의 직접 운영 매체별 보고서가 아직 없습니다.';section.append(p);return;}
  const dates=[...new Set(available.map(r=>r.date))].sort().reverse();
  const label=document.createElement('label');label.textContent='비교 날짜 ';
  const select=document.createElement('select');select.setAttribute('aria-label','매체 실적 비교 날짜');
  dates.forEach(date=>select.add(new Option(date,date)));label.append(select);section.append(label);
  const note=document.createElement('p');note.className='section-note';
  note.textContent='신규 지면 6개 · 모든 이용 국가 · AdMob 예상 수익. 매체별 광고 형식·OS 구성이 달라 단가 순위를 품질 순위로 해석할 수 없습니다.';section.append(note);
  const body=document.createElement('div');body.setAttribute('aria-live','polite');section.append(body);
  const names=[...new Set(available.map(r=>r.network))];
  function text(tag,value,className=''){const node=document.createElement(tag);node.textContent=value;node.className=className;return node;}
  function metric(row,label,value,width,detail){const cell=document.createElement('div');cell.className='network-metric';cell.append(text('span',label,'network-metric-label'),text('strong',value));const track=document.createElement('div');track.className='network-track';const bar=document.createElement('div');bar.className='network-bar';bar.style.width=Math.max(0,Math.min(100,width))+'%';track.append(bar);cell.append(track,text('small',detail));row.append(cell);}
  function draw(){
    body.replaceChildren();
    const current=available.filter(r=>r.date===select.value);
    const maxRevenue=Math.max(1,...current.map(r=>r.revenueKrw??0));
    const maxEcpm=Math.max(.01,...current.map(r=>r.ecpmUsd??0));
    names.forEach(name=>{
      const r=current.find(r=>r.network===name);const row=document.createElement('div');row.className='network-row';
      const nameBox=document.createElement('div');nameBox.className='network-name';
      nameBox.append(text('strong',name.replace('(입찰)','')),text('small',!r?'보고서 행 없음':r.status==='served'?'노출·수익 확인':r.status==='requests-only'?'요청 확인 · 노출 0':'요청 0'));row.append(nameBox);
      if(!r){row.append(text('span','데이터 없음'));body.append(row);return;}
      metric(row,'예상 수익',formatKrw(r.revenueKrw),(r.revenueKrw??0)/maxRevenue*100,'노출 '+formatCount(r.impressions,'회'));
      metric(row,'eCPM',r.ecpmUsd===null?'산출 불가':formatUsd(r.ecpmUsd)+' / '+formatKrw(r.ecpmKrw),(r.ecpmUsd??0)/maxEcpm*100,'노출 1,000회 기준');
      metric(row,'요청 대비 매칭률',r.matchRate===null?'—':r.matchRate.toFixed(1)+'%',r.matchRate??0,formatCount(r.matches,'회')+' / '+formatCount(r.requests,'회'));
      body.append(row);
    });
  }
  select.addEventListener('change',draw);draw();
  const caution=document.createElement('p');caution.className='section-note';caution.textContent='매칭률은 각 매체의 매칭 수 ÷ 요청 수입니다. 입찰 매체 간 요청이 중복되므로 전체 필레이트로 합산하지 않습니다. 보고서 행 없음은 미연동을 뜻하지 않습니다.';section.append(caution);
  const link=document.createElement('a');link.href='https://admob.google.com/v2/reports';link.target='_blank';link.rel='noopener';link.textContent='AdMob에서 매체·OS·광고 형식별 상세 보고서 확인';section.append(link);
}
