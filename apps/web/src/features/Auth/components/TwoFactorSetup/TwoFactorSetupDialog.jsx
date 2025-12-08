import { useState, useEffect } from 'react'
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
import { Loader2, ShieldCheck } from 'lucide-react'
import { useAuth } from '@shared/context/AuthContext'

export function TwoFactorSetupDialog({ open, onOpenChange, onSuccess }) {
  const { user } = useAuth()
  const isOAuthUser = !user?.password_hash && !!user?.google_id

  const [step, setStep] = useState(isOAuthUser ? 'qrcode' : 'password') // password, qrcode, verify
  const [password, setPassword] = useState('')
  const [qrData, setQrData] = useState(null)
  const [verifyToken, setVerifyToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Auto-setup for OAuth users
  useEffect(() => {
    const setupForOAuth = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await AuthApi.setup2FA()
        setQrData(data)
        setStep('qrcode')
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to setup 2FA')
      } finally {
        setLoading(false)
      }
    }

    if (open && isOAuthUser && !initialized) {
      setInitialized(true)
      setupForOAuth()
    } else if (!open) {
      setInitialized(false)
    }
  }, [open, isOAuthUser, initialized])

  const handleSetup = async () => {
    if (!isOAuthUser && !password) {
      setError('Password is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await AuthApi.setup2FA(isOAuthUser ? undefined : password)
      setQrData(data)
      setStep('qrcode')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to setup 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleEnable = async () => {
    if (!verifyToken || verifyToken.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await AuthApi.enable2FA(verifyToken, isOAuthUser ? undefined : password)
      onSuccess?.(data.backupCodes)
      handleClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable 2FA')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(isOAuthUser ? 'qrcode' : 'password')
    setPassword('')
    setQrData(null)
    setVerifyToken('')
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" />
            Enable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {step === 'password' && 'Enter your password to continue'}
            {step === 'qrcode' && (isOAuthUser ? 'Scan the QR code with your authenticator app' : 'Scan the QR code with your authenticator app')}
            {step === 'verify' && 'Enter the code from your authenticator app'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Current Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
                disabled={loading}
              />
            </div>
          )}

          {step === 'qrcode' && qrData && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={qrData.qrCode}
                  alt="QR Code"
                  className="size-64 rounded-lg border"
                />
              </div>
              <div className="space-y-2">
                <Label>Manual Entry Key</Label>
                <div className="rounded-md bg-muted p-3 font-mono text-sm break-all">
                  {qrData.manualEntryKey}
                </div>
                <p className="text-xs text-muted-foreground">
                  Save this key in a safe place. You can use it to set up 2FA manually
                  if you can't scan the QR code.
                </p>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-2">
              <Label htmlFor="token">Verification Code</Label>
              <Input
                id="token"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleEnable()}
                disabled={loading}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {step === 'password' && !isOAuthUser && (
            <Button onClick={handleSetup} disabled={loading || !password}>
              {loading && <Loader2 className="animate-spin" />}
              Continue
            </Button>
          )}
          {step === 'qrcode' && (
            <Button onClick={() => setStep('verify')} disabled={loading}>
              I've Scanned the Code
            </Button>
          )}
          {step === 'verify' && (
            <Button
              onClick={handleEnable}
              disabled={loading || verifyToken.length !== 6}
            >
              {loading && <Loader2 className="animate-spin" />}
              Enable 2FA
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
