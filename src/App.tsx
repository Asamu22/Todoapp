import React, { useState, useMemo } from 'react';
import { Todo, ProgressData } from './types/todo';
import { TodoForm } from './components/TodoForm';
import { TodoItem } from './components/TodoItem';
import { ProgressChart } from './components/ProgressChart';
import { FilterBar } from './components/FilterBar';
import { AuthPage } from './components/AuthPage';
import { SideNav } from './components/SideNav';
import { ExportPage } from './components/ExportPage';
import { InternetMonitoringPage } from './components/InternetMonitoringPage';
import { useNotifications } from './hooks/useNotifications';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useTodos } from './hooks/useTodos';

function App() {
  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const { todos, loading: todosLoading, error, addTodo, toggleTodo, deleteTodo } = useTodos(user?.id || null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showCompleted, setShowCompleted] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [currentView, setCurrentView] = useState<'tasks' | 'export' | 'internet'>('tasks');
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);

  // Enable notifications only when authenticated
  useNotifications(user ? todos : []);

  // Helper function to check if a date matches the filter
  const matchesDateFilter = (todo: Todo, filter: string): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    switch (filter) {
      case 'all':
        return true;
      
      case 'today': {
        // Check if task is scheduled for today
        if (todo.scheduledFor) {
          const scheduledDate = new Date(todo.scheduledFor.getFullYear(), todo.scheduledFor.getMonth(), todo.scheduledFor.getDate());
          return scheduledDate.getTime() === today.getTime();
        }
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate);
          return dueDate.getTime() === today.getTime();
        }
        // If no specific date, check if it was created today and has a time
        if (todo.dueTime && !todo.dueDate) {
          const createdDate = new Date(todo.createdAt.getFullYear(), todo.createdAt.getMonth(), todo.createdAt.getDate());
          return createdDate.getTime() === today.getTime();
        }
        return false;
      }
      
      case 'tomorrow': {
        if (todo.scheduledFor) {
          const scheduledDate = new Date(todo.scheduledFor.getFullYear(), todo.scheduledFor.getMonth(), todo.scheduledFor.getDate());
          return scheduledDate.getTime() === tomorrow.getTime();
        }
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate);
          return dueDate.getTime() === tomorrow.getTime();
        }
        return false;
      }
      
      case 'week': {
        if (todo.scheduledFor) {
          const scheduledDate = new Date(todo.scheduledFor.getFullYear(), todo.scheduledFor.getMonth(), todo.scheduledFor.getDate());
          return scheduledDate >= today && scheduledDate < weekFromNow;
        }
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate);
          return dueDate >= today && dueDate < weekFromNow;
        }
        return false;
      }
      
      case 'overdue': {
        if (todo.completed) return false;
        
        if (todo.scheduledFor) {
          return todo.scheduledFor < now;
        }
        
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate);
          if (todo.dueTime) {
            const [hours, minutes] = todo.dueTime.split(':').map(Number);
            dueDate.setHours(hours, minutes);
          } else {
            dueDate.setHours(23, 59, 59); // End of day if no time specified
          }
          return dueDate < now;
        }
        
        // Legacy: only time without date (assume today)
        if (todo.dueTime && !todo.dueDate) {
          const [hours, minutes] = todo.dueTime.split(':').map(Number);
          const todayWithTime = new Date();
          todayWithTime.setHours(hours, minutes, 0, 0);
          return todayWithTime < now;
        }
        
        return false;
      }
      
      case 'future': {
        if (todo.scheduledFor) {
          const scheduledDate = new Date(todo.scheduledFor.getFullYear(), todo.scheduledFor.getMonth(), todo.scheduledFor.getDate());
          return scheduledDate > today;
        }
        if (todo.dueDate) {
          const dueDate = new Date(todo.dueDate);
          return dueDate > today;
        }
        return false;
      }
      
      default:
        return true;
    }
  };

  // Filter todos
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesCategory = selectedCategory === 'All' || todo.category === selectedCategory;
      const matchesPriority = selectedPriority === 'All' || 
                             todo.priority.toLowerCase() === selectedPriority.toLowerCase();
      const matchesCompleted = showCompleted || !todo.completed;
      const matchesDate = matchesDateFilter(todo, dateFilter);

      return matchesSearch && matchesCategory && matchesPriority && matchesCompleted && matchesDate;
    });
  }, [todos, searchTerm, selectedCategory, selectedPriority, showCompleted, dateFilter]);

  // Generate progress data for the last 7 days
  const progressData: ProgressData[] = useMemo(() => {
    const data: ProgressData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayTodos = todos.filter(todo => {
        const todoDate = new Date(todo.createdAt);
        return todoDate.toDateString() === date.toDateString();
      });
      
      const completed = dayTodos.filter(todo => todo.completed).length;
      const total = dayTodos.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      data.push({
        date: dateStr,
        completed,
        total,
        percentage
      });
    }
    
    return data;
  }, [todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const today = new Date().toDateString();
    const todayTodos = todos.filter(todo => new Date(todo.createdAt).toDateString() === today);
    const todayCompleted = todayTodos.filter(todo => todo.completed).length;
    const todayProgress = todayTodos.length > 0 ? Math.round((todayCompleted / todayTodos.length) * 100) : 0;

    return { total, completed, todayProgress };
  }, [todos]);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // Main layout with side navigation
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SideNav 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={signOut}
        onCollapseChange={setSideNavCollapsed}
      />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${
        sideNavCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {currentView === 'export' && (
          <div className="min-h-screen">
            <ExportPage todos={todos} onBack={() => setCurrentView('tasks')} />
          </div>
        )}

        {currentView === 'internet' && (
          <div className="min-h-screen">
            <InternetMonitoringPage userId={user.id} onBack={() => setCurrentView('tasks')} />
          </div>
        )}

        {currentView === 'tasks' && (
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Page Title */}
            <div className="text-center mb-8 pt-16 lg:pt-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Daily Activity Tracker
              </h1>
              <p className="text-gray-600 text-lg">
                Organize your daily activities with smart notifications and progress tracking
              </p>
            </div>

            {/* Progress Chart */}
            <ProgressChart 
              data={progressData}
              totalTasks={stats.total}
              completedTasks={stats.completed}
              todayProgress={stats.todayProgress}
            />

            {/* Todo Form */}
            <TodoForm onAddTodo={addTodo} />

            {/* Filter Bar */}
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
              showCompleted={showCompleted}
              onShowCompletedChange={setShowCompleted}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
            />

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Todo List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Your Tasks ({filteredTodos.length})
                </h2>
                {filteredTodos.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {filteredTodos.filter(t => t.completed).length} completed
                  </div>
                )}
              </div>

              {todosLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading your tasks...</p>
                </div>
              ) : filteredTodos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-gray-500 text-lg">
                    {todos.length === 0 
                      ? "No tasks yet. Add your first task above!" 
                      : "No tasks match your current filters."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTodos.map(todo => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                    />
                  ))}
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
        )}
      </div>
    </div>
  );
}

export default App;