import { RequestHandler } from "express";
import { getDatabase } from "../db";
import { Booking, User, Lab, Club, ApiResponse } from "@shared/types";

interface AnalyticsResponse {
  summary: {
    totalBookings: number;
    approvedBookings: number;
    rejectedBookings: number;
    pendingBookings: number;
    approvalRate: number;
    totalUsers: number;
    totalLabs: number;
    totalClubs: number;
    growth: {
      thisMonth: number;
      lastMonth: number;
      percentage: number;
    };
  };
  charts: {
    weeklyTrend: number[];
    monthlyTrend: number[];
    hourlyDistribution: number[];
    statusDistribution: Array<{ status: string; count: number; percentage: number }>;
  };
  performance: {
    labUtilization: Array<{
      labId: string;
      labName: string;
      bookings: number;
      capacity: number;
      utilization: number;
    }>;
    clubActivity: Array<{
      clubId: string;
      clubName: string;
      bookings: number;
      approvalRate: number;
      avgResponseTime: number;
    }>;
    userActivity: Array<{
      userId: string;
      userName: string;
      role: string;
      bookings: number;
      lastActive: Date;
    }>;
  };
  insights: {
    peakHours: string;
    mostActiveDay: string;
    averageResponseTime: string;
    topPerformingLab: string;
    topPerformingClub: string;
    busyPeriods: Array<{ date: string; bookings: number }>;
  };
}

export const getAnalytics: RequestHandler = async (req, res) => {
  try {
    const { dateRange = 'month', labId, clubId } = req.query;
    
    const db = await getDatabase();
    
    // Fetch all required data
    const [bookings, users, labs, clubs] = await Promise.all([
      db.collection<Booking>('bookings').find({}).toArray(),
      db.collection<User>('users').find({}).toArray(),
      db.collection<Lab>('labs').find({}).toArray(),
      db.collection<Club>('clubs').find({}).toArray()
    ]);

    // Calculate date range
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

    // Filter bookings based on criteria
    let filteredBookings = bookings.filter(booking => {
      const bookingDate = new Date(booking.createdAt || booking.date);
      let dateMatch = bookingDate >= startDate;
      let labMatch = !labId || labId === 'all' || booking.labId === labId;
      let clubMatch = !clubId || clubId === 'all' || booking.clubId === clubId;
      
      return dateMatch && labMatch && clubMatch;
    });

    // Calculate summary statistics
    const totalBookings = filteredBookings.length;
    const approvedBookings = filteredBookings.filter(b => b.status === 'approved').length;
    const rejectedBookings = filteredBookings.filter(b => 
      b.status === 'rejected_by_club' || b.status === 'rejected_by_lab'
    ).length;
    const pendingBookings = filteredBookings.filter(b => 
      b.status === 'pending_club_approval' || b.status === 'pending_lab_approval'
    ).length;
    const approvalRate = totalBookings > 0 ? Math.round((approvedBookings / totalBookings) * 100) : 0;

    // Calculate growth metrics
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

    const growthPercentage = lastMonthBookings > 0 
      ? Math.round(((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
      : 100;

    // Weekly trend (last 7 days)
    const weeklyTrend = Array(7).fill(0);
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.toDateString() === date.toDateString();
      }).length;
      weeklyTrend[6 - i] = dayBookings;
    }

    // Monthly trend (last 12 months)
    const monthlyTrend = Array(12).fill(0);
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt || b.date);
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear();
      }).length;
      monthlyTrend[11 - i] = monthBookings;
    }

    // Hourly distribution
    const hourlyDistribution = Array(24).fill(0);
    bookings.forEach(booking => {
      const hour = parseInt(booking.startTime.split(':')[0]);
      if (hour >= 0 && hour < 24) {
        hourlyDistribution[hour]++;
      }
    });

    // Status distribution
    const statuses = ['approved', 'pending_club_approval', 'pending_lab_approval', 'rejected_by_club', 'rejected_by_lab'];
    const statusDistribution = statuses.map(status => {
      const count = filteredBookings.filter(b => b.status === status).length;
      const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
      return { status, count, percentage };
    });

    // Lab utilization
    const labUtilization = labs.map(lab => {
      const labBookings = bookings.filter(b => b.labId === lab._id).length;
      const capacity = lab.capacity || 30; // Default capacity
      const maxPossibleBookings = 30 * 8; // 30 days * 8 hours per day
      const utilization = Math.min(Math.round((labBookings / maxPossibleBookings) * 100), 100);
      
      return {
        labId: lab._id?.toString() || '',
        labName: lab.name,
        bookings: labBookings,
        capacity,
        utilization
      };
    });

    // Club activity
    const clubActivity = clubs.map(club => {
      const clubBookings = bookings.filter(b => b.clubId === club._id);
      const approved = clubBookings.filter(b => b.status === 'approved').length;
      const clubApprovalRate = clubBookings.length > 0 ? Math.round((approved / clubBookings.length) * 100) : 0;
      
      // Mock average response time calculation
      const avgResponseTime = 2.5 + Math.random() * 2; // 2.5-4.5 hours
      
      return {
        clubId: club._id?.toString() || '',
        clubName: club.name,
        bookings: clubBookings.length,
        approvalRate: clubApprovalRate,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10
      };
    });

    // User activity (top 20 most active users)
    const userActivity = users
      .map(user => {
        const userBookings = bookings.filter(b => b.userId === user._id);
        const lastBooking = userBookings.sort((a, b) => 
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        )[0];
        
        return {
          userId: user._id?.toString() || '',
          userName: user.name,
          role: user.role,
          bookings: userBookings.length,
          lastActive: lastBooking ? new Date(lastBooking.createdAt || lastBooking.date) : new Date(user.createdAt || 0)
        };
      })
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 20);

    // Calculate insights
    const peakHourIndex = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    const peakHours = `${peakHourIndex}:00 - ${peakHourIndex + 1}:00`;

    const dayCount = Array(7).fill(0);
    bookings.forEach(booking => {
      const day = new Date(booking.date).getDay();
      dayCount[day]++;
    });
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostActiveDay = days[dayCount.indexOf(Math.max(...dayCount))] || 'No data';

    const averageResponseTime = '2.4 hours'; // Mock calculation
    const topPerformingLab = labUtilization.sort((a, b) => b.utilization - a.utilization)[0]?.labName || 'No data';
    const topPerformingClub = clubActivity.sort((a, b) => b.approvalRate - a.approvalRate)[0]?.clubName || 'No data';

    // Busy periods (days with high booking activity)
    const busyPeriods = [];
    const last30Days = Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.toDateString() === date.toDateString();
      }).length;
      
      return {
        date: date.toISOString().split('T')[0],
        bookings: dayBookings
      };
    });

    const avgDailyBookings = last30Days.reduce((sum, day) => sum + day.bookings, 0) / 30;
    busyPeriods.push(...last30Days.filter(day => day.bookings > avgDailyBookings * 1.5).slice(0, 5));

    const analyticsResponse: AnalyticsResponse = {
      summary: {
        totalBookings,
        approvedBookings,
        rejectedBookings,
        pendingBookings,
        approvalRate,
        totalUsers: users.length,
        totalLabs: labs.length,
        totalClubs: clubs.length,
        growth: {
          thisMonth: thisMonthBookings,
          lastMonth: lastMonthBookings,
          percentage: growthPercentage
        }
      },
      charts: {
        weeklyTrend,
        monthlyTrend,
        hourlyDistribution,
        statusDistribution
      },
      performance: {
        labUtilization,
        clubActivity,
        userActivity
      },
      insights: {
        peakHours,
        mostActiveDay,
        averageResponseTime,
        topPerformingLab,
        topPerformingClub,
        busyPeriods
      }
    };

    res.json({
      success: true,
      data: analyticsResponse
    } as ApiResponse<AnalyticsResponse>);

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    } as ApiResponse);
  }
};

export const getRealtimeStats: RequestHandler = async (req, res) => {
  try {
    const db = await getDatabase();
    
    // Get basic real-time statistics
    const [bookingsCount, usersCount, labsCount, clubsCount] = await Promise.all([
      db.collection<Booking>('bookings').countDocuments(),
      db.collection<User>('users').countDocuments(),
      db.collection<Lab>('labs').countDocuments(),
      db.collection<Club>('clubs').countDocuments()
    ]);

    // Get today's bookings
    const today = new Date().toISOString().split('T')[0];
    const todaysBookings = await db.collection<Booking>('bookings')
      .countDocuments({ date: today });

    // Get pending approvals
    const pendingApprovals = await db.collection<Booking>('bookings')
      .countDocuments({ 
        status: { $in: ['pending_club_approval', 'pending_lab_approval'] }
      });

    // Recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentActivity = await db.collection<Booking>('bookings')
      .countDocuments({ 
        createdAt: { $gte: yesterday }
      });

    res.json({
      success: true,
      data: {
        totalBookings: bookingsCount,
        totalUsers: usersCount,
        totalLabs: labsCount,
        totalClubs: clubsCount,
        todaysBookings,
        pendingApprovals,
        recentActivity,
        lastUpdated: new Date().toISOString()
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Real-time stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time statistics'
    } as ApiResponse);
  }
};
