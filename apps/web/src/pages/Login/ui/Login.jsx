import { LoginForm } from '@shared/components/LoginForm'
import Logo from '@shared/components/common/Logo'

export const Login = () => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/best-view.png"
          alt="Login"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  )
}
