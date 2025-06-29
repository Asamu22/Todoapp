import React, { useState, useMemo } from 'react';
import { ArrowLeft, Wifi, Plus, Download, Edit2, Trash2, Save, X, TrendingUp, Calendar, Clock, BarChart3 } from 'lucide-react';
import { InternetRecord, InternetStats } from '../types/internet';
import { useInternetRecords } from '../hooks/useInternetRecords';
import { exportInternetDataToExcel } from '../utils/internetExcelExport';

interface InternetMonitoringPageProps {
  userId: string;
  onBack: () => void;
}

export const InternetMonitoringPage: React.FC<InternetMonitoringPageProps> = ({ userId, onBack }) => {
  const { records, loading, error, addRecord, updateRecord, deleteRecord } = useInternetRecords(userId);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startBalance: '',
    endBalance: '',
    workHours: '',
    notes: ''
  });

  // Calculate statistics
  const stats: InternetStats = useMemo(() => {
    const totalRecords = records.length;
    const totalUsage = records.reduce((sum, record) => sum + record.usage, 0);
    const averageUsage = totalRecords > 0 ? totalUsage / totalRecords : 0;
    const averageWorkHours = totalRecords > 0 ? records.reduce((sum, record) => sum + record.workHours, 0) / totalRecords : 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthUsage = records
      .filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      })
      .reduce((sum, record) => sum + record.usage, 0);
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekUsage = records
      .filter(record => new Date(record.date) >= lastWeek)
      .reduce((sum, record) => sum + record.usage, 0);

    return {
      totalRecords,
      totalUsage,
      averageUsage,
      averageWorkHours,
      currentMonthUsage,
      lastWeekUsage
    };
  }, [records]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const startBalance = parseFloat(formData.startBalance);
    const endBalance = parseFloat(formData.endBalance);
    const workHours = parseFloat(formData.workHours);
    
    if (isNaN(startBalance) || isNaN(endBalance) || isNaN(workHours)) {
      alert('Please enter valid numbers for all balance and work hours fields');
      return;
    }
    
    if (startBalance < endBalance) {
      alert('Start balance should be greater than or equal to end balance');
      return;
    }

    try {
      if (editingId) {
        await updateRecord(editingId, {
          date: formData.date,
          startBalance,
          endBalance,
          workHours,
          notes: formData.notes.trim() || undefined
        });
        setEditingId(null);
      } else {
        await addRecord({
          date: formData.date,
          startBalance,
          endBalance,
          workHours,
          notes: formData.notes.trim() || undefined
        });
        setShowAddForm(false);
      }
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startBalance: '',
        endBalance: '',
        workHours: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error saving record:', err);
    }
  };

  const handleEdit = (record: InternetRecord) => {
    setFormData({
      date: record.date,
      startBalance: record.startBalance.toString(),
      endBalance: record.endBalance.toString(),
      workHours: record.workHours.toString(),
      notes: record.notes || ''
    });
    setEditingId(record.id);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startBalance: '',
      endBalance: '',
      workHours: '',
      notes: ''
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportInternetDataToExcel(records, stats);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tasks
            </button>
            <div className="flex items-center gap-3">
              <Wifi className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Internet Monitoring
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting || records.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Data
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Records</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalRecords}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Total Usage</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalUsage)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">This Month</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.currentMonthUsage)}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Avg. Daily Usage</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.averageUsage)}</p>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? 'Edit Record' : 'Add New Record'}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Balance (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.startBalance}
                  onChange={(e) => setFormData(prev => ({ ...prev, startBalance: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Balance (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.endBalance}
                  onChange={(e) => setFormData(prev => ({ ...prev, endBalance: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.workHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, workHours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="8.0"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes..."
                />
              </div>

              <div className="lg:col-span-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update Record' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Records Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Internet Usage Records ({records.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading records...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No records yet. Add your first internet usage record!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Start Balance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">End Balance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Usage</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Work Hours</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Usage/Hour</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Notes</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-green-600">
                        {formatCurrency(record.startBalance)}
                      </td>
                      <td className="py-3 px-4 font-medium text-blue-600">
                        {formatCurrency(record.endBalance)}
                      </td>
                      <td className="py-3 px-4 font-medium text-red-600">
                        {formatCurrency(record.usage)}
                      </td>
                      <td className="py-3 px-4">{record.workHours}h</td>
                      <td className="py-3 px-4 text-purple-600 font-medium">
                        {formatCurrency(record.usage / record.workHours)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {record.notes || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this record?')) {
                                deleteRecord(record.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2025 Acaltech. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};