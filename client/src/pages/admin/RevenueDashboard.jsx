import React, { useState, useEffect } from 'react';
import { getAdminRevenue } from '../../services/paymentService';
import { getStations } from '../../services/stationService';
import RevenueCard from '../../components/payment/RevenueCard';
import {
  DailyRevenueChart,
  StationRevenueChart,
  PaymentMethodDistributionChart,
} from '../../components/payment/RevenueChart';
import {
  DollarSign,
  TrendingUp,
  RotateCcw,
  Clock,
  Zap,
  Activity,
  CreditCard,
  Calendar,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react';

const RevenueDashboard = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [stations, setStations] = useState([]);
  const [stationFilter, setStationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStations = async () => {
      try {
        const res = await getStations({ limit: 50 });
        setStations(res.data || []);
      } catch (e) {
        console.warn('Could not load stations:', e);
      }
    };
    loadStations();
  }, []);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getAdminRevenue({
        ...(stationFilter && { stationId: stationFilter }),
      });
      setRevenueData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to aggregate revenue metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [stationFilter]);

  const summary = revenueData?.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Financial & Energy Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Revenue & Consumption Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time monetization performance, billing volumes, energy dispensed, and gateway metrics.
          </p>
        </div>

        {/* Station Selector Filter */}
        <div className="flex items-center gap-2">
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            <option value="">All Charging Stations</option>
            {stations.map((st) => (
              <option key={st._id} value={st._id}>
                {st.name} ({st.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          {/* 8 Metric Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <RevenueCard
              title="Today's Net Revenue"
              value={summary.todayRevenue || 0}
              prefix="₹"
              icon={TrendingUp}
              color="emerald"
              subtitle="Settled today"
            />

            <RevenueCard
              title="This Month's Revenue"
              value={summary.thisMonthRevenue || 0}
              prefix="₹"
              icon={Calendar}
              color="blue"
              subtitle="Current billing cycle"
            />

            <RevenueCard
              title="Total Net Revenue"
              value={summary.totalPaidRevenue || 0}
              prefix="₹"
              icon={DollarSign}
              color="emerald"
              subtitle={`Gross: ₹${Number(summary.grossRevenue || 0).toLocaleString()}`}
            />

            <RevenueCard
              title="Refunded Volume"
              value={summary.totalRefundedAmount || 0}
              prefix="₹"
              icon={RotateCcw}
              color="purple"
              subtitle="Processed driver refunds"
            />

            <RevenueCard
              title="Pending Invoices"
              value={summary.pendingAmount || 0}
              prefix="₹"
              icon={Clock}
              color="amber"
              subtitle="Unpaid completed sessions"
            />

            <RevenueCard
              title="Energy Dispensed"
              value={Number(summary.totalEnergyConsumedKwh || 0).toFixed(1)}
              suffix="kWh"
              icon={Zap}
              color="emerald"
              subtitle="Total network delivery"
            />

            <RevenueCard
              title="Successful Payments"
              value={summary.successfulPaymentsCount || 0}
              icon={Activity}
              color="blue"
              subtitle="Completed checkouts"
            />

            <RevenueCard
              title="Average Order Value"
              value={Number(summary.averageTransactionValue || 0).toFixed(2)}
              prefix="₹"
              icon={CreditCard}
              color="slate"
              subtitle="Per charging session"
            />
          </div>

          {/* Charts Row 1: Daily Revenue Trend & Station Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Daily Net Revenue (14-Day Trend)</h3>
                  <p className="text-xs text-slate-400">Aggregated daily billing collections</p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Live Feed
                </span>
              </div>
              <DailyRevenueChart data={revenueData?.dailyRevenue} />
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Revenue by Station</h3>
                  <p className="text-xs text-slate-400">Top earning charging hubs</p>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  Station Yield
                </span>
              </div>
              <StationRevenueChart data={revenueData?.revenueByStation} />
            </div>
          </div>

          {/* Charts Row 2: Payment Method Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Payment Channel Mix</h3>
                <p className="text-xs text-slate-400">Volume by UPI, Card, Cash</p>
              </div>
              <PaymentMethodDistributionChart data={revenueData?.methodDistribution} />
            </div>

            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Top Performing Stations</h3>
                <p className="text-xs text-slate-400">Detailed station revenue, energy, and order breakdown</p>
              </div>

              {revenueData?.revenueByStation?.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No station activity recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 text-slate-400 uppercase font-bold">
                      <tr>
                        <th className="py-2.5">Station</th>
                        <th className="py-2.5">Location</th>
                        <th className="py-2.5 text-center">Orders</th>
                        <th className="py-2.5 text-right">Energy Dispensed</th>
                        <th className="py-2.5 text-right">Net Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {revenueData?.revenueByStation?.map((st, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-bold text-slate-800">{st.stationName}</td>
                          <td className="py-3 text-slate-500">{st.city}</td>
                          <td className="py-3 text-center font-mono">{st.count}</td>
                          <td className="py-3 text-right font-mono font-bold text-emerald-600">
                            {Number(st.totalEnergy).toFixed(1)} kWh
                          </td>
                          <td className="py-3 text-right font-mono font-extrabold text-slate-900">
                            ₹{Number(st.netRevenue).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueDashboard;
