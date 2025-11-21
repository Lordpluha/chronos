import { Button } from '@shared/ui/button'
import { useNavigate } from 'react-router'
import { ROUTES } from '@shared/routes'
import { AnimatedBackground } from './AnimatedBackground'

export const Landing = () => {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-linear-to-br from-landing-bg-from to-landing-bg-to">
      <AnimatedBackground />

      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
            <img src="/chronos.svg" alt="" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate(ROUTES.registration)}
            variant="register"
          >
            Register
          </Button>
          <Button
            onClick={() => navigate(ROUTES.login)}
            variant="login"
          >
            Login
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-md w-full mx-4">
          <div className="p-12 text-center">
            <h1 className="text-5xl font-bold mb-2">
              Join to
            </h1>
            <h2 className="text-5xl font-bold mb-6">
              Chronos
            </h2>

            <div className="mb-8">
              <p className="text-gray-600 mb-1">Better than</p>
              <p className="text-gray-500">Google Calendar</p>
            </div>

            <Button
              onClick={() => navigate(ROUTES.registration)}
              variant="primary"
              size="lg"
              className="px-8 py-6 text-lg"
            >
              Lets Go
              <img src="/arrow-up.svg" alt="" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
