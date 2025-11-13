import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldError,
} from "@shared/ui/field";
import { Input } from "@shared/ui/input";
import { ROUTES } from "@shared/routes";
import { useNavigate } from "react-router";
import { useAuth } from "@shared/context/AuthContext";
import { authApi } from "@shared/api/auth";

const loginSchema = z.object({
  login: z
    .string()
    .min(1, "Login or email is required")
    .max(255, "Login or email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must be less than 128 characters"),
  token: z.string().optional(),
});

export function LoginForm({ className, ...props }) {
  const navigate = useNavigate();
  const { login: loginUser } = useAuth();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [requires2FA, setRequires2FA] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      await loginUser(data);

      toast.success("Login successful!");
      navigate("/calendar");
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.status === 422 && error.response?.data?.requires2FA) {
        setRequires2FA(true);
        toast.error("Please enter your 2FA code");
      } else if (error.response?.status === 401) {
        toast.error("Invalid login or password");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your credentials below to login to your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="login">Email or Username</FieldLabel>
          <Input
            id="login"
            type="text"
            placeholder="m@example.com or username"
            disabled={isLoading}
            {...register("login")}
          />
          {errors.login && <FieldError>{errors.login.message}</FieldError>}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              disabled={isLoading}
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <img src="/eye-icon-close.svg" alt="" />
              ) : (
                <img src="/eye-icon.svg" alt="" />
              )}
            </button>
          </div>
          {errors.password && (
            <FieldError>{errors.password.message}</FieldError>
          )}
        </Field>
        {requires2FA && (
          <Field>
            <FieldLabel htmlFor="token">2FA Code</FieldLabel>
            <Input
              id="token"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={isLoading}
              {...register("token")}
            />
            {errors.token && <FieldError>{errors.token.message}</FieldError>}
          </Field>
        )}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </Field>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button
            variant="outline"
            type="button"
            disabled={isLoading}
            onClick={handleGoogleLogin}
          >
            <img className="size-6" src="/google.svg" alt="" />
            Login with Google
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a
              href={ROUTES.registration}
              onClick={(e) => {
                e.preventDefault();
                navigate(ROUTES.registration);
              }}
              className="underline underline-offset-4"
            >
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
