import { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Copy, Mail, UserPlus, Trash2, Check, Loader2, Crown, User } from 'lucide-react';
import { toast } from 'sonner';
import { EventApi } from '@entities/Event/api/EventApi';
import { CalendarContext } from '@shared/context/CalendarContext';
import { useAuth } from '@shared/context/AuthContext';

export function ShareEventDialog({ open, onOpenChange, event }) {
  const { refetchCalendars, refetchEvents } = useContext(CalendarContext);
  const { user: currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);

  // Load existing attendees from event object
  useEffect(() => {
    if (event?.attendees && Array.isArray(event.attendees)) {
      const mappedAttendees = event.attendees.map((attendee, index) => {
        // attendee может быть либо с user (ObjectId или populated), либо с email
        const userEmail = attendee.user?.email || attendee.email;
        const userId = attendee.user?._id || attendee.user;

        return {
          id: userId || attendee._id || index,
          email: userEmail,
          role: attendee.role || 'participant',
          status: attendee.status || 'invited',
          avatar: userEmail?.[0]?.toUpperCase() || '?',
        };
      });
      setAttendees(mappedAttendees);
      console.log('📋 Loaded attendees:', mappedAttendees);
    } else {
      setAttendees([]);
    }
  }, [event, event?.attendees]);

  const handleInvite = async () => {
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    const eventId = event?._id || event?.id;
    if (!eventId) {
      toast.error('Event ID is missing');
      console.error('Event object:', event);
      return;
    }

    setLoading(true);
    try {
      console.log(`📧 Inviting ${email} with role ${role} to event ${eventId}`);
      const response = await EventApi.addAttendee(eventId, {
        email,
        role,
      });

      console.log('✅ Server response:', response);

      const newAttendee = {
        id: Date.now(),
        email,
        role,
        status: 'pending',
        avatar: email[0].toUpperCase(),
      };

      setAttendees([...attendees, newAttendee]);
      setEmail('');
      toast.success(`Invitation sent to ${email}`);

      // Refetch data so target user sees the calendar and event
      console.log('🔄 Attendee added, refetching data...');
      await Promise.all([refetchCalendars(), refetchEvents()]);
      console.log('✅ Data refetched successfully');
    } catch (error) {
      console.error('❌ Error inviting attendee:', error);
      toast.error(error.response?.data?.message || 'Failed to invite attendee');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAttendee = async (attendee) => {
    const eventId = event?._id || event?.id;
    if (!eventId) {
      toast.error('Event ID is missing');
      return;
    }

    setLoading(true);
    try {
      await EventApi.removeAttendee(eventId, attendee.id);

      setAttendees(attendees.filter(a => a.id !== attendee.id));
      toast.success('Attendee removed');

      // Refetch data after removing attendee
      console.log('🔄 Attendee removed, refetching data...');
      await refetchCalendars();
      await refetchEvents();
    } catch (error) {
      console.error('Error removing attendee:', error);
      toast.error(error.response?.data?.message || 'Failed to remove attendee');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEventLink = () => {
    const eventId = event?._id || event?.id;
    // Используем текущий origin (localhost:5173 или production URL)
    const link = `${window.location.origin}/calendar?event=${eventId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Event link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'declined': return 'text-red-600 bg-red-50';
      case 'tentative': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Share "{event?.title}"
          </DialogTitle>
          <DialogDescription>
            Invite people to this event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invite people */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add participants</Label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
              </div>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Invite
              </Button>
            </div>

            {/* List of attendees */}
            <div className="space-y-2 mt-4">
              <Label className="text-xs text-gray-500">
                Attendees ({attendees.length + (event?.creator ? 1 : 0)})
              </Label>

              {/* Event Creator */}
              {event?.creator && (
                <div className="flex items-center justify-between p-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-medium">
                      {event.creator?.email?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{event.creator?.email || 'Creator'}</p>
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                      <span className="text-xs text-gray-500">
                        Creator • Organizer
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Other attendees */}
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                      {attendee.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{attendee.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Select
                          value={attendee.role}
                          onValueChange={async (newRole) => {
                            const eventId = event?._id || event?.id;
                            setLoading(true);
                            try {
                              // Use proper updateAttendeeRole method
                              await EventApi.updateAttendeeRole(eventId, attendee.id, newRole);

                              setAttendees(attendees.map(a =>
                                a.id === attendee.id ? { ...a, role: newRole } : a
                              ));

                              toast.success('Role updated');
                              await refetchEvents();
                            } catch (error) {
                              console.error('Error updating role:', error);
                              toast.error('Failed to update role');
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading || attendee.role === 'organizer'}
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
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(attendee.status)}`}>
                          {attendee.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {attendee.role !== 'organizer' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleRemoveAttendee(attendee)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}

              {attendees.length === 0 && !event?.creator && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No attendees yet. Invite people to collaborate!
                </p>
              )}
            </div>
          </div>

          {/* Copy event link */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Label className="text-sm font-medium">Event link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/calendar?event=${event?._id || event?.id || 'xxx'}`}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={handleCopyEventLink}
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
              Share this link with anyone to let them view event details
            </p>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
