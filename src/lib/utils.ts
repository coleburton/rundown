import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { storage } from './storage';

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

/**
 * Utility function to reset the onboarding state
 * This will force the app to show the onboarding flow on next start
 */
export async function resetOnboardingState(): Promise<void> {
  await storage.resetOnboarding();
  console.log('Onboarding state has been reset. App will show onboarding flow on next start.');
}

/**
 * Format a date as a string in the format "MMM D, YYYY"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a phone number string with proper US formatting
 * @param value - The input phone number string
 * @returns Formatted phone number: (123) 456-7890
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Apply formatting based on length
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

/**
 * Validate if a phone number is valid (US format)
 * @param phoneNumber - The phone number string to validate
 * @returns True if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Accept US numbers (10 digits) or international numbers (10-15 digits with country code)
  // Most international numbers are 10-15 digits including country code
  if (digits.length === 10) {
    // US number without country code
    return true;
  }
  
  if (digits.length >= 10 && digits.length <= 15) {
    // International number with country code
    return true;
  }
  
  return false;
}

/**
 * Validate if an email is valid (basic format check)
 * @param email - The email string to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Format an email (trim and lowercase)
 * @param email - The input email string
 * @returns Formatted email
 */
export function formatEmail(email: string): string {
  return email.trim().toLowerCase();
}