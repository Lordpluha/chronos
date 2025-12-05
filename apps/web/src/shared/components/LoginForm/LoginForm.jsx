import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Field, FieldGroup, FieldError } from "@shared/ui/field";
import { ROUTES } from "@shared/routes";
import { useNavigate } from "react-router";
import { useAuth } from "@shared/context/AuthContext";
import { LoginFormHeader } from "./LoginFormHeader";
import { LoginFields } from "./LoginFields";
import { TwoFactorField } from "./TwoFactorField";
import { SocialLogin } from "../common/SocialLogin";

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
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // Validate on blur (when user leaves the field)
    reValidateMode: "onChange", // Re-validate on change after first submit
  });

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      await loginUser(data);

      toast.success("Login successful!");
      navigate(ROUTES.calendar);
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.status === 422 && error.response?.data?.requires2FA) {
        setRequires2FA(true);
        toast.error("Please enter your 2FA code");
      } else if (error.response?.status === 401) {
        // Unauthorized - invalid credentials
        setError("login", {
          type: "manual",
          message: "Invalid email/username or password",
        });
        setError("password", {
          type: "manual",
          message: "Invalid email/username or password",
        });
        toast.error("Invalid email/username or password");
      } else if (error.response?.status === 400) {
        // Validation errors from backend
        const errorData = error.response?.data;

        // Check if we have field-specific errors
        if (errorData?.errors && typeof errorData.errors === 'object') {
          // Set errors for each field
          Object.keys(errorData.errors).forEach((field) => {
            const fieldErrors = errorData.errors[field];
            const errorMessage = Array.isArray(fieldErrors)
              ? fieldErrors.join(', ')
              : fieldErrors;

            setError(field, {
              type: "manual",
              message: errorMessage,
            });
          });

          // Show first error in toast
          const firstError = Object.values(errorData.errors)[0];
          const firstErrorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          toast.error(firstErrorMessage);
        } else {
          // General validation error
          const message = errorData?.message || "Invalid input. Please check your credentials.";
          setError("root", {
            type: "manual",
            message: message,
          });
          toast.error(message);
        }
      } else if (error.response?.status === 404) {
        // User not found
        setError("login", {
          type: "manual",
          message: "User not found with this email or username",
        });
        toast.error("User not found");
      } else if (error.response?.data?.message) {
        // Any other error with a message
        setError("root", {
          type: "manual",
          message: error.response.data.message,
        });
        toast.error(error.response.data.message);
      } else {
        // Generic error
        setError("root", {
          type: "manual",
          message: "Login failed. Please check your connection and try again.",
        });
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <FieldGroup>
        <LoginFormHeader />
        <LoginFields
          register={register}
          errors={errors}
          isLoading={isLoading}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
        {requires2FA && (
          <TwoFactorField
            register={register}
            error={errors.token?.message}
            isLoading={isLoading}
          />
        )}
        {errors.root && (
          <FieldError className="text-center">{errors.root.message}</FieldError>
        )}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </Field>
        <SocialLogin isLoading={isLoading} mode="login" />
      </FieldGroup>
    </form>
  );
}
