import React from "react";
import { Field, FieldLabel, FieldError } from "@shared/ui/field";
import { Input } from "@shared/ui/input";
import { PasswordField } from "../common/PasswordField";

export function RegistrationFields({ register, errors, isLoading }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  return (
    <>
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
    </>
  );
}
