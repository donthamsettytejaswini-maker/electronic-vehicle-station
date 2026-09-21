import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllActiveSessions, stopSession } from "../../services/sessionService";
import {
  connectSocket,
  joinAdminMonitoring,
  leaveAdminMonitoring,
  subscribeToSessionUpdates,
  unsubscribeFromSessionUpdates,
} from "../../services/socketService";
import SessionStatusBadge from "../../components/session/SessionStatusBadge";
import SimulationNotice from "../../components/session/SimulationNotice";
import {
  Activity,
  Zap,
  PauseCircle,
  Square,
  Eye,
  Loader2,
  Radio,
  Wifi,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  MapPin,
  Car,
} from "lucide-react";

const ActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stopModalSession, setStopModalSession] = useState(null);
  const [stopReason, setStopReason] = useState("Admin intervention");
  const [isStopping, setIsStopping] = useState(false);

  const fetchActive = async () => {
    try {
      setLoading(true);
      const res = await getAllActiveSessions();
      setSessions(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch active charging sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();

    // Setup Socket.IO for admin monitoring
    try {
      const socket = connectSocket();
      joinAdminMonitoring();

      const handleUpdate = () => {
        // Refresh active list upon any session telemetry broadcast
        getAllActiveSessions()
          .then((res) => setSessions(res.data || []))
          .catch((e) => console.warn(e));
      };

      subscribeToSessionUpdates(handleUpdate);

      return () => {
        leaveAdminMonitoring();
        unsubscribeFromSessionUpdates(handleUpdate);
      };
    } catch (err) {
      console.warn("Admin socket connection error:", err);
    }
  }, []);

  const handleStopSubmit = async (e) => {
    e.preventDefault();
    if (!stopModalSession) return;
    try {
      setIsStopping(true);
      await stopSession(stopModalSession._id, stopReason);
      setStopModalSession(null);
      await fetchActive();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to stop session.");
    } finally {
      setIsStopping(false);
    }
  };

  const chargingCount = sessions.filter((s) => s.status === "charging").length;
  const pausedCount = sessions.filter((s) => s.status === "paused").length;
  const initiatedCount = sessions.filter((s) => s.status === "initiated").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Admin Monitoring
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Active Charging Sessions
          </h1>
          <p className="text-sm text-slate-500">
            Real-time telemetry and supervisory control for all currently active charging sessions across the network.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live Telemetry Broadcast Active</span>
        </div>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Active</span>
            <p className="text-2xl font-black text-slate-900">{sessions.length}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Charging Now</span>
            <p className="text-2xl font-black text-emerald-600">{chargingCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Paused</span>
            <p className="text-2xl font-black text-amber-600">{pausedCount}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <PauseCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Initiated</span>
            <p className="text-2xl font-black text-slate-700">{initiatedCount}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <Radio className="w-6 h-6" />
          </div>
        </div>
      </div>

      <SimulationNotice />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Sessions Grid / Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm text-slate-500">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No active charging sessions right now</h3>
          <p className="text-xs text-slate-400 mt-1">
            When users check in and initiate charging, live telemetry feeds will stream here in real-time.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Session Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Station & Port</th>
                  <th className="py-3.5 px-4">Battery Progress</th>
                  <th className="py-3.5 px-4">Energy / Power</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sessions.map((sess) => (
                  <tr key={sess._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{sess.sessionReference}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Booking: {sess.bookingId?.bookingReference || "—"}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold">{sess.userId?.name || "Customer"}</div>
                      <div className="text-[11px] text-slate-400">{sess.userId?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold">{sess.stationId?.name}</div>
                      <div className="text-[11px] text-slate-400">{sess.chargerId?.name || "Port 1"}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{sess.currentBatteryPercentage}%</span>
                        <span className="text-[10px] text-slate-400">/ {sess.targetBatteryPercentage}%</span>
                      </div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${sess.currentBatteryPercentage}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-bold text-emerald-600">
                        {Number(sess.energyConsumedKwh).toFixed(2)} kWh
                      </div>
                      <div className="text-[11px] text-slate-400">{sess.chargingPowerKw} kW flow</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <SessionStatusBadge status={sess.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/admin/sessions/${sess._id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-block"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() => setStopModalSession(sess)}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold inline-block"
                      >
                        Stop
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Stop Session Modal */}
      {stopModalSession && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-slate-900">Admin Stop Session Override</h4>
            <p className="text-xs text-slate-600">
              You are about to stop session <strong className="font-mono">{stopModalSession.sessionReference}</strong>.
            </p>
            <form onSubmit={handleStopSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Reason for intervention
                </label>
                <input
                  type="text"
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStopModalSession(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStopping}
                  className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isStopping ? "Stopping..." : "Confirm Stop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSessions;
