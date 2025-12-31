
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
  theme?: 'LIGHT' | 'DARK' | 'AUTO';
  timezone?: string;
  timeFormat?: '12H' | '24H';
  weekStartsOn?: 'SUNDAY' | 'MONDAY';
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
  budgetHistory?: Record<string, MonthlyBudgetConfig>; 
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

// ============================================
// PART 2: NEW TASK MANAGEMENT TYPES
// ============================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  userId: string;
  dueDate?: string;
  dueTime?: string;
  timezone?: string;
  priority: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  tags: string[];
  subtasks: Subtask[];
  checklistItems?: ChecklistItem[];
  isCompleted: boolean;
  completedAt?: string;
  completionTime?: number;
  recurrence?: RecurrenceRule;
  parentTaskId?: string;
  isRecurringParent?: boolean;
  assignedTo?: string[];
  sharedWith?: Collaborator[];
  comments?: TaskComment[];
  reminders: TaskReminder[];
  attachments?: TaskAttachment[];
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  estimatedDuration?: number;
  linkedHabitId?: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  assignedTo?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TaskList {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  sortOrder: number;
  isShared: boolean;
  sharedWith: Collaborator[];
  listType: 'CUSTOM' | 'INBOX' | 'TODAY' | 'WEEK' | 'UPCOMING' | 'SOMEDAY' | 'COMPLETED';
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
  completedCount?: number;
}

export interface Collaborator {
  userId: string;
  email: string;
  displayName?: string;
  avatar?: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
  joinedAt: string;
}

export interface TaskReminder {
  id: string;
  type: 'AT_TIME' | 'BEFORE_MINUTES' | 'BEFORE_HOURS' | 'BEFORE_DAYS';
  value: number;
  notificationMethod: 'PUSH' | 'EMAIL' | 'PERSISTENT';
  isEnabled: boolean;
  sentAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userEmail: string;
  displayName?: string;
  content: string;
  mentions?: string[];
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface RecurrenceRule {
  id: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthsOfYear?: number[];
  customPattern?: string;
  endDate?: string;
  occurrences?: number;
  exceptions?: string[];
}

// ============================================
// PART 3: CALENDAR TYPES
// ============================================

export interface CalendarEvent {
  id: string;
  taskId?: string;
  title: string;
  startDate: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  allDay: boolean;
  source: 'INTERNAL' | 'GOOGLE' | 'OUTLOOK' | 'ICAL';
  externalId?: string;
  externalCalendarId?: string;
  color: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface ExternalCalendarSync {
  id: string;
  userId: string;
  provider: 'GOOGLE' | 'OUTLOOK';
  calendarId: string;
  calendarName: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  isEnabled: boolean;
  syncInterval?: number;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PART 4: POMODORO & FOCUS TYPES
// ============================================

export interface PomodoroSettings {
  workDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartNextSession: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  whiteNoiseEnabled?: boolean;
  whiteNoiseType?: 'FOREST' | 'RAIN' | 'CAFE' | 'OCEAN' | 'PINK_NOISE' | 'BROWN_NOISE' | 'LOFI' | 'CLASSICAL' | 'AMBIENT';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface PomodoroSession {
  id: string;
  userId: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  pausedAt?: string;
  resumedAt?: string;
  plannedDuration: number;
  actualDuration: number;
  isCompleted: boolean;
  isBreak: boolean;
  distractions: Distraction[];
  focusScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Distraction {
  id: string;
  sessionId: string;
  category: 'PHONE' | 'NOTIFICATIONS' | 'HUNGER' | 'RESTLESSNESS' | 'OTHER';
  timestamp: string;
  notes?: string;
}

// ============================================
// PART 5: PREMIUM & ANALYTICS TYPES
// ============================================

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isPremium: boolean;
  premiumTier: 'FREE' | 'PRO' | 'BUSINESS';
  premiumExpiresAt?: string;
  subscriptionId?: string;
  paymentMethod?: string;
  theme: 'LIGHT' | 'DARK' | 'AUTO';
  timezone: string;
  language: string;
  timeFormat: '12H' | '24H';
  weekStartsOn: 'SUNDAY' | 'MONDAY';
  createdAt: string;
  lastLogin: string;
  lastActivityAt: string;
  totalLogins: number;
}

export interface PremiumFeatures {
  multipleReminders: boolean;
  advancedRecurrence: boolean;
  customFields: boolean;
  bulkEdit: boolean;
  collaboration: boolean;
  commentThreads: boolean;
  maxCollaborators: number;
  calendarSync: boolean;
  externalCalendars: number;
  whiteNoise: boolean;
  fileAttachments: boolean;
  maxAttachmentSize: number;
  advancedAnalytics: boolean;
  dataExport: boolean;
  prioritySupport: boolean;
  customThemes: boolean;
  apiAccess?: boolean;
}

export interface TaskAnalytics {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  completionRate: number;
  averageCompletionTime: number;
  onTimeCount: number;
  overdueCount: number;
  onTimePercentage: number;
  dailyTrend: { date: string; completed: number; total: number }[];
  weeklyTrend: { week: number; completed: number }[];
  monthlyTrend: { month: string; completed: number }[];
  byPriority: { priority: string; count: number }[];
  byList: { listId: string; listName: string; count: number }[];
  byTag: { tag: string; count: number }[];
  heatmap: { [dayHour: string]: number };
}

export interface PomodoroAnalytics {
  totalSessions: number;
  totalFocusTime: number;
  averageSessionDuration: number;
  longestStreak: number;
  currentStreak: number;
  distractionFrequency: { [key: string]: number };
  mostProductiveHour: string;
  mostProductiveDay: string;
  focusScore: number;
  dailyStats: {
    date: string;
    sessions: number;
    totalMinutes: number;
    distractions: number;
  }[];
}

export interface InsightRecommendation {
  id: string;
  type: 'COMPLETION' | 'FOCUS' | 'BALANCE' | 'PRODUCTIVITY';
  title: string;
  description: string;
  metric: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedAction?: string;
  createdAt: string;
}

export interface TaskFilters {
  lists?: string[];
  tags?: string[];
  priority?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  assignedTo?: string[];
  dueDateRange?: { start: string; end: string };
  isCompleted?: boolean;
  hasAttachments?: boolean;
  hasSubtasks?: boolean;
  searchQuery?: string;
}

// ============================================
// PART 6: APP STATE & VIEW TYPES
// ============================================

export enum ViewState {
  // Tasks
  INBOX = 'INBOX',
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  UPCOMING = 'UPCOMING',
  CALENDAR = 'CALENDAR',
  COMPLETED = 'COMPLETED',
  
  // Pomodoro
  POMODORO = 'POMODORO',
  
  // Habits
  DASHBOARD = 'DASHBOARD',
  MONTHLY_DASHBOARD = 'MONTHLY_DASHBOARD',
  TRACKER = 'TRACKER',
  QUIT_HABITS = 'QUIT_HABITS',
  
  // Finance
  FINANCE = 'FINANCE',
  
  // Journal/Notes
  JOURNAL = 'JOURNAL',
  NOTES = 'NOTES',
  
  // Other
  SETTINGS = 'SETTINGS',
  ANALYTICS = 'ANALYTICS',
  AI_COACH = 'AI_COACH',
  GOALS = 'GOALS'
}

export interface UserData {
  habits: Habit[];
  trackingData: TrackingData;
  dailyLogs: DailyLogData;
  financeData: FinanceData;
  settings: UserSettings;
  notes: Note[];
  
  // New Fields
  tasks: Task[];
  taskLists: TaskList[];
  pomodoroSettings?: PomodoroSettings;
  pomodoroSessions?: PomodoroSession[];
  
  // Analytics Cache
  taskAnalytics?: TaskAnalytics;
  pomodoroAnalytics?: PomodoroAnalytics;
}
