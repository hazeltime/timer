// demo-data.js

export const DEMO_TASKS = [
  {
    id: 1,
    title: "Shower",
    description: "Take a refreshing shower.",
    categoryId: "cat-1",
    duration: 900,
    lapInterval: 99,
    growthFactor: 0,
    maxOccurrences: 0,
  },
  {
    id: 2,
    title: "Cleanup mail",
    description: "Organize and archive personal emails.",
    categoryId: "cat-4",
    duration: 60,
    lapInterval: 2,
    growthFactor: 10,
    maxOccurrences: 0,
  },
  {
    id: 3,
    title: "Breathe",
    description: "A short exercise to center yourself.",
    categoryId: "cat-2",
    duration: 30,
    lapInterval: 1,
    growthFactor: 5,
    maxOccurrences: 3,
  },
  {
    id: 4,
    title: "Code",
    description: "Focused coding session.",
    categoryId: "cat-3",
    duration: 300,
    lapInterval: 5,
    growthFactor: -10,
    maxOccurrences: 0,
  },
];

export const DEMO_LAP_LIST = [1, 2, 3, 4];
