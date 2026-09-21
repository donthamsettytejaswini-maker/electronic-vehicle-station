import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

const MockPaymentPanel = ({
  totalAmount = 0,
  currencySymbol = '₹',
  isProcessing = false,
  onSimulateSuccess,
  onSimulateFailure,
  onCancel,
}) => {
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('Insufficient mock balance');

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Demo Warning Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Demo Payment Environment</span>
          <span>
            This is a mock sandbox payment gateway for demonstration. No real money or credit card charges will occur.
          </span>
        </div>
      </div>

      {/* Simulator Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={onSimulateSuccess}
          disabled={isProcessing}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          <span>Simulate Successful Payment ({currencySymbol}{Number(totalAmount).toFixed(2)})</span>
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowFailureModal(true)}
            disabled={isProcessing}
            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Simulate Payment Failure</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-xs disabled:opacity-50"
          >
            Cancel Transaction
          </button>
        </div>
      </div>

      {/* Failure Reason Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-bold text-slate-900 text-sm">Simulate Gateway Decline</h4>
            </div>
            <p className="text-xs text-slate-500">
              Select or type a reason to test payment failure response workflows:
            </p>
            <select
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Insufficient mock balance">Insufficient mock balance</option>
              <option value="Card expired or invalid CVV">Card expired or invalid CVV</option>
              <option value="Bank server timeout">Bank server timeout</option>
              <option value="UPI pin verification failed">UPI pin verification failed</option>
              <option value="Transaction declined by user bank">Transaction declined by user bank</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFailureModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFailureModal(false);
                  onSimulateFailure(failureReason);
                }}
                disabled={isProcessing}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
              >
                Confirm Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockPaymentPanel;
