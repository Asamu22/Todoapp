import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../lib/supabase';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sign in the user
      await signIn(email, password);
      
      // Check if user is admin after successful login
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication failed');
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_admin, is_super_admin')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to verify admin status');
      }

      if (!profile?.is_admin) {
        // Sign out if not admin
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin privileges required.');
      }

      onSuccess();
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Admin Access
            </h1>
          </div>
          <p className="text-gray-600 text-center">
            Enter admin credentials to access the dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter admin email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  'Access Admin Dashboard'
                )}
              </button>
            </div>
          </form>

          {/* Default Credentials Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Default Admin Credentials</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Email:</strong> calebasamu47@gmail.com</p>
              <p><strong>Password:</strong> @c@lt3ch</p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Only the default admin can promote other users to admin status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};