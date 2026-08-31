import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Coins, Phone, MessageCircle, MoreVertical, History } from "lucide-react";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { mockPoints, mockMembers } from "@/data/mockData";
import type { PointEntry } from "@/types";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPointsHistory } from "@/api/PointsApi";
import { PrivateAvatar } from "@/components/common/PrivateAvatar";

interface ExtendedPointEntry extends PointEntry {
  companyName?: string;
  region?: string;
  memberCategory?: string;
  dateOfJoin?: string;
  subscriptionType?: string;
  mobileNumber?: string;
  profilePhoto?: string;
}

const PointsPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("points", "create");
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<ExtendedPointEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleOpenHistory = (memberId: string, memberName: string) => {
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
    setIsHistoryOpen(true);
  };

  const activeMemberHistory = useMemo(() => {
    if (!selectedMemberId) return [];
    let result = points.filter((p) => p.memberId === selectedMemberId);

    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [points, selectedMemberId, selectedCategory]);

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const res = await getPointsHistory();
      setPoints(res.data || []);
    } catch (error) {
      console.error("Failed to fetch points history:", error);
      // Fallback to localStorage or mockPoints if database/backend is unavailable
      const stored = localStorage.getItem("points");
      setPoints(stored ? JSON.parse(stored) : mockPoints);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  // Sync to localStorage whenever points change
  useEffect(() => {
    if (points.length > 0) {
      localStorage.setItem("points", JSON.stringify(points));
    }
  }, [points]);

  // Extract unique categories/modules dynamically from points history
  const categories = useMemo(() => {
    const list = new Set<string>();
    points.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return Array.from(list);
  }, [points]);

  const filteredPoints = useMemo(() => {
    let result = points;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.memberName.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.memberCategory?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return result;
  }, [points, searchQuery, selectedCategory]);

  const groupedPoints = useMemo(() => {
    const groups: Record<string, {
      memberId: string;
      memberName: string;
      company: string;
      region: string;
      points: number;
      latestModule: string;
      latestDate: string;
      memberCategory: string;
      dateOfJoin: string;
      subscriptionType: string;
      mobileNumber: string;
      profilePhoto?: string;
    }> = {};

    filteredPoints.forEach((p) => {
      const memberId = p.memberId;
      const company = p.companyName || mockMembers.find((m: any) => m.id === p.memberId || m?._id?.toString() === p.memberId)?.company || "";
      const region = p.region || mockMembers.find((m: any) => m.id === p.memberId || m?._id?.toString() === p.memberId)?.region || "-";
      if (!groups[memberId]) {
        groups[memberId] = {
          memberId,
          memberName: p.memberName,
          company,
          region,
          points: 0,
          latestModule: p.category || "-",
          latestDate: p.date,
          memberCategory: p.memberCategory || "-",
          dateOfJoin: p.dateOfJoin || "-",
          subscriptionType: p.subscriptionType || "BASIC",
          mobileNumber: p.mobileNumber || "-",
          profilePhoto: p.profilePhoto
        };
      }

      groups[memberId].points += p.points;

      if (new Date(p.date) >= new Date(groups[memberId].latestDate)) {
        groups[memberId].latestDate = p.date;
        if (p.category) {
          groups[memberId].latestModule = p.category;
        }
      }
    });

    const result = Object.values(groups);
    // ORDER BY LEAST POINT: Ascending order
    result.sort((a, b) => a.points - b.points);
    return result;
  }, [filteredPoints]);

  const paginatedGroupedPoints = useMemo(() => {
    const startIndex = (page - 1) * 10;
    return groupedPoints.slice(startIndex, startIndex + 10);
  }, [groupedPoints, page]);

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Points Ledger..."
          subtitle="Compiling points transactions and active configs"
        />
      )}
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Points Management</h1>
          </div>
        </div>

        {/* Search, Filters, Add - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:border-primary focus:ring-0 placeholder:text-muted-foreground/60"
            />
          </div>

          <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setPage(1); }}>
            <SelectTrigger className="h-9 w-36 rounded-lg text-xs bg-secondary/30 border-border focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canCreate && (
            <Link to="/allocate-points">
              <Button
                size="sm"
                className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
              >
                Allocate Points
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Points Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 whitespace-nowrap">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Member Name / Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Date Of Join</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Region</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Subscription Plan</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Points</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupedPoints.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground whitespace-nowrap">
                    No points entries found.
                  </td>
                </tr>
              ) : (
                paginatedGroupedPoints.map((p, index) => (
                  <tr key={p.memberId} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-foreground whitespace-nowrap">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <PrivateAvatar
                          src={p.profilePhoto}
                          fallbackName={p.memberName}
                          className="h-9 w-9"
                          avatarImageClassName="object-cover"
                          avatarFallbackClassName="text-xs font-bold bg-primary/10 text-primary"
                        />
                        <div>
                          <p className="text-sm font-bold text-foreground">{p.memberName.toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                            {p.memberCategory}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold whitespace-nowrap">
                      {p.dateOfJoin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-foreground">{p.region}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2.5 py-1 font-bold rounded-full bg-slate-100 text-slate-800 uppercase tracking-wide">
                        {p.subscriptionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground whitespace-nowrap">
                      {p.points}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 rounded-full">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4 text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 font-sans">
                          <DropdownMenuItem
                            onClick={() => handleOpenHistory(p.memberId, p.memberName)}
                            className="cursor-pointer gap-2"
                          >
                            <History className="w-4 h-4 text-slate-500" />
                            <span>History</span>
                          </DropdownMenuItem>

                          {p.mobileNumber && p.mobileNumber !== "-" && (
                            <>
                              <DropdownMenuItem asChild>
                                <a
                                  href={`tel:${p.mobileNumber}`}
                                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                  <Phone className="w-4 h-4 text-slate-505" />
                                  <span>Call Member</span>
                                </a>
                              </DropdownMenuItem>

                              <DropdownMenuItem asChild>
                                <a
                                  href={`https://wa.me/${p.mobileNumber.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                  <MessageCircle className="w-4 h-4 text-slate-505" />
                                  <span>WhatsApp</span>
                                </a>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <PaginationBar currentPage={page} totalPages={Math.ceil(groupedPoints.length / 10)} totalItems={groupedPoints.length} onPageChange={setPage} />
        </div>
      </motion.div>

      {/* Points History Modal Popup */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-xl w-[90vw] max-h-[80vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-4 border-b border-border flex-shrink-0">
            <DialogTitle className="text-base font-bold text-slate-800">
              Points Ledger History
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Detailed transactions ledger for <span className="font-bold text-foreground">{selectedMemberName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto pr-1 py-4">
            <div className="border border-border rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-border">
                    <th className="px-4 py-2.5 text-xs font-bold uppercase text-slate-500 w-28">Date</th>
                    <th className="px-4 py-2.5 text-xs font-bold uppercase text-slate-500">Reason / Module</th>
                    <th className="px-4 py-2.5 text-xs font-bold uppercase text-slate-500 text-right w-36">Points Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeMemberHistory.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-xs font-semibold">
                        No transactions recorded for this member.
                      </td>
                    </tr>
                  ) : (
                    activeMemberHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-xs text-slate-600 font-semibold">
                          {h.date}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-slate-800">
                            {h.reason || h.category || "Points Allocation"}
                          </p>
                          {h.category && h.category !== h.reason && (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Module: {h.category}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              h.points >= 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {h.points >= 0 ? "+" : ""}{h.points} {h.points >= 0 ? "Earned" : "Spent"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PointsPage;
