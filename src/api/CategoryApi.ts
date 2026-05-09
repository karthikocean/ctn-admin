import api from "@/services/api";

export const getCategories = async (type?: string, parentCategory?: string) => {
  const response = await api.get("/categories", {
    params: {
      type,
      parentCategory,
      limit: 1000 // Get all categories without pagination for dropdowns
    }
  });
  return response.data;
};
