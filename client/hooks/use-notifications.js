import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef {Object} Notification
 * @property {string} _id - Notification ID
 * @property {string} userId - User ID
 * @property {string} title - Notification title
 * @property {string} body - Notification body
 * @property {'booking_pending'|'booking_approved'|'booking_rejected'|'general'} type - Notification type
 * @property {boolean} read - Whether notification is read
 * @property {any} [data] - Additional notification data
 * @property {string} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} NotificationData
 * @property {Notification[]} notifications - Array of notifications
 * @property {number} unreadCount - Count of unread notifications
 */

/**
 * @typedef {Object} NotificationCount
 * @property {number} unreadCount - Count of unread notifications
 * @property {number} pendingBookingsCount - Count of pending bookings
 */

/**
 * useNotifications hook
 * @param {string} [userId] - User ID for notifications
 */
export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission(currentPermission);
      console.log('🔔 Initial notification permission:', currentPermission);
      
      // If permission is denied, set a helpful error message
      if (currentPermission === 'denied') {
        setError('Notifications are blocked. Click the lock icon (🔒) in your browser\'s address bar and allow notifications.');
      }
    } else {
      console.error('❌ Notification API not available');
      setError('Notifications not supported in this browser');
    }
  }, []);

  // Register service worker and set up push notifications
  const initializePushNotifications = useCallback(async () => {
    console.log('🔔 Initializing push notifications...');
    
    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service workers not supported');
      setError('Service workers not supported in this browser');
      return false;
    }
    
    if (!('PushManager' in window)) {
      console.error('❌ Push messaging not supported');
      setError('Push messaging not supported in this browser');
      return false;
    }

    try {
      console.log('📱 Registering service worker...');
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service Worker registered:', registration);

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker is ready');

      // Check current permission
      console.log('🔑 Current permission:', Notification.permission);
      if (Notification.permission !== 'granted') {
        console.log('❌ Notification permission not granted');
        return false;
      }

      // Get or create push subscription
      let pushSubscription = await registration.pushManager.getSubscription();
      console.log('📤 Existing subscription:', pushSubscription ? 'Found' : 'Not found');
      
      if (!pushSubscription) {
        console.log('🔑 Creating new push subscription...');
        // Use the correct VAPID public key
        const vapidPublicKey = 'BDDYqz24GSb1tcKfxUK65WaZPO63wb8kcq8-pXf12IJ0qbFc8cQCdGYd7pgrAvIhzdUKC3Va6V_UOFp5DNFS8eU';
        
        try {
          pushSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
          console.log('✅ Push subscription created:', pushSubscription.endpoint.substring(0, 50) + '...');
        } catch (subscribeError) {
          console.error('❌ Failed to create subscription:', subscribeError);
          setError('Failed to create push subscription');
          return false;
        }
      }

      setSubscription(pushSubscription);

      // Send subscription to server
      if (userId && pushSubscription) {
        console.log('📡 Sending subscription to server...');
        try {
          const response = await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subscription: {
                endpoint: pushSubscription.endpoint,
                keys: {
                  p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')),
                  auth: arrayBufferToBase64(pushSubscription.getKey('auth'))
                }
              },
              userId
            }),
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('✅ Subscription sent to server successfully');
          } else {
            console.error('❌ Server rejected subscription:', result.message);
            setError('Server rejected subscription: ' + result.message);
          }
        } catch (fetchError) {
          console.error('❌ Failed to send subscription to server:', fetchError);
          setError('Failed to send subscription to server');
        }
      } else {
        console.log('⚠️ No userId or subscription available for server registration');
      }

      console.log('✅ Push notifications setup complete');
      return true;
    } catch (error) {
      console.error('❌ Error setting up push notifications:', error);
      setError('Failed to set up push notifications: ' + error.message);
      return false;
    }
  }, [userId]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/${userId}`);
      const result = await response.json();
      
      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch notification count
  const fetchNotificationCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/${userId}/count`);
      const result = await response.json();
      
      if (result.success) {
        setUnreadCount(result.data.unreadCount);
        setPendingBookingsCount(result.data.pendingBookingsCount);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, [userId]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notifications/${userId}/read-all`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    console.log('🔔 Requesting notification permission...');
    
    try {
      if (!('Notification' in window)) {
        console.error('❌ Notifications API not available');
        setError('Notifications not supported in this browser');
        return false;
      }

      if (!('serviceWorker' in navigator)) {
        console.error('❌ Service Worker API not available');
        setError('Service workers not supported in this browser');
        return false;
      }

      // Check if we're in a secure context
      if (!window.isSecureContext) {
        console.error('❌ Not in secure context');
        setError('Notifications require HTTPS or localhost');
        return false;
      }

      console.log('🔑 Current permission state:', Notification.permission);
      
      // If already denied, provide specific guidance
      if (Notification.permission === 'denied') {
        console.error('❌ Notifications previously denied');
        setError('Notifications blocked. Please click the lock icon in address bar and allow notifications, then refresh the page.');
        return false;
      }
      
      // Request permission
      const permission = await Notification.requestPermission();
      console.log('🔑 Permission result:', permission);
      setPermission(permission);
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted, initializing push notifications...');
        const success = await initializePushNotifications();
        if (success) {
          console.log('✅ Push notifications enabled successfully');
          // Clear any previous errors
          setError('');
          // Test notification
          try {
            new Notification('🔔 Notifications Enabled', {
              body: 'You will now receive booking updates and notifications',
              icon: '/favicon.ico',
              tag: 'test-notification'
            });
            console.log('✅ Test notification displayed');
          } catch (notifError) {
            console.error('⚠️ Failed to show test notification:', notifError);
          }
        } else {
          console.error('❌ Failed to initialize push notifications');
        }
        return success;
      } else if (permission === 'denied') {
        console.error('❌ Notification permission denied');
        setError('Notifications blocked. Please click the lock icon (🔒) in your browser\'s address bar, select "Allow notifications", then refresh the page.');
      } else {
        console.log('⚠️ Notification permission dismissed');
        setError('Please allow notifications to receive booking updates.');
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      setError('Failed to enable notifications: ' + error.message);
      return false;
    }
  }, [initializePushNotifications]);

  // Auto-fetch notifications and set up polling
  useEffect(() => {
    if (userId) {
      fetchNotifications();
      fetchNotificationCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications, fetchNotificationCount]);

  // Initialize push notifications when user is available
  useEffect(() => {
    if (userId && permission === 'granted') {
      initializePushNotifications();
    }
  }, [userId, permission, initializePushNotifications]);

  return {
    notifications,
    unreadCount,
    pendingBookingsCount,
    loading,
    error,
    permission,
    subscription,
    fetchNotifications,
    fetchNotificationCount,
    markAsRead,
    markAllAsRead,
    requestPermission,
    initializePushNotifications
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return window.btoa(binary);
}
