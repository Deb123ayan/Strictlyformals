'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  created: string;
  action?: {
    label: string;
    url: string;
  };
}

export default function NotificationsPage() {
  // Mock notification data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Order Confirmed',
      message: 'Your order #12345 has been confirmed and is being processed',
      type: 'success',
      read: false,
      created: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
      action: {
        label: 'View Order',
        url: '/orders/12345'
      }
    },
    {
      id: '2',
      title: 'Shipping Update',
      message: 'Your order #12345 has been shipped and will arrive in 2-3 business days',
      type: 'info',
      read: false,
      created: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      action: {
        label: 'Track Package',
        url: '/tracking/12345'
      }
    },
    {
      id: '3',
      title: 'Payment Received',
      message: 'We have received your payment of ₹12,999 for order #12345',
      type: 'success',
      read: true,
      created: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: '4',
      title: 'Low Stock Alert',
      message: 'The Classic Navy Blazer you viewed is running low in stock',
      type: 'warning',
      read: true,
      created: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      action: {
        label: 'View Product',
        url: '/products/1'
      }
    },
    {
      id: '5',
      message: 'Your return request for order #12345 has been processed',
      title: 'Return Processed',
      type: 'success',
      read: true,
      created: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    }
  ];

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('unread');

  const filteredNotifications = activeFilter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-100 text-emerald-800';
      case 'warning': return 'bg-amber-100 text-amber-800';
      case 'error': return 'bg-rose-100 text-rose-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-serif font-bold text-stone-900">Notifications</h1>
            <p className="text-stone-500 mt-1">
              {activeFilter === 'all' ? 'All notifications' : 'Unread notifications'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveFilter(activeFilter === 'all' ? 'unread' : 'all')}
              className="px-4 py-2 text-sm rounded-lg border border-stone-200 bg-white hover:bg-stone-50 transition-colors"
            >
              {activeFilter === 'all' ? 'Show Unread' : 'Show All'}
            </button>
            <button
              onClick={markAllAsRead}
              disabled={notifications.filter(n => !n.read).length === 0}
              className="px-4 py-2 text-sm rounded-lg bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Mark All as Read
            </button>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden"
        >
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <svg className="mx-auto h-12 w-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium">No notifications</h3>
              <p className="mt-1">
                {activeFilter === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-200">
              <AnimatePresence>
                {filteredNotifications.map((notification) => (
                  <motion.li
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`hover:bg-stone-50 ${!notification.read ? 'bg-stone-50' : ''}`}
                  >
                    <div className="px-6 py-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`mt-1 flex-shrink-0 h-3 w-3 rounded-full ${!notification.read ? 'bg-stone-800' : 'bg-stone-300'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(notification.type)}`}>
                                {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                              </span>
                              <span className="text-xs text-stone-500">
                                {new Date(notification.created).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <h3 className="mt-1 text-base font-medium text-stone-900">
                              {notification.title}
                            </h3>
                            <p className="mt-1 text-sm text-stone-600">
                              {notification.message}
                            </p>
                            {notification.action && (
                              <Link 
                                href={notification.action.url}
                                onClick={() => markAsRead(notification.id)}
                                className="mt-2 inline-flex items-center text-sm font-medium text-stone-800 hover:text-stone-600 hover:underline"
                              >
                                {notification.action.label}
                                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-stone-400 hover:text-stone-600 rounded-full"
                            title="Mark as read"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-stone-400 hover:text-rose-500 rounded-full"
                            title="Delete"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </motion.div>

        {/* Empty state for mobile */}
        {filteredNotifications.length > 0 && (
          <div className="mt-4 md:hidden text-center">
            <button
              onClick={markAllAsRead}
              disabled={notifications.filter(n => !n.read).length === 0}
              className="text-sm text-stone-600 hover:text-stone-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}