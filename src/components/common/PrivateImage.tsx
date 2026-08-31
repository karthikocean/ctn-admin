import React from "react";
import { usePrivateMedia } from "@/hooks/usePrivateMedia";

interface PrivateImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Relative path stored in DB (e.g. /posts/media-xxx.jpg) */
  src: string | null | undefined;
  /** Expiry in seconds for the pre-signed URL (default 3600) */
  expiresIn?: number;
  /** Fallback element or placeholder shown while loading */
  fallback?: React.ReactNode;
  /** CSS classes for the skeleton/loading placeholder */
  skeletonClassName?: string;
}

/**
 * Drop-in replacement for <img> that resolves private S3 paths to pre-signed URLs.
 * Automatically refreshes before expiry.
 *
 * @example
 *   <PrivateImage src={member.profilePic} alt="Profile" className="w-10 h-10 rounded-full" />
 */
export const PrivateImage: React.FC<PrivateImageProps> = ({
  src,
  expiresIn = 3600,
  fallback,
  skeletonClassName,
  className,
  alt,
  ...props
}) => {
  const { url, loading } = usePrivateMedia(src, expiresIn);

  if (loading) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div
        className={
          skeletonClassName ||
          `${className || ""} bg-slate-100 animate-pulse rounded`
        }
      />
    );
  }

  if (!url) {
    return fallback ? <>{fallback}</> : null;
  }

  return <img src={url} alt={alt || ""} className={className} {...props} />;
};

export default PrivateImage;
