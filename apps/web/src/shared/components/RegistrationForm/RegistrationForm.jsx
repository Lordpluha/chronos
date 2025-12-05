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
import { RegistrationFormHeader } from "./RegistrationFormHeader";
import { RegistrationFields } from "./RegistrationFields";
import { SocialLogin } from "../common/SocialLogin";

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
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function RegistrationForm({ className, ...props }) {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();

  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(registrationSchema),
    mode: "onBlur", // Validate on blur (when user leaves the field)
    reValidateMode: "onChange", // Re-validate on change after first submit
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
        // User already exists - conflict
        const errorData = error.response?.data;
        const message = errorData?.message || "User with this email or username already exists";

        // Try to identify which field caused the conflict
        if (message.toLowerCase().includes('email')) {
          setError("email", {
            type: "manual",
            message: "This email is already registered",
          });
          toast.error("This email is already registered");
        } else if (message.toLowerCase().includes('login') || message.toLowerCase().includes('username')) {
          setError("login", {
            type: "manual",
            message: "This username is already taken",
          });
          toast.error("This username is already taken");
        } else {
          setError("root", {
            type: "manual",
            message: message,
          });
          toast.error(message);
        }
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
          const message = errorData?.message || "Invalid input. Please check all fields.";
          setError("root", {
            type: "manual",
            message: message,
          });
          toast.error(message);
        }
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
          message: "Registration failed. Please check your connection and try again.",
        });
        toast.error("Registration failed. Please try again.");
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
        <RegistrationFormHeader />
        <RegistrationFields
          register={register}
          errors={errors}
          isLoading={isLoading}
        />
        {errors.root && (
          <FieldError className="text-center">{errors.root.message}</FieldError>
        )}
        <Field>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign up"}
          </Button>
        </Field>
        <SocialLogin isLoading={isLoading} mode="registration" />
      </FieldGroup>
    </form>
  );
}
