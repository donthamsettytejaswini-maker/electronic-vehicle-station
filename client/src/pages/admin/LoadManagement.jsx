import React, { useState, useEffect } from 'react';
import { 
  Gauge, Zap, AlertTriangle, ShieldCheck, 
  Sliders, RefreshCw, Layers, CheckCircle2 
} from 'lucide-react';
import loadManagementService from '../../services/loadManagementService';
import stationService from '../../services/stationService';

export const LoadManagement = () => {
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [loadData, setLoadData] = useState(null);
  const [maxPowerInput, setMaxPowerInput] = useState(150);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const res = await stationService.getAllStations({ limit: 50 });
      if (res.success) {
        const sts = res.data.stations || res.data;
        setStations(sts);
        if (sts.length > 0) {
          setSelectedStationId(sts[0]._id);
          fetchStationLoad(sts[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStationLoad = async (stId) => {
    try {
      const res = await loadManagementService.getStationLoad(stId);
      if (res.success) {
        setLoadData(res.data);
        setMaxPowerInput(res.data.maxSitePowerKw || 150);
      }
    } catch (err) {
      console.error('Failed to load station power metrics:', err);
    }
  };

  const handleStationChange = (stId) => {
    setSelectedStationId(stId);
    fetchStationLoad(stId);
  };

  const handleUpdateLimit = async (e) => {
    e.preventDefault();
    if (!selectedStationId) return;
    setUpdating(true);
    try {
      const res = await loadManagementService.updateSiteLimit(selectedStationId, parseFloat(maxPowerInput));
      if (res.success) {
        fetchStationLoad(selectedStationId);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update site power limit');
    } finally {
      setUpdating(false);
    }
  };

  const handleRebalance = async () => {
    if (!selectedStationId) return;
    try {
      const res = await loadManagementService.triggerRebalance(selectedStationId);
      if (res.success) {
        fetchStationLoad(selectedStationId);
      }
    } catch (err) {
      alert('Failed to trigger dynamic rebalancing');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 flex items-center justify-center space-x-2">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
        <span>Loading smart load management grid...</span>
      </div>
    );
  }

  const utilizationPercent = loadData?.maxSitePowerKw
    ? Math.min(100, Math.round(((loadData.totalAllocatedPowerKw || 0) / loadData.maxSitePowerKw) * 100))
    : 0;

  const isOverloaded = utilizationPercent >= 90;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Gauge className="w-7 h-7 text-emerald-500" />
            <span>Smart Site Load Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic site power throttling, peak shaving, and active charger energy allocation
          </p>
        </div>

        {/* Station Picker */}
        <div className="w-full md:w-72">
          <select
            value={selectedStationId}
            onChange={(e) => handleStationChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            {stations.map(s => (
              <option key={s._id} value={s._id}>{s.name} ({s.location?.city})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overload Alert Warning */}
      {isOverloaded && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-start space-x-3 text-red-900 dark:text-red-200 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Grid Capacity Alert:</span> Total active charger demand is approaching or exceeding 90% of the site electrical limit. Proportional load shedding algorithm is actively throttling power delivery to prevent breaker tripping.
          </div>
        </div>
      )}

      {/* Load Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Max Site Power Limit</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {loadData?.maxSitePowerKw || 150} kW
          </div>
          <span className="text-xs text-blue-600 mt-1 inline-block">Grid Transformer Cap</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Current Site Load</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {loadData?.totalAllocatedPowerKw?.toFixed(1) || '0.0'} kW
          </div>
          <span className="text-xs text-slate-400 mt-1 inline-block">{utilizationPercent}% of Site Capacity</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Available Headroom</span>
          <div className="text-2xl font-extrabold text-slate-700 dark:text-slate-200 mt-1">
            {loadData?.availablePowerKw?.toFixed(1) || (loadData?.maxSitePowerKw || 150)} kW
          </div>
          <span className="text-xs text-emerald-600 mt-1 inline-block">Available for incoming EVs</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <span className="text-xs text-slate-500 uppercase font-semibold">Active Charging Sessions</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {loadData?.activeSessionsCount || 0} Sessions
          </div>
          <span className="text-xs text-slate-400 mt-1 inline-block">Currently drawing power</span>
        </div>
      </div>

      {/* Power Capacity Bar */}
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Real-time Grid Utilization</span>
          <span className={isOverloaded ? 'text-red-600' : 'text-emerald-600'}>
            {loadData?.totalAllocatedPowerKw?.toFixed(1) || 0} kW / {loadData?.maxSitePowerKw || 150} kW ({utilizationPercent}%)
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden p-0.5">
          <div
            style={{ width: `${utilizationPercent}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              isOverloaded ? 'bg-red-500' : utilizationPercent > 70 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
          />
        </div>
      </div>

      {/* Control Grid: Transformer Setting & Allocations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Transformer Cap Config */}
        <div className="lg:col-span-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Configure Site Power Limit</h3>
          </div>
          <p className="text-xs text-slate-500">
            Set the maximum peak electrical consumption allowed for this physical location.
          </p>

          <form onSubmit={handleUpdateLimit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Power Cap (kW)</label>
              <input
                type="number"
                min="20"
                max="1000"
                step="5"
                value={maxPowerInput}
                onChange={(e) => setMaxPowerInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {updating ? 'Updating...' : 'Save Site Power Limit'}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={handleRebalance}
              className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              Trigger Instant Load Rebalance
            </button>
          </div>
        </div>

        {/* Active Connector Allocations */}
        <div className="lg:col-span-8 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Active Charger Allocations</h3>
          </div>

          <div className="space-y-3">
            {loadData?.allocations?.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                No active charging sessions drawing load right now.
              </div>
            ) : (
              loadData?.allocations?.map((alloc, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        Session #{alloc.sessionId?.slice(-6) || i + 1}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Priority: <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{alloc.priority || 'standard'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {alloc.allocatedKw} kW
                    </div>
                    <span className="text-[10px] text-slate-400">Requested: {alloc.requestedKw} kW</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadManagement;
