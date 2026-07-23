import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Layers,
  Loader2,
  Calendar,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import FormDrawer from "@/components/common/FormDrawer";
import ActionMenu from "@/components/common/ActionMenu";
import { TableLoader, TableSkeleton } from "@/components/common/TableLoader";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/context/AuthContext";
import * as ModulesApi from "@/api/ModulesApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

const ModulesPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("modules", "create");
  const canEdit = hasPermission("modules", "edit");
  const canDelete = hasPermission("modules", "delete");

  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const [allModules, setAllModules] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    parentSlug: ""
  });

  const fetchModules = async (search: string = "", pageNum: number = 1) => {
    setLoading(true);
    try {
      const response = await ModulesApi.getModules({
        search: search,
        page: pageNum - 1,
        limit: pageSize
      });
      if (response.data) {
        setModules(response.data);
        setTotalPages(response.totalPages || Math.ceil((response.total || 0) / pageSize));
      }
    } catch (error: any) {
      console.error("Error fetching modules:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch modules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllModules = async () => {
    try {
      const response = await ModulesApi.getModulesList();
      if (response && response.data) {
        setAllModules(response.data);
      }
    } catch (error) {
      console.error("Error fetching all modules list:", error);
    }
  };

  useEffect(() => {
    fetchAllModules();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModules(searchTerm, 1);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchModules(searchTerm, p);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Module name is required";
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
        name: formData.name.trim(),
        parentSlug: formData.parentSlug || null
      };

      let response;
      if (editingId) {
        response = await ModulesApi.updateModule(editingId, payload);
        toast({
          title: "Success",
          description: response.message || "Module updated successfully",
          variant: "success"
        });
      } else {
        response = await ModulesApi.createModule(payload);
        toast({
          title: "Success",
          description: response.message || "Module created successfully",
          variant: "success"
        });
      }
      fetchModules(searchTerm, page);
      fetchAllModules();
      setDrawerOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving module:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save module",
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
      name: "",
      parentSlug: ""
    });
  };

  const handleEdit = (module: any) => {
    setEditingId(module._id);
    setFormData({
      name: module.name,
      parentSlug: module.parentSlug || ""
    });
    setDrawerOpen(true);
  };

  const confirmDelete = (id: string) => {
    setModuleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!moduleToDelete) return;
    try {
      const response = await ModulesApi.deleteModule(moduleToDelete);
      toast({
        title: "Deleted",
        description: response.message || "Module deleted successfully",
        variant: "success"
      });
      fetchModules(searchTerm, page);
      fetchAllModules();
    } catch (error: any) {
      console.error("Error deleting module:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete module",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setModuleToDelete(null);
    }
  };

  const formatModuleName = (mod: string) => {
    if (!mod) return "";
    return mod
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const parentOptions = allModules.filter(m => 
    (!m.parentSlug || m.parentSlug === null) && 
    m._id !== editingId
  );

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && modules.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Syncing Modules..."
          subtitle="Retrieving latest active features"
        />
      )}

      {/* Header Section */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Layers size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Module Management</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search by module name..."
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
              Add Module
            </Button>
          )}
        </div>
      </div>

      {/* Table Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative glass-card overflow-hidden">
        {loading && modules.length > 0 && <TableLoader text="Syncing Modules..." />}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16 whitespace-nowrap">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Module Name</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Created Date</th>
                <th className="text-center px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Last Updated</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && modules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <TableSkeleton rows={5} columns={5} />
                  </td>
                </tr>
              ) : modules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No modules found. Create one to get started.
                  </td>
                </tr>
              ) : (
                modules.map((module, index) => (
                  <tr key={module._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-4 text-center text-sm text-foreground font-semibold">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-foreground">
                        {formatModuleName(module.name)}
                      </div>
                      {module.parentSlug && (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Parent: <span className="font-semibold text-primary/80">{formatModuleName(module.parentSlug)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
                        <Calendar size={12} className="text-foreground" />
                        {module.createdAt ? new Date(module.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-sm font-semibold text-foreground">
                        <Calendar size={12} className="text-foreground" />
                        {module.updatedAt ? new Date(module.updatedAt).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={canEdit ? () => handleEdit(module) : undefined}
                        onDelete={(canDelete && module.slugName !== "modules" && module.name?.toLowerCase() !== "modules") ? () => confirmDelete(module._id) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Section */}
        {!loading && modules.length > 0 && (
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
        title={editingId ? "Edit Module" : "Add Module"}
        description={editingId ? "Update existing feature name" : "Register a new application feature module"}
      >
        <div className="space-y-6 pb-20 px-4">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Module Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. analytics"
                value={formData.name}
                id="name"
                onChange={handleInputChange}
                className={`mt-1.5 h-11 rounded-xl bg-secondary/30 focus:ring-primary/20 ${
                  errors.name ? "border-red-500 border" : "border-border"
                }`}
              />
              {errors.name && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.name}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Parent Module Mapping (Optional)
              </Label>
              <Select
                value={formData.parentSlug || "none"}
                onValueChange={(val) => setFormData(prev => ({ ...prev, parentSlug: val === "none" ? "" : val }))}
              >
                <SelectTrigger className="mt-1.5 h-11 rounded-xl bg-secondary/30 border-border focus:ring-primary/20 text-xs">
                  <SelectValue placeholder="Select parent module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Root Module)</SelectItem>
                  {parentOptions.map((m) => (
                    <SelectItem key={m._id} value={m.slugName}>
                      {formatModuleName(m.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
              <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Registering a module makes it immediately available for assigning role-based access control and system limits.
              </p>
            </div>
          </div>

          <Button
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-bold mt-6 mb-8"
            onClick={handleSave}
            disabled={formLoading}
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editingId ? "Update Module" : "Create Module"}
          </Button>
        </div>
      </FormDrawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Module?"
        description={
          <>
            This will permanently remove the module <strong className="text-foreground">"{modules.find(m => m._id === moduleToDelete)?.name}"</strong>. This action cannot be undone.
          </>
        }
        onConfirm={handleDelete}
        confirmLabel="Yes, Delete"
        variant="destructive"
      />
    </div>
  );
};

export default ModulesPage;
