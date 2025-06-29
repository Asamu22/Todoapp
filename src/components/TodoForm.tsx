import React, { useState } from 'react';
import { Plus, Clock, Tag, AlertCircle, Calendar } from 'lucide-react';
import { Todo } from '../types/todo';

interface TodoFormProps {
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'completed'>) => void;
}

const categories = ['Work', 'Personal', 'Health', 'Learning', 'Shopping', 'Other'];
const priorities = [
  { value: 'low' as const, label: 'Low', color: 'text-green-600' },
  { value: 'medium' as const, label: 'Medium', color: 'text-yellow-600' },
  { value: 'high' as const, label: 'High', color: 'text-red-600' }
];

export const TodoForm: React.FC<TodoFormProps> = ({ onAddTodo }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Combine date and time if both are provided
    let scheduledDateTime: Date | undefined;
    if (dueDate) {
      if (dueTime) {
        scheduledDateTime = new Date(`${dueDate}T${dueTime}`);
      } else {
        // If only date is provided, set it to start of day
        scheduledDateTime = new Date(`${dueDate}T00:00:00`);
      }
    }

    onAddTodo({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueTime: dueTime || undefined,
      dueDate: dueDate || undefined,
      scheduledFor: scheduledDateTime
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('');
  };

  const isDateInPast = dueDate && dueDate < today;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Plus className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Add New Task</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          />
        </div>

        <div className="md:col-span-2">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description (optional)"
            rows={2}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-500" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gray-500" />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {priorities.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={today}
            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDateInPast ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          />
          <span className="text-sm text-gray-500">Due date</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-sm text-gray-500">Due time</span>
        </div>

        {isDateInPast && (
          <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Selected date is in the past. Consider choosing today or a future date.
            </p>
          </div>
        )}

        {dueDate && (
          <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Task scheduled for: {new Date(dueDate + (dueTime ? `T${dueTime}` : 'T00:00')).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                ...(dueTime && { hour: 'numeric', minute: '2-digit' })
              })}
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        {dueDate && dueDate !== today ? 'Schedule Task' : 'Add Task'}
      </button>
    </form>
  );
};