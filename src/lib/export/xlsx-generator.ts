/**
 * XLSX export using ExcelJS.
 * Generates a workbook with two sheets: Expenses and Settlements.
 */

import type { ExpenseResponse, SettlementResponse, MemberResponse } from "@/types/api";
import { formatDate } from "@/lib/utils";

interface GroupData {
  name: string;
  currency: string;
}

export async function generateGroupXlsx(
  group: GroupData,
  members: MemberResponse[],
  expenses: ExpenseResponse[],
  settlements: SettlementResponse[],
): Promise<Buffer> {
  // Dynamically import ExcelJS to avoid bundling in the main client bundle
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SplitFree";
  workbook.created = new Date();
  workbook.modified = new Date();

  const memberMap: Record<string, string> = Object.fromEntries(
    members.map((m) => [m._id, m.name]),
  );

  // ─── Sheet 1: Expenses ────────────────────────────────
  const expSheet = workbook.addWorksheet("Expenses");

  expSheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Description", key: "description", width: 30 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Paid By", key: "paidBy", width: 20 },
    { header: "Split Among", key: "splitAmong", width: 40 },
    { header: "Per Person", key: "splitAmount", width: 12 },
    { header: "Category", key: "category", width: 15 },
  ];

  // Style header row
  const expHeaderRow = expSheet.getRow(1);
  expHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  expHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF3B82F6" },
  };
  expHeaderRow.alignment = { horizontal: "center" };

  for (const expense of expenses) {
    const splitNames = expense.splitAmong
      .map((id) => memberMap[id] ?? id)
      .join(", ");

    expSheet.addRow({
      date: formatDate(expense.date),
      description: expense.description,
      amount: expense.amount / 100,
      currency: expense.currency,
      paidBy: memberMap[expense.paidBy] ?? expense.paidBy,
      splitAmong: splitNames,
      splitAmount: expense.splitAmount / 100,
      category: expense.category ?? "",
    });
  }

  // Format currency columns
  expSheet.getColumn("amount").numFmt = `"${group.currency}" #,##0.00`;
  expSheet.getColumn("splitAmount").numFmt = `"${group.currency}" #,##0.00`;

  // Add totals row
  if (expenses.length > 0) {
    const totalRow = expSheet.addRow({
      date: "",
      description: "TOTAL",
      amount: expenses.reduce((sum, e) => sum + e.amount / 100, 0),
      currency: group.currency,
      paidBy: "",
      splitAmong: "",
      splitAmount: "",
      category: "",
    });
    totalRow.font = { bold: true };
    totalRow.getCell("description").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF0F9FF" },
    };
  }

  // Freeze header row
  expSheet.views = [{ state: "frozen", ySplit: 1 }];

  // ─── Sheet 2: Settlements ─────────────────────────────
  const settSheet = workbook.addWorksheet("Settlements");

  settSheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Payer", key: "payer", width: 20 },
    { header: "Payee", key: "payee", width: 20 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Note", key: "note", width: 30 },
  ];

  const settHeaderRow = settSheet.getRow(1);
  settHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  settHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF10B981" },
  };
  settHeaderRow.alignment = { horizontal: "center" };

  for (const s of settlements) {
    settSheet.addRow({
      date: formatDate(s.date),
      payer: memberMap[s.payer] ?? s.payer,
      payee: memberMap[s.payee] ?? s.payee,
      amount: s.amount / 100,
      note: s.note ?? "",
    });
  }

  settSheet.getColumn("amount").numFmt = `"${group.currency}" #,##0.00`;
  settSheet.views = [{ state: "frozen", ySplit: 1 }];

  // ─── Sheet 3: Members ─────────────────────────────────
  const membSheet = workbook.addWorksheet("Members");
  membSheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Role", key: "role", width: 12 },
    { header: "Type", key: "type", width: 14 },
  ];

  const membHeaderRow = membSheet.getRow(1);
  membHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  membHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF8B5CF6" },
  };

  for (const m of members) {
    membSheet.addRow({
      name: m.name,
      email: m.email ?? "",
      role: m.role,
      type: m.isVirtual ? "Virtual" : "Registered",
    });
  }

  membSheet.views = [{ state: "frozen", ySplit: 1 }];

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
