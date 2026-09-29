import { formatDate } from "./format.js?v=20260907-2";

const FONT_FAMILY = '"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';

function finite(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function focusLedgerRow(date) {
  const row = document.querySelector(`[data-date="${date}"]`);
  const details = row?.closest("details");
  if (details) details.open = true;
  row?.focus({ preventScroll: true });
  row?.classList.add("is-linked");
  window.setTimeout(() => row?.classList.remove("is-linked"), 900);
}

function emptyChart(container) {
  const empty = document.createElement("div");
  empty.className = "chart-empty";
  empty.textContent = "연결된 값이 없습니다";
  container.append(empty);
}

function chartOptions(valueFormatter, tooltipDetail, rows, zeroLine) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 260 },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#201a15",
        titleFont: { family: FONT_FAMILY, size: 12 },
        bodyFont: { family: FONT_FAMILY, size: 12 },
        callbacks: {
          title: (items) => formatDate(items[0]?.label),
          label: (item) => `${item.dataset.label}: ${valueFormatter(item.raw)}${tooltipDetail?.(rows[item.dataIndex], item) || ""}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#685d50", font: { family: FONT_FAMILY, size: 12 }, maxTicksLimit: 8 },
        border: { color: "#ded3c2" },
      },
      y: {
        beginAtZero: true,
        grid: { color: zeroLine
          ? (context) => context.tick?.value === 0 ? "#685d50" : "rgba(104, 93, 80, 0.10)"
          : "rgba(104, 93, 80, 0.10)" },
        ticks: { color: "#685d50", font: { family: FONT_FAMILY, size: 12 } },
        border: { display: false },
      },
    },
  };
}

function renderAccessiblePoints(container, chart, rows, series, valueFormatter) {
  const controls = document.createElement("div");
  controls.className = "chart-accessible-points visually-hidden";
  rows.forEach((row, rowIndex) => series.forEach((item, datasetIndex) => {
    if (!finite(row[item.key])) return;
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-date", row.date);
    button.setAttribute("aria-label", `${formatDate(row.date)} ${item.label} ${valueFormatter(row[item.key])}`);
    button.addEventListener("focus", () => {
      const active = [{ datasetIndex, index: rowIndex }];
      chart.setActiveElements(active);
      chart.tooltip?.setActiveElements(active, { x: 0, y: 0 });
      chart.update();
    });
    button.addEventListener("click", () => focusLedgerRow(row.date));
    controls.append(button);
  }));
  container.append(controls);
}

function renderChart(container, { rows, series, valueFormatter, label, type, tooltipDetail, zeroLine }) {
  container.__chart?.destroy();
  container.replaceChildren();
  const hasValues = rows.some((row) => series.some((item) => finite(row[item.key])));
  if (!hasValues || !window.Chart) {
    emptyChart(container);
    return;
  }
  const wrap = document.createElement("div");
  wrap.className = "chart-canvas-wrap";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", label);
  wrap.append(canvas);
  container.append(wrap);
  const chart = new window.Chart(canvas, {
    type,
    data: {
      labels: rows.map((row) => row.date),
      datasets: series.map((item) => ({
        label: item.label,
        data: rows.map((row) => finite(row[item.key]) ? Number(row[item.key]) : null),
        borderColor: item.color,
        backgroundColor: type === "bar" ? `${item.color}bb` : item.color,
        pointBackgroundColor: "#fff",
        pointBorderColor: item.color,
        pointRadius: 3,
        pointHoverRadius: 6,
        borderWidth: 2,
        borderDash: item.borderDash || [],
        spanGaps: false,
        tension: .22,
      })),
    },
    options: chartOptions(valueFormatter, tooltipDetail, rows, zeroLine),
  });
  container.__chart = chart;
  renderAccessiblePoints(container, chart, rows, series, valueFormatter);
}

export function renderLineChart(container, options) {
  renderChart(container, { ...options, type: "line" });
}

export function renderBarChart(container, options) {
  renderChart(container, { ...options, type: "bar" });
}
