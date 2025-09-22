// Service Worker for Push Notifications
const CACHE_NAME = 'lab-booking-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData;

  try {
    if (event.data) {
      notificationData = event.data.json();
      console.log('Push notification data:', notificationData);
    } else {
      console.log('No data in push event');
      notificationData = {
        title: 'Lab Booking System',
        body: 'You have a new notification'
      };
    }
  } catch (error) {
    console.error('Error parsing push data:', error);
    notificationData = {
      title: 'Lab Booking System',
      body: 'You have a new notification'
    };
  }

  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: notificationData.image,
    tag: notificationData.tag || 'lab-booking',
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [],
    data: notificationData.data || {},
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Lab Booking System', options)
      .then(() => {
        console.log('Notification displayed successfully');
      })
      .catch((error) => {
        console.error('Error showing notification:', error);
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window/tab, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline support
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Handle background sync here if needed
  }
});

// Fetch event for caching (optional)
self.addEventListener('fetch', (event) => {
  // Handle fetch events if you want to implement caching
  // For now, we'll let the browser handle all requests normally
});
