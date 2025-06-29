import React, { useState, useEffect } from 'react';
import { CheckSquare, Bell, LogOut, Download, Wifi, Menu, X, Home, ChevronLeft, ChevronRight } from 'lucide-react';

interface SideNavProps {
  currentView: 'tasks' | 'export' | 'internet';
  onNavigate: (view: 'tasks' | 'export' | 'internet') => void;
  onLogout: () => void;
  onCollapseChange: (collapsed: boolean) => void;
}

export const SideNav: React.FC<SideNavProps> = ({ currentView, onNavigate, onLogout, onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Notify parent component when collapse state changes
  useEffect(() => {
    onCollapseChange(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const navigationItems = [
    {
      id: 'tasks' as const,
      label: 'Tasks',
      icon: Home,
      description: 'Manage your daily tasks'
    },
    {
      id: 'export' as const,
      label: 'Export',
      icon: Download,
      description: 'Export task data'
    },
    {
      id: 'internet' as const,
      label: 'Internet',
      icon: Wifi,
      description: 'Monitor internet usage'
    }
  ];

  const handleNavigation = (view: 'tasks' | 'export' | 'internet') => {
    onNavigate(view);
    setIsMobileOpen(false);
  };

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 text-gray-600 hover:text-blue-600 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Side Navigation */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-xl border-r border-gray-200 z-50 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center gap-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <CheckSquare className="w-8 h-8 text-blue-600 flex-shrink-0" />
            <div className={`${isCollapsed ? 'hidden' : 'block'}`}>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Daily Activity Tracker
              </h1>
            </div>
            <Bell className="w-5 h-5 text-purple-600 flex-shrink-0" />
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        <div className="hidden lg:block">
          <button
            onClick={handleCollapse}
            className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 text-gray-400 hover:text-gray-600 shadow-md transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`
                    w-full rounded-lg text-left transition-all duration-200 group relative
                    ${isCollapsed 
                      ? 'flex items-center justify-center p-3' 
                      : 'flex items-center gap-3 px-3 py-3'
                    }
                    ${isActive
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }
                  `}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
                  <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden absolute' : 'opacity-100'}`}>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 group-hover:text-blue-500">
                      {item.description}
                    </div>
                  </div>
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer - Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              onLogout();
              setIsMobileOpen(false);
            }}
            className={`
              w-full rounded-lg text-left text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 group relative
              ${isCollapsed 
                ? 'flex items-center justify-center p-3' 
                : 'flex items-center gap-3 px-3 py-3'
              }
            `}
            title={isCollapsed ? 'Sign Out' : ''}
          >
            <LogOut className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : ''}`} />
            <div className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden absolute' : 'opacity-100'}`}>
              <div className="font-medium">Sign Out</div>
              <div className="text-xs text-gray-500">End your session</div>
            </div>
            
            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Sign Out
              </div>
            )}
          </button>
        </div>

        {/* Copyright */}
        <div className={`p-4 border-t border-gray-200 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
          <p className="text-xs text-gray-500 text-center">
            © 2025 Acaltech. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
};