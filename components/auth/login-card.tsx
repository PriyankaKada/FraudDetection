"use client";

import { useEffect, useState } from "react";

import { roleCapabilities, type UserRole } from "@/lib/roles";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";

function RoleSelect({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  return (
    <select
      className="h-10 w-full rounded-lg bg-white px-3 text-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800"
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
    >
      <option value="warehouse-manager">Warehouse Manager</option>
      <option value="regional-manager">Regional Manager</option>
      <option value="operations-manager">Operations Manager</option>
      <option value="executive">Executive (read-only)</option>
    </select>
  );
}

export function LoginCard({ onSignedIn }: { onSignedIn?: () => void }) {
  const { state, signInWithGoogle, createDemoProfileIfMissing } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [demoRole, setDemoRole] = useState<UserRole>("operations-manager");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  useEffect(() => {
    if (state.status === "ready") onSignedIn?.();
  }, [state.status, onSignedIn]);

  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="text-lg font-semibold">Fraud Management</div>
        <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Google SSO → role resolved from Firestore.
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {state.status === "misconfigured" ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900/40">
            <div className="font-medium">Firebase is not configured</div>
            <div className="mt-1 opacity-90">{state.error}</div>
            <div className="mt-2 text-xs opacity-90">
              Create `my-app/.env.local` (copy from `.env.local.example`) and restart `npm run dev`.
            </div>
          </div>
        ) : null}

        {authError ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900/40">
            <div className="font-medium">Login failed</div>
            <div className="mt-1 opacity-90">{authError}</div>
            <div className="mt-2 text-xs opacity-90">
              Common fixes:
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <span className="font-mono">auth/configuration-not-found</span>: Firebase Console → Authentication → Get started, then enable Google provider
                </li>
                <li>
                  <span className="font-mono">auth/unauthorized-domain</span>: Authentication → Settings → Authorized domains → add <span className="font-mono">localhost</span> (and your LAN IP if used)
                </li>
                <li>
                  <span className="font-mono">auth/api-key-not-valid</span>: check `my-app/.env.local` has real values and restart dev server
                </li>
              </ul>
            </div>
          </div>
        ) : null}

        <Button
          onClick={async () => {
            setIsSigningIn(true);
            setAuthError(null);
            try {
              await signInWithGoogle();
            } catch (e) {
              const code = typeof e === "object" && e && "code" in e ? String((e as any).code) : null;
              const message =
                code
                  ? `Firebase auth error: ${code}`
                  : e instanceof Error
                    ? e.message
                    : "Unknown login error";
              setAuthError(message);
            } finally {
              setIsSigningIn(false);
            }
          }}
          disabled={isSigningIn || state.status === "loading" || state.status === "misconfigured"}
          className="w-full"
        >
          Continue with Google
        </Button>

        {state.status === "needs-profile" && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900/40">
            <div className="font-medium">Role not found</div>
            <div className="mt-1 opacity-90">
              This user doesn’t have a `users/{state.user.uid}` profile yet.
            </div>
            {"error" in state && state.error ? (
              <div className="mt-2 rounded-lg bg-white/70 p-2 text-xs text-amber-900 ring-1 ring-amber-200 dark:bg-black/30 dark:text-amber-200 dark:ring-amber-900/40">
                <div className="font-medium">Why it failed</div>
                <div className="mt-1 font-mono break-all">{state.error}</div>
                <div className="mt-2 opacity-90">
                  This usually means Firestore rules are blocking read/write to `users/{state.user.uid}`.
                  For a demo, set Firestore to test mode or allow authenticated users to write their own profile.
                </div>
              </div>
            ) : null}

            {demoMode ? (
              <div className="mt-3 space-y-2">
                <RoleSelect value={demoRole} onChange={setDemoRole} />
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={async () => {
                    setIsCreatingProfile(true);
                    try {
                      const res = await createDemoProfileIfMissing({ role: demoRole });
                      if (res.ok) {
                        onSignedIn?.();
                      } else {
                        setAuthError(`Profile setup failed: ${res.error}`);
                      }
                    } finally {
                      setIsCreatingProfile(false);
                    }
                  }}
                  disabled={isCreatingProfile}
                >
                  {isCreatingProfile
                    ? "Creating profile…"
                    : `Create demo profile (${roleCapabilities[demoRole].scope} scope)`}
                </Button>
              </div>
            ) : (
              <div className="mt-2 opacity-90">
                Ask an admin to create your profile in Firestore.
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Tip: set `NEXT_PUBLIC_DEMO_MODE=true` to enable “Create demo profile”.
        </div>
      </CardBody>
    </Card>
  );
}

