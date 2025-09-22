import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  GraduationCap, 
  RefreshCw, 
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Activity,
  Target,
  Zap,
  Filter,
  Eye
} from 'lucide-react';
import { Booking, User, Lab, Club } from '@shared/types';

interface AnalyticsData {
  totalBookings: number;
  approvedBookings: number;
  rejectedBookings: number;
  pendingBookings: number;
  approvalRate: number;
  totalUsers: number;
  totalLabs: number;
  totalClubs: number;
  thisMonthBookings: number;
  lastMonthBookings: number;
  weeklyBookings: number[];
  dailyBookings: number[];
  hourlyDistribution: number[];
  labUtilization: Array<{ labId: string; labName: string; bookings: number; utilization: number }>;
  clubActivity: Array<{ clubId: string; clubName: string; bookings: number; approvalRate: number }>;
  userActivity: Array<{ userId: string; userName: string; role: string; bookings: number }>;
  recentBookings: Booking[];
  averageResponseTime: string;
  peakHours: string;
  mostActiveDay: string;
  topPerformingLab: string;
  topPerformingClub: string;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedLab, setSelectedLab] = useState<string>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, [dateRange, selectedLab, selectedClub]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');

    try {
      await Promise.all([
        fetchBookings(),
        fetchUsers(),
        fetchLabs(),
        fetchClubs()
      ]);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings');
      const result = await response.json();
      if (result.success) {
        setBookings(result.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/admin/labs');
      const result = await response.json();
      if (result.success) {
        setLabs(result.data);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      const result = await response.json();
      if (result.success) {
        setClubs(result.data);
      }
    } catch (error) {
      console.error('Error fetching clubs:', error);
    }
  };

  const calculateAnalytics = (): AnalyticsData => {
    // Filter bookings based on date range and filters
    const now = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    let filteredBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt || booking.date);
      let dateMatch = bookingDate >= startDate;
      let labMatch = selectedLab === 'all' || booking.labId === selectedLab;
      let clubMatch = selectedClub === 'all' || booking.clubId === selectedClub;
      
      return dateMatch && labMatch && clubMatch;
    });

    const totalBookings = filteredBookings.length;
    const approvedBookings = filteredBookings.filter(b => b.status === 'approved').length;
    const rejectedBookings = filteredBookings.filter(b => 
      b.status === 'rejected_by_club' || b.status === 'rejected_by_lab'
    ).length;
    const pendingBookings = filteredBookings.filter(b => 
      b.status === 'pending_club_approval' || b.status === 'pending_lab_approval'
    ).length;

    const approvalRate = totalBookings > 0 ? Math.round((approvedBookings / totalBookings) * 100) : 0;

    // Calculate monthly comparison
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const thisMonthBookings = bookings.filter(b => {
      const date = new Date(b.createdAt || b.date);
      return date >= thisMonth;
    }).length;

    const lastMonthBookings = bookings.filter(b => {
      const date = new Date(b.createdAt || b.date);
      return date >= lastMonth && date < thisMonth;
    }).length;

    // Weekly distribution (last 7 days)
    const weeklyBookings = Array(7).fill(0);
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.toDateString() === date.toDateString();
      }).length;
      weeklyBookings[6 - i] = dayBookings;
    }

    // Daily distribution (last 30 days)
    const dailyBookings = Array(30).fill(0);
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.toDateString() === date.toDateString();
      }).length;
      dailyBookings[29 - i] = dayBookings;
    }

    // Hourly distribution
    const hourlyDistribution = Array(24).fill(0);
    bookings.forEach(booking => {
      const hour = parseInt(booking.startTime.split(':')[0]);
      hourlyDistribution[hour]++;
    });

    // Lab utilization
    const labUtilization = labs.map(lab => {
      const labBookings = bookings.filter(b => b.labId === lab._id).length;
      const maxPossibleBookings = 30 * 10; // 30 days * 10 hours per day (rough estimate)
      const utilization = Math.round((labBookings / maxPossibleBookings) * 100);
      
      return {
        labId: lab._id || '',
        labName: lab.name,
        bookings: labBookings,
        utilization: Math.min(utilization, 100)
      };
    });

    // Club activity
    const clubActivity = clubs.map(club => {
      const clubBookings = bookings.filter(b => b.clubId === club._id);
      const approved = clubBookings.filter(b => b.status === 'approved').length;
      const clubApprovalRate = clubBookings.length > 0 ? Math.round((approved / clubBookings.length) * 100) : 0;
      
      return {
        clubId: club._id || '',
        clubName: club.name,
        bookings: clubBookings.length,
        approvalRate: clubApprovalRate
      };
    });

    // User activity
    const userActivity = users.slice(0, 10).map(user => ({
      userId: user._id || '',
      userName: user.name,
      role: user.role,
      bookings: bookings.filter(b => b.userId === user._id).length
    })).sort((a, b) => b.bookings - a.bookings);

    // Recent bookings
    const recentBookings = bookings
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
      .slice(0, 10);

    // Analytics insights
    const avgResponseTime = "2.4 hours"; // Mock for now
    const peakHours = hourlyDistribution.indexOf(Math.max(...hourlyDistribution)) + ":00 - " + 
                     (hourlyDistribution.indexOf(Math.max(...hourlyDistribution)) + 1) + ":00";
    
    const dayCount = Array(7).fill(0);
    bookings.forEach(booking => {
      const day = new Date(booking.date).getDay();
      dayCount[day]++;
    });
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = days[dayCount.indexOf(Math.max(...dayCount))] || 'No data';

    const topPerformingLab = labUtilization.sort((a, b) => b.utilization - a.utilization)[0]?.labName || 'No data';
    const topPerformingClub = clubActivity.sort((a, b) => b.approvalRate - a.approvalRate)[0]?.clubName || 'No data';

    return {
      totalBookings,
      approvedBookings,
      rejectedBookings,
      pendingBookings,
      approvalRate,
      totalUsers: users.length,
      totalLabs: labs.length,
      totalClubs: clubs.length,
      thisMonthBookings,
      lastMonthBookings,
      weeklyBookings,
      dailyBookings,
      hourlyDistribution,
      labUtilization,
      clubActivity,
      userActivity,
      recentBookings,
      averageResponseTime: avgResponseTime,
      peakHours,
      mostActiveDay,
      topPerformingLab,
      topPerformingClub
    };
  };

  const exportData = () => {
    const data = {
      analytics: analyticsData,
      rawData: {
        bookings,
        users,
        labs,
        clubs
      },
      exportedAt: new Date().toISOString(),
      filters: {
        dateRange,
        selectedLab,
        selectedClub
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getGrowthPercentage = () => {
    if (!analyticsData) return 0;
    if (analyticsData.lastMonthBookings === 0) return 100;
    return Math.round(((analyticsData.thisMonthBookings - analyticsData.lastMonthBookings) / analyticsData.lastMonthBookings) * 100);
  };

  const getGrowthIcon = () => {
    const growth = getGrowthPercentage();
    return growth >= 0 ? TrendingUp : TrendingDown;
  };

  const getGrowthColor = () => {
    const growth = getGrowthPercentage();
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Calculate analytics data
  const analytics = calculateAnalytics();

  const renderOverviewCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-900">{analytics.totalBookings}</p>
              <div className="flex items-center mt-1">
                {React.createElement(getGrowthIcon(), { className: `w-4 h-4 mr-1 ${getGrowthColor()}` })}
                <span className={`text-sm font-medium ${getGrowthColor()}`}>
                  {Math.abs(getGrowthPercentage())}% from last month
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-green-200 bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Approved</p>
              <p className="text-3xl font-bold text-green-900">{analytics.approvedBookings}</p>
              <p className="text-sm text-green-600 mt-1">
                {analytics.approvalRate}% approval rate
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Pending</p>
              <p className="text-3xl font-bold text-orange-900">{analytics.pendingBookings}</p>
              <p className="text-sm text-orange-600 mt-1">
                Awaiting approval
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Active Users</p>
              <p className="text-3xl font-bold text-purple-900">{analytics.totalUsers}</p>
              <p className="text-sm text-purple-600 mt-1">
                {analytics.totalLabs} labs, {analytics.totalClubs} clubs
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Analytics Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="dateRange">Date Range</Label>
            <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lab">Filter by Lab</Label>
            <Select value={selectedLab} onValueChange={setSelectedLab}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Labs</SelectItem>
                {labs.map(lab => (
                  <SelectItem key={lab._id} value={lab._id || ''}>{lab.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="club">Filter by Club</Label>
            <Select value={selectedClub} onValueChange={setSelectedClub}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                {clubs.map(club => (
                  <SelectItem key={club._id} value={club._id || ''}>{club.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderQuickInsights = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium">Peak Hours</span>
            <span className="text-sm font-semibold">{analytics.peakHours}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium">Most Active Day</span>
            <span className="text-sm font-semibold">{analytics.mostActiveDay}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm font-medium">Avg Response Time</span>
            <span className="text-sm font-semibold">{analytics.averageResponseTime}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium">Top Lab</span>
            <span className="text-sm font-semibold">{analytics.topPerformingLab}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">System Utilization</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${Math.min((analytics.totalBookings / (analytics.totalLabs * 30)) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">
                {Math.min(Math.round((analytics.totalBookings / (analytics.totalLabs * 30)) * 100), 100)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Approval Efficiency</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${analytics.approvalRate}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">{analytics.approvalRate}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">User Engagement</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${Math.min((analytics.totalBookings / analytics.totalUsers) * 10, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-medium">
                {Math.min(Math.round((analytics.totalBookings / analytics.totalUsers) * 10), 100)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={exportData} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Analytics
          </Button>
          <Button onClick={fetchAllData} className="w-full" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button onClick={() => navigate('/approve-bookings')} className="w-full" variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Pending
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <header className="bg-card/80 backdrop-blur-sm border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold text-foreground">AI Department Lab System</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </main>
      </div>
    );
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
              <h1 className="text-xl font-bold text-foreground">AI Department Lab System</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAllData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive system analytics and insights for the AI department lab booking system
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        {renderFilters()}

        {/* Overview Cards */}
        {renderOverviewCards()}

        {/* Quick Insights */}
        {renderQuickInsights()}

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="utilization" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="utilization" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Lab Utilization
            </TabsTrigger>
            <TabsTrigger value="clubs" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Club Activity
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              User Activity
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="utilization">
            <Card>
              <CardHeader>
                <CardTitle>Lab Utilization Report</CardTitle>
                <CardDescription>
                  Booking frequency and utilization rates for each laboratory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lab Name</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Utilization Rate</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.labUtilization.map((lab) => (
                      <TableRow key={lab.labId}>
                        <TableCell className="font-medium">{lab.labName}</TableCell>
                        <TableCell>{lab.bookings}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${lab.utilization}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{lab.utilization}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={lab.utilization > 70 ? "default" : lab.utilization > 40 ? "secondary" : "outline"}
                          >
                            {lab.utilization > 70 ? 'High' : lab.utilization > 40 ? 'Medium' : 'Low'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clubs">
            <Card>
              <CardHeader>
                <CardTitle>Club Activity Report</CardTitle>
                <CardDescription>
                  Booking activity and approval rates for each club
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Club Name</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Approval Rate</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.clubActivity.map((club) => (
                      <TableRow key={club.clubId}>
                        <TableCell className="font-medium">{club.clubName}</TableCell>
                        <TableCell>{club.bookings}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${club.approvalRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{club.approvalRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={club.approvalRate > 80 ? "default" : club.approvalRate > 60 ? "secondary" : "destructive"}
                          >
                            {club.approvalRate > 80 ? 'Excellent' : club.approvalRate > 60 ? 'Good' : 'Needs Improvement'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Top User Activity</CardTitle>
                <CardDescription>
                  Most active users by booking frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Activity Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.userActivity.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">{user.userName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.bookings}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.bookings > 10 ? "default" : user.bookings > 5 ? "secondary" : "outline"}
                          >
                            {user.bookings > 10 ? 'Very Active' : user.bookings > 5 ? 'Active' : 'Moderate'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Booking Activity</CardTitle>
                <CardDescription>
                  Latest booking requests and their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Lab</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.recentBookings.map((booking) => {
                      const user = users.find(u => u._id === booking.userId);
                      const lab = labs.find(l => l._id === booking.labId);
                      
                      return (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(booking.date).toLocaleDateString()}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {user?.name || 'Unknown User'}
                          </TableCell>
                          <TableCell>{lab?.name || 'Unknown Lab'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                booking.status === 'approved' ? 'default' :
                                booking.status.includes('pending') ? 'secondary' :
                                'destructive'
                              }
                            >
                              {booking.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {booking.clubId ? 'Club Activities' : 'Teaching'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
