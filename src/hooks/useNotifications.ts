import { useEffect, useRef } from 'react';
import { Todo } from '../types/todo';

export const useNotifications = (todos: Todo[]) => {
  const notifiedTasks = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      todos.forEach(todo => {
        if (!todo.completed && todo.dueTime && !notifiedTasks.current.has(todo.id)) {
          const [hours, minutes] = todo.dueTime.split(':').map(Number);
          const taskTime = hours * 60 + minutes;
          const timeDiff = taskTime - currentTime;

          // Notify 5 minutes before
          if (timeDiff <= 5 && timeDiff > 0) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Upcoming Task: ${todo.title}`, {
                body: `Due in ${timeDiff} minute${timeDiff !== 1 ? 's' : ''}`,
                icon: '/vite.svg'
              });
            }
            notifiedTasks.current.add(todo.id);
          }
        }
      });
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const interval = setInterval(checkNotifications, 60000); // Check every minute
    checkNotifications(); // Check immediately

    return () => clearInterval(interval);
  }, [todos]);
};