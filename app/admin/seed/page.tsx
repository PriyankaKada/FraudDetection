"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { roleCapabilities } from "@/lib/roles";
import { seedDemoData } from "@/lib/firebase/seed";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default function SeedPage() {
  const { state } = useAuth();
  const [status, setStatus] = useState<"idle" | "seeding" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSeed =
    state.status === "ready" && roleCapabilities[state.profile.role].canOverride;

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Seed demo data</div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This writes sample `transactions` and `notifications` documents into Firestore for demos.
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="text-sm font-medium">Controls</div>
          </CardHeader>
          <CardBody className="space-y-3">
            {!canSeed ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                You must be signed in as an <span className="font-medium">Operations Manager</span> to seed.
              </div>
            ) : (
              <Button
                disabled={status === "seeding"}
                onClick={async () => {
                  setStatus("seeding");
                  setError(null);
                  try {
                    await seedDemoData({ count: 30 });
                    setStatus("done");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Seeding failed");
                    setStatus("error");
                  }
                }}
              >
                {status === "seeding" ? "Seeding…" : "Seed 30 demo transactions"}
              </Button>
            )}

            {status === "done" ? (
              <div className="text-sm text-emerald-700 dark:text-emerald-300">
                Done. Go back to the dashboard to see live updates.
              </div>
            ) : null}
            {status === "error" ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

