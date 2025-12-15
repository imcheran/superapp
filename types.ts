
export interface Habit {
  id: string;
  name: string;
  category: string;
  goalFrequency: number; // Days per week
  targetConsistency: number; // Target percentage (e.g., 85)
  color: string;
  // New Enhanced Fields
  description?: string;
  streakGoal?: number; // 0 for None
  trackingType?: 'BOOLEAN' | 'COUNT'; // 'BOOLEAN' = Step by Step (1/1), 'COUNT' = Custom Value
  dailyTarget?: number;
  unit?: string;
  reminders?: string[];
  
  // Quit Habit Specifics
  type?: 'BUILD' | 'QUIT'; // 'BUILD' is default for existing habits
  quitDate?: string; // ISO Timestamp of last relapse or start date
  quitCostPerDay?: number; // Financial cost of the habit per day
  quitHistory?: RelapseRecord[]; // Log of previous streaks
}

export interface RelapseRecord {
  date: string; // ISO Date of the relapse/reset
  durationSeconds: number; // How long the streak lasted before this reset
  trigger?: string; // Reason for relapse (e.g., "Stress", "Social")
}

export interface User {
  username: string;
  password?: string;
  createdAt: string;
}

export interface TrackingData {
  [date: string]: string[]; // Date (YYYY-MM-DD) -> Array of completed Habit IDs
}

export type Chronotype = 'LION' | 'BEAR' | 'WOLF' | 'DOLPHIN';
export type AppMode = 'ZEN' | 'HERO';

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
  chronotype: Chronotype;
  mode?: AppMode;
  heroStats?: HeroStats;
  notesPin?: string; // 4-digit pin for locked notes
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
  QUIT_HABITS = 'QUIT_HABITS',
  ANALYTICS = 'ANALYTICS',
  GOALS = 'GOALS',
  JOURNAL = 'JOURNAL',
  NOTES = 'NOTES', // New View
  FINANCE = 'FINANCE',
  SETTINGS = 'SETTINGS',
  AI_COACH = 'AI_COACH'
}

// Notes Module Types
export interface NoteItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  title: string;
  content?: string; // Used if type is 'text'
  items?: NoteItem[]; // Used if type is 'list'
  type: 'text' | 'list';
  color: string;
  isPinned: boolean;
  isTrashed?: boolean; // New: Soft delete
  isLocked?: boolean; // New: Protected by PIN
  image?: string; // New: Base64 image data
  labels?: string[]; // New: Tags/Notebooks
  createdAt: string;
}

export type NotesData = Note[]; // Array of Notes

// Finance Module Types

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  brand?: string; // e.g., 'Uber', 'Zomato'
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDateDay: number; // Day of month (1-31)
  category: string;
  isAutoDebit: boolean;
  lastPaidDate?: string;
}

// Deprecated Expense for backward compatibility types, but mapped to Transaction in UI
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
  transactions: Transaction[]; // Replaces expenses
  bills: Bill[]; // New feature
  debts: Debt[];
  categories: string[];
  monthlyBudget: number;
  walletBalance: number;
  fincoins: number; // New: Gamification
  // Legacy support
  expenses?: Expense[];
}