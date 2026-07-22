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
          platform_status: Database["public"]["Enums"]["platform_company_status"];
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["record_status"];
          platform_status?: Database["public"]["Enums"]["platform_company_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["record_status"];
          platform_status?: Database["public"]["Enums"]["platform_company_status"];
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
          company_banner: string | null;
          favicon: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          support_phone: string | null;
          support_email: string | null;
          website: string | null;
          address: string | null;
          timezone: string | null;
          date_format: string | null;
          language: string;
          currency: string | null;
          working_days: string[];
          office_start_time: string;
          office_end_time: string;
          office_grace_period_minutes: number;
          notification_preferences: Json;
          resource_preferences: Json;
          security_preferences: Json;
          default_theme: string | null;
          attendance_mode: Database["public"]["Enums"]["attendance_policy_mode"];
          gps_accuracy_threshold_meters: number;
          allowed_radius_meters: number;
          allow_early_check_in_minutes: number;
          allow_late_check_out: boolean;
          weekend_working_enabled: boolean;
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
          company_banner?: string | null;
          favicon?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          support_phone?: string | null;
          support_email?: string | null;
          website?: string | null;
          address?: string | null;
          timezone?: string | null;
          date_format?: string | null;
          language?: string;
          currency?: string | null;
          working_days?: string[];
          office_start_time?: string;
          office_end_time?: string;
          office_grace_period_minutes?: number;
          notification_preferences?: Json;
          resource_preferences?: Json;
          security_preferences?: Json;
          default_theme?: string | null;
          attendance_mode?: Database["public"]["Enums"]["attendance_policy_mode"];
          gps_accuracy_threshold_meters?: number;
          allowed_radius_meters?: number;
          allow_early_check_in_minutes?: number;
          allow_late_check_out?: boolean;
          weekend_working_enabled?: boolean;
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
          company_banner?: string | null;
          favicon?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          support_phone?: string | null;
          support_email?: string | null;
          website?: string | null;
          address?: string | null;
          timezone?: string | null;
          date_format?: string | null;
          language?: string;
          currency?: string | null;
          working_days?: string[];
          office_start_time?: string;
          office_end_time?: string;
          office_grace_period_minutes?: number;
          notification_preferences?: Json;
          resource_preferences?: Json;
          security_preferences?: Json;
          default_theme?: string | null;
          attendance_mode?: Database["public"]["Enums"]["attendance_policy_mode"];
          gps_accuracy_threshold_meters?: number;
          allowed_radius_meters?: number;
          allow_early_check_in_minutes?: number;
          allow_late_check_out?: boolean;
          weekend_working_enabled?: boolean;
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
          work_mode: Database["public"]["Enums"]["employee_work_mode"];
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
          work_mode?: Database["public"]["Enums"]["employee_work_mode"];
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
          work_mode?: Database["public"]["Enums"]["employee_work_mode"];
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
      employee_celebration_events: {
        Row: {
          id: string;
          company_id: string;
          employee_id: string;
          event_type: Database["public"]["Enums"]["celebration_event_type"];
          event_year: number;
          celebration_date: string;
          notification_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id: string;
          event_type: Database["public"]["Enums"]["celebration_event_type"];
          event_year: number;
          celebration_date: string;
          notification_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string;
          event_type?: Database["public"]["Enums"]["celebration_event_type"];
          event_year?: number;
          celebration_date?: string;
          notification_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employee_celebration_events_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employee_celebration_events_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
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
          priority: Database["public"]["Enums"]["notification_priority"];
          title: string;
          message: string;
          action_url: string | null;
          is_read: boolean;
          browser_enabled: boolean;
          realtime_enabled: boolean;
          native_enabled: boolean;
          delivery_status: Database["public"]["Enums"]["notification_delivery_status"];
          delivered_at: string | null;
          opened_at: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_id?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          priority?: Database["public"]["Enums"]["notification_priority"];
          title: string;
          message: string;
          action_url?: string | null;
          is_read?: boolean;
          browser_enabled?: boolean;
          realtime_enabled?: boolean;
          native_enabled?: boolean;
          delivery_status?: Database["public"]["Enums"]["notification_delivery_status"];
          delivered_at?: string | null;
          opened_at?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          employee_id?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          priority?: Database["public"]["Enums"]["notification_priority"];
          title?: string;
          message?: string;
          action_url?: string | null;
          is_read?: boolean;
          browser_enabled?: boolean;
          realtime_enabled?: boolean;
          native_enabled?: boolean;
          delivery_status?: Database["public"]["Enums"]["notification_delivery_status"];
          delivered_at?: string | null;
          opened_at?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          id: string;
          auth_user_id: string;
          display_name: string;
          status: Database["public"]["Enums"]["record_status"];
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          display_name: string;
          status?: Database["public"]["Enums"]["record_status"];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["platform_admins"]["Insert"]
        >;
        Relationships: [];
      };
      platform_features: {
        Row: {
          feature_key: string;
          display_name: string;
          description: string;
          state: Database["public"]["Enums"]["platform_feature_state"];
          display_order: number;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          feature_key: string;
          display_name: string;
          description?: string;
          state?: Database["public"]["Enums"]["platform_feature_state"];
          display_order: number;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["platform_features"]["Insert"]
        >;
        Relationships: [];
      };
      company_features: {
        Row: {
          id: string;
          company_id: string;
          feature_key: string;
          state: Database["public"]["Enums"]["platform_feature_state"];
          configuration: Json;
          created_at: string;
          updated_at: string;
          updated_by_employee_id: string | null;
          updated_by_platform_admin_id: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          feature_key: string;
          state?: Database["public"]["Enums"]["platform_feature_state"];
          configuration?: Json;
          created_at?: string;
          updated_at?: string;
          updated_by_employee_id?: string | null;
          updated_by_platform_admin_id?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["company_features"]["Insert"]
        >;
        Relationships: [];
      };
      platform_audit_logs: {
        Row: {
          id: string;
          company_id: string | null;
          employee_id: string | null;
          platform_admin_id: string | null;
          auth_user_id: string | null;
          category: Database["public"]["Enums"]["platform_audit_category"];
          feature_key: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          status: Database["public"]["Enums"]["platform_audit_status"];
          description: string;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          employee_id?: string | null;
          platform_admin_id?: string | null;
          auth_user_id?: string | null;
          category: Database["public"]["Enums"]["platform_audit_category"];
          feature_key?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          status?: Database["public"]["Enums"]["platform_audit_status"];
          description: string;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["platform_audit_logs"]["Insert"]
        >;
        Relationships: [];
      };
      feature_usage_daily: {
        Row: {
          company_id: string;
          feature_key: string;
          usage_date: string;
          request_count: number;
          last_used_at: string;
        };
        Insert: {
          company_id: string;
          feature_key: string;
          usage_date?: string;
          request_count?: number;
          last_used_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["feature_usage_daily"]["Insert"]
        >;
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
            Database["public"]["Enums"]["attendance_location_source"] | null;
          check_in_selfie_path: string | null;
          check_in_device_browser: string | null;
          check_in_device_platform: string | null;
          check_in_location_id: string | null;
          check_in_distance_meters: number | null;
          work_mode: Database["public"]["Enums"]["employee_work_mode"];
          attendance_type: Database["public"]["Enums"]["attendance_type"];
          check_out_latitude: number | null;
          check_out_longitude: number | null;
          check_out_accuracy_meters: number | null;
          check_out_address: string | null;
          check_out_location_source:
            Database["public"]["Enums"]["attendance_location_source"] | null;
          check_out_selfie_path: string | null;
          check_out_device_browser: string | null;
          check_out_device_platform: string | null;
          check_out_location_id: string | null;
          check_out_distance_meters: number | null;
          status: Database["public"]["Enums"]["attendance_status"];
          working_minutes: number;
          late_minutes: number;
          office_start_time_snapshot: string | null;
          office_grace_period_minutes_snapshot: number | null;
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
            Database["public"]["Enums"]["attendance_location_source"] | null;
          check_in_selfie_path?: string | null;
          check_in_device_browser?: string | null;
          check_in_device_platform?: string | null;
          check_in_location_id?: string | null;
          check_in_distance_meters?: number | null;
          work_mode?: Database["public"]["Enums"]["employee_work_mode"];
          attendance_type?: Database["public"]["Enums"]["attendance_type"];
          check_out_latitude?: number | null;
          check_out_longitude?: number | null;
          check_out_accuracy_meters?: number | null;
          check_out_address?: string | null;
          check_out_location_source?:
            Database["public"]["Enums"]["attendance_location_source"] | null;
          check_out_selfie_path?: string | null;
          check_out_device_browser?: string | null;
          check_out_device_platform?: string | null;
          check_out_location_id?: string | null;
          check_out_distance_meters?: number | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          working_minutes?: number;
          late_minutes?: number;
          office_start_time_snapshot?: string | null;
          office_grace_period_minutes_snapshot?: number | null;
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
            Database["public"]["Enums"]["attendance_location_source"] | null;
          check_in_selfie_path?: string | null;
          check_in_device_browser?: string | null;
          check_in_device_platform?: string | null;
          check_in_location_id?: string | null;
          check_in_distance_meters?: number | null;
          work_mode?: Database["public"]["Enums"]["employee_work_mode"];
          attendance_type?: Database["public"]["Enums"]["attendance_type"];
          check_out_latitude?: number | null;
          check_out_longitude?: number | null;
          check_out_accuracy_meters?: number | null;
          check_out_address?: string | null;
          check_out_location_source?:
            Database["public"]["Enums"]["attendance_location_source"] | null;
          check_out_selfie_path?: string | null;
          check_out_device_browser?: string | null;
          check_out_device_platform?: string | null;
          check_out_location_id?: string | null;
          check_out_distance_meters?: number | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          working_minutes?: number;
          late_minutes?: number;
          office_start_time_snapshot?: string | null;
          office_grace_period_minutes_snapshot?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
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
    Views: {
      platform_company_overview: {
        Row: {
          id: string | null;
          name: string | null;
          platform_status:
            Database["public"]["Enums"]["platform_company_status"] | null;
          created_at: string | null;
          employee_count: number | null;
          admin_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_company_celebrants: {
        Args: {
          target_company_id: string;
          target_date: string;
        };
        Returns: {
          employee_uuid: string;
          employee_code: string;
          employee_name: string;
          company_uuid: string;
          event_type: Database["public"]["Enums"]["celebration_event_type"];
          source_date: string;
          years_completed: number | null;
        }[];
      };
      is_system_admin: { Args: { user_id: string }; Returns: boolean };
      is_feature_enabled_for_company: {
        Args: { target_company_id: string; target_feature_key: string };
        Returns: boolean;
      };
      can_access_feature: {
        Args: { target_feature_key: string };
        Returns: boolean;
      };
      can_access_company_platform: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      log_feature_access_denied: {
        Args: {
          target_feature_key: string;
          target_path: string;
          target_user_agent?: string | null;
        };
        Returns: undefined;
      };
      record_feature_usage: {
        Args: { target_feature_key: string };
        Returns: undefined;
      };
      log_company_access_denied: {
        Args: { target_path: string; target_user_agent?: string | null };
        Returns: undefined;
      };
      create_platform_company: {
        Args: { company_name: string };
        Returns: string;
      };
    };
    Enums: {
      platform_feature_state:
        "enabled" | "disabled" | "beta" | "hidden" | "deprecated";
      platform_company_status: "active" | "inactive" | "suspended" | "deleted";
      platform_audit_category:
        "audit" | "activity" | "login" | "security" | "feature_usage" | "error";
      platform_audit_status: "success" | "failure" | "denied" | "warning";
      announcement_priority: "low" | "normal" | "high" | "urgent";
      celebration_event_type: "birthday" | "work_anniversary";
      attendance_type: "office" | "field" | "hybrid";
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
        "pending" | "valid" | "invalid" | "processed" | "failed";
      employee_import_status:
        | "uploaded"
        | "preview_ready"
        | "validated"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled";
      employee_work_mode: "office" | "field" | "hybrid";
      holiday_type: "public_holiday" | "company_holiday" | "optional_holiday";
      leave_request_status: "pending" | "approved" | "rejected" | "cancelled";
      notification_type:
        | "announcement"
        | "resource"
        | "attendance"
        | "leave"
        | "approval"
        | "document"
        | "system"
        | "celebration";
      notification_priority: "normal" | "high" | "urgent";
      notification_delivery_status: "queued" | "delivered" | "opened";
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
