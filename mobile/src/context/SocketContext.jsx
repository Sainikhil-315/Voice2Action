// src/context/SocketContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import Toast from 'react-native-toast-message';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Extract userId to prevent reference changes
  const userId = useMemo(() => user?.id, [user?.id]);
  const userName = useMemo(() => user?.name, [user?.name]);
  const userRole = useMemo(() => user?.role, [user?.role]);

  // ✅ FIX: Get the correct backend URL
  const getSocketURL = () => {
    // In production, use process.env or fallback
    if (process.env.NODE_ENV === 'production') {
      return process.env.API_URL || 'https://voice2action-api.onrender.com';
    }
    // In development, use your LAN IP if running on device
    return 'http://192.168.137.35:5000';
  };

  // Initialize socket connection safely
  useEffect(() => {
    if (!isAuthenticated || !token) {
      // If user logs out → cleanup
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    // Create socket only if none exists
    if (!socketRef.current) {
      const socketURL = getSocketURL();
      console.log('🔌 Connecting to Socket.IO server:', socketURL);
      
      const newSocket = io(socketURL, {
        auth: { token },
        transports: ["websocket", "polling"], // Try WebSocket first, then polling
        timeout: 20000,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        // Important: Don't include trailing slash in path
        path: '/socket.io',
      });
      
      newSocket.connect();
      socketRef.current = newSocket;

      // Connection events
      newSocket.on("connect", () => {
        console.log("✅ Socket connected:", newSocket.id);
        setIsConnected(true);
        reconnectAttempts.current = 0;
        // Use userId from useMemo to avoid dependency issues
        if (userId) {
          newSocket.emit("join_user_room", userId);
        }
      });

      newSocket.on("disconnect", (reason) => {
        console.log("⚠️ Socket disconnected:", reason);
        setIsConnected(false);

        // Attempt reconnection for any disconnect reason
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            console.log(`🔄 Attempting socket reconnect #${reconnectAttempts.current}`);
            newSocket.connect();
          }, 1000 * reconnectAttempts.current);
        } else {
          console.warn('❌ Max socket reconnect attempts reached');
        }
      });

      newSocket.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err);
        setIsConnected(false);
        // Try to reconnect if not maxed out
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(() => {
            console.log(`🔄 Attempting socket reconnect after error #${reconnectAttempts.current}`);
            newSocket.connect();
          }, 1000 * reconnectAttempts.current);
        }
      });

      // Attach listeners
      setupEventListeners(newSocket);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
    };
  }, [isAuthenticated, token, userId]); // ✅ Use userId instead of user?.id

  // Real-time event listeners - memoize the setup function to prevent recreation
  const setupEventListeners = useMemo(() => (socket) => {
    socket.on("issue_status_changed", (data) => {
      Toast.success(
        `Issue "${data.title}" status updated to ${data.newStatus}`
      );
      window.dispatchEvent(
        new CustomEvent("issueStatusChanged", { detail: data })
      );
    });

    socket.on("new_issue_submitted", (data) => {
      if (userRole === "admin") {
        Toast(`New issue: ${data.title}`, { icon: "🚨", duration: 6000 });
      }
      window.dispatchEvent(
        new CustomEvent("newIssueSubmitted", { detail: data })
      );
    });

    socket.on("comment_added", (data) => {
      if (data.user.name !== userName) {
        Toast(`${data.user.name} commented on an issue`, { icon: "💬" });
      }
      window.dispatchEvent(new CustomEvent("commentAdded", { detail: data }));
    });

    socket.on("upvote_updated", (data) => {
      window.dispatchEvent(new CustomEvent("upvoteUpdated", { detail: data }));
    });

    socket.on("system_announcement", (data) => {
      const toastOptions = {
        duration: 8000,
        icon:
          data.type === "info"
            ? "ℹ️"
            : data.type === "warning"
            ? "⚠️"
            : data.type === "success"
            ? "✅"
            : "📢",
      };
      if (data.priority === "high") {
        Toast.error(data.message, { ...toastOptions, duration: 10000 });
      } else {
        Toast(data.message, toastOptions);
      }
    });

    socket.on("user_typing_comment", (data) => {
      window.dispatchEvent(
        new CustomEvent("userTypingComment", { detail: data })
      );
    });

    socket.on("urgent_issue_alert", (data) => {
      if (userRole === "admin") {
        Toast.error(`Urgent Issue: ${data.title}`, {
          duration: 10000,
          icon: "🚨",
        });
      }
      window.dispatchEvent(
        new CustomEvent("urgentIssueAlert", { detail: data })
      );
    });

    socket.on("leaderboard_updated", (data) => {
      window.dispatchEvent(
        new CustomEvent("leaderboardUpdated", { detail: data })
      );
    });

    socket.on("online_users_updated", (users) => {
      setOnlineUsers(users);
    });

    socket.on("notification", (data) => {
      const toastOptions = { duration: 5000, icon: data.icon || "🔔" };
      switch (data.type) {
        case "success":
          Toast.success(data.message, toastOptions);
          break;
        case "error":
          Toast.error(data.message, toastOptions);
          break;
        case "warning":
          Toast(data.message, { ...toastOptions, icon: "⚠️" });
          break;
        default:
          Toast(data.message, toastOptions);
      }
    });
  }, [userRole, userName]); // ✅ Memoize with stable dependencies

  // ✅ Utility functions (all through emit wrapper)
  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("⚠️ Socket not connected, cannot emit:", event);
    }
  };

  const joinRoom = (room) => emit("join_room", room);
  const leaveRoom = (room) => emit("leave_room", room);
  const joinIssueRoom = (issueId) => emit("join_issue", issueId);
  const leaveIssueRoom = (issueId) => emit("leave_issue", issueId);
  const joinLocationRoom = (locationData) =>
    emit("join_location", locationData);
  const sendTypingIndicator = (issueId, isTyping) =>
    emit("typing_comment", { issueId, isTyping });
  const sendIssueUpdate = (issueId, updateData) =>
    emit("issue_update", { issueId, ...updateData });

  // Context value
  const value = {
    socket: socketRef.current,
    isConnected,
    onlineUsers,
    // Utility functions
    emit,
    joinRoom,
    leaveRoom,
    joinIssueRoom,
    leaveIssueRoom,
    joinLocationRoom,
    sendTypingIndicator,
    sendIssueUpdate,
    // Connection management
    reconnect: () => socketRef.current?.connect(),
    disconnect: () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
    },
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

// Custom hook
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketContext;