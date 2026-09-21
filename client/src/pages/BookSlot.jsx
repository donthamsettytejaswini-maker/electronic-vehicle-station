import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { getStations, getStationById } from "../services/stationService";
import { getVehicles } from "../services/vehicleService";
import { createBooking, getAvailableSlots } from "../services/bookingService";
import { Calendar, Clock, Car, Zap, MapPin, AlertCircle, ArrowLeft, Loader2, Check } from "lucide-react";

const BookSlot = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedStationId = searchParams.get("stationId");
  const preselectedChargerId = searchParams.get("chargerId");

  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(preselectedStationId || "");
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedChargerId, setSelectedChargerId] = useState(preselectedChargerId || "");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(60);

  const [slotsData, setSlotsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch initial stations & vehicles
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        setLoading(true);
        const [stationRes, vehicleRes] = await Promise.all([
          getStations({ limit: 50 }),
          getVehicles(),
        ]);
        setStations(stationRes.data || []);
        const userVehicles = vehicleRes.data || [];
        setVehicles(userVehicles);

        // Select default vehicle if available
        const defaultVeh = userVehicles.find((v) => v.isDefault) || userVehicles[0];
        if (defaultVeh) setSelectedVehicleId(defaultVeh._id);

        // If preselected station exists
        if (preselectedStationId) {
          const st = (stationRes.data || []).find((s) => s._id === preselectedStationId);
          if (st) {
            setSelectedStation(st);
            if (preselectedChargerId) {
              setSelectedChargerId(preselectedChargerId);
            } else if (st.chargers && st.chargers.length > 0) {
              setSelectedChargerId(st.chargers[0]._id);
            }
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load booking resources.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitData();
  }, [preselectedStationId, preselectedChargerId]);

  // Handle station change
  const handleStationChange = (e) => {
    const stId = e.target.value;
    setSelectedStationId(stId);
    const st = stations.find((s) => s._id === stId);
    setSelectedStation(st || null);
    if (st && st.chargers && st.chargers.length > 0) {
      setSelectedChargerId(st.chargers[0]._id);
    } else {
      setSelectedChargerId("");
    }
  };

  // Fetch slot availability when charger or date changes
  useEffect(() => {
    if (!selectedChargerId || !date) return;

    const fetchSlots = async () => {
      try {
        const res = await getAvailableSlots(selectedChargerId, date);
        setSlotsData(res.data);
      } catch (err) {
        console.warn("Could not fetch slots:", err);
      }
    };
    fetchSlots();
  }, [selectedChargerId, date]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedStationId || !selectedChargerId || !selectedVehicleId || !date || !startTime) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

      const payload = {
        stationId: selectedStationId,
        chargerId: selectedChargerId,
        vehicleId: selectedVehicleId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      };

      const res = await createBooking(payload);
      const createdBooking = res.data;
      navigate(`/bookings/confirmation/${createdBooking._id}`, { state: { booking: createdBooking } });
    } catch (err) {
      setError(err.response?.data?.message || "Booking creation failed. Please try a different slot.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/stations"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Stations
      </Link>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Phase 3 • Slot Reservation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Reserve Charging Slot
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Select your vehicle, station, charger port, and preferred time window.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {vehicles.length === 0 ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
            <Car className="w-10 h-10 text-amber-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Registered Vehicles Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              You must register at least one electric vehicle before booking a charging slot.
            </p>
            <Link
              to="/vehicles"
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              Add Vehicle
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Vehicle */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                1. Select Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              >
                {vehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.brand} {v.model} ({v.licensePlate}) • {v.batteryCapacity} kWh • {v.connectorType}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Station & Charger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  2. Select Station
                </label>
                <select
                  value={selectedStationId}
                  onChange={handleStationChange}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                >
                  <option value="">-- Choose Charging Station --</option>
                  {stations.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.name} ({st.city || st.address})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  3. Select Charger Port
                </label>
                <select
                  value={selectedChargerId}
                  onChange={(e) => setSelectedChargerId(e.target.value)}
                  disabled={!selectedStation}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                  required
                >
                  <option value="">-- Choose Charger --</option>
                  {selectedStation?.chargers?.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name || `Charger #${c.serialNumber || c._id.slice(-4)}`} • {c.chargerType} ({c.powerRating} kW) • [{c.status}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Date, Time & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">
                  Duration (Minutes)
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>1 Hour (60 Mins)</option>
                  <option value={90}>1.5 Hours (90 Mins)</option>
                  <option value={120}>2 Hours (120 Mins)</option>
                </select>
              </div>
            </div>

            {/* Overlap / Slot info indicator */}
            {slotsData && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-500">Bookings for Selected Day:</span>
                {slotsData.bookings?.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-medium">
                    ✓ No conflicting bookings on this charger for the selected date.
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600">Reserved slots on this charger:</p>
                    <div className="flex flex-wrap gap-2">
                      {slotsData.bookings?.map((b, i) => (
                        <span key={i} className="text-[11px] bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-mono">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {new Date(b.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Phase 5 Notice */}
            <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
              💳 <strong>Note:</strong> Payment and billing integration is reserved for Phase 5. No charges will be incurred at this time.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Confirm Slot Reservation</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookSlot;
