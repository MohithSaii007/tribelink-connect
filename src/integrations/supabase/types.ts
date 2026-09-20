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
      application_events: {
        Row: {
          application_id: string
          created_at: string
          id: string
          note: string | null
          status: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          note?: string | null
          status: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          id: string
          readiness: number
          reference_no: string
          remarks: string | null
          scheme_id: string
          status: string
          student_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          readiness?: number
          reference_no?: string
          remarks?: string | null
          scheme_id: string
          status?: string
          student_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          readiness?: number
          reference_no?: string
          remarks?: string | null
          scheme_id?: string
          status?: string
          student_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "scholarship_schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_name: string | null
          created_at: string
          entity: string | null
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          actor_name?: string | null
          created_at?: string
          entity?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_name?: string | null
          created_at?: string
          entity?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      beneficiary_gaps: {
        Row: {
          confidence: number
          course: string | null
          created_at: string
          data_sources: string[]
          district: string
          id: string
          institution: string
          name: string
          potential_scheme: string | null
          reasons: string[]
          state: string
          status: string
          student_reference: string
        }
        Insert: {
          confidence?: number
          course?: string | null
          created_at?: string
          data_sources?: string[]
          district: string
          id?: string
          institution: string
          name: string
          potential_scheme?: string | null
          reasons?: string[]
          state: string
          status?: string
          student_reference: string
        }
        Update: {
          confidence?: number
          course?: string | null
          created_at?: string
          data_sources?: string[]
          district?: string
          id?: string
          institution?: string
          name?: string
          potential_scheme?: string | null
          reasons?: string[]
          state?: string
          status?: string
          student_reference?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          lang: string
          message: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lang?: string
          message: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lang?: string
          message?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          extracted_data: Json
          file_url: string | null
          id: string
          mismatch_notes: string[]
          name: string
          source: string
          student_id: string
          valid_until: string | null
          verification_status: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          extracted_data?: Json
          file_url?: string | null
          id?: string
          mismatch_notes?: string[]
          name: string
          source?: string
          student_id: string
          valid_until?: string | null
          verification_status?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          extracted_data?: Json
          file_url?: string | null
          id?: string
          mismatch_notes?: string[]
          name?: string
          source?: string
          student_id?: string
          valid_until?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_status: boolean
          student_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_status?: boolean
          student_id?: string | null
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_status?: boolean
          student_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string | null
          bank_status: string | null
          created_at: string
          id: string
          payment_date: string | null
          sanction_date: string | null
          scheme_id: string | null
          status: string
          student_id: string
          transaction_reference: string | null
        }
        Insert: {
          amount?: number
          application_id?: string | null
          bank_status?: string | null
          created_at?: string
          id?: string
          payment_date?: string | null
          sanction_date?: string | null
          scheme_id?: string | null
          status?: string
          student_id: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          application_id?: string | null
          bank_status?: string | null
          created_at?: string
          id?: string
          payment_date?: string | null
          sanction_date?: string | null
          scheme_id?: string | null
          status?: string
          student_id?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      scholarship_schemes: {
        Row: {
          award_amount: number | null
          deadline: string | null
          description: string
          effective_date: string
          eligibility_rules: Json
          id: string
          ministry: string
          name: string
          required_documents: string[]
          short_name: string
          status: string
          target: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          award_amount?: number | null
          deadline?: string | null
          description: string
          effective_date?: string
          eligibility_rules?: Json
          id: string
          ministry?: string
          name: string
          required_documents?: string[]
          short_name: string
          status?: string
          target: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          award_amount?: number | null
          deadline?: string | null
          description?: string
          effective_date?: string
          eligibility_rules?: Json
          id?: string
          ministry?: string
          name?: string
          required_documents?: string[]
          short_name?: string
          status?: string
          target?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          aadhaar_masked: string | null
          academic_score: number | null
          account_number_masked: string | null
          aishe_code: string | null
          annual_income: number | null
          bank_account_name: string | null
          bank_name: string | null
          course: string | null
          created_at: string
          dbt_enabled: boolean
          degree_level: string | null
          district: string | null
          dob: string | null
          email: string | null
          enrollment_no: string | null
          full_name: string
          gender: string | null
          id: string
          identity_verified: boolean
          ifsc: string | null
          institution: string | null
          is_demo: boolean
          parent_name: string | null
          parent_occupation: string | null
          phone: string | null
          pvtg_status: boolean
          st_status: boolean
          state: string | null
          tribe: string | null
          updated_at: string
          user_id: string | null
          year_of_study: number | null
        }
        Insert: {
          aadhaar_masked?: string | null
          academic_score?: number | null
          account_number_masked?: string | null
          aishe_code?: string | null
          annual_income?: number | null
          bank_account_name?: string | null
          bank_name?: string | null
          course?: string | null
          created_at?: string
          dbt_enabled?: boolean
          degree_level?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          enrollment_no?: string | null
          full_name: string
          gender?: string | null
          id?: string
          identity_verified?: boolean
          ifsc?: string | null
          institution?: string | null
          is_demo?: boolean
          parent_name?: string | null
          parent_occupation?: string | null
          phone?: string | null
          pvtg_status?: boolean
          st_status?: boolean
          state?: string | null
          tribe?: string | null
          updated_at?: string
          user_id?: string | null
          year_of_study?: number | null
        }
        Update: {
          aadhaar_masked?: string | null
          academic_score?: number | null
          account_number_masked?: string | null
          aishe_code?: string | null
          annual_income?: number | null
          bank_account_name?: string | null
          bank_name?: string | null
          course?: string | null
          created_at?: string
          dbt_enabled?: boolean
          degree_level?: string | null
          district?: string | null
          dob?: string | null
          email?: string | null
          enrollment_no?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          identity_verified?: boolean
          ifsc?: string | null
          institution?: string | null
          is_demo?: boolean
          parent_name?: string | null
          parent_occupation?: string | null
          phone?: string | null
          pvtg_status?: boolean
          st_status?: boolean
          state?: string | null
          tribe?: string | null
          updated_at?: string
          user_id?: string | null
          year_of_study?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_records: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          remarks: string | null
          source: string | null
          status: string
          student_id: string
          verification_type: string
          verified_by: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          remarks?: string | null
          source?: string | null
          status?: string
          student_id: string
          verification_type: string
          verified_by?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          remarks?: string | null
          source?: string | null
          status?: string
          student_id?: string
          verification_type?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_records_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      owns_student: { Args: { _student_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "student" | "officer" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["student", "officer", "admin"],
    },
  },
} as const
