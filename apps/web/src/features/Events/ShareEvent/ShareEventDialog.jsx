import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/ui/dialog';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Copy, Mail, UserPlus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export function ShareEventDialog({ open, onOpenChange, event }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [copied, setCopied] = useState(false);
  const [attendees, setAttendees] = useState([
    { id: 1, email: 'alice@example.com', role: 'organizer', status: 'accepted', avatar: 'A' },
    { id: 2, email: 'bob@example.com', role: 'participant', status: 'pending', avatar: 'B' },
  ]);

  const handleInvite = () => {
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    // TODO: Implement EventApi.invite()
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
  };

  const handleRemoveAttendee = (id) => {
    // TODO: Implement EventApi.removeAttendee()
    setAttendees(attendees.filter(a => a.id !== id));
    toast.success('Attendee removed');
  };

  const handleCopyEventLink = () => {
    const link = `https://chronos.app/event/${event?.id}`;
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
      case 'organizer': return 'Organizer';
      case 'participant': return 'Participant';
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
                  <SelectItem value="participant">Participant</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite}>
                <Mail className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>

            {/* List of attendees */}
            {attendees.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-xs text-gray-500">
                  Attendees ({attendees.length})
                </Label>
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-medium">
                        {attendee.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{attendee.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {getRoleBadge(attendee.role)}
                          </span>
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
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveAttendee(attendee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Copy event link */}
          <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Label className="text-sm font-medium">Event link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`https://chronos.app/event/${event?.id || 'xxx'}`}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => toast.success('Invitations sent!')}>
            Send Invitations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
