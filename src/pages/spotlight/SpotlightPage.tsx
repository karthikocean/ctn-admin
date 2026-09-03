import { useState, useEffect, useMemo } from "react";
import { Search, Star, Plus, Calendar as CalendarIcon, CheckCircle2, Users, Loader2, X, User, Building2, MapPin, Layers, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Calendar } from "@/components/ui/calendar";
import { format, isToday } from "date-fns";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import ActionMenu from "@/components/common/ActionMenu";
import { useToast } from "@/hooks/use-toast";
import { getMembers } from "@/api/MembersApi";
import { getSpotlights, createSpotlight, updateSpotlight, deleteSpotlight, getBookedDates } from "@/api/SpotlightApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const maxLimit = isFranchise ? 4 : undefined;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [spotlightToDelete, setSpotlightToDelete] = useState<any>(null);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedSpotlightMembers, setSelectedSpotlightMembers] = useState<{ scheduleDate?: string; members: any[]; }>({ members: [] });

  const resolveMemberInfo = (m: any) => {
    const full = members.find(item => (item._id || item) === (m._id || m)) || {};
    const fullName = m.fullName || full.fullName || m.name || full.name || "-";
    const companyName = m.companyName || m.businessName || full.companyName || full.businessName || "-";
    const rawCat = m.categoryName || full.categoryName || (full.businessCategory && (full.businessCategory.name || full.businessCategory)) || full.industry || "-";
    const rawReg = m.regionName || full.regionName || (full.businessRegion && (full.businessRegion.name || full.businessRegion)) || (full.city ? `${full.city}${full.state ? `, ${full.state}` : ""}` : full.state) || "-";

    return {
      _id: m._id || m,
      fullName,
      businessName: companyName,
      companyName: companyName,
      categoryName: typeof rawCat === "object" ? rawCat?.name || "-" : rawCat,
      regionName: typeof rawReg === "object" ? rawReg?.name || "-" : rawReg
    };
  };

  const [editingSpotlightId, setEditingSpotlightId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [members, setMembers] = useState<any[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSpotlights, setTotalSpotlights] = useState(0);

  const canCreate = hasPermission("spotlight", "create");
  const canEdit = hasPermission("spotlight", "edit");
  const canDelete = hasPermission("spotlight", "delete");

  const [formData, setFormData] = useState<{
    selectedMembers: any[];
    status: string;
    scheduleDate: Date | undefined;
  }>({
    selectedMembers: [],
    status: "schedule",
    scheduleDate: undefined
  });

  const [spotlights, setSpotlights] = useState<any[]>([]);

  const fetchBookedDates = async () => {
    try {
      const [bookedRes, allSpotlightsRes] = await Promise.allSettled([
        getBookedDates(),
        getSpotlights({ page: 0, limit: 1000 })
      ]);

      const dateSet = new Set<string>();

      if (bookedRes.status === "fulfilled" && bookedRes.value?.data && Array.isArray(bookedRes.value.data)) {
        bookedRes.value.data.forEach((d: string) => {
          if (d) dateSet.add(d);
        });
      }

      if (allSpotlightsRes.status === "fulfilled" && allSpotlightsRes.value?.data && Array.isArray(allSpotlightsRes.value.data)) {
        allSpotlightsRes.value.data.forEach((s: any) => {
          if (s.scheduleDate && !s.isDeleted) {
            try {
              dateSet.add(format(new Date(s.scheduleDate), "yyyy-MM-dd"));
            } catch (e) { }
          }
        });
      }

      setBookedDates(Array.from(dateSet));
    } catch (err) {
      console.error("Failed to fetch booked dates:", err);
    }
  };

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
      setTotalSpotlights(result.total || result.totalItems || 0);
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
      const result = await getMembers({ page: 0, limit: 1000 });
      setMembers(result.data || []);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchBookedDates();
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
      status: "schedule",
      scheduleDate: undefined
    });
    setEditingSpotlightId(null);
    setMemberSearchQuery("");
  };

  const handleSave = async () => {
    if (formData.selectedMembers.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least 1 member",
        variant: "destructive"
      });
      return;
    }

    if (maxLimit && formData.selectedMembers.length > maxLimit) {
      toast({
        title: "Validation Error",
        description: `You can select a maximum of ${maxLimit} members`,
        variant: "destructive"
      });
      return;
    }

    if (!formData.scheduleDate) {
      toast({
        title: "Validation Error",
        description: "Please pick a schedule date",
        variant: "destructive"
      });
      return;
    }

    const selectedDateStr = format(formData.scheduleDate, "yyyy-MM-dd");
    const currentEditSpotlight = editingSpotlightId ? spotlights.find(s => s._id === editingSpotlightId) : null;
    let isCurrentEditDate = false;

    if (currentEditSpotlight && currentEditSpotlight.scheduleDate) {
      const editDateStr = format(new Date(currentEditSpotlight.scheduleDate), "yyyy-MM-dd");
      if (editDateStr === selectedDateStr) {
        isCurrentEditDate = true;
      }
    }

    if (bookedDates.includes(selectedDateStr) && !isCurrentEditDate) {
      toast({
        title: "Date Conflict",
        description: "A spotlight is already scheduled for this date. Only one spotlight is allowed per date.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        members: formData.selectedMembers.map(m => m._id),
        scheduleDate: formData.scheduleDate.toISOString(),
        status: formData.status
      };

      if (editingSpotlightId) {
        await updateSpotlight(editingSpotlightId, payload);
        toast({
          title: "Success",
          description: "Spotlight updated successfully"
        });
      } else {
        await createSpotlight(payload);
        toast({
          title: "Success",
          description: "Spotlight created successfully"
        });
      }

      setDrawerOpen(false);
      resetForm();
      fetchSpotlights();
      fetchBookedDates();
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
    try {
      setIsDeleting(true);
      await deleteSpotlight(spotlightToDelete._id);
      toast({
        title: "Success",
        description: "Spotlight deleted successfully"
      });
      setDeleteConfirmOpen(false);
      setSpotlightToDelete(null);
      fetchSpotlights();
      fetchBookedDates();
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
    const isSelected = formData.selectedMembers.some(m => m._id === member._id);
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        selectedMembers: prev.selectedMembers.filter(m => m._id !== member._id)
      }));
    } else {
      if (maxLimit && formData.selectedMembers.length >= maxLimit) {
        toast({
          title: "Limit Reached",
          description: `You can only select up to ${maxLimit} members`,
          variant: "destructive"
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        selectedMembers: [...prev.selectedMembers, member]
      }));
    }
  };

  const isDateBooked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookedDates.includes(dateStr);
  };

  return (
    <div className="space-y-6">
      {isLoading && <GlobalNetworkLoader />}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Star size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Spotlight Creation</h1>
            <p className="text-xs text-muted-foreground">Manage and schedule member spotlights</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search spotlight..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px] h-9 text-xs rounded-lg"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 text-xs rounded-lg">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
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
              <TableHead className="w-[320px]">Members</TableHead>
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* First 3 members */}
                      {s.members?.slice(0, 3).map((m: any) => {
                        const resolved = resolveMemberInfo(m);
                        return (
                          <HoverCard key={resolved._id || m._id} openDelay={100} closeDelay={150}>
                            <HoverCardTrigger asChild>
                              <Badge
                                variant="secondary"
                                className="text-xs text-foreground bg-slate-100 hover:bg-slate-200 border border-transparent hover:border-slate-300 font-semibold cursor-pointer transition-all py-1 px-2.5 rounded-md shadow-none"
                              >
                                {resolved.fullName}
                              </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent
                              side="top"
                              align="start"
                              className="w-72 p-3.5 shadow-xl rounded-xl border border-slate-200 bg-white z-50 text-left"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs uppercase border border-primary/20">
                                  {resolved.fullName.charAt(0) || "U"}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <h4 className="text-sm font-bold text-slate-900 leading-tight truncate">
                                    {resolved.fullName}
                                  </h4>
                                  <div className="space-y-1 text-xs text-slate-600">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                      <span className="truncate font-medium">{resolved.companyName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Layers className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                      <span className="truncate text-slate-500">{resolved.categoryName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 truncate">
                                      <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                      <span className="truncate text-slate-500">{resolved.regionName}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        );
                      })}

                      {/* Remaining count badge +N */}
                      {s.members?.length > 3 && (
                        <HoverCard openDelay={100} closeDelay={150}>
                          <HoverCardTrigger asChild>
                            <Badge
                              variant="secondary"
                              className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 cursor-pointer transition-all py-1 px-2 rounded-md"
                            >
                              +{s.members.length - 3}
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="top"
                            align="start"
                            className="w-80 p-3.5 shadow-xl rounded-xl border border-slate-200 bg-white z-50 text-left"
                          >
                            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                              <span className="text-xs font-bold text-slate-800">
                                Remaining Members ({s.members.length - 3})
                              </span>
                              <span className="text-[11px] font-semibold text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">
                                Total: {s.members.length}
                              </span>
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
                              {s.members.slice(3).map((remM: any, idx: number) => {
                                const remResolved = resolveMemberInfo(remM);
                                return (
                                  <div key={remResolved._id || idx} className={cn("flex items-start gap-2.5", idx > 0 && "pt-2.5")}>
                                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 font-bold text-[11px] uppercase border border-slate-200 mt-0.5">
                                      {remResolved.fullName.charAt(0) || "U"}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                      <div className="text-xs font-bold text-slate-800 truncate">
                                        {remResolved.fullName}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 truncate">
                                        <Building2 className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                        <span className="truncate font-medium">{remResolved.companyName}</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-slate-500 truncate">
                                        <span className="flex items-center gap-1 truncate">
                                          <Layers className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                          <span className="truncate">{remResolved.categoryName}</span>
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 truncate">
                                          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                                          <span className="truncate">{remResolved.regionName}</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
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
              totalItems={totalSpotlights}
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
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Members {maxLimit ? `(Max ${maxLimit} members)` : `(${formData.selectedMembers.length} selected)`}
            </Label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-11 justify-start font-normal rounded-xl border-slate-200">
                  <Users className="mr-2 h-4 w-4 opacity-50" />
                  {formData.selectedMembers.length > 0
                    ? `${formData.selectedMembers.length} member${formData.selectedMembers.length > 1 ? "s" : ""} selected${maxLimit ? ` (max ${maxLimit})` : ""}`
                    : maxLimit ? `Choose up to ${maxLimit} members` : "Choose members"}
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
                            {member.businessName || "—"}
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
                </div>
              </PopoverContent>
            </Popover>

            {/* Selected Member Chips */}
            {formData.selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {formData.selectedMembers.map((member) => (
                  <Badge
                    key={member._id}
                    variant="secondary"
                    className="pl-2.5 pr-1 py-1 text-xs bg-slate-100 text-slate-800 rounded-lg flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
                  >
                    <span>{member.fullName}</span>
                    <button
                      type="button"
                      onClick={() => toggleMember(member)}
                      className="p-0.5 hover:bg-slate-300 rounded-full transition-colors"
                    >
                      <X className="h-3 w-3 text-slate-500" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Schedule Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal rounded-xl border-slate-200",
                    !formData.scheduleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduleDate ? format(formData.scheduleDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.scheduleDate}
                  onSelect={(date) => {
                    if (date) {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const currentEditSpotlight = editingSpotlightId ? spotlights.find(s => s._id === editingSpotlightId) : null;
                      let isCurrentEditDate = false;

                      if (currentEditSpotlight && currentEditSpotlight.scheduleDate) {
                        const editDateStr = format(new Date(currentEditSpotlight.scheduleDate), "yyyy-MM-dd");
                        if (editDateStr === dateStr) {
                          isCurrentEditDate = true;
                        }
                      }

                      if (bookedDates.includes(dateStr) && !isCurrentEditDate) {
                        toast({
                          title: "Date Booked",
                          description: "A spotlight is already scheduled for this date. Please select another date.",
                          variant: "destructive"
                        });
                        return;
                      }

                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isUpcoming = date > today;
                      setFormData(prev => ({
                        ...prev,
                        scheduleDate: date,
                        status: isUpcoming ? "schedule" : "active"
                      }));
                    } else {
                      setFormData(prev => ({ ...prev, scheduleDate: undefined }));
                    }
                  }}
                  modifiers={{
                    booked: (date) => {
                      const currentEditSpotlight = editingSpotlightId ? spotlights.find(s => s._id === editingSpotlightId) : null;
                      if (currentEditSpotlight && currentEditSpotlight.scheduleDate) {
                        const editDateStr = format(new Date(currentEditSpotlight.scheduleDate), "yyyy-MM-dd");
                        const dateStr = format(date, "yyyy-MM-dd");
                        if (editDateStr === dateStr) return false;
                      }
                      return isDateBooked(date);
                    }
                  }}
                  modifiersClassNames={{
                    booked: "opacity-40 line-through bg-red-50 text-red-500 cursor-not-allowed"
                  }}
                  initialFocus
                  className="rounded-xl border shadow-sm p-3"
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex gap-3 mt-auto">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              onClick={() => { setDrawerOpen(false); resetForm(); }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 h-11 rounded-xl bg-primary hover:bg-primary/90 font-bold"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingSpotlightId ? "Update Spotlight" : "Create Spotlight"
              )}
            </Button>
          </div>
        </div>
      </FormDrawer>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Spotlight"
        description="Are you sure you want to delete this spotlight creation? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};
export default SpotlightPage;
