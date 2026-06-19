import { Bell, Menu, User, LogOut, Settings, Radio } from "lucide-react";
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

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

const Topbar = ({ onMobileMenuToggle }: TopbarProps) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    // Sync initial status
    setIsSocketConnected(socketService.isConnected());

    // Listen for changes
    socketService.onStatusChange = (status) => {
      setIsSocketConnected(status);
    };

    return () => {
      socketService.onStatusChange = null;
    };
  }, []);

  if (!user) return null;

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

        <div className="flex items-center gap-2 md:gap-3">
          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-secondary transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </button>

          {/* Profile */}
          <div className="flex items-center gap-1 mr-1">
            {/* <div className={cn(
              "w-2 h-2 rounded-full",
              isSocketConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500"
            )} /> */}
            {/* <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-tighter">
              {isSocketConnected ? "Live" : "Offline"}
            </span> */}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {user.name?.charAt(0)}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium">{user.name}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                <User size={16} className="mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem><Settings size={16} className="mr-2" /> Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-accent" onClick={logout}>
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
