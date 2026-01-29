"use client";

import { useMemo, useState } from "react";

import type { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PriorityBadge } from "@/components/ui/badge";

type SortKey = "createdAt" | "riskScore" | "refundAmount";
type SortDir = "asc" | "desc";

export function TransactionsTable({
  rows,
  onSelect,
  selectedId,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  error,
}: {
  rows: Transaction[];
  onSelect: (t: Transaction) => void;
  selectedId?: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  error: string | null;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    copy.sort((a, b) => {
      const av =
        sortKey === "createdAt"
          ? a.createdAt
          : sortKey === "riskScore"
            ? a.riskScore
            : a.refundAmount;
      const bv =
        sortKey === "createdAt"
          ? b.createdAt
          : sortKey === "riskScore"
            ? b.riskScore
            : b.refundAmount;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey !== nextKey) {
      setSortKey(nextKey);
      setSortDir("desc");
      return;
    }
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
  }

  return (
    <div className="rounded-xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Transactions</div>
          <div className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {rows.length} shown
          </div>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Sort: <span className="font-medium">{sortKey}</span> ({sortDir})
        </div>
      </div>

      {error ? (
        <div className="p-4 text-sm text-red-600">{error}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs font-medium text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-300">
            <tr>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">
                <button className="underline-offset-4 hover:underline" onClick={() => toggleSort("riskScore")}>
                  Risk
                </button>
              </th>
              <th className="px-4 py-2">
                <button className="underline-offset-4 hover:underline" onClick={() => toggleSort("refundAmount")}>
                  Refund
                </button>
              </th>
              <th className="px-4 py-2 hidden lg:table-cell">
                <button className="underline-offset-4 hover:underline" onClick={() => toggleSort("createdAt")}>
                  Created
                </button>
              </th>
              <th className="px-4 py-2">Warehouse</th>
              <th className="px-4 py-2">Region</th>
              <th className="px-4 py-2">AI</th>
              <th className="px-4 py-2">Human</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="px-4 py-4 text-zinc-500 dark:text-zinc-400" colSpan={9}>
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-zinc-500 dark:text-zinc-400" colSpan={9}>
                  No transactions match the current filters.
                </td>
              </tr>
            ) : (
              sortedRows.map((t) => {
                const isSelected = t.id === selectedId;
                return (
                  <tr
                    key={t.id}
                    className={[
                      "cursor-pointer border-t border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40",
                      isSelected ? "bg-zinc-50 dark:bg-zinc-900/50" : "",
                    ].join(" ")}
                    onClick={() => onSelect(t)}
                  >
                    <td className="px-4 py-3">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {(t.riskScore * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatCurrency(t.refundAmount, t.currency)}
                    </td>
                    <td className="px-4 py-3 hidden text-xs text-zinc-500 dark:text-zinc-400 lg:table-cell">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{t.warehouseId}</td>
                    <td className="px-4 py-3">{t.regionId}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {t.modelRecommendation.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.humanDecision ? (
                        <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {t.humanDecision.decision.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Tip: click a row to open side panel
        </div>
        <button
          className="rounded-lg bg-white px-3 py-2 text-xs font-medium ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-50 dark:bg-zinc-950 dark:ring-zinc-800 dark:hover:bg-zinc-900"
          onClick={onLoadMore}
          disabled={!hasMore || isLoading || isLoadingMore}
        >
          {isLoadingMore ? "Loading…" : hasMore ? "Load more" : "End of list"}
        </button>
      </div>
    </div>
  );
}

