import { io, Socket } from "socket.io-client";

const getSocketUrl = () => {
  let apiUrl = (import.meta.env.VITE_API_URL || "").trim();
  if (!apiUrl) return "http://localhost:5001";

  if (apiUrl.startsWith("https//")) {
    apiUrl = apiUrl.replace("https//", "https://");
  } else if (apiUrl.startsWith("http//")) {
    apiUrl = apiUrl.replace("http//", "http://");
  } else if (!apiUrl.startsWith("http://") && !apiUrl.startsWith("https://") && !apiUrl.startsWith("ws://") && !apiUrl.startsWith("wss://")) {
    apiUrl = `https://${apiUrl}`;
  }

  // Strip path suffixes like /api/admin or /api
  let socketUrl = apiUrl.replace(/\/api\/admin\/?$/, "").replace(/\/api\/?$/, "").replace(/\/+$/, "");
  return socketUrl || "http://localhost:5001";
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  private socket: Socket | null = null;
  public onStatusChange: ((status: boolean) => void) | null = null;

  connect(userId: string, token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      this.socket?.emit("join", userId);
      this.socket?.emit("join_admin_room");
      this.onStatusChange?.(true);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.onStatusChange?.(false);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
