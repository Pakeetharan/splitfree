/**
 * Plain CSV export — no dependency needed, just string-joining.
 * Produces a single file with an Expenses table followed by a
 * Settlements table (common convention for multi-table CSVs).
 */
import type { ExpenseResponse, SettlementResponse, MemberResponse } from "@/types/api";
import { formatDate } from "@/lib/utils";

interface GroupData {
  name: string;
  currency: string;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toRow(values: (string | number)[]): string {
  return values.map((v) => csvEscape(String(v))).join(",");
}

export function generateGroupCsv(
  group: GroupData,
  members: MemberResponse[],
  expenses: ExpenseResponse[],
  settlements: SettlementResponse[],
): string {
  const memberMap: Record<string, string> = Object.fromEntries(
    members.map((m) => [m._id, m.name]),
  );

  const lines: string[] = [];

  lines.push(toRow([
    "Date",
    "Description",
    "Amount",
    "Currency",
    "Paid By",
    "Split Among",
    "Per Person",
    "Category",
    "Notes",
  ]));

  for (const expense of expenses) {
    const splitNames = expense.splitAmong
      .map((id) => memberMap[id] ?? id)
      .join("; ");

    lines.push(
      toRow([
        formatDate(expense.date),
        expense.description,
        (expense.amount / 100).toFixed(2),
        expense.currency,
        memberMap[expense.paidBy] ?? expense.paidBy,
        splitNames,
        (expense.splitAmount / 100).toFixed(2),
        expense.category ?? "",
        expense.notes ?? "",
      ]),
    );
  }

  if (settlements.length > 0) {
    lines.push("");
    lines.push("Settlements");
    lines.push(toRow(["Date", "Payer", "Payee", "Amount", "Note"]));

    for (const s of settlements) {
      lines.push(
        toRow([
          formatDate(s.date),
          memberMap[s.payer] ?? s.payer,
          memberMap[s.payee] ?? s.payee,
          (s.amount / 100).toFixed(2),
          s.note ?? "",
        ]),
      );
    }
  }

  return lines.join("\n");
}
