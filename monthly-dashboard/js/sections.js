import { renderBarChart, renderLineChart } from "./chart.js?v=20260907-2";
import { formatCount, formatKrw, formatPercent } from "./format.js?v=20260907-2";
import { renderDailyTable } from "./table.js?v=20260907-2";
import { renderRetention } from "./retention.js?v=20260908-1";
import { renderForecastControls, renderForecastTable, selectForecastChartRows } from "./forecast.js?v=20260908-3";
import { createSeriesSelection } from "./series-state.js?v=20260908-2";
import { renderMonthlyBreakdown, renderMonthlyKpiCards } from "./kpis.js?v=20260908-3";

export { renderMonthlyBreakdown, renderMonthlyKpiCards };

const REVENUE_KEYS = ["app_ad_revenue_krw", "tnk_revenue_krw", "cpx_revenue_krw", "adjoe_revenue_krw"];
const SPEND_KEYS = ["net_reward_points_krw", "google_ads_cost_krw", "paid_offerwall_cost_krw", "other_ad_cost_krw", "infra_cost_krw", "gold_prize_cost_krw"];
const PARTNER_KEYS = ["tnk_revenue_krw", "cpx_revenue_krw", "adjoe_revenue_krw"];
const SECTION_CARD_CONFIG = {
  revenue: [
    ["confirmedTotal", "확인된 매출 합계", "headline", formatKrw, REVENUE_KEYS],
    ["appAd", "앱 광고 정산 매출", "included", formatKrw, ["app_ad_revenue_krw"]],
    ["tnk", "TNK 매출", "included", formatKrw, ["tnk_revenue_krw"]],
    ["cpx", "CPX 매출", "included", formatKrw, ["cpx_revenue_krw"]],
    ["adjoe", "Adjoe 매출", "included", formatKrw, ["adjoe_revenue_krw"]],
    ["giftcardSavingReference", "기프티콘 원가 절감", "reference", formatKrw, ["giftcard_margin_observed_krw"]],
  ],
  spend: [
    ["confirmedTotal", "확인된 지출 합계", "headline", formatKrw, SPEND_KEYS],
    ["adpopcornCommission", "AdPopcorn 운영수수료 20%", "deducted", formatKrw],
    ["netRewardPoints", "순지급 포인트", "included", formatKrw, ["net_reward_points_krw"]],
    ["googleAds", "Google Ads 회원 유입비", "included", formatKrw, ["google_ads_cost_krw"]],
    ["paidTnkCampaign", "TNK 유료 참여 캠페인비", "included", formatKrw, ["paid_offerwall_cost_krw"]],
    ["otherAds", "기타 광고비", "included", formatKrw, ["other_ad_cost_krw"]],
    ["infrastructure", "서버·호스팅비", "included", formatKrw, ["infra_cost_krw"]],
    ["actualGoldPrize", "실제 금 경품비", "actual", formatKrw, ["gold_prize_cost_krw"]],
    ["forecastGoldPrize", "월 예상 금 경품비", "forecast", formatKrw],
  ],
  members: [
    ["newMembers", "신규 회원", "headline", formatCount, ["actual_new_member_count"]],
    ["newParticipants", "신규 참여자", "headline", formatCount, ["new_participants_first_ad"]],
    ["averageDailyActiveUsers", "평균 일간 활성 이용자", "headline", formatCount, ["active_users"]],
    ["repeat30Pct", "30일 반복 참여율", "headline", formatPercent],
    ["repeat60Pct", "60일 반복 참여율", "headline", formatPercent],
  ],
  adEfficiency: [
    ["settlementRevenue", "앱 광고 정산 매출", "headline", formatKrw, ["app_ad_revenue_krw"]],
    ["impressions", "총 노출", "headline", formatCount, ["adpopcorn_impression_count"]],
    ["weightedNetEcpmKrw", "가중평균 eCPM", "headline", formatKrw, ["app_ad_net_ecpm_krw"]],
    ["interstitialNetEcpmKrw", "전면 eCPM", "detail", formatKrw, ["app_ad_net_ecpm_iv_krw"]],
    ["rewardedNetEcpmKrw", "보상형 eCPM", "detail", formatKrw, ["app_ad_net_ecpm_rv_krw"]],
    ["bannerNetEcpmKrw", "배너 eCPM", "detail", formatKrw, ["app_ad_net_ecpm_banner_krw"]],
  ],
  partnerRevenue: [
    ["total", "제휴 매출 합계", "headline", formatKrw, PARTNER_KEYS],
    ["tnk", "TNK 매출", "included", formatKrw, ["tnk_revenue_krw"]],
    ["cpx", "CPX 매출", "included", formatKrw, ["cpx_revenue_krw"]],
    ["adjoe", "Adjoe 매출", "included", formatKrw, ["adjoe_revenue_krw"]],
  ],
  partnerParticipation: [
    ["tnkCompletions", "TNK 완료", "headline", formatCount, ["tnk_completion_count"]],
    ["cpxCompletions", "CPX 완료", "headline", formatCount, ["cpx_completion_count"]],
    ["adjoeParticipation", "Adjoe 참여", "headline", formatCount],
  ],
  referral: [
    ["rewardEvents", "보상 건수", "headline", formatCount, ["referral_reward_events"]],
    ["rewardPoints", "지급 포인트", "headline", formatCount, ["referral_reward_points_total"]],
    ["averagePointsPerEvent", "건당 평균 포인트", "headline", formatCount, ["referral_reward_events", "referral_reward_points_total"]],
    ["uniqueRewardedCustomers", "월 고유 보상 고객", "headline", formatCount],
  ],
  giftcards: [
    ["orders", "주문 건수", "headline", formatCount, ["giftcard_order_count_total"]],
    ["pointsUsed", "사용 포인트", "headline", formatCount, ["giftcard_point_amount_total"]],
    ["averagePointsPerOrder", "주문당 평균 포인트", "headline", formatCount, ["giftcard_order_count_total", "giftcard_point_amount_total"]],
    ["repeatOrderers", "반복 주문자", "headline", formatCount],
    ["repeatRatePct", "반복 주문률", "headline", formatPercent],
    ["reviewCustomers", "점검 필요 주문자", "headline", formatCount],
  ],
};

export function sectionCardSpecs(section, monthlyKpis) {
  return (SECTION_CARD_CONFIG[section] || []).map(([key, label, role, format, seriesKeys]) => ({
    key, label, role, format, seriesKeys, metric: monthlyKpis?.[section]?.[key],
  }));
}

function renderSectionSummary(container, section, month) {
  const specs = sectionCardSpecs(section, month?.monthlyKpis).map(item => ({
    ...item,
    interactive: Boolean(item.seriesKeys?.length && item.metric?.value != null && item.metric.status !== "not_connected"),
  }));
  const cards = renderMonthlyKpiCards(container, specs.filter(({ role }) => role === "headline"));
  const breakdown = renderMonthlyBreakdown(container, specs.filter(({ role }) => role !== "headline").map(item => ({
    ...item,
    roleLabel: { included: "합계 포함", deducted: "매출에서 이미 차감 · 지출 합계 미포함", detail: "세부 지표", reference: "합계 미포함", actual: "실제", forecast: "예측" }[item.role],
  })));
  return specs.map(item => ({ ...item, control: cards.get(item.key) || breakdown.get(item.key) }));
}

const COLORS = ["#c78619", "#232621", "#78816d", "#a74434", "#6d768a"];
const SOURCE_LABELS = {
  finance_close: "월 손익 원장",
  adpopcorn: "앱 광고",
  google_ads: "Google Ads",
  offerwall: "유료 오퍼월",
  supabase: "서비스 DB",
  cpx: "CPX 설문",
  adjoe: "Adjoe",
  tnk: "TNK 매출",
  fx: "환율",
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function flatRows(month) {
  return (month?.days || []).map((row) => ({ ...row, ...(row.metrics || {}) }));
}

function renderFacts(container, facts) {
  const grid = element("div", "fact-grid");
  facts.forEach((fact) => {
    const item = element("div", "fact");
    item.append(element("span", "fact-label", fact.label));
    item.append(element("strong", "fact-value", fact.format(fact.value)));
    if (fact.value === null || fact.value === undefined) item.append(element("small", "fact-state", "연결 대기"));
    grid.append(item);
  });
  container.append(grid);
}

function renderLegend(container, series, selection, onChange) {
  container.replaceChildren();
  const visibleKeys = selection.visibleKeys;
  series.forEach((item, index) => {
    const button = element("button", "legend-item", item.label);
    button.type = "button";
    button.setAttribute("aria-pressed", String(visibleKeys.includes(item.key)));
    const dot = element("i", "legend-dot");
    dot.style.background = item.color || COLORS[index % COLORS.length];
    button.prepend(dot);
    button.addEventListener("click", () => {
      selection.toggleOnly(item.key);
      onChange();
    });
    container.append(button);
  });
  if (series.length > 1) {
    const button = element("button", "legend-show-all", "전체 보기");
    button.type = "button";
    button.setAttribute("aria-pressed", String(!selection.isIsolated));
    button.addEventListener("click", () => {
      selection.showAll();
      onChange();
    });
    container.append(button);
  }
}

function renderTrend(container, { rows, series, format = formatCount, chart = "line", caption, showTable = true, summary = [], tableContainer = container }) {
  const defined = series.map((item, index) => ({ ...item, color: item.color || COLORS[index % COLORS.length] }));
  const selection = createSeriesSelection(defined.map((item) => item.key));
  const legend = element("div", "chart-legend");
  container.append(legend);
  const chartNode = element("div", "trend-chart");
  container.append(chartNode);
  const tableNode = showTable ? element("div", "trend-table") : null;
  if (tableNode) tableContainer.append(tableNode);
  const linked = summary.filter(item => item.control && item.seriesKeys.every(key => defined.some(series => series.key === key)));
  const paint = () => {
    const visibleKeys = selection.visibleKeys;
    const visible = defined.filter((item) => visibleKeys.includes(item.key));
    renderLegend(legend, defined, selection, paint);
    linked.forEach(({ control, seriesKeys }) => control.setAttribute("aria-pressed", String(
      selection.isIsolated && seriesKeys.length === visibleKeys.length && seriesKeys.every(key => visibleKeys.includes(key)),
    )));
    (chart === "bar" ? renderBarChart : renderLineChart)(chartNode, {
      rows, series: visible, valueFormatter: format, label: caption,
    });
    if (tableNode) {
      const open = tableNode.querySelector("details")?.open || false;
      renderDailyTable(tableNode, {
        rows,
        caption,
        columns: visible.map((item) => ({ key: item.key, label: item.label, format })),
      });
      tableNode.querySelector("details").open = open;
    }
  };
  linked.forEach(({ control, seriesKeys }) => control.addEventListener("click", () => {
    selection.toggleOnly(seriesKeys);
    paint();
  }));
  paint();
}

function renderSourceStates(container, country) {
  const block = element("div", "source-states");
  block.append(element("h3", null, "데이터 출처·최신일"));
  const states = Object.entries(country?.sourceStates || {});
  if (!states.length) {
    block.append(element("p", "source-empty", "출처 상태 연결 대기"));
  } else {
    const list = element("ul");
    states.forEach(([code, state]) => {
      const label = state.status === "latest" ? "최신" : state.status === "estimated" ? "잠정" : state.status === "not_connected" ? "미연동" : "확인 필요";
      const item = element("li");
      item.append(
        element("strong", null, SOURCE_LABELS[code] || code),
        element("span", `status status-${state.status}`, label),
        document.createTextNode(state.latestDate || "날짜 없음"),
      );
      list.append(item);
    });
    block.append(list);
  }
  container.append(block);
}

function renderFinanceBasis(container, month) {
  const state = month?.sourceStates?.finance_close;
  const closed = state?.status === "latest";
  const note = element("div", `finance-basis ${closed ? "is-closed" : "is-open"}`);
  note.append(
    element("strong", null, closed ? "정산 확정" : "월 마감 전"),
    element("span", null, closed
      ? "월 손익 원장 확정값과 일별 상세 합계를 맞췄습니다."
      : "확인된 금액만 합산한 잠정 손익이며, 미확정 원천이 들어오면 달라질 수 있습니다."),
  );
  container.append(note);
}

function renderProfit(container, { month, rows, country }) {
  const summary = month.summary;
  const closed = month?.sourceStates?.finance_close?.status === "latest";
  const displayed = closed ? summary : {
    revenueKrw: summary.revenueKrw ?? summary.knownRevenueKrw,
    operatingSpendKrw: summary.operatingSpendKrw ?? summary.knownOperatingSpendKrw,
    operatingProfitKrw: summary.operatingProfitKrw ?? summary.knownOperatingProfitKrw,
    operatingMarginPct: summary.operatingMarginPct ?? summary.knownOperatingMarginPct,
    cumulativeProfitKrw: summary.cumulativeProfitKrw ?? summary.knownCumulativeProfitKrw,
  };
  const displayedRows = closed ? rows : rows.map((row) => ({
    ...row,
    revenueKrw: row.revenueKrw ?? row.knownRevenueKrw,
    operatingSpendKrw: row.operatingSpendKrw ?? row.knownOperatingSpendKrw,
    operatingProfitKrw: row.operatingProfitKrw ?? row.knownOperatingProfitKrw,
  }));
  renderFinanceBasis(container, month);
  renderFacts(container, [
    { label: "이번 달 매출", value: displayed.revenueKrw, format: formatKrw },
    { label: "이번 달 지출", value: displayed.operatingSpendKrw, format: formatKrw },
    { label: "이번 달 손익", value: displayed.operatingProfitKrw, format: formatKrw },
    { label: "영업이익률", value: displayed.operatingMarginPct, format: formatPercent },
    { label: "현재 누적 손익", value: displayed.cumulativeProfitKrw, format: formatKrw },
  ]);
  renderTrend(container, {
    rows: displayedRows,
    series: [
      { key: "revenueKrw", label: "매출" },
      { key: "operatingSpendKrw", label: "지출" },
      { key: "operatingProfitKrw", label: "손익" },
    ],
    format: formatKrw,
    caption: "일별 매출·지출·손익",
  });
  renderSourceStates(container, { sourceStates: month.sourceStates || country?.sourceStates });
}

function renderForecast(container, { country }) {
  const forecastRows = country?.forecastRows || [];
  const forecastMeta = country?.forecastMeta || {};
  if (!forecastRows.length) {
    const empty = element("div", "empty-state");
    empty.append(element("strong", null, "예측 데이터 연결 대기"));
    empty.append(element("span", null, "검증된 6개월 시나리오가 만들어질 때까지 브라우저에서 임의 예측하지 않습니다."));
    container.append(empty);
    return;
  }
  let scenario = "base";
  let view = "cumulative";
  const paint = () => {
    container.replaceChildren();
    renderForecastControls(container, {
      scenario,
      view,
      meta: forecastMeta,
      onSelect: (next) => { scenario = next; paint(); },
      onViewSelect: (next) => { view = next; paint(); },
    });
    const projected = forecastMeta.currentMonthProjection?.scenarios?.[scenario] || {};
    renderFacts(container, [
      { label: "이번 달 예상 매출", value: projected.revenueKrw, format: formatKrw },
      { label: "이번 달 예상 지출", value: projected.operatingSpendKrw, format: formatKrw },
      { label: "이번 달 예상 손익", value: projected.operatingProfitKrw, format: formatKrw },
      { label: "예상 영업이익률", value: projected.operatingMarginPct, format: formatPercent },
      { label: "이번 달 말 누적 손익", value: projected.cumulativeProfitKrw, format: formatKrw },
    ]);
    const cumulative = view === "cumulative";
    renderTrend(container, {
      rows: selectForecastChartRows(
        forecastRows,
        scenario,
        forecastMeta.currentMonthProjection,
        view,
      ),
      series: cumulative
        ? [{ key: "cumulativeProfitKrw", label: "누적 손익" }]
        : [
          { key: "revenueKrw", label: "예측 매출" },
          { key: "operatingSpendKrw", label: "예측 지출" },
          { key: "operatingProfitKrw", label: "예측 손익" },
        ],
      format: formatKrw,
      caption: cumulative ? "이번 달 말부터 향후 6개월 누적 손익" : "이번 달부터 향후 6개월 월별 예측",
      showTable: false,
    });
    renderForecastTable(container, {
      rows: forecastRows,
      scenario,
      recoveryMonth: forecastMeta.recoveryMonthByScenario?.[scenario],
    });
  };
  paint();
}

function renderRevenue(container, { rows, month }) {
  const summary = renderSectionSummary(container, "revenue", month);
  renderTrend(container, {
    rows, summary,
    series: [
      { key: "app_ad_revenue_krw", label: "앱 광고 정산 매출(수수료 차감 후)" },
      { key: "tnk_revenue_krw", label: "TNK 오퍼월 매출" },
      { key: "cpx_revenue_krw", label: "CPX 설문 매출" },
      { key: "adjoe_revenue_krw", label: "Adjoe 게임 매출" },
      { key: "giftcard_margin_observed_krw", label: "기프티콘 원가 절감(포인트 비용 반영)" },
    ],
    format: formatKrw,
    caption: "매출 항목별 일별 값",
  });
}

function renderSpend(container, { rows, month }) {
  const summary = renderSectionSummary(container, "spend", month);
  renderTrend(container, {
    rows, summary,
    series: [
      { key: "net_reward_points_krw", label: "순지급 포인트" },
      { key: "google_ads_cost_krw", label: "Google Ads 회원 유입비" },
      { key: "paid_offerwall_cost_krw", label: "TNK 유료 참여 캠페인비" },
      { key: "other_ad_cost_krw", label: "기타 광고비" },
      { key: "infra_cost_krw", label: "서버·호스팅비" },
      { key: "gold_prize_cost_krw", label: "금 경품비" },
    ],
    format: formatKrw,
    chart: "bar",
    caption: "지출 항목별 일별 값",
  });
}

function renderMembers(container, { rows, month }) {
  const summary = renderSectionSummary(container, "members", month);
  renderTrend(container, {
    rows, summary,
    series: [
      { key: "actual_new_member_count", label: "실제 신규 회원" },
      { key: "new_participants_first_ad", label: "신규 참여자" },
      { key: "active_users", label: "활성 이용자" },
      { key: "guest_created_count", label: "게스트 생성" },
    ],
    format: (value) => formatCount(value, "명"),
    caption: "회원·참여 일별 추이",
  });
  renderRetention(container, month.retention);
}

function renderAdEfficiency(container, { rows, month }) {
  const summary = renderSectionSummary(container, "adEfficiency", month);
  const dailyLists = element("div", "daily-lists");
  renderTrend(container, {
    rows, summary, tableContainer: dailyLists,
    series: [{ key: "app_ad_revenue_krw", label: "앱 광고 정산 매출" }],
    format: formatKrw,
    caption: "앱 광고 일별 정산 매출",
  });
  renderTrend(container, {
    rows, summary, tableContainer: dailyLists,
    series: [
      { key: "app_ad_net_ecpm_krw", label: "전체 eCPM" },
      { key: "app_ad_net_ecpm_iv_krw", label: "전면 eCPM" },
      { key: "app_ad_net_ecpm_rv_krw", label: "보상형 eCPM" },
      { key: "app_ad_net_ecpm_banner_krw", label: "배너 eCPM" },
    ],
    format: formatKrw,
    caption: "앱 광고 형식별 eCPM · 수수료 차감 후, 노출 1,000회당",
  });
  renderTrend(container, {
    rows, summary, tableContainer: dailyLists,
    series: [
      { key: "adpopcorn_impression_count", label: "전체 노출" },
      { key: "adpopcorn_impression_count_iv", label: "전면 노출" },
      { key: "adpopcorn_impression_count_rv", label: "보상형 노출" },
      { key: "adpopcorn_impression_count_banner", label: "배너 노출" },
    ],
    format: (value) => formatCount(value, "회"),
    chart: "bar",
    caption: "앱 광고 형식별 노출",
  });
  container.append(dailyLists);
}

const PARTNER_SERIES = {
  revenue: [
    { key: "tnk_revenue_krw", label: "TNK 오퍼월 매출" },
    { key: "cpx_revenue_krw", label: "CPX 설문 매출" },
    { key: "adjoe_revenue_krw", label: "Adjoe 게임 매출" },
  ],
  participation: [
    { key: "tnk_completion_count", label: "TNK 완료" },
    { key: "cpx_completion_count", label: "CPX 완료" },
  ],
};

function renderPartners(container, { rows, month, selection, onPartnerViewChange }) {
  const active = selection.partnerView || "revenue";
  const tabs = element("div", "view-tabs partner-view-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "제휴 성과 보기");
  [["revenue", "수익"], ["participation", "참여 수"]].forEach(([key, label]) => {
    const button = element("button", "view-tab", label);
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(key === active));
    button.addEventListener("click", () => onPartnerViewChange?.(key));
    tabs.append(button);
  });
  container.append(tabs);
  const summary = renderSectionSummary(container, active === "revenue" ? "partnerRevenue" : "partnerParticipation", month);
  renderTrend(container, {
    rows, summary,
    series: PARTNER_SERIES[active],
    format: active === "revenue" ? formatKrw : (value) => formatCount(value, "건"),
    caption: active === "revenue" ? "제휴 채널 일별 수익" : "제휴 채널 일별 참여 수",
  });
}

function renderReferral(container, { rows, month }) {
  const summary = renderSectionSummary(container, "referral", month);
  renderTrend(container, {
    rows, summary,
    series: [
      { key: "referral_rewarded_customers", label: "보상 고객" },
      { key: "referral_reward_events", label: "보상 건수" },
      { key: "referral_reward_points_total", label: "지급 포인트" },
    ],
    format: formatCount,
    caption: "친구초대 보상 일별 값",
  });
}

function renderGiftcards(container, { rows, month }) {
  const summary = renderSectionSummary(container, "giftcards", month);
  renderTrend(container, {
    rows, summary,
    series: [
      { key: "giftcard_order_count_total", label: "주문 건수" },
      { key: "repeat_giftcard_orderer_count", label: "반복 주문자" },
      { key: "giftcard_point_amount_total", label: "사용 포인트" },
    ],
    format: formatCount,
    caption: "기프티콘 주문과 반복 이용",
  });
  container.append(element("p", "review-note", "반복 주문 신호는 자동 차단이 아니라 운영 검토 대상으로만 표시합니다."));
}

function renderLedger(container, { rows }) {
  renderDailyTable(container, {
    rows,
    caption: "손익과 운영 지표 전체 일별 원장",
    columns: [
      { key: "revenueKrw", label: "매출", format: formatKrw },
      { key: "operatingSpendKrw", label: "지출", format: formatKrw },
      { key: "operatingProfitKrw", label: "손익", format: formatKrw },
      { key: "cumulativeProfitKrw", label: "누적 손익", format: formatKrw },
      { key: "actual_new_member_count", label: "신규 회원", format: (value) => formatCount(value, "명") },
      { key: "new_participants_first_ad", label: "신규 참여자", format: (value) => formatCount(value, "명") },
      { key: "active_users", label: "활성 이용자", format: (value) => formatCount(value, "명") },
      { key: "giftcard_order_count_total", label: "기프티콘 주문", format: (value) => formatCount(value, "건") },
    ],
  });
}

export const SECTION_RENDERERS = {
  profit: renderProfit,
  forecast: renderForecast,
  revenue: renderRevenue,
  spend: renderSpend,
  members: renderMembers,
  "ad-efficiency": renderAdEfficiency,
  partners: renderPartners,
  referral: renderReferral,
  giftcards: renderGiftcards,
  "daily-ledger": renderLedger,
};

export function renderDashboard({ payload, selection, onPartnerViewChange }) {
  const country = payload.countries?.[selection.country];
  const month = country?.months?.[selection.month];
  document.querySelectorAll("[data-section-body]").forEach((node) => node.replaceChildren());
  if (!month) {
    document.querySelectorAll("[data-section-body]").forEach((node) => node.append(element("div", "empty-state", "선택한 월의 데이터가 없습니다.")));
    return;
  }
  const context = { payload, selection, country, month, rows: flatRows(month), onPartnerViewChange };
  Object.entries(SECTION_RENDERERS).forEach(([sectionId, renderer]) => {
    const container = document.querySelector(`#${sectionId} [data-section-body]`);
    if (container) renderer(container, context);
  });
}
