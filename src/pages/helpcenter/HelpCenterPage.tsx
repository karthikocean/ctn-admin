import { useState, useEffect } from "react";
import {
  Search,
  HelpCircle,
  Loader2,
  User,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  X
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getHelpCenterItems,
  updateHelpCenterStatus,
  deleteHelpCenterItem
} from "@/api/HelpCenterApi";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PaginationBar from "@/components/common/PaginationBar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ActionMenu from "@/components/common/ActionMenu";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const getFullUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const baseUrl = import.meta.env.VITE_API_URL.replace("/api/admin", "");
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

const STATUS_OPTIONS = [
  { value: "PENDING",  label: "Pending",  icon: Clock,         color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "REVIEWED", label: "Reviewed", icon: Eye,           color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "RESOLVED", label: "Resolved", icon: CheckCircle2,  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "REJECTED", label: "Rejected", icon: XCircle,       color: "bg-red-50 text-red-700 border-red-200" },
];

const StatusChip = ({ status, onClick }: { status: string; onClick?: () => void }) => {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  const Icon = opt?.icon ?? Clock;
  const color = opt?.color ?? "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <button
      onClick={onClick}
      title={onClick ? "Click to update status" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all",
        color,
        onClick && "hover:opacity-80 hover:shadow-sm cursor-pointer"
      )}
    >
      <Icon size={11} />
      {opt?.label ?? status}
    </button>
  );
};

/* ─── Status Update Popup ─── */
const StatusPopup = ({
  item,
  onClose,
  onSave,
  isUpdating
}: {
  item: any;
  onClose: () => void;
  onSave: (id: string, status: string, adminNote: string) => void;
  isUpdating: boolean;
}) => {
  const [selectedStatus, setSelectedStatus] = useState(item.status);
  const [adminNote, setAdminNote] = useState(item.adminNote || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Update Status</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{item.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Current */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Current:</span>
            <StatusChip status={item.status} />
          </div>

          {/* New Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Admin Note <span className="normal-case font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 resize-none outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              maxLength={500}
            />
            <p className="text-[10px] text-slate-400 text-right">{adminNote.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button variant="outline" className="flex-1 h-10 rounded-xl font-semibold" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl font-bold shadow-lg shadow-primary/20"
            onClick={() => onSave(item._id, selectedStatus, adminNote)}
            disabled={isUpdating}
          >
            {isUpdating
              ? <Loader2 size={15} className="animate-spin mr-2" />
              : <CheckCircle2 size={15} className="mr-2" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Detail Drawer ─── */
const DetailDrawer = ({
  item,
  onClose,
  onStatusUpdate,
  isUpdating
}: {
  item: any;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, adminNote: string) => void;
  isUpdating: boolean;
}) => {
  const [selectedStatus, setSelectedStatus] = useState(item.status);
  const [adminNote, setAdminNote] = useState(item.adminNote || "");

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative ml-auto w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Suggestion Detail</h2>
              <p className="text-[11px] text-slate-400">Review member suggestion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5">
          {/* Member */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">{item.member?.fullName || "Unknown Member"}</p>
              <p className="text-xs text-slate-500">{item.member?.email || item.member?.mobileNumber || "—"}</p>
            </div>
            <StatusChip status={item.status} />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</p>
            <p className="text-sm font-semibold text-slate-800">{item.title}</p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
              {item.description}
            </p>
          </div>

          {/* Image */}
          {item.image && (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Attachment</p>
              <img
                src={getFullUrl(item.image)}
                alt="Suggestion attachment"
                className="w-full rounded-xl border border-slate-200 object-cover max-h-52"
              />
            </div>
          )}

          {/* Date */}
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted On</p>
            <p className="text-sm font-semibold text-slate-700">
              {format(new Date(item.createdAt), "PPP, p")}
            </p>
          </div>

          {/* Update Status */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Update Status</p>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin Note */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Admin Note <span className="normal-case font-normal text-slate-400">(optional)</span>
            </p>
            <textarea
              rows={3}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Add a note for this suggestion..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 resize-none outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
              maxLength={500}
            />
            <p className="text-[10px] text-slate-400 text-right">{adminNote.length}/500</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex gap-3 sticky bottom-0">
          <Button variant="outline" className="flex-1 h-11 rounded-xl font-semibold" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 rounded-xl font-bold shadow-lg shadow-primary/20"
            onClick={() => onStatusUpdate(item._id, selectedStatus, adminNote)}
            disabled={isUpdating}
          >
            {isUpdating ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const HelpCenterPage = () => {
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canEdit   = hasPermission("help_center", "edit");
  const canDelete = hasPermission("help_center", "delete");

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewItem, setViewItem] = useState<any>(null);
  const [statusPopupItem, setStatusPopupItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  /* Debounce */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* Reset page */
  useEffect(() => { setPage(0); }, [statusFilter, debouncedSearch]);

  /* Fetch */
  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const result = await getHelpCenterItems({
        page,
        limit: 10,
        status: statusFilter === "all" ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined
      });
      setItems(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch suggestions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [page, statusFilter, debouncedSearch]);

  /* Status Update */
  const handleStatusUpdate = async (id: string, status: string, adminNote: string) => {
    setIsUpdating(true);
    try {
      await updateHelpCenterStatus(id, { status, adminNote: adminNote || undefined });
      toast({ title: "Updated", description: "Status updated successfully", variant: "success" });
      setViewItem(null);
      setStatusPopupItem(null);
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  /* Delete */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteHelpCenterItem(deleteTarget._id);
      toast({ title: "Deleted", description: "Suggestion deleted successfully", variant: "success" });
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container relative min-h-[600px]">
      {isLoading && items.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title="Loading Help Center..."
          subtitle="Fetching member suggestions and feedback"
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <HelpCircle size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">Help Center</h1>
            <p className="text-[11px] text-muted-foreground">Manage member suggestions &amp; feedback</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder="Search suggestions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 rounded-lg border-slate-200 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg"
            onClick={fetchItems}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {STATUS_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const count = items.filter(i => i.status === opt.value).length;
          return (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(statusFilter === opt.value ? "all" : opt.value)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm",
                statusFilter === opt.value
                  ? "border-primary/30 bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:bg-secondary/20"
              )}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${opt.color} border`}>
                <Icon size={14} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{opt.label}</p>
                <p className="text-lg font-bold text-foreground leading-none mt-0.5">{count}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead className="w-[60px]">S.No</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <MessageSquare size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">No suggestions found</p>
                      <p className="text-xs text-slate-400 mt-0.5">Try adjusting your filters</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item._id} className="hover:bg-secondary/10 transition-colors">
                  <TableCell className="text-sm font-semibold text-muted-foreground">
                    {page * 10 + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">{item.member?.fullName || "Unknown"}</p>
                        <p className="text-[10px] text-muted-foreground">{item.member?.mobileNumber || "—"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-foreground max-w-[160px]">
                    <span className="truncate block">{item.title}</span>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  </TableCell>
                  <TableCell>
                    {/* Clicking status opens the quick status popup */}
                    <StatusChip
                      status={item.status}
                      onClick={canEdit ? () => setStatusPopupItem(item) : undefined}
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                    {format(new Date(item.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionMenu
                      onView={() => setViewItem(item)}
                      onDelete={canDelete ? () => { setDeleteTarget(item); setDeleteOpen(true); } : undefined}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!isLoading && items.length > 0 && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page + 1}
              totalPages={totalPages}
              onPageChange={p => setPage(p - 1)}
            />
          </div>
        )}
      </div>

      {/* Status Update Popup (click on status chip) */}
      {statusPopupItem && (
        <StatusPopup
          item={statusPopupItem}
          onClose={() => setStatusPopupItem(null)}
          onSave={handleStatusUpdate}
          isUpdating={isUpdating}
        />
      )}

      {/* Detail Drawer (View from action menu) */}
      {viewItem && (
        <DetailDrawer
          item={viewItem}
          onClose={() => setViewItem(null)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdating}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Suggestion?"
        description="Are you sure you want to permanently delete this suggestion? This action cannot be undone."
        onConfirm={handleDelete}
        isLoading={isDeleting}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default HelpCenterPage;
