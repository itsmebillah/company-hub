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
      company_settings: {
        Row: {
          company_id: string;
          company_name: string;
          short_name: string | null;
          company_logo: string | null;
          favicon: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          support_phone: string | null;
          support_email: string | null;
          website: string | null;
          address: string | null;
          timezone: string | null;
          date_format: string | null;
          currency: string | null;
          default_theme: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          company_name: string;
          short_name?: string | null;
          company_logo?: string | null;
          favicon?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          support_phone?: string | null;
          support_email?: string | null;
          website?: string | null;
          address?: string | null;
          timezone?: string | null;
          date_format?: string | null;
          currency?: string | null;
          default_theme?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          company_name?: string;
          short_name?: string | null;
          company_logo?: string | null;
          favicon?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          support_phone?: string | null;
          support_email?: string | null;
          website?: string | null;
          address?: string | null;
          timezone?: string | null;
          date_format?: string | null;
          currency?: string | null;
          default_theme?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
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
      resource_categories: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          icon: string | null;
          color: string | null;
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
          icon?: string | null;
          color?: string | null;
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
          icon?: string | null;
          color?: string | null;
          display_order?: number;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          company_id: string;
          category_id: string;
          title: string;
          description: string | null;
          resource_type: Database["public"]["Enums"]["resource_type"];
          url: string | null;
          icon: string | null;
          thumbnail: string | null;
          open_mode: Database["public"]["Enums"]["resource_open_mode"];
          display_order: number;
          is_featured: boolean;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          category_id: string;
          title: string;
          description?: string | null;
          resource_type: Database["public"]["Enums"]["resource_type"];
          url?: string | null;
          icon?: string | null;
          thumbnail?: string | null;
          open_mode?: Database["public"]["Enums"]["resource_open_mode"];
          display_order: number;
          is_featured?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          category_id?: string;
          title?: string;
          description?: string | null;
          resource_type?: Database["public"]["Enums"]["resource_type"];
          url?: string | null;
          icon?: string | null;
          thumbnail?: string | null;
          open_mode?: Database["public"]["Enums"]["resource_open_mode"];
          display_order?: number;
          is_featured?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      resource_permissions: {
        Row: {
          id: string;
          company_id: string;
          resource_id: string;
          permission_type: Database["public"]["Enums"]["permission_type"];
          role_id: string | null;
          employee_id: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          resource_id: string;
          permission_type: Database["public"]["Enums"]["permission_type"];
          role_id?: string | null;
          employee_id?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          resource_id?: string;
          permission_type?: Database["public"]["Enums"]["permission_type"];
          role_id?: string | null;
          employee_id?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          description: string | null;
          banner_url: string | null;
          priority: Database["public"]["Enums"]["announcement_priority"];
          publish_from: string | null;
          publish_until: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          status: Database["public"]["Enums"]["record_status"];
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          description?: string | null;
          banner_url?: string | null;
          priority?: Database["public"]["Enums"]["announcement_priority"];
          publish_from?: string | null;
          publish_until?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: Database["public"]["Enums"]["record_status"];
        };
        Update: {
          id?: string;
          company_id?: string;
          title?: string;
          description?: string | null;
          banner_url?: string | null;
          priority?: Database["public"]["Enums"]["announcement_priority"];
          publish_from?: string | null;
          publish_until?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: Database["public"]["Enums"]["record_status"];
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          message: string;
          action_url: string | null;
          is_read: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          message: string;
          action_url?: string | null;
          is_read?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string;
          message?: string;
          action_url?: string | null;
          is_read?: boolean;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      announcement_priority: "low" | "normal" | "high" | "urgent";
      notification_type:
        | "announcement"
        | "resource"
        | "attendance"
        | "leave"
        | "approval"
        | "document"
        | "system";
      permission_type: "public" | "role" | "employee";
      record_status: "active" | "inactive" | "archived";
      resource_open_mode: "same_tab" | "new_tab" | "external";
      resource_type:
        | "google_sheet"
        | "apps_script"
        | "power_bi"
        | "looker"
        | "website"
        | "pdf"
        | "internal";
    };
    CompositeTypes: Record<string, never>;
  };
};
