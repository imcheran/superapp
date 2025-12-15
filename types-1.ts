
export interface Habit {
  id: string;
  name: string;
  category: 'Health' | 'Productivity' | 'Mindfulness' | 'Finance' | 'Learning' | 'Other';
  goalFrequency: number; // Days per week
  targetConsistency: number; // Target percentage (e.g., 85)
  color: string;
}

export interface User {
  username: string;
  password?: string; // In a real app, never store plain text. For local-only prototype, this is acceptable.
  createdAt: string;
}

export interface TrackingData {
  [date: string]: string[]; // Date (YYYY-MM-DD) -> Array of completed Habit IDs
}

export type AppMode = 'ZEN' | 'HERO';
export type Chronotype = 'LION' | 'BEAR' | 'WOLF' | 'DOLPHIN';

export interface HeroStats {
  hp: number;
  maxHp: number;
  xp: number;
  level: number;
  nextLevelXp: number;
}

export interface UserSettings {
  deepWorkInterval: number; // Minutes per block
  userName?: string;
  mode: AppMode;
  chronotype: Chronotype;
  heroStats: HeroStats;
}

// Enhanced Data Model for Daily OS
export interface DailyEntry {
  // 1. Metadata
  date: string;
  wakeTime: string;
  sleepTime: string;
  sleepHours: number;
  
  // 2. Physical Health
  steps: number;
  exerciseMinutes: number;
  exerciseType: string;
  waterLiters: number;
  mealsQuality: number; // 1-5
  caffeineServings: number;
  screenTime: number; // Non-work hours

  // 3. Mood & Mental
  mood: string;
  moodIntensity: number; // 1-10
  stressLevel: number; // 1-10
  energyLevel: number; // 1-10
  socialScore: number; // 1-5

  // 4. Productivity
  deepWorkBlocks: number;
  shallowWorkHours: number;
  tasksPlanned: string; // stored as newline separated string for simplicity
  tasksCompleted: string;
  focusScore: number; // 1-10
  distractions: string;

  // 5. Learning
  learningMinutes: number;
  learningNotes: string;
  skillImproved: string;

  // 6. Journaling
  highlight: string;
  challenge: string;
  wins: string;
  improvements: string;
  gratitude: string;
  summary: string;
  nutritionLog: string; // Added specific food log

  // 7. Next Day
  tomorrowPriorities: string;
  firstAction: string;
  obstacles: string;

  // 8. Computed Scores (0-100)
  healthScore: number;
  productivityScore: number;
  mindScore: number;
  dayScore: number;
  
  // AI Analysis
  aiResponse?: string;
}

export type DailyLogData = Record<string, DailyEntry>;

export interface HabitStats {
  consistency: number; // Percentage
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  status: 'On Track' | 'At Risk' | 'Off Track';
  grade: string;
}

export interface DetailedMonthlyStats {
  month: string;
  avgConsistency: number; // Avg of daily scores
  bestDayScore: number;
  worstDayScore: number;
  totalHabitsDone: number;
  totalPossible: number;
  grade: string;
  status: string;
  habitsOnTrack: number;
  habitsAtRisk: number;
}

export interface HabitYearlyStats extends HabitStats {
  bestMonth: string;
  recommendation: string;
  yearlyAvg: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  MONTHLY_DASHBOARD = 'MONTHLY_DASHBOARD',
  TRACKER = 'TRACKER',
  ANALYTICS = 'ANALYTICS',
  GOALS = 'GOALS',
  JOURNAL = 'JOURNAL',
  FINANCE = 'FINANCE',
  SETTINGS = 'SETTINGS',
  AI_COACH = 'AI_COACH'
}

export type NotesData = Record<string, string>;

// Finance Module Types
export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  note: string;
}

export interface Debt {
  id: string;
  type: 'Borrowed' | 'Lent';
  person: string;
  amount: number;
  status: 'Pending' | 'Settled';
  date: string;
}

export interface FinanceData {
  expenses: Expense[];
  debts: Debt[];
  categories: string[];
  monthlyBudget: number;
  walletBalance: number;
}