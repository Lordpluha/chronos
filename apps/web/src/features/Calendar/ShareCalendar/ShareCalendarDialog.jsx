import { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Switch } from '@shared/ui/switch';
import { Copy, Mail, Link2, Users, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CalendarApi } from '@entities/Calendar/api/CalendarApi';
import { CalendarContext } from '@shared/context/CalendarContext';

export function ShareCalendarDialog({ open, onOpenChange, calendar }) {
  const { refetchCalendars, refetchEvents } = useContext(CalendarContext);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('read');
  const [publicLink, setPublicLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);

  // Load existing shares from calendar object
  useEffect(() => {
    if (calendar?.shared_with) {
      const shares = calendar.shared_with.map((share, index) => ({
        id: share._id || index,
        email: share.user?.email || share.email,
        permission: share.permission,
        avatar: (share.user?.email || share.email)?.[0]?.toUpperCase() || '?',
        userId: share.user?._id || share.user,
      }));
      setSharedWith(shares);
    }
  }, [calendar]);

  const handleShare = async () => {
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
    const link = publicLink || `${window.location.origin}/calendar?cal=${calendarId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePublic = (checked) => {
    setIsPublic(checked);
    if (checked) {
      const calendarId = calendar?._id || calendar?.id;
      // TODO: Generate public link
      setPublicLink(`${window.location.origin}/calendar?cal=${calendarId}`);
      toast.success('Public link generated');
    } else {
      setPublicLink('');
      toast.info('Public access disabled');
    }
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
                  <SelectItem value="read">View only</SelectItem>
                  <SelectItem value="write">Can edit</SelectItem>
                  <SelectItem value="admin">Full access</SelectItem>
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
            {sharedWith.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-xs text-gray-500">People with access</Label>
                {sharedWith.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-md border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.permission} access</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
              </div>
            )}
          </div>

          {/* Public link */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Public link</Label>
                <p className="text-xs text-gray-500">Anyone with the link can view</p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
              />
            </div>

            {isPublic && (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={publicLink}
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
            )}
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
