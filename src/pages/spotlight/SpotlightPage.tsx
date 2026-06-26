import { useState, useEffect } from "react";
import { Search, Star, Plus, Calendar as CalendarIcon, CheckCircle2, Users, Loader2, X, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import ActionMenu from "@/components/common/ActionMenu";
import { useToast } from "@/hooks/use-toast";
import { getMembers } from "@/api/MembersApi";
import { getSpotlights, createSpotlight, updateSpotlight, deleteSpotlight } from "@/api/SpotlightApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaginationBar from "@/components/common/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

const SpotlightPage = () => {
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  const isFranchise = user?.roleCode?.toUpperCase() === "FRANCHIES";
  const maxLimit = isFranchise ? 4 : 2;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [spotlightToDelete, setSpotlightToDelete] = useState<any>(null);
  const [editingSpotlightId, setEditingSpotlightId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [members, setMembers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const canCreate = hasPermission("spotlight", "create");
  const canEdit = hasPermission("spotlight", "edit");
  const canDelete = hasPermission("spotlight", "delete");

  const [formData, setFormData] = useState({
    selectedMembers: [] as any[],
    status: "active",
    scheduleDate: new Date()
  });

  const [spotlights, setSpotlights] = useState<any[]>([]);

  const fetchSpotlights = async () => {
    try {
      setIsLoading(true);
      const result = await getSpotlights({
        page,
        limit: 10,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearchQuery.trim() || undefined
      });
      setSpotlights(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch spotlights",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const result = await getMembers({ page: 0, limit: 100 });
      setMembers(result.data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, debouncedSearchQuery]);

  useEffect(() => {
    fetchSpotlights();
  }, [page, statusFilter, debouncedSearchQuery]);

  const resetForm = () => {
    setFormData({
      selectedMembers: [],
      status: "active",
      scheduleDate: new Date()
    });
    setEditingSpotlightId(null);
    setMemberSearchQuery("");
  };

  const handleSave = async () => {
    if (formData.selectedMembers.length !== maxLimit) {
      toast({
        title: "Validation Error",
        description: `Please select exactly ${maxLimit} members`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const apiData = {
        members: formData.selectedMembers.map(m => m._id),
        scheduleDate: formData.scheduleDate.toISOString(),
        status: formData.status
      };

      if (editingSpotlightId) {
        await updateSpotlight(editingSpotlightId, apiData);
        toast({ title: "Success", description: "Spotlight updated successfully", variant: "success" });
      } else {
        await createSpotlight(apiData);
        toast({ title: "Success", description: "Spotlight scheduled successfully", variant: "success" });
      }
      setDrawerOpen(false);
      resetForm();
      fetchSpotlights();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save spotlight",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (spotlight: any) => {
    setEditingSpotlightId(spotlight._id);
    setFormData({
      selectedMembers: spotlight.members || [],
      status: spotlight.status,
      scheduleDate: new Date(spotlight.scheduleDate)
    });
    setDrawerOpen(true);
  };

  const handleDeleteClick = (spotlight: any) => {
    setSpotlightToDelete(spotlight);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!spotlightToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSpotlight(spotlightToDelete._id);
      toast({ title: "Deleted", description: "Spotlight removed successfully", variant: "success" });
      setDeleteConfirmOpen(false);
      setSpotlightToDelete(null);
      fetchSpotlights();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete spotlight",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMember = (member: any) => {
    setFormData(prev => {
      const exists = prev.selectedMembers.some(m => m._id === member._id);
      if (exists) {
        return {
          ...prev,
          selectedMembers: prev.selectedMembers.filter(m => m._id !== member._id)
        };
      } else {
        if (prev.selectedMembers.length >= maxLimit) {
          setTimeout(() => {
            toast({
              title: "Selection Limit",
              description: `You can select a maximum of ${maxLimit} members`,
              variant: "destructive"
            });
          }, 0);
          return prev;
        }
        return {
          ...prev,
          selectedMembers: [...prev.selectedMembers, { _id: member._id, fullName: member.fullName, businessName: member.businessName }]
        };
      }
    });
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {isLoading && spotlights.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Synchronizing Spotlight Nodes..."
          subtitle="Establishing connection to member highlights"
        />
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Spotlight Creation  </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search spotlight..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32 rounded-lg border-slate-200 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="schedule">Schedule</SelectItem>
            </SelectContent>
          </Select>

          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={() => { resetForm(); setDrawerOpen(true); }}
            >
              <Plus size={14} className="mr-1.5" />
              New Spotlight
            </Button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead className="w-[80px]">S.No</TableHead>
              <TableHead className="w-[300px]">Members</TableHead>
              <TableHead>Schedule Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spotlights.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No spotlights found
                </TableCell>
              </TableRow>
            ) : (
              spotlights.map((s, index) => (
                <TableRow key={s._id} className="hover:bg-secondary/10 transition-colors">
                  <TableCell className="text-sm font-semibold text-muted-foreground">
                    {page * 10 + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.members?.map((m: any) => (
                        <Badge key={m._id} variant="secondary" className="text-sm text-foreground bg-slate-100 border-none font-semibold">
                          {m.fullName}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground font-semibold">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon size={12} className="text-muted-foreground" />
                      {format(new Date(s.scheduleDate), "PPP")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {(canEdit || canDelete) && (
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(s) : undefined}
                        onDelete={canDelete ? () => handleDeleteClick(s) : undefined}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && spotlights.length > 0 && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page + 1}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p - 1)}
            />
          </div>
        )}
      </div>

      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => { setDrawerOpen(open); if (!open) resetForm(); }}
        title={editingSpotlightId ? "Edit Spotlight" : "New Spotlight Creation"}
        description="Schedule a new spotlight session for members"
      >
        <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6">

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Members (Select {maxLimit} members)</Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-11 justify-start font-normal rounded-xl border-slate-200">
                  <Users className="mr-2 h-4 w-4 opacity-50" />
                  {formData.selectedMembers.length > 0
                    ? `${formData.selectedMembers.length} of ${maxLimit} member(s) selected`
                    : `Choose ${maxLimit} members`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] p-0 shadow-xl rounded-2xl border border-slate-200 overflow-hidden" align="start" style={{ pointerEvents: "auto" }}>
                {/* Search bar */}
                <div className="px-3 pt-3 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                      placeholder="Search members..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                {/* Member list */}
                <div className="max-h-[300px] overflow-y-auto px-2 pb-2">
                  {members.filter(member => {
                    const q = memberSearchQuery.toLowerCase();
                    return (
                      member.fullName?.toLowerCase().includes(q) ||
                      member.businessName?.toLowerCase().includes(q) ||
                      member.mobileNumber?.toLowerCase().includes(q)
                    );
                  }).map((member) => {
                    const isSelected = formData.selectedMembers.some(m => m._id === member._id);
                    return (
                      <div
                        key={member._id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                          isSelected ? "bg-primary/8" : "hover:bg-slate-50"
                        )}
                        onClick={() => toggleMember(member)}
                      >
                        {/* Avatar circle */}
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        {/* Name & business */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-xs font-semibold text-slate-800 truncate">{member.fullName}</span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {member.businessName || "\u2014"}
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
                  {members.filter(member => {
                    const q = memberSearchQuery.toLowerCase();
                    return (
                      member.fullName?.toLowerCase().includes(q) ||
                      member.businessName?.toLowerCase().includes(q) ||
                      member.mobileNumber?.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <p className="text-center py-6 text-xs text-slate-400">No members found</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {formData.selectedMembers.map(m => (
                <Badge key={m._id} variant="default" className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-2 flex items-center gap-1">
                  {m.fullName}{m.businessName ? ` (${m.businessName})` : ""}
                  <X size={10} className="cursor-pointer" onClick={() => toggleMember(m)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Schedule Date</Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal rounded-xl border-slate-200",
                    !formData.scheduleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {formData.scheduleDate ? format(formData.scheduleDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" style={{ pointerEvents: "auto" }}>
                <Calendar
                  mode="single"
                  selected={formData.scheduleDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduleDate: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
            >
              <SelectTrigger className="h-11 rounded-xl border-slate-200">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-6 flex gap-3 mt-auto">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
              {editingSpotlightId ? "Update Schedule" : "Schedule Spotlight"}
            </Button>
          </div>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Spotlight Creation?"
        description="Are you sure you want to delete this spotlight creation? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default SpotlightPage;
