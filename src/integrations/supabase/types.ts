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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      balances: {
        Row: {
          amount: number
          asset: string
          user_id: string
        }
        Insert: {
          amount?: number
          asset: string
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string
          user_id?: string
        }
        Relationships: []
      }
      checks: {
        Row: {
          amount: number
          asset: string
          claimed_at: string | null
          claimed_by: string | null
          code: string
          comment: string | null
          created_at: string
          creator_id: string
          id: string
        }
        Insert: {
          amount: number
          asset: string
          claimed_at?: string | null
          claimed_by?: string | null
          code: string
          comment?: string | null
          created_at?: string
          creator_id: string
          id?: string
        }
        Update: {
          amount?: number
          asset?: string
          claimed_at?: string | null
          claimed_by?: string | null
          code?: string
          comment?: string | null
          created_at?: string
          creator_id?: string
          id?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          asset: string
          change_24h: number
          name: string
          updated_at: string
          usd: number
        }
        Insert: {
          asset: string
          change_24h?: number
          name: string
          updated_at?: string
          usd: number
        }
        Update: {
          asset?: string
          change_24h?: number
          name?: string
          updated_at?: string
          usd?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          tg_id: number | null
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          is_admin?: boolean
          tg_id?: number | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          tg_id?: number | null
          username?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          asset: string
          counterparty: string | null
          created_at: string
          id: string
          kind: string
          note: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          asset: string
          counterparty?: string | null
          created_at?: string
          id?: string
          kind: string
          note?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string
          counterparty?: string | null
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          asset: string
          created_at: string
          destination: string
          id: string
          method: string
          status: string
          usd_value: number
          user_id: string
        }
        Insert: {
          amount: number
          asset: string
          created_at?: string
          destination: string
          id?: string
          method?: string
          status?: string
          usd_value?: number
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string
          created_at?: string
          destination?: string
          id?: string
          method?: string
          status?: string
          usd_value?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_balance: {
        Args: { p_asset: string; p_delta: number; p_user: string }
        Returns: undefined
      }
      admin_adjust_balance: {
        Args: { p_asset: string; p_delta: number; p_username: string }
        Returns: undefined
      }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          tg_id: number
          usd_total: number
          username: string
        }[]
      }
      bootstrap_profile: {
        Args: { p_tg_id?: number; p_username: string }
        Returns: {
          created_at: string
          id: string
          is_admin: boolean
          tg_id: number | null
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_check: {
        Args: { p_code: string }
        Returns: {
          amount: number
          asset: string
          claimed_at: string | null
          claimed_by: string | null
          code: string
          comment: string | null
          created_at: string
          creator_id: string
          id: string
        }
        SetofOptions: {
          from: "*"
          to: "checks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_check: {
        Args: { p_amount: number; p_asset: string; p_comment?: string }
        Returns: string
      }
      request_withdrawal: {
        Args: {
          p_amount: number
          p_asset: string
          p_destination: string
          p_method: string
        }
        Returns: {
          amount: number
          asset: string
          created_at: string
          destination: string
          id: string
          method: string
          status: string
          usd_value: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "withdrawals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      swap_assets: {
        Args: { p_amount: number; p_from: string; p_to: string }
        Returns: number
      }
      transfer_to_user: {
        Args: { p_amount: number; p_asset: string; p_username: string }
        Returns: undefined
      }
      username_exists: { Args: { p_username: string }; Returns: boolean }
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
