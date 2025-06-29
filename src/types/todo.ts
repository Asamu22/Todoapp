export interface Todo {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  dueTime?: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface ProgressData {
  date: string;
  completed: number;
  total: number;
  percentage: number;
}