import React, { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, Filter } from 'lucide-react';
import { Todo } from '../types/todo';
import { exportToExcel } from '../utils/excelExport';

interface ExportPageProps {
  todos: Todo[];
  onBack: () => void;
}

export const ExportPage: React.FC<ExportPageProps> = ({ todos, onBack }) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['All']);
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeIncomplete, setIncludeIncomplete] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isExporting, setIsExporting] = useState(false);

  const categories = ['All', ...Array.from(new Set(todos.map(todo => todo.category)))];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  const handleCategoryChange = (category: string) => {
    if (category === 'All') {
      setSelectedCategories(['All']);
    } else {
      const newCategories = selectedCategories.includes('All') 
        ? [category]
        : selectedCategories.includes(category)
          ? selectedCategories.filter(c => c !== category)
          : [...selectedCategories, category];
      
      setSelectedCategories(newCategories.length === 0 ? ['All'] : newCategories);
    }
  };

  const handlePriorityChange = (priority: string) => {
    if (priority === 'All') {
      setSelectedPriorities(['All']);
    } else {
      const newPriorities = selectedPriorities.includes('All') 
        ? [priority]
        : selectedPriorities.includes(priority)
          ? selectedPriorities.filter(p => p !== priority)
          : [...selectedPriorities, priority];
      
      setSelectedPriorities(newPriorities.length === 0 ? ['All'] : newPriorities);
    }
  };

  const getFilteredTodos = () => {
    return todos.filter(todo => {
      // Category filter
      const categoryMatch = selectedCategories.includes('All') || selectedCategories.includes(todo.category);
      
      // Priority filter
      const priorityMatch = selectedPriorities.includes('All') || selectedPriorities.includes(todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1));
      
      // Completion status filter
      const completionMatch = (includeCompleted && todo.completed) || (includeIncomplete && !todo.completed);
      
      // Date range filter
      let dateMatch = true;
      const todoDate = new Date(todo.createdAt);
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          dateMatch = todoDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateMatch = todoDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateMatch = todoDate >= monthAgo;
          break;
        default:
          dateMatch = true;
      }
      
      return categoryMatch && priorityMatch && completionMatch && dateMatch;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filteredTodos = getFilteredTodos();
      await exportToExcel(filteredTodos);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTodos = getFilteredTodos();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-16 lg:pt-0">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-green-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Export Task Data
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Filters */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">Export Filters</h2>
            </div>

            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCategories.includes(category)
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priorities */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Priorities</h3>
                <div className="flex flex-wrap gap-2">
                  {priorities.map(priority => (
                    <button
                      key={priority}
                      onClick={() => handlePriorityChange(priority)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedPriorities.includes(priority)
                          ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              {/* Completion Status */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Task Status</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCompleted}
                      onChange={(e) => setIncludeCompleted(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Include completed tasks</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeIncomplete}
                      onChange={(e) => setIncludeIncomplete(e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">Include incomplete tasks</span>
                  </label>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Date Range</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as 'all' | 'today' | 'week' | 'month')}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All time</option>
                    <option value="today">Today only</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                  </select>
                </div>
              </div>
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
                <span className="text-sm text-gray-600">Total tasks to export:</span>
                <span className="font-semibold text-blue-600">{filteredTodos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed:</span>
                <span className="font-semibold text-green-600">
                  {filteredTodos.filter(t => t.completed).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Incomplete:</span>
                <span className="font-semibold text-orange-600">
                  {filteredTodos.filter(t => !t.completed).length}
                </span>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <button
              onClick={handleExport}
              disabled={isExporting || filteredTodos.length === 0}
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
            
            {filteredTodos.length === 0 && (
              <p className="text-sm text-gray-500 text-center mt-2">
                No tasks match your current filters
              </p>
            )}
          </div>

          {/* Export Info */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="font-medium text-blue-800 mb-2">Export Information</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Excel file (.xlsx format)</li>
              <li>• Includes all task details</li>
              <li>• Formatted for easy reading</li>
              <li>• Compatible with Excel & Google Sheets</li>
            </ul>
          </div>
        </div>
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