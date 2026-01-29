import type { Transaction } from "./types";
import { formatCurrency } from "./utils";

export function generateEscalationLetter(params: {
  transaction: Transaction;
  reason: string;
}): string {
  const t = params.transaction;
  const amount = formatCurrency(t.refundAmount, t.currency);
  const risk = `${Math.round(t.riskScore * 100)}%`;

  return [
    "Subject: Refund Transaction Escalation Review",
    "",
    `Transaction ID: ${t.id}`,
    `Warehouse: ${t.warehouseId}`,
    `Region: ${t.regionId}`,
    `Refund Amount: ${amount}`,
    `AI Risk Score: ${risk}`,
    `AI Recommendation: ${t.modelRecommendation.toUpperCase()}`,
    "",
    "Escalation Reason:",
    params.reason,
    "",
    "Requested Action:",
    "- Please perform secondary review and provide approval/denial guidance.",
    "- Attach any supporting documentation for audit purposes.",
    "",
    "Notes:",
    t.modelExplanation?.summary ? `- Model summary: ${t.modelExplanation.summary}` : "- Model summary: (not provided)",
    "",
    "Thank you,",
    "Fraud Operations",
  ].join("\n");
}

