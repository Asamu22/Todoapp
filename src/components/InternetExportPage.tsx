import React, { useState, useMemo } from 'react';
import { ArrowLeft, Download, FileSpreadsheet, Calendar, Filter, TrendingUp, BarChart3, Building2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { InternetRecord, InternetStats } from '../types/internet';
import { exportInternetDataToExcel } from '../utils/internetExcelExport';

interface InternetExportPageProps {
  records: InternetRecord[];
  onBack: () => void;
}

type DateFilterType = 'all' | 'month' | 'week' | 'day' | 'custom';

export const InternetExportPage: React.FC<InternetExportPageProps> = ({ records, onBack }) => {
  const [filterType, setFilterType] = useState<DateFilterType>('all');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('All');
  const [isExporting, setIsExporting] = useState(false);

  // Get available offices from records
  const availableOffices = useMemo(() => {
    const offices = Array.from(new Set(records.map(record => record.office)));
    return ['All', ...offices.sort()];
  }, [records]);

  // Get available months from records
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [records]);

  // Get available weeks for selected month
  const availableWeeks = useMemo(() => {
    if (!selectedMonth) return [];
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthRecords = records.filter(record => {
      const date = new Date(record.date);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });

    const weeks = new Set<string>();
    monthRecords.forEach(record => {
      const date = new Date(record.date);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const weekKey = `${startOfWeek.toISOString().split('T')[0]}_${endOfWeek.toISOString().split('T')[0]}`;
      weeks.add(weekKey);
    });
    
    return Array.from(weeks).sort().reverse();
  }, [records, selectedMonth]);

  // Get available days for selected month
  const availableDays = useMemo(() => {
    if (!selectedMonth) return [];
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthRecords = records.filter(record => {
      const date = new Date(record.date);
      return date.getFullYear() === year && date.getMonth() === month - 1;
    });

    return monthRecords.map(record => record.date).sort().reverse();
  }, [records, selectedMonth]);

  // Filter records based on selected criteria
  const filteredRecords = useMemo(() => {
    let filtered = records;

    // Filter by office first
    if (selectedOffice !== 'All') {
      filtered = filtered.filter(record => record.office === selectedOffice);
    }

    // Then filter by date
    switch (filterType) {
      case 'all':
        return filtered;
      
      case 'month':
        if (!selectedMonth) return [];
        const [year, month] = selectedMonth.split('-').map(Number);
        return filtered.filter(record => {
          const date = new Date(record.date);
          return date.getFullYear() === year && date.getMonth() === month - 1;
        });
      
      case 'week':
        if (!selectedWeek) return [];
        const [startWeek, endWeek] = selectedWeek.split('_');
        return filtered.filter(record => {
          const recordDate = record.date;
          return recordDate >= startWeek && recordDate <= endWeek;
        });
      
      case 'day':
        if (!selectedDay) return [];
        return filtered.filter(record => record.date === selectedDay);
      
      case 'custom':
        if (!customStartDate || !customEndDate) return [];
        return filtered.filter(record => {
          const recordDate = record.date;
          return recordDate >= customStartDate && recordDate <= customEndDate;
        });
      
      default:
        return filtered;
    }
  }, [records, selectedOffice, filterType, selectedMonth, selectedWeek, selectedDay, customStartDate, customEndDate]);

  // Calculate statistics for filtered records
  const filteredStats: InternetStats = useMemo(() => {
    const totalRecords = filteredRecords.length;
    const totalUsage = filteredRecords.reduce((sum, record) => sum + record.usage, 0);
    const averageUsage = totalRecords > 0 ? totalUsage / totalRecords : 0;
    const averageWorkHours = totalRecords > 0 ? filteredRecords.reduce((sum, record) => sum + record.workHours, 0) / totalRecords : 0;
    
    // Calculate office breakdown for filtered records
    const officeBreakdown = filteredRecords.reduce((acc, record) => {
      if (!acc[record.office]) {
        acc[record.office] = { records: 0, usage: 0 };
      }
      acc[record.office].records += 1;
      acc[record.office].usage += record.usage;
      return acc;
    }, {} as { [office: string]: { records: number; usage: number } });
    
    return {
      totalRecords,
      totalUsage,
      averageUsage,
      averageWorkHours,
      currentMonthUsage: totalUsage, // For filtered data, this represents the filtered period usage
      lastWeekUsage: totalUsage, // For filtered data, this represents the filtered period usage
      officeBreakdown
    };
  }, [filteredRecords]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredRecords
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(record => ({
        date: new Date(record.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDate: record.date,
        usage: parseFloat(record.usage.toFixed(2)),
        startBalance: parseFloat(record.startBalance.toFixed(2)),
        endBalance: parseFloat(record.endBalance.toFixed(2)),
        workHours: record.workHours,
        usagePerHour: parseFloat((record.usage / record.workHours).toFixed(2)),
        office: record.office
      }));
  }, [filteredRecords]);

  const handleExport = async () => {
    if (filteredRecords.length === 0) return;
    
    setIsExporting(true);
    try {
      // Create a custom filename based on filter type
      let filenameSuffix = '';
      
      // Add office to filename if specific office selected
      if (selectedOffice !== 'All') {
        filenameSuffix += `-${selectedOffice.replace(/\s+/g, '-')}`;
      }
      
      // Add date range to filename
      switch (filterType) {
        case 'month':
          if (selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            filenameSuffix += `-${monthName.replace(' ', '-')}`;
          }
          break;
        case 'week':
          if (selectedWeek) {
            const [start, end] = selectedWeek.split('_');
            filenameSuffix += `-Week-${start}-to-${end}`;
          }
          break;
        case 'day':
          if (selectedDay) {
            filenameSuffix += `-${selectedDay}`;
          }
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            filenameSuffix += `-${customStartDate}-to-${customEndDate}`;
          }
          break;
      }
      
      await exportInternetDataToExcel(filteredRecords, filteredStats, filenameSuffix);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDataUsage = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} TB`;
    }
    return `${amount.toFixed(2)} GB`;
  };

  const getFilterDescription = () => {
    let description = '';
    
    // Add office filter description
    if (selectedOffice !== 'All') {
      description += `Office: ${selectedOffice}`;
    }
    
    // Add date filter description
    let dateDescription = '';
    switch (filterType) {
      case 'all':
        dateDescription = 'All records';
        break;
      case 'month':
        if (selectedMonth) {
          const [year, month] = selectedMonth.split('-');
          dateDescription = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else {
          dateDescription = 'Select a month';
        }
        break;
      case 'week':
        if (selectedWeek) {
          const [start, end] = selectedWeek.split('_');
          dateDescription = `Week: ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
        } else {
          dateDescription = 'Select a week';
        }
        break;
      case 'day':
        if (selectedDay) {
          dateDescription = new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else {
          dateDescription = 'Select a day';
        }
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          dateDescription = `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
        } else {
          dateDescription = 'Select date range';
        }
        break;
    }
    
    if (description && dateDescription) {
      return `${description} | ${dateDescription}`;
    }
    return description || dateDescription;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-16 lg:pt-0">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Export Internet Data
          </h1>
        </div>
      </div>

      {/* Simple Line Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Internet Data Analytics</h2>
          </div>

          <div className="w-full">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  axisLine={{ stroke: '#6b7280' }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  axisLine={{ stroke: '#6b7280' }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: number, name: string) => {
                    switch (name) {
                      case 'usage':
                        return [`${value.toFixed(2)} GB`, 'Data Used'];
                      case 'startBalance':
                        return [`${value.toFixed(2)} GB`, 'Start Balance'];
                      case 'endBalance':
                        return [`${value.toFixed(2)} GB`, 'End Balance'];
                      case 'workHours':
                        return [`${value} hours`, 'Work Hours'];
                      case 'usagePerHour':
                        return [`${value.toFixed(2)} GB/hour`, 'Usage Rate'];
                      default:
                        return [value, name];
                    }
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                
                {/* Data Usage - Red Line */}
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={false}
                  name="usage"
                />
                
                {/* Start Balance - Green Line */}
                <Line 
                  type="monotone" 
                  dataKey="startBalance" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={false}
                  name="startBalance"
                />
                
                {/* End Balance - Blue Line */}
                <Line 
                  type="monotone" 
                  dataKey="endBalance" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  name="endBalance"
                />
                
                {/* Work Hours - Purple Line */}
                <Line 
                  type="monotone" 
                  dataKey="workHours" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={false}
                  name="workHours"
                />
                
                {/* Usage Rate - Orange Line */}
                <Line 
                  type="monotone" 
                  dataKey="usagePerHour" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={false}
                  name="usagePerHour"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Simple Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span className="text-gray-700">Data Used</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-green-500"></div>
              <span className="text-gray-700">Start Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-blue-500"></div>
              <span className="text-gray-700">End Balance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-purple-500"></div>
              <span className="text-gray-700">Work Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-orange-500"></div>
              <span className="text-gray-700">Usage Rate</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Options */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">Export Filters</h2>
            </div>

            <div className="space-y-6">
              {/* Office Filter */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Office</h3>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <select
                    value={selectedOffice}
                    onChange={(e) => setSelectedOffice(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {availableOffices.map(office => (
                      <option key={office} value={office}>{office}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Type Selection */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Export Period</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'All Data' },
                    { value: 'month', label: 'Specific Month' },
                    { value: 'week', label: 'Specific Week' },
                    { value: 'day', label: 'Specific Day' },
                    { value: 'custom', label: 'Custom Range' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterType(option.value as DateFilterType);
                        // Reset selections when changing filter type
                        setSelectedMonth('');
                        setSelectedWeek('');
                        setSelectedDay('');
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        filterType === option.value
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month Selection */}
              {filterType === 'month' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Select Month</h3>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setSelectedWeek('');
                      setSelectedDay('');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a month...</option>
                    {availableMonths.map(month => {
                      const [year, monthNum] = month.split('-');
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return (
                        <option key={month} value={month}>{monthName}</option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Week Selection */}
              {filterType === 'week' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Select Month First</h3>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setSelectedWeek('');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  >
                    <option value="">Choose a month...</option>
                    {availableMonths.map(month => {
                      const [year, monthNum] = month.split('-');
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return (
                        <option key={month} value={month}>{monthName}</option>
                      );
                    })}
                  </select>
                  
                  {selectedMonth && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Select Week</h3>
                      <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Choose a week...</option>
                        {availableWeeks.map(week => {
                          const [start, end] = week.split('_');
                          const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return (
                            <option key={week} value={week}>{startDate} - {endDate}</option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Day Selection */}
              {filterType === 'day' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Select Month First</h3>
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setSelectedDay('');
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  >
                    <option value="">Choose a month...</option>
                    {availableMonths.map(month => {
                      const [year, monthNum] = month.split('-');
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return (
                        <option key={month} value={month}>{monthName}</option>
                      );
                    })}
                  </select>
                  
                  {selectedMonth && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Select Day</h3>
                      <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Choose a day...</option>
                        {availableDays.map(day => {
                          const dayName = new Date(day).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                          });
                          return (
                            <option key={day} value={day}>{dayName}</option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Date Range */}
              {filterType === 'custom' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Custom Date Range</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Current Filter Display */}
              {(selectedOffice !== 'All' || filterType !== 'all') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Current Filter:</span>
                  </div>
                  <p className="text-blue-700 mt-1">{getFilterDescription()}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export Summary & Action */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Records to export:</span>
                <span className="font-semibold text-blue-600">{filteredRecords.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total data usage:</span>
                <span className="font-semibold text-red-600">
                  {formatDataUsage(filteredStats.totalUsage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average daily usage:</span>
                <span className="font-semibold text-purple-600">
                  {formatDataUsage(filteredStats.averageUsage)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average work hours:</span>
                <span className="font-semibold text-green-600">
                  {filteredStats.averageWorkHours.toFixed(1)}h
                </span>
              </div>
              {selectedOffice !== 'All' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Office:</span>
                  <span className="font-semibold text-blue-600">{selectedOffice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Office Breakdown (if multiple offices in filtered data) */}
          {Object.keys(filteredStats.officeBreakdown).length > 1 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Office Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(filteredStats.officeBreakdown).map(([office, data]) => (
                  <div key={office} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{office}:</span>
                    <div className="text-right">
                      <div className="font-medium">{data.records} records</div>
                      <div className="text-red-600">{formatDataUsage(data.usage)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              onClick={handleExport}
              disabled={isExporting || filteredRecords.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export to Excel
                </>
              )}
            </button>
            
            {filteredRecords.length === 0 && (
              <p className="text-sm text-gray-500 text-center mt-2">
                No records match your current filter
              </p>
            )}
          </div>

          {/* Export Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2">Export Features</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Excel file (.xlsx format)</li>
              <li>• Multiple sheets (Data, Summary, Office Breakdown)</li>
              <li>• Color-coded usage levels</li>
              <li>• Detailed statistics</li>
              <li>• Professional formatting</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview Table */}
      {filteredRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Preview ({filteredRecords.length} records)
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Date</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Office</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Start</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">End</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Used</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 5).map((record) => (
                  <tr key={record.id} className="border-b border-gray-100">
                    <td className="py-2 px-3 text-sm">
                      {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2 px-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {record.office}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm text-green-600">
                      {record.startBalance.toFixed(2)} GB
                    </td>
                    <td className="py-2 px-3 text-sm text-blue-600">
                      {record.endBalance.toFixed(2)} GB
                    </td>
                    <td className="py-2 px-3 text-sm text-red-600 font-medium">
                      {record.usage.toFixed(2)} GB
                    </td>
                    <td className="py-2 px-3 text-sm">{record.workHours}h</td>
                  </tr>
                ))}
                {filteredRecords.length > 5 && (
                  <tr>
                    <td colSpan={6} className="py-2 px-3 text-center text-sm text-gray-500">
                      ... and {filteredRecords.length - 5} more records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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