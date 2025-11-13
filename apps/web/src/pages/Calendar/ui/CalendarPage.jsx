import React from 'react';
import { useAuth } from '@shared/context/AuthContext';
import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/button';
import toast from 'react-hot-toast';

export function CalendarPage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Chronos</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.full_name?.charAt(0).toUpperCase() || user.login?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h2>
          <p className="text-gray-600">Welcome back, {user.full_name}!</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Username</p>
              <p className="text-lg text-gray-900">{user.login}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
              <p className="text-lg text-gray-900">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Account Status</p>
              <div className="flex items-center gap-2">
                {user.is_email_verified ? (
                  <>
                    <span className="text-green-600">✓</span>
                    <span className="text-lg text-green-600">Verified</span>
                  </>
                ) : (
                  <>
                    <span className="text-yellow-600">⚠</span>
                    <span className="text-lg text-yellow-600">Not Verified</span>
                  </>
                )}
              </div>
            </div>
            {user.google_id && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Connected Accounts</p>
                <div className="flex items-center gap-2">
                  <img src="/google.svg" alt="Google" className="w-5 h-5" />
                  <span className="text-lg text-gray-900">Google</span>
                </div>
              </div>
            )}
            {user.twoFactorEnabled && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Security</p>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">🔒</span>
                  <span className="text-lg text-green-600">2FA Enabled</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Your Calendar</h3>
          <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
            <p className="text-gray-500 text-lg">Calendar view coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
