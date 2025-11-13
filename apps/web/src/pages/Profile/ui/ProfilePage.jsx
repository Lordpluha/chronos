import React from 'react';
import { useAuth } from '@shared/context/AuthContext';
import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/button';
import toast from 'react-hot-toast';

export function ProfilePage() {
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Profile</h1>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Username</p>
            <p className="text-lg font-semibold">{user.login}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg font-semibold">{user.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="text-lg font-semibold">{user.full_name}</p>
          </div>

          {user.is_email_verified && (
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm">Email verified</span>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
