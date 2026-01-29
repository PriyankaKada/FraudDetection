import type { UserRole } from "./roles";

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  assignedWarehouseId?: string;
  assignedRegionId?: string;
  createdAt?: number;
  updatedAt?: number;
};

export type Priority = "low" | "medium" | "high" | "critical";
export type ModelRecommendation = "fraud" | "valid" | "review";
export type HumanDecision = "fraud" | "valid" | "escalated";

export type Transaction = {
  id: string;
  createdAt: number; // ms epoch
  updatedAt?: number;

  // Demo-friendly identifiers for table views
  memberId?: string;
  operatorId?: string;
  itemId?: string;
  transactionCode?: string;

  warehouseId: string;
  regionId: string;

  refundAmount: number;
  currency: string;

  riskScore: number; // 0..1
  priority: Priority;
  modelRecommendation: ModelRecommendation;
  modelExplanation?: {
    summary?: string;
    reasons?: string[];
  };

  customerId?: string;
  orderId?: string;
  historicalRefundCount?: number;

  flags?: Array<"model-high-risk" | "repeat-refunder" | "amount-outlier">;

  // POS-style details (used in the side panel / export)
  registerId?: string;
  deptId?: string;
  tenderType?: "Cash" | "Card" | "GiftCard" | "Other";
  addedItemsCount?: number;
  cardLast4?: string;

  feedback?: {
    transactionReviewed?: boolean;
    letterSent?: boolean;
    suspicious?: "yes" | "no" | "unsure";
    reviewerFeedback?: string;
  };

  status: "pending" | "reviewed" | "escalated";

  humanDecision?: {
    decision: HumanDecision;
    decidedAt: number;
    decidedByUid: string;
    decidedByEmail?: string | null;
    notes?: string;
  };

  escalation?: {
    escalatedAt: number;
    escalatedByUid: string;
    escalatedByEmail?: string | null;
    reason?: string;
    letter?: string;
  };

  lastNote?: {
    at: number;
    byUid: string;
    byEmail?: string | null;
    note: string;
  };
};

export type AuditAction =
  | "DECISION_SET"
  | "NOTE_ADDED"
  | "ESCALATED"
  | "OVERRIDDEN"
  | "FEEDBACK_UPDATED";

export type AuditEntry = {
  at: number;
  byUid: string;
  byEmail?: string | null;
  action: AuditAction;
  transactionId: string;
  payload?: Record<string, unknown>;
};

export type NotificationItem = {
  id: string;
  createdAt: number;
  message: string;
  type: "HIGH_RISK" | "PENDING_REVIEW" | "ESCALATION";
  priority: Priority;
  transactionId?: string;
  warehouseId?: string;
  regionId?: string;
  readAt?: number;
};

