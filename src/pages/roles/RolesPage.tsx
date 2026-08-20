import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Shield, Users, Filter, X, Lock, CheckCircle2, ChevronRight, ChevronLeft, Network, User } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import ActionMenu from "@/components/common/ActionMenu";
import FormDrawer from "@/components/common/FormDrawer";
import PaginationBar from "@/components/common/PaginationBar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { getMembers } from "@/api/MembersApi";
import { mockMembers } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

const getIdString = (id: any): string => {
  if (!id) return "";
  if (typeof id === "string") return id;
  if (typeof id === "object") {
    if (id.$oid) return id.$oid;
    if (id._id) return getIdString(id._id);
    if (id.id) return getIdString(id.id);
    if (typeof id.toString === "function") {
      const str = id.toString();
      if (str !== "[object Object]") return str;
    }
  }
  return String(id);
};
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
  const isInitialModalLoad = useRef(true);
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
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersListLoading, setUsersListLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper to resolve role name consistently
  const resolveRoleName = (u: any) => {
    if (!u) return "—";
    if (u.roleName && u.roleName !== "N/A") return u.roleName;
    const uRoleId = getIdString(u.roleId || u.role?._id || u.role?.id || (typeof u.role === "string" ? u.role : null));
    if (uRoleId) {
      const matchedRole = roles.find((r: any) => getIdString(r._id || r.id) === uRoleId);
      if (matchedRole?.name) return matchedRole.name;
    }
    if (typeof u.role === "string" && u.role) return u.role;
    if (u.role?.name) return u.role.name;
    if (u.roleName) return u.roleName;
    return "—";
  };

  // Memoized user lists with resolved role names
  const memoizedUsersList = useMemo(() => {
    return usersList.map((u: any) => ({
      ...u,
      resolvedRole: resolveRoleName(u)
    }));
  }, [usersList, roles]);

  const memoizedRoleUsers = useMemo(() => {
    return roleUsers.map((u: any) => ({
      ...u,
      resolvedRole: resolveRoleName(u)
    }));
  }, [roleUsers, roles]);

  // Pagination state for modal
  const [usersPage, setUsersPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Modal search and filter states
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [modalRoleFilter, setModalRoleFilter] = useState<string>("all");
  const [modalStatusFilter, setModalStatusFilter] = useState<string>("all");
  const [modalTotalCount, setModalTotalCount] = useState(0);

  // Pagination and filter states for the bottom Users List card
  const [usersListPage, setUsersListPage] = useState(1);
  const [usersListTotalPages, setUsersListTotalPages] = useState(1);
  const [usersListTotalCount, setUsersListTotalCount] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [deleteRoleConfirmOpen, setDeleteRoleConfirmOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // New user form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    pin: "",
    memberId: "",
  });

  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
  });

  // Permission state and actions
  const actions = ["VIEW", "ADD", "EDIT", "DELETE"];
  const [permissionModules, setPermissionModules] = useState<string[]>([]);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});

  const formatModuleName = (mod: string) => {
    if (!mod) return "";
    return mod
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const fetchPaginatedUsers = async (
    page: number = 1,
    search: string = modalSearchTerm,
    role: string = modalRoleFilter,
    status: string = modalStatusFilter
  ) => {
    try {
      setUsersLoading(true);
      setUsersPage(page);

      let url = `/admin-users?page=${page - 1}&limit=${pageSize}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (role !== "all") {
        url += `&roleId=${role}`;
      }
      if (status !== "all") {
        url += `&status=${status}`;
      }

      const response = await api.get(url);
      if (response.data && response.data.data) {
        setRoleUsers(response.data.data);
        const total = response.data.total ?? 0;
        const totalPagesVal = response.data.totalPages ?? 1;
        setModalTotalCount(total);
        setTotalPages(totalPagesVal);
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
      setIsInitialLoad(false);
    }
  };

  const fetchUsersList = async (
    page: number = 1,
    search: string = searchTerm,
    role: string = roleFilter,
    status: string = statusFilter
  ) => {
    try {
      setUsersListLoading(true);
      setUsersListPage(page);

      let url = `/admin-users?page=${page - 1}&limit=${pageSize}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (role !== "all") {
        url += `&roleId=${role}`;
      }
      if (status !== "all") {
        url += `&status=${status}`;
      }

      const response = await api.get(url);
      if (response.data && response.data.data) {
        setUsersList(response.data.data);
        const totalPagesVal = response.data.totalPages ?? 1;
        setUsersListTotalPages(totalPagesVal);
        setUsersListTotalCount(response.data.total ?? 0);
      }
    } catch (error) {
      console.error("Error fetching users list:", error);
    } finally {
      setUsersListLoading(false);
    }
  };

  const [moduleNames, setModuleNames] = useState<Record<string, string>>({});

  const fetchPermissionModules = async () => {
    try {
      const response = await api.get('/roles/modules');
      if (response.data && response.data.data) {
        const list = response.data.data;
        setModulesList(list);
        const ids = list.map((m: any) => m._id);
        const namesMap = list.reduce((acc: any, m: any) => {
          acc[m._id] = m.name;
          return acc;
        }, {});
        setPermissionModules(ids);
        setModuleNames(namesMap);
        setPermissions((prev) => {
          const initial: Record<string, Record<string, boolean>> = { ...prev };
          ids.forEach((id: string) => {
            if (!initial[id]) {
              initial[id] = { VIEW: false, ADD: false, EDIT: false, DELETE: false };
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
    fetchPermissionModules();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoles();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsersList(1, searchTerm, roleFilter, statusFilter);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    if (usersDialogOpen) {
      if (isInitialModalLoad.current) {
        isInitialModalLoad.current = false;
        return;
      }
      const delayDebounceFn = setTimeout(() => {
        fetchPaginatedUsers(1, modalSearchTerm, modalRoleFilter, modalStatusFilter);
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [modalSearchTerm, modalRoleFilter, modalStatusFilter, usersDialogOpen]);

  useEffect(() => {
    if (addUserDialogOpen && selectedRole === "Franchise Owner") {
      const fetchActiveMembers = async () => {
        try {
          const response = await getMembers({ status: "active", limit: 1000 });
          if (response && response.data) {
            setActiveMembers(response.data);
          } else {
            setActiveMembers(mockMembers);
          }
        } catch (error) {
          console.error("Failed to fetch active members", error);
          setActiveMembers(mockMembers);
        }
      };
      fetchActiveMembers();
    }
  }, [addUserDialogOpen, selectedRole]);

  const getLinkedMemberName = (memberId?: string) => {
    if (!memberId) return "None";
    const member = activeMembers.find(m => (m._id === memberId || m.id === memberId)) ||
      mockMembers.find((m: any) => (m._id === memberId || m.id === memberId));
    return member ? (member.fullName || member.name) : `Linked Member (ID: ${memberId})`;
  };

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


  const handleRoleCountClick = (roleName: string, roleId?: any) => {
    setSelectedRole(roleName);
    const stringRoleId = roleId ? getIdString(roleId) : null;
    setSelectedRoleId(stringRoleId);
    setModalSearchTerm("");
    setModalRoleFilter(stringRoleId || "all");
    setModalStatusFilter("all");
    setUsersPage(1);
    setRoleUsers([]); // Clear previous users to prevent layout jerking
    setUsersDialogOpen(true);
    fetchPaginatedUsers(1, "", stringRoleId || "all", "all"); // Fetch immediately on click
  };


  const handleEditRole = (role: Role) => {
    console.log(role);
    // Map existing permissions to the state
    const nextPerms: Record<string, Record<string, boolean>> = {};
    permissionModules.forEach(modId => {
      const targetModule = modulesList.find(m => m._id === modId);
      const roleMod = role.permissions.find(p => {
        if (p.moduleId === modId) return true;
        if (targetModule) {
          return p.moduleId === targetModule.slugName ||
            p.moduleId === targetModule.slugName.replace(/_/g, " ") ||
            String(p.moduleId).toLowerCase() === targetModule.slugName.toLowerCase() ||
            String(p.moduleId).toLowerCase() === targetModule.slugName.replace(/_/g, " ").toLowerCase();
        }
        return false;
      });
      nextPerms[modId] = {
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
    permissionModules.forEach(modId => {
      const targetModule = modulesList.find(m => m._id === modId);
      const roleMod = role.permissions.find(p => {
        if (p.moduleId === modId) return true;
        if (targetModule) {
          return p.moduleId === targetModule.slugName ||
            p.moduleId === targetModule.slugName.replace(/_/g, " ") ||
            String(p.moduleId).toLowerCase() === targetModule.slugName.toLowerCase() ||
            String(p.moduleId).toLowerCase() === targetModule.slugName.replace(/_/g, " ").toLowerCase();
        }
        return false;
      });
      nextPerms[modId] = {
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
    const user =
      roleUsers.find(u => u._id === userId || u.id === userId) ||
      usersList.find(u => u._id === userId || u.id === userId);
    if (!user) return;

    // Set form fields
    setNewUser({
      name: user.name || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
      pin: "",
      memberId: user.memberId || "",
    });

    // Set selected role details so update preserves them
    const stringRoleId = user.roleId ? getIdString(user.roleId) : null;
    setSelectedRoleId(stringRoleId);
    setSelectedRole(roles.find(r => getIdString(r._id) === stringRoleId)?.name || null);

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
      if (usersDialogOpen) {
        fetchPaginatedUsers(usersPage, modalSearchTerm, modalRoleFilter, modalStatusFilter);
      }
      fetchRoles();
      fetchUsersList(usersListPage, searchTerm, roleFilter, statusFilter);
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
      if (usersDialogOpen) {
        fetchPaginatedUsers(usersPage, modalSearchTerm, modalRoleFilter, modalStatusFilter);
      }
      fetchRoles();
      fetchUsersList(usersListPage, searchTerm, roleFilter, statusFilter);

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
            moduleId: mod,
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
            moduleId: mod,
            actions: selectedActions
          };
        })
        .filter(p => p !== null);

      if (rolePermissions.length === 0) {
        toast({
          title: "Error",
          description: "At Least One Permission Selection is Required.",
          variant: "destructive"
        });
        return;
      }

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
      let errorMsg = "Failed to save role";
      if (error.response?.data) {
        const data = error.response.data;
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          errorMsg = data.errors
            .map((e: any) => {
              if (e.message) return e.message;
              if (e.constraints) return Object.values(e.constraints).join(", ");
              return "Validation error";
            })
            .join(", ");
        } else {
          errorMsg = data.message || "Failed to save role";
        }
      }
      toast({ title: "Error", description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg, variant: "destructive" });
    }
  };


  const handleAddUserAction = (roleName: string, roleId: string) => {
    setSelectedRole(roleName);
    setSelectedRoleId(roleId ? getIdString(roleId) : null);
    setNewUser({ name: "", email: "", phone: "", pin: "", memberId: "" });
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
      if (!newUser.name.trim()) {
        errors.name = "Full name is required";
      } else if (!/^[A-Za-z\s]+$/.test(newUser.name)) {
        errors.name = "Full name should accept only alphabets";
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!newUser.email) errors.email = "Email is required";
      else if (!emailRegex.test(newUser.email)) errors.email = "Invalid email format";

      if (!newUser.phone) errors.phone = "Phone number is required";
      else if (newUser.phone.replace(/\D/g, "").length !== 10) errors.phone = "Phone must be exactly 10 digits";

      if (!isEditMode || newUser.pin) {
        if (!newUser.pin) errors.pin = "PIN is required";
        else if (newUser.pin.length !== 4 || !/^\d{4}$/.test(newUser.pin)) errors.pin = "PIN must be exactly 4 digits";
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        toast({ title: "Error", description: "Please fix the errors in the form", variant: "destructive" });
        return;
      }

      setFormErrors({});


      const payload: any = {
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phone,
        roleId: selectedRoleId,
        companyName: "CTN Global",
        isActive: true,
        memberId: newUser.memberId || null,
      };

      if (newUser.pin) {
        payload.pin = newUser.pin;
      }

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
      if (usersDialogOpen) {
        fetchPaginatedUsers(isEditMode ? usersPage : 1, modalSearchTerm, modalRoleFilter, modalStatusFilter);
      }
      fetchRoles();
      fetchUsersList(usersListPage, searchTerm, roleFilter, statusFilter);
    } catch (error: any) {
      console.error("Error saving user:", error);
      let errorMsg = "Failed to save user";
      if (error.response?.data) {
        const data = error.response.data;
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          errorMsg = data.errors
            .map((e: any) => {
              if (e.message) return e.message;
              if (e.constraints) return Object.values(e.constraints).join(", ");
              return "Validation error";
            })
            .join(", ");
        } else {
          errorMsg = data.message || "Failed to save user";
        }
      }
      toast({ title: "Error", description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg, variant: "destructive" });
    }
  };





  // Reset role filter when closing users dialog
  const handleUsersDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedRole(null);
      setSelectedRoleId(null);
      isInitialModalLoad.current = true;
      setRoleUsers([]); // Clean user records when modal closes
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
      <style dangerouslySetInnerHTML={{
        __html: `
        body {
          padding-right: 0px !important;
        }
      `}} />

      {isInitialLoad && loading && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="CTN Admin Network Data..."
          subtitle="Establishing secure connection to global nodes"
        />
      )}

      {roles.length === 0 && isInitialLoad && loading ? (
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
                  placeholder="Search roles or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-8 pr-3 w-full md:w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                />
              </div>

              {/* View All Users */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg text-xs flex-1 md:flex-initial"
                onClick={() => {
                  setSelectedRole(null);
                  setSelectedRoleId(null);
                  setModalSearchTerm("");
                  setModalRoleFilter("all");
                  setModalStatusFilter("all");
                  setUsersPage(1);
                  setRoleUsers([]); // Clear previous records
                  setUsersDialogOpen(true);
                  fetchPaginatedUsers(1, "", "all", "all"); // Fetch all users instantly
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
              {roles.length === 0 && loading ? (
                Array(4).fill(0).map((_, i) => <RoleSkeleton key={i} />)
              ) : roles.length === 0 ? (
                <div className="col-span-full py-12 text-center text-muted-foreground w-full">
                  No roles found.
                </div>
              ) : (
                roles.map((role, i) => (
                  <motion.div
                    key={role._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className={cn(
                      "glass-card p-5 transition-all",
                      roles.length > 4 ? "min-w-[calc(25%-12px)] shrink-0 grow-0 snap-start" : "w-full",
                      loading && "opacity-50 pointer-events-none"
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
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs px-2"
                        onClick={() => handleRoleCountClick(role.name, role._id)}
                      >
                        <span className="font-semibold">{role.userCount || 0}</span>&nbsp;{role.userCount === 1 ? "User" : "Users"}
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


          {/* Admin Users Table Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6"
          >
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">Users List</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manage and view all system admin users, their roles, and status
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Role Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Role:</span>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="h-9 w-36 rounded-lg text-xs bg-secondary/30 border-border focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Status:</span>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-secondary/30 border-border focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="w-full min-w-[800px] md:min-w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14">S.No</th>
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
                    {usersListLoading && memoizedUsersList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-20">
                          <PremiumLoader style="pulse" variant="centered" text="Loading admin users..." />
                        </td>
                      </tr>
                    ) : memoizedUsersList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                          No users found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      memoizedUsersList.map((user, index) => (
                        <tr key={user._id || user.id || index} className={cn("hover:bg-secondary/30 transition-colors", usersListLoading && "opacity-50 pointer-events-none")}>
                          <td className="px-4 py-4 text-sm font-semibold text-foreground text-center">
                            {(usersListPage - 1) * pageSize + index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">
                            {user.userId || "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-semibold text-primary">{user.name?.charAt(0)}</span>
                              </div>
                              <span className="font-semibold text-sm text-foreground">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-foreground font-semibold hidden md:table-cell">{user.email || "N/A"}</td>
                          <td className="px-6 py-4 text-sm text-foreground font-semibold hidden sm:table-cell">{user.phoneNumber || "N/A"}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-foreground">{user.resolvedRole}</td>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination for bottom Users List card */}
              {usersListTotalPages >= 1 && memoizedUsersList.length > 0 && (
                <div className="px-6 py-4 border-t border-border bg-secondary/10">
                  <PaginationBar
                    currentPage={usersListPage}
                    totalPages={usersListTotalPages}
                    totalItems={usersListTotalCount}
                    onPageChange={(page) => fetchUsersList(page, searchTerm, roleFilter, statusFilter)}
                  />
                </div>
              )}
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
                              <div
                                className={cn("flex flex-col items-center gap-2 group", canEdit ? "cursor-pointer" : "cursor-not-allowed opacity-60")}
                                onClick={() => canEdit && handleToggleColumn(action)}
                              >
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                                  {action}
                                </span>
                                <div className={cn(
                                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                  permissionModules.every(mod => permissions[mod][action])
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/50 bg-card hover:border-primary/50"
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
                                  <span className="text-sm font-semibold text-foreground">{formatModuleName(moduleNames[mod] || mod)}</span>
                                </div>
                              </div>
                            </td>
                            {actions.map(action => (
                              <td key={action} className={cn(
                                "py-3 px-2 text-center bg-card border-y border-border group-hover:border-primary/20",
                                action === "DELETE" ? "rounded-r-xl border-r" : ""
                              )}>
                                <div
                                  className={cn("flex justify-center", canEdit ? "cursor-pointer" : "cursor-not-allowed")}
                                  onClick={() => canEdit && handleTogglePermission(mod, action)}
                                >
                                  <div className={cn(
                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                                    permissions[mod][action]
                                      ? "bg-primary/10 border-primary/40 text-primary scale-110 shadow-sm"
                                      : "border-muted-foreground/40 bg-transparent opacity-60 hover:opacity-100 hover:border-primary/40"
                                  )}>
                                    {permissions[mod][action] ? (
                                      <CheckCircle2 size={14} className="fill-primary text-white" />
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
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
                    {canEdit ? "Discard Changes" : "Close"}
                  </Button>
                  {canEdit && (
                    <Button
                      className="rounded-xl bg-primary hover:bg-primary/90 px-6 shadow-lg shadow-primary/20 flex items-center gap-2"
                      onClick={handleUpdatePermissions}
                    >
                      <CheckCircle2 size={16} />
                      Save Permissions
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>

          </Dialog>

          {/* Users Dialog */}
          <Dialog open={usersDialogOpen} onOpenChange={handleUsersDialogClose}>
            <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] flex flex-col p-6 overflow-hidden">
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="text-primary w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">
                      {modalRoleFilter !== "all"
                        ? `Users with "${roles.find(r => r._id === modalRoleFilter)?.name || "Selected"}" role`
                        : "All Admin Users"}
                    </DialogTitle>
                    <DialogDescription>
                      {usersLoading
                        ? "Fetching users..."
                        : `Showing ${modalTotalCount} users assigned`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Modal Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 p-4 rounded-xl bg-secondary/20 border border-border flex-shrink-0">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, phone or ID..."
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    className="h-9 pl-9 pr-3 w-full rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Role Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Role:</span>
                    <Select value={modalRoleFilter} onValueChange={setModalRoleFilter}>
                      <SelectTrigger className="h-9 w-36 rounded-lg text-xs bg-background border-border focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        {roles.map((role) => (
                          <SelectItem key={role._id} value={role._id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Status:</span>
                    <Select value={modalStatusFilter} onValueChange={setModalStatusFilter}>
                      <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-background border-border focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="table-responsive mt-4 flex-1 overflow-y-auto border border-border rounded-xl min-h-[300px]">
                {usersLoading && memoizedRoleUsers.length === 0 ? (
                  <div className="py-24">
                    <PremiumLoader variant="centered" style="tech-circle" text="Establishing member connection..." />
                  </div>
                ) : (
                  <table className="w-full min-w-[700px] md:min-w-full">
                    <thead className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-md border-b border-border shadow-xs rounded-t-xl">
                      <tr className="border-b border-border">
                        <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-14 rounded-tl-xl">S.No</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Phone</th>
                        {modalRoleFilter === "all" && <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>}
                        <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider rounded-tr-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {memoizedRoleUsers.length === 0 ? (
                        <tr>
                          <td colSpan={modalRoleFilter === "all" ? 8 : 7} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Users size={32} className="text-muted-foreground/30" />
                              <p className="text-muted-foreground font-medium">No users found.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        memoizedRoleUsers.map((user, idx) => (
                          <tr key={user._id || user.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-4 text-xs font-semibold text-muted-foreground text-center">{(usersPage - 1) * pageSize + idx + 1}</td>
                            <td className="px-6 py-4 text-xs font-bold text-foreground">{user.userId || "—"}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-primary">{(user.name || "U").charAt(0)}</span>
                                </div>
                                <span className="font-semibold text-sm text-foreground">{user.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-foreground font-semibold hidden md:table-cell">{user.email || "N/A"}</td>
                            <td className="px-6 py-4 text-sm text-foreground font-semibold hidden sm:table-cell">{user.phoneNumber || "N/A"}</td>
                            {modalRoleFilter === "all" && <td className="px-6 py-4 text-sm font-semibold text-foreground">{user.resolvedRole}</td>}
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
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination and Count */}
              {totalPages >= 1 && memoizedRoleUsers.length > 0 && (
                <div className="mt-4 px-2 border-t border-border pt-4 flex-shrink-0">
                  <PaginationBar
                    currentPage={usersPage}
                    totalPages={totalPages}
                    totalItems={modalTotalCount}
                    onPageChange={(page) => fetchPaginatedUsers(page, modalSearchTerm, modalRoleFilter, modalStatusFilter)}
                  />
                </div>
              )}

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
                {!isEditMode && selectedRole === "Franchise Owner" && (
                  <div className="grid gap-2">
                    <Label htmlFor="memberId">Link Active Member</Label>
                    <Popover open={memberDropdownOpen} onOpenChange={setMemberDropdownOpen} modal={true}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full h-10 flex items-center gap-2 px-3 rounded-lg border border-input bg-background text-sm text-left hover:bg-accent transition-colors"
                        >
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className={cn("flex-1 truncate", !newUser.memberId && "text-muted-foreground")}>
                            {newUser.memberId
                              ? (() => {
                                  const m = (activeMembers.length > 0 ? activeMembers : mockMembers).find(m => (m._id === newUser.memberId || m.id === newUser.memberId));
                                  return m ? (m.fullName || m.name) : "Select an active member";
                                })()
                              : "Select an active member"}
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[360px] p-0 shadow-xl rounded-2xl border border-slate-200 overflow-hidden" align="start" style={{ pointerEvents: "auto" }}>
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
                        <div className="max-h-[280px] overflow-y-auto px-2 pb-2">
                          {(activeMembers.length > 0 ? activeMembers : mockMembers)
                            .filter(m => {
                              const q = memberSearchQuery.toLowerCase();
                              return (
                                (m.fullName || m.name || "").toLowerCase().includes(q) ||
                                (m.businessName || "").toLowerCase().includes(q) ||
                                (m.mobileNumber || "").toLowerCase().includes(q)
                              );
                            })
                            .map((member) => {
                              const memberId = member._id || member.id;
                              const isSelected = newUser.memberId === memberId;
                              return (
                                <div
                                  key={memberId}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                                    isSelected ? "bg-primary/8" : "hover:bg-slate-50"
                                  )}
                                  onClick={() => {
                                    const membersToDisplay = activeMembers.length > 0 ? activeMembers : mockMembers;
                                    const selectedMember = membersToDisplay.find(m => (m._id === memberId || m.id === memberId));
                                    if (selectedMember) {
                                      setNewUser({
                                        ...newUser,
                                        memberId,
                                        name: (selectedMember.fullName || selectedMember.name || "").replace(/[^A-Za-z\s]/g, ""),
                                        email: selectedMember.email || "",
                                        phone: (selectedMember.mobileNumber || selectedMember.phone || "").replace(/\D/g, "").slice(0, 10),
                                      });
                                      setFormErrors(prev => ({ ...prev, name: "", email: "", phone: "" }));
                                    } else {
                                      setNewUser({ ...newUser, memberId });
                                    }
                                    setMemberDropdownOpen(false);
                                    setMemberSearchQuery("");
                                  }}
                                >
                                  {/* Avatar circle */}
                                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-slate-500" />
                                  </div>
                                  {/* Name & business */}
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-xs font-semibold text-slate-800 truncate">{member.fullName || member.name}</span>
                                    <span className="text-[10px] text-slate-400 truncate">
                                      {member.businessName || "—"}
                                    </span>
                                  </div>
                                  {/* Selection indicator */}
                                  <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                    isSelected
                                      ? "bg-primary border-primary"
                                      : "border-slate-300 bg-white"
                                  )}>
                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                  </div>
                                </div>
                              );
                            })}
                          {(activeMembers.length > 0 ? activeMembers : mockMembers).filter(m => {
                            const q = memberSearchQuery.toLowerCase();
                            return (
                              (m.fullName || m.name || "").toLowerCase().includes(q) ||
                              (m.businessName || "").toLowerCase().includes(q) ||
                              (m.mobileNumber || "").toLowerCase().includes(q)
                            );
                          }).length === 0 && (
                            <p className="text-center py-6 text-xs text-slate-400">No members found</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                {isEditMode && selectedRole === "Franchise Owner" && newUser.memberId && (
                  <div className="grid gap-2">
                    <Label htmlFor="linkedMember">Linked Member</Label>
                    <Input
                      id="linkedMember"
                      value={getLinkedMemberName(newUser.memberId)}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="name" className={cn(formErrors.name && "text-destructive")}>Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^A-Za-z\s]/g, "");
                      setNewUser({ ...newUser, name: val });
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
                <div className="grid gap-2">
                  <Label htmlFor="pin" className={cn(formErrors.pin && "text-destructive")}>PIN (4 Digits) {isEditMode && <span className="text-muted-foreground font-normal text-[10px] ml-1">(Leave blank to keep unchanged)</span>}</Label>
                  <Input
                    id="pin"
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={newUser.pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setNewUser({ ...newUser, pin: val });
                      if (formErrors.pin) setFormErrors({ ...formErrors, pin: "" });
                    }}
                    className={cn(formErrors.pin && "border-destructive focus-visible:ring-destructive")}
                  />
                  {formErrors.pin && <span className="text-[10px] text-destructive font-medium">{formErrors.pin}</span>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  {!isEditMode ? (
                    <Input
                      id="role"
                      value={selectedRole || ""}
                      disabled
                      className="bg-muted text-muted-foreground rounded-xl"
                    />
                  ) : (
                    <Select
                      value={selectedRoleId ? getIdString(selectedRoleId) : ""}
                      onValueChange={(val) => {
                        setSelectedRoleId(val);
                        setSelectedRole(roles.find(r => getIdString(r._id) === val)?.name || null);
                      }}
                    >
                      <SelectTrigger id="role" className="rounded-xl">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent style={{ pointerEvents: "auto" }}>
                        {roles.map((r) => (
                          <SelectItem key={getIdString(r._id)} value={getIdString(r._id)}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
            <div className="space-y-6 pb-6">

              {/* ── Role Name ── */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Role Name
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all duration-200"
                  placeholder="Enter role name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                />
              </div>

              {/* ── Description ── */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Description
                </label>
                <textarea
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 transition-all duration-200 min-h-[90px] resize-none"
                  placeholder="Describe this role"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                />
              </div>

              {/* ── Role Permissions ── */}
              <div className="pt-1">
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Lock size={14} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                    Role Permissions
                  </h3>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-5 py-3 text-left w-[44%]">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                              MODULE'S
                            </span>
                          </th>
                          {actions.map(action => (
                            <th key={action} className="py-3 text-center w-20">
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                  {action}
                                </span>
                                <Checkbox
                                  checked={permissionModules.every(mod => permissions[mod][action])}
                                  onCheckedChange={() => handleToggleColumn(action)}
                                  className="w-5 h-5 rounded-md border-2 border-slate-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm cursor-pointer"
                                />
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {permissionModules.map((mod, idx) => (
                          <tr
                            key={mod}
                            className={cn(
                              "group transition-colors border-b border-slate-100 last:border-0",
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/60",
                              "hover:bg-primary/5 hover:border-primary/10"
                            )}
                          >
                            <td className="px-5 py-3.5">
                              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                {formatModuleName(moduleNames[mod] || mod)}
                              </span>
                            </td>
                            {actions.map(action => (
                              <td key={action} className="py-3.5 text-center w-20">
                                <div className="flex justify-center">
                                  <Checkbox
                                    checked={permissions[mod][action]}
                                    onCheckedChange={() => handleTogglePermission(mod, action)}
                                    className="w-5 h-5 rounded-md border-2 border-slate-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-sm cursor-pointer transition-all"
                                  />
                                </div>
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
                className="w-full rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 h-12 font-bold text-sm tracking-wide"
                onClick={handleSaveRole}
              >
                <CheckCircle2 size={18} />
                {editingRoleId ? "Update Role" : "Save Role"}
              </Button>
            </div>
          </FormDrawer>

          <ConfirmDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title="Delete User?"
            description="Are you sure you want to delete this user? This action will mark the user as inactive and they will no longer have access to the portal."
            onConfirm={confirmDelete}
            confirmLabel="Delete User"
          />

          <ConfirmDialog
            open={deleteRoleConfirmOpen}
            onOpenChange={setDeleteRoleConfirmOpen}
            title="Delete Role?"
            description="Are you sure you want to delete this role? This action cannot be undone. You can only delete roles that have no users assigned."
            onConfirm={confirmDeleteRole}
            confirmLabel="Delete Role"
          />
        </>
      )}
    </div>
  );
};

export default RolesPage;

