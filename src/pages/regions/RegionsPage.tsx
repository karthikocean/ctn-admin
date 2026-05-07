import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Globe } from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { mockRegions } from "@/data/mockData";

const RegionsPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <div className="page-container">
      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Business Regions</h1>
          </div>
        </div>

        {/* Search, Filters, Add - aligned right on same row */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search regions..."
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Filters */}
          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

          {/* Add Region */}
          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
            onClick={() => setDrawerOpen(true)}
          >
            + Add Region
          </Button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">State</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Members</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockRegions.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-foreground font-medium">{r.country}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.state}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.city}</td>
                  <td className="px-6 py-4 text-sm text-primary font-semibold hidden sm:table-cell">{r.membersCount}</td>
                  <td className="px-6 py-4 text-right">
                    <ActionMenu onEdit={() => setDrawerOpen(true)} onDelete={() => {}} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4">
          <PaginationBar currentPage={page} totalPages={2} onPageChange={setPage} />
        </div>
      </motion.div>

      <FormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Add Region" description="Add a new business region">
        <div className="space-y-4">
          {["Country", "State", "City"].map((f) => (
            <div key={f}>
              <label className="text-sm font-medium text-foreground">{f}</label>
              <input className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={`Enter ${f.toLowerCase()}`} />
            </div>
          ))}
          <Button className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-4">Save Region</Button>
        </div>
      </FormDrawer>
    </div>
  );
};

export default RegionsPage;
