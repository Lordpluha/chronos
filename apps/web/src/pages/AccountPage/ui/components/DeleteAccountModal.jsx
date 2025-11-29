import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { UserApi } from '@entities/User';
import { useAuth } from '@shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function DeleteAccountModal({ onClose, isGoogleUser }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    // Проверяем подтверждение
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    // Если не Google пользователь, требуем пароль
    if (!isGoogleUser && !password) {
      setError('Password is required');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await UserApi.deleteAccount(password);
      toast.success('Account deleted successfully');

      // Выходим из системы и перенаправляем на главную
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setError(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 dark:text-red-200 mb-2">
              Warning: This will delete:
            </h4>
            <ul className="text-sm text-red-800 dark:text-red-300 space-y-1 list-disc list-inside">
              <li>Your profile and settings</li>
              <li>All your calendars and events</li>
              <li>All your tasks and task lists</li>
              <li>All your reminders</li>
              <li>This action is irreversible</li>
            </ul>
          </div>

          {/* Password field (only for non-Google users) */}
          {!isGoogleUser && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Enter your password to confirm
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
          )}

          {/* Confirmation text */}
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText !== 'DELETE'}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete Account'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
