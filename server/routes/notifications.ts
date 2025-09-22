import { RequestHandler } from "express";
import { ObjectId } from "mongodb";
import webpush from "web-push";
import { getDatabase } from "../db";
import { User, ApiResponse } from "@shared/types";

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = 'BDDYqz24GSb1tcKfxUK65WaZPO63wb8kcq8-pXf12IJ0qbFc8cQCdGYd7pgrAvIhzdUKC3Va6V_UOFp5DNFS8eU';
const VAPID_PRIVATE_KEY = 'yeL1YKDefMBDT1okxJpJno-clzFPkBo51GykPILoc7E';
const VAPID_EMAIL = 'mailto:admin@labsystem.com';

console.log('🔑 Configuring VAPID details for web-push...');
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
console.log('✅ VAPID details configured successfully');

interface NotificationSubscription {
  _id?: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: Date;
}

interface Notification {
  _id?: string;
  userId: string;
  title: string;
  body: string;
  type: 'booking_pending' | 'booking_approved' | 'booking_rejected' | 'general';
  read: boolean;
  data?: any;
  createdAt: Date;
}

// Subscribe to push notifications
export const subscribeToPush: RequestHandler = async (req, res) => {
  try {
    const { subscription, userId } = req.body;
    
    if (!subscription || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription and userId are required'
      } as ApiResponse);
    }

    const db = await getDatabase();
    
    // Check if subscription already exists
    const existingSubscription = await db.collection<NotificationSubscription>('subscriptions')
      .findOne({ 
        userId, 
        endpoint: subscription.endpoint 
      });

    if (existingSubscription) {
      return res.json({
        success: true,
        message: 'Subscription already exists'
      } as ApiResponse);
    }

    // Save new subscription
    const newSubscription: NotificationSubscription = {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: req.headers['user-agent'],
      createdAt: new Date()
    };

    await db.collection<NotificationSubscription>('subscriptions').insertOne(newSubscription);

    res.json({
      success: true,
      message: 'Successfully subscribed to push notifications'
    } as ApiResponse);

  } catch (error) {
    console.error('Subscribe to push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to push notifications'
    } as ApiResponse);
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPush: RequestHandler = async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    
    const db = await getDatabase();
    
    await db.collection<NotificationSubscription>('subscriptions').deleteOne({
      userId,
      endpoint
    });

    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    } as ApiResponse);

  } catch (error) {
    console.error('Unsubscribe from push error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push notifications'
    } as ApiResponse);
  }
};

// Get user notifications
export const getNotifications: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const db = await getDatabase();
    
    const notifications = await db.collection<Notification>('notifications')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .toArray();

    const unreadCount = await db.collection<Notification>('notifications')
      .countDocuments({ userId, read: false });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    } as ApiResponse);
  }
};

// Mark notification as read
export const markNotificationAsRead: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDatabase();
    
    await db.collection<Notification>('notifications').updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    } as ApiResponse);

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    } as ApiResponse);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = await getDatabase();
    
    await db.collection<Notification>('notifications').updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    } as ApiResponse);

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    } as ApiResponse);
  }
};

// Send notification to user (internal function)
export const sendNotificationToUser = async (
  userId: string,
  title: string,
  body: string,
  type: Notification['type'],
  data?: any
) => {
  try {
    const db = await getDatabase();

    // Save notification to database
    const notification: Notification = {
      userId,
      title,
      body,
      type,
      read: false,
      data,
      createdAt: new Date()
    };

    await db.collection<Notification>('notifications').insertOne(notification);

    // Get user's push subscriptions
    const subscriptions = await db.collection<NotificationSubscription>('subscriptions')
      .find({ userId })
      .toArray();

    console.log(`📱 Notification saved for user ${userId}: ${title}`);
    console.log(`📱 Found ${subscriptions.length} subscription(s) for user`);

    // Send push notifications to all user's devices
    const pushPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        const payload = JSON.stringify({
          title,
          body,
          type,
          data: {
            ...data,
            url: '/dashboard', // Default URL to open on click
            timestamp: Date.now()
          },
          tag: `notification-${type}`,
          requireInteraction: type === 'booking_pending'
        });

        const options = {
          TTL: 86400, // 24 hours
          urgency: 'normal' as const,
          topic: type
        };

        await webpush.sendNotification(pushSubscription, payload, options);
        console.log(`✅ Push notification sent successfully to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
      } catch (pushError: any) {
        console.error(`❌ Failed to send push notification:`, pushError.message);

        // If the subscription is invalid, remove it from database
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          console.log(`🗑️ Removing invalid subscription: ${subscription.endpoint}`);
          await db.collection<NotificationSubscription>('subscriptions')
            .deleteOne({ _id: subscription._id });
        }
      }
    });

    await Promise.allSettled(pushPromises);
    return true;
  } catch (error) {
    console.error('Send notification error:', error);
    return false;
  }
};

// Test push notification endpoint
export const testPushNotification: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      } as ApiResponse);
    }

    console.log(`🧪 Testing push notification for user: ${userId}`);

    const success = await sendNotificationToUser(
      userId,
      '🗺 Test Notification',
      'This is a test push notification to verify the system is working correctly.',
      'general',
      { test: true, timestamp: new Date().toISOString() }
    );

    if (success) {
      res.json({
        success: true,
        message: 'Test notification sent successfully'
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification'
      } as ApiResponse);
    }

  } catch (error) {
    console.error('Test push notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    } as ApiResponse);
  }
};

// Get notification count for user
export const getNotificationCount: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const db = await getDatabase();
    
    const unreadCount = await db.collection<Notification>('notifications')
      .countDocuments({ userId, read: false });

    const pendingBookingsCount = await db.collection('bookings')
      .countDocuments({ 
        $or: [
          { status: 'pending_club_approval' },
          { status: 'pending_lab_approval' }
        ]
      });

    res.json({
      success: true,
      data: {
        unreadCount,
        pendingBookingsCount
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification count'
    } as ApiResponse);
  }
};
