import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Field, FieldGroup, FieldLabel, FieldError } from "@shared/ui/field";
import { Input } from "@shared/ui/input";
import { ROUTES } from "@shared/routes";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
});

export function ForgotPasswordForm({ className, ...props }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const email = watch("email");

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error sending code');
      }

      setSuccess(true);
      toast.success("Reset code sent to your email!");

      setTimeout(() => {
        navigate(ROUTES.resetPassword, { state: { email: data.email } });
      }, 2000);
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error.message || "Failed to send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">✅ Email sent!</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Check your email <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            We sent you a password reset code. Redirecting...
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
          <h1 className="text-2xl font-bold">Forgot your password?</h1>
          <p className="text-balance text-sm text-muted-foreground">
            Enter your email and we'll send you a password reset code
          </p>
        </div>

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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Code"}
          </Button>
        </Field>

        <div className="text-center text-sm">
          Remember your password?{" "}
          <Link to={ROUTES.login} className="underline underline-offset-4">
            Back to login
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
