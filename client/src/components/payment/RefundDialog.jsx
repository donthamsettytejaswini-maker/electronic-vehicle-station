import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, Loader2, X } from 'lucide-react';

const RefundDialog = ({ payment, isOpen, onClose, onRefund, isProcessing }) => {
  if (!isOpen || !payment) return null;

  const alreadyRefunded = payment.refundAmount || 0;
  const maxRefundable = Math.max(0, payment.totalAmount - alreadyRefunded);

  const [refundAmount, setRefundAmount] = useState(maxRefundable);
  const [reason, setReason] = useState('Customer dissatisfaction / Overcharge');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const amt = Number(refundAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid positive refund amount.');
      return;
    }

    if (amt > maxRefundable) {
      setError(`Refund cannot exceed maximum refundable amount of ₹${maxRefundable}.`);
      return;
    }

    onRefund(payment._id, amt, reason);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 text-purple-700">
            <div className="p-2 bg-purple-50 rounded-xl">
              <RotateCcw className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Issue Refund</h3>
              <p className="text-xs text-slate-400 font-mono">{payment.paymentReference}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Original Amount:</span>
              <strong className="text-slate-900">₹{Number(payment.totalAmount).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Already Refunded:</span>
              <strong className="text-purple-700">₹{Number(alreadyRefunded).toFixed(2)}</strong>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span>Max Available Refund:</span>
              <strong className="text-emerald-700">₹{Number(maxRefundable).toFixed(2)}</strong>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Refund Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={maxRefundable}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="w-full text-sm font-bold border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Refund Reason / Notes
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Incomplete charging cycle, billing discrepancy"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || maxRefundable <= 0}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span>Process Refund</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundDialog;
