import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPaymentById } from '../services/paymentService';
import PaymentStatusBadge from '../components/payment/PaymentStatusBadge';
import {
  CheckCircle2,
  XCircle,
  FileText,
  History,
  LayoutDashboard,
  Zap,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const PaymentResult = () => {
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
        setError(err.response?.data?.message || 'Failed to fetch payment status.');
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
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Payment record not found.</p>
        <Link to="/payments" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          View Payment History
        </Link>
      </div>
    );
  }

  const isPaid = payment.status === 'paid' || payment.status === 'partially_refunded';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Result Hero */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-md text-center space-y-6">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
            isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {isPaid ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isPaid ? 'Payment Successful!' : 'Payment Failed'}
          </h1>
          <p className="text-xs text-slate-500">
            {isPaid
              ? 'Your charging session transaction has been confirmed and verified.'
              : payment.failureReason || 'Transaction was declined or cancelled.'}
          </p>
        </div>

        {/* Amount & Reference Badge */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Amount Processed
          </span>
          <p className="text-4xl font-black text-slate-900 font-mono">
            ₹{Number(payment.totalAmount).toFixed(2)}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="font-mono text-xs text-slate-500 font-bold">
              {payment.paymentReference}
            </span>
            <span>•</span>
            <PaymentStatusBadge status={payment.status} size="sm" />
          </div>
        </div>

        {/* Key Metadata Details */}
        <div className="grid grid-cols-2 gap-3 text-xs text-left bg-white rounded-xl p-3 border border-slate-100">
          <div>
            <span className="text-slate-400 block text-[11px]">Station</span>
            <span className="font-bold text-slate-800">{payment.stationId?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Energy Dispensed</span>
            <span className="font-bold text-emerald-600">{payment.energyConsumedKwh} kWh</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Payment Method</span>
            <span className="font-bold text-slate-800 capitalize">
              {payment.paymentMethod?.replace('mock_', 'Demo ').replace('_', ' ')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Settlement Ref</span>
            <span className="font-mono text-slate-600 truncate block">
              {payment.providerPaymentId || 'MOCK-SETTLEMENT'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          {isPaid && (
            <Link
              to={`/payments/${payment._id}/receipt`}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>View Tax Receipt</span>
            </Link>
          )}

          <Link
            to="/payments"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
          >
            <History className="w-4 h-4" />
            <span>Payment History</span>
          </Link>

          <Link
            to="/dashboard"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
