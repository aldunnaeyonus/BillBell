export interface Bill {
  id: number;
  creditor: string;
  amount_cents: number;
  due_date: string; // ISO Date YYYY-MM-DD
  status: "active" | "paid" | "archived";
  payment_method: "manual" | "auto";
  recurrence?: string | null;
  notes?: string;
  reminder_offset_days?: number;
  reminder_time_local?: string;
  paid_at?: string | null;
  is_paid?: boolean;
  end_date?: string | null; // <--- Added this field
}

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface FamilyRequest {
  id: number;
  requester_id: number;
  email: string;
  name?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface BillListResponse {
  bills: Bill[];
}