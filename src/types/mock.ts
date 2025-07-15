export interface User {
  id: string;
  email: string;
  name?: string;
  stravaConnected?: boolean;
  stravaId?: string;
  weeklyGoal?: number;
  messageStyle?: string;
  goal_per_week?: number;
  message_style?: string;
  onboardingCompleted?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
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
  sent_at: string;
  contact_id: string;
} 