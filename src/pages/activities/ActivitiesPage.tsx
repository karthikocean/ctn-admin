import { useState, useEffect, useRef } from "react";
import { Search, Filter, MessageSquare, Handshake, Layout, ClipboardList, Loader2, Eye, AlertTriangle, MoreVertical } from "lucide-react";
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
  const [showReportedOnly, setShowReportedOnly] = useState(false);
  const [statusUpdatePost, setStatusUpdatePost] = useState<Post | null>(null);
  const [newStatus, setNewStatus] = useState("reported");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const isMounted = useRef(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchApi = showReportedOnly ? getReportedActivities : getPosts;
      const result = await fetchApi({
        page: page - 1,
        limit: 12, // 4 per row layout
        type,
        search,
      });
      setPosts(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(`Error fetching ${type} posts:`, error);
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

  const handleReload = () => {
    if (search !== "") {
      setSearch("");
    } else if (showReportedOnly) {
      setShowReportedOnly(false);
    } else if (page !== 1) {
      setPage(1);
    } else {
      fetchPosts();
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, showReportedOnly]);

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

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {loading && posts.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title={loaderTitle}
          subtitle={loaderSubtitle}
        />
      )}

      {/* Single Row Header (fixed at top) */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
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
        <div className="flex items-center gap-3">
          <Toggle
            pressed={showReportedOnly}
            onPressedChange={setShowReportedOnly}
            variant="outline"
            className="h-9 gap-2 data-[state=on]:bg-red-50 data-[state=on]:text-red-700 data-[state=on]:border-red-200"
          >
            <AlertTriangle size={16} className={showReportedOnly ? "text-red-500" : "text-muted-foreground"} />
            <span className="hidden sm:inline">Reported Posts</span>
          </Toggle>

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

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs" onClick={handleReload}>
            <Filter size={14} className="mr-1.5" />
            Reload
          </Button>
        </div>
      </div>

      {/* Scrollable Middle Area containing Grid of Cards */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 py-1">
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
              <PostCard key={post._id} post={post} onReport={(p) => setStatusUpdatePost(p)} />
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

      {/* Footer (fixed at bottom) */}
      {!loading && posts.length > 0 && (
        <div className="flex-shrink-0 pt-0 border-t border-border bg-background/80 backdrop-blur-sm z-10">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [statusUpdatePost, setStatusUpdatePost] = useState<Post | null>(null);
  const [showReportedOnly, setShowReportedOnly] = useState(false);
  const [newStatus, setNewStatus] = useState("reported");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const pageSize = 15; // default page size for table
  const isMounted = useRef(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchApi = showReportedOnly ? getReportedActivities : getPosts;
      const result = await fetchApi({
        page: page - 1,
        limit: pageSize,
        type,
        search,
      });
      setPosts(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error(`Error fetching ${type} posts:`, error);
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

  const handleReload = () => {
    if (search !== "") {
      setSearch("");
    } else if (showReportedOnly) {
      setShowReportedOnly(false);
    } else if (page !== 1) {
      setPage(1);
    } else {
      fetchPosts();
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, showReportedOnly]);

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

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 space-y-4 max-w-[1600px] mx-auto relative overflow-hidden">
      {loading && posts.length === 0 && (
        <GlobalNetworkLoader
          fullScreen={false}
          title={loaderTitle}
          subtitle={loaderSubtitle}
        />
      )}

      {/* Single Row Header (fixed at top) */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
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
        {/* Search, Filters */}
        <div className="flex items-center gap-3">
          <Toggle
            pressed={showReportedOnly}
            onPressedChange={setShowReportedOnly}
            variant="outline"
            className="h-9 gap-2 data-[state=on]:bg-red-50 data-[state=on]:text-red-700 data-[state=on]:border-red-200"
          >
            <AlertTriangle size={16} className={showReportedOnly ? "text-red-500" : "text-muted-foreground"} />
            <span className="hidden sm:inline">Reported Posts</span>
          </Toggle>

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

          <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs" onClick={handleReload}>
            <Filter size={14} className="mr-1.5" />
            Reload
          </Button>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-[13px] text-slate-700 bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
            <tr>
              <th className="px-6 py-4 font-semibold">S.No</th>
              <th className="px-6 py-4 font-semibold">Member Name</th>
              <th className="px-6 py-4 font-semibold">Title</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Created Date</th>
              <th className="px-6 py-4 font-semibold text-center">Responsed Count</th>
              <th className="px-6 py-4 font-semibold text-center">Shared Count</th>
              <th className="px-6 py-4 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && posts.length > 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20 text-muted-foreground">
                  No records found matching your search.
                </td>
              </tr>
            ) : (
              posts.map((post: any, index) => (
                <tr key={post._id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">{post.member?.fullName || "Anonymous"}</td>
                  <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate" title={post.title}>{post.title || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${post.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                      {post.status || "active"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{formatDate(post.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 font-medium">{post.responsedCount || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-slate-600 font-medium">{post.sharedCount || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => setSelectedPost(post)} className="cursor-pointer gap-2">
                          <Eye size={14} className="text-blue-500" />
                          <span>View</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusUpdatePost(post)} className="cursor-pointer gap-2 text-red-600 focus:text-red-700 focus:bg-red-50">
                          <AlertTriangle size={14} />
                          <span>Report</span>
                        </DropdownMenuItem>
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
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">{title} Details</DialogTitle>
            <DialogDescription>
              View the details of the selected post below.
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-6">
              {/* Member Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Avatar className="h-14 w-14">
                  {selectedPost.member?.profilePhoto ? (
                    <AvatarImage src={`http://localhost:4000${selectedPost.member.profilePhoto}`} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                    {getInitials(selectedPost.member?.fullName || "A")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 leading-tight">
                    {selectedPost.member?.fullName || "Anonymous"}
                  </h3>
                  {selectedPost.member?.businessName && (
                    <p className="text-sm text-blue-700 font-medium mt-0.5">
                      {selectedPost.member.businessName}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Posted on {formatDate(selectedPost.createdAt)}
                  </p>
                </div>
              </div>

              {/* Post Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-xl text-slate-900">{selectedPost.title}</h4>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {selectedPost.type}
                      </Badge>
                      <Badge variant="outline" className={selectedPost.status === "active" ? "border-green-200 text-green-700" : ""}>
                        {(selectedPost.status || "active").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedPost.description}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MessageSquare size={18} className="text-slate-400" />
                    <span className="font-medium">{selectedPost.responsedCount || 0} Responses</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Handshake size={18} className="text-slate-400" />
                    <span className="font-medium">{selectedPost.sharedCount || 0} Shares</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
