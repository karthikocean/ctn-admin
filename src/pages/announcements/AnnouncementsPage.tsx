import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Megaphone, Calendar, Loader2, Image as ImageIcon, Video, X, CheckCircle2, Pencil, Trash2, Search, MapPin, Clock, Users, Eye, Check, ChevronsUpDown } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, getAnnouncementDetails, getAnnouncementBookings } from "@/api/AnnouncementsApi";
import { getRegions } from "@/api/RegionApi";
import { uploadFiles } from "@/api/MediaApi";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL.replace("/api/admin", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const MediaPreview = ({ file, url, type, onRemove }: { file?: File | null, url?: string, type: 'image' | 'video', onRemove: () => void }) => {
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

  const displayUrl = file ? localPreview : getFullUrl(url || "");
  if (!displayUrl) return null;

  return (
    <div className="relative mt-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center shadow-inner max-w-[300px]">
      {type === 'image' ? (
        <img src={displayUrl} alt="preview" className="max-w-full max-h-full object-contain" />
      ) : (
        <video src={displayUrl} controls className="max-w-full max-h-full" />
      )}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20 backdrop-blur-sm"
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
};

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getHour24 = (hourStr: string, period: string) => {
  let h = parseInt(hourStr, 10);
  if (isNaN(h)) return 0;
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return h;
};

const getMinDatetimeString = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const AnnouncementsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("announcements", "create");
  const canEdit = hasPermission("announcements", "edit");
  const canDelete = hasPermission("announcements", "delete");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [regionsList, setRegionsList] = useState<any[]>([]);

  const allAreas = useMemo(() => {
    return regionsList.flatMap((r) => {
      if (r.areas && r.areas.length > 0) {
        return r.areas.map((area: any) => ({
          _id: typeof area === "string" ? area : area._id,
          name: typeof area === "string" ? area : area.name,
          city: r.city,
          state: r.state,
          country: r.country
        }));
      }
      return [{
        _id: r._id,
        name: `${r.city}, ${r.state} (${r.country})`,
        city: r.city,
        state: r.state,
        country: r.country
      }];
    });
  }, [regionsList]);

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
    fetchRegions();
  }, []);

  const [editingId, setEditingId] = useState<string | null>(null);

  const isEditingExpired = useMemo(() => {
    if (!editingId) return false;
    const ann = announcements.find(a => a._id === editingId);
    if (!ann) return false;
    const now = new Date();
    if (ann.toDate) {
      return new Date(ann.toDate) < now;
    }
    if (ann.date) {
      return new Date(ann.date) < now;
    }
    return false;
  }, [editingId, announcements]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isMounted = useRef(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handlePreview = async (a: any) => {
    setIsPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const bookingsResult = await getAnnouncementBookings(a._id);
      setPreviewData(bookingsResult.data || null);
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
    announcementType: "Event",
    date: "",
    time: "",
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

  const handleCountChange = (count: number) => {
    const safeCount = Math.max(0, count);
    setFormData((prev) => {
      const stalls = [...prev.stallConfig.stalls];
      if (safeCount > stalls.length) {
        for (let i = stalls.length; i < safeCount; i++) {
          stalls.push({ name: `Stall ${i + 1}`, size: "", points: "" });
        }
      } else {
        stalls.splice(safeCount);
      }
      return {
        ...prev,
        stallConfig: {
          totalStallCount: safeCount,
          stalls
        }
      };
    });
  };

  const handleStallFieldChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const stalls = [...prev.stallConfig.stalls];
      stalls[index] = {
        ...stalls[index],
        [field]: field === "points" ? (value === "" ? "" : Number(value)) : value
      };
      return {
        ...prev,
        stallConfig: {
          ...prev.stallConfig,
          stalls
        }
      };
    });
  };



  const [filesToUpload, setFilesToUpload] = useState({
    image: null as File | null,
    video: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const result = await getAnnouncements({ page: page - 1, limit: 9, search: searchTerm });
      setAnnouncements(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchAnnouncements();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'points' || id === 'membersLimit' ? (value === "" ? "" : Number(value)) : value
    }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.content) newErrors.content = "Content is required";
    if (!formData.fromDate) newErrors.fromDate = "From Date is required";
    if (!formData.toDate) newErrors.toDate = "To Date is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.image && !filesToUpload.image) newErrors.image = "Image is required";
    
    if (formData.status === "scheduled" && !formData.scheduleDate) {
      newErrors.scheduleDate = "Schedule date is required";
    }

    if (formData.fromDate) {
      const [year, month, day] = formData.fromDate.split('-').map(Number);
      let h = parseInt(formData.fromHour || "10", 10);
      const m = parseInt(formData.fromMinute || "00", 10);
      const period = formData.fromPeriod || "AM";
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      const selectedStart = new Date(year, month - 1, day, h, m, 0, 0);
      const now = new Date();
      
      const original = editingId ? announcements.find(a => a._id === editingId) : null;
      const wasInFuture = original && (original.fromDate || original.date) ? new Date(original.fromDate || original.date) > now : false;
      const isTimeModified = original ? (
        new Date(original.fromDate || original.date).getTime() !== selectedStart.getTime()
      ) : true;

      if ((!editingId || wasInFuture || isTimeModified) && selectedStart < now) {
        newErrors.fromDate = "From Date & Time cannot be in the past";
      }
    }

    if (formData.toDate) {
      const [year, month, day] = formData.toDate.split('-').map(Number);
      let h = parseInt(formData.toHour || "11", 10);
      const m = parseInt(formData.toMinute || "00", 10);
      const period = formData.toPeriod || "AM";
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      const selectedEnd = new Date(year, month - 1, day, h, m, 0, 0);
      const now = new Date();

      const original = editingId ? announcements.find(a => a._id === editingId) : null;
      const wasInFuture = original && original.toDate ? new Date(original.toDate) > now : false;
      const isTimeModified = original ? (
        original.toDate && new Date(original.toDate).getTime() !== selectedEnd.getTime()
      ) : true;

      if ((!editingId || wasInFuture || isTimeModified) && selectedEnd < now) {
        newErrors.toDate = "To Date & Time cannot be in the past";
      }
    }

    if (formData.fromDate && formData.toDate) {
      const start = new Date(formData.fromDate);
      const end = new Date(formData.toDate);
      if (end < start) {
        newErrors.toDate = "To Date cannot be before From Date";
      } else if (formData.fromDate === formData.toDate) {
        const getMinutes = (hour: string, minute: string, period: string) => {
          let h = parseInt(hour, 10);
          const m = parseInt(minute, 10);
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };

        const fromMin = getMinutes(formData.fromHour, formData.fromMinute, formData.fromPeriod);
        const toMin = getMinutes(formData.toHour, formData.toMinute, formData.toPeriod);
        if (toMin <= fromMin) {
          newErrors.toTime = "To Time must be after From Time on the same day";
        }
      }
    }

    if (formData.status === "scheduled") {
      if (!formData.scheduleDate) {
        newErrors.scheduleDate = "Schedule date is required";
      } else {
        const [year, month, day] = formData.scheduleDate.split('-').map(Number);
        let h = parseInt(formData.scheduleHour || "10", 10);
        const m = parseInt(formData.scheduleMinute || "00", 10);
        const period = formData.schedulePeriod || "AM";
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
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
    if (formData.announcementType === "Event" && formData.isOfflineStallExist) {
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
      announcementType: "Event",
      date: "",
      time: "",
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
      scheduleDate: "",
      scheduleHour: "10",
      scheduleMinute: "00",
      schedulePeriod: "AM",
      regionId: "",
      regionIds: [],
      isOfflineStallExist: false,
      stallConfig: {
        totalStallCount: 0,
        stalls: []
      }
    });
    setFilesToUpload({ image: null, video: null });
    setEditingId(null);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please fix the form errors", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { _id, createdAt, updatedAt, __v, fromHour, fromMinute, fromPeriod, toHour, toMinute, toPeriod, scheduleHour, scheduleMinute, schedulePeriod, scheduleDate: _scheduleDate, ...dataToSave } = formData as any;
      
      const parseDateTime = (dateStr: string, hour: string, minute: string, period: string) => {
        if (!dateStr) return undefined;
        const [year, month, day] = dateStr.split('-').map(Number);
        let h = parseInt(hour, 10);
        const m = parseInt(minute, 10);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        const d = new Date(year, month - 1, day, h, m, 0, 0);
        return d.toISOString();
      };

      const finalFromDate = parseDateTime(formData.fromDate, formData.fromHour, formData.fromMinute, formData.fromPeriod);
      const finalToDate = parseDateTime(formData.toDate, formData.toHour, formData.toMinute, formData.toPeriod);
      const finalFromTime = `${formData.fromHour}:${formData.fromMinute} ${formData.fromPeriod}`;
      const finalToTime = `${formData.toHour}:${formData.toMinute} ${formData.toPeriod}`;

      const payload = {
        ...dataToSave,
        points: formData.points === "" ? 0 : Number(formData.points),
        membersLimit: formData.membersLimit === "" ? 0 : Number(formData.membersLimit),
        date: finalFromDate,
        time: finalFromTime,
        fromDate: finalFromDate,
        toDate: finalToDate,
        fromTime: finalFromTime,
        toTime: finalToTime,
        regionId: formData.regionIds && formData.regionIds.length > 0 ? formData.regionIds[0] : undefined,
        regionIds: formData.regionIds && formData.regionIds.length > 0 ? formData.regionIds : [],
        scheduleDate: formData.status === 'scheduled' && formData.scheduleDate
          ? parseDateTime(formData.scheduleDate, formData.scheduleHour, formData.scheduleMinute, formData.schedulePeriod)
          : undefined,
        stallConfig: formData.isOfflineStallExist 
          ? formData.stallConfig 
          : { totalStallCount: 0, stalls: [] }
      };

      // 1. Upload Files if any
      if (filesToUpload.image) {
        const res = await uploadFiles([filesToUpload.image], "announcements/images");
        if (res.success) payload.image = res.data[0].url;
      }

      if (filesToUpload.video) {
        const res = await uploadFiles([filesToUpload.video], "announcements/videos");
        if (res.success) payload.video = res.data[0].url;
      }

      // 2. Save Data
      let result;
      if (editingId) {
        result = await updateAnnouncement(editingId, payload);
      } else {
        result = await createAnnouncement(payload);
      }

      toast({
        title: "Success",
        description: result.message || "Announcement saved successfully",
        variant: "success"
      });
      setDrawerOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to save", variant: "destructive" });
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
        description: res.message || "Announcement deleted successfully",
        variant: "success"
      });
      fetchAnnouncements();
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete announcement",
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
        
        // Parse "HH:MM AM/PM" or ISO date into { hour, minute, period }
        const parseTimeParts = (timeStr: string, isoDate?: string) => {
          const defaults = { hour: "10", minute: "00", period: "AM" };
          
          // Try "HH:MM AM/PM" format first (e.g. "10:30 AM")
          if (timeStr) {
            const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
            if (match) {
              return {
                hour: String(parseInt(match[1], 10)).padStart(2, "0"),
                minute: match[2].padStart(2, "0"),
                period: match[3].toUpperCase()
              };
            }
          }

          // Fallback: extract from ISO date string using LOCAL getters
          if (isoDate) {
            const d = new Date(isoDate);
            if (!isNaN(d.getTime())) {
              let h = d.getHours();
              const m = d.getMinutes();
              const period = h >= 12 ? "PM" : "AM";
              if (h > 12) h -= 12;
              if (h === 0) h = 12;
              return {
                hour: String(h).padStart(2, "0"),
                minute: String(m).padStart(2, "0"),
                period
              };
            }
          }

          return defaults;
        };

        const formatLocalDateString = (isoStr: string) => {
          if (!isoStr) return "";
          const d = new Date(isoStr);
          if (isNaN(d.getTime())) return isoStr.split('T')[0];
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        };

        const fromParts = parseTimeParts(data.fromTime || data.time, data.fromDate || data.date);
        const toParts   = parseTimeParts(data.toTime, data.toDate);
        const schedParts = parseTimeParts(undefined, data.scheduleDate);

        setFormData({
          title: data.title,
          content: data.content,
          status: data.status,
          image: data.image || "",
          video: data.video || "",
          announcementType: data.announcementType || "Event",
          date: formatLocalDateString(data.date),
          time: data.time || "",
          fromDate: formatLocalDateString(data.fromDate || data.date),
          toDate: formatLocalDateString(data.toDate),
          fromHour:   fromParts.hour,
          fromMinute: fromParts.minute,
          fromPeriod: fromParts.period,
          toHour:   toParts.hour,
          toMinute: toParts.minute,
          toPeriod: toParts.period,
          location: data.location || "",
          points: data.points || "",
          membersLimit: data.membersLimit || "",
          scheduleDate: formatLocalDateString(data.scheduleDate),
          scheduleHour: schedParts.hour,
          scheduleMinute: schedParts.minute,
          schedulePeriod: schedParts.period,
          regionId: data.regionId || "",
          regionIds: data.regionIds || (data.regionId ? [data.regionId] : []),
          isOfflineStallExist: data.isOfflineStallExist || false,
          stallConfig: data.stallConfig || { totalStallCount: 0, stalls: [] }
        });
        setDrawerOpen(true);
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch announcement details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const now = new Date();
  const todayStr = getTodayDateString();
  const currentHour24 = now.getHours();
  const currentMinute = now.getMinutes();
  const currentPeriod = currentHour24 >= 12 ? "PM" : "AM";

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {isLoading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Synchronizing Announcements..."
          subtitle="Broadcasting network updates to all global nodes"
        />
      )}

      {/* Single Row Header (fixed at top) */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Announcements</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative group w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
            <Input
              placeholder="Search announcements..."
              className="pl-9 h-9 rounded-lg border border-border bg-secondary/50 text-xs w-full focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={() => { resetForm(); setDrawerOpen(true); }}
            >
              + New Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Middle Area containing Grid of Cards */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1">
        {announcements.length === 0 ? (
          <div className="py-20 text-center glass-card">
            <Megaphone size={48} className="mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">No announcements found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((a, i) => (
              <motion.div key={a._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="glass-card overflow-hidden flex flex-col">
                <div className="h-32 bg-secondary/50 relative overflow-hidden flex items-center justify-center">
                  {a.image ? (
                    <img src={getFullUrl(a.image)} className="w-full h-full object-cover" />
                  ) : (
                    <Megaphone size={40} className="text-primary/20" />
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shadow-sm capitalize backdrop-blur-sm">
                      {a.announcementType || "Event"}
                    </span>
                    {a.announcementType === "Event" && a.isOfflineStallExist && (
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
                  <h3 className="font-bold text-slate-800 line-clamp-1 text-[15px] hover:text-primary transition-colors leading-tight">{a.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 min-h-[1.5rem] leading-relaxed opacity-80">{a.content}</p>

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
                          <Users size={12} className="text-indigo-500/60" /> {a.membersLimit || 'Unlimited'}
                        </div>
                        <div className="w-fit bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 size={10} /> {a.points || 0} Pts
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
                                return a.regionIds.map((id: string) => {
                                  const area = allAreas.find(aa => aa._id === id);
                                  return area ? area.name : "Region";
                                }).join(", ");
                              }
                              const reg = regionsList.find(r => r._id === a.regionId);
                              return reg ? `${reg.city}, ${reg.state}` : "Region specific";
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
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
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer (fixed at bottom) */}
      {!isLoading && announcements.length > 0 && (
        <div className="flex-shrink-0 border-t border-border bg-background/80 backdrop-blur-sm z-10">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => { setDrawerOpen(open); if (!open) resetForm(); }}
        title={editingId ? "Edit Announcement" : "Create Announcement"}
        description="Fill in the details to publish an announcement"
      >
        <div className="flex flex-col h-full bg-slate-50/50 px-1 py-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-600">Title <span className="text-red-500">*</span></Label>
            <Input id="title" value={formData.title} onChange={handleInputChange} placeholder="Announcement title" className={`h-11 ${errors.title ? "border-red-500" : ""}`} />
            {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-slate-600">Content <span className="text-red-500">*</span></Label>
            <Textarea id="content" value={formData.content} onChange={handleInputChange} placeholder="Detailed announcement content..." className={`min-h-[120px] ${errors.content ? "border-red-500" : ""}`} />
            {errors.content && <p className="text-[10px] text-red-500 font-bold">{errors.content}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcementType" className="text-xs font-bold uppercase tracking-wider text-slate-600">Announcement Type <span className="text-red-500">*</span></Label>
            <Select
              value={formData.announcementType}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, announcementType: value }));
                if (errors.announcementType) setErrors(prev => ({ ...prev, announcementType: "" }));
              }}
            >
              <SelectTrigger id="announcementType" className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.announcementType === "Event" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="isOfflineStallExist" 
                  checked={formData.isOfflineStallExist} 
                  onChange={(e) => setFormData(prev => ({ ...prev, isOfflineStallExist: e.target.checked }))} 
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                />
                <Label htmlFor="isOfflineStallExist" className="text-xs font-bold uppercase tracking-wider text-slate-600 cursor-pointer">Offline Stall Exist</Label>
              </div>

              {formData.isOfflineStallExist && (
                <div className="space-y-4 border-t border-border pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalStallCount" className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Stall Count <span className="text-red-500">*</span></Label>
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
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Stalls Configuration
                      </Label>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {formData.stallConfig.stalls.map((stall, index) => {
                          const nameErr = errors[`stall_${index}_name`];
                          const pointsErr = errors[`stall_${index}_points`];
                          return (
                            <div 
                              key={index} 
                              className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3 shadow-xs transition-shadow hover:shadow-sm"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-primary" />
                                  <span className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                                    Stall #{index + 1}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                <div className="sm:col-span-6 space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Stall Name <span className="text-red-500">*</span>
                                  </Label>
                                  <Input 
                                    type="text" 
                                    value={stall.name} 
                                    onChange={(e) => handleStallFieldChange(index, "name", e.target.value)} 
                                    className={`h-9 text-xs rounded-md bg-white ${nameErr ? "border-red-500" : ""}`} 
                                    placeholder="Enter stall name"
                                  />
                                  {nameErr && <p className="text-[10px] text-red-500 font-bold leading-tight mt-0.5">{nameErr}</p>}
                                </div>
                                <div className="sm:col-span-3 space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Size
                                  </Label>
                                  <Input 
                                    type="text" 
                                    value={stall.size} 
                                    onChange={(e) => handleStallFieldChange(index, "size", e.target.value)} 
                                    className="h-9 text-xs rounded-md bg-white" 
                                    placeholder="e.g. 10x10"
                                  />
                                </div>
                                <div className="sm:col-span-3 space-y-1">
                                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    Points <span className="text-red-500">*</span>
                                  </Label>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    value={stall.points === undefined || stall.points === null ? "" : stall.points} 
                                    onChange={(e) => handleStallFieldChange(index, "points", e.target.value)} 
                                    className={`h-9 text-xs rounded-md bg-white ${pointsErr ? "border-red-500" : ""}`} 
                                    placeholder="0"
                                  />
                                  {pointsErr && <p className="text-[10px] text-red-500 font-bold leading-tight mt-0.5">{pointsErr}</p>}
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
          )}

          <div className="space-y-4 border-t border-slate-100 pt-4">
            {/* From Date & Time */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">From Date & Time <span className="text-red-500">*</span></Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input 
                    type="date" 
                    id="fromDate" 
                    min={getTodayDateString()} 
                    value={formData.fromDate} 
                    onChange={handleInputChange} 
                    className={`h-11 pr-10 ${errors.fromDate ? "border-red-500" : ""}`} 
                  />
                  <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <div className="flex gap-1.5 items-center flex-shrink-0">
                  <span className="text-xs text-slate-400 font-semibold px-1">Time:</span>
                  <Select 
                    value={formData.fromHour} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, fromHour: val }))}
                  >
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                        <SelectItem key={h} value={h} disabled={formData.fromDate === todayStr && getHour24(h, formData.fromPeriod) < currentHour24}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-slate-400 font-bold">:</span>
                  <Select 
                    value={formData.fromMinute} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, fromMinute: val }))}
                  >
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                        <SelectItem key={m} value={m} disabled={formData.fromDate === todayStr && getHour24(formData.fromHour, formData.fromPeriod) === currentHour24 && parseInt(m, 10) < currentMinute}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={formData.fromPeriod} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, fromPeriod: val }))}
                  >
                    <SelectTrigger className="h-11 w-20 bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM" disabled={formData.fromDate === todayStr && currentPeriod === "PM"}>AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.fromDate && <p className="text-[10px] text-red-500 font-bold leading-tight">{errors.fromDate}</p>}
            </div>

            {/* To Date & Time */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">To Date & Time <span className="text-red-500">*</span></Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input 
                    type="date" 
                    id="toDate" 
                    min={formData.fromDate || getTodayDateString()} 
                    value={formData.toDate} 
                    onChange={handleInputChange} 
                    className={`h-11 pr-10 ${errors.toDate ? "border-red-500" : ""}`} 
                  />
                  <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <div className="flex gap-1.5 items-center flex-shrink-0">
                  <span className="text-xs text-slate-400 font-semibold px-1">Time:</span>
                  <Select 
                    value={formData.toHour} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, toHour: val }))}
                  >
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                        <SelectItem key={h} value={h} disabled={formData.toDate === todayStr && getHour24(h, formData.toPeriod) < currentHour24}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-slate-400 font-bold">:</span>
                  <Select 
                    value={formData.toMinute} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, toMinute: val }))}
                  >
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                        <SelectItem key={m} value={m} disabled={formData.toDate === todayStr && getHour24(formData.toHour, formData.toPeriod) === currentHour24 && parseInt(m, 10) < currentMinute}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={formData.toPeriod} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, toPeriod: val }))}
                  >
                    <SelectTrigger className="h-11 w-20 bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM" disabled={formData.toDate === todayStr && currentPeriod === "PM"}>AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.toDate && <p className="text-[10px] text-red-500 font-bold leading-tight">{errors.toDate}</p>}
              {errors.toTime && <p className="text-[10px] text-red-500 font-bold leading-tight">{errors.toTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-xs font-bold uppercase tracking-wider text-slate-600">Location <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input id="location" value={formData.location} onChange={handleInputChange} placeholder="Announcement location" className={`h-11 pl-10 ${errors.location ? "border-red-500" : ""}`} />
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.location && <p className="text-[10px] text-red-500 font-bold">{errors.location}</p>}
          </div>

          <div className="space-y-2 flex flex-col">
            <Label htmlFor="regionIds" className="text-xs font-bold uppercase tracking-wider text-slate-600">Region <span className="text-slate-400 font-normal">(Optional)</span></Label>
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
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              isSelected ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {label}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(formData.regionIds || []).map(id => {
                const area = allAreas.find(aa => aa._id === id);
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points" className="text-xs font-bold uppercase tracking-wider text-slate-600">Points</Label>
              <Input type="number" id="points" min="0" value={formData.points === undefined || formData.points === null ? "" : formData.points} onChange={handleInputChange} placeholder="0" className={`h-11 ${errors.points ? "border-red-500" : ""}`} />
              {errors.points && <p className="text-[10px] text-red-500 font-bold">{errors.points}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="membersLimit" className="text-xs font-bold uppercase tracking-wider text-slate-600">Members Limit</Label>
              <Input type="number" id="membersLimit" min="0" value={formData.membersLimit === undefined || formData.membersLimit === null ? "" : formData.membersLimit} onChange={handleInputChange} placeholder="0 (No limit)" className={`h-11 ${errors.membersLimit ? "border-red-500" : ""}`} />
              {errors.membersLimit && <p className="text-[10px] text-red-500 font-bold">{errors.membersLimit}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Announcement Image <span className="text-red-500">*</span></Label>
              {!filesToUpload.image && !formData.image ? (
                <div className="relative group">
                  <Input
                    type="file"
                    accept="image/*"
                    className={`h-11 cursor-pointer ${errors.image ? "border-red-500" : ""}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setFilesToUpload(prev => ({ ...prev, image: file }));
                      if (file && errors.image) setErrors(prev => ({ ...prev, image: "" }));
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none">
                    <ImageIcon size={18} />
                  </div>
                </div>
              ) : (
                <MediaPreview
                  type="image"
                  file={filesToUpload.image}
                  url={formData.image}
                  onRemove={() => {
                    if (filesToUpload.image) setFilesToUpload(prev => ({ ...prev, image: null }));
                    else setFormData(prev => ({ ...prev, image: "" }));
                  }}
                />
              )}
              {errors.image && <p className="text-[10px] text-red-500 font-bold">{errors.image}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Announcement Video</Label>
              {!filesToUpload.video && !formData.video ? (
                <div className="relative group">
                  <Input type="file" accept="video/*" className="h-11 cursor-pointer" onChange={(e) => setFilesToUpload(prev => ({ ...prev, video: e.target.files?.[0] || null }))} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none">
                    <Video size={18} />
                  </div>
                </div>
              ) : (
                <MediaPreview
                  type="video"
                  file={filesToUpload.video}
                  url={formData.video}
                  onRemove={() => {
                    if (filesToUpload.video) setFilesToUpload(prev => ({ ...prev, video: null }));
                    else setFormData(prev => ({ ...prev, video: "" }));
                  }}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-slate-600">Status</Label>
            <Select
              disabled={isEditingExpired}
              value={formData.status}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, status: value }));
                if (errors.status) setErrors(prev => ({ ...prev, status: "" }));
              }}
            >
              <SelectTrigger id="status" className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm disabled:opacity-75 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.status === "scheduled" && (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Schedule Date & Time <span className="text-red-500">*</span></Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Input 
                    type="date" 
                    id="scheduleDate" 
                    min={getTodayDateString()} 
                    value={formData.scheduleDate} 
                    onChange={handleInputChange} 
                    className={`h-11 pr-10 ${errors.scheduleDate ? "border-red-500" : ""}`} 
                  />
                  <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                <div className="flex gap-1.5 items-center flex-shrink-0">
                  <span className="text-xs text-slate-400 font-semibold px-1">Time:</span>
                  <Select 
                    value={formData.scheduleHour} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, scheduleHour: val }))}
                  >
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Hour" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                        <SelectItem key={h} value={h} disabled={formData.scheduleDate === todayStr && getHour24(h, formData.schedulePeriod) < currentHour24}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-slate-400 font-bold">:</span>
                  <Select 
                    value={formData.scheduleMinute} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, scheduleMinute: val }))}
                  >
                    <SelectTrigger className="h-11 w-16 bg-background text-sm">
                      <SelectValue placeholder="Min" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                        <SelectItem key={m} value={m} disabled={formData.scheduleDate === todayStr && getHour24(formData.scheduleHour, formData.schedulePeriod) === currentHour24 && parseInt(m, 10) < currentMinute}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select 
                    value={formData.schedulePeriod} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, schedulePeriod: val }))}
                  >
                    <SelectTrigger className="h-11 w-20 bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM" disabled={formData.scheduleDate === todayStr && currentPeriod === "PM"}>AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {errors.scheduleDate && <p className="text-[10px] text-red-500 font-bold leading-tight">{errors.scheduleDate}</p>}
            </div>
          )}

          {isEditingExpired && (
            <div className="mt-4 p-3 bg-amber-50/80 border border-amber-100 rounded-xl flex items-start gap-2.5">
              <span className="text-xs text-amber-700 font-semibold leading-normal">
                ⚠️ This announcement has expired. You cannot change its status or update its details.
              </span>
            </div>
          )}

          <div className="pt-6 flex gap-3 pb-10">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSubmitting || isEditingExpired}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
              {editingId ? "Update Announcement" : "Save Announcement"}
            </Button>
          </div>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${announcements.find(a => a._id === deletingId)?.title || 'Announcement'}"?`}
        description="Are you sure you want to delete this announcement? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        variant="destructive"
      />

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-4 border-b border-border flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Megaphone className="text-primary w-5 h-5 animate-pulse" />
              Announcement Details & Bookings
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Real-time member registrations and stall allocations for this announcement
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
              {/* Left Column: Announcement Details */}
              <div className="md:col-span-4 space-y-4">
                <div className="border border-border rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
                  <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {previewData.image ? (
                      <img src={getFullUrl(previewData.image)} className="w-full h-full object-cover" />
                    ) : (
                      <Megaphone size={48} className="text-primary/20" />
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary text-white capitalize">{previewData.announcementType}</Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-slate-800 text-base leading-snug">{previewData.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-h-[120px] overflow-y-auto pr-1 no-scrollbar">{previewData.content}</p>

                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 gap-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Calendar size={14} className="text-slate-400" />
                        <span>
                          Date: {previewData.fromDate 
                            ? `${new Date(previewData.fromDate).toLocaleDateString()}${previewData.toDate ? ` - ${new Date(previewData.toDate).toLocaleDateString()}` : ""}` 
                            : (previewData.date ? new Date(previewData.date).toLocaleDateString() : "N/A")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Clock size={14} className="text-slate-400" />
                        <span>
                          Time: {previewData.fromTime 
                            ? `${previewData.fromTime}${previewData.toTime ? ` - ${previewData.toTime}` : ""}` 
                            : (previewData.time || "N/A")}
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
                            Region: {(() => {
                              if (previewData.regionIds && previewData.regionIds.length > 0) {
                                return previewData.regionIds.map((id: string) => {
                                  const area = allAreas.find(aa => aa._id === id);
                                  return area ? area.name : "Region";
                                }).join(", ");
                              }
                              const reg = regionsList.find(r => r._id === previewData.regionId);
                              return reg ? `${reg.city}, ${reg.state}` : "Region specific";
                            })()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Users size={14} className="text-slate-400" />
                        <span>Limit: {previewData.membersLimit ? `${previewData.membersLimit} Members` : "Unlimited"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">
                        <CheckCircle2 size={12} />
                        <span>Cost: {previewData.points || 0} Pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Bookings Lists */}
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
                                  <Avatar className="h-7 w-7">
                                    <AvatarImage src={getFullUrl(booking.member?.profilePhoto)} />
                                    <AvatarFallback className="text-[10px] font-bold">
                                      {booking.member?.fullName?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
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
                                  {new Date(booking.createdAt).toLocaleDateString()}
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
                              <TableHead className="font-bold text-[11px] uppercase text-slate-500">Business Name</TableHead>
                              <TableHead className="font-bold text-[11px] uppercase text-slate-500">Mobile</TableHead>
                              <TableHead className="font-bold text-[11px] uppercase text-slate-500">Pts Spent</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {previewData.stallBookings?.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-xs">
                                  No stalls booked yet.
                                </TableCell>
                              </TableRow>
                            ) : (
                              previewData.stallBookings?.map((booking: any) => (
                                <TableRow key={booking.bookingId} className="hover:bg-slate-50">
                                  <TableCell className="py-2.5">
                                    <div className="text-sm text-foreground font-semibold">{booking.stall?.name}</div>
                                    {booking.stall?.size && (
                                      <div className="text-sm text-foreground font-semibold mt-0.5">Size: {booking.stall.size}</div>
                                    )}
                                  </TableCell>
                                  <TableCell className="flex items-center gap-2 py-2.5">
                                    <Avatar className="h-7 w-7">
                                      <AvatarImage src={getFullUrl(booking.member?.profilePhoto)} />
                                      <AvatarFallback className="text-[10px] font-bold">
                                        {booking.member?.fullName?.slice(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm text-foreground font-semibold">{booking.member?.fullName}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2.5 text-sm text-foreground font-semibold">
                                    {booking.member?.businessName || "-"}
                                  </TableCell>
                                  <TableCell className="py-2.5 text-sm text-foreground font-semibold">
                                    {booking.member?.mobileNumber}
                                  </TableCell>
                                  <TableCell className="py-2.5">
                                    <Badge variant="secondary" className="text-sm text-foreground bg-slate-100 border-none font-semibold">
                                      {booking.pointsSpent || 0} Pts
                                    </Badge>
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
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">
              Failed to load preview details.
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementsPage;
