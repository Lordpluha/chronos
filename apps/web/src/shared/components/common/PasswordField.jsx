import React from "react";
import { Field, FieldLabel, FieldError } from "@shared/ui/field";
import { Input } from "@shared/ui/input";

export function PasswordField({
  id,
  label,
  register,
  error,
  disabled,
  ...props
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          disabled={disabled}
          {...register}
          {...props}
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
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
