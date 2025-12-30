
export interface Habit {
  id: string;
  name: string;
  category: string;
  goalFrequency: number; 
  targetConsistency: number; 
  color: string;
  description?: string;
  streakGoal?: number; 
  trackingType?: 'BOOLEAN' | 'COUNT'; 
  dailyTarget?: number;
  unit?: string;
  reminders?: string[];
  type?: 'BUILD' | 'QUIT'; 
  quitDate?: string; 
  originalQuitDate?: string;
  quitCostPerDay?: number;
  quitHistory?: RelapseRecord[];
}

export interface RelapseRecord {
  date: string; 
  durationSeconds: number; 
  trigger?: string; 
}

export interface User {
  username: string;
  password?: string;
  createdAt: string;
}

export interface TrackingData {
  [date: string]: string[]; 
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
  deepWorkInterval: number; 
  userName?: string;
  chronotype: Chronotype;
  mode?: AppMode;
  heroStats?: HeroStats;
  notesPin?: string; 
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  MONTHLY_DASHBOARD = 'MONTHLY_DASHBOARD',
  TRACKER = 'TRACKER',
  QUIT_HABITS = 'QUIT_HABITS',
  FINANCE = 'FINANCE',
  SETTINGS = 'SETTINGS',
  ANALYTICS = 'ANALYTICS',
  JOURNAL = 'JOURNAL',
  AI_COACH = 'AI_COACH',
  GOALS = 'GOALS'
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  assetId?: string; 
}

export type AssetType = 'CASH' | 'BANK' | 'CREDIT' | 'OTHER';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  balance: number;
  icon?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDateDay: number; 
  category: string;
  isAutoDebit: boolean;
  lastPaidDate?: string;
}

export interface Debt {
  id: string;
  type: 'Borrowed' | 'Lent';
  person: string;
  amount: number;
  status: 'Pending' | 'Settled';
  date: string;
}

export interface FinanceCategory {
  name: string;
  emoji: string;
  budgetLimit?: number;
}

export interface MonthlyBudgetConfig {
    total: number;
    ratios: { needs: number; wants: number; savings: number };
    categoryLimits: Record<string, number>;
}

export interface FinanceData {
  transactions: Transaction[]; 
  bills: Bill[]; 
  debts: Debt[];
  assets: Asset[];
  categories: FinanceCategory[];
  monthlyBudget: number; // Global default
  walletBalance: number; 
  budgetHistory?: Record<string, MonthlyBudgetConfig>; // Key: "YYYY-M" (e.g., "2024-5" for June, since Month is 0-indexed in JS dates usually, but we will use 0-11)
}

export interface CategoryBudget {
  category: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

export interface ExpenseInsight {
  category: string;
  currentMonthSpend: number;
  lastMonthSpend: number;
  changePercentage: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  recommendation?: string;
}

export interface FinanceAnalytics {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  dailyAverage: number;
  projectedMonthEnd: number;
}

export interface DailyEntry {
  date: string;
  wakeTime: string;
  sleepTime: string;
  sleepHours: number;
  steps: number;
  exerciseMinutes: number;
  exerciseType: string;
  waterLiters: number;
  mealsQuality: number; 
  caffeineServings: number;
  screenTime: number; 
  mood: string;
  moodIntensity: number; 
  stressLevel: number; 
  energyLevel: number; 
  socialScore: number; 
  deepWorkBlocks: number;
  shallowWorkHours: number;
  tasksPlanned: string; 
  tasksCompleted: string;
  focusScore: number; 
  distractions: string;
  learningMinutes: number;
  learningNotes: string;
  skillImproved: string;
  highlight: string;
  challenge: string;
  wins: string;
  improvements: string;
  gratitude: string;
  summary: string;
  nutritionLog: string;
  tomorrowPriorities: string;
  firstAction: string;
  obstacles: string;
  healthScore: number;
  productivityScore: number;
  mindScore: number;
  dayScore: number;
  aiResponse?: string;
}

export type DailyLogData = Record<string, DailyEntry>;

export interface NoteItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  items?: NoteItem[];
  type: 'text' | 'list';
  color: string;
  isPinned: boolean;
  isTrashed: boolean;
  isLocked: boolean;
  image?: string;
  labels?: string[];
  createdAt: string;
}

export interface UserData {
  habits: Habit[];
  trackingData: TrackingData;
  dailyLogs: DailyLogData;
  financeData: FinanceData;
  settings: UserSettings;
  notes: Note[];
}
