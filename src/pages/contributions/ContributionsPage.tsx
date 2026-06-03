import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

const contributions = [
  { id: "1", member: "Arjun Mehta", type: "Business Lead", description: "Shared bulk cotton supplier contact", date: "2025-03-15", status: "active" },
  { id: "2", member: "Kavita Joshi", type: "Office Space", description: "Offered office space to new member", date: "2025-03-14", status: "completed" },
  { id: "3", member: "Manish Agarwal", type: "Mentorship", description: "Mentored 3 new members this month", date: "2025-03-12", status: "active" },
  { id: "4", member: "Suresh Nair", type: "Event Sponsorship", description: "Sponsored networking lunch event", date: "2025-03-10", status: "completed" },
];

const ContributionsPage = () => {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Contributions..."
          subtitle="Fetching community value exchange ledger"
        />
      )}
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Heart size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Contributions</h1>
          </div>
        </div>

        {/* Search, Filters - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search contributions..."
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button> */}

          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
          >
            Log Contribution
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Description</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contributions.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{c.member}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{c.type}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{c.description}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{c.date}</td>
                  <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4"><PaginationBar currentPage={page} totalPages={2} onPageChange={setPage} /></div>
      </motion.div>
    </div>
  );
};

export default ContributionsPage;
