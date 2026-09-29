import { formatDate } from "./format.js?v=20260908-1";

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function comparisonText(metric, format) {
  if (metric?.comparisonValue === null || metric?.comparisonValue === undefined || metric?.comparisonPct === null || metric?.comparisonPct === undefined) return "비교 대기";
  const direction = Number(metric.comparisonPct) >= 0 ? "증가" : "감소";
  return `이전 비교기간 ${format(metric.comparisonValue)} · ${Math.abs(Number(metric.comparisonPct))}% ${direction}`;
}

function statusText(metric) {
  if (!metric || metric.status === "not_connected") return "연결 대기";
  const through = metric.sourceThrough ? `${formatDate(metric.sourceThrough)}까지` : "";
  if (metric.status === "partial") return ["일부 데이터", through].filter(Boolean).join(" · ");
  return through || "기준일 확인 대기";
}

export function buildCardModels(cards) {
  return cards.map(({ key, label, metric, format, comparisonFormat }) => ({
    key,
    label,
    valueText: !metric || metric.status === "not_connected" ? "연결 대기" : format(metric.value),
    statusText: statusText(metric),
    comparisonText: comparisonText(metric, comparisonFormat || format),
  }));
}

export function renderMonthlyKpiCards(container, cards) {
  const controls = new Map();
  if (!cards.length) return controls;
  const grid = element("div", "monthly-kpi-grid");
  buildCardModels(cards).forEach((model, index) => {
    const interactive = cards[index].interactive;
    const card = element(interactive ? "button" : "article", "monthly-kpi-card");
    card.dataset.kpiKey = model.key;
    if (interactive) {
      card.type = "button";
      card.setAttribute("aria-pressed", "false");
      card.setAttribute("aria-label", `${model.label} ${model.valueText} · ${model.statusText} · ${model.comparisonText} · 관련 그래프 보기`);
      controls.set(model.key, card);
    }
    card.append(
      element("span", "monthly-kpi-label", model.label),
      element("strong", "monthly-kpi-value", model.valueText),
      element("small", "monthly-kpi-status", model.statusText),
      element("small", "monthly-kpi-comparison", model.comparisonText),
    );
    grid.append(card);
  });
  container.append(grid);
  return controls;
}

export function renderMonthlyBreakdown(container, items) {
  const controls = new Map();
  if (!items.length) return controls;
  const list = element("dl", "monthly-breakdown");
  items.forEach(({ key, label, metric, format, roleLabel, interactive }) => {
    const row = element("div", "monthly-breakdown-row");
    const term = element("dt");
    const valueText = !metric || metric.status === "not_connected" ? "연결 대기" : format(metric.value);
    const coverageText = statusText(metric);
    if (interactive) {
      const button = element("button", "monthly-breakdown-control", label);
      button.type = "button";
      button.dataset.kpiKey = key;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `${label} ${valueText} · ${roleLabel} · ${coverageText} · 관련 그래프 보기`);
      term.append(button);
      controls.set(key, button);
    } else {
      term.textContent = label;
      term.dataset.kpiKey = key;
    }
    term.append(element("small", "monthly-breakdown-status", coverageText));
    row.append(
      term,
      element("dd", "metric-role", roleLabel),
      element("dd", null, valueText),
    );
    list.append(row);
  });
  container.append(list);
  return controls;
}
