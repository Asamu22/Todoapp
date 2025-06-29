import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { InternetRecord } from '../types/internet';
import { Database } from '../types/database';

type InternetRecordRow = Database['public']['Tables']['internet_records']['Row'];
type InternetRecordInsert = Database['public']['Tables']['internet_records']['Insert'];
type InternetRecordUpdate = Database['public']['Tables']['internet_records']['Update'];

// Convert database row to InternetRecord type
const convertRowToRecord = (row: InternetRecordRow): InternetRecord => ({
  id: row.id,
  date: row.date,
  startBalance: row.start_balance,
  endBalance: row.end_balance,
  usage: row.usage,
  workHours: row.work_hours,
  notes: row.notes || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

export const useInternetRecords = (userId: string | null) => {
  const [records, setRecords] = useState<InternetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch records from Supabase
  const fetchRecords = async () => {
    if (!userId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('internet_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      const convertedRecords = data.map(convertRowToRecord);
      setRecords(convertedRecords);
      setError(null);
    } catch (err) {
      console.error('Error fetching internet records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  // Add new record
  const addRecord = async (recordData: Omit<InternetRecord, 'id' | 'createdAt' | 'updatedAt' | 'usage'>) => {
    if (!userId) return;

    try {
      const usage = recordData.startBalance - recordData.endBalance;
      
      const insertData: InternetRecordInsert = {
        user_id: userId,
        date: recordData.date,
        start_balance: recordData.startBalance,
        end_balance: recordData.endBalance,
        usage: usage,
        work_hours: recordData.workHours,
        notes: recordData.notes || null
      };

      const { data, error } = await supabase
        .from('internet_records')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newRecord = convertRowToRecord(data);
      setRecords(prev => [newRecord, ...prev]);
      setError(null);
    } catch (err) {
      console.error('Error adding record:', err);
      setError(err instanceof Error ? err.message : 'Failed to add record');
    }
  };

  // Update record
  const updateRecord = async (id: string, updates: Partial<Omit<InternetRecord, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updateData: InternetRecordUpdate = {
        ...(updates.date && { date: updates.date }),
        ...(updates.startBalance !== undefined && { start_balance: updates.startBalance }),
        ...(updates.endBalance !== undefined && { end_balance: updates.endBalance }),
        ...(updates.workHours !== undefined && { work_hours: updates.workHours }),
        ...(updates.notes !== undefined && { notes: updates.notes || null }),
        updated_at: new Date().toISOString()
      };

      // Calculate usage if start or end balance changed
      if (updates.startBalance !== undefined || updates.endBalance !== undefined) {
        const record = records.find(r => r.id === id);
        if (record) {
          const startBalance = updates.startBalance ?? record.startBalance;
          const endBalance = updates.endBalance ?? record.endBalance;
          updateData.usage = startBalance - endBalance;
        }
      }

      const { data, error } = await supabase
        .from('internet_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedRecord = convertRowToRecord(data);
      setRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
      setError(null);
    } catch (err) {
      console.error('Error updating record:', err);
      setError(err instanceof Error ? err.message : 'Failed to update record');
    }
  };

  // Delete record
  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('internet_records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecords(prev => prev.filter(r => r.id !== id));
      setError(null);
    } catch (err) {
      console.error('Error deleting record:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete record');
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    fetchRecords();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('internet_records_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'internet_records',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchRecords(); // Refetch records on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords
  };
};