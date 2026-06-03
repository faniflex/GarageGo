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
      cart_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          spare_part_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          spare_part_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          spare_part_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_spare_part_id_fkey"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          garage_id: string | null
          id: string
          participant_one: string
          participant_two: string
          spare_part_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          garage_id?: string | null
          id?: string
          participant_one: string
          participant_two: string
          spare_part_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          garage_id?: string | null
          id?: string
          participant_one?: string
          participant_two?: string
          spare_part_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_spare_part_id_fkey"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_connects: {
        Row: {
          amount: number
          created_at: string
          garage_id: string
          id: string
          mechanic_id: string
          paid_out_at: string | null
          payout_status: string
          responded_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          garage_id: string
          id?: string
          mechanic_id: string
          paid_out_at?: string | null
          payout_status?: string
          responded_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          garage_id?: string
          id?: string
          mechanic_id?: string
          paid_out_at?: string | null
          payout_status?: string
          responded_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      garage_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string | null
          document_url: string
          garage_id: string
          id: string
          owner_id: string
          rejection_note: string | null
          status: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type?: string | null
          document_url: string
          garage_id: string
          id?: string
          owner_id: string
          rejection_note?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string | null
          document_url?: string
          garage_id?: string
          id?: string
          owner_id?: string
          rejection_note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_documents_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_images: {
        Row: {
          created_at: string
          garage_id: string
          id: string
          position: number
          url: string
        }
        Insert: {
          created_at?: string
          garage_id: string
          id?: string
          position?: number
          url: string
        }
        Update: {
          created_at?: string
          garage_id?: string
          id?: string
          position?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "garage_images_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garage_services: {
        Row: {
          created_at: string
          description: string | null
          garage_id: string
          id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          garage_id: string
          id?: string
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          garage_id?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "garage_services_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      garages: {
        Row: {
          address: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          mechanic_status: string
          name: string
          owner_id: string
          phone: string | null
          rating: number | null
          review_count: number | null
          services: string[] | null
          updated_at: string
          verification_level: number | null
          verified: boolean | null
        }
        Insert: {
          address: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          mechanic_status?: string
          name: string
          owner_id: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          updated_at?: string
          verification_level?: number | null
          verified?: boolean | null
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          mechanic_status?: string
          name?: string
          owner_id?: string
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          updated_at?: string
          verification_level?: number | null
          verified?: boolean | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          media_url: string | null
          message_type: string | null
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          media_url?: string | null
          message_type?: string | null
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          media_url?: string | null
          message_type?: string | null
          read?: boolean
          sender_id?: string
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
      orders: {
        Row: {
          amount: number
          conversation_id: string | null
          created_at: string
          customer_id: string
          garage_id: string
          id: string
          mechanic_id: string
          notes: string | null
          payment_status: string
          service_requested: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          conversation_id?: string | null
          created_at?: string
          customer_id: string
          garage_id: string
          id?: string
          mechanic_id: string
          notes?: string | null
          payment_status?: string
          service_requested: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          conversation_id?: string | null
          created_at?: string
          customer_id?: string
          garage_id?: string
          id?: string
          mechanic_id?: string
          notes?: string | null
          payment_status?: string
          service_requested?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
        ]
      }
      part_orders: {
        Row: {
          amount: number
          buyer_id: string
          conversation_id: string | null
          created_at: string
          id: string
          notes: string | null
          payment_status: string
          quantity: number
          seller_id: string
          spare_part_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: string
          quantity?: number
          seller_id: string
          spare_part_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_status?: string
          quantity?: number
          seller_id?: string
          spare_part_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          account_name: string
          account_number: string
          admin_note: string | null
          amount: number
          bank_name: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          admin_note?: string | null
          amount: number
          bank_name: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          admin_note?: string | null
          amount?: number
          bank_name?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          last_seen: string | null
          location: string | null
          online_status: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_seen?: string | null
          location?: string | null
          online_status?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_seen?: string | null
          location?: string | null
          online_status?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          garage_id: string | null
          id: string
          rating: number
          reviewer_id: string
          spare_part_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          garage_id?: string | null
          id?: string
          rating: number
          reviewer_id: string
          spare_part_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          garage_id?: string | null
          id?: string
          rating?: number
          reviewer_id?: string
          spare_part_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_garage_id_fkey"
            columns: ["garage_id"]
            isOneToOne: false
            referencedRelation: "garages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_spare_part_id_fkey"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_part_images: {
        Row: {
          created_at: string
          id: string
          position: number
          spare_part_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          spare_part_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          spare_part_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_part_images_spare_part_id_fkey"
            columns: ["spare_part_id"]
            isOneToOne: false
            referencedRelation: "spare_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts: {
        Row: {
          available: boolean | null
          car_model: string | null
          category: string | null
          condition: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          price: number
          rating: number | null
          seller_id: string
          sold: boolean
          updated_at: string
        }
        Insert: {
          available?: boolean | null
          car_model?: string | null
          category?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          price: number
          rating?: number | null
          seller_id: string
          sold?: boolean
          updated_at?: string
        }
        Update: {
          available?: boolean | null
          car_model?: string | null
          category?: string | null
          condition?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          price?: number
          rating?: number | null
          seller_id?: string
          sold?: boolean
          updated_at?: string
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          reference: string | null
          related_order_id: string | null
          related_user_id: string | null
          status: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          related_order_id?: string | null
          related_user_id?: string | null
          status?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          related_order_id?: string | null
          related_user_id?: string | null
          status?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      charge_listing_fee: {
        Args: { _kind: string; _ref_id: string; _user_id: string }
        Returns: Json
      }
      credit_wallet: {
        Args: {
          _amount: number
          _description?: string
          _reference: string
          _type?: string
          _user_id: string
        }
        Returns: Json
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      process_payout: {
        Args: { _admin_note?: string; _new_status: string; _payout_id: string }
        Returns: Json
      }
      process_wallet_payment: {
        Args: {
          _amount: number
          _buyer_id: string
          _description?: string
          _fee_bps?: number
          _order_id: string
          _seller_id: string
        }
        Returns: Json
      }
      process_weekly_connects: { Args: never; Returns: Json }
      request_garage_connect: { Args: { _garage_id: string }; Returns: Json }
      respond_garage_connect: {
        Args: { _accept: boolean; _connect_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "car_owner" | "mechanic" | "seller" | "admin"
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
      app_role: ["car_owner", "mechanic", "seller", "admin"],
    },
  },
} as const
