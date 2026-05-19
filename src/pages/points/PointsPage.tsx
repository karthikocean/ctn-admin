import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Coins } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { mockPoints, mockMembers, modulePoints } from "@/data/mockData";
import type { PointEntry } from "@/types";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PointsPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("points", "create");
  const [points, setPoints] = useState<PointEntry[]>(() => {
    const stored = localStorage.getItem("points");
    return stored ? JSON.parse(stored) : mockPoints;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Sync to localStorage whenever points change
  useEffect(() => {
    localStorage.setItem("points", JSON.stringify(points));
  }, [points]);

  const filteredPoints = useMemo(() => {
    if (!searchQuery.trim()) return points;
    const query = searchQuery.toLowerCase();
    return points.filter(
      (p) =>
        p.memberName.toLowerCase().includes(query) ||
        p.reason.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) // PointEntry still uses 'category' for now as per type definition
    );
  }, [points, searchQuery]);

  const getPointsForModule = (module?: string) => {
    if (!module) return "-";
    return modulePoints[module] || "-";
  };

  return (
    <div className="page-container">
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
              placeholder="Search points allocations..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

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

      {/* Points Table - Read Only */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Module</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Points</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Reason</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPoints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No points entries found.
                  </td>
                </tr>
              ) : (
                filteredPoints.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.memberName}</p>
                        <p className="text-xs text-muted-foreground">
                          {mockMembers.find(m => m.id === p.memberId)?.company || ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">{p.category || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${p.type === "earned" ? "text-emerald-600" : "text-accent"}`}>
                        {p.type === "earned" ? "+" : ""}{p.points}
                        {p.category && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({getPointsForModule(p.category)})
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{p.reason}</td>
                    <td className="px-6 py-4"><StatusBadge status={p.type} /></td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{p.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <PaginationBar currentPage={page} totalPages={Math.ceil(filteredPoints.length / 10)} onPageChange={setPage} />
        </div>
      </motion.div>
    </div>
  );
};

export default PointsPage;
