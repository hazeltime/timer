// demo-data.js
// Recreated based on the user's screenshot with correct category IDs.

export const DEMO_TASKS = [
  {
    id: 1,
    title: "Body",
    description: "Ears Floss Tongue Brush Shower Skin Deo Roller Hair",
    categoryId: "cat-1", // Body
    duration: 150, // 2m 30s
    lapInterval: 2,
    growthFactor: 5,
    maxOccurrences: 10,
  },
  {
    id: 2,
    title: "Prepare",
    description: "Prepare for tomorrow and rest of week",
    categoryId: "cat-9", // Planning
    duration: 120, // 2m
    lapInterval: 3,
    growthFactor: -5,
    maxOccurrences: 10,
  },
  {
    id: 3,
    title: "Breathe",
    description: "Take a few deep breathes",
    categoryId: "cat-2", // Mind
    duration: 10, // 10s
    lapInterval: 2,
    growthFactor: 5,
    maxOccurrences: 0, // Infinite
  },
  {
    id: 4,
    title: "Work",
    description: "Email, Tasks, Code, Documents, Projects",
    categoryId: "cat-3", // Work
    duration: 120, // 2m
    lapInterval: 4,
    growthFactor: 10,
    maxOccurrences: 20,
  },
  {
    id: 5,
    title: "Stretch",
    description: "Stretch your muscles and body",
    categoryId: "cat-1", // Body
    duration: 15, // 15s
    lapInterval: 2,
    growthFactor: 5,
    maxOccurrences: 10,
  },
  {
    id: 6,
    title: "Cleanup msg",
    description: "Cleanup sms, sm, dms etc.",
    categoryId: "cat-4", // Personal
    duration: 120, // 2m
    lapInterval: 3,
    growthFactor: -10,
    maxOccurrences: 10,
  },
  {
    id: 7,
    title: "Her",
    description: "Write, save photo, plan",
    categoryId: "cat-5", // Relations
    duration: 120, // 2m
    lapInterval: 6,
    growthFactor: -10,
    maxOccurrences: 6,
  },
  {
    id: 8,
    title: "Respond archive",
    description: "Social Media",
    categoryId: "cat-6", // Social
    duration: 120, // 2m
    lapInterval: 4,
    growthFactor: -5,
    maxOccurrences: 0, // Infinite
  },
  {
    id: 9,
    title: "Read",
    description: "ADO or Signing Coding etc.",
    categoryId: "cat-7", // Education
    duration: 120, // 2m
    lapInterval: 5,
    growthFactor: 10,
    maxOccurrences: 10,
  },
  {
    id: 10,
    title: "Budget",
    description: "Spreadsheet budget and eco and docs",
    categoryId: "cat-8", // Finance
    duration: 30, // 30s
    lapInterval: 2,
    growthFactor: 5,
    maxOccurrences: 15,
  },
  {
    id: 11,
    title: "Power",
    description: "Power nap or meditation",
    categoryId: "cat-0", // None
    duration: 90, // 1m 30s
    lapInterval: 7,
    growthFactor: -5,
    maxOccurrences: 7,
  },
  {
    id: 12,
    title: "Drink Eat",
    description: "Drink and eat and take supplement.",
    categoryId: "cat-1", // Body
    duration: 90, // 1m 30s
    lapInterval: 3,
    growthFactor: 5,
    maxOccurrences: 10,
  },
  {
    id: 13,
    title: "Clear files",
    description: "Cleanup downloads and folders and cloud",
    categoryId: "cat-9", // Planning
    duration: 120, // 2m
    lapInterval: 5,
    growthFactor: 10,
    maxOccurrences: 20,
  },
  {
    id: 14,
    title: "Exercise",
    description: "Pushups Squats Situps Back Motion",
    categoryId: "cat-0", // None
    duration: 10, // 10s
    lapInterval: 3,
    growthFactor: 5,
    maxOccurrences: 20,
  },
  {
    id: 15,
    title: "Clear mail",
    description: "Private and Hazel and Work",
    categoryId: "cat-4", // Personal
    duration: 300, // 5m
    lapInterval: 2,
    growthFactor: -15,
    maxOccurrences: 18,
  },
];

export const DEMO_LAP_LIST = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];
