import { parseISO, startOfDay, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";
import { Bill } from "../types/domain";
import { BILL_ICON_MAP } from "../data/vendors";

export function safeDateNum(s?: string | null) {
  if (!s) return 0;
  try { return parseISO(s).getTime(); } catch { return 0; }
}

export const jsonToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const escapeField = (field: any) => {
    if (field === null || field === undefined) return "";
    const stringField = String(field);
    if (stringField.match(/["\n,]/)) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  };
  const headerRow = headers.map(escapeField).join(",");
  const rows = data.map((row) =>
    headers.map((header) => escapeField(row[header])).join(",")
  );
  return [headerRow, ...rows].join("\n");
};

export function isOverdue(item: Bill) {
  const isPaid = Boolean(item.paid_at || item.is_paid || item.status === "paid");
  if (isPaid) return false;
  const due = parseISO(item.due_date);
  const today = startOfDay(new Date());
  return due < today;
}

export function getSmartDueDate(dateStr: string, t: any, locale?: string): { label: string; color?: string; urgent?: boolean } {
  const due = parseISO(dateStr);
  const today = startOfDay(new Date());

  if (isToday(due)) return { label: t("Due Today"), color: "#E67E22", urgent: true };
  if (isTomorrow(due)) return { label: t("Due Tomorrow"), color: "#F1C40F", urgent: true };

  const diff = differenceInCalendarDays(due, today);
  if (diff < 0) return { label: t("Overdue by {{days}} days", { days: Math.abs(diff) }), color: "#E74C3C", urgent: true };
  if (diff < 7) return { label: t("Due in {{days}} days", { days: diff }), color: undefined };

  const formattedDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(due);
  return { label: t("Due {{date}}", { date: formattedDate }), color: undefined };
}

export function getBillIcon(creditor: string) {
  const match = BILL_ICON_MAP.find((m) => creditor.match(m.regex));
  if (match) return { name: match.icon, color: match.color, type: "MaterialCommunityIcons" as const };
  return { name: "receipt-outline", color: "#808080", type: "Ionicons" as const };
}

export const generateBillContext = (bills: any[], currencySymbol: string, t: any) => {
  if (!bills || bills.length === 0) return t("The user has no bills.");
  return bills.map(b => {
    const amt = (b.amount_cents || 0) / 100;
    const status = b.paid_at || b.status === 'paid' ? t("Paid") : t("Unpaid");
    return `- ${b.creditor}: ${currencySymbol}${amt.toFixed(2)} (${t("Due")}: ${b.due_date}, ${t("Status")}: ${status})`;
  }).join("\n");
};