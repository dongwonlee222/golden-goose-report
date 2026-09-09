import { formatDate, formatKrw, formatPercent } from "./format.js?v=20260907-2";

export const FORECAST_SCENARIOS = {
  conservative: "보수적",
  base: "기준",
  growth: "성장",
};

export const FORECAST_VIEWS = {
  cumulative: "누적",
  monthly: "월별",
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function selectForecastRows(rows, scenario) {
  return (rows || []).map((row) => ({
    date: row.date,
    month: row.month,
    ...(row.scenarios?.[scenario] || {}),
  }));
}

export function selectForecastChartRows(rows, scenario, currentProjection, view = "cumulative") {
  const currentValues = currentProjection?.scenarios?.[scenario];
  const currentRow = currentValues && currentProjection?.month
    ? { date: `${currentProjection.month}-01`, month: currentProjection.month, ...currentValues }
    : null;
  const selected = [
    ...(currentRow ? [currentRow] : []),
    ...selectForecastRows(rows, scenario),
  ];
  if (view === "monthly") return selected;
  return selected.map((row) => ({
    date: row.date,
    month: row.month,
    cumulativeProfitKrw: row.cumulativeProfitKrw,
  }));
}

export function forecastBasisLines(meta, scenario) {
  const scenarioFactor = { conservative: 0, base: 0.5, growth: 1 }[scenario] ?? 0;
  const observed = meta?.observedGrowthPct;
  const capped = Number(meta?.cappedGrowthPct || 0);
  const applied = capped * scenarioFactor;
  const scenarioLabel = FORECAST_SCENARIOS[scenario] || scenario;
  const lines = [];
  if (observed !== null && observed !== undefined) {
    lines.push(`관측 성장률 ${formatPercent(observed)} · ${scenarioLabel} 시나리오 적용 성장률 ${formatPercent(applied)} (상한 ±10%)`);
  }
  if (meta?.recentWindow && meta?.priorWindow) {
    lines.push(`비교 기간 ${formatDate(meta.recentWindow.start)}–${formatDate(meta.recentWindow.end)} / ${formatDate(meta.priorWindow.start)}–${formatDate(meta.priorWindow.end)}`);
  }
  if (meta?.goldPrize?.monthlyCostKrw !== null && meta?.goldPrize?.monthlyCostKrw !== undefined) {
    const weekly = meta.goldPrize.weeklyCostKrw !== null && meta.goldPrize.weeklyCostKrw !== undefined
      ? ` · 주 ${formatKrw(meta.goldPrize.weeklyCostKrw)}`
      : "";
    lines.push(`금 경품비 월 ${formatKrw(meta.goldPrize.monthlyCostKrw)}${weekly} · ${meta.goldPrize.monthlyGrams}g 기준`);
  }
  if (meta?.adpopcornFee?.ratePct !== null && meta?.adpopcornFee?.ratePct !== undefined) {
    lines.push(`AdPopcorn 수수료 ${formatPercent(meta.adpopcornFee.ratePct)} 차감 후 매출 기준`);
  }
  if (meta?.structuralStartDate) {
    lines.push(`현재 운영 구조 기준 ${formatDate(meta.structuralStartDate)} 이후`);
  }
  return lines;
}

export function renderForecastControls(container, { scenario, view, meta, onSelect, onViewSelect }) {
  const toolbar = element("div", "forecast-toolbar");
  const controls = element("div", "forecast-control-groups");
  const tabs = element("div", "view-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "예측 시나리오");
  Object.entries(FORECAST_SCENARIOS).forEach(([key, label]) => {
    const button = element("button", "view-tab", label);
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(key === scenario));
    button.addEventListener("click", () => onSelect(key));
    tabs.append(button);
  });
  const viewTabs = element("div", "view-tabs");
  viewTabs.setAttribute("role", "tablist");
  viewTabs.setAttribute("aria-label", "예측 그래프 보기");
  Object.entries(FORECAST_VIEWS).forEach(([key, label]) => {
    const button = element("button", "view-tab", label);
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(key === view));
    button.addEventListener("click", () => onViewSelect(key));
    viewTabs.append(button);
  });
  controls.append(tabs, viewTabs);
  toolbar.append(controls);
  toolbar.append(element("span", "forecast-basis", `예측 기준일 ${formatDate(meta?.sourceThrough)}`));
  container.append(toolbar);

  forecastBasisLines(meta, scenario).forEach((line) => {
    container.append(element("p", "forecast-note", line));
  });
  const rates = meta?.scenarioMultipliers?.[scenario];
  if (rates) container.append(element("p", "forecast-note", `지출 시나리오 배수 ${Number(rates.spend) * 100}%`));
}

export function renderForecastTable(container, { rows, scenario, recoveryMonth }) {
  const details = document.createElement("details");
  details.className = "daily-details forecast-details";
  details.open = true;
  const summary = element("summary", null, `${FORECAST_SCENARIOS[scenario]} 시나리오 월별 예측`);
  const scroller = element("div", "table-scroll");
  const table = element("table", "daily-table forecast-table");
  const thead = document.createElement("thead");
  const head = document.createElement("tr");
  ["월", "예상 매출", "예상 지출", "예상 손익", "영업이익률", "예상 누적 손익"].forEach((label) => {
    const th = element("th", null, label);
    th.scope = "col";
    head.append(th);
  });
  thead.append(head);
  const tbody = document.createElement("tbody");
  selectForecastRows(rows, scenario).forEach((row) => {
    const tr = document.createElement("tr");
    const values = [
      `${row.month.replace("-", "년 ")}월`,
      formatKrw(row.revenueKrw),
      formatKrw(row.operatingSpendKrw),
      formatKrw(row.operatingProfitKrw),
      formatPercent(row.operatingMarginPct),
      formatKrw(row.cumulativeProfitKrw),
    ];
    values.forEach((value, index) => {
      const cell = element(index === 0 ? "th" : "td", null, value);
      if (index === 0) cell.scope = "row";
      tr.append(cell);
    });
    tbody.append(tr);
  });
  table.append(thead, tbody);
  scroller.append(table);
  details.append(summary, scroller);
  container.append(details);
  container.append(element(
    "p",
    "forecast-recovery",
    recoveryMonth ? `누적 손익 회복 예상: ${recoveryMonth.replace("-", "년 ")}월` : "6개월 내 누적 손익 회복 어려움",
  ));
}
