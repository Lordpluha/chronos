import React from "react";
import { Button } from "@shared/ui/button";
import { Field, FieldSeparator, FieldDescription } from "@shared/ui/field";
import { useNavigate } from "react-router";
import { ROUTES } from "@shared/routes";
import { authApi } from "@shared/api/auth";

export function SocialLogin({ isLoading, mode = "login" }) {
  const navigate = useNavigate();

  const isLoginMode = mode === "login";

  return (
    <>
      <FieldSeparator>Or continue with</FieldSeparator>
      <Field>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          asChild
        >
          <a href={`${import.meta.env.VITE_API_URL}/auth/google`}>
            <img className="size-6" src="/google.svg" alt="" />
            {isLoginMode ? "Login" : "Sign up"} with Google
          </a>
        </Button>
        <FieldDescription className="text-center">
          {isLoginMode
            ? "Don't have an account? "
            : "Already have an account? "}
          <a
            href={isLoginMode ? ROUTES.registration : ROUTES.login}
            onClick={(e) => {
              e.preventDefault();
              navigate(isLoginMode ? ROUTES.registration : ROUTES.login);
            }}
            className="underline underline-offset-4"
          >
            {isLoginMode ? "Sign up" : "Login"}
          </a>
        </FieldDescription>
      </Field>
    </>
  );
}
