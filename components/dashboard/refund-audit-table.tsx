"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FeedbackIconsCell, FlagsCell, Money, PriorityPill, StatusPill } from "./refund-audit-widgets";
import { downloadCsv, exportColumns, printTableToPdf, type ExportColumnKey } from "@/lib/export";

function shortDate(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" });
}

export function RefundAuditTable({
  rows,
  isLoading,
  error,
  onSelect,
  selectedId,
  warehouseFilter,
  onClearWarehouseFilter,
  operatorFilter,
  onClearOperatorFilter,
  itemFilter,
  onClearItemFilter,
}: {
  rows: Transaction[];
  isLoading: boolean;
  error: string | null;
  onSelect: (t: Transaction) => void;
  selectedId?: string | null;
  warehouseFilter?: string | null;
  onClearWarehouseFilter?: () => void;
  operatorFilter?: string | null;
  onClearOperatorFilter?: () => void;
  itemFilter?: string | null;
  onClearItemFilter?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const columnsMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  const defaultCols: ExportColumnKey[] = ["added", "priority", "member", "warehouse", "txn", "amount", "status", "feedback"];
  const [visibleCols, setVisibleCols] = useState<ExportColumnKey[]>(defaultCols);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("refundAudit.visibleCols");
      if (!raw) return;
      const parsed = JSON.parse(raw) as ExportColumnKey[];
      if (Array.isArray(parsed) && parsed.length) setVisibleCols(parsed);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("refundAudit.visibleCols", JSON.stringify(visibleCols));
    } catch {
      // ignore
    }
  }, [visibleCols]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node | null;
      if (isColumnsOpen && columnsMenuRef.current && t && !columnsMenuRef.current.contains(t)) {
        setIsColumnsOpen(false);
      }
      if (isExportOpen && exportMenuRef.current && t && !exportMenuRef.current.contains(t)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [isColumnsOpen, isExportOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((t) => {
      const hay = [
        t.memberId,
        t.warehouseId,
        t.transactionCode,
        t.operatorId,
        t.itemId,
        t.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const colsForExport = visibleCols.length ? visibleCols : defaultCols;

  function toggleCol(key: ExportColumnKey) {
    setVisibleCols((prev) => {
      const has = prev.includes(key);
      const next = has ? prev.filter((c) => c !== key) : [...prev, key];
      return next.length ? next : prev; // don't allow empty
    });
  }

  function IconColumns() {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
        <path d="M9 5v14" />
        <path d="M15 5v14" />
      </svg>
    );
  }

  function IconDownload() {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v10" />
        <path d="M8 11l4 4 4-4" />
        <path d="M4 21h16" />
      </svg>
    );
  }

  return (
    <div className="rounded-2xl bg-white ring-1 ring-zinc-200 shadow-sm dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">Transactions</div>
          <div className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {filtered.length}
          </div>

          {warehouseFilter ? (
            <button
              type="button"
              onClick={onClearWarehouseFilter}
              className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:ring-violet-900/50 dark:hover:bg-violet-950/50"
            >
              WH: {warehouseFilter} · clear
            </button>
          ) : null}
          {operatorFilter ? (
            <button
              type="button"
              onClick={onClearOperatorFilter}
              className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-700 ring-1 ring-teal-200 hover:bg-teal-100 dark:bg-teal-950/30 dark:text-teal-300 dark:ring-teal-900/50 dark:hover:bg-teal-950/50"
            >
              OP: {operatorFilter} · clear
            </button>
          ) : null}
          {itemFilter ? (
            <button
              type="button"
              onClick={onClearItemFilter}
              className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/50 dark:hover:bg-amber-950/50"
            >
              IT: {itemFilter} · clear
            </button>
          ) : null}
        </div>
        <div className="flex flex-1 items-center gap-2 sm:justify-end">
          <div className="relative w-full sm:max-w-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="h-10 w-full rounded-xl bg-zinc-50 px-3 text-sm ring-1 ring-zinc-200 outline-none focus:ring-2 focus:ring-violet-400 dark:bg-zinc-900/40 dark:ring-zinc-800"
            />
          </div>

          <div ref={columnsMenuRef} className="relative hidden sm:block">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-900"
              onClick={() => {
                setIsColumnsOpen((v) => !v);
                setIsExportOpen(false);
              }}
              aria-label="Choose columns"
            >
              <IconColumns />
            </button>
            {isColumnsOpen ? (
              <div className="absolute right-0 top-11 z-20 w-56 rounded-2xl bg-white p-2 shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                <div className="px-2 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Show columns
                </div>
                {(
                  Object.keys(exportColumns) as ExportColumnKey[]
                ).map((k) => (
                  <label
                    key={k}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  >
                    <span>{exportColumns[k].label}</span>
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(k)}
                      onChange={() => toggleCol(k)}
                      className="h-4 w-4"
                    />
                  </label>
                ))}
                <div className="mt-2 flex items-center justify-between gap-2 px-2 pb-2">
                  <button
                    type="button"
                    className="text-xs text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
                    onClick={() => setVisibleCols(defaultCols)}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="text-xs text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
                    onClick={() => setIsColumnsOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div ref={exportMenuRef} className="relative hidden sm:block">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-900"
              onClick={() => {
                setIsExportOpen((v) => !v);
                setIsColumnsOpen(false);
              }}
              aria-label="Download"
            >
              <IconDownload />
            </button>
            {isExportOpen ? (
              <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                <button
                  type="button"
                  className="w-full px-5 py-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  onClick={() => {
                    setIsExportOpen(false);
                    downloadCsv({ filename: "refund-audit.csv", rows: filtered, columns: colsForExport });
                  }}
                >
                  CSV
                </button>
                <button
                  type="button"
                  className="w-full px-5 py-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  onClick={() => {
                    setIsExportOpen(false);
                    // Excel opens CSV cleanly; keep CSV format but label as Excel for UX.
                    downloadCsv({ filename: "refund-audit-excel.csv", rows: filtered, columns: colsForExport });
                  }}
                >
                  Excel
                </button>
                <button
                  type="button"
                  className="w-full bg-teal-500 px-5 py-3 text-left text-sm font-medium text-white hover:bg-teal-600"
                  onClick={() => {
                    setIsExportOpen(false);
                    printTableToPdf({ title: "Refund Audit Export", rows: filtered, columns: colsForExport });
                  }}
                >
                  PDF
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <div className="p-4 text-sm text-red-600">{error}</div> : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
            <tr>
              <th className="w-10 px-4 py-2" />
              {visibleCols.includes("added") ? <th className="px-4 py-2">Added</th> : null}
              {visibleCols.includes("priority") ? <th className="px-4 py-2">Pri</th> : null}
              {visibleCols.includes("member") ? <th className="px-4 py-2">Member</th> : null}
              {visibleCols.includes("warehouse") ? <th className="px-4 py-2">WH</th> : null}
              {visibleCols.includes("txn") ? <th className="px-4 py-2">Txn#</th> : null}
              {visibleCols.includes("operator") ? <th className="px-4 py-2">Op#</th> : null}
              {visibleCols.includes("item") ? <th className="px-4 py-2">Item</th> : null}
              {visibleCols.includes("amount") ? <th className="px-4 py-2">Amt</th> : null}
              {visibleCols.includes("status") ? <th className="px-4 py-2">Stat</th> : null}
              {visibleCols.includes("flags") ? <th className="px-4 py-2">Flg</th> : null}
              {visibleCols.includes("feedback") ? <th className="px-4 py-2">Fbk</th> : null}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-sm text-zinc-500 dark:text-zinc-400">
                  No transactions match your search/filters.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const selected = t.id === selectedId;
                return (
                  <tr
                    key={t.id}
                    className={cn(
                      "border-t border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40 cursor-pointer",
                      selected && "bg-zinc-50 dark:bg-zinc-900/50"
                    )}
                    onClick={() => onSelect(t)}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" className="h-4 w-4 rounded border-zinc-300" />
                    </td>
                    {visibleCols.includes("added") ? (
                      <td className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-200">
                        {shortDate(t.createdAt)}
                      </td>
                    ) : null}
                    {visibleCols.includes("priority") ? (
                      <td className="px-4 py-3">
                        <PriorityPill priority={t.priority} />
                      </td>
                    ) : null}
                    {visibleCols.includes("member") ? (
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-200">
                        {t.memberId ?? "—"}
                      </td>
                    ) : null}
                    {visibleCols.includes("warehouse") ? (
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">{t.warehouseId}</td>
                    ) : null}
                    {visibleCols.includes("txn") ? (
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-200">
                        {t.transactionCode ?? t.id.slice(0, 8).toUpperCase()}
                      </td>
                    ) : null}
                    {visibleCols.includes("operator") ? (
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-200">
                        {t.operatorId ?? "—"}
                      </td>
                    ) : null}
                    {visibleCols.includes("item") ? (
                      <td className="px-4 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-200">
                        {t.itemId ?? "—"}
                      </td>
                    ) : null}
                    {visibleCols.includes("amount") ? (
                      <td className="px-4 py-3">
                        <Money amount={t.refundAmount} currency={t.currency} />
                      </td>
                    ) : null}
                    {visibleCols.includes("status") ? (
                      <td className="px-4 py-3">
                        <StatusPill status={t.status} />
                      </td>
                    ) : null}
                    {visibleCols.includes("flags") ? (
                      <td className="px-4 py-3">
                        <FlagsCell tx={t} />
                      </td>
                    ) : null}
                    {visibleCols.includes("feedback") ? (
                      <td className="px-4 py-3">
                        <FeedbackIconsCell tx={t} />
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

