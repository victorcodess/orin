export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assistant_configs: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          personality: string
          personality_settings: Json
          updated_at: string
          user_id: string | null
          voice_id: string
          voice_speed: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          personality: string
          personality_settings?: Json
          updated_at?: string
          user_id?: string | null
          voice_id: string
          voice_speed?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          personality?: string
          personality_settings?: Json
          updated_at?: string
          user_id?: string | null
          voice_id?: string
          voice_speed?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          active_voice_session_id: string | null
          created_at: string
          id: string
          is_favorited: boolean
          session_id: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active_voice_session_id?: string | null
          created_at?: string
          id?: string
          is_favorited?: boolean
          session_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active_voice_session_id?: string | null
          created_at?: string
          id?: string
          is_favorited?: boolean
          session_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          stripe_payment_id: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          stripe_payment_id?: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          stripe_payment_id?: string | null
          type?: Database["public"]["Enums"]["credit_transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          source: Database["public"]["Enums"]["message_source"]
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          source?: Database["public"]["Enums"]["message_source"]
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          source?: Database["public"]["Enums"]["message_source"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          credits_balance: number
          display_name: string | null
          elevenlabs_api_key_encrypted: string | null
          id: string
          language: string
          message_bubble_layout: string
          onboarding_completed: boolean
          openai_api_key_encrypted: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credits_balance?: number
          display_name?: string | null
          elevenlabs_api_key_encrypted?: string | null
          id: string
          language?: string
          message_bubble_layout?: string
          onboarding_completed?: boolean
          openai_api_key_encrypted?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credits_balance?: number
          display_name?: string | null
          elevenlabs_api_key_encrypted?: string | null
          id?: string
          language?: string
          message_bubble_layout?: string
          onboarding_completed?: boolean
          openai_api_key_encrypted?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_events: {
        Row: {
          amount: number
          conversation_id: string | null
          created_at: string
          id: string
          session_id: string | null
          type: Database["public"]["Enums"]["usage_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          conversation_id?: string | null
          created_at?: string
          id?: string
          session_id?: string | null
          type: Database["public"]["Enums"]["usage_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          conversation_id?: string | null
          created_at?: string
          id?: string
          session_id?: string | null
          type?: Database["public"]["Enums"]["usage_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      merge_anon_session_to_user: {
        Args: {
          anon_session_id: string
          target_user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      credit_transaction_type: "purchase" | "grant" | "usage" | "refund"
      message_source: "text" | "voice"
      usage_type: "text_tokens" | "stt_seconds" | "tts_chars" | "voice_minutes"
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
    Enums: {
      credit_transaction_type: ["purchase", "grant", "usage", "refund"],
      message_source: ["text", "voice"],
      usage_type: ["text_tokens", "stt_seconds", "tts_chars", "voice_minutes"],
    },
  },
} as const
