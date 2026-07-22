import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Users, Eye, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";

const ReferralsPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setReferrals([]);
    setLoading(false);
  }, []);

  const handlePreview = (referral: any) => {
    setSelectedReferral(referral);
    setPreviewOpen(true);
  };

  const filteredReferrals = referrals.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && referrals.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Mapping Referral Paths..."
          subtitle="Connecting chain nodes and member invitations"
        />
      )}
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Member Referrals</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8 pr-3 w-64 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && referrals.length > 0 && <TableLoader text="Syncing Referrals..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member Details</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Referred Count</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Referred By</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && referrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={5} columns={6} />
                  </td>
                </tr>
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center shadow-xs">
                        <Users size={28} className="text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-700">No Referrals Found</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {searchTerm
                            ? `No referral records matching "${searchTerm}". Try adjusting your search.`
                            : "There are currently no member referral records available."}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r, index) => (
                  <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 text-center text-sm text-foreground font-semibold">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{r.name}</span>
                        <span className="text-xs text-foreground font-semibold">{r.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      <span className="px-2 py-1 rounded-md bg-primary/5 text-primary text-[11px] font-bold border border-primary/10">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary font-semibold text-sm border border-border">
                        {r.referredCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      <span>{r.referredBy}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => handlePreview(r)}
                      >
                        <Eye size={16} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Referral Details</DialogTitle>
                <DialogDescription className="text-xs">
                  Showing members referred by <span className="font-bold text-foreground">{selectedReferral?.name}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="rounded-2xl border border-border bg-secondary/20 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">S.No</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {selectedReferral?.referredMembers?.map((member: any, idx: number) => (
                    <tr key={member.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-foreground font-semibold">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">{member.name}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-semibold">{member.email}</td>
                      <td className="px-4 py-3 text-sm text-foreground font-semibold">{member.date}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          member.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          member.status === 'Pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!selectedReferral?.referredMembers || selectedReferral.referredMembers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                        No members found in this referral chain.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-secondary/30 border-t border-border flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)} className="rounded-xl px-6 font-bold">
              Close Preview
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReferralsPage;
