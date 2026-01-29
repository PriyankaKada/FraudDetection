"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
        active
          ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-sm"
          : "text-zinc-700 hover:bg-zinc-100/70 dark:text-zinc-300 dark:hover:bg-zinc-900/50"
      )}
    >
      <span
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 transition",
          active
            ? "bg-white/15 ring-white/25"
            : "bg-white ring-zinc-200 group-hover:bg-white/70 dark:bg-zinc-950 dark:ring-zinc-800 dark:group-hover:bg-zinc-950/60"
        )}
      >
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 13h8V3H3v10zM13 21h8V11h-8v10zM13 3h8v6h-8V3zM3 17h8v4H3v-4z" />
    </svg>
  );
}
function IconTable() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
      <path d="M8 6v12M16 6v12" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 17v-6" />
      <path d="M12 17V7" />
      <path d="M16 17v-3" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a7.9 7.9 0 0 0 .1-1l2-1.2-2-3.5-2.3.7a8 8 0 0 0-1.7-1L15 6h-6l-.5 2.9a8 8 0 0 0-1.7 1l-2.3-.7-2 3.5 2 1.2a7.9 7.9 0 0 0 .1 1 7.9 7.9 0 0 0-.1 1l-2 1.2 2 3.5 2.3-.7a8 8 0 0 0 1.7 1L9 22h6l.5-2.9a8 8 0 0 0 1.7-1l2.3.7 2-3.5-2-1.2a7.9 7.9 0 0 0-.1-1z" />
    </svg>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-72 shrink-0 border-r border-zinc-200 bg-white/70 p-5 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="relative h-9 w-9 rounded-2xl bg-gradient-to-br from-violet-600 to-teal-500 shadow-sm" />
        <div>
          <div className="text-sm font-semibold tracking-tight">Refund Audit</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Fraud Management</div>
        </div>
      </div>

      <div className="mt-6 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        Main Menu
      </div>
      <nav className="mt-2 space-y-1">
        <NavItem href="/dashboard" label="Dashboard" icon={<IconDashboard />} />
        <NavItem href="/dashboard" label="Transactions" icon={<IconTable />} />
        <NavItem href="/dashboard" label="Analytics" icon={<IconChart />} />
        <NavItem href="/dashboard" label="Settings" icon={<IconSettings />} />
      </nav>
    </aside>
  );
}

