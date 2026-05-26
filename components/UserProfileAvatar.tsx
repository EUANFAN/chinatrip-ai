"use client";

import { UserRound } from "lucide-react";
import { useState } from "react";

interface UserProfileAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  size: number;
  className: string;
  fallbackClassName: string;
}

function getInitial(name?: string | null, email?: string | null) {
  const value = name?.trim() || email?.trim();

  return value ? value.slice(0, 1).toUpperCase() : null;
}

export function UserProfileAvatar({
  avatarUrl,
  name,
  email,
  size,
  className,
  fallbackClassName,
}: UserProfileAvatarProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const initial = getInitial(name, email);

  if (avatarUrl && failedAvatarUrl !== avatarUrl) {
    return (
      // Google OAuth avatars are small third-party assets; native img avoids
      // Next Image optimizer failures from blocking the account UI.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? email ?? "User"}
        width={size}
        height={size}
        className={className}
        onError={() => setFailedAvatarUrl(avatarUrl)}
      />
    );
  }

  return (
    <span className={fallbackClassName} aria-label={name ?? email ?? "User"}>
      {initial ? (
        initial
      ) : (
        <UserRound className="h-[55%] w-[55%] stroke-[2.25]" aria-hidden="true" />
      )}
    </span>
  );
}
