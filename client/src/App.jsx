import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Auth Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Dashboards
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Phase 2 User Pages
import Vehicles from './pages/Vehicles';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import Stations from './pages/Stations';
import StationDetails from './pages/StationDetails';

// Phase 2 Admin Pages
import ManageStations from './pages/admin/ManageStations';
import AddStation from './pages/admin/AddStation';
import EditStation from './pages/admin/EditStation';
import ManageChargers from './pages/admin/ManageChargers';
import AddCharger from './pages/admin/AddCharger';
import EditCharger from './pages/admin/EditCharger';

// Phase 3 & 4 User Pages
import BookSlot from './pages/BookSlot';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import BookingQr from './pages/BookingQr';
import CheckIn from './pages/CheckIn';
import ChargingSession from './pages/ChargingSession';
import ChargingHistory from './pages/ChargingHistory';
import ChargingSessionDetails from './pages/ChargingSessionDetails';

// Phase 5 Payments & Billing Pages
import PaymentCheckout from './pages/PaymentCheckout';
import PaymentResult from './pages/PaymentResult';
import PaymentHistory from './pages/PaymentHistory';
import PaymentDetails from './pages/PaymentDetails';
import Receipt from './pages/Receipt';

// Phase 3, 4 & 5 Admin Pages
import ManageBookings from './pages/admin/ManageBookings';
import ActiveSessions from './pages/admin/ActiveSessions';
import SessionDetails from './pages/admin/SessionDetails';
import PaymentManagement from './pages/admin/PaymentManagement';
import RevenueDashboard from './pages/admin/RevenueDashboard';

// Phase 6 Admin Analytics & Reports Pages
import AdminAnalytics from './pages/admin/AdminAnalytics';
import RevenueAnalytics from './pages/admin/RevenueAnalytics';
import BookingAnalytics from './pages/admin/BookingAnalytics';
import SessionAnalytics from './pages/admin/SessionAnalytics';
import ChargerAnalytics from './pages/admin/ChargerAnalytics';
import StationAnalytics from './pages/admin/StationAnalytics';
import Reports from './pages/admin/Reports';

// Phase 7 Pages
import StationMapPage from './pages/StationMapPage';
import FleetDashboard from './pages/fleet/FleetDashboard';
import ManageReviews from './pages/admin/ManageReviews';
import ManagePricingRules from './pages/admin/ManagePricingRules';
import OcppConsole from './pages/admin/OcppConsole';
import LoadManagement from './pages/admin/LoadManagement';

function App() {
  return (
    <Routes>
      {/* Auth Routes (wrapped in AuthLayout with PublicRoute guard) */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Route>

      {/* Main Layout Routes */}
      <Route element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/stations" element={<Stations />} />
        <Route path="/stations/map" element={<StationMapPage />} />
        <Route path="/stations/:id" element={<StationDetails />} />

        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/add" element={<AddVehicle />} />
          <Route path="/vehicles/:id/edit" element={<EditVehicle />} />

          {/* Phase 3 & 4 Slot Booking & QR Check-In */}
          <Route path="/book-slot" element={<BookSlot />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/bookings/:id" element={<BookingDetails />} />
          <Route path="/bookings/:id/qr" element={<BookingQr />} />
          <Route path="/bookings/confirmation/:id" element={<BookingConfirmation />} />
          <Route path="/check-in" element={<CheckIn />} />

          {/* Phase 4 Live Telemetry & History */}
          <Route path="/sessions/:id" element={<ChargingSession />} />
          <Route path="/sessions/:id/details" element={<ChargingSessionDetails />} />
          <Route path="/charging-history" element={<ChargingHistory />} />

          {/* Phase 5 Payments, Invoices & Receipts */}
          <Route path="/payments/checkout/:sessionId" element={<PaymentCheckout />} />
          <Route path="/payments/result/:id" element={<PaymentResult />} />
          <Route path="/payments" element={<PaymentHistory />} />
          <Route path="/payments/:id" element={<PaymentDetails />} />
          <Route path="/payments/:id/receipt" element={<Receipt />} />

          {/* Phase 7 Fleet Operations */}
          <Route path="/fleet" element={<FleetDashboard />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/stations" element={<ManageStations />} />
          <Route path="/admin/stations/add" element={<AddStation />} />
          <Route path="/admin/stations/:id/edit" element={<EditStation />} />
          <Route
            path="/admin/stations/:stationId/chargers"
            element={<ManageChargers />}
          />
          <Route
            path="/admin/stations/:stationId/chargers/add"
            element={<AddCharger />}
          />
          <Route path="/admin/chargers/:id/edit" element={<EditCharger />} />

          {/* Admin Bookings, Active Sessions & Revenue */}
          <Route path="/admin/bookings" element={<ManageBookings />} />
          <Route path="/admin/sessions" element={<ActiveSessions />} />
          <Route path="/admin/sessions/:id" element={<SessionDetails />} />
          <Route path="/admin/payments" element={<PaymentManagement />} />
          <Route path="/admin/revenue" element={<RevenueDashboard />} />

          {/* Phase 6 Admin Analytics & Reports */}
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/analytics/revenue" element={<RevenueAnalytics />} />
          <Route path="/admin/analytics/bookings" element={<BookingAnalytics />} />
          <Route path="/admin/analytics/sessions" element={<SessionAnalytics />} />
          <Route path="/admin/analytics/chargers" element={<ChargerAnalytics />} />
          <Route path="/admin/analytics/stations" element={<StationAnalytics />} />
          <Route path="/admin/reports" element={<Reports />} />

          {/* Phase 7 Admin Advanced Capabilities */}
          <Route path="/admin/reviews" element={<ManageReviews />} />
          <Route path="/admin/pricing" element={<ManagePricingRules />} />
          <Route path="/admin/ocpp" element={<OcppConsole />} />
          <Route path="/admin/load-management" element={<LoadManagement />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
