import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AuthApi } from '@features/Auth'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { Label } from '@shared/ui/label'
import { Alert, AlertDescription } from '@shared/ui/alert'
import { ROUTES } from '@shared/routes'
import Logo from '@shared/components/common/Logo'
import { Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function Verify2FA() {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token || token.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      await AuthApi.verifyOAuth2FA(token)
      toast.success('Login successful!')
      // Use window.location to ensure full page reload with cookies
      window.location.href = ROUTES.calendar
    } catch (err) {
      console.error('2FA verification error:', err)
      setError(err.response?.data?.message || 'Invalid 2FA code')
      toast.error('Invalid 2FA code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Shield className="size-8 text-primary" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to complete login
                </p>
              </div>

              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="token">Authentication Code</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    className="text-center text-2xl tracking-widest"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    You can also use a backup code
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading || token.length !== 6}>
                  {loading && <Loader2 className="animate-spin" />}
                  Verify & Continue
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate(ROUTES.login)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/best-view.png"
          alt="2FA Verification"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
