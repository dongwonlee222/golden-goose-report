import { createSelectionState } from "./state.js?v=20260907-3";
import { renderDashboard } from "./sections.js?v=20261007-1";

const status = document.querySelector("#page-status");
const monthSelect = document.querySelector("#month-select");
const countryTabs = [...document.querySelectorAll("[data-country]")];

function monthLabel(value) {
  if (!value) return "조회 가능한 월 없음";
  const [year, month] = value.split("-");
  return `${year}년 ${Number(month)}월`;
}

function syncSelectionUrl(selection) {
  const url = new URL(window.location.href);
  url.searchParams.set("country", selection.country);
  if (selection.month) url.searchParams.set("month", selection.month);
  else url.searchParams.delete("month");
  url.searchParams.set("partnerView", selection.partnerView);
  window.history.replaceState(null, "", url.toString());
}

function bind(payload) {
  const selectionState = createSelectionState(payload, window.localStorage, window.location.search);
  const refresh = () => {
    const selection = selectionState.value;
    syncSelectionUrl(selection);
    countryTabs.forEach((tab) => tab.setAttribute("aria-selected", String(tab.dataset.country === selection.country)));
    monthSelect.replaceChildren(...selection.months.map((month) => new Option(monthLabel(month), month, false, month === selection.month)));
    document.querySelector("#previous-month").disabled = selection.months.indexOf(selection.month) <= 0;
    document.querySelector("#next-month").disabled = selection.months.indexOf(selection.month) >= selection.months.length - 1;
    const country = payload.countries?.[selection.country];
    const databaseThrough = country?.latestCompleteDate;
    const sourceThrough = country?.forecastMeta?.sourceThrough;
    document.querySelector("#freshness").textContent = databaseThrough
      ? `운영 DB ${databaseThrough} · 수익원·광고 ${sourceThrough || "확인 중"}까지`
      : "연결 대기";
    status.textContent = `${selection.country === "KR" ? "한국" : "일본"} · ${monthLabel(selection.month)}`;
    renderDashboard({
      payload,
      selection,
      onPartnerViewChange: (nextView) => {
        selectionState.setPartnerView(nextView);
        refresh();
      },
    });
  };

  countryTabs.forEach((tab) => tab.addEventListener("click", () => { selectionState.setCountry(tab.dataset.country); refresh(); }));
  monthSelect.addEventListener("change", () => { selectionState.setMonth(monthSelect.value); refresh(); });
  document.querySelector("#previous-month").addEventListener("click", () => { selectionState.previousMonth(); refresh(); });
  document.querySelector("#next-month").addEventListener("click", () => { selectionState.nextMonth(); refresh(); });
  document.querySelector("#current-month").addEventListener("click", () => { selectionState.goCurrent(); refresh(); });
  refresh();
}

fetch("./data.json", { cache: "no-store" })
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(bind)
  .catch((error) => {
    status.textContent = `데이터를 불러오지 못했습니다: ${error.message}`;
    document.querySelector("#freshness").textContent = "갱신 확인 필요";
  });
