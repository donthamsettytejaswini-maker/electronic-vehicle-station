import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Zap,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  Building,
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import StationPerformanceTable from '../../components/analytics/StationPerformanceTable';
import MetricCard from '../../components/analytics/MetricCard';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const StationAnalytics = () => {
  const [filters, setFilters] = useState({ preset: 'last_30_days' });
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currFilters) => {
    setLoading(true);
    try {
      const res = await analyticsService.getStationPerformance(currFilters);
      if (res?.success) {
        setStations(res.data);
      }
    } catch (err) {
      console.error('Failed to load station analytics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  // Aggregate totals across all stations
  let totalGross = 0;
  let totalNet = 0;
  let totalEnergy = 0;
  let totalSessions = 0;

  stations.forEach((s) => {
    totalGross += s.grossRevenue || 0;
    totalNet += s.netRevenue || 0;
    totalEnergy += s.energyConsumedKwh || 0;
    totalSessions += s.completedSessions || 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Building className="w-6 h-6 text-emerald-600" />
          Station Performance Matrix & Locations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Comparative station revenue yield, port availability, energy throughput, and cancellation metrics.
        </p>
      </div>

      {/* Filters */}
      <AnalyticsFilters
        filters={filters}
        showChargerFilter={false}
        onApplyFilters={(f) => setFilters(f)}
        onResetFilters={() => setFilters({ preset: 'last_30_days' })}
        loading={loading}
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Active Hubs"
          value={stations.length}
          subtitle="Operating charging locations"
          icon={MapPin}
          color="emerald"
          loading={loading}
        />

        <MetricCard
          title="Cumulative Revenue"
          value={formatINR(totalGross)}
          subtitle={`Net: ${formatINR(totalNet)}`}
          icon={DollarSign}
          color="blue"
          loading={loading}
        />

        <MetricCard
          title="Total Energy Dispensed"
          value={totalEnergy.toFixed(1)}
          unit="kWh"
          subtitle="Across all station chargers"
          icon={Zap}
          color="violet"
          loading={loading}
        />

        <MetricCard
          title="Completed Sessions"
          value={totalSessions}
          subtitle="Charging cycles delivered"
          icon={TrendingUp}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Main Sortable Station Table */}
      <div className="mb-8">
        <div className="mb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Station Comparative Performance Table
          </h2>
          <p className="text-xs text-slate-500">
            Click table headers to sort by revenue, bookings, energy, sessions, or cancellation rate.
          </p>
        </div>

        <StationPerformanceTable stations={stations} loading={loading} />
      </div>
    </div>
  );
};

export default StationAnalytics;
