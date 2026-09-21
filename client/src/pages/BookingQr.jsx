import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getBookingById } from "../services/bookingService";
import { generateBookingQr } from "../services/qrService";
import QrCodeDisplay from "../components/qr/QrCodeDisplay";
import SimulationNotice from "../components/session/SimulationNotice";
import { ArrowLeft, ArrowRight, ShieldCheck, MapPin, Zap, Calendar, Car, Loader2, AlertCircle } from "lucide-react";

const BookingQr = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const bookingRes = await getBookingById(id);
      setBooking(bookingRes.data);

      // Attempt to generate or load QR token for this booking
      if (bookingRes.data?.status === "confirmed") {
        try {
          const qrRes = await generateBookingQr(id);
          setQrData(qrRes.data);
        } catch (e) {
          console.warn("Could not auto-generate QR:", e);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleRegenerate = async () => {
    try {
      setGenerating(true);
      setError("");
      const res = await generateBookingQr(id);
      setQrData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to regenerate QR token.");
    } finally {
      setGenerating(false);
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
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Booking not found.</p>
        <Link to="/bookings" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          Return to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        to={`/bookings/${booking._id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Booking Details
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Secure Digital Pass
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Booking Check-In QR Code
          </h1>
          <p className="text-xs text-slate-500">
            Show this digital QR code to station staff or scan at the terminal.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* QR Display Card */}
        <QrCodeDisplay
          qrPayload={qrData?.qrPayload}
          bookingReference={booking.bookingReference}
          qrGeneratedAt={qrData?.qrGeneratedAt || booking.qrGeneratedAt}
          isRegenerating={generating}
          onRegenerate={handleRegenerate}
          canRegenerate={booking.status === "confirmed"}
        />

        {/* Summary Info */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-slate-700 truncate">{booking.stationId?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-slate-700">{booking.chargerId?.name || "Port 1"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-slate-700">
              {new Date(booking.startTime).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-slate-700">{booking.vehicleId?.licensePlate}</span>
          </div>
        </div>

        <SimulationNotice />

        {/* Check-In Action Button */}
        <div className="pt-2">
          <Link
            to={`/check-in?reference=${booking.bookingReference}`}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>Proceed to Terminal Check-In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingQr;
