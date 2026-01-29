"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { NotificationItem, Priority, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/lib/firebase/notifications";

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

const priorityDot: Record<Priority, string> = {
  low: "bg-zinc-400",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  critical: "bg-red-500",
};

function formatTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function unreadCount(rows: NotificationItem[]) {
  return rows.filter((r) => !r.readAt).length;
}

export function NotificationsBell({
  profile,
  onSelectTransactionId,
}: {
  profile: UserProfile;
  onSelectTransactionId: (id: string) => void;
}) {
  const { rows, isLoading, error } = useNotifications({ profile, max: 25 });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const count = useMemo(() => unreadCount(rows), [rows]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!open || !ref.current || !t) return;
      if (!ref.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-900"
        aria-label="Notifications"
      >
        <IconBell />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[11px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-30 w-[360px] overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <div className="text-sm font-medium">Notifications</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {isLoading ? "Loading…" : `${rows.length} total`}
            </div>
          </div>

          {error ? <div className="px-4 py-3 text-sm text-red-600">{error}</div> : null}

          <div className="max-h-[420px] overflow-y-auto">
            {!isLoading && rows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400">No notifications.</div>
            ) : null}

            {rows.slice(0, 12).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (n.transactionId) onSelectTransactionId(n.transactionId);
                  setOpen(false);
                }}
                className={cn(
                  "w-full border-b border-zinc-200 px-4 py-3 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40",
                  !n.readAt ? "bg-violet-50/40 dark:bg-violet-950/10" : ""
                )}
              >
                <div className="flex items-start gap-3">
                  <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", priorityDot[n.priority])} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {n.type.replaceAll("_", " ")} · {formatTime(n.createdAt)}
                    </div>
                    <div className="mt-1 truncate text-sm font-medium">{n.message}</div>
                    {n.transactionId ? (
                      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Open transaction
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

