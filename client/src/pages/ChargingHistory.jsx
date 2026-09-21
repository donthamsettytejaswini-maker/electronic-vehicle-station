import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSessionHistory } from "../services/sessionService";
import { getStations } from "../services/stationService";
import { getVehicles } from "../services/vehicleService";
import SessionStatusBadge from "../components/session/SessionStatusBadge";
import SimulationNotice from "../components/session/SimulationNotice";
import {
  History,
  Zap,
  MapPin,
  Car,
  Clock,
  BatteryCharging,
  ArrowRight,
  Filter,
  Loader2,
  Calendar,
} from "lucide-react";

const ChargingHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [statusFilter, setStatusFilter] = useState("");
  const [stationFilter, setStationFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fetch filter dropdown options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [stationRes, vehicleRes] = await Promise.all([
          getStations({ limit: 50 }),
          getVehicles(),
        ]);
        setStations(stationRes.data || []);
        setVehicles(vehicleRes.data || []);
      } catch (e) {
        console.warn("Could not load filter metadata:", e);
      }
    };
    loadFilters();
  }, []);

  // Fetch sessions list
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(stationFilter && { stationId: stationFilter }),
        ...(vehicleFilter && { vehicleId: vehicleFilter }),
      };
      const res = await getSessionHistory(params);
      setSessions(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.warn("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, statusFilter, stationFilter, vehicleFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Charging Logs
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Charging Session History
          </h1>
          <p className="text-sm text-slate-500">
            View completed, paused, and archived charging telemetry and consumption logs.
          </p>
        </div>
      </div>

      <SimulationNotice />

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
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
            <option value="completed">Completed</option>
            <option value="charging">Charging</option>
            <option value="paused">Paused</option>
            <option value="stopped">Stopped</option>
            <option value="failed">Failed</option>
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

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
            Vehicle
          </label>
          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.brand} {v.model} ({v.licensePlate})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setStatusFilter("");
              setStationFilter("");
              setVehicleFilter("");
              setPage(1);
            }}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            No charging sessions have been completed yet.
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Book a slot and complete check-in at a charging station to see sessions here.
          </p>
          <Link
            to="/stations"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            Find Stations & Book
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((sess) => {
            const isFinished = ["completed", "stopped", "failed"].includes(sess.status);
            return (
              <div
                key={sess._id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-slate-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-slate-900">
                      {sess.sessionReference}
                    </span>
                    <SessionStatusBadge status={sess.status} size="sm" />
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Booking: {sess.bookingId?.bookingReference || "—"}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block">Station</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {sess.stationId?.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Vehicle</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {sess.vehicleId?.brand} {sess.vehicleId?.model}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Battery Level</span>
                    <span className="font-bold text-slate-800 block">
                      {sess.initialBatteryPercentage}% → {sess.currentBatteryPercentage}%
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Energy Delivered</span>
                    <span className="font-bold text-emerald-600 block">
                      {Number(sess.energyConsumedKwh).toFixed(2)} kWh
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Duration</span>
                    <span className="font-bold text-slate-800 block">
                      {sess.actualDurationMinutes || sess.estimatedDurationMinutes || 0} mins
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block">Payment Status</span>
                    <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block text-[10px]">
                      Pending (Phase 5)
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Started: {sess.startedAt ? new Date(sess.startedAt).toLocaleString() : "—"}
                  </span>

                  <div className="flex gap-2">
                    {!isFinished && (
                      <Link
                        to={`/sessions/${sess._id}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Live Session</span>
                      </Link>
                    )}
                    <Link
                      to={`/sessions/${sess._id}/details`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChargingHistory;
