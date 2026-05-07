import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, UserPlus, Loader2, AlertCircle } from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import PremiumLoader from "@/components/common/PremiumLoader";
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

export const ReferralCategoriesPage = () => {
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
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    referralParent: "",
    status: "active"
  });

  const fetchParentCategories = async () => {
    try {
      const response = await api.get("/categories", {
        params: { type: "MAIN", limit: 100, page: 0 }
      });
      const list = response.data?.data || [];
      setParentCategories(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch parent categories:", error);
    }
  };

  const fetchCategories = async (search: string = "", pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get("/categories", {
        params: {
          search,
          type: "REFERRAL",
          limit: pageSize,
          page: pageNum - 1
        }
      });
      setCategories(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch referral categories:", error);
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

  useEffect(() => {
    if (drawerOpen) {
      fetchParentCategories();
    }
  }, [drawerOpen]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchCategories(searchTerm, p);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a referral category name");
      return;
    }
    if (!formData.referralParent) {
      toast.error("Please select a parent category");
      return;
    }

    try {
      setFormLoading(true);
      if (editingId) {
        await api.put(`/categories/${editingId}`, {
          name: formData.name,
          type: "REFERRAL",
          referralParent: formData.referralParent,
          status: formData.status
        });
        toast.success("Referral category updated successfully");
      } else {
        await api.post("/categories", {
          name: formData.name,
          type: "REFERRAL",
          referralParent: formData.referralParent,
          status: formData.status
        });
        toast.success("Referral category created successfully");
      }
      setDrawerOpen(false);
      setEditingId(null);
      setFormData({ name: "", referralParent: "", status: "active" });
      fetchCategories(searchTerm, page);
    } catch (error: any) {
      console.error("Failed to save referral category:", error);
      toast.error(error.response?.data?.message || "Failed to save referral category");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      referralParent: typeof category.referralParent === 'object' ? category.referralParent._id : category.referralParent,
      status: category.status?.toLowerCase() || (category.isActive ? "active" : "inactive")
    });
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await api.delete(`/categories/${categoryToDelete}`);
      toast.success("Referral category deleted successfully");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories(searchTerm, page);
    } catch (error: any) {
      console.error("Failed to delete referral category:", error);
      toast.error(error.response?.data?.message || "Failed to delete referral category");
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
            <UserPlus size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Referral Categories</h1>
          </div>
        </div>

        {/* Search, Filters, Add - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search referral categories..."
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
            + Add Referral Category
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Referral Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parent Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20">
                    <PremiumLoader variant="centered" style="network" text="Fetching Referral Categories..." />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No referral categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {c.referralParent?.name || "N/A"}
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
            setFormData({ name: "", referralParent: "", status: "active" });
          }
        }} 
        title={editingId ? "Edit Referral Category" : "Add Referral Category"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Referral Category Name</label>
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
              value={formData.referralParent}
              onChange={(e) => setFormData({ ...formData, referralParent: e.target.value })}
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
            Save Referral Category
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
              This action cannot be undone. This will permanently delete the referral category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
            >
              Delete Referral Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReferralCategoriesPage;
