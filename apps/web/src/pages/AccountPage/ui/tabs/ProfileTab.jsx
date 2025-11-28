import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { Badge } from '@shared/ui/badge';
import { Upload, User, Mail, Lock, Shield, Trash2 } from 'lucide-react';
import { AvatarUpload } from '../components/AvatarUpload';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { toast } from 'sonner';

export function ProfileTab({ user }) {
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
  });

  const handleSaveProfile = async () => {
    try {
      // TODO: Implement API call to update profile
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      // TODO: Implement avatar upload API call
      toast.success('Avatar uploaded successfully');
      setShowAvatarUpload(false);
    } catch (error) {
      toast.error('Failed to upload avatar');
    }
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
                  <Button onClick={handleSaveProfile}>
                    Save Changes
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
                  {user?.is_two_factor_enabled ? 'Enabled' : 'Not enabled'}
                </p>
              </div>
            </div>
            <Button variant="outline">
              {user?.is_two_factor_enabled ? 'Disable' : 'Enable'} 2FA
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
    </>
  );
}
