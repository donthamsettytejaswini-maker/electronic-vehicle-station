import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Calendar,
  Activity,
  User,
  Car,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  QrCode,
  History,
  CheckCircle2,
  Plus,
  Play,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getVehicles } from '../services/vehicleService';
import { getStations } from '../services/stationService';
import { getUserBookings } from '../services/bookingService';
import { getActiveSession } from '../services/sessionService';

const UserDashboard = () => {
  const { user } = useAuth();
  const [vehicleCount, setVehicleCount] = useState(0);
  const [defaultVehicle, setDefaultVehicle] = useState(null);
  const [activeStationCount, setActiveStationCount] = useState(0);
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
  const [activeSession, setActiveSession] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoadingStats(true);
        const [vRes, sRes, bRes, sessRes] = await Promise.all([
          getVehicles().catch(() => ({ data: [] })),
          getStations({ status: 'active', limit: 1 }).catch(() => ({ data: { pagination: { total: 0 } } })),
          getUserBookings({ status: 'confirmed' }).catch(() => ({ data: [] })),
          getActiveSession().catch(() => ({ data: null })),
        ]);

        const userVehicles = vRes.data?.items || vRes.data || [];
        setVehicleCount(userVehicles.length);
        const def = userVehicles.find((v) => v.isDefault) || userVehicles[0];
        setDefaultVehicle(def || null);

        if (sRes.data?.pagination) {
          setActiveStationCount(sRes.data.pagination.total);
        } else if (Array.isArray(sRes.data)) {
          setActiveStationCount(sRes.data.length);
        }

        const bookings = bRes.data || [];
        setUpcomingBookingsCount(bookings.length);
        setActiveSession(sessRes.data || null);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const profileFields = [user?.name, user?.email, user?.phone, user?.avatar];
  const filledFields = profileFields.filter(Boolean).length;
  const completionPercentage = Math.round((filledFields / 4) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur text-emerald-100">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            EV Driver Hub • Phase 4 Ready
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name || 'EV Driver'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            {defaultVehicle ? (
              <span>
                Primary Vehicle: <strong className="text-white">{defaultVehicle.brand} {defaultVehicle.model}</strong> ({defaultVehicle.licensePlate || defaultVehicle.vehicleNumber} • {defaultVehicle.connectorType})
              </span>
            ) : (
              <span>Add your EV vehicle to easily book compatible charging slots.</span>
            )}
          </p>
        </div>

        {/* Profile Completion Card */}
        <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl p-4 sm:p-5 min-w-[260px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-100">Profile Completion</span>
            <span className="text-xs font-bold text-white">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden mb-3">
            <div
              className="bg-emerald-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          {completionPercentage < 100 ? (
            <Link
              to="/profile"
              className="text-xs font-semibold text-emerald-200 hover:text-white flex items-center gap-1 transition"
            >
              Complete your profile details <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> All profile details complete
            </span>
          )}
        </div>
      </div>

      {/* Active Session Notification Bar */}
      {activeSession && (
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
              <Zap className="w-6 h-6 fill-emerald-400 stroke-none" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Active Charging Session In Progress
              </span>
              <h3 className="text-lg font-mono font-bold">{activeSession.sessionReference}</h3>
              <p className="text-xs text-slate-300">
                Battery: <strong>{activeSession.currentBatteryPercentage}%</strong> • Delivered: <strong>{Number(activeSession.energyConsumedKwh).toFixed(2)} kWh</strong>
              </p>
            </div>
          </div>

          <Link
            to={`/sessions/${activeSession._id}`}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Open Live Screen</span>
          </Link>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Activity & Fleet Overview</h2>
          <span className="text-xs font-medium text-slate-500">Live Counters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: My Registered Vehicles */}
          <Link
            to="/vehicles"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-emerald-500 transition relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                My Vehicles
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{vehicleCount}</div>
            <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <span>Manage garage specs</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* Card 2: Active Charging Stations */}
          <Link
            to="/stations"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-emerald-500 transition relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Stations
              </span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{activeStationCount}</div>
            <div className="mt-2 text-[11px] text-teal-600 font-medium flex items-center gap-1">
              <span>Find nearby chargers</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* Card 3: Upcoming Bookings */}
          <Link
            to="/bookings"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-emerald-500 transition relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Confirmed Bookings
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{upcomingBookingsCount}</div>
            <div className="mt-2 text-[11px] text-purple-600 font-medium flex items-center gap-1">
              <span>View digital passes</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>

          {/* Card 4: Charging History */}
          <Link
            to="/charging-history"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:border-emerald-500 transition relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Charging History
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <History className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">Logs</div>
            <div className="mt-2 text-[11px] text-amber-600 font-medium flex items-center gap-1">
              <span>View telemetry sessions</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <span className="text-xs text-slate-500">Platform Shortcuts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Action 1: Reserve Slot */}
          <Link
            to="/book-slot"
            className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-600 transition-colors">
                Reserve Charging Slot
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Select your EV, pick date & time, and book your dedicated station charger port.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              Book Slot <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Action 2: Check-In Terminal */}
          <Link
            to="/check-in"
            className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-teal-600 transition-colors">
                Terminal Check-In
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Scan your QR digital pass or enter reference code to unlock simulated charging.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600">
              Check-In Now <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Action 3: Add Vehicle */}
          <Link
            to="/vehicles/add"
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Add Electric Vehicle
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Register vehicle battery kWh capacity, connector type, and license plate.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
              Add Vehicle <Plus className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Action 4: Payments & Invoices */}
          <Link
            to="/payments"
            className="p-5 bg-white rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-purple-600 transition-colors">
                Payments & Invoices
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Review settled charging invoices, download tax receipts, and track transactions.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600">
              View Invoices <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
