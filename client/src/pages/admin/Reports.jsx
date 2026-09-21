import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Activity,
  CreditCard,
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import reportService from '../../services/reportService';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import ExportButton from '../../components/analytics/ExportButton';
import AnalyticsEmptyState from '../../components/analytics/AnalyticsEmptyState';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);

const TABS = [
  { id: 'bookings', label: 'Bookings Report', icon: Calendar },
  { id: 'sessions', label: 'Charging Sessions', icon: Activity },
  { id: 'payments', label: 'Payment Ledger', icon: CreditCard },
  { id: 'energy', label: 'Energy Throughput', icon: Zap },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [filters, setFilters] = useState({ preset: 'last_30_days' });
  const [page, setPage] = useState(1);
  const limit = 15;

  const [summary, setSummary] = useState(null);
  const [reportData, setReportData] = useState({ items: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  // Load Report Summary
  const loadSummary = useCallback(async () => {
    try {
      const res = await reportService.getReportSummary(filters);
      if (res?.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load report summary', err);
    }
  }, [filters]);

  // Load Tab Data
  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit };
      let res;
      if (activeTab === 'bookings') {
        res = await reportService.getBookingsReport(params);
      } else if (activeTab === 'sessions') {
        res = await reportService.getSessionsReport(params);
      } else if (activeTab === 'payments') {
        res = await reportService.getPaymentsReport(params);
      } else if (activeTab === 'energy') {
        res = await reportService.getEnergyReport(params);
      }

      if (res?.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report tab data', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, page]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      if (activeTab === 'bookings') {
        await reportService.exportBookingsCSV(filters);
      } else if (activeTab === 'sessions') {
        await reportService.exportSessionsCSV(filters);
      } else if (activeTab === 'payments') {
        await reportService.exportPaymentsCSV(filters);
      } else if (activeTab === 'energy') {
        await reportService.exportEnergyCSV(filters);
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExportLoading(false);
    }
  };

  const pagination = reportData.pagination || { total: 0, pages: 1, page: 1 };
  const items = reportData.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Audit Reports & CSV Data Exports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export raw operational logs, financial ledgers, and station telemetry for business intelligence.
          </p>
        </div>

        <ExportButton
          onExport={handleExportCSV}
          loading={exportLoading}
          label={`Export ${TABS.find((t) => t.id === activeTab)?.label} (CSV)`}
        />
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Bookings in Period
          </span>
          <span className="text-xl font-black text-slate-900">
            {summary?.totalBookings || 0}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Charging Sessions
          </span>
          <span className="text-xl font-black text-slate-900">
            {summary?.totalSessions || 0}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Energy Output (kWh)
          </span>
          <span className="text-xl font-black text-purple-600">
            {summary?.totalEnergyKwh ? summary.totalEnergyKwh.toFixed(1) : '0.0'}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Settled Revenue
          </span>
          <span className="text-xl font-black text-emerald-600">
            {formatINR(summary?.totalRevenue)}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <AnalyticsFilters
        filters={filters}
        onApplyFilters={(f) => {
          setFilters(f);
          setPage(1);
        }}
        onResetFilters={() => {
          setFilters({ preset: 'last_30_days' });
          setPage(1);
        }}
        loading={loading}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <AnalyticsEmptyState
            title="No report entries found"
            description="No transactions or events match the selected dates and station filters."
          />
        ) : (
          <div className="overflow-x-auto">
            {/* BOOKINGS TABLE */}
            {activeTab === 'bookings' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-3">Driver</th>
                    <th className="py-3 px-3">Station & Port</th>
                    <th className="py-3 px-3">Vehicle</th>
                    <th className="py-3 px-3">Start Time</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {b.bookingReference}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{b.userId?.name || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{b.userId?.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{b.stationId?.name}</div>
                        <div className="text-[10px] text-slate-400">Port {b.chargerId?.chargerNumber}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold">{b.vehicleId?.vehicleNumber || 'N/A'}</td>
                      <td className="py-3 px-3 text-slate-500">
                        {b.startTime ? new Date(b.startTime).toLocaleString('en-IN') : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            b.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* SESSIONS TABLE */}
            {activeTab === 'sessions' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Session Ref</th>
                    <th className="py-3 px-3">Station & Port</th>
                    <th className="py-3 px-3">Driver</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3 text-right">Energy (kWh)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Bill Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {s.sessionReference}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{s.stationId?.name}</div>
                        <div className="text-[10px] text-slate-400">Port {s.chargerId?.chargerNumber}</div>
                      </td>
                      <td className="py-3 px-3">{s.userId?.name || 'N/A'}</td>
                      <td className="py-3 px-3 text-slate-600">{s.actualDurationMinutes || 0} min</td>
                      <td className="py-3 px-3 text-right font-bold text-purple-700">
                        {s.energyConsumedKwh?.toFixed(1) || '0.0'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatINR(s.finalBillAmount || s.paymentId?.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PAYMENTS TABLE */}
            {activeTab === 'payments' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Invoice / Ref</th>
                    <th className="py-3 px-3">Driver</th>
                    <th className="py-3 px-3">Station</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{p.invoiceNumber}</div>
                        <div className="text-[10px] font-mono text-slate-400">{p.paymentReference}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{p.userId?.name || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{p.userId?.email}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{p.stationId?.name}</td>
                      <td className="py-3 px-3 capitalize text-slate-600">{p.paymentMethod?.replace('mock_', 'Demo ')}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatINR(p.amount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status === 'refunded'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ENERGY TABLE */}
            {activeTab === 'energy' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Session Ref</th>
                    <th className="py-3 px-3">Station</th>
                    <th className="py-3 px-3">Charger Port</th>
                    <th className="py-3 px-3 text-right">Energy (kWh)</th>
                    <th className="py-3 px-3 text-right">Rate / kWh</th>
                    <th className="py-3 px-3 text-right">Total Charge</th>
                    <th className="py-3 px-4">Completion Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((e) => (
                    <tr key={e._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {e.sessionReference}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{e.stationId?.name}</td>
                      <td className="py-3 px-3">
                        Port {e.chargerId?.chargerNumber} ({e.chargerId?.connectorType})
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-purple-700">
                        {e.energyConsumedKwh?.toFixed(1) || '0.0'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        ₹{e.chargerId?.pricePerKwh || e.stationId?.pricePerKwh || 0}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">
                        {formatINR(e.finalBillAmount || e.paymentId?.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {e.completedAt ? new Date(e.completedAt).toLocaleString('en-IN') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.pages}</span> ({pagination.total} total items)
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
