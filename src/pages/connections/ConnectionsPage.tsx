import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Share2,
  Users,
  Search,
  Building2,
  Loader2,
  Calendar,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";
import { PrivateAvatar } from "@/components/common/PrivateAvatar";
import { cn } from "@/lib/utils";
import { getConnectionsSummary, getConnectionDrilldown } from "@/api/ConnectionsApi";

const getAvatarGradient = (name: string = "") => {
  const gradients = [
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
  ];
  const charCode = name.charCodeAt(0) || 0;
  return gradients[charCode % gradients.length];
};

type DrilldownType =
  | "sent_accepted"
  | "sent_rejected"
  | "received_accepted"
  | "received_rejected"
  | "direct_meet"
  | "recommendation_received"
  | "business_done";

const formatCompactAmount = (amount: number | string) => {
  const num = Number(amount) || 0;
  if (num === 0) return "₹0";

  if (num >= 1_000_000_000) {
    const val = (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
    return `₹${val}B`;
  }
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `₹${val}M`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1).replace(/\.0$/, "");
    return `₹${val}K`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
};

const metricTitles: Record<DrilldownType, string> = {
  sent_accepted: "Connection Accepted (Requested)",
  sent_rejected: "Connection Rejected (Requested)",
  received_accepted: "Connection Accepted (Received)",
  received_rejected: "Connection Rejected (Received)",
  direct_meet: "Direct 1-to-1 Meets",
  recommendation_received: "Recommendations Received",
  business_done: "Business Done (Thank You Slips)",
};

const ConnectionsPage = () => {
  // Main data state
  const [connections, setConnections] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalConnections, setTotalConnections] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Drilldown popup modal state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<DrilldownType>("sent_accepted");
  const [drilldownList, setDrilldownList] = useState<any[]>([]);
  const [drilldownPage, setDrilldownPage] = useState(1);
  const [drilldownTotalPages, setDrilldownTotalPages] = useState(1);
  const [drilldownTotalRecords, setDrilldownTotalRecords] = useState(0);
  const [drilldownSearch, setDrilldownSearch] = useState("");

  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: page - 1,
        limit: 10,
        search: search.trim() || undefined,
      };

      const result = await getConnectionsSummary(params);
      setConnections(result.data || []);
      setTotalConnections(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchConnections();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchConnections();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch drilldown list
  const loadDrilldownData = async (memberId: string, metricType: DrilldownType, pageNum: number, searchStr: string) => {
    setDrilldownLoading(true);
    try {
      const params = {
        memberId,
        type: metricType,
        page: pageNum - 1,
        limit: 10,
        search: searchStr.trim() || undefined,
      };

      const result = await getConnectionDrilldown(params);
      setDrilldownList(result.data || []);
      setDrilldownTotalRecords(result.total || 0);
      setDrilldownTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching drilldown details:", error);
      setDrilldownList([]);
      setDrilldownTotalRecords(0);
      setDrilldownTotalPages(1);
    } finally {
      setDrilldownLoading(false);
    }
  };

  // Debounced search and page change inside modal
  useEffect(() => {
    if (!drilldownOpen || !selectedMember?._id) return;
    const timer = setTimeout(() => {
      loadDrilldownData(selectedMember._id, selectedMetric, drilldownPage, drilldownSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [drilldownSearch, drilldownPage]);

  const handleOpenDrilldown = (member: any, metricType: DrilldownType, count: number) => {
    if (count <= 0) return;
    setSelectedMember(member);
    setSelectedMetric(metricType);
    setDrilldownPage(1);
    setDrilldownSearch("");
    setDrilldownList([]);
    setDrilldownLoading(true);
    setDrilldownOpen(true);
    loadDrilldownData(member._id, metricType, 1, "");
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {isLoading && connections.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Connections..."
          subtitle="Establishing network mapping nodes"
        />
      )}

      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Share2 size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Connections</h1>
          </div>
        </div>

        {/* Search - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search connections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-3 w-56 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                  S.No
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[220px]">
                  Member
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Sent Accepted
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Sent Rejected
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Received Accepted
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Received Rejected
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Direct Meet
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Recommendations
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Business Done
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {connections.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No connections found
                  </td>
                </tr>
              ) : (
                connections.map((c, index) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    {/* S.No */}
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {(page - 1) * 10 + index + 1}
                    </td>

                    {/* Member */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PrivateAvatar
                          src={c.profilePhoto}
                          fallbackName={c.fullName}
                          className="h-9 w-9 border border-slate-200 flex-shrink-0 shadow-sm"
                          avatarImageClassName="object-cover"
                          avatarFallbackClassName={cn("text-xs font-bold flex items-center justify-center border", getAvatarGradient(c.fullName || "?"))}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 leading-tight">
                            {c.fullName || "Unknown"}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-medium mt-0.5 max-w-[180px] truncate" title={c.businessName || ""}>
                            {c.businessName || ""}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Sent Accepted (he requested) */}
                    <td className="px-4 py-4 text-center">
                      {c.sentAcceptedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDrilldown(c, "sent_accepted", c.sentAcceptedCount)}
                          className="inline-flex items-center justify-center text-sm font-bold text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {c.sentAcceptedCount}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">0</span>
                      )}
                    </td>

                    {/* Sent Rejected (he requested) */}
                    <td className="px-4 py-4 text-center">
                      {c.sentRejectedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDrilldown(c, "sent_rejected", c.sentRejectedCount)}
                          className="inline-flex items-center justify-center text-sm font-bold text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {c.sentRejectedCount}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">0</span>
                      )}
                    </td>

                    {/* Received Accepted (he received) */}
                    <td className="px-4 py-4 text-center">
                      {c.receivedAcceptedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDrilldown(c, "received_accepted", c.receivedAcceptedCount)}
                          className="inline-flex items-center justify-center text-sm font-bold text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {c.receivedAcceptedCount}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">0</span>
                      )}
                    </td>

                    {/* Received Rejected (he received) */}
                    <td className="px-4 py-4 text-center">
                      {c.receivedRejectedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDrilldown(c, "received_rejected", c.receivedRejectedCount)}
                          className="inline-flex items-center justify-center text-sm font-bold text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {c.receivedRejectedCount}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">0</span>
                      )}
                    </td>

                    {/* Total Direct Meet Count */}
                    <td className="px-4 py-4 text-center">
                      {c.directMeetCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDrilldown(c, "direct_meet", c.directMeetCount)}
                          className="inline-flex items-center justify-center text-sm font-bold text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {c.directMeetCount}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">0</span>
                      )}
                    </td>

                    {/* Recommendation Received Count */}
                    <td className="px-4 py-4 text-center">
                      {c.recommendationReceivedCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenDrilldown(c, "recommendation_received", c.recommendationReceivedCount)}
                          className="inline-flex items-center justify-center text-sm font-bold text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          {c.recommendationReceivedCount}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">0</span>
                      )}
                    </td>

                    {/* Business Done Count */}
                    <td className="px-4 py-4 text-center">
                      {c.businessDoneCount > 0 ? (
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => handleOpenDrilldown(c, "business_done", c.businessDoneCount)}
                            className="inline-flex items-center justify-center text-sm font-bold text-primary hover:text-primary/80 hover:underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            {c.businessDoneCount}
                          </button>
                          {c.businessDoneAmount > 0 && (
                            <span
                              className="text-[10px] font-semibold text-emerald-600"
                              title={`₹${Number(c.businessDoneAmount).toLocaleString("en-IN")}`}
                            >
                              {formatCompactAmount(c.businessDoneAmount)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground font-semibold">0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && connections.length > 0 && (
          <div className="px-6 pb-4">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalConnections}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>

      {/* Member List Popup Dialog (Styled exactly like Regions Page Member Dialog) */}
      <Dialog
        open={drilldownOpen}
        onOpenChange={(open) => {
          setDrilldownOpen(open);
          if (!open) {
            setDrilldownList([]);
            setDrilldownSearch("");
            setSelectedMember(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px] border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="text-primary w-4 h-4" />
              </div>
              {metricTitles[selectedMetric]}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1">
              {drilldownTotalRecords} member{drilldownTotalRecords !== 1 ? "s" : ""} associated with{" "}
              <span className="font-semibold text-foreground">{selectedMember?.fullName}</span>
            </DialogDescription>
          </DialogHeader>

          {/* Search bar inside popup */}
          <div className="relative mt-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="Search in list..."
              value={drilldownSearch}
              onChange={(e) => setDrilldownSearch(e.target.value)}
              className="h-9 pl-9 pr-8 w-full rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
            {drilldownSearch && (
              <button
                type="button"
                onClick={() => setDrilldownSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="py-2 max-h-[380px] overflow-y-auto">
            {drilldownLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : drilldownList.length > 0 ? (
              <ul className="space-y-2">
                {drilldownList.map((item, idx) => (
                  <li
                    key={item._id || idx}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-colors"
                  >
                    <PrivateAvatar
                      src={item.profile}
                      fallbackName={item.name}
                      className="h-9 w-9 border border-slate-200 flex-shrink-0 shadow-sm"
                      avatarImageClassName="object-cover"
                      avatarFallbackClassName={cn("text-xs font-bold flex items-center justify-center border", getAvatarGradient(item.name || "?"))}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.name || "Unknown Member"}
                        </p>
                        {item.category && (
                          <Badge variant="secondary" className="text-[10px] text-foreground bg-slate-100 border-none font-semibold">
                            {item.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Building2 size={11} className="text-muted-foreground/70" />
                        {item.companyName || "N/A"}
                        {item.mobileNumber && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{item.mobileNumber}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {selectedMetric === "business_done" && item.details?.amount ? (
                        <span
                          className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full"
                          title={`₹${Number(item.details.amount).toLocaleString("en-IN")}`}
                        >
                          {formatCompactAmount(item.details.amount)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                          {item.status || "Active"}
                        </span>
                      )}
                      {item.date && (
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                          <Calendar size={10} />
                          {new Date(item.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {drilldownSearch ? "No matching members found in this list." : "No records found."}
              </p>
            )}
          </div>

          <DialogFooter className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Showing {drilldownList.length} of {drilldownTotalRecords} records
            </span>
            <div className="flex items-center gap-2">
              {drilldownTotalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={drilldownPage <= 1 || drilldownLoading}
                    onClick={() => setDrilldownPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-2 text-xs"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={drilldownPage >= drilldownTotalPages || drilldownLoading}
                    onClick={() => setDrilldownPage((p) => p + 1)}
                    className="h-8 px-2 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                className="rounded-xl border-border h-8 text-xs"
                onClick={() => setDrilldownOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectionsPage;
