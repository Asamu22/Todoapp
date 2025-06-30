import React, { useState } from 'react';
import { Shield, Users, Activity, Trash2, BarChart3, Eye, RotateCcw, AlertTriangle, Calendar, Clock, Database, User, FileText } from 'lucide-react';
import { useAdminData } from '../hooks/useAdminData';
import { DeletedRecord, AuditLog } from '../types/admin';

interface AdminPageProps {
  onBack: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const {
    users,
    auditLogs,
    deletedRecords,
    stats,
    loading,
    error,
    restoreRecord,
    permanentlyDeleteRecord
  } = useAdminData();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit' | 'trash'>('overview');
  const [selectedTable, setSelectedTable] = useState<'all' | 'todos' | 'internet_records'>('all');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleRestore = async (record: DeletedRecord) => {
    setRestoring(record.id);
    try {
      await restoreRecord(record);
    } catch (err) {
      console.error('Failed to restore record:', err);
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to permanently delete this record? This action cannot be undone.')) {
      return;
    }

    setDeleting(recordId);
    try {
      await permanentlyDeleteRecord(recordId);
    } catch (err) {
      console.error('Failed to permanently delete record:', err);
    } finally {
      setDeleting(null);
    }
  };

  const formatRecordData = (data: any, tableName: string) => {
    if (tableName === 'todos') {
      return {
        title: data.title,
        category: data.category,
        priority: data.priority,
        completed: data.completed ? 'Yes' : 'No',
        created: new Date(data.created_at).toLocaleDateString()
      };
    } else if (tableName === 'internet_records') {
      return {
        date: new Date(data.date).toLocaleDateString(),
        office: data.office,
        usage: `${data.usage} GB`,
        workHours: `${data.work_hours}h`,
        created: new Date(data.created_at).toLocaleDateString()
      };
    }
    return data;
  };

  const filteredDeletedRecords = selectedTable === 'all' 
    ? deletedRecords 
    : deletedRecords.filter(record => record.tableName === selectedTable);

  const filteredAuditLogs = selectedTable === 'all'
    ? auditLogs
    : auditLogs.filter(log => log.tableName === selectedTable);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-16 lg:pt-0">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'audit', label: 'Audit Logs', icon: Activity },
            { id: 'trash', label: 'Trash Bin', icon: Trash2 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Total Users</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500 mt-1">{stats.activeUsersToday} active today</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Total Tasks</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{stats.totalTodos}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Internet Records</span>
              </div>
              <p className="text-3xl font-bold text-purple-900">{stats.totalInternetRecords}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trash2 className="w-6 h-6 text-red-600" />
                <span className="text-sm font-medium text-gray-600">Deleted Records</span>
              </div>
              <p className="text-3xl font-bold text-red-900">{stats.totalDeletedRecords}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Recent Actions</span>
              </div>
              <p className="text-3xl font-bold text-orange-900">{stats.recentActions}</p>
              <p className="text-sm text-gray-500 mt-1">Last 24 hours</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {auditLogs.slice(0, 10).map(log => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      log.action === 'INSERT' ? 'bg-green-500' :
                      log.action === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{log.userEmail || 'Unknown User'}</span>
                    <span className="text-gray-600">
                      {log.action.toLowerCase()}d a {log.tableName.replace('_', ' ')} record
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Last Login</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">{user.fullName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isAdmin 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filter by table:</span>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Tables</option>
                <option value="todos">Tasks</option>
                <option value="internet_records">Internet Records</option>
              </select>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Audit Trail</h2>
            <div className="space-y-3">
              {filteredAuditLogs.map(log => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        log.action === 'INSERT' ? 'bg-green-500' :
                        log.action === 'UPDATE' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{log.userEmail || 'Unknown User'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.action === 'INSERT' ? 'bg-green-100 text-green-800' :
                        log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-gray-600">
                        {log.tableName.replace('_', ' ')} record
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {(log.oldData || log.newData) && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {log.oldData && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Before:</h4>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(formatRecordData(log.oldData, log.tableName), null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.newData && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">After:</h4>
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(formatRecordData(log.newData, log.tableName), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trash Bin Tab */}
      {activeTab === 'trash' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filter by table:</span>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Tables</option>
                <option value="todos">Tasks</option>
                <option value="internet_records">Internet Records</option>
              </select>
            </div>
          </div>

          {/* Deleted Records */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Deleted Records</h2>
            
            {filteredDeletedRecords.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No deleted records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeletedRecords.map(record => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <span className="font-medium">
                          {record.tableName.replace('_', ' ')} record
                        </span>
                        <span className="text-gray-600">by {record.deletedByEmail || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {new Date(record.deletedAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleRestore(record)}
                          disabled={restoring === record.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Restore record"
                        >
                          {restoring === record.id ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(record.id)}
                          disabled={deleting === record.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Permanently delete"
                        >
                          {deleting === record.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Record Data:</h4>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(formatRecordData(record.recordData, record.tableName), null, 2)}
                      </pre>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p>Original user: {record.userEmail || 'Unknown'}</p>
                      {record.deletionReason && (
                        <p>Reason: {record.deletionReason}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          © 2025 Acaltech. All rights reserved.
        </p>
      </div>
    </div>
  );
};