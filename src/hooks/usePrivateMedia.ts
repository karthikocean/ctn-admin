import { useState, useEffect } from "react";
import { getPrivateMediaUrl } from "@/services/mediaService";

/**
 * Hook to resolve a private S3 relative path to a pre-signed URL.
 * Leverages in-memory caching and request deduplication.
 *
 * @param filePath  Relative path stored in DB (e.g. "/trainings/media-xxx.mp4")
 * @param expiresIn Expiration time in seconds (default: 3600)
 *
 * @returns { url, loading, error }
 */
export function usePrivateMedia(
  filePath: string | null | undefined,
  expiresIn = 3600
) {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath || typeof filePath !== "string" || filePath.trim() === "") {
      setUrl("");
      setLoading(false);
      setError(null);
      return;
    }

    const cleanPath = filePath.trim();

    // If it's already an absolute or blob/data URL, resolve synchronously
    if (
      cleanPath.startsWith("http://") ||
      cleanPath.startsWith("https://") ||
      cleanPath.startsWith("blob:") ||
      cleanPath.startsWith("data:")
    ) {
      setUrl(cleanPath);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getPrivateMediaUrl(cleanPath, expiresIn)
      .then((signedUrl) => {
        if (isMounted) {
          setUrl(signedUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || "Failed to load media");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filePath, expiresIn]);

  return { url, loading, error };
}

export default usePrivateMedia;
