import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import socketService from "@/services/socket";

/**
 * Hook to synchronize permissions in real-time using Socket.io.
 * Listens for "permissionsUpdated" event and refreshes the global auth state.
 */
export const usePermissionsSync = () => {
  const { user, refreshPermissions, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handlePermissionsUpdate = async (data: any) => {
      console.log("Real-time update: Permissions modified", data);
      try {
        await refreshPermissions();
      } catch (error) {
        console.error("Failed to sync permissions:", error);
      }
    };

    // Listen for the event
    socketService.on("permissionsUpdated", handlePermissionsUpdate);

    // Cleanup on unmount
    return () => {
      socketService.off("permissionsUpdated", handlePermissionsUpdate);
    };
  }, [isAuthenticated, user, refreshPermissions]);

  return null;
};

export default usePermissionsSync;
