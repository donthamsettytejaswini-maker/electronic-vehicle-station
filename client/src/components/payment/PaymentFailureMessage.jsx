import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PaymentFailureMessage = ({
  failureReason = 'Payment could not be completed.',
  onRetry,
  sessionId,
}) => {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-6 text-center">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-extrabold text-slate-900">Payment Failed</h3>
        <p className="text-xs text-rose-600 font-semibold">{failureReason}</p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          No charges have been deducted from your account. You can retry the simulated payment or choose another payment method.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Payment</span>
          </button>
        )}

        {sessionId && (
          <Link
            to={`/sessions/${sessionId}`}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Charging Session</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PaymentFailureMessage;
