import React, { useState, useEffect, useCallback } from 'react';
import {
  BatteryCharging,
  Zap,
  Info,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import ChargerStatusChart from '../../components/analytics/ChargerStatusChart';

const ChargerAnalytics = () => {
  const [filters, setFilters] = useState({ preset: 'last_30_days' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currFilters) => {
    setLoading(true);
    try {
      const res = await analyticsService.getChargerAnalytics(currFilters);
      if (res?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load charger analytics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const statusMap = data?.statusDistribution || {};
  const chargersList = data?.chargers || [];
  const topUsed = data?.topUsedChargers || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BatteryCharging className="w-6 h-6 text-indigo-600" />
          Charger Utilization & Port Telemetry
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Port utilization rates, connector uptime approximations, and high-frequency charging hardware.
        </p>
      </div>

      {/* Approximation Warning Alert */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Hardware Note: </span>
          {data?.warning ||
            'Utilization is estimated from bookings and simulated sessions. Physical charger uptime is not connected.'}
        </div>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        filters={filters}
        onApplyFilters={(f) => setFilters(f)}
        onResetFilters={() => setFilters({ preset: 'last_30_days' })}
        loading={loading}
      />

      {/* Top Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Ports
          </div>
          <div className="text-2xl font-black text-slate-900">
            {data?.totalChargers || 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 shadow-sm text-center">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
            Available
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {statusMap.available || 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-sky-100 bg-sky-50/20 p-4 shadow-sm text-center">
          <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider mb-1">
            Charging
          </div>
          <div className="text-2xl font-black text-sky-600">
            {statusMap.charging || 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 bg-amber-50/20 p-4 shadow-sm text-center">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">
            Reserved
          </div>
          <div className="text-2xl font-black text-amber-600">
            {statusMap.reserved || 0}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-rose-100 bg-rose-50/20 p-4 shadow-sm text-center">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
            Maintenance
          </div>
          <div className="text-2xl font-black text-rose-600">
            {statusMap.maintenance || 0}
          </div>
        </div>
      </div>

      {/* Grid: Status Donut Chart & Top Used Chargers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Status Distribution */}
        <ChartCard
          title="Charger Status Distribution"
          subtitle="Real-time distribution of ports across stations"
          loading={loading}
          empty={!data?.totalChargers}
        >
          <ChargerStatusChart statusMap={statusMap} height={260} />
        </ChartCard>

        {/* Top Used Chargers */}
        <ChartCard
          title="Top Utilized Ports"
          subtitle="Charger hardware with highest occupancy percentage"
          className="lg:col-span-2"
          loading={loading}
          empty={topUsed.length === 0}
        >
          <div className="space-y-3">
            {topUsed.map((c, idx) => (
              <div
                key={c.chargerId}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      {c.chargerNumber} ({c.connectorType})
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {c.stationName} • {c.powerRating} kW
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-indigo-600">
                    {c.utilizationRate.toFixed(1)}% util
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {c.completedSessions} sessions • {c.energyConsumedKwh.toFixed(1)} kWh
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Charger Utilization Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            All Charger Ports Performance & Utilization
          </h3>
          <span className="text-xs text-slate-400">
            {chargersList.length} total ports configured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Port Number</th>
                <th className="py-3 px-3">Station</th>
                <th className="py-3 px-3">Type & Power</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Bookings</th>
                <th className="py-3 px-3 text-right">Sessions</th>
                <th className="py-3 px-3 text-right">Energy (kWh)</th>
                <th className="py-3 px-4 text-right">Utilization %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {chargersList.map((c) => (
                <tr key={c.chargerId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {c.chargerNumber}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{c.stationName}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800">
                      {c.connectorType}
                    </span>{' '}
                    <span className="text-[10px] text-slate-400">
                      ({c.powerRating} kW - {c.chargingSpeed})
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        c.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700'
                          : c.status === 'charging'
                          ? 'bg-sky-50 text-sky-700'
                          : c.status === 'reserved'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-semibold">
                    {c.totalBookings}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                    {c.completedSessions}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold">
                    {c.energyConsumedKwh.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-600">
                    {c.utilizationRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChargerAnalytics;
