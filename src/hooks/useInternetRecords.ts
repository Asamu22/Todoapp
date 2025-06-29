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
  office: row.office,
  notes: row.notes || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
});

// Helper function to handle JWT expired errors
const handleJWTExpired = async (error: any) => {
  if (error?.message?.includes('JWT expired') || error?.code === 'PGRST301') {
    console.log('JWT expired, signing out user');
    await supabase.auth.signOut();
  }
};

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
      await handleJWTExpired(err);
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
        office: recordData.office,
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
      await handleJWTExpired(err);
      setError(err instanceof Error ? err.message : 'Failed to add record');
      throw err; // Re-throw to handle in component
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
        ...(updates.office && { office: updates.office }),
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
      await handleJWTExpired(err);
      setError(err instanceof Error ? err.message : 'Failed to update record');
      throw err; // Re-throw to handle in component
    }
  };

  // Delete record
  const deleteRecord = async (id: string) => {
    try {
      console.log('Attempting to delete record with ID:', id);
      
      // First verify the record exists and belongs to the user
      const { data: existingRecord, error: fetchError } = await supabase
        .from('internet_records')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching record for deletion:', fetchError);
        await handleJWTExpired(fetchError);
        throw new Error('Record not found or access denied');
      }

      if (!existingRecord) {
        throw new Error('Record not found');
      }

      console.log('Record found, proceeding with deletion:', existingRecord);

      // Perform the deletion
      const { error: deleteError } = await supabase
        .from('internet_records')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Double check user ownership

      if (deleteError) {
        console.error('Error deleting record:', deleteError);
        await handleJWTExpired(deleteError);
        throw deleteError;
      }

      console.log('Record deleted successfully');

      // Update local state
      setRecords(prev => {
        const newRecords = prev.filter(r => r.id !== id);
        console.log('Updated records count:', newRecords.length);
        return newRecords;
      });
      
      setError(null);
    } catch (err) {
      console.error('Error in deleteRecord function:', err);
      await handleJWTExpired(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete record';
      setError(errorMessage);
      throw new Error(errorMessage); // Re-throw to handle in component
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