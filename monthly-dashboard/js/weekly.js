const dayMs = 86400000;
const shift = (date, offset) => new Date(Date.parse(`${date}T00:00:00Z`) + offset * dayMs).toISOString().slice(0, 10);
const shortDate = (date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
const valid = (value) => value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0;

export function buildWeeklyEcpm(payload, country = 'KR') {
  if (country !== 'KR') return null;
  const data = payload.countries?.[country];
  const latest = data?.latestCompleteDate;
  if (!latest) return null;
  const weekday = new Date(`${latest}T00:00:00Z`).getUTCDay();
  const end = shift(latest, -((weekday + 5) % 7)); // Last completed Tuesday.
  const start = shift(end, -6), previousEnd = shift(end, -7), previousStart = shift(end, -13);
  const days = Object.values(data.months || {}).flatMap((month) => month.days || []);
  const index = new Map(days.map((day) => [day.date, day.metrics]));
  const specs = [
    ['전체', ['iv', 'rv', 'banner']], ['전면', ['iv']], ['보상형', ['rv']],
    ['배너', ['banner']], ['배너 제외', ['iv', 'rv']],
  ];
  function aggregate(from, formats) {
    let revenue = 0, impressions = 0;
    for (let n = 0; n < 7; n++) {
      const metrics = index.get(shift(from, n));
      if (!metrics) return null;
      for (const format of formats) {
        const income = metrics[`app_ad_gross_revenue_${format}_usd`];
        const views = metrics[`adpopcorn_impression_count_${format}`];
        if (!valid(income) || !valid(views)) return null;
        revenue += Number(income); impressions += Number(views);
      }
    }
    return impressions > 0 ? revenue * 1000 / impressions : null;
  }
  const rows = specs.map(([label, formats]) => ({ label, previous: aggregate(previousStart, formats), current: aggregate(start, formats) }));
  if (rows.some((row) => row.previous === null || row.current === null)) return null;
  return { start, end, previousStart, previousEnd, rows };
}

export function renderWeeklyEcpm(payload, country) {
  const section = document.querySelector('#weekly-ecpm');
  const report = buildWeeklyEcpm(payload, country);
  section.hidden = !report;
  if (!report) { section.replaceChildren(); return; }
  const { rows, end, start, previousStart, previousEnd } = report;
  const signed = (value, digits) => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(digits)}`;
  section.innerHTML = `<summary><strong>한국 앱 주간 eCPM · ${shortDate(end)} 기준</strong></summary>
    <div class="weekly-table-scroll"><table><caption>운영 6개 지면 · US$ / 노출 1,000회</caption>
    <thead><tr><th scope="col">구분</th><th scope="col">전주 ${shortDate(previousStart)}~${shortDate(previousEnd)}</th><th scope="col">이번 주 ${shortDate(start)}~${shortDate(end)}</th><th scope="col">전주 대비</th></tr></thead>
    <tbody>${rows.map((row) => `<tr><th scope="row">${row.label}</th><td>${row.previous.toFixed(3)}</td><td>${row.current.toFixed(3)}</td><td>${signed(row.current - row.previous, 3)} (${row.previous > 0 ? `${signed((row.current / row.previous - 1) * 100, 1)}%` : '비교 불가'})</td></tr>`).join('')}</tbody></table></div>
    <p class="source-note">수~화 7일 · 전체 매체·이용 국가 · MAX 제외 · 예상수입 기준으로 추후 조정될 수 있습니다.</p>`;
}
