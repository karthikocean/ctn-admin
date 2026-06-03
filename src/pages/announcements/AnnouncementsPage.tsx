import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Megaphone, Calendar, Loader2, Image as ImageIcon, Video, X, CheckCircle2, Pencil, Trash2, Search } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, getAnnouncementDetails } from "@/api/AnnouncementsApi";
import { uploadFiles } from "@/api/MediaApi";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

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

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft",
    image: "",
    video: ""
  });

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
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.content) newErrors.content = "Content is required";
    if (!formData.image && !filesToUpload.image) newErrors.image = "Image is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", status: "draft", image: "", video: "" });
    setFilesToUpload({ image: null, video: null });
    setEditingId(null);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validate()) {
      toast({ title: "Validation Error", description: "Title and Content are mandatory", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { _id, createdAt, updatedAt, __v, ...dataToSave } = formData as any;
      const payload = { ...dataToSave };

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
          video: data.video || ""
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
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={a.status} />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold text-foreground line-clamp-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">{a.content}</p>

                  <div className="mt-4 flex items-center gap-4 text-[10px] text-muted-foreground">
                    {a.video && <div className="flex items-center gap-1 text-primary"><Video size={12} /> Video Attached</div>}
                    <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(a.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
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
        <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6">
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
            <select id="status" value={formData.status} onChange={handleInputChange} className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

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
    </div>
  );
};

export default AnnouncementsPage;
