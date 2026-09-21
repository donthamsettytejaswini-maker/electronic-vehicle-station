import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  RotateCcw,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import analyticsService from '../../services/analyticsService';
import reportService from '../../services/reportService';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import MetricCard from '../../components/analytics/MetricCard';
import ChartCard from '../../components/analytics/ChartCard';
import RevenueChart from '../../components/analytics/RevenueChart';
import PaymentStatusChart from '../../components/analytics/PaymentStatusChart';
import ExportButton from '../../components/analytics/ExportButton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const RevenueAnalytics = () => {
  const [filters, setFilters] = useState({ preset: 'last_30_days' });
  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [byStationData, setByStationData] = useState([]);
  const [byMethodData, setByMethodData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currFilters) => {
    setLoading(true);
    try {
      const [sumRes, dailyRes, monthRes, stationRes, methodRes] = await Promise.all([
        analyticsService.getRevenue(currFilters),
        analyticsService.getDailyRevenue(currFilters),
        analyticsService.getMonthlyRevenue(currFilters),
        analyticsService.getRevenueByStation(currFilters),
        analyticsService.getRevenueByPaymentMethod(currFilters),
      ]);

      if (sumRes?.success) setSummary(sumRes.data);
      if (dailyRes?.success) setDailyData(dailyRes.data);
      if (monthRes?.success) setMonthlyData(monthRes.data);
      if (stationRes?.success) setByStationData(stationRes.data);
      if (methodRes?.success) setByMethodData(methodRes.data);
    } catch (err) {
      console.error('Failed to load revenue analytics', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const handleExportCSV = async () => {
    await reportService.exportPaymentsCSV(filters);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Revenue Analytics & Settlements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative billing settlements, refund auditing, and station revenue yield.
          </p>
        </div>

        <ExportButton
          onExport={handleExportCSV}
          label="Export Payments CSV"
        />
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
          title="Gross Revenue"
          value={formatINR(summary?.grossRevenue)}
          subtitle={`${summary?.paidTransactions || 0} successful payments`}
          icon={DollarSign}
          color="emerald"
          loading={loading}
        />

        <MetricCard
          title="Net Revenue"
          value={formatINR(summary?.netRevenue)}
          subtitle="Gross revenue minus refund adjustments"
          icon={ArrowUpRight}
          color="blue"
          loading={loading}
        />

        <MetricCard
          title="Refunds Issued"
          value={formatINR(summary?.refunds)}
          subtitle="Total refunded transactions"
          icon={RotateCcw}
          color="rose"
          loading={loading}
        />

        <MetricCard
          title="Pending Settlements"
          value={formatINR(summary?.pendingAmount)}
          subtitle="Unpaid or in-flight checkouts"
          icon={Clock}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Daily Revenue Area / Bar Chart */}
      <div className="mb-6">
        <ChartCard
          title="Daily Revenue Trend"
          subtitle="Daily gross revenue, net revenue, and refunds"
          loading={loading}
          empty={dailyData.length === 0}
        >
          <RevenueChart data={dailyData} height={300} showBreakdown={true} />
        </ChartCard>
      </div>

      {/* Grid: Station Revenue & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue by Station */}
        <ChartCard
          title="Revenue Yield by Station"
          subtitle="Top gross revenue generating EV stations"
          className="lg:col-span-2"
          loading={loading}
          empty={byStationData.length === 0}
        >
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart
                data={byStationData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `₹${val}`}
                />
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
                  formatter={(value) => [formatINR(value), 'Gross Revenue']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="grossRevenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Payment Methods Breakdown */}
        <ChartCard
          title="Payment Methods Breakdown"
          subtitle="Distribution of settlement channels"
          loading={loading}
          empty={byMethodData.length === 0}
        >
          <PaymentStatusChart data={byMethodData} height={280} />
        </ChartCard>
      </div>
    </div>
  );
};

export default RevenueAnalytics;
