import { formatDate } from "./format.js?v=20260907-2";

export function renderDailyTable(container, { rows, columns, caption = "일별 상세 값" }) {
  container.replaceChildren();
  const details = document.createElement("details");
  details.className = "daily-details";
  const summary = document.createElement("summary");
  summary.append(
    document.createTextNode(`${caption} · 일별 상세 ${rows.length}일`),
    Object.assign(document.createElement("span"), { className: "details-action" }),
  );
  const scroller = document.createElement("div");
  scroller.className = "table-scroll";
  const table = document.createElement("table");
  table.className = "daily-table";
  const captionNode = document.createElement("caption");
  captionNode.textContent = caption;
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["날짜", ...columns.map((column) => column.label)].forEach((label) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);
  const tbody = document.createElement("tbody");
  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.tabIndex = -1;
    tr.setAttribute("data-date", row.date);
    const dateCell = document.createElement("th");
    dateCell.scope = "row";
    dateCell.textContent = formatDate(row.date);
    tr.append(dateCell);
    columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = column.format(row[column.key]);
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.append(captionNode, thead, tbody);
  scroller.append(table);
  details.append(summary, scroller);
  container.append(details);
}
