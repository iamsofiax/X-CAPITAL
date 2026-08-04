import { jsPDF } from "jspdf";

/**
 * withdrawalPdf — generates a professional, bank-grade PDF receipt for an
 * approved withdrawal. Returns a data URL that can be attached to a user
 * notification so the member can download/print their receipt.
 */

export interface WithdrawalReceiptData {
  reference: string;
  userName: string;
  userEmail: string;
  amount: number;
  currency: string;
  method: string;
  destination: string;
  swift?: string;
  coin?: string;
  network?: string;
  address?: string;
  approvedAt: string;
  balanceAfter?: number;
  adminEmail?: string;
}

const EMERALD: [number, number, number] = [16, 185, 129];
const DARK: [number, number, number] = [15, 15, 20];
const GRAY: [number, number, number] = [120, 120, 130];

function money(amount: number, currency: string): string {
  if (currency !== "USD") return `${amount} ${currency}`;
  return (
    "$" +
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** True when the value is a usable PDF data URL or http(s) URL. */
export function isDownloadableUrl(value: string): boolean {
  return /^(data:application\/pdf|https?:\/\/)/i.test(value);
}

export function generateWithdrawalReceiptPdf(
  data: WithdrawalReceiptData,
): string {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;

  // ── Header band ─────────────────────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 110, "F");
  doc.setFillColor(...EMERALD);
  doc.rect(0, 110, W, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("X·CAPITAL", M, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(190, 190, 200);
  doc.text("Institutional Capital Execution", M, 68);
  doc.text("Withdrawal Approval Receipt", M, 82);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text("APPROVED", W - M, 50, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 190, 200);
  doc.text(`Reference: ${data.reference}`, W - M, 68, { align: "right" });
  doc.text(`Issued: ${formatDate(data.approvedAt)}`, W - M, 82, {
    align: "right",
  });

  // ── Member block ────────────────────────────────────────────────────────
  let y = 142;
  doc.setTextColor(40, 40, 50);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("MEMBER", M, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 25);
  doc.text(data.userName, M, y);
  y += 14;
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(data.userEmail, M, y);

  // ── Amount block ────────────────────────────────────────────────────────
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...EMERALD);
  doc.text(money(data.amount, data.currency), W - M, 148, { align: "right" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text("WITHDRAWAL AMOUNT", W - M, 164, { align: "right" });

  // ── Divider ─────────────────────────────────────────────────────────────
  y += 28;
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(1);
  doc.line(M, y, W - M, y);
  y += 24;

  // ── Details table ───────────────────────────────────────────────────────
  const rows: Array<[string, string]> = [
    ["Status", "APPROVED"],
    ["Method", data.method.toUpperCase()],
    ["Destination", data.destination],
  ];
  if (data.swift) rows.push(["SWIFT / BIC", data.swift]);
  if (data.coin) rows.push(["Asset", `${data.coin}`]);
  if (data.network) rows.push(["Network", data.network]);
  if (data.address)
    rows.push(["Address", data.address.slice(0, 18) + "…" + data.address.slice(-8)]);
  if (data.balanceAfter != null)
    rows.push(["Balance after withdrawal", money(data.balanceAfter, "USD")]);
  if (data.adminEmail)
    rows.push(["Approved by", data.adminEmail]);

  doc.setFontSize(9);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 70);
    doc.text(label.toUpperCase(), M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 25);
    doc.text(value, W - M, y, { align: "right" });
    y += 20;
  }

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.setDrawColor(230, 230, 235);
  doc.line(M, H - 88, W - M, H - 88);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...EMERALD);
  doc.text("X·CAPITAL MANAGEMENT LLC", M, H - 68);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    "This is a system-generated receipt confirming the approval of your withdrawal request.",
    M,
    H - 52,
  );
  doc.text(
    "Funds are transferred per the destination instructions above. Reserves are held 1:1.",
    M,
    H - 40,
  );
  doc.text(
    "Disclosures: transfers carry market risk. This document is not investment advice.",
    M,
    H - 28,
  );

  return doc.output("datauristring");
}
