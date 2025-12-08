import React from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Button } from '@shared/ui/button'
import { Field, FieldGroup, FieldError, FieldLabel } from '@shared/ui/field'
import { Input } from '@shared/ui/input'
import { AuthApi } from '@features/Auth/api/AuthApi'
import { ROUTES } from '@shared/routes'
import { useAuth } from '@shared/context/AuthContext'

const twoFactorSchema = z.object({
  login: z.string().min(1, 'Login is required'),
  password: z.string().min(1, 'Password is required'),
  token: z.string().length(6, '2FA code must be 6 digits'),
})

export function Login2FA() {
  const navigate = useNavigate()
  const location = useLocation()
  const { checkAuth } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  // Get login and password from sessionStorage or location state
  const loginFromSession = sessionStorage.getItem('2fa_login') || ''
  const passwordFromSession = sessionStorage.getItem('2fa_password') || ''
  const { login: loginFromState = '', password: passwordFromState = '' } = location.state || {}

  const login = loginFromSession || loginFromState
  const password = passwordFromSession || passwordFromState

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      login,
      password,
      token: '',
    },
  })

  React.useEffect(() => {
    // Redirect to login if no credentials provided
    if (!login || !password) {
      toast.error('Please login first')
      navigate(ROUTES.login)
    }
  }, [login, password, navigate])

  const onSubmit = async (data) => {
    setIsLoading(true)

    try {
      await AuthApi.loginWith2FA(data.login, data.password, data.token)

      // Clear stored credentials
      sessionStorage.removeItem('2fa_login')
      sessionStorage.removeItem('2fa_password')

      toast.success('Login successful!')

      // Use window.location instead of navigate to ensure full page reload with cookies
      window.location.href = ROUTES.calendar
    } catch (error) {
      console.error('2FA verification error:', error);

      if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Invalid 2FA code'
        setError('token', {
          type: 'manual',
          message: message,
        })
        toast.error(message)
      } else if (error.response?.data?.message) {
        setError('root', {
          type: 'manual',
          message: error.response.data.message,
        })
        toast.error(error.response.data.message)
      } else {
        toast.error('Verification failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
          <p className="mt-2 text-muted-foreground">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel>2FA Code</FieldLabel>
              <Input
                {...register('token')}
                type="text"
                placeholder="000000"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                disabled={isLoading}
                className="text-center text-2xl tracking-widest"
              />
              {errors.token && <FieldError>{errors.token.message}</FieldError>}
            </Field>

            {errors.root && (
              <FieldError className="text-center">{errors.root.message}</FieldError>
            )}

            <Field>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </Field>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate(ROUTES.login)}
                disabled={isLoading}
              >
                Back to Login
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
