"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import type { UserProfile } from "@/lib/types";

type AuthState =
  | { status: "loading" }
  | { status: "misconfigured"; error: string }
  | { status: "signed-out" }
  | { status: "needs-profile"; user: { uid: string; email: string | null; displayName: string | null }; error?: string }
  | { status: "ready"; user: { uid: string; email: string | null; displayName: string | null }; profile: UserProfile };

type AuthContextValue = {
  state: AuthState;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  createDemoProfileIfMissing: (
    partial?: Partial<Pick<UserProfile, "role" | "assignedWarehouseId" | "assignedRegionId">>
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const isSkipAuthEnabled = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

function getDemoAuthState(): AuthState {
  const demoUser = { uid: "demo", email: "demo@local", displayName: "Demo User" };
  const demoProfile: UserProfile = {
    uid: demoUser.uid,
    email: demoUser.email,
    displayName: demoUser.displayName,
    role: "operations-manager",
    assignedWarehouseId: "WH-001",
    assignedRegionId: "R-01",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return { status: "ready", user: demoUser, profile: demoProfile };
}

function toUserProfileDocKey(uid: string) {
  return doc(getFirebaseDb(), "users", uid);
}

async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(toUserProfileDocKey(uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isSkipAuthEnabled ? getDemoAuthState() : { status: "loading" }
  );

  useEffect(() => {
    if (isSkipAuthEnabled) return;
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (e) {
      setState({
        status: "misconfigured",
        error:
          e instanceof Error
            ? e.message
            : "Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* env vars.",
      });
      return;
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: "signed-out" });
        return;
      }

      const baseUser = { uid: user.uid, email: user.email, displayName: user.displayName };
      try {
        const profile = await fetchProfile(user.uid);
        if (!profile) {
          const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
          if (demoMode) {
            const autoProfile: UserProfile = {
              uid: baseUser.uid,
              email: baseUser.email,
              displayName: baseUser.displayName,
              role: "operations-manager",
              assignedWarehouseId: "WH-001",
              assignedRegionId: "R-01",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            try {
              await setDoc(toUserProfileDocKey(baseUser.uid), {
                ...autoProfile,
                serverCreatedAt: serverTimestamp(),
                serverUpdatedAt: serverTimestamp(),
              });
              setState({ status: "ready", user: baseUser, profile: autoProfile });
              return;
            } catch (e) {
              // If rules block user profile creation, fall back to explicit needs-profile state.
              const msg =
                e instanceof Error
                  ? e.message
                  : "Could not create users/{uid} profile (Firestore permissions).";
              setState({ status: "needs-profile", user: baseUser, error: msg });
              return;
            }
          }

          setState({ status: "needs-profile", user: baseUser });
          return;
        }
        setState({ status: "ready", user: baseUser, profile });
      } catch (e) {
        // Conservative fallback: treat as needs-profile to avoid accidental broad access.
        const msg =
          e instanceof Error
            ? e.message
            : "Could not read users/{uid} profile (Firestore permissions).";
        setState({ status: "needs-profile", user: baseUser, error: msg });
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      state,
      async signInWithGoogle() {
        if (isSkipAuthEnabled) return;
        if (state.status === "misconfigured") throw new Error(state.error);
        const auth = getFirebaseAuth();
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      },
      async signOutUser() {
        if (isSkipAuthEnabled) return;
        if (state.status === "misconfigured") return;
        await signOut(getFirebaseAuth());
      },
      async createDemoProfileIfMissing(partial) {
        if (isSkipAuthEnabled) return { ok: false, error: "Skip-auth is enabled." };
        if (state.status !== "needs-profile") {
          return { ok: false, error: "Not in needs-profile state." };
        }

        const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
        if (!demoMode) return { ok: false, error: "Demo mode is disabled." };

        const profile: UserProfile = {
          uid: state.user.uid,
          email: state.user.email,
          displayName: state.user.displayName,
          role: partial?.role ?? "operations-manager",
          assignedWarehouseId: partial?.assignedWarehouseId ?? "WH-001",
          assignedRegionId: partial?.assignedRegionId ?? "R-01",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        try {
          await setDoc(toUserProfileDocKey(state.user.uid), {
            ...profile,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          });

          setState({ status: "ready", user: state.user, profile });
          return { ok: true };
        } catch (e) {
          const msg =
            e instanceof Error
              ? e.message
              : "Could not create users/{uid} profile (Firestore permissions).";
          setState({ status: "needs-profile", user: state.user, error: msg });
          return { ok: false, error: msg };
        }
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

