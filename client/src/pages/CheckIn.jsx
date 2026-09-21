import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { verifyQr, verifyBookingReference, completeCheckIn } from "../services/checkInService";
import { startSession } from "../services/sessionService";
import QrScanner from "../components/qr/QrScanner";
import ManualBookingVerification from "../components/qr/ManualBookingVerification";
import SimulationNotice from "../components/session/SimulationNotice";
import {
  CheckCircle2,
  AlertCircle,
  QrCode,
  MapPin,
  Zap,
  Car,
  Clock,
  Calendar,
  Play,
  Loader2,
  ArrowRight,
} from "lucide-react";

const CheckIn = () => {
  const [searchParams] = useSearchParams();
  const prefilledReference = searchParams.get("reference");
  const navigate = useNavigate();

  const [verifiedBooking, setVerifiedBooking] = useState(null);
  const [canStartCharging, setCanStartCharging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Battery setup for starting session
  const [initialBattery, setInitialBattery] = useState(35);
  const [targetBattery, setTargetBattery] = useState(80);

  // Auto-verify if prefilled reference in query string
  useEffect(() => {
    if (prefilledReference) {
      handleVerifyReference(prefilledReference);
    }
  }, [prefilledReference]);

  // Handler for QR token payload
  const handleVerifyQr = async (payload) => {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMsg("");
      const res = await verifyQr(payload);
      setVerifiedBooking(res.data?.booking);
      setCanStartCharging(res.data?.canStartCharging);
      setSuccessMsg("Booking verified successfully! You may now confirm your check-in.");
    } catch (err) {
      setError(err.response?.data?.message || "QR Code verification failed. Please check validity.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for booking reference verification
  const handleVerifyReference = async (ref) => {
    try {
      setIsLoading(true);
      setError("");
      setSuccessMsg("");
      const res = await verifyBookingReference(ref);
      setVerifiedBooking(res.data?.booking);
      setCanStartCharging(res.data?.canStartCharging);
      setSuccessMsg("Booking verified by reference! You may now confirm check-in.");
    } catch (err) {
      setError(err.response?.data?.message || "Booking reference verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for confirming check-in
  const handleConfirmCheckIn = async (method = "qr") => {
    if (!verifiedBooking) return;
    try {
      setIsLoading(true);
      setError("");
      const res = await completeCheckIn(verifiedBooking._id, method);
      setVerifiedBooking(res.data?.booking);
      setSuccessMsg("Check-in confirmed! Proceed to start your charging session.");
    } catch (err) {
      setError(err.response?.data?.message || "Check-in confirmation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for starting the simulated session
  const handleStartCharging = async () => {
    if (!verifiedBooking) return;
    try {
      setIsStartingSession(true);
      setError("");
      const res = await startSession({
        bookingId: verifiedBooking._id,
        initialBatteryPercentage: Number(initialBattery),
        targetBatteryPercentage: Number(targetBattery),
      });

      const newSession = res.data;
      navigate(`/sessions/${newSession._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start charging session.");
    } finally {
      setIsStartingSession(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Terminal Verification
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Station Check-In
        </h1>
        <p className="text-sm text-slate-500">
          Scan your digital pass or enter your booking reference to check in to your reserved charger.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Check-In Error</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Verification View (Scanner + Manual) */}
      {!verifiedBooking && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
              Scan Pass with Camera
            </h2>
            <QrScanner onScanSuccess={handleVerifyQr} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
              Manual Check-In Fallback
            </h2>
            <ManualBookingVerification
              onVerifyReference={handleVerifyReference}
              onVerifyToken={handleVerifyQr}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {/* Verified Booking Card */}
      {verifiedBooking && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Verified Booking
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                {verifiedBooking.bookingReference}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs uppercase">
                {verifiedBooking.status.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Station</span>
              </div>
              <p className="font-bold text-slate-800 text-sm">{verifiedBooking.stationId?.name}</p>
              <p className="text-slate-500">{verifiedBooking.stationId?.city}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-semibold">Charger</span>
              </div>
              <p className="font-bold text-slate-800 text-sm">
                {verifiedBooking.chargerId?.name || "Port 1"}
              </p>
              <p className="text-slate-500">{verifiedBooking.chargerId?.powerRating} kW • {verifiedBooking.chargerId?.chargerType}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Car className="w-4 h-4 text-purple-600" />
                <span className="font-semibold">Vehicle</span>
              </div>
              <p className="font-bold text-slate-800 text-sm">
                {verifiedBooking.vehicleId?.brand} {verifiedBooking.vehicleId?.model}
              </p>
              <p className="text-slate-500 font-mono">{verifiedBooking.vehicleId?.licensePlate}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Schedule</span>
              </div>
              <p className="font-bold text-slate-800 text-sm">
                {new Date(verifiedBooking.startTime).toLocaleDateString()}
              </p>
              <p className="text-slate-500">
                {new Date(verifiedBooking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <SimulationNotice />

          {/* Action Step 1: Confirm Check-In if status is confirmed */}
          {verifiedBooking.status === "confirmed" && (
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => handleConfirmCheckIn("qr")}
                disabled={isLoading}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span>Confirm Check-In At Station</span>
              </button>
              <button
                type="button"
                onClick={() => setVerifiedBooking(null)}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition"
              >
                Scan Another
              </button>
            </div>
          )}

          {/* Action Step 2: Start Charging if status is checked_in */}
          {verifiedBooking.status === "checked_in" && (
            <div className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <Play className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base">Configure Simulated Charging Session</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Initial Battery Level (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={initialBattery}
                    onChange={(e) => setInitialBattery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Battery Level (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={targetBattery}
                    onChange={(e) => setTargetBattery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartCharging}
                disabled={isStartingSession || Number(targetBattery) <= Number(initialBattery)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isStartingSession ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-300" />
                )}
                <span>Start Simulated Charging</span>
              </button>
            </div>
          )}

          {/* Action Step 3: If already charging, redirect to active session */}
          {verifiedBooking.status === "charging" && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (verifiedBooking.sessionId) {
                    navigate(`/sessions/${verifiedBooking.sessionId}`);
                  } else {
                    navigate("/sessions/active");
                  }
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
              >
                <span>View In-Progress Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckIn;
