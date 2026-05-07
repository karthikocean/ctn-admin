import { motion } from "framer-motion";
import { Search, Filter, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import PaginationBar from "@/components/common/PaginationBar";
import { useState } from "react";

const connectionHistory = [
  { id: "1", from: "Arjun Mehta", to: "Kavita Joshi", type: "Business Lead", status: "active", date: "2025-03-15", response: "Accepted" },
  { id: "2", from: "Manish Agarwal", to: "Suresh Nair", type: "Referral", status: "pending", date: "2025-03-14", response: "Pending" },
  { id: "3", from: "Deepa Rao", to: "Arjun Mehta", type: "Service Request", status: "closed", date: "2025-03-12", response: "Completed" },
  { id: "4", from: "Pooja Desai", to: "Manish Agarwal", type: "Business Lead", status: "active", date: "2025-03-10", response: "In Progress" },
];

const ConnectionsPage = () => {
  const [page, setPage] = useState(1);

  return (
    <div className="page-container">
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
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
          >
            New Connection
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">From</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">To</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Type</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {connectionHistory.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{c.from}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{c.to}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{c.type}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{c.response}</td>
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

export default ConnectionsPage;
