const COMMON_TEST_FIXED = 206.0;
const TARGET_TOTAL = 1025;
const MAX_SECOND = 800;

const DATA = {
  info: {
    label: "工学部 情報学科",
    rows: [
      { year: 2025, maxTotal: 1025, min: 707.52, avg: 748.86, max: 843.87 },
      { year: 2024, maxTotal: 1000, min: 623.2, avg: 676.54, max: 778.08 },
      { year: 2023, maxTotal: 1000, min: 697.7, avg: 739.16, max: 836.45 },
      { year: 2022, maxTotal: 1000, min: 676.5, avg: 721.63, max: 829.5 },
      { year: 2021, maxTotal: 1000, min: 634.45, avg: 686.87, max: 808.5 },
      { year: 2020, maxTotal: 1000, min: 570.91, avg: 622.03, max: 795.76 },
      { year: 2019, maxTotal: 1000, min: 638.58, avg: 679.17, max: 766.1 },
      { year: 2018, maxTotal: 1000, min: 662.81, avg: 703.18, max: 788.76 },
      { year: 2017, maxTotal: 1000, min: 611.1, avg: 652.18, max: 750.66 },
      { year: 2016, maxTotal: 1000, min: 599.85, avg: 650.58, max: 817.88 },
    ],
  },
  chem: {
    label: "工学部 理工化学科（旧 工業化学科）",
    rows: [
      { year: 2025, maxTotal: 1025, min: 633.82, avg: 658.49, max: 796.28 },
      { year: 2024, maxTotal: 1000, min: 527.78, avg: 557.51, max: 692.87 },
      { year: 2023, maxTotal: 1000, min: 613.08, avg: 639.81, max: 763.45 },
      { year: 2022, maxTotal: 1000, min: 592.83, avg: 624.21, max: 781.95 },
      { year: 2021, maxTotal: 1000, min: 550.45, avg: 585.56, max: 795.0 },
      { year: 2020, maxTotal: 1000, min: 503.06, avg: 534.73, max: 729.73 },
      { year: 2019, maxTotal: 1000, min: 578.06, avg: 610.49, max: 746.56 },
      { year: 2018, maxTotal: 1000, min: 614.76, avg: 644.15, max: 774.06 },
      { year: 2017, maxTotal: 1000, min: 574.08, avg: 609.63, max: 723.56 },
      { year: 2016, maxTotal: 1000, min: 565.06, avg: 603.12, max: 739.25 },
    ],
  },
};

const refs = {
  commonFixed: document.getElementById("common-fixed"),
  deptKey: document.getElementById("dept-key"),
  deptLabel: document.getElementById("dept-label"),
  jp: document.getElementById("jp"),
  math: document.getElementById("math"),
  eng: document.getElementById("eng"),
  phys: document.getElementById("phys"),
  chem: document.getElementById("chem"),
  secondWeighted: document.getElementById("second-weighted"),
  total: document.getElementById("total"),
  scoreBody: document.getElementById("score-body"),
};

function clamp(n, lo, hi) {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function fmt(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function fmtSigned(n, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}`;
}

function normalizeRowToTarget(row) {
  const factor = TARGET_TOTAL / row.maxTotal;
  return {
    ...row,
    maxTotal: TARGET_TOTAL,
    min: row.min * factor,
    avg: row.avg * factor,
    max: row.max * factor,
  };
}

function readScore(input, max) {
  const value = Number(input.value);
  return clamp(value, 0, max);
}

function computeSecondWeighted() {
  const vJp = readScore(refs.jp, 100);
  const vMath = readScore(refs.math, 200) * 1.25;
  const vEng = readScore(refs.eng, 150) * (200 / 150);
  const vPhys = readScore(refs.phys, 100) * 1.25;
  const vChem = readScore(refs.chem, 100) * 1.25;
  return vJp + vMath + vEng + vPhys + vChem;
}

function computeTotal(secondWeighted) {
  return COMMON_TEST_FIXED + secondWeighted;
}

function pill(delta) {
  const klass = delta >= 0 ? "good" : "bad";
  return `<span class="pill ${klass}">${fmtSigned(delta, 2)}</span>`;
}

function renderRows(rows, total) {
  refs.scoreBody.innerHTML = rows
    .map((row) => {
      const nr = normalizeRowToTarget(row);
      const dMin = total - nr.min;
      const dAvg = total - nr.avg;
      const dMax = total - nr.max;
      return `
        <tr>
          <td data-label="年度">${nr.year}</td>
          <td data-label="満点（総点）">${nr.maxTotal}</td>
          <td data-label="最低点">${fmt(nr.min, 2)}</td>
          <td data-label="最低点との差">${pill(dMin)}</td>
          <td data-label="平均点">${fmt(nr.avg, 2)}</td>
          <td data-label="平均との差">${pill(dAvg)}</td>
          <td data-label="最高点">${fmt(nr.max, 2)}</td>
          <td data-label="最高点との差">${pill(dMax)}</td>
        </tr>
      `;
    })
    .join("");
}

function render() {
  const dept = DATA[refs.deptKey.value];
  const secondWeighted = computeSecondWeighted();
  const total = computeTotal(secondWeighted);

  refs.deptLabel.textContent = dept.label;
  refs.commonFixed.textContent = fmt(COMMON_TEST_FIXED, 2);
  refs.secondWeighted.textContent = `${fmt(secondWeighted, 2)} / ${fmt(MAX_SECOND, 0)}`;
  refs.total.textContent = `${fmt(total, 2)} / ${fmt(TARGET_TOTAL, 0)}`;
  renderRows(dept.rows, total);
}

function bindEvents() {
  refs.deptKey.addEventListener("change", render);
  [refs.jp, refs.math, refs.eng, refs.phys, refs.chem].forEach((el) => {
    el.addEventListener("input", render);
  });
}

bindEvents();
render();
