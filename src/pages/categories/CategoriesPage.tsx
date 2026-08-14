import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Layers, Loader2, AlertCircle } from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";


const CategoriesPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("main_categories", "create");
  const canEdit = hasPermission("main_categories", "edit");
  const canDelete = hasPermission("main_categories", "delete");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategoriesCount, setTotalCategoriesCount] = useState(0);
  const pageSize = 10;
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status update states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [categoryToUpdateStatus, setCategoryToUpdateStatus] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>("active");
  const [statusSaving, setStatusSaving] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    status: "active"
  });

  const fetchCategories = async (search: string = "", pageNum: number = 1, status: string = statusFilter) => {
    try {
      setLoading(true);
      const response = await api.get("/categories", {
        params: {
          search,
          type: "MAIN",
          limit: pageSize,
          page: pageNum - 1,
          status: status === "all" ? undefined : status
        }
      });
      setCategories(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
      setTotalCategoriesCount(response.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories(searchTerm, 1, statusFilter);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchCategories(searchTerm, p, statusFilter);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a category name",
        variant: "destructive"
      });
      return;
    }

    try {
      setFormLoading(true);
      if (editingId) {
        const response = await api.put(`/categories/${editingId}`, {
          name: formData.name,
          type: "MAIN",
          status: formData.status
        });
        toast({
          title: "Success",
          description: response.data?.message || "Category updated successfully",
          variant: "success"
        });
      } else {
        const response = await api.post("/categories", {
          name: formData.name,
          type: "MAIN",
          status: formData.status
        });
        toast({
          title: "Success",
          description: response.data?.message || "Category created successfully",
          variant: "success"
        });
      }
      setDrawerOpen(false);
      setEditingId(null);
      setFormData({ name: "", status: "active" });
      fetchCategories(searchTerm, page, statusFilter);
    } catch (error: any) {
      console.error("Failed to save category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save category",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      status: category.status?.toLowerCase() || (category.isActive ? "active" : "inactive")
    });
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      const response = await api.delete(`/categories/${categoryToDelete}`);
      toast({
        title: "Deleted",
        description: response.data?.message || "Category deleted successfully",
        variant: "success"
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories(searchTerm, page, statusFilter);
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete category";
      toast({
        title: "Error",
        description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!categoryToUpdateStatus) return;
    try {
      setStatusSaving(true);
      await api.put(`/categories/${categoryToUpdateStatus._id}`, { status: newStatus });
      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
        variant: "success"
      });
      fetchCategories(searchTerm, page, statusFilter);
      setStatusDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setStatusSaving(false);
    }
  };


  return (
    <div className="page-container relative min-h-[600px]">
      {loading && categories.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Mapping Main Categories..."
          subtitle="Synchronizing category hierarchy and relationships"
        />
      )}
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Main Categories</h1>
          </div>
        </div>

        {/* Search, Filters, Add - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-secondary/30 border-border">
              <Filter size={14} className="mr-1.5 text-muted-foreground/75" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
              onClick={() => setDrawerOpen(true)}
            >
              + Add Category
            </Button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && categories.length > 0 && <TableLoader text="Syncing Categories..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sub Category Count</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton rows={8} columns={5} />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c, index) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground font-semibold">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-center text-foreground font-semibold">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 text-primary font-semibold text-sm">
                        {c.subCategoryCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={c.status?.toLowerCase() === "active" || c.isActive ? "default" : "secondary"}
                        className={cn(
                          "cursor-pointer font-semibold transition-all active:scale-95",
                          c.status?.toLowerCase() === "active" || c.isActive
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                        )}
                        onClick={() => {
                          if (canEdit) {
                            setCategoryToUpdateStatus(c);
                            setNewStatus(c.status?.toLowerCase() === "active" || c.isActive ? "active" : "inactive");
                            setStatusDialogOpen(true);
                          }
                        }}
                      >
                        {c.status?.toLowerCase() === "active" || c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(c) : undefined}
                        onDelete={canDelete ? () => confirmDelete(c._id) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (editingId || categories.length > 0) && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
              totalItems={totalCategoriesCount}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </motion.div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ name: "", status: "active" });
          }
        }}
        title={editingId ? "Edit Category" : "Add Category"}
        description={editingId ? "Update category details" : "Create a new business category"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Category Name</label>
            <input
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter category name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Status</label>
            <select
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button
            className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-4"
            onClick={handleSave}
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Category
          </Button>
        </div>
      </FormDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Category?"
        description="This action cannot be undone. This will permanently delete the category and may affect associated items."
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmLabel="Delete Category"
      />

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="text-primary w-4 h-4" />
              </div>
              Update Category Status
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Change the status for <span className="font-semibold text-foreground">{categoryToUpdateStatus?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-11 rounded-xl bg-white border border-slate-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="rounded-xl border-border" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleUpdateStatus} disabled={statusSaving}>
              {statusSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoriesPage;

export const SubCategoriesPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("sub_categories", "create");
  const canEdit = hasPermission("sub_categories", "edit");
  const canDelete = hasPermission("sub_categories", "delete");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubCategoriesCount, setTotalSubCategoriesCount] = useState(0);
  const pageSize = 10;
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status update states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [subCatToUpdateStatus, setSubCatToUpdateStatus] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState<string>("active");
  const [statusSaving, setStatusSaving] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    parentCategory: "",
    status: "active"
  });

  const fetchParentCategories = async () => {
    try {
      const response = await api.get("/categories", {
        params: { type: "MAIN", limit: 100, page: 0, status: "active" }
      });
      // Axios response.data is the body. The body contains the 'data' array from pagination util.
      const list = response.data?.data || [];
      console.log("Fetched parent categories:", list);
      setParentCategories(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch parent categories:", error);
      setParentCategories([]);
    }
  };

  const fetchSubCategories = async (search: string = "", pageNum: number = 1, status: string = statusFilter) => {
    try {
      setLoading(true);
      const response = await api.get("/categories", {
        params: {
          search,
          type: "SUB",
          limit: pageSize,
          page: pageNum - 1,
          status: status === "all" ? undefined : status
        }
      });
      setSubCategories(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
      setTotalSubCategoriesCount(response.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch subcategories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubCategories(searchTerm, 1, statusFilter);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (drawerOpen) {
      fetchParentCategories();
    }
  }, [drawerOpen]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchSubCategories(searchTerm, p, statusFilter);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a sub-category name",
        variant: "destructive"
      });
      return;
    }
    if (!formData.parentCategory) {
      toast({
        title: "Validation Error",
        description: "Please select a parent category",
        variant: "destructive"
      });
      return;
    }

    try {
      setFormLoading(true);
      if (editingId) {
        const response = await api.put(`/categories/${editingId}`, {
          name: formData.name,
          type: "SUB",
          parentCategory: formData.parentCategory,
          status: formData.status
        });
        toast({
          title: "Success",
          description: response.data?.message || "Sub-category updated successfully",
          variant: "success"
        });
      } else {
        const response = await api.post("/categories", {
          name: formData.name,
          type: "SUB",
          parentCategory: formData.parentCategory,
          status: formData.status
        });
        toast({
          title: "Success",
          description: response.data?.message || "Sub-category created successfully",
          variant: "success"
        });
      }
      setDrawerOpen(false);
      setEditingId(null);
      setFormData({ name: "", parentCategory: "", status: "active" });
      fetchSubCategories(searchTerm, page, statusFilter);
    } catch (error: any) {
      console.error("Failed to save sub-category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save sub-category",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      parentCategory: typeof category.parentCategory === 'object' ? category.parentCategory._id : category.parentCategory,
      status: category.status?.toLowerCase() || (category.isActive ? "active" : "inactive")
    });
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      const response = await api.delete(`/categories/${categoryToDelete}`);
      toast({
        title: "Deleted",
        description: response.data?.message || "Sub-category deleted successfully",
        variant: "success"
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchSubCategories(searchTerm, page, statusFilter);
    } catch (error: any) {
      console.error("Failed to delete sub-category:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete sub-category";
      toast({
        title: "Error",
        description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!subCatToUpdateStatus) return;
    try {
      setStatusSaving(true);
      await api.put(`/categories/${subCatToUpdateStatus._id}`, { status: newStatus });
      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
        variant: "success"
      });
      fetchSubCategories(searchTerm, page, statusFilter);
      setStatusDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setStatusSaving(false);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && subCategories.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Mapping Sub-Categories..."
          subtitle="Synchronizing sub-category tree and hierarchy"
        />
      )}
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Sub Categories</h1>
          </div>
        </div>

        {/* Search, Filters, Add - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search sub categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-secondary/30 border-border">
              <Filter size={14} className="mr-1.5 text-muted-foreground/75" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
              onClick={() => setDrawerOpen(true)}
            >
              + Add Sub Category
            </Button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && subCategories.length > 0 && <TableLoader text="Syncing Sub Categories..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sub Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parent Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && subCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton rows={8} columns={5} />
                  </td>
                </tr>
              ) : subCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No subcategories found.
                  </td>
                </tr>
              ) : (
                subCategories.map((c, index) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground font-semibold">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {c.parentCategory?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={c.status?.toLowerCase() === "active" || c.isActive ? "default" : "secondary"}
                        className={cn(
                          "cursor-pointer font-semibold transition-all active:scale-95",
                          c.status?.toLowerCase() === "active" || c.isActive
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                        )}
                        onClick={() => {
                          if (canEdit) {
                            setSubCatToUpdateStatus(c);
                            setNewStatus(c.status?.toLowerCase() === "active" || c.isActive ? "active" : "inactive");
                            setStatusDialogOpen(true);
                          }
                        }}
                      >
                        {c.status?.toLowerCase() === "active" || c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(c) : undefined}
                        onDelete={canDelete ? () => confirmDelete(c._id) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (editingId || subCategories.length > 0) && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
              totalItems={totalSubCategoriesCount}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </motion.div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ name: "", parentCategory: "", status: "active" });
          }
        }}
        title={editingId ? "Edit Sub Category" : "Add Sub Category"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Sub Category Name</label>
            <input
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Parent Category</label>
            <select
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={formData.parentCategory}
              onChange={(e) => setFormData({ ...formData, parentCategory: e.target.value })}
            >
              <option value="">Select Category</option>
              {parentCategories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Status</label>
            <select
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button
            className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-4"
            onClick={handleSave}
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Sub Category
          </Button>
        </div>
      </FormDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Sub Category?"
        description="This action cannot be undone. This will permanently delete the sub-category."
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmLabel="Delete Sub Category"
      />

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="text-primary w-4 h-4" />
              </div>
              Update Sub Category Status
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Change the status for <span className="font-semibold text-foreground">{subCatToUpdateStatus?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-11 rounded-xl bg-white border border-slate-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" className="rounded-xl border-border" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleUpdateStatus} disabled={statusSaving}>
              {statusSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
