import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "@/services/api";
import socketService from "@/services/socket";
import { sidebarNavItems } from "@/config/navigation";

interface Permission {
  moduleId: string;
  actions: string[];
}

interface User {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  roleId: string;
  isActive: number | boolean;
  roleCode?: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  permissions: Permission[];
  login: (phoneNumber: string, pin: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPermission: (moduleId: string, action: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPermissions = useCallback(async (roleId: string) => {
    try {
      const [roleResponse, modulesResponse] = await Promise.all([
        api.get(`/roles/${roleId}`),
        api.get('/roles/modules')
      ]);

      if (modulesResponse.data && modulesResponse.data.data) {
        setModulesList(modulesResponse.data.data);
      }

      if (roleResponse.data) {
        if (roleResponse.data.permissions) {
          setPermissions(roleResponse.data.permissions);
        }
        if (roleResponse.data.code) {
          setUser(prev => {
            if (!prev) return null;
            return { ...prev, roleCode: roleResponse.data.code };
          });
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              parsed.roleCode = roleResponse.data.code;
              localStorage.setItem("user", JSON.stringify(parsed));
            } catch (e) {
              console.error("Error updating cached roleCode:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch permissions/modules:", error);
    } finally {
      setPermissionsLoaded(true);
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (user?.roleId) {
      await fetchPermissions(user.roleId);
    }
  }, [user?.roleId, fetchPermissions]);

  const hasPermission = useCallback((moduleId: string, action: string) => {
    if (!moduleId) return false;
    // If no permissions loaded, deny by default
    if (!permissions || permissions.length === 0) return false;

    const normalizedReq = moduleId.toLowerCase().replace(/[\s_]+/g, "");

    // Find the target module in modulesList
    const targetModule = modulesList.find(m => {
      const slugNorm = String(m.slugName || "").toLowerCase().replace(/[\s_]+/g, "");
      const nameNorm = String(m.name || "").toLowerCase().replace(/[\s_]+/g, "");
      return slugNorm === normalizedReq ||
             nameNorm === normalizedReq ||
             slugNorm === normalizedReq.replace(/s$/, "") ||
             normalizedReq === slugNorm.replace(/s$/, "");
    });

    // If modulesList is populated, and targetModule is NOT found in modulesList, module does NOT exist -> deny!
    if (modulesList.length > 0 && !targetModule) {
      return false;
    }

    const modulePerm = permissions.find(p => {
      // 1. Match by module's ObjectId (preferred format)
      if (targetModule && String(p.moduleId) === String(targetModule._id)) {
        return true;
      }
      // 2. Match by targetModule's slugName or name
      if (targetModule) {
        const pStr = String(p.moduleId).toLowerCase().replace(/[\s_]+/g, "");
        const slugNorm = String(targetModule.slugName || "").toLowerCase().replace(/[\s_]+/g, "");
        const nameNorm = String(targetModule.name || "").toLowerCase().replace(/[\s_]+/g, "");
        if (pStr === slugNorm || pStr === nameNorm) return true;
      }
      // 3. Fallback raw string matching against requested moduleId
      const pModStr = String(p.moduleId).toLowerCase().replace(/[\s_]+/g, "");
      return pModStr === normalizedReq ||
             pModStr === normalizedReq.replace(/s$/, "") ||
             normalizedReq === pModStr.replace(/s$/, "");
    });

    if (!modulePerm) return false;

    return Array.isArray(modulePerm.actions) && modulePerm.actions.includes(action.toLowerCase());
  }, [permissions, modulesList]);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("accessToken");

      if (storedUser && storedToken) {

        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAccessToken(storedToken);

          // Connect socket on restore with token
          socketService.connect(parsedUser.id, storedToken);

          // Fetch fresh user data to see if role or status changed

          const userResponse = await api.get(`/admin-users/${parsedUser.id}`);
          const freshUser = userResponse.data;

          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem("user", JSON.stringify(freshUser));

            // Now fetch fresh permissions for the current role
            await fetchPermissions(freshUser.roleId);
          } else {
            // Fallback to stored roleId if profile fetch fails
            await fetchPermissions(parsedUser.roleId);
          }

        } catch (error: any) {
          console.error("Failed to restore session or sync data:", error);
          // Only logout if it's a 401 unauthorized error
          if (error.response?.status === 401) {
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchPermissions]);

  // Listen for real-time permission updates from the socket
  useEffect(() => {
    if (!user || !accessToken) return;

    const handlePermissionsUpdated = async (data: any) => {
      console.log("🔒 Permissions updated via Socket. Refreshing...", data);
      await refreshPermissions();
    };

    socketService.on("permissionsUpdated", handlePermissionsUpdated);
    return () => {
      socketService.off("permissionsUpdated", handlePermissionsUpdated);
    };
  }, [user, accessToken, refreshPermissions]);

  // Route protection redirect check when permissions, route path, or modules load
  useEffect(() => {
    if (!user || !permissions || permissions.length === 0 || modulesList.length === 0) return;

    const currentPath = location.pathname;
    // Don't run checks on login page
    if (currentPath === "/login") return;

    let currentModuleId: string | undefined = undefined;

    // Find if the current path matches any navigation item
    for (const item of sidebarNavItems) {
      if (item.children) {
        const matchingChild = item.children.find(child => {
          if (!child.path) return false;
          // Match exact path or subpaths (e.g. edit/detail pages)
          return currentPath === child.path || currentPath.startsWith(child.path + "/");
        });
        if (matchingChild) {
          currentModuleId = matchingChild.moduleId || item.moduleId;
          break;
        }
      }
      if (item.path) {
        if (currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path + "/"))) {
          currentModuleId = item.moduleId;
          break;
        }
      }
    }

    // Custom check: if the user is on the root path "/", they will be handled by LandingRoute in App.tsx.
    if (currentPath === "/") return;

    // If current path matches a module, but user no longer has "view" permission for it
    if (currentModuleId && !hasPermission(currentModuleId, "view")) {
      // Find the first permitted module path
      let firstPermittedPath = "";
      for (const item of sidebarNavItems) {
        if (item.children) {
          const allowedChild = item.children.find(child => !child.moduleId || hasPermission(child.moduleId, "view"));
          if (allowedChild) {
            firstPermittedPath = allowedChild.path;
            break;
          }
        } else if (item.moduleId && hasPermission(item.moduleId, "view") && item.path) {
          firstPermittedPath = item.path;
          break;
        }
      }

      if (firstPermittedPath && currentPath !== firstPermittedPath) {
        console.warn(`🛑 Revoked access to: ${currentPath}. Redirecting to first permitted page: ${firstPermittedPath}`);
        navigate(firstPermittedPath, { replace: true });
      }
    }
  }, [permissions, modulesList, user, location.pathname, navigate, hasPermission]);


  const login = async (phoneNumber: string, pin: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post("/auth/login", {
        phoneNumber,
        pin,
      });

      if (response.data.accessToken) {
        const { accessToken, user } = response.data;

        setIsLoading(true);

        // Persist session basic info so API client can use it for requests
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken);

        try {
          // Fetch granular permissions
          await fetchPermissions(user.roleId);
        } catch (err) {
          console.error("Failed to load permissions during login", err);
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          setIsLoading(false);
          return { success: false, message: "Failed to load permissions. Please try again." };
        }

        // Store in state (this triggers the route change)
        setUser(user);
        setAccessToken(accessToken);

        // Connect socket on login with token
        socketService.connect(user.id, accessToken);

        setIsLoading(false);

        return { success: true, message: response.data.message || "Login successful" };
      }
      return { success: false, message: response.data.message || "Login failed" };
    } catch (error: any) {
      console.error("Login failed:", error);
      const errorMsg = error.response?.data?.message || "Login failed. Please try again.";
      setIsLoading(false);
      return {
        success: false,
        message: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg
      };
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await api.post("/auth/logout");
      }
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      setUser(null);
      setAccessToken(null);
      setPermissions([]);
      setPermissionsLoaded(false);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");

      // Disconnect socket on logout

      socketService.disconnect();

      navigate("/login", { replace: true });
    }
  };


  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      permissions,
      login,
      logout,
      isLoading: isLoading || (!!accessToken && !permissionsLoaded),
      isAuthenticated: !!accessToken,
      hasPermission,
      refreshPermissions
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


