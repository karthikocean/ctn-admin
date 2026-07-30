import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Clock, Users, Search, Filter, Loader2, Image as ImageIcon, Video, X, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getEvents, createEvent, updateEvent, deleteEvent, getEventDetails } from "@/api/EventsApi";
import { uploadFiles } from "@/api/MediaApi";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_MEDIA_URL || "http://localhost:5001";
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

const EventsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("events", "create");
  const canEdit = hasPermission("events", "edit");
  const canDelete = hasPermission("events", "delete");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isMounted = useRef(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    points: 0,
    membersLimit: 0,
    status: "upcoming",
    image: "",
    video: ""
  });

  const [filesToUpload, setFilesToUpload] = useState({
    image: null as File | null,
    video: null as File | null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const result = await getEvents({ page: page - 1, limit: 9, search: searchQuery });
      setEvents(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchEvents();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'points' || id === 'membersLimit' ? Number(value) : value
    }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.location) newErrors.location = "Location is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      points: 0,
      membersLimit: 0,
      status: "upcoming",
      image: "",
      video: ""
    });
    setFilesToUpload({ image: null, video: null });
    setEditingId(null);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { _id, createdAt, updatedAt, __v, ...dataToSave } = formData as any;
      const payload = {
        ...dataToSave,
        date: formData.date ? new Date(formData.date).toISOString() : undefined
      };

      // 1. Upload Files if any
      if (filesToUpload.image) {
        const res = await uploadFiles([filesToUpload.image], "events/images");
        if (res.success) payload.image = res.data[0].url;
      }

      if (filesToUpload.video) {
        const res = await uploadFiles([filesToUpload.video], "events/videos");
        if (res.success) payload.video = res.data[0].url;
      }

      // 2. Save Data
      let result;
      if (editingId) {
        result = await updateEvent(editingId, payload);
      } else {
        result = await createEvent(payload);
      }

      toast({
        title: "Success",
        description: result.message || "Event saved successfully",
        variant: "success"
      });
      setDrawerOpen(false);
      resetForm();
      fetchEvents();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to save event", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await deleteEvent(deletingId);
      toast({
        title: "Deleted",
        description: res.message || "Event deleted successfully",
        variant: "success"
      });
      fetchEvents();
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete event",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleEdit = async (e: any) => {
    setIsLoading(true);
    setErrors({});
    setFilesToUpload({ image: null, video: null });
    try {
      const result = await getEventDetails(e._id);
      if (result.success || result.status === 200) {
        const data = result.data;
        setEditingId(data._id);
        setFormData({
          title: data.title,
          description: data.description || "",
          date: data.date ? data.date.split('T')[0] : "",
          time: data.time,
          location: data.location,
          points: data.points || 0,
          membersLimit: data.membersLimit || 0,
          status: data.status,
          image: data.image || "",
          video: data.video || ""
        });
        setDrawerOpen(true);
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch event details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {isLoading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Synchronizing Global Events..."
          subtitle="Establishing secure connection to event clusters"
        />
      )}

      {/* Single Row Header (fixed at top) */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Events</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative mr-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>
          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={() => { resetForm(); setDrawerOpen(true); }}
            >
              + New Event
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Middle Area containing Grid of Cards */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1">
        {events.length === 0 ? (
          <div className="py-20 text-center glass-card">
            <Calendar size={48} className="mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e, i) => (
              <motion.div
                key={e._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 border-slate-100"
              >
                <div className="h-32 bg-secondary/30 relative overflow-hidden flex items-center justify-center">
                  {e.image ? (
                    <img src={getFullUrl(e.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <Calendar size={40} className="text-primary/10" />
                  )}
                  <div className="absolute top-2.5 right-2.5 shadow-sm">
                    <StatusBadge status={e.status} />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-800 line-clamp-1 text-[15px] group-hover:text-primary transition-colors leading-tight">{e.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 min-h-[1.5rem] leading-relaxed opacity-80">
                    {e.description || "No description provided."}
                  </p>

                  <div className="mt-2.5 grid grid-cols-2 gap-y-2.5 gap-x-2 border-t border-slate-50 pt-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Date & Time</span>
                      <div className="flex flex-col gap-1 text-[11px] font-semibold text-slate-600">
                        <div className="flex items-center gap-1.5"><Calendar size={12} className="text-primary/60" /> {new Date(e.date).toLocaleDateString()}</div>
                        <div className="flex items-center gap-1.5"><Clock size={12} className="text-primary/60" /> {e.time}</div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Rewards & Limit</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                          <Users size={12} className="text-indigo-500/60" /> {e.membersLimit || 'Unlimited'}
                        </div>
                        <div className="w-fit bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 size={10} /> {e.points || 0} Pts
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col gap-1 pt-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Location</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                        <MapPin size={12} className="text-red-400 flex-shrink-0" />
                        <span className="line-clamp-1">{e.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100/50">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-1 text-xs h-8 font-bold border-slate-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => handleEdit(e)}
                      >
                        <Pencil size={12} className="mr-1.5" /> Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-1 text-xs h-8 font-bold border-slate-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all text-slate-500"
                        onClick={() => {
                          setDeletingId(e._id);
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
      {!isLoading && events.length > 0 && (
        <div className="flex-shrink-0 pt-1 border-t border-border bg-background/80 backdrop-blur-sm z-10">
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
        title={editingId ? "Edit Event" : "Create Event"}
        description="Fill in the details to schedule an event"
      >
        <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-600">Title <span className="text-red-500">*</span></Label>
            <Input id="title" value={formData.title} onChange={handleInputChange} placeholder="Event title" className={`h-11 ${errors.title ? "border-red-500" : ""}`} />
            {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-600">Description</Label>
            <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="Detailed event description..." className="min-h-[100px]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-slate-600">Date <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input type="date" id="date" value={formData.date} onChange={handleInputChange} className={`h-11 pr-10 ${errors.date ? "border-red-500" : ""}`} />
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
              <Input id="location" value={formData.location} onChange={handleInputChange} placeholder="Event location" className={`h-11 pl-10 ${errors.location ? "border-red-500" : ""}`} />
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
            {errors.location && <p className="text-[10px] text-red-500 font-bold">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points" className="text-xs font-bold uppercase tracking-wider text-slate-600">Points</Label>
              <Input type="number" id="points" value={formData.points} onChange={handleInputChange} placeholder="0" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="membersLimit" className="text-xs font-bold uppercase tracking-wider text-slate-600">Members Limit</Label>
              <Input type="number" id="membersLimit" value={formData.membersLimit} onChange={handleInputChange} placeholder="0 (No limit)" className="h-11" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Event Photo</Label>
              {!filesToUpload.image && !formData.image ? (
                <div className="relative group">
                  <Input
                    type="file"
                    accept="image/*"
                    className="h-11 cursor-pointer"
                    onChange={(e) => setFilesToUpload(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
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
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Event Video</Label>
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
            <select id="status" value={formData.status} onChange={handleInputChange} className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm">
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="pt-6 flex gap-3 pb-10">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
              {editingId ? "Update Event" : "Save Event"}
            </Button>
          </div>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${events.find(e => e._id === deletingId)?.title || 'Event'}"?`}
        description="Are you sure you want to delete this event? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default EventsPage;
