import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Loader2, Store, MapPin, Users, X, Check, ChevronsUpDown, User, Globe } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getRegions } from "@/api/RegionApi";
import { getFranchises, createFranchise, updateFranchise, deleteFranchise, getFranchiseUsers } from "@/api/FranchiseApi";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

interface User {
  _id: string;
  fullName: string;
  businessName?: string;
  mobileNumber?: string;
}

interface Franchise {
  _id: string;
  name: string;
  businessRegionId: string;
  status: "active" | "inactive";
  userId: string[];
  businessRegion?: {
    name: string;
    _id: string;
    country: string;
    state: string;
    city: string;
    areas?: any[];
  } | null;
  users?: User[];
  commissionPercentage?: number;
  createdAt: string;
}
const FranchisesPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canCreate = hasPermission("franchises", "create");
  const canEdit = hasPermission("franchises", "edit");
  const canDelete = hasPermission("franchises", "delete");

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [regionsList, setRegionsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [assignedRegionIds, setAssignedRegionIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFranchises, setTotalFranchises] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAssignedRegions = async () => {
    try {
      const franchiseRes = await getFranchises({ limit: 1000 });
      if (franchiseRes && franchiseRes.data) {
        const ids = franchiseRes.data
          .map((f: any) => f.businessRegionId?.toString() || f.businessRegion?._id?.toString())
          .filter(Boolean);
        setAssignedRegionIds(ids);
      }
    } catch (e) {
      console.error("Failed to load franchises list for validation", e);
    }
  };

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [franchiseToDelete, setFranchiseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [editingFranchise, setEditingFranchise] = useState<Franchise | null>(null);
  const [franchiseName, setFranchiseName] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [franchiseStatus, setFranchiseStatus] = useState<"active" | "inactive">("active");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [commissionPercentage, setCommissionPercentage] = useState<number | string>(0);
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState("");
  const [visibleRegionCount, setVisibleRegionCount] = useState(10);
  const [saving, setSaving] = useState(false);

  // Status dialog states
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [franchiseToUpdateStatus, setFranchiseToUpdateStatus] = useState<Franchise | null>(null);
  const [newStatus, setNewStatus] = useState<"active" | "inactive">("active");

  // Fetch franchises from API
  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const data = await getFranchises({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter === "all" ? undefined : statusFilter
      });
      setFranchises(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotalFranchises(data.total || data.totalItems || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch franchises",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load static regions & franchise users on mount
  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const regionRes = await getRegions({ limit: 100, status: "active" });
        if (regionRes && regionRes.data) {
          setRegionsList(regionRes.data);
        }
      } catch (e) {
        console.error("Failed to load business regions from API", e);
      }

      await fetchAssignedRegions();

      try {
        const franchiseUsers = await getFranchiseUsers();
        if (franchiseUsers && franchiseUsers.length > 0) {
          const mappedUsers = franchiseUsers.map((u: any) => ({
            _id: u.id || u._id,
            fullName: u.name || u.fullName || "",
            businessName: u.businessName || u.business_name || u.tradeName ||
              u.member?.businessName || u.member?.business_name || u.member?.tradeName ||
              u.memberData?.businessName || "",
            mobileNumber: u.phone || u.phoneNumber || u.mobile || u.mobileNumber ||
              u.member?.mobileNumber || u.member?.phone || ""
          }));
          setUsersList(mappedUsers);
        } else {
          setUsersList([]);
        }
      } catch (e) {
        console.error("Failed to load franchise users from API", e);
        setUsersList([]);
      }
    };

    loadStaticData();
  }, []);

  // Fetch franchises when page, search, status filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFranchises();
    }, 400);
    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter]);

  // Dynamic API call when searching business regions in popover
  useEffect(() => {
    if (!regionOpen) return;

    const timer = setTimeout(async () => {
      try {
        const regionRes = await getRegions({
          search: regionSearch.trim() || undefined,
          limit: 100,
          status: "active"
        });
        if (regionRes && regionRes.data) {
          setRegionsList(regionRes.data);
        }
      } catch (e) {
        console.error("Failed to search business regions from API", e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [regionSearch, regionOpen]);

  const handleOpenAdd = async () => {
    setEditingFranchise(null);
    setFranchiseName("");
    setSelectedRegionId("");
    setFranchiseStatus("active");
    setSelectedUsers([]);
    setUserSearchQuery("");
    setCommissionPercentage(0);
    setRegionOpen(false);
    setDrawerOpen(true);
    try {
      const franchiseUsers = await getFranchiseUsers();
      if (franchiseUsers && franchiseUsers.length > 0) {
        const mappedUsers = franchiseUsers.map((u: any) => ({
          _id: u.id || u._id,
          fullName: u.name || u.fullName || "",
          businessName: u.businessName || u.business_name || u.tradeName ||
            u.member?.businessName || u.member?.business_name || u.member?.tradeName ||
            u.memberData?.businessName || "",
          mobileNumber: u.phone || u.phoneNumber || u.mobile || u.mobileNumber ||
            u.member?.mobileNumber || u.member?.phone || ""
        }));
        setUsersList(mappedUsers);
      } else {
        setUsersList([]);
      }
    } catch (e) {
      console.error("Failed to load franchise users from API", e);
      setUsersList([]);
    }
  };

  const handleEdit = async (franchise: Franchise) => {
    setEditingFranchise(franchise);
    setFranchiseName(franchise.name);
    setSelectedRegionId(franchise.businessRegionId ? franchise.businessRegionId.toString() : (franchise.businessRegion?._id || ""));
    setFranchiseStatus(franchise.status);
    setSelectedUsers(franchise.users || []);
    setUserSearchQuery("");
    setCommissionPercentage(franchise.commissionPercentage !== undefined ? franchise.commissionPercentage : 0);
    setRegionOpen(false);
    setDrawerOpen(true);
    try {
      const franchiseUsers = await getFranchiseUsers(franchise._id);
      if (franchiseUsers && franchiseUsers.length > 0) {
        const mappedUsers = franchiseUsers.map((u: any) => ({
          _id: u.id || u._id,
          fullName: u.name || u.fullName || "",
          businessName: u.businessName || u.business_name || u.tradeName ||
            u.member?.businessName || u.member?.business_name || u.member?.tradeName ||
            u.memberData?.businessName || "",
          mobileNumber: u.phone || u.phoneNumber || u.mobile || u.mobileNumber ||
            u.member?.mobileNumber || u.member?.phone || ""
        }));
        setUsersList(mappedUsers);
      } else {
        setUsersList([]);
      }
    } catch (e) {
      console.error("Failed to load franchise users from API", e);
      setUsersList([]);
    }
  };

  const toggleUser = (user: User) => {
    const exists = selectedUsers.find(u => u._id === user._id);
    if (exists) {
      setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleSave = async () => {
    if (!franchiseName.trim() || !selectedRegionId) {
      toast({
        title: "Validation Error",
        description: "Please enter Franchise Name and select a Business Region",
        variant: "destructive"
      });
      return;
    }

    const commPct = parseFloat(commissionPercentage.toString());
    if (isNaN(commPct) || commPct < 0 || commPct > 100) {
      toast({
        title: "Validation Error",
        description: "Commission percentage must be a positive number between 0 and 100",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: franchiseName.trim(),
        businessRegionId: selectedRegionId,
        userId: selectedUsers.map(u => u._id),
        status: franchiseStatus,
        commissionPercentage: commPct
      };

      if (editingFranchise) {
        await updateFranchise(editingFranchise._id, payload);
        toast({ title: "Updated", description: "Franchise updated successfully", variant: "success" });
      } else {
        await createFranchise(payload);
        toast({ title: "Created", description: "Franchise created successfully", variant: "success" });
      }
      setDrawerOpen(false);
      fetchFranchises();
      fetchAssignedRegions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save franchise",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setFranchiseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!franchiseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteFranchise(franchiseToDelete);
      toast({
        title: "Deleted",
        description: "Franchise deleted successfully",
        variant: "success"
      });
      setDeleteDialogOpen(false);
      setFranchiseToDelete(null);
      fetchFranchises();
      fetchAssignedRegions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete franchise",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!franchiseToUpdateStatus) return;
    try {
      setSaving(true);
      await updateFranchise(franchiseToUpdateStatus._id, {
        name: franchiseToUpdateStatus.name,
        businessRegionId: franchiseToUpdateStatus.businessRegionId,
        userId: franchiseToUpdateStatus.userId,
        status: newStatus
      });
      toast({
        title: "Success",
        description: `Franchise status updated to ${newStatus}`,
        variant: "success"
      });
      fetchFranchises();
      setStatusDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = usersList.filter(u => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      (u.businessName || "").toLowerCase().includes(q) ||
      (u.mobileNumber || "").toLowerCase().includes(q)
    );
  });

  const allAreas = regionsList.flatMap((r) => {
    if (r.areas && r.areas.length > 0) {
      return r.areas.map((area: any) => ({
        _id: typeof area === "string" ? area : area._id,
        name: typeof area === "string" ? area : area.name,
        city: r.city,
        state: r.state,
        country: r.country
      }));
    }
    return [{
      _id: r._id,
      name: `${r.city}, ${r.state} (${r.country})`,
      city: r.city,
      state: r.state,
      country: r.country
    }];
  });

  const currentAssignedRegionId = editingFranchise?.businessRegionId?.toString() || editingFranchise?.businessRegion?._id?.toString();

  const availableAreas = allAreas.filter(area => 
    !assignedRegionIds.includes(area._id.toString()) || 
    (currentAssignedRegionId && currentAssignedRegionId === area._id.toString())
  );

  const filteredAreas = useMemo(() => {
    if (!regionSearch.trim()) return availableAreas;
    const q = regionSearch.toLowerCase().trim();
    return availableAreas.filter(area =>
      area.name.toLowerCase().includes(q) ||
      area.city.toLowerCase().includes(q) ||
      area.state.toLowerCase().includes(q) ||
      area.country.toLowerCase().includes(q)
    );
  }, [availableAreas, regionSearch]);

  const visibleAreas = useMemo(() => {
    return filteredAreas.slice(0, visibleRegionCount);
  }, [filteredAreas, visibleRegionCount]);

  const handleRegionListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 30) {
      if (visibleRegionCount < filteredAreas.length) {
        setVisibleRegionCount(prev => prev + 10);
      }
    }
  };

  const selectedArea = allAreas.find(a => a._id === selectedRegionId);

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && franchises.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Mapping Franchise Networks..."
          subtitle="Synchronizing regional franchise nodes and member clusters"
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Franchises</h1>
          </div>
        </div>

        {/* Search, Filters, Add */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search franchises..."
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

          {/* Add Franchise */}
          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={handleOpenAdd}
            >
              + Add Franchise
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
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Franchise Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business Region</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commission (%)</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Users</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {franchises.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No franchises found
                  </td>
                </tr>
              ) : (
                franchises.map((f, index) => {
                  const region = regionsList.find(r =>
                    r._id === f.businessRegionId?.toString() ||
                    (r.areas && r.areas.some((a: any) => (typeof a === "string" ? a : a._id) === f.businessRegionId?.toString()))
                  );
                  const matchedArea = region?.areas?.find((a: any) => (typeof a === "string" ? a : a._id) === f.businessRegionId?.toString());
                  const regionText = matchedArea
                    ? (typeof matchedArea === "string" ? matchedArea : matchedArea.name)
                    : (f.businessRegion?.name || (region ? `${region.city}, ${region.state}` : (f.businessRegion ? `${f.businessRegion.city}, ${f.businessRegion.state}` : "Unknown Region")));
                  return (
                    <tr key={f._id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-foreground font-semibold">{(page * 10) + index + 1}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-semibold">{f.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground font-semibold">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-foreground" />
                          {regionText}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground font-semibold">
                        {f.commissionPercentage !== undefined ? `${f.commissionPercentage}%` : "0%"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {f.users && f.users.length > 0 ? (
                            f.users.map((u) => (
                              <Badge key={u._id} variant="secondary" className="text-sm text-foreground bg-slate-100 border-none font-semibold">
                                {u.fullName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-foreground font-semibold">No users assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={f.status === "active" ? "default" : "secondary"}
                          className={cn(
                            "cursor-pointer font-semibold transition-all active:scale-95",
                            f.status === "active"
                              ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                          )}
                          onClick={() => {
                            if (canEdit) {
                              setFranchiseToUpdateStatus(f);
                              setNewStatus(f.status);
                              setStatusDialogOpen(true);
                            }
                          }}
                        >
                          {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionMenu
                          onEdit={canEdit ? () => handleEdit(f) : undefined}
                          onDelete={canDelete ? () => handleDeleteClick(f._id) : undefined}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4 border-t">
          <PaginationBar
            currentPage={page + 1}
            totalPages={totalPages}
            totalItems={totalFranchises}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      </motion.div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editingFranchise ? "Edit Franchise" : "Add Franchise"}
        description={editingFranchise ? "Update existing franchise details" : "Register a new business franchise node"}
      >
        <div className="space-y-5 px-1.5 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Franchise Name</label>
            <Input
              value={franchiseName}
              onChange={(e) => setFranchiseName(e.target.value)}
              placeholder="e.g. Chennai Central Franchise"
              className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20 text-xs font-semibold"
            />
          </div>

          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Business Region</label>
            <Popover
              open={regionOpen}
              onOpenChange={(open) => {
                setRegionOpen(open);
                if (open) {
                  setRegionSearch("");
                  setVisibleRegionCount(10);
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={regionOpen}
                  className="w-full h-11 bg-secondary/50 border border-border rounded-xl justify-between px-3 text-xs font-semibold text-slate-900 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-secondary/40 active:scale-[0.99] transition-all"
                >
                  {selectedRegionId && selectedArea
                    ? `${selectedArea.name} (${selectedArea.city})`
                    : "Select Business Region"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-600" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border border-border rounded-xl shadow-xl z-50 animate-none">
                <Command shouldFilter={false} className="w-full">
                  <CommandInput
                    placeholder="Search region or area..."
                    className="h-10 text-xs"
                    value={regionSearch}
                    onValueChange={(val) => {
                      setRegionSearch(val);
                      setVisibleRegionCount(10);
                    }}
                  />
                  <CommandEmpty>No regions found.</CommandEmpty>
                  <CommandList
                    className="max-h-60 overflow-y-auto"
                    onScroll={handleRegionListScroll}
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <CommandGroup>
                      {visibleAreas.map((area) => (
                        <CommandItem
                          key={area._id}
                          value={area._id}
                          onSelect={() => {
                            setSelectedRegionId(area._id);
                            setRegionOpen(false);
                          }}
                          className="text-xs cursor-pointer hover:bg-secondary/50 rounded-lg flex items-center justify-between"
                        >
                          <span className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                selectedRegionId === area._id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {area.name} ({area.city})
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Commission Percentage (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="any"
              value={commissionPercentage}
              onChange={(e) => setCommissionPercentage(e.target.value)}
              placeholder="e.g. 10"
              className="h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20 text-xs font-semibold"
            />
          </div>

          {/* Multiple Users Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Franchise Users</label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-11 justify-start font-normal rounded-xl border-slate-200 bg-secondary/50">
                  <Users className="mr-2 h-4 w-4 opacity-50" />
                  {selectedUsers.length > 0
                    ? `${selectedUsers.length} user(s) selected`
                    : "Choose users"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 shadow-xl rounded-2xl border border-slate-200 overflow-hidden" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                {/* Search bar */}
                <div className="px-3 pt-3 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                {/* User list */}
                <div className="max-h-[280px] overflow-y-auto px-2 pb-2">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUsers.some(u => u._id === user._id);
                    return (
                      <div
                        key={user._id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                          isSelected ? "bg-primary/8" : "hover:bg-slate-50"
                        )}
                        onClick={() => toggleUser(user)}
                      >
                        {/* Avatar circle */}
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        {/* Name & business */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-semibold text-slate-800 truncate">{user.fullName}</span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {user.businessName || "—"}
                          </span>
                        </div>
                        {/* Selection indicator */}
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-slate-300 bg-white"
                        )}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <p className="text-center py-6 text-xs text-slate-400">No users found</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedUsers.map(u => (
                <Badge key={u._id} variant="default" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-2 flex items-center gap-1">
                  {u.fullName}{u.businessName ? ` (${u.businessName})` : ""}
                  <X size={10} className="cursor-pointer" onClick={() => toggleUser(u)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
            <Select
              value={franchiseStatus}
              onValueChange={(val: "active" | "inactive") => setFranchiseStatus(val)}
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
                Saving Franchise...
              </>
            ) : (
              editingFranchise ? "Update Franchise" : "Create Franchise"
            )}
          </Button>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Franchise?"
        description="Are you sure you want to delete this franchise? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
      />

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="text-primary w-4 h-4" />
              </div>
              Update Franchise Status
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Change the configuration status for the franchise {franchiseToUpdateStatus?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="status" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Franchise Status</label>
              <Select value={newStatus} onValueChange={(val: "active" | "inactive") => setNewStatus(val)}>
                <SelectTrigger id="status" className="h-11 rounded-xl bg-white border border-slate-300">
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
            <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleUpdateStatus} disabled={saving}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FranchisesPage;
