import React from 'react';
import { Check, Clock, Tag, AlertCircle, Trash2 } from 'lucide-react';
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
  const isOverdue = todo.dueTime && !todo.completed && 
    new Date().getHours() * 60 + new Date().getMinutes() > 
    parseInt(todo.dueTime.split(':')[0]) * 60 + parseInt(todo.dueTime.split(':')[1]);

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${priorityColors[todo.priority]} p-4 transition-all duration-200 hover:shadow-lg ${todo.completed ? 'opacity-75' : ''}`}>
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
          <h3 className={`font-medium text-gray-900 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
            {todo.title}
          </h3>
          
          {todo.description && (
            <p className={`text-sm mt-1 ${todo.completed ? 'text-gray-400' : 'text-gray-600'}`}>
              {todo.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">{todo.category}</span>
            </div>

            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadges[todo.priority]}`}>
              {todo.priority}
            </span>

            {todo.dueTime && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                <Clock className="w-3 h-3" />
                <span className="text-xs">{todo.dueTime}</span>
                {isOverdue && <AlertCircle className="w-3 h-3" />}
              </div>
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