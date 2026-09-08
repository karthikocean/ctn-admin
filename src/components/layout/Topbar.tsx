import { Bell, Menu, User, LogOut, Settings, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileDialog from "../profile/ProfileDialog";
import { useEffect, useState } from "react";
import socketService from "@/services/socket";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

interface NotificationItem {
  _id: string;
  sub: string;
  msg: string;
  isRead: boolean;
  createdAt: string;
  moduleName?: string;
  moduleId?: string;
}

const Topbar = ({ onMobileMenuToggle }: TopbarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isRinging, setIsRinging] = useState(false);

  const fetchUnreadCountAndNotifications = async () => {
    try {
      const [countRes, listRes] = await Promise.allSettled([
        api.get("/push-notification/unread-count"),
        api.get("/push-notification/details?limit=5")
      ]);

      if (countRes.status === "fulfilled" && countRes.value.data?.data?.unreadCount !== undefined) {
        setUnreadCount(countRes.value.data.data.unreadCount);
      }

      if (listRes.status === "fulfilled" && listRes.value.data?.data) {
        const rawItems = Array.isArray(listRes.value.data.data) 
          ? listRes.value.data.data 
          : listRes.value.data.data.data || [];
        
        const seen = new Set<string>();
        const items = rawItems.filter((item: any) => {
          const key = item.moduleId ? `${item.moduleName}_${item.moduleId}` : item._id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setNotifications(items);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    // Sync initial socket status
    setIsSocketConnected(socketService.isConnected());

    socketService.onStatusChange = (status) => {
      setIsSocketConnected(status);
    };

    fetchUnreadCountAndNotifications();

    // Socket Event: Incoming admin notification
    const handleIncomingNotification = (data: any) => {
      console.log("🔔 [Topbar Socket] Incoming notification:", data);

      const moduleName = data.moduleName || (data.title ? "SUGGESTION" : "GENERAL");
      const newItem: NotificationItem = {
        _id: data._id || data.suggestionId || String(Date.now()),
        sub: data.sub || (data.title ? `New Suggestion: ${data.title}` : `New ${moduleName}`),
        msg: data.msg || data.description || data.content || "",
        isRead: false,
        createdAt: new Date().toISOString(),
        moduleName,
        moduleId: data.moduleId || data.suggestionId,
      };

      setNotifications((prev) => {
        const isDuplicate = prev.some(
          (n) =>
            n._id === newItem._id ||
            (newItem.moduleId && n.moduleId === newItem.moduleId && n.moduleName === newItem.moduleName)
        );
        if (isDuplicate) return prev;

        setIsRinging(true);
        setTimeout(() => setIsRinging(false), 2000);
        setUnreadCount((c) => c + 1);

        return [newItem, ...prev.slice(0, 4)];
      });
    };

    // Socket Event: Unread count update from backend
    const handleUnreadCount = (data: { unreadCount: number }) => {
      if (data?.unreadCount !== undefined) {
        setUnreadCount(data.unreadCount);
      }
    };

    socketService.on("new_admin_notification", handleIncomingNotification);
    socketService.on("admin_unread_count", handleUnreadCount);
    socketService.on("unread_count", handleUnreadCount);
    socketService.on("unread_count_update", handleUnreadCount);

    return () => {
      socketService.onStatusChange = null;
      socketService.off("new_admin_notification", handleIncomingNotification);
      socketService.off("admin_unread_count", handleUnreadCount);
      socketService.off("unread_count", handleUnreadCount);
      socketService.off("unread_count_update", handleUnreadCount);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/push-notification/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  if (!user) return null;

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "SA";

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-10 h-10 rounded-2xl bg-slate-100/80 hover:bg-slate-200/80 transition-all flex items-center justify-center relative cursor-pointer text-slate-700"
                aria-label="Notifications"
              >
                <Bell
                  size={20}
                  className={cn(
                    "transition-transform",
                    isRinging && "animate-bounce text-primary"
                  )}
                />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-xl border-slate-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((item) => {
                    const mod = (item.moduleName || "").toUpperCase();
                    let badgeLabel = "Notification";
                    let badgeColor = "bg-slate-100 text-slate-700";
                    if (mod === "ENQUIRY") {
                      badgeLabel = "Enquiry";
                      badgeColor = "bg-sky-100 text-sky-700";
                    } else if (mod === "SUPPORT") {
                      badgeLabel = "Support";
                      badgeColor = "bg-indigo-100 text-indigo-700";
                    } else if (mod === "SUGGESTION") {
                      badgeLabel = "Help Center";
                      badgeColor = "bg-amber-100 text-amber-700";
                    } else if (mod === "FRANCHISE_APPLICATION") {
                      badgeLabel = "Franchise Application";
                      badgeColor = "bg-amber-100 text-amber-800";
                    }

                    return (
                      <div
                        key={item._id}
                        onClick={() => {
                          if (!item.isRead) {
                            api.put("/push-notification/read", { notificationIds: [item._id] }).catch(() => {});
                            setNotifications((prev) =>
                              prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
                            );
                            setUnreadCount((prev) => Math.max(0, prev - 1));
                          }

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
                            navigate("/notifications", { state: { item } });
                          }
                        }}
                        className={cn(
                          "p-3 hover:bg-slate-50 cursor-pointer transition-colors space-y-1",
                          !item.isRead && "bg-blue-50/40"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide", badgeColor)}>
                              {badgeLabel}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {item.sub}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {item.msg}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                <button
                  onClick={() => navigate("/notifications")}
                  className="text-xs font-semibold text-primary hover:underline transition-colors"
                >
                  View All Notifications
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 p-1 rounded-full hover:bg-secondary/60 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#003B73] flex items-center justify-center text-white text-xs font-bold uppercase shadow-xs">
                  {initials}
                </div>
                <span className="hidden md:block text-sm font-semibold text-slate-800">
                  {user.name}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-slate-200">
              <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                <User size={16} className="mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings size={16} className="mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500 cursor-pointer" onClick={logout}>
                <LogOut size={16} className="mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        user={user as any}
      />
    </header>
  );
};

export default Topbar;
