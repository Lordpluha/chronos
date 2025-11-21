import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Field, FieldGroup, FieldLabel, FieldError } from "@shared/ui/field";
import { Input } from "@shared/ui/input";
import { ROUTES } from "@shared/routes";

const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .length(6, "Code must be exactly 6 characters")
      .regex(/^[A-Z0-9]{6}$/, "Code must contain only uppercase letters and digits"),
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

export function ResetPasswordForm({ className, ...props }) {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = location.state?.email || "";

  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:3001/api/auth/password-reset/${data.code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error resetting password');
      }

      setSuccess(true);
      toast.success("Password successfully changed!");

      setTimeout(() => {
        navigate(ROUTES.login);
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">✅ Password changed!</h1>
          <p className="text-balance text-sm text-muted-foreground">
            You can now login with your new password
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Enter the code from email and your new password
          </p>
          {emailFromState && (
            <p className="text-xs italic text-muted-foreground">
              Email sent to: {emailFromState}
            </p>
          )}
        </div>

        <Field>
          <FieldLabel htmlFor="code">Code from email</FieldLabel>
          <Input
            id="code"
            type="text"
            placeholder="Enter 6-character code"
            maxLength={6}
            disabled={isLoading}
            {...register("code")}
          />
          {errors.code && <FieldError>{errors.code.message}</FieldError>}
          <p className="text-xs text-muted-foreground">Code valid for 15 minutes</p>
        </Field>

        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 characters"
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
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
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
          {errors.confirmPassword && <FieldError>{errors.confirmPassword.message}</FieldError>}
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Resetting password..." : "Reset Password"}
          </Button>
        </Field>

        <div className="text-center text-sm">
          <Link to={ROUTES.forgotPassword} className="underline underline-offset-4">
            Send code again
          </Link>
          {" | "}
          <Link to={ROUTES.login} className="underline underline-offset-4">
            Back to login
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
