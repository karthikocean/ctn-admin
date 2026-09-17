import { describe, it, expect, vi } from "vitest";
import { getEventQrPayload, generateQrDataUrl } from "../lib/qrPdfGenerator";

describe("Event Attendance QR Code Generator", () => {
  it("should generate the exact JSON payload expected by attendance API", () => {
    const eventId = "67dbe123fd4d43d42b2cd30e";
    const payload = getEventQrPayload(eventId);

    expect(payload).toBe('{"eventId":"67dbe123fd4d43d42b2cd30e"}');

    const parsed = JSON.parse(payload);
    expect(parsed).toEqual({
      eventId: "67dbe123fd4d43d42b2cd30e",
    });
  });

  it("should generate a valid base64 data URL for the QR code", async () => {
    const eventId = "67dbe123fd4d43d42b2cd30e";
    const dataUrl = await generateQrDataUrl(eventId);

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl.length).toBeGreaterThan(100);
  });
});
