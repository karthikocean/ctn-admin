import { useState, useEffect } from "react";
import { Search, Star, CheckCircle, XCircle, Trash2, Loader2, User, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import {
  getSpotlightRequests,
  approveSpotlightRequest,
  rejectSpotlightRequest,
  deleteSpotlightRequest,
  getBookedDates
} from "@/api/SpotlightApi";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaginationBar from "@/components/common/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PrivateAvatar } from "@/components/common/PrivateAvatar";

const SpotlightRequestsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // tracks request ID being approved/rejected
  const [requests, setRequests] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reject dialog states
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Approve dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<any>(null);
  const [approveDate, setApproveDate] = useState<Date | undefined>(undefined);
  const [approveStatus, setApproveStatus] = useState("schedule");
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  const canEdit = hasPermission("spotlight", "edit");
  const canDelete = hasPermission("spotlight", "delete");

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const result = await getSpotlightRequests({
        page: page,
        limit: 10,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearchQuery.trim() || undefined
      });
      const fetchedData = result.data || [];

      setRequests(fetchedData);
      setTotalPages(result.totalPages || 1);
      setTotalRequests(result.total || result.totalItems || 0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch spotlight requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, debouncedSearchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, debouncedSearchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearchQuery(searchQuery);
  };

  const handleApproveClick = async (request: any) => {
    setRequestToApprove(request);
    setApproveDate(undefined);
    setApproveStatus("schedule");
    setApproveDialogOpen(true);
    try {
      const res = await getBookedDates();
      if (res && res.data) {
        setBookedDates(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch booked dates:", err);
    }
  };

  const handleConfirmApprove = async () => {
    if (!requestToApprove || !approveDate) return;
    setIsApproving(true);
    try {
      const scheduleDateStr = format(approveDate, "yyyy-MM-dd");
      await approveSpotlightRequest(requestToApprove._id, {
        scheduleDate: scheduleDateStr,
        status: approveStatus
      });
      toast({
        title: "Approved",
        description: "Spotlight request approved successfully",
        variant: "success"
      });
      setApproveDialogOpen(false);
      setRequestToApprove(null);
      setApproveDate(undefined);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.response?.data?.message || "Failed to approve request",
        variant: "destructive"
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectClick = (request: any) => {
    setRequestToReject(request);
    setRejectReason("");
    setRejectConfirmOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!requestToReject) return;
    if (!rejectReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Reason is required to reject a spotlight request.",
        variant: "destructive"
      });
      return;
    }
    setIsRejecting(true);
    try {
      await rejectSpotlightRequest(requestToReject._id, rejectReason.trim());
      toast({
        title: "Rejected",
        description: "Spotlight request rejected successfully",
        variant: "success"
      });
      setRejectConfirmOpen(false);
      setRequestToReject(null);
      setRejectReason("");
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Rejection Failed",
        description: error.response?.data?.message || "Failed to reject request",
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleDeleteClick = (request: any) => {
    setRequestToDelete(request);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSpotlightRequest(requestToDelete._id);
      toast({
        title: "Deleted",
        description: "Spotlight request removed successfully",
        variant: "success"
      });
      setDeleteConfirmOpen(false);
      setRequestToDelete(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.response?.data?.message || "Failed to delete request",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {isLoading && requests.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Retrieving Requests..."
          subtitle="Establishing connection to request queue"
        />
      )}

      {/* Header section */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star size={16} className="text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Spotlight Requests</h1>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 ml-auto">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search member or business..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-56 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </form>

          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(0); }}>
            <SelectTrigger className="h-9 w-36 rounded-lg border-slate-200 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead className="w-[80px]">S.No</TableHead>
              <TableHead className="w-[300px]">Member</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No spotlight requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r, index) => (
                <TableRow key={r._id} className="hover:bg-secondary/10 transition-colors">
                  <TableCell className="text-sm font-semibold text-muted-foreground">
                    {page * 10 + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PrivateAvatar
                        src={r.member?.profilePhoto}
                        fallbackName={r.member?.fullName}
                        className="w-9 h-9 border border-border"
                        avatarImageClassName="object-cover"
                        avatarFallbackClassName="bg-primary/10 text-primary text-xs font-bold"
                      />
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {r.member?.fullName || "Unknown Member"}
                        </div>
                        <div className="text-xs text-foreground font-semibold">
                          {r.member?.businessName || "No Business Name"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground font-semibold">
                    {r.createdAt ? format(new Date(r.createdAt), "PPP p") : "N/A"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === "pending" && canEdit && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200/50"
                            onClick={() => handleApproveClick(r)}
                            disabled={isProcessing !== null}
                          >
                            <div className="flex items-center gap-1">
                              <CheckCircle size={14} />
                              <span>Approve</span>
                            </div>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/50"
                            onClick={() => handleRejectClick(r)}
                            disabled={isProcessing !== null || isRejecting}
                          >
                            <div className="flex items-center gap-1">
                              <XCircle size={14} />
                              <span>Reject</span>
                            </div>
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClick(r)}
                          disabled={isProcessing !== null}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && requests.length > 0 && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page + 1}
              totalPages={totalPages}
              totalItems={totalRequests}
              onPageChange={(p) => setPage(p - 1)}
            />
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Spotlight Request?"
        description={`Are you sure you want to delete the spotlight request from ${requestToDelete?.member?.fullName || "this member"}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        variant="destructive"
      />

      {/* Reject Dialog */}
      <Dialog open={rejectConfirmOpen} onOpenChange={setRejectConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] border-border rounded-2xl shadow-2xl p-6 bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                <XCircle className="text-red-500 w-4 h-4" />
              </div>
              Reject Spotlight Request
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 text-xs">
              Are you sure you want to reject the spotlight request from <span className="font-semibold text-foreground">{requestToReject?.member?.fullName || "this member"}</span>? A rejection reason is required and will be sent to the member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <label htmlFor="reject-reason" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="reject-reason"
                placeholder="Explain why this request is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px] rounded-xl bg-background border border-border focus:ring-2 focus:ring-ring focus-visible:ring-ring resize-none text-xs"
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl border-border text-xs"
              onClick={() => {
                setRejectConfirmOpen(false);
                setRequestToReject(null);
                setRejectReason("");
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs"
              onClick={handleConfirmReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[420px] border-border rounded-2xl shadow-2xl p-6 bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <CheckCircle className="text-emerald-500 w-4 h-4" />
              </div>
              Approve Spotlight Request
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2 text-xs">
              Select the schedule date and status to approve the spotlight request for <span className="font-semibold text-foreground">{requestToApprove?.member?.fullName || "this member"}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Date Picker */}
            <div className="grid gap-1.5 flex flex-col">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Schedule Date <span className="text-red-500">*</span>
              </label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal rounded-xl border-border bg-transparent text-sm shadow-sm",
                      !approveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                    {approveDate ? format(approveDate, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={approveDate}
                    onSelect={setApproveDate}
                    disabled={(date) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return bookedDates.includes(dateStr) || date < today;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Select */}
            <div className="grid gap-1.5">
              <label htmlFor="approve-status" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Spotlight Status <span className="text-red-500">*</span>
              </label>
              <Select value={approveStatus} onValueChange={setApproveStatus}>
                <SelectTrigger id="approve-status" className="h-11 rounded-xl border-border bg-transparent text-sm">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-card">
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl border-border text-xs"
              onClick={() => {
                setApproveDialogOpen(false);
                setRequestToApprove(null);
                setApproveDate(undefined);
                setApproveStatus("schedule");
              }}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={handleConfirmApprove}
              disabled={isApproving || !approveDate}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Approving...
                </>
              ) : (
                "Approve & Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpotlightRequestsPage;

