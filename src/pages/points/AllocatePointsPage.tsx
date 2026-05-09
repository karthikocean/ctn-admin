import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const AllocatePointsPage = () => {
  const { toast } = useToast();
  const [pointConfigs, setPointConfigs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moduleName, setModuleName] = useState("");
  const [pointsValue, setPointsValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName || pointsValue === "") {
      toast({ title: "Validation Error", description: "Please select a module and enter points", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { moduleName, points: parseInt(pointsValue) };
      
      if (editingId) {
        const res = await updatePointConfig(editingId, payload);
        toast({ title: "Updated", description: res.message || "Point configuration updated successfully", variant: "success" });
      } else {
        const res = await createPointConfig(payload);
        toast({ title: "Created", description: res.message || "Point configuration created successfully", variant: "success" });
      }
      
      setShowForm(false);
      setModuleName("");
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
    setPointsValue(config.points.toString());
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (config: any) => {
    setDeleteId(config._id);
    setDeleteName(config.moduleName);
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
    <div className="page-container">
      <PageHeader
        title="Allocate Points"
        subtitle="Manage point rewards for different system modules"
      >
        <Button
          className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          onClick={() => {
            if (showForm && !editingId) {
                setShowForm(false);
            } else {
                setShowForm(true);
                setEditingId(null);
                setModuleName("");
                setPointsValue("");
            }
          }}
        >
          {showForm && !editingId ? "Cancel" : <><Plus size={16} className="mr-2" /> Add Module</>}
        </Button>
      </PageHeader>

      {/* Form Section */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-8 border-primary/10 bg-primary/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Plus size={18} />
            </div>
            <h3 className="font-bold text-slate-800">
              {editingId ? `Edit Points for "${moduleName}"` : "Add New Module Points"}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="moduleName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Module Name</Label>
                <Select value={moduleName} onValueChange={setModuleName} disabled={!!editingId}>
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
                <Label htmlFor="points" className="text-xs font-bold uppercase tracking-wider text-slate-500">Points Allocation</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={pointsValue}
                  onChange={(e) => setPointsValue(e.target.value)}
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
                {editingId ? "Update Configuration" : "Save Module Points"}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Modules List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden border-slate-100"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Module Name
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
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-16 text-center">
                    <Loader2 className="animate-spin inline mr-3 text-primary" size={24} />
                    <span className="text-slate-500 font-medium">Loading configurations...</span>
                  </td>
                </tr>
              ) : pointConfigs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-40">
                        <Plus size={48} className="text-slate-300" />
                        <p className="text-slate-500 font-medium">No modules configured yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pointConfigs.map((config) => (
                  <tr key={config._id} className="group hover:bg-slate-50/80 transition-all duration-300">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                        <span className="text-sm font-bold text-slate-700">{config.moduleName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                        {config.points} Points
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                          onClick={() => handleEdit(config)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          onClick={() => handleDeleteClick(config)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-slate-800">Delete Module Configuration?</AlertDialogTitle>
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
