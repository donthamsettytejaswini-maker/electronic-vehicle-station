import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPaymentById } from '../services/paymentService';
import PaymentStatusBadge from '../components/payment/PaymentStatusBadge';
import {
  ArrowLeft,
  FileText,
  MapPin,
  Car,
  Zap,
  CreditCard,
  Clock,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

const PaymentDetails = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        const res = await getPaymentById(id);
        setPayment(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payment details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPayment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Payment record not found.</p>
        <Link to="/payments" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          Return to Payments
        </Link>
      </div>
    );
  }

  const isPaid = payment.status === 'paid' || payment.status === 'partially_refunded';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/payments"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Payments
      </Link>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Transaction Overview
            </span>
            <h1 className="text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
              {payment.invoiceNumber}
            </h1>
            <p className="text-xs text-slate-400 font-mono">Payment Ref: {payment.paymentReference}</p>
          </div>
          <div className="flex items-center gap-3">
            <PaymentStatusBadge status={payment.status} size="lg" />
          </div>
        </div>

        {/* Amount & Method Highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Total Bill Amount</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              ₹{Number(payment.totalAmount).toFixed(2)}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Payment Method</span>
            <span className="text-sm font-bold text-slate-800 capitalize block">
              {payment.paymentMethod?.replace('mock_', 'Demo ').replace('_', ' ')}
            </span>
            <span className="text-[11px] text-slate-400 uppercase font-mono">{payment.provider}</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Payment Date</span>
            <span className="text-sm font-bold text-slate-800 block">
              {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'Unpaid'}
            </span>
            <span className="text-[11px] text-slate-400">
              {payment.paidAt ? new Date(payment.paidAt).toLocaleTimeString() : '—'}
            </span>
          </div>
        </div>

        {/* Equipment & Station */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 font-medium block">Station</span>
            <span className="font-bold text-slate-800 text-sm block">{payment.stationId?.name}</span>
            <span className="text-slate-500">{payment.stationId?.city}</span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Energy Delivered</span>
            <span className="font-bold text-emerald-600 text-sm block">
              {Number(payment.energyConsumedKwh).toFixed(2)} kWh
            </span>
            <span className="text-slate-500">Rate: ₹{payment.ratePerKwh}/kWh</span>
          </div>

          <div>
            <span className="text-slate-400 font-medium block">Vehicle</span>
            <span className="font-bold text-slate-800 text-sm block">
              {payment.vehicleId?.brand} {payment.vehicleId?.model}
            </span>
            <span className="text-slate-500 font-mono">{payment.vehicleId?.vehicleNumber}</span>
          </div>
        </div>

        {/* Refund Details if refunded */}
        {payment.refundAmount > 0 && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span>Refund Details</span>
            </div>
            <p>
              Amount Refunded: <strong>₹{Number(payment.refundAmount).toFixed(2)}</strong> on{' '}
              {new Date(payment.refundedAt).toLocaleString()}
            </p>
            <p className="text-slate-600">Reason: {payment.refundReason}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap gap-3">
          {isPaid && (
            <Link
              to={`/payments/${payment._id}/receipt`}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-center text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>View Official Tax Receipt</span>
            </Link>
          )}

          <Link
            to={`/sessions/${payment.sessionId?._id || payment.sessionId}/details`}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-center text-xs transition flex items-center justify-center gap-2"
          >
            <span>View Charging Session Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
