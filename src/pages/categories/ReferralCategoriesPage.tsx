import { useEffect, useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SubCategoryCell = ({ subCategories }: { subCategories: any[] }) => {
  if (subCategories.length <= 2) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {subCategories.map((sub) => (
          <span
            key={sub._id}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
          >
            {sub.name}
          </span>
        ))}
      </div>
    );
  }

  const visibleSubs = subCategories.slice(0, 2);
  const remainingCount = subCategories.length - 2;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleSubs.map((sub) => (
        <span
          key={sub._id}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
        >
          {sub.name}
        </span>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 py-0 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/20 hover:text-primary rounded-full transition-all"
          >
            +{remainingCount} more
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 rounded-xl border border-border bg-white text-foreground shadow-xl">
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-muted-foreground border-b pb-1">
              Subcategories ({subCategories.length})
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pt-1">
              {subCategories.map((sub) => (
                <span
                  key={sub._id}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border"
                >
                  {sub.name}
                </span>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

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
  const pageSize = 10;
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [originalSubCategoryIds, setOriginalSubCategoryIds] = useState<string[]>([]);
  const [subCategoryIdsToDelete, setSubCategoryIdsToDelete] = useState<string[]>([]);

  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [availableSubCategories, setAvailableSubCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    subCategories: [] as string[],
    referralParent: "",
    status: "active"
  });

  const groupedCategories = useMemo(() => {
    return categories.reduce((acc: any[], current: any) => {
      const parentId = current.referralParent?._id || "unassigned";
      let group = acc.find((g) => g.referralParent?._id === parentId);
      if (!group) {
        group = {
          _id: parentId,
          referralParent: current.referralParent,
          subCategories: [],
        };
        acc.push(group);
      }
      group.subCategories.push(current);
      return acc;
    }, []);
  }, [categories]);

  const totalPages = Math.ceil(groupedCategories.length / pageSize);

  const displayedGroupedCategories = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return groupedCategories.slice(start, end);
  }, [groupedCategories, page]);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [totalPages, page]);

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

  const fetchCategories = async (search: string = "", pageNum: number = 1, status: string = statusFilter) => {
    try {
      setLoading(true);
      const response = await api.get("/referral-categories", {
        params: {
          search,
          limit: 1000,
          page: 0,
          status: status === "all" ? undefined : status
        }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch referral categories:", error);
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

  useEffect(() => {
    if (drawerOpen) {
      fetchParentCategories();
      fetchAvailableSubCategories();
    }
  }, [drawerOpen]);

  const handlePageChange = (p: number) => {
    setPage(p);
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
        // Find which subcategories were removed
        const removedSubCategoryIds = originalSubCategoryIds.filter(
          (id) => !formData.subCategories.includes(id)
        );
        // Unlink the removed subcategories
        await Promise.all(
          removedSubCategoryIds.map((subId) =>
            api.delete(`/referral-categories/${subId}`)
          )
        );
        // Link the selected subcategories
        if (formData.subCategories.length > 0) {
          await api.post("/referral-categories", {
            subCategory: formData.subCategories.join(","),
            refferalCategory: formData.referralParent
          });
          // Update status for all selected subcategories
          await Promise.all(
            formData.subCategories.map((subId) =>
              api.put(`/categories/${subId}`, {
                status: formData.status
              })
            )
          );
        }
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
      setOriginalSubCategoryIds([]);
      setFormData({ subCategories: [], referralParent: "", status: "active" });
      fetchCategories(searchTerm, page, statusFilter);
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

  const handleEdit = (group: any) => {
    const subIds = group.subCategories.map((sub: any) => sub._id);
    setEditingId(group.referralParent?._id || "editing");
    setOriginalSubCategoryIds(subIds);
    setFormData({
      subCategories: subIds,
      referralParent: group.referralParent?._id || "",
      status: group.subCategories[0]?.status?.toLowerCase() || "active"
    });
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (subCategoryIdsToDelete.length === 0) return;
    try {
      setIsDeleting(true);
      // Unlink all subcategories in the group
      await Promise.all(
        subCategoryIdsToDelete.map((id) =>
          api.delete(`/referral-categories/${id}`)
        )
      );
      toast({
        title: "Deleted",
        description: "Referral category deleted successfully",
        variant: "success"
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setSubCategoryIdsToDelete([]);
      fetchCategories(searchTerm, page, statusFilter);
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

  const confirmDelete = (group: any) => {
    setCategoryToDelete(group.referralParent?._id || "unassigned");
    setSubCategoryIdsToDelete(group.subCategories.map((sub: any) => sub._id));
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
              ) : displayedGroupedCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No referral categories found.
                  </td>
                </tr>
              ) : (
                displayedGroupedCategories.map((group, index) => (
                  <tr key={group._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground font-semibold">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {group.referralParent?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      <SubCategoryCell subCategories={group.subCategories} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={group.subCategories.some((sub: any) => sub.status?.toLowerCase() === "active" || sub.isActive) ? "Active" : "Inactive"} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(group) : undefined}
                        onDelete={canDelete ? () => confirmDelete(group) : undefined}
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
              totalItems={groupedCategories.length}
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
            setOriginalSubCategoryIds([]);
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
            <Popover modal={true}>
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
                        const currentGroupSubs = editingId 
                          ? categories.filter(c => c.referralParent?._id === editingId)
                          : [];
                        const dropdownList = [...availableSubCategories];
                        currentGroupSubs.forEach((sub) => {
                          if (!dropdownList.some(c => c._id === sub._id)) {
                            dropdownList.unshift(sub);
                          }
                        });
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
                              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#f1f5f9] last:border-0 text-[#1e293b] data-[selected=true]:bg-[#f8fafc] data-[selected=true]:text-[#2563eb]"
                            >
                              <div className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                isSelected
                                  ? "border-[#2563eb] bg-[#2563eb] text-white"
                                  : "border-[#cbd5e1] bg-white"
                              )}>
                                {isSelected && (
                                  <Check className="h-3 w-3 stroke-[3]" />
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
