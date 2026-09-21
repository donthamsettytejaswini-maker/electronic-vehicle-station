import React, { useState } from "react";
import { Play, Pause, CheckCircle2, Square, Loader2, AlertTriangle } from "lucide-react";

const SessionControls = ({
  status = "charging",
  isLoading = false,
  onPause,
  onResume,
  onComplete,
  onStop,
}) => {
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [stopReason, setStopReason] = useState("User requested stop");
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  // If already finished, do not show active action controls
  if (status === "completed" || status === "stopped" || status === "failed") {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
        <p className="font-semibold text-slate-700">This charging session has ended.</p>
        <p className="text-xs text-slate-400 mt-1">Final summary and energy logs have been recorded.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Session Controls
        </h3>
        <span className="text-xs text-slate-400">Live Simulation Actions</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Pause Action */}
        {status === "charging" && (
          <button
            onClick={onPause}
            disabled={isLoading}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
            <span>Pause Charging</span>
          </button>
        )}

        {/* Resume Action */}
        {status === "paused" && (
          <button
            onClick={onResume}
            disabled={isLoading}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>Resume Charging</span>
          </button>
        )}

        {/* Complete Action */}
        {(status === "charging" || status === "paused") && (
          <button
            onClick={() => setShowCompleteConfirm(true)}
            disabled={isLoading}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Complete Session</span>
          </button>
        )}

        {/* Stop Action */}
        <button
          onClick={() => setShowStopConfirm(true)}
          disabled={isLoading}
          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-xl border border-rose-200 transition disabled:opacity-50 flex items-center gap-1.5"
        >
          <Square className="w-4 h-4 text-rose-600 fill-rose-600" />
          <span>Stop Session</span>
        </button>
      </div>

      {/* Complete Confirmation Modal */}
      {showCompleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h4 className="text-lg font-bold text-slate-900">Complete Charging Session?</h4>
            </div>
            <p className="text-sm text-slate-600">
              This will wrap up telemetry calculations, set charger status back to available, and archive this session to your charging history.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCompleteConfirm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCompleteConfirm(false);
                  onComplete();
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Confirmation Modal */}
      {showStopConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-lg font-bold text-slate-900">Stop Charging Early?</h4>
            </div>
            <p className="text-sm text-slate-600">
              Stopping the session will prematurely end the simulated charging process.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Reason for stopping:</label>
              <input
                type="text"
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="E.g. Leaving early, emergency..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowStopConfirm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowStopConfirm(false);
                  onStop(stopReason);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
              >
                Stop Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionControls;
