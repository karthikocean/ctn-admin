import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getConnections } from "@/api/ConnectionsApi";
import { PrivateAvatar } from "@/components/common/PrivateAvatar";

const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
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
  const charCode = name.charCodeAt(0) || 0;
  return gradients[charCode % gradients.length];
};

const ConnectionsPage = () => {
  const [connections, setConnections] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalConnections, setTotalConnections] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchConnections = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: page - 1,
        limit: 10,
      };
      if (search) params.search = search;

      const result = await getConnections(params);
      setConnections(result.data || []);
      setTotalConnections(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getStatusLabel = (status: string) => {
    if (status === "ACCEPTED") return "accepted";
    if (status === "PENDING") return "pending";
    if (status === "REJECTED") return "rejected";
    if (status === "CANCELLED") return "cancelled";
    if (status === "BLOCKED") return "blocked";
    return status.toLowerCase();
  };

  const formatResponseText = (status: string) => {
    if (!status) return "";
    return status.charAt(0) + status.slice(1).toLowerCase();
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
            <h1 className="text-base font-semibold text-foreground">Connections History</h1>
          </div>
        </div>

        {/* Search, Filters - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search connections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button> */}

          {/* <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
          >
            New Connection
          </Button> */}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 whitespace-nowrap">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {connections.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No connections found
                  </td>
                </tr>
              ) : (
                connections.map((c, index) => (
                  <tr key={c._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 text-center text-sm text-foreground font-semibold">{(page - 1) * 10 + index + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <PrivateAvatar
                          src={c.sender?.profilePhoto}
                          fallbackName={c.sender?.fullName}
                          className="h-9 w-9 border border-slate-200 flex-shrink-0 shadow-sm"
                          avatarImageClassName="object-cover"
                          avatarFallbackClassName={cn("text-xs font-bold flex items-center justify-center border", getAvatarGradient(c.sender?.fullName || "?"))}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 leading-tight">{c.sender?.fullName || "Unknown"}</span>
                          <span className="text-[11px] text-muted-foreground font-medium mt-0.5 max-w-[180px] truncate" title={c.sender?.businessName || ""}>
                            {c.sender?.businessName || ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      <div className="flex items-center gap-3">
                        <PrivateAvatar
                          src={c.receiver?.profilePhoto}
                          fallbackName={c.receiver?.fullName}
                          className="h-9 w-9 border border-slate-200 flex-shrink-0 shadow-sm"
                          avatarImageClassName="object-cover"
                          avatarFallbackClassName={cn("text-xs font-bold flex items-center justify-center border", getAvatarGradient(c.receiver?.fullName || "?"))}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 leading-tight">{c.receiver?.fullName || "Unknown"}</span>
                          <span className="text-[11px] text-muted-foreground font-medium mt-0.5 max-w-[180px] truncate" title={c.receiver?.businessName || ""}>
                            {c.receiver?.businessName || ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={getStatusLabel(c.status)} />
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold hidden md:table-cell">
                      {c.createdAt ? c.createdAt.split("T")[0] : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && connections.length > 0 && (
          <div className="px-6 pb-4">
            <PaginationBar currentPage={page} totalPages={totalPages} totalItems={totalConnections} onPageChange={setPage} />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ConnectionsPage;
