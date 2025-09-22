import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Calendar, Clock, ArrowLeft, GraduationCap, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Booking, User, Lab, Club } from '@shared/types';

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchBookings(parsedUser._id);
    }
    fetchLabs();
    fetchClubs();
  }, []);

  const fetchBookings = async (userId: string) => {
    try {
      const response = await fetch(`/api/bookings?userId=${userId}`);
      const result = await response.json();
      if (result.success) {
        setBookings(result.data.sort((a: Booking, b: Booking) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        ));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    try {
      const response = await fetch('/api/labs');
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

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        if (user) {
          fetchBookings(user._id!);
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Network error occurred');
    }
  };

  const getLabName = (labId: string) => {
    const lab = labs.find(l => l._id === labId);
    return lab?.name || 'Unknown Lab';
  };

  const getClubName = (clubId: string) => {
    const club = clubs.find(c => c._id === clubId);
    return club?.name || 'Teaching';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending_club_approval: 'bg-orange-100 text-orange-800 border-orange-200',
      pending_lab_approval: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected_by_club: 'bg-red-100 text-red-800 border-red-200',
      rejected_by_lab: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending_club_approval: 'Pending Club Approval',
      pending_lab_approval: 'Pending Lab Approval',
      approved: 'Approved',
      rejected_by_club: 'Rejected by Club',
      rejected_by_lab: 'Rejected by Lab',
      cancelled: 'Cancelled',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const isRejected = (status: string) => {
    return status === 'rejected_by_club' || status === 'rejected_by_lab';
  };

  const canCancelBooking = (booking: Booking) => {
    const bookingDate = new Date(booking.date);
    const now = new Date();
    return booking.status === 'pending' || 
           (booking.status === 'approved' && bookingDate > now);
  };

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
                onClick={() => user && fetchBookings(user._id!)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
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
          <h2 className="text-3xl font-bold text-foreground mb-2">My Bookings</h2>
          <p className="text-muted-foreground">
            View and manage your laboratory reservations
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {/* Bookings Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-warning">
                    {bookings.filter(b => b.status === 'pending_club_approval' || b.status === 'pending_lab_approval').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-success">
                    {bookings.filter(b => b.status === 'approved').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-destructive">
                    {bookings.filter(b => b.status === 'rejected_by_club' || b.status === 'rejected_by_lab').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Table */}
        <Card className="border-0 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All Bookings
            </CardTitle>
            <CardDescription>
              Your complete booking history and current reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No bookings found</p>
                <Button onClick={() => navigate('/booking')}>
                  Create Your First Booking
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lab</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell className="font-medium">
                        {getLabName(booking.labId)}
                      </TableCell>
                      <TableCell>
                        {new Date(booking.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {booking.startTime} - {booking.endTime}
                      </TableCell>
                      <TableCell>
                        {booking.clubId ? getClubName(booking.clubId) : 'Teaching'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {booking.purpose}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={`${getStatusColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </Badge>
                          {isRejected(booking.status) && booking.rejectionReason && (
                            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <AlertCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-red-800">Reason:</p>
                                <p className="text-red-700">{booking.rejectionReason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {canCancelBooking(booking) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBooking(booking._id!)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
