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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      commission_earnings: {
        Row: {
          amount: number
          asset_type: Database["public"]["Enums"]["asset_type"]
          earned_at: string | null
          id: string
          order_id: string | null
          position_id: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          amount: number
          asset_type: Database["public"]["Enums"]["asset_type"]
          earned_at?: string | null
          id?: string
          order_id?: string | null
          position_id?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          amount?: number
          asset_type?: Database["public"]["Enums"]["asset_type"]
          earned_at?: string | null
          id?: string
          order_id?: string | null
          position_id?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "trading_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_earnings_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "user_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_payments: {
        Row: {
          amount_crypto: number
          amount_usd: number
          blockchain: string
          created_at: string
          id: string
          omni99_amount: number
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_crypto: number
          amount_usd: number
          blockchain: string
          created_at?: string
          id?: string
          omni99_amount: number
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_crypto?: number
          amount_usd?: number
          blockchain?: string
          created_at?: string
          id?: string
          omni99_amount?: number
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      market_data_sources: {
        Row: {
          active: boolean | null
          api_endpoint: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string | null
          id: string
          name: string
          rate_limit_per_minute: number | null
          requires_api_key: boolean | null
          websocket_endpoint: string | null
        }
        Insert: {
          active?: boolean | null
          api_endpoint?: string | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at?: string | null
          id?: string
          name: string
          rate_limit_per_minute?: number | null
          requires_api_key?: boolean | null
          websocket_endpoint?: string | null
        }
        Update: {
          active?: boolean | null
          api_endpoint?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string | null
          id?: string
          name?: string
          rate_limit_per_minute?: number | null
          requires_api_key?: boolean | null
          websocket_endpoint?: string | null
        }
        Relationships: []
      }
      omni99_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_purchased: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_purchased?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_addresses: {
        Row: {
          active: boolean
          address: string
          blockchain: string
          created_at: string
          id: string
        }
        Insert: {
          active?: boolean
          address: string
          blockchain: string
          created_at?: string
          id?: string
        }
        Update: {
          active?: boolean
          address?: string
          blockchain?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      trading_fees: {
        Row: {
          active: boolean | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at: string | null
          exchange: string | null
          id: string
          maker_fee: number
          market_type: Database["public"]["Enums"]["market_type"]
          max_fee: number | null
          min_fee: number | null
          platform_commission_rate: number
          taker_fee: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          asset_type: Database["public"]["Enums"]["asset_type"]
          created_at?: string | null
          exchange?: string | null
          id?: string
          maker_fee?: number
          market_type: Database["public"]["Enums"]["market_type"]
          max_fee?: number | null
          min_fee?: number | null
          platform_commission_rate?: number
          taker_fee?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          asset_type?: Database["public"]["Enums"]["asset_type"]
          created_at?: string | null
          exchange?: string | null
          id?: string
          maker_fee?: number
          market_type?: Database["public"]["Enums"]["market_type"]
          max_fee?: number | null
          min_fee?: number | null
          platform_commission_rate?: number
          taker_fee?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      trading_orders: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          commission_fee: number | null
          created_at: string | null
          exchange: string | null
          filled_quantity: number | null
          id: string
          leverage: number | null
          market_type: Database["public"]["Enums"]["market_type"] | null
          order_type: string
          position_id: string | null
          price: number | null
          quantity: number
          side: string
          status: string | null
          symbol: string
          total_cost: number | null
          trading_fee: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          commission_fee?: number | null
          created_at?: string | null
          exchange?: string | null
          filled_quantity?: number | null
          id?: string
          leverage?: number | null
          market_type?: Database["public"]["Enums"]["market_type"] | null
          order_type: string
          position_id?: string | null
          price?: number | null
          quantity: number
          side: string
          status?: string | null
          symbol: string
          total_cost?: number | null
          trading_fee?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          commission_fee?: number | null
          created_at?: string | null
          exchange?: string | null
          filled_quantity?: number | null
          id?: string
          leverage?: number | null
          market_type?: Database["public"]["Enums"]["market_type"] | null
          order_type?: string
          position_id?: string | null
          price?: number | null
          quantity?: number
          side?: string
          status?: string | null
          symbol?: string
          total_cost?: number | null
          trading_fee?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trading_orders_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "user_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_positions: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          closed_at: string | null
          commission_paid: number | null
          created_at: string | null
          current_price: number | null
          entry_price: number
          exchange: string | null
          id: string
          leverage: number | null
          market_type: Database["public"]["Enums"]["market_type"] | null
          opened_at: string | null
          quantity: number
          realized_pnl: number | null
          side: string
          status: string | null
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          total_fees: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          closed_at?: string | null
          commission_paid?: number | null
          created_at?: string | null
          current_price?: number | null
          entry_price: number
          exchange?: string | null
          id?: string
          leverage?: number | null
          market_type?: Database["public"]["Enums"]["market_type"] | null
          opened_at?: string | null
          quantity: number
          realized_pnl?: number | null
          side: string
          status?: string | null
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          total_fees?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          closed_at?: string | null
          commission_paid?: number | null
          created_at?: string | null
          current_price?: number | null
          entry_price?: number
          exchange?: string | null
          id?: string
          leverage?: number | null
          market_type?: Database["public"]["Enums"]["market_type"] | null
          opened_at?: string | null
          quantity?: number
          realized_pnl?: number | null
          side?: string
          status?: string | null
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          total_fees?: number | null
          updated_at?: string | null
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_watchlist: {
        Row: {
          added_at: string | null
          asset_type: Database["public"]["Enums"]["asset_type"] | null
          exchange: string | null
          id: string
          is_favorite: boolean | null
          notes: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          exchange?: string | null
          id?: string
          is_favorite?: boolean | null
          notes?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          asset_type?: Database["public"]["Enums"]["asset_type"] | null
          exchange?: string | null
          id?: string
          is_favorite?: boolean | null
          notes?: string | null
          symbol?: string
          user_id?: string
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
      update_omni99_balance: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference_id?: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      asset_type: "crypto" | "stock" | "forex" | "commodity" | "index"
      market_type: "spot" | "futures" | "options" | "cfd"
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
      app_role: ["admin", "user"],
      asset_type: ["crypto", "stock", "forex", "commodity", "index"],
      market_type: ["spot", "futures", "options", "cfd"],
    },
  },
} as const
