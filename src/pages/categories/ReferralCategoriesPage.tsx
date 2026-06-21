import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, UserPlus, Loader2, AlertCircle } from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";

export const ReferralCategoriesPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("referral_categories", "create");
  const canEdit = hasPermission("referral_categories", "edit");
  const canDelete = hasPermission("referral_categories", "delete");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [availableSubCategories, setAvailableSubCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    subCategories: [] as string[],
    referralParent: "",
    status: "active"
  });

  const fetchParentCategories = async () => {
    try {
      const response = await api.get("/categories", {
        params: { type: "MAIN", limit: 100, page: 0, status: "active" }
      });
      const list = response.data?.data || [];
      setParentCategories(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch parent categories:", error);
    }
  };

  const fetchAvailableSubCategories = async () => {
    try {
      const response = await api.get("/categories", {
        params: { type: "REFERRAL", limit: 100, page: 0, status: "active" }
      });
      const list = response.data?.data || [];
      setAvailableSubCategories(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("Failed to fetch available sub categories:", error);
    }
  };

  const fetchCategories = async (search: string = "", pageNum: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get("/referral-categories", {
        params: {
          search,
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
      fetchAvailableSubCategories();
    }
  }, [drawerOpen]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchCategories(searchTerm, p);
  };

  const handleSave = async () => {
    if (formData.subCategories.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one sub category",
        variant: "destructive"
      });
      return;
    }
    if (!formData.referralParent) {
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
        if (!formData.subCategories.includes(editingId)) {
          // Unlink the old subcategory mapping
          await api.delete(`/referral-categories/${editingId}`);
        }
        // Update / link all selected subcategories
        await Promise.all(
          formData.subCategories.map((subId) =>
            api.put(`/categories/${subId}`, {
              referralParent: formData.referralParent,
              status: formData.status
            })
          )
        );
      } else {
        // Use the new batch assignment endpoint
        await api.post("/referral-categories", {
          subCategory: formData.subCategories.join(","),
          refferalCategory: formData.referralParent
        });
      }

      toast({
        title: "Success",
        description: editingId ? "Referral category updated successfully" : "Referral categories assigned successfully",
        variant: "success"
      });

      setDrawerOpen(false);
      setEditingId(null);
      setFormData({ subCategories: [], referralParent: "", status: "active" });
      fetchCategories(searchTerm, page);
    } catch (error: any) {
      console.error("Failed to save referral category:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save referral category",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (category: any) => {
    setEditingId(category._id);
    setFormData({
      subCategories: [category._id],
      referralParent: typeof category.referralParent === 'object' ? category.referralParent._id : category.referralParent,
      status: category.status?.toLowerCase() || (category.isActive ? "active" : "inactive")
    });
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsDeleting(true);
      // Use the referral-categories endpoint to unlink
      const response = await api.delete(`/referral-categories/${categoryToDelete}`);
      toast({
        title: "Deleted",
        description: response.data?.message || "Referral category deleted successfully",
        variant: "success"
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories(searchTerm, page);
    } catch (error: any) {
      console.error("Failed to delete referral category:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete referral category";
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

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && categories.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Mapping Referral Categories..."
          subtitle="Connecting referral paths and member nodes"
        />
      )}
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

          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
              onClick={() => setDrawerOpen(true)}
            >
              + Add Referral Category
            </Button>
          )}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden relative">
        {loading && categories.length > 0 && <TableLoader text="Syncing Referral Categories..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subcategory</th>
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
                    No referral categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c, index) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground font-semibold">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {c.referralParent?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {c.name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status?.toLowerCase() === "active" || c.isActive ? "Active" : "Inactive"} />
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
            setFormData({ subCategories: [], referralParent: "", status: "active" });
          }
        }}
        title={editingId ? "Edit Referral Category" : "Add Referral Category"}
      >
        <div className="space-y-6 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground ml-1">Parent Category</Label>
            <select
              className="w-full px-3 h-11 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all appearance-none cursor-pointer"
              value={formData.referralParent}
              onChange={(e) => setFormData({ ...formData, referralParent: e.target.value })}
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
            >
              <option value="">Select Category</option>
              {parentCategories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground ml-1">Sub Category Name</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full justify-between rounded-xl border-[#cbd5e1] bg-[#f8fafc] h-11 px-4 text-sm font-medium !text-[#1e293b] hover:bg-[#f1f5f9] transition-all shadow-sm",
                    formData.subCategories.length === 0 && "!text-[#64748b]"
                  )}
                >
                  {formData.subCategories.length > 0
                    ? (formData.subCategories.length === 1
                        ? (categories.find(c => c._id === formData.subCategories[0])?.name || availableSubCategories.find(c => c._id === formData.subCategories[0])?.name || "Selected Sub Category")
                        : `${formData.subCategories.length} categories selected`)
                    : "Select Sub Category"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border border-[#cbd5e1] bg-white overflow-hidden shadow-xl"
                align="start"
                sideOffset={4}
              >
                <Command className="bg-white">
                  <CommandInput placeholder="Search sub categories..." className="h-10 border-none focus:ring-0 px-4 text-[#1e293b]" />
                  <CommandList className="max-h-[250px] scrollbar-thin">
                    <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">No sub category found.</CommandEmpty>
                    <CommandGroup className="p-0">
                      {(() => {
                        const currentlyEditingCategory = editingId ? categories.find(c => c._id === editingId) : null;
                        const dropdownList = [...availableSubCategories];
                        if (currentlyEditingCategory && !dropdownList.some(c => c._id === currentlyEditingCategory._id)) {
                          dropdownList.unshift(currentlyEditingCategory);
                        }
                        return dropdownList.map((category) => {
                          const isSelected = formData.subCategories.includes(category._id);
                          return (
                            <CommandItem
                              key={category._id}
                              value={category.name}
                              onSelect={() => {
                                const newSelection = isSelected
                                  ? formData.subCategories.filter(id => id !== category._id)
                                  : [...formData.subCategories, category._id];
                                setFormData({ ...formData, subCategories: newSelection });
                              }}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#f1f5f9] last:border-0",
                                isSelected
                                  ? "bg-[#2563eb] text-white !data-[selected=true]:bg-[#2563eb] !data-[selected=true]:text-white"
                                  : "text-[#1e293b] data-[selected=true]:bg-[#f8fafc] data-[selected=true]:text-[#2563eb]"
                              )}
                            >
                              <div className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                                isSelected
                                  ? "border-white bg-white"
                                  : "border-[#cbd5e1] bg-white"
                              )}>
                                {isSelected && (
                                  <div className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                                )}
                              </div>
                              <span className="flex-grow text-[13px] font-medium leading-none">{category.name}</span>
                            </CommandItem>
                          );
                        });
                      })()}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground ml-1">Status</Label>
            <select
              className="w-full px-3 h-11 rounded-xl border border-[#cbd5e1] bg-[#f8fafc] text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all appearance-none cursor-pointer"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748b\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button
            className="w-full h-11 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold mt-4 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            onClick={handleSave}
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Referral Category
          </Button>
        </div>
      </FormDrawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Referral Category?"
        description="This action cannot be undone. This will permanently delete the referral category."
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmLabel="Delete Referral Category"
      />
    </div>
  );
};

export default ReferralCategoriesPage;
