import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LabBooking from "./pages/LabBooking";
import MyBookings from "./pages/MyBookings";
import ApproveBookings from "./pages/ApproveBookings";
import UserManagement from "./pages/admin/UserManagement";
import ClubManagement from "./pages/admin/ClubManagement";
import LabManagement from "./pages/admin/LabManagement";
import Analytics from "./pages/admin/Analytics";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Booking Routes */}
          <Route path="/booking" element={<LabBooking />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/approve-bookings" element={<ApproveBookings />} />
          
          {/* Admin Routes */}
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/clubs" element={<ClubManagement />} />
          <Route path="/admin/labs" element={<LabManagement />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          
          {/* Management Routes */}
          <Route path="/club-bookings" element={<PlaceholderPage title="Club Bookings" description="Manage laboratory bookings for your club" />} />
          <Route path="/club-members" element={<PlaceholderPage title="Club Members" description="Manage club membership and roles" />} />
          <Route path="/lab-management" element={<PlaceholderPage title="Laboratory Management" description="Oversee laboratory operations and maintenance" />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
