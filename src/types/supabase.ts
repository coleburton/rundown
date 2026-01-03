export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          achievement_count: number | null
          average_heartrate: number | null
          average_speed: number | null
          created_at: string | null
          distance: number | null
          elapsed_time: number | null
          id: string
          kudos_count: number | null
          max_heartrate: number | null
          max_speed: number | null
          moving_time: number | null
          name: string
          raw_data: Json | null
          sport_type: string
          start_date: string
          start_date_local: string
          strava_activity_id: number
          synced_at: string | null
          total_elevation_gain: number | null
          type: string
          user_id: string
        }
        Insert: {
          achievement_count?: number | null
          average_heartrate?: number | null
          average_speed?: number | null
          created_at?: string | null
          distance?: number | null
          elapsed_time?: number | null
          id?: string
          kudos_count?: number | null
          max_heartrate?: number | null
          max_speed?: number | null
          moving_time?: number | null
          name: string
          raw_data?: Json | null
          sport_type: string
          start_date: string
          start_date_local: string
          strava_activity_id: number
          synced_at?: string | null
          total_elevation_gain?: number | null
          type: string
          user_id: string
        }
        Update: {
          achievement_count?: number | null
          average_heartrate?: number | null
          average_speed?: number | null
          created_at?: string | null
          distance?: number | null
          elapsed_time?: number | null
          id?: string
          kudos_count?: number | null
          max_heartrate?: number | null
          max_speed?: number | null
          moving_time?: number | null
          name?: string
          raw_data?: Json | null
          sport_type?: string
          start_date?: string
          start_date_local?: string
          strava_activity_id?: number
          synced_at?: string | null
          total_elevation_gain?: number | null
          type?: string
          user_id?: string
      }
      Relationships: []
    }
    strava_activities: {
      Row: {
        achievement_count: number | null
        average_heartrate: number | null
        average_speed: number | null
        created_at: string | null
        distance: number | null
        elapsed_time: number | null
        id: string
        kudos_count: number | null
        max_heartrate: number | null
        max_speed: number | null
        moving_time: number | null
        name: string
        raw_data: Json | null
        sport_type: string
        start_date: string
        start_date_local: string
        strava_activity_id: number
        synced_at: string | null
        total_elevation_gain: number | null
        type: string
        user_id: string
      }
      Insert: {
        achievement_count?: number | null
        average_heartrate?: number | null
        average_speed?: number | null
        created_at?: string | null
        distance?: number | null
        elapsed_time?: number | null
        id?: string
        kudos_count?: number | null
        max_heartrate?: number | null
        max_speed?: number | null
        moving_time?: number | null
        name: string
        raw_data?: Json | null
        sport_type: string
        start_date: string
        start_date_local: string
        strava_activity_id: number
        synced_at?: string | null
        total_elevation_gain?: number | null
        type: string
        user_id: string
      }
      Update: {
        achievement_count?: number | null
        average_heartrate?: number | null
        average_speed?: number | null
        created_at?: string | null
        distance?: number | null
        elapsed_time?: number | null
        id?: string
        kudos_count?: number | null
        max_heartrate?: number | null
        max_speed?: number | null
        moving_time?: number | null
        name?: string
        raw_data?: Json | null
        sport_type?: string
        start_date?: string
        start_date_local?: string
        strava_activity_id?: number
        synced_at?: string | null
        total_elevation_gain?: number | null
        type?: string
        user_id?: string
      }
      Relationships: []
    }
      buddy_events: {
        Row: {
          contact_id: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_notified_at: string | null
          name: string
          notification_preference: string | null
          opt_out_token: string | null
          opted_out_at: string | null
          email: string
          relationship: string | null
          updated_at: string | null
          user_id: string
          verification_code: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_notified_at?: string | null
          name: string
          notification_preference?: string | null
          opt_out_token?: string | null
          opted_out_at?: string | null
          email: string
          relationship?: string | null
          updated_at?: string | null
          user_id: string
          verification_code?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_notified_at?: string | null
          name?: string
          notification_preference?: string | null
          opt_out_token?: string | null
          opted_out_at?: string | null
          email?: string
          relationship?: string | null
          updated_at?: string | null
          user_id?: string
          verification_code?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_history: {
        Row: {
          created_at: string
          effective_date: string
          goal_type: string
          goal_value: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effective_date?: string
          goal_type: string
          goal_value: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          goal_type?: string
          goal_value?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_progress: {
        Row: {
          current_value: number | null
          goal_id: string
          id: string
          is_achieved: boolean | null
          last_updated: string | null
          period_end: string
          period_start: string
          progress_percentage: number | null
          target_value: number
          user_id: string
        }
        Insert: {
          current_value?: number | null
          goal_id: string
          id?: string
          is_achieved?: boolean | null
          last_updated?: string | null
          period_end: string
          period_start: string
          progress_percentage?: number | null
          target_value: number
          user_id: string
        }
        Update: {
          current_value?: number | null
          goal_id?: string
          id?: string
          is_achieved?: boolean | null
          last_updated?: string | null
          period_end?: string
          period_start?: string
          progress_percentage?: number | null
          target_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "user_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contact_id: string
          id: string
          message_text: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          contact_id: string
          id?: string
          message_text: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          id?: string
          message_text?: string
          sent_at?: string
          status?: string
          user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "messages_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "messages_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "users"
          referencedColumns: ["id"]
        },
      ]
    }
      message_queue: {
        Row: {
          attempts: number | null
          contact_id: string
          created_at: string | null
          error_message: string | null
          id: string
          max_attempts: number | null
          message_text: string
          priority: number | null
          scheduled_for: string
          sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          contact_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          message_text: string
          priority?: number | null
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          contact_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          message_text?: string
          priority?: number | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      run_logs: {
        Row: {
          activity_id: string
          created_at: string | null
          date: string
          distance: number
          duration: number
          id: string
          type: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          date: string
          distance: number
          duration: number
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          date?: string
          distance?: number
          duration?: number
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      strava_webhook_events: {
        Row: {
          aspect_type: string
          created_at: string | null
          event_time: number
          id: string
          object_id: number
          object_type: string
          owner_id: number
          processed: boolean | null
          processed_at: string | null
          raw_data: Json
          subscription_id: number | null
          updates: Json | null
        }
        Insert: {
          aspect_type: string
          created_at?: string | null
          event_time: number
          id?: string
          object_id: number
          object_type: string
          owner_id: number
          processed?: boolean | null
          processed_at?: string | null
          raw_data: Json
          subscription_id?: number | null
          updates?: Json | null
        }
        Update: {
          aspect_type?: string
          created_at?: string | null
          event_time?: number
          id?: string
          object_id?: number
          object_type?: string
          owner_id?: number
          processed?: boolean | null
          processed_at?: string | null
          raw_data?: Json
          subscription_id?: number | null
          updates?: Json | null
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          created_at: string | null
          id: string
          last_activity_date: string | null
          last_sync_at: string | null
          sync_errors: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          last_sync_at?: string | null
          sync_errors?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          last_sync_at?: string | null
          sync_errors?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          activity_types: string[] | null
          created_at: string | null
          description: string | null
          end_date: string | null
          goal_type: string
          id: string
          is_active: boolean | null
          priority: number | null
          start_date: string | null
          target_unit: string
          target_value: number
          time_period: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_types?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          goal_type: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          start_date?: string | null
          target_unit: string
          target_value: number
          time_period: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_types?: string[] | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          goal_type?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          start_date?: string | null
          target_unit?: string
          target_value?: number
          time_period?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          access_token: string | null
          birthday: string | null
          created_at: string | null
          contact_name: string | null
          contact_phone: string | null
          email: string
          first_name: string | null
          fitness_level: string | null
          goal_per_week: number
          goal_type: string | null
          goal_value: number | null
          id: string
          last_login_at: string | null
          last_name: string | null
          measurement_unit: string | null
          message_day: string | null
          message_style: string
          message_time_period: string | null
          name: string | null
          notification_enabled: boolean | null
          primary_goal: string | null
          motivation_type: string | null
          refresh_token: string | null
          push_token: string | null
          reminder_time: string | null
          send_day: string
          send_time: string
          strava_id: string | null
          streak_count: number
          timezone: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          birthday?: string | null
          created_at?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          email: string
          first_name?: string | null
          fitness_level?: string | null
          goal_per_week?: number
          goal_type?: string | null
          goal_value?: number | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          measurement_unit?: string | null
          message_day?: string | null
          message_style?: string
          message_time_period?: string | null
          name?: string | null
          notification_enabled?: boolean | null
          primary_goal?: string | null
          motivation_type?: string | null
          refresh_token?: string | null
          push_token?: string | null
          reminder_time?: string | null
          send_day?: string
          send_time?: string
          strava_id?: string | null
          streak_count?: number
          timezone?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          birthday?: string | null
          created_at?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          email?: string
          first_name?: string | null
          fitness_level?: string | null
          goal_per_week?: number
          goal_type?: string | null
          goal_value?: number | null
          id?: string
          last_login_at?: string | null
          last_name?: string | null
          measurement_unit?: string | null
          message_day?: string | null
          message_style?: string
          message_time_period?: string | null
          name?: string | null
          notification_enabled?: boolean | null
          primary_goal?: string | null
          motivation_type?: string | null
          refresh_token?: string | null
          push_token?: string | null
          reminder_time?: string | null
          send_day?: string
          send_time?: string
          strava_id?: string | null
          streak_count?: number
          timezone?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_goal_for_week: {
        Args: { p_user_id: string; p_week_start: string }
        Returns: {
          goal_type: string
          goal_value: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
