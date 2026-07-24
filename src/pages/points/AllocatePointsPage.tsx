import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPointConfigs, createPointConfig, updatePointConfig, deletePointConfig } from "@/api/PointConfigApi";
import { Plus, Loader2, CheckCircle2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TableLoader } from "@/components/common/TableLoader";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Badge } from "@/components/ui/badge";
import ActionMenu from "@/components/common/ActionMenu";
import PaginationBar from "@/components/common/PaginationBar";

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
  "Spotlight",
  "Online Stall",
  "Meeting",
  "Marketplace"
];

const TYPE_OPTIONS = [
  { label: "Creation", value: "creation" },
  { label: "Response", value: "response" },
  { label: "Spent", value: "spent" }
];

const AllocatePointsPage = () => {
  const { toast } = useToast();
  const [pointConfigs, setPointConfigs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moduleName, setModuleName] = useState("");
  const [type, setType] = useState("creation");
  const [pointsValue, setPointsValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      if (
        showForm &&
        formRef.current &&
        !formRef.current.contains(target)
      ) {
        // Ignore clicks on buttons, inputs, dropdown menus, select options, dialogs, and portals
        if (
          target.closest('button') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('[role="menu"]') ||
          target.closest('[role="menuitem"]') ||
          target.closest('[role="listbox"]') ||
          target.closest('[role="dialog"]') ||
          target.closest('[role="alertdialog"]') ||
          target.closest('[data-radix-portal]') ||
          target.closest('[data-radix-popper-content-wrapper]')
        ) {
          return;
        }

        setShowForm(false);
        setEditingId(null);
        setModuleName("");
        setType("creation");
        setPointsValue("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showForm]);

  // Search, Filter, Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const res = await getPointConfigs();
      setPointConfigs(res.data || []);
    } catch (error) {
      console.error("Error fetching point configs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const filteredConfigs = useMemo(() => {
    let result = pointConfigs;

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (c) => c.moduleName.toLowerCase().includes(query)
      );
    }

    if (selectedType && selectedType !== "all") {
      result = result.filter(
        (c) => c.type?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    return result;
  }, [pointConfigs, searchTerm, selectedType]);

  const paginatedConfigs = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredConfigs.slice(startIndex, startIndex + pageSize);
  }, [filteredConfigs, page]);

  const totalPages = Math.ceil(filteredConfigs.length / pageSize);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = parseInt(pointsValue);
    if (!moduleName || !type || pointsValue === "" || isNaN(pts) || pts <= 0) {
      toast({ title: "Validation Error", description: "Please select a module, type and enter a valid positive points value", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { moduleName, type, points: pts };

      if (editingId) {
        const res = await updatePointConfig(editingId, payload);
        toast({ title: "Updated", description: res.message || "Point configuration updated successfully", variant: "success" });
      } else {
        const res = await createPointConfig(payload);
        toast({ title: "Created", description: res.message || "Point configuration created successfully", variant: "success" });
      }

      setShowForm(false);
      setModuleName("");
      setType("creation");
      setPointsValue("");
      setEditingId(null);
      fetchConfigs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save configuration",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (config: any) => {
    setEditingId(config._id);
    setModuleName(config.moduleName);
    setType(config.type || "creation");
    setPointsValue(config.points.toString());
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleDeleteClick = (config: any) => {
    setDeleteId(config._id);
    setDeleteName(`${config.moduleName} (${config.type})`);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await deletePointConfig(deleteId);
      toast({ title: "Deleted", description: res.message || "Configuration deleted successfully", variant: "success" });
      fetchConfigs();
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete configuration",
        variant: "destructive"
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {isLoading && pointConfigs.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Syncing Rewards Network..."
          subtitle="Establishing point allocation protocols"
        />
      )}
      <PageHeader
        title="Allocate Points"
      // subtitle="Manage point rewards for different system modules"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search modules..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-9 pl-8 pr-3 w-40 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:border-primary focus:ring-0 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Type Filter */}
          <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setPage(1); }}>
            <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-secondary/30 border-border focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="creation">Creation</SelectItem>
              <SelectItem value="response">Response</SelectItem>
              <SelectItem value="spent">Spent</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="rounded-lg bg-primary hover:bg-primary/90 text-xs shadow-md add-points-btn"
            onClick={() => {
              if (showForm && !editingId) {
                setShowForm(false);
              } else {
                setShowForm(true);
                setEditingId(null);
                setModuleName("");
                setType("creation");
                setPointsValue("");
              }
            }}
          >
            {showForm && !editingId ? "Cancel" : <><Plus size={14} className="mr-1.5" /> Add Points</>}
          </Button>
        </div>
      </PageHeader>

      {/* Form Section */}
      {showForm && (
        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-8 border-primary/10 bg-primary/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Plus size={18} />
            </div>
            <h3 className="font-bold text-slate-800">
              {editingId ? `Edit Points for "${moduleName}" (${type})` : "Add Points"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="moduleName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Module Name</Label>
                <Select value={moduleName} onValueChange={setModuleName}>
                  <SelectTrigger id="moduleName" className="h-12 bg-white border-slate-200 rounded-xl">
                    <SelectValue placeholder="Select Module" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-slate-500">Allocation Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type" className="h-12 bg-white border-slate-200 rounded-xl">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points" className="text-xs font-bold uppercase tracking-wider text-slate-500">Points Allocation</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={pointsValue}
                  onKeyDown={(e) => {
                    if (["-", "+", "e", "E", ".", ","].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleaned = val.replace(/[^0-9]/g, "");
                    setPointsValue(cleaned);
                  }}
                  placeholder="Enter points value"
                  className="h-12 bg-white border-slate-200 rounded-xl font-bold text-primary"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 px-6 rounded-xl border-slate-200 font-bold !bg-white !text-slate-700 hover:!bg-slate-50 hover:!text-slate-900 transition-all"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setModuleName("");
                  setType("creation");
                  setPointsValue("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 size={18} className="mr-2" />}
                {editingId ? "Update Configuration" : "Save Points"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Modules List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden border-slate-100 relative"
      >
        {isLoading && pointConfigs.length > 0 && <TableLoader text="Synchronizing Point Configurations..." />}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16">
                  S.No
                </th>
                <th className="text-left px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Module Name
                </th>
                <th className="text-left px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Type
                </th>
                <th className="text-left px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Points Allocation
                </th>
                <th className="text-right px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && pointConfigs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24">
                    <GlobalNetworkLoader
                      fullScreen={false}
                      title="Syncing Rewards Network..."
                      subtitle="Establishing point allocation protocols"
                    />
                  </td>
                </tr>
              ) : filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                      <Plus size={48} className="text-slate-300" />
                      <p className="text-slate-500 font-medium">No point configurations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedConfigs.map((config, index) => (
                  <tr key={config._id} className="group hover:bg-slate-50/80 transition-all duration-300">
                    <td className="px-8 py-5 text-sm font-semibold text-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                        <span className="text-sm font-semibold text-foreground">{config.moduleName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-foreground font-semibold">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`capitalize font-semibold text-xs px-2 py-0 border-primary/20 bg-primary/5 text-primary`}>
                          {config.type || "-"}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-sm font-semibold">
                        {config.points} Points
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <ActionMenu
                        onEdit={() => handleEdit(config)}
                        onDelete={() => handleDeleteClick(config)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredConfigs.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-100">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Delete Points Configuration?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 font-medium pt-2 leading-relaxed">
              Are you sure you want to delete the point configuration for <span className="font-bold text-slate-700">"{deleteName}"</span>?
              This will remove its points allocation rules from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-6">
            <AlertDialogCancel className="rounded-xl border-slate-200 !bg-white !text-slate-700 font-bold h-12 flex-1 hover:!bg-slate-50 hover:!text-slate-900 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold h-12 flex-1 shadow-lg shadow-red-200"
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AllocatePointsPage;
