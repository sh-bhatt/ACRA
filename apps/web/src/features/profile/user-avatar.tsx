type UserAvatarProps = {
  displayName: string;
  avatarUrl: string | null;
  size?: "small" | "medium" | "large";
};

const sizeClasses = {
  small: "size-9 text-sm rounded-xl",
  medium: "size-11 text-base rounded-xl",
  large: "size-24 text-3xl rounded-2xl",
} as const;

export function UserAvatar({
  displayName,
  avatarUrl,
  size = "medium",
}: UserAvatarProps) {
  const fallbackLetter =
    displayName.trim().charAt(0).toUpperCase() || "D";

  return (
    <div
      role="img"
      aria-label={`${displayName}'s profile picture`}
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-emerald-300 bg-cover bg-center font-semibold text-emerald-950 ${sizeClasses[size]}`}
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
  );
}