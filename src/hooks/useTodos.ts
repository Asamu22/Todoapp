import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Todo } from '../types/todo';
import { Database } from '../types/database';

type TodoRow = Database['public']['Tables']['todos']['Row'];
type TodoInsert = Database['public']['Tables']['todos']['Insert'];
type TodoUpdate = Database['public']['Tables']['todos']['Update'];

// Convert database row to Todo type
const convertRowToTodo = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  description: row.description || undefined,
  category: row.category,
  priority: row.priority,
  dueTime: row.due_time || undefined,
  completed: row.completed,
  createdAt: new Date(row.created_at),
  completedAt: row.completed_at ? new Date(row.completed_at) : undefined
});

export const useTodos = (userId: string | null) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch todos from Supabase
  const fetchTodos = async () => {
    if (!userId) {
      setTodos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedTodos = data.map(convertRowToTodo);
      setTodos(convertedTodos);
      setError(null);
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  // Add new todo
  const addTodo = async (todoData: Omit<Todo, 'id' | 'createdAt' | 'completed'>) => {
    if (!userId) return;

    try {
      const insertData: TodoInsert = {
        user_id: userId,
        title: todoData.title,
        description: todoData.description || null,
        category: todoData.category,
        priority: todoData.priority,
        due_time: todoData.dueTime || null,
        completed: false
      };

      const { data, error } = await supabase
        .from('todos')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newTodo = convertRowToTodo(data);
      setTodos(prev => [newTodo, ...prev]);
      setError(null);
    } catch (err) {
      console.error('Error adding todo:', err);
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    }
  };

  // Toggle todo completion
  const toggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const updateData: TodoUpdate = {
        completed: !todo.completed,
        completed_at: !todo.completed ? new Date().toISOString() : null
      };

      const { data, error } = await supabase
        .from('todos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedTodo = convertRowToTodo(data);
      setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
      setError(null);
    } catch (err) {
      console.error('Error toggling todo:', err);
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  // Delete todo
  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchTodos();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchTodos(); // Refetch todos on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    deleteTodo,
    refetch: fetchTodos
  };
};