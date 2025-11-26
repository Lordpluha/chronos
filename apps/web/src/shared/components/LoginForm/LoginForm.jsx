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
  } = useForm({
    resolver: zodResolver(loginSchema),
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
