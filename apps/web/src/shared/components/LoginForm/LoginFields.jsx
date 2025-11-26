import React from "react";
import { Link } from "react-router";
import { Field, FieldLabel, FieldError } from "@shared/ui/field";
import { Input } from "@shared/ui/input";
import { ROUTES } from "@shared/routes";

export function LoginFields({ register, errors, isLoading, showPassword, setShowPassword }) {
  return (
    <>
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
          <Link
            to={ROUTES.forgotPassword}
            className="ml-auto text-sm underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
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
    </>
  );
}
