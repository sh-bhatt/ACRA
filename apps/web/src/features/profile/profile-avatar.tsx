"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "profile-avatars";
const MAXIMUM_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type ProfileAvatarProps = {
  userId: string;
  displayName: string;
  initialAvatarUrl: string | null;
};

function getExtension(
  mimeType: string,
): "jpg" | "png" | "webp" | null {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    default:
      return null;
  }
}

function getAvatarStoragePath(
  avatarUrl: string | null,
): string | null {
  if (!avatarUrl) {
    return null;
  }

  const marker =
    `/storage/v1/object/public/${AVATAR_BUCKET}/`;

  const markerIndex = avatarUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(
    avatarUrl.slice(markerIndex + marker.length),
  );
}

export function ProfileAvatar({
  userId,
  displayName,
  initialAvatarUrl,
}: ProfileAvatarProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] =
    useState(initialAvatarUrl);

  const [isUploading, setIsUploading] =
    useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fallbackLetter =
    displayName.trim().charAt(0).toUpperCase() || "D";

  async function handleAvatarSelection(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage(null);

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setMessage({
        type: "error",
        text: "Choose a JPG, PNG or WebP image.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > MAXIMUM_AVATAR_SIZE_BYTES) {
      setMessage({
        type: "error",
        text: "Profile picture must be smaller than 2 MB.",
      });

      event.target.value = "";
      return;
    }

    const extension = getExtension(file.type);

    if (!extension) {
      setMessage({
        type: "error",
        text: "Unsupported image format.",
      });

      event.target.value = "";
      return;
    }

    setIsUploading(true);

    const supabase = createClient();

    try {
      const objectPath =
        `${userId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(objectPath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(objectPath);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("user_id", userId);

      if (profileError) {
        await supabase.storage
          .from(AVATAR_BUCKET)
          .remove([objectPath]);

        throw profileError;
      }

      const previousObjectPath =
        getAvatarStoragePath(avatarUrl);

      setAvatarUrl(publicUrl);

      if (
        previousObjectPath &&
        previousObjectPath !== objectPath
      ) {
        const { error: deleteError } =
          await supabase.storage
            .from(AVATAR_BUCKET)
            .remove([previousObjectPath]);

        if (deleteError) {
          console.error(
            "Unable to remove previous avatar:",
            deleteError,
          );
        }
      }

      setMessage({
        type: "success",
        text: "Profile picture updated.",
      });

      router.refresh();
    } catch (error) {
      console.error("Avatar upload failed:", error);

      setMessage({
        type: "error",
        text: "Unable to upload your profile picture.",
      });
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-sm font-medium text-neutral-200">
        Profile picture
      </p>

      <div className="mt-5 flex items-center gap-5">
        <div
          aria-label={`${displayName}'s profile picture`}
          className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-emerald-300 bg-cover bg-center text-3xl font-semibold text-emerald-950"
          style={
            avatarUrl
              ? {
                  backgroundImage: `url("${avatarUrl}")`,
                }
              : undefined
          }
        >
          {!avatarUrl ? fallbackLetter : null}
        </div>

        <div>
          <input
            ref={fileInputRef}
            id="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
            onChange={handleAvatarSelection}
            className="sr-only"
          />

          <label
            htmlFor="avatar"
            aria-disabled={isUploading}
            className={`inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-sm font-medium transition ${
              isUploading
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer text-neutral-200 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            {isUploading
              ? "Uploading..."
              : avatarUrl
                ? "Change picture"
                : "Upload picture"}
          </label>

          <p className="mt-2 text-xs leading-5 text-neutral-500">
            JPG, PNG or WebP. Maximum 2 MB.
          </p>
        </div>
      </div>

      {message ? (
        <p
          role="status"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/20 bg-red-400/10 text-red-200"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}