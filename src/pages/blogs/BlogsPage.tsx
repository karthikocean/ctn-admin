import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Loader2,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Pencil,
  Trash2,
  Calendar,
  Globe
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
import { getBlogs, createBlog, updateBlog, deleteBlog, getBlogDetails } from "@/api/BlogsApi";
import { uploadFiles } from "@/api/MediaApi";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import RichTextEditor from "@/components/common/RichTextEditor";

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_MEDIA_URL || "http://localhost:5001";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word characters
    .replace(/-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

const BlogsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("blogs", "create");
  const canEdit = hasPermission("blogs", "edit");
  const canDelete = hasPermission("blogs", "delete");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogsCount, setTotalBlogsCount] = useState(0);
  const isMounted = useRef(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    publishDate: "",
    status: "active",
    images: [] as string[],
    metaTitle: "",
    metaKeywords: "",
    metaDescription: "",
    shortDescription: "",
    description: ""
  });

  const [newImages, setNewImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isAutoSlug = useRef(true);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const result = await getBlogs({ page: page - 1, limit: 9, search: searchQuery });
      setBlogs(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalBlogsCount(result.total || result.totalItems || 0);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
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
        fetchBlogs();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [id]: value };
      if (id === "title" && isAutoSlug.current) {
        updated.slug = slugify(value);
      }
      return updated;
    });
    if (id === "slug") {
      isAutoSlug.current = value === "" || value === slugify(formData.title);
    }
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: "" }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...filesArray]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.slug) newErrors.slug = "Slug is required";
    if (!formData.publishDate) newErrors.publishDate = "Publish Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      publishDate: "",
      status: "active",
      images: [],
      metaTitle: "",
      metaKeywords: "",
      metaDescription: "",
      shortDescription: "",
      description: ""
    });
    setNewImages([]);
    setEditingId(null);
    setErrors({});
    isAutoSlug.current = true;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedUrls: string[] = [];

      // 1. Upload files if any
      if (newImages.length > 0) {
        const uploadRes = await uploadFiles(newImages, "blogs");
        if (uploadRes.success) {
          uploadedUrls = uploadRes.data.map((item: any) => item.url);
        }
      }

      const payload = {
        ...formData,
        images: [...formData.images, ...uploadedUrls]
      };

      // 2. Save Data
      let result;
      if (editingId) {
        result = await updateBlog(editingId, payload);
      } else {
        result = await createBlog(payload);
      }

      toast({
        title: "Success",
        description: result.message || "Blog saved successfully",
        variant: "success"
      });
      setDrawerOpen(false);
      resetForm();
      fetchBlogs();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to save blog", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await deleteBlog(deletingId);
      toast({
        title: "Deleted",
        description: res.message || "Blog deleted successfully",
        variant: "success"
      });
      fetchBlogs();
      setDeleteConfirmOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete blog",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleEdit = async (blogItem: any) => {
    setIsLoading(true);
    setErrors({});
    setNewImages([]);
    try {
      const result = await getBlogDetails(blogItem._id);
      if (result.success || result.status === 200) {
        const data = result.data;
        setEditingId(data._id);
        setFormData({
          title: data.title,
          slug: data.slug,
          publishDate: data.publishDate ? data.publishDate.split("T")[0] : "",
          status: data.status,
          images: data.images || [],
          metaTitle: data.metaTitle || "",
          metaKeywords: data.metaKeywords || "",
          metaDescription: data.metaDescription || "",
          shortDescription: data.shortDescription || "",
          description: data.description || ""
        });
        isAutoSlug.current = data.slug === slugify(data.title);
        setDrawerOpen(true);
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch blog details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {isLoading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Synchronizing Blogs..."
          subtitle="Establishing secure connection to blog database"
        />
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Blogs</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative mr-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search blogs..."
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
              + New Blog
            </Button>
          )}
        </div>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1">
        {blogs.length === 0 ? (
          <div className="py-20 text-center glass-card">
            <FileText size={48} className="mx-auto text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">No blogs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blogs.map((b, i) => (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card overflow-hidden flex flex-col group hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 border-slate-100"
              >
                <div className="h-32 bg-secondary/30 relative overflow-hidden flex items-center justify-center">
                  {b.images && b.images.length > 0 ? (
                    <img src={getFullUrl(b.images[0])} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <FileText size={40} className="text-primary/10" />
                  )}
                  <div className="absolute top-2.5 right-2.5 shadow-sm">
                    <StatusBadge status={b.status} />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-slate-800 line-clamp-1 text-[15px] group-hover:text-primary transition-colors leading-tight">{b.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 min-h-[1.5rem] leading-relaxed opacity-80">
                    {b.shortDescription || "No short description provided."}
                  </p>

                  <div className="mt-2.5 grid grid-cols-2 gap-y-2.5 gap-x-2 border-t border-slate-50 pt-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Publish Date</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                        <Calendar size={12} className="text-primary/60" />
                        {new Date(b.publishDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Slug</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 truncate">
                        <Globe size={12} className="text-indigo-500/60" />
                        <span className="truncate">{b.slug}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100/50">
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg flex-1 text-xs h-8 font-bold border-slate-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => handleEdit(b)}
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
                          setDeletingId(b._id);
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

      {/* Pagination */}
      {!isLoading && blogs.length > 0 && (
        <div className="flex-shrink-0 pt-1 border-t border-border bg-background/80 backdrop-blur-sm z-10">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalBlogsCount}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => { setDrawerOpen(open); if (!open) resetForm(); }}
        title={editingId ? "Edit Blog" : "Create Blog"}
        description="Fill in the details to publish a blog post"
      >
        <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6 overflow-y-auto">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-600">Title <span className="text-red-500">*</span></Label>
            <Input id="title" value={formData.title} onChange={handleInputChange} placeholder="Blog title" className={`h-11 ${errors.title ? "border-red-500" : ""}`} />
            {errors.title && <p className="text-[10px] text-red-500 font-bold">{errors.title}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-wider text-slate-600">Slug <span className="text-red-500">*</span></Label>
            <Input id="slug" value={formData.slug} onChange={handleInputChange} placeholder="blog-url-slug" className={`h-11 ${errors.slug ? "border-red-500" : ""}`} />
            {errors.slug && <p className="text-[10px] text-red-500 font-bold">{errors.slug}</p>}
          </div>

          {/* Publish Date */}
          <div className="space-y-2">
            <Label htmlFor="publishDate" className="text-xs font-bold uppercase tracking-wider text-slate-600">Publish Date <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input type="date" id="publishDate" value={formData.publishDate} onChange={handleInputChange} className={`h-11 pr-10 ${errors.publishDate ? "border-red-500" : ""}`} />
              <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {errors.publishDate && <p className="text-[10px] text-red-500 font-bold">{errors.publishDate}</p>}
          </div>

          {/* Images Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Blog Images</Label>
            <div className="relative group">
              <Input
                type="file"
                accept="image/*"
                multiple
                className="h-11 cursor-pointer"
                onChange={handleFileChange}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors pointer-events-none">
                <ImageIcon size={18} />
              </div>
            </div>

            {/* Previews */}
            <div className="flex flex-wrap gap-3 mt-3">
              {/* Existing Images */}
              {formData.images.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-sm">
                  <img src={getFullUrl(url)} alt="blog-existing" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-all z-10"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </div>
              ))}

              {/* Newly selected images */}
              {newImages.map((file, idx) => {
                const previewUrl = URL.createObjectURL(file);
                return (
                  <div key={`new-${idx}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shadow-sm">
                    <img src={previewUrl} alt="blog-new" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-all z-10"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meta Information Accordion/Section */}
          <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider">SEO Meta Tags</h4>
            
            <div className="space-y-2">
              <Label htmlFor="metaTitle" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Meta Title</Label>
              <Input id="metaTitle" value={formData.metaTitle} onChange={handleInputChange} placeholder="SEO Meta Title" className="h-10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaKeywords" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Meta Keywords</Label>
              <Input id="metaKeywords" value={formData.metaKeywords} onChange={handleInputChange} placeholder="keyword1, keyword2, keyword3" className="h-10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Meta Description</Label>
              <Textarea id="metaDescription" value={formData.metaDescription} onChange={handleInputChange} placeholder="SEO Meta Description..." className="min-h-[60px]" />
            </div>
          </div>

          {/* Blog Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription" className="text-xs font-bold uppercase tracking-wider text-slate-600">Blog Short Description</Label>
            <Textarea id="shortDescription" value={formData.shortDescription} onChange={handleInputChange} placeholder="Brief summary of the blog post..." className="min-h-[80px]" />
          </div>

          {/* Full Description (Rich Text Editor) */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-600">Description</Label>
            <RichTextEditor value={formData.description} onChange={handleDescriptionChange} />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-slate-600">Status</Label>
            <select id="status" value={formData.status} onChange={handleInputChange} className="w-full h-11 px-3 rounded-md border border-input bg-background text-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex gap-3 pb-10">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
              {editingId ? "Update Blog" : "Save Blog"}
            </Button>
          </div>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete "${blogs.find(b => b._id === deletingId)?.title || 'Blog'}"?`}
        description="Are you sure you want to delete this blog? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default BlogsPage;
