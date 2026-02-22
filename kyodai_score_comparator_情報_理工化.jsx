import React, { useMemo, useState } from "react";

// Data source: 代々木ゼミナール「京都大学 各種データ推移（合格者 最高点・最低点・平均点）」
// https://www.yozemi.ac.jp/nyushi/data/kyodai/kyodai_data_4.html
// Notes:
// - 2016〜2023は「工業化」、2024〜2025は「理工化」。本アプリでは同一系列として「理工化（旧 工業化）」に統一。
// - 満点（総点）は年度によって変わる（例：2025は1025）。

const COMMON_TEST_FIXED = 206.0; // /225 (京都大学工学部の傾斜後) ユーザー固定
const TARGET_TOTAL = 1025; // 比較用に全年度を1025点満点に正規化

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
} as const;

type DeptKey = keyof typeof DATA;

type ScoreRow = {
  year: number;
  maxTotal: number;
  min: number;
  avg: number;
  max: number;
};

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

function fmt(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function fmtSigned(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(digits)}`;
}

function pillClass(delta: number) {
  if (Number.isNaN(delta)) return "bg-slate-100 text-slate-700";
  if (delta >= 0) return "bg-emerald-100 text-emerald-800";
  return "bg-rose-100 text-rose-800";
}

type SecondRaw = {
  jp: number; // /100
  math: number; // /200
  eng: number; // /150
  phys: number; // /100
  chem: number; // /100
};

function computeSecondWeighted(raw: SecondRaw) {
  const vJp = clamp(Number(raw.jp), 0, 100);
  const vMath = clamp(Number(raw.math), 0, 200) * 1.25;
  const vEng = clamp(Number(raw.eng), 0, 150) * (200 / 150);
  const vPhys = clamp(Number(raw.phys), 0, 100) * 1.25;
  const vChem = clamp(Number(raw.chem), 0, 100) * 1.25;
  return vJp + vMath + vEng + vPhys + vChem;
}

function computeTotal(secondWeighted: number) {
  return COMMON_TEST_FIXED + secondWeighted;
}

function normalizeRowToTarget(row: ScoreRow): ScoreRow {
  // 2016〜2024はデータ上の満点が1000、2025は1025。
  // 全年度をTARGET_TOTAL基準にスケールして比較できるようにする。
  const factor = TARGET_TOTAL / row.maxTotal;
  return {
    ...row,
    maxTotal: TARGET_TOTAL,
    min: row.min * factor,
    avg: row.avg * factor,
    max: row.max * factor,
  };
}

function runSelfTestsOnce() {
  // Simple runtime tests (no Jest in this sandbox). These help catch regressions.
  try {
    const maxSecond = computeSecondWeighted({ jp: 100, math: 200, eng: 150, phys: 100, chem: 100 });
    console.assert(Math.abs(maxSecond - 800) < 1e-9, `maxSecond should be 800, got ${maxSecond}`);

    const negClamp = computeSecondWeighted({ jp: -10, math: -1, eng: -5, phys: -99, chem: -2 });
    console.assert(Math.abs(negClamp - 0) < 1e-9, `negative inputs should clamp to 0, got ${negClamp}`);

    const overClamp = computeSecondWeighted({ jp: 999, math: 999, eng: 999, phys: 999, chem: 999 });
    console.assert(Math.abs(overClamp - 800) < 1e-9, `over-max inputs should clamp to 800, got ${overClamp}`);

    const total = computeTotal(800);
    console.assert(Math.abs(total - 1006) < 1e-9, `total should be 206 + 800 = 1006, got ${total}`);

    const scaled = normalizeRowToTarget({ year: 2024, maxTotal: 1000, min: 100, avg: 200, max: 300 });
    console.assert(scaled.maxTotal === 1025, `normalized maxTotal should be 1025, got ${scaled.maxTotal}`);
    console.assert(Math.abs(scaled.min - 102.5) < 1e-9, `normalized min should be 102.5, got ${scaled.min}`);
    console.assert(Math.abs(scaled.avg - 205) < 1e-9, `normalized avg should be 205, got ${scaled.avg}`);
    console.assert(Math.abs(scaled.max - 307.5) < 1e-9, `normalized max should be 307.5, got ${scaled.max}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Self-tests failed:", e);
  }
}

let __didRunSelfTests = false;

export default function KyodaiScoreComparatorApp() {
  if (!__didRunSelfTests) {
    __didRunSelfTests = true;
    runSelfTestsOnce();
  }

  const [deptKey, setDeptKey] = useState<DeptKey>("info");

  // Inputs (素点)
  const [jp, setJp] = useState<number | "">(60);
  const [math, setMath] = useState<number | "">(120);
  const [eng, setEng] = useState<number | "">(90);
  const [phys, setPhys] = useState<number | "">(70);
  const [chem, setChem] = useState<number | "">(70);

  const dept = DATA[deptKey];

  const secondWeighted = useMemo(() => {
    return computeSecondWeighted({
      jp: jp === "" ? NaN : jp,
      math: math === "" ? NaN : math,
      eng: eng === "" ? NaN : eng,
      phys: phys === "" ? NaN : phys,
      chem: chem === "" ? NaN : chem,
    });
  }, [jp, math, eng, phys, chem]);

  const total = useMemo(() => computeTotal(secondWeighted), [secondWeighted]);

  const maxSecond = 100 + 250 + 200 + 125 + 125; // 800
  const maxTotalCurrent = TARGET_TOTAL; // 1025（全年度をこの満点に正規化して表示）

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">京大 工学部 合格点ギャップ計算</h1>
          <p className="mt-2 text-sm text-slate-600">
            共通テストは固定 {fmt(COMMON_TEST_FIXED, 2)} / 225。入力は二次の素点のみ（国語100・数学200・英語150・物理100・化学100）。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-slate-600">学科</div>
                <div className="mt-0.5 text-base font-medium">{dept.label}</div>
              </div>
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
                value={deptKey}
                onChange={(e) => setDeptKey(e.target.value as DeptKey)}
              >
                <option value="info">情報</option>
                <option value="chem">理工化（旧 工業化）</option>
              </select>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <ScoreInput label="国語" max={100} value={jp} onChange={setJp} />
              <ScoreInput label="数学" max={200} value={math} onChange={setMath} />
              <ScoreInput label="英語" max={150} value={eng} onChange={setEng} />
              <ScoreInput label="物理" max={100} value={phys} onChange={setPhys} />
              <ScoreInput label="化学" max={100} value={chem} onChange={setChem} />
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="text-xs text-slate-600">換算（二次）</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {fmt(secondWeighted, 2)} / {fmt(maxSecond, 0)}
                </div>
                <div className="mt-1 text-xs text-slate-600">数学×1.25、英語×4/3、物理×1.25、化学×1.25</div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
              <div className="text-xs text-slate-200">合計（共テ + 二次換算）</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {fmt(total, 2)} / {fmt(maxTotalCurrent, 0)}
              </div>
              <div className="mt-1 text-xs text-slate-200">※2016〜2024は1000点満点→1025点満点に正規化して表示（各点×1.025）</div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-sm text-slate-600">過去10年（2016〜2025）</div>
                <div className="mt-1 text-base font-medium">最低点・平均点・最高点との差</div>
              </div>
              <div className="text-xs text-slate-500">単位：点（あなたの合計 − 各指標）</div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-3 py-2">年度</th>
                    <th className="px-3 py-2">満点（総点）</th>
                    <th className="px-3 py-2">最低点</th>
                    <th className="px-3 py-2">最低点との差</th>
                    <th className="px-3 py-2">平均点</th>
                    <th className="px-3 py-2">平均との差</th>
                    <th className="px-3 py-2">最高点</th>
                    <th className="px-3 py-2">最高点との差</th>
                  </tr>
                </thead>
                <tbody>
                  {(dept.rows as unknown as ScoreRow[]).map((r) => {
                    const nr = normalizeRowToTarget(r);
                    const dMin = total - nr.min;
                    const dAvg = total - nr.avg;
                    const dMax = total - nr.max;
                    return (
                      <tr key={nr.year} className="rounded-xl bg-slate-50 ring-1 ring-slate-200">
                        <td className="px-3 py-3 text-sm font-medium">{nr.year}</td>
                        <td className="px-3 py-3 text-sm tabular-nums">{nr.maxTotal}</td>
                        <td className="px-3 py-3 text-sm tabular-nums">{fmt(nr.min, 2)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${pillClass(dMin)}`}
                          >
                            {fmtSigned(dMin, 2)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm tabular-nums">{fmt(nr.avg, 2)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${pillClass(dAvg)}`}
                          >
                            {fmtSigned(dAvg, 2)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm tabular-nums">{fmt(nr.max, 2)}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ${pillClass(dMax)}`}
                          >
                            {fmtSigned(dMax, 2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              データは「合格者 最高点・最低点・平均点（2016〜2025）」を転記。表示は比較のため全年度を1025点満点に正規化（2016〜2024は各点×1.025）。学科名は年度により「工業化」→「理工化」に表記変更。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ScoreInputProps = {
  label: string;
  max: number;
  value: number | "";
  onChange: (v: number | "") => void;
};

function ScoreInput({ label, max, value, onChange }: ScoreInputProps) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-600">{label}</div>
        <div className="text-[11px] text-slate-500">/ {max}</div>
      </div>
      <input
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums shadow-sm outline-none focus:ring-2 focus:ring-slate-300"
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
      <div className="mt-1 text-[11px] text-slate-500">素点のみ入力</div>
    </div>
  );
}
