import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  FileBarChart,
  Download,
  Search,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  ShieldAlert,
  Phone,
  Building2,
  MapPin,
  Crown,
  Zap,
  Sparkles,
  CreditCard,
  Loader2
} from "lucide-react";
import ChartCard from "@/components/common/ChartCard";
import StatCard from "@/components/common/StatCard";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import PaginationBar from "@/components/common/PaginationBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { regionData, monthlyData } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { getRegions } from "@/api/RegionApi";
import { getPlans } from "@/api/PlansApi";
import {
  getSubscriptionRenewalsReport,
  getFreeSubscriptionEndingsReport,
  ReportQueryParams
} from "@/api/ReportsApi";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ["hsl(210,97%,23%)", "hsl(0,72%,50%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(262,83%,58%)", "hsl(210,60%,50%)"];

const getFullUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const baseUrl = import.meta.env.VITE_API_URL?.replace("/api/admin", "").replace("/api", "") || "http://localhost:5001";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const getAvatarGradient = (name: string) => {
  const gradients = [
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
  ];
  const charCode = (name && name.length > 0) ? name.charCodeAt(0) : 0;
  return gradients[charCode % gradients.length];
};

interface ReportsPageProps {
  defaultTab?: "renewals" | "free-endings" | "points" | "region";
}

const ReportsPage = ({ defaultTab = "renewals" }: ReportsPageProps) => {
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  // Role-Based Access Control
  const canViewReports = hasPermission("reports", "view");
  const canExportReports = hasPermission("reports", "export") || hasPermission("reports", "view");

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Reset filters whenever switching between report tabs/pages
  useEffect(() => {
    setSearch("");
    setStatusFilter("ALL");
    setRegionFilter("ALL");
    setPlanFilter("ALL");
    setStartDate("");
    setEndDate("");
    setPage(0);
  }, [activeTab]);

  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // Filter States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setPage(0);
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setPage(0);
  };

  // Subscription Renewals Data
  const [renewalsData, setRenewalsData] = useState<any[]>([]);
  const [renewalsSummary, setRenewalsSummary] = useState({
    total: 0,
    dueSoon: 0,
    expired: 0,
    active: 0
  });
  const [renewalsTotal, setRenewalsTotal] = useState(0);

  // Free Subscription Endings Data
  const [freeEndingsData, setFreeEndingsData] = useState<any[]>([]);
  const [freeEndingsSummary, setFreeEndingsSummary] = useState({
    total: 0,
    endingSoon: 0,
    expired: 0,
    activeTrial: 0
  });
  const [freeEndingsTotal, setFreeEndingsTotal] = useState(0);

  // Load Regions & Plans
  useEffect(() => {
    if (!canViewReports) return;

    const loadDropdowns = async () => {
      try {
        const [regRes, planRes] = await Promise.allSettled([
          getRegions({ limit: 100 }),
          getPlans({ limit: 100 })
        ]);

        if (regRes.status === "fulfilled" && regRes.value.data) {
          const list = Array.isArray(regRes.value.data)
            ? regRes.value.data
            : regRes.value.data.data || regRes.value.data.list || [];
          setRegions(list);
        }

        if (planRes.status === "fulfilled" && planRes.value.data) {
          const list = Array.isArray(planRes.value.data)
            ? planRes.value.data
            : planRes.value.data.data || planRes.value.data.list || [];
          setPlans(list);
        }
      } catch (err) {
        console.error("Failed to load filter dropdowns:", err);
      }
    };

    loadDropdowns();
  }, [canViewReports]);

  // Flatten regions to area options for dropdown filter
  const regionOptions = useMemo(() => {
    const options: { id: string; name: string; city?: string }[] = [];
    regions.forEach((r: any) => {
      if (r.areas && Array.isArray(r.areas) && r.areas.length > 0) {
        r.areas.forEach((area: any) => {
          if (area._id && area.name) {
            options.push({
              id: area._id,
              name: area.name,
              city: r.city || r.state || ""
            });
          }
        });
      } else if (r._id) {
        options.push({
          id: r._id,
          name: r.name || r.regionName || "Region",
          city: r.city || ""
        });
      }
    });
    return options;
  }, [regions]);

  const [regionPopoverOpen, setRegionPopoverOpen] = useState(false);
  const [regionSearchTerm, setRegionSearchTerm] = useState("");
  const [visibleReportRegionCount, setVisibleReportRegionCount] = useState(10);

  const filteredReportRegions = useMemo(() => {
    if (!regionSearchTerm.trim()) return regionOptions;
    const q = regionSearchTerm.toLowerCase().trim();
    return regionOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.city && opt.city.toLowerCase().includes(q))
    );
  }, [regionOptions, regionSearchTerm]);

  const visibleReportRegions = useMemo(() => {
    return filteredReportRegions.slice(0, visibleReportRegionCount);
  }, [filteredReportRegions, visibleReportRegionCount]);

  const handleReportRegionScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 30) {
      if (visibleReportRegionCount < filteredReportRegions.length) {
        setVisibleReportRegionCount((prev) => prev + 10);
      }
    }
  };

  // Dynamic API call when searching regions in popover
  useEffect(() => {
    if (!regionPopoverOpen) return;

    const timer = setTimeout(async () => {
      try {
        const res = await getRegions({
          search: regionSearchTerm.trim() || undefined,
          limit: 100
        });
        if (res && res.data) {
          const list = Array.isArray(res.data)
            ? res.data
            : res.data.data || res.data.list || [];
          setRegions(list);
        }
      } catch (err) {
        console.error("Failed to fetch regions search from API:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [regionSearchTerm, regionPopoverOpen]);

  const selectedRegionLabel = useMemo(() => {
    if (regionFilter === "ALL") return "All Regions";
    const found = regionOptions.find((r) => r.id === regionFilter);
    return found ? (found.city ? `${found.name} (${found.city})` : found.name) : "Region";
  }, [regionFilter, regionOptions]);

  // Fetch Report Data
  const fetchReportData = async () => {
    if (!canViewReports) return;

    setLoading(true);
    try {
      const queryParams: ReportQueryParams = {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        regionId: regionFilter !== "ALL" ? regionFilter : undefined,
        planId: planFilter !== "ALL" ? planFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        fromDate: startDate || undefined,
        toDate: endDate || undefined
      };

      if (activeTab === "renewals") {
        const res = await getSubscriptionRenewalsReport(queryParams);
        if (res.success && res.data) {
          setRenewalsData(res.data.list || []);
          setRenewalsTotal(res.data.total || 0);
          if (res.data.summary) setRenewalsSummary(res.data.summary);
        }
      } else if (activeTab === "free-endings") {
        const res = await getFreeSubscriptionEndingsReport(queryParams);
        if (res.success && res.data) {
          setFreeEndingsData(res.data.list || []);
          setFreeEndingsTotal(res.data.total || 0);
          if (res.data.summary) setFreeEndingsSummary(res.data.summary);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch report data:", err);
      toast({
        title: "Error Loading Report",
        description: err.response?.data?.message || "Failed to load report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, regionFilter, planFilter, startDate, endDate, activeTab]);

  useEffect(() => {
    if (activeTab === "renewals" || activeTab === "free-endings") {
      fetchReportData();
    }
  }, [page, search, statusFilter, regionFilter, planFilter, startDate, endDate, activeTab, canViewReports]);

  // Client-Side CSV Exporter
  const handleExportCSV = () => {
    if (!canExportReports) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to export report data.",
        variant: "destructive"
      });
      return;
    }

    const isRenewals = activeTab === "renewals";
    const dataToExport = isRenewals ? renewalsData : freeEndingsData;

    if (dataToExport.length === 0) {
      toast({
        title: "No Data",
        description: "There are no records to export.",
        variant: "default"
      });
      return;
    }

    const headers = isRenewals
      ? ["S.No", "Member Name", "Business Name", "Mobile Number", "Email", "Region", "Plan Title", "Billing Cycle", "Amount (INR)", "Start Date", "Expiry Date", "Days Remaining", "Status"]
      : ["S.No", "Member Name", "Business Name", "Mobile Number", "Email", "Region", "Plan Title", "Trial Duration (Days)", "Start Date", "Ending Date", "Days Remaining", "Status"];

    const csvRows = [headers.join(",")];

    dataToExport.forEach((row, idx) => {
      const sNo = page * limit + idx + 1;
      const values = isRenewals
        ? [
          `"${sNo}"`,
          `"${row.fullName || ""}"`,
          `"${row.businessName || ""}"`,
          `"${row.mobileNumber || ""}"`,
          `"${row.email || ""}"`,
          `"${row.regionName || ""}"`,
          `"${row.planName || ""}"`,
          `"${row.billingCycle || ""}"`,
          `"${row.amount || 0}"`,
          `"${row.startDate ? new Date(row.startDate).toLocaleDateString() : ""}"`,
          `"${row.endDate ? new Date(row.endDate).toLocaleDateString() : ""}"`,
          `"${row.daysRemaining}"`,
          `"${row.status}"`
        ]
        : [
          `"${sNo}"`,
          `"${row.fullName || ""}"`,
          `"${row.businessName || ""}"`,
          `"${row.mobileNumber || ""}"`,
          `"${row.email || ""}"`,
          `"${row.regionName || ""}"`,
          `"${row.planName || ""}"`,
          `"${row.trialDays || 0}"`,
          `"${row.startDate ? new Date(row.startDate).toLocaleDateString() : ""}"`,
          `"${row.endDate ? new Date(row.endDate).toLocaleDateString() : ""}"`,
          `"${row.daysRemaining}"`,
          `"${row.status}"`
        ];
      csvRows.push(values.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${isRenewals ? "Subscription_Renewals_Report" : "Free_Subscription_Endings_Report"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Report data exported to CSV successfully.",
      variant: "success"
    });
  };

  // Render Access Denied if user lacks permission
  if (!canViewReports) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[500px] text-center p-8 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100 shadow-xs">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 max-w-md">
          You do not have permission to view Reports. Please contact your system administrator to grant access to the Reports module.
        </p>
      </div>
    );
  }

  return (
    <div className="page-container relative space-y-6">
      {loading && renewalsData.length === 0 && freeEndingsData.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Subscription Reports..."
          subtitle="Synchronizing member renewal cycles and subscription metrics"
        />
      )}
      
      {/* Dynamic Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileBarChart size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {activeTab === "renewals"
                ? "Subscription Renewal Report"
                : activeTab === "free-endings"
                  ? "Free Subscription Ending Report"
                  : activeTab === "points"
                    ? "Points Report"
                    : "Region Report"}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              {activeTab === "renewals"
                ? "Monitor upcoming paid subscription renewals and expirations"
                : activeTab === "free-endings"
                  ? "Monitor free trial expirations and conversion opportunities"
                  : "Monitor network performance and activity metrics"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canExportReports && (activeTab === "renewals" || activeTab === "free-endings") && (
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold gap-1.5 border-slate-300 hover:bg-slate-50"
            >
              <Download size={14} />
              Export Report (CSV)
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val)} className="space-y-6">

        {/* ================= TAB 1: SUBSCRIPTION RENEWALS REPORT ================= */}
        <TabsContent value="renewals" className="space-y-6 mt-2">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-200/80 bg-white space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Paid Subscriptions</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-slate-900">{renewalsSummary.total}</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><CreditCard size={18} /></div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Renewals Due Soon (&le; 7 Days)</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-amber-900">{renewalsSummary.dueSoon}</span>
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700"><Clock size={18} /></div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-1">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Expired Subscriptions</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-red-900">{renewalsSummary.expired}</span>
                <div className="p-2 rounded-lg bg-red-100 text-red-700"><AlertTriangle size={18} /></div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Paid Plans</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-emerald-900">{renewalsSummary.active}</span>
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><CheckCircle2 size={18} /></div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="glass-card p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14} /> Filter Renewals
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setRegionFilter("ALL");
                  setPlanFilter("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-slate-500 hover:text-slate-900 h-7 px-2"
              >
                Reset Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-lg font-medium"
                />
              </div>

              {/* Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs rounded-lg font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" className="max-h-60 overflow-y-auto z-50">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DUE_SOON">Due Soon (&le; 7 Days)</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                </SelectContent>
              </Select>

              {/* Region Popover Command Dropdown */}
              <Popover
                open={regionPopoverOpen}
                onOpenChange={(open) => {
                  setRegionPopoverOpen(open);
                  if (open) {
                    setRegionSearchTerm("");
                    setVisibleReportRegionCount(10);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={regionPopoverOpen}
                    className="h-9 text-xs rounded-lg font-medium justify-between px-3 w-full bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all text-slate-800"
                  >
                    <span className="truncate text-slate-800 hover:text-slate-900 font-semibold">{selectedRegionLabel}</span>
                    <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50 text-slate-500 hover:text-slate-700" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  className="w-[260px] p-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-none"
                >
                  <Command shouldFilter={false} className="w-full">
                    <CommandInput
                      placeholder="Search region or area..."
                      className="h-9 text-xs"
                      value={regionSearchTerm}
                      onValueChange={(val) => {
                        setRegionSearchTerm(val);
                        setVisibleReportRegionCount(10);
                      }}
                    />
                    <CommandEmpty className="py-2 text-center text-xs text-slate-500">
                      No regions found.
                    </CommandEmpty>
                    <CommandList
                      className="max-h-60 overflow-y-auto"
                      onScroll={handleReportRegionScroll}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <CommandGroup>
                        <CommandItem
                          value="ALL"
                          onSelect={() => {
                            setRegionFilter("ALL");
                            setPage(0);
                            setRegionPopoverOpen(false);
                          }}
                          className="text-xs cursor-pointer hover:bg-slate-100 rounded-lg flex items-center justify-between py-1.5 px-2 font-medium"
                        >
                          <span className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                regionFilter === "ALL" ? "opacity-100 text-primary" : "opacity-0"
                              )}
                            />
                            All Regions
                          </span>
                        </CommandItem>
                        {visibleReportRegions.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={opt.id}
                            onSelect={() => {
                              setRegionFilter(opt.id);
                              setPage(0);
                              setRegionPopoverOpen(false);
                            }}
                            className="text-xs cursor-pointer hover:bg-slate-100 rounded-lg flex items-center justify-between py-1.5 px-2 font-medium"
                          >
                            <span className="flex items-center truncate">
                              <Check
                                className={cn(
                                  "mr-2 h-3.5 w-3.5 flex-shrink-0",
                                  regionFilter === opt.id ? "opacity-100 text-primary" : "opacity-0"
                                )}
                              />
                              {opt.name} {opt.city ? `(${opt.city})` : ""}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Plan */}
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-9 text-xs rounded-lg font-medium">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" className="max-h-60 overflow-y-auto z-50">
                  <SelectItem value="ALL">All Paid Plans</SelectItem>
                  {plans.filter(p => p.amount > 0 || p.billingType === "premium").map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Expiry Start Date (From Date) */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="h-9 text-xs rounded-lg font-medium"
                />
              </div>

              {/* Expiry End Date (To Date) */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="h-9 text-xs rounded-lg font-medium"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-center w-16">S.No</th>
                    <th className="px-6 py-4">Member Details</th>
                    <th className="px-6 py-4">Business Name</th>
                    <th className="px-6 py-4">Plan & Amount</th>
                    <th className="px-6 py-4">Location / Region</th>
                    <th className="px-6 py-4">Renewal Date</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-7 h-7 animate-spin text-[#003B73]" />
                          <p className="text-xs font-semibold text-slate-600">Loading Subscription Renewal Report...</p>
                        </div>
                      </td>
                    </tr>
                  ) : renewalsData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No renewal records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    renewalsData.map((row, index) => (
                      <tr key={row.memberId} className="hover:bg-slate-50/70 transition-colors">
                        {/* S.No */}
                        <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                          {page * limit + index + 1}
                        </td>

                        {/* Member Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-slate-200/80 flex-shrink-0 shadow-xs">
                              <AvatarImage
                                src={getFullUrl(row.profilePhoto)}
                                alt={row.fullName}
                                className="object-cover"
                              />
                              <AvatarFallback className={cn("text-xs font-bold flex items-center justify-center border", getAvatarGradient(row.fullName || "?"))}>
                                {row.fullName?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900 leading-snug tracking-tight">{row.fullName}</span>
                              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                <Phone size={10} className="text-slate-400" />
                                {row.mobileNumber}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Business Name */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-800 block">{row.businessName}</span>
                          {row.email !== "N/A" && (
                            <span className="text-xs text-muted-foreground font-medium block mt-0.5">
                              {row.email}
                            </span>
                          )}
                        </td>

                        {/* Plan & Amount */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm font-bold text-primary">
                            <Crown size={14} className="text-amber-500" />
                            {row.planName}
                          </div>
                          <span className="text-xs text-muted-foreground font-medium block mt-0.5 uppercase tracking-tight">
                            {row.billingCycle} • &#8377;{row.amount}
                          </span>
                        </td>

                        {/* Location / Region */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {row.regionName}
                          </span>
                        </td>

                        {/* Renewal Date & Days Remaining */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-900 block">
                            {row.endDate ? new Date(row.endDate).toLocaleDateString() : "N/A"}
                          </span>
                          <span className="text-[11px] font-medium block mt-0.5">
                            {row.daysRemaining < 0 ? (
                              <span className="text-red-600 font-semibold">Expired {Math.abs(row.daysRemaining)}d ago</span>
                            ) : row.daysRemaining === 0 ? (
                              <span className="text-amber-600 font-semibold">Expires Today</span>
                            ) : (
                              <span className={row.daysRemaining <= 7 ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                                {row.daysRemaining} days left
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          {row.status === "DUE_SOON" && (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              DUE SOON
                            </Badge>
                          )}
                          {row.status === "EXPIRED" && (
                            <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              EXPIRED
                            </Badge>
                          )}
                          {row.status === "ACTIVE" && (
                            <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              ACTIVE
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-200/90 bg-white">
              <PaginationBar
                currentPage={page + 1}
                totalPages={Math.ceil(renewalsTotal / limit) || 1}
                onPageChange={(p) => setPage(p - 1)}
              />
            </div>
          </div>
        </TabsContent>

        {/* ================= TAB 2: FREE SUBSCRIPTION ENDING REPORT ================= */}
        <TabsContent value="free-endings" className="space-y-6 mt-2">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 rounded-xl border border-slate-200/80 bg-white space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Free / Trial Users</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-slate-900">{freeEndingsSummary.total}</span>
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Clock size={18} /></div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Trial Ending Soon (&le; 7 Days)</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-amber-900">{freeEndingsSummary.endingSoon}</span>
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700"><AlertTriangle size={18} /></div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-1">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Trial Expired (Unconverted)</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-red-900">{freeEndingsSummary.expired}</span>
                <div className="p-2 rounded-lg bg-red-100 text-red-700"><Clock size={18} /></div>
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active Trials</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-black text-emerald-900">{freeEndingsSummary.activeTrial}</span>
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700"><Sparkles size={18} /></div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="glass-card p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={14} /> Filter Free & Trial Endings
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setRegionFilter("ALL");
                  setPlanFilter("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-slate-500 hover:text-slate-900 h-7 px-2"
              >
                Reset Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-lg font-medium"
                />
              </div>

              {/* Status */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs rounded-lg font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" className="max-h-60 overflow-y-auto z-50">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ENDING_SOON">Ending Soon (&le; 7 Days)</SelectItem>
                  <SelectItem value="EXPIRED">Trial Expired</SelectItem>
                  <SelectItem value="ACTIVE_TRIAL">Active Trial</SelectItem>
                </SelectContent>
              </Select>

              {/* Region Popover Command Dropdown */}
              <Popover
                open={regionPopoverOpen}
                onOpenChange={(open) => {
                  setRegionPopoverOpen(open);
                  if (open) {
                    setRegionSearchTerm("");
                    setVisibleReportRegionCount(10);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={regionPopoverOpen}
                    className="h-9 text-xs rounded-lg font-medium justify-between px-3 w-full bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all text-slate-800"
                  >
                    <span className="truncate text-slate-800 hover:text-slate-900 font-semibold">{selectedRegionLabel}</span>
                    <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50 text-slate-500 hover:text-slate-700" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="start"
                  className="w-[260px] p-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 animate-none"
                >
                  <Command shouldFilter={false} className="w-full">
                    <CommandInput
                      placeholder="Search region or area..."
                      className="h-9 text-xs"
                      value={regionSearchTerm}
                      onValueChange={(val) => {
                        setRegionSearchTerm(val);
                        setVisibleReportRegionCount(10);
                      }}
                    />
                    <CommandEmpty className="py-2 text-center text-xs text-slate-500">
                      No regions found.
                    </CommandEmpty>
                    <CommandList
                      className="max-h-60 overflow-y-auto"
                      onScroll={handleReportRegionScroll}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <CommandGroup>
                        <CommandItem
                          value="ALL"
                          onSelect={() => {
                            setRegionFilter("ALL");
                            setPage(0);
                            setRegionPopoverOpen(false);
                          }}
                          className="text-xs cursor-pointer hover:bg-slate-100 rounded-lg flex items-center justify-between py-1.5 px-2 font-medium"
                        >
                          <span className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                regionFilter === "ALL" ? "opacity-100 text-primary" : "opacity-0"
                              )}
                            />
                            All Regions
                          </span>
                        </CommandItem>
                        {visibleReportRegions.map((opt) => (
                          <CommandItem
                            key={opt.id}
                            value={opt.id}
                            onSelect={() => {
                              setRegionFilter(opt.id);
                              setPage(0);
                              setRegionPopoverOpen(false);
                            }}
                            className="text-xs cursor-pointer hover:bg-slate-100 rounded-lg flex items-center justify-between py-1.5 px-2 font-medium"
                          >
                            <span className="flex items-center truncate">
                              <Check
                                className={cn(
                                  "mr-2 h-3.5 w-3.5 flex-shrink-0",
                                  regionFilter === opt.id ? "opacity-100 text-primary" : "opacity-0"
                                )}
                              />
                              {opt.name} {opt.city ? `(${opt.city})` : ""}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Plan */}
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-9 text-xs rounded-lg font-medium">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" className="max-h-60 overflow-y-auto z-50">
                  <SelectItem value="ALL">All Free / Trial Plans</SelectItem>
                  {plans.filter(p => p.amount === 0 || p.billingType === "free").map((p: any) => (
                    <SelectItem key={p._id} value={p._id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Expiry Start Date (From Date) */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Date</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="h-9 text-xs rounded-lg font-medium"
                />
              </div>

              {/* Expiry End Date (To Date) */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Date</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="h-9 text-xs rounded-lg font-medium"
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 text-center w-16">S.No</th>
                    <th className="px-6 py-4">Member Details</th>
                    <th className="px-6 py-4">Business Name</th>
                    <th className="px-6 py-4">Plan & Trial Days</th>
                    <th className="px-6 py-4">Location / Region</th>
                    <th className="px-6 py-4">Trial Ending Date</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-7 h-7 animate-spin text-[#003B73]" />
                          <p className="text-xs font-semibold text-slate-600">Loading Free Subscription Ending Report...</p>
                        </div>
                      </td>
                    </tr>
                  ) : freeEndingsData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No free / trial records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    freeEndingsData.map((row, index) => (
                      <tr key={row.memberId} className="hover:bg-slate-50/70 transition-colors">
                        {/* S.No */}
                        <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                          {page * limit + index + 1}
                        </td>

                        {/* Member Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-slate-200/80 flex-shrink-0 shadow-xs">
                              <AvatarImage
                                src={getFullUrl(row.profilePhoto)}
                                alt={row.fullName}
                                className="object-cover"
                              />
                              <AvatarFallback className={cn("text-xs font-bold flex items-center justify-center border", getAvatarGradient(row.fullName || "?"))}>
                                {row.fullName?.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900 leading-snug tracking-tight">{row.fullName}</span>
                              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                <Phone size={10} className="text-slate-400" />
                                {row.mobileNumber}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Business Name */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-800 block">{row.businessName}</span>
                          {row.email !== "N/A" && (
                            <span className="text-xs text-muted-foreground font-medium block mt-0.5">
                              {row.email}
                            </span>
                          )}
                        </td>

                        {/* Plan & Trial Days */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm font-bold text-blue-600">
                            <Zap size={14} />
                            {row.planName}
                          </div>
                          <span className="text-xs text-muted-foreground font-medium block mt-0.5">
                            Duration: {row.trialDays} Days
                          </span>
                        </td>

                        {/* Location / Region */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {row.regionName}
                          </span>
                        </td>

                        {/* Trial Ending Date & Days Remaining */}
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-slate-900 block">
                            {row.endDate ? new Date(row.endDate).toLocaleDateString() : "N/A"}
                          </span>
                          <span className="text-[11px] font-medium block mt-0.5">
                            {row.daysRemaining < 0 ? (
                              <span className="text-red-600 font-semibold">Expired {Math.abs(row.daysRemaining)}d ago</span>
                            ) : row.daysRemaining === 0 ? (
                              <span className="text-amber-600 font-semibold">Ends Today</span>
                            ) : (
                              <span className={row.daysRemaining <= 7 ? "text-amber-600 font-semibold" : "text-blue-600 font-semibold"}>
                                {row.daysRemaining} days left
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          {row.status === "ENDING_SOON" && (
                            <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              ENDING SOON
                            </Badge>
                          )}
                          {row.status === "EXPIRED" && (
                            <Badge className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              EXPIRED
                            </Badge>
                          )}
                          {row.status === "ACTIVE_TRIAL" && (
                            <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                              TRIAL
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-slate-200/90 bg-white">
              <PaginationBar
                currentPage={page + 1}
                totalPages={Math.ceil(freeEndingsTotal / limit) || 1}
                onPageChange={(p) => setPage(p - 1)}
              />
            </div>
          </div>
        </TabsContent>

        {/* ================= TAB 3: POINTS REPORT ================= */}
        <TabsContent value="points" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Points Issued" value="42,500" icon="Activity" change="+18% this month" changeType="positive" />
            <StatCard title="Points Redeemed" value="12,300" icon="Gift" change="+5% this month" changeType="positive" />
            <StatCard title="Active Earners" value="845" icon="Users" />
          </div>
          <ChartCard title="Points Trend" subtitle="Monthly points activity">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
                <Tooltip />
                <Bar dataKey="points" fill="hsl(210,97%,23%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </TabsContent>

        {/* ================= TAB 4: REGION REPORT ================= */}
        <TabsContent value="region" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Members by Region">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={regionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={4}>
                    {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Region Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" width={100} />
                  <Tooltip />
                  <Bar dataKey="members" fill="hsl(0,72%,50%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
