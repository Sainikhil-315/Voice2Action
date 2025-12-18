import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getNotificationsAPI, markNotificationReadAPI, markAllNotificationsReadAPI, deleteNotificationAPI } from '../utils/api';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await getNotificationsAPI();
      const data = response.data;
      
      if (data && data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        const unread = data.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        console.error('⚠️ Unexpected API response format:', data);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
      // Don't show toast here - let the API interceptor handle it
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!socket || !isAuthenticated || !isConnected) {
      return;
    }

    const handleNotification = (notification) => {
      
      // Add to state
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast
      toast.success(notification.message, {
        duration: 5000,
        icon: '🔔'
      });
    };

    // Listen for the notification event
    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, isAuthenticated, isConnected]);

  // Fetch notifications on login or when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      // Clear notifications on logout
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await markNotificationReadAPI(id);
      
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsReadAPI();
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      await deleteNotificationAPI(id);
      
      const wasUnread = notifications.find(n => n._id === id)?.read === false;
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};