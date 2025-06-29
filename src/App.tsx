import React, { useState, useMemo } from 'react';
import { Todo, ProgressData } from './types/todo';
import { TodoForm } from './components/TodoForm';
import { TodoItem } from './components/TodoItem';
import { ProgressChart } from './components/ProgressChart';
import { FilterBar } from './components/FilterBar';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { ExportPage } from './components/ExportPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNotifications } from './hooks/useNotifications';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showCompleted, setShowCompleted] = useState(true);
  const [currentView, setCurrentView] = useState<'tasks' | 'export'>('tasks');

  // Enable notifications only when authenticated
  useNotifications(isAuthenticated ? todos : []);

  const addTodo = (todoData: Omit<Todo, 'id' | 'createdAt' | 'completed'>) => {
    const newTodo: Todo = {
      ...todoData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      completed: false
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === id 
        ? { 
            ...todo, 
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date() : undefined
          }
        : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
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

      return matchesSearch && matchesCategory && matchesPriority && matchesCompleted;
    });
  }, [todos, searchTerm, selectedCategory, selectedPriority, showCompleted]);

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
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Show export page if selected
  if (currentView === 'export') {
    return <ExportPage todos={todos} onBack={() => setCurrentView('tasks')} />;
  }

  // Show main application if authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with logout and export */}
        <Header onLogout={logout} onExport={() => setCurrentView('export')} />

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
        />

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

          {filteredTodos.length === 0 ? (
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
      </div>
    </div>
  );
}

export default App;