import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Shield, Users, Filter, X, Lock, CheckCircle2, ChevronRight, ChevronLeft, Network } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import PaginationBar from "@/components/common/PaginationBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import PremiumLoader from "@/components/common/PremiumLoader";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Role {
  _id: string;
  name: string;
  code: string;
  description?: string;
  userCount: number;
  permissions: any[];
}

const RoleSkeleton = () => (
  <div className="flex-none w-[280px] p-4 rounded-2xl border border-border bg-card/50">
    <div className="flex items-start justify-between mb-4">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <Skeleton className="w-6 h-6 rounded-md" />
    </div>
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-6" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border/50">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-3 w-1/6" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    ))}
  </div>
);

const RolesPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("roles_permissions", "create");
  const canEdit = hasPermission("roles_permissions", "edit");
  const canDelete = hasPermission("roles_permissions", "delete");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [userToUpdateStatus, setUserToUpdateStatus] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>("Active");

  const [roles, setRoles] = useState<Role[]>([]);
  const [roleUsers, setRoleUsers] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Memoized user lists with resolved role names
  const memoizedRecentUsers = useMemo(() => {
    return recentUsers.map((u: any) => ({
      ...u,
      resolvedRole: roles.find((r: any) => r._id === u.roleId)?.name || u.role || "N/A"
    }));
  }, [recentUsers, roles]);

  const memoizedRoleUsers = useMemo(() => {
    return roleUsers.map((u: any) => ({
      ...u,
      resolvedRole: roles.find((r: any) => r._id === u.roleId)?.name || u.role || "N/A"
    }));
  }, [roleUsers, roles]);

  // Pagination state
  const [usersPage, setUsersPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [deleteRoleConfirmOpen, setDeleteRoleConfirmOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
  });

  // Permission state and actions
  const actions = ["VIEW", "ADD", "EDIT", "DELETE"];
  const [permissionModules, setPermissionModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});

  const formatModuleName = (mod: string) => {
    return mod
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const fetchPaginatedUsers = async (roleId: string | null, page: number = 1) => {
    try {
      setUsersLoading(true);
      setUsersPage(page);

      let url = `/admin-users?page=${page - 1}&limit=${pageSize}`;
      if (roleId) {
        url += `&roleId=${roleId}`;
      }

      const response = await api.get(url);
      if (response.data && response.data.data) {
        setRoleUsers(response.data.data);
        const meta = response.data.meta;
        if (meta) {
          setTotalPages(meta.totalPages || 1);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/roles?search=${searchTerm}`);
      if (response.data && response.data.data) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUsers = async () => {

    try {
      setRecentLoading(true);
      const response = await api.get("/admin-users?limit=10");
      if (response.data && response.data.data) {
        setRecentUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching recent users:", error);
    } finally {
      setRecentLoading(false);
    }
  };

  const fetchPermissionModules = async () => {
    try {
      const response = await api.get('/roles/modules');
      if (response.data && response.data.data) {
        const mods = response.data.data.map((m: any) => m.name);
        setPermissionModules(mods);
        setPermissions((prev) => {
          const initial: Record<string, Record<string, boolean>> = { ...prev };
          mods.forEach((mod: string) => {
            if (!initial[mod]) {
              initial[mod] = { VIEW: false, ADD: false, EDIT: false, DELETE: false };
            }
          });
          return initial;
        });
      }
    } catch (error) {
      console.error("Error fetching permission modules:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchRecentUsers();
    fetchPermissionModules();
  }, [searchTerm]);

  const handleTogglePermission = (mod: string, action: string) => {
    setPermissions(prev => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [action]: !prev[mod][action]
      }
    }));
  };

  const handleToggleColumn = (action: string) => {
    const isAllChecked = permissionModules.every(mod => permissions[mod][action]);
    setPermissions(prev => {
      const next = { ...prev };
      permissionModules.forEach(mod => {
        next[mod] = { ...next[mod], [action]: !isAllChecked };
      });
      return next;
    });
  };

  // Mock data no longer needed for recent users


  const handleRoleCountClick = (roleName: string, roleId?: string) => {
    setSelectedRole(roleName);
    if (roleId) {
      setSelectedRoleId(roleId);
      fetchPaginatedUsers(roleId, 1);
    } else {
      setRoleUsers([]);
      setSelectedRoleId(null);
    }
    setUsersDialogOpen(true);
  };


  const handleEditRole = (role: Role) => {
    console.log(role);
    // Map existing permissions to the state
    const nextPerms: Record<string, Record<string, boolean>> = {};
    permissionModules.forEach(mod => {
      console.log(mod);
      const roleMod = role.permissions.find(p => p.moduleId === mod.toLowerCase());
      nextPerms[mod] = {
        VIEW: roleMod?.actions?.includes("view") || false,
        ADD: roleMod?.actions?.includes("create") || false,
        EDIT: roleMod?.actions?.includes("edit") || false,
        DELETE: roleMod?.actions?.includes("delete") || false,
      };
    });
    setPermissions(nextPerms);
    setNewRole({
      name: role.name,
      description: role.description || "",
    });
    setEditingRoleId(role._id);
    setDrawerOpen(true);
  };

  const handleOpenPermissions = (role: Role) => {
    // Map existing permissions to the state
    const nextPerms: Record<string, Record<string, boolean>> = {};
    permissionModules.forEach(mod => {
      const roleMod = role.permissions.find(p => p.moduleId === mod.toLowerCase());
      nextPerms[mod] = {
        VIEW: roleMod?.actions?.includes("view") || false,
        ADD: roleMod?.actions?.includes("create") || false,
        EDIT: roleMod?.actions?.includes("edit") || false,
        DELETE: roleMod?.actions?.includes("delete") || false,
      };
    });
    setPermissions(nextPerms);
    setEditingRoleId(role._id);
    setPermDialogOpen(true);
  };

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);


  const handleEditUser = (userId: string) => {
    const user = roleUsers.find(u => u._id === userId || u.id === userId);
    if (!user) return;

    // Set form fields
    setNewUser({
      name: user.name || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
    });

    setEditingUserId(userId);
    setIsEditMode(true);
    setAddUserDialogOpen(true);
  };


  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const response = await api.delete(`/admin-users/${userToDelete}`);
      toast({ title: "Success", description: response.data?.message || "User deleted successfully", variant: "success" });
      if (selectedRoleId) fetchPaginatedUsers(selectedRoleId, usersPage);
      else fetchPaginatedUsers(null, usersPage);
      fetchRoles();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete user";
      toast({ title: "Error", description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg, variant: "destructive" });
    } finally {
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteRoleClick = (roleId: string) => {
    setRoleToDelete(roleId);
    setDeleteRoleConfirmOpen(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      const response = await api.delete(`/roles/${roleToDelete}`);
      toast({ title: "Success", description: response.data?.message || "Role deleted successfully", variant: "success" });
      fetchRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      const errorMsg = error.response?.data?.message || "Failed to delete role";
      toast({ title: "Error", description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg, variant: "destructive" });
    } finally {
      setDeleteRoleConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleStatusClick = (user: any) => {
    setUserToUpdateStatus(user);
    setNewStatus(user.isActive ? "Active" : "Inactive");
    setStatusDialogOpen(true);
  };


  const handleUpdateStatus = async () => {
    if (!userToUpdateStatus) return;

    try {
      const userId = userToUpdateStatus._id || userToUpdateStatus.id;
      const isActive = newStatus === "Active" ? 1 : 0;

      const response = await api.patch(`/admin-users/${userId}/status`, { isActive });

      toast({ title: "Success", description: response.data?.message || `User status updated to ${newStatus}`, variant: "success" });

      // Refresh data
      if (selectedRoleId) fetchPaginatedUsers(selectedRoleId, usersPage);
      else fetchPaginatedUsers(null, usersPage);
      fetchRoles();
      fetchRecentUsers();

      setStatusDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating status:", error);
      const errorMsg = error.response?.data?.message || "Failed to update status";
      toast({ title: "Error", description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg, variant: "destructive" });
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingRoleId) return;

    try {
      const rolePermissions = Object.entries(permissions)
        .map(([mod, actions]) => {
          const selectedActions = Object.entries(actions)
            .filter(([_, enabled]) => enabled)
            .map(([action]) => {
              if (action === "VIEW") return "view";
              if (action === "ADD") return "create";
              if (action === "EDIT") return "edit";
              if (action === "DELETE") return "delete";
              return action.toLowerCase();
            });

          if (selectedActions.length === 0) return null;

          return {
            moduleId: mod.toLowerCase(),
            actions: selectedActions
          };
        })
        .filter(p => p !== null);

      const response = await api.patch(`/roles/${editingRoleId}`, { permissions: rolePermissions });
      toast({ title: "Success", description: response.data?.message || "Permissions updated successfully", variant: "success" });

      setPermDialogOpen(false);
      setEditingRoleId(null);
      fetchRoles();
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      const errorMsg = error.response?.data?.message || "Failed to update permissions";
      toast({ title: "Error", description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg, variant: "destructive" });
    }
  };

  const handleSaveRole = async () => {
    try {
      // Validate
      if (!newRole.name) {
        toast({ title: "Error", description: "Role name is required", variant: "destructive" });
        return;
      }

      // Transform permissions Record<string, Record<string, boolean>> to Array<{moduleId, actions}>
      const rolePermissions = Object.entries(permissions)
        .map(([mod, actions]) => {
          const selectedActions = Object.entries(actions)
            .filter(([_, enabled]) => enabled)
            .map(([action]) => {
              if (action === "VIEW") return "view";
              if (action === "ADD") return "create";
              if (action === "EDIT") return "edit";
              if (action === "DELETE") return "delete";
              return action.toLowerCase();
            });

          if (selectedActions.length === 0) return null;

          return {
            moduleId: mod.toLowerCase(),
            actions: selectedActions
          };
        })
        .filter(p => p !== null);

      const payload = {
        name: newRole.name,
        code: newRole.name.toUpperCase().replace(/\s+/g, "_"),
        description: newRole.description,
        permissions: rolePermissions,
        isActive: true
      };

      if (editingRoleId) {
        const response = await api.patch(`/roles/${editingRoleId}`, payload);
        toast({ title: "Success", description: response.data?.message || "Role updated successfully", variant: "success" });
      } else {
        const response = await api.post("/roles", payload);
        toast({ title: "Success", description: response.data?.message || "Role created successfully", variant: "success" });
      }

      // Reset and close
      setNewRole({ name: "", description: "" });
      setEditingRoleId(null);
      setPermissions(() => {
        const initial: Record<string, Record<string, boolean>> = {};
        permissionModules.forEach((mod) => {
          initial[mod] = { VIEW: false, ADD: false, EDIT: false, DELETE: false };
        });
        return initial;
      });
      setDrawerOpen(false);

      // Refresh data
      fetchRoles();
    } catch (error: any) {
      console.error("Error saving role:", error);
      const errorMsg = error.response?.data?.message || "Failed to save role";
      toast({ title: "Error", description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg, variant: "destructive" });
    }
  };


  const handleAddUserAction = (roleName: string, roleId: string) => {
    setSelectedRole(roleName);
    setSelectedRoleId(roleId);
    setNewUser({ name: "", email: "", phone: "" });
    setIsEditMode(false);
    setEditingUserId(null);
    setAddUserDialogOpen(true);
  };


  const handleSaveUser = async () => {
    try {
      if (!selectedRoleId) {
        console.error("No role ID selected for user save");
        toast({ title: "Error", description: "Role information is missing. Please try again.", variant: "destructive" });
        return;
      }

      // Basic Validation
      const errors: Record<string, string> = {};
      if (!newUser.name.trim()) errors.name = "Full name is required";

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!newUser.email) errors.email = "Email is required";
      else if (!emailRegex.test(newUser.email)) errors.email = "Invalid email format";

      if (!newUser.phone) errors.phone = "Phone number is required";
      else if (newUser.phone.replace(/\D/g, "").length !== 10) errors.phone = "Phone must be exactly 10 digits";

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast({ title: "Error", description: "Please fix the errors in the form", variant: "destructive" });
        return;
      }

      setFormErrors({});


      const payload = {
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phone,
        roleId: selectedRoleId,
        companyName: "CTN Global",
        isActive: true,
      };

      if (isEditMode && editingUserId) {
        console.log("Triggering PATCH for user:", editingUserId);
        const response = await api.patch(`/admin-users/${editingUserId}`, payload);
        toast({ title: "Success", description: response.data?.message || "User updated successfully", variant: "success" });
      } else {
        console.log("Triggering POST for new user");
        const response = await api.post("/admin-users", payload);
        toast({ title: "Success", description: response.data?.message || "User created successfully", variant: "success" });
      }


      setAddUserDialogOpen(false);
      setEditingUserId(null);

      // Refresh data
      if (selectedRoleId) fetchPaginatedUsers(selectedRoleId, 1);
      else fetchPaginatedUsers(null, 1);
      fetchRoles();
    } catch (error: any) {
      console.error("Error saving user:", error);
      const errorMsg = error.response?.data?.message || "Failed to save user";
      toast({ title: "Error", description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg, variant: "destructive" });
    }
  };





  // Reset role filter when closing users dialog
  const handleUsersDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedRole(null);
      setSelectedRoleId(null);
    }
    setUsersDialogOpen(open);
  };

  // Reset selected role when closing add user dialog
  const handleAddUserDialogClose = (open: boolean) => {
    if (!open) setSelectedRole(null);
    setAddUserDialogOpen(open);
  };


  return (
    <div className="page-container">
      {loading && roles.length === 0 ? (
        <div className="page-container relative min-h-[600px]">
          <GlobalNetworkLoader
            fullScreen={false}
            title="CTN Admin Network Data..."
            subtitle="Establishing secure connection to global nodes"
          />
        </div>
      ) : (
        <>
          {/* Single Row Header */}
          <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
            {/* Page Title Block */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield size={16} className="text-primary" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground">Roles & Permissions</h1>
              </div>
            </div>

            {/* Search, Filters, Add - aligned right on same row */}
            <div className="flex flex-wrap items-center gap-2 ml-auto w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:flex-initial">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 pr-3 w-full md:w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Filters */}
              <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs flex-1 md:flex-initial">
                <Filter size={14} className="mr-1.5" />
                Filters
              </Button>

              {/* View All Users */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg text-xs flex-1 md:flex-initial"
                onClick={() => {
                  setSelectedRole(null);
                  setSelectedRoleId(null);
                  fetchPaginatedUsers(null, 1);
                  setUsersDialogOpen(true);
                }}
              >
                <Users size={14} className="mr-1.5" />
                View All
              </Button>

              {/* Add Role */}
              {canCreate && (
                <Button
                  size="sm"
                  className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs w-full md:w-auto"
                  onClick={() => {
                    setEditingRoleId(null);
                    setNewRole({ name: "", description: "" });
                    setPermissions(() => {
                      const initial: Record<string, Record<string, boolean>> = {};
                      permissionModules.forEach((mod) => {
                        initial[mod] = { VIEW: false, ADD: false, EDIT: false, DELETE: false };
                      });
                      return initial;
                    });
                    setDrawerOpen(true);
                  }}
                >
                  + Add Role
                </Button>
              )}
            </div>
          </div>

          <div className="relative w-full group -mx-1 px-1">
            <div
              ref={scrollContainerRef}
              className={cn(
                "grid gap-4 transition-all duration-300",
                roles.length > 4
                  ? "flex overflow-x-auto pb-4 px-1 no-scrollbar snap-x snap-mandatory scroll-px-1"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              )}
            >
              {loading ? (
                Array(4).fill(0).map((_, i) => <RoleSkeleton key={i} />)
              ) : (
                roles.map((role, i) => (
                  <motion.div
                    key={role._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className={cn(
                      "glass-card p-5 transition-all",
                      roles.length > 4 ? "min-w-[calc(25%-12px)] shrink-0 grow-0 snap-start" : "w-full"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{role.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[180px]">
                          {role.description || `Role code: ${role.code}`}
                        </p>
                      </div>
                      <ActionMenu
                        onEdit={canEdit ? () => handleEditRole(role) : undefined}
                        onDelete={canDelete ? () => handleDeleteRoleClick(role._id) : undefined}
                        onAddUser={canCreate ? () => handleAddUserAction(role.name, role._id) : undefined}
                      />

                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-xs px-2 hover:bg-primary/10"
                        onClick={() => handleRoleCountClick(role.name, role._id)}
                      >
                        <span className="font-semibold">{role.userCount || 0}</span> users
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs"
                        onClick={() => handleOpenPermissions(role)}
                      >
                        Permissions
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {roles.length > 4 && (
              <>
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 rounded-full bg-background border border-border shadow-xl flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 rounded-full bg-background border border-border shadow-xl flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>


          {/* Recent Users Table (always visible below roles) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6"
          >
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Recently Created Users</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing the 10 most recently created users
                </p>
              </div>
              <div className="table-responsive">
                <table className="w-full min-w-[800px] md:min-w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Phone</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentLoading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20">
                          <PremiumLoader style="pulse" variant="centered" text="Loading recent updates..." />
                        </td>
                      </tr>
                    ) : memoizedRecentUsers.map((user, index) => (
                      <tr key={user._id || user.id || index} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-primary/80">
                          {user.userId || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">{user.name?.charAt(0)}</span>
                            </div>
                            <span className="font-medium text-sm text-foreground">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{user.email || "N/A"}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{user.phoneNumber || "N/A"}</td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{user.resolvedRole}</td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            status={user.isActive ? "Active" : "Inactive"}
                            onClick={() => handleStatusClick(user)}
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ActionMenu
                            onEdit={canEdit ? () => handleEditUser(user._id || user.id) : undefined}
                            onDelete={canDelete ? () => handleDeleteUser(user._id || user.id) : undefined}
                          />
                        </td>
                      </tr>
                    ))}
                    {memoizedRecentUsers.length === 0 && !recentLoading && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>

                </table>
              </div>
            </div>
          </motion.div>

          {/* Permissions Dialog */}
          <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border border-border shadow-2xl">
              <div className="flex flex-col h-full">
                <div className="px-6 py-5 border-b border-border bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Lock className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold tracking-tight text-foreground">Role Permissions</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Configure access levels for each module</p>
                    </div>
                  </div>
                </div>



                <div className="p-0">
                  {/* Static Header */}
                  <div className="px-6 pt-4 bg-card border-b border-border">
                    <table className="w-full table-fixed">
                      <thead>
                        <tr>
                          <th className="py-3 text-left w-[40%]">
                            <span className="text-[11px] font-extrabold text-foreground uppercase tracking-widest pl-3">Module Name</span>
                          </th>
                          {actions.map(action => (
                            <th key={action} className="py-3 text-center">
                              <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleToggleColumn(action)}>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                                  {action}
                                </span>
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                  permissionModules.every(mod => permissions[mod][action])
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/30 bg-card hover:border-primary/50"
                                )}>
                                  {permissionModules.every(mod => permissions[mod][action]) && <CheckCircle2 size={12} />}
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                    </table>
                  </div>

                  {/* Scrollable Body */}
                  <div className="max-h-[50vh] overflow-y-auto no-scrollbar px-6 py-2">
                    <table className="w-full table-fixed border-separate border-spacing-y-3">
                      <tbody>
                        {permissionModules.map((mod) => (
                          <tr key={mod} className="group hover:bg-secondary/40 transition-all rounded-xl">
                            <td className="py-3 px-3 rounded-l-xl bg-card border-y border-l border-border group-hover:border-primary/20 w-[40%]">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                  <Shield size={14} className="text-primary/70" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-foreground">{mod}</span>
                                </div>
                              </div>
                            </td>
                            {actions.map(action => (
                              <td key={action} className={cn(
                                "py-3 px-2 text-center bg-card border-y border-border group-hover:border-primary/20",
                                action === "DELETE" ? "rounded-r-xl border-r" : ""
                              )}>
                                <div
                                  className="flex justify-center cursor-pointer"
                                  onClick={() => handleTogglePermission(mod, action)}
                                >
                                  <div className={cn(
                                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-200",
                                    permissions[mod][action]
                                      ? "bg-primary/10 border-primary/30 text-primary scale-110 shadow-sm"
                                      : "border-muted-foreground/20 bg-transparent opacity-40 hover:opacity-100 hover:border-primary/40"
                                  )}>
                                    {permissions[mod][action] ? (
                                      <CheckCircle2 size={14} className="fill-primary text-white" />
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                                    )}
                                  </div>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>



                <div className="px-6 py-5 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                  <Button variant="outline" onClick={() => setPermDialogOpen(false)} className="rounded-xl bg-card">
                    Discard Changes
                  </Button>
                  <Button
                    className="rounded-xl bg-primary hover:bg-primary/90 px-6 shadow-lg shadow-primary/20 flex items-center gap-2"
                    onClick={handleUpdatePermissions}
                  >
                    <CheckCircle2 size={16} />
                    Save Permissions
                  </Button>
                </div>
              </div>
            </DialogContent>

          </Dialog>

          {/* Users Dialog */}
          <Dialog open={usersDialogOpen} onOpenChange={handleUsersDialogClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      {selectedRole ? `Users with "${selectedRole}" role` : "All Admin Users"}
                    </DialogTitle>
                    <DialogDescription>
                      {usersLoading
                        ? "Fetching users..."
                        : `Showing ${roleUsers.length} user(s) assigned to this role`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="table-responsive mt-4">
                {usersLoading ? (
                  <div className="py-24">
                    <PremiumLoader variant="centered" style="tech-circle" text="Establishing member connection..." />
                  </div>
                ) : (
                  <table className="w-full min-w-[700px] md:min-w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Phone</th>
                        {!selectedRoleId && <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>}
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {memoizedRoleUsers.map((user, index) => (
                        <tr key={user._id || user.id || index} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-primary/80">
                            {user.userId || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">{user.name?.charAt(0)}</span>
                              </div>
                              <span className="font-medium text-sm text-foreground">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{user.email || "N/A"}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{user.phoneNumber || "N/A"}</td>
                          {!selectedRoleId && <td className="px-6 py-4 text-sm font-medium text-foreground">{user.resolvedRole}</td>}
                          <td className="px-6 py-4">
                            <StatusBadge
                              status={user.isActive ? "Active" : "Inactive"}
                              onClick={() => handleStatusClick(user)}
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <ActionMenu
                              onEdit={canEdit ? () => handleEditUser(user._id || user.id) : undefined}
                              onDelete={canDelete ? () => handleDeleteUser(user._id || user.id) : undefined}
                            />

                          </td>
                        </tr>
                      ))}
                      {roleUsers.length === 0 && !usersLoading && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Users size={32} className="text-muted-foreground/30" />
                              <p className="text-muted-foreground font-medium">No users found for this role.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 px-2">
                  <PaginationBar
                    currentPage={usersPage}
                    totalPages={totalPages}
                    onPageChange={(page) => fetchPaginatedUsers(selectedRoleId, page)}
                  />
                </div>
              )}

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setUsersDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


          {/* Add User Dialog */}
          <Dialog open={addUserDialogOpen} onOpenChange={handleAddUserDialogClose}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit User" : `Add User to ${selectedRole}`}</DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Update the user's account details below."
                    : `Create a new user account and assign them to the ${selectedRole} role.`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className={cn(formErrors.name && "text-destructive")}>Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={(e) => {
                      setNewUser({ ...newUser, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
                    }}
                    className={cn(formErrors.name && "border-destructive focus-visible:ring-destructive")}
                  />
                  {formErrors.name && <span className="text-[10px] text-destructive font-medium">{formErrors.name}</span>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className={cn(formErrors.email && "text-destructive")}>Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={newUser.email}
                    onChange={(e) => {
                      setNewUser({ ...newUser, email: e.target.value });
                      if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                    }}
                    className={cn(formErrors.email && "border-destructive focus-visible:ring-destructive")}
                  />
                  {formErrors.email && <span className="text-[10px] text-destructive font-medium">{formErrors.email}</span>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone" className={cn(formErrors.phone && "text-destructive")}>Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={newUser.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setNewUser({ ...newUser, phone: val });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: "" });
                    }}
                    className={cn(formErrors.phone && "border-destructive focus-visible:ring-destructive")}
                  />
                  {formErrors.phone && <span className="text-[10px] text-destructive font-medium">{formErrors.phone}</span>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="rounded-xl bg-primary hover:bg-primary/90" onClick={handleSaveUser}>
                  {isEditMode ? "Update User" : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Update User Status</DialogTitle>
                <DialogDescription>
                  Change the account status for {userToUpdateStatus?.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Account Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus}>
                  Update Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <FormDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            title={editingRoleId ? "Edit Role" : "Add Role"}
            description={editingRoleId ? "Update role details and permissions" : "Create a new user role and configure its permissions"}
          >
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Role Name</label>
                  <input
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Enter role name"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <textarea
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
                    placeholder="Describe this role"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Role Permissions</h3>
                </div>

                <div className="rounded-xl border border-border bg-secondary/10 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-secondary/40 border-b border-border">
                          <th className="px-4 py-3 text-left">
                            <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-widest">MODULE'S</span>
                          </th>
                          {actions.map(action => (
                            <th key={action} className="px-2 py-3 text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                <span className="text-[9px] font-bold text-foreground/70 uppercase tracking-tight">{action}</span>
                                <Checkbox
                                  checked={permissionModules.every(mod => permissions[mod][action])}
                                  onCheckedChange={() => handleToggleColumn(action)}
                                  className="w-3.5 h-3.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {permissionModules.map((mod) => (
                          <tr key={mod} className="hover:bg-secondary/20 transition-colors group">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {formatModuleName(mod)}
                                </span>
                              </div>
                            </td>
                            {actions.map(action => (
                              <td key={action} className="px-2 py-3 text-center">
                                <Checkbox
                                  checked={permissions[mod][action]}
                                  onCheckedChange={() => handleTogglePermission(mod, action)}
                                  className="w-4 h-4 rounded border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <Button
                className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                onClick={handleSaveRole}
              >
                <CheckCircle2 size={18} />
                {editingRoleId ? "Update Role" : "Save Role"}
              </Button>
            </div>
          </FormDrawer>
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent className="rounded-2xl border-border shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <X className="text-destructive w-4 h-4" />
                  </div>
                  Confirm Deletion
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground pt-2">
                  Are you sure you want to delete this user? This action will mark the user as inactive and they will no longer have access to the portal.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                >
                  Delete User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deleteRoleConfirmOpen} onOpenChange={setDeleteRoleConfirmOpen}>
            <AlertDialogContent className="rounded-2xl border-border shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <X className="text-destructive w-4 h-4" />
                  </div>
                  Confirm Role Deletion
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground pt-2">
                  Are you sure you want to delete this role? This action cannot be undone. You can only delete roles that have no users assigned.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-xl border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDeleteRole}
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                >
                  Delete Role
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default RolesPage;

