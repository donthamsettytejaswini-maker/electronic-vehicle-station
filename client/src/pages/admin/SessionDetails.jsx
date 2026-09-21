import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getSessionById, stopSession } from "../../services/sessionService";
import {
  connectSocket,
  joinSessionRoom,
  leaveSessionRoom,
  subscribeToSessionUpdates,
  unsubscribeFromSessionUpdates,
} from "../../services/socketService";
import SessionStatusBadge from "../../components/session/SessionStatusBadge";
import BatteryProgress from "../../components/session/BatteryProgress";
import ChargingProgressCard from "../../components/session/ChargingProgressCard";
import EnergyUsageCard from "../../components/session/EnergyUsageCard";
import SessionTimeline from "../../components/session/SessionTimeline";
import SimulationNotice from "../../components/session/SimulationNotice";
import {
  ArrowLeft,
  User,
  MapPin,
  Zap,
  Car,
  Calendar,
  Square,
  Loader2,
  AlertCircle,
  Wifi,
} from "lucide-react";

const SessionDetails = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStopping, setIsStopping] = useState(false);
  const [stopReason, setStopReason] = useState("Admin intervention");
  const [showStopModal, setShowStopModal] = useState(false);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await getSessionById(id);
      setSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load session details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchSession();

    // Socket.IO updates for live admin inspection
    try {
      const socket = connectSocket();
      joinSessionRoom(id);

      const handleUpdate = (updated) => {
        if (updated && updated._id === id) {
          setSession(updated);
        }
      };

      subscribeToSessionUpdates(handleUpdate);

      return () => {
        leaveSessionRoom(id);
        unsubscribeFromSessionUpdates(handleUpdate);
      };
    } catch (e) {
      console.warn("Socket error:", e);
    }
  }, [id]);

  const handleStop = async (e) => {
    e.preventDefault();
    try {
      setIsStopping(true);
      const res = await stopSession(id, stopReason);
      setSession(res.data);
      setShowStopModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to stop session.");
    } finally {
      setIsStopping(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Session record not found.</p>
        <Link to="/admin/sessions" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          Return to Active Sessions
        </Link>
      </div>
    );
  }

  const isFinished = ["completed", "stopped", "failed"].includes(session.status);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/admin/sessions"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Admin Active Sessions
      </Link>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Session Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Admin Supervisory View
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-1">
            {session.sessionReference}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            User: <strong className="text-slate-200">{session.userId?.name}</strong> ({session.userId?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SessionStatusBadge status={session.status} size="lg" />
          {!isFinished && (
            <button
              onClick={() => setShowStopModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Admin Force Stop</span>
            </button>
          )}
        </div>
      </div>

      <SimulationNotice />

      {/* Telemetry Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BatteryProgress
            initialBattery={session.initialBatteryPercentage}
            currentBattery={session.currentBatteryPercentage}
            targetBattery={session.targetBatteryPercentage}
            isCharging={session.status === "charging"}
            status={session.status}
          />

          <ChargingProgressCard
            chargingPowerKw={session.chargingPowerKw}
            estimatedRemainingMinutes={session.estimatedDurationMinutes}
            elapsedMinutes={session.actualDurationMinutes || 0}
            estimatedCompletionTime={
              session.status === "charging" && session.estimatedDurationMinutes
                ? new Date(Date.now() + session.estimatedDurationMinutes * 60000)
                : null
            }
          />

          <EnergyUsageCard
            energyConsumedKwh={session.energyConsumedKwh}
            vehicle={session.vehicleId}
            charger={session.chargerId}
          />
        </div>

        <div className="space-y-6">
          {/* Hardware & Location Info */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Station & Charger
            </h3>
            <div>
              <span className="text-slate-400">Station Name:</span>
              <p className="font-bold text-slate-800 text-sm">{session.stationId?.name}</p>
              <p className="text-slate-500">{session.stationId?.address}</p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400">Charger Hardware:</span>
              <p className="font-bold text-slate-800">
                {session.chargerId?.name || "Port 1"} ({session.chargerId?.chargerType})
              </p>
              <p className="text-slate-500">Rating: {session.chargerId?.powerRating} kW</p>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400">Vehicle:</span>
              <p className="font-bold text-slate-800">
                {session.vehicleId?.brand} {session.vehicleId?.model}
              </p>
              <p className="text-slate-500 font-mono">Plate: {session.vehicleId?.licensePlate}</p>
            </div>
          </div>

          <SessionTimeline session={session} booking={session.bookingId} />
        </div>
      </div>

      {/* Admin Force Stop Modal */}
      {showStopModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-slate-900">Admin Stop Override</h4>
            <p className="text-xs text-slate-600">
              Enter reason for stopping this customer charging session:
            </p>
            <form onSubmit={handleStop} className="space-y-4">
              <input
                type="text"
                value={stopReason}
                onChange={(e) => setStopReason(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-rose-500 outline-none"
                required
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStopModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStopping}
                  className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isStopping ? "Stopping..." : "Stop Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetails;
