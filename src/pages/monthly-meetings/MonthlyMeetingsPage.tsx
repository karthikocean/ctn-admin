import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Loader2,
  Image as ImageIcon,
  Video,
  X,
  CheckCircle2,
  Pencil,
  Trash2,
  Search,
  MapPin,
  Clock,
  Users,
  Eye,
  Check,
  ChevronsUpDown,
  Plus,
  QrCode,
  Download
} from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementDetails,
  getAnnouncementBookings
} from "@/api/AnnouncementsApi";
import { getRegions } from "@/api/RegionApi";
import { getFranchises } from "@/api/FranchiseApi";
import { uploadFiles } from "@/api/MediaApi";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { PrivateImage } from "@/components/common/PrivateImage";
import { PrivateVideo } from "@/components/common/PrivateVideo";
import { PrivateAvatar } from "@/components/common/PrivateAvatar";
import { generateAttendanceQrPdf, generateQrDataUrl } from "@/lib/qrPdfGenerator";

const MediaPreview = ({
  file,
  url,
  type,
  onRemove
}: {
  file?: File | null;
  url?: string;
  type: "image" | "video";
  onRemove: () => void;
}) => {
  const [localPreview, setLocalPreview] = useState<string>("");

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setLocalPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setLocalPreview("");
    }
  }, [file]);

  const displayUrl = file ? localPreview : url || "";
  if (!displayUrl) return null;

  return (
    <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center shadow-inner max-w-[300px]">
      {type === "image" ? (
        file ? (
          <img src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <PrivateImage src={displayUrl} alt="Preview" className="w-full h-full object-cover" />
        )
      ) : file ? (
        <video src={displayUrl} controls className="w-full h-full object-cover" />
      ) : (
        <PrivateVideo src={displayUrl} controls className="w-full h-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-full transition-all shadow-md active:scale-95"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
};

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getHour24 = (hourStr: string, period: string) => {
  let h = parseInt(hourStr, 10);
  if (isNaN(h)) return 0;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h;
};

const MonthlyMeetingsPage = () => {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();

  const isFranchise = useMemo(() => {
    const code = (user?.roleCode || "").toUpperCase();
    const name = ((user as any)?.roleName || "").toUpperCase();
    return code.includes("FRANCHI") || name.includes("FRANCHI");
  }, [user]);

  const canCreate =
    hasPermission("monthly_meetings", "create") ||
    hasPermission("monthlymeeting", "create") ||
    hasPermission("announcements", "create");
  const canEdit =
    hasPermission("monthly_meetings", "edit") ||
    hasPermission("monthlymeeting", "edit") ||
    hasPermission("announcements", "edit");
  const canDelete =
    hasPermission("monthly_meetings", "delete") ||
    hasPermission("monthlymeeting", "delete") ||
    hasPermission("announcements", "delete");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [regionsList, setRegionsList] = useState<any[]>([]);
  const [franchiseRegions, setFranchiseRegions] = useState<string[]>([]);

  // Load regions and franchise details
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await getRegions({ limit: 1000 });
        if (res && res.data) {
          setRegionsList(res.data.filter((r: any) => r.status === "active"));
        }
      } catch (error) {
        console.error("Error fetching regions:", error);
      }
    };

    const fetchFranchiseDetails = async () => {
      if (isFranchise) {
        try {
          const res = await getFranchises({ limit: 1000 });
          if (res && res.data && res.data.length > 0) {
            const assignedIds = new Set<string>();
            res.data.forEach((f: any) => {
              if (f.businessRegionId) assignedIds.add(String(f.businessRegionId));
              if (f.businessRegion?._id) assignedIds.add(String(f.businessRegion._id));
              if (f.businessRegion?.areas && Array.isArray(f.businessRegion.areas)) {
                f.businessRegion.areas.forEach((a: any) => {
                  const aid = a._id || a;
                  if (aid) assignedIds.add(String(aid));
                });
              }
            });
            setFranchiseRegions(Array.from(assignedIds));
          }
        } catch (error) {
          console.error("Error fetching franchise details:", error);
        }
      }
    };

    fetchRegions();
    fetchFranchiseDetails();
  }, [isFranchise]);

  // Flatten active areas, filtering strictly to Franchise Owner's region if logged in as Franchise
  const allAreas = useMemo(() => {
    const flattened = regionsList.flatMap((r) => {
      if (r.areas && r.areas.length > 0) {
        return r.areas.map((area: any) => ({
          _id: String(typeof area === "string" ? area : area._id),
          regionId: String(r._id),
          name: typeof area === "string" ? area : area.name,
          city: r.city,
          state: r.state,
          country: r.country
        }));
      }
      return [
        {
          _id: String(r._id),
          regionId: String(r._id),
          name: `${r.city}, ${r.state} (${r.country})`,
          city: r.city,
          state: r.state,
          country: r.country
        }
      ];
    });

    if (isFranchise && franchiseRegions.length > 0) {
      return flattened.filter(
        (area) =>
          franchiseRegions.includes(area._id) ||
          franchiseRegions.includes(area.regionId)
      );
    }
    return flattened;
  }, [regionsList, isFranchise, franchiseRegions]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const isEditingExpired = useMemo(() => {
    if (!editingId) return false;
    const ann = meetings.find((a) => a._id === editingId);
    if (!ann) return false;
    const now = new Date();
    if (ann.toDate) {
      return new Date(ann.toDate) < now;
    }
    if (ann.date) {
      return new Date(ann.date) < now;
    }
    return false;
  }, [editingId, meetings]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMeetingsCount, setTotalMeetingsCount] = useState(0);
  const isMounted = useRef(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewQrUrl, setPreviewQrUrl] = useState<string>("");
  const [downloadingQrId, setDownloadingQrId] = useState<string | null>(null);

  const handleDownloadQr = async (item: any) => {
    const id = item._id || item.announcementId;
    if (!id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Meeting ID is missing for QR download."
      });
      return;
    }
    try {
      setDownloadingQrId(id);
      toast({
        title: "Generating QR Code PDF...",
        description: "Preparing meeting attendance check-in flyer."
      });
      await generateAttendanceQrPdf(item);
      toast({
        title: "Success",
        description: "Attendance QR Code PDF downloaded successfully."
      });
    } catch (error: any) {
      console.error("Error generating QR code PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to generate QR Code PDF."
      });
    } finally {
      setDownloadingQrId(null);
    }
  };

  const handlePreview = async (a: any) => {
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewQrUrl("");
    try {
      if (a._id) {
        generateQrDataUrl(a._id)
          .then((url) => setPreviewQrUrl(url))
          .catch((err) => console.error("Error generating preview QR:", err));
      }

      const bookingsResult = await getAnnouncementBookings(a._id);
      const data = bookingsResult.data || null;
      if (data && !data._id && a._id) {
        data._id = a._id;
      }
      setPreviewData(data);

      const targetId = data?.announcementId || data?._id || a._id;
      if (targetId) {
        generateQrDataUrl(targetId)
          .then((url) => setPreviewQrUrl(url))
          .catch((err) => console.error("Error generating preview QR:", err));
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings details",
        variant: "destructive"
      });
      setIsPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft",
    image: "",
    video: "",
    announcementType: "monthlymeeting",
    fromDate: "",
    toDate: "",
    fromHour: "10",
    fromMinute: "00",
    fromPeriod: "AM",
    toHour: "11",
    toMinute: "00",
    toPeriod: "AM",
    location: "",
    points: "" as any,
    membersLimit: "" as any,
    amount: "" as any,
    scheduleDate: "",
    scheduleHour: "10",
    scheduleMinute: "00",
    schedulePeriod: "AM",
    regionId: "",
    regionIds: [] as string[],
    isOfflineStallExist: false,
    stallConfig: {
      totalStallCount: 0,
      stalls: [] as any[]
    }
  });

  const existingStallsRef = useRef<any[]>([]);

  // Preselect region if franchise owner has assigned areas
  useEffect(() => {
    if (drawerOpen && !editingId && isFranchise && allAreas.length > 0 && formData.regionIds.length === 0) {
      setFormData((prev) => ({
        ...prev,
        regionIds: allAreas.map((a) => a._id)
      }));
    }
  }, [drawerOpen, editingId, isFranchise, allAreas]);

  const handleCountChange = (count: number) => {
    const safeCount = Math.max(0, count);
    setFormData((prev) => {
      const currentStalls = prev.stallConfig?.stalls || [];
      const newStalls: any[] = [];
      for (let i = 0; i < safeCount; i++) {
        if (currentStalls[i]) {
          newStalls.push(currentStalls[i]);
        } else if (existingStallsRef.current[i]) {
          newStalls.push({ ...existingStallsRef.current[i] });
        } else {
          newStalls.push({ name: `Stall ${i + 1}`, size: "", points: "" });
        }
      }
      return {
        ...prev,
        stallConfig: {
          totalStallCount: safeCount,
          stalls: newStalls
        }
      };
    });
  };

  const handleStallFieldChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const stalls = [...(prev.stallConfig?.stalls || [])];
      const updatedStall = {
        ...stalls[index],
        [field]: field === "points" ? (value === "" ? "" : Number(value)) : value
      };
      stalls[index] = updatedStall;

      if (existingStallsRef.current[index]) {
        existingStallsRef.current[index] = { ...existingStallsRef.current[index], ...updatedStall };
      } else {
        existingStallsRef.current[index] = { ...updatedStall };
      }

      return {
        ...prev,
        stallConfig: {
          ...prev.stallConfig,
          stalls
        }
      };
    });
  };

  const handleAddStall = () => {
    setFormData((prev) => {
      const currentStalls = prev.stallConfig?.stalls || [];
      const nextIndex = currentStalls.length + 1;
      const newStall = { name: `Stall ${nextIndex}`, size: "", points: "" };
      return {
        ...prev,
        stallConfig: {
          totalStallCount: currentStalls.length + 1,
          stalls: [...currentStalls, newStall]
        }
      };
    });
  };

  const handleDeleteStall = (indexToDelete: number) => {
    setFormData((prev) => {
      const currentStalls = prev.stallConfig?.stalls || [];
      const updatedStalls = currentStalls.filter((_, idx) => idx !== indexToDelete);
      return {
        ...prev,
        stallConfig: {
          totalStallCount: Math.max(0, updatedStalls.length),
          stalls: updatedStalls
        }
      };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`stall_${indexToDelete}_name`];
      delete next[`stall_${indexToDelete}_points`];
      return next;
    });
  };

  const [filesToUpload, setFilesToUpload] = useState({
    image: null as File | null,
    video: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchMonthlyMeetings = async () => {
    setIsLoading(true);
    try {
      const result = await getAnnouncements({
        page: page - 1,
        limit: 9,
        search: searchTerm,
        type: "monthlymeeting",
        announcementType: "monthlymeeting"
      });
      const rawData = result.data || [];
      const monthlyOnly = rawData.filter((a: any) => {
        const t = (a.announcementType || "").toLowerCase().replace(/[\s_]+/g, "");
        return t === "monthlymeeting";
      });

      let filtered = monthlyOnly;
      if (isFranchise && franchiseRegions.length > 0) {
        filtered = monthlyOnly.filter((m: any) => {
          const itemRegions = [
            ...(Array.isArray(m.regionIds) ? m.regionIds.map(String) : []),
            ...(m.regionId ? [String(m.regionId)] : [])
          ];
          if (itemRegions.length === 0) return true;
          return itemRegions.some((rid) => franchiseRegions.includes(rid));
        });
      }

      setMeetings(filtered);
      setTotalPages(result.totalPages || 1);
      setTotalMeetingsCount(result.total || result.totalItems || filtered.length);
    } catch (error) {
      console.error("Error fetching monthly meetings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyMeetings();
  }, [page, isFranchise, franchiseRegions]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchMonthlyMeetings();
      } else {
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.content.trim()) newErrors.content = "Content is required";
    if (!filesToUpload.image && !formData.image) newErrors.image = "Image is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";

    if (!formData.fromDate) {
      newErrors.fromDate = "From date is required";
    } else {
      const selectedFrom = new Date(formData.fromDate);
      selectedFrom.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedFrom < today) {
        newErrors.fromDate = "From date cannot be in the past";
      }
    }

    if (!formData.toDate) {
      newErrors.toDate = "To date is required";
    } else {
      const selectedTo = new Date(formData.toDate);
      selectedTo.setHours(0, 0, 0, 0);
      if (formData.fromDate) {
        const selectedFrom = new Date(formData.fromDate);
        selectedFrom.setHours(0, 0, 0, 0);
        if (selectedTo < selectedFrom) {
          newErrors.toDate = "To date cannot be before From date";
        }
      }
    }

    if (formData.fromDate && formData.toDate && formData.fromDate === formData.toDate) {
      const getMinutes = (hStr: string, mStr: string, period: string) => {
        let h = parseInt(hStr || "0", 10);
        const m = parseInt(mStr || "0", 10);
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        return h * 60 + m;
      };

      const fromMin = getMinutes(formData.fromHour, formData.fromMinute, formData.fromPeriod);
      const toMin = getMinutes(formData.toHour, formData.toMinute, formData.toPeriod);
      if (toMin <= fromMin) {
        newErrors.toTime = "To Time must be after From Time on the same day";
      }
    }

    if (formData.status === "scheduled") {
      if (!formData.scheduleDate) {
        newErrors.scheduleDate = "Schedule date is required";
      } else {
        const [year, month, day] = formData.scheduleDate.split("-").map(Number);
        let h = parseInt(formData.scheduleHour || "10", 10);
        const m = parseInt(formData.scheduleMinute || "00", 10);
        const period = formData.schedulePeriod || "AM";
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        const selectedSchedule = new Date(year, month - 1, day, h, m, 0, 0);
        const now = new Date();
        if (selectedSchedule < now) {
          newErrors.scheduleDate = "Schedule date cannot be in the past";
        }
      }
    }

    if (formData.points !== undefined && formData.points !== null && formData.points !== "" && formData.points < 0) {
      newErrors.points = "Points must be a positive value";
    }
    if (formData.membersLimit !== undefined && formData.membersLimit !== null && formData.membersLimit !== "" && formData.membersLimit < 0) {
      newErrors.membersLimit = "Members Limit must be a positive value";
    }
    if (formData.amount !== undefined && formData.amount !== null && formData.amount !== "") {
      if (isNaN(Number(formData.amount)) || Number(formData.amount) < 0) {
        newErrors.amount = "Amount must be a non-negative number";
      }
    }

    if (formData.isOfflineStallExist) {
      if (!formData.stallConfig?.totalStallCount || formData.stallConfig.totalStallCount <= 0) {
        newErrors.totalStallCount = "Total stall count must be greater than 0";
      }

      const namesSeen = new Set<string>();
      formData.stallConfig?.stalls?.forEach((stall, idx) => {
        const trimmedName = stall.name?.trim();
        if (!trimmedName) {
          newErrors[`stall_${idx}_name`] = "Stall name is required";
        } else {
          const lowerName = trimmedName.toLowerCase();
          if (namesSeen.has(lowerName)) {
            newErrors[`stall_${idx}_name`] = "Stall names must be unique";
          } else {
            namesSeen.add(lowerName);
          }
        }

        if (stall.points === undefined || stall.points === null || stall.points === "" || isNaN(Number(stall.points))) {
          newErrors[`stall_${idx}_points`] = "Points is required";
        } else if (Number(stall.points) < 0) {
          newErrors[`stall_${idx}_points`] = "Points cannot be negative";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      status: "draft",
      image: "",
      video: "",
      announcementType: "monthlymeeting",
      fromDate: "",
      toDate: "",
      fromHour: "10",
      fromMinute: "00",
      fromPeriod: "AM",
      toHour: "11",
      toMinute: "00",
      toPeriod: "AM",
      location: "",
      points: "" as any,
      membersLimit: "" as any,
      amount: "" as any,
      scheduleDate: "",
      scheduleHour: "10",
      scheduleMinute: "00",
      schedulePeriod: "AM",
      regionId: "",
      regionIds: isFranchise && allAreas.length > 0 ? allAreas.map((a) => a._id) : [],
      isOfflineStallExist: false,
      stallConfig: {
        totalStallCount: 0,
        stalls: []
      }
    });
    setEditingId(null);
    setFilesToUpload({ image: null, video: null });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please fix the form errors", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        _id,
        createdAt,
        updatedAt,
        __v,
        fromHour,
        fromMinute,
        fromPeriod,
        toHour,
        toMinute,
        toPeriod,
        scheduleHour,
        scheduleMinute,
        schedulePeriod,
        scheduleDate: _scheduleDate,
        ...dataToSave
      } = formData as any;

      const parseDateTime = (dateStr: string, hour: string, minute: string, period: string) => {
        if (!dateStr) return undefined;
        const [year, month, day] = dateStr.split("-").map(Number);
        let h = parseInt(hour, 10);
        const m = parseInt(minute, 10);
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        const d = new Date(year, month - 1, day, h, m, 0, 0);
        return d.toISOString();
      };

      const finalFromDate = parseDateTime(formData.fromDate, formData.fromHour, formData.fromMinute, formData.fromPeriod);
      const finalToDate = parseDateTime(formData.toDate, formData.toHour, formData.toMinute, formData.toPeriod);
      const finalFromTime = `${formData.fromHour}:${formData.fromMinute} ${formData.fromPeriod}`;
      const finalToTime = `${formData.toHour}:${formData.toMinute} ${formData.toPeriod}`;

      const payload: any = {
        ...dataToSave,
        announcementType: "monthlymeeting",
        points: formData.points === "" ? 0 : Number(formData.points),
        membersLimit: formData.membersLimit === "" ? 0 : Number(formData.membersLimit),
        amount: formData.amount === "" || formData.amount === undefined || formData.amount === null ? undefined : Number(formData.amount),
        location: formData.location || "",
        date: finalFromDate,
        time: finalFromTime,
        fromDate: finalFromDate,
        toDate: finalToDate,
        fromTime: finalFromTime,
        toTime: finalToTime,
        regionId: formData.regionIds && formData.regionIds.length > 0 ? formData.regionIds[0] : undefined,
        regionIds: formData.regionIds && formData.regionIds.length > 0 ? formData.regionIds : [],
        scheduleDate:
          formData.status === "scheduled" && formData.scheduleDate
            ? parseDateTime(formData.scheduleDate, formData.scheduleHour, formData.scheduleMinute, formData.schedulePeriod)
            : undefined,
        stallConfig: formData.isOfflineStallExist
          ? formData.stallConfig
          : { totalStallCount: 0, stalls: [] }
      };

      // Upload media files if any
      if (filesToUpload.image) {
        const res = await uploadFiles([filesToUpload.image], "announcements/images");
        if (res.success) payload.image = res.data[0].url;
      }

      if (filesToUpload.video) {
        const res = await uploadFiles([filesToUpload.video], "announcements/videos");
        if (res.success) payload.video = res.data[0].url;
      }

      let result;
      if (editingId) {
        result = await updateAnnouncement(editingId, payload);
      } else {
        result = await createAnnouncement(payload);
      }

      toast({
        title: "Success",
        description: result.message || "Monthly Meeting saved successfully",
        variant: "success"
      });
      setDrawerOpen(false);
      resetForm();
      fetchMonthlyMeetings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save monthly meeting",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await deleteAnnouncement(deletingId);
      toast({
        title: "Deleted",
        description: res.message || "Monthly meeting deleted successfully",
        variant: "success"
      });
      fetchMonthlyMeetings();
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete monthly meeting",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleEdit = async (a: any) => {
    setIsLoading(true);
    setErrors({});
    setFilesToUpload({ image: null, video: null });
    try {
      const result = await getAnnouncementDetails(a._id);
      if (result.success || result.status === 200) {
        const data = result.data;
        setEditingId(data._id);

        const parseTimeParts = (timeStr: string, isoDate?: string) => {
          const defaults = { hour: "10", minute: "00", period: "AM" };
          if (timeStr && timeStr.includes(" ") && timeStr.includes(":")) {
            const [time, period] = timeStr.trim().split(" ");
            const [hour, minute] = time.split(":");
            return {
              hour: hour.padStart(2, "0"),
              minute: minute.padStart(2, "0"),
              period: period ? period.toUpperCase() : "AM"
            };
          }
          if (isoDate) {
            const d = new Date(isoDate);
            if (!isNaN(d.getTime())) {
              let h = d.getHours();
              const m = String(d.getMinutes()).padStart(2, "0");
              const p = h >= 12 ? "PM" : "AM";
              if (h > 12) h -= 12;
              if (h === 0) h = 12;
              return { hour: String(h).padStart(2, "0"), minute: m, period: p };
            }
          }
          return defaults;
        };

        const fromParts = parseTimeParts(data.fromTime || data.time, data.fromDate || data.date);
        const toParts = parseTimeParts(data.toTime || data.time, data.toDate || data.date);
        const schedParts = parseTimeParts("", data.scheduleDate);

        const formatDate = (isoStr?: string) => {
          if (!isoStr) return "";
          const d = new Date(isoStr);
          if (isNaN(d.getTime())) return "";
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        };

        let initialRegionIds: string[] = [];
        if (data.regionIds && Array.isArray(data.regionIds)) {
          initialRegionIds = data.regionIds.map((r: any) => (typeof r === "object" ? r._id : r));
        } else if (data.regionId) {
          initialRegionIds = [typeof data.regionId === "object" ? data.regionId._id : data.regionId];
        }

        const stalls = data.stallConfig?.stalls || [];
        existingStallsRef.current = stalls.map((s: any) => ({ ...s }));

        setFormData({
          title: data.title || "",
          content: data.content || "",
          status: data.status || "draft",
          image: data.image || "",
          video: data.video || "",
          announcementType: "monthlymeeting",
          fromDate: formatDate(data.fromDate || data.date),
          toDate: formatDate(data.toDate || data.date),
          fromHour: fromParts.hour,
          fromMinute: fromParts.minute,
          fromPeriod: fromParts.period,
          toHour: toParts.hour,
          toMinute: toParts.minute,
          toPeriod: toParts.period,
          location: data.location || "",
          points: data.points !== undefined && data.points !== null ? data.points : "",
          membersLimit: data.membersLimit !== undefined && data.membersLimit !== null ? data.membersLimit : "",
          amount: data.amount !== undefined && data.amount !== null ? data.amount : "",
          scheduleDate: formatDate(data.scheduleDate),
          scheduleHour: schedParts.hour,
          scheduleMinute: schedParts.minute,
          schedulePeriod: schedParts.period,
          regionId: data.regionId || "",
          regionIds: initialRegionIds,
          isOfflineStallExist: !!data.isOfflineStallExist,
          stallConfig: {
            totalStallCount: data.stallConfig?.totalStallCount || stalls.length || 0,
            stalls: stalls
          }
        });
        setDrawerOpen(true);
      }
    } catch (error) {
      console.error("Failed to load details for editing:", error);
      toast({ title: "Error", description: "Failed to load monthly meeting details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const now = new Date();
  const currentHour24 = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = getTodayDateString();
  const currentPeriod = currentHour24 >= 12 ? "PM" : "AM";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {isLoading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Synchronizing Monthly Meetings..."
          subtitle="Loading meeting schedules, attendance lists, and regional allocations"
        />
      )}

      {/* Single Row Header (fixed at top) */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Monthly Meetings</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative group w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
            <Input
              placeholder="Search monthly meetings..."
              className="pl-9 h-9 rounded-lg border border-border bg-secondary/50 text-xs w-full focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={() => {
                resetForm();
                setDrawerOpen(true);
              }}
            >
              + New Monthly Meeting
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Middle Area containing Grid of Cards */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1">
        {meetings.length === 0 ? (
          <div className="py-20 text-center glass-card">
            <Calendar size={48} className="mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-medium">No monthly meetings found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {isFranchise
                ? "No meetings scheduled for your assigned franchise region yet."
                : "Create a monthly meeting to begin scheduling attendance and bookings."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((a, i) => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card overflow-hidden flex flex-col"
              >
                <div className="h-32 bg-secondary/50 relative overflow-hidden flex items-center justify-center">
                  {a.image ? (
                    <PrivateImage src={a.image} className="w-full h-full object-cover" />
                  ) : (
                    <Calendar size={40} className="text-primary/20" />
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shadow-sm capitalize backdrop-blur-sm">
                      Monthly Meeting
                    </span>
                    {a.isOfflineStallExist && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-sm capitalize backdrop-blur-sm">
                        Offline Stall Available
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={a.status} />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-800 line-clamp-1 text-[15px] hover:text-primary transition-colors leading-tight">
                    {a.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 min-h-[1.5rem] leading-relaxed opacity-80">
                    {a.content}
                  </p>

                  <div className="mt-2.5 grid grid-cols-2 gap-y-2.5 gap-x-2 border-t border-slate-50 pt-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Date & Time</span>
                      <div className="flex flex-col gap-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-600">
                        {a.fromDate ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-primary/60 flex-shrink-0" />
                              <span className="truncate">
                                {new Date(a.fromDate).toLocaleDateString()}
                                {a.toDate && ` - ${new Date(a.toDate).toLocaleDateString()}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-primary/60 flex-shrink-0" />
                              <span className="truncate">
                                {a.fromTime || "N/A"}
                                {a.toTime && ` - ${a.toTime}`}
                              </span>
                            </div>
                          </>
                        ) : a.date ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-primary/60 flex-shrink-0" />
                              <span>{new Date(a.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={12} className="text-primary/60 flex-shrink-0" />
                              <span>{a.time || "N/A"}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-primary/60 flex-shrink-0" />
                            <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Limit & Points</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <Users size={12} className="text-indigo-500/60" /> {a.membersLimit || "Unlimited"}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="w-fit bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-emerald-100 flex items-center gap-1">
                            <CheckCircle2 size={10} /> {a.points || 0} Pts
                          </div>
                          {a.amount !== undefined && a.amount !== null && a.amount !== "" && (
                            <div className="w-fit bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-blue-100 flex items-center gap-1">
                              ₹{a.amount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {a.location && (
                      <div className="col-span-2 flex flex-col gap-1 pt-0.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Location</span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <MapPin size={12} className="text-red-400 flex-shrink-0" />
                          <span className="line-clamp-1">{a.location}</span>
                        </div>
                      </div>
                    )}

                    {((a.regionIds && a.regionIds.length > 0) || a.regionId) && (
                      <div className="col-span-2 flex flex-col gap-1 pt-0.5">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Region</span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <MapPin size={12} className="text-indigo-400 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {(() => {
                              if (a.regionIds && a.regionIds.length > 0) {
                                return a.regionIds
                                  .map((id: string) => {
                                    const area = allAreas.find((aa) => aa._id === id);
                                    return area ? area.name : "Region";
                                  })
                                  .join(", ");
                              }
                              const reg = regionsList.find((r) => r._id === a.regionId);
                              return reg ? `${reg.city}, ${reg.state}` : "Region specific";
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={downloadingQrId === a._id}
                      className="w-full rounded-lg text-xs h-8 font-semibold border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all shadow-xs"
                      onClick={() => handleDownloadQr(a)}
                      title="Download Meeting Attendance QR Code as PDF"
                    >
                      {downloadingQrId === a._id ? (
                        <Loader2 size={13} className="mr-1.5 animate-spin text-primary" />
                      ) : (
                        <QrCode size={13} className="mr-1.5 text-primary" />
                      )}
                      Download Attendance QR
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-1 text-xs h-8 font-medium border-slate-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => handlePreview(a)}
                      >
                        <Eye size={12} className="mr-1.5" /> Preview
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg flex-1 text-xs h-8 font-medium border-slate-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
                          onClick={() => handleEdit(a)}
                        >
                          <Pencil size={12} className="mr-1.5" /> Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg flex-1 text-xs h-8 font-medium border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all text-slate-600"
                          onClick={() => {
                            setDeletingId(a._id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 size={12} className="mr-1.5" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer (fixed at bottom) */}
      {!isLoading && meetings.length > 0 && (
        <div className="flex-shrink-0 border-t border-border bg-background/80 backdrop-blur-sm z-10">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalMeetingsCount}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) resetForm();
        }}
        title={editingId ? "Edit Monthly Meeting" : "Create Monthly Meeting"}
        description="Fill in the details to publish a monthly meeting"
      >
        <div className="flex flex-col h-full bg-slate-50/50 px-1 py-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Meeting title"
              className={`h-11 ${errors.title ? "border-red-500" : ""}`}
            />
            {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Detailed monthly meeting agenda and content..."
              className={`min-h-[120px] ${errors.content ? "border-red-500" : ""}`}
            />
            {errors.content && <p className="text-[10px] text-red-500 font-bold">{errors.content}</p>}
          </div>

          {/* Event Type: Locked to Monthly Meeting */}
          <div className="space-y-2">
            <Label htmlFor="announcementType" className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Event Type <span className="text-red-500">*</span>
            </Label>
            <Select value="monthlymeeting" disabled>
              <SelectTrigger id="announcementType" className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm cursor-not-allowed opacity-90">
                <SelectValue placeholder="Monthly Meeting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthlymeeting">Monthly Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Offline Stall Option */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isOfflineStallExist"
                checked={formData.isOfflineStallExist}
                onChange={(e) => setFormData((prev) => ({ ...prev, isOfflineStallExist: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isOfflineStallExist" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer">
                Offline Stall Exist
              </Label>
            </div>

            {formData.isOfflineStallExist && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2">
                  <Label htmlFor="totalStallCount" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Total Stall Count <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    id="totalStallCount"
                    min="0"
                    value={formData.stallConfig.totalStallCount || ""}
                    onChange={(e) => handleCountChange(Number(e.target.value))}
                    className={`h-11 ${errors.totalStallCount ? "border-red-500" : ""}`}
                  />
                  {errors.totalStallCount && <p className="text-[10px] text-red-500 font-bold">{errors.totalStallCount}</p>}
                </div>

                {formData.stallConfig.totalStallCount > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Stalls Configuration
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddStall}
                        className="h-7 px-2.5 text-xs font-bold text-primary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Plus size={13} className="mr-1" /> Add Stall
                      </Button>
                    </div>
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-3 max-h-[340px] overflow-y-auto pr-1">
                      {formData.stallConfig.stalls.map((stall, index) => {
                        const nameErr = errors[`stall_${index}_name`];
                        const pointsErr = errors[`stall_${index}_points`];
                        return (
                          <div
                            key={index}
                            className="bg-white rounded-xl border border-slate-200/70 p-3 shadow-xs space-y-2.5 relative group hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-600">Stall #{index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStall(index)}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <X size={13} />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  value={stall.name}
                                  onChange={(e) => handleStallFieldChange(index, "name", e.target.value)}
                                  placeholder="e.g. Stall A1"
                                  className={`h-9 text-xs ${nameErr ? "border-red-500" : ""}`}
                                />
                                {nameErr && <p className="text-[9px] text-red-500 font-bold">{nameErr}</p>}
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Size <span className="text-slate-400 font-normal">(opt)</span>
                                </Label>
                                <Input
                                  value={stall.size}
                                  onChange={(e) => handleStallFieldChange(index, "size", e.target.value)}
                                  placeholder="e.g. 10x10 ft"
                                  className="h-9 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Points <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={stall.points}
                                  onChange={(e) => handleStallFieldChange(index, "points", e.target.value)}
                                  placeholder="0"
                                  className={`h-9 text-xs ${pointsErr ? "border-red-500" : ""}`}
                                />
                                {pointsErr && <p className="text-[9px] text-red-500 font-bold">{pointsErr}</p>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* From & To Date/Time */}
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                From Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    id="fromDate"
                    min={getTodayDateString()}
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    className={`h-11 ${errors.fromDate ? "border-red-500" : ""}`}
                  />
                </div>
                <div className="flex gap-1.5 items-center flex-shrink-0">
                  <span className="text-xs text-slate-400 font-semibold px-1">Time:</span>
                  <Select value={formData.fromHour} onValueChange={(val) => setFormData((prev) => ({ ...prev, fromHour: val }))}>
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                        <SelectItem
                          key={h}
                          value={h}
                          disabled={formData.fromDate === todayStr && getHour24(h, formData.fromPeriod) < currentHour24}
                        >
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-slate-400 font-bold">:</span>
                  <Select value={formData.fromMinute} onValueChange={(val) => setFormData((prev) => ({ ...prev, fromMinute: val }))}>
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                        <SelectItem
                          key={m}
                          value={m}
                          disabled={
                            formData.fromDate === todayStr &&
                            getHour24(formData.fromHour, formData.fromPeriod) === currentHour24 &&
                            parseInt(m, 10) < currentMinute
                          }
                        >
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.fromPeriod} onValueChange={(val) => setFormData((prev) => ({ ...prev, fromPeriod: val }))}>
                    <SelectTrigger className="h-11 w-20 bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM" disabled={formData.fromDate === todayStr && currentPeriod === "PM"}>
                        AM
                      </SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.fromDate && <p className="text-[10px] text-red-500 font-bold leading-tight">{errors.fromDate}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                To Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    id="toDate"
                    min={formData.fromDate || getTodayDateString()}
                    value={formData.toDate}
                    onChange={handleInputChange}
                    className={`h-11 ${errors.toDate ? "border-red-500" : ""}`}
                  />
                </div>
                <div className="flex gap-1.5 items-center flex-shrink-0">
                  <span className="text-xs text-slate-400 font-semibold px-1">Time:</span>
                  <Select value={formData.toHour} onValueChange={(val) => setFormData((prev) => ({ ...prev, toHour: val }))}>
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                        <SelectItem
                          key={h}
                          value={h}
                          disabled={formData.toDate === todayStr && getHour24(h, formData.toPeriod) < currentHour24}
                        >
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-slate-400 font-bold">:</span>
                  <Select value={formData.toMinute} onValueChange={(val) => setFormData((prev) => ({ ...prev, toMinute: val }))}>
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                        <SelectItem
                          key={m}
                          value={m}
                          disabled={
                            formData.toDate === todayStr &&
                            getHour24(formData.toHour, formData.toPeriod) === currentHour24 &&
                            parseInt(m, 10) < currentMinute
                          }
                        >
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.toPeriod} onValueChange={(val) => setFormData((prev) => ({ ...prev, toPeriod: val }))}>
                    <SelectTrigger className="h-11 w-20 bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM" disabled={formData.toDate === todayStr && currentPeriod === "PM"}>
                        AM
                      </SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.toDate && <p className="text-[10px] text-red-500 font-bold leading-tight">{errors.toDate}</p>}
              {errors.toTime && <p className="text-[10px] text-red-500 font-bold leading-tight">{errors.toTime}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Location <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Announcement location"
                className={`h-11 pl-10 ${errors.location ? "border-red-500" : ""}`}
              />
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.location && <p className="text-[10px] text-red-500 font-bold">{errors.location}</p>}
          </div>

          {/* Business Region (Multiple Select, Scoped to Franchise Owner if logged in) */}
          <div className="space-y-2 flex flex-col">
            <div className="flex items-center justify-between">
              <Label htmlFor="regionIds" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Region <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              {isFranchise && (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Franchise Scoped
                </span>
              )}
            </div>
            <Popover modal={true} open={regionOpen} onOpenChange={setRegionOpen}>
              <PopoverTrigger asChild>
                <Button
                  role="combobox"
                  type="button"
                  aria-expanded={regionOpen}
                  className="w-full h-11 bg-background border border-input rounded-md justify-between px-3 text-sm font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-700 active:scale-[0.99] transition-all"
                >
                  <span className="truncate text-left">
                    {formData.regionIds && formData.regionIds.length > 0
                      ? `${formData.regionIds.length} Region(s) selected`
                      : <span className="text-slate-400">Select Region (Optional)</span>}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                <Command className="w-full">
                  <CommandInput placeholder="Search region..." className="h-10 text-xs" />
                  <CommandEmpty>No region found.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    {allAreas.map((area) => {
                      const label = `${area.name}, ${area.city}, ${area.country}`;
                      const isSelected = formData.regionIds?.includes(area._id) || false;
                      return (
                        <CommandItem
                          key={area._id}
                          value={label}
                          onSelect={() => {
                            setFormData((prev) => {
                              const ids = prev.regionIds || [];
                              const newIds = ids.includes(area._id)
                                ? ids.filter((id) => id !== area._id)
                                : [...ids, area._id];
                              return { ...prev, regionIds: newIds };
                            });
                          }}
                          className="text-xs"
                        >
                          <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                          {label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {(formData.regionIds || []).map((id) => {
                const area = allAreas.find((aa) => aa._id === id);
                if (!area) return null;
                return (
                  <Badge
                    key={id}
                    variant="default"
                    className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-2 flex items-center gap-1"
                  >
                    {area.name} ({area.city})
                    <X
                      size={10}
                      className="cursor-pointer"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          regionIds: (prev.regionIds || []).filter((rid) => rid !== id)
                        }));
                      }}
                    />
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Points, Members Limit, Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points" className="text-xs font-bold uppercase tracking-wider text-slate-600">Points</Label>
              <Input
                type="number"
                id="points"
                min="0"
                value={formData.points === undefined || formData.points === null ? "" : formData.points}
                onChange={handleInputChange}
                placeholder="0"
                className={`h-11 ${errors.points ? "border-red-500" : ""}`}
              />
              {errors.points && <p className="text-[10px] text-red-500 font-bold">{errors.points}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="membersLimit" className="text-xs font-bold uppercase tracking-wider text-slate-600">Members Limit</Label>
              <Input
                type="number"
                id="membersLimit"
                min="0"
                value={formData.membersLimit === undefined || formData.membersLimit === null ? "" : formData.membersLimit}
                onChange={handleInputChange}
                placeholder="0 (No limit)"
                className={`h-11 ${errors.membersLimit ? "border-red-500" : ""}`}
              />
              {errors.membersLimit && <p className="text-[10px] text-red-500 font-bold">{errors.membersLimit}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Amount <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </Label>
              <Input
                type="number"
                id="amount"
                min="0"
                step="any"
                value={formData.amount === undefined || formData.amount === null ? "" : formData.amount}
                onChange={handleInputChange}
                placeholder="0"
                className={`h-11 ${errors.amount ? "border-red-500" : ""}`}
              />
              {errors.amount && <p className="text-[10px] text-red-500 font-bold">{errors.amount}</p>}
            </div>
          </div>

          {/* Announcement Image */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Announcement Image <span className="text-red-500">*</span>
              </Label>
              {!filesToUpload.image && !formData.image ? (
                <div className="relative group">
                  <Input
                    type="file"
                    accept="image/*"
                    className={`h-11 cursor-pointer ${errors.image ? "border-red-500" : ""}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFilesToUpload((prev) => ({ ...prev, image: file }));
                      if (file && errors.image) setErrors((prev) => ({ ...prev, image: "" }));
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ImageIcon size={18} />
                  </div>
                </div>
              ) : (
                <MediaPreview
                  file={filesToUpload.image}
                  url={formData.image}
                  type="image"
                  onRemove={() => {
                    setFilesToUpload((prev) => ({ ...prev, image: null }));
                    setFormData((prev) => ({ ...prev, image: "" }));
                  }}
                />
              )}
              {errors.image && <p className="text-[10px] text-red-500 font-bold">{errors.image}</p>}
            </div>

            {/* Announcement Video */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Announcement Video <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </Label>
              {!filesToUpload.video && !formData.video ? (
                <div className="relative group">
                  <Input
                    type="file"
                    accept="video/*"
                    className="h-11 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFilesToUpload((prev) => ({ ...prev, video: file }));
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Video size={18} />
                  </div>
                </div>
              ) : (
                <MediaPreview
                  file={filesToUpload.video}
                  url={formData.video}
                  type="video"
                  onRemove={() => {
                    setFilesToUpload((prev) => ({ ...prev, video: null }));
                    setFormData((prev) => ({ ...prev, video: "" }));
                  }}
                />
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-slate-600">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => {
                setFormData((prev) => ({ ...prev, status: val }));
                if (val !== "scheduled" && errors.scheduleDate) {
                  setErrors((prev) => ({ ...prev, scheduleDate: "" }));
                }
              }}
            >
              <SelectTrigger id="status" className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Date & Time if scheduled */}
          {formData.status === "scheduled" && (
            <div className="space-y-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
              <Label className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                Schedule Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    min={getTodayDateString()}
                    value={formData.scheduleDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scheduleDate: e.target.value }))}
                    className={`h-11 bg-white ${errors.scheduleDate ? "border-red-500" : ""}`}
                  />
                </div>
                <div className="flex gap-1.5 items-center flex-shrink-0">
                  <Select value={formData.scheduleHour} onValueChange={(val) => setFormData((prev) => ({ ...prev, scheduleHour: val }))}>
                    <SelectTrigger className="h-11 w-16 bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-slate-400 font-bold">:</span>
                  <Select value={formData.scheduleMinute} onValueChange={(val) => setFormData((prev) => ({ ...prev, scheduleMinute: val }))}>
                    <SelectTrigger className="h-11 w-16 bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={formData.schedulePeriod} onValueChange={(val) => setFormData((prev) => ({ ...prev, schedulePeriod: val }))}>
                    <SelectTrigger className="h-11 w-20 bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.scheduleDate && <p className="text-[10px] text-red-500 font-bold leading-tight">{errors.scheduleDate}</p>}
            </div>
          )}

          <div className="pt-6 flex gap-3 pb-10">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
              onClick={handleSubmit}
              disabled={isSubmitting || isEditingExpired}
            >
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
              {editingId ? "Update Monthly Meeting" : "Save Monthly Meeting"}
            </Button>
          </div>
        </div>
      </FormDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${meetings.find((a) => a._id === deletingId)?.title || "Monthly Meeting"}"?`}
        description="Are you sure you want to delete this monthly meeting? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        variant="destructive"
      />

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-4 border-b border-border flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Calendar className="text-primary w-5 h-5 animate-pulse" />
              Monthly Meeting Details & Bookings
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Real-time member registrations and stall allocations for this monthly meeting
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
                <p className="text-sm font-semibold text-slate-500">Loading booking statistics...</p>
              </div>
            ) : previewData ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
                {/* Left Column */}
                <div className="md:col-span-4 space-y-4">
                  <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
                    <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {previewData.image ? (
                        <PrivateImage src={previewData.image} className="w-full h-full object-cover" />
                      ) : (
                        <Calendar size={48} className="text-primary/20" />
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary text-white capitalize">Monthly Meeting</Badge>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{previewData.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-h-[120px] overflow-y-auto pr-1 no-scrollbar">
                        {previewData.content}
                      </p>

                      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 gap-2.5">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          <span>
                            Date:{" "}
                            {previewData.fromDate
                              ? `${new Date(previewData.fromDate).toLocaleDateString()}${previewData.toDate ? ` - ${new Date(previewData.toDate).toLocaleDateString()}` : ""}`
                              : previewData.date
                              ? new Date(previewData.date).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Clock size={14} className="text-slate-400" />
                          <span>
                            Time:{" "}
                            {previewData.fromTime
                              ? `${previewData.fromTime}${previewData.toTime ? ` - ${previewData.toTime}` : ""}`
                              : previewData.time || "N/A"}
                          </span>
                        </div>
                        {previewData.location && (
                          <div className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="break-words">{previewData.location}</span>
                          </div>
                        )}
                        {((previewData.regionIds && previewData.regionIds.length > 0) || previewData.regionId) && (
                          <div className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                            <MapPin size={14} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                            <span className="break-words">
                              Region:{" "}
                              {(() => {
                                if (previewData.regionIds && previewData.regionIds.length > 0) {
                                  return previewData.regionIds
                                    .map((id: string) => {
                                      const area = allAreas.find((aa) => aa._id === id);
                                      return area ? area.name : "Region";
                                    })
                                    .join(", ");
                                }
                                const reg = regionsList.find((r) => r._id === previewData.regionId);
                                return reg ? `${reg.city}, ${reg.state}` : "Region specific";
                              })()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Users size={14} className="text-slate-400" />
                          <span>Limit: {previewData.membersLimit ? `${previewData.membersLimit} Members` : "Unlimited"}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle2 size={12} />
                            <span>Cost: {previewData.points || 0} Pts</span>
                          </div>
                          {previewData.amount !== undefined && previewData.amount !== null && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 w-fit px-2 py-0.5 rounded-full border border-blue-100">
                              <span>Amount: ₹{previewData.amount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QR Flyer Box */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-primary/5 p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <QrCode className="text-primary w-4 h-4" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">Attendance QR Code</h4>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-white border-primary/20 text-primary font-medium">
                        Scan to Check-In
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                      {previewQrUrl ? (
                        <img src={previewQrUrl} alt="Attendance QR Code" className="w-36 h-36 object-contain" />
                      ) : (
                        <div className="w-36 h-36 flex items-center justify-center">
                          <Loader2 className="animate-spin text-primary w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={downloadingQrId === (previewData.announcementId || previewData._id)}
                      className="w-full text-xs h-9 font-semibold border-primary bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                      onClick={() => handleDownloadQr(previewData)}
                    >
                      {downloadingQrId === (previewData.announcementId || previewData._id) ? (
                        <Loader2 size={13} className="mr-2 animate-spin" />
                      ) : (
                        <Download size={13} className="mr-2" />
                      )}
                      Download QR Flyer (PDF)
                    </Button>
                  </div>
                </div>

                {/* Right Column: Registrations & Stall Bookings */}
                <div className="md:col-span-8 space-y-4">
                  <Tabs defaultValue="events" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                      <TabsTrigger value="events" className="rounded-lg py-2 font-bold text-xs">
                        Member Registrations ({previewData.eventBookings?.length || 0})
                      </TabsTrigger>
                      {previewData.isOfflineStallExist && (
                        <TabsTrigger value="stalls" className="rounded-lg py-2 font-bold text-xs">
                          Stall Bookings ({previewData.stallBookings?.length || 0})
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="events" className="mt-4 border border-border rounded-xl overflow-hidden bg-white">
                      <div className="max-h-[350px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-slate-50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="font-bold text-[11px] uppercase text-slate-500">Member</TableHead>
                              <TableHead className="font-bold text-[11px] uppercase text-slate-500">Business Name</TableHead>
                              <TableHead className="font-bold text-[11px] uppercase text-slate-500">Mobile</TableHead>
                              <TableHead className="font-bold text-[11px] uppercase text-slate-500">Booking Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.eventBookings?.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-slate-400 text-xs">
                                  No members registered yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              previewData.eventBookings?.map((booking: any) => (
                                <TableRow key={booking.bookingId} className="hover:bg-slate-50">
                                  <TableCell className="flex items-center gap-2 py-2.5">
                                    <PrivateAvatar
                                      src={booking.member?.profilePhoto}
                                      fallbackName={booking.member?.fullName}
                                      className="h-7 w-7"
                                      avatarFallbackClassName="text-[10px] font-bold"
                                    />
                                    <div>
                                      <p className="text-sm text-foreground font-semibold">{booking.member?.fullName}</p>
                                      <p className="text-sm text-foreground font-semibold block mt-0.5">{booking.member?.email}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2.5 text-sm text-foreground font-semibold">
                                    {booking.member?.businessName || "-"}
                                  </TableCell>
                                  <TableCell className="py-2.5 text-sm text-foreground font-semibold">
                                    {booking.member?.mobileNumber}
                                  </TableCell>
                                  <TableCell className="py-2.5 text-sm text-foreground font-semibold">
                                    {new Date(booking.bookedAt).toLocaleDateString()}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    {previewData.isOfflineStallExist && (
                      <TabsContent value="stalls" className="mt-4 border border-border rounded-xl overflow-hidden bg-white">
                        <div className="max-h-[350px] overflow-y-auto">
                          <Table>
                            <TableHeader className="bg-slate-50 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500">Stall</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500">Member</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500">Size / Pts</TableHead>
                                <TableHead className="font-bold text-[11px] uppercase text-slate-500">Mobile</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {previewData.stallBookings?.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-10 text-slate-400 text-xs">
                                    No stalls booked yet.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                previewData.stallBookings?.map((stall: any) => (
                                  <TableRow key={stall.bookingId} className="hover:bg-slate-50">
                                    <TableCell className="py-2.5">
                                      <span className="text-sm text-foreground font-semibold">{stall.stallName}</span>
                                    </TableCell>
                                    <TableCell className="flex items-center gap-2 py-2.5">
                                      <PrivateAvatar
                                        src={stall.member?.profilePhoto}
                                        fallbackName={stall.member?.fullName}
                                        className="h-7 w-7"
                                        avatarFallbackClassName="text-[10px] font-bold"
                                      />
                                      <div>
                                        <p className="text-sm text-foreground font-semibold">{stall.member?.fullName}</p>
                                        <p className="text-sm text-foreground font-semibold block mt-0.5">{stall.member?.businessName}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2.5 text-sm text-foreground font-semibold">
                                      {stall.size || "Standard"} ({stall.points || 0} pts)
                                    </TableCell>
                                    <TableCell className="py-2.5 text-sm text-foreground font-semibold">
                                      {stall.member?.mobileNumber}
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MonthlyMeetingsPage;
