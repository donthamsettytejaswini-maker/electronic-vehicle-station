import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Filter,
  RefreshCw,
  X,
  MapPin,
  Zap,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import stationService from '../../services/stationService';
import chargerService from '../../services/chargerService';

const PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Previous Month', value: 'previous_month' },
];

const AnalyticsFilters = ({
  filters,
  onApplyFilters,
  onResetFilters,
  loading = false,
  showStationFilter = true,
  showChargerFilter = true,
  showStatusFilter = false,
  statusOptions = [],
  showPaymentStatusFilter = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(filters.preset || 'last_30_days');
  const [fromDate, setFromDate] = useState(filters.fromDate || '');
  const [toDate, setToDate] = useState(filters.toDate || '');
  const [stationId, setStationId] = useState(filters.stationId || '');
  const [chargerId, setChargerId] = useState(filters.chargerId || '');
  const [status, setStatus] = useState(filters.status || '');
  const [paymentStatus, setPaymentStatus] = useState(filters.paymentStatus || '');

  const [stations, setStations] = useState([]);
  const [chargers, setChargers] = useState([]);
  const [dateError, setDateError] = useState('');

  // Fetch stations for dropdown
  useEffect(() => {
    const loadStations = async () => {
      try {
        const res = await stationService.getStations({ limit: 100 });
        if (res?.data?.items) {
          setStations(res.data.items);
        } else if (res?.data?.stations) {
          setStations(res.data.stations);
        }
      } catch (err) {
        console.error('Failed to load stations in filter', err);
      }
    };
    if (showStationFilter) {
      loadStations();
    }
  }, [showStationFilter]);

  // Fetch chargers when station changes
  useEffect(() => {
    const loadChargers = async () => {
      if (!stationId) {
        setChargers([]);
        setChargerId('');
        return;
      }
      try {
        const res = await chargerService.getChargersByStation(stationId);
        if (res?.data) {
          setChargers(res.data);
          // If current charger doesn't belong to station, reset it
          if (chargerId && !res.data.some((c) => c._id === chargerId)) {
            setChargerId('');
          }
        }
      } catch (err) {
        console.error('Failed to load chargers in filter', err);
      }
    };
    if (showChargerFilter) {
      loadChargers();
    }
  }, [stationId, showChargerFilter]);

  // Handle Preset selection
  const handlePresetChange = (presetValue) => {
    setSelectedPreset(presetValue);
    setFromDate('');
    setToDate('');
    setDateError('');
  };

  // Handle Custom Date Change
  const handleDateChange = (from, to) => {
    setDateError('');
    if (from && to && new Date(from) > new Date(to)) {
      setDateError('From date cannot be later than To date');
      return;
    }
    setSelectedPreset('');
    setFromDate(from);
    setToDate(to);
  };

  // Apply filters
  const handleApply = (e) => {
    if (e) e.preventDefault();
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setDateError('From date cannot be later than To date');
      return;
    }

    const applied = {};
    if (selectedPreset) {
      applied.preset = selectedPreset;
    } else {
      if (fromDate) applied.fromDate = fromDate;
      if (toDate) applied.toDate = toDate;
    }

    if (stationId) applied.stationId = stationId;
    if (chargerId) applied.chargerId = chargerId;
    if (status) applied.status = status;
    if (paymentStatus) applied.paymentStatus = paymentStatus;

    onApplyFilters(applied);
  };

  // Reset filters
  const handleReset = () => {
    setSelectedPreset('last_30_days');
    setFromDate('');
    setToDate('');
    setStationId('');
    setChargerId('');
    setStatus('');
    setPaymentStatus('');
    setDateError('');
    onResetFilters();
  };

  // Active filter count
  let activeCount = 0;
  if (selectedPreset && selectedPreset !== 'last_30_days') activeCount++;
  if (fromDate || toDate) activeCount++;
  if (stationId) activeCount++;
  if (chargerId) activeCount++;
  if (status) activeCount++;
  if (paymentStatus) activeCount++;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Preset Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Calendar className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                handlePresetChange(p.value);
                const applied = { preset: p.value };
                if (stationId) applied.stationId = stationId;
                if (chargerId) applied.chargerId = chargerId;
                if (status) applied.status = status;
                if (paymentStatus) applied.paymentStatus = paymentStatus;
                onApplyFilters(applied);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedPreset === p.value
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filter Expand Button & Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
              isOpen || activeCount > 0
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Reset all filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Custom Filter Panel */}
      {isOpen && (
        <form
          onSubmit={handleApply}
          className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200"
        >
          {/* Custom Date Range */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => handleDateChange(e.target.value, toDate)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => handleDateChange(fromDate, e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Station Selector */}
          {showStationFilter && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Charging Station
              </label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">All Stations</option>
                {stations.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Charger Selector */}
          {showChargerFilter && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Charger Port
              </label>
              <select
                value={chargerId}
                disabled={!stationId || chargers.length === 0}
                onChange={(e) => setChargerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!stationId
                    ? 'Select Station First'
                    : chargers.length === 0
                    ? 'No Chargers Found'
                    : 'All Chargers'}
                </option>
                {chargers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.chargerNumber} ({c.connectorType} - {c.powerRating} kW)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          {showStatusFilter && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">All Statuses</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Status Filter */}
          {showPaymentStatusFilter && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">All Payment Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2">
            {dateError ? (
              <span className="text-xs font-semibold text-rose-600">{dateError}</span>
            ) : (
              <span className="text-xs text-slate-400">
                Timezone: Asia/Kolkata (IST)
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AnalyticsFilters;
