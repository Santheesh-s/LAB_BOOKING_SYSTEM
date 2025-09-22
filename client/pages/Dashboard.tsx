import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, UserRole } from '@shared/types';
import {
  Calendar,
  Users,
  Building2,
  Settings,
  BookOpen,
  ClipboardList,
  PlusCircle,
  BarChart3,
  LogOut,
  GraduationCap
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-destructive text-destructive-foreground',
      faculty: 'bg-primary text-primary-foreground',
      lab_incharge: 'bg-info text-info-foreground',
      club_member: 'bg-secondary text-secondary-foreground',
      club_executive: 'bg-accent text-accent-foreground',
      club_secretary: 'bg-warning text-warning-foreground',
      club_incharge: 'bg-success text-success-foreground',
    };
    return colors[role] || 'bg-muted text-muted-foreground';
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      admin: 'Administrator',
      faculty: 'Faculty',
      lab_incharge: 'Lab Incharge',
      club_member: 'Club Member',
      club_executive: 'Club Executive',
      club_secretary: 'Club Secretary',
      club_incharge: 'Club Incharge',
    };
    return labels[role] || role;
  };

  const getQuickActions = () => {
    if (!user) return [];

    const commonActions = [
      { icon: Calendar, label: 'Book Lab', href: '/booking', color: 'primary' },
      { icon: ClipboardList, label: 'My Bookings', href: '/my-bookings', color: 'secondary' },
    ];

    const adminActions = [
      { icon: Users, label: 'Manage Users', href: '/admin/users', color: 'info' },
      { icon: Building2, label: 'Manage Labs', href: '/admin/labs', color: 'success' },
      { icon: BookOpen, label: 'Manage Clubs', href: '/admin/clubs', color: 'accent' },
      { icon: BarChart3, label: 'Analytics', href: '/admin/analytics', color: 'warning' },
    ];

    const labInchargeActions = [
      { icon: ClipboardList, label: 'Approve Bookings', href: '/approve-bookings', color: 'warning' },
    ];

    const clubInchargeActions = [
      { icon: ClipboardList, label: 'Approve Bookings', href: '/approve-bookings', color: 'warning' },
    ];

    const clubMemberActions = [
      // Removed club booking and club members sections for club members
    ];

    switch (user.role) {
      case 'admin':
        return [...commonActions, ...adminActions];
      case 'lab_incharge':
        return [...commonActions, ...labInchargeActions];
      case 'club_incharge':
        return [...commonActions, ...clubInchargeActions];
      case 'club_secretary':
      case 'club_executive':
      case 'club_member':
        return [...commonActions, ...clubMemberActions];
      default:
        return commonActions;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Lab Booking System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell userId={user._id} />
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user.name}</p>
                <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-muted-foreground">
            Manage your lab bookings and access your dashboard features below.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {getQuickActions().map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-0 bg-card/60 backdrop-blur-sm"
                onClick={() => navigate(action.href)}
              >
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg bg-${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-5 h-5 text-${action.color}-foreground`} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {action.label}
                  </CardTitle>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activity */}
        <Card className="border-0 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <CardDescription>
              Your latest lab bookings and system notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent activity to display</p>
              <p className="text-sm">Book a lab to see your activity here</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
