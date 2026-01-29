"use client";

import Link from "next/link";

import type { NotificationItem } from "@/lib/types";
import { PriorityBadge } from "@/components/ui/badge";

export function NotificationCenter({
  rows,
  isLoading,
  error,
  onJumpToTransaction,
}: {
  rows: NotificationItem[];
  isLoading: boolean;
  error: string | null;
  onJumpToTransaction?: (transactionId: string) => void;
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="text-sm font-medium">Notifications</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Real-time listeners (Firestore)
        </div>
      </div>

      {error ? <div className="p-4 text-sm text-red-600">{error}</div> : null}

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {isLoading ? (
          <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
            No notifications.
          </div>
        ) : (
          rows.slice(0, 12).map((n) => (
            <div key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    {n.type.replaceAll("_", " ")}
                  </div>
                  <div className="mt-1 text-sm font-medium">{n.message}</div>
                  {n.transactionId ? (
                    <div className="mt-2">
                      <button
                        className="text-xs font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
                        onClick={() => onJumpToTransaction?.(n.transactionId!)}
                      >
                        Open transaction
                      </button>
                      <span className="mx-2 text-xs text-zinc-400">·</span>
                      <Link
                        className="text-xs text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
                        href="/dashboard"
                      >
                        View dashboard
                      </Link>
                    </div>
                  ) : null}
                </div>
                <PriorityBadge priority={n.priority} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

