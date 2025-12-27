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

export interface WatchMessage {
  action: string;
  id?: string;
  [key: string]: any; // <--- REQUIRED: Allows this to pass as a generic object
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

export type BadgeId = 
  | 'rookie' 
  | 'debt_destroyer' 
  | 'early_bird' 
  | 'clean_slate' 
  | 'budget_boss' 
  | 'subscription_savvy'
  | 'centurion'
  | 'pro_user';

export interface Badge {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface UserAchievements {
  unlockedBadges: BadgeId[];
  totalPaidCount: number; // To track progress for "Debt Destroyer"
}