export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          priority: 'low' | 'medium' | 'high';
          due_time: string | null;
          due_date: string | null;
          scheduled_for: string | null;
          completed: boolean;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          priority: 'low' | 'medium' | 'high';
          due_time?: string | null;
          due_date?: string | null;
          scheduled_for?: string | null;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          priority?: 'low' | 'medium' | 'high';
          due_time?: string | null;
          due_date?: string | null;
          scheduled_for?: string | null;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      internet_records: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          start_balance: number;
          end_balance: number;
          usage: number;
          work_hours: number;
          office: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          start_balance: number;
          end_balance: number;
          usage: number;
          work_hours: number;
          office: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          start_balance?: number;
          end_balance?: number;
          usage?: number;
          work_hours?: number;
          office?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string | null;
          full_name: string | null;
          is_admin: boolean | null;
          is_super_admin: boolean | null;
          created_at: string;
          updated_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          email?: string | null;
          full_name?: string | null;
          is_admin?: boolean | null;
          is_super_admin?: boolean | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          is_admin?: boolean | null;
          is_super_admin?: boolean | null;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          table_name: string;
          record_id: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          old_data: any | null;
          new_data: any | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          table_name: string;
          record_id: string;
          action: 'INSERT' | 'UPDATE' | 'DELETE';
          old_data?: any | null;
          new_data?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          table_name?: string;
          record_id?: string;
          action?: 'INSERT' | 'UPDATE' | 'DELETE';
          old_data?: any | null;
          new_data?: any | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      deleted_records: {
        Row: {
          id: string;
          user_id: string | null;
          table_name: string;
          record_id: string;
          record_data: any;
          deleted_by: string | null;
          deleted_at: string;
          deletion_reason: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          table_name: string;
          record_id: string;
          record_data: any;
          deleted_by?: string | null;
          deleted_at?: string;
          deletion_reason?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          table_name?: string;
          record_id?: string;
          record_data?: any;
          deleted_by?: string | null;
          deleted_at?: string;
          deletion_reason?: string | null;
        };
      };
    };
  };
}