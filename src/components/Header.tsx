import React from 'react';
import { CheckSquare, Bell, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <div className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-4 relative">
        <CheckSquare className="w-8 h-8 text-blue-600" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Daily Activity Tracker
        </h1>
        <Bell className="w-6 h-6 text-purple-600" />
        
        <button
          onClick={onLogout}
          className="absolute right-0 flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
      <p className="text-gray-600 text-lg">
        Organize your daily activities with smart notifications and progress tracking
      </p>
    </div>
  );
};