import api from "../services/api";

export interface ActivityGapReminderPayload {
  activityType: "notPosted" | "notAsked" | "notGiven" | "notRequirements";
  title: string;
  message: string;
  regionId?: string;
  categoryId?: string;
}

export const sendActivityGapReminder = async (payload: ActivityGapReminderPayload) => {
  const response = await api.post("/push-notification/remind-activity-gap", payload);
  return response.data;
};
