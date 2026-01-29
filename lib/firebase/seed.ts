"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import type { NotificationItem, Priority, Transaction } from "@/lib/types";
import { clamp01 } from "@/lib/utils";
import { getFirebaseDb } from "./client";

function omitUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomAlphaNum(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]!;
  return out;
}

function priorityForRisk(risk: number): Priority {
  if (risk >= 0.9) return "critical";
  if (risk >= 0.75) return "high";
  if (risk >= 0.5) return "medium";
  return "low";
}

export async function seedDemoData(params: { count?: number } = {}) {
  const db = getFirebaseDb();
  const count = params.count ?? 80;
  const now = Date.now();

  // Matches the "WH001" style in your reference screenshot
  const warehouses = ["WH001", "WH002", "WH003", "WH004", "WH005", "WH006"];
  const regions = ["R01", "R02"];
  const operators = ["OP8566", "OP4919", "OP4101", "OP1126", "OP8843"];
  const items = ["121202", "520042", "299985", "409631", "531642"];
  const tenders: Array<NonNullable<Transaction["tenderType"]>> = ["Cash", "Card", "GiftCard", "Other"];

  for (let i = 0; i < count; i++) {
    const riskScore = clamp01(0.15 + Math.random() * 0.85);
    const warehouseId = pick(warehouses);
    const regionId = pick(regions);
    const createdAt = now - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 45);
    const refundAmount = Math.round(20 + Math.random() * 2500);
    const pr = priorityForRisk(riskScore);
    const operatorId = pick(operators);
    const itemId = pick(items);
    const memberId = String(randomInt(100000, 999999));
    const transactionCode = `F${randomAlphaNum(7)}`;
    const flags: Array<"model-high-risk" | "repeat-refunder" | "amount-outlier"> = [];
    if (riskScore >= 0.8) flags.push("model-high-risk");
    if (Math.random() < 0.25) flags.push("repeat-refunder");
    if (refundAmount >= 1800) flags.push("amount-outlier");

    const registerId = `R${randomInt(10, 99)}`;
    const deptId = String(randomInt(100, 999));
    const tenderType = pick(tenders);
    const addedItemsCount = randomInt(1, 6);
    const cardLast4 = tenderType === "Card" ? String(randomInt(1000, 9999)) : undefined;
    const transactionReviewed = Math.random() < 0.35;

    const tx: Omit<Transaction, "id"> = {
      createdAt,
      updatedAt: createdAt,
      memberId,
      operatorId,
      itemId,
      transactionCode,
      warehouseId,
      regionId,
      refundAmount,
      currency: "USD",
      riskScore,
      priority: pr,
      modelRecommendation: riskScore >= 0.8 ? "fraud" : riskScore >= 0.55 ? "review" : "valid",
      modelExplanation: {
        summary: "High-risk refund pattern detected by the model.",
        reasons: [
          "Unusual refund frequency for customer",
          "Order/refund mismatch signal",
          "High refund amount relative to historical baseline",
        ],
      },
      customerId: `CUST-${String(1000 + i)}`,
      orderId: `ORD-${String(9000 + i)}`,
      historicalRefundCount: Math.floor(Math.random() * 6),
      flags,
      registerId,
      deptId,
      tenderType,
      addedItemsCount,
      ...(cardLast4 ? { cardLast4 } : {}),
      feedback: {
        transactionReviewed,
        letterSent: Math.random() < 0.1,
        suspicious: Math.random() < 0.25 ? "yes" : Math.random() < 0.6 ? "no" : "unsure",
        reviewerFeedback: "",
      },
      status: transactionReviewed ? "reviewed" : "pending",
    };

    const txRef = await addDoc(collection(db, "transactions"), {
      ...omitUndefined(tx as unknown as Record<string, unknown>),
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp(),
    });

    if (tx.priority === "critical" || tx.priority === "high") {
      const n: Omit<NotificationItem, "id"> = {
        createdAt: Date.now(),
        message: `High-risk refund flagged (${Math.round(tx.riskScore * 100)}%): ${tx.transactionCode ?? txRef.id}`,
        type: "HIGH_RISK",
        priority: tx.priority,
        transactionId: txRef.id,
        warehouseId,
        regionId,
      };
      await addDoc(collection(db, "notifications"), {
        ...n,
        serverCreatedAt: serverTimestamp(),
      });
    }
  }
}

