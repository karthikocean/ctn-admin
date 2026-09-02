import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Headset,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  Calendar,
  Pencil,
  FileText,
  Tag,
  RefreshCw,
  User
} from "lucide-react";
import ActionMenu from "@/components/common/ActionMenu";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PaginationBar from "@/components/common/PaginationBar";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  getSupports,
  getSupportStats,
  updateSupportStatus,
  deleteSupport,
  SupportItem,
} from "@/api/SupportApi";

const getAvatarGradient = (name: string = "") => {
  const gradients = [
    "bg-amber-100 text-amber-800 border-amber-200",
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
  ];
  const charCode = name.charCodeAt(0) || 0;
  return gradients[charCode % gradients.length];
};

export const SupportPage: React.FC = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission("support", "edit") || hasPermission("supports", "edit") || true;
  const canDelete = hasPermission("support", "delete") || hasPermission("supports", "delete") || true;

  const [supports, setSupports] = useState<SupportItem[]>([]);
  const [stats, setStats] = useState<{ total: number; pending: number; inProgress: number; resolved: number; closed: number }>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [selectedSupport, setSelectedSupport] = useState<SupportItem | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<string>("PENDING");
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<SupportItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const res = await getSupportStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch {
      // stats optional fallback
    }
  };

  const fetchSupports = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 10,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await getSupports(params);
      const items = response.data || response.items || (Array.isArray(response) ? response : []);
      setSupports(items);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalCount(response.pagination.total || 0);
      } else {
        setTotalPages(response.totalPages || Math.ceil((response.total || items.length) / 10) || 1);
        setTotalCount(response.total !== undefined ? response.total : items.length);
      }
    } catch (error: any) {
      console.error("Error fetching support requests:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load support requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, toast]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSupports();
    }, 400);
    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter, fetchSupports]);

  const handleOpenStatusDialog = (item: SupportItem) => {
    setSelectedSupport(item);
    setTargetStatus(item.status);
    setStatusDialogOpen(true);
  };

  const handleUpdateStatusSubmit = async () => {
    if (!selectedSupport) return;
    setStatusUpdating(true);
    try {
      await updateSupportStatus(selectedSupport._id, {
        status: targetStatus,
      });
      toast({
        title: "Success",
        description: "Support request status updated successfully",
      });
      setStatusDialogOpen(false);
      fetchSupports();
      fetchStats();
    } catch (error: any) {
      console.error("Failed to update status:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await deleteSupport(itemToDelete._id);
      toast({
        title: "Success",
        description: "Support request deleted successfully",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchSupports();
      fetchStats();
    } catch (error: any) {
      console.error("Failed to delete support request:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete support request",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (item: SupportItem) => {
    switch (item.status) {
      case "RESOLVED":
        return (
          <Badge
            className="cursor-pointer font-semibold transition-all active:scale-95 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
            onClick={() => {
              if (canEdit) handleOpenStatusDialog(item);
            }}
          >
            Resolved
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge
            className="cursor-pointer font-semibold transition-all active:scale-95 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
            onClick={() => {
              if (canEdit) handleOpenStatusDialog(item);
            }}
          >
            In Progress
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge
            className="cursor-pointer font-semibold transition-all active:scale-95 bg-muted text-muted-foreground hover:bg-muted/80 border-border"
            onClick={() => {
              if (canEdit) handleOpenStatusDialog(item);
            }}
          >
            Closed
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge
            className="cursor-pointer font-semibold transition-all active:scale-95 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20"
            onClick={() => {
              if (canEdit) handleOpenStatusDialog(item);
            }}
          >
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="page-container relative min-h-[600px] space-y-6">
      {loading && supports.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Support Requests..."
          subtitle="Fetching member support tickets and messages"
        />
      )}

      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Headset size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Support Management</h1>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search by name, phone, company, category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="h-9 pl-8 pr-3 w-52 sm:w-64 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-36 rounded-lg text-xs bg-background border-slate-300 focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary">
              <Filter size={14} className="mr-1.5" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchSupports();
              fetchStats();
            }}
            className="h-9 px-3 rounded-lg border-slate-300 text-xs"
          >
            <RefreshCw size={13} className={cn("mr-1.5", loading && "animate-spin text-primary")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">
                  S.No
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                  Member Name
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">
                  Company Name
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">
                  Contact Details
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
                  Category
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[220px]">
                  Description
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">
                  Status
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px]">
                  Date
                </th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {supports.length === 0 && !loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No support requests found
                  </td>
                </tr>
              ) : (
                supports.map((item, index) => {
                  const sNo = page * 10 + index + 1;
                  const desc = item.description || item.descrip || "—";

                  return (
                    <tr key={item._id} className="hover:bg-secondary/30 transition-colors">
                      {/* S.No */}
                      <td className="px-6 py-4 text-sm text-foreground font-semibold">
                        {sNo}
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0",
                              getAvatarGradient(item.name || "?")
                            )}
                          >
                            {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                          </span>
                          <span className="font-semibold text-sm text-foreground">
                            {item.name || "Unknown"}
                          </span>
                        </div>
                      </td>

                      {/* Company Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-foreground font-medium">
                          <Building2 size={13} className="text-muted-foreground flex-shrink-0" />
                          <span className="truncate max-w-[160px]" title={item.companyName || ""}>
                            {item.companyName || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5 text-xs">
                          {item.phone && (
                            <span className="font-mono text-foreground font-semibold flex items-center gap-1">
                              <Phone size={11} className="text-muted-foreground/70" />
                              {item.phone}
                            </span>
                          )}
                          {item.email && (
                            <span className="text-muted-foreground truncate max-w-[170px] flex items-center gap-1" title={item.email}>
                              <Mail size={11} className="text-muted-foreground/70" />
                              {item.email}
                            </span>
                          )}
                          {!item.phone && !item.email && <span className="text-muted-foreground">—</span>}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <Badge
                          variant="secondary"
                          className="text-xs text-foreground bg-slate-100 dark:bg-slate-800 border-none font-semibold"
                        >
                          {item.category || "General"}
                        </Badge>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4">
                        <p
                          className="text-xs text-muted-foreground max-w-[240px] truncate cursor-pointer hover:text-foreground transition-colors"
                          title={desc}
                          onClick={() => {
                            setSelectedSupport(item);
                            setViewDialogOpen(true);
                          }}
                        >
                          {desc}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(item)}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-muted-foreground/70" />
                          {item.createdAt ? (
                            new Date(item.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <ActionMenu
                          onView={() => {
                            setSelectedSupport(item);
                            setViewDialogOpen(true);
                          }}
                          onEdit={
                            canEdit
                              ? () => handleOpenStatusDialog(item)
                              : undefined
                          }
                          onDelete={
                            canDelete
                              ? () => {
                                  setItemToDelete(item);
                                  setDeleteDialogOpen(true);
                                }
                              : undefined
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {!loading && supports.length > 0 && (
          <div className="px-6 pb-4">
            <PaginationBar
              currentPage={page + 1}
              totalPages={totalPages}
              totalItems={totalCount}
              onPageChange={(p) => setPage(p - 1)}
            />
          </div>
        )}
      </motion.div>

      {/* Details View Dialog Modal */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[560px] border-border rounded-2xl shadow-2xl p-6">
          <DialogHeader className="pb-3 border-b border-border">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Headset className="text-primary w-4 h-4" />
              </div>
              Support Request Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              View and manage member issue and support request details.
            </DialogDescription>
          </DialogHeader>

          {selectedSupport && (
            <div className="space-y-4 py-2">
              {/* Member & Company Card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/40 border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0 shadow-xs",
                      getAvatarGradient(selectedSupport.name || "?")
                    )}
                  >
                    {selectedSupport.name ? selectedSupport.name.charAt(0).toUpperCase() : "?"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{selectedSupport.name}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <Building2 size={12} />
                      {selectedSupport.companyName || "No Company Specified"}
                    </p>
                  </div>
                </div>
                <div>{getStatusBadge(selectedSupport)}</div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Phone Number</span>
                  <p className="text-xs font-mono font-bold text-foreground mt-1 flex items-center gap-1.5">
                    <Phone size={12} className="text-primary" />
                    {selectedSupport.phone || "—"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Email Address</span>
                  <p className="text-xs font-bold text-foreground mt-1 truncate flex items-center gap-1.5" title={selectedSupport.email || ""}>
                    <Mail size={12} className="text-primary" />
                    {selectedSupport.email || "—"}
                  </p>
                </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Category</span>
                  <Badge variant="secondary" className="text-xs text-foreground bg-slate-100 dark:bg-slate-800 border-none font-semibold mt-1">
                    {selectedSupport.category || "General Issue"}
                  </Badge>
                </div>
                <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Submitted At</span>
                  <p className="text-xs text-foreground font-semibold mt-1 flex items-center gap-1.5">
                    <Calendar size={12} className="text-primary" />
                    {selectedSupport.createdAt ? new Date(selectedSupport.createdAt).toLocaleString("en-IN") : "—"}
                  </p>
                </div>
              </div>

              {/* Description Body */}
              <div className="p-4 rounded-xl bg-secondary/20 border border-border space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Problem Description
                </span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedSupport.description || selectedSupport.descrip || "No description provided."}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2 pt-3 border-t border-border flex justify-between gap-2">
            {canEdit && selectedSupport && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-border text-xs"
                onClick={() => {
                  setViewDialogOpen(false);
                  handleOpenStatusDialog(selectedSupport);
                }}
              >
                <Pencil size={13} className="mr-1.5" />
                Change Status
              </Button>
            )}
            <Button
              className="rounded-xl text-xs bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              size="sm"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[420px] border-border rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="text-primary w-4 h-4" />
              </div>
              Update Support Status
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Change status for <span className="font-bold text-foreground">{selectedSupport?.name}</span>'s ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Status
              </label>
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="h-10 rounded-xl bg-white border border-slate-300 text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2">
            <Button
              variant="outline"
              className="rounded-xl border-border text-xs"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-xs"
              onClick={handleUpdateStatusSubmit}
              disabled={statusUpdating}
            >
              {statusUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Support Request?"
        description="Are you sure you want to delete this support request? This action cannot be undone."
        onConfirm={handleDeleteSubmit}
        isLoading={deleting}
        confirmLabel="Delete Request"
      />
    </div>
  );
};

export default SupportPage;
