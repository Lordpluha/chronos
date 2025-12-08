import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Badge } from '@shared/ui/badge';
import { Upload, User, Mail, Lock, Shield, Trash2 } from 'lucide-react';
import { AvatarUpload } from '../components/AvatarUpload';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import { TwoFactorSetupDialog } from '@features/Auth/components/TwoFactorSetup';
import { BackupCodesDialog } from '@features/Auth/components/BackupCodesDialog';
import { TwoFactorDisableDialog } from '@features/Auth/components/TwoFactorDisable';
import { toast } from 'sonner';
import { UserApi } from '@entities/User';
import { AuthApi } from '@features/Auth';
import { useAuth } from '@shared/context/AuthContext';

export function ProfileTab({ user }) {
  const { refreshUser } = useAuth();
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  // Update formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  // Fetch 2FA status
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const status = await AuthApi.get2FAStatus();
        setTwoFactorStatus(status);
      } catch (error) {
        console.error('Failed to fetch 2FA status:', error);
      }
    };

    if (user) {
      fetch2FAStatus();
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await UserApi.updateProfile(formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      await UserApi.uploadAvatar(file);
      toast.success('Avatar uploaded successfully');
      setShowAvatarUpload(false);
      // Refresh user data
      await refreshUser();
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    }
  };

  const handle2FASetupSuccess = (codes) => {
    setBackupCodes(codes);
    setShowBackupCodes(true);
    // Refresh status
    AuthApi.get2FAStatus().then(setTwoFactorStatus);
    refreshUser();
  };

  const handleDisable2FASuccess = () => {
    toast.success('2FA disabled successfully');
    // Refresh status
    AuthApi.get2FAStatus().then(setTwoFactorStatus);
    refreshUser();
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your personal information and account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar} alt={user?.full_name} />
              <AvatarFallback className="text-2xl bg-indigo-600 text-white">
                {getInitials(user?.full_name || user?.login)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAvatarUpload(true)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Avatar
              </Button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  value={user?.login}
                  disabled
                  className="flex-1"
                />
                <Badge variant="secondary">Read-only</Badge>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={isEditing ? formData.email : user?.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="flex-1"
                />
                {user?.is_email_verified && (
                  <Badge variant="success" className="bg-green-600">Verified</Badge>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input
                id="fullname"
                value={isEditing ? formData.full_name : user?.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Edit/Save Buttons */}
            <div className="flex gap-2 pt-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveProfile} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: user?.full_name || '',
                        email: user?.email || '',
                      });
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your password and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last changed 30 days ago
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(true)}
            >
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {twoFactorStatus?.is2FAEnabled ? (
                    <>
                      Enabled • {twoFactorStatus.backupCodesCount} backup codes remaining
                    </>
                  ) : (
                    'Not enabled'
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                if (twoFactorStatus?.is2FAEnabled) {
                  setShow2FADisable(true);
                } else {
                  setShow2FASetup(true);
                }
              }}
            >
              {twoFactorStatus?.is2FAEnabled ? 'Disable' : 'Enable'} 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Permanently delete your account and all data
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => setShowDeleteAccount(true)}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showAvatarUpload && (
        <AvatarUpload
          onClose={() => setShowAvatarUpload(false)}
          onUpload={handleAvatarUpload}
          currentAvatar={user?.avatar}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {showDeleteAccount && (
        <DeleteAccountModal
          onClose={() => setShowDeleteAccount(false)}
          isGoogleUser={!!user?.google_id}
        />
      )}

      <TwoFactorSetupDialog
        open={show2FASetup}
        onOpenChange={setShow2FASetup}
        onSuccess={handle2FASetupSuccess}
      />

      <TwoFactorDisableDialog
        open={show2FADisable}
        onOpenChange={setShow2FADisable}
        onSuccess={handleDisable2FASuccess}
      />

      <BackupCodesDialog
        open={showBackupCodes}
        onOpenChange={setShowBackupCodes}
        backupCodes={backupCodes}
      />
    </>
  );
}
