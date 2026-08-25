import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, Filter, Shield, Calendar, Users, X, CheckCircle2 } from "lucide-react";
import StatusBadge from "@/components/common/StatusBadge";
import ActionMenu from "@/components/common/ActionMenu";
import PaginationBar from "@/components/common/PaginationBar";
import FormDrawer from "@/components/common/FormDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import PremiumLoader from "@/components/common/PremiumLoader";

interface Role {
  _id: string;
  name: string;
  code: string;
}

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  userId: string;
  roleId: string;
  isActive: boolean;
  role?: Role | null;
  resolvedRole?: string;
}

const UsersPage = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Drawer / Form states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
    pin: "",
    roleId: ""
  });

  // Delete dialog states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Roles
  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      const response = await api.get("/roles?limit=100");
      if (response.data && response.data.data) {
        setRoles(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async (
    currentPage: number = page,
    search: string = searchTerm,
    role: string = roleFilter,
    status: string = statusFilter
  ) => {
    try {
      setLoading(true);
      let url = `/admin-users?page=${currentPage - 1}&limit=${pageSize}`;
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
        setUsers(response.data.data);
        setTotalCount(response.data.total ?? 0);
        setTotalPages(response.data.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Error fetching users list:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [page, searchTerm, roleFilter, statusFilter, toast]);

  // Load initial data
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Debounced search / filter trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1, searchTerm, roleFilter, statusFilter);
      setPage(1);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter, statusFilter]);

  // Map users with role name
  const memoizedUsers = useMemo(() => {
    return users.map((user: any) => {
      if (user.roleName && user.roleName !== "N/A") {
        return { ...user, resolvedRole: user.roleName };
      }
      const uRoleId = user.roleId || user.role?._id || user.role?.id || (typeof user.role === "string" ? user.role : null);
      const matchedRole = roles.find((r: any) => (r._id && uRoleId && r._id.toString() === uRoleId.toString()) || r._id === uRoleId);
      return {
        ...user,
        resolvedRole: matchedRole ? matchedRole.name : (typeof user.role === "string" ? user.role : user.role?.name || user.roleName || "N/A")
      };
    });
  }, [users, roles]);

  const handleOpenAddUser = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setFormErrors({});
    setFormValues({
      name: "",
      email: "",
      phone: "",
      pin: "",
      roleId: roles.length > 0 ? roles[0]._id : ""
    });
    setDrawerOpen(true);
  };

  const handleEditUser = (user: User) => {
    setIsEditMode(true);
    setEditingUserId(user._id || user.id || null);
    setFormErrors({});
    setFormValues({
      name: user.name,
      email: user.email,
      phone: user.phoneNumber,
      pin: "", // PIN is kept hidden for security
      roleId: user.roleId
    });
    setDrawerOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formValues.name.trim()) errors.name = "Full name is required";
    if (!formValues.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formValues.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formValues.phone.replace(/[^0-9]/g, ""))) {
      errors.phone = "Phone number must be a valid 10-digit number";
    }
    if (!isEditMode && !formValues.pin.trim()) {
      errors.pin = "Password is required for new users";
    } else if (formValues.pin.trim() && !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\;/]).{8,}$/.test(formValues.pin)) {
      errors.pin = "Password must be at least 8 characters long and include an uppercase letter, a number, and a special character";
    }
    if (!formValues.roleId) errors.roleId = "Role assignment is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async () => {
    if (!validateForm()) return;

    try {
      setFormLoading(true);
      const payload: any = {
        name: formValues.name,
        email: formValues.email,
        phoneNumber: formValues.phone.replace(/[^0-9]/g, ""),
        roleId: formValues.roleId,
        companyName: "CTN Global",
        isActive: true
      };

      if (formValues.pin) {
        payload.pin = formValues.pin;
      }

      if (isEditMode && editingUserId) {
        const response = await api.patch(`/admin-users/${editingUserId}`, payload);
        toast({
          title: "Success",
          description: response.data?.message || "User updated successfully",
          variant: "success"
        });
      } else {
        const response = await api.post("/admin-users", payload);
        toast({
          title: "Success",
          description: response.data?.message || "User created successfully",
          variant: "success"
        });
      }

      setDrawerOpen(false);
      fetchUsers(page, searchTerm, roleFilter, statusFilter);
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
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setDeleteOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeleteLoading(true);
      const response = await api.delete(`/admin-users/${userToDelete}`);
      toast({
        title: "Success",
        description: response.data?.message || "User deleted successfully",
        variant: "success"
      });
      setDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers(page, searchTerm, roleFilter, statusFilter);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusToggle = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      const response = await api.patch(`/admin-users/${user._id || user.id}`, {
        isActive: newStatus
      });
      toast({
        title: "Success",
        description: response.data?.message || `User status updated to ${newStatus ? "Active" : "Inactive"}`,
        variant: "success"
      });
      fetchUsers(page, searchTerm, roleFilter, statusFilter);
    } catch (error: any) {
      console.error("Error toggling user status:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Users</h1>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3 ml-auto w-full sm:w-auto mt-3 sm:mt-0">
          {/* Search bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pl-8 pr-3 w-full sm:w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-32 rounded-lg text-xs bg-secondary/30 border-border">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r._id} value={r._id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-28 rounded-lg text-xs bg-secondary/30 border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            className="h-9 rounded-lg bg-primary hover:bg-primary/90 text-xs flex items-center gap-1.5"
            onClick={handleOpenAddUser}
          >
            <UserPlus size={14} />
            Add User
          </Button>
        </div>
      </div>

      {/* Users table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] md:min-w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Phone</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && isInitialLoad ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <PremiumLoader variant="centered" style="tech-circle" text="Loading admin users..." />
                  </td>
                </tr>
              ) : memoizedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No users found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                memoizedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">{user.name.charAt(0)}</span>
                        </div>
                        <span className="font-semibold text-sm text-foreground">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold hidden md:table-cell">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold hidden sm:table-cell">{user.phoneNumber}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{user.resolvedRole}</td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={user.isActive ? "Active" : "Inactive"}
                        onClick={() => handleStatusToggle(user)}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onEdit={() => handleEditUser(user)}
                        onDelete={() => handleDeleteClick(user._id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {!loading && memoizedUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-border bg-secondary/10">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>

      {/* User Form Drawer */}
      <FormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={isEditMode ? "Edit User" : "Add User"}
        description={isEditMode ? "Update user account details" : "Create a new system user"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter full name"
            />
            {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={formValues.email}
              onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter email"
            />
            {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Phone</label>
            <input
              type="text"
              value={formValues.phone}
              onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="+91 98765 43210"
            />
            {formErrors.phone && <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              value={formValues.pin}
              onChange={(e) => setFormValues({ ...formValues, pin: e.target.value })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={isEditMode ? "Enter new password (optional)" : "Enter password (min. 8 characters)"}
            />
            {formErrors.pin && <p className="text-xs text-destructive mt-1">{formErrors.pin}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={formValues.roleId}
              onChange={(e) => setFormValues({ ...formValues, roleId: e.target.value })}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="" disabled>Select a role</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
            {formErrors.roleId && <p className="text-xs text-destructive mt-1">{formErrors.roleId}</p>}
          </div>

          <Button
            className="w-full rounded-xl bg-primary hover:bg-primary/90 mt-4 flex items-center justify-center gap-2 h-12 font-bold text-sm tracking-wide"
            onClick={handleSaveUser}
            disabled={formLoading}
          >
            {formLoading ? "Saving..." : <><CheckCircle2 size={18} /> {isEditMode ? "Update User" : "Save User"}</>}
          </Button>
        </div>
      </FormDrawer>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete User?"
        description="This will permanently delete this user. This action cannot be undone."
        onConfirm={confirmDeleteUser}
        confirmLabel="Delete User"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default UsersPage;
