import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, CreditCard, Eye, Loader2, IndianRupee, Plus, Banknote, Landmark, CheckSquare, Globe, HelpCircle, Copy, Check, User, ChevronDown } from "lucide-react";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

const getFullUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_MEDIA_URL || "http://localhost:5001";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const getPlanLeftBorder = (title: string = "") => {
  const lower = title.toLowerCase();
  if (lower.includes("premium")) return "border-l-purple-500 hover:border-l-purple-600";
  if (lower.includes("gold")) return "border-l-amber-500 hover:border-l-amber-600";
  if (lower.includes("basic") || lower.includes("free")) return "border-l-slate-400 hover:border-l-slate-500";
  return "border-l-blue-500 hover:border-l-blue-600";
};

const getAvatarGradient = (name: string = "") => {
  const charCode = name.charCodeAt(0) || 0;
  const index = charCode % 5;
  const gradients = [
    "bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 border-purple-200",
    "bg-gradient-to-br from-pink-100 to-rose-100 text-rose-700 border-rose-200",
    "bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 border-amber-200",
    "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200",
    "bg-gradient-to-br from-blue-100 to-sky-100 text-blue-700 border-blue-200"
  ];
  return gradients[index];
};

const getPlanBadge = (title: string = "") => {
  const lower = title.toLowerCase();
  if (lower.includes("premium")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200/80 shadow-sm shadow-purple-500/5 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
        Premium
      </span>
    );
  }
  if (lower.includes("gold")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200/80 shadow-sm shadow-amber-500/5 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Gold
      </span>
    );
  }
  if (lower.includes("basic") || lower.includes("free")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200 shadow-sm shadow-slate-500/5 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Basic
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-50 to-sky-50 text-blue-700 border border-blue-200 shadow-sm shadow-blue-500/5 select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      {title || "Standard"}
    </span>
  );
};

const capitalizeFirstLetter = (val: string = "") => {
  if (!val) return "";
  return val.charAt(0).toUpperCase() + val.slice(1);
};

const getPaymentMethodBadge = (method: string = "") => {
  const lower = method.toLowerCase();
  const capitalized = capitalizeFirstLetter(method);
  if (lower === "cash") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50 shadow-sm select-none">
        <Banknote size={12} className="stroke-[2.5]" />
        Cash
      </span>
    );
  }
  if (lower === "bank transfer") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/50 shadow-sm select-none">
        <Landmark size={12} className="stroke-[2.5]" />
        Bank Transfer
      </span>
    );
  }
  if (lower === "cheque") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50 shadow-sm select-none">
        <CheckSquare size={12} className="stroke-[2.5]" />
        Cheque
      </span>
    );
  }
  if (lower === "online" || lower === "razorpay" || lower === "stripe") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50 shadow-sm select-none">
        <Globe size={12} className="stroke-[2.5]" />
        {capitalized}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-sm select-none">
      <HelpCircle size={12} className="stroke-[2.5]" />
      {capitalized || "Other"}
    </span>
  );
};

const getPaymentStatusBadge = (status: string = "PAID") => {
  const upper = (status || "PAID").toUpperCase();
  if (upper === "PAID" || upper === "SUCCESS" || upper === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Paid
      </span>
    );
  }
  if (upper === "FAILED" || upper === "REJECTED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Failed
      </span>
    );
  }
  if (upper === "CANCELLED" || upper === "CANCELED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-sm select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-sm select-none">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
      Pending
    </span>
  );
};

const TransactionIdBadge = ({ id }: { id: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex items-center gap-1 mt-1">
      <code className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono border border-slate-200/60 select-all tracking-wide">
        ID: {id}
      </code>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700 transition-all duration-150"
        title="Copy ID"
      >
        {copied ? <Check size={10} className="text-green-600 stroke-[3]" /> : <Copy size={10} />}
      </button>
    </div>
  );
};

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
  const [totalBillings, setTotalBillings] = useState(0);
  const pageSize = 10;

  const [selectedBilling, setSelectedBilling] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billingToDelete, setBillingToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  const [formData, setFormData] = useState<{
    memberId: string;
    planId: string;
    paymentMethod: string;
    amount: number;
    transactionId: string;
    remarks: string;
    status: string;
  }>({
    memberId: "",
    planId: "",
    paymentMethod: "",
    amount: 0,
    transactionId: "",
    remarks: "",
    status: "PAID",
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
        setTotalBillings(response.total || response.totalItems || 0);
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
    setMemberSearchQuery("");
    setFormData({
      memberId: "",
      planId: "",
      paymentMethod: "",
      amount: 0,
      transactionId: "",
      remarks: "",
      status: "PAID",
    });
  };

  const handleEdit = (billing: any) => {
    setEditingId(billing._id);
    setFormData({
      memberId: billing.memberId || "",
      planId: billing.planId || "",
      paymentMethod: billing.paymentMethod || billing.paymentType || "",
      amount: billing.amount || 0,
      transactionId: billing.transactionId || "",
      remarks: billing.remarks || "",
      status: billing.status || billing.paymentStatus || "PAID",
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
    if (!formData.paymentMethod.trim()) {
      newErrors.paymentMethod = "Payment method is required";
    }
    if (formData.paymentMethod !== "Cash" && !formData.transactionId.trim()) {
      newErrors.transactionId = "Transaction ID is required";
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
      const savePayload = {
        ...formData,
        transactionId: formData.paymentMethod === "Cash" ? "CASH" : formData.transactionId
      };

      let response;
      if (editingId) {
        response = await BillingsApi.updateBilling(editingId, savePayload);
        toast({ title: "Updated", description: response.message || "Billing record updated successfully", variant: "success" });
      } else {
        response = await BillingsApi.createBilling(savePayload);
        toast({ title: "Created", description: response.message || "Billing record created successfully", variant: "success" });
      }
      fetchBillings(searchTerm, page);
      setDrawerOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving billing record:", error);
      const rawMsg =
        error?.response?.data?.message ||
        error?.message ||
        (typeof error === "string" ? error : null) ||
        "Payment was cancelled or failed";

      let cleanMsg = String(rawMsg)
        .replace(/Payment\s*Failed\s*:\s*undefined/gi, "Payment Failed")
        .replace(/:\s*undefined/gi, "")
        .replace(/undefined/gi, "")
        .trim();

      if (!cleanMsg || cleanMsg.toLowerCase() === "payment failed") {
        cleanMsg = "Payment was cancelled or failed";
      }

      toast({
        title: "Payment Error",
        description: cleanMsg,
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden relative"
      >
        {loading && billings.length > 0 && <TableLoader text="Fetching Billing Records..." />}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow>
                <TableHead className="px-6 py-4 w-16 text-center">S.No</TableHead>
                <TableHead className="px-6 py-4">Member</TableHead>
                <TableHead className="px-6 py-4">Plan</TableHead>
                <TableHead className="px-6 py-4 text-center">Amount</TableHead>
                <TableHead className="px-6 py-4">Payment Type</TableHead>
                <TableHead className="px-6 py-4 text-center">Status</TableHead>
                <TableHead className="px-6 py-4">Date</TableHead>
                <TableHead className="px-6 py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && billings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <TableSkeleton rows={5} columns={8} />
                  </TableCell>
                </TableRow>
              ) : billings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No billing records found.
                  </TableCell>
                </TableRow>
              ) : (
                billings.map((b, index) => (
                  <TableRow key={b._id} className="hover:bg-secondary/10 transition-colors">
                    <TableCell className="px-6 py-4 text-center text-sm font-semibold text-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-border/80 flex-shrink-0 shadow-sm">
                          <AvatarImage
                            src={getFullUrl(b.member?.profilePhoto)}
                            alt={b.member?.fullName}
                            className="object-cover"
                          />
                          <AvatarFallback className={cn("text-[10px] font-extrabold flex items-center justify-center border shadow-inner", getAvatarGradient(b.member?.fullName || "?"))}>
                            {b.member?.fullName ? b.member.fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground leading-snug tracking-tight">{b.member?.fullName || "Unknown Member"}</span>
                          <span className="text-xs text-muted-foreground font-medium">{b.member?.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {getPlanBadge(b.plan?.title)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="text-sm font-extrabold text-foreground tracking-tight">₹{b.amount?.toLocaleString("en-IN")}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {getPaymentMethodBadge(b.paymentMethod || b.paymentType)}
                        {b.paymentMethod?.toLowerCase() !== "cash" && b.paymentType?.toLowerCase() !== "cash" && b.transactionId && b.transactionId !== "CASH" && (
                          <TransactionIdBadge id={b.transactionId} />
                        )}
                        {b.source && (
                          <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5 select-none">
                            {b.source}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      {getPaymentStatusBadge(b.status || b.paymentStatus || "PAID")}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {new Date(b.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(b.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <ActionMenu
                        onView={() => handlePreview(b)}
                        onEdit={canEdit ? () => handleEdit(b) : undefined}
                        onDelete={canDelete ? () => confirmDelete(b._id) : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination Section */}
        {!loading && billings.length > 0 && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
              totalItems={totalBillings}
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
              <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen} modal={true}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "w-full mt-1.5 h-11 flex items-center justify-between font-normal rounded-xl bg-secondary/30 border text-sm hover:bg-secondary/45 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-150 px-3",
                      errors.memberId ? "border-red-500" : "border-border",
                      !formData.memberId ? "text-slate-400" : "text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2 text-left">
                      <User className={cn("h-4 w-4 text-slate-500", !formData.memberId ? "opacity-50" : "opacity-80")} />
                      <span className="truncate">
                        {formData.memberId
                          ? members.find((m) => m._id === formData.memberId)?.fullName || "Choose Member..."
                          : "Choose Member..."}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 opacity-50 flex-shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 shadow-xl rounded-2xl border border-slate-200 overflow-hidden" align="start" style={{ pointerEvents: "auto" }}>
                  {/* Search bar */}
                  <div className="px-3 pt-3 pb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                        placeholder="Search members..."
                        value={memberSearchQuery}
                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  {/* Member list */}
                  <div className="max-h-[240px] overflow-y-auto px-2 pb-2">
                    {members
                      .filter((member) => {
                        const q = memberSearchQuery.toLowerCase();
                        return (
                          member.fullName?.toLowerCase().includes(q) ||
                          member.businessName?.toLowerCase().includes(q) ||
                          member.mobileNumber?.toLowerCase().includes(q)
                        );
                      })
                      .map((member) => {
                        const isSelected = formData.memberId === member._id;
                        return (
                          <div
                            key={member._id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                              isSelected ? "bg-primary/8" : "hover:bg-slate-50"
                            )}
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, memberId: member._id }));
                              if (errors.memberId) setErrors((prev) => ({ ...prev, memberId: "" }));
                              setMemberPopoverOpen(false);
                              setMemberSearchQuery("");
                            }}
                          >
                            {/* Avatar circle */}
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-slate-500" />
                            </div>
                            {/* Name & business */}
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-xs font-semibold text-slate-800 truncate">{member.fullName}</span>
                              <span className="text-[10px] text-slate-400 truncate">
                                {member.businessName || "—"}
                              </span>
                            </div>
                            {/* Selection indicator */}
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                isSelected ? "bg-primary border-primary" : "border-slate-300 bg-white"
                              )}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    {members.filter((member) => {
                      const q = memberSearchQuery.toLowerCase();
                      return (
                        member.fullName?.toLowerCase().includes(q) ||
                        member.businessName?.toLowerCase().includes(q) ||
                        member.mobileNumber?.toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <p className="text-center py-6 text-xs text-slate-400">No members found</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {errors.memberId && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.memberId}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Plan <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.planId}
                onValueChange={(val) => {
                  handlePlanChange(val);
                  if (errors.planId) setErrors((prev) => ({ ...prev, planId: "" }));
                }}
              >
                <SelectTrigger className={`w-full mt-1.5 h-11 px-3 rounded-xl bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border ${errors.planId ? "border-red-500" : "border-border"}`}>
                  <SelectValue placeholder="Choose Plan..." />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto w-[var(--radix-select-trigger-width)]">
                  {plans.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.title} (₹{p.amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    min="1"
                    value={formData.amount}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFormData({ ...formData, amount: val > 0 ? val : 0 });
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
                  Payment Method <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(val) => {
                    setFormData(prev => ({
                      ...prev,
                      paymentMethod: val,
                      transactionId: val === "Cash" ? "" : prev.transactionId
                    }));
                    if (errors.paymentMethod) setErrors((prev) => ({ ...prev, paymentMethod: "" }));
                    if (val === "Cash") setErrors((prev) => ({ ...prev, transactionId: "" }));
                  }}
                >
                  <SelectTrigger className={`w-full mt-1.5 h-11 px-3 rounded-xl bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border ${errors.paymentMethod ? "border-red-500" : "border-border"}`}>
                    <SelectValue placeholder="Select Payment Method..." />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    <SelectItem value="Razorpay">Razorpay</SelectItem>
                    <SelectItem value="Stripe">Stripe</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paymentMethod && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.paymentMethod}</p>
                )}
              </div>
            </div>

            {formData.paymentMethod !== "Cash" && (
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Transaction ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter transaction/receipt ID"
                  value={formData.transactionId}
                  onChange={(e) => {
                    setFormData({ ...formData, transactionId: e.target.value });
                    if (errors.transactionId) setErrors((prev) => ({ ...prev, transactionId: "" }));
                  }}
                  className={`mt-1.5 h-11 rounded-xl bg-secondary/30 focus:ring-primary/20 border ${errors.transactionId ? "border-red-500" : "border-border"
                    }`}
                />
                {errors.transactionId && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.transactionId}</p>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Payment Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="w-full mt-1.5 h-11 px-3 rounded-xl bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border">
                  <SelectValue placeholder="Select Status..." />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
                      {capitalizeFirstLetter(selectedBilling.paymentMethod || selectedBilling.paymentType)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border/40">
                    <span className="font-bold text-muted-foreground">Status</span>
                    {getPaymentStatusBadge(selectedBilling.status || selectedBilling.paymentStatus || "PAID")}
                  </div>

                  {(selectedBilling.paymentMethod?.toLowerCase() !== "cash" && selectedBilling.paymentType?.toLowerCase() !== "cash") && (
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-border/40">
                      <span className="font-bold text-muted-foreground">Transaction ID</span>
                      <span className="font-medium text-foreground">
                        {selectedBilling.transactionId || "None"}
                      </span>
                    </div>
                  )}

                  {selectedBilling.source && (
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-border/40">
                      <span className="font-bold text-muted-foreground">Source</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase">
                        {selectedBilling.source}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs pb-2 border-b border-border/40">
                    <span className="font-bold text-muted-foreground">Payment Date</span>
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
