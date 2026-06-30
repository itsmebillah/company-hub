export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          employee_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          date_of_birth: string | null;
          joining_date: string | null;
          photo_url: string | null;
          manager_id: string | null;
          company_id: string;
          role_id: string;
          auth_user_id: string | null;
          internal_auth_email: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          date_of_birth?: string | null;
          joining_date?: string | null;
          photo_url?: string | null;
          manager_id?: string | null;
          company_id: string;
          role_id: string;
          auth_user_id?: string | null;
          internal_auth_email?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          date_of_birth?: string | null;
          joining_date?: string | null;
          photo_url?: string | null;
          manager_id?: string | null;
          company_id?: string;
          role_id?: string;
          auth_user_id?: string | null;
          internal_auth_email?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          display_order: number;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          display_order: number;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          display_order?: number;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      record_status: "active" | "inactive" | "archived";
    };
    CompositeTypes: Record<string, never>;
  };
};
