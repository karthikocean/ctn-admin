import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, CreditCard, Eye, FileText, Loader2, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import StatusBadge from "@/components/common/StatusBadge";

// Mock Data for Billings
const MOCK_BILLINGS = [
  {
    id: "1",
    memberName: "John Doe",
    email: "john@example.com",
    categoryName: "Real Estate",
    planName: "Premium Tier",
    planStatus: "Active",
    billingHistory: [
      { id: "inv-001", invoiceNo: "INV/2024/001", date: "2024-03-01", amount: 4999, method: "Razorpay", status: "Paid" },
      { id: "inv-002", invoiceNo: "INV/2024/042", date: "2024-04-01", amount: 4999, method: "Razorpay", status: "Paid" },
    ]
  },
  {
    id: "2",
    memberName: "Sarah Smith",
    email: "sarah@example.com",
    categoryName: "Software",
    planName: "Basic Tier",
    planStatus: "Active",
    billingHistory: [
      { id: "inv-003", invoiceNo: "INV/2024/015", date: "2024-03-15", amount: 1999, method: "Stripe", status: "Paid" },
    ]
  },
  {
    id: "3",
    memberName: "Michael Brown",
    email: "michael@example.com",
    categoryName: "Finance",
    planName: "Intermediate Tier",
    planStatus: "Expired",
    billingHistory: [
      { id: "inv-004", invoiceNo: "INV/2023/112", date: "2023-12-01", amount: 2999, method: "Bank Transfer", status: "Paid" },
      { id: "inv-005", invoiceNo: "INV/2024/010", date: "2024-01-01", amount: 2999, method: "Bank Transfer", status: "Failed" },
    ]
  }
];

const BillingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [billings, setBillings] = useState<any[]>([]);
  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setBillings(MOCK_BILLINGS);
      setLoading(false);
    }, 800);
  }, []);

  const handlePreview = (billing: any) => {
    setSelectedBilling(billing);
    setPreviewOpen(true);
  };

  const filteredBillings = billings.filter(b => 
    b.memberName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.planName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Billing Management</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search member or plan..."
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
        {loading && billings.length > 0 && <TableLoader text="Fetching Billing Records..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Plan</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && billings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={5} columns={6} />
                  </td>
                </tr>
              ) : filteredBillings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No billing records found.
                  </td>
                </tr>
              ) : (
                filteredBillings.map((b, index) => (
                  <tr key={b.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 text-center text-xs font-medium text-muted-foreground">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{b.memberName}</span>
                        <span className="text-[11px] text-muted-foreground">{b.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-foreground">{b.categoryName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                        {b.planName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.planStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={() => handlePreview(b)}
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

      {/* Billing History Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border-border bg-card shadow-2xl">
          <DialogHeader className="p-8 pb-4 bg-secondary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                <FileText size={24} />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Billing History</DialogTitle>
                <DialogDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Invoices and payments for <span className="text-foreground font-bold">{selectedBilling?.memberName}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 pt-4">
            <div className="rounded-3xl border border-border bg-secondary/10 overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Invoice No</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Method</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {selectedBilling?.billingHistory?.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{invoice.invoiceNo}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{invoice.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-0.5 text-xs font-black text-foreground">
                          <IndianRupee size={12} className="text-primary" />
                          {invoice.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase bg-secondary/50 px-2 py-0.5 rounded border border-border">
                          {invoice.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                          'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!selectedBilling?.billingHistory || selectedBilling.billingHistory.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                        No invoices generated for this member.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6 bg-secondary/20 border-t border-border flex justify-between items-center">
             <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
               Total Records: {selectedBilling?.billingHistory?.length || 0}
             </div>
            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="rounded-xl px-8 h-11 font-black text-xs uppercase tracking-widest border-2 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95">
              Close Records
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingsPage;
