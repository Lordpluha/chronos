import { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Copy, Mail, Link2, Users, Trash2, Check, Loader2, Crown, User } from 'lucide-react';
import { toast } from 'sonner';
import { CalendarApi } from '@entities/Calendar/api/CalendarApi';
import { CalendarContext } from '@shared/context/CalendarContext';
import { useAuth } from '@shared/context/AuthContext';

// Permission presets для удобства
const PERMISSION_PRESETS = {
  viewer: { label: 'Viewer', description: 'Can only view events', value: 'read' },
  editor: { label: 'Editor', description: 'Can create and edit events', value: 'write' },
  admin: { label: 'Admin', description: 'Full control including sharing', value: 'admin' },
};

export function ShareCalendarDialog({ open, onOpenChange, calendar }) {
  const { refetchCalendars, refetchEvents } = useContext(CalendarContext);
  const { user: currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);

  // Load existing shares from calendar object
  useEffect(() => {
    if (calendar?.shared_with) {
      const shares = calendar.shared_with.map((share, index) => {
        // Handle both populated and non-populated user objects
        const userObj = share.user;
        const email = userObj?.email || share.email || 'Unknown User';
        const name = userObj?.name || email.split('@')[0];
        const userId = userObj?._id || share.user;

        // Маппинг старых значений на новые
        let mappedPermission = share.permission || 'viewer';
        if (mappedPermission === 'read') mappedPermission = 'viewer';
        if (mappedPermission === 'write') mappedPermission = 'admin'; // write больше нет, делаем admin
        // owner остается owner

        return {
          id: share._id || index,
          email: email,
          name: name,
          permission: mappedPermission,
          avatar: email !== 'Unknown User' ? email[0]?.toUpperCase() : '?',
          userId: userId,
        };
      }).filter(share => share.email !== 'Unknown User'); // Фильтруем невалидные записи

      setSharedWith(shares);
    }
  }, [calendar]);  const handleShare = async () => {
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    const calendarId = calendar?._id || calendar?.id;
    if (!calendarId) {
      toast.error('Calendar ID is missing');
      console.error('Calendar object:', calendar);
      return;
    }

    setLoading(true);
    try {
      const response = await CalendarApi.share(calendarId, {
        userEmail: email,
        permission: permission,
      });

      // Update local state with new share
      const newShare = {
        id: Date.now(),
        email,
        permission,
        avatar: email[0].toUpperCase(),
      };

      setSharedWith([...sharedWith, newShare]);
      setEmail('');
      toast.success(`Calendar shared with ${email}`);

      // Refetch calendars and events for the target user
      console.log('🔄 Calendar shared, refetching data...');
      await refetchCalendars();
      await refetchEvents();
    } catch (error) {
      console.error('Error sharing calendar:', error);
      toast.error(error.response?.data?.message || 'Failed to share calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareItem) => {
    const calendarId = calendar?._id || calendar?.id;
    if (!calendarId) {
      toast.error('Calendar ID is missing');
      return;
    }

    setLoading(true);
    try {
      await CalendarApi.removeAccess(calendarId, {
        userEmail: shareItem.email,
      });

      setSharedWith(sharedWith.filter(s => s.id !== shareItem.id));
      toast.success('Access removed');

      // Refetch data after removing access
      console.log('🔄 Access removed, refetching data...');
      await refetchCalendars();
      await refetchEvents();
    } catch (error) {
      console.error('Error removing access:', error);
      toast.error(error.response?.data?.message || 'Failed to remove access');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const calendarId = calendar?._id || calendar?.id;
    const link = `${window.location.origin}/calendar?cal=${calendarId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{calendar?.title}"
          </DialogTitle>
          <DialogDescription>
            Share this calendar with others or create a public link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Share with specific people */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Share with people</Label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                />
              </div>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleShare} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </div>

            {/* List of shared users */}
            <div className="space-y-2 mt-4">
              <Label className="text-xs text-gray-500">
                People with access ({sharedWith.length + (calendar?.creator ? 1 : 0)})
              </Label>

              {/* Calendar Creator */}
              {calendar?.creator && (
                <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                      {calendar.creator?.email?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{calendar.creator?.email || 'Creator'}</p>
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <span className="text-xs text-gray-500">
                        Creator • Organizer
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared users */}
              {sharedWith.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name || user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Select
                          value={user.permission}
                          onValueChange={async (newPermission) => {
                            const calendarId = calendar?._id || calendar?.id;
                            setLoading(true);
                            try {
                              await CalendarApi.share(calendarId, {
                                userEmail: user.email,
                                permission: newPermission,
                              });

                              setSharedWith(sharedWith.map(u =>
                                u.id === user.id ? { ...u, permission: newPermission } : u
                              ));

                              toast.success('Permission updated');
                              await refetchCalendars();
                              await refetchEvents();
                            } catch (error) {
                              console.error('Error updating permission:', error);
                              toast.error('Failed to update permission');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                        >
                          <SelectTrigger className="w-[100px] h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">
                              <span className="text-xs">Viewer</span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="text-xs">Admin</span>
                            </SelectItem>
                            <SelectItem value="owner">
                              <span className="text-xs">Owner</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => handleRemoveShare(user)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}

              {sharedWith.length === 0 && !calendar?.creator && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No one has access yet. Share to collaborate!
                </p>
              )}
            </div>
          </div>

          {/* Copy calendar link */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Label className="text-sm font-medium">Calendar link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/calendar?cal=${calendar?._id || calendar?.id || 'xxx'}`}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Share this link with anyone to let them view calendar and events
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
