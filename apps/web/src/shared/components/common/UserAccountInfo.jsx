import React from 'react';
import { useAuth } from '@shared/context/AuthContext';
import { useNavigate } from 'react-router';
import { Button } from '@shared/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { ROUTES } from '@shared/routes';
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

  const handleAccountClick = () => {
    navigate(ROUTES.account);
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleAccountClick}
      >
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {user.full_name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
        <Avatar className="w-10 h-10">
          <AvatarImage src={user.avatar} alt={user.full_name} />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white">
            {user.full_name?.charAt(0).toUpperCase() ||
              user.login?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <Button onClick={handleLogout} variant="outline" size="sm">
        Logout
      </Button>
    </div>
  );
}
