// constants.js

export const CATEGORIES = [
  { id: "cat-0", name: "None", icon: "⚫", color: "#78716c" },
  { id: "cat-1", name: "Body", icon: "💪", color: "#ef4444" },
  { id: "cat-2", name: "Mind", icon: "🧠", color: "#8b5cf6" },
  { id: "cat-3", name: "Work", icon: "💼", color: "#3b82f6" },
  { id: "cat-4", name: "Personal", icon: "🏠", color: "#22c55e" },
  { id: "cat-5", name: "Relations", icon: "❤️", color: "#ec4899" },
  { id: "cat-6", name: "Social", icon: "🎉", color: "#f97316" },
  { id: "cat-7", name: "Education", icon: "📚", color: "#0ea5e9" },
  { id: "cat-8", name: "Finance", icon: "💰", color: "#84cc16" },
  { id: "cat-9", name: "Planning", icon: "📅", color: "#78716c" },
];

export const categoryMap = new Map(CATEGORIES.map((c) => [c.id, c]));

export const MAX_DURATION_SECONDS = 23 * 3600 + 59 * 60 + 59;
export const MIN_DURATION_SECONDS = 1;
