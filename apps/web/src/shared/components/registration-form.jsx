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

const registrationSchema = z
  .object({
    login: z
      .string()
      .min(3, "Login must be at least 3 characters")
      .max(50, "Login must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Login can only contain letters, numbers, underscore and dash"
      ),
    full_name: z
      .string()
      .min(1, "Full name is required")
      .max(100, "Full name must be less than 100 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .max(255, "Email must be less than 255 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function RegistrationForm({ className, ...props }) {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const { confirmPassword, ...registrationData } = data;

      await registerUser(registrationData);

      toast.success("Registration successful! Please log in.");
      navigate(ROUTES.login);
    } catch (error) {
      console.error("Registration error:", error);

      if (error.response?.status === 409) {
        toast.error("User with this email or login already exists");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Registration failed. Please try again.");
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
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your information below to create your account
          </p>
        </div>
        <Field>
          <FieldLabel htmlFor="login">Username</FieldLabel>
          <Input
            id="login"
            type="text"
            placeholder="john_doe"
            disabled={isLoading}
            {...register("login")}
          />
          {errors.login && <FieldError>{errors.login.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="full_name">Full Name</FieldLabel>
          <Input
            id="full_name"
            type="text"
            placeholder="John Doe"
            disabled={isLoading}
            {...register("full_name")}
          />
          {errors.full_name && <FieldError>{errors.full_name.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            disabled={isLoading}
            {...register("email")}
          />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
        <Field>
          <FieldLabel htmlFor="confirm-password">Repeat password</FieldLabel>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              disabled={isLoading}
              {...register("confirmPassword")}
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer"
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? (
                <img src="/eye-icon-close.svg" alt="" />
              ) : (
                <img src="/eye-icon.svg" alt="" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <FieldError>{errors.confirmPassword.message}</FieldError>
          )}
        </Field>
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign up"}
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
            Sign up with Google
          </Button>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <a
              href={ROUTES.login}
              onClick={(e) => {
                e.preventDefault();
                navigate(ROUTES.login);
              }}
              className="underline underline-offset-4"
            >
              Login
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
