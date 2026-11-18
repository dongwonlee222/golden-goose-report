import { formatKrw } from './format.js?v=20260929-2';

const REVENUE = [['app_ad_revenue_krw','앱 광고'],['tnk_revenue_krw','TNK 매출'],['cpx_revenue_krw','CPX'],['adjoe_revenue_krw','애드조'],['giftcard_margin_krw','기프티콘 차액']];
const COSTS = [['net_reward_points_krw','포인트 순비용'],['google_ads_cost_krw','회원 유입 광고비'],['paid_offerwall_cost_krw','TNK 광고비'],['other_ad_cost_krw','기타 광고비'],['infra_cost_krw','서버·호스팅비'],['gold_prize_cost_krw','실제 금 경품비']];
const present = value => value !== null && value !== undefined && Number.isFinite(Number(value));

export function buildProfitExplanation(month) {
  if (!month?.days?.length) return null;
  const days=month.days;
  const totals = Object.fromEntries([...REVENUE,...COSTS].map(([key])=>[key,days.reduce((sum,row)=>sum+(present(row.metrics?.[key])?Number(row.metrics[key]):0),0)]));
  const revenue=REVENUE.reduce((sum,[key])=>sum+totals[key],0);
  const cost=COSTS.reduce((sum,[key])=>sum+totals[key],0);
  const profit=revenue-cost;
  const unknown=[...REVENUE,...COSTS].filter(([key])=>days.some(row=>!present(row.metrics?.[key]))).map(([,label])=>label);
  return { revenue,cost,profit,totals,unknown,beforeAcquisition:revenue-totals.net_reward_points_krw,afterAcquisition:revenue-totals.net_reward_points_krw-totals.google_ads_cost_krw,
    reconciled:Math.abs(profit-Number(month.summary?.knownOperatingProfitKrw))<1,
    start:days[0].date,end:days.at(-1).date };
}

function node(tag, className, text) {
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(text!==undefined)el.textContent=text;
  return el;
}

export function renderFinanceOverview(payload, selection) {
  const container=document.querySelector('#finance-overview');
  container.replaceChildren();
  const country=payload.countries?.[selection.country];
  const month=country?.months?.[selection.month];
  const report=buildProfitExplanation(month);
  container.append(node('h2',null,'이번 달 손익과 다음 정산'));
  if(report?.reconciled) {
    const block=node('section','finance-explanation');
    block.append(node('h3',null,report.profit<0?'왜 적자인가요?':'확인된 수익과 비용'));
    block.append(node('p','finance-period',`${selection.country==='KR'?'한국':'일본'} · ${report.start} ~ ${report.end} · 확인된 항목 기준`));
    const facts=node('div','finance-bridge');
    for(const [label,value] of [['확인된 매출',report.revenue],['포인트 순비용',report.totals.net_reward_points_krw],['회원 유입 광고비',report.totals.google_ads_cost_krw],['잠정 손익',report.profit]]) {
      const fact=node('div');fact.append(node('span',null,label),node('strong',null,formatKrw(value)));facts.append(fact);
    }
    block.append(facts);
    block.append(node('p',null,report.beforeAcquisition<0
      ? `매출만으로 포인트 순비용을 충당하지 못해 ${formatKrw(-report.beforeAcquisition)} 부족합니다. 추가로 회원 유입 광고비 ${formatKrw(report.totals.google_ads_cost_krw)} 및 확인된 기타 비용이 반영됩니다.`
      : `매출에서 포인트 순비용을 빼면 ${formatKrw(report.beforeAcquisition)} 남습니다. 여기에서 회원 유입 광고비 ${formatKrw(report.totals.google_ads_cost_krw)}와 확인된 기타 비용을 차감합니다.`));
    if(report.unknown.length)block.append(node('p','review-note',`미확인·부분 집계: ${report.unknown.join(', ')}. 미확인 항목을 실제 0원으로 확정하지 않았습니다. 포인트 순비용은 현금 출금액과 다르며, 정산 입금은 매출에 다시 더하지 않습니다.`));
    container.append(block);
  } else container.append(node('p','review-note','선택 월의 손익 원천 대조가 필요합니다. 확인되지 않은 적자 원인을 단정하지 않습니다.'));
  const meta=country?.forecastMeta||{};
  const forecast=node('section','finance-forecast-basis');forecast.append(node('h3',null,'6개월 예측은 이렇게 계산합니다'));
  const projected=meta.currentMonthProjection?.scenarios?.base;
  forecast.append(node('p',null,`${meta.sourceThrough||'확인 중'}까지 확인된 실적 + 최근 7일 추세를 남은 날짜에 적용합니다. 예측은 선택 월과 별개로 최신 관측월 기준입니다.`));
  if(projected)forecast.append(node('p',null,`기준 시나리오 월말 예상: 매출 ${formatKrw(projected.revenueKrw)} · 비용 ${formatKrw(projected.operatingSpendKrw)} · 손익 ${formatKrw(projected.operatingProfitKrw)}.`));
  forecast.append(node('p','review-note','원천 누락이 있는 조건부 전망입니다. TNK 미수집분·미확인 실제 비용은 확정값으로 채우지 않습니다. 월 예상 금 경품비는 비용 가정에 포함합니다. 보수·기준·성장 시나리오 및 누적 손익은 아래 6개월 예측에서 확인하세요.'));
  if (!projected) { forecast.replaceChildren(node('h3',null,'6개월 예측'),node('p',null,'이 국가의 수익·비용 원천이 부족하여 예측을 확정하지 않습니다.')); }
  container.append(forecast);
  const tracking=payload.settlementTracking;
  if(!tracking)return;
  const settlements=node('section','finance-settlements');settlements.append(node('h3',null,`정산 일정 · ${tracking.asOfDate} 확인`),node('p',null,'현재 한국 운영 계정의 지급처별 일정입니다. 조회 월·국가와 별개이며, 송금 처리와 은행 입금은 다릅니다. 날짜가 지났다는 이유만으로 연체로 판정하지 않습니다.'));
  const scroll=node('div','finance-schedule-scroll');const table=node('table','finance-schedule');
  const head=node('thead');const tr=node('tr');for(const text of ['지급처 / 귀속월','예정일·기한','현재 상태','다음 확인'])tr.append(node('th',null,text));head.append(tr);table.append(head);
  const body=node('tbody');for(const row of tracking.records||[]){const tr=node('tr');for(const text of [`${row.provider} · ${row.period}`,row.expectedLabel,row.status,row.nextAction])tr.append(node('td',null,text));body.append(tr);}table.append(body);scroll.append(table);settlements.append(scroll,node('p','finance-period','정산금액과 실제 입금 대사는 내부에서 별도 관리합니다. 미디에이션 매체별 수익과 실제 지급처는 일치하지 않을 수 있습니다.'));
  container.append(settlements);
}
