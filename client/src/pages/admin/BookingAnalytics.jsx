import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import reportService from '../../services/reportService';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import BookingChart from '../../components/analytics/BookingChart';
import PeakHoursChart from '../../components/analytics/PeakHoursChart';
import ExportButton from '../../components/analytics/ExportButton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const STATUS_COLORS = {
  completed: '#10b981',
  confirmed: '#0284c7',
  cancelled: '#f43f5e',
  expired: '#94a3b8',
  checked_in: '#8b5cf6',
  charging: '#f59e0b',
};

const BookingAnalytics = () => {
  const [filters, setFilters] = useState({ preset: 'last_30_days' });
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [byStationData, setByStationData] = useState([]);
  const [byStatusData, setByStatusData] = useState([]);
  const [peakHoursData, setPeakHoursData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currFilters) => {
    setLoading(true);
    try {
      const [sumRes, dailyRes, stationRes, statusRes, peakRes] = await Promise.all([
        analyticsService.getBookingAnalytics(currFilters),
        analyticsService.getDailyBookings(currFilters),
        analyticsService.getBookingsByStation(currFilters),
        analyticsService.getBookingsByStatus(currFilters),
        analyticsService.getPeakHours(currFilters),
      ]);

      if (sumRes?.success) setSummary(sumRes.data);
      if (dailyRes?.success) setDailyData(dailyRes.data);
      if (stationRes?.success) setByStationData(stationRes.data);
      if (statusRes?.success) setByStatusData(statusRes.data);
      if (peakRes?.success) setPeakHoursData(peakRes.data);
    } catch (err) {
      console.error('Failed to load booking analytics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const handleExportCSV = async () => {
    await reportService.exportBookingsCSV(filters);
  };

  const statusPieData = byStatusData.map((s) => ({
    name: s.status ? s.status.replace('_', ' ').toUpperCase() : 'UNKNOWN',
    value: s.count,
    rawKey: s.status,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Booking & Reservation Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Slot reservation fulfillment, cancellation metrics, and peak charging demand hours.
          </p>
        </div>

        <ExportButton onExport={handleExportCSV} label="Export Bookings CSV" />
      </div>

      {/* Filters */}
      <AnalyticsFilters
        filters={filters}
        onApplyFilters={(f) => setFilters(f)}
        onResetFilters={() => setFilters({ preset: 'last_30_days' })}
        loading={loading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Bookings"
          value={summary?.totalBookings || 0}
          subtitle="All slots scheduled in period"
          icon={Calendar}
          color="blue"
          loading={loading}
        />

        <MetricCard
          title="Completed Bookings"
          value={summary?.completed || 0}
          subtitle="Successfully fulfilled slots"
          icon={CheckCircle2}
          color="emerald"
          loading={loading}
        />

        <MetricCard
          title="Cancellation Rate"
          value={`${summary?.cancellationRate || 0}%`}
          subtitle={`${summary?.cancelled || 0} cancelled reservations`}
          icon={XCircle}
          color={summary?.cancellationRate > 15 ? 'rose' : 'amber'}
          loading={loading}
        />

        <MetricCard
          title="Avg Slot Duration"
          value={`${summary?.averageDurationMinutes || 0}`}
          unit="min"
          subtitle="Average scheduled charging duration"
          icon={Clock}
          color="indigo"
          loading={loading}
        />
      </div>

      {/* Daily Booking Flow */}
      <div className="mb-6">
        <ChartCard
          title="Daily Booking Status Flow"
          subtitle="Volume of confirmed, completed, and cancelled reservations"
          loading={loading}
          empty={dailyData.length === 0}
        >
          <BookingChart data={dailyData} height={300} />
        </ChartCard>
      </div>

      {/* Grid: 24-Hour Peak Demand & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Peak Demand Histogram */}
        <ChartCard
          title="24-Hour Peak Demand Histogram"
          subtitle="Distribution of booking start times throughout the day (IST)"
          className="lg:col-span-2"
          loading={loading}
          empty={peakHoursData.length === 0}
        >
          <PeakHoursChart data={peakHoursData} height={260} />
        </ChartCard>

        {/* Status Distribution Pie Chart */}
        <ChartCard
          title="Booking Status Distribution"
          subtitle="Proportion of slot lifecycle statuses"
          loading={loading}
          empty={statusPieData.length === 0}
        >
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.rawKey] || '#64748b'}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Bookings by Station */}
      <div className="mb-6">
        <ChartCard
          title="Bookings by Station"
          subtitle="Reservation demand and cancellation rate per station"
          loading={loading}
          empty={byStationData.length === 0}
        >
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart
                data={byStationData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="stationName"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Bar dataKey="total" name="Total Bookings" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default BookingAnalytics;
