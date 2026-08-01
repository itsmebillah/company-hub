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
      announcement_employees: {
        Row: {
          announcement_id: string
          company_id: string
          created_at: string
          employee_id: string
          id: string
        }
        Insert: {
          announcement_id: string
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
        }
        Update: {
          announcement_id?: string
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_employees_announcement_company_fk"
            columns: ["announcement_id", "company_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "announcement_employees_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_employees_employee_company_fk"
            columns: ["employee_id", "company_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "announcement_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_roles: {
        Row: {
          announcement_id: string
          company_id: string
          created_at: string
          id: string
          role_id: string
        }
        Insert: {
          announcement_id: string
          company_id: string
          created_at?: string
          id?: string
          role_id: string
        }
        Update: {
          announcement_id?: string
          company_id?: string
          created_at?: string
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_roles_announcement_company_fk"
            columns: ["announcement_id", "company_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "announcement_roles_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_roles_role_company_fk"
            columns: ["role_id", "company_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "announcement_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          banner_url: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          publish_from: string | null
          publish_until: string | null
          status: Database["public"]["Enums"]["record_status"]
          target_audience: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          banner_url?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          publish_from?: string | null
          publish_until?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          target_audience?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          banner_url?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["announcement_priority"]
          publish_from?: string | null
          publish_until?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          target_audience?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_attachments: {
        Row: {
          attendance_record_id: string
          cache_status: string
          cleanup_lease_expires_at: string | null
          cleanup_lease_owner: string | null
          cleanup_next_attempt_at: string | null
          cleanup_retry_count: number
          company_id: string
          created_at: string
          drive_file_id: string | null
          drive_folder_id: string | null
          drive_url: string | null
          employee_id: string
          id: string
          last_attempt_at: string | null
          last_error: string | null
          phase: string
          provider: string
          purge_after: string | null
          retry_count: number
          source_bucket: string
          source_deleted_at: string | null
          source_object_path: string
          sync_status: string
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          attendance_record_id: string
          cache_status?: string
          cleanup_lease_expires_at?: string | null
          cleanup_lease_owner?: string | null
          cleanup_next_attempt_at?: string | null
          cleanup_retry_count?: number
          company_id: string
          created_at?: string
          drive_file_id?: string | null
          drive_folder_id?: string | null
          drive_url?: string | null
          employee_id: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          phase: string
          provider?: string
          purge_after?: string | null
          retry_count?: number
          source_bucket?: string
          source_deleted_at?: string | null
          source_object_path: string
          sync_status?: string
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          attendance_record_id?: string
          cache_status?: string
          cleanup_lease_expires_at?: string | null
          cleanup_lease_owner?: string | null
          cleanup_next_attempt_at?: string | null
          cleanup_retry_count?: number
          company_id?: string
          created_at?: string
          drive_file_id?: string | null
          drive_folder_id?: string | null
          drive_url?: string | null
          employee_id?: string
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          phase?: string
          provider?: string
          purge_after?: string | null
          retry_count?: number
          source_bucket?: string
          source_deleted_at?: string | null
          source_object_path?: string
          sync_status?: string
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_attachments_attendance_record_id_fkey"
            columns: ["attendance_record_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_attachments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_media_cleanup_logs: {
        Row: {
          attachment_id: string
          company_id: string
          detail: string | null
          id: string
          occurred_at: string
          outcome: string
        }
        Insert: {
          attachment_id: string
          company_id: string
          detail?: string | null
          id?: string
          occurred_at?: string
          outcome: string
        }
        Update: {
          attachment_id?: string
          company_id?: string
          detail?: string | null
          id?: string
          occurred_at?: string
          outcome?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_media_cleanup_logs_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "attendance_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_media_cleanup_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_media_cleanup_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_date: string
          attendance_type: Database["public"]["Enums"]["attendance_type"]
          check_in: string | null
          check_in_accuracy_meters: number | null
          check_in_address: string | null
          check_in_device_browser: string | null
          check_in_device_platform: string | null
          check_in_distance_meters: number | null
          check_in_latitude: number | null
          check_in_location_id: string | null
          check_in_location_source:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null
          check_in_longitude: number | null
          check_in_selfie_path: string | null
          check_out: string | null
          check_out_accuracy_meters: number | null
          check_out_address: string | null
          check_out_device_browser: string | null
          check_out_device_platform: string | null
          check_out_distance_meters: number | null
          check_out_latitude: number | null
          check_out_location_id: string | null
          check_out_location_source:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null
          check_out_longitude: number | null
          check_out_selfie_path: string | null
          company_id: string
          created_at: string
          employee_id: string
          id: string
          late_minutes: number
          notes: string | null
          office_grace_period_minutes_snapshot: number | null
          office_start_time_snapshot: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          work_mode: Database["public"]["Enums"]["employee_work_mode"]
          working_minutes: number
        }
        Insert: {
          attendance_date: string
          attendance_type?: Database["public"]["Enums"]["attendance_type"]
          check_in?: string | null
          check_in_accuracy_meters?: number | null
          check_in_address?: string | null
          check_in_device_browser?: string | null
          check_in_device_platform?: string | null
          check_in_distance_meters?: number | null
          check_in_latitude?: number | null
          check_in_location_id?: string | null
          check_in_location_source?:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null
          check_in_longitude?: number | null
          check_in_selfie_path?: string | null
          check_out?: string | null
          check_out_accuracy_meters?: number | null
          check_out_address?: string | null
          check_out_device_browser?: string | null
          check_out_device_platform?: string | null
          check_out_distance_meters?: number | null
          check_out_latitude?: number | null
          check_out_location_id?: string | null
          check_out_location_source?:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null
          check_out_longitude?: number | null
          check_out_selfie_path?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          late_minutes?: number
          notes?: string | null
          office_grace_period_minutes_snapshot?: number | null
          office_start_time_snapshot?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["employee_work_mode"]
          working_minutes?: number
        }
        Update: {
          attendance_date?: string
          attendance_type?: Database["public"]["Enums"]["attendance_type"]
          check_in?: string | null
          check_in_accuracy_meters?: number | null
          check_in_address?: string | null
          check_in_device_browser?: string | null
          check_in_device_platform?: string | null
          check_in_distance_meters?: number | null
          check_in_latitude?: number | null
          check_in_location_id?: string | null
          check_in_location_source?:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null
          check_in_longitude?: number | null
          check_in_selfie_path?: string | null
          check_out?: string | null
          check_out_accuracy_meters?: number | null
          check_out_address?: string | null
          check_out_device_browser?: string | null
          check_out_device_platform?: string | null
          check_out_distance_meters?: number | null
          check_out_latitude?: number | null
          check_out_location_id?: string | null
          check_out_location_source?:
            | Database["public"]["Enums"]["attendance_location_source"]
            | null
          check_out_longitude?: number | null
          check_out_selfie_path?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          late_minutes?: number
          notes?: string | null
          office_grace_period_minutes_snapshot?: number | null
          office_start_time_snapshot?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["employee_work_mode"]
          working_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_check_in_location_id_fkey"
            columns: ["check_in_location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_check_out_location_id_fkey"
            columns: ["check_out_location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          platform_status: Database["public"]["Enums"]["platform_company_status"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          platform_status?: Database["public"]["Enums"]["platform_company_status"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          platform_status?: Database["public"]["Enums"]["platform_company_status"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      company_features: {
        Row: {
          company_id: string
          company_state: string
          configuration: Json
          created_at: string
          feature_key: string
          id: string
          state: Database["public"]["Enums"]["platform_feature_state"]
          updated_at: string
          updated_by_employee_id: string | null
          updated_by_platform_admin_id: string | null
        }
        Insert: {
          company_id: string
          company_state?: string
          configuration?: Json
          created_at?: string
          feature_key: string
          id?: string
          state?: Database["public"]["Enums"]["platform_feature_state"]
          updated_at?: string
          updated_by_employee_id?: string | null
          updated_by_platform_admin_id?: string | null
        }
        Update: {
          company_id?: string
          company_state?: string
          configuration?: Json
          created_at?: string
          feature_key?: string
          id?: string
          state?: Database["public"]["Enums"]["platform_feature_state"]
          updated_at?: string
          updated_by_employee_id?: string | null
          updated_by_platform_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_features_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_features_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_features_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "platform_feature_company_summary"
            referencedColumns: ["feature_key"]
          },
          {
            foreignKeyName: "company_features_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "platform_features"
            referencedColumns: ["feature_key"]
          },
          {
            foreignKeyName: "company_features_updated_by_employee_id_fkey"
            columns: ["updated_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_features_updated_by_platform_admin_id_fkey"
            columns: ["updated_by_platform_admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      company_locations: {
        Row: {
          address: string | null
          code: string
          company_id: string
          created_at: string
          id: string
          is_default: boolean
          latitude: number
          location_type: Database["public"]["Enums"]["company_location_type"]
          longitude: number
          name: string
          radius_meters: number
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          latitude: number
          location_type?: Database["public"]["Enums"]["company_location_type"]
          longitude: number
          name: string
          radius_meters: number
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          latitude?: number
          location_type?: Database["public"]["Enums"]["company_location_type"]
          longitude?: number
          name?: string
          radius_meters?: number
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_locations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          allow_early_check_in_minutes: number
          allow_late_check_out: boolean
          allowed_radius_meters: number
          attendance_mode: Database["public"]["Enums"]["attendance_policy_mode"]
          bluetooth_beacon_enabled: boolean
          company_banner: string | null
          company_id: string
          company_logo: string | null
          company_name: string
          created_at: string
          currency: string | null
          date_format: string | null
          default_theme: string | null
          enable_geofence: boolean
          face_verification_enabled: boolean
          favicon: string | null
          gps_accuracy_threshold_meters: number
          language: string
          notification_preferences: Json
          office_end_time: string
          office_grace_period_minutes: number
          office_start_time: string
          primary_color: string | null
          require_gps: boolean
          require_high_accuracy: boolean
          require_selfie: boolean
          resource_preferences: Json
          secondary_color: string | null
          security_preferences: Json
          short_name: string | null
          status: Database["public"]["Enums"]["record_status"]
          support_email: string | null
          support_phone: string | null
          timezone: string | null
          updated_at: string
          website: string | null
          weekend_working_enabled: boolean
          wifi_validation_enabled: boolean
          working_days: string[]
        }
        Insert: {
          address?: string | null
          allow_early_check_in_minutes?: number
          allow_late_check_out?: boolean
          allowed_radius_meters?: number
          attendance_mode?: Database["public"]["Enums"]["attendance_policy_mode"]
          bluetooth_beacon_enabled?: boolean
          company_banner?: string | null
          company_id: string
          company_logo?: string | null
          company_name: string
          created_at?: string
          currency?: string | null
          date_format?: string | null
          default_theme?: string | null
          enable_geofence?: boolean
          face_verification_enabled?: boolean
          favicon?: string | null
          gps_accuracy_threshold_meters?: number
          language?: string
          notification_preferences?: Json
          office_end_time?: string
          office_grace_period_minutes?: number
          office_start_time?: string
          primary_color?: string | null
          require_gps?: boolean
          require_high_accuracy?: boolean
          require_selfie?: boolean
          resource_preferences?: Json
          secondary_color?: string | null
          security_preferences?: Json
          short_name?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          support_email?: string | null
          support_phone?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
          weekend_working_enabled?: boolean
          wifi_validation_enabled?: boolean
          working_days?: string[]
        }
        Update: {
          address?: string | null
          allow_early_check_in_minutes?: number
          allow_late_check_out?: boolean
          allowed_radius_meters?: number
          attendance_mode?: Database["public"]["Enums"]["attendance_policy_mode"]
          bluetooth_beacon_enabled?: boolean
          company_banner?: string | null
          company_id?: string
          company_logo?: string | null
          company_name?: string
          created_at?: string
          currency?: string | null
          date_format?: string | null
          default_theme?: string | null
          enable_geofence?: boolean
          face_verification_enabled?: boolean
          favicon?: string | null
          gps_accuracy_threshold_meters?: number
          language?: string
          notification_preferences?: Json
          office_end_time?: string
          office_grace_period_minutes?: number
          office_start_time?: string
          primary_color?: string | null
          require_gps?: boolean
          require_high_accuracy?: boolean
          require_selfie?: boolean
          resource_preferences?: Json
          secondary_color?: string | null
          security_preferences?: Json
          short_name?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          support_email?: string | null
          support_phone?: string | null
          timezone?: string | null
          updated_at?: string
          website?: string | null
          weekend_working_enabled?: boolean
          wifi_validation_enabled?: boolean
          working_days?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_celebration_events: {
        Row: {
          celebration_date: string
          company_id: string
          created_at: string
          employee_id: string
          event_type: Database["public"]["Enums"]["celebration_event_type"]
          event_year: number
          id: string
          notification_count: number
        }
        Insert: {
          celebration_date: string
          company_id: string
          created_at?: string
          employee_id: string
          event_type: Database["public"]["Enums"]["celebration_event_type"]
          event_year: number
          id?: string
          notification_count?: number
        }
        Update: {
          celebration_date?: string
          company_id?: string
          created_at?: string
          employee_id?: string
          event_type?: Database["public"]["Enums"]["celebration_event_type"]
          event_year?: number
          id?: string
          notification_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_celebration_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_celebration_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_celebration_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_import_jobs: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_summary: Json
          failed_rows: number
          file_type: Database["public"]["Enums"]["employee_import_file_type"]
          id: string
          invalid_rows: number
          metadata: Json
          processed_rows: number
          source_file_name: string
          source_file_path: string | null
          status: Database["public"]["Enums"]["employee_import_status"]
          successful_rows: number
          total_rows: number
          updated_at: string
          valid_rows: number
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_summary?: Json
          failed_rows?: number
          file_type: Database["public"]["Enums"]["employee_import_file_type"]
          id?: string
          invalid_rows?: number
          metadata?: Json
          processed_rows?: number
          source_file_name: string
          source_file_path?: string | null
          status?: Database["public"]["Enums"]["employee_import_status"]
          successful_rows?: number
          total_rows?: number
          updated_at?: string
          valid_rows?: number
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_summary?: Json
          failed_rows?: number
          file_type?: Database["public"]["Enums"]["employee_import_file_type"]
          id?: string
          invalid_rows?: number
          metadata?: Json
          processed_rows?: number
          source_file_name?: string
          source_file_path?: string | null
          status?: Database["public"]["Enums"]["employee_import_status"]
          successful_rows?: number
          total_rows?: number
          updated_at?: string
          valid_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "employee_import_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_import_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_import_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_import_rows: {
        Row: {
          created_at: string
          duplicate_keys: Json
          employee_id: string | null
          id: string
          import_job_id: string
          normalized_data: Json
          raw_data: Json
          row_number: number
          status: Database["public"]["Enums"]["employee_import_row_status"]
          updated_at: string
          validation_errors: Json
        }
        Insert: {
          created_at?: string
          duplicate_keys?: Json
          employee_id?: string | null
          id?: string
          import_job_id: string
          normalized_data?: Json
          raw_data?: Json
          row_number: number
          status?: Database["public"]["Enums"]["employee_import_row_status"]
          updated_at?: string
          validation_errors?: Json
        }
        Update: {
          created_at?: string
          duplicate_keys?: Json
          employee_id?: string | null
          id?: string
          import_job_id?: string
          normalized_data?: Json
          raw_data?: Json
          row_number?: number
          status?: Database["public"]["Enums"]["employee_import_row_status"]
          updated_at?: string
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "employee_import_rows_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "employee_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_location_access: {
        Row: {
          created_at: string
          effective_from: string | null
          effective_to: string | null
          employee_id: string
          id: string
          location_id: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          employee_id: string
          id?: string
          location_id: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          employee_id?: string
          id?: string
          location_id?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_location_access_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_location_access_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "company_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          auth_user_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          employee_id: string
          id: string
          internal_auth_email: string | null
          joining_date: string | null
          manager_id: string | null
          name: string
          phone: string | null
          photo_url: string | null
          role_id: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
          work_mode: Database["public"]["Enums"]["employee_work_mode"]
        }
        Insert: {
          auth_user_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          employee_id: string
          id?: string
          internal_auth_email?: string | null
          joining_date?: string | null
          manager_id?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          role_id: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          work_mode?: Database["public"]["Enums"]["employee_work_mode"]
        }
        Update: {
          auth_user_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          employee_id?: string
          id?: string
          internal_auth_email?: string | null
          joining_date?: string | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          role_id?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
          work_mode?: Database["public"]["Enums"]["employee_work_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_role_company_fk"
            columns: ["role_id", "company_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage_daily: {
        Row: {
          company_id: string
          feature_key: string
          last_used_at: string
          request_count: number
          usage_date: string
        }
        Insert: {
          company_id: string
          feature_key: string
          last_used_at?: string
          request_count?: number
          usage_date?: string
        }
        Update: {
          company_id?: string
          feature_key?: string
          last_used_at?: string
          request_count?: number
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_usage_daily_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_usage_daily_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_usage_daily_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "platform_feature_company_summary"
            referencedColumns: ["feature_key"]
          },
          {
            foreignKeyName: "feature_usage_daily_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "platform_features"
            referencedColumns: ["feature_key"]
          },
        ]
      }
      holiday_calendars: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holiday_calendars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_calendars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_events: {
        Row: {
          calendar_id: string
          created_at: string
          date: string
          description: string | null
          holiday_type: Database["public"]["Enums"]["holiday_type"]
          id: string
          is_working_day: boolean
          status: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at: string
        }
        Insert: {
          calendar_id: string
          created_at?: string
          date: string
          description?: string | null
          holiday_type: Database["public"]["Enums"]["holiday_type"]
          id?: string
          is_working_day?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          title: string
          updated_at?: string
        }
        Update: {
          calendar_id?: string
          created_at?: string
          date?: string
          description?: string | null
          holiday_type?: Database["public"]["Enums"]["holiday_type"]
          id?: string
          is_working_day?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holiday_events_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "holiday_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_outbox: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          attempt_count: number
          company_id: string
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          last_error: string | null
          lease_expires_at: string | null
          lease_owner: string | null
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          attempt_count?: number
          company_id: string
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_owner?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          attempt_count?: number
          company_id?: string
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          lease_expires_at?: string | null
          lease_owner?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_outbox_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_outbox_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_request_status"]
          total_days: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          total_days: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          annual_limit: number | null
          code: string
          color: string | null
          company_id: string
          created_at: string
          id: string
          is_paid: boolean
          name: string
          requires_approval: boolean
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          annual_limit?: number | null
          code: string
          color?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_paid?: boolean
          name: string
          requires_approval?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          annual_limit?: number | null
          code?: string
          color?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_paid?: boolean
          name?: string
          requires_approval?: boolean
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          browser_enabled: boolean
          company_id: string
          created_at: string
          created_by: string | null
          delivered_at: string | null
          delivery_status: Database["public"]["Enums"]["notification_delivery_status"]
          employee_id: string | null
          id: string
          is_read: boolean
          message: string
          native_enabled: boolean
          opened_at: string | null
          priority: Database["public"]["Enums"]["notification_priority"]
          realtime_enabled: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          action_url?: string | null
          browser_enabled?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          delivery_status?: Database["public"]["Enums"]["notification_delivery_status"]
          employee_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          native_enabled?: boolean
          opened_at?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          realtime_enabled?: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          action_url?: string | null
          browser_enabled?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          delivery_status?: Database["public"]["Enums"]["notification_delivery_status"]
          employee_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          native_enabled?: boolean
          opened_at?: string | null
          priority?: Database["public"]["Enums"]["notification_priority"]
          realtime_enabled?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          auth_user_id: string
          created_at: string
          created_by: string | null
          display_name: string
          id: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          created_by?: string | null
          display_name: string
          id?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          created_by?: string | null
          display_name?: string
          id?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      platform_features: {
        Row: {
          allow_company_override: boolean
          created_at: string
          description: string
          display_name: string
          display_order: number
          feature_key: string
          state: Database["public"]["Enums"]["platform_feature_state"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_company_override?: boolean
          created_at?: string
          description?: string
          display_name: string
          display_order: number
          feature_key: string
          state?: Database["public"]["Enums"]["platform_feature_state"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_company_override?: boolean
          created_at?: string
          description?: string
          display_name?: string
          display_order?: number
          feature_key?: string
          state?: Database["public"]["Enums"]["platform_feature_state"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_features_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_releases: {
        Row: {
          breaking_changes: Json
          bug_fixes: Json
          commit_sha: string
          created_at: string
          created_by: string | null
          deployment_id: string
          description: string
          id: string
          improvements: Json
          published_at: string | null
          release_notes: string
          release_type: string
          requires_update: boolean
          rollback_metadata: Json
          show_popup: boolean
          status: string
          title: string
          updated_at: string
          version: string
          whats_new: Json
        }
        Insert: {
          breaking_changes?: Json
          bug_fixes?: Json
          commit_sha: string
          created_at?: string
          created_by?: string | null
          deployment_id: string
          description?: string
          id?: string
          improvements?: Json
          published_at?: string | null
          release_notes?: string
          release_type: string
          requires_update?: boolean
          rollback_metadata?: Json
          show_popup?: boolean
          status?: string
          title: string
          updated_at?: string
          version: string
          whats_new?: Json
        }
        Update: {
          breaking_changes?: Json
          bug_fixes?: Json
          commit_sha?: string
          created_at?: string
          created_by?: string | null
          deployment_id?: string
          description?: string
          id?: string
          improvements?: Json
          published_at?: string | null
          release_notes?: string
          release_type?: string
          requires_update?: boolean
          rollback_metadata?: Json
          show_popup?: boolean
          status?: string
          title?: string
          updated_at?: string
          version?: string
          whats_new?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_releases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          allow_company_creation: boolean
          created_at: string
          default_timezone: string
          favicon_url: string | null
          global_configuration: Json
          id: boolean
          logo_url: string | null
          maintenance_message: string | null
          maintenance_mode: boolean
          platform_name: string
          primary_color: string
          support_email: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_company_creation?: boolean
          created_at?: string
          default_timezone?: string
          favicon_url?: string | null
          global_configuration?: Json
          id?: boolean
          logo_url?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          platform_name?: string
          primary_color?: string
          support_email?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_company_creation?: boolean
          created_at?: string
          default_timezone?: string
          favicon_url?: string | null
          global_configuration?: Json
          id?: boolean
          logo_url?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean
          platform_name?: string
          primary_color?: string
          support_email?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      release_receipts: {
        Row: {
          auth_user_id: string
          created_at: string
          dismissed_at: string | null
          id: string
          installed_at: string | null
          release_id: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          dismissed_at?: string | null
          id?: string
          installed_at?: string | null
          release_id: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          dismissed_at?: string | null
          id?: string
          installed_at?: string | null
          release_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_receipts_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "platform_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          created_by: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          display_order: number
          icon?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_permissions: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string | null
          id: string
          permission_type: Database["public"]["Enums"]["permission_type"]
          resource_id: string
          role_id: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          permission_type: Database["public"]["Enums"]["permission_type"]
          resource_id: string
          role_id?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          permission_type?: Database["public"]["Enums"]["permission_type"]
          resource_id?: string
          role_id?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_permissions_employee_company_fk"
            columns: ["employee_id", "company_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "resource_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_permissions_resource_company_fk"
            columns: ["resource_id", "company_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "resource_permissions_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_permissions_role_company_fk"
            columns: ["role_id", "company_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "resource_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category_id: string
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_featured: boolean
          open_mode: Database["public"]["Enums"]["resource_open_mode"]
          resource_type: Database["public"]["Enums"]["resource_type"]
          status: Database["public"]["Enums"]["record_status"]
          thumbnail: string | null
          title: string
          updated_at: string
          updated_by: string | null
          url: string | null
        }
        Insert: {
          category_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order: number
          icon?: string | null
          id?: string
          is_featured?: boolean
          open_mode?: Database["public"]["Enums"]["resource_open_mode"]
          resource_type: Database["public"]["Enums"]["resource_type"]
          status?: Database["public"]["Enums"]["record_status"]
          thumbnail?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
          url?: string | null
        }
        Update: {
          category_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_featured?: boolean
          open_mode?: Database["public"]["Enums"]["resource_open_mode"]
          resource_type?: Database["public"]["Enums"]["resource_type"]
          status?: Database["public"]["Enums"]["record_status"]
          thumbnail?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_company_fk"
            columns: ["category_id", "company_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          name: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order: number
          id?: string
          name: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_company_overview"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      platform_company_overview: {
        Row: {
          admin_count: number | null
          created_at: string | null
          employee_count: number | null
          id: string | null
          name: string | null
          platform_status:
            | Database["public"]["Enums"]["platform_company_status"]
            | null
        }
        Relationships: []
      }
      platform_feature_company_summary: {
        Row: {
          disabled_company_count: number | null
          enabled_company_count: number | null
          feature_key: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_any_feature: {
        Args: { target_feature_keys: string[] }
        Returns: boolean
      }
      can_access_company_admin: { Args: never; Returns: boolean }
      can_access_company_platform: { Args: never; Returns: boolean }
      can_access_feature: {
        Args: { target_feature_key: string }
        Returns: boolean
      }
      can_company_admin_manage_storage_object: {
        Args: {
          target_bucket_id: string
          target_object_name: string
          user_id: string
        }
        Returns: boolean
      }
      can_receive_notification: {
        Args: { target_company_id: string; target_employee_id: string }
        Returns: boolean
      }
      claim_attendance_media_cleanup_jobs: {
        Args: { job_limit?: number; lease_seconds?: number; worker_id: string }
        Returns: {
          attachment_id: string
          cleanup_retry_count: number
          company_id: string
          drive_file_id: string
          source_bucket: string
          source_object_path: string
        }[]
      }
      claim_attendance_media_sync_jobs: {
        Args: { job_limit?: number; lease_seconds?: number; worker_id: string }
        Returns: {
          attachment_id: string
          attempt_count: number
          company_id: string
          drive_file_id: string
          outbox_id: string
          phase: string
          source_bucket: string
          source_object_path: string
        }[]
      }
      complete_attendance_media_cleanup_job: {
        Args: { target_attachment_id: string; worker_id: string }
        Returns: boolean
      }
      complete_attendance_media_sync_job: {
        Args: {
          target_drive_file_id: string
          target_drive_folder_id: string
          target_drive_url: string
          target_outbox_id: string
          worker_id: string
        }
        Returns: boolean
      }
      create_platform_company: {
        Args: { company_name: string }
        Returns: string
      }
      enqueue_attendance_attachment: {
        Args: {
          target_attendance: Database["public"]["Tables"]["attendance_records"]["Row"]
          target_path: string
          target_phase: string
        }
        Returns: undefined
      }
      fail_attendance_media_cleanup_job: {
        Args: {
          safe_error: string
          target_attachment_id: string
          worker_id: string
        }
        Returns: boolean
      }
      fail_attendance_media_sync_job: {
        Args: {
          safe_error: string
          target_outbox_id: string
          worker_id: string
        }
        Returns: boolean
      }
      get_app_schema_version: { Args: never; Returns: string }
      get_company_celebrants: {
        Args: { target_company_id: string; target_date: string }
        Returns: {
          company_uuid: string
          employee_code: string
          employee_name: string
          employee_uuid: string
          event_type: Database["public"]["Enums"]["celebration_event_type"]
          source_date: string
          years_completed: number
        }[]
      }
      is_active_employee: { Args: { user_id: string }; Returns: boolean }
      is_admin_user: { Args: { user_id: string }; Returns: boolean }
      is_company_admin: { Args: { user_id: string }; Returns: boolean }
      is_feature_enabled_for_company: {
        Args: { target_company_id: string; target_feature_key: string }
        Returns: boolean
      }
      is_platform_maintenance_mode: { Args: never; Returns: boolean }
      is_self_storage_object: {
        Args: { object_name: string; user_id: string }
        Returns: boolean
      }
      is_system_admin: { Args: { user_id: string }; Returns: boolean }
      record_feature_usage: {
        Args: { target_feature_key: string }
        Returns: undefined
      }
      update_platform_company_name: {
        Args: { target_company_id: string; target_company_name: string }
        Returns: undefined
      }
    }
    Enums: {
      announcement_priority: "low" | "normal" | "high" | "urgent"
      attendance_location_source: "gps" | "network" | "hybrid"
      attendance_policy_mode:
        | "assigned_location_only"
        | "company_location"
        | "any_company_location"
        | "remote"
        | "hybrid"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "half_day"
        | "holiday"
        | "leave"
        | "weekend"
      attendance_type: "office" | "field" | "hybrid"
      celebration_event_type: "birthday" | "work_anniversary"
      company_location_type:
        | "head_office"
        | "branch"
        | "warehouse"
        | "factory"
        | "depot"
        | "client_site"
      employee_import_file_type: "csv" | "xlsx"
      employee_import_row_status:
        | "pending"
        | "valid"
        | "invalid"
        | "processed"
        | "failed"
      employee_import_status:
        | "uploaded"
        | "preview_ready"
        | "validated"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
      employee_work_mode: "office" | "field" | "hybrid"
      holiday_type: "public_holiday" | "company_holiday" | "optional_holiday"
      leave_request_status: "pending" | "approved" | "rejected" | "cancelled"
      notification_delivery_status: "queued" | "delivered" | "opened"
      notification_priority: "normal" | "high" | "urgent"
      notification_type:
        | "announcement"
        | "resource"
        | "attendance"
        | "leave"
        | "approval"
        | "document"
        | "system"
        | "celebration"
      permission_type: "public" | "role" | "employee"
      platform_company_status:
        | "active"
        | "inactive"
        | "suspended"
        | "deleted"
        | "archived"
      platform_feature_state:
        | "enabled"
        | "disabled"
        | "beta"
        | "hidden"
        | "deprecated"
      record_status: "active" | "inactive" | "archived"
      resource_open_mode: "same_tab" | "new_tab" | "external"
      resource_type:
        | "google_sheet"
        | "apps_script"
        | "power_bi"
        | "looker"
        | "website"
        | "pdf"
        | "internal"
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
      announcement_priority: ["low", "normal", "high", "urgent"],
      attendance_location_source: ["gps", "network", "hybrid"],
      attendance_policy_mode: [
        "assigned_location_only",
        "company_location",
        "any_company_location",
        "remote",
        "hybrid",
      ],
      attendance_status: [
        "present",
        "absent",
        "late",
        "half_day",
        "holiday",
        "leave",
        "weekend",
      ],
      attendance_type: ["office", "field", "hybrid"],
      celebration_event_type: ["birthday", "work_anniversary"],
      company_location_type: [
        "head_office",
        "branch",
        "warehouse",
        "factory",
        "depot",
        "client_site",
      ],
      employee_import_file_type: ["csv", "xlsx"],
      employee_import_row_status: [
        "pending",
        "valid",
        "invalid",
        "processed",
        "failed",
      ],
      employee_import_status: [
        "uploaded",
        "preview_ready",
        "validated",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ],
      employee_work_mode: ["office", "field", "hybrid"],
      holiday_type: ["public_holiday", "company_holiday", "optional_holiday"],
      leave_request_status: ["pending", "approved", "rejected", "cancelled"],
      notification_delivery_status: ["queued", "delivered", "opened"],
      notification_priority: ["normal", "high", "urgent"],
      notification_type: [
        "announcement",
        "resource",
        "attendance",
        "leave",
        "approval",
        "document",
        "system",
        "celebration",
      ],
      permission_type: ["public", "role", "employee"],
      platform_company_status: [
        "active",
        "inactive",
        "suspended",
        "deleted",
        "archived",
      ],
      platform_feature_state: [
        "enabled",
        "disabled",
        "beta",
        "hidden",
        "deprecated",
      ],
      record_status: ["active", "inactive", "archived"],
      resource_open_mode: ["same_tab", "new_tab", "external"],
      resource_type: [
        "google_sheet",
        "apps_script",
        "power_bi",
        "looker",
        "website",
        "pdf",
        "internal",
      ],
    },
  },
} as const
