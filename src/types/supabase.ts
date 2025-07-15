export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          strava_id: string | null
          access_token: string | null
          goal_per_week: number
          streak_count: number
          message_style: 'supportive' | 'snarky' | 'chaotic'
          send_day: string
          send_time: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          strava_id?: string | null
          access_token?: string | null
          goal_per_week?: number
          streak_count?: number
          message_style?: 'supportive' | 'snarky' | 'chaotic'
          send_day?: string
          send_time?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          strava_id?: string | null
          access_token?: string | null
          goal_per_week?: number
          streak_count?: number
          message_style?: 'supportive' | 'snarky' | 'chaotic'
          send_day?: string
          send_time?: string
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          phone_number: string
          relationship: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone_number: string
          relationship?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone_number?: string
          relationship?: string | null
          created_at?: string
        }
      }
      run_logs: {
        Row: {
          id: string
          user_id: string
          activity_id: string
          date: string
          distance: number
          duration: number
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_id: string
          date: string
          distance: number
          duration: number
          type?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_id?: string
          date?: string
          distance?: number
          duration?: number
          type?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          sent_at: string
          status: 'pending' | 'sent' | 'failed'
          message_text: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          sent_at?: string
          status?: 'pending' | 'sent' | 'failed'
          message_text: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          sent_at?: string
          status?: 'pending' | 'sent' | 'failed'
          message_text?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 