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
          attendance_mode: Database["public"]["Enums"]["attendance_policy_mode"];
          gps_accuracy_threshold_meters: number;
          allowed_radius_meters: number;
          allow_early_check_in_minutes: number;
          allow_late_check_out: boolean;
          require_gps: boolean;
          require_selfie: boolean;
          require_high_accuracy: boolean;
          enable_geofence: boolean;
          face_verification_enabled: boolean;
          wifi_validation_enabled: boolean;
          bluetooth_beacon_enabled: boolean;
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
          attendance_mode?: Database["public"]["Enums"]["attendance_policy_mode"];
          gps_accuracy_threshold_meters?: number;
          allowed_radius_meters?: number;
          allow_early_check_in_minutes?: number;
          allow_late_check_out?: boolean;
          require_gps?: boolean;
          require_selfie?: boolean;
          require_high_accuracy?: boolean;
          enable_geofence?: boolean;
          face_verification_enabled?: boolean;
          wifi_validation_enabled?: boolean;
          bluetooth_beacon_enabled?: boolean;
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
          attendance_mode?: Database["public"]["Enums"]["attendance_policy_mode"];
          gps_accuracy_threshold_meters?: number;
          allowed_radius_meters?: number;
          allow_early_check_in_minutes?: number;
          allow_late_check_out?: boolean;
          require_gps?: boolean;
          require_selfie?: boolean;
          require_high_accuracy?: boolean;
          enable_geofence?: boolean;
          face_verification_enabled?: boolean;
          wifi_validation_enabled?: boolean;
          bluetooth_beacon_enabled?: boolean;
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
      employee_import_jobs: {
        Row: {
          id: string;
          company_id: string;
          created_by: string | null;
          source_file_name: string;
          source_file_path: string | null;
          file_type: Database["public"]["Enums"]["employee_import_file_type"];
          status: Database["public"]["Enums"]["employee_import_status"];
          total_rows: number;
          valid_rows: number;
          invalid_rows: number;
          processed_rows: number;
          successful_rows: number;
          failed_rows: number;
          error_summary: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          created_by?: string | null;
          source_file_name: string;
          source_file_path?: string | null;
          file_type: Database["public"]["Enums"]["employee_import_file_type"];
          status?: Database["public"]["Enums"]["employee_import_status"];
          total_rows?: number;
          valid_rows?: number;
          invalid_rows?: number;
          processed_rows?: number;
          successful_rows?: number;
          failed_rows?: number;
          error_summary?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          created_by?: string | null;
          source_file_name?: string;
          source_file_path?: string | null;
          file_type?: Database["public"]["Enums"]["employee_import_file_type"];
          status?: Database["public"]["Enums"]["employee_import_status"];
          total_rows?: number;
          valid_rows?: number;
          invalid_rows?: number;
          processed_rows?: number;
          successful_rows?: number;
          failed_rows?: number;
          error_summary?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employee_import_jobs_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employee_import_jobs_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      employee_import_rows: {
        Row: {
          id: string;
          import_job_id: string;
          row_number: number;
          raw_data: Json;
          normalized_data: Json;
          validation_errors: Json;
          duplicate_keys: Json;
          status: Database["public"]["Enums"]["employee_import_row_status"];
          employee_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          import_job_id: string;
          row_number: number;
          raw_data?: Json;
          normalized_data?: Json;
          validation_errors?: Json;
          duplicate_keys?: Json;
          status?: Database["public"]["Enums"]["employee_import_row_status"];
          employee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          import_job_id?: string;
          row_number?: number;
          raw_data?: Json;
          normalized_data?: Json;
          validation_errors?: Json;
          duplicate_keys?: Json;
          status?: Database["public"]["Enums"]["employee_import_row_status"];
          employee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_import_rows_import_job_id_fkey";
            columns: ["import_job_id"];
            isOneToOne: false;
            referencedRelation: "employee_import_jobs";
            referencedColumns: ["id"];
          },
        ];
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
          target_audience: "company" | "roles" | "employees";
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
          target_audience?: "company" | "roles" | "employees";
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
          target_audience?: "company" | "roles" | "employees";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          status?: Database["public"]["Enums"]["record_status"];
        };
        Relationships: [];
      };
      announcement_roles: {
        Row: {
          id: string;
          company_id: string;
          announcement_id: string;
          role_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          announcement_id: string;
          role_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          announcement_id?: string;
          role_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      announcement_employees: {
        Row: {
          id: string;
          company_id: string;
          announcement_id: string;
          employee_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          announcement_id: string;
          employee_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          announcement_id?: string;
          employee_id?: string;
          created_at?: string;
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
      activity_logs: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string | null;
          module: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          description: string;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id?: string | null;
          module: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          description: string;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string | null;
          module?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          description?: string;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance_records: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          attendance_date: string;
          check_in: string | null;
          check_out: string | null;
          check_in_latitude: number | null;
          check_in_longitude: number | null;
          check_in_accuracy_meters: number | null;
          check_in_address: string | null;
          check_in_location_source:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null;
          check_in_selfie_path: string | null;
          check_in_device_browser: string | null;
          check_in_device_platform: string | null;
          check_in_location_id: string | null;
          check_in_distance_meters: number | null;
          check_out_latitude: number | null;
          check_out_longitude: number | null;
          check_out_accuracy_meters: number | null;
          check_out_address: string | null;
          check_out_location_source:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null;
          check_out_selfie_path: string | null;
          check_out_device_browser: string | null;
          check_out_device_platform: string | null;
          check_out_location_id: string | null;
          check_out_distance_meters: number | null;
          status: Database["public"]["Enums"]["attendance_status"];
          working_minutes: number;
          late_minutes: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          attendance_date: string;
          check_in?: string | null;
          check_out?: string | null;
          check_in_latitude?: number | null;
          check_in_longitude?: number | null;
          check_in_accuracy_meters?: number | null;
          check_in_address?: string | null;
          check_in_location_source?:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null;
          check_in_selfie_path?: string | null;
          check_in_device_browser?: string | null;
          check_in_device_platform?: string | null;
          check_in_location_id?: string | null;
          check_in_distance_meters?: number | null;
          check_out_latitude?: number | null;
          check_out_longitude?: number | null;
          check_out_accuracy_meters?: number | null;
          check_out_address?: string | null;
          check_out_location_source?:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null;
          check_out_selfie_path?: string | null;
          check_out_device_browser?: string | null;
          check_out_device_platform?: string | null;
          check_out_location_id?: string | null;
          check_out_distance_meters?: number | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          working_minutes?: number;
          late_minutes?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          attendance_date?: string;
          check_in?: string | null;
          check_out?: string | null;
          check_in_latitude?: number | null;
          check_in_longitude?: number | null;
          check_in_accuracy_meters?: number | null;
          check_in_address?: string | null;
          check_in_location_source?:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null;
          check_in_selfie_path?: string | null;
          check_in_device_browser?: string | null;
          check_in_device_platform?: string | null;
          check_in_location_id?: string | null;
          check_in_distance_meters?: number | null;
          check_out_latitude?: number | null;
          check_out_longitude?: number | null;
          check_out_accuracy_meters?: number | null;
          check_out_address?: string | null;
          check_out_location_source?:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null;
          check_out_selfie_path?: string | null;
          check_out_device_browser?: string | null;
          check_out_device_platform?: string | null;
          check_out_location_id?: string | null;
          check_out_distance_meters?: number | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          working_minutes?: number;
          late_minutes?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_check_in_location_id_fkey";
            columns: ["check_in_location_id"];
            isOneToOne: false;
            referencedRelation: "company_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_check_out_location_id_fkey";
            columns: ["check_out_location_id"];
            isOneToOne: false;
            referencedRelation: "company_locations";
            referencedColumns: ["id"];
          },
        ];
      };
      company_locations: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          code: string;
          location_type: Database["public"]["Enums"]["company_location_type"];
          latitude: number;
          longitude: number;
          radius_meters: number;
          address: string | null;
          is_default: boolean;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          code: string;
          location_type?: Database["public"]["Enums"]["company_location_type"];
          latitude: number;
          longitude: number;
          radius_meters: number;
          address?: string | null;
          is_default?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          code?: string;
          location_type?: Database["public"]["Enums"]["company_location_type"];
          latitude?: number;
          longitude?: number;
          radius_meters?: number;
          address?: string | null;
          is_default?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_locations_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      employee_location_access: {
        Row: {
          id: string;
          employee_id: string;
          location_id: string;
          status: Database["public"]["Enums"]["record_status"];
          effective_from: string | null;
          effective_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          location_id: string;
          status?: Database["public"]["Enums"]["record_status"];
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          location_id?: string;
          status?: Database["public"]["Enums"]["record_status"];
          effective_from?: string | null;
          effective_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_location_access_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employee_location_access_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "company_locations";
            referencedColumns: ["id"];
          },
        ];
      };
      holiday_calendars: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          description: string | null;
          is_default: boolean;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          description?: string | null;
          is_default?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "holiday_calendars_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      holiday_events: {
        Row: {
          id: string;
          calendar_id: string;
          title: string;
          holiday_type: Database["public"]["Enums"]["holiday_type"];
          date: string;
          is_working_day: boolean;
          description: string | null;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          calendar_id: string;
          title: string;
          holiday_type: Database["public"]["Enums"]["holiday_type"];
          date: string;
          is_working_day?: boolean;
          description?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          calendar_id?: string;
          title?: string;
          holiday_type?: Database["public"]["Enums"]["holiday_type"];
          date?: string;
          is_working_day?: boolean;
          description?: string | null;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "holiday_events_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "holiday_calendars";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_types: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          code: string;
          color: string | null;
          is_paid: boolean;
          annual_limit: number | null;
          requires_approval: boolean;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          code: string;
          color?: string | null;
          is_paid?: boolean;
          annual_limit?: number | null;
          requires_approval?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          code?: string;
          color?: string | null;
          is_paid?: boolean;
          annual_limit?: number | null;
          requires_approval?: boolean;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_requests: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          total_days: number;
          reason: string | null;
          status: Database["public"]["Enums"]["leave_request_status"];
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          total_days: number;
          reason?: string | null;
          status?: Database["public"]["Enums"]["leave_request_status"];
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          leave_type_id?: string;
          start_date?: string;
          end_date?: string;
          total_days?: number;
          reason?: string | null;
          status?: Database["public"]["Enums"]["leave_request_status"];
          approved_by?: string | null;
          approved_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey";
            columns: ["leave_type_id"];
            isOneToOne: false;
            referencedRelation: "leave_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      announcement_priority: "low" | "normal" | "high" | "urgent";
      attendance_location_source: "gps" | "network" | "hybrid";
      attendance_policy_mode:
        | "assigned_location_only"
        | "company_location"
        | "any_company_location"
        | "remote"
        | "hybrid";
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "half_day"
        | "holiday"
        | "leave"
        | "weekend";
      company_location_type:
        | "head_office"
        | "branch"
        | "warehouse"
        | "factory"
        | "depot"
        | "client_site";
      employee_import_file_type: "csv" | "xlsx";
      employee_import_row_status:
        | "pending"
        | "valid"
        | "invalid"
        | "processed"
        | "failed";
      employee_import_status:
        | "uploaded"
        | "preview_ready"
        | "validated"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled";
      holiday_type:
        | "public_holiday"
        | "company_holiday"
        | "optional_holiday";
      leave_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled";
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
