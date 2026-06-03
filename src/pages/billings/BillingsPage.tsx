import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, CreditCard, Eye, Loader2, IndianRupee, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";
import FormDrawer from "@/components/common/FormDrawer";
import ActionMenu from "@/components/common/ActionMenu";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import * as BillingsApi from "@/api/BillingsApi";
import * as MembersApi from "@/api/MembersApi";
import * as PlansApi from "@/api/PlansApi";

const BillingsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("billings", "create");
  const canEdit = hasPermission("billings", "edit");
  const canDelete = hasPermission("billings", "delete");

  const [loading, setLoading] = useState(true);
  const [billings, setBillings] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billingToDelete, setBillingToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<{
    memberId: string;
    planId: string;
    paymentType: string;
    amount: number;
    remarks: string;
  }>({
    memberId: "",
    planId: "",
    paymentType: "",
    amount: 0,
    remarks: "",
  });

  const fetchMembersAndPlans = async () => {
    try {
      const membersRes = await MembersApi.getMembers({ limit: 1000 });
      if (membersRes.data) {
        setMembers(membersRes.data);
      }
      const plansRes = await PlansApi.getPlans({ limit: 1000 });
      if (plansRes.data) {
        setPlans(plansRes.data);
      }
    } catch (error) {
      console.error("Failed to load members or plans:", error);
    }
  };

  const fetchBillings = async (search: string = "", pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await BillingsApi.getBillings({
        search: search,
        page: pageNum - 1,
        limit: pageSize,
      });
      if (response.data) {
        setBillings(response.data);
        setTotalPages(response.totalPages || Math.ceil((response.total || 0) / pageSize));
      }
    } catch (error: any) {
      console.error("Error fetching billings:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch billings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembersAndPlans();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBillings(searchTerm, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchBillings(searchTerm, p);
  };

  const handlePreview = (billing: any) => {
    setSelectedBilling(billing);
    setPreviewOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setFormData({
      memberId: "",
      planId: "",
      paymentType: "",
      amount: 0,
      remarks: "",
    });
  };

  const handleEdit = (billing: any) => {
    setEditingId(billing._id);
    setFormData({
      memberId: billing.memberId || "",
      planId: billing.planId || "",
      paymentType: billing.paymentType || "",
      amount: billing.amount || 0,
      remarks: billing.remarks || "",
    });
    setDrawerOpen(true);
  };

  const handlePlanChange = (selectedPlanId: string) => {
    const selectedPlan = plans.find((p) => p._id === selectedPlanId);
    setFormData((prev) => ({
      ...prev,
      planId: selectedPlanId,
      amount: selectedPlan ? selectedPlan.amount : prev.amount,
    }));
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.memberId) {
      newErrors.memberId = "Please select a member";
    }
    if (!formData.planId) {
      newErrors.planId = "Please select a subscription plan";
    }
    if (!formData.paymentType.trim()) {
      newErrors.paymentType = "Payment type is required";
    }
    if (formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setFormLoading(true);
    try {
      let response;
      if (editingId) {
        response = await BillingsApi.updateBilling(editingId, formData);
        toast({ title: "Updated", description: response.message || "Billing record updated successfully", variant: "success" });
      } else {
        response = await BillingsApi.createBilling(formData);
        toast({ title: "Created", description: response.message || "Billing record created successfully", variant: "success" });
      }
      fetchBillings(searchTerm, page);
      setDrawerOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving billing record:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save billing record",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setBillingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!billingToDelete) return;
    try {
      const response = await BillingsApi.deleteBilling(billingToDelete);
      toast({ title: "Deleted", description: response.message || "Billing record deleted successfully", variant: "success" });
      fetchBillings(searchTerm, page);
    } catch (error: any) {
      console.error("Error deleting billing record:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete billing record",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setBillingToDelete(null);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && billings.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Billing History..."
          subtitle="Fetching invoice status and ledger data"
        />
      )}
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

          {/* <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button> */}

          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs"
              onClick={() => {
                resetForm();
                setDrawerOpen(true);
              }}
            >
              <Plus size={14} className="mr-1.5" />
              Add Billing
            </Button>
          )}
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
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Type</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && billings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <TableSkeleton rows={5} columns={7} />
                  </td>
                </tr>
              ) : billings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No billing records found.
                  </td>
                </tr>
              ) : (
                billings.map((b, index) => (
                  <tr key={b._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 text-center text-xs font-medium text-muted-foreground">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{b.member?.fullName || "Unknown Member"}</span>
                        <span className="text-[11px] text-muted-foreground">{b.member?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                        {b.plan?.title || "Unknown Plan"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-foreground">₹{b.amount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border text-foreground">
                        {b.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onView={() => handlePreview(b)}
                        onEdit={canEdit ? () => handleEdit(b) : undefined}
                        onDelete={canDelete ? () => confirmDelete(b._id) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Section */}
        {!loading && billings.length > 0 && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </motion.div>

      {/* Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) resetForm();
        }}
        title={editingId ? "Edit Billing Record" : "Add Billing Record"}
        description={editingId ? "Update receipt parameters and transaction info" : "Log a new plan purchase / renewal billing event"}
      >
        <div className="space-y-6 pb-20 px-4">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Member <span className="text-red-500">*</span>
              </Label>
              <select
                className={`w-full mt-1.5 h-11 px-3 rounded-xl bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer border ${errors.memberId ? "border-red-500" : "border-border"
                  }`}
                value={formData.memberId}
                onChange={(e) => {
                  setFormData({ ...formData, memberId: e.target.value });
                  if (errors.memberId) setErrors((prev) => ({ ...prev, memberId: "" }));
                }}
              >
                <option value="">Choose Member...</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.fullName} ({m.email || m.mobileNumber})
                  </option>
                ))}
              </select>
              {errors.memberId && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.memberId}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Plan <span className="text-red-500">*</span>
              </Label>
              <select
                className={`w-full mt-1.5 h-11 px-3 rounded-xl bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer border ${errors.planId ? "border-red-500" : "border-border"
                  }`}
                value={formData.planId}
                onChange={(e) => {
                  handlePlanChange(e.target.value);
                  if (errors.planId) setErrors((prev) => ({ ...prev, planId: "" }));
                }}
              >
                <option value="">Choose Plan...</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} (₹{p.amount})
                  </option>
                ))}
              </select>
              {errors.planId && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.planId}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Amount Paid <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 });
                      if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
                    }}
                    className={`h-11 pl-7 rounded-xl bg-secondary/30 focus:ring-primary/20 border ${errors.amount ? "border-red-500" : "border-border"
                      }`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.amount}</p>
                )}
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Payment Type <span className="text-red-500">*</span>
                </Label>
                <select
                  className={`w-full mt-1.5 h-11 px-3 bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer border ${errors.paymentType ? "border-red-500" : "border-border"
                    }`}
                  value={formData.paymentType}
                  onChange={(e) => {
                    setFormData({ ...formData, paymentType: e.target.value });
                    if (errors.paymentType) setErrors((prev) => ({ ...prev, paymentType: "" }));
                  }}
                >
                  <option value="">Select Payment Type...</option>
                  <option value="Razorpay">Razorpay</option>
                  <option value="Stripe">Stripe</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Online">Online</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Other">Other</option>
                </select>
                {errors.paymentType && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.paymentType}</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Remarks</Label>
              <Textarea
                placeholder="Enter receipt/transaction remarks..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="mt-1.5 rounded-xl border-border bg-secondary/30 focus:ring-primary/20 min-h-[80px]"
              />
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold mt-6 mb-8"
            onClick={handleSave}
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editingId ? "Update Record" : "Create Record"}
          </Button>
        </div>
      </FormDrawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Billing Record?"
        description="This will permanently remove the billing record. This action cannot be undone."
        onConfirm={handleDelete}
        confirmLabel="Yes, Delete"
        variant="destructive"
      />

      {/* View Billing Details Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-background border border-border rounded-2xl shadow-2xl">
          {/* Glass background decoration blobs */}
          <div className="absolute -top-24 -left-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {selectedBilling && (
            <div className="flex flex-col relative">
              {/* Header */}
              <div className="relative overflow-hidden p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-9 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary shadow-inner">
                    <CreditCard size={22} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-foreground tracking-tight">Receipt Details</h2>
                    {/* <p className="text-[11px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider"> */}
                    {/* Reference: <span className="font-bold text-foreground">#{selectedBilling._id?.toString().slice(-8).toUpperCase()}</span> */}
                    {/* </p> */}
                  </div>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-5">
                {/* Member Profile Row */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 uppercase">
                    {(selectedBilling.member?.fullName || "U").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block leading-none">Member</span>
                    <span className="text-sm font-bold text-foreground truncate block mt-1">{selectedBilling.member?.fullName || "Unknown Member"}</span>
                    <span className="text-xs text-muted-foreground truncate block">{selectedBilling.member?.email}</span>
                  </div>
                </div>

                {/* Amount and Plan Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-primary/[0.03] border border-primary/10 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Plan Subscription</span>
                    <span className="text-sm font-extrabold text-primary mt-2 block">
                      {selectedBilling.plan?.title || "Unknown Plan"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10 flex flex-col justify-between">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Amount Paid</span>
                    <span className="text-base font-black text-emerald-600 mt-2 flex items-center gap-0.5 leading-none">
                      <IndianRupee size={14} className="stroke-[3]" />
                      {selectedBilling.amount}
                    </span>
                  </div>
                </div>

                {/* Transaction Info List */}
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border/40">
                    <span className="font-bold text-muted-foreground">Payment Method</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border text-foreground">
                      {selectedBilling.paymentType}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border/40">
                    <span className="font-bold text-muted-foreground">Transaction Date</span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedBilling.createdAt).toLocaleDateString()} &nbsp;
                      <span className="text-muted-foreground/85 text-[11px]">{new Date(selectedBilling.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>
                </div>

                {/* Remarks Block */}
                <div className="p-3.5 rounded-xl bg-secondary/20 border border-border/50">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Remarks</span>
                  <p className="text-xs text-foreground font-medium leading-relaxed whitespace-pre-wrap italic">
                    "{selectedBilling.remarks || "No remarks provided."}"
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end p-4 bg-secondary/15 border-t border-border/80">
                <Button
                  variant="outline"
                  className="h-9 rounded-xl px-6 text-xs font-bold border-2 hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
                  onClick={() => setPreviewOpen(false)}
                >
                  Close Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default BillingsPage;
