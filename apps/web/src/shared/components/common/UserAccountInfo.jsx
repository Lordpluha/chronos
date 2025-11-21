import React from 'react';
import { useAuth } from '@shared/context/AuthContext';
import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/button';
import toast from 'react-hot-toast';

export default function UserAccountInfo() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {user.full_name}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {user.full_name?.charAt(0).toUpperCase() ||
              user.login?.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <Button onClick={handleLogout} variant="outline" size="sm">
        Logout
      </Button>
    </div>
  );
}
