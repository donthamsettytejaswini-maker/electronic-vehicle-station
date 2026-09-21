import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Zap,
  Activity,
  BatteryCharging,
  Clock,
  Radio,
  FileSpreadsheet,
  Layers,
  ArrowRight,
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import socketService from '../../services/socketService';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import RevenueChart from '../../components/analytics/RevenueChart';
import BookingChart from '../../components/analytics/BookingChart';
import EnergyChart from '../../components/analytics/EnergyChart';
import ChargerStatusChart from '../../components/analytics/ChargerStatusChart';
import PeakHoursChart from '../../components/analytics/PeakHoursChart';
import StationPerformanceTable from '../../components/analytics/StationPerformanceTable';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const AdminAnalytics = () => {
  const [filters, setFilters] = useState({ preset: 'last_30_days' });
  const [overview, setOverview] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [dailyBookings, setDailyBookings] = useState([]);
  const [dailyEnergy, setDailyEnergy] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [stations, setStations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeSessionLiveCount, setActiveSessionLiveCount] = useState(null);

  // Fetch all analytics datasets
  const fetchAnalyticsData = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        dailyRevRes,
        dailyBookingsRes,
        dailyEnergyRes,
        peakHoursRes,
        stationsRes,
      ] = await Promise.all([
        analyticsService.getOverview(currentFilters),
        analyticsService.getDailyRevenue(currentFilters),
        analyticsService.getDailyBookings(currentFilters),
        analyticsService.getDailyEnergy(currentFilters),
        analyticsService.getPeakHours(currentFilters),
        analyticsService.getStationPerformance(currentFilters),
      ]);

      if (overviewRes?.success) setOverview(overviewRes.data);
      if (dailyRevRes?.success) setDailyRevenue(dailyRevRes.data);
      if (dailyBookingsRes?.success) setDailyBookings(dailyBookingsRes.data);
      if (dailyEnergyRes?.success) setDailyEnergy(dailyEnergyRes.data);
      if (peakHoursRes?.success) setPeakHours(peakHoursRes.data);
      if (stationsRes?.success) setStations(stationsRes.data);
    } catch (err) {
      console.error('Failed to load analytics dashboard data', err);
      setError('Failed to load analytics data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData(filters);
  }, [filters, fetchAnalyticsData]);

  // Socket.IO real-time monitoring and 30s polling fallback
  useEffect(() => {
    const socket = socketService.connectSocket();

    const handleConnect = () => {
      setSocketConnected(true);
      socketService.joinAdminMonitoring();
    };

    const handleDisconnect = () => {
      setSocketConnected(false);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }
    socket.on('disconnect', handleDisconnect);

    // Live session update listener
    const handleSessionUpdate = (sessionData) => {
      if (sessionData?.status === 'charging' || sessionData?.status === 'initiated') {
        setActiveSessionLiveCount((prev) => (prev !== null ? prev + 1 : 1));
      } else if (sessionData?.status === 'completed' || sessionData?.status === 'stopped') {
        setActiveSessionLiveCount((prev) => (prev && prev > 0 ? prev - 1 : 0));
        // Refresh overview metrics smoothly
        fetchAnalyticsData(filters);
      }
    };

    socketService.subscribeToSessionUpdates(handleSessionUpdate);

    // 30-second polling fallback
    const pollInterval = setInterval(() => {
      fetchAnalyticsData(filters);
    }, 30000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socketService.unsubscribeFromSessionUpdates(handleSessionUpdate);
      socketService.leaveAdminMonitoring();
      clearInterval(pollInterval);
    };
  }, [filters, fetchAnalyticsData]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({ preset: 'last_30_days' });
  };

  const rev = overview?.revenue || {};
  const sessions = overview?.sessions || {};
  const bookings = overview?.bookings || {};
  const energy = overview?.energy || {};
  const chargers = overview?.chargers || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Analytics & Intelligence Hub
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                socketConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <Radio
                className={`w-3 h-3 ${
                  socketConnected ? 'animate-pulse text-emerald-600' : 'text-amber-500'
                }`}
              />
              <span>
                {socketConnected
                  ? 'Live Telemetry'
                  : 'Live updates unavailable (Polling 30s)'}
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System performance, kilowatt-hour distributions, station revenues, and peak demand analytics.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            to="/admin/reports"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reports & CSV</span>
          </Link>
          <Link
            to="/admin/revenue"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Revenue Hub</span>
          </Link>
        </div>
      </div>

      {/* Global Filter Bar */}
      <AnalyticsFilters
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        loading={loading}
      />

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => fetchAnalyticsData(filters)}
            className="underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Gross Revenue"
          value={formatINR(rev.grossRevenue)}
          subtitle={`Net: ${formatINR(rev.netRevenue)}`}
          icon={DollarSign}
          color="emerald"
          loading={loading}
          badge={`${rev.paidTransactions || 0} paid`}
        />

        <MetricCard
          title="Total Bookings"
          value={bookings.total || 0}
          subtitle={`${bookings.completed || 0} completed • ${bookings.cancelled || 0} cancelled`}
          icon={Calendar}
          color="blue"
          loading={loading}
        />

        <MetricCard
          title="Energy Dispensed"
          value={energy.totalKwh ? energy.totalKwh.toFixed(1) : '0.0'}
          unit="kWh"
          subtitle={`Avg: ${energy.averageKwhPerSession ? energy.averageKwhPerSession.toFixed(1) : 0} kWh / session`}
          icon={Zap}
          color="violet"
          loading={loading}
        />

        <MetricCard
          title="Active Sessions"
          value={
            activeSessionLiveCount !== null
              ? activeSessionLiveCount
              : sessions.active || 0
          }
          subtitle={`${sessions.completed || 0} total completed sessions`}
          icon={Activity}
          color="amber"
          loading={loading}
          badge={socketConnected ? 'LIVE' : 'SYNCED'}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Charger Availability"
          value={`${chargers.available || 0} / ${chargers.total || 0}`}
          subtitle={`${chargers.charging || 0} in use • ${chargers.maintenance || 0} maintenance`}
          icon={BatteryCharging}
          color="indigo"
          loading={loading}
        />

        <MetricCard
          title="Avg Session Duration"
          value={`${sessions.averageDurationMinutes || 0}`}
          unit="minutes"
          subtitle="Based on completed charging cycles"
          icon={Clock}
          color="blue"
          loading={loading}
        />

        <MetricCard
          title="Avg Ticket Size"
          value={formatINR(rev.averageTransactionValue)}
          subtitle={`Pending settlements: ${formatINR(rev.pendingAmount)}`}
          icon={TrendingUp}
          color="emerald"
          loading={loading}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Timeline */}
        <ChartCard
          title="Daily Revenue Trend"
          subtitle="Gross vs Net settlement over selected date range"
          actions={
            <Link
              to="/admin/analytics/revenue"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          }
          loading={loading}
          empty={dailyRevenue.length === 0}
        >
          <RevenueChart data={dailyRevenue} height={280} />
        </ChartCard>

        {/* Daily Booking Flow */}
        <ChartCard
          title="Booking Volume & Completion"
          subtitle="Daily slots booked, completed, and cancelled"
          actions={
            <Link
              to="/admin/analytics/bookings"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          }
          loading={loading}
          empty={dailyBookings.length === 0}
        >
          <BookingChart data={dailyBookings} height={280} />
        </ChartCard>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Energy Consumption Trend */}
        <ChartCard
          title="Energy Dispensed (kWh)"
          subtitle="Kilowatt-hour throughput across all stations"
          className="lg:col-span-2"
          actions={
            <Link
              to="/admin/analytics/sessions"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Details <ArrowRight className="w-3 h-3" />
            </Link>
          }
          loading={loading}
          empty={dailyEnergy.length === 0}
        >
          <EnergyChart data={dailyEnergy} height={260} />
        </ChartCard>

        {/* Charger Port Status */}
        <ChartCard
          title="Charger Status Distribution"
          subtitle="Real-time port availability breakdown"
          actions={
            <Link
              to="/admin/analytics/chargers"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Ports <ArrowRight className="w-3 h-3" />
            </Link>
          }
          loading={loading}
          empty={!chargers.total}
        >
          <ChargerStatusChart statusMap={chargers} height={260} />
        </ChartCard>
      </div>

      {/* 24-Hour Peak Demand & Hourly Load */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartCard
          title="24-Hour Peak Demand Distribution"
          subtitle="Hourly booking distribution across the day (IST)"
          className="lg:col-span-3"
          loading={loading}
          empty={peakHours.length === 0}
        >
          <PeakHoursChart data={peakHours} height={240} />
        </ChartCard>
      </div>

      {/* Station Performance Matrix Table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Station Performance Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Comparative station output, financial yield, and slot cancellation percentages.
            </p>
          </div>
          <Link
            to="/admin/analytics/stations"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            All Stations Matrix <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <StationPerformanceTable stations={stations} loading={loading} />
      </div>
    </div>
  );
};

export default AdminAnalytics;
