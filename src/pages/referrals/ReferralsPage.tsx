import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Users,
  Eye,
  X,
  Loader2,
  ArrowUpRight,
  Check,
  ChevronsUpDown,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";
import { getReferrals, getReferredMembers } from "@/api/ReferralsApi";
import { getCategories } from "@/api/CategoryApi";
import { cn } from "@/lib/utils";

const getFullUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_MEDIA_URL || "http://localhost:5001";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const getAvatarGradient = (name: string = "") => {
  const charCode = name.charCodeAt(0) || 0;
  const gradients = [
    "bg-gradient-to-br from-indigo-500 to-purple-600 text-white",
    "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    "bg-gradient-to-br from-blue-500 to-cyan-600 text-white",
    "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
    "bg-gradient-to-br from-rose-500 to-pink-600 text-white"
  ];
  return gradients[charCode % gradients.length];
};

const getInitials = (name: string = "") => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "M";
};

const ReferralsPage = () => {
  // Main data state
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedReferralFilter, setSelectedReferralFilter] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Categories list for dropdown
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);

  // Preview Dialog State
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ referrer: any; referredMembers: any[] }>({
    referrer: null,
    referredMembers: []
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page to 1 when search or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCategory, selectedReferralFilter, selectedStatus, startDate, endDate]);

  // Load categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories("MAIN");
        if (res?.data) {
          setCategories(res.data);
        } else if (Array.isArray(res)) {
          setCategories(res);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, []);

  // Fetch referrals list
  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page - 1, // backend is 0-indexed
        limit
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (selectedCategory && selectedCategory !== "all") {
        params.category = selectedCategory;
      }
      if (selectedReferralFilter && selectedReferralFilter !== "all") {
        params.referralFilter = selectedReferralFilter;
      }
      if (selectedStatus && selectedStatus !== "all") {
        params.status = selectedStatus;
      }
      if (startDate) {
        params.startDate = startDate;
      }
      if (endDate) {
        params.endDate = endDate;
      }

      const res = await getReferrals(params);
      if (res?.data) {
        setReferrals(res.data);
        setTotalRecords(res.total || res.data.length || 0);
        setTotalPages(res.totalPages || Math.ceil((res.total || 0) / limit) || 1);
      } else {
        setReferrals([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching referrals:", error);
      setReferrals([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [page, debouncedSearch, selectedCategory, selectedReferralFilter, selectedStatus, startDate, endDate]);

  // Handle open preview dialog
  const handlePreview = async (referral: any) => {
    setSelectedReferral(referral);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData({
      referrer: referral,
      referredMembers: []
    });

    try {
      const res = await getReferredMembers(referral._id || referral.id);
      if (res?.data) {
        setPreviewData({
          referrer: res.data.referrer || referral,
          referredMembers: res.data.referredMembers || []
        });
      }
    } catch (err) {
      console.error("Failed to load referred members preview:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Check active filter count
  const activeFiltersCount = [
    selectedCategory !== "all",
    selectedReferralFilter !== "all",
    selectedStatus !== "all",
    startDate !== "",
    endDate !== ""
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSelectedCategory("all");
    setSelectedReferralFilter("all");
    setSelectedStatus("all");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setDebouncedSearch("");
    setFilterPopoverOpen(false);
  };

  const handleRefreshAndReset = () => {
    handleResetFilters();
    fetchReferrals();
  };

  const selectedCategoryName =
    selectedCategory === "all"
      ? "All Categories"
      : categories.find((c) => c._id === selectedCategory)?.name || "Selected Category";

  return (
    <div className="page-container relative min-h-[600px] space-y-5">
      {loading && referrals.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Mapping Referral Paths..."
          subtitle="Connecting chain nodes and member invitations"
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xs">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground tracking-tight">Member Referrals</h1>
              <Badge variant="outline" className="text-[11px] font-semibold bg-secondary/50">
                {totalRecords} Records
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Monitor member referral chains, network expansion, and invitations
            </p>
          </div>
        </div>

        {/* Right side controls: Search, Filter Popover, Refresh */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder="Search by name, email, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-9 pr-8 w-64 md:w-72 rounded-xl border border-border bg-card/60 text-xs focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearch("");
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters Popover */}
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={activeFiltersCount > 0 ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 rounded-xl text-xs font-semibold gap-1.5 transition-all shadow-2xs",
                  activeFiltersCount > 0 ? "bg-primary text-primary-foreground" : "border-border bg-card"
                )}
              >
                <Filter size={14} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-80 md:w-96 p-4 rounded-2xl border border-border bg-card shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-1.5">
                  <Filter size={14} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">Filter Referrals</span>
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-6 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Reset All
                  </Button>
                )}
              </div>

              {/* Referral Activity Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Referral Activity</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "all", label: "All Members" },
                    { id: "has_referrals", label: "Has Referrals (> 0)" },
                    { id: "no_referrals", label: "No Referrals (0)" },
                    { id: "was_referred", label: "Was Referred" },
                    { id: "direct", label: "Direct Signups" }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedReferralFilter(item.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-xs font-medium text-left border transition-all truncate",
                        selectedReferralFilter === item.id
                          ? "bg-primary/10 border-primary text-primary font-semibold shadow-2xs"
                          : "bg-secondary/40 border-border/70 text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Category Combobox */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Business Category</Label>
                <Popover open={categoryComboboxOpen} onOpenChange={setCategoryComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryComboboxOpen}
                      className="w-full justify-between h-9 text-xs rounded-xl font-normal border-border bg-secondary/30"
                    >
                      <span className="truncate">{selectedCategoryName}</span>
                      <ChevronsUpDown size={13} className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0 rounded-xl" align="start">
                    <Command>
                      <CommandInput placeholder="Search category..." className="text-xs" />
                      <CommandList>
                        <CommandEmpty className="text-xs p-3">No category found.</CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-y-auto">
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setSelectedCategory("all");
                              setCategoryComboboxOpen(false);
                            }}
                            className="text-xs"
                          >
                            <Check
                              size={14}
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCategory === "all" ? "opacity-100 text-primary" : "opacity-0"
                              )}
                            />
                            All Categories
                          </CommandItem>
                          {categories.map((cat) => (
                            <CommandItem
                              key={cat._id}
                              value={cat.name}
                              onSelect={() => {
                                setSelectedCategory(cat._id);
                                setCategoryComboboxOpen(false);
                              }}
                              className="text-xs"
                            >
                              <Check
                                size={14}
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedCategory === cat._id ? "opacity-100 text-primary" : "opacity-0"
                                )}
                              />
                              {cat.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Member Status</Label>
                <div className="flex items-center gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "active", label: "Active" },
                    { id: "inactive", label: "Inactive" },
                    { id: "blocked", label: "Blocked" }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStatus(s.id)}
                      className={cn(
                        "flex-1 py-1 px-2 rounded-lg text-xs font-medium border text-center transition-all",
                        selectedStatus === s.id
                          ? "bg-primary/10 border-primary text-primary font-semibold"
                          : "bg-secondary/40 border-border/70 text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Registered Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-medium">From:</span>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 text-xs rounded-lg bg-secondary/30 border-border"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-medium">To:</span>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 text-xs rounded-lg bg-secondary/30 border-border"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  className="w-full h-8 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setFilterPopoverOpen(false)}
                >
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Refresh / Reset Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefreshAndReset}
            disabled={loading}
            className="h-9 w-9 rounded-xl border border-border bg-card text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 transition-all shadow-2xs"
            title="Reset Filters & Refresh Data"
          >
            <RefreshCw size={15} className={cn("text-slate-700 dark:text-slate-200", loading && "animate-spin text-primary")} />
          </Button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground font-medium mr-1">Active filters:</span>
          {selectedReferralFilter !== "all" && (
            <Badge variant="secondary" className="text-xs gap-1 py-0.5 rounded-lg">
              <span>Activity: {selectedReferralFilter.replace("_", " ")}</span>
              <X size={11} className="cursor-pointer hover:text-destructive" onClick={() => setSelectedReferralFilter("all")} />
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="secondary" className="text-xs gap-1 py-0.5 rounded-lg">
              <span>Category: {selectedCategoryName}</span>
              <X size={11} className="cursor-pointer hover:text-destructive" onClick={() => setSelectedCategory("all")} />
            </Badge>
          )}
          {selectedStatus !== "all" && (
            <Badge variant="secondary" className="text-xs gap-1 py-0.5 rounded-lg">
              <span>Status: {selectedStatus}</span>
              <X size={11} className="cursor-pointer hover:text-destructive" onClick={() => setSelectedStatus("all")} />
            </Badge>
          )}
          {(startDate || endDate) && (
            <Badge variant="secondary" className="text-xs gap-1 py-0.5 rounded-lg">
              <span>Date: {startDate || "Start"} to {endDate || "End"}</span>
              <X
                size={11}
                className="cursor-pointer hover:text-destructive"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              />
            </Badge>
          )}
          <button
            onClick={handleResetFilters}
            className="text-xs text-primary hover:underline font-semibold ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative glass-card rounded-2xl border border-border overflow-hidden bg-card/80 shadow-sm"
      >
        {loading && referrals.length > 0 && <TableLoader text="Syncing Referrals..." />}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                  S.No
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[220px]">
                  Member Details
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">
                  Category
                </th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
                  Referred Count
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">
                  Referred By
                </th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={6} columns={6} />
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-muted/80 border border-border flex items-center justify-center shadow-xs">
                        <Users size={28} className="text-muted-foreground/60" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-foreground">No Referrals Found</h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          {searchTerm || activeFiltersCount > 0
                            ? "No referral records matching your filters. Try adjusting your search or resetting filters."
                            : "There are currently no member referral records available."}
                        </p>
                      </div>
                      {(searchTerm || activeFiltersCount > 0) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            handleResetFilters();
                          }}
                          className="text-xs rounded-xl mt-2"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                referrals.map((r, index) => {
                  const sNo = (page - 1) * limit + index + 1;
                  const hasReferrals = (r.referredCount || 0) > 0;
                  const isDirect = !r.referredBy || r.referredBy === "Direct" || r.referredBy === "-";

                  return (
                    <tr
                      key={r._id || r.id || index}
                      className="hover:bg-secondary/30 transition-colors group"
                    >
                      {/* S.No */}
                      <td className="px-4 py-4 text-center text-xs font-bold text-muted-foreground">
                        {sNo}
                      </td>

                      {/* Member Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border/80 flex-shrink-0 shadow-2xs">
                            {r.profilePhoto && (
                              <AvatarImage
                                src={getFullUrl(r.profilePhoto)}
                                alt={r.name}
                                className="object-cover"
                              />
                            )}
                            <AvatarFallback
                              className={cn(
                                "text-[11px] font-bold flex items-center justify-center",
                                getAvatarGradient(r.name)
                              )}
                            >
                              {getInitials(r.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                                {r.name}
                              </span>
                              {r.referralCode && r.referralCode !== "-" && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                                  {r.referralCode}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground font-medium truncate max-w-[220px]">
                              {r.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 text-sm font-medium">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-semibold border border-primary/15 whitespace-nowrap">
                          {r.category || "General"}
                        </span>
                      </td>

                      {/* Referred Count */}
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handlePreview(r)}
                          className={cn(
                            "inline-flex items-center justify-center px-3.5 py-1 rounded-full text-xs font-bold transition-all border shadow-2xs gap-1",
                            hasReferrals
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-secondary text-muted-foreground border-border/80"
                          )}
                        >
                          <span>{r.referredCount || 0}</span>
                          {hasReferrals && <ArrowUpRight size={12} className="opacity-70" />}
                        </button>
                      </td>

                      {/* Referred By */}
                      <td className="px-6 py-4 text-sm">
                        {isDirect ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/80 text-muted-foreground text-xs font-medium border border-border/60">
                            Direct
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-xs">
                              {r.referredBy}
                            </span>
                            {r.referredByDetails?.referralCode && (
                              <span className="text-[10px] font-mono text-muted-foreground">
                                Ref: {r.referredByDetails.referralCode}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-xl hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors mx-auto"
                          onClick={() => handlePreview(r)}
                          title="View Referred Members"
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalRecords > 0 && (
          <div className="px-6 py-3 border-t border-border bg-card">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalRecords}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </motion.div>

      {/* Large & Spacious Preview Dialog: Referred Members Details */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="!max-w-6xl w-[94vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
          {/* Header */}
          <DialogHeader className="p-6 pb-5 pr-14 border-b border-border/70 bg-gradient-to-r from-secondary/40 via-card to-secondary/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xs flex-shrink-0">
                  <Users size={24} className="text-primary" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-bold text-foreground tracking-tight">Referral Details</DialogTitle>
                    {previewData.referrer?.referralCode && (
                      <span className="font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                        {previewData.referrer.referralCode}
                      </span>
                    )}
                  </div>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Showing all members invited and registered through{" "}
                    <span className="font-bold text-foreground">{previewData.referrer?.name || selectedReferral?.name}</span>'s referral code
                  </DialogDescription>
                </div>
              </div>

              {/* Total Referred counter badge */}
              <div className="flex items-center gap-2.5 bg-card border border-border px-3.5 py-1.5 rounded-2xl shadow-2xs flex-shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Referred
                </span>
                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-xl bg-primary/10 text-primary font-black text-sm border border-primary/20">
                  {previewData.referredMembers.length}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* Dialog Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {previewLoading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 size={36} className="animate-spin text-primary" />
                <p className="text-xs font-semibold text-muted-foreground">Loading referral network details...</p>
              </div>
            ) : previewData.referredMembers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <Users size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-foreground">No Referred Members Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    This member has not successfully referred any new members to the network yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-secondary/50 border-b border-border">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-16 text-center">
                        S.No
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[200px]">
                        Member Name
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[240px]">
                        Email / Mobile
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[180px]">
                        Category
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground min-w-[140px]">
                        Joined Date
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center w-36">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {previewData.referredMembers.map((member: any, idx: number) => (
                      <tr key={member.id || idx} className="hover:bg-secondary/30 transition-colors">
                        {/* S.No */}
                        <td className="px-5 py-4 text-center text-xs font-bold text-muted-foreground">
                          {idx + 1}
                        </td>

                        {/* Member Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-border/80 flex-shrink-0 shadow-2xs">
                              {member.profilePhoto && (
                                <AvatarImage
                                  src={getFullUrl(member.profilePhoto)}
                                  alt={member.name}
                                  className="object-cover"
                                />
                              )}
                              <AvatarFallback
                                className={cn(
                                  "text-[11px] font-bold flex items-center justify-center",
                                  getAvatarGradient(member.name)
                                )}
                              >
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">
                                {member.name}
                              </span>
                              {member.reward > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                  <Gift size={10} /> +{member.reward} Points
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email / Mobile */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-foreground">{member.email}</span>
                            {member.mobileNumber && member.mobileNumber !== "-" && (
                              <span className="text-[11px] text-muted-foreground font-mono">{member.mobileNumber}</span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-secondary text-xs font-semibold text-foreground border border-border/70 whitespace-nowrap">
                            {member.category || "General"}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-4 text-xs text-muted-foreground font-medium whitespace-nowrap">
                          {member.date}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-2xs whitespace-nowrap",
                              member.status?.toLowerCase() === "active" || member.status?.toLowerCase() === "completed"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                                : member.status?.toLowerCase() === "pending"
                                ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60"
                                : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60"
                            )}
                          >
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 px-6 bg-secondary/30 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Showing {previewData.referredMembers.length} member{previewData.referredMembers.length !== 1 ? "s" : ""} in this referral chain
            </span>
            <Button
              size="sm"
              onClick={() => setPreviewOpen(false)}
              className="rounded-xl px-6 font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-all shadow-sm"
            >
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralsPage;
