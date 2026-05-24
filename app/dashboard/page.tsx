"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import { toast } from "sonner";

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#10b981", gemini: "#3b82f6", anthropic: "#f59e0b",
};
const PROVIDER_ICONS: Record<string, string> = {
  openai: "🤖", gemini: "✨", anthropic: "🧠",
};
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const getColor = (k: string) => PROVIDER_COLORS[k.toLowerCase()] ?? "#8b5cf6";
const getIcon  = (k: string) => PROVIDER_ICONS[k.toLowerCase()]  ?? "🔌";
const cap      = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtCost  = (v: number) => `$${v.toFixed(4)}`;
const fmtNum   = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));

const THIS_YEAR    = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: THIS_YEAR - 2019 }, (_, i) => String(2020 + i));

type Preset = "today" | "7d" | "30d" | "thisMonth" | "lastMonth" | "custom";

interface UsageSummary {
  total_requests: number;
  total_tokens:   number;
  total_cost:     number;
  by_provider:    Record<string, { calls: number; tokens: number; cost: number }>;
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
}

function compareDates(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function fillRange(from: string, to: string, providers: string[], dataMap: Record<string, any>) {
  const result: any[] = [];
  let cur = from;
  while (compareDates(cur, to) <= 0) {
    const row = dataMap[cur] ?? null;
    const entry: any = { date: cur };
    for (const p of providers) {
      if (row == null) {
        entry[`${p}_tokens`]   = null;
        entry[`${p}_cost`]     = null;
        entry[`${p}_requests`] = null;
      } else {
        const tokens = row[`${p}_tokens`];
        const cost   = row[`${p}_cost`];
        const reqs   = row[`${p}_requests`];
        entry[`${p}_tokens`]   = (tokens != null && tokens > 0) ? tokens : null;
        entry[`${p}_cost`]     = (cost   != null && cost   > 0) ? cost   : null;
        entry[`${p}_requests`] = (reqs   != null && reqs   > 0) ? reqs   : null;
      }
    }
    result.push(entry);
    cur = addDays(cur, 1);
  }
  return result;
}

function computeRange(
  preset: Preset,
  selYear: string, selMonth: string, selDay: string,
  dataDates: string[],
  serverToday: string
) {
  const today = serverToday;
  if (preset === "today") return { from: today, to: today };
  if (preset === "7d")    return { from: addDays(today, -6),  to: today };
  if (preset === "30d")   return { from: addDays(today, -29), to: today };
  if (preset === "thisMonth") return { from: `${today.slice(0,7)}-01`, to: today };
  if (preset === "lastMonth") {
    const [y, m] = today.split("-").map(Number);
    const lastM  = m === 1 ? 12 : m - 1;
    const lastY  = m === 1 ? y - 1 : y;
    const lastDay = new Date(lastY, lastM, 0).getDate();
    const mm = String(lastM).padStart(2, "0");
    return { from: `${lastY}-${mm}-01`, to: `${lastY}-${mm}-${String(lastDay).padStart(2,"0")}` };
  }
  if (selYear && selMonth && selDay) return { from: `${selYear}-${selMonth}-${selDay}`, to: `${selYear}-${selMonth}-${selDay}` };
  if (selYear && selMonth) {
    const l = new Date(+selYear, +selMonth, 0).getDate();
    return { from: `${selYear}-${selMonth}-01`, to: `${selYear}-${selMonth}-${String(l).padStart(2,"0")}` };
  }
  if (selYear) return { from: `${selYear}-01-01`, to: `${selYear}-12-31` };
  if (dataDates.length) return { from: dataDates[0], to: dataDates[dataDates.length - 1] };
  return { from: today, to: today };
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <span style={{ fontSize: 40 }}>📭</span>
      <p style={{ color: "#94a3b8", fontSize: 15, margin: 0, fontWeight: 600 }}>No data for {label}</p>
      <p style={{ color: "#cbd5e1", fontSize: 12, margin: 0 }}>Try a different date range</p>
    </div>
  );
}

function HoverTooltip({ data, hovIdx, providers, activeProviders }: {
  data: any[]; hovIdx: number | null; providers: string[]; activeProviders: string[];
}) {
  if (hovIdx == null || !data[hovIdx]) return null;
  const row = data[hovIdx];
  const visProv = providers.filter(p =>
    activeProviders.includes(p) &&
    ((row[`${p}_tokens`] ?? 0) > 0 || (row[`${p}_requests`] ?? 0) > 0)
  );
  if (!visProv.length) return null;
  return (
    <div style={{
      background: "#1e293b", borderRadius: 12, padding: "12px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)", color: "#fff",
      marginTop: 10, display: "inline-flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start",
    }}>
      <p style={{ margin: 0, color: "#94a3b8", fontSize: 11, fontWeight: 700, alignSelf: "center", whiteSpace: "nowrap" }}>
        📅 {row.date}
      </p>
      {visProv.map(p => (
        <div key={p} style={{ borderLeft: `3px solid ${getColor(p)}`, paddingLeft: 10 }}>
          <p style={{ margin: "0 0 5px", fontWeight: 700, color: getColor(p), fontSize: 13 }}>
            {getIcon(p)} {cap(p)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12 }}>🔢 <strong>{(row[`${p}_tokens`] ?? 0).toLocaleString()}</strong> tokens</span>
            <span style={{ fontSize: 12 }}>💰 <strong>{fmtCost(row[`${p}_cost`] ?? 0)}</strong></span>
            <span style={{ fontSize: 12 }}>📡 <strong>{row[`${p}_requests`] ?? 0}</strong> req</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MetricPanel({ data, providers, activeProviders, metricKey, formatY, hovIdx, setHovIdx, showXAxis }: {
  data: any[]; providers: string[]; activeProviders: string[];
  metricKey: string; formatY: (v: number) => string;
  hovIdx: number | null; setHovIdx: (i: number | null) => void; showXAxis: boolean;
}) {
  const W = 840, PL = 68, PR = 20, PT = 14;
  const PB = showXAxis ? 38 : 14;
  const H  = showXAxis ? 155 : 125;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const visProv = providers.filter(p => activeProviders.includes(p));
  const n = data.length;

  let maxVal = 0;
  for (const row of data)
    for (const p of visProv) {
      const v = row[`${p}_${metricKey}`];
      if (v != null && v > maxVal) maxVal = v;
    }
  if (maxVal === 0) return null;

  const mag  = Math.pow(10, Math.floor(Math.log10(maxVal || 1)));
  const yMax = metricKey === "cost"
    ? parseFloat((maxVal * 1.4).toFixed(6))
    : Math.ceil((maxVal * 1.4) / mag) * mag;

  // ✅ FIX: when only 1 data point, place it at LEFT (index 0 = PL), not right
  // For multiple points: spread evenly across full chart width
  const xScale = (i: number): number => {
    if (n === 1) return PL + chartW * 0.1; // single point → near left (10% in)
    return PL + (i / (n - 1)) * chartW;
  };
  const yScale = (v: number) => PT + chartH - (v / yMax) * chartH;

  const yTicks = 3;
  const step   = Math.max(1, Math.floor(n / 10));
  const xTickIdxs = showXAxis
    ? data.map((_, i) => i).filter(i => i % step === 0 || i === n - 1)
    : [];

  // Collect points with actual data for a provider
  function getPoints(p: string) {
    const pts: { i: number; v: number; x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const v = data[i][`${p}_${metricKey}`];
      if (v != null && v > 0) pts.push({ i, v, x: xScale(i), y: yScale(v) });
    }
    return pts;
  }

  // Build SVG path — gaps where null
  function buildPath(p: string) {
    let d = ""; let pen = false;
    for (let i = 0; i < n; i++) {
      const v = data[i][`${p}_${metricKey}`];
      if (v == null) { pen = false; continue; }
      const x = xScale(i), y = yScale(v);
      d += pen ? `L ${x} ${y} ` : `M ${x} ${y} `;
      pen = true;
    }
    return d;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}
      onMouseLeave={() => setHovIdx(null)}>

      {/* Chart background */}
      <rect x={PL} y={PT} width={chartW} height={chartH} fill="#fafafa" rx={3} />

      {/* Y-axis grid lines + labels */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = (i / yTicks) * yMax;
        const y = yScale(v);
        return (
          <g key={i}>
            <line x1={PL} y1={y} x2={W - PR} y2={y}
              stroke={i === 0 ? "#d4d4d8" : "#e4e4e7"}
              strokeDasharray={i === 0 ? "none" : "4 3"} strokeWidth={1} />
            <text x={PL - 5} y={y + 4} textAnchor="end" fontSize={10} fill="#a1a1aa">
              {formatY(v)}
            </text>
          </g>
        );
      })}

      {/* X-axis date labels */}
      {xTickIdxs.map(i => (
        <text key={i} x={xScale(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">
          {data[i].date.slice(5)}
        </text>
      ))}

      {/* Area fill — only for providers with 2+ points */}
      {visProv.map(p => {
        const pts = getPoints(p);
        if (pts.length < 2) return null;
        const base = PT + chartH;
        let d = `M ${pts[0].x} ${base} `;
        for (const pt of pts) d += `L ${pt.x} ${pt.y} `;
        d += `L ${pts[pts.length - 1].x} ${base} Z`;
        return <path key={`area-${p}`} d={d} fill={getColor(p)} opacity={0.07} />;
      })}

      {/* Lines — only for providers with 2+ points */}
      {visProv.map(p => {
        const pts = getPoints(p);
        if (pts.length < 2) return null;
        return (
          <path key={`line-${p}`} d={buildPath(p)}
            fill="none" stroke={getColor(p)} strokeWidth={2.5}
            strokeLinejoin="round" strokeLinecap="round" />
        );
      })}

      {/* Dots on every data point */}
      {visProv.map(p =>
        getPoints(p).map(({ i, x, y }) => (
          <circle key={`dot-${p}-${i}`}
            cx={x} cy={y}
            r={hovIdx === i ? 7 : 5}
            fill={getColor(p)} stroke="#fff" strokeWidth={2} />
        ))
      )}

      {/* Value badge — shown only when provider has exactly 1 data point */}
      {visProv.map(p => {
        const pts = getPoints(p);
        if (pts.length !== 1) return null;
        const { x, y, v } = pts[0];
        const label = formatY(v);
        const badgeW = label.length * 7 + 14;
        return (
          <g key={`badge-${p}`}>
            <rect x={x - badgeW / 2} y={y - 26} width={badgeW} height={17} rx={4}
              fill={getColor(p)} opacity={0.92} />
            <text x={x} y={y - 14} textAnchor="middle" fontSize={10}
              fill="#fff" fontWeight={700}>
              {label}
            </text>
            {/* Vertical line from badge to dot */}
            <line x1={x} y1={y - 9} x2={x} y2={y - 5}
              stroke={getColor(p)} strokeWidth={1.5} />
          </g>
        );
      })}

      {/* Invisible hover hit areas */}
      {data.map((_, i) => (
        <rect key={`hit-${i}`}
          x={xScale(i) - (n === 1 ? chartW * 0.15 : chartW / n / 2)}
          y={PT}
          width={n === 1 ? chartW * 0.3 : chartW / n}
          height={chartH}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseEnter={() => setHovIdx(i)} />
      ))}

      {/* Hover crosshair */}
      {hovIdx != null && (
        <line x1={xScale(hovIdx)} y1={PT} x2={xScale(hovIdx)} y2={PT + chartH}
          stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3" />
      )}
    </svg>
  );
}

function TrendLinesView({ data, providers, activeProviders, label }: {
  data: any[]; providers: string[]; activeProviders: string[]; label: string;
}) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const visProv = providers.filter(p => activeProviders.includes(p));
  const hasAnyData = visProv.some(p => data.some(r => (r[`${p}_tokens`] ?? 0) > 0));
  if (!hasAnyData) return <EmptyState label={label} />;

  const PANELS = [
    { key: "tokens",   label: "TOKENS",   formatY: (v: number) => fmtNum(v) },
    { key: "cost",     label: "COST ($)", formatY: (v: number) => v === 0 ? "$0" : `$${v.toFixed(3)}` },
    { key: "requests", label: "REQUESTS", formatY: (v: number) => String(Math.round(v)) },
  ];
  const activePanels = PANELS.filter(panel =>
    visProv.some(p => data.some(r => (r[`${p}_${panel.key}`] ?? 0) > 0))
  );

  return (
    <div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginBottom: 10, flexWrap: "wrap" }}>
        {visProv.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <span style={{ width: 22, height: 3, background: getColor(p), borderRadius: 2, display: "inline-block" }} />
            <span style={{ color: "#475569", fontWeight: 500 }}>{getIcon(p)} {cap(p)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex" }}>
        {/* Y-axis panel labels */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {activePanels.map((panel, idx) => (
            <div key={panel.key} style={{
              writingMode: "vertical-rl", transform: "rotate(180deg)",
              fontSize: 10, fontWeight: 700, color: "#64748b",
              textTransform: "uppercase", letterSpacing: 1,
              height: idx === activePanels.length - 1 ? 155 : 125,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderBottom: idx < activePanels.length - 1 ? "1px solid #e2e8f0" : "none",
            }}>
              {panel.label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, borderLeft: "2px solid #e2e8f0" }}>
          {activePanels.map((panel, idx) => (
            <div key={panel.key} style={{
              borderBottom: idx < activePanels.length - 1 ? "1px solid #e2e8f0" : "none",
            }}>
              <MetricPanel
                data={data} providers={providers} activeProviders={activeProviders}
                metricKey={panel.key} formatY={panel.formatY}
                hovIdx={hovIdx} setHovIdx={setHovIdx}
                showXAxis={idx === activePanels.length - 1}
              />
            </div>
          ))}
        </div>
      </div>

      <HoverTooltip data={data} hovIdx={hovIdx} providers={providers} activeProviders={activeProviders} />
    </div>
  );
}

function DailyBarChart({ data, providers, activeProviders, label }: {
  data: any[]; providers: string[]; activeProviders: string[]; label: string;
}) {
  const [hovIdx, setHovIdx] = useState<number | null>(null);
  const W = 840, H = 340, PL = 68, PR = 20, PT = 28, PB = 52;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const visProv = providers.filter(p => activeProviders.includes(p));

  let maxVal = 0;
  for (const row of data)
    for (const p of visProv) {
      const v = row[`${p}_tokens`] ?? 0;
      if (v > maxVal) maxVal = v;
    }
  if (maxVal === 0) return <EmptyState label={label} />;

  const yMax     = Math.ceil((maxVal * 1.3) / 100) * 100;
  const yScale   = (v: number) => PT + chartH - (v / yMax) * chartH;
  const yTicks   = 5;
  const groupW   = chartW / Math.max(data.length, 1);
  const barW     = Math.min(40, (groupW * 0.85) / Math.max(visProv.length, 1));
  const groupPad = (groupW - barW * visProv.length) / 2;
  const step     = Math.max(1, Math.floor(data.length / 12));
  const xTicks   = data.map((_, i) => i).filter(i => i % step === 0 || i === data.length - 1);

  return (
    <div>
      <div style={{ display: "flex", gap: 20, marginBottom: 10, flexWrap: "wrap" }}>
        {visProv.map(p => (
          <div key={p} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: getColor(p), display: "inline-block" }} />
            <span style={{ color: "#475569", fontWeight: 500 }}>{getIcon(p)} {cap(p)}</span>
          </div>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}
        onMouseLeave={() => setHovIdx(null)}>

        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = (i / yTicks) * yMax;
          const y = yScale(v);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y}
                stroke="#e4e4e7" strokeDasharray={i === 0 ? "none" : "4 3"} strokeWidth={1} />
              <text x={PL - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#a1a1aa">{fmtNum(v)}</text>
            </g>
          );
        })}

        {xTicks.map(i => (
          <text key={i} x={PL + i * groupW + groupW / 2} y={H - 10}
            textAnchor="middle" fontSize={10} fill="#94a3b8">
            {data[i].date.slice(5)}
          </text>
        ))}

        {data.map((row, gi) => {
          const gx    = PL + gi * groupW + groupPad;
          const isHov = hovIdx === gi;
          return (
            <g key={gi} onMouseEnter={() => setHovIdx(gi)} style={{ cursor: "pointer" }}>
              {visProv.map((p, pi) => {
                const v  = row[`${p}_tokens`] ?? 0;
                const bx = gx + pi * barW;
                const by = yScale(v);
                const bh = Math.max(chartH - (by - PT), 0);
                return (
                  <g key={p}>
                    <rect x={bx} y={by} width={barW - 2} height={bh}
                      fill={getColor(p)} rx={3}
                      opacity={hovIdx != null && !isHov ? 0.25 : 0.9} />
                    {v > 0 && isHov && (
                      <text x={bx + (barW - 2) / 2} y={by - 5}
                        textAnchor="middle" fontSize={10} fill={getColor(p)} fontWeight={700}>
                        {fmtNum(v)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="#d4d4d8" strokeWidth={1} />
      </svg>
      <HoverTooltip data={data} hovIdx={hovIdx} providers={providers} activeProviders={activeProviders} />
    </div>
  );
}

function PeriodSummary({ data, providers, activeProviders }: {
  data: any[]; providers: string[]; activeProviders: string[];
}) {
  const visProv = providers.filter(p => activeProviders.includes(p));
  const totals  = visProv.map(p => ({
    p,
    tokens:   data.reduce((s, r) => s + (r[`${p}_tokens`]   ?? 0), 0),
    cost:     data.reduce((s, r) => s + (r[`${p}_cost`]     ?? 0), 0),
    requests: data.reduce((s, r) => s + (r[`${p}_requests`] ?? 0), 0),
  })).filter(t => t.tokens > 0 || t.requests > 0);
  if (!totals.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, alignSelf: "center", textTransform: "uppercase", letterSpacing: 1 }}>
        Period totals:
      </span>
      {totals.map(t => (
        <div key={t.p} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f8fafc", borderRadius: 10, padding: "8px 16px", border: `1.5px solid ${getColor(t.p)}44` }}>
          <span style={{ fontSize: 20 }}>{getIcon(t.p)}</span>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: getColor(t.p) }}>{cap(t.p)}</p>
            <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
              <span style={{ fontSize: 12, color: "#475569" }}>🔢 <strong>{t.tokens.toLocaleString()}</strong></span>
              <span style={{ fontSize: 12, color: "#475569" }}>💰 <strong>{fmtCost(t.cost)}</strong></span>
              <span style={{ fontSize: 12, color: "#475569" }}>📡 <strong>{t.requests}</strong> req</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CustomPicker({ selYear, selMonth, selDay, dataDates, setSelYear, setSelMonth, setSelDay }: any) {
  const [showMonthGrid, setShowMonthGrid] = useState(false);
  const [showDayGrid,   setShowDayGrid]   = useState(false);

  const daysWithData = useMemo(() => {
    if (!selYear || !selMonth) return [];
    const pfx = `${selYear}-${selMonth}`;
    return dataDates.filter((d: string) => d.startsWith(pfx)).map((d: string) => d.slice(8, 10));
  }, [dataDates, selYear, selMonth]);

  const daysInMonth = selYear && selMonth ? new Date(+selYear, +selMonth, 0).getDate() : 31;
  const firstDow    = selYear && selMonth ? new Date(+selYear, +selMonth - 1, 1).getDay() : 0;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 10, padding: "7px 12px", border: "1px solid #e2e8f0" }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>📅</span>
      <select value={selYear} onChange={e => { setSelYear(e.target.value); setSelMonth(""); setSelDay(""); }}
        style={{ fontSize: 13, padding: "4px 8px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}>
        <option value="">All Years</option>
        {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      {selYear && (
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowMonthGrid((v: boolean) => !v); setShowDayGrid(false); }}
            style={{ fontSize: 13, padding: "4px 10px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: selMonth ? "#1e293b" : "#94a3b8", cursor: "pointer" }}>
            {selMonth ? MONTH_FULL[+selMonth - 1] : "Month"} ▾
          </button>
          {showMonthGrid && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 99, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 14, width: 230 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>Month — {selYear}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                {MONTH_NAMES.map((m, i) => {
                  const mm      = String(i + 1).padStart(2, "0");
                  const hasData = dataDates.some((d: string) => d.startsWith(`${selYear}-${mm}`));
                  return (
                    <button key={m} onClick={() => { setSelMonth(mm); setSelDay(""); setShowMonthGrid(false); }}
                      style={{ padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, position: "relative",
                        background: selMonth === mm ? "#1e293b" : hasData ? "#f0fdf4" : "#f8fafc",
                        color:      selMonth === mm ? "#fff"    : hasData ? "#16a34a" : "#94a3b8" }}>
                      {m}
                      {hasData && selMonth !== mm && (
                        <span style={{ position: "absolute", top: 3, right: 4, width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                      )}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => { setSelMonth(""); setSelDay(""); setShowMonthGrid(false); }}
                style={{ marginTop: 8, width: "100%", padding: "5px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}
      {selYear && selMonth && (
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowDayGrid((v: boolean) => !v); setShowMonthGrid(false); }}
            style={{ fontSize: 13, padding: "4px 10px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", color: selDay ? "#1e293b" : "#94a3b8", cursor: "pointer" }}>
            {selDay ? `${selDay} ${MONTH_NAMES[+selMonth - 1]}` : "Day"} ▾
          </button>
          {showDayGrid && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 99, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: 14, width: 250 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>{MONTH_FULL[+selMonth - 1]} {selYear}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
                {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dd      = String(i + 1).padStart(2, "0");
                  const hasData = daysWithData.includes(dd);
                  const isSel   = selDay === dd;
                  return (
                    <button key={dd} onClick={() => { setSelDay(dd); setShowDayGrid(false); }}
                      style={{ padding: "6px 2px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: hasData ? 600 : 400, position: "relative",
                        background: isSel ? "#1e293b" : hasData ? "#f0fdf4" : "#f8fafc",
                        color:      isSel ? "#fff"    : hasData ? "#16a34a" : "#94a3b8" }}>
                      {i + 1}
                      {hasData && !isSel && (
                        <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#10b981" }} />
                      )}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => { setSelDay(""); setShowDayGrid(false); }}
                style={{ marginTop: 8, width: "100%", padding: "5px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, color: "#64748b", cursor: "pointer" }}>
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary,         setSummary]        = useState<UsageSummary | null>(null);
  const [allChartData,    setAllChartData]    = useState<any[]>([]);
  const [providers,       setProviders]       = useState<string[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [activeProviders, setActiveProviders] = useState<string[]>([]);
  const [preset,          setPreset]          = useState<Preset>("7d");
  const [selYear,         setSelYear]         = useState("");
  const [selMonth,        setSelMonth]        = useState("");
  const [selDay,          setSelDay]          = useState("");
  const [chartMode,       setChartMode]       = useState<"line" | "bar">("line");
  const [serverToday,     setServerToday]     = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sRes, hRes] = await Promise.all([
        API.get("/usage/stats"),
        API.get("/usage/history"),
      ]);
      setSummary(sRes.data);
      const today = hRes.data.server_today as string;
      setServerToday(today);
      const rawChart: any[]    = hRes.data.chart     ?? [];
      const rawProv:  string[] = hRes.data.providers ?? [];
      const clean = rawChart.map((row: any) => {
        const r: any = { date: row.date };
        for (const p of rawProv) {
          r[`${p}_tokens`]   = row[`${p}_tokens`]   ?? null;
          r[`${p}_cost`]     = row[`${p}_cost`]     ?? null;
          r[`${p}_requests`] = row[`${p}_requests`] ?? null;
        }
        return r;
      });
      setAllChartData(clean);
      setProviders(rawProv);
      setActiveProviders(rawProv);
    } catch (err: any) {
      if (err?.response?.status === 401) { localStorage.removeItem("token"); router.push("/login"); }
      else toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const dataMap = useMemo(() => {
    const m: Record<string, any> = {};
    for (const r of allChartData) m[r.date] = r;
    return m;
  }, [allChartData]);

  const dataDates = useMemo(
    () => allChartData.map(r => r.date as string).sort(),
    [allChartData]
  );

  const { from, to } = useMemo(() => {
    if (!serverToday) return { from: "", to: "" };
    return computeRange(preset, selYear, selMonth, selDay, dataDates, serverToday);
  }, [preset, selYear, selMonth, selDay, dataDates, serverToday]);

  const filteredData = useMemo(
    () => (from && to && dataDates.length) ? fillRange(from, to, providers, dataMap) : [],
    [from, to, providers, dataMap, dataDates]
  );

  const toggleProvider = (p: string) =>
    setActiveProviders(prev =>
      prev.includes(p)
        ? (prev.length > 1 ? prev.filter(x => x !== p) : prev)
        : [...prev, p]
    );

  const filterLabel = useMemo(() => {
    if (!serverToday) return "";
    if (preset === "today")     return `Today (${serverToday})`;
    if (preset === "7d")        return "Last 7 Days";
    if (preset === "30d")       return "Last 30 Days";
    if (preset === "thisMonth") return "This Month";
    if (preset === "lastMonth") return "Last Month";
    if (selYear && selMonth && selDay) return `${selDay} ${MONTH_FULL[+selMonth - 1]} ${selYear}`;
    if (selYear && selMonth)           return `${MONTH_FULL[+selMonth - 1]} ${selYear}`;
    if (selYear)                       return `Year ${selYear}`;
    return "All time";
  }, [preset, selYear, selMonth, selDay, serverToday]);

  if (loading || !serverToday) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
      <p style={{ color: "#94a3b8", fontSize: 16 }}>Loading dashboard...</p>
    </div>
  );

  const providerList = summary?.by_provider
    ? Object.entries(summary.by_provider).map(([k, v]) => ({ key: k, ...v }))
    : [];

  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", padding: "20px 24px",
  };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: 18 }}>🔐 TokenWatch</span>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a href="/dashboard/keys"   style={{ fontSize: 14, color: "#475569", textDecoration: "none" }}>API Keys</a>
          <a href="/dashboard/alerts" style={{ fontSize: 14, color: "#475569", textDecoration: "none" }}>Alerts</a>
          <button
            onClick={() => { localStorage.removeItem("token"); toast.success("Logged out"); router.push("/login"); }}
            style={{ fontSize: 14, padding: "6px 16px", borderRadius: 8, border: "none", background: "#1e293b", color: "#fff", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1020, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Dashboard</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>
            API usage overview — server date: <strong>{serverToday}</strong>
          </p>
        </div>

        {/* Top 3 stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Requests", value: String(summary?.total_requests ?? 0),         sub: "all time" },
            { label: "Total Tokens",   value: (summary?.total_tokens ?? 0).toLocaleString(), sub: "all time" },
            { label: "Total Cost",     value: `$${(summary?.total_cost ?? 0).toFixed(4)}`,   sub: "all time" },
          ].map(c => (
            <div key={c.label} style={card}>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>{c.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, margin: "6px 0 4px" }}>{c.value}</p>
              <p style={{ color: "#cbd5e1", fontSize: 11, margin: 0 }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Provider cards */}
        {providerList.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
            {providerList.map(p => (
              <div key={p.key} style={{ ...card, borderLeft: `4px solid ${getColor(p.key)}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{getIcon(p.key)}</span>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{cap(p.key)}</span>
                </div>
                {[
                  { label: "Requests", val: String(p.calls) },
                  { label: "Tokens",   val: p.tokens.toLocaleString() },
                  { label: "Cost",     val: fmtCost(p.cost), color: getColor(p.key) },
                ].map(r => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span style={{ color: "#94a3b8" }}>{r.label}</span>
                    <span style={{ fontWeight: 600, color: r.color ?? "#1e293b" }}>{r.val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Chart card */}
        <div style={{ ...card, padding: "24px" }}>
          {/* Row 1: mode toggle + date presets */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
              {([
                { v: "line", l: "📈 Trend Lines" },
                { v: "bar",  l: "📊 Daily Usage"  },
              ] as { v: "line" | "bar"; l: string }[]).map(opt => (
                <button key={opt.v} onClick={() => setChartMode(opt.v)}
                  style={{ fontSize: 13, padding: "8px 18px", border: "none", cursor: "pointer", fontWeight: 600,
                    background: chartMode === opt.v ? "#1e293b" : "#fff",
                    color:      chartMode === opt.v ? "#fff"    : "#64748b" }}>
                  {opt.l}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {([
                { v: "today",     l: "Today"      },
                { v: "7d",        l: "7 Days"      },
                { v: "30d",       l: "30 Days"     },
                { v: "thisMonth", l: "This Month"  },
                { v: "lastMonth", l: "Last Month"  },
                { v: "custom",    l: "📅 Custom"   },
              ] as { v: Preset; l: string }[]).map(opt => (
                <button key={opt.v}
                  onClick={() => { setPreset(opt.v); if (opt.v !== "custom") { setSelYear(""); setSelMonth(""); setSelDay(""); } }}
                  style={{ fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 500,
                    background: preset === opt.v ? "#1e293b" : "#fff",
                    color:      preset === opt.v ? "#fff"    : "#64748b",
                    border:     preset === opt.v ? "1px solid #1e293b" : "1px solid #e2e8f0" }}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: provider pills + custom picker + label */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 10, padding: "7px 14px", border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Show:</span>
              {providers.map(p => (
                <button key={p} onClick={() => toggleProvider(p)}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontWeight: 600,
                    background: activeProviders.includes(p) ? `${getColor(p)}18` : "#fff",
                    color:      activeProviders.includes(p) ? getColor(p)        : "#94a3b8",
                    border:     `1.5px solid ${activeProviders.includes(p) ? getColor(p) : "#e2e8f0"}` }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                    background: activeProviders.includes(p) ? getColor(p) : "#cbd5e1" }} />
                  {cap(p)}
                </button>
              ))}
            </div>
            {preset === "custom" && (
              <CustomPicker selYear={selYear} selMonth={selMonth} selDay={selDay} dataDates={dataDates}
                setSelYear={setSelYear} setSelMonth={setSelMonth} setSelDay={setSelDay} />
            )}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", background: "#f1f5f9", padding: "5px 12px", borderRadius: 20, fontWeight: 500 }}>
              📅 {filterLabel}
            </span>
          </div>

          {/* Chart */}
          {chartMode === "line" ? (
            <TrendLinesView data={filteredData} providers={providers} activeProviders={activeProviders} label={filterLabel} />
          ) : (
            <DailyBarChart data={filteredData} providers={providers} activeProviders={activeProviders} label={filterLabel} />
          )}

          <PeriodSummary data={filteredData} providers={providers} activeProviders={activeProviders} />
        </div>
      </main>
    </div>
  );
}