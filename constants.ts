
import { Habit } from './types';

export const HABIT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', 
  '#8b5cf6', '#d946ef', '#f43f5e', '#ec4899', 
  '#c026d3', '#7c3aed', '#4f46e5', '#2563eb', 
  '#0891b2', '#059669', '#65a30d', '#ca8a04'
];

export const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: 'Morning Workout', category: 'Health', goalFrequency: 5, targetConsistency: 85, color: '#ef4444', dailyTarget: 1, trackingType: 'BOOLEAN', type: 'BUILD' },
  { id: '2', name: 'Read 30 Mins', category: 'Learning', goalFrequency: 7, targetConsistency: 90, color: '#f97316', dailyTarget: 1, trackingType: 'BOOLEAN', type: 'BUILD' },
  { id: '3', name: 'Deep Work (2h)', category: 'Productivity', goalFrequency: 5, targetConsistency: 80, color: '#f59e0b', dailyTarget: 1, trackingType: 'BOOLEAN', type: 'BUILD' },
  { id: '4', name: 'No Sugar', category: 'Health', goalFrequency: 6, targetConsistency: 95, color: '#84cc16', dailyTarget: 1, trackingType: 'BOOLEAN', type: 'BUILD' },
  { id: '5', name: 'Meditation', category: 'Mindfulness', goalFrequency: 7, targetConsistency: 100, color: '#10b981', dailyTarget: 1, trackingType: 'BOOLEAN', type: 'BUILD' },
  { id: '6', name: 'Track Expenses', category: 'Finance', goalFrequency: 7, targetConsistency: 90, color: '#06b6d4', dailyTarget: 1, trackingType: 'BOOLEAN', type: 'BUILD' },
  { id: 'q1', name: 'Quit Smoking', category: 'Health', goalFrequency: 0, targetConsistency: 0, color: '#64748b', type: 'QUIT', quitDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() }, // 5 days ago
  { id: 'q2', name: 'Limit Fast Food', category: 'Health', goalFrequency: 0, targetConsistency: 0, color: '#ef4444', type: 'QUIT', quitDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.5).toISOString() }
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const CATEGORY_COLORS: Record<string, string> = {
  Health: 'bg-red-100 text-red-800',
  Productivity: 'bg-blue-100 text-blue-800',
  Mindfulness: 'bg-purple-100 text-purple-800',
  Finance: 'bg-green-100 text-green-800',
  Learning: 'bg-orange-100 text-orange-800',
  Other: 'bg-gray-100 text-gray-800'
};

export const CHRONOTYPES = {
  LION: { label: 'Lion', description: 'Early riser, peak energy 8am-12pm', icon: '🦁' },
  BEAR: { label: 'Bear', description: 'Solar cycle, peak energy 10am-2pm', icon: '🐻' },
  WOLF: { label: 'Wolf', description: 'Night owl, peak energy 5pm-12am', icon: '🐺' },
  DOLPHIN: { label: 'Dolphin', description: 'Light sleeper, erratic energy', icon: '🐬' }
};
