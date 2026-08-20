import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Loader2, GraduationCap, X } from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  getTrainingCategories,
  createTrainingCategory,
  updateTrainingCategory,
  deleteTrainingCategory
} from "@/api/TrainingCategoryApi";
import { getTrainings } from "@/api/TrainingApi";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

interface TrainingCategory {
  _id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
}

const TrainingCategoriesPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  // Reusing trainings permission module for category management
  const canCreate = hasPermission("trainings", "create");
  const canEdit = hasPermission("trainings", "edit");
  const canDelete = hasPermission("trainings", "delete");

  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [editingCategory, setEditingCategory] = useState<TrainingCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryStatus, setCategoryStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getTrainingCategories({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter
      });
      setCategories(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalCategories(data.total || data.totalItems || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch categories",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, searchTerm, statusFilter]);


  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryStatus("active");
    setDrawerOpen(true);
  };

  const handleEdit = (category: TrainingCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryStatus(category.status);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter Category Name",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        // Validate if attempting to deactivate a category that has active trainings
        if (categoryStatus === "inactive" && editingCategory.status !== "inactive") {
          try {
            const trainingsRes = await getTrainings({ limit: 1000, status: "active" });
            const activeTrainings = trainingsRes.data || trainingsRes || [];
            const hasActiveTraining = Array.isArray(activeTrainings) && activeTrainings.some((t: any) => {
              const catId = t.categoryId || t.category?._id || t.category?.id;
              return catId === editingCategory._id || String(catId) === String(editingCategory._id);
            });

            if (hasActiveTraining) {
              toast({
                title: "Cannot Deactivate Category",
                description: "Cannot deactivate this category because it contains active trainings. Please deactivate or reassign the trainings first.",
                variant: "destructive"
              });
              setSaving(false);
              return;
            }
          } catch (verifyErr) {
            console.error("Error verifying active trainings:", verifyErr);
          }
        }

        await updateTrainingCategory(editingCategory._id, {
          name: categoryName.trim(),
          status: categoryStatus
        });
        toast({ title: "Updated", description: "Category updated successfully", variant: "success" });
      } else {
        await createTrainingCategory({
          name: categoryName.trim(),
          status: categoryStatus
        });
        toast({ title: "Created", description: "Category created successfully", variant: "success" });
      }
      fetchCategories();
      setDrawerOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save category",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      // Validate if attempting to delete a category that has active trainings
      try {
        const trainingsRes = await getTrainings({ limit: 1000, status: "active" });
        const activeTrainings = trainingsRes.data || trainingsRes || [];
        const hasActiveTraining = Array.isArray(activeTrainings) && activeTrainings.some((t: any) => {
          const catId = t.categoryId || t.category?._id || t.category?.id;
          return catId === categoryToDelete || String(catId) === String(categoryToDelete);
        });

        if (hasActiveTraining) {
          toast({
            title: "Cannot Delete Category",
            description: "Cannot delete this category because it contains active trainings. Please delete or reassign the trainings first.",
            variant: "destructive"
          });
          setIsDeleting(false);
          setDeleteDialogOpen(false);
          setCategoryToDelete(null);
          return;
        }
      } catch (verifyErr) {
        console.error("Error verifying active trainings:", verifyErr);
      }

      await deleteTrainingCategory(categoryToDelete);
      toast({
        title: "Deleted",
        description: "Category deleted successfully",
        variant: "success"
      });
      fetchCategories();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete category",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Categories..."
          subtitle="Synchronizing training curriculum categories"
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Training Categories</h1>
          </div>
        </div>

        {/* Search, Filters, Add */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Filters */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-background border-border">
              <Filter size={14} className="mr-1.5" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Add Category */}
          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={handleOpenAdd}
            >
              + Add Training Category
            </Button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.length === 0 && !loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((c, index) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{(page * 10) + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{c.name}</td>
                    <td className="px-6 py-4">
                      <Badge variant={c.status === "active" ? "default" : "secondary"} className={c.status === "active" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : "bg-muted/50 text-muted-foreground"}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(c) : undefined}
                        onDelete={canDelete ? () => handleDeleteClick(c._id) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4 border-t border-border">
          <PaginationBar
            currentPage={page + 1}
            totalPages={totalPages}
            totalItems={totalCategories}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      </motion.div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingCategory ? "Edit Training Category" : "Add Training Category"}
        description={editingCategory ? "Update training category details" : "Create a new category for training syllabus"}
      >
        <div className="space-y-5 px-1.5 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category Name</label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Sales Training"
              className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
            <Select
              value={categoryStatus}
              onValueChange={(val: "active" | "inactive") => setCategoryStatus(val)}
            >
              <SelectTrigger className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 mt-6 shadow-lg shadow-primary/20 font-bold text-sm tracking-wide transition-all active:scale-[0.98]"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Category...
              </>
            ) : (
              editingCategory ? "Update Category" : "Create Category"
            )}
          </Button>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Training Category?"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default TrainingCategoriesPage;
