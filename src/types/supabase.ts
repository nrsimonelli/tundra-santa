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
      event_participation: {
        Row: {
          created_at: string
          event: number
          games_won: number | null
          player: number
          updated_rating: Json | null
        }
        Insert: {
          created_at?: string
          event: number
          games_won?: number | null
          player: number
          updated_rating?: Json | null
        }
        Update: {
          created_at?: string
          event?: number
          games_won?: number | null
          player?: number
          updated_rating?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "public_event_participation_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_event_participation_player_fkey"
            columns: ["player"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          bid: boolean | null
          created_at: string
          draft: boolean | null
          id: number
          name: string | null
          num_players_per_game: number | null
          rating_event: boolean | null
          start_date: string | null
          winner: number | null
        }
        Insert: {
          bid?: boolean | null
          created_at?: string
          draft?: boolean | null
          id?: number
          name?: string | null
          num_players_per_game?: number | null
          rating_event?: boolean | null
          start_date?: string | null
          winner?: number | null
        }
        Update: {
          bid?: boolean | null
          created_at?: string
          draft?: boolean | null
          id?: number
          name?: string | null
          num_players_per_game?: number | null
          rating_event?: boolean | null
          start_date?: string | null
          winner?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_winner_fkey"
            columns: ["winner"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participation: {
        Row: {
          bid: number | null
          created_at: string
          faction: Database["public"]["Enums"]["faction"] | null
          final_score: number | null
          game: number
          player: number
          player_mat: Database["public"]["Enums"]["player_mat"] | null
          ranking: number | null
          updated_rating: Json | null
        }
        Insert: {
          bid?: number | null
          created_at?: string
          faction?: Database["public"]["Enums"]["faction"] | null
          final_score?: number | null
          game: number
          player: number
          player_mat?: Database["public"]["Enums"]["player_mat"] | null
          ranking?: number | null
          updated_rating?: Json | null
        }
        Update: {
          bid?: number | null
          created_at?: string
          faction?: Database["public"]["Enums"]["faction"] | null
          final_score?: number | null
          game?: number
          player?: number
          player_mat?: Database["public"]["Enums"]["player_mat"] | null
          ranking?: number | null
          updated_rating?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "public_game_participation_game_fkey"
            columns: ["game"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_game_participation_player_fkey"
            columns: ["player"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          event: number
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          event: number
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          event?: number
          id?: number
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_games_event_fkey"
            columns: ["event"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          current_rating: Json | null
          id: number
          username: string
        }
        Insert: {
          created_at?: string
          current_rating?: Json | null
          id?: number
          username: string
        }
        Update: {
          created_at?: string
          current_rating?: Json | null
          id?: number
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      faction:
        | "polania"
        | "albion"
        | "nordic"
        | "rusviet"
        | "togawa"
        | "crimea"
        | "saxony"
      player_mat:
        | "industrial"
        | "engineering"
        | "militant"
        | "patriotic"
        | "innovative"
        | "mechanical"
        | "agricultural"
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
