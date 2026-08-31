import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, MessageSquare, Handshake, Layout, ClipboardList, Loader2, Eye, AlertTriangle, MoreVertical, MapPin, Clock, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/social/PostCard";
import GlobalNetworkLoader from "@/components/common/GlobalNetworkLoader";
import PaginationBar from "@/components/common/PaginationBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getPosts, updatePostStatus, getReportedActivities } from "@/api/PostApi";
import type { Post } from "@/types";
import { PrivateImage } from "@/components/common/PrivateImage";
import { PrivateAvatar } from "@/components/common/PrivateAvatar";

const getInitials = (name: string) => {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
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
              avatarFallbackClassName="bg-primary/10 text-primary text-sm font-bold"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-base text-slate-900 leading-tight">
                  {selectedPost.member?.fullName || "Anonymous"}
                </h4>
                {selectedPost.member?.businessName && (
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100/80 px-2 py-0.5 rounded-md truncate max-w-[260px]" title={selectedPost.member.businessName}>
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
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                selectedPost.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                  : selectedPost.status === "reported"
                  ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                  : selectedPost.status === "blocked"
                  ? "bg-red-50 text-red-700 border border-red-200/80"
                  : "bg-slate-100 text-slate-700 border border-slate-200/80"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  selectedPost.status === "active"
                    ? "bg-emerald-500"
                    : selectedPost.status === "reported"
                    ? "bg-rose-500"
                    : selectedPost.status === "blocked"
                    ? "bg-red-500"
                    : "bg-slate-400"
                }`}
              />
              {selectedPost.status || "active"}
            </span>
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
                  <p className="text-2xl font-bold text-slate-900 leading-none">{selectedPost.responsedCount || 0}</p>
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
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Status</label>
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
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Reason / Log Note</label>
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

interface GenericActivityPageProps {
  type: "ASK" | "GIVE" | "PROMOTION" | "REQUIREMENT";
  title: string;
  searchPlaceholder: string;
  icon: any;
  loaderTitle: string;
  loaderSubtitle: string;
}

const GenericActivityPage = ({
  type,
  title,
  searchPlaceholder,
  icon: Icon,
  loaderTitle,
  loaderSubtitle,
}: GenericActivityPageProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [showReportedOnly, setShowReportedOnly] = useState(false);
  const [statusUpdatePost, setStatusUpdatePost] = useState<Post | null>(null);
  const [newStatus, setNewStatus] = useState("reported");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchParams] = useSearchParams();
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const isMounted = useRef(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchApi = showReportedOnly ? getReportedActivities : getPosts;
      const result = await fetchApi({
        page: page - 1,
        limit: 10,
        type,
        search,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setPosts(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalPostsCount(result.total || result.totalItems || 0);
    } catch (error) {
      console.error(`Error fetching ${type} posts:`, error);
      toast.error(`Failed to load ${type.toLowerCase()} activities`);
    } finally {
      setLoading(false);
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
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
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Failed to update post status");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, showReportedOnly, fromDate, toDate]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading && posts.length === 0) {
    return (
      <GlobalNetworkLoader
        title={loaderTitle}
        subtitle={loaderSubtitle}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {/* Single Row Header (fixed at top) */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border relative z-20">
        {/* Title Block */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
          </div>
        </div>

        {/* Search, Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            pressed={showReportedOnly}
            onPressedChange={setShowReportedOnly}
            variant="outline"
            className="h-9 gap-2 text-foreground hover:text-foreground hover:bg-slate-100 data-[state=on]:bg-red-50 data-[state=on]:text-red-700 data-[state=on]:border-red-200 data-[state=on]:hover:bg-red-100 data-[state=on]:hover:text-red-700"
          >
            <AlertTriangle size={16} className={showReportedOnly ? "text-red-500" : "text-muted-foreground"} />
            <span className="hidden sm:inline">Reported Posts</span>
          </Toggle>

          {/* Date Filters */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">From:</span>
              <Input
                key="gridFromDate"
                id="gridFromDate"
                name="gridFromDate"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-[142px] rounded-lg text-xs bg-background px-2"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">To:</span>
              <Input
                key="gridToDate"
                id="gridToDate"
                name="gridToDate"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-[142px] rounded-lg text-xs bg-background px-2"
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 sm:w-64 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Middle Area containing Grid of Cards */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pr-1 py-1">
        {loading && posts.length > 0 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground max-w-md mx-auto">
            No records found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <PostCard 
                key={post._id} 
                post={post} 
                onReport={showReportedOnly ? undefined : (p) => setStatusUpdatePost(p)} 
                onView={handleOpenPreview} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={!!statusUpdatePost} onOpenChange={(open) => !open && setStatusUpdatePost(null)}>
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
                className="w-full p-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="active">Active</option>
                <option value="reported">Reported</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason <span className="text-muted-foreground font-normal">(Optional)</span></label>
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

      {/* Footer (fixed at bottom) */}
      {!loading && posts.length > 0 && (
        <div className="flex-shrink-0 pt-0 border-t border-border bg-background/80 backdrop-blur-sm z-10">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalPostsCount}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

const GenericActivityTablePage = ({
  type,
  title,
  searchPlaceholder,
  icon: Icon,
  loaderTitle,
  loaderSubtitle,
}: GenericActivityPageProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPostsCount, setTotalPostsCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [statusUpdatePost, setStatusUpdatePost] = useState<Post | null>(null);
  const [showReportedOnly, setShowReportedOnly] = useState(false);
  const [newStatus, setNewStatus] = useState("reported");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchParams] = useSearchParams();
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");
  const isMounted = useRef(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchApi = showReportedOnly ? getReportedActivities : getPosts;
      const result = await fetchApi({
        page: page - 1,
        limit: pageSize,
        type,
        search,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setPosts(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotalPostsCount(result.total || result.totalItems || 0);
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, pageSize, showReportedOnly, fromDate, toDate]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading && posts.length === 0) {
    return (
      <GlobalNetworkLoader
        title={loaderTitle}
        subtitle={loaderSubtitle}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {/* Single Row Header (fixed at top) */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border relative z-20">
        {/* Title Block */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">{title}</h1>
          </div>
        </div>

        {/* Search, Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            pressed={showReportedOnly}
            onPressedChange={setShowReportedOnly}
            variant="outline"
            className="h-9 gap-2 text-foreground hover:text-foreground hover:bg-slate-100 data-[state=on]:bg-red-50 data-[state=on]:text-red-700 data-[state=on]:border-red-200 data-[state=on]:hover:bg-red-100 data-[state=on]:hover:text-red-700"
          >
            <AlertTriangle size={16} className={showReportedOnly ? "text-red-500" : "text-muted-foreground"} />
            <span className="hidden sm:inline">Reported Posts</span>
          </Toggle>

          {/* Date Filters */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">From:</span>
              <Input
                key="tableFromDate"
                id="tableFromDate"
                name="tableFromDate"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-[142px] rounded-lg text-xs bg-background px-2"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">To:</span>
              <Input
                key="tableToDate"
                id="tableToDate"
                name="tableToDate"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 w-[142px] rounded-lg text-xs bg-background px-2"
              />
            </div>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8 pr-3 w-48 sm:w-64 rounded-lg border border-border bg-secondary/50 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60 transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-[13px] text-slate-700 bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
            <tr>
              <th className="px-6 py-4 font-semibold">S.No</th>
              <th className="px-6 py-4 font-semibold">Member Name</th>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Created Date</th>
              <th className="px-6 py-4 font-semibold text-center">Responsed Count</th>
              <th className="px-6 py-4 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && posts.length > 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-20 text-muted-foreground">
                  No records found matching your search.
                </td>
              </tr>
            ) : (
              posts.map((post: any, index) => (
                <tr key={post._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <PrivateAvatar
                        src={post.member?.profilePhoto}
                        fallbackName={post.member?.fullName || "Anonymous"}
                        className="h-9 w-9 border border-slate-200/80 flex-shrink-0 shadow-sm"
                        avatarImageClassName="object-cover"
                        avatarFallbackClassName="bg-primary/10 text-primary text-xs font-bold"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold leading-tight">{post.member?.fullName || "Anonymous"}</span>
                        {post.member?.businessName && (
                          <span className="text-[11px] text-muted-foreground font-medium mt-0.5 max-w-[180px] truncate" title={post.member.businessName}>
                            {post.member.businessName}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={post.title}>{post.title || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${post.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                      {post.status || "active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatDate(post.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 font-medium">{post.responsedCount || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => handleOpenPreview(post)} className="cursor-pointer gap-2">
                          <Eye size={14} className="text-blue-500" />
                          <span>View</span>
                        </DropdownMenuItem>
                        {!showReportedOnly && post.status !== "reported" && (
                          <DropdownMenuItem onClick={() => setStatusUpdatePost(post)} className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50">
                            <AlertTriangle size={14} />
                            <span>Report</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

      {/* Status Update Dialog */}
      <Dialog open={!!statusUpdatePost} onOpenChange={(open) => !open && setStatusUpdatePost(null)}>
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
                className="w-full p-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="active">Active</option>
                <option value="reported">Reported</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason <span className="text-muted-foreground font-normal">(Optional)</span></label>
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

      {/* Footer (fixed at bottom) */}
      {!loading && posts.length > 0 && (
        <div className="flex-shrink-0 pt-0 border-t border-border bg-background/80 backdrop-blur-sm z-10">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalPostsCount}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export const AskPage = () => (
  <GenericActivityTablePage
    type="ASK"
    title="Ask Activities"
    searchPlaceholder="Search asks..."
    icon={MessageSquare}
    loaderTitle="Loading Ask Activities..."
    loaderSubtitle="Connecting to community requests"
  />
);

export const GivePage = () => (
  <GenericActivityTablePage
    type="GIVE"
    title="Give Activities"
    searchPlaceholder="Search gives..."
    icon={Handshake}
    loaderTitle="Loading Give Activities..."
    loaderSubtitle="Connecting to community offers"
  />
);

export const PostPage = () => (
  <GenericActivityPage
    type="PROMOTION"
    title="Post Activities"
    searchPlaceholder="Search posts..."
    icon={Layout}
    loaderTitle="Loading Social Posts..."
    loaderSubtitle="Connecting to community updates"
  />
);

export const RequirementPage = () => (
  <GenericActivityPage
    type="REQUIREMENT"
    title="Requirement Activities"
    searchPlaceholder="Search requirements..."
    icon={ClipboardList}
    loaderTitle="Loading Requirements..."
    loaderSubtitle="Connecting to business requirements"
  />
);
