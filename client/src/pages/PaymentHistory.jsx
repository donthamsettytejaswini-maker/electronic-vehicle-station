import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyPayments } from '../services/paymentService';
import { getStations } from '../services/stationService';
import PaymentStatusBadge from '../components/payment/PaymentStatusBadge';
import {
  CreditCard,
  FileText,
  Filter,
  Loader2,
  Calendar,
  Zap,
  MapPin,
  ArrowRight,
  Receipt as ReceiptIcon,
} from 'lucide-react';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [stations, setStations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const res = await getStations({ limit: 50 });
        setStations(res.data || []);
      } catch (e) {
        console.warn('Could not load station filters:', e);
      }
    };
    loadStations();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getMyPayments({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(stationFilter && { stationId: stationFilter }),
      });
      setPayments(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.warn('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, stationFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Billing Ledger
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Payment History
        </h1>
        <p className="text-sm text-slate-500">
          Track completed session payments, view digital receipts, and download tax invoices.
        </p>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Station
          </label>
          <select
            value={stationFilter}
            onChange={(e) => {
              setStationFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Stations</option>
            {stations.map((st) => (
              <option key={st._id} value={st._id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setStatusFilter('');
              setStationFilter('');
              setPage(1);
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm text-slate-500 space-y-3">
          <ReceiptIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">
            No payment records are available yet.
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you complete EV charging sessions and settle bills, your payments and receipts will be cataloged here.
          </p>
          <div className="pt-2">
            <Link
              to="/charging-history"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition inline-block shadow-sm"
            >
              View Charging History
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => {
            const isPaid = p.status === 'paid' || p.status === 'partially_refunded';
            return (
              <div
                key={p._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-slate-900">
                      {p.invoiceNumber}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({p.paymentReference})</span>
                    <PaymentStatusBadge status={p.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()} •{' '}
                    {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Station</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {p.stationId?.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Energy Dispensed</span>
                    <span className="font-bold text-slate-800 block">
                      {Number(p.energyConsumedKwh).toFixed(2)} kWh
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Payment Method</span>
                    <span className="font-bold text-slate-800 capitalize block">
                      {p.paymentMethod?.replace('mock_', 'Demo ').replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Total Amount</span>
                    <span className="font-extrabold text-slate-900 text-sm block font-mono">
                      ₹{Number(p.totalAmount).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 col-span-2 sm:col-span-4 lg:col-span-1">
                    {isPaid ? (
                      <Link
                        to={`/payments/${p._id}/receipt`}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs transition flex items-center gap-1 border border-emerald-200"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Receipt</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/payments/checkout/${p.sessionId?._id || p.sessionId}`}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-sm"
                      >
                        <span>Pay Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
