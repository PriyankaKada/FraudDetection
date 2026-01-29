"use client";

import { useEffect, useMemo, useState } from "react";

import type { Transaction } from "@/lib/types";
import { roleCapabilities } from "@/lib/roles";
import { formatCurrency } from "@/lib/utils";
import { updateFeedback } from "@/lib/firebase/transactions";
import { Button } from "@/components/ui/button";
import { PriorityPill, StatusPill } from "@/components/dashboard/refund-audit-widgets";
import { useAuth } from "@/components/auth/auth-provider";

function formatDateShort(ms: number) {
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit", year: "2-digit" });
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-7 w-12 items-center rounded-full transition",
        checked ? "bg-violet-600" : "bg-zinc-200 dark:bg-zinc-800",
        disabled ? "opacity-60" : "",
      ].join(" ")}
      aria-pressed={checked}
    >
      <span
        className={[
          "inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-5" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

export function TransactionDetailPanel({
  transaction,
  onClose,
  onOptimisticUpdate,
}: {
  transaction: Transaction | null;
  onClose: () => void;
  onOptimisticUpdate?: (id: string, patch: Partial<Transaction>) => () => void;
}) {
  const { state } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const [transactionReviewed, setTransactionReviewed] = useState(false);
  const [letterSent, setLetterSent] = useState(false);
  const [suspicious, setSuspicious] = useState<NonNullable<NonNullable<Transaction["feedback"]>["suspicious"]>>("no");
  const [reviewerFeedback, setReviewerFeedback] = useState("");

  const canEdit =
    state.status === "ready"
      ? roleCapabilities[state.profile.role].canEditTransactions
      : false;

  const user = useMemo(() => {
    if (state.status !== "ready") return null;
    return { uid: state.user.uid, email: state.user.email };
  }, [state]);

  useEffect(() => {
    if (!transaction) return;
    const fb = transaction.feedback;
    setIsExpanded(false);
    setTransactionReviewed(fb?.transactionReviewed ?? false);
    setLetterSent(fb?.letterSent ?? false);
    setSuspicious(fb?.suspicious ?? "no");
    setReviewerFeedback(fb?.reviewerFeedback ?? "");
  }, [transaction?.id]); // reset when selecting a different row

  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-30">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl dark:bg-zinc-950">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/85 px-5 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/75">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900/40 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-900"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="text-sm font-semibold">Review</div>
          <div className="flex items-center gap-2">
            <PriorityPill priority={transaction.priority} />
            <StatusPill status={transaction.status} />
          </div>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Txn#:</span>
                <span className="font-mono text-xs">{transaction.transactionCode ?? transaction.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Member:</span>
                <span className="font-medium">{transaction.memberId ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">WH:</span>
                <span className="font-medium">{transaction.warehouseId}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Amount:</span>
                <span className="font-semibold">{formatCurrency(transaction.refundAmount, transaction.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Date:</span>
                <span className="font-medium">{formatDateShort(transaction.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Op:</span>
                <span className="font-medium">{transaction.operatorId ?? "—"}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="text-xs font-medium text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
          >
            {isExpanded ? "Hide details" : "Show details"}
          </button>

          {isExpanded ? (
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200 dark:bg-zinc-900/40 dark:ring-zinc-800">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Register:</span>
                  <span className="font-medium">{transaction.registerId ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Dept:</span>
                  <span className="font-medium">{transaction.deptId ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Card:</span>
                  <span className="font-medium">{transaction.cardLast4 ? `*${transaction.cardLast4}` : "—"}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Item:</span>
                  <span className="font-medium">{transaction.itemId ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Add. Items:</span>
                  <span className="font-medium">{transaction.addedItemsCount ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">Tender:</span>
                  <span className="font-medium">{transaction.tenderType ?? "—"}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <div className="text-sm font-semibold">Feedback</div>

            <div className="mt-4 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium">Transaction Reviewed?</div>
                <Switch checked={transactionReviewed} onChange={setTransactionReviewed} disabled={!canEdit || !user || isSaving} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium">Letter Sent?</div>
                <Switch checked={letterSent} onChange={setLetterSent} disabled={!canEdit || !user || isSaving} />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Does it look suspicious?</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["yes", "no", "unsure"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={!canEdit || !user || isSaving}
                      onClick={() => setSuspicious(opt)}
                      className={[
                        "h-10 rounded-2xl text-sm font-medium ring-1 transition",
                        suspicious === opt
                          ? "bg-violet-600 text-white ring-violet-600"
                          : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-800 dark:hover:bg-zinc-900/40",
                      ].join(" ")}
                    >
                      {opt === "yes" ? "Yes" : opt === "no" ? "No" : "Unsure"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Reviewer Feedback</div>
                <textarea
                  value={reviewerFeedback}
                  onChange={(e) => setReviewerFeedback(e.target.value)}
                  placeholder="Verified - legitimate refund"
                  className="min-h-[100px] w-full rounded-2xl bg-white p-3 text-sm ring-1 ring-zinc-200 outline-none focus:ring-2 focus:ring-violet-400 dark:bg-zinc-950 dark:ring-zinc-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  disabled={!canEdit || !user || isSaving}
                  onClick={() => {
                    const fb = transaction.feedback;
                    setTransactionReviewed(fb?.transactionReviewed ?? false);
                    setLetterSent(fb?.letterSent ?? false);
                    setSuspicious(fb?.suspicious ?? "no");
                    setReviewerFeedback(fb?.reviewerFeedback ?? "");
                  }}
                >
                  Reset
                </Button>
                <Button
                  disabled={!canEdit || !user || isSaving}
                  onClick={async () => {
                    if (!user) return;
                    setIsSaving(true);
                    const nextStatus =
                      transactionReviewed && transaction.status === "pending"
                        ? "reviewed"
                        : transaction.status;
                    const patch: Partial<Transaction> = {
                      status: nextStatus,
                      feedback: {
                        transactionReviewed,
                        letterSent,
                        suspicious,
                        reviewerFeedback,
                      },
                    };
                    const revert = onOptimisticUpdate?.(transaction.id, patch) ?? (() => {});
                    try {
                      await updateFeedback({
                        transactionId: transaction.id,
                        by: user,
                        currentStatus: transaction.status,
                        feedback: {
                          transactionReviewed,
                          letterSent,
                          suspicious,
                          reviewerFeedback,
                        },
                      });
                      onClose();
                    } catch (e) {
                      revert();
                      const msg = e instanceof Error ? e.message : "Failed to save feedback";
                      window.alert(msg);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

