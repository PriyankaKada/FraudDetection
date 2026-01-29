import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

import { getFirebasePublicEnv } from "./env";

let db: Firestore | null = null;

export function getFirebaseApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const env = getFirebasePublicEnv();
  if (!env) {
    throw new Error(
      "Missing Firebase env. Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID."
    );
  }

  return initializeApp(env);
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb() {
  if (db) return db;

  const app = getFirebaseApp();
  const forceLongPolling = process.env.NEXT_PUBLIC_FIRESTORE_LONG_POLLING === "true";

  // Some networks/proxies block Firestore’s default transport; this avoids "client is offline" loops.
  db = forceLongPolling
    ? initializeFirestore(app, { experimentalForceLongPolling: true })
    : getFirestore(app);

  return db;
}

