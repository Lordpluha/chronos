import { useState } from 'react'
import { AuthApi } from '../../api/AuthApi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Label } from '@shared/ui/label'
import { Alert, AlertDescription } from '@shared/ui/alert'
import { Loader2, ShieldOff } from 'lucide-react'
import { useAuth } from '@shared/context/AuthContext'

export function TwoFactorDisableDialog({ open, onOpenChange, onSuccess }) {
  const { user } = useAuth()
  const isOAuthUser = !user?.password_hash && !!user?.google_id

  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDisable = async () => {
    if (!isOAuthUser && !password) {
      setError('Password is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      await AuthApi.disable2FA(isOAuthUser ? undefined : password)
      onSuccess?.()
      handleClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldOff className="size-5 text-orange-500" />
            Disable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {isOAuthUser
              ? 'Are you sure you want to disable 2FA? This will make your account less secure.'
              : 'Enter your password to disable 2FA. This will make your account less secure.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertDescription>
              <strong>Warning:</strong> Disabling 2FA will remove an extra layer of
              security from your account.
            </AlertDescription>
          </Alert>

          {!isOAuthUser && (
            <div className="space-y-2">
              <Label htmlFor="password">Current Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDisable()}
                disabled={loading}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={loading || (!isOAuthUser && !password)}
          >
            {loading && <Loader2 className="animate-spin" />}
            Disable 2FA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
