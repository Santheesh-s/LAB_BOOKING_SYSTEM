import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bell, BellRing, Check, CheckCheck, Settings, X } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationBellProps {
  userId?: string;
  showPendingCount?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  userId,
  showPendingCount = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    pendingBookingsCount,
    loading,
    error,
    permission,
    markAsRead,
    markAllAsRead,
    requestPermission
  } = useNotifications(userId);

  // Handle enable notification button click
  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      toast({
        title: "Notifications Enabled",
        description: "You will now receive push notifications for booking updates.",
      });
    } else {
      toast({
        title: "Failed to Enable Notifications",
        description: error || "Please check your browser settings and try again.",
        variant: "destructive",
      });
    }
  };

  // Handle test notification button click
  const handleTestNotification = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not available",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/notifications/test/${userId}`, {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Test Notification Sent",
          description: "Check your device for the test notification.",
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.message || "Failed to send test notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Network error occurred",
        variant: "destructive",
      });
    }
  };

  // Show combined count: individual notifications + pending bookings (if showPendingCount is true)
  const displayCount = showPendingCount ? unreadCount + pendingBookingsCount : unreadCount;
  const hasNotifications = displayCount > 0;

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_pending':
        return '📅';
      case 'booking_approved':
        return '✅';
      case 'booking_rejected':
        return '❌';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_pending':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'booking_approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'booking_rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {hasNotifications ? (
            <BellRing className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {displayCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {displayCount > 99 ? '99+' : displayCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
                {showPendingCount && pendingBookingsCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingBookingsCount} pending
                  </Badge>
                )}
              </div>
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              {permission !== 'granted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnableNotifications}
                  className="flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  Enable
                </Button>
              )}
              
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  All
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {permission !== 'granted' && (
            <div className={`p-4 mb-4 rounded-lg border ${
              permission === 'denied'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <BellRing className={`w-4 h-4 ${
                  permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <span className={`text-sm font-medium ${
                  permission === 'denied' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {permission === 'denied' ? 'Notifications Blocked' : 'Enable Push Notifications'}
                </span>
              </div>
              <p className={`text-xs mb-3 ${
                permission === 'denied' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {permission === 'denied'
                  ? 'Click the lock icon (🔒) in your address bar, select "Allow notifications", then refresh the page.'
                  : 'Get instant notifications for booking updates and approvals'
                }
              </p>
              {permission !== 'denied' && (
                <Button
                  size="sm"
                  onClick={handleEnableNotifications}
                  className="w-full"
                >
                  Enable Notifications
                </Button>
              )}
              {permission === 'denied' && (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    Refresh Page
                  </Button>
                  <p className="text-xs text-red-600">
                    💡 If still blocked: Go to browser Settings → Privacy & Security → Notifications → Add this site
                  </p>
                </div>
              )}
            </div>
          )}

          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-2">No notifications yet</p>
                <p className="text-sm text-muted-foreground">
                  You'll see booking updates and system notifications here
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div key={notification._id}>
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        !notification.read ? 'ring-2 ring-primary/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification._id, notification.read)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                            <span className="text-sm">
                              {getNotificationIcon(notification.type)}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.read ? 'font-semibold' : ''
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.body}
                            </p>
                            
                            {notification.data && (
                              <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                {notification.data.labName && (
                                  <span>Lab: {notification.data.labName}</span>
                                )}
                                {notification.data.date && (
                                  <span className="ml-2">Date: {notification.data.date}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {index < notifications.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {error && (
          <div className="flex-shrink-0 pt-3 border-t">
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          </div>
        )}

        {showPendingCount && pendingBookingsCount > 0 && (
          <div className="flex-shrink-0 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Approvals</span>
              <Badge variant="destructive">
                {pendingBookingsCount}
              </Badge>
            </div>
          </div>
        )}

        {permission === 'granted' && (
          <div className="flex-shrink-0 pt-3 border-t space-y-3">
            <div className="flex items-center justify-center text-xs text-green-600">
              ✅ Push notifications enabled
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="w-full flex items-center gap-2"
            >
              <Bell className="w-3 h-3" />
              Test Notification
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NotificationBell;
