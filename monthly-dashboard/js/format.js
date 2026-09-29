const KRW = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });
const COUNT = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });
const USD = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function missing(value) {
  return value === null || value === undefined || Number.isNaN(Number(value));
}

export function formatKrw(value) {
  return missing(value) ? "—" : `${KRW.format(Number(value))}원`;
}

export function formatUsd(value) {
  return missing(value) ? "—" : `US$${USD.format(Number(value))}`;
}

export function formatDualEcpm(usd, krw) {
  if (missing(usd) && missing(krw)) return "—";
  return `${missing(usd) ? "US$—" : formatUsd(usd)} (${missing(krw) ? "원화 미확정" : `약 ${formatKrw(krw)}`})`;
}

export function formatCount(value, suffix = "") {
  return missing(value) ? "—" : `${COUNT.format(Number(value))}${suffix}`;
}

export function formatPercent(value) {
  return missing(value) ? "—" : `${COUNT.format(Number(value))}%`;
}

export function formatDate(value) {
  if (!value) return "—";
  const [, month, day] = String(value).split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

export function formatMonth(value) {
  if (!value) return "—";
  const [year, month] = String(value).split("-");
  return `${year}년 ${Number(month)}월`;
}
