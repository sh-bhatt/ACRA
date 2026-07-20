"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  REVIEW_FOCUS_VALUES,
} from "@/features/profile/profile-options";
import type {
  ProfileActionState,
} from "@/features/profile/profile-state";
import { createClient } from "@/lib/supabase/server";

const profileInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),

  defaultReviewFocus: z
    .array(z.enum(REVIEW_FOCUS_VALUES))
    .min(1, "Select at least one review focus")
    .max(6),
});

function getFirstValidationError(error: z.ZodError): string {
  return (
    error.issues[0]?.message ??
    "Please check the submitted information"
  );
}

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsedInput = profileInputSchema.safeParse({
    name: formData.get("name"),
    defaultReviewFocus: formData
      .getAll("defaultReviewFocus")
      .filter(
        (value): value is string =>
          typeof value === "string",
      ),
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

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return {
      status: "error",
      message: "Your session has expired. Please sign in again.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsedInput.data.name,
      default_review_focus:
        parsedInput.data.defaultReviewFocus,
    })
    .eq("user_id", userId);

  if (error) {
    console.error("Profile update failed:", error.message);

    return {
      status: "error",
      message: "Unable to update your profile right now.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings/profile");

  return {
    status: "success",
    message: "Profile updated successfully.",
  };
}