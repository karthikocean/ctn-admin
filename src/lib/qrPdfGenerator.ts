import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import logoHorizontal from "@/assets/logo-horizontal.png";

export interface AnnouncementQrData {
  _id?: string;
  announcementId?: string;
  title: string;
  date?: string | Date;
  fromDate?: string | Date;
  toDate?: string | Date;
  time?: string;
  fromTime?: string;
  toTime?: string;
  location?: string;
  amount?: number;
}

// Brand theme colors (matching Trusted Network design system)
const PRIMARY_COLOR: [number, number, number] = [2, 59, 116]; // #023b74 (HSL: 210 97% 23%)
const PRIMARY_HEX = "#023b74";
const ACCENT_GOLD: [number, number, number] = [209, 131, 40]; // #d18328 (sidebar accent)
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_600: [number, number, number] = [71, 85, 105];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_400: [number, number, number] = [148, 163, 184];

/**
 * Returns the exact JSON string encoded in the QR code:
 * { "eventId": "<id>" }
 */
export const getEventQrPayload = (eventId: string): string => {
  return JSON.stringify({ eventId: String(eventId) });
};

/**
 * Generate base64 Data URL for the event QR code using the primary brand color.
 */
export const generateQrDataUrl = async (eventId: string): Promise<string> => {
  const payload = getEventQrPayload(eventId);
  return await QRCode.toDataURL(payload, {
    width: 700,
    margin: 2,
    color: {
      dark: PRIMARY_HEX,
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
};

/**
 * Convert local image asset into Data URL for jsPDF embedding
 */
const getImgDataUrl = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !src) {
      resolve("");
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
          return;
        }
      } catch (err) {
        console.warn("Canvas conversion failed for logo:", err);
      }
      resolve(src);
    };
    img.onerror = () => resolve("");
    img.src = src;
  });
};

const formatDateRange = (item: AnnouncementQrData): string => {
  if (item.fromDate) {
    const from = new Date(item.fromDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    if (item.toDate) {
      const to = new Date(item.toDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      return `${from} - ${to}`;
    }
    return from;
  }
  if (item.date) {
    return new Date(item.date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return "N/A";
};

const formatTimeRange = (item: AnnouncementQrData): string => {
  if (item.fromTime) {
    return item.toTime ? `${item.fromTime} - ${item.toTime}` : item.fromTime;
  }
  return item.time || "N/A";
};

/**
 * Generates and downloads a redesigned, branded A4 PDF flyer for Trusted Network Event attendance.
 */
export const generateAttendanceQrPdf = async (item: AnnouncementQrData): Promise<void> => {
  const eventId = (item._id || item.announcementId || "").toString();
  if (!eventId) {
    throw new Error("Missing event ID for QR code generation");
  }

  const qrDataUrl = await generateQrDataUrl(eventId);
  let logoDataUrl = "";
  try {
    logoDataUrl = await getImgDataUrl(logoHorizontal);
  } catch (err) {
    console.warn("Could not load logo for PDF flyer:", err);
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // 1. Top Decorative Brand Accent Bars
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 4, "F");

  doc.setFillColor(...ACCENT_GOLD);
  doc.rect(0, 4, pageWidth, 1.2, "F");

  // 2. Company Logo & Trusted Network Header
  let headerY = 12;
  const logoWidth = 46;
  const logoHeight = 15.4; // maintains ~3:1 aspect ratio of logo-horizontal.png
  const logoX = (pageWidth - logoWidth) / 2;

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", logoX, headerY, logoWidth, logoHeight);
      headerY += logoHeight + 4;
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text("Trusted Network", pageWidth / 2, headerY + 8, { align: "center" });
      headerY += 14;
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("Trusted Network", pageWidth / 2, headerY + 8, { align: "center" });
    headerY += 14;
  }

  // Project Subtitle Pill Badge
  doc.setFillColor(240, 246, 252); // soft primary light tint
  doc.setDrawColor(191, 214, 245); // light primary border
  doc.setLineWidth(0.4);
  const badgeWidth = 92;
  const badgeHeight = 6.5;
  const badgeX = (pageWidth - badgeWidth) / 2;
  doc.roundedRect(badgeX, headerY, badgeWidth, badgeHeight, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("EVENT ATTENDANCE CHECK-IN", pageWidth / 2, headerY + 4.6, { align: "center" });

  // Header Divider
  headerY += badgeHeight + 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, headerY, pageWidth - margin, headerY);

  // 3. Event Title Box
  let currentY = headerY + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...SLATE_900);

  const titleLines = doc.splitTextToSize(item.title || "Event Attendance", contentWidth);
  doc.text(titleLines, pageWidth / 2, currentY, { align: "center" });
  currentY += titleLines.length * 7.5 + 4;

  // 4. Event Details Card (Properly spaced with clear columns)
  const dateStr = formatDateRange(item);
  const timeStr = formatTimeRange(item);
  const locationStr = item.location || "Venue details in mobile app";

  const detailsCardY = currentY;
  const detailsCardHeight = 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, detailsCardY, contentWidth, detailsCardHeight, 3, 3, "FD");

  // Date Column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_500);
  doc.text("DATE", margin + 8, detailsCardY + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_900);
  doc.text(dateStr, margin + 8, detailsCardY + 15);

  // Time Column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_500);
  doc.text("TIME", margin + 65, detailsCardY + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_900);
  doc.text(timeStr, margin + 65, detailsCardY + 15);

  // Location Column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...SLATE_500);
  doc.text("LOCATION", margin + 115, detailsCardY + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_900);
  const locLines = doc.splitTextToSize(locationStr, contentWidth - 118);
  doc.text(locLines[0] || "Venue in app", margin + 115, detailsCardY + 15);

  currentY = detailsCardY + detailsCardHeight + 10;

  // 5. Redesigned QR Code Frame (Spacious, elegant scan target)
  const qrCardSize = 118;
  const qrCardX = (pageWidth - qrCardSize) / 2;
  const qrCardY = currentY;

  // Outer clean white card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(qrCardX, qrCardY, qrCardSize, qrCardSize, 4, 4, "FD");

  // Decorative Camera Viewfinder Corner Markers in Primary Brand Color
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(1.2);
  const markerLen = 7;
  const pad = 4;
  // Top-Left
  doc.line(qrCardX + pad, qrCardY + pad, qrCardX + pad + markerLen, qrCardY + pad);
  doc.line(qrCardX + pad, qrCardY + pad, qrCardX + pad, qrCardY + pad + markerLen);
  // Top-Right
  doc.line(qrCardX + qrCardSize - pad, qrCardY + pad, qrCardX + qrCardSize - pad - markerLen, qrCardY + pad);
  doc.line(qrCardX + qrCardSize - pad, qrCardY + pad, qrCardX + qrCardSize - pad, qrCardY + pad + markerLen);
  // Bottom-Left
  doc.line(qrCardX + pad, qrCardY + qrCardSize - pad, qrCardX + pad + markerLen, qrCardY + qrCardSize - pad);
  doc.line(qrCardX + pad, qrCardY + qrCardSize - pad, qrCardX + pad, qrCardY + qrCardSize - pad - markerLen);
  // Bottom-Right
  doc.line(qrCardX + qrCardSize - pad, qrCardY + qrCardSize - pad, qrCardX + qrCardSize - pad - markerLen, qrCardY + qrCardSize - pad);
  doc.line(qrCardX + qrCardSize - pad, qrCardY + qrCardSize - pad, qrCardX + qrCardSize - pad, qrCardY + qrCardSize - pad - markerLen);

  // Centered High-Resolution QR Code Image
  const qrPadding = 8;
  const qrImageSize = qrCardSize - qrPadding * 2;
  doc.addImage(qrDataUrl, "PNG", qrCardX + qrPadding, qrCardY + qrPadding, qrImageSize, qrImageSize);

  currentY = qrCardY + qrCardSize + 12;

  // 6. Action Call & Steps (Clean spacing, NO payload box)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("SCAN TO MARK ATTENDANCE", pageWidth / 2, currentY, { align: "center" });

  currentY += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE_600);
  doc.text("Open the Trusted Network Mobile App to scan and register your check-in", pageWidth / 2, currentY, { align: "center" });

  currentY += 8;

  // Step-by-step guidance pill
  const stepsBoxWidth = 150;
  const stepsBoxHeight = 11;
  const stepsBoxX = (pageWidth - stepsBoxWidth) / 2;

  doc.setFillColor(240, 246, 252);
  doc.setDrawColor(208, 225, 247);
  doc.setLineWidth(0.4);
  doc.roundedRect(stepsBoxX, currentY, stepsBoxWidth, stepsBoxHeight, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("1. Open App", stepsBoxX + 15, currentY + 7);
  doc.setTextColor(...SLATE_400);
  doc.text(">", stepsBoxX + 45, currentY + 7);

  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("2. Tap Scan QR", stepsBoxX + 60, currentY + 7);
  doc.setTextColor(...SLATE_400);
  doc.text(">", stepsBoxX + 98, currentY + 7);

  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("3. Check-In Confirmed", stepsBoxX + 110, currentY + 7);

  // 7. Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_400);
  doc.text("Trusted Network - Event Attendance Management", margin, pageHeight - 10);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageWidth - margin, pageHeight - 10, { align: "right" });

  // Sanitize filename
  const sanitizedTitle = (item.title || "Event")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);

  doc.save(`${sanitizedTitle}_Attendance_QR.pdf`);
};
