"use client";

import { cn } from "@/lib/utils";
import type { Priority } from "@/lib/types";

const priorityStyles: Record<Priority, string> = {
  low: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        priorityStyles[priority],
        className
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {priority.toUpperCase()}
    </span>
  );
}

