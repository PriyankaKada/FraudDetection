import type { Transaction } from "./types";

function csvEscape(value: unknown) {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
}

export type ExportColumnKey =
  | "added"
  | "priority"
  | "member"
  | "warehouse"
  | "txn"
  | "operator"
  | "item"
  | "amount"
  | "status"
  | "flags"
  | "tender"
  | "register"
  | "dept"
  | "feedback";

export const exportColumns: Record<ExportColumnKey, { label: string; get: (t: Transaction) => unknown }> = {
  added: { label: "Added", get: (t) => new Date(t.createdAt).toISOString() },
  priority: { label: "Priority", get: (t) => t.priority },
  member: { label: "Member", get: (t) => t.memberId ?? "" },
  warehouse: { label: "WH", get: (t) => t.warehouseId },
  txn: { label: "Txn#", get: (t) => t.transactionCode ?? t.id },
  operator: { label: "Op#", get: (t) => t.operatorId ?? "" },
  item: { label: "Item", get: (t) => t.itemId ?? "" },
  amount: { label: "Amount", get: (t) => t.refundAmount },
  status: { label: "Status", get: (t) => t.status },
  flags: { label: "Flags", get: (t) => (t.flags ?? []).join("|") },
  tender: { label: "Tender", get: (t) => t.tenderType ?? "" },
  register: { label: "Register", get: (t) => t.registerId ?? "" },
  dept: { label: "Dept", get: (t) => t.deptId ?? "" },
  feedback: {
    label: "Feedback",
    get: (t) => {
      const fb = t.feedback;
      if (!fb) return "";
      return [
        fb.transactionReviewed ? "reviewed" : "not-reviewed",
        fb.letterSent ? "letter:sent" : "letter:no",
        fb.suspicious ? `suspicious:${fb.suspicious}` : "",
        fb.reviewerFeedback ? `note:${fb.reviewerFeedback}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    },
  },
};

export function downloadCsv(params: { filename: string; rows: Transaction[]; columns: ExportColumnKey[] }) {
  const header = params.columns.map((c) => csvEscape(exportColumns[c].label)).join(",");
  const lines = params.rows.map((t) =>
    params.columns.map((c) => csvEscape(exportColumns[c].get(t))).join(",")
  );
  const csv = [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = params.filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printTableToPdf(params: { title: string; rows: Transaction[]; columns: ExportColumnKey[] }) {
  const w = window.open("", "_blank");
  if (!w) return;

  const head = params.columns.map((c) => `<th>${exportColumns[c].label}</th>`).join("");
  const body = params.rows
    .map((t) => {
      const tds = params.columns.map((c) => `<td>${csvEscape(exportColumns[c].get(t))}</td>`).join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  w.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${params.title}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system; padding: 24px; }
      h1 { font-size: 16px; margin: 0 0 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
      th { background: #f8fafc; }
    </style>
  </head>
  <body>
    <h1>${params.title}</h1>
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
    <script>
      window.onload = () => { window.print(); };
    </script>
  </body>
</html>`);
  w.document.close();
}

