import { useState, useEffect } from "react";
import { Search, Star, CheckCircle, XCircle, Trash2, Loader2, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StatusBadge from "@/components/common/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import {
  getSpotlightRequests,
  approveSpotlightRequest,
  rejectSpotlightRequest,
  deleteSpotlightRequest
} from "@/api/SpotlightApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaginationBar from "@/components/common/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";

const getFullUrl = (path: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Ensure starting slash
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${import.meta.env.VITE_API_URL}${cleanPath}`;
};

const SpotlightRequestsPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // tracks request ID being approved/rejected
  const [requests, setRequests] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canEdit = hasPermission("spotlight", "edit");
  const canDelete = hasPermission("spotlight", "delete");

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const result = await getSpotlightRequests({
        page: page,
        limit: 10,
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      let fetchedData = result.data || [];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        fetchedData = fetchedData.filter((r: any) =>
          r.member?.fullName?.toLowerCase().includes(query) ||
          r.member?.businessName?.toLowerCase().includes(query)
        );
      }

      setRequests(fetchedData);
      setTotalPages(result.totalPages || 1);
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
    fetchRequests();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchRequests();
  };

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await approveSpotlightRequest(id);
      toast({
        title: "Approved",
        description: "Spotlight request approved successfully",
        variant: "success"
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.response?.data?.message || "Failed to approve request",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(id);
    try {
      await rejectSpotlightRequest(id);
      toast({
        title: "Rejected",
        description: "Spotlight request rejected successfully",
        variant: "success"
      });
      fetchRequests();
    } catch (error: any) {
      toast({
        title: "Rejection Failed",
        description: error.response?.data?.message || "Failed to reject request",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(null);
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
              <TableHead className="w-[300px]">Member</TableHead>
              <TableHead>Requested Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                  No spotlight requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((r) => (
                <TableRow key={r._id} className="hover:bg-secondary/10 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {r.member?.profilePhoto ? (
                        <img
                          src={getFullUrl(r.member.profilePhoto)}
                          alt={r.member.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-border"
                          onError={(e) => {
                            // Fallback to placeholder on error
                            (e.target as HTMLImageElement).src = "";
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-border">
                          <User size={16} className="text-primary" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          {r.member?.fullName || "Unknown Member"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {r.member?.businessName || "No Business Name"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
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
                            onClick={() => handleApprove(r._id)}
                            disabled={isProcessing !== null}
                          >
                            {isProcessing === r._id ? (
                              <Loader2 className="animate-spin h-3.5 w-3.5" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <CheckCircle size={14} />
                                <span>Approve</span>
                              </div>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200/50"
                            onClick={() => handleReject(r._id)}
                            disabled={isProcessing !== null}
                          >
                            {isProcessing === r._id ? (
                              <Loader2 className="animate-spin h-3.5 w-3.5" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <XCircle size={14} />
                                <span>Reject</span>
                              </div>
                            )}
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
      </div>

      {/* Pagination */}
      <div className="mt-6">
        <PaginationBar
          currentPage={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p - 1)}
        />
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
    </div>
  );
};

export default SpotlightRequestsPage;
