import React, { useState, useMemo } from 'react';
import { Wifi, Plus, Download, Edit2, Trash2, Save, X, TrendingUp, Calendar, Clock, BarChart3, AlertTriangle, Building2, Calculator } from 'lucide-react';
import { InternetRecord, InternetStats } from '../types/internet';
import { useInternetRecords } from '../hooks/useInternetRecords';
import { InternetExportPage } from './InternetExportPage';
import { DataCalculator } from './DataCalculator';

interface InternetMonitoringPageProps {
  userId: string;
  onBack: () => void;
}

// Helper function to normalize office names for comparison (case-insensitive)
const normalizeOfficeName = (officeName: string): string => {
  return officeName.trim().toLowerCase();
};

// Helper function to get unique offices with case-insensitive grouping
const getUniqueOffices = (records: InternetRecord[]): string[] => {
  const officeMap = new Map<string, string>();
  
  records.forEach(record => {
    const normalized = normalizeOfficeName(record.office);
    if (!officeMap.has(normalized)) {
      officeMap.set(normalized, record.office);
    }
  });
  
  return Array.from(officeMap.values()).sort();
};

// Helper function to check if office names match (case-insensitive)
const officeNamesMatch = (office1: string, office2: string): boolean => {
  return normalizeOfficeName(office1) === normalizeOfficeName(office2);
};

export const InternetMonitoringPage: React.FC<InternetMonitoringPageProps> = ({ userId, onBack }) => {
  const { records, loading, error, addRecord, updateRecord, deleteRecord } = useInternetRecords(userId);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showExportPage, setShowExportPage] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedOffice, setSelectedOffice] = useState<string>('All');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    recordId: string;
    recordDate: string;
    recordOffice: string;
  }>({ show: false, recordId: '', recordDate: '', recordOffice: '' });
  
  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startBalance: '',
    endBalance: '',
    workHours: '',
    office: 'Main Office',
    notes: ''
  });

  // Get unique offices from records with case-insensitive grouping
  const availableOffices = useMemo(() => {
    const uniqueOffices = getUniqueOffices(records);
    return ['All', ...uniqueOffices];
  }, [records]);

  // Filter records by selected office with case-insensitive matching
  const filteredRecords = useMemo(() => {
    if (selectedOffice === 'All') {
      return records;
    }
    return records.filter(record => officeNamesMatch(record.office, selectedOffice));
  }, [records, selectedOffice]);

  // Calculate statistics for filtered records with case-insensitive office grouping
  const stats: InternetStats = useMemo(() => {
    const recordsToAnalyze = filteredRecords;
    const totalRecords = recordsToAnalyze.length;
    const totalUsage = recordsToAnalyze.reduce((sum, record) => sum + record.usage, 0);
    const averageUsage = totalRecords > 0 ? totalUsage / totalRecords : 0;
    const averageWorkHours = totalRecords > 0 ? recordsToAnalyze.reduce((sum, record) => sum + record.workHours, 0) / totalRecords : 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthUsage = recordsToAnalyze
      .filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      })
      .reduce((sum, record) => sum + record.usage, 0);
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekUsage = recordsToAnalyze
      .filter(record => new Date(record.date) >= lastWeek)
      .reduce((sum, record) => sum + record.usage, 0);

    // Calculate office breakdown from all records (not filtered) with case-insensitive grouping
    const officeBreakdown = records.reduce((acc, record) => {
      // Find existing office key with case-insensitive matching
      let officeKey = record.office;
      for (const existingKey of Object.keys(acc)) {
        if (officeNamesMatch(existingKey, record.office)) {
          officeKey = existingKey;
          break;
        }
      }
      
      if (!acc[officeKey]) {
        acc[officeKey] = { records: 0, usage: 0 };
      }
      acc[officeKey].records += 1;
      acc[officeKey].usage += record.usage;
      return acc;
    }, {} as { [office: string]: { records: number; usage: number } });

    return {
      totalRecords,
      totalUsage,
      averageUsage,
      averageWorkHours,
      currentMonthUsage,
      lastWeekUsage,
      officeBreakdown
    };
  }, [filteredRecords, records]);

  // Show export page if selected
  if (showExportPage) {
    return <InternetExportPage records={records} onBack={() => setShowExportPage(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    
    const startBalance = parseFloat(formData.startBalance);
    const endBalance = parseFloat(formData.endBalance);
    const workHours = parseFloat(formData.workHours);
    
    if (isNaN(startBalance) || isNaN(endBalance) || isNaN(workHours)) {
      setActionError('Please enter valid numbers for all balance and work hours fields');
      return;
    }
    
    if (startBalance < endBalance) {
      setActionError('Start balance should be greater than or equal to end balance');
      return;
    }

    if (!formData.office.trim()) {
      setActionError('Please specify an office');
      return;
    }

    try {
      if (editingId) {
        await updateRecord(editingId, {
          date: formData.date,
          startBalance,
          endBalance,
          workHours,
          office: formData.office.trim(),
          notes: formData.notes.trim() || undefined
        });
        setEditingId(null);
      } else {
        // Check if a record already exists for this date AND office combination
        const existingRecord = records.find(record => 
          record.date === formData.date && 
          officeNamesMatch(record.office, formData.office.trim())
        );
        
        if (existingRecord) {
          // Update the existing record instead of creating a new one
          await updateRecord(existingRecord.id, {
            date: formData.date,
            startBalance,
            endBalance,
            workHours,
            office: formData.office.trim(),
            notes: formData.notes.trim() || undefined
          });
          setActionError(`Updated existing record for ${new Date(formData.date).toLocaleDateString()} - ${formData.office.trim()}`);
        } else {
          // Create a new record
          await addRecord({
            date: formData.date,
            startBalance,
            endBalance,
            workHours,
            office: formData.office.trim(),
            notes: formData.notes.trim() || undefined
          });
        }
        setShowAddForm(false);
      }
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        startBalance: '',
        endBalance: '',
        workHours: '',
        office: 'Main Office',
        notes: ''
      });
      
      // Clear the error after a delay if it was just an update notification
      if (actionError && actionError.includes('Updated existing record')) {
        setTimeout(() => setActionError(null), 3000);
      }
    } catch (err) {
      console.error('Error saving record:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to save record');
    }
  };

  const handleEdit = (record: InternetRecord) => {
    setFormData({
      date: record.date,
      startBalance: record.startBalance.toString(),
      endBalance: record.endBalance.toString(),
      workHours: record.workHours.toString(),
      office: record.office,
      notes: record.notes || ''
    });
    setEditingId(record.id);
    setShowAddForm(true);
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setActionError(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startBalance: '',
      endBalance: '',
      workHours: '',
      office: 'Main Office',
      notes: ''
    });
  };

  const handleDeleteClick = (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;

    setDeleteConfirmation({
      show: true,
      recordId: id,
      recordDate: new Date(record.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      recordOffice: record.office
    });
  };

  const handleConfirmDelete = async () => {
    const { recordId } = deleteConfirmation;
    
    setDeletingId(recordId);
    setActionError(null);
    setDeleteConfirmation({ show: false, recordId: '', recordDate: '', recordOffice: '' });

    try {
      await deleteRecord(recordId);
      console.log('Record deleted successfully');
    } catch (err) {
      console.error('Error deleting record:', err);
      setActionError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation({ show: false, recordId: '', recordDate: '', recordOffice: '' });
  };

  const formatDataUsage = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} TB`;
    }
    return `${amount.toFixed(2)} GB`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-16 lg:pt-0">
        <div className="flex items-center gap-3">
          <Wifi className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Internet Data Monitoring
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCalculator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
            title="Data Calculator"
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Calculator</span>
          </button>
          
          <button
            onClick={() => setShowExportPage(true)}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Data</span>
          </button>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Record</span>
          </button>
        </div>
      </div>

      {/* Data Calculator Modal */}
      <DataCalculator 
        isOpen={showCalculator} 
        onClose={() => setShowCalculator(false)} 
      />

      {/* Office Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filter by Office:</span>
          </div>
          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableOffices.map(office => (
              <option key={office} value={office}>{office}</option>
            ))}
          </select>
          {selectedOffice !== 'All' && (
            <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Showing {filteredRecords.length} records for {selectedOffice}
            </span>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the internet data record for{' '}
              <span className="font-semibold text-gray-900">{deleteConfirmation.recordDate}</span>{' '}
              at <span className="font-semibold text-blue-600">{deleteConfirmation.recordOffice}</span>?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(error || actionError) && (
        <div className={`border rounded-lg p-4 mb-6 ${
          actionError && actionError.includes('Updated existing record')
            ? 'bg-blue-50 border-blue-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionError && actionError.includes('Updated existing record') ? (
              <Calendar className="w-5 h-5 text-blue-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <p className={
              actionError && actionError.includes('Updated existing record')
                ? 'text-blue-600'
                : 'text-red-600'
            }>
              {error || actionError}
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">
              {selectedOffice === 'All' ? 'Total Records' : `${selectedOffice} Records`}
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.totalRecords}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium text-gray-600">
              {selectedOffice === 'All' ? 'Total Data Used' : `${selectedOffice} Usage`}
            </span>
          </div>
          <p className="text-2xl font-bold text-red-900">{formatDataUsage(stats.totalUsage)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">This Month</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatDataUsage(stats.currentMonthUsage)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Avg. Daily Usage</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{formatDataUsage(stats.averageUsage)}</p>
        </div>
      </div>

      {/* Office Breakdown */}
      {selectedOffice === 'All' && Object.keys(stats.officeBreakdown).length > 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Office Breakdown</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.officeBreakdown).map(([office, data]) => (
              <div key={office} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">{office}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Records:</span>
                    <span className="font-medium">{data.records}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Usage:</span>
                    <span className="font-medium text-red-600">{formatDataUsage(data.usage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. per Record:</span>
                    <span className="font-medium text-purple-600">
                      {formatDataUsage(data.usage / data.records)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {!editingId && records.find(r => r.date === formData.date && officeNamesMatch(r.office, formData.office.trim())) && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ A record already exists for this date and office. It will be updated.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Office
                <span className="text-xs text-gray-500 ml-1">(case-insensitive)</span>
              </label>
              <input
                type="text"
                value={formData.office}
                onChange={(e) => setFormData(prev => ({ ...prev, office: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Main Office, Branch A, Remote"
                required
              />
              {availableOffices.length > 1 && (
                <div className="mt-1 text-xs text-gray-500">
                  Existing offices: {availableOffices.filter(o => o !== 'All').join(', ')}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Balance (GB)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">End Balance (GB)</label>
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

            <div className="md:col-span-2 lg:col-span-1">
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
            Internet Data Usage Records ({filteredRecords.length})
            {selectedOffice !== 'All' && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                - {selectedOffice}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">
              {selectedOffice === 'All' 
                ? 'No records yet. Add your first internet data usage record!'
                : `No records found for ${selectedOffice}. Try selecting a different office or add a new record.`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Office</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Start Balance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">End Balance</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Data Used</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Work Hours</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Usage/Hour</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Notes</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {record.office}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-green-600">
                      {formatDataUsage(record.startBalance)}
                    </td>
                    <td className="py-3 px-4 font-medium text-blue-600">
                      {formatDataUsage(record.endBalance)}
                    </td>
                    <td className="py-3 px-4 font-medium text-red-600">
                      {formatDataUsage(record.usage)}
                    </td>
                    <td className="py-3 px-4">{record.workHours}h</td>
                    <td className="py-3 px-4 text-purple-600 font-medium">
                      {formatDataUsage(record.usage / record.workHours)}/h
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(record)}
                          disabled={deletingId === record.id}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                          title="Edit record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(record.id)}
                          disabled={deletingId === record.id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete record"
                        >
                          {deletingId === record.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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
  );
};