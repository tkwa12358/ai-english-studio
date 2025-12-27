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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      auth_codes: {
        Row: {
          code: string
          code_type: string
          created_at: string
          credits_amount: number | null
          expires_at: string | null
          id: string
          is_used: boolean
          minutes_amount: number | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          code_type: string
          created_at?: string
          credits_amount?: number | null
          expires_at?: string | null
          id?: string
          is_used?: boolean
          minutes_amount?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          code_type?: string
          created_at?: string
          credits_amount?: number | null
          expires_at?: string | null
          id?: string
          is_used?: boolean
          minutes_amount?: number | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      learning_progress: {
        Row: {
          completed_sentences: number[] | null
          created_at: string
          id: string
          last_position: number
          total_practice_time: number
          updated_at: string
          user_id: string
          video_id: string | null
        }
        Insert: {
          completed_sentences?: number[] | null
          created_at?: string
          id?: string
          last_position?: number
          total_practice_time?: number
          updated_at?: string
          user_id: string
          video_id?: string | null
        }
        Update: {
          completed_sentences?: number[] | null
          created_at?: string
          id?: string
          last_position?: number
          total_practice_time?: number
          updated_at?: string
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_assessment_providers: {
        Row: {
          api_endpoint: string
          api_key_secret_name: string | null
          api_secret_key_name: string | null
          config_json: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          priority: number | null
          provider_type: string
          region: string | null
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          api_key_secret_name?: string | null
          api_secret_key_name?: string | null
          config_json?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          priority?: number | null
          provider_type: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          api_key_secret_name?: string | null
          api_secret_key_name?: string | null
          config_json?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          priority?: number | null
          provider_type?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      professional_assessments: {
        Row: {
          accuracy_score: number | null
          billing_error: string | null
          completeness_score: number | null
          created_at: string
          duration_seconds: number | null
          feedback: string | null
          fluency_score: number | null
          id: string
          is_billed: boolean | null
          minutes_charged: number | null
          original_text: string
          overall_score: number | null
          phonemes_result: Json | null
          pronunciation_score: number | null
          provider_id: string | null
          provider_name: string
          raw_response: Json | null
          user_id: string
          video_id: string | null
          words_result: Json | null
        }
        Insert: {
          accuracy_score?: number | null
          billing_error?: string | null
          completeness_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: string | null
          fluency_score?: number | null
          id?: string
          is_billed?: boolean | null
          minutes_charged?: number | null
          original_text: string
          overall_score?: number | null
          phonemes_result?: Json | null
          pronunciation_score?: number | null
          provider_id?: string | null
          provider_name: string
          raw_response?: Json | null
          user_id: string
          video_id?: string | null
          words_result?: Json | null
        }
        Update: {
          accuracy_score?: number | null
          billing_error?: string | null
          completeness_score?: number | null
          created_at?: string
          duration_seconds?: number | null
          feedback?: string | null
          fluency_score?: number | null
          id?: string
          is_billed?: boolean | null
          minutes_charged?: number | null
          original_text?: string
          overall_score?: number | null
          phonemes_result?: Json | null
          pronunciation_score?: number | null
          provider_id?: string | null
          provider_name?: string
          raw_response?: Json | null
          user_id?: string
          video_id?: string | null
          words_result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_assessments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "professional_assessment_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_assessments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          professional_voice_minutes: number | null
          role: string
          updated_at: string
          user_id: string
          voice_minutes: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          professional_voice_minutes?: number | null
          role?: string
          updated_at?: string
          user_id: string
          voice_minutes?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          professional_voice_minutes?: number | null
          role?: string
          updated_at?: string
          user_id?: string
          voice_minutes?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      videos: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration: number | null
          id: string
          is_published: boolean
          subtitles_cn: string | null
          subtitles_en: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
          view_count: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean
          subtitles_cn?: string | null
          subtitles_en?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
          view_count?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean
          subtitles_cn?: string | null
          subtitles_en?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_assessment_models: {
        Row: {
          api_endpoint: string
          api_key_secret_name: string | null
          created_at: string
          id: string
          is_active: boolean | null
          model_identifier: string | null
          name: string
          priority: number | null
          provider: string
          supports_realtime: boolean | null
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          api_key_secret_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          model_identifier?: string | null
          name: string
          priority?: number | null
          provider: string
          supports_realtime?: boolean | null
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          api_key_secret_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          model_identifier?: string | null
          name?: string
          priority?: number | null
          provider?: string
          supports_realtime?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      voice_assessments: {
        Row: {
          accuracy_score: number | null
          completeness_score: number | null
          created_at: string
          feedback: string | null
          fluency_score: number | null
          id: string
          original_text: string
          overall_score: number | null
          user_audio_url: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          accuracy_score?: number | null
          completeness_score?: number | null
          created_at?: string
          feedback?: string | null
          fluency_score?: number | null
          id?: string
          original_text: string
          overall_score?: number | null
          user_audio_url?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          accuracy_score?: number | null
          completeness_score?: number | null
          created_at?: string
          feedback?: string | null
          fluency_score?: number | null
          id?: string
          original_text?: string
          overall_score?: number | null
          user_audio_url?: string | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_assessments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_usage_logs: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          model_used: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          model_used?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          model_used?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      word_book: {
        Row: {
          context: string | null
          created_at: string
          id: string
          mastery_level: number
          phonetic: string | null
          reviewed_at: string | null
          translation: string | null
          user_id: string
          word: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          mastery_level?: number
          phonetic?: string | null
          reviewed_at?: string | null
          translation?: string | null
          user_id: string
          word: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          mastery_level?: number
          phonetic?: string | null
          reviewed_at?: string | null
          translation?: string | null
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      word_cache: {
        Row: {
          created_at: string
          definitions: Json | null
          id: string
          phonetic: string | null
          translation: string | null
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          definitions?: Json | null
          id?: string
          phonetic?: string | null
          translation?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          created_at?: string
          definitions?: Json | null
          id?: string
          phonetic?: string | null
          translation?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
