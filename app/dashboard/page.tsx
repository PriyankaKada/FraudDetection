"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { AppShell } from "@/components/layout/app-shell";
import { FiltersBar, type DashboardFilters } from "@/components/dashboard/filters-bar";
import { KpiRow, ByWarehouseCard, ByOperatorCard, ByItemCard } from "@/components/dashboard/refund-audit-widgets";
import { RefundAuditTable } from "@/components/dashboard/refund-audit-table";
import { TransactionDetailPanel } from "@/components/transactions/transaction-detail-panel";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { roleCapabilities } from "@/lib/roles";
import type { Transaction, UserProfile } from "@/lib/types";
import { useTransactions } from "@/lib/firebase/transactions";

function datePresetToFromMs(preset: DashboardFilters["datePreset"]) {
  const now = Date.now();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  return now - days * 24 * 60 * 60 * 1000;
}

export default function DashboardPage() {
  const router = useRouter();
  const { state } = useAuth();

  const shouldRedirectToLogin =
    state.status === "signed-out" ||
    state.status === "needs-profile" ||
    state.status === "misconfigured";

  useEffect(() => {
    if (shouldRedirectToLogin) router.replace("/login");
  }, [router, shouldRedirectToLogin]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen px-6 py-16 text-sm text-zinc-600 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  if (shouldRedirectToLogin) return null;

  return <DashboardAuthed profile={state.profile} />;
}

function DashboardAuthed({ profile }: { profile: UserProfile }) {
  const [filters, setFilters] = useState<DashboardFilters>({
    datePreset: "30d",
    priority: "all",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [optimisticById, setOptimisticById] = useState<Record<string, Partial<Transaction>>>({});

  const caps = roleCapabilities[profile.role];

  const txFilters = useMemo(
    () => ({
      dateFromMs: datePresetToFromMs(filters.datePreset),
      priority: filters.priority,
    }),
    [filters.datePreset, filters.priority]
  );

  const transactions = useTransactions({
    profile,
    filters: txFilters,
    pageSize: 25,
  });

  const isEmpty = !transactions.isLoading && transactions.rows.length === 0;
  const baseRows = useMemo(() => {
    let out = transactions.rows;
    if (selectedWarehouse) out = out.filter((t) => t.warehouseId === selectedWarehouse);
    if (selectedOperator) out = out.filter((t) => t.operatorId === selectedOperator);
    if (selectedItem) out = out.filter((t) => t.itemId === selectedItem);
    return out;
  }, [transactions.rows, selectedWarehouse, selectedOperator, selectedItem]);

  const tableRows = useMemo(() => {
    if (!Object.keys(optimisticById).length) return baseRows;
    return baseRows.map((t) => (optimisticById[t.id] ? { ...t, ...optimisticById[t.id] } : t));
  }, [baseRows, optimisticById]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    const match =
      tableRows.find((t) => t.id === selectedId) ??
      transactions.rows.find((t) => t.id === selectedId) ??
      null;
    if (!match) return null;
    return optimisticById[match.id] ? ({ ...match, ...optimisticById[match.id] } as Transaction) : match;
  }, [selectedId, tableRows, transactions.rows, optimisticById]);

  const onOptimisticUpdate = useMemo(() => {
    return (id: string, patch: Partial<Transaction>) => {
      let prev: Partial<Transaction> | undefined;
      setOptimisticById((cur) => {
        prev = cur[id];
        return { ...cur, [id]: { ...(cur[id] ?? {}), ...patch } };
      });
      return () => {
        setOptimisticById((cur) => {
          if (!prev) {
            const { [id]: _removed, ...rest } = cur;
            return rest;
          }
          return { ...cur, [id]: prev! };
        });
      };
    };
  }, []);

  return (
    <AppShell
      title="Refund Audit"
      rightSlot={
        <div className="flex items-center gap-2">
          <NotificationsBell profile={profile} onSelectTransactionId={(id) => setSelectedId(id)} />
          {caps.canOverride ? (
            <Link
              href="/admin/seed"
              className="hidden rounded-lg bg-white px-3 py-2 text-xs font-medium ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:ring-zinc-800 dark:hover:bg-zinc-900 sm:inline-flex"
            >
              Seed demo data
            </Link>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <KpiRow transactions={transactions.rows} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <ByWarehouseCard
                transactions={transactions.rows}
                selectedWarehouse={selectedWarehouse}
                onSelectWarehouse={setSelectedWarehouse}
              />
              <ByOperatorCard
                transactions={transactions.rows}
                selectedOperator={selectedOperator}
                onSelectOperator={setSelectedOperator}
              />
              <ByItemCard transactions={transactions.rows} selectedItem={selectedItem} onSelectItem={setSelectedItem} />
            </div>

            <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200 shadow-sm dark:bg-zinc-950 dark:ring-zinc-800">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-medium">Filters</div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Date + priority + role scope (enforced in query)
                  </div>
                </div>
                <div className="sm:min-w-[520px]">
                  <FiltersBar
                    value={filters}
                    onChange={setFilters}
                    canFilterByScope={caps.scope === "all"}
                    variant="inline"
                  />
                </div>
              </div>
            </div>

            <RefundAuditTable
              rows={tableRows}
              isLoading={transactions.isLoading}
              error={transactions.error}
              selectedId={selectedId}
              warehouseFilter={selectedWarehouse}
              onClearWarehouseFilter={() => setSelectedWarehouse(null)}
              operatorFilter={selectedOperator}
              onClearOperatorFilter={() => setSelectedOperator(null)}
              itemFilter={selectedItem}
              onClearItemFilter={() => setSelectedItem(null)}
              onSelect={(t) => setSelectedId(t.id)}
            />

            {isEmpty ? (
              <div className="rounded-2xl bg-white p-4 text-sm text-zinc-600 ring-1 ring-zinc-200 shadow-sm dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
                <div className="font-medium text-zinc-900 dark:text-zinc-50">No transactions yet</div>
                <div className="mt-1">
                  Use <span className="font-medium">Seed demo data</span> (top-right) to generate realistic table rows.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <TransactionDetailPanel
        transaction={selected}
        onClose={() => setSelectedId(null)}
        onOptimisticUpdate={onOptimisticUpdate}
      />
    </AppShell>
  );
}

