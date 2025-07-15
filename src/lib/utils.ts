import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date validation utilities
export function isValidDate(dateString: string): boolean {
  if (!dateString || dateString.trim() === '') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function formatSafeDate(dateString: string, options: Intl.DateTimeFormatOptions = {}, fallback: string = 'Invalid Date'): string {
  if (!isValidDate(dateString)) {
    return fallback;
  }
  return new Date(dateString).toLocaleDateString('en-US', options);
}

export function formatActivityDate(dateString: string): string {
  if (!isValidDate(dateString)) {
    return 'Invalid Date';
  }
  
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

export function getWeekDateRange(): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const startMonth = monday.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = sunday.toLocaleDateString('en-US', { month: 'short' });
  
  if (startMonth === endMonth) {
    return `${startMonth} ${monday.getDate()}-${sunday.getDate()}`;
  } else {
    return `${startMonth} ${monday.getDate()} - ${endMonth} ${sunday.getDate()}`;
  }
} 