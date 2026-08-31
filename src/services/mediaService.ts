import api from "@/services/api";

interface CachedMedia {
  url: string;
  expiresAt: number;
}

// In-memory cache for pre-signed URLs to avoid duplicate API calls
const mediaCache = new Map<string, CachedMedia>();

// Map to deduplicate concurrent in-flight requests for the same media path
const inFlightRequests = new Map<string, Promise<string>>();

/**
 * Fetch a temporary pre-signed S3 URL for a private file.
 * Automatically caches the signed URL and reuses it until 60 seconds before expiration.
 *
 * @param filePath  Relative path stored in DB (e.g. "/trainings/media-xxx.mp4")
 * @param expiresIn Expiration time in seconds (default: 3600 = 1 hour)
 * @returns Pre-signed S3 URL string, or empty string if input is empty
 */
export async function getPrivateMediaUrl(
  filePath: string | null | undefined,
  expiresIn = 3600
): Promise<string> {
  if (!filePath || typeof filePath !== "string" || filePath.trim() === "") {
    return "";
  }

  const cleanPath = filePath.trim();

  // If it's already an absolute or blob/data URL (e.g. local upload preview), return as-is
  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://") ||
    cleanPath.startsWith("blob:") ||
    cleanPath.startsWith("data:")
  ) {
    return cleanPath;
  }

  // Check cache (refresh if less than 60 seconds of validity remains)
  const now = Date.now();
  const cached = mediaCache.get(cleanPath);
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.url;
  }

  // Deduplicate concurrent requests for the same file
  if (inFlightRequests.has(cleanPath)) {
    return inFlightRequests.get(cleanPath)!;
  }

  const fetchPromise = (async () => {
    try {
      // First try standard admin media endpoint (/media/private-view)
      let response: any;
      try {
        response = await api.get("/media/private-view", {
          params: { file: cleanPath, expiresIn },
        });
      } catch (err: any) {
        // Fallback to /mobile-api/media/private-view if baseURL doesn't include /api/admin
        response = await api.get("/mobile-api/media/private-view", {
          params: { file: cleanPath, expiresIn },
        });
      }

      const signedUrl =
        response?.data?.data?.url ||
        response?.data?.url ||
        response?.data?.data?.file ||
        "";

      if (signedUrl) {
        const ttlSeconds = response?.data?.data?.expiresIn || expiresIn || 3600;
        mediaCache.set(cleanPath, {
          url: signedUrl,
          expiresAt: now + ttlSeconds * 1000,
        });
      }

      return signedUrl;
    } catch (error: any) {
      console.error(`Failed to get private media URL for [${cleanPath}]:`, error);
      return "";
    } finally {
      inFlightRequests.delete(cleanPath);
    }
  })();

  inFlightRequests.set(cleanPath, fetchPromise);
  return fetchPromise;
}

/**
 * Helper to open private documents (PDFs, docs) in a new browser tab.
 */
export async function openPrivateDocument(filePath: string | null | undefined): Promise<void> {
  if (!filePath) return;
  const url = await getPrivateMediaUrl(filePath);
  if (url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Preload multiple media URLs in parallel to reduce perceived latency.
 */
export async function preloadPrivateMedia(filePaths: (string | null | undefined)[]): Promise<void> {
  const validPaths = filePaths.filter((p): p is string => Boolean(p && typeof p === "string"));
  await Promise.allSettled(validPaths.map((p) => getPrivateMediaUrl(p)));
}

export default {
  getPrivateMediaUrl,
  openPrivateDocument,
  preloadPrivateMedia,
};
