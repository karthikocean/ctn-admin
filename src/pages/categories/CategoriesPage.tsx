import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Layers, Loader2, AlertCircle } from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import PremiumLoader from "@/components/common/PremiumLoader";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CategoriesPage = () => {
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    status: "active"
  });

  const fetchCategories = async (search: string = "", pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get("/categories", {
        params: {
          search,
          type: "MAIN",
          limit: pageSize,
          page: pageNum - 1
        }
      });
      setCategories(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories(searchTerm, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchCategories(searchTerm, p);
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
      fetchCategories(searchTerm, page);
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
      const response = await api.delete(`/categories/${categoryToDelete}`);
      toast({
        title: "Deleted",
        description: response.data?.message || "Category deleted successfully",
        variant: "success"
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories(searchTerm, page);
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete category";
      toast({
        title: "Error",
        description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
        variant: "destructive"
      });
    }
  };

  const confirmDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };


  return (
    <div className="page-container">
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

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
            onClick={() => setDrawerOpen(true)}
          >
            + Add Category
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && categories.length > 0 && <TableLoader text="Syncing Categories..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sub Category Count</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Referral Count</th>
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
                categories.map((c) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 text-primary font-bold text-xs">
                        {c.subCategoryCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/5 text-emerald-600 font-bold text-xs border border-emerald-500/10">
                        {c.referralCount || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status?.toLowerCase() === "active" || c.isActive ? "Active" : "Inactive"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={() => handleEdit(c)}
                        onDelete={() => confirmDelete(c._id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (editingId || categories.length > 0) && (
          <div className="px-6 py-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="text-destructive w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category and may affect associated items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CategoriesPage;

export const SubCategoriesPage = () => {
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

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
        params: { type: "MAIN", limit: 100, page: 0 }
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

  const fetchSubCategories = async (search: string = "", pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get("/categories", {
        params: {
          search,
          type: "SUB",
          limit: pageSize,
          page: pageNum - 1
        }
      });
      setSubCategories(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch subcategories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubCategories(searchTerm, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (drawerOpen) {
      fetchParentCategories();
    }
  }, [drawerOpen]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchSubCategories(searchTerm, p);
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
      fetchSubCategories(searchTerm, page);
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
      const response = await api.delete(`/categories/${categoryToDelete}`);
      toast({
        title: "Deleted",
        description: response.data?.message || "Sub-category deleted successfully",
        variant: "success"
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchSubCategories(searchTerm, page);
    } catch (error: any) {
      console.error("Failed to delete sub-category:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete sub-category";
      toast({
        title: "Error",
        description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
        variant: "destructive"
      });
    }
  };

  const confirmDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="page-container">
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

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
            onClick={() => setDrawerOpen(true)}
          >
            + Add Sub Category
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && subCategories.length > 0 && <TableLoader text="Syncing Sub Categories..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sub Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parent Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && subCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <TableSkeleton rows={8} columns={4} />
                  </td>
                </tr>
              ) : subCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No subcategories found.
                  </td>
                </tr>
              ) : (
                subCategories.map((c) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {c.parentCategory?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status?.toLowerCase() === "active" || c.isActive ? "Active" : "Inactive"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={() => handleEdit(c)}
                        onDelete={() => confirmDelete(c._id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (editingId || subCategories.length > 0) && (
          <div className="px-6 py-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="text-destructive w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the sub-category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
            >
              Delete Sub-category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
