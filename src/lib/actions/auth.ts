"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/form-types";

/**
 * Signs in a user with email and password.
 */
export async function loginAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || email.length === 0) {
    return { errors: { email: "Enter your email address." } };
  }
  if (typeof password !== "string" || password.length === 0) {
    return { errors: { password: "Enter your password." } };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { formError: error.message };
    }
  } catch (err) {
    console.error("Login error:", err);
    return {
      formError:
        err instanceof Error ? err.message : "Authentication service error.",
    };
  }

  redirect("/");
}

/**
 * Creates a new user account with email and password.
 */
export async function signUpAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || email.length === 0) {
    return { errors: { email: "Enter your email address." } };
  }
  if (typeof password !== "string" || password.length === 0) {
    return { errors: { password: "Enter your password." } };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { formError: error.message };
    }
  } catch (err) {
    console.error("Sign up error:", err);
    return {
      formError:
        err instanceof Error ? err.message : "Authentication service error.",
    };
  }

  // Supabase might require email confirmation depending on project settings.
  // For simplicity in Phase 1, we redirect to home, but if confirmation is on,
  // the user might still be "unauthenticated" until they click the link.
  redirect("/");
}

/**
 * Clears the session and returns to the login screen.
 */
export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Logout error:", err);
  }
  redirect("/login");
}
