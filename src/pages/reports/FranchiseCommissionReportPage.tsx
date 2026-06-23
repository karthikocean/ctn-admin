import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, FileBarChart, Download, DollarSign, Upload, CheckCircle, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PaginationBar from "@/components/common/PaginationBar";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { getCommissionReport, settleCommission, uploadReceipt } from "@/api/FranchiseApi";

interface CommissionRecord {
  franchiseId: string;
  franchiseName: string;
  franchiseOwner: string;
  memberJoinedCount: number;
  month: string;
  totalAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  status: "pending" | "settled";
  paymentReceiptUrl: string | null;
  historyId: string | null;
}

const FranchiseCommissionReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [reportList, setReportList] = useState<CommissionRecord[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [month, setMonth] = useState("");

  // Settlement dialog states
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CommissionRecord | null>(null);
  const [settleStatus, setSettleStatus] = useState<"pending" | "settled">("settled");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingSettle, setSubmittingSettle] = useState(false);

  const { toast } = useToast();

  // Initialize month filter to current month YYYY-MM
  useEffect(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    setMonth(`${d.getFullYear()}-${mm}`);
  }, []);

  const fetchReport = async () => {
    if (!month) return;
    try {
      setLoading(true);
      const data = await getCommissionReport({
        page,
        limit: 10,
        month,
        search: searchTerm || undefined
      });
      setReportList(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch commission report",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (month) {
      const timer = setTimeout(() => {
        fetchReport();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [page, searchTerm, month]);

  const handleOpenSettle = (record: CommissionRecord) => {
    setSelectedRecord(record);
    setSettleStatus("settled");
    setReceiptFile(null);
    setSettleDialogOpen(true);
  };

  const handleSaveSettle = async () => {
    if (!selectedRecord) return;
    if (settleStatus === "settled" && !receiptFile) {
      toast({
        title: "File Required",
        description: "Please select a payment receipt file for settled status",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmittingSettle(true);
      let receiptUrl = selectedRecord.paymentReceiptUrl || undefined;

      // Upload file if selected
      if (receiptFile) {
        const uploadRes = await uploadReceipt(receiptFile);
        if (uploadRes.success && uploadRes.data && uploadRes.data.length > 0) {
          receiptUrl = uploadRes.data[0].url;
        } else {
          throw new Error("Receipt upload failed");
        }
      }

      await settleCommission({
        franchiseId: selectedRecord.franchiseId,
        month: selectedRecord.month,
        status: settleStatus,
        paymentReceiptUrl: receiptUrl
      });

      toast({
        title: "Success",
        description: `Settlement status updated successfully`,
        variant: "success"
      });
      setSettleDialogOpen(false);
      fetchReport();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update settlement",
        variant: "destructive"
      });
    } finally {
      setSubmittingSettle(false);
    }
  };

  // Convert month YYYY-MM to readable text e.g. "June 2026"
  const getReadableMonth = (mStr: string) => {
    if (!mStr) return "";
    const [year, month] = mStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && reportList.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Commission Report..."
          subtitle="Compiling franchise nodes activity and commission percentages"
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileBarChart size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Franchise Commission Report</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          {/* Month select input */}
          <div className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-xl border border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Month:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(0);
              }}
              className="bg-transparent border-none text-xs font-semibold text-foreground outline-none cursor-pointer h-7 pl-1"
            />
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search by franchise or owner..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="h-9 pl-8 pr-3 w-56 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Franchise Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Franchise Owner</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Members Joined</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Amount</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commission Amount</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportList.length === 0 && !loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No records found for the selected filter.
                  </td>
                </tr>
              ) : (
                reportList.map((r, index) => (
                  <tr key={r.franchiseId} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{(page * 10) + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{r.franchiseName}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{r.franchiseOwner}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold text-center">{r.memberJoinedCount}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold text-center">{getReadableMonth(r.month)}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold text-right">₹{r.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold text-right">
                      <div className="flex flex-col items-end">
                        <span>₹{r.commissionAmount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({r.commissionPercent}%)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={r.status === "settled" ? "default" : "secondary"}
                        className={
                          r.status === "settled"
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
                        }
                      >
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {r.status === "pending" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-[11px] font-bold border-amber-500/20 text-amber-600 hover:bg-amber-500/5"
                            onClick={() => handleOpenSettle(r)}
                          >
                            <DollarSign size={12} className="mr-1" />
                            Settle
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {r.paymentReceiptUrl && (
                              <a
                                href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${r.paymentReceiptUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                              >
                                <Eye size={12} />
                                View Receipt
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 pb-4 border-t">
          <PaginationBar
            currentPage={page + 1}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      </motion.div>

      {/* Settle Status Update Dialog Modal */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="sm:max-w-[420px] border-border rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="text-amber-500 w-4.5 h-4.5" />
              </div>
              Settle Franchise Commission
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Record a payment settlement transaction for <strong>{selectedRecord?.franchiseName}</strong> for {selectedRecord && getReadableMonth(selectedRecord.month)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Display Stats */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">Commission Amount</span>
                <span className="font-bold text-slate-800 text-sm">₹{selectedRecord?.commissionAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Commission Percent</span>
                <span className="font-semibold text-slate-800">{selectedRecord?.commissionPercent}%</span>
              </div>
            </div>

            {/* Select Status */}
            <div className="space-y-1.5">
              <label htmlFor="settleStatus" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Settlement Status</label>
              <Select
                value={settleStatus}
                onValueChange={(val: "pending" | "settled") => setSettleStatus(val)}
              >
                <SelectTrigger id="settleStatus" className="h-11 bg-white border border-slate-300 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="settled" className="text-xs">Settled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Receipt File Upload */}
            {settleStatus === "settled" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Upload Receipt / Proof</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-primary/50 transition-all rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setReceiptFile(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload size={18} className="text-muted-foreground mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    {receiptFile ? receiptFile.name : "Choose receipt image or PDF"}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Maximum size: 10MB</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-border text-xs font-bold"
              onClick={() => setSettleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={handleSaveSettle}
              disabled={submittingSettle}
            >
              {submittingSettle ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Save Settlement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FranchiseCommissionReportPage;
