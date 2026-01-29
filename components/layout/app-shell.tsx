"use client";

import Link from "next/link";

import { roleCapabilities } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { Sidebar } from "./sidebar";

function RolePill({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
      {role}
    </span>
  );
}

export function AppShell({
  title,
  children,
  rightSlot,
}: {
  title: string;
  children: React.ReactNode;
  rightSlot?: React.ReactNode;
}) {
  const { state, signOutUser } = useAuth();

  const role =
    state.status === "ready" ? state.profile.role : state.status === "needs-profile" ? "unknown" : "guest";

  const scope =
    state.status === "ready" ? roleCapabilities[state.profile.role].scope : "all";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="flex">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
                  {title}
                </Link>
                <div className="hidden items-center gap-2 sm:flex">
                  <RolePill role={String(role)} />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">scope: {scope}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {rightSlot}
                <Button
                  variant="ghost"
                  onClick={() => signOutUser()}
                  className={cn(state.status === "signed-out" ? "hidden" : "")}
                >
                  Sign out
                </Button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

