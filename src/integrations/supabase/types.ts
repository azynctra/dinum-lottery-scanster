export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      lottery_results: {
        Row: {
          content: string | null
          created_at: string
          id: string
          url: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          url: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          url?: string
        }
        Relationships: []
      }
      mega_power_500k: {
        Row: {
          created_at: string
          draw_id: string
          id: string
          number1: string
          number2: string
          number3: string
          number4: string
          number5: string
          number6: string
        }
        Insert: {
          created_at?: string
          draw_id: string
          id?: string
          number1: string
          number2: string
          number3: string
          number4: string
          number5: string
          number6: string
        }
        Update: {
          created_at?: string
          draw_id?: string
          id?: string
          number1?: string
          number2?: string
          number3?: string
          number4?: string
          number5?: string
          number6?: string
        }
        Relationships: [
          {
            foreignKeyName: "mega_power_500k_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "mega_power_complete_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_power_500k_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "mega_power_results"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_power_lakshapathi: {
        Row: {
          created_at: string
          draw_id: string
          id: string
          number1: string
          number2: string
          number3: string
          number4: string
          number5: string
          number6: string | null
        }
        Insert: {
          created_at?: string
          draw_id: string
          id?: string
          number1: string
          number2: string
          number3: string
          number4: string
          number5: string
          number6?: string | null
        }
        Update: {
          created_at?: string
          draw_id?: string
          id?: string
          number1?: string
          number2?: string
          number3?: string
          number4?: string
          number5?: string
          number6?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mega_power_lakshapathi_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "mega_power_complete_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_power_lakshapathi_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "mega_power_results"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_power_millionaire: {
        Row: {
          created_at: string
          draw_id: string
          id: string
          number1: string
          number2: string
          number3: string
          number4: string
          number5: string
          number6: string
        }
        Insert: {
          created_at?: string
          draw_id: string
          id?: string
          number1: string
          number2: string
          number3: string
          number4: string
          number5: string
          number6: string
        }
        Update: {
          created_at?: string
          draw_id?: string
          id?: string
          number1?: string
          number2?: string
          number3?: string
          number4?: string
          number5?: string
          number6?: string
        }
        Relationships: [
          {
            foreignKeyName: "mega_power_millionaire_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "mega_power_complete_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mega_power_millionaire_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "mega_power_results"
            referencedColumns: ["id"]
          },
        ]
      }
      mega_power_results: {
        Row: {
          created_at: string
          draw_date: string
          draw_number: string
          format: Database["public"]["Enums"]["mega_power_format"]
          id: string
          letter: string
          number1: string
          number2: string
          number3: string
          number4: string
          super_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          draw_date: string
          draw_number: string
          format?: Database["public"]["Enums"]["mega_power_format"]
          id?: string
          letter: string
          number1: string
          number2: string
          number3: string
          number4: string
          super_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          draw_date?: string
          draw_number?: string
          format?: Database["public"]["Enums"]["mega_power_format"]
          id?: string
          letter?: string
          number1?: string
          number2?: string
          number3?: string
          number4?: string
          super_number?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      mega_power_complete_results: {
        Row: {
          created_at: string | null
          draw_date: string | null
          draw_number: string | null
          five_hundred_k_number1: string | null
          five_hundred_k_number2: string | null
          five_hundred_k_number3: string | null
          five_hundred_k_number4: string | null
          five_hundred_k_number5: string | null
          five_hundred_k_number6: string | null
          format: Database["public"]["Enums"]["mega_power_format"] | null
          id: string | null
          lakshapathi_number1: string | null
          lakshapathi_number2: string | null
          lakshapathi_number3: string | null
          lakshapathi_number4: string | null
          lakshapathi_number5: string | null
          lakshapathi_number6: string | null
          letter: string | null
          millionaire_number1: string | null
          millionaire_number2: string | null
          millionaire_number3: string | null
          millionaire_number4: string | null
          millionaire_number5: string | null
          millionaire_number6: string | null
          number1: string | null
          number2: string | null
          number3: string | null
          number4: string | null
          super_number: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      mega_power_format: "new" | "old" | "special"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
