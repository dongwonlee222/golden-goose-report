const PERIODS = [
  ["d1_7", "1–7일"],
  ["d8_14", "8–14일"],
  ["d15_30", "15–30일"],
  ["d31_60", "31–60일"],
];

const EVENT_ORDER = [
  "all_participation",
  "reward_ad",
  "reward_ad_egg",
  "reward_ad_check_in",
  "reward_ad_vault_game",
  "reward_ad_card_game",
  "reward_ad_bonus_cash",
  "cpx_research",
  "adjoe",
  "tnk_offerwall",
  "giftcard",
];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function number(value) {
  return value === null || value === undefined ? "—" : Number(value).toLocaleString("ko-KR");
}

function percent(value) {
  return value === null || value === undefined ? "—" : `${Number(value).toFixed(1)}%`;
}

function tier(rate) {
  if (rate === null || rate === undefined) return "";
  if (rate >= 50) return " retention-tier-5";
  if (rate >= 30) return " retention-tier-4";
  if (rate >= 15) return " retention-tier-3";
  if (rate > 0) return " retention-tier-2";
  return " retention-tier-1";
}

function renderSummary(container, event) {
  const grid = element("div", "retention-summary");
  const repeatValue = (window) => event.cumulativeRepeat?.[window]?.state === "observing"
    ? "관찰 중"
    : percent(event.cumulativeRepeat?.[window]?.ratePct);
  const items = [
    ["최근 30일 고유 참여자", number(event.rollingUnique?.["30"]), "명"],
    ["최근 60일 고유 참여자", number(event.rollingUnique?.["60"]), "명"],
    ["30일 안에 다시 참여", repeatValue("30"), ""],
    ["60일 안에 다시 참여", repeatValue("60"), ""],
  ];
  items.forEach(([label, value, suffix]) => {
    const item = element("div", "retention-stat");
    item.append(element("span", null, label), element("strong", null, value === "—" ? value : `${value}${suffix}`));
    grid.append(item);
  });
  container.append(grid);
}

function renderMatrix(container, event) {
  container.replaceChildren();
  if (event.status === "not_connected" || !event.cohorts?.length) {
    container.append(element("div", "retention-empty", "이 이벤트의 코호트 데이터가 아직 연결되지 않았습니다."));
    return;
  }
  const table = element("table", "cohort-table");
  const thead = document.createElement("thead");
  const header = document.createElement("tr");
  ["첫 참여 주", "첫 참여자", ...PERIODS.map(([, label]) => label)].forEach((label) => header.append(element("th", null, label)));
  thead.append(header);
  const tbody = document.createElement("tbody");
  event.cohorts.forEach((cohort) => {
    const row = document.createElement("tr");
    row.append(element("th", null, cohort.cohortWeekStart), element("td", "cohort-size", `${number(cohort.cohortUsers)}명`));
    PERIODS.forEach(([key]) => {
      const period = cohort.periods?.[key];
      if (!period || period.state === "observing") {
        row.append(element("td", "cohort-cell observing", "관찰 중"));
        return;
      }
      const cell = element("td", `cohort-cell${tier(period.ratePct)}`);
      cell.setAttribute(
        "aria-label",
        `${cohort.cohortWeekStart} ${key} 재참여 ${number(period.returningUsers)}명 / 첫 참여 ${number(cohort.cohortUsers)}명, ${percent(period.ratePct)}`,
      );
      cell.append(element("strong", null, percent(period.ratePct)), element("small", null, `${number(period.returningUsers)} / ${number(cohort.cohortUsers)}명`));
      row.append(cell);
    });
    tbody.append(row);
  });
  table.append(thead, tbody);
  container.append(table);
}

function renderExactDetails(details, event) {
  details.replaceChildren();
  const summary = document.createElement("summary");
  summary.append(document.createTextNode("코호트별 정확한 인원 보기"), element("span", "details-action"));
  details.append(summary);
  if (!event.cohorts?.length) return;
  const scroll = element("div", "table-scroll");
  const table = element("table", "daily-table cohort-detail-table");
  const head = document.createElement("thead");
  const header = document.createElement("tr");
  ["첫 참여 주", "기간", "상태", "첫 참여자", "재참여자", "재참여율"].forEach((label) => header.append(element("th", null, label)));
  head.append(header);
  const body = document.createElement("tbody");
  event.cohorts.forEach((cohort) => PERIODS.forEach(([key, label]) => {
    const period = cohort.periods?.[key];
    const row = document.createElement("tr");
    row.append(
      element("th", null, cohort.cohortWeekStart),
      element("td", null, label),
      element("td", null, period?.state === "complete" ? "확정" : "관찰 중"),
      element("td", null, `${number(cohort.cohortUsers)}명`),
      element("td", null, period?.state === "complete" ? `${number(period.returningUsers)}명` : "—"),
      element("td", null, period?.state === "complete" ? percent(period.ratePct) : "—"),
    );
    body.append(row);
  }));
  table.append(head, body);
  scroll.append(table);
  details.append(scroll);
}

export function renderRetention(container, retention) {
  const root = element("section", "retention-block");
  root.append(element("h3", null, "이벤트별 30·60일 반복 참여"));
  root.append(element("p", "retention-copy", "첫 참여 주별로 같은 이벤트에 다시 참여한 비율을 확인합니다."));
  root.append(element("p", "retention-copy", "전체 참여는 이벤트 종류와 관계없이 한 사람을 한 번만 센 중복 제거 참여자입니다."));
  const events = retention?.events || {};
  const keys = [
    ...EVENT_ORDER.filter((key) => events[key]),
    ...Object.keys(events).filter((key) => !EVENT_ORDER.includes(key)),
  ];
  if (!keys.length) {
    root.append(element("div", "retention-empty", "반복 참여 데이터 연결 대기"));
    container.append(root);
    return;
  }
  let selected = events.all_participation ? "all_participation" : keys[0];
  const tabs = element("div", "retention-events");
  tabs.setAttribute("role", "tablist");
  const summary = element("div", "retention-summary-wrap");
  const matrix = element("div", "cohort-matrix");
  const details = element("details", "daily-details cohort-details");
  const buttons = new Map();
  const refresh = () => {
    const event = events[selected];
    buttons.forEach((button, key) => button.setAttribute("aria-selected", String(key === selected)));
    summary.replaceChildren();
    renderSummary(summary, event);
    renderMatrix(matrix, event);
    renderExactDetails(details, event);
  };
  keys.forEach((key) => {
    const event = events[key];
    const button = element("button", "retention-event", event.label);
    button.type = "button";
    button.setAttribute("role", "tab");
    button.addEventListener("click", () => { selected = key; refresh(); });
    buttons.set(key, button);
    tabs.append(button);
  });
  root.append(tabs, summary, matrix, details);
  container.append(root);
  refresh();
}
