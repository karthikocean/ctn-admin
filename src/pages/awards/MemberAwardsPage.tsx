import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Medal, Award, MoreHorizontal } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { mockMembers, mockAwards } from "@/data/mockData";
import { Link } from "react-router-dom";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

const MemberAwardsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const memberAwardsSummary = useMemo(() => {
    return mockMembers.map(member => {
      const awards = mockAwards.filter(a => a.memberId === member.id);
      return {
        ...member,
        awardCount: awards.length,
        latestAward: awards.length > 0 ? awards[0].awardName : "None"
      };
    });
  }, []);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return memberAwardsSummary;
    const query = searchQuery.toLowerCase();
    return memberAwardsSummary.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.company.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query)
    );
  }, [memberAwardsSummary, searchQuery]);

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Member Awards..."
          subtitle="Mapping community achievements and badges"
        />
      )}
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Medal size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Member Awards List</h1>
          </div>
        </div>

        {/* Search, Filters - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search members..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* Members Table */}
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
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Company</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Awards</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Latest Award</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No members found.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">{m.company}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Award size={14} className={m.awardCount > 0 ? "text-amber-500" : "text-muted-foreground/30"} />
                        <span className={`text-sm font-bold ${m.awardCount > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                          {m.awardCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                      {m.latestAward !== "None" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                          {m.latestAward}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">No awards yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={m.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <PaginationBar currentPage={page} totalPages={Math.ceil(filteredMembers.length / 10)} onPageChange={setPage} />
        </div>
      </motion.div>
    </div>
  );
};

export default MemberAwardsPage;
