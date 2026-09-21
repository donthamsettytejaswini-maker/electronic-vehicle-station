import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Server,
  Zap,
  Plus,
  ArrowRight,
  Settings,
  Activity,
  AlertTriangle,
  QrCode,
  TrendingUp,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStations } from '../services/stationService';
import { getAllBookings } from '../services/bookingService';
import { getAllActiveSessions } from '../services/sessionService';
import { getAdminRevenue } from '../services/paymentService';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStations: 0,
    totalChargers: 0,
    availableChargers: 0,
    chargingChargers: 0,
    maintenanceChargers: 0,
    totalBookings: 0,
    activeSessions: 0,
    totalPaidRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        setLoading(true);
        const [stationRes, bookingRes, sessionRes, revenueRes] = await Promise.all([
          getStations({ status: 'all', limit: 100 }),
          getAllBookings({ limit: 1 }).catch(() => ({ pagination: { total: 0 } })),
          getAllActiveSessions().catch(() => ({ data: [] })),
          getAdminRevenue().catch(() => ({ data: { summary: { totalPaidRevenue: 0 } } })),
        ]);

        let totalCh = 0;
        let availCh = 0;
        let chargingCh = 0;
        let maintCh = 0;

        if (stationRes.data?.items) {
          stationRes.data.items.forEach((st) => {
            totalCh += st.totalChargers || 0;
            availCh += st.availableChargers || 0;
            chargingCh += st.chargingChargers || 0;
            maintCh += st.maintenanceChargers || 0;
          });
        }

        setStats({
          totalStations: stationRes.data?.pagination?.total || stationRes.data?.items?.length || 0,
          totalChargers: totalCh,
          availableChargers: availCh,
          chargingChargers: chargingCh,
          maintenanceChargers: maintCh,
          totalBookings: bookingRes.pagination?.total || 0,
          activeSessions: sessionRes.data?.length || 0,
          totalPaidRevenue: revenueRes.data?.summary?.totalPaidRevenue || 0,
        });
      } catch (err) {
        console.error('Failed to load admin metrics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-navy-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Admin Operations Console • Phase 5 Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            EV Operations & Revenue Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Logged in as <strong className="text-emerald-400">{user?.name}</strong> ({user?.email}). Full supervisory control over stations, bookings, live telemetry, and financial settlements.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400">Financial Gateway</p>
            <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Payment Billing Engine Active
            </p>
          </div>
        </div>
      </div>

      {/* Admin Quick Action Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/analytics"
          className="p-5 bg-white rounded-2xl border border-indigo-300 shadow-sm flex items-center justify-between hover:border-indigo-500 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Analytics Hub</h3>
              <p className="text-[11px] text-slate-500">Live KPIs & Demand</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-indigo-600" />
        </Link>

        <Link
          to="/admin/reports"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-slate-400 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Reports & CSV</h3>
              <p className="text-[11px] text-slate-500">Download audit logs</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-purple-600" />
        </Link>

        <Link
          to="/admin/sessions"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-slate-400 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Telemetry</h3>
              <p className="text-[11px] text-slate-500">Live charging streams</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600" />
        </Link>

        <Link
          to="/admin/stations"
          className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-slate-400 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Manage Stations</h3>
              <p className="text-[11px] text-slate-500">Tariffs & ports</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Admin Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Network Revenue & Operations</h2>
          <span className="text-xs text-slate-500">Live Aggregated Feed</span>
        </div>

        {loading ? (
          <div className="py-12 bg-white rounded-2xl border border-slate-200">
            <LoadingSpinner text="Aggregating financial and station telemetry..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Paid Revenue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Net Revenue Settled
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                ₹{Number(stats.totalPaidRevenue).toLocaleString()}
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 font-medium">
                Verified paid transactions
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Sessions
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.activeSessions}</div>
              <div className="mt-2 text-[11px] text-blue-600 font-medium">
                Simulated charging now
              </div>
            </div>

            {/* Total Bookings */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Bookings
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalBookings}</div>
              <div className="mt-2 text-[11px] text-purple-600 font-medium">
                Reservations on record
              </div>
            </div>

            {/* Total Stations */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Stations
                </span>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalStations}</div>
              <div className="mt-2 text-[11px] text-teal-600 font-medium">
                Active locations in network
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
