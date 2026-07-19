"use server";
import type { AuthActionState } from "@/features/auth/auth-state";
import { redirect } from "next/navigation";
import { z } from "zod";

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



function getFirstValidationError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the submitted details";
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

  const { error } = await supabase.auth.signInWithPassword({
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
      message: "Unable to create your account. Please try again.",
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

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}