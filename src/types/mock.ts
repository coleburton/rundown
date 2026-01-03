export interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  stravaConnected?: boolean;
  stravaId?: string;
  weeklyGoal?: number;
  messageStyle?: string;
  goal_per_week?: number;
  goal_type?: 'runs' | 'run_miles' | 'activities' | 'bike_rides' | 'bike_miles';
  goal_value?: number;
  message_style?: string;
  onboardingCompleted?: boolean;
  onboarding_step?: string;
  motivation_type?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  userId?: string;
  role?: string;
  isActive?: boolean;
  phoneNumber?: string;
  notificationPreference?: string;
}

export interface Activity {
  id: string;
  type: string;
  distance: number;
  duration: number;
  date: string;
}

export interface AccountabilityMessage {
  id: string;
  content: string;
  sent_at?: string;
  sentAt?: string;
  contact_id?: string;
  contactId?: string;
  user_id?: string;
  userId?: string;
  messageType?: string;
  messageStyle?: string;
  weekStartDate?: string;
  weekEndDate?: string;
  runsCompleted?: number;
  runGoal?: number;
} 
