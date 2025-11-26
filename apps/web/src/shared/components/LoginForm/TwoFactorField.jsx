import { Field, FieldLabel, FieldError } from "@shared/ui/field";
import { Input } from "@shared/ui/input";

export function TwoFactorField({ register, error, isLoading }) {
  return (
    <Field>
      <FieldLabel htmlFor="token">2FA Code</FieldLabel>
      <Input
        id="token"
        type="text"
        placeholder="Enter 6-digit code"
        maxLength={6}
        disabled={isLoading}
        {...register("token")}
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
