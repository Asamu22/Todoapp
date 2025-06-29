import React from 'react';
import { Check, Clock, Tag, AlertCircle, Trash2, Calendar } from 'lucide-react';
import { Todo } from '../types/todo';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: 'border-l-green-500 bg-green-50',
  medium: 'border-l-yellow-500 bg-yellow-50',
  high: 'border-l-red-500 bg-red-50'
};

const priorityBadges = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const now = new Date();
  const today = now.toDateString();
  
  // Check if task is overdue
  const isOverdue = () => {
    if (todo.completed) return false;
    
    if (todo.scheduledFor) {
      return now > todo.scheduledFor;
    }
    
    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      if (todo.dueTime) {
        const [hours, minutes] = todo.dueTime.split(':').map(Number);
        dueDate.setHours(hours, minutes);
      }
      return now > dueDate;
    }
    
    if (todo.dueTime && !todo.dueDate) {
      // Legacy: only time without date (assume today)
      const [hours, minutes] = todo.dueTime.split(':').map(Number);
      const todayWithTime = new Date();
      todayWithTime.setHours(hours, minutes, 0, 0);
      return now > todayWithTime;
    }
    
    return false;
  };

  // Check if task is scheduled for future
  const isFutureTask = () => {
    if (todo.scheduledFor) {
      return todo.scheduledFor > now;
    }
    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      return dueDate.toDateString() !== today;
    }
    return false;
  };

  // Format the scheduled date/time
  const getScheduledText = () => {
    if (todo.scheduledFor) {
      const scheduledDate = todo.scheduledFor.toDateString();
      const scheduledTime = todo.scheduledFor.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      
      if (scheduledDate === today) {
        return `Today at ${scheduledTime}`;
      } else {
        return `${todo.scheduledFor.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })} at ${scheduledTime}`;
      }
    }
    
    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      const dateText = dueDate.toDateString() === today ? 'Today' : 
                      dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (todo.dueTime) {
        return `${dateText} at ${todo.dueTime}`;
      } else {
        return dateText;
      }
    }
    
    if (todo.dueTime) {
      return `Today at ${todo.dueTime}`;
    }
    
    return null;
  };

  const overdue = isOverdue();
  const future = isFutureTask();
  const scheduledText = getScheduledText();

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${priorityColors[todo.priority]} p-4 transition-all duration-200 hover:shadow-lg ${
      todo.completed ? 'opacity-75' : ''
    } ${future ? 'bg-gradient-to-r from-blue-50 to-white' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(todo.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            todo.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 hover:border-green-500'
          }`}
        >
          {todo.completed && <Check className="w-4 h-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-gray-900 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.title}
            </h3>
            {future && !todo.completed && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex-shrink-0">
                Scheduled
              </span>
            )}
          </div>
          
          {todo.description && (
            <p className={`text-sm mt-1 ${todo.completed ? 'text-gray-400' : 'text-gray-600'}`}>
              {todo.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{todo.category}</span>
            </div>

            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadges[todo.priority]}`}>
              {todo.priority}
            </span>

            {scheduledText && (
              <div className={`flex items-center gap-1 ${
                overdue ? 'text-red-600' : future ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {future ? <Calendar className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                <span className="text-xs">{scheduledText}</span>
                {overdue && <AlertCircle className="w-3 h-3" />}
              </div>
            )}

            {overdue && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                Overdue
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(todo.id)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};