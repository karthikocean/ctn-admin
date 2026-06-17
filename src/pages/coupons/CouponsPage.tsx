import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Ticket,
  Loader2,
  CheckCircle2,
  Calendar,
  Percent,
  Coins,
  FileText,
  User,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import FormDrawer from "@/components/common/FormDrawer";
import ActionMenu from "@/components/common/ActionMenu";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";
import StatusBadge from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as CouponsApi from "@/api/CouponsApi";

const CouponsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("coupons", "create");
  const canEdit = hasPermission("coupons", "edit");
  const canDelete = hasPermission("coupons", "delete");

  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [viewingCoupon, setViewingCoupon] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: "",
    endDate: "",
    usageLimit: "" as string | number,
    perUserLimit: 1,
    status: "active"
  });

  const fetchCoupons = async (search: string = "", pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await CouponsApi.getCoupons({
        search: search,
        page: pageNum - 1,
        limit: pageSize
      });
      if (response.data) {
        setCoupons(response.data);
        setTotalPages(response.totalPages || Math.ceil((response.total || 0) / pageSize));
      }
    } catch (error: any) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch coupons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCoupons(searchTerm, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchCoupons(searchTerm, p);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }
  };

  const handleNumericChange = (id: string, value: string) => {
    const numericVal = value === "" ? "" : parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [id]: numericVal
    }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) {
      newErrors.code = "Coupon code is required";
    } else if (!/^[A-Z0-9_-]+$/i.test(formData.code)) {
      newErrors.code = "Code must be alphanumeric and can contain dashes or underscores";
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = "Discount value must be greater than zero";
    } else if (formData.discountType === "percentage" && formData.discountValue > 100) {
      newErrors.discountValue = "Percentage discount cannot exceed 100%";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else if (formData.startDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after the start date";
    }

    if (formData.perUserLimit < 1) {
      newErrors.perUserLimit = "Per user limit must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive"
      });
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        usageLimit: formData.usageLimit === "" ? undefined : Number(formData.usageLimit),
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: new Date(formData.endDate)
      };

      let response;
      if (editingId) {
        response = await CouponsApi.updateCoupon(editingId, payload);
        toast({
          title: "Success",
          description: response.message || "Coupon updated successfully",
          variant: "success"
        });
      } else {
        response = await CouponsApi.createCoupon(payload);
        toast({
          title: "Success",
          description: response.message || "Coupon created successfully",
          variant: "success"
        });
      }
      fetchCoupons(searchTerm, page);
      setDrawerOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save coupon",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setErrors({});
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      startDate: "",
      endDate: "",
      usageLimit: "",
      perUserLimit: 1,
      status: "active"
    });
  };

  const handleEdit = (coupon: any) => {
    setEditingId(coupon._id);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split("T")[0] : "",
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split("T")[0] : "",
      usageLimit: coupon.usageLimit !== undefined && coupon.usageLimit !== null ? coupon.usageLimit : "",
      perUserLimit: coupon.perUserLimit || 1,
      status: coupon.status || "active"
    });
    setDrawerOpen(true);
  };

  const confirmDelete = (id: string) => {
    setCouponToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;
    try {
      const response = await CouponsApi.deleteCoupon(couponToDelete);
      toast({
        title: "Deleted",
        description: response.message || "Coupon deleted successfully",
        variant: "success"
      });
      fetchCoupons(searchTerm, page);
    } catch (error: any) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete coupon",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  const handleView = (coupon: any) => {
    setViewingCoupon(coupon);
    setViewDialogOpen(true);
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && coupons.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Syncing Coupons..."
          subtitle="Retrieving latest promotional codes"
        />
      )}

      {/* Header Section */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Ticket size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Coupon Management</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search by coupon code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {canCreate && (
            <Button
              size="sm"
              className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs font-bold"
              onClick={() => {
                resetForm();
                setDrawerOpen(true);
              }}
            >
              <Plus size={14} className="mr-1.5" />
              Add Coupon
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && coupons.length > 0 && <TableLoader text="Syncing Coupons..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 whitespace-nowrap">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Coupon Code</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Discount</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Min Purchase</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Used / Limit</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Validity</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton rows={5} columns={8} />
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No coupons found. Create one to get started.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon, index) => (
                  <tr key={coupon._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 text-center text-xs font-medium text-muted-foreground">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <span className="bg-primary/5 text-primary border border-primary/20 rounded px-2 py-0.5 font-mono text-xs">
                            {coupon.code}
                          </span>
                        </div>
                        {coupon.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-[250px]">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-foreground">
                        {coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {coupon.minOrderAmount > 0 ? `₹${coupon.minOrderAmount}` : "None"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-foreground">
                        {coupon.usedCount || 0} / {coupon.usageLimit || "∞"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-foreground">
                          {new Date(coupon.endDate).toLocaleDateString()}
                        </span>
                        {coupon.startDate && (
                          <span className="text-[10px] text-muted-foreground">
                            from {new Date(coupon.startDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={coupon.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onView={() => handleView(coupon)}
                        onEdit={canEdit ? () => handleEdit(coupon) : undefined}
                        onDelete={canDelete ? () => confirmDelete(coupon._id) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Section */}
        {!loading && coupons.length > 0 && (
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
        title={editingId ? "Edit Coupon" : "Add Coupon"}
        description={editingId ? "Update promotional code rules and expiry details" : "Create a new coupon code with discount rules"}
      >
        <div className="space-y-6 pb-20 px-4">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Coupon Code <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. SUMMER50"
                value={formData.code}
                id="code"
                onChange={(e) => {
                  setFormData({ ...formData, code: e.target.value.toUpperCase() });
                  if (errors.code) setErrors((prev) => ({ ...prev, code: "" }));
                }}
                className={`mt-1.5 h-11 rounded-xl bg-secondary/30 focus:ring-primary/20 font-mono ${
                  errors.code ? "border-red-500 border" : "border-border"
                }`}
              />
              {errors.code && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.code}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                placeholder="Write a brief description of the coupon offer..."
                value={formData.description}
                id="description"
                onChange={handleInputChange}
                className="mt-1.5 rounded-xl border-border bg-secondary/30 focus:ring-primary/20 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Discount Type <span className="text-red-500">*</span>
                </Label>
                <select
                  className="w-full mt-1.5 h-11 px-3 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.discountType}
                  id="discountType"
                  onChange={handleInputChange}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Discount Value <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                    {formData.discountType === "percentage" ? "%" : "₹"}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={formData.discountValue || ""}
                    onChange={(e) => handleNumericChange("discountValue", e.target.value)}
                    className={`h-11 pl-7 rounded-xl bg-secondary/30 focus:ring-primary/20 border ${
                      errors.discountValue ? "border-red-500" : "border-border"
                    }`}
                  />
                </div>
                {errors.discountValue && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.discountValue}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Purchase Required</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                  <Input
                    type="number"
                    min={0}
                    value={formData.minOrderAmount || ""}
                    onChange={(e) => handleNumericChange("minOrderAmount", e.target.value)}
                    className="h-11 pl-7 rounded-xl border-border bg-secondary/30 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Discount Limit</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                  <Input
                    type="number"
                    min={0}
                    disabled={formData.discountType === "fixed"}
                    placeholder={formData.discountType === "fixed" ? "N/A (Fixed Discount)" : "Unlimited"}
                    value={formData.discountType === "fixed" ? "" : formData.maxDiscountAmount || ""}
                    onChange={(e) => handleNumericChange("maxDiscountAmount", e.target.value)}
                    className="h-11 pl-7 rounded-xl border-border bg-secondary/30 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                <div className="relative mt-1.5">
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={formData.startDate}
                    id="startDate"
                    onChange={handleInputChange}
                    className="h-11 pr-10 rounded-xl border-border bg-secondary/30 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  End Date <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={formData.endDate}
                    id="endDate"
                    onChange={handleInputChange}
                    className={`h-11 pr-10 rounded-xl bg-secondary/30 focus:ring-primary/20 border ${
                      errors.endDate ? "border-red-500" : "border-border"
                    }`}
                  />
                </div>
                {errors.endDate && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usage Limit</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={formData.usageLimit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      usageLimit: val === "" ? "" : parseInt(val) || 0
                    });
                  }}
                  className="mt-1.5 h-11 rounded-xl border-border bg-secondary/30 focus:ring-primary/20 text-center"
                />
              </div>

              <div className="col-span-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Per User Limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.perUserLimit}
                  id="perUserLimit"
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      perUserLimit: Math.max(1, parseInt(e.target.value) || 1)
                    });
                    if (errors.perUserLimit) setErrors(prev => ({ ...prev, perUserLimit: "" }));
                  }}
                  className={`mt-1.5 h-11 rounded-xl bg-secondary/30 focus:ring-primary/20 text-center border ${
                    errors.perUserLimit ? "border-red-500" : "border-border"
                  }`}
                />
                {errors.perUserLimit && (
                  <p className="text-[10px] text-red-500 mt-1 text-center font-semibold">{errors.perUserLimit}</p>
                )}
              </div>

              <div className="col-span-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                <select
                  className="w-full mt-1.5 h-11 px-3 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.status}
                  id="status"
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold mt-6 mb-8"
            onClick={handleSave}
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editingId ? "Update Coupon" : "Create Coupon"}
          </Button>
        </div>
      </FormDrawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Coupon?"
        description={
          <>
            This will permanently remove the coupon <strong className="text-foreground">"{coupons.find(c => c._id === couponToDelete)?.code}"</strong>. This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        confirmLabel="Yes, Delete"
        variant="destructive"
      />

      {/* Preview Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-background border border-border rounded-2xl shadow-2xl">
          {/* Decorative gradients */}
          <div className="absolute -top-24 -left-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          {viewingCoupon && (
            <div className="flex flex-col">
              {/* Header card with coupon ticket design */}
              <div className="relative overflow-hidden p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/80">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary shadow-inner">
                    <Ticket size={24} />
                  </div>
                  <div className="space-y-1.5 pr-12 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-lg font-extrabold text-primary bg-primary/5 border border-primary/20 px-3 py-0.5 rounded-lg">
                        {viewingCoupon.code}
                      </span>
                      <StatusBadge status={viewingCoupon.status} />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2 font-medium">
                      {viewingCoupon.description || "No description provided for this coupon."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Specs & Rules */}
              <div className="grid grid-cols-3 border-b border-border divide-x divide-border bg-secondary/10">
                <div className="p-4 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest block mb-1">Discount Value</span>
                  <span className="text-lg font-extrabold text-primary">
                    {viewingCoupon.discountType === "percentage" ? `${viewingCoupon.discountValue}%` : `₹${viewingCoupon.discountValue}`}
                  </span>
                </div>
                <div className="p-4 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest block mb-1">Min Order</span>
                  <span className="text-lg font-bold text-foreground">
                    {viewingCoupon.minOrderAmount > 0 ? `₹${viewingCoupon.minOrderAmount}` : "None"}
                  </span>
                </div>
                <div className="p-4 text-center">
                  <span className="text-[9px] font-bold text-muted-foreground/70 uppercase tracking-widest block mb-1">Max Discount</span>
                  <span className="text-lg font-bold text-foreground">
                    {viewingCoupon.discountType === "fixed" ? "N/A" : (viewingCoupon.maxDiscountAmount > 0 ? `₹${viewingCoupon.maxDiscountAmount}` : "∞")}
                  </span>
                </div>
              </div>

              {/* Date & Limits Info */}
              <div className="p-6 space-y-4">
                <h3 className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                  Usage Details & Restrictions
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {/* Row 1 */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/80">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">Start Date</span>
                      <span className="text-xs font-semibold text-foreground">
                        {viewingCoupon.startDate ? new Date(viewingCoupon.startDate).toLocaleDateString() : "Immediate"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/80">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">Expiry Date</span>
                      <span className="text-xs font-semibold text-foreground">
                        {new Date(viewingCoupon.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/80">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                      <Coins size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">Total Usage</span>
                      <span className="text-xs font-semibold text-foreground">
                        {viewingCoupon.usedCount || 0} / {viewingCoupon.usageLimit || "Unlimited"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/15 border border-border/80">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] text-muted-foreground block font-bold uppercase tracking-wider">Per User Limit</span>
                      <span className="text-xs font-semibold text-foreground">
                        {viewingCoupon.perUserLimit || 1} times
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                  <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    This coupon will apply a <strong>{viewingCoupon.discountType === "percentage" ? `${viewingCoupon.discountValue}%` : `₹${viewingCoupon.discountValue}`}</strong> discount on
                    {viewingCoupon.minOrderAmount > 0 ? ` orders containing a subtotal of at least ₹${viewingCoupon.minOrderAmount}` : " any eligible order"}.
                    {viewingCoupon.maxDiscountAmount > 0 ? ` The maximum discount is capped at ₹${viewingCoupon.maxDiscountAmount}.` : ""}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-4 bg-secondary/10 border-t border-border">
                <Button variant="outline" className="h-10 rounded-xl px-6 font-bold" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsPage;
