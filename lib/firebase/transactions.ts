"use client";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

import type { AuditAction, AuditEntry, HumanDecision, Transaction, UserProfile } from "@/lib/types";
import { clamp01 } from "@/lib/utils";
import { getFirebaseDb } from "./client";

export type TransactionsQueryFilters = {
  dateFromMs: number;
  priority: Transaction["priority"] | "all";
};

function transactionFromSnap(snap: QueryDocumentSnapshot<DocumentData>): Transaction {
  const data = snap.data() as Omit<Transaction, "id">;
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

function constraintsForFilters(filters: TransactionsQueryFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where("createdAt", ">=", filters.dateFromMs)];
  if (filters.priority !== "all") constraints.push(where("priority", "==", filters.priority));
  return constraints;
}

export function useTransactions({
  profile,
  filters,
  pageSize = 25,
}: {
  profile: UserProfile;
  filters: TransactionsQueryFilters;
  pageSize?: number;
}) {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const roleConstraints = useMemo(() => constraintsForRole(profile), [profile]);
  const filterConstraints = useMemo(() => constraintsForFilters(filters), [filters]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setLastDoc(null);
    setHasMore(false);
    const db = getFirebaseDb();
    const q = query(
      collection(db, "transactions"),
      ...roleConstraints,
      ...filterConstraints,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map(transactionFromSnap));
        const nextLast = snap.docs[snap.docs.length - 1] ?? null;
        setLastDoc(nextLast);
        setHasMore(snap.docs.length === pageSize);
        setIsLoading(false);
      },
      (e) => {
        setError((e as any)?.message ?? "Failed to load transactions");
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, [roleConstraints, filterConstraints, pageSize]);

  async function loadMore() {
    if (!lastDoc || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, "transactions"),
        ...roleConstraints,
        ...filterConstraints,
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize)
      );
      const snap = await getDocs(q);
      const next = snap.docs.map(transactionFromSnap);
      setRows((prev) => [...prev, ...next]);
      const nextLast = snap.docs[snap.docs.length - 1] ?? null;
      setLastDoc(nextLast);
      setHasMore(snap.docs.length === pageSize);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more transactions");
    } finally {
      setIsLoadingMore(false);
    }
  }

  return { rows, isLoading, isLoadingMore, hasMore, error, loadMore };
}

async function writeAuditLog(params: { transactionId: string; entry: Omit<AuditEntry, "transactionId"> }) {
  const db = getFirebaseDb();
  await addDoc(collection(db, "transactions", params.transactionId, "audit"), {
    ...params.entry,
    transactionId: params.transactionId,
    serverAt: serverTimestamp(),
  });
}

export async function setHumanDecision(params: {
  transactionId: string;
  decision: HumanDecision;
  by: { uid: string; email: string | null };
  notes?: string;
  riskScore?: number;
}) {
  const db = getFirebaseDb();
  const ref = doc(db, "transactions", params.transactionId);

  const patch: Record<string, unknown> = {
    status: params.decision === "escalated" ? "escalated" : "reviewed",
    updatedAt: Date.now(),
    humanDecision: {
      decision: params.decision,
      decidedAt: Date.now(),
      decidedByUid: params.by.uid,
      decidedByEmail: params.by.email,
      notes: params.notes ?? "",
    },
    serverUpdatedAt: serverTimestamp(),
  };
  if (params.riskScore != null) patch.riskScore = clamp01(params.riskScore);

  await updateDoc(ref, patch);

  const action: AuditAction =
    params.decision === "escalated" ? "ESCALATED" : "DECISION_SET";

  await writeAuditLog({
    transactionId: params.transactionId,
    entry: {
      at: Date.now(),
      byUid: params.by.uid,
      byEmail: params.by.email,
      action,
      payload: { decision: params.decision, notes: params.notes ?? "" },
    },
  });
}

export async function addNote(params: {
  transactionId: string;
  by: { uid: string; email: string | null };
  note: string;
}) {
  const db = getFirebaseDb();
  const ref = doc(db, "transactions", params.transactionId);
  await updateDoc(ref, {
    updatedAt: Date.now(),
    lastNote: {
      at: Date.now(),
      byUid: params.by.uid,
      byEmail: params.by.email,
      note: params.note,
    },
    serverUpdatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    transactionId: params.transactionId,
    entry: {
      at: Date.now(),
      byUid: params.by.uid,
      byEmail: params.by.email,
      action: "NOTE_ADDED",
      payload: { note: params.note },
    },
  });
}

export async function escalateTransaction(params: {
  transactionId: string;
  by: { uid: string; email: string | null };
  reason: string;
  letter: string;
  notes?: string;
}) {
  const db = getFirebaseDb();
  const ref = doc(db, "transactions", params.transactionId);
  await updateDoc(ref, {
    status: "escalated",
    updatedAt: Date.now(),
    humanDecision: {
      decision: "escalated",
      decidedAt: Date.now(),
      decidedByUid: params.by.uid,
      decidedByEmail: params.by.email,
      notes: params.notes ?? "",
    },
    escalation: {
      escalatedAt: Date.now(),
      escalatedByUid: params.by.uid,
      escalatedByEmail: params.by.email,
      reason: params.reason,
      letter: params.letter,
    },
    serverUpdatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    transactionId: params.transactionId,
    entry: {
      at: Date.now(),
      byUid: params.by.uid,
      byEmail: params.by.email,
      action: "ESCALATED",
      payload: { reason: params.reason, letter: params.letter, notes: params.notes ?? "" },
    },
  });
}

export async function overrideDecision(params: {
  transactionId: string;
  previousDecision?: HumanDecision;
  nextDecision: Exclude<HumanDecision, "escalated">;
  by: { uid: string; email: string | null };
  notes?: string;
}) {
  const db = getFirebaseDb();
  const ref = doc(db, "transactions", params.transactionId);
  await updateDoc(ref, {
    status: "reviewed",
    updatedAt: Date.now(),
    humanDecision: {
      decision: params.nextDecision,
      decidedAt: Date.now(),
      decidedByUid: params.by.uid,
      decidedByEmail: params.by.email,
      notes: params.notes ?? "",
    },
    serverUpdatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    transactionId: params.transactionId,
    entry: {
      at: Date.now(),
      byUid: params.by.uid,
      byEmail: params.by.email,
      action: "OVERRIDDEN",
      payload: {
        previousDecision: params.previousDecision ?? null,
        nextDecision: params.nextDecision,
        notes: params.notes ?? "",
      },
    },
  });
}

export async function updateFeedback(params: {
  transactionId: string;
  by: { uid: string; email: string | null };
  feedback: NonNullable<Transaction["feedback"]>;
  currentStatus?: Transaction["status"];
}) {
  const db = getFirebaseDb();
  const ref = doc(db, "transactions", params.transactionId);
  const patch: Record<string, unknown> = {
    updatedAt: Date.now(),
    feedback: params.feedback,
    serverUpdatedAt: serverTimestamp(),
  };
  // When reviewer marks as reviewed, promote status to reviewed (don't downgrade).
  if (params.feedback.transactionReviewed && params.currentStatus !== "escalated") {
    patch.status = "reviewed";
  }

  await updateDoc(ref, patch);

  await writeAuditLog({
    transactionId: params.transactionId,
    entry: {
      at: Date.now(),
      byUid: params.by.uid,
      byEmail: params.by.email,
      action: "FEEDBACK_UPDATED",
      payload: {
        ...params.feedback,
        statusAfter:
          params.feedback.transactionReviewed && params.currentStatus !== "escalated"
            ? "reviewed"
            : params.currentStatus ?? null,
      } as unknown as Record<string, unknown>,
    },
  });
}

