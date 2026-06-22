import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Coins } from "lucide-react";
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
import { getPointsHistory } from "@/api/PointsApi";

interface ExtendedPointEntry extends PointEntry {
  companyName?: string;
  region?: string;
}

const PointsPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("points", "create");
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<ExtendedPointEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);

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
          p.category?.toLowerCase().includes(query)
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

    return Object.values(groups);
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
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Region</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Module</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Points</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groupedPoints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No points entries found.
                  </td>
                </tr>
              ) : (
                paginatedGroupedPoints.map((p, index) => (
                  <tr key={p.memberId} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">
                      {(page - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.memberName}</p>
                        <p className="text-xs text-muted-foreground font-semibold">
                          {p.company}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-foreground">{p.region}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-foreground">{p.latestModule}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${p.points >= 0 ? "text-emerald-600" : "text-accent"}`}>
                        {p.points >= 0 ? "+" : ""}{p.points}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold hidden md:table-cell">{p.latestDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <PaginationBar currentPage={page} totalPages={Math.ceil(groupedPoints.length / 10)} onPageChange={setPage} />
        </div>
      </motion.div>
    </div>
  );
};

export default PointsPage;
