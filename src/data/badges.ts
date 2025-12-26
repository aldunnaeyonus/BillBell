// src/data/badges.ts
import { Badge } from "../types/domain";

export const BADGES: Badge[] = [
  {
    id: "rookie",
    title: "The Rookie",
    description: "Added your first bill to the list.",
    icon: "add-circle",
    color: "#3498DB",
  },
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Paid a bill before the due date.",
    icon: "alarm",
    color: "#F1C40F",
  },
  {
    id: "subscription_savvy", // <--- NEW
    title: "Subscription Savvy",
    description: "Added a recurring bill.",
    icon: "repeat",
    color: "#8E44AD",
  },
  {
    id: "clean_slate",
    title: "Clean Slate",
    description: "Cleared all overdue bills.",
    icon: "sparkles",
    color: "#2ECC71",
  },
  {
    id: "budget_boss",
    title: "Budget Boss",
    description: "Set a spending limit in Insights.",
    icon: "pie-chart",
    color: "#9B59B6",
  },
  {
    id: "debt_destroyer",
    title: "Debt Destroyer",
    description: "Marked 10 bills as paid.",
    icon: "checkmark-done-circle",
    color: "#E67E22",
  },
  {
    id: "pro_user",
    title: "Bill Bell Pro",
    description: "Marked 50 bills as paid.",
    icon: "trophy",
    color: "#E74C3C",
  },
  {
    id: "centurion", // <--- NEW
    title: "Centurion",
    description: "Marked 100 bills as paid.",
    icon: "ribbon",
    color: "#C0392B",
  },
];