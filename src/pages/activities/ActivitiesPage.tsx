import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  MessageSquare,
  Handshake,
  Layout,
  ClipboardList,
  Loader2,
  Eye,
  AlertTriangle,
  MoreVertical,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Filter,
  X,
  Plus,
} from "lucide-react";
import { CreateActivityModal } from "./CreateActivityModal";
import { Button } from "@/components/ui/button";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getPosts, updatePostStatus, getReportedActivities } from "@/api/PostApi";
import type { Post } from "@/types";
import { PrivateImage } from "@/components/common/PrivateImage";
import { PrivateAvatar } from "@/components/common/PrivateAvatar";
import { cn } from "@/lib/utils";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const getAvatarGradient = (name: string = "") => {
  const charCode = name.charCodeAt(0) || 0;
  const index = charCode % 5;
  const gradients = [
    "bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 border-purple-200",
    "bg-gradient-to-br from-pink-100 to-rose-100 text-rose-700 border-rose-200",
    "bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 border-amber-200",
    "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200",
    "bg-gradient-to-br from-blue-100 to-sky-100 text-blue-700 border-blue-200",
  ];
  return gradients[index];
};

interface ActivityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPost: Post | null;
  newStatus: string;
  setNewStatus: (status: string) => void;
  statusReason: string;
  setStatusReason: (reason: string) => void;
  handleStatusUpdate: () => void;
  isUpdating: boolean;
  title: string;
}

const ActivityDetailModal = ({
  open,
  onOpenChange,
  selectedPost,
  newStatus,
  setNewStatus,
  statusReason,
  setStatusReason,
  handleStatusUpdate,
  isUpdating,
  title,
}: ActivityDetailModalProps) => {
  if (!selectedPost) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto no-scrollbar rounded-2xl border border-slate-200 p-6 sm:p-7 pb-8 bg-white shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{title} Details</DialogTitle>
          <DialogDescription>Full details of the selected post</DialogDescription>
        </DialogHeader>

        {/* Modal Header: Author Info & Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5 min-w-0">
            <PrivateAvatar
              src={selectedPost.member?.profilePhoto}
              fallbackName={selectedPost.member?.fullName || "Anonymous"}
              className="h-12 w-12 border-2 border-white shadow-sm ring-1 ring-slate-200/80 flex-shrink-0"
              avatarImageClassName="object-cover"
              avatarFallbackClassName={cn(
                "text-xs font-bold shadow-inner flex items-center justify-center border",
                getAvatarGradient(selectedPost.member?.fullName || "?")
              )}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-base text-slate-900 leading-tight">
                  {selectedPost.member?.fullName || "Anonymous"}
                </h4>
                {selectedPost.member?.businessName && (
                  <span
                    className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100/80 px-2 py-0.5 rounded-md truncate max-w-[260px]"
                    title={selectedPost.member.businessName}
                  >
                    {selectedPost.member.businessName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                <Calendar size={13} className="text-slate-400" />
                Posted on {formatDate(selectedPost.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge
              variant="outline"
              className={`text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider rounded-full ${
                selectedPost.status === "active"
                  ? "bg-green-500/10 text-green-600 border-green-200"
                  : selectedPost.status === "reported"
                  ? "bg-rose-500/10 text-rose-600 border-rose-200"
                  : selectedPost.status === "blocked"
                  ? "bg-red-500/10 text-red-600 border-red-200"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {selectedPost.status || "active"}
            </Badge>
          </div>
        </div>

        {/* Modal Body: 2 columns layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 pb-2">
          {/* Left Column: Post Content (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            {/* Title */}
            {selectedPost.title && (
              <h3 className="font-bold text-lg text-slate-900 leading-snug tracking-tight break-words">
                {selectedPost.title}
              </h3>
            )}

            {/* Location & Period chips */}
            {(selectedPost.location || selectedPost.period) && (
              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                {selectedPost.location && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg text-slate-600">
                    <MapPin size={13} className="text-red-500" />
                    {selectedPost.location}
                  </span>
                )}
                {selectedPost.period && (
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg text-slate-600">
                    <Clock size={13} className="text-blue-500" />
                    {selectedPost.period}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {selectedPost.description && (
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                {selectedPost.description}
              </div>
            )}

            {/* Media Attachment */}
            {selectedPost.media && selectedPost.media.length > 0 && (
              <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-900/5 max-h-[260px] flex justify-center items-center p-2 mb-1">
                <PrivateImage
                  src={selectedPost.media[0]}
                  alt="Post media"
                  className="max-h-[240px] max-w-full w-auto h-auto object-contain rounded-lg shadow-sm"
                  fallback={
                    <img
                      src="/placeholder.png"
                      alt="Post media"
                      className="max-h-[100px] max-w-[100px] object-contain opacity-50"
                    />
                  }
                />
              </div>
            )}
          </div>

          {/* Right Column: Metrics & Admin Controls (1 col) */}
          <div className="space-y-4">
            {/* Metric Card */}
            <div className="bg-gradient-to-br from-blue-50/60 via-white to-slate-50 p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 text-primary rounded-xl flex-shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 leading-none">
                    {selectedPost.responsedCount || 0}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Total Responses</p>
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <ShieldCheck size={14} className="text-primary" />
                <span>Admin Control</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-xs cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="reported">Reported</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    Reason / Log Note
                  </label>
                  <Textarea
                    placeholder="Provide status update details..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="min-h-[85px] text-xs rounded-xl bg-white resize-none border-slate-200 focus-visible:ring-primary/20"
                  />
                </div>

                <Button
                  className="w-full h-10 text-xs font-bold rounded-xl shadow-sm transition-all"
                  onClick={handleStatusUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface GenericActivityTablePageProps {
  type: "ASK" | "GIVE" | "PROMOTION" | "REQUIREMENT";
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  icon: any;
  loaderTitle: string;
  loaderSubtitle: string;
  itemLabel?: string;
}

const GenericActivityTablePage = ({
  type,
  title,
  subtitle,
  searchPlaceholder,
  icon: Icon,
  loaderTitle,
  loaderSubtitle,
  itemLabel = "Posts",
}: GenericActivityTablePageProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const pageSize = 10;
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [statusUpdatePost, setStatusUpdatePost] = useState<Post | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "reported">("all");
  const [newStatus, setNewStatus] = useState("reported");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchParams] = useSearchParams();
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");
  const [filterOpen, setFilterOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const isMounted = useRef(false);
  const [statusCounts, setStatusCounts] = useState<{
    all: number;
    active: number;
    inactive: number;
    reported: number;
  }>({
    all: 0,
    active: 0,
    inactive: 0,
    reported: 0,
  });

  const fetchStatusCounts = async () => {
    try {
      const [allRes, activeRes, inactiveRes, reportedRes] = await Promise.all([
        getPosts({ page: 0, limit: 1, type, fromDate: fromDate || undefined, toDate: toDate || undefined }),
        getPosts({ page: 0, limit: 1, type, status: "active", fromDate: fromDate || undefined, toDate: toDate || undefined }),
        getPosts({ page: 0, limit: 1, type, status: "inactive", fromDate: fromDate || undefined, toDate: toDate || undefined }),
        getReportedActivities({ page: 0, limit: 1, type, fromDate: fromDate || undefined, toDate: toDate || undefined }),
      ]);
      setStatusCounts({
        all: allRes?.total ?? allRes?.totalItems ?? 0,
        active: activeRes?.total ?? activeRes?.totalItems ?? 0,
        inactive: inactiveRes?.total ?? inactiveRes?.totalItems ?? 0,
        reported: reportedRes?.total ?? reportedRes?.totalItems ?? 0,
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatusCounts();
  }, [type, fromDate, toDate]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let result;
      if (statusFilter === "reported") {
        result = await getReportedActivities({
          page: page - 1,
          limit: pageSize,
          type,
          search: search.trim() || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        });
      } else {
        result = await getPosts({
          page: page - 1,
          limit: pageSize,
          type,
          search: search.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        });
      }
      setPosts(result.data || []);
      const total = result.total ?? result.totalItems ?? 0;
      setTotalPostsCount(total);
      setTotalPages(Math.max(1, result.totalPages ?? Math.ceil(total / pageSize)));
      if (!search.trim()) {
        setStatusCounts((prev) => ({
          ...prev,
          [statusFilter]: total,
        }));
      }
    } catch (error) {
      console.error(`Error fetching ${type} posts:`, error);
      toast.error(`Failed to load ${type.toLowerCase()} activities`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPreview = (post: Post) => {
    setSelectedPost(post);
    setNewStatus(post.status || "active");
    setStatusReason("");
  };

  const handleStatusUpdateFromView = async () => {
    if (!selectedPost) return;
    setIsUpdating(true);
    try {
      await updatePostStatus(selectedPost._id, {
        status: newStatus,
        reason: statusReason || undefined,
      });
      toast.success("Post status updated successfully");
      setSelectedPost((prev) => (prev ? { ...prev, status: newStatus } : null));
      fetchPosts();
      fetchStatusCounts();
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Failed to update post status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusUpdatePost) return;
    setIsUpdating(true);
    try {
      await updatePostStatus(statusUpdatePost._id, { status: newStatus, reason: statusReason });
      toast.success("Post status updated successfully");
      setStatusUpdatePost(null);
      setNewStatus("reported");
      setStatusReason("");
      fetchPosts();
      fetchStatusCounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, statusFilter, fromDate, toDate]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (page !== 1) {
        setPage(1);
      } else {
        fetchPosts();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto relative min-h-[600px]">
      {loading && posts.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title={loaderTitle}
          subtitle={loaderSubtitle}
        />
      )}

      {/* Header section matching Members Page structure */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Icon size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {/* Filter Controls Row: Guaranteed Single Line without scrollbar */}
        <div className="flex items-center gap-2 flex-nowrap">
          {/* Status Tabs: All, Active, Inactive, Reported with Counts */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className={cn(
                "px-2 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap",
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span>All</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center leading-none",
                  statusFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {statusCounts.all}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("active");
                setPage(1);
              }}
              className={cn(
                "px-2 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap",
                statusFilter === "active"
                  ? "bg-white text-emerald-700 shadow-sm border border-emerald-200/80"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>Active</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center leading-none",
                  statusFilter === "active"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {statusCounts.active}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("inactive");
                setPage(1);
              }}
              className={cn(
                "px-2 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap",
                statusFilter === "inactive"
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
              <span>Inactive</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center leading-none",
                  statusFilter === "inactive"
                    ? "bg-slate-700 text-white"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {statusCounts.inactive}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("reported");
                setPage(1);
              }}
              className={cn(
                "px-2 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap",
                statusFilter === "reported"
                  ? "bg-white text-rose-700 shadow-sm border border-rose-200/80"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <AlertTriangle
                size={13}
                className={cn("flex-shrink-0", statusFilter === "reported" ? "text-rose-600" : "text-slate-400")}
              />
              <span>Reported</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center leading-none",
                  statusFilter === "reported"
                    ? "bg-rose-600 text-white"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {statusCounts.reported}
              </span>
            </button>
          </div>

          {/* Filter Popover for Date Selection */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={fromDate || toDate ? "default" : "outline"}
                className={cn(
                  "h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-sm transition-all flex-shrink-0 px-2.5 whitespace-nowrap",
                  fromDate || toDate
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                <Filter size={13} className={fromDate || toDate ? "text-primary-foreground" : "text-slate-500"} />
                <span>Filter</span>
                {(fromDate || toDate) && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-[10px] font-bold">
                    {(fromDate ? 1 : 0) + (toDate ? 1 : 0)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 p-4 rounded-2xl border border-slate-200 bg-white shadow-xl space-y-3.5 z-50"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  <span className="text-xs font-bold text-slate-900">Date Filters</span>
                </div>
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setPage(1);
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-xl text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                    To Date
                  </label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-9 rounded-xl text-xs bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setPage(1);
                    setFilterOpen(false);
                  }}
                  className="h-8 text-xs text-slate-500 hover:text-slate-800"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setFilterOpen(false)}
                  className="h-8 text-xs font-semibold px-4 rounded-lg"
                >
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active Date Filter Chip */}
          {(fromDate || toDate) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-medium text-primary">
              <Calendar size={12} className="text-primary flex-shrink-0" />
              <span className="text-[11px]">
                {fromDate && toDate
                  ? `${fromDate} → ${toDate}`
                  : fromDate
                  ? `From ${fromDate}`
                  : `Until ${toDate}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setPage(1);
                }}
                className="hover:text-destructive transition-colors ml-0.5"
                title="Clear date filter"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="relative w-36 sm:w-44 lg:w-52 flex-shrink-0">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <Input
              placeholder={searchPlaceholder}
              className="pl-8 h-9 border-slate-200 bg-white shadow-xs focus:border-primary rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Create Activity Button */}
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="h-9 rounded-xl text-xs font-semibold gap-1.5 shadow-xs bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap flex-shrink-0 px-3"
          >
            <Plus size={14} />
            <span>Create</span>
          </Button>
        </div>
      </div>

      {/* Table Card Container matching Members Page structure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-sm overflow-hidden relative"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="border-b border-border/80">
                <TableHead className="px-4 py-3.5 w-12 text-center text-xs font-bold text-muted-foreground">
                  S.No
                </TableHead>
                <TableHead className="px-4 py-3.5 min-w-[220px] text-xs font-bold text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="px-4 py-3.5 min-w-[190px] text-xs font-bold text-muted-foreground">
                  Title
                </TableHead>
                <TableHead className="px-4 py-3.5 min-w-[240px] text-xs font-bold text-muted-foreground">
                  Description
                </TableHead>
                <TableHead className="px-4 py-3.5 text-center text-xs font-bold text-muted-foreground">
                  Count
                </TableHead>
                <TableHead className="px-4 py-3.5 text-center text-xs font-bold text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3.5 min-w-[80px] text-right text-xs font-bold text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={7} className="px-4 py-6">
                      <div className="w-full h-12 bg-muted/60 animate-pulse rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post: Post, index) => (
                  <TableRow key={post._id} className="hover:bg-secondary/10 transition-colors">
                    {/* S.No */}
                    <TableCell className="px-4 py-3.5 text-center text-sm font-semibold text-foreground">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>

                    {/* Name (Profile image, Name, Company name, Created date) */}
                    <TableCell className="px-4 py-3.5 min-w-[220px]">
                      <div className="flex items-center gap-3">
                        <PrivateAvatar
                          src={post.member?.profilePhoto}
                          fallbackName={post.member?.fullName || "?"}
                          className="w-10 h-10 border border-border/80 flex-shrink-0 shadow-sm"
                          avatarImageClassName="object-cover"
                          avatarFallbackClassName={cn(
                            "text-xs font-bold shadow-inner flex items-center justify-center border",
                            getAvatarGradient(post.member?.fullName || "?")
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-foreground leading-snug tracking-tight whitespace-nowrap">
                            {post.member?.fullName || "Anonymous"}
                          </span>
                          {post.member?.businessName ? (
                            <span
                              className="text-xs text-primary font-medium truncate max-w-[200px]"
                              title={post.member.businessName}
                            >
                              {post.member.businessName}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No Company</span>
                          )}
                          <span className="text-xs text-muted-foreground font-medium block mt-0.5 whitespace-nowrap">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Title */}
                    <TableCell className="px-4 py-3.5 min-w-[190px]">
                      <p
                        className="text-sm font-semibold text-foreground leading-snug line-clamp-2"
                        title={post.title || ""}
                      >
                        {post.title || (
                          <span className="text-muted-foreground font-normal italic">Untitled</span>
                        )}
                      </p>
                    </TableCell>

                    {/* Description (with Tooltip wrap text) */}
                    <TableCell className="px-4 py-3.5 min-w-[240px]">
                      {post.description ? (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[260px] cursor-pointer">
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed hover:text-foreground transition-colors">
                                  {post.description}
                                </p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-sm sm:max-w-md p-3.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs leading-relaxed whitespace-pre-wrap break-words border-slate-800 z-50 pointer-events-none"
                            >
                              <div className="font-semibold text-slate-200 mb-1.5 pb-1 border-b border-slate-700/60 flex items-center gap-1.5">
                                <ClipboardList size={13} className="text-primary" />
                                <span>Description</span>
                              </div>
                              <p className="whitespace-pre-wrap break-words font-normal text-slate-100">
                                {post.description}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No description</span>
                      )}
                    </TableCell>

                    {/* Count */}
                    <TableCell className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {post.responsedCount || 0}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-4 py-3.5 text-center whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2.5 py-0.5 font-bold uppercase tracking-wider rounded-full ${
                          post.status === "active"
                            ? "bg-green-500/10 text-green-600 border-green-200"
                            : post.status === "reported"
                            ? "bg-rose-500/10 text-rose-600 border-rose-200"
                            : post.status === "blocked"
                            ? "bg-red-500/10 text-red-600 border-red-200"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {post.status || "active"}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-4 py-3.5 text-right whitespace-nowrap min-w-[70px]">
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => handleOpenPreview(post)}
                              className="cursor-pointer gap-2"
                            >
                              <Eye size={14} className="text-blue-500" />
                              <span>View</span>
                            </DropdownMenuItem>
                            {statusFilter !== "reported" && post.status !== "reported" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setStatusUpdatePost(post);
                                  setNewStatus("reported");
                                  setStatusReason("");
                                }}
                                className="cursor-pointer gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50"
                              >
                                <AlertTriangle size={14} />
                                <span>Report</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bottom Pagination Bar inside motion.div matching MembersPage */}
        {!loading && posts.length > 0 && (
          <div className="px-6 pb-4 border-t border-border">
            <PaginationBar
              currentPage={page}
              totalPages={totalPages || 1}
              totalItems={totalPostsCount}
              onPageChange={setPage}
            />
          </div>
        )}
      </motion.div>

      {/* View Post Dialog */}
      <ActivityDetailModal
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
        selectedPost={selectedPost}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        statusReason={statusReason}
        setStatusReason={setStatusReason}
        handleStatusUpdate={handleStatusUpdateFromView}
        isUpdating={isUpdating}
        title={title}
      />

      {/* Status Update / Report Dialog */}
      <Dialog
        open={!!statusUpdatePost}
        onOpenChange={(open) => !open && setStatusUpdatePost(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Post Status</DialogTitle>
            <DialogDescription>
              Change the status of this post and provide an optional reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="reported">Reported</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Textarea
                placeholder="Briefly explain why this status is being updated..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setStatusUpdatePost(null)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Activity Modal */}
      <CreateActivityModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        type={type}
        onSuccess={() => {
          fetchPosts();
          fetchStatusCounts();
        }}
      />
    </div>
  );
};

export const AskPage = () => (
  <GenericActivityTablePage
    type="ASK"
    title="Ask Activities"
    subtitle="Manage community requests and ask posts"
    searchPlaceholder="Search asks..."
    icon={MessageSquare}
    loaderTitle="Loading Ask Activities..."
    loaderSubtitle="Connecting to community requests"
    itemLabel="Asks"
  />
);

export const GivePage = () => (
  <GenericActivityTablePage
    type="GIVE"
    title="Give Activities"
    subtitle="Manage community offers and give posts"
    searchPlaceholder="Search gives..."
    icon={Handshake}
    loaderTitle="Loading Give Activities..."
    loaderSubtitle="Connecting to community offers"
    itemLabel="Gives"
  />
);

export const PostPage = () => (
  <GenericActivityTablePage
    type="PROMOTION"
    title="Post Activities"
    subtitle="Manage community social updates and promotional posts"
    searchPlaceholder="Search posts..."
    icon={Layout}
    loaderTitle="Loading Social Posts..."
    loaderSubtitle="Connecting to community updates"
    itemLabel="Posts"
  />
);

export const RequirementPage = () => (
  <GenericActivityTablePage
    type="REQUIREMENT"
    title="Requirement Activities"
    subtitle="Manage business requirements and inquiries"
    searchPlaceholder="Search requirements..."
    icon={ClipboardList}
    loaderTitle="Loading Requirements..."
    loaderSubtitle="Connecting to business requirements"
    itemLabel="Requirements"
  />
);
