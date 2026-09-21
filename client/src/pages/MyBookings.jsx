import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserBookings, cancelBooking } from "../services/bookingService";
import {
  Calendar,
  Clock,
  MapPin,
  Zap,
  Car,
  QrCode,
  ArrowRight,
  Loader2,
  AlertCircle,
  Play,
  XCircle,
  Plus,
} from "lucide-react";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getUserBookings({
        ...(statusFilter && { status: statusFilter }),
      });
      setBookings(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking reservation?")) return;
    try {
      setCancellingId(id);
      await cancelBooking(id);
      await fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Reservations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            My Slot Bookings
          </h1>
          <p className="text-sm text-slate-500">
            Manage your scheduled station slots, view check-in QR codes, and track charging states.
          </p>
        </div>

        <Link
          to="/book-slot"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm text-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Reservation</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        {["", "confirmed", "checked_in", "charging", "completed", "cancelled"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl transition capitalize whitespace-nowrap ${
              statusFilter === st
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {st ? st.replace("_", " ") : "All Bookings"}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No bookings found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            You don't have any reservations matching the selected filter.
          </p>
          <Link
            to="/book-slot"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            Reserve a Slot Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const canCancel = b.status === "confirmed";
            const isConfirmed = b.status === "confirmed";
            const isCheckedIn = b.status === "checked_in";
            const isCharging = b.status === "charging";

            return (
              <div
                key={b._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-slate-900">
                      {b.bookingReference}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                        b.status === "charging"
                          ? "bg-emerald-100 text-emerald-800 animate-pulse"
                          : b.status === "checked_in"
                          ? "bg-blue-100 text-blue-800"
                          : b.status === "confirmed"
                          ? "bg-teal-100 text-teal-800"
                          : b.status === "completed"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {b.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400">
                    Created: {new Date(b.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Station</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {b.stationId?.name}
                    </span>
                    <span className="text-[11px] text-slate-500">{b.stationId?.city}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Charger Port</span>
                    <span className="font-bold text-slate-800 block">
                      {b.chargerId?.name || "Port 1"} ({b.chargerId?.powerRating} kW)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Schedule</span>
                    <span className="font-bold text-slate-800 block">
                      {new Date(b.startTime).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Vehicle</span>
                    <span className="font-bold text-slate-800 block">
                      {b.vehicleId?.brand} {b.vehicleId?.model}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {b.vehicleId?.licensePlate}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    {/* View Details */}
                    <Link
                      to={`/bookings/${b._id}`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* QR Code Pass */}
                    {isConfirmed && (
                      <Link
                        to={`/bookings/${b._id}/qr`}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Digital Pass (QR)</span>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Check In Action */}
                    {isConfirmed && (
                      <Link
                        to={`/check-in?reference=${b.bookingReference}`}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        Check In
                      </Link>
                    )}

                    {/* Live Session Link */}
                    {isCharging && b.sessionId && (
                      <Link
                        to={`/sessions/${b.sessionId}`}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Live Session</span>
                      </Link>
                    )}

                    {/* Cancel Booking */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(b._id)}
                        disabled={cancellingId === b._id}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                      >
                        {cancellingId === b._id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
