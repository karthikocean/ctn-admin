import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Pencil,
  MessageSquare
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
  EnquiryItem,
} from "@/api/EnquiryApi";

export const EnquiriesPage: React.FC = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission("enquiries", "edit");
  const canDelete = hasPermission("enquiries", "delete");

  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);

  const [statusDialogOpen, setStatusDialogOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<string>("PENDING");
  const [adminNote, setAdminNote] = useState<string>("");
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<EnquiryItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 10,
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await getEnquiries(params);
      const items = response.data || response.items || (Array.isArray(response) ? response : []);
      setEnquiries(items);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalCount(response.pagination.total || 0);
      } else {
        setTotalPages(Math.ceil((response.total || items.length) / 10) || 1);
        setTotalCount(response.total || items.length);
      }
    } catch (error: any) {
      console.error("Error fetching enquiries:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load website enquiries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEnquiries();
    }, 400);
    return () => clearTimeout(timer);
  }, [page, searchTerm, statusFilter]);

  const handleOpenStatusDialog = (enquiry: EnquiryItem) => {
    setSelectedEnquiry(enquiry);
    setTargetStatus(enquiry.status);
    setAdminNote(enquiry.adminNote || "");
    setStatusDialogOpen(true);
  };

  const handleUpdateStatusSubmit = async () => {
    if (!selectedEnquiry) return;
    setStatusUpdating(true);
    try {
      await updateEnquiryStatus(selectedEnquiry._id, {
        status: targetStatus,
        adminNote: adminNote.trim(),
      });
      toast({
        title: "Success",
        description: "Enquiry status updated successfully",
      });
      setStatusDialogOpen(false);
      fetchEnquiries();
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
      await deleteEnquiry(itemToDelete._id);
      toast({
        title: "Success",
        description: "Enquiry deleted successfully",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchEnquiries();
    } catch (error: any) {
      console.error("Failed to delete enquiry:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete enquiry",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (enquiry: EnquiryItem) => {
    switch (enquiry.status) {
      case "RESOLVED":
        return (
          <Badge
            className="cursor-pointer font-semibold transition-all active:scale-95 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
            onClick={() => {
              if (canEdit) handleOpenStatusDialog(enquiry);
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
              if (canEdit) handleOpenStatusDialog(enquiry);
            }}
          >
            In Progress
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            className="cursor-pointer font-semibold transition-all active:scale-95 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/20"
            onClick={() => {
              if (canEdit) handleOpenStatusDialog(enquiry);
            }}
          >
            Rejected
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge
            className="cursor-pointer font-semibold transition-all active:scale-95 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20"
            onClick={() => {
              if (canEdit) handleOpenStatusDialog(enquiry);
            }}
          >
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {loading && enquiries.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Enquiries..."
          subtitle="Fetching user submissions and messages"
        />
      )}

      {/* Single Row Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        {/* Title Block */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <HelpCircle size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Website Enquiries</h1>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              className="h-9 pl-8 pr-3 w-48 sm:w-60 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 focus:border-primary placeholder:text-muted-foreground/60"
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
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">S.No</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sender</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enquiry Type</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Submitted On</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enquiries.length === 0 && !loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No enquiries found
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry, index) => (
                  <tr key={enquiry._id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      {(page * 10) + index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground font-semibold">
                      <div>{enquiry.name}</div>
                      {enquiry.companyName && (
                        <div className="text-xs text-muted-foreground font-normal">{enquiry.companyName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <Phone size={12} className="text-muted-foreground" />
                          {enquiry.phoneNumber}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail size={12} className="text-muted-foreground" />
                          {enquiry.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="text-xs font-semibold bg-slate-100 border-none">
                        {enquiry.enquiryType || "General"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-foreground max-w-xs truncate">
                      {enquiry.comment || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(enquiry)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ActionMenu
                        onView={() => {
                          setSelectedEnquiry(enquiry);
                          setViewDialogOpen(true);
                        }}
                        onEdit={canEdit ? () => handleOpenStatusDialog(enquiry) : undefined}
                        onDelete={canDelete ? () => {
                          setItemToDelete(enquiry);
                          setDeleteDialogOpen(true);
                        } : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-6 pb-4 border-t">
          <PaginationBar
            currentPage={page + 1}
            totalPages={totalPages}
            totalItems={totalCount}
            onPageChange={(p) => setPage(p - 1)}
          />
        </div>
      </motion.div>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <HelpCircle className="w-5 h-5 text-primary" />
              Website Enquiry Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enquiry submitted by {selectedEnquiry?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedEnquiry && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-xl border border-border">
                <div>
                  <p className="text-muted-foreground font-medium">Sender Name</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">{selectedEnquiry.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Status</p>
                  <div className="mt-0.5">{getStatusBadge(selectedEnquiry)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Phone Number</p>
                  <p className="font-semibold text-foreground mt-0.5">{selectedEnquiry.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Email Address</p>
                  <p className="text-foreground mt-0.5 break-all">{selectedEnquiry.email}</p>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-secondary/50 rounded-xl border border-border">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground font-medium">Enquiry Type</p>
                    <p className="font-semibold text-foreground mt-0.5">{selectedEnquiry.enquiryType || "General"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">City</p>
                    <p className="font-semibold text-foreground mt-0.5">{selectedEnquiry.city || "N/A"}</p>
                  </div>
                </div>
                {selectedEnquiry.companyName && (
                  <div>
                    <p className="text-muted-foreground font-medium">Company Name</p>
                    <p className="font-semibold text-foreground mt-0.5">{selectedEnquiry.companyName}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-border grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground font-medium">Submitted On</p>
                    <p className="text-foreground mt-0.5">
                      {new Date(selectedEnquiry.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium">Last Updated</p>
                    <p className="text-foreground mt-0.5">
                      {new Date(selectedEnquiry.updatedAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">Message Content</p>
                <div className="p-3 bg-card rounded-xl border border-border text-foreground whitespace-pre-wrap">
                  {selectedEnquiry.comment || "No comment provided."}
                </div>
              </div>

              {selectedEnquiry.adminNote && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="font-bold text-amber-900">Admin Resolution Note</p>
                  <p className="text-amber-800 mt-1 whitespace-pre-wrap">{selectedEnquiry.adminNote}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewDialogOpen(false)}
            >
              Close
            </Button>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => {
                  setViewDialogOpen(false);
                  if (selectedEnquiry) handleOpenStatusDialog(selectedEnquiry);
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Update Status
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Update Enquiry Status</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set status and resolution notes for enquiry from {selectedEnquiry?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Admin Notes / Remarks</label>
              <Textarea
                placeholder="Enter remarks or resolution details..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateStatusSubmit}
              disabled={statusUpdating}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {statusUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Enquiry"
        description={`Are you sure you want to delete this enquiry from ${itemToDelete?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteSubmit}
        isLoading={deleting}
      />
    </div>
  );
};

export default EnquiriesPage;
