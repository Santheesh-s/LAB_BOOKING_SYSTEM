import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, ArrowLeft, GraduationCap, RefreshCw, Users, Building2, Filter, Calendar, AlertCircle, Info, CheckCircle2, XCircle, BarChart3, TrendingUp, History, FileText, Download, Eye, MessageCircle } from 'lucide-react';
import { Booking, User, Lab, Club } from '@shared/types';
import NotificationBell from '@/components/NotificationBell';

export default function ApproveBookings() {
  const [clubBookings, setClubBookings] = useState<Booking[]>([]);
  const [labBookings, setLabBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState('club');
  const [filterDate, setFilterDate] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [clubHistory, setClubHistory] = useState<Booking[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if user has approval permissions
      if (!['admin', 'lab_incharge', 'club_incharge'].includes(parsedUser.role)) {
        navigate('/dashboard');
        return;
      }
      
      // Set default tab based on role
      if (parsedUser.role === 'club_incharge') {
        setActiveTab('club');
      } else if (parsedUser.role === 'lab_incharge') {
        setActiveTab('lab');
      }
    }
    
    fetchAllData();
  }, [navigate]);

  // Fetch bookings when user data becomes available
  useEffect(() => {
    if (user) {
      fetchPendingBookings();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUsers(),
        fetchLabs(),
        fetchClubs()
      ]);
      // Fetch bookings after user data is available
      if (user) {
        await fetchPendingBookings();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBookings = async () => {
    if (!user) return;
    
    try {
      // Fetch club bookings if user is club incharge
      if (user.role === 'club_incharge' || user.role === 'admin') {
        const clubResponse = await fetch(`/api/bookings/club-pending/${user._id}`);
        const clubResult = await clubResponse.json();
        if (clubResult.success) {
          setClubBookings(clubResult.data);
        }
      }
      
      // Fetch lab bookings if user is lab incharge or admin
      if (user.role === 'lab_incharge' || user.role === 'admin') {
        const labResponse = await fetch(`/api/bookings/lab-pending/${user._id}`);
        const labResult = await labResponse.json();
        if (labResult.success) {
          setLabBookings(labResult.data);
        }
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

  const handleApprove = async (bookingId: string) => {
    setProcessingId(bookingId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          approvedBy: user?._id
        }),
      });

      const result = await response.json();

      if (result.success) {
        const isClubApproval = activeTab === 'club';
        const successMsg = isClubApproval 
          ? 'Club booking approved! Request forwarded to lab incharge.'
          : 'Lab booking approved successfully!';
        setSuccess(successMsg);
        fetchPendingBookings();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;
    
    setProcessingId(selectedBooking._id!);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/bookings/${selectedBooking._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          approvedBy: user?._id,
          rejectionReason
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Booking rejected successfully!');
        fetchPendingBookings();
        setShowRejectDialog(false);
        setRejectionReason('');
        setSelectedBooking(null);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowRejectDialog(true);
  };

  const handleBatchApprove = async () => {
    if (selectedBookings.length === 0) return;

    setError('');
    setSuccess('');

    try {
      const promises = selectedBookings.map(bookingId =>
        fetch(`/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'approve',
            approvedBy: user?._id
          }),
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;

      if (successCount === selectedBookings.length) {
        setSuccess(`Successfully approved ${successCount} club bookings! All requests forwarded to lab incharge.`);
      } else {
        setSuccess(`Approved ${successCount} of ${selectedBookings.length} bookings. Some requests may have failed.`);
      }

      setSelectedBookings([]);
      fetchPendingBookings();
    } catch (error) {
      setError('Error processing batch approval');
    }
  };

  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const selectAllBookings = () => {
    const allIds = getFilteredClubBookings().map(b => b._id!);
    setSelectedBookings(selectedBookings.length === allIds.length ? [] : allIds);
  };

  const fetchClubHistory = async () => {
    if (!user) return;

    try {
      let response;

      if (user.role === 'admin') {
        // Admin sees all bookings
        response = await fetch('/api/bookings');
      } else if (user.role === 'club_incharge') {
        // Club incharge sees their club's bookings
        response = await fetch(`/api/bookings/club-pending/${user._id}`);

        // Also fetch completed club bookings
        const allBookingsResponse = await fetch('/api/bookings');
        const allResult = await allBookingsResponse.json();

        if (allResult.success) {
          // Get clubs managed by this incharge
          const clubsResponse = await fetch('/api/clubs');
          const clubsResult = await clubsResponse.json();

          if (clubsResult.success) {
            const managedClubs = clubsResult.data.filter((club: any) =>
              club.clubInchargeId === user._id
            );
            const managedClubIds = managedClubs.map((club: any) => club._id);

            // Filter bookings for managed clubs
            const clubBookings = allResult.data.filter((booking: Booking) =>
              managedClubIds.includes(booking.clubId) &&
              ['approved', 'rejected_by_club', 'rejected_by_lab'].includes(booking.status)
            );
            setClubHistory(clubBookings);
            return;
          }
        }
      } else {
        // Lab incharge sees lab-specific bookings
        response = await fetch(`/api/bookings/lab-pending/${user._id}`);

        // Also fetch all lab bookings for history
        const allBookingsResponse = await fetch('/api/bookings');
        const allResult = await allBookingsResponse.json();

        if (allResult.success) {
          const labBookings = allResult.data.filter((booking: Booking) =>
            user.labId ? booking.labId === user.labId : true
          );
          setClubHistory(labBookings.filter((booking: Booking) =>
            ['approved', 'rejected_by_lab'].includes(booking.status)
          ));
          return;
        }
      }

      const result = await response?.json();
      if (result?.success) {
        setClubHistory(result.data.filter((booking: Booking) =>
          ['approved', 'rejected_by_club', 'rejected_by_lab'].includes(booking.status)
        ));
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  const getAnalyticsData = () => {
    const totalProcessed = clubHistory.length;
    const approved = clubHistory.filter(b => b.status === 'approved').length;
    const rejectedByClub = clubHistory.filter(b => b.status === 'rejected_by_club').length;
    const rejectedByLab = clubHistory.filter(b => b.status === 'rejected_by_lab').length;

    const approvalRate = totalProcessed > 0 ? Math.round((approved / totalProcessed) * 100) : 0;

    // Calculate time-based statistics
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthBookings = clubHistory.filter(b =>
      new Date(b.createdAt || 0) >= thisMonth
    ).length;

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const recentBookings = clubHistory.filter(b =>
      new Date(b.createdAt || 0) >= lastWeek
    ).length;

    // Calculate average response time (mock data for now)
    const avgResponseTime = totalProcessed > 0 ? '2.3 hours' : '0 hours';

    // Find most active day of week
    const dayCount = new Array(7).fill(0);
    clubHistory.forEach(booking => {
      const day = new Date(booking.date).getDay();
      dayCount[day]++;
    });
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = days[dayCount.indexOf(Math.max(...dayCount))] || 'No data';

    return {
      totalProcessed,
      approved,
      rejectedByClub,
      rejectedByLab,
      approvalRate,
      pending: user?.role === 'admin' ? labBookings.length + clubBookings.length :
               user?.role === 'club_incharge' ? clubBookings.length :
               labBookings.length,
      thisMonthBookings,
      recentBookings,
      avgResponseTime,
      mostActiveDay
    };
  };

  const exportBookingData = () => {
    const analytics = getAnalyticsData();
    const data = {
      summary: analytics,
      pendingBookings: clubBookings,
      history: clubHistory
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `club-bookings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderAnalyticsDashboard = () => {
    const analytics = getAnalyticsData();

    const getAnalyticsTitle = () => {
      switch (user?.role) {
        case 'admin': return 'System-wide Booking Analytics';
        case 'club_incharge': return 'Club Booking Analytics';
        case 'lab_incharge': return 'Lab Booking Analytics';
        default: return 'Booking Analytics';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{getAnalyticsTitle()}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClubHistory()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Processed</p>
                  <p className="text-2xl font-bold text-blue-900">{analytics.totalProcessed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">Approved</p>
                  <p className="text-2xl font-bold text-green-900">{analytics.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-700">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">{analytics.rejectedByClub + analytics.rejectedByLab}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">Approval Rate</p>
                  <p className="text-2xl font-bold text-purple-900">{analytics.approvalRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Approval Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-700">Club Approved → Lab Approved</span>
                  <span className="text-2xl font-bold text-green-900">{analytics.approved}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-700">Rejected by Club</span>
                  <span className="text-2xl font-bold text-red-900">{analytics.rejectedByClub}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="font-medium text-orange-700">Rejected by Lab</span>
                  <span className="text-2xl font-bold text-orange-900">{analytics.rejectedByLab}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-blue-700">Currently Pending</span>
                  <span className="text-2xl font-bold text-blue-900">{analytics.pending}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Total Bookings This Month</span>
                  <span className="font-semibold">{analytics.thisMonthBookings}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Recent Activity (7 days)</span>
                  <span className="font-semibold">{analytics.recentBookings}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Average Response Time</span>
                  <span className="font-semibold">{analytics.avgResponseTime}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Most Active Day</span>
                  <span className="font-semibold">{analytics.mostActiveDay}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-semibold">{analytics.approvalRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export & Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={exportBookingData} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export All Data (JSON)
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Generate Report (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderHistoryView = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Booking History</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchClubHistory()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh History
          </Button>
        </div>

        {clubHistory.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-2">No booking history available</p>
            <p className="text-sm text-muted-foreground">Processed bookings will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {clubHistory
              .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
              .map((booking) => (
                <Card key={booking._id} className="border-l-4 border-l-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold">{getUserName(booking.userId)}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getClubName(booking.clubId!)} • {getLabName(booking.labId)}
                          </p>
                        </div>
                        <Badge className={
                          booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                          booking.status === 'rejected_by_club' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }>
                          {booking.status === 'approved' ? 'Approved' :
                           booking.status === 'rejected_by_club' ? 'Rejected by Club' :
                           'Rejected by Lab'}
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>Date:</strong> {new Date(booking.date).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Time:</strong> {booking.startTime} - {booking.endTime}
                      </div>
                      <div>
                        <strong>Purpose:</strong> {booking.purpose}
                      </div>
                    </div>

                    {booking.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-700">
                          <strong>Rejection Reason:</strong> {booking.rejectionReason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>
    );
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user?.name || 'Unknown User';
  };

  const getLabName = (labId: string) => {
    const lab = labs.find(l => l._id === labId);
    return lab?.name || 'Unknown Lab';
  };

  const getClubName = (clubId: string) => {
    const club = clubs.find(c => c._id === clubId);
    return club?.name || 'Teaching';
  };

  const getBookingType = (booking: Booking) => {
    return booking.clubId ? 'Club Activities' : 'Teaching';
  };

  const getBookingTypeColor = (booking: Booking) => {
    return booking.clubId ? 'bg-accent text-accent-foreground' : 'bg-info text-info-foreground';
  };

  const canShowClubTab = () => {
    return user?.role === 'club_incharge' || user?.role === 'admin';
  };

  const canShowLabTab = () => {
    return user?.role === 'lab_incharge' || user?.role === 'admin';
  };

  const getFilteredClubBookings = () => {
    if (!filterDate) return clubBookings;
    return clubBookings.filter(booking => booking.date === filterDate);
  };

  const getTodaysBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return clubBookings.filter(booking => booking.date === today);
  };

  const getUrgentBookings = () => {
    const today = new Date();
    const twoDaysFromNow = new Date(today.getTime() + (2 * 24 * 60 * 60 * 1000));
    return clubBookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= today && bookingDate <= twoDaysFromNow;
    });
  };

  const getTimeUntilBooking = (bookingDate: string) => {
    const now = new Date();
    const booking = new Date(bookingDate);
    const diffTime = booking.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Past due';
    return `${diffDays} days`;
  };

  const getPriorityLevel = (booking: Booking) => {
    const timeUntil = getTimeUntilBooking(booking.date);
    if (timeUntil === 'Today' || timeUntil === 'Tomorrow') return 'high';
    if (timeUntil === 'Past due') return 'urgent';
    const diffDays = parseInt(timeUntil.split(' ')[0]) || 999;
    if (diffDays <= 2) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderEnhancedClubBookingsTable = (bookings: Booking[]) => (
    <div className="space-y-4">
      {bookings
        .sort((a, b) => {
          // Sort by priority first, then by date
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          const aPriority = getPriorityLevel(a);
          const bPriority = getPriorityLevel(b);

          if (aPriority !== bPriority) {
            return priorityOrder[aPriority as keyof typeof priorityOrder] - priorityOrder[bPriority as keyof typeof priorityOrder];
          }

          return new Date(a.date).getTime() - new Date(b.date).getTime();
        })
        .map((booking) => {
          const priority = getPriorityLevel(booking);
          const timeUntil = getTimeUntilBooking(booking.date);

          return (
            <Card key={booking._id} className={`border-l-4 ${
              priority === 'urgent' ? 'border-l-red-500' :
              priority === 'high' ? 'border-l-orange-500' :
              priority === 'medium' ? 'border-l-yellow-500' : 'border-l-gray-300'
            } hover:shadow-lg transition-shadow duration-200`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking._id!)}
                      onChange={() => toggleBookingSelection(booking._id!)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-lg">{getUserName(booking.userId)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getClubName(booking.clubId!)} • {getLabName(booking.labId)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={`text-xs px-2 py-1 ${getPriorityColor(priority)}`}>
                        {priority.toUpperCase()}
                      </Badge>
                      <Badge className="bg-accent text-accent-foreground">
                        Club Activities
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{timeUntil}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(booking.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{booking.startTime} - {booking.endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      Submitted {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <Label className="text-sm font-medium text-muted-foreground">Purpose:</Label>
                  <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg border">
                    {booking.purpose}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {priority === 'urgent' && (
                      <Alert className="border-red-200 bg-red-50 p-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs text-red-700">Overdue - immediate attention required</span>
                      </Alert>
                    )}
                    {priority === 'high' && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">Urgent approval needed</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(booking._id!)}
                      disabled={processingId === booking._id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                    >
                      {processingId === booking._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Approving...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Approve & Forward to Lab
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => openRejectDialog(booking)}
                      disabled={processingId === booking._id}
                      className="border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 text-sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
    </div>
  );

  const renderBookingsTable = (bookings: Booking[], approvalType: 'club' | 'lab') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Requester</TableHead>
          <TableHead>Lab</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Purpose</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking._id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{getUserName(booking.userId)}</span>
                {booking.clubId && (
                  <span className="text-xs text-muted-foreground">
                    {getClubName(booking.clubId)}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium">
              {getLabName(booking.labId)}
            </TableCell>
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
            <TableCell>
              <Badge className={`text-xs ${getBookingTypeColor(booking)}`}>
                {getBookingType(booking)}
              </Badge>
            </TableCell>
            <TableCell className="max-w-xs">
              <div className="truncate" title={booking.purpose}>
                {booking.purpose}
              </div>
            </TableCell>
            <TableCell>
              {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleApprove(booking._id!)}
                  disabled={processingId === booking._id}
                  className="text-success hover:text-success"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openRejectDialog(booking)}
                  disabled={processingId === booking._id}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

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
              <NotificationBell userId={user?._id} showPendingCount={true} />
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Approve Lab Bookings</h2>
          <p className="text-muted-foreground">
            Two-tier approval system: Club activities require club incharge approval first, then lab incharge approval
          </p>
        </div>

        {success && (
          <Alert className="mb-6 border-success/50 bg-success/10">
            <AlertDescription className="text-success">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Approval Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            {canShowClubTab() && (
              <TabsTrigger value="club" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Club Approvals ({clubBookings.length})
              </TabsTrigger>
            )}
            {canShowLabTab() && (
              <TabsTrigger value="lab" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Lab Approvals ({labBookings.length})
              </TabsTrigger>
            )}
          </TabsList>

          {canShowClubTab() && (
            <TabsContent value="club">
              <Card className="border-0 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Club Management Dashboard
                      </CardTitle>
                      <CardDescription>
                        Comprehensive club booking management and analytics
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetchClubHistory();
                          setShowAnalytics(!showAnalytics);
                        }}
                        className="flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          fetchClubHistory();
                          setShowHistory(!showHistory);
                        }}
                        className="flex items-center gap-2"
                      >
                        <History className="w-4 h-4" />
                        History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportBookingData}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="pending" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="pending" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Pending ({clubBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger value="history" className="flex items-center gap-2">
                        <History className="w-4 h-4" />
                        History
                      </TabsTrigger>
                    </TabsList>

                    {/* Pending Approvals Tab */}
                    <TabsContent value="pending" className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Pending Approvals</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFilterOptions(!showFilterOptions)}
                          className="flex items-center gap-2"
                        >
                          <Filter className="w-4 h-4" />
                          Filter
                        </Button>
                      </div>

                      {showFilterOptions && (
                        <div className="mb-4 p-4 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <Label htmlFor="filterDate" className="text-sm font-medium">Filter by Date:</Label>
                            </div>
                            <input
                              id="filterDate"
                              type="date"
                              value={filterDate}
                              onChange={(e) => setFilterDate(e.target.value)}
                              className="px-3 py-1 border rounded text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setFilterDate('')}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      )}

                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-muted-foreground mt-2">Loading bookings...</p>
                        </div>
                      ) : getFilteredClubBookings().length === 0 ? (
                        <div className="text-center py-8">
                          {clubBookings.length === 0 ? (
                            <>
                              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-success opacity-50" />
                              <p className="text-muted-foreground mb-2">No pending club approvals</p>
                              <p className="text-sm text-muted-foreground">All club booking requests have been processed</p>
                            </>
                          ) : (
                            <>
                              <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                              <p className="text-muted-foreground mb-2">No bookings match your filter</p>
                              <p className="text-sm text-muted-foreground">Try adjusting your filter criteria</p>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Statistics Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="border border-blue-200 bg-blue-50/50">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-blue-700">Pending Approvals</p>
                                    <p className="text-2xl font-bold text-blue-900">{getFilteredClubBookings().length}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border border-green-200 bg-green-50/50">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-green-700">Today's Bookings</p>
                                    <p className="text-2xl font-bold text-green-900">{getTodaysBookings().length}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="border border-orange-200 bg-orange-50/50">
                              <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-orange-700">Urgent (Next 2 Days)</p>
                                    <p className="text-2xl font-bold text-orange-900">{getUrgentBookings().length}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Batch Actions */}
                          {getFilteredClubBookings().length > 0 && (
                            <div className="mb-4 p-4 border rounded-lg bg-muted/30 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={selectAllBookings}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedBookings.length === getFilteredClubBookings().length && getFilteredClubBookings().length > 0}
                                    onChange={() => {}}
                                    className="rounded"
                                  />
                                  Select All ({getFilteredClubBookings().length})
                                </Button>
                                {selectedBookings.length > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    {selectedBookings.length} booking(s) selected
                                  </span>
                                )}
                              </div>
                              {selectedBookings.length > 0 && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleBatchApprove}
                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                                    size="sm"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approve Selected ({selectedBookings.length})
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedBookings([])}
                                    size="sm"
                                  >
                                    Clear Selection
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Enhanced Bookings Display */}
                          {renderEnhancedClubBookingsTable(getFilteredClubBookings())}
                        </>
                      )}
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-4">
                      {renderAnalyticsDashboard()}
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-4">
                      {renderHistoryView()}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canShowLabTab() && (
            <TabsContent value="lab">
              <Card className="border-0 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Lab Approval Queue ({labBookings.length})
                  </CardTitle>
                  <CardDescription>
                    Final lab approvals for both club activities and teaching requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-muted-foreground mt-2">Loading bookings...</p>
                    </div>
                  ) : labBookings.length === 0 ? (
                    <div className="text-center py-8">
                      <Check className="w-12 h-12 mx-auto mb-4 text-success opacity-50" />
                      <p className="text-muted-foreground mb-2">No pending lab approvals</p>
                      <p className="text-sm text-muted-foreground">All lab booking requests have been processed</p>
                    </div>
                  ) : (
                    renderBookingsTable(labBookings, 'lab')
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Booking Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this booking request
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedBooking && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    {getUserName(selectedBooking.userId)} - {getLabName(selectedBooking.labId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedBooking.date).toLocaleDateString()} | {selectedBooking.startTime} - {selectedBooking.endTime}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why this booking is being rejected..."
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || processingId === selectedBooking?._id}
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {processingId === selectedBooking?._id ? 'Rejecting...' : 'Reject Booking'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectionReason('');
                    setSelectedBooking(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
