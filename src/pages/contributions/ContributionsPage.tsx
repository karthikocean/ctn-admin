import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Heart, Filter, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import EmptyState from "@/components/common/EmptyState";
import { getContributions } from "@/api/ContributionsApi";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL.replace("/api/admin", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const ContributionsPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Additional advanced filters
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const fetchContributions = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: page - 1,
        limit,
      };
      if (search) params.search = search;
      if (typeFilter && typeFilter !== "all") params.type = typeFilter;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (startDate) params.startDate = format(startDate, "yyyy-MM-dd");
      if (endDate) params.endDate = format(endDate, "yyyy-MM-dd");

      const response = await getContributions(params);
      if (response && response.data) {
        setContributions(response.data);
        setTotalPages(response.totalPages || 1);
        setTotalCount(response.total || 0);
      } else {
        setContributions([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching contributions:", error);
      setContributions([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributions();
  }, [page, typeFilter, statusFilter, startDate, endDate]);

  // Reset page to 1 when filters change to avoid empty out-of-range pages
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchContributions();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formatType = (type: string) => {
    switch (type) {
      case "one_to_one":
        return "One to One";
      case "thank_you_slip":
        return "Thank You Slip";
      case "referral":
        return "Referral";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="page-container relative min-h-[600px] p-6 max-w-[1600px] mx-auto space-y-6">
      {loading && contributions.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Contributions..."
          subtitle="Fetching community value exchange ledger"
        />
      )}

      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        {/* Title Block */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Heart size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Contributions Log</h1>
            <p className="text-xs text-muted-foreground">
              Monitor value exchange network: One-to-Ones, Thank You Slips, and Referrals
            </p>
          </div>
        </div>

        {/* Search, Filters - aligned right on same row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search by member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-3 w-full sm:w-56 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 transition-all shadow-sm"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 w-full sm:w-44 rounded-xl border border-border bg-card text-sm shadow-sm focus:ring-primary/20">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border bg-card shadow-lg">
              <SelectItem value="all" className="focus:bg-secondary focus:text-primary">All Types</SelectItem>
              <SelectItem value="one_to_one" className="focus:bg-secondary focus:text-primary">One to One</SelectItem>
              <SelectItem value="thank_you_slip" className="focus:bg-secondary focus:text-primary">Thank You Slip</SelectItem>
              <SelectItem value="referral" className="focus:bg-secondary focus:text-primary">Referral</SelectItem>
            </SelectContent>
          </Select>

          {/* Advanced Filters Button */}
          <Button
            variant="outline"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`h-10 rounded-xl px-4 flex items-center gap-1.5 border border-border text-sm shadow-sm transition-all ${
              filtersExpanded 
                ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/15 hover:text-primary" 
                : "bg-card text-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <Filter size={15} />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {filtersExpanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 rounded-xl border border-border bg-transparent text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-card">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground">Start Date</label>
            <Popover modal={true}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-10 justify-start text-left font-normal rounded-xl border-border bg-transparent text-sm shadow-sm",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                  {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-semibold text-muted-foreground">End Date</label>
            <div className="flex gap-2">
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-10 justify-start text-left font-normal rounded-xl border-border bg-transparent text-sm shadow-sm",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(statusFilter !== "all" || startDate || endDate) && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setStatusFilter("all");
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  className="h-10 w-10 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 shrink-0"
                  title="Reset filters"
                >
                  <RefreshCw size={14} />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto animate-in fade-in duration-300">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 whitespace-nowrap">S.No</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member Connection</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contributions.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-8">
                    <EmptyState
                      title="No contributions found"
                      description="Try adjusting your search query or filters."
                    />
                  </td>
                </tr>
              ) : (
                contributions.map((c, index) => (
                  <tr key={c.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-4 py-4 text-center text-sm text-foreground font-semibold">{(page - 1) * limit + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                          {/* Sender profile photo */}
                          <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                            <AvatarImage
                              src={getFullUrl(c.sender?.profilePhoto)}
                              alt={c.sender?.fullName}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-[10px] text-primary font-bold">
                              {c.sender?.fullName?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          {/* Receiver profile photo */}
                          <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
                            <AvatarImage
                              src={getFullUrl(c.receiver?.profilePhoto)}
                              alt={c.receiver?.fullName}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-slate-100 text-[10px] text-muted-foreground font-bold">
                              {c.receiver?.fullName?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{c.sender?.fullName || "Unknown"}</span>
                            <span className="text-foreground/60 font-normal">➜</span>
                            <span className="text-foreground">{c.receiver?.fullName || "Unknown"}</span>
                          </p>
                          <p className="text-[10px] text-foreground font-semibold mt-0.5">
                            {c.sender?.businessName || "No business"} to {c.receiver?.businessName || "No business"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                        c.type === "one_to_one" 
                          ? "bg-blue-50 text-blue-700 border-blue-100" 
                          : c.type === "thank_you_slip"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-purple-50 text-purple-700 border-purple-100"
                      }`}>
                        {formatType(c.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {c.type === "thank_you_slip" && (
                            <span className="text-emerald-600 font-bold mr-1.5">
                              ₹{c.amount?.toLocaleString() || 0}
                            </span>
                          )}
                          {c.type === "referral" && (
                            <span className="text-primary font-bold mr-1.5">
                              {c.referralDetails?.referralName}
                            </span>
                          )}
                          <span>{c.description}</span>
                        </p>
                        {(c.businessDetails || c.referralDetails?.comments) && (
                          <p className="text-xs text-foreground font-semibold mt-0.5 max-w-md truncate">
                            {c.type === "thank_you_slip" ? c.businessDetails : c.referralDetails?.comments}
                          </p>
                        )}
                        {c.type === "referral" && (c.referralDetails?.referralMobile || c.referralDetails?.referralEmail) && (
                          <p className="text-xs text-foreground font-semibold mt-0.5">
                            {c.referralDetails.referralMobile} {c.referralDetails.referralEmail ? `| ${c.referralDetails.referralEmail}` : ""}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {formatDate(c.date)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 pb-4 border-t border-border pt-4 bg-card">
            <PaginationBar currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ContributionsPage;
