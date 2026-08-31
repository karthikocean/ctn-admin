import React from "react";
import { usePrivateMedia } from "@/hooks/usePrivateMedia";
import { Film } from "lucide-react";

interface PrivateVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /** Relative path stored in DB (e.g. /trainings/media-xxx.mp4) */
  src: string | null | undefined;
  /** Expiry in seconds for the pre-signed URL (default 7200 = 2 hours) */
  expiresIn?: number;
  /** Fallback element shown when src is empty */
  fallback?: React.ReactNode;
  /** CSS classes for the skeleton/loading placeholder */
  skeletonClassName?: string;
}

/**
 * Drop-in replacement for <video> that resolves private S3 paths to pre-signed URLs.
 * Automatically refreshes before expiry.
 *
 * @example
 *   <PrivateVideo src={lesson.videoUrl} className="w-full h-full" controls />
 */
export const PrivateVideo: React.FC<PrivateVideoProps> = ({
  src,
  expiresIn = 7200,
  fallback,
  skeletonClassName,
  className,
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
          `${className || ""} bg-slate-100 animate-pulse rounded flex items-center justify-center`
        }
      >
        <Film size={32} className="text-slate-300" />
      </div>
    );
  }

  if (!url) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <div className={`${className || ""} bg-slate-50 flex items-center justify-center rounded`}>
        <Film size={32} className="text-slate-200" />
      </div>
    );
  }

  return <video src={url} className={className} {...props} />;
};

export default PrivateVideo;
