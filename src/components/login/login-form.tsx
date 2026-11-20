"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { loginAction, signUpAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/form-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [state, formAction, pending] = useActionState(
    isSignUp ? signUpAction : loginAction,
    {} as FormState,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);

  const emailError = state.errors?.email;
  const passwordError = state.errors?.password;

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4" noValidate>
        {state.formError ? <Alert variant="error">{state.formError}</Alert> : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            autoFocus
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "email-error" : undefined}
          />
          {emailError ? (
            <p id="email-error" role="alert" className="text-xs text-destructive">
              {emailError}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={revealed ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignUp ? "Create a password" : "Enter your password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              aria-invalid={passwordError ? true : undefined}
              aria-describedby={passwordError ? "password-error" : undefined}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              title={revealed ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center rounded-r-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              {revealed ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {passwordError ? (
            <p id="password-error" role="alert" className="text-xs text-destructive">
              {passwordError}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              {isSignUp ? "Creating account…" : "Signing in…"}
            </>
          ) : (
            <>
              {isSignUp ? <UserPlus aria-hidden="true" /> : <LogIn aria-hidden="true" />}
              {isSignUp ? "Create account" : "Sign in"}
            </>
          )}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Create one"}
        </button>
      </div>
    </div>
  );
}
