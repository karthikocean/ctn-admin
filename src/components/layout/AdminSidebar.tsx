import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, ChevronLeft, Globe } from "lucide-react";
import { sidebarNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png";

interface AdminSidebarProps {
  mobileOpen: boolean;
  isCollapsed: boolean;
  onMobileClose: () => void;
  onToggleCollapse: () => void;
}

const AdminSidebar = ({ mobileOpen, isCollapsed, onMobileClose, onToggleCollapse }: AdminSidebarProps) => {
  const location = useLocation();
  const { hasPermission } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (title: string) => {
    if (isCollapsed) {
      onToggleCollapse(); // Expand if collapsed when trying to open a group
    }
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(i => i !== title) : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (item: typeof sidebarNavItems[0]) =>
    item.children?.some(c => location.pathname === c.path) || (item.path && location.pathname === item.path);

  const filteredNavItems = sidebarNavItems.filter(item => {
    if (!item.moduleId) return true;
    const canViewParent = hasPermission(item.moduleId, "view");
    if (item.children) {
      const accessibleChildren = item.children.filter(child =>
        !child.moduleId || hasPermission(child.moduleId, "view")
      );
      return canViewParent && (accessibleChildren.length > 0 || !!item.path);
    }
    return canViewParent;
  }).map(item => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child => !child.moduleId || hasPermission(child.moduleId, "view"))
      };
    }
    return item;
  });

  const sidebarContent = (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-20" : "w-[260px]"
    )}>
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-sidebar-border relative">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md overflow-hidden p-1.5">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="font-bold text-sm text-sidebar-foreground leading-none">Trusted</span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider mt-1">Admin Panel</span>
            </motion.div>
          )}
        </Link>

        {/* Collapse Toggle Button (Desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card border border-border rounded-full items-center justify-center shadow-sm hover:bg-secondary transition-colors z-50"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
        </button>

        <button onClick={onMobileClose} className="lg:hidden text-sidebar-foreground p-2">
          <X size={20} />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 no-scrollbar">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const active = isGroupActive(item);
          const expanded = expandedItems.includes(item.title);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.title} className="relative group">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(item.title)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon size={20} className={cn("flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left text-[14px] font-semibold truncate">{item.title}</span>
                      <ChevronDown
                        size={14}
                        className={cn("transition-transform duration-200 opacity-50", expanded && "rotate-180")}
                      />
                    </>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md whitespace-nowrap">
                      {item.title}
                    </div>
                  )}
                </button>
              ) : item.path ? (
                <Link
                  to={item.path}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon size={20} className={cn("flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground")} />
                  {!isCollapsed && <span className="text-[14px] font-semibold truncate">{item.title}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md whitespace-nowrap">
                      {item.title}
                    </div>
                  )}
                </Link>
              ) : null}

              <AnimatePresence>
                {hasChildren && expanded && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden ml-9 mt-1 space-y-1 border-l-2 border-sidebar-border/50 pl-2"
                  >
                    {item.children!.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={onMobileClose}
                        className={cn(
                          "block px-3 py-2 rounded-lg text-[13px] transition-all duration-200",
                          isActive(child.path)
                            ? "text-primary font-bold bg-primary/5"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 font-medium"
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Support / Bottom Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
          <div className="rounded-xl bg-[#0d2b6b]/5 p-3">
            <p className="text-[11px] font-bold text-[#0d2b6b]/60 uppercase tracking-widest">Enterprise Support</p>
            <p className="text-[10px] text-muted-foreground mt-1">Need help? Contact our dedicated admin support team.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen z-40">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-screen z-[60] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
