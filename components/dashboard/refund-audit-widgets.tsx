"use client";

import { useMemo } from "react";

import type { Priority, Transaction } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

function IconSparkles() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l1.2 3.9L17 7l-3.8 1.1L12 12l-1.2-3.9L7 7l3.8-1.1L12 2z" />
      <path d="M5 12l.8 2.6L8.5 15l-2.7.8L5 18l-.8-2.2L1.5 15l2.7-.4L5 12z" />
      <path d="M19 13l.7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13z" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.1V12a10 10 0 1 1-6-9.2" />
      <path d="M22 4 12 14l-3-3" />
    </svg>
  );
}

function IconWarn() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.3l-7.1 12.3A2 2 0 0 0 5 20h14a2 2 0 0 0 1.8-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

function kpiNumber(n: number) {
  return Intl.NumberFormat(undefined).format(n);
}

export function KpiRow({ transactions }: { transactions: Transaction[] }) {
  const { total, reviewed, progressPct, highPriority } = useMemo(() => {
    const totalTx = transactions.length;
    const reviewedTx = transactions.filter((t) => t.status === "reviewed" || t.status === "escalated").length;
    const high = transactions.filter((t) => t.priority === "high" || t.priority === "critical").length;
    const pct = totalTx === 0 ? 0 : Math.round((reviewedTx / totalTx) * 100);
    return { total: totalTx, reviewed: reviewedTx, progressPct: pct, highPriority: high };
  }, [transactions]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard title="RECOMMENDED" value={kpiNumber(total)} icon={<IconSparkles />} />
      <KpiCard title="REVIEWED" value={kpiNumber(reviewed)} icon={<IconCheckCircle />} />
      <KpiProgressCard title="PROGRESS" value={`${progressPct}%`} pct={progressPct} />
      <KpiCard title="HIGH PRIORITY" value={kpiNumber(highPriority)} icon={<IconWarn />} accent="danger" />
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent?: "danger";
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 shadow-sm dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          {title}
        </div>
        <div
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1",
            accent === "danger"
              ? "bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50"
              : "bg-zinc-50 text-zinc-700 ring-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-200 dark:ring-zinc-800"
          )}
        >
          {icon}
        </div>
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tracking-tight", accent === "danger" && "text-red-600 dark:text-red-300")}>
        {value}
      </div>
    </div>
  );
}

function KpiProgressCard({ title, value, pct }: { title: string; value: string; pct: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 shadow-sm dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400">{title}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">↗</div>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-3 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
        <div className="h-2 rounded-full bg-violet-600" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

function topN<T extends string>(counts: Record<T, number>, n: number) {
  const entries = Object.entries(counts) as Array<[T, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, n);
}

function countBy<T extends string>(values: Array<T | undefined>, fallback: T) {
  const out = {} as Record<T, number>;
  for (const v of values) {
    const key = (v ?? fallback) as T;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export function ByWarehouseCard({
  transactions,
  selectedWarehouse,
  onSelectWarehouse,
}: {
  transactions: Transaction[];
  selectedWarehouse: string | null;
  onSelectWarehouse: (warehouseId: string | null) => void;
}) {
  const rows = useMemo(() => {
    const counts = countBy(transactions.map((t) => t.warehouseId), "UNKNOWN" as any);
    return topN(counts as Record<string, number>, 6);
  }, [transactions]);

  const max = Math.max(1, ...rows.map(([, v]) => v));

  return (
    <MiniCard title="By Warehouse" subtitle={`Top ${rows.length}`}>
      <div className="space-y-2">
        {rows.map(([label, v]) => {
          const active = selectedWarehouse === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectWarehouse(active ? null : label)}
              className={cn(
                "w-full rounded-xl p-2 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40",
                active && "bg-violet-50 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:ring-violet-900/50"
              )}
              aria-pressed={active}
            >
              <BarRow label={label} value={v} max={max} colorClass="bg-violet-600" />
            </button>
          );
        })}
      </div>
    </MiniCard>
  );
}

export function ByItemCard({
  transactions,
  selectedItem,
  onSelectItem,
}: {
  transactions: Transaction[];
  selectedItem: string | null;
  onSelectItem: (itemId: string | null) => void;
}) {
  const rows = useMemo(() => {
    const counts = countBy(transactions.map((t) => t.itemId), "000000" as any);
    return topN(counts as Record<string, number>, 5);
  }, [transactions]);

  const max = Math.max(1, ...rows.map(([, v]) => v));

  return (
    <MiniCard title="By Item" subtitle={`Top ${rows.length}`}>
      <div className="space-y-2">
        {rows.map(([label, v]) => {
          const active = selectedItem === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelectItem(active ? null : label)}
              className={cn(
                "w-full rounded-xl p-2 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40",
                active && "bg-violet-50 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:ring-violet-900/50"
              )}
              aria-pressed={active}
            >
              <BarRow label={label} value={v} max={max} colorClass="bg-violet-600" />
            </button>
          );
        })}
      </div>
    </MiniCard>
  );
}

export function ByOperatorCard({
  transactions,
  selectedOperator,
  onSelectOperator,
}: {
  transactions: Transaction[];
  selectedOperator: string | null;
  onSelectOperator: (operatorId: string | null) => void;
}) {
  const { rows, total } = useMemo(() => {
    const counts = countBy(transactions.map((t) => t.operatorId), "OP0000" as any);
    const top = topN(counts as Record<string, number>, 4);
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
    return { rows: top, total: Math.max(1, totalCount) };
  }, [transactions]);

  const colors = ["#7c3aed", "#14b8a6", "#60a5fa", "#f59e0b"];
  const slices = rows.map(([, v], idx) => ({ v, color: colors[idx % colors.length] }));

  return (
    <MiniCard title="By Operator" subtitle={`Top ${rows.length}`}>
      <div className="flex items-center gap-4">
        <Donut slices={slices} total={total} />
        <div className="min-w-0 flex-1 space-y-2">
          {rows.map(([label, v], idx) => {
            const active = selectedOperator === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectOperator(active ? null : label)}
                className={cn(
                  "w-full rounded-xl px-2 py-1.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40",
                  active && "bg-violet-50 ring-1 ring-violet-200 dark:bg-violet-950/30 dark:ring-violet-900/50"
                )}
                aria-pressed={active}
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
                  </div>
                  <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{v}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </MiniCard>
  );
}

function MiniCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 shadow-sm dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div className="grid grid-cols-[64px_1fr_32px] items-center gap-3 text-xs">
      <div className="truncate font-medium text-zinc-700 dark:text-zinc-200">{label}</div>
      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-900">
        <div className={cn("h-2 rounded-full", colorClass)} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-right tabular-nums text-zinc-500 dark:text-zinc-400">{value}</div>
    </div>
  );
}

function Donut({
  slices,
  total,
}: {
  slices: Array<{ v: number; color: string }>;
  total: number;
}) {
  const radius = 18;
  const c = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox="0 0 48 48" className="h-20 w-20 shrink-0">
      <circle cx="24" cy="24" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-zinc-800" />
      {slices.map((s, idx) => {
        const frac = s.v / total;
        const dash = frac * c;
        const dasharray = `${dash} ${c - dash}`;
        const dashoffset = -offset;
        offset += dash;
        return (
          <circle
            key={idx}
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="8"
            strokeDasharray={dasharray}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
          />
        );
      })}
    </svg>
  );
}

export function StatusPill({ status }: { status: Transaction["status"] }) {
  const map: Record<Transaction["status"], { label: string; cls: string }> = {
    pending: { label: "New", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
    reviewed: { label: "Reviewed", cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300" },
    escalated: { label: "Escalated", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  };
  const m = map[status];
  return <span className={cn("rounded-full px-2 py-1 text-[11px] font-medium", m.cls)}>{m.label}</span>;
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const map: Record<Priority, { label: string; cls: string }> = {
    low: { label: "L", cls: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300" },
    medium: { label: "M", cls: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
    high: { label: "H", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300" },
    critical: { label: "VH", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  };
  const m = map[priority];
  return <span className={cn("inline-flex min-w-8 justify-center rounded-full px-2 py-1 text-[11px] font-semibold", m.cls)}>{m.label}</span>;
}

export function FlagsCell({ tx }: { tx: Transaction }) {
  const flags = tx.flags ?? [];
  const count = flags.length;
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      {count === 0 ? "—" : (
        <>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">!</span>
          <span className="tabular-nums">{count}</span>
        </>
      )}
    </div>
  );
}

export function Money({ amount, currency }: { amount: number; currency: string }) {
  return <span className="font-medium tabular-nums">{formatCurrency(amount, currency)}</span>;
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function IconMailOff() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v16H4z" />
      <path d="m22 6-10 7L2 6" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.3l-7.1 12.3A2 2 0 0 0 5 20h14a2 2 0 0 0 1.8-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function FbkIcon({
  title,
  className,
  children,
}: {
  title: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full ring-1",
        className
      )}
    >
      {children}
    </span>
  );
}

export function FeedbackIconsCell({ tx }: { tx: Transaction }) {
  const fb = tx.feedback;
  const reviewed = fb?.transactionReviewed ?? false;

  if (!reviewed) {
    return (
      <span title="Not reviewed" className="text-sm text-zinc-500 dark:text-zinc-400">
        —
      </span>
    );
  }

  const letterSent = fb?.letterSent ?? false;
  const suspicious = fb?.suspicious ?? "unsure";
  const note = (fb?.reviewerFeedback ?? "").trim();

  return (
    <div className="flex items-center gap-1.5">
      <FbkIcon
        title="Reviewed"
        className="bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/50"
      >
        <IconCheck />
      </FbkIcon>

      <FbkIcon
        title={letterSent ? "Letter sent" : "No letter"}
        className={
          letterSent
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50"
            : "bg-zinc-50 text-zinc-600 ring-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-300 dark:ring-zinc-800"
        }
      >
        {letterSent ? <IconMail /> : <IconMailOff />}
      </FbkIcon>

      <FbkIcon
        title={
          suspicious === "yes"
            ? "Suspicious"
            : suspicious === "no"
              ? "Not suspicious"
              : "Unsure"
        }
        className={
          suspicious === "yes"
            ? "bg-red-50 text-red-600 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-900/50"
            : suspicious === "no"
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/50"
              : "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/50"
        }
      >
        {suspicious === "yes" ? <IconAlert /> : <IconCheck />}
      </FbkIcon>

      <FbkIcon
        title={note ? `Reviewer feedback: ${note}` : "No reviewer feedback"}
        className={
          note
            ? "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/50"
            : "bg-zinc-50 text-zinc-600 ring-zinc-200 dark:bg-zinc-900/40 dark:text-zinc-300 dark:ring-zinc-800"
        }
      >
        <IconChat />
      </FbkIcon>
    </div>
  );
}

