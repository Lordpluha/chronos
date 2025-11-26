import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { cn } from "@shared/lib/utils";
import { Button } from "@shared/ui/button";
import { Field, FieldGroup } from "@shared/ui/field";
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
