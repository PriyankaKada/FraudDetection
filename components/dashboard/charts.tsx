"use client";

import { useMemo } from "react";

import type { Priority, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function toDayKey(ms: number) {
  const d = new Date(ms);
  // local YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortDayLabel(key: string) {
  // key is YYYY-MM-DD
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RiskTrendChart({
  transactions,
  days = 14,
  className,
}: {
  transactions: Transaction[];
  days?: number;
  className?: string;
}) {
  const { labels, values, max } = useMemo(() => {
    const now = Date.now();
    const start = now - days * 24 * 60 * 60 * 1000;
    const map = new Map<string, { count: number; avgRisk: number }>();

    for (const t of transactions) {
      if (t.createdAt < start) continue;
      const k = toDayKey(t.createdAt);
      const prev = map.get(k);
      if (!prev) map.set(k, { count: 1, avgRisk: t.riskScore });
      else map.set(k, { count: prev.count + 1, avgRisk: prev.avgRisk + t.riskScore });
    }

    // Fill missing days with 0
    const filledLabels: string[] = [];
    const filledValues: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = toDayKey(dt.getTime());
      filledLabels.push(key);
      const v = map.get(key);
      filledValues.push(v ? v.avgRisk / v.count : 0);
    }

    const computedMax = Math.max(0.01, ...filledValues);
    return { labels: filledLabels, values: filledValues, max: computedMax };
  }, [transactions, days]);

  const points = values
    .map((v, idx) => {
      const x = (idx / Math.max(1, values.length - 1)) * 100;
      const y = 100 - clamp01(v / max) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const last = values[values.length - 1] ?? 0;

  return (
    <div className={cn("rounded-xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Avg risk trend</div>
          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Rolling daily average from last {days} days (client-side)
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold tabular-nums">{Math.round(last * 100)}%</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">latest</div>
        </div>
      </div>

      <div className="mt-4">
        <svg viewBox="0 0 100 100" className="h-28 w-full">
          <defs>
            <linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(24 24 27)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="rgb(24 24 27)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points={points}
            fill="none"
            stroke="rgb(24 24 27)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="dark:stroke-zinc-200"
          />
          <polygon
            points={`0,100 ${points} 100,100`}
            fill="url(#riskFill)"
            className="dark:hidden"
          />
        </svg>
        <div className="mt-2 flex justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>{shortDayLabel(labels[0] ?? "")}</span>
          <span>{shortDayLabel(labels[Math.floor(labels.length / 2)] ?? "")}</span>
          <span>{shortDayLabel(labels[labels.length - 1] ?? "")}</span>
        </div>
      </div>
    </div>
  );
}

const priorityOrder: Priority[] = ["critical", "high", "medium", "low"];
const priorityColors: Record<Priority, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-500",
  low: "bg-zinc-400",
};

export function PriorityBreakdown({
  transactions,
  className,
}: {
  transactions: Transaction[];
  className?: string;
}) {
  const counts = useMemo(() => {
    const c: Record<Priority, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const t of transactions) c[t.priority] += 1;
    return c;
  }, [transactions]);

  const total = priorityOrder.reduce((acc, p) => acc + counts[p], 0) || 1;

  return (
    <div className={cn("rounded-xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800", className)}>
      <div className="text-sm font-medium">Priority mix</div>
      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Distribution of current results</div>

      <div className="mt-4 space-y-2">
        {priorityOrder.map((p) => {
          const v = counts[p];
          const pct = (v / total) * 100;
          return (
            <div key={p} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">{p.toUpperCase()}</span>
                <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                  {v} ({pct.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
                <div className={cn("h-2 rounded-full", priorityColors[p])} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

