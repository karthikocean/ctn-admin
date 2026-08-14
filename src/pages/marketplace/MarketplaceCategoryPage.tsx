import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Loader2, ShoppingBag, X } from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import StatusBadge from "@/components/common/StatusBadge";
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
  getMarketplaceCategories,
  createMarketplaceCategory,
  updateMarketplaceCategory,
  updateMarketplaceCategoryStatus,
  deleteMarketplaceCategory,
} from "@/api/MarketplaceCategoryApi";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MarketplaceCategory {
  _id: string;
  name: string;
  status: "active" | "inactive";
  createdAt: string;
}

const MarketplaceCategoryPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission("marketplace_category", "create");
  const canEdit = hasPermission("marketplace_category", "edit");
  const canDelete = hasPermission("marketplace_category", "delete");

  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategoriesCount, setTotalCategoriesCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [editingCategory, setEditingCategory] = useState<MarketplaceCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryStatus, setCategoryStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);

  // Status update states
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [categoryToUpdateStatus, setCategoryToUpdateStatus] = useState<MarketplaceCategory | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<"active" | "inactive">("active");
  const [statusSubmitLoading, setStatusSubmitLoading] = useState(false);

  const fetchCategories = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await getMarketplaceCategories({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setCategories(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalCategoriesCount(data.total || data.totalItems || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      if (showLoader) setLoading(false);
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

  const handleEdit = (category: MarketplaceCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryStatus(category.status);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a Category Name",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await updateMarketplaceCategory(editingCategory._id, {
          name: categoryName.trim(),
          status: categoryStatus,
        });
        toast({ title: "Updated", description: "Category updated successfully", variant: "success" });
      } else {
        await createMarketplaceCategory({
          name: categoryName.trim(),
          status: categoryStatus,
        });
        toast({ title: "Created", description: "Category created successfully", variant: "success" });
      }
      fetchCategories();
      setDrawerOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!categoryToUpdateStatus) return;
    setStatusSubmitLoading(true);
    setStatusUpdatingId(categoryToUpdateStatus._id);
    try {
      const newIsActive = newStatusValue === "active";
      await updateMarketplaceCategoryStatus(categoryToUpdateStatus._id, newIsActive);
      toast({
        title: "Status Updated",
        description: `Category marked as ${newIsActive ? "Active" : "Inactive"}`,
        variant: "success",
      });
      fetchCategories(false);
      setStatusDialogOpen(false);
      setCategoryToUpdateStatus(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setStatusSubmitLoading(false);
      setStatusUpdatingId(null);
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
      await deleteMarketplaceCategory(categoryToDelete);
      toast({
        title: "Deleted",
        description: "Category deleted successfully",
        variant: "success",
      });
      fetchCategories();
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && categories.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Marketplace Categories..."
          subtitle="Fetching marketplace category data"
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShoppingBag size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Marketplace Categories</h1>
          </div>
        </div>

        {/* Controls */}
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

          {/* Status Filter */}
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

          {/* Add Button */}
          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={handleOpenAdd}
            >
              + Add Category
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && categories.length > 0 && <TableLoader text="Syncing Categories..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created At</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton rows={10} columns={5} />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No marketplace categories found. Click "+ Add Category" to create one.
                  </td>
                </tr>
              ) : (
                categories.map((c, index) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {page * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {c.name}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={c.status === "active" ? "default" : "secondary"}
                        className={
                          c.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 cursor-pointer"
                            : "bg-muted/50 text-muted-foreground cursor-pointer"
                        }
                        onClick={() => {
                          if (canEdit) {
                            setCategoryToUpdateStatus(c);
                            setNewStatusValue(c.status);
                            setStatusDialogOpen(true);
                          }
                        }}
                      >
                        {statusUpdatingId === c._id ? (
                          <Loader2 size={10} className="animate-spin mr-1" />
                        ) : null}
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {new Date(c.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
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
            totalItems={totalCategoriesCount}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      </motion.div>

      {/* Add / Edit Drawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingCategory ? "Edit Marketplace Category" : "Add Marketplace Category"}
        description={
          editingCategory
            ? "Update the marketplace category details below."
            : "Create a new category for the marketplace."
        }
      >
        <div className="space-y-5 px-1.5 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Category Name
            </label>
            <Input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Electronics"
              className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Status
            </label>
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
                Saving...
              </>
            ) : editingCategory ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </Button>
        </div>
      </FormDrawer>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Marketplace Category?"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
      />

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="rounded-3xl border-border bg-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Update Category Status</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Select the new status for <strong>{categoryToUpdateStatus?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Status
              </label>
              <Select
                value={newStatusValue}
                onValueChange={(val: "active" | "inactive") => setNewStatusValue(val)}
              >
                <SelectTrigger className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20 text-xs font-semibold">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-10 text-xs font-semibold"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-xs font-bold shadow-lg shadow-primary/20"
              onClick={handleConfirmStatusUpdate}
              disabled={statusSubmitLoading}
            >
              {statusSubmitLoading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketplaceCategoryPage;

