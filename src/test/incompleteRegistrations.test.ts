import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getIncompleteRegistrations,
  getIncompleteRegistrationById,
  deleteIncompleteRegistration,
  IncompleteRegistrationItem,
} from "../api/IncompleteRegistrationsApi";

// Mock the api service
vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../services/api";

const mockRecord: IncompleteRegistrationItem = {
  _id: "64f1a2b3c4d5e6f7a8b9c0d1",
  fullName: "John Doe",
  mobileNumber: "9876543210",
  email: "john@example.com",
  step: "basic_info",
  deviceInfo: "iPhone 14 / iOS 17",
  fcmToken: "mock-fcm-token",
  isDeleted: false,
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z",
};

const mockPaginatedResponse = {
  success: true,
  data: [mockRecord],
  pagination: {
    total: 1,
    totalPages: 1,
    page: 0,
    limit: 10,
  },
};

describe("IncompleteRegistrationsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getIncompleteRegistrations", () => {
    it("should fetch paginated list with default params", async () => {
      (api.get as any).mockResolvedValueOnce({ data: mockPaginatedResponse });

      const result = await getIncompleteRegistrations({ page: 0, limit: 10 });

      expect(api.get).toHaveBeenCalledWith("/incomplete-registrations", {
        params: { page: 0, limit: 10 },
      });
      expect(result).toEqual(mockPaginatedResponse);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].fullName).toBe("John Doe");
    });

    it("should pass search param when provided", async () => {
      (api.get as any).mockResolvedValueOnce({ data: mockPaginatedResponse });

      await getIncompleteRegistrations({ page: 0, limit: 10, search: "John" });

      expect(api.get).toHaveBeenCalledWith("/incomplete-registrations", {
        params: { page: 0, limit: 10, search: "John" },
      });
    });

    it("should pass step filter param when provided", async () => {
      (api.get as any).mockResolvedValueOnce({ data: mockPaginatedResponse });

      await getIncompleteRegistrations({
        page: 0,
        limit: 10,
        step: "basic_info",
      });

      expect(api.get).toHaveBeenCalledWith("/incomplete-registrations", {
        params: { page: 0, limit: 10, step: "basic_info" },
      });
    });

    it("should pass both search and step filter together", async () => {
      (api.get as any).mockResolvedValueOnce({ data: mockPaginatedResponse });

      await getIncompleteRegistrations({
        page: 1,
        limit: 10,
        search: "Jane",
        step: "verify_otp",
      });

      expect(api.get).toHaveBeenCalledWith("/incomplete-registrations", {
        params: { page: 1, limit: 10, search: "Jane", step: "verify_otp" },
      });
    });

    it("should return paginated data with correct structure", async () => {
      (api.get as any).mockResolvedValueOnce({ data: mockPaginatedResponse });

      const result = await getIncompleteRegistrations({ page: 0 });

      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it("should throw on API error", async () => {
      const error = new Error("Network Error");
      (api.get as any).mockRejectedValueOnce(error);

      await expect(
        getIncompleteRegistrations({ page: 0 })
      ).rejects.toThrow("Network Error");
    });
  });

  describe("getIncompleteRegistrationById", () => {
    it("should fetch a single record by ID", async () => {
      const singleResponse = { success: true, data: mockRecord };
      (api.get as any).mockResolvedValueOnce({ data: singleResponse });

      const result = await getIncompleteRegistrationById(
        "64f1a2b3c4d5e6f7a8b9c0d1"
      );

      expect(api.get).toHaveBeenCalledWith(
        "/incomplete-registrations/64f1a2b3c4d5e6f7a8b9c0d1"
      );
      expect(result).toEqual(singleResponse);
      expect(result.data.fullName).toBe("John Doe");
    });

    it("should include deviceInfo in the response", async () => {
      const singleResponse = { success: true, data: mockRecord };
      (api.get as any).mockResolvedValueOnce({ data: singleResponse });

      const result = await getIncompleteRegistrationById(
        "64f1a2b3c4d5e6f7a8b9c0d1"
      );

      expect(result.data.deviceInfo).toBe("iPhone 14 / iOS 17");
    });

    it("should throw on not-found error", async () => {
      const error = { response: { status: 404, data: { message: "Incomplete registration not found" } } };
      (api.get as any).mockRejectedValueOnce(error);

      await expect(
        getIncompleteRegistrationById("nonexistent-id")
      ).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  describe("deleteIncompleteRegistration", () => {
    it("should soft-delete a record by ID", async () => {
      const deleteResponse = {
        success: true,
        message: "Incomplete registration deleted successfully",
      };
      (api.delete as any).mockResolvedValueOnce({ data: deleteResponse });

      const result = await deleteIncompleteRegistration(
        "64f1a2b3c4d5e6f7a8b9c0d1"
      );

      expect(api.delete).toHaveBeenCalledWith(
        "/incomplete-registrations/64f1a2b3c4d5e6f7a8b9c0d1"
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "Incomplete registration deleted successfully"
      );
    });

    it("should throw on not-found error during delete", async () => {
      const error = {
        response: {
          status: 404,
          data: { message: "Incomplete registration not found" },
        },
      };
      (api.delete as any).mockRejectedValueOnce(error);

      await expect(
        deleteIncompleteRegistration("nonexistent-id")
      ).rejects.toMatchObject({ response: { status: 404 } });
    });

    it("should throw on invalid ID format error", async () => {
      const error = {
        response: {
          status: 400,
          data: { message: "Invalid incomplete registration ID" },
        },
      };
      (api.delete as any).mockRejectedValueOnce(error);

      await expect(
        deleteIncompleteRegistration("not-an-object-id")
      ).rejects.toMatchObject({ response: { status: 400 } });
    });
  });

  describe("IncompleteRegistrationItem type", () => {
    it("should have all required fields", () => {
      const item: IncompleteRegistrationItem = mockRecord;
      expect(item._id).toBeDefined();
      expect(item.fullName).toBeDefined();
      expect(item.mobileNumber).toBeDefined();
      expect(item.isDeleted).toBe(false);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it("should allow optional fields to be undefined", () => {
      const minimalItem: IncompleteRegistrationItem = {
        _id: "64f1a2b3c4d5e6f7a8b9c0d1",
        fullName: "Jane",
        mobileNumber: "1234567890",
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      expect(minimalItem.email).toBeUndefined();
      expect(minimalItem.step).toBeUndefined();
      expect(minimalItem.deviceInfo).toBeUndefined();
      expect(minimalItem.fcmToken).toBeUndefined();
    });
  });
});
