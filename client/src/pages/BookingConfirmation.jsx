import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getBookingById } from "../services/bookingService";
import { generateBookingQr, getQrStatus } from "../services/qrService";
import QrCodeDisplay from "../components/qr/QrCodeDisplay";
import { CheckCircle, Calendar, Clock, MapPin, Zap, Car, ShieldAlert, ArrowRight, Play, Loader2 } from "lucide-react";

const BookingConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [error, setError] = useState("");

  const fetchBooking = async () => {
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
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const handleGenerateQr = async () => {
    try {
      setIsGeneratingQr(true);
      setError("");
      const res = await generateBookingQr(id);
      setQrData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate check-in QR code.");
    } finally {
      setIsGeneratingQr(false);
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
        <h2 className="text-xl font-bold text-slate-800">Booking not found</h2>
        <Link to="/bookings" className="text-emerald-600 hover:underline mt-2 inline-block">
          View All Bookings
        </Link>
      </div>
    );
  }

  const isCheckedIn = booking.status === "checked_in" || booking.status === "charging" || booking.status === "completed";
  const isCharging = booking.status === "charging";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-emerald-600 text-white rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-md">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Booking Confirmed!</h1>
        <p className="text-emerald-100 text-sm max-w-md mx-auto">
          Your slot has been reserved. Please present your digital QR code upon arriving at the charging station.
        </p>
        <div className="inline-block bg-emerald-700/80 px-4 py-1.5 rounded-full font-mono text-xs tracking-wider border border-emerald-500/40">
          REF: {booking.bookingReference}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Reservation Details Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Reservation Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Station</p>
              <p className="text-sm font-bold text-slate-800">{booking.stationId?.name}</p>
              <p className="text-xs text-slate-500">{booking.stationId?.address}, {booking.stationId?.city}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Charger Port</p>
              <p className="text-sm font-bold text-slate-800">
                {booking.chargerId?.name || "Port #1"} ({booking.chargerId?.chargerType})
              </p>
              <p className="text-xs text-slate-500">{booking.chargerId?.powerRating} kW Output</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Slot Schedule</p>
              <p className="text-sm font-bold text-slate-800">
                {new Date(booking.startTime).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Car className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400">Vehicle</p>
              <p className="text-sm font-bold text-slate-800">
                {booking.vehicleId?.brand} {booking.vehicleId?.model}
              </p>
              <p className="text-xs text-slate-500 font-mono">{booking.vehicleId?.licensePlate}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Booking Status:</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold uppercase">
            {booking.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Phase 4 QR Code Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Station Check-In QR Code
        </h3>

        <QrCodeDisplay
          qrPayload={qrData?.qrPayload}
          bookingReference={booking.bookingReference}
          qrGeneratedAt={qrData?.qrGeneratedAt || booking.qrGeneratedAt}
          isRegenerating={isGeneratingQr}
          onRegenerate={handleGenerateQr}
          canRegenerate={booking.status === "confirmed"}
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Check-In Navigation Button */}
          <Link
            to={`/check-in?reference=${booking.bookingReference}`}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-center shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>Proceed to Check-In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Start Charging button only after check-in */}
          {isCheckedIn && (
            <button
              onClick={() => {
                if (booking.sessionId) {
                  navigate(`/sessions/${booking.sessionId}`);
                } else {
                  navigate(`/check-in?reference=${booking.bookingReference}`);
                }
              }}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-center shadow-sm transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isCharging ? "View Live Session" : "Start Charging Session"}</span>
            </button>
          )}
        </div>

        {/* Phase 5 Notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>Payment and final billing will be implemented in Phase 5.</span>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
