import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePrivateMedia } from "@/hooks/usePrivateMedia";

interface PrivateAvatarProps {
  src: string | null | undefined;
  fallbackName?: string;
  className?: string;
  avatarImageClassName?: string;
  avatarFallbackClassName?: string;
  alt?: string;
}

export const PrivateAvatar: React.FC<PrivateAvatarProps> = ({
  src,
  fallbackName = "",
  className,
  avatarImageClassName,
  avatarFallbackClassName,
  alt,
}) => {
  const { url } = usePrivateMedia(src);

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={className}>
      {url && <AvatarImage src={url} alt={alt || fallbackName} className={avatarImageClassName} />}
      <AvatarFallback className={avatarFallbackClassName}>
        {getInitials(fallbackName)}
      </AvatarFallback>
    </Avatar>
  );
};

export default PrivateAvatar;
