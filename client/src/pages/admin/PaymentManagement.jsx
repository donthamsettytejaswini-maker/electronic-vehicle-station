import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminPayments, requestRefund } from '../../services/paymentService';
import { getStations } from '../../services/stationService';
import PaymentStatusBadge from '../../components/payment/PaymentStatusBadge';
import RefundDialog from '../../components/payment/RefundDialog';
import {
  CreditCard,
  Search,
  Filter,
  FileText,
  RotateCcw,
  Loader2,
  Calendar,
  AlertCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [stations, setStations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [statusFilter, setStatusFilter] = useState('');
  const [stationFilter, setStationFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Refund modal state
  const [selectedRefundPayment, setSelectedRefundPayment] = useState(null);
  const [isRefunding, setIsRefunding] = useState(false);

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

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getAdminPayments({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(stationFilter && { stationId: stationFilter }),
        ...(providerFilter && { provider: providerFilter }),
        ...(search && { search }),
      });
      setPayments(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.warn('Error fetching admin payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, stationFilter, providerFilter, search]);

  const handleRefundSubmit = async (paymentId, amount, reason) => {
    try {
      setIsRefunding(true);
      await requestRefund(paymentId, { amount, reason });
      setSelectedRefundPayment(null);
      await fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process refund.');
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Admin Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Payment & Invoice Management
          </h1>
          <p className="text-sm text-slate-500">
            Audit system-wide billing transactions, issue refunds, and monitor settlement statuses.
          </p>
        </div>

        <Link
          to="/admin/revenue"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Open Revenue Analytics</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Search Ref / Invoice
          </label>
          <input
            type="text"
            placeholder="e.g. PAY-2026... or INV-..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

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
              setSearch('');
              setStatusFilter('');
              setStationFilter('');
              setProviderFilter('');
              setPage(1);
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm text-slate-500">
          No payments match the search criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Invoice & Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Station</th>
                  <th className="py-3.5 px-4">Energy</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method / Provider</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {payments.map((p) => {
                  const isPaid = p.status === 'paid' || p.status === 'partially_refunded';
                  const isRefundable = isPaid && (!p.refundAmount || p.refundAmount < p.totalAmount);
                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{p.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.paymentReference}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-bold">{p.userId?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400">{p.userId?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-bold">{p.stationId?.name}</div>
                        <div className="text-[11px] text-slate-400">{p.stationId?.city}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-bold">{Number(p.energyConsumedKwh).toFixed(2)} kWh</div>
                        <div className="text-[11px] text-slate-400">₹{p.ratePerKwh}/kWh</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 font-mono text-sm">
                          ₹{Number(p.totalAmount).toFixed(2)}
                        </div>
                        {p.refundAmount > 0 && (
                          <div className="text-[10px] text-purple-700 font-semibold">
                            (Ref: -₹{Number(p.refundAmount).toFixed(2)})
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="capitalize">{p.paymentMethod?.replace('mock_', 'Demo ').replace('_', ' ')}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">{p.provider}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <PaymentStatusBadge status={p.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        {isPaid && (
                          <Link
                            to={`/payments/${p._id}/receipt`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-block"
                          >
                            Receipt
                          </Link>
                        )}
                        {isRefundable && (
                          <button
                            onClick={() => setSelectedRefundPayment(p)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold inline-block"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Total {pagination.total} transactions • Page {page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Refund Modal */}
      <RefundDialog
        payment={selectedRefundPayment}
        isOpen={Boolean(selectedRefundPayment)}
        onClose={() => setSelectedRefundPayment(null)}
        onRefund={handleRefundSubmit}
        isProcessing={isRefunding}
      />
    </div>
  );
};

export default PaymentManagement;
