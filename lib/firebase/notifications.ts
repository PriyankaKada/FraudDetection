"use client";

import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import type { NotificationItem, UserProfile } from "@/lib/types";
import { getFirebaseDb } from "./client";

function notificationFromSnap(snap: QueryDocumentSnapshot<DocumentData>): NotificationItem {
  const data = snap.data() as Omit<NotificationItem, "id">;
  return { id: snap.id, ...data };
}

function constraintsForRole(profile: UserProfile): QueryConstraint[] {
  if (profile.role === "warehouse-manager") {
    return [where("warehouseId", "==", profile.assignedWarehouseId ?? "__none__")];
  }
  if (profile.role === "regional-manager") {
    return [where("regionId", "==", profile.assignedRegionId ?? "__none__")];
  }
  return [];
}

export function useNotifications({
  profile,
  max = 20,
}: {
  profile: UserProfile;
  max?: number;
}) {
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roleConstraints = useMemo(() => constraintsForRole(profile), [profile]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const db = getFirebaseDb();
    const q = query(
      collection(db, "notifications"),
      ...roleConstraints,
      orderBy("createdAt", "desc"),
      limit(max)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map(notificationFromSnap));
        setIsLoading(false);
      },
      (e) => {
        setError(e.message ?? "Failed to load notifications");
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, [roleConstraints, max]);

  return { rows, isLoading, error };
}

