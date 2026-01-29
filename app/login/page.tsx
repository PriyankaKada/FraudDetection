"use client";

import { useRouter } from "next/navigation";

import { LoginCard } from "@/components/auth/login-card";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div>
          <div className="text-3xl font-semibold tracking-tight">Login</div>
          <div className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Sign in with Google to review AI-flagged refunds. Your role controls what you can
            see and edit (warehouse/region/all, analytics, overrides).
          </div>
        </div>

        <LoginCard onSignedIn={() => router.push("/dashboard")} />
      </div>
    </div>
  );
}

