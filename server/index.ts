import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { login, register, verifyToken, forgotPassword, verifyOTP, resetPassword } from "./routes/auth";
import { getUsers, createUser, updateUser, deleteUser, getLabs, getClubs } from "./routes/users";
import { getClubs as getClubsForManagement, createClub, updateClub, deleteClub, addClubMember, removeClubMember } from "./routes/clubs";
import { getLabs as getLabsForManagement, createLab, updateLab, deleteLab } from "./routes/labs";
import { 
  getBookings, 
  createBooking, 
  updateBookingStatus, 
  deleteBooking, 
  getBookingsByLab,
  getClubPendingBookings,
  getLabPendingBookings
} from "./routes/bookings";
import { getAnalytics, getRealtimeStats } from "./routes/analytics";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationCount,
  testPushNotification
} from "./routes/notifications";
import { connectToDatabase } from "./db";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Initialize database connection
  connectToDatabase().catch(console.error);

  // API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "AI Department Lab Booking System API v1.0" });
  });

  // Auth routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.get("/api/auth/verify", verifyToken);
  app.post("/api/auth/forgot-password", forgotPassword);
  app.post("/api/auth/verify-otp", verifyOTP);
  app.post("/api/auth/reset-password", resetPassword);

  // User management routes
  app.get("/api/users", getUsers);
  app.post("/api/users", createUser);
  app.put("/api/users/:id", updateUser);
  app.delete("/api/users/:id", deleteUser);
  app.get("/api/labs", getLabs); // For user management (lab incharge selection)
  app.get("/api/user-clubs", getClubs); // For user management (club selection)

  // Club management routes
  app.get("/api/clubs", getClubsForManagement);
  app.post("/api/clubs", createClub);
  app.put("/api/clubs/:id", updateClub);
  app.delete("/api/clubs/:id", deleteClub);
  app.post("/api/clubs/:id/members", addClubMember);
  app.delete("/api/clubs/:id/members", removeClubMember);

  // Lab management routes
  app.get("/api/admin/labs", getLabsForManagement); // For admin lab management
  app.post("/api/admin/labs", createLab);
  app.put("/api/admin/labs/:id", updateLab);
  app.delete("/api/admin/labs/:id", deleteLab);

  // Booking management routes
  app.get("/api/bookings", getBookings);
  app.post("/api/bookings", createBooking);
  app.put("/api/bookings/:id/status", updateBookingStatus);
  app.delete("/api/bookings/:id", deleteBooking);
  app.get("/api/bookings/lab/:labId", getBookingsByLab);
  
  // Two-tier approval routes
  app.get("/api/bookings/club-pending/:clubInchargeId", getClubPendingBookings);
  app.get("/api/bookings/lab-pending/:labInchargeId", getLabPendingBookings);

  // Analytics routes
  app.get("/api/analytics", getAnalytics);
  app.get("/api/analytics/realtime", getRealtimeStats);

  // Notification routes
  app.post("/api/notifications/subscribe", subscribeToPush);
  app.post("/api/notifications/unsubscribe", unsubscribeFromPush);
  app.get("/api/notifications/:userId", getNotifications);
  app.get("/api/notifications/:userId/count", getNotificationCount);
  app.put("/api/notifications/:id/read", markNotificationAsRead);
  app.put("/api/notifications/:userId/read-all", markAllNotificationsAsRead);
  app.post("/api/notifications/test/:userId", testPushNotification);

  // Example routes
  app.get("/api/demo", handleDemo);

  return app;
}
