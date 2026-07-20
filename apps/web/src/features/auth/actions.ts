"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import type { AuthActionState } from "@/features/auth/auth-state";
import { getClientEnvironment } from "@/lib/env/client";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),
});

const signupSchema = loginSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
});

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(128, "Password is too long"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (input) => input.password === input.confirmPassword,
    {
      path: ["confirmPassword"],
      message: "Passwords do not match",
    },
  );

function getFirstValidationError(
  error: z.ZodError,
): string {
  return (
    error.issues[0]?.message ??
    "Please check the submitted details"
  );
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedInput = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: getFirstValidationError(parsedInput.error),
    };
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.signInWithPassword({
      email: parsedInput.data.email,
      password: parsedInput.data.password,
    });

  if (error) {
    return {
      status: "error",
      message: "Invalid email or password",
    };
  }

  redirect("/dashboard");
}

export async function signupAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedInput = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: getFirstValidationError(parsedInput.error),
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsedInput.data.email,
    password: parsedInput.data.password,
    options: {
      data: {
        name: parsedInput.data.name,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message:
        "Unable to create your account. Please try again.",
    };
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Account created. Please check your email to confirm your account.",
    };
  }

  redirect("/dashboard");
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedInput = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: getFirstValidationError(parsedInput.error),
    };
  }

  const supabase = await createClient();
  const environment = getClientEnvironment();

  const { error } =
    await supabase.auth.resetPasswordForEmail(
      parsedInput.data.email,
      {
        redirectTo:
          `${environment.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    );

  if (error) {
    console.error(
      "Password-reset request failed:",
      error.message,
    );
  }

  // Intentionally generic to prevent email-address enumeration.
  return {
    status: "success",
    message:
      "If an account exists for that email, a password-reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsedInput = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: getFirstValidationError(parsedInput.error),
    };
  }

  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: "error",
      message:
        "This password-reset session has expired. Request a new link.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsedInput.data.password,
  });

  if (error) {
    console.error(
      "Password update failed:",
      error.message,
    );

    return {
      status: "error",
      message:
        "Unable to update your password. Request a new reset link.",
    };
  }

  await supabase.auth.signOut();

  redirect("/login?passwordReset=success");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}