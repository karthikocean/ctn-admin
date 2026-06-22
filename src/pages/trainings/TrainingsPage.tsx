import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Search, Plus, Trash2, Video, User, Award,
  ImageIcon, Layout, FileText, PlayCircle, Film, X
} from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import FormDrawer from "@/components/common/FormDrawer";
import ActionMenu from "@/components/common/ActionMenu";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  getTrainings,
  createTraining,
  updateTraining,
  deleteTraining
} from "@/api/TrainingApi";
import { getTrainingCategories } from "@/api/TrainingCategoryApi";
import { uploadFiles } from "@/api/MediaApi";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

const getFullUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) return path;
  const baseUrl = import.meta.env.VITE_API_URL.replace("/api/admin", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

// --- Types ---
interface Lesson {
  _id?: string;
  id: string; // Internal key for React
  title: string;
  description: string;
  thumbnail: string | null;
  videoUrl: string | null;
  thumbnailFile?: File | null;
  videoFile?: File | null;
  points: number;
  duration: string;
}

interface TrainingForm {
  title: string;
  description: string;
  thumbnail: string | null;
  thumbnailFile?: File | null;
  banner: string | null;
  bannerFile?: File | null;
  overallPoints: number;
  status: "active" | "inactive";
  authorName: string;
  authorImage: string | null;
  authorImageFile?: File | null;
  authorBio: string;
  lessons: Lesson[];
  categoryId: string | null;
}

const TrainingsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "author" | "lessons">("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const isMounted = useRef(false);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission("trainings", "create");
  const canEdit = hasPermission("trainings", "edit");
  const canDelete = hasPermission("trainings", "delete");

  const initialForm: TrainingForm = {
    title: "",
    description: "",
    thumbnail: null,
    banner: null,
    overallPoints: 0,
    status: "active",
    authorName: "",
    authorImage: null,
    authorBio: "",
    lessons: [
      { id: Date.now().toString(), title: "", description: "", thumbnail: null, videoUrl: null, points: 0, duration: "" }
    ],
    categoryId: null
  };

  const [form, setForm] = useState<TrainingForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<any[]>([]);

  // --- Load Categories ---
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getTrainingCategories({ limit: 100, status: "active" });
        setCategories(res.data || []);
      } catch (error) {
        console.error("Failed to load training categories", error);
      }
    };
    loadCategories();
  }, []);

  // --- Fetch Data ---
  const fetchTrainings = async () => {
    try {
      setIsFetching(true);
      const result = await getTrainings({
        page: page - 1,
        limit: 9,
        search: searchTerm || undefined
      });
      setTrainings(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch trainings",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
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
        fetchTrainings();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- Auto-calculate Overall Points ---
  useEffect(() => {
    const totalPoints = form.lessons.reduce((sum, lesson) => sum + (Number(lesson.points) || 0), 0);
    setForm(prev => ({ ...prev, overallPoints: totalPoints }));
  }, [form.lessons]);

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = "Training title is required";
    if (!form.categoryId) newErrors.categoryId = "Training category is required";
    if (!form.thumbnail && !form.thumbnailFile) newErrors.thumbnail = "Thumbnail is required";
    if (!form.banner && !form.bannerFile) newErrors.banner = "Banner is required";

    if (!form.authorName.trim()) newErrors.authorName = "Instructor name is required";
    if (!form.authorImage && !form.authorImageFile) newErrors.authorImage = "Instructor image is required";

    form.lessons.forEach((lesson) => {
      if (!lesson.videoUrl && !lesson.videoFile) newErrors[`lesson_${lesson.id}_video`] = "Video is required";
      if (!lesson.thumbnail && !lesson.thumbnailFile) newErrors[`lesson_${lesson.id}_thumbnail`] = "Lesson thumbnail is required";
      if (!lesson.title.trim()) newErrors[`lesson_${lesson.id}_title`] = "Lesson title is required";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>, lessonId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const durationStr = formatDuration(video.duration);
        updateLesson(lessonId, "duration", durationStr);
        updateLesson(lessonId, "videoUrl", URL.createObjectURL(file));
        updateLesson(lessonId, "videoFile", file);
        setErrors(prev => {
          const next = { ...prev };
          delete next[`lesson_${lessonId}_video`];
          return next;
        });
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof TrainingForm | "lesson", lessonId?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (field === "lesson" && lessonId) {
          updateLesson(lessonId, "thumbnail", result);
          updateLesson(lessonId, "thumbnailFile", file);
          setErrors(prev => {
            const next = { ...prev };
            delete next[`lesson_${lessonId}_thumbnail`];
            return next;
          });
        } else {
          setForm(prev => ({ ...prev, [field]: result, [`${String(field)}File`]: file }));
          setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addLesson = () => {
    setForm(prev => ({
      ...prev,
      lessons: [...prev.lessons, { id: Date.now().toString(), title: "", description: "", thumbnail: null, videoUrl: null, points: 0, duration: "" }]
    }));
  };

  const removeLesson = (id: string) => {
    if (form.lessons.length > 1) {
      setForm(prev => ({ ...prev, lessons: prev.lessons.filter(l => l.id !== id) }));
    }
  };

  const updateLesson = (id: string, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      lessons: prev.lessons.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
    if (field === "title") {
      setErrors(prev => {
        const next = { ...prev };
        delete next[`lesson_${id}_title`];
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({ title: "Validation Error", description: "Please fill all required fields marked with *", variant: "destructive" });
      const errorKeys = Object.keys(errors);
      if (errorKeys.some(k => ["title", "thumbnail", "banner"].includes(k))) setActiveTab("basic");
      else if (errorKeys.some(k => ["authorName", "authorImage"].includes(k))) setActiveTab("author");
      else setActiveTab("lessons");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Upload main files
      let thumbnail = form.thumbnail;
      if (form.thumbnailFile) {
        const upload = await uploadFiles([form.thumbnailFile], "trainings");
        thumbnail = upload.data[0].url;
      }

      let banner = form.banner;
      if (form.bannerFile) {
        const upload = await uploadFiles([form.bannerFile], "trainings");
        banner = upload.data[0].url;
      }

      let authorImage = form.authorImage;
      if (form.authorImageFile) {
        const upload = await uploadFiles([form.authorImageFile], "trainings");
        authorImage = upload.data[0].url;
      }

      // 2. Upload lesson files
      const lessons = await Promise.all(form.lessons.map(async (lesson) => {
        let lessonThumb = lesson.thumbnail;
        if (lesson.thumbnailFile) {
          const upload = await uploadFiles([lesson.thumbnailFile], "trainings");
          lessonThumb = upload.data[0].url;
        }

        let lessonVideo = lesson.videoUrl;
        if (lesson.videoFile) {
          const upload = await uploadFiles([lesson.videoFile], "trainings");
          lessonVideo = upload.data[0].url;
        }

        return {
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          thumbnail: lessonThumb,
          videoUrl: lessonVideo,
          points: lesson.points,
          duration: lesson.duration
        };
      }));

      const payload = {
        title: form.title,
        description: form.description,
        thumbnail,
        banner,
        overallPoints: form.overallPoints,
        status: form.status,
        authorName: form.authorName,
        authorImage,
        authorBio: form.authorBio,
        lessons,
        categoryId: form.categoryId
      };

      if (editingId) {
        await updateTraining(editingId, payload);
        toast({ title: "Success", description: "Training updated successfully", variant: "success" });
      } else {
        await createTraining(payload);
        toast({ title: "Success", description: "Training published successfully", variant: "success" });
      }

      setDrawerOpen(false);
      setEditingId(null);
      setForm(initialForm);
      fetchTrainings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save training",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (training: any) => {
    setEditingId(training._id);
    setForm({
      title: training.title,
      description: training.description,
      thumbnail: training.thumbnail,
      banner: training.banner,
      overallPoints: training.overallPoints,
      status: training.status,
      authorName: training.authorName,
      authorImage: training.authorImage,
      authorBio: training.authorBio,
      lessons: training.lessons.map((l: any, i: number) => ({
        id: i.toString(),
        ...l,
        _id: l._id
      })),
      categoryId: training.categoryId || (training.category?._id || null)
    });
    setDrawerOpen(true);
    setActiveTab("basic");
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteTraining(deletingId);
      toast({ title: "Deleted", description: "Training course removed", variant: "success" });
      fetchTrainings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete training",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {isFetching && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Synchronizing Curriculum..."
          subtitle="Establishing connection to educational network nodes"
        />
      )}

      {/* Header Section */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm border border-primary/20">
            <GraduationCap size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Trainings Management</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search trainings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10 pr-4 w-full rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          {canCreate && (
            <Button
              className="h-11 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-sm font-bold shadow-lg shadow-primary/20"
              onClick={() => { setEditingId(null); setForm(initialForm); setDrawerOpen(true); }}
            >
              <Plus size={18} className="mr-2" /> New Training
            </Button>
          )}
        </div>
      </div>

      {/* Scrollable Middle Area containing Course Cards Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1">
        {trainings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((t, i) => (
              <motion.div key={t._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="aspect-video relative overflow-hidden bg-secondary">
                  <img src={getFullUrl(t.thumbnail)} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={t.status} />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      {t.category && (
                        <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] font-bold border-primary/10 hover:bg-primary/10 px-2 py-0.5">
                          {t.category.name}
                        </Badge>
                      )}
                      <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">{t.title}</h3>
                    </div>
                    {(canEdit || canDelete) && (
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(t) : undefined}
                        onDelete={canDelete ? () => handleDelete(t._id) : undefined}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-secondary border border-border overflow-hidden">
                      <img src={getFullUrl(t.authorImage)} alt={t.authorName} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">by <span className="text-foreground">{t.authorName}</span></p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-xl border border-border/40">
                      <PlayCircle size={14} className="text-primary" />
                      <span className="font-semibold text-foreground">{t.lessons?.length || 0} Lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 p-2 rounded-xl border border-border/40">
                      <Award size={14} className="text-amber-500" />
                      <span className="font-semibold text-foreground">{t.overallPoints} Points</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center glass-card">
            <GraduationCap size={40} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No training courses found</p>
          </div>
        )}
      </div>

      {/* Footer (fixed at bottom) */}
      {!isFetching && trainings.length > 0 && (
        <div className="flex-shrink-0 pt-0 border-t border-border bg-background/80 backdrop-blur-sm z-10">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <FormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title={form.title || (editingId ? "Edit Training Course" : "Create Training Course")} scrollable={false}>
        <div className="flex flex-col h-full bg-slate-50/40 relative">
          <div className="flex items-center gap-1 p-4 bg-white border-b border-border sticky top-0 z-10 overflow-x-auto no-scrollbar">
            {[
              { id: "basic", label: "General Info", icon: Layout },
              { id: "author", label: "Instructor Info", icon: User },
              { id: "lessons", label: "Curriculum / Lessons", icon: FileText },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all", activeTab === tab.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary")}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "lessons" && (
            <div className="px-6 py-4 bg-slate-50/50 backdrop-blur-sm border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2"><Video size={16} className="text-primary" /> Lessons ({form.lessons.length})</h3>
                <Button size="sm" onClick={addLesson} className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-sm shadow-primary/10"><Plus size={14} className="mr-1.5" /> Add Lesson</Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden relative">
            {activeTab === "basic" && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="h-full overflow-y-auto px-6 py-6 space-y-6 pb-32">

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Training Title <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Mastering Client Relationships" className={cn("h-12 rounded-2xl", errors.title && "border-red-500 focus-visible:ring-red-500")} value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
                  {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.title}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Training Category <span className="text-red-500">*</span></Label>
                  <Select value={form.categoryId || ""} onValueChange={(val) => {
                    setForm(prev => ({ ...prev, categoryId: val }));
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.categoryId;
                      return next;
                    });
                  }}>
                    <SelectTrigger className={cn("h-12 rounded-2xl", errors.categoryId && "border-red-500")}>
                      <SelectValue placeholder="Select Training Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.categoryId}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Description</Label>
                  <Textarea placeholder="Training overview..." className="min-h-[120px] rounded-2xl" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Thumbnail <span className="text-red-500">*</span></Label>
                    <div className={cn("relative group aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-white overflow-hidden flex flex-col items-center justify-center", errors.thumbnail && "border-red-500 bg-red-50")}>
                      {form.thumbnail ? (
                        <div className="relative w-full h-full">
                          <img src={getFullUrl(form.thumbnail)} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, thumbnail: null, thumbnailFile: null })); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon size={20} className="text-slate-300" />
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageChange(e, "thumbnail")} />
                        </>
                      )}
                    </div>
                    {errors.thumbnail && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.thumbnail}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Banner <span className="text-red-500">*</span></Label>
                    <div className={cn("relative group aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-white overflow-hidden flex flex-col items-center justify-center", errors.banner && "border-red-500 bg-red-50")}>
                      {form.banner ? (
                        <div className="relative w-full h-full">
                          <img src={getFullUrl(form.banner)} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, banner: null, bannerFile: null })); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImageIcon size={20} className="text-slate-300" />
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageChange(e, "banner")} />
                        </>
                      )}
                    </div>
                    {errors.banner && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.banner}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Completion Points</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        readOnly
                        className="h-12 rounded-2xl pl-10 bg-slate-50 font-bold text-primary border-slate-200 cursor-not-allowed"
                        value={form.overallPoints}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">Calculated from lessons automatically</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Status</Label>
                    <Select value={form.status} onValueChange={(val: any) => setForm(prev => ({ ...prev, status: val }))}>
                      <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "author" && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="h-full overflow-y-auto px-6 py-6 space-y-6 pb-32">
                <div className="flex items-start gap-6">
                  <div className="flex flex-col items-center space-y-2">
                    <div className={cn("relative group w-32 h-32 rounded-3xl border-2 border-dashed border-slate-200 bg-white overflow-hidden flex items-center justify-center", errors.authorImage && "border-red-500 bg-red-50")}>
                      {form.authorImage ? (
                        <div className="relative w-full h-full">
                          <img src={getFullUrl(form.authorImage)} className="w-full h-full object-cover" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, authorImage: null, authorImageFile: null })); }}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <User size={28} className="text-slate-300" />
                          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageChange(e, "authorImage")} />
                        </>
                      )}
                    </div>
                    {errors.authorImage && <p className="text-red-500 text-[10px] font-bold mt-1 text-center w-32">{errors.authorImage}</p>}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Instructor Name <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Sneha Kapoor"
                      className={cn("h-12 rounded-2xl", errors.authorName && "border-red-500 focus-visible:ring-red-500")}
                      value={form.authorName}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, "");
                        setForm(prev => ({ ...prev, authorName: cleaned }));
                      }}
                    />
                    {errors.authorName && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.authorName}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Instructor Bio</Label>
                  <Textarea placeholder="Brief bio..." className="min-h-[150px] rounded-2xl" value={form.authorBio} onChange={(e) => setForm(prev => ({ ...prev, authorBio: e.target.value }))} />
                </div>
              </motion.div>
            )}

            {activeTab === "lessons" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto px-6 py-6 space-y-5 pb-32">
                {form.lessons.map((lesson, idx) => (
                  <div key={lesson.id} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative group/lesson overflow-hidden">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-900 text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lesson Detail</span>
                      </div>
                      <button onClick={() => removeLesson(lesson.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase">Lesson Video <span className="text-red-500">*</span></Label>
                          <div className={cn("relative group/vid aspect-video rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden", errors[`lesson_${lesson.id}_video`] && "border-red-500 bg-red-50")}>
                            {lesson.videoUrl ? (
                              <div className="relative w-full h-full group">
                                <video src={getFullUrl(lesson.videoUrl)} className="w-full h-full object-cover" controls={false} muted />
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateLesson(lesson.id, "videoUrl", null); updateLesson(lesson.id, "videoFile", null); }}
                                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Film size={24} className="text-slate-200" />
                                <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleVideoUpload(e, lesson.id)} />
                              </>
                            )}
                          </div>
                          {lesson.videoFile && <p className="text-[9px] text-primary font-medium mt-1 truncate">{lesson.videoFile.name}</p>}
                          {errors[`lesson_${lesson.id}_video`] && <p className="text-red-500 text-[9px] font-bold mt-1">{errors[`lesson_${lesson.id}_video`]}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase">Lesson Thumbnail <span className="text-red-500">*</span></Label>
                          <div className={cn("relative group/thumb aspect-video rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden", errors[`lesson_${lesson.id}_thumbnail`] && "border-red-500 bg-red-50")}>
                            {lesson.thumbnail ? (
                              <div className="relative w-full h-full">
                                <img src={getFullUrl(lesson.thumbnail)} className="w-full h-full object-cover" />
                                <button
                                  onClick={(e) => { e.stopPropagation(); updateLesson(lesson.id, "thumbnail", null); updateLesson(lesson.id, "thumbnailFile", null); }}
                                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <ImageIcon size={24} className="text-slate-200" />
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleImageChange(e, "lesson", lesson.id)} />
                              </>
                            )}
                          </div>
                          {errors[`lesson_${lesson.id}_thumbnail`] && <p className="text-red-500 text-[9px] font-bold mt-1">{errors[`lesson_${lesson.id}_thumbnail`]}</p>}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px_100px] gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Lesson Title <span className="text-red-500">*</span></Label>
                            <Input placeholder="Lesson Title" className={cn("h-10 rounded-xl text-sm", errors[`lesson_${lesson.id}_title`] && "border-red-500 focus-visible:ring-red-500")} value={lesson.title} onChange={(e) => updateLesson(lesson.id, "title", e.target.value)} />
                            {errors[`lesson_${lesson.id}_title`] && <p className="text-red-500 text-[9px] font-bold mt-1">{errors[`lesson_${lesson.id}_title`]}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Points</Label>
                            <Input type="number" className="h-10 rounded-xl text-sm" value={lesson.points} onChange={(e) => updateLesson(lesson.id, "points", parseInt(e.target.value))} />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase">Duration</Label>
                            <Input
                              placeholder="00:00"
                              readOnly
                              className="h-10 rounded-xl text-sm bg-slate-50 font-mono text-slate-500 cursor-not-allowed border-slate-100"
                              value={lesson.duration}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-500 uppercase">Description</Label>
                          <Input placeholder="Short description..." className="h-10 rounded-xl text-sm" value={lesson.description} onChange={(e) => updateLesson(lesson.id, "description", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-border flex gap-3 sticky bottom-0 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
            <Button variant="outline" className="flex-1 h-12 rounded-2xl font-bold border-slate-200" onClick={() => setDrawerOpen(false)}>Discard Changes</Button>
            {activeTab === "lessons" ? (
              <Button className="flex-1 h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : editingId ? "Update Training" : "Publish Training"}
              </Button>
            ) : (
              <Button className="flex-1 h-12 rounded-2xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => {
                if (activeTab === "basic") setActiveTab("author");
                else if (activeTab === "author") setActiveTab("lessons");
              }}>
                Next
              </Button>
            )}
          </div>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Training Course?"
        description="Are you sure you want to delete this course? This will remove all associated lessons and curriculum data permanently."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TrainingsPage;
