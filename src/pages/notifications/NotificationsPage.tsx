import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  HelpCircle,
  Headset,
  MessageSquare,
  FileText,
  Search,
  Check,
  CheckCheck,
  ExternalLink,
  Clock,
  User,
  Phone,
  Mail,
  RefreshCw,
  Sparkles,
  Inbox,
  Filter,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PaginationBar from "@/components/common/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import socketService from "@/services/socket";
import {
  getAdminNotifications,
  getAdminUnreadCount,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  AdminNotification
} from "@/api/PushNotificationApi";
import { format, formatDistanceToNow } from "date-fns";

const MODULE_TABS = [
  { key: "ALL", label: "All Modules", icon: Bell },
  { key: "ENQUIRY", label: "Enquiries", icon: MessageSquare, badgeColor: "bg-sky-50 text-sky-700 border-sky-200" },
  { key: "SUPPORT", label: "Support", icon: Headset, badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { key: "SUGGESTION", label: "Help Center", icon: HelpCircle, badgeColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "FRANCHISE_APPLICATION", label: "Franchise Applications", icon: FileText, badgeColor: "bg-amber-100/90 text-amber-900 border-amber-300" },
];

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // 'all' | 'unread' | 'read'
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Counts
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page on filter changes
  useEffect(() => {
    setPage(0);
  }, [selectedModule, statusFilter, debouncedSearch]);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 10,
      };

      if (selectedModule && selectedModule !== "ALL") {
        params.moduleName = selectedModule;
      }
      if (statusFilter === "unread") {
        params.isRead = false;
      } else if (statusFilter === "read") {
        params.isRead = true;
      }
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      const response = await getAdminNotifications(params);
      const rawList = response?.data || response?.items || (Array.isArray(response) ? response : []);
      
      const seen = new Set<string>();
      const list = rawList.filter((item: any) => {
        const key = item.moduleId ? `${item.moduleName}_${item.moduleId}` : item._id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setNotifications(list);

      if (response?.pagination) {
        setTotalPages(response.pagination.totalPages || 1);
        setTotalCount(response.pagination.total || 0);
      } else {
        setTotalPages(response?.totalPages || Math.ceil((response?.total || list.length) / 10) || 1);
        setTotalCount(response?.total !== undefined ? response.total : list.length);
      }
    } catch (error: any) {
      console.error("Failed to load notifications:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, selectedModule, statusFilter, debouncedSearch, toast]);

  // Fetch Unread Count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getAdminUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to get unread count:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Socket Listener for Realtime Notifications
  useEffect(() => {
    const handleIncomingNotification = (data: any) => {
      console.log("🔔 [NotificationsPage Socket] New event:", data);
      fetchUnreadCount();

      // Prepend or refresh list if it matches current filter
      const moduleName = data.moduleName || (data.title ? "SUGGESTION" : "GENERAL");
      if (selectedModule === "ALL" || selectedModule === moduleName) {
        const newItem: AdminNotification = {
          _id: data._id || String(Date.now()),
          sub: data.sub || data.title || `New ${moduleName}`,
          msg: data.msg || data.content || data.description || "",
          moduleName,
          moduleId: data.moduleId || data.suggestionId,
          name: data.name,
          phone: data.phone || data.phoneNumber,
          email: data.email,
          isRead: false,
          createdAt: new Date().toISOString(),
          sender: data.sender || null,
        };

        setNotifications((prev) => {
          const isDuplicate = prev.some(
            (n) =>
              n._id === newItem._id ||
              (newItem.moduleId && n.moduleId === newItem.moduleId && n.moduleName === newItem.moduleName)
          );
          if (isDuplicate) return prev;
          setTotalCount((cnt) => cnt + 1);
          return [newItem, ...prev.slice(0, 9)];
        });
      }

      toast({
        title: `New Notification: ${data.sub || data.title || moduleName}`,
        description: data.msg || data.content || data.description || "You received a new update.",
      });
    };

    const handleUnreadCountUpdate = (data: { unreadCount: number }) => {
      if (data?.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    };

    socketService.on("new_admin_notification", handleIncomingNotification);
    socketService.on("admin_unread_count", handleUnreadCountUpdate);
    socketService.on("unread_count", handleUnreadCountUpdate);
    socketService.on("unread_count_update", handleUnreadCountUpdate);

    return () => {
      socketService.off("new_admin_notification", handleIncomingNotification);
      socketService.off("admin_unread_count", handleUnreadCountUpdate);
      socketService.off("unread_count", handleUnreadCountUpdate);
      socketService.off("unread_count_update", handleUnreadCountUpdate);
    };
  }, [selectedModule, fetchUnreadCount, toast]);

  // Actions
  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to mark all as read",
        variant: "destructive",
      });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkSingleRead = async (e: React.MouseEvent, item: AdminNotification) => {
    e.stopPropagation();
    if (item.isRead) return;

    try {
      await markNotificationsAsRead([item._id]);
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark single read:", err);
    }
  };

  // Redirect to Particular Module Details
  const handleItemClick = (item: AdminNotification) => {
    if (!item.isRead) {
      markNotificationsAsRead([item._id]).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    const mod = (item.moduleName || "").toUpperCase();
    const id = item.moduleId || item._id;

    if (mod === "ENQUIRY") {
      navigate(`/enquiries?id=${id}`, { state: { item } });
    } else if (mod === "SUPPORT") {
      navigate(`/support?id=${id}`, { state: { item } });
    } else if (mod === "SUGGESTION") {
      navigate(`/help-center?id=${id}`, { state: { item } });
    } else if (mod === "FRANCHISE_APPLICATION") {
      navigate(`/franchise-applications?id=${id}`, { state: { item } });
    } else {
      // Default fallback
      navigate("/notifications", { state: { item } });
    }
  };

  const getModuleConfig = (moduleName: string) => {
    const mod = (moduleName || "").toUpperCase();
    if (mod === "ENQUIRY") {
      return {
        label: "Website Enquiry",
        icon: MessageSquare,
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
        iconBg: "bg-sky-100 text-sky-600",
        redirectPath: "/enquiries",
      };
    }
    if (mod === "SUPPORT") {
      return {
        label: "Support Request",
        icon: Headset,
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
        iconBg: "bg-indigo-100 text-indigo-600",
        redirectPath: "/support",
      };
    }
    if (mod === "FRANCHISE_APPLICATION") {
      return {
        label: "Franchise Application",
        icon: FileText,
        badgeClass: "bg-amber-100/90 text-amber-900 border-amber-300",
        iconBg: "bg-amber-100 text-amber-800",
        redirectPath: "/franchise-applications",
      };
    }
    // SUGGESTION / HELPCENTER
    return {
      label: "Help Center",
      icon: HelpCircle,
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      iconBg: "bg-amber-100 text-amber-600",
      redirectPath: "/help-center",
    };
  };

  const getRelativeTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-xs">
            <Bell size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live notifications for Enquiries, Support tickets, and Help Center suggestions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              fetchNotifications();
              fetchUnreadCount();
            }}
            disabled={loading || refreshing}
            className="h-10 px-3.5 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs cursor-pointer font-medium"
          >
            <RefreshCw size={15} className={cn("mr-1.5 text-slate-500", (loading || refreshing) && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || isMarkingAll}
            className="h-10 px-4 rounded-xl font-semibold shadow-sm"
          >
            <CheckCheck size={16} className="mr-1.5" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Module Tabs & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        {/* Module Nav Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
          {MODULE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedModule === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedModule(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  isSelected
                    ? "bg-[#003B73] text-white shadow-md shadow-primary/20 scale-[1.02]"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                )}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Read Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-slate-700"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Filter size={13} /> Filter:
            </span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-xs rounded-xl border-slate-200 bg-slate-50">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-16 rounded-2xl border border-slate-100 text-center shadow-xs flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs font-medium text-slate-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-14 rounded-2xl border border-slate-100 text-center shadow-xs flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Inbox size={30} />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No Notifications Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {statusFilter === "unread"
                ? "You have caught up with all notifications! Nothing unread."
                : "No notifications match your current filter criteria."}
            </p>
            {(selectedModule !== "ALL" || statusFilter !== "all" || debouncedSearch) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedModule("ALL");
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
                className="mt-4 rounded-xl text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((item) => {
              const config = getModuleConfig(item.moduleName);
              const Icon = config.icon;
              const senderName = item.sender?.fullName || item.name;
              const senderContact = item.sender?.mobileNumber || item.phone || item.email;

              return (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "group relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs hover:shadow-md hover:border-slate-300",
                    !item.isRead
                      ? "border-primary/30 bg-gradient-to-r from-blue-50/40 via-white to-white"
                      : "border-slate-100 opacity-90 hover:opacity-100"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Module Icon */}
                    <div
                      className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 shadow-xs",
                        config.iconBg
                      )}
                    >
                      <Icon size={20} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                              config.badgeClass
                            )}
                          >
                            {config.label}
                          </span>

                          {!item.isRead && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                              Unread
                            </span>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={12} />
                          <span>{item.createdAt ? getRelativeTime(item.createdAt) : ""}</span>
                          <span className="hidden sm:inline text-slate-300">•</span>
                          <span className="hidden sm:inline">
                            {item.createdAt ? format(new Date(item.createdAt), "MMM d, h:mm a") : ""}
                          </span>
                        </div>
                      </div>

                      {/* Subject */}
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                        {item.sub || "Notification Alert"}
                      </h3>

                      {/* Message body */}
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {item.msg}
                      </p>

                      {/* Contact / Sender meta */}
                      {(senderName || senderContact) && (
                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                          {senderName && (
                            <div className="flex items-center gap-1 font-semibold text-slate-700">
                              <User size={13} className="text-slate-400" />
                              <span>{senderName}</span>
                            </div>
                          )}
                          {(item.phone || item.sender?.mobileNumber) && (
                            <div className="flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" />
                              <span>{item.phone || item.sender?.mobileNumber}</span>
                            </div>
                          )}
                          {item.email && (
                            <div className="flex items-center gap-1">
                              <Mail size={12} className="text-slate-400" />
                              <span>{item.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-center">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkSingleRead(e, item)}
                          title="Mark as read"
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                        >
                          <Check size={14} />
                        </button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleItemClick(item);
                        }}
                        className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1 group-hover:bg-primary group-hover:text-white transition-all shadow-xs"
                      >
                        <span>Details</span>
                        <ExternalLink size={12} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <PaginationBar
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
