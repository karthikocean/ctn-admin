import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, CreditCard, Plus, Trash2, CreditCard as PlanIcon, Loader2, AlertCircle, HelpCircle, Gift, ClipboardList, Send, Trophy, GraduationCap, Users, Share2, Receipt, Layers, Eye, Calendar, Store, ShoppingBag, Shield } from "lucide-react";
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
import * as PlansApi from "@/api/PlansApi";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MODULE_OPTIONS = [
  "Ask",
  "Give",
  "Requirement",
  "Post",
  "Milestones",
  "Trainings",
  "One to One",
  "Referral",
  "Thank you Slip",
  "Event",
  "Online Stall",
  "Offline Stall",
  "Marketplace"
];

const PlansPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("plans", "create");
  const canEdit = hasPermission("plans", "edit");
  const canDelete = hasPermission("plans", "delete");
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [viewingPlan, setViewingPlan] = useState<any | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const handleView = (plan: any) => {
    setViewingPlan(plan);
    setViewDialogOpen(true);
  };

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    amount: number;
    trialDays: number | null;
    modules: any[];
    status: string;
    billingType: string;
    billingCycle: string;
    features: {
      monthlyMeeting: boolean;
      eventVisitor: boolean;
      eventStall: boolean;
      spotlights: boolean;
    };
    benefits: {
      requirementResponseLimit: number;
      pointMultiplier: number;
      trainingDiscountPercentage: number;
      referralBonusMonths: number;
    };
  }>({
    title: "",
    description: "",
    amount: 0,
    trialDays: null,
    modules: [{ moduleName: "", countLimit: 0, frequency: "monthly", frequencyValue: 1 }],
    status: "active",
    billingType: "basic",
    billingCycle: "monthly",
    features: {
      monthlyMeeting: false,
      eventVisitor: false,
      eventStall: false,
      spotlights: false
    },
    benefits: {
      requirementResponseLimit: 0,
      pointMultiplier: 1,
      trainingDiscountPercentage: 0,
      referralBonusMonths: 0
    }
  });

  const fetchPlans = async (search: string = "", pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await PlansApi.getPlans({
        search: search,
        page: pageNum - 1,
        limit: pageSize
      });
      if (response.data) {
        setPlans(response.data);
        setTotalPages(response.totalPages || Math.ceil((response.total || 0) / pageSize));
      }
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlans(searchTerm, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchPlans(searchTerm, p);
  };

  const handleAddModule = () => {
    setFormData({
      ...formData,
      modules: [{ moduleName: "", countLimit: 0, frequency: "monthly", frequencyValue: 1 }, ...formData.modules]
    });
  };

  const handleRemoveModule = (index: number) => {
    const newModules = formData.modules.filter((_, i) => i !== index);
    setFormData({ ...formData, modules: newModules });
  };

  const handleModuleChange = (index: number, field: string, value: any) => {
    const newModules = [...formData.modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setFormData({ ...formData, modules: newModules });
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (formData.amount <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }
    const hasEmptyModule = formData.modules.some(m => !m.moduleName);
    if (hasEmptyModule) {
      newErrors.modules = "Please select a valid module name for all modules";
    } else {
      const hasInvalidLimit = formData.modules.some(m => m.countLimit <= 0);
      if (hasInvalidLimit) {
        newErrors.modules = "Limit must be greater than zero for all modules";
      }
    }
    if (formData.benefits.requirementResponseLimit <= 0) {
      newErrors.requirementResponseLimit = "Requirement response limit must be greater than zero";
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
        response = await PlansApi.updatePlan(editingId, formData);
        toast({ title: "Updated", description: response.message || "Plan updated successfully", variant: "success" });
      } else {
        response = await PlansApi.createPlan(formData);
        toast({ title: "Created", description: response.message || "Plan created successfully", variant: "success" });
      }
      fetchPlans(searchTerm, page);
      setDrawerOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving plan:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save plan",
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
      title: "",
      description: "",
      amount: 0,
      trialDays: null,
      modules: [{ moduleName: "", countLimit: 0, frequency: "monthly", frequencyValue: 1 }],
      status: "active",
      billingType: "basic",
      billingCycle: "monthly",
      features: {
        monthlyMeeting: false,
        eventVisitor: false,
        eventStall: false,
        spotlights: false
      },
      benefits: {
        requirementResponseLimit: 0,
        pointMultiplier: 1,
        trainingDiscountPercentage: 0,
        referralBonusMonths: 0
      }
    });
  };

  const handleEdit = (plan: any) => {
    setEditingId(plan._id);
    setFormData({
      title: plan.title,
      description: plan.description,
      amount: plan.amount,
      trialDays: plan.trialDays !== undefined && plan.trialDays !== null ? plan.trialDays : null,
      modules: plan.modules.map((m: any) => ({
        moduleName: m.moduleName,
        countLimit: m.countLimit,
        frequency: m.frequency || "monthly",
        frequencyValue: m.frequencyValue !== undefined ? m.frequencyValue : 1
      })),
      status: plan.status || "active",
      billingType: plan.billingType || "basic",
      billingCycle: plan.billingCycle || "monthly",
      features: plan.features || {
        monthlyMeeting: false,
        eventVisitor: false,
        eventStall: false,
        spotlights: false
      },
      benefits: plan.benefits || {
        requirementResponseLimit: 0,
        pointMultiplier: 1,
        trainingDiscountPercentage: 0,
        referralBonusMonths: 0
      }
    });
    setDrawerOpen(true);
  };

  const confirmDelete = (id: string) => {
    setPlanToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!planToDelete) return;
    try {
      const response = await PlansApi.deletePlan(planToDelete);
      toast({ title: "Deleted", description: response.message || "Plan deleted successfully", variant: "success" });
      fetchPlans(searchTerm, page);
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete plan",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && plans.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Syncing Plans..."
          subtitle="Retrieving latest subscription tier data"
        />
      )}
      {/* Header Section */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <PlanIcon size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Plan Management</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
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
              Add Plan
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && plans.length > 0 && <TableLoader text="Syncing Plans..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 whitespace-nowrap">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Plan</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Amount</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Member Count</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Trial Days</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Modules</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton rows={5} columns={8} />
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    No plans found. Create one to get started.
                  </td>
                </tr>
              ) : (
                plans.map((plan, index) => (
                  <tr key={plan._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 text-center text-sm text-foreground font-semibold">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-foreground">{plan.title}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {plan.billingType && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary capitalize border border-primary/20">
                              {plan.billingType}
                            </span>
                          )}
                          {plan.billingCycle && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-foreground capitalize border border-border">
                              {plan.billingCycle}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-foreground">₹{plan.amount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-foreground">{plan.memberCount ?? 0}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-foreground">
                        {plan.trialDays !== null && plan.trialDays !== undefined ? `${plan.trialDays} days` : "None"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-wrap justify-center gap-1 max-w-[280px] mx-auto">
                        {(expandedPlans[plan._id] ? plan.modules : plan.modules.slice(0, 3)).map((m: any, i: number) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border text-foreground whitespace-nowrap">
                            {m.moduleName}: {m.countLimit} ({m.frequencyValue !== undefined ? m.frequencyValue : 1} {m.frequency || "monthly"})
                          </span>
                        ))}
                        {plan.modules.length > 3 && (
                          <button
                            onClick={() => setExpandedPlans(prev => ({ ...prev, [plan._id]: !prev[plan._id] }))}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 border border-primary/20 text-primary whitespace-nowrap cursor-pointer hover:bg-primary/20 transition-colors focus:outline-none"
                          >
                            {expandedPlans[plan._id] ? "Show less" : `+ ${plan.modules.length - 3} more`}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onView={() => handleView(plan)}
                        onEdit={canEdit ? () => handleEdit(plan) : undefined}
                        onDelete={canDelete ? () => confirmDelete(plan._id) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Section */}
        {!loading && plans.length > 0 && (
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
        title={editingId ? "Edit Plan" : "Add Plan"}
        description={editingId ? "Update plan details and module counts" : "Create a new subscription plan with specific modules"}
      >
        <div className="space-y-6 pb-20 px-4">
          {/* Section 1: Plan Information */}
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2 border-b pb-1">
              Section 1: Plan Information
            </Label>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Plan Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter plan title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
                }}
                className={`mt-1.5 h-11 rounded-xl bg-secondary/30 focus:ring-primary/20 ${errors.title ? "border-red-500 border" : "border-border"
                  }`}
              />
              {errors.title && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.title}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                placeholder="Enter plan description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1.5 rounded-xl border-border bg-secondary/30 focus:ring-primary/20 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                  <Input
                    type="number"
                    min={0.01}
                    step="any"
                    value={formData.amount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setFormData({ ...formData, amount: val < 0 ? 0 : (isNaN(val) ? 0 : val) });
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
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trial Days</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.trialDays ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      trialDays: val === "" ? null : (isNaN(parseInt(val)) ? null : parseInt(val))
                    });
                  }}
                  className="mt-1.5 h-11 rounded-xl border-border bg-secondary/30 focus:ring-primary/20"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
                <select
                  className="w-full mt-1.5 h-11 px-3 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing Type</Label>
                <select
                  className="w-full mt-1.5 h-11 px-3 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 capitalize"
                  value={formData.billingType}
                  onChange={(e) => setFormData({ ...formData, billingType: e.target.value })}
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing Cycle</Label>
                <select
                  className="w-full mt-1.5 h-11 px-3 rounded-xl border border-border bg-secondary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 capitalize"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Usage Limits */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Section 2: Usage Limits</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={handleAddModule}
              >
                <Plus size={12} className="mr-1" />
                Add Module
              </Button>
            </div>

            <div className="space-y-2.5">
              {formData.modules.map((module, index) => (
                <div key={index} className="group relative flex items-start gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex-1 grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5 block ml-0.5">
                        Select Module <span className="text-red-500">*</span>
                      </Label>
                      <select
                        className={`w-full h-10 px-3 rounded-lg bg-background text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer ${!module.moduleName && errors.modules ? "border-red-500 border" : "border border-border"
                          }`}
                        value={module.moduleName}
                        onChange={(e) => {
                          handleModuleChange(index, "moduleName", e.target.value);
                          if (errors.modules) setErrors((prev) => ({ ...prev, modules: "" }));
                        }}
                      >
                        <option value="">Choose Module...</option>
                        {MODULE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 relative">
                      <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5 block ml-0.5 text-center">Limit</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        min={1}
                        value={module.countLimit}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          handleModuleChange(index, "countLimit", val < 0 ? 0 : (isNaN(val) ? 0 : val));
                        }}
                        className="h-10 rounded-lg border-border bg-background text-xs font-bold focus:ring-primary/20 text-center px-1.5"
                      />
                    </div>
                    <div className="col-span-3 relative">
                      <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5 block ml-0.5 text-center">Frequency</Label>
                      <select
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer text-center"
                        value={module.frequency || "monthly"}
                        onChange={(e) => handleModuleChange(index, "frequency", e.target.value)}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="col-span-3 relative">
                      <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5 block ml-0.5 text-center">Freq Value</Label>
                      <Input
                        type="number"
                        placeholder="1"
                        min={1}
                        value={module.frequencyValue !== undefined ? module.frequencyValue : 1}
                        onChange={(e) => handleModuleChange(index, "frequencyValue", Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-10 rounded-lg border-border bg-background text-xs font-bold focus:ring-primary/20 text-center px-1.5"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => handleRemoveModule(index)}
                      className="flex-shrink-0 w-8 h-8 rounded-lg bg-destructive/5 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                      disabled={formData.modules.length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.modules && (
              <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.modules}</p>
            )}
          </div>

          {/* Section 3: Feature Access */}
          <div className="pt-4 border-t border-border space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Section 3: Feature Access
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-secondary/15 cursor-pointer hover:bg-secondary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.features.monthlyMeeting}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, monthlyMeeting: e.target.checked }
                    })
                  }
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Monthly Meeting</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Allows participating in monthly events</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-secondary/15 cursor-pointer hover:bg-secondary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.features.eventVisitor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, eventVisitor: e.target.checked }
                    })
                  }
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Event Visitor</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Allows visiting other region events</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-secondary/15 cursor-pointer hover:bg-secondary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.features.eventStall}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, eventStall: e.target.checked }
                    })
                  }
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Event Stall</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Allows booking exhibition stalls</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/60 bg-secondary/15 cursor-pointer hover:bg-secondary/30 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.features.spotlights}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      features: { ...formData.features, spotlights: e.target.checked }
                    })
                  }
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">Spotlights</span>
                  <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Highlight profile options in spotlights</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 4: Plan Benefits */}
          <div className="pt-4 border-t border-border space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Section 4: Plan Benefits
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block ml-0.5">
                  Requirement Response Limit
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.benefits.requirementResponseLimit}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setFormData({
                      ...formData,
                      benefits: {
                        ...formData.benefits,
                        requirementResponseLimit: val < 0 ? 0 : (isNaN(val) ? 0 : val)
                      }
                    });
                    if (errors.requirementResponseLimit) {
                      setErrors((prev) => ({ ...prev, requirementResponseLimit: "" }));
                    }
                  }}
                  className={`mt-1.5 h-10 rounded-lg bg-secondary/30 text-xs font-bold border ${errors.requirementResponseLimit ? "border-red-500" : "border-border"
                    }`}
                />
                {errors.requirementResponseLimit && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.requirementResponseLimit}</p>
                )}
              </div>
              <div>
                <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block ml-0.5">
                  Point Multiplier (e.g. 1, 2)
                </Label>
                <Input
                  type="number"
                  min={1}
                  step={0.1}
                  value={formData.benefits.pointMultiplier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      benefits: {
                        ...formData.benefits,
                        pointMultiplier: Math.max(1, parseFloat(e.target.value) || 1)
                      }
                    })
                  }
                  className="mt-1.5 h-10 rounded-lg border-border bg-secondary/30 text-xs font-bold"
                />
              </div>
              <div>
                <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block ml-0.5">
                  Training Discount (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.benefits.trainingDiscountPercentage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      benefits: {
                        ...formData.benefits,
                        trainingDiscountPercentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                      }
                    })
                  }
                  className="mt-1.5 h-10 rounded-lg border-border bg-secondary/30 text-xs font-bold"
                />
              </div>
              <div>
                <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block ml-0.5">
                  Referral Bonus Months
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.benefits.referralBonusMonths}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      benefits: {
                        ...formData.benefits,
                        referralBonusMonths: Math.max(0, parseInt(e.target.value) || 0)
                      }
                    })
                  }
                  className="mt-1.5 h-10 rounded-lg border-border bg-secondary/30 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold mt-6 mb-8"
            onClick={handleSave}
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editingId ? "Update Plan" : "Create Plan"}
          </Button>
        </div>
      </FormDrawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Plan?"
        description={
          <>
            This will permanently remove the <strong className="text-foreground">"{plans.find(p => p._id === planToDelete)?.title}"</strong> plan. This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        confirmLabel="Yes, Delete"
        variant="destructive"
      />

      {/* Preview Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border border-border rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
          {/* Glass background decoration blobs */}
          <div className="absolute -top-24 -left-20 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-20 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

          {viewingPlan && (
            <div className="flex flex-col overflow-hidden h-full max-h-[90vh]">
              {/* Top Banner / Header Card */}
              <div className="relative overflow-hidden pt-8 pb-6 px-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/80 flex-shrink-0">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary shadow-inner">
                    <PlanIcon size={24} />
                  </div>
                  <div className="space-y-1 pr-12">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-extrabold text-foreground tracking-tight">{viewingPlan.title}</h2>
                      <StatusBadge status={viewingPlan.status} />
                      {viewingPlan.billingType && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize border border-primary/20">
                          {viewingPlan.billingType}
                        </span>
                      )}
                      {viewingPlan.billingCycle && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground capitalize border border-border">
                          {viewingPlan.billingCycle}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
                      {viewingPlan.description || "No description provided for this plan."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Middle Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Stats Card bar */}
                <div className="grid grid-cols-4 border-b border-border divide-x divide-border bg-secondary/10">
                  <div className="p-4 text-center">
                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest block mb-1">Plan Amount</span>
                    <span className="text-xl font-extrabold text-primary">₹{viewingPlan.amount}</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest block mb-1">Trial Days</span>
                    <span className="text-xl font-extrabold text-foreground">
                      {viewingPlan.trialDays !== null && viewingPlan.trialDays !== undefined ? viewingPlan.trialDays : "None"}
                    </span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest block mb-1">Included Modules</span>
                    <span className="text-xl font-extrabold text-foreground">{viewingPlan.modules?.length || 0}</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest block mb-1">Member Count</span>
                    <span className="text-xl font-extrabold text-foreground">{viewingPlan.memberCount ?? 0}</span>
                  </div>
                </div>

                {/* Modules Details */}
                <div className="p-6">
                  <h3 className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                    Resource Limits & Frequencies
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[180px] overflow-y-auto p-1">
                    {viewingPlan.modules?.map((m: any, i: number) => {
                      const iconMap: Record<string, any> = {
                        "Ask": HelpCircle,
                        "Give": Gift,
                        "Requirement": ClipboardList,
                        "Post": Send,
                        "Milestones": Trophy,
                        "Trainings": GraduationCap,
                        "One to One": Users,
                        "Referral": Share2,
                        "Thank you Slip": Receipt,
                        "Event": Calendar,
                        "Online Stall": Store,
                        "Offline Stall": Store,
                        "Marketplace": ShoppingBag,
                      };
                      const IconComponent = iconMap[m.moduleName] || Layers;
                      const colorMap: Record<string, { hoverBorder: string, bg: string, text: string }> = {
                        "Ask": { hoverBorder: "hover:border-sky-500", bg: "bg-sky-500/10", text: "text-sky-500" },
                        "Give": { hoverBorder: "hover:border-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
                        "Requirement": { hoverBorder: "hover:border-amber-500", bg: "bg-amber-500/10", text: "text-amber-500" },
                        "Post": { hoverBorder: "hover:border-indigo-500", bg: "bg-indigo-500/10", text: "text-indigo-500" },
                        "Milestones": { hoverBorder: "hover:border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-600" },
                        "Trainings": { hoverBorder: "hover:border-violet-500", bg: "bg-violet-500/10", text: "text-violet-500" },
                        "One to One": { hoverBorder: "hover:border-rose-500", bg: "bg-rose-500/10", text: "text-rose-500" },
                        "Referral": { hoverBorder: "hover:border-cyan-500", bg: "bg-cyan-500/10", text: "text-cyan-500" },
                        "Thank you Slip": { hoverBorder: "hover:border-teal-500", bg: "bg-teal-500/10", text: "text-teal-500" },
                        "Event": { hoverBorder: "hover:border-blue-500", bg: "bg-blue-500/10", text: "text-blue-500" },
                        "Online Stall": { hoverBorder: "hover:border-fuchsia-500", bg: "bg-fuchsia-500/10", text: "text-fuchsia-500" },
                        "Offline Stall": { hoverBorder: "hover:border-orange-500", bg: "bg-orange-500/10", text: "text-orange-500" },
                        "Marketplace": { hoverBorder: "hover:border-pink-500", bg: "bg-pink-500/10", text: "text-pink-500" },
                      };
                      const colors = colorMap[m.moduleName] || { hoverBorder: "hover:border-primary", bg: "bg-primary/10", text: "text-primary" };

                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl bg-secondary/15 border border-border/80 transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:bg-background group",
                            colors.hoverBorder
                          )}
                        >
                          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors", colors.bg, colors.text)}>
                            <IconComponent size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">{m.moduleName}</h4>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <span>Every</span>
                              <span className="font-bold text-foreground/75">{m.frequencyValue || 1} {m.frequency || "monthly"}</span>
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col justify-center pl-2">
                            <span className="text-xl font-black text-foreground tracking-tight leading-none">{m.countLimit}</span>
                            <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1 block">LIMIT</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Features & Benefits details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-6 pb-6 border-t border-border pt-4">
                  <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Shield size={12} className="text-primary" />
                      Feature Access
                    </h3>
                    <div className="space-y-1.5">
                      {Object.entries(viewingPlan.features || {
                        monthlyMeeting: false,
                        eventVisitor: false,
                        eventStall: false,
                        spotlights: false
                      }).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20 border border-border/40">
                          <span className="font-semibold text-foreground capitalize">
                            {key.replace(/([A-Z])/g, " $1")}
                          </span>
                          <span className={val ? "text-emerald-500 font-bold" : "text-muted-foreground font-semibold"}>
                            {val ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Trophy size={12} className="text-primary" />
                      Plan Benefits
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20 border border-border/40">
                        <span className="font-semibold text-foreground">Requirement Response Limit</span>
                        <span className="font-bold text-foreground">{viewingPlan.benefits?.requirementResponseLimit ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20 border border-border/40">
                        <span className="font-semibold text-foreground">Point Multiplier</span>
                        <span className="font-bold text-primary">{viewingPlan.benefits?.pointMultiplier ?? 1}x</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20 border border-border/40">
                        <span className="font-semibold text-foreground">Training Discount</span>
                        <span className="font-bold text-foreground">{viewingPlan.benefits?.trainingDiscountPercentage ?? 0}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20 border border-border/40">
                        <span className="font-semibold text-foreground">Referral Bonus Months</span>
                        <span className="font-bold text-foreground">{viewingPlan.benefits?.referralBonusMonths ?? 0} months</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 pb-6 px-6 bg-secondary/10 border-t border-border flex-shrink-0">
                <Button variant="outline" className="h-10 rounded-xl px-6 font-bold" onClick={() => setViewDialogOpen(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansPage;

