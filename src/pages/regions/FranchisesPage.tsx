import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Loader2, Store, MapPin, Users, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { getRegions } from "@/api/RegionApi";
import { getFranchises, createFranchise, updateFranchise, deleteFranchise, getFranchiseUsers } from "@/api/FranchiseApi";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

interface User {
  _id: string;
  fullName: string;
}

interface Franchise {
  _id: string;
  name: string;
  businessRegionId: string;
  status: "active" | "inactive";
  userId: string[];
  businessRegion?: {
    _id: string;
    country: string;
    state: string;
    city: string;
  } | null;
  users?: User[];
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
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
  const [saving, setSaving] = useState(false);

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

      try {
        const franchiseUsers = await getFranchiseUsers();
        if (franchiseUsers && franchiseUsers.length > 0) {
          const mappedUsers = franchiseUsers.map((u: any) => ({
            _id: u.id,
            fullName: u.name
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

  const handleOpenAdd = () => {
    setEditingFranchise(null);
    setFranchiseName("");
    setSelectedRegionId("");
    setFranchiseStatus("active");
    setSelectedUsers([]);
    setUserSearchQuery("");
    setDrawerOpen(true);
  };

  const handleEdit = (franchise: Franchise) => {
    setEditingFranchise(franchise);
    setFranchiseName(franchise.name);
    setSelectedRegionId(franchise.businessRegionId ? franchise.businessRegionId.toString() : (franchise.businessRegion?._id || ""));
    setFranchiseStatus(franchise.status);
    setSelectedUsers(franchise.users || []);
    setUserSearchQuery("");
    setDrawerOpen(true);
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

    setSaving(true);
    try {
      const payload = {
        name: franchiseName.trim(),
        businessRegionId: selectedRegionId,
        userId: selectedUsers.map(u => u._id),
        status: franchiseStatus
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

  const filteredUsers = usersList.filter(u =>
    u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const selectedRegion = regionsList.find(r => r._id === selectedRegionId);

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
            <Store size={16} className="text-primary" />
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
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Users</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {franchises.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No franchises found
                  </td>
                </tr>
              ) : (
                franchises.map((f, index) => {
                  const region = regionsList.find(r => r._id === (f.businessRegionId?.toString() || f.businessRegion?._id));
                  const regionText = region
                    ? `${region.city}, ${region.state}`
                    : (f.businessRegion
                      ? `${f.businessRegion.city}, ${f.businessRegion.state}`
                      : "Unknown Region");
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
                        <Badge variant={f.status === "active" ? "default" : "secondary"} className={f.status === "active" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20" : "bg-muted/50 text-muted-foreground"}>
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Business Region</label>
            <Select
              value={selectedRegionId}
              onValueChange={setSelectedRegionId}
            >
              <SelectTrigger className="w-full h-11 bg-secondary/50 border-border rounded-xl focus:ring-primary/20">
                <SelectValue placeholder="Select Business Region" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {regionsList.length > 0 ? (
                  regionsList.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.city}, {r.state} ({r.country})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">No regions available</div>
                )}
              </SelectContent>
            </Select>

            {selectedRegion && selectedRegion.areas && selectedRegion.areas.length > 0 && (
              <div className="mt-2 p-3 bg-secondary/30 rounded-xl border border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Region Areas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRegion.areas.map((area: any, i: number) => (
                    <Badge key={i} variant="outline" className="bg-background text-[11px] font-semibold text-slate-600 border-border/80">
                      {typeof area === "string" ? area : area.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multiple Users Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Franchise Users</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-11 justify-start font-normal rounded-xl border-slate-200 bg-secondary/50">
                  <Users className="mr-2 h-4 w-4 opacity-50" />
                  {selectedUsers.length > 0
                    ? `${selectedUsers.length} user(s) selected`
                    : "Choose users"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <div className="p-3 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      className="w-full pl-7 py-1 text-xs outline-none bg-transparent"
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-[250px] overflow-y-auto p-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center space-x-2 px-2 py-2 hover:bg-slate-100 rounded-md cursor-pointer"
                      onClick={() => toggleUser(user)}
                    >
                      <Checkbox
                        checked={selectedUsers.some(u => u._id === user._id)}
                        onCheckedChange={() => toggleUser(user)}
                      />
                      <span className="text-xs font-medium">{user.fullName}</span>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center py-4 text-xs text-muted-foreground">No users found</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedUsers.map(u => (
                <Badge key={u._id} variant="default" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-2 flex items-center gap-1">
                  {u.fullName}
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
    </div>
  );
};

export default FranchisesPage;
