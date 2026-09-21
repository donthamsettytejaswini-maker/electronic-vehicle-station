import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Zap,
  Clock,
  BatteryCharging,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import reportService from '../../services/reportService';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import EnergyChart from '../../components/analytics/EnergyChart';
import ExportButton from '../../components/analytics/ExportButton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const SessionAnalytics = () => {
  const [filters, setFilters] = useState({ preset: 'last_30_days' });
  const [summary, setSummary] = useState(null);
  const [dailySessions, setDailySessions] = useState([]);
  const [dailyEnergy, setDailyEnergy] = useState([]);
  const [byStationEnergy, setByStationEnergy] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currFilters) => {
    setLoading(true);
    try {
      const [sumRes, dailySessRes, dailyEnergyRes, stationEnergyRes] = await Promise.all([
        analyticsService.getSessionAnalytics(currFilters),
        analyticsService.getDailySessions(currFilters),
        analyticsService.getDailyEnergy(currFilters),
        analyticsService.getEnergyByStation(currFilters),
      ]);

      if (sumRes?.success) setSummary(sumRes.data);
      if (dailySessRes?.success) setDailySessions(dailySessRes.data);
      if (dailyEnergyRes?.success) setDailyEnergy(dailyEnergyRes.data);
      if (stationEnergyRes?.success) setByStationEnergy(stationEnergyRes.data);
    } catch (err) {
      console.error('Failed to load session analytics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const handleExportCSV = async () => {
    await reportService.exportSessionsCSV(filters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            Charging Session & Energy Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time charging throughput, session durations, and station energy telemetry.
          </p>
        </div>

        <ExportButton onExport={handleExportCSV} label="Export Sessions CSV" />
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
          title="Total Energy Dispensed"
          value={
            summary?.totalEnergyConsumedKwh
              ? summary.totalEnergyConsumedKwh.toFixed(1)
              : '0.0'
          }
          unit="kWh"
          subtitle={`${summary?.completedSessions || 0} completed charging cycles`}
          icon={Zap}
          color="violet"
          loading={loading}
        />

        <MetricCard
          title="Avg Energy / Session"
          value={
            summary?.averageEnergyConsumedKwh
              ? summary.averageEnergyConsumedKwh.toFixed(1)
              : '0.0'
          }
          unit="kWh"
          subtitle="Average battery charge delivered"
          icon={BatteryCharging}
          color="emerald"
          loading={loading}
        />

        <MetricCard
          title="Avg Session Duration"
          value={`${summary?.averageDurationMinutes || 0}`}
          unit="min"
          subtitle={`Min: ${summary?.minDurationMinutes || 0}m • Max: ${summary?.maxDurationMinutes || 0}m`}
          icon={Clock}
          color="blue"
          loading={loading}
        />

        <MetricCard
          title="Active Telemetry"
          value={summary?.activeSessions || 0}
          subtitle="Currently active charging sessions"
          icon={Activity}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Daily Energy Dispensed Chart */}
      <div className="mb-6">
        <ChartCard
          title="Daily Energy Consumption Trend"
          subtitle="Total kilowatt-hours delivered per day"
          loading={loading}
          empty={dailyEnergy.length === 0}
        >
          <EnergyChart data={dailyEnergy} height={280} />
        </ChartCard>
      </div>

      {/* Grid: Daily Session Volumes & Energy by Station */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Daily Sessions Count */}
        <ChartCard
          title="Daily Session Volumes"
          subtitle="Completed sessions and total charging cycles"
          loading={loading}
          empty={dailySessions.length === 0}
        >
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={dailySessions}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
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
                <Bar dataKey="total" name="Total Initiated" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Energy by Station */}
        <ChartCard
          title="Energy Dispensed by Station"
          subtitle="Total kilowatt-hours delivered per station"
          loading={loading}
          empty={byStationEnergy.length === 0}
        >
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart
                data={byStationEnergy}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  dataKey="stationName"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <Tooltip
                  formatter={(value) => [`${value} kWh`, 'Energy']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="energyConsumedKwh" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default SessionAnalytics;
