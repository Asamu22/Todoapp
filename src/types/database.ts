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
    };
  };
}