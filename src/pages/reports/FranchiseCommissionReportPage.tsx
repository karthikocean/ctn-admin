import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Loader2,
  FileBarChart,
  DollarSign,
  Upload,
  Eye,
  Building2,
  User,
  Users,
  Calendar,
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Clock4,
  X,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PaginationBar from "@/components/common/PaginationBar";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { TableSkeleton } from "@/components/common/TableLoader";
import { getCommissionReport, settleCommission, uploadReceipt, getCommissionReportDetails } from "@/api/FranchiseApi";

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL.replace("/api/admin", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

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

interface MemberDetail {
  memberId: string;
  memberName: string;
  memberEmail?: string;
  memberPhone?: string;
  planName: string;
  planAmount: number;
  joinedDate: string;
  amount: number;
  isTrial?: boolean;
}

interface CommissionDetails {
  franchiseId: string;
  franchiseName: string;
  franchiseOwner: string;
  franchisePhone?: string;
  franchiseEmail?: string;
  franchiseRegion?: string;
  month: string;
  totalAmount: number;
  commissionAmount: number;
  commissionPercent: number;
  status: string;
  paymentReceiptUrl?: string | null;
  members: MemberDetail[];
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

  // View details dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDetails, setViewDetails] = useState<CommissionDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const { toast } = useToast();

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
        search: searchTerm || undefined,
      });
      setReportList(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch commission report",
        variant: "destructive",
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

  // Open settlement popup on status click
  const handleStatusClick = (record: CommissionRecord) => {
    setSelectedRecord(record);
    setSettleStatus(record.status === "settled" ? "settled" : "settled");
    setReceiptFile(null);
    setSettleDialogOpen(true);
  };

  const handleSaveSettle = async () => {
    if (!selectedRecord) return;
    if (settleStatus === "settled" && !receiptFile && !selectedRecord.paymentReceiptUrl) {
      toast({
        title: "File Required",
        description: "Please select a payment receipt file for settled status",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingSettle(true);
      let receiptUrl = selectedRecord.paymentReceiptUrl || undefined;

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
        paymentReceiptUrl: receiptUrl,
      });

      toast({
        title: "Success",
        description: `Settlement status updated successfully`,
        variant: "success",
      });
      setSettleDialogOpen(false);
      fetchReport();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update settlement",
        variant: "destructive",
      });
    } finally {
      setSubmittingSettle(false);
    }
  };

  // Open view details popup
  const handleViewDetails = async (record: CommissionRecord) => {
    setViewDetails(null);
    setViewDialogOpen(true);
    setViewLoading(true);
    try {
      const res = await getCommissionReportDetails({
        franchiseId: record.franchiseId,
        month: record.month,
      });
      setViewDetails(res.data || res);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load details",
        variant: "destructive",
      });
      setViewDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const getReadableMonth = (mStr: string) => {
    if (!mStr) return "";
    const [year, mon] = mStr.split("-");
    const date = new Date(Number(year), Number(mon) - 1, 1);
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

        <div className="flex flex-wrap items-center gap-3 ml-auto">
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
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && reportList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-0">
                    <TableSkeleton rows={5} columns={9} />
                  </td>
                </tr>
              ) : reportList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No records found for the selected filter.
                  </td>
                </tr>
              ) : (
                reportList.map((r, index) => (
                  <tr key={r.franchiseId} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">{page * 10 + index + 1}</td>
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

                    {/* Clickable status badge → opens settlement popup */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleStatusClick(r)}
                        title="Click to update settlement status"
                        className="focus:outline-none"
                      >
                        <Badge
                          className={
                            r.status === "settled"
                              ? "cursor-pointer bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
                              : "cursor-pointer bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                          }
                        >
                          {r.status === "settled" ? (
                            <CheckCircle2 size={10} className="mr-1" />
                          ) : (
                            <Clock4 size={10} className="mr-1" />
                          )}
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </Badge>
                      </button>
                    </td>

                    {/* View icon only */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetails(r)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-sm"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
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

      {/* ── Settlement Status Dialog ── */}
      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent className="sm:max-w-[440px] border-border rounded-2xl shadow-2xl p-0 overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-b border-border p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <DollarSign className="text-amber-500 w-4 h-4" />
                </div>
                Settle Franchise Commission
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                Update settlement status for{" "}
                <strong className="text-foreground">{selectedRecord?.franchiseName}</strong>{" "}
                — {selectedRecord && getReadableMonth(selectedRecord.month)}.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 p-5">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">Commission</span>
                <span className="font-bold text-foreground text-sm">
                  ₹{selectedRecord?.commissionAmount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Percent</span>
                <span className="font-semibold text-foreground">{selectedRecord?.commissionPercent}%</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Members</span>
                <span className="font-semibold text-foreground">{selectedRecord?.memberJoinedCount}</span>
              </div>
            </div>

            {/* Status selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Settlement Status
              </label>
              <Select
                value={settleStatus}
                onValueChange={(val: "pending" | "settled") => setSettleStatus(val)}
              >
                <SelectTrigger className="h-11 rounded-xl text-xs font-semibold border border-border">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="settled" className="text-xs">Settled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Receipt upload (only when settling) */}
            {settleStatus === "settled" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Upload Receipt / Proof
                </label>
                <div className="border-2 border-dashed border-border hover:border-primary/40 transition-all rounded-xl p-4 flex flex-col items-center justify-center bg-secondary/20 cursor-pointer relative">
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
                  <span className="text-xs font-semibold text-foreground">
                    {receiptFile ? receiptFile.name : "Choose receipt image or PDF"}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Maximum size: 10 MB</span>
                </div>
                {selectedRecord?.paymentReceiptUrl && !receiptFile && (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    ✓ Existing receipt on file. Upload a new one to replace.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="px-5 pb-5 gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-border text-xs font-bold flex-1"
              onClick={() => setSettleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-xs font-bold flex-1"
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

      {/* ── View Details Dialog ── */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[620px] border-border rounded-2xl shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border p-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Building2 size={18} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    {viewDetails?.franchiseName || "Franchise Details"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Commission Report — {viewDetails && getReadableMonth(viewDetails.month)}
                  </p>
                </div>
              </div>
              {viewDetails && (
                <Badge
                  className={
                    viewDetails.status === "settled"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                  }
                >
                  {viewDetails.status === "settled" ? (
                    <CheckCircle2 size={10} className="mr-1" />
                  ) : (
                    <Clock4 size={10} className="mr-1" />
                  )}
                  {viewDetails.status
                    ? viewDetails.status.charAt(0).toUpperCase() + viewDetails.status.slice(1)
                    : ""}
                </Badge>
              )}
            </div>
          </div>

          {viewLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : viewDetails ? (
            <div className="overflow-y-auto flex-1">
              {/* Franchise Info Cards */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Franchise Owner */}
                  <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/50 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Owner</span>
                      <span className="text-sm font-bold text-foreground block mt-0.5">{viewDetails.franchiseOwner}</span>
                      {viewDetails.franchiseEmail && (
                        <span className="text-[11px] text-muted-foreground">{viewDetails.franchiseEmail}</span>
                      )}
                      {viewDetails.franchisePhone && (
                        <span className="text-[11px] text-muted-foreground block">{viewDetails.franchisePhone}</span>
                      )}
                    </div>
                  </div>

                  {/* Members count */}
                  <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/50 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Users size={14} className="text-blue-500" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Members Joined</span>
                      <span className="text-2xl font-black text-foreground block mt-0.5 leading-none">{viewDetails.members?.length ?? 0}</span>
                      <span className="text-[11px] text-muted-foreground">{getReadableMonth(viewDetails.month)}</span>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="p-3.5 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <IndianRupee size={14} className="text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Total Amount</span>
                      <span className="text-sm font-black text-emerald-600 block mt-0.5">
                        ₹{viewDetails.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Commission */}
                  <div className="p-3.5 rounded-xl bg-primary/[0.05] border border-primary/20 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CreditCard size={14} className="text-primary" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Commission</span>
                      <span className="text-sm font-black text-primary block mt-0.5">
                        ₹{viewDetails.commissionAmount?.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{viewDetails.commissionPercent}% rate</span>
                    </div>
                  </div>
                </div>

                {/* Members Table */}
                <div>
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users size={12} />
                    Members Joined This Month
                  </h3>

                  {(() => { const paidMembers = (viewDetails.members || []).filter((m: any) => !m.isTrial); return paidMembers.length > 0 ? (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-secondary/60 border-b border-border">
                            <th className="text-left px-4 py-2.5 font-bold text-muted-foreground uppercase tracking-wider">#</th>
                            <th className="text-left px-4 py-2.5 font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                            <th className="text-left px-4 py-2.5 font-bold text-muted-foreground uppercase tracking-wider">Plan</th>
                            <th className="text-center px-4 py-2.5 font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="text-right px-4 py-2.5 font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {paidMembers.map((m: any, i: number) => (
                            <tr
                              key={m.memberId || i}
                              className="hover:bg-secondary/20 transition-colors"
                            >
                              <td className="px-4 py-3 text-muted-foreground font-semibold">{i + 1}</td>
                              <td className="px-4 py-3">
                                <div>
                                  <span className="font-bold text-foreground block">{m.memberName}</span>
                                  {m.memberEmail && (
                                    <span className="text-muted-foreground text-[10px]">{m.memberEmail}</span>
                                  )}
                                  {m.memberPhone && !m.memberEmail && (
                                    <span className="text-muted-foreground text-[10px]">{m.memberPhone}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/8 border border-primary/15 text-primary font-semibold text-[11px]">
                                  {m.planName}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground font-medium">
                                <div className="flex items-center justify-center gap-1">
                                  <Calendar size={10} />
                                  {m.joinedDate
                                    ? new Date(m.joinedDate).toLocaleDateString("en-IN", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "—"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-foreground">
                                ₹{(m.amount ?? m.planAmount ?? 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border p-6 text-center text-xs text-muted-foreground">
                      No member records found for this period.
                    </div>
                  ); })()}
                  {/* Settlement Receipt — only when settled */}
                  {viewDetails.status === "settled" && viewDetails.paymentReceiptUrl && (
                    <div className="mt-4">
                      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Paperclip size={12} />
                        Settlement Receipt
                      </h3>
                      <a
                        href={getFullUrl(viewDetails.paymentReceiptUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-500/5 hover:opacity-90 transition-opacity group"
                      >
                        <img
                          src={getFullUrl(viewDetails.paymentReceiptUrl)}
                          alt="Settlement Receipt"
                          className="w-full object-contain max-h-72"
                          onError={(e) => {
                            // fallback to link card if image fails
                            const el = e.currentTarget.parentElement;
                            if (el) el.innerHTML = `<div class="flex items-center gap-3 p-3.5"><span class="text-xs font-bold text-emerald-700 truncate">${viewDetails.paymentReceiptUrl!.split("/").pop()}</span><span class="text-[10px] text-muted-foreground">Click to open</span></div>`;
                          }}
                        />
                        <div className="flex items-center justify-between px-3 py-2 border-t border-emerald-500/20 bg-emerald-500/5">
                          <span className="text-[10px] text-emerald-700 font-semibold truncate">
                            {viewDetails.paymentReceiptUrl.split("/").pop()}
                          </span>
                          <ExternalLink size={11} className="text-emerald-600 flex-shrink-0 ml-2" />
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Footer */}
          <div className="flex justify-end p-4 bg-secondary/10 border-t border-border flex-shrink-0">
            <Button
              variant="outline"
              className="h-9 rounded-xl px-6 text-xs font-bold border-2 hover:bg-primary hover:text-white hover:border-primary transition-all"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FranchiseCommissionReportPage;
