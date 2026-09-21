import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getSessionById,
  pauseSession,
  resumeSession,
  completeSession,
  stopSession,
} from "../services/sessionService";
import {
  connectSocket,
  joinSessionRoom,
  leaveSessionRoom,
  subscribeToSessionUpdates,
  unsubscribeFromSessionUpdates,
} from "../services/socketService";
import SessionStatusBadge from "../components/session/SessionStatusBadge";
import BatteryProgress from "../components/session/BatteryProgress";
import ChargingProgressCard from "../components/session/ChargingProgressCard";
import EnergyUsageCard from "../components/session/EnergyUsageCard";
import SessionTimeline from "../components/session/SessionTimeline";
import SessionControls from "../components/session/SessionControls";
import SimulationNotice from "../components/session/SimulationNotice";
import {
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  MapPin,
  Car,
  Zap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";

const ChargingSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // "live" | "polling" | "connecting"

  const pollIntervalRef = useRef(null);

  // Fetch session data
  const fetchSession = async () => {
    try {
      const res = await getSessionById(id);
      setSession(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load charging session.");
      return null;
    }
  };

  // Initial load + Socket.IO and Polling lifecycle
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setLoading(true);
      const data = await fetchSession();
      setLoading(false);

      if (!isMounted || !data) return;

      // Connect Socket.IO
      try {
        const socket = connectSocket();
        joinSessionRoom(id);

        const handleSocketUpdate = (updatedSession) => {
          if (updatedSession && updatedSession._id === id) {
            setSession(updatedSession);
            setConnectionStatus("live");
          }
        };

        subscribeToSessionUpdates(handleSocketUpdate);

        if (socket.connected) {
          setConnectionStatus("live");
        } else {
          setConnectionStatus("polling");
        }

        socket.on("connect", () => {
          if (isMounted) setConnectionStatus("live");
        });

        socket.on("disconnect", () => {
          if (isMounted) setConnectionStatus("polling");
        });
      } catch (err) {
        console.warn("Socket initialization fallback to polling:", err);
        setConnectionStatus("polling");
      }

      // Always setup a 5s fallback poll for guaranteed freshness
      pollIntervalRef.current = setInterval(async () => {
        try {
          const freshData = await getSessionById(id);
          if (isMounted && freshData?.data) {
            setSession(freshData.data);
            // Stop polling if session is completed or stopped
            if (["completed", "stopped", "failed"].includes(freshData.data.status)) {
              clearInterval(pollIntervalRef.current);
            }
          }
        } catch (e) {
          console.warn("Polling error:", e);
        }
      }, 5000);
    };

    init();

    return () => {
      isMounted = false;
      leaveSessionRoom(id);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [id]);

  // Actions
  const handlePause = async () => {
    try {
      setActionLoading(true);
      const res = await pauseSession(id);
      setSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to pause session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    try {
      setActionLoading(true);
      const res = await resumeSession(id);
      setSession(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resume session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      const res = await completeSession(id);
      setSession(res.data);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async (reason) => {
    try {
      setActionLoading(true);
      const res = await stopSession(id, reason);
      setSession(res.data);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to stop session.");
    } finally {
      setActionLoading(false);
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
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Charging session not found.</p>
        <Link to="/charging-history" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          View Charging History
        </Link>
      </div>
    );
  }

  // Calculate elapsed time
  const startTime = session.startedAt ? new Date(session.startedAt) : new Date(session.createdAt);
  const endTime = session.completedAt ? new Date(session.completedAt) : new Date();
  const elapsedMinutes = Math.max(0, Math.floor((endTime - startTime) / (1000 * 60)));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar with Navigation and Connection Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/charging-history"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>

        {/* Real-time Connection Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold shadow-sm">
            {connectionStatus === "live" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Live Telemetry (Socket.IO)</span>
              </>
            ) : connectionStatus === "polling" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                <span className="text-blue-700">Fallback Polling (5s)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Connecting...</span>
              </>
            )}
          </div>
          <SessionStatusBadge status={session.status} size="md" />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Session Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Live EV Charging Simulation
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight mt-1">
                {session.sessionReference}
              </h1>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono">Booking Ref</span>
              <p className="text-sm font-bold font-mono text-emerald-300">
                {session.bookingId?.bookingReference || "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{session.stationId?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{session.chargerId?.name || "Port 1"} ({session.chargerId?.powerRating || 30} kW)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Car className="w-4 h-4 text-purple-400" />
              <span>{session.vehicleId?.brand} {session.vehicleId?.model} ({session.vehicleId?.licensePlate})</span>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <SimulationNotice />

      {/* Main Telemetry Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Battery & Telemetry Column (2 cols) */}
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
            elapsedMinutes={session.actualDurationMinutes || elapsedMinutes}
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

        {/* Sidebar Controls & Timeline Column (1 col) */}
        <div className="space-y-6">
          <SessionControls
            status={session.status}
            isLoading={actionLoading}
            onPause={handlePause}
            onResume={handleResume}
            onComplete={handleComplete}
            onStop={handleStop}
          />

          <SessionTimeline session={session} booking={session.bookingId} />

          {/* Phase 5 Billing & Payment Card */}
          {(session.status === 'completed' || session.status === 'stopped') && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Session Settled
                </span>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  {session.energyConsumedKwh} kWh
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                {session.paymentStatus === 'paid'
                  ? 'Payment has been completed. Your digital tax receipt is available.'
                  : 'Charging cycle is complete. Proceed to checkout to settle the energy invoice.'}
              </p>

              {session.paymentStatus === 'paid' ? (
                <Link
                  to={`/payments/${session.paymentId?._id || session.paymentId || session._id}/receipt`}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>View Tax Receipt</span>
                </Link>
              ) : (
                <Link
                  to={`/payments/checkout/${session._id}`}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Pay Now (Checkout)</span>
                </Link>
              )}
            </div>
          )}

          {/* View Details / Invoice Link */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 text-center">
            <Link
              to={`/sessions/${session._id}/details`}
              className="text-xs font-bold text-slate-700 hover:text-emerald-600 transition flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>View Full Session Summary & Logs</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargingSession;
