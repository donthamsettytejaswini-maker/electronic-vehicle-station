import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllBookings, cancelBooking } from "../../services/bookingService";
import { getStations } from "../../services/stationService";
import {
  Calendar,
  Search,
  Filter,
  User,
  MapPin,
  Zap,
  Car,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [statusFilter, setStatusFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch stations for filter
  useEffect(() => {
    const loadStations = async () => {
      try {
        const res = await getStations({ limit: 50 });
        setStations(res.data || []);
      } catch (e) {
        console.warn("Could not load stations:", e);
      }
    };
    loadStations();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getAllBookings({
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(stationFilter && { stationId: stationFilter }),
        ...(search && { search }),
      });
      setBookings(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.warn("Error fetching all bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, stationFilter, search]);

  const handleAdminCancel = async (id) => {
    if (!window.confirm("Admin: Are you sure you want to cancel this booking?")) return;
    try {
      await cancelBooking(id);
      await fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Admin Portal
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Manage All Bookings
        </h1>
        <p className="text-sm text-slate-500">
          Monitor system-wide slot reservations, check-in statuses, and customer bookings.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Search Reference
          </label>
          <input
            type="text"
            placeholder="e.g. EV-2026..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="charging">Charging</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Station
          </label>
          <select
            value={stationFilter}
            onChange={(e) => {
              setStationFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Stations</option>
            {stations.map((st) => (
              <option key={st._id} value={st._id}>
                {st.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setStationFilter("");
              setPage(1);
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm text-slate-500">
          No bookings match the criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Station & Port</th>
                  <th className="py-3.5 px-4">Schedule</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {b.bookingReference}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold">{b.userId?.name || "User"}</div>
                      <div className="text-[11px] text-slate-400">{b.userId?.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold">{b.stationId?.name}</div>
                      <div className="text-[11px] text-slate-400">{b.chargerId?.name || "Port 1"}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{new Date(b.startTime).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{b.vehicleId?.brand} {b.vehicleId?.model}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{b.vehicleId?.licensePlate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/bookings/${b._id}`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-block"
                      >
                        View
                      </Link>
                      {b.status === "confirmed" && (
                        <button
                          onClick={() => handleAdminCancel(b._id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 border-t border-slate-200">
              <span className="text-xs text-slate-500">
                Total {pagination.total} bookings • Page {page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageBookings;
