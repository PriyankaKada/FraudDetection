"use client";

import type { Priority } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardFilters = {
  datePreset: "7d" | "30d" | "90d";
  priority: Priority | "all";
};

export function FiltersBar({
  value,
  onChange,
  canFilterByScope,
  variant = "card",
}: {
  value: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  canFilterByScope: boolean;
  variant?: "card" | "inline";
}) {
  const wrapClass =
    variant === "inline"
      ? "flex flex-wrap items-center justify-between gap-3"
      : "flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800 md:flex-row md:items-center md:justify-between";
  return (
    <div className={wrapClass}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Date</span>
        {(["7d", "30d", "90d"] as const).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={value.datePreset === p ? "primary" : "secondary"}
            onClick={() => onChange({ ...value, datePreset: p })}
          >
            {p.toUpperCase()}
          </Button>
        ))}
      </div>

      <div className={cn("flex flex-wrap items-center gap-3", !canFilterByScope && "opacity-60")}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Priority</span>
          <select
            className="h-9 rounded-xl bg-white px-3 text-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
            value={value.priority}
            onChange={(e) => onChange({ ...value, priority: e.target.value as DashboardFilters["priority"] })}
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Warehouse/Region selectors are intentionally role-gated; scope is enforced server-side by Firestore rules in production. */}
        {variant === "card" ? (
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Filters: date, priority {canFilterByScope ? "+ scope" : "(scope locked by role)"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

