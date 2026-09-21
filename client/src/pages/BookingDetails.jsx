import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getBookingById, cancelBooking } from "../services/bookingService";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Zap,
  Car,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  Loader2,
  AlertCircle,
} from "lucide-react";

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await getBookingById(id);
      setBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      setCancelling(true);
      await cancelBooking(id);
      await fetchDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Booking record not found.</p>
        <Link to="/bookings" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          Return to Bookings
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === "confirmed";
  const isCheckedIn = booking.status === "checked_in";
  const isCharging = booking.status === "charging";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Bookings
      </Link>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Info Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Booking Overview
            </span>
            <h1 className="text-2xl font-mono font-extrabold text-slate-900 mt-0.5">
              {booking.bookingReference}
            </h1>
          </div>
          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                isCharging
                  ? "bg-emerald-100 text-emerald-800 animate-pulse"
                  : isCheckedIn
                  ? "bg-blue-100 text-blue-800"
                  : isConfirmed
                  ? "bg-teal-100 text-teal-800"
                  : booking.status === "completed"
                  ? "bg-slate-100 text-slate-700"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {booking.status.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* 4 Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">Station</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">{booking.stationId?.name}</p>
            <p className="text-slate-500">{booking.stationId?.address}, {booking.stationId?.city}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="font-semibold">Charger Unit</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {booking.chargerId?.name || "Port 1"} ({booking.chargerId?.chargerType})
            </p>
            <p className="text-slate-500">{booking.chargerId?.powerRating} kW Output</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">Schedule Time</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {new Date(booking.startTime).toLocaleDateString()}
            </p>
            <p className="text-slate-500">
              {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
              {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Car className="w-4 h-4 text-purple-600" />
              <span className="font-semibold">Vehicle</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              {booking.vehicleId?.brand} {booking.vehicleId?.model}
            </p>
            <p className="text-slate-500 font-mono">{booking.vehicleId?.licensePlate}</p>
          </div>
        </div>

        {/* Check-In Audit Logs */}
        <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-2">
          <span className="font-bold uppercase text-slate-400 block tracking-wider">
            Check-In Log
          </span>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>
              Checked In:{" "}
              <strong>{booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleString() : "Not yet"}</strong>
            </div>
            <div>
              Method: <strong className="uppercase">{booking.checkInMethod || "—"}</strong>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-wrap gap-3">
          {isConfirmed && (
            <>
              <Link
                to={`/bookings/${booking._id}/qr`}
                className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-2xl text-center text-xs transition flex items-center justify-center gap-2 border border-emerald-200"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>View Digital QR Pass</span>
              </Link>

              <Link
                to={`/check-in?reference=${booking.bookingReference}`}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-center text-xs transition shadow-sm"
              >
                Check In At Terminal
              </Link>
            </>
          )}

          {isCheckedIn && (
            <Link
              to={`/check-in?reference=${booking.bookingReference}`}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-center text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Configure & Start Charging</span>
            </Link>
          )}

          {isCharging && booking.sessionId && (
            <Link
              to={`/sessions/${booking.sessionId}`}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-center text-xs transition shadow-sm flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Go to Active Charging Telemetry</span>
            </Link>
          )}

          {isConfirmed && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl text-xs transition border border-rose-200"
            >
              {cancelling ? "Cancelling..." : "Cancel Reservation"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
