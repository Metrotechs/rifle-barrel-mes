import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format seconds to HH:MM:SS string
 */
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert station name to status format (e.g., "Heat Treat" -> "HEAT_TREAT")
 */
export function stationNameToStatus(stationName: string): string {
  return stationName.toUpperCase().replace(/\s+/g, '_');
}

/**
 * Extract station name from status (e.g., "DRILLING_IN_PROGRESS" -> "DRILLING")
 */
export function extractStationFromStatus(status: string): string {
  return status.replace(/_IN_PROGRESS$|_PENDING$/, '');
}

/**
 * Check if a status indicates the barrel is in progress
 */
export function isInProgress(status: string): boolean {
  return status.includes('IN_PROGRESS');
}

/**
 * Check if a status indicates the barrel is pending
 */
export function isPending(status: string): boolean {
  return status.includes('PENDING');
}

/**
 * Get priority color for display
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'High':
      return '#f5222d';
    case 'Medium':
      return '#faad14';
    case 'Low':
      return '#52c41a';
    default:
      return '#999';
  }
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
