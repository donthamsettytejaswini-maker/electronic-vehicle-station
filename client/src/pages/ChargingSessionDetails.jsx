import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getSessionById } from "../services/sessionService";
import SessionStatusBadge from "../components/session/SessionStatusBadge";
import SimulationNotice from "../components/session/SimulationNotice";
import ReviewFormModal from "../components/reviews/ReviewFormModal";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Zap,
  MapPin,
  Car,
  Activity,
  ShieldAlert,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
  CreditCard,
} from "lucide-react";

const ChargingSessionDetails = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
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
    if (id) fetchDetails();
  }, [id]);

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
        <Link to="/charging-history" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          Return to History
        </Link>
      </div>
    );
  }

  const isLive = ["charging", "paused", "initiated"].includes(session.status);
  const isCompleted = session.status === "completed";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/charging-history"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Charging History
      </Link>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Session Log & Summary
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 mt-1">
              {session.sessionReference}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Associated Booking: <span className="font-mono text-slate-700">{session.bookingId?.bookingReference || "—"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SessionStatusBadge status={session.status} size="lg" />
            {isLive && (
              <Link
                to={`/sessions/${session._id}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                Go to Live Screen
              </Link>
            )}
            {isCompleted && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1 shadow-sm"
              >
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                <span>{reviewed ? "Review Submitted" : "Review Station"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Telemetry Metrics Highlight */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Energy Delivered</span>
            <span className="text-2xl font-black text-slate-900">
              {Number(session.energyConsumedKwh).toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 ml-1">kWh</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Battery Change</span>
            <span className="text-2xl font-black text-slate-900">
              {session.initialBatteryPercentage}% → {session.currentBatteryPercentage}%
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Charging Power</span>
            <span className="text-2xl font-black text-slate-900">
              {session.chargingPowerKw}
            </span>
            <span className="text-xs text-slate-500 ml-1">kW</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl">
            <span className="text-xs text-slate-400 block mb-1">Total Duration</span>
            <span className="text-2xl font-black text-slate-900">
              {session.actualDurationMinutes || session.estimatedDurationMinutes || 0}
            </span>
            <span className="text-xs text-slate-500 ml-1">mins</span>
          </div>
        </div>
      </div>

      <SimulationNotice />

      {/* Equipment & Vehicle Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Equipment & Location Info
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">Station</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">{session.stationId?.name}</p>
            <p className="text-slate-500">{session.stationId?.address}, {session.stationId?.city}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">Charger Unit</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {session.chargerId?.name || "Port 1"} ({session.chargerId?.chargerType})
            </p>
            <p className="text-slate-500">Serial: {session.chargerId?.serialNumber || "—"}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Car className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">Vehicle</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {session.vehicleId?.brand} {session.vehicleId?.model}
            </p>
            <p className="text-slate-500 font-mono">Plate: {session.vehicleId?.licensePlate}</p>
          </div>
        </div>
      </div>

      {/* Timestamps & Stop Reason */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Session Timestamps
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Started At</span>
            <span className="font-bold text-slate-700">
              {session.startedAt ? new Date(session.startedAt).toLocaleString() : "—"}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Completed / Stopped At</span>
            <span className="font-bold text-slate-700">
              {session.completedAt ? new Date(session.completedAt).toLocaleString() : "In Progress"}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Stop Reason</span>
            <span className="font-bold text-slate-700">
              {session.stopReason || "Normal Completion"}
            </span>
          </div>
        </div>

        {/* Phase 5 Billing Section */}
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Billing Status:{' '}
              <strong className="capitalize">{session.paymentStatus || 'pending'}</strong>{' '}
              {session.finalBillAmount ? `(₹${Number(session.finalBillAmount).toFixed(2)})` : ''}
            </span>
          </div>

          <div className="flex gap-2">
            {session.paymentStatus === 'paid' ? (
              <Link
                to={`/payments/${session.paymentId?._id || session.paymentId || session._id}/receipt`}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Tax Receipt</span>
              </Link>
            ) : (
              <Link
                to={`/payments/checkout/${session._id}`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <CreditCard className="w-3.5 h-3.5 text-white" />
                <span>Proceed to Payment</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Phase 7 Review Modal */}
      {showReviewModal && (
        <ReviewFormModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          stationId={session.stationId?._id || session.stationId}
          bookingId={session.bookingId?._id || session.bookingId}
          sessionId={session._id}
          stationName={session.stationId?.name}
          onReviewSubmitted={() => {
            setReviewed(true);
            alert('Thank you! Your station review has been posted.');
          }}
        />
      )}
    </div>
  );
};

export default ChargingSessionDetails;
