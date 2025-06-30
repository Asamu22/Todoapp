import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, AuditLog, DeletedRecord, AdminStats } from '../types/admin';
import { Database } from '../types/database';

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];
type DeletedRecordRow = Database['public']['Tables']['deleted_records']['Row'];

// Convert database rows to types
const convertUserProfile = (row: UserProfileRow): UserProfile => ({
  id: row.id,
  userId: row.user_id,
  email: row.email || '',
  fullName: row.full_name || '',
  isAdmin: row.is_admin || false,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  lastLogin: row.last_login ? new Date(row.last_login) : undefined
});

const convertAuditLog = (row: any): AuditLog => ({
  id: row.id,
  userId: row.user_id,
  tableName: row.table_name,
  recordId: row.record_id,
  action: row.action,
  oldData: row.old_data,
  newData: row.new_data,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  createdAt: new Date(row.created_at),
  userEmail: row.user_email
});

const convertDeletedRecord = (row: any): DeletedRecord => ({
  id: row.id,
  userId: row.user_id,
  tableName: row.table_name,
  recordId: row.record_id,
  recordData: row.record_data,
  deletedBy: row.deleted_by,
  deletedAt: new Date(row.deleted_at),
  deletionReason: row.deletion_reason,
  userEmail: row.user_email,
  deletedByEmail: row.deleted_by_email
});

export const useAdminData = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deletedRecords, setDeletedRecords] = useState<DeletedRecord[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTodos: 0,
    totalInternetRecords: 0,
    totalDeletedRecords: 0,
    activeUsersToday: 0,
    recentActions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if current user is admin
  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.is_admin || false;
    } catch (err) {
      console.error('Error checking admin status:', err);
      return false;
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data.map(convertUserProfile));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    }
  };

  // Fetch audit logs with user email
  const fetchAuditLogs = async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user_profiles!audit_logs_user_id_fkey(email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      const logsWithEmail = data.map(row => ({
        ...row,
        user_email: row.user_profiles?.email
      }));
      
      setAuditLogs(logsWithEmail.map(convertAuditLog));
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs');
    }
  };

  // Fetch deleted records with user emails
  const fetchDeletedRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('deleted_records')
        .select(`
          *,
          user_profiles!deleted_records_user_id_fkey(email),
          deleted_by_profile:user_profiles!deleted_records_deleted_by_fkey(email)
        `)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      
      const recordsWithEmails = data.map(row => ({
        ...row,
        user_email: row.user_profiles?.email,
        deleted_by_email: row.deleted_by_profile?.email
      }));
      
      setDeletedRecords(recordsWithEmails.map(convertDeletedRecord));
    } catch (err) {
      console.error('Error fetching deleted records:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deleted records');
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      // Get total counts
      const [usersCount, todosCount, internetCount, deletedCount] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('todos').select('*', { count: 'exact', head: true }),
        supabase.from('internet_records').select('*', { count: 'exact', head: true }),
        supabase.from('deleted_records').select('*', { count: 'exact', head: true })
      ]);

      // Get active users today
      const today = new Date().toISOString().split('T')[0];
      const { count: activeToday } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', today);

      // Get recent actions (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const { count: recentActions } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      setStats({
        totalUsers: usersCount.count || 0,
        totalTodos: todosCount.count || 0,
        totalInternetRecords: internetCount.count || 0,
        totalDeletedRecords: deletedCount.count || 0,
        activeUsersToday: activeToday || 0,
        recentActions: recentActions || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    }
  };

  // Restore deleted record
  const restoreRecord = async (deletedRecord: DeletedRecord) => {
    try {
      const { tableName, recordData } = deletedRecord;
      
      if (tableName === 'todos') {
        const { error } = await supabase
          .from('todos')
          .insert({
            ...recordData,
            id: undefined // Let database generate new ID
          });
        if (error) throw error;
      } else if (tableName === 'internet_records') {
        const { error } = await supabase
          .from('internet_records')
          .insert({
            ...recordData,
            id: undefined // Let database generate new ID
          });
        if (error) throw error;
      }

      // Remove from deleted records
      const { error: deleteError } = await supabase
        .from('deleted_records')
        .delete()
        .eq('id', deletedRecord.id);

      if (deleteError) throw deleteError;

      // Refresh data
      await Promise.all([fetchDeletedRecords(), fetchStats()]);
      
    } catch (err) {
      console.error('Error restoring record:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore record');
      throw err;
    }
  };

  // Permanently delete record
  const permanentlyDeleteRecord = async (deletedRecordId: string) => {
    try {
      const { error } = await supabase
        .from('deleted_records')
        .delete()
        .eq('id', deletedRecordId);

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchDeletedRecords(), fetchStats()]);
      
    } catch (err) {
      console.error('Error permanently deleting record:', err);
      setError(err instanceof Error ? err.message : 'Failed to permanently delete record');
      throw err;
    }
  };

  // Initial data fetch
  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      const isAdmin = await checkAdminStatus();
      
      if (!isAdmin) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      try {
        await Promise.all([
          fetchUsers(),
          fetchAuditLogs(),
          fetchDeletedRecords(),
          fetchStats()
        ]);
        setError(null);
      } catch (err) {
        console.error('Error loading admin data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  return {
    users,
    auditLogs,
    deletedRecords,
    stats,
    loading,
    error,
    checkAdminStatus,
    fetchUsers,
    fetchAuditLogs,
    fetchDeletedRecords,
    fetchStats,
    restoreRecord,
    permanentlyDeleteRecord,
    refetch: async () => {
      await Promise.all([
        fetchUsers(),
        fetchAuditLogs(),
        fetchDeletedRecords(),
        fetchStats()
      ]);
    }
  };
};