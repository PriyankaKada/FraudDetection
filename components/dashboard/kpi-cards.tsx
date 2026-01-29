"use client";

import type { Transaction } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle, CardValue } from "@/components/ui/card";

export function KpiCards({
  transactions,
  riskThreshold = 0.7,
}: {
  transactions: Transaction[];
  riskThreshold?: number;
}) {
  const totalRefunds = transactions.reduce((acc, t) => acc + t.refundAmount, 0);
  const flagged = transactions.filter((t) => t.riskScore >= riskThreshold || t.priority === "high" || t.priority === "critical");
  const flaggedPct = transactions.length === 0 ? 0 : flagged.length / transactions.length;
  const fraudAtRisk = flagged.reduce((acc, t) => acc + t.refundAmount, 0);
  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  // For MVP we infer currency from first row; production would aggregate by currency.
  const currency = transactions[0]?.currency ?? "USD";

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Refunds</CardTitle>
          <CardValue>{formatCurrency(totalRefunds, currency)}</CardValue>
        </CardHeader>
        <CardBody className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Current filtered result set</span>
          <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {transactions.length} txns
          </span>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flagged %</CardTitle>
          <CardValue>{formatPercent(flaggedPct)}</CardValue>
        </CardHeader>
        <CardBody className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>High risk / priority</span>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {flagged.length} flagged
          </span>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fraud $ at Risk</CardTitle>
          <CardValue>{formatCurrency(fraudAtRisk, currency)}</CardValue>
        </CardHeader>
        <CardBody className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Exposure across flagged</span>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            {pendingCount} pending
          </span>
        </CardBody>
      </Card>
    </div>
  );
}

