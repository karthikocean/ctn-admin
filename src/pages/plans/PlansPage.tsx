import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, CreditCard, Plus, Trash2, CreditCard as PlanIcon, Loader2, AlertCircle } from "lucide-react";
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

const MODULE_OPTIONS = [
  "Ask",
  "Give",
  "Requirement",
  "Post",
  "Milestones",
  "Trainings",
  "One to One",
  "Referral",
  "Thank you Slip"
];

const PlansPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("plans", "create");
  const canEdit = hasPermission("plans", "edit");
  const canDelete = hasPermission("plans", "delete");
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: 0,
    modules: [{ moduleName: "", countLimit: 0 }],
    status: "active"
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
      modules: [...formData.modules, { moduleName: "", countLimit: 0 }]
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
    if (!formData.title.trim()) {
      toast({ title: "Validation Error", description: "Title is required", variant: "destructive" });
      return;
    }
    if (formData.modules.some(m => !m.moduleName)) {
      toast({ title: "Validation Error", description: "Please select a valid module name", variant: "destructive" });
      return;
    }

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
    setFormData({
      title: "",
      description: "",
      amount: 0,
      modules: [{ moduleName: "", countLimit: 0 }],
      status: "active"
    });
  };

  const handleEdit = (plan: any) => {
    setEditingId(plan._id);
    setFormData({
      title: plan.title,
      description: plan.description,
      amount: plan.amount,
      modules: plan.modules.map((m: any) => ({
        moduleName: m.moduleName,
        countLimit: m.countLimit
      })),
      status: plan.status || "active"
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
    <div className="page-container">
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

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs">
            <Filter size={14} className="mr-1.5" />
            Filters
          </Button>

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
        {loading && plans.length === 0 && (
          <GlobalNetworkLoader
            fullScreen={false}
            title="Syncing Plans..."
            subtitle="Retrieving latest subscription tier data"
          />
        )}
        {loading && plans.length > 0 && <TableLoader text="Syncing Plans..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan Details</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modules</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={5} columns={6} />
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No plans found. Create one to get started.
                  </td>
                </tr>
              ) : (
                plans.map((plan, index) => (
                  <tr key={plan._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 text-center text-xs font-medium text-muted-foreground">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-foreground">{plan.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-primary">₹{plan.amount}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {plan.modules.map((m: any, i: number) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border text-foreground">
                            {m.moduleName}: {m.countLimit}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
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
          <div className="px-6 py-4 border-t border-border">
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
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan Title</Label>
              <Input
                placeholder="Enter plan title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1.5 h-11 rounded-xl border-border bg-secondary/30 focus:ring-primary/20"
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">₹</span>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="h-11 pl-7 rounded-xl border-border bg-secondary/30 focus:ring-primary/20"
                  />
                </div>
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
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modules Configuration</Label>
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
                  <div className="flex-1 grid grid-cols-5 gap-3">
                    <div className="col-span-3">
                      <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-1.5 block ml-0.5">Select Module</Label>
                      <select
                        className="w-full h-10 px-3 rounded-lg border border-border bg-background text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                        value={module.moduleName}
                        onChange={(e) => handleModuleChange(index, "moduleName", e.target.value)}
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
                        value={module.countLimit}
                        onChange={(e) => handleModuleChange(index, "countLimit", parseInt(e.target.value) || 0)}
                        className="h-10 rounded-lg border-border bg-background text-xs font-black focus:ring-primary/20 text-center"
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
    </div>
  );
};

export default PlansPage;

