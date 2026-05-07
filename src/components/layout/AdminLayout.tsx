import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import Topbar from "./Topbar";
import { cn } from "@/lib/utils";
import usePermissionsSync from "@/hooks/usePermissionsSync";


const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Activate real-time permission synchronization
  usePermissionsSync();
  
  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
      <AdminSidebar
        mobileOpen={mobileOpen}
        isCollapsed={isCollapsed}
        onMobileClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        isCollapsed ? "lg:ml-20" : "lg:ml-[260px]"
      )}>
        <Topbar onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>

      </div>
    </div>
  );
};


export default AdminLayout;
