import api from "@/services/api";
import { getPrivateMediaUrl, openPrivateDocument, preloadPrivateMedia } from "@/services/mediaService";

export { getPrivateMediaUrl, openPrivateDocument, preloadPrivateMedia };

/**
 * Upload one or more files to S3 via the admin API.
 * Returns an array of { fileName, url, size, mimetype } objects.
 * `url` is a relative path (e.g. /general/media-xxx.jpg) — store this in the DB.
 */
export const uploadFiles = async (files: File[], folder: string = "general") => {
  if (files.length === 0) return { success: true, data: [] };

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await api.post(`/media/upload?folder=${folder}`, formData, {
    headers: { "Content-Type": undefined },
  });
  return response.data;
};

/**
 * Resolve a stored relative path to a full public or pre-signed S3 URL.
 */
export const getPublicMediaUrl = async (filePath: string | null | undefined): Promise<string> => {
  return getPrivateMediaUrl(filePath);
};

export default {
  uploadFiles,
  getPrivateMediaUrl,
  getPublicMediaUrl,
  openPrivateDocument,
  preloadPrivateMedia,
};
