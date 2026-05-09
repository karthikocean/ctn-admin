import api from "@/services/api";

export const uploadFiles = async (files: File[], folder: string = "general") => {
  if (files.length === 0) return { success: true, data: [] };
  
  const formData = new FormData();
  files.forEach(file => formData.append("files", file));

  const response = await api.post(`/media/upload?folder=${folder}`, formData, {
    headers: {
      "Content-Type": undefined,
    },
  });
  return response.data;
};
