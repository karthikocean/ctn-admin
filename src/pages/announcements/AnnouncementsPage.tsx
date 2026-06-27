import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Megaphone, Calendar, Loader2, Image as ImageIcon, Video, X, CheckCircle2, Pencil, Trash2, Search, MapPin, Clock, Users, Eye } from "lucide-react";
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
import { uploadFiles } from "@/api/MediaApi";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    location: "",
    points: "" as any,
    membersLimit: "" as any,
    scheduleDate: "",
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
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.image && !filesToUpload.image) newErrors.image = "Image is required";
    if (formData.status === "scheduled" && !formData.scheduleDate) {
      newErrors.scheduleDate = "Schedule date is required";
    }
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Date cannot be in the past";
      }
    }
    if (formData.status === "scheduled" && formData.scheduleDate) {
      const selectedSchedule = new Date(formData.scheduleDate);
      const now = new Date();
      if (selectedSchedule < now) {
        newErrors.scheduleDate = "Schedule date cannot be in the past";
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
      location: "",
      points: "" as any,
      membersLimit: "" as any,
      scheduleDate: "",
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
      const { _id, createdAt, updatedAt, __v, ...dataToSave } = formData as any;
      const payload = {
        ...dataToSave,
        points: formData.points === "" ? 0 : Number(formData.points),
        membersLimit: formData.membersLimit === "" ? 0 : Number(formData.membersLimit),
        date: formData.date ? new Date(formData.date).toISOString() : undefined,
        scheduleDate: formData.status === 'scheduled' && formData.scheduleDate ? new Date(formData.scheduleDate).toISOString() : undefined,
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
        setFormData({
          title: data.title,
          content: data.content,
          status: data.status,
          image: data.image || "",
          video: data.video || "",
          announcementType: data.announcementType || "Event",
          date: data.date ? data.date.split('T')[0] : "",
          time: data.time || "",
          location: data.location || "",
          points: data.points || "",
          membersLimit: data.membersLimit || "",
          scheduleDate: data.scheduleDate ? data.scheduleDate.slice(0, 16) : "",
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
                      <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
                        {a.date ? (
                          <>
                            <div className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/60" /> {new Date(a.date).toLocaleDateString()}</div>
                            <div className="flex items-center gap-1.5"><Clock size={12} className="text-primary/60" /> {a.time || "N/A"}</div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/60" /> {new Date(a.createdAt).toLocaleDateString()}</div>
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
                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Stalls Configuration</Label>
                      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1 border border-dashed border-border rounded-xl p-3 bg-slate-50/50">
                        {formData.stallConfig.stalls.map((stall, index) => {
                          const nameErr = errors[`stall_${index}_name`];
                          const pointsErr = errors[`stall_${index}_points`];
                          return (
                            <div key={index} className="border border-border p-3 rounded-lg bg-card space-y-3 shadow-sm relative">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-[10px] font-bold uppercase text-primary tracking-wide">Stall #{index + 1}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-semibold text-slate-500 uppercase">Stall Name <span className="text-red-500">*</span></Label>
                                  <Input 
                                    type="text" 
                                    value={stall.name} 
                                    onChange={(e) => handleStallFieldChange(index, "name", e.target.value)} 
                                    className={`h-8 text-xs ${nameErr ? "border-red-500" : ""}`} 
                                  />
                                  {nameErr && <p className="text-[8px] text-red-500 font-bold leading-tight mt-0.5">{nameErr}</p>}
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-semibold text-slate-500 uppercase">Size</Label>
                                  <Input 
                                    type="text" 
                                    value={stall.size} 
                                    onChange={(e) => handleStallFieldChange(index, "size", e.target.value)} 
                                    className="h-8 text-xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-semibold text-slate-500 uppercase">Points <span className="text-red-500">*</span></Label>
                                  <Input 
                                    type="number" 
                                    min="0" 
                                    value={stall.points === undefined || stall.points === null ? "" : stall.points} 
                                    onChange={(e) => handleStallFieldChange(index, "points", e.target.value)} 
                                    className={`h-8 text-xs ${pointsErr ? "border-red-500" : ""}`} 
                                  />
                                  {pointsErr && <p className="text-[8px] text-red-500 font-bold leading-tight mt-0.5">{pointsErr}</p>}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-slate-600">Date <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type="date" id="date" min={getTodayDateString()} value={formData.date} onChange={handleInputChange} className={`h-11 pr-10 ${errors.date ? "border-red-500" : ""}`} />
                <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              {errors.date && <p className="text-[10px] text-red-500 font-bold">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-xs font-bold uppercase tracking-wider text-slate-600">Time <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type="time" id="time" value={formData.time} onChange={handleInputChange} className={`h-11 pr-10 ${errors.time ? "border-red-500" : ""}`} />
                <Clock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              {errors.time && <p className="text-[10px] text-red-500 font-bold">{errors.time}</p>}
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
              value={formData.status}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, status: value }));
                if (errors.status) setErrors(prev => ({ ...prev, status: "" }));
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

          {formData.status === "scheduled" && (
            <div className="space-y-2">
              <Label htmlFor="scheduleDate" className="text-xs font-bold uppercase tracking-wider text-slate-600">Schedule Date & Time <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type="datetime-local" id="scheduleDate" min={getMinDatetimeString()} value={formData.scheduleDate} onChange={handleInputChange} className={`h-11 ${errors.scheduleDate ? "border-red-500" : ""}`} />
              </div>
              {errors.scheduleDate && <p className="text-[10px] text-red-500 font-bold">{errors.scheduleDate}</p>}
            </div>
          )}

          <div className="pt-6 flex gap-3 pb-10">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSubmitting}>
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
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <Megaphone className="text-primary w-5 h-5 animate-pulse" />
              Announcement Details & Bookings
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Real-time member registrations and stall allocations for this announcement
            </DialogDescription>
          </DialogHeader>

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
                        <span>Date: {previewData.date ? new Date(previewData.date).toLocaleDateString() : "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <Clock size={14} className="text-slate-400" />
                        <span>Time: {previewData.time || "N/A"}</span>
                      </div>
                      {previewData.location && (
                        <div className="flex items-start gap-2 text-xs text-slate-600 font-medium">
                          <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{previewData.location}</span>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementsPage;
