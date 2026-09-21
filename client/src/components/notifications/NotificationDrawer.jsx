import React, { useState, useEffect } from 'react';
import { 
  Bell, X, Check, Trash2, CheckCheck, 
  Info, AlertTriangle, Zap, CreditCard, Calendar, RefreshCw 
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import socketService from '../../services/socketService';

export const NotificationDrawer = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'booking', 'charging', 'payment'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        const unread = res.data.filter(n => !n.readAt).length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (onUnreadCountChange) {
        onUnreadCountChange(prev => prev + 1);
      }
    };

    socketService.onNotification(handleNewNotification);
    return () => {
      socketService.offNotification(handleNewNotification);
    };
  }, [onUnreadCountChange]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, readAt: new Date().toISOString() } : n)
      );
      if (onUnreadCountChange) {
        onUnreadCountChange(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      const deletedItem = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (deletedItem && !deletedItem.readAt && onUnreadCountChange) {
        onUnreadCountChange(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_reminder':
      case 'booking_cancelled':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'charging_started':
      case 'charging_completed':
      case 'check_in_completed':
        return <Zap className="w-5 h-5 text-emerald-500" />;
      case 'payment_success':
      case 'payment_failed':
      case 'refund_completed':
        return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'demand_warning':
      case 'station_unavailable':
      case 'charger_maintenance':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default:
        return <Info className="w-5 h-5 text-indigo-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.readAt;
    if (filter === 'booking') return n.type?.startsWith('booking');
    if (filter === 'charging') return n.type?.startsWith('charging') || n.type === 'check_in_completed';
    if (filter === 'payment') return n.type?.startsWith('payment') || n.type?.startsWith('refund');
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stay updated with your charging sessions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions & Filters */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex space-x-1">
              {['all', 'unread', 'booking', 'charging'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize transition ${
                    filter === f
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {notifications.some(n => !n.readAt) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 flex-shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-sm">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 dark:text-slate-400">
                <Bell className="w-10 h-10 mb-2 opacity-30" />
                <p className="font-medium text-sm">No notifications found</p>
                <p className="text-xs opacity-75">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    n.readAt
                      ? 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-slate-900 dark:text-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700">
                        {getIcon(n.type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold leading-tight">{n.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-2 inline-block">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {!n.readAt && (
                        <button
                          onClick={() => handleMarkAsRead(n._id)}
                          title="Mark as read"
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n._id)}
                        title="Delete notification"
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
