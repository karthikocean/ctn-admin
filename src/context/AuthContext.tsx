import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import socketService from "@/services/socket";

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
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  permissions: Permission[];
  login: (phoneNumber: string, pin: string) => Promise<boolean>;
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
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPermissions = useCallback(async (roleId: string) => {
    try {
      const response = await api.get(`/roles/${roleId}`);
      if (response.data && response.data.permissions) {
        setPermissions(response.data.permissions);
        localStorage.setItem("permissions", JSON.stringify(response.data.permissions));
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("accessToken");
      const storedPermissions = localStorage.getItem("permissions");

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAccessToken(storedToken);
          
          // Connect socket on restore with token
          socketService.connect(parsedUser.id, storedToken);
          
          if (storedPermissions) {
            setPermissions(JSON.parse(storedPermissions));
          } else {
            // If no permissions stored but we have user, fetch them
            await fetchPermissions(parsedUser.roleId);
          }
        } catch (error) {
          console.error("Failed to restore session:", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [fetchPermissions]);

  const login = async (phoneNumber: string, pin: string): Promise<boolean> => {
    try {
      const response = await api.post("/auth/login", {
        phoneNumber,
        pin,
      });

      if (response.data.accessToken) {
        const { accessToken, user } = response.data;
        
        // Store in state
        setUser(user);
        setAccessToken(accessToken);
        
        // Persist session basic info
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("accessToken", accessToken);
        
        // Connect socket on login with token
        socketService.connect(user.id, accessToken);
        
        // Fetch granular permissions
        await fetchPermissions(user.roleId);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
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
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("permissions");
      
      // Disconnect socket on logout
      socketService.disconnect();
      
      navigate("/login", { replace: true });
    }
  };

  const refreshPermissions = async () => {
    if (user?.roleId) {
      await fetchPermissions(user.roleId);
    }
  };

  const hasPermission = useCallback((moduleId: string, action: string) => {
    // If no permissions loaded, deny by default
    if (!permissions.length) return false;
    
    const modulePerm = permissions.find(p => p.moduleId === moduleId);
    if (!modulePerm) return false;
    
    return modulePerm.actions.includes(action);
  }, [permissions]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      accessToken, 
      permissions,
      login, 
      logout, 
      isLoading, 
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


