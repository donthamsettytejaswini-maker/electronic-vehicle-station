import React, { useState, useEffect } from 'react';
import { 
  Cpu, Radio, Activity, Play, Square, AlertTriangle, 
  CheckCircle2, RefreshCw, Send, ShieldAlert, Zap 
} from 'lucide-react';
import ocppService from '../../services/ocppService';
import stationService from '../../services/stationService';
import chargerService from '../../services/chargerService';

export const OcppConsole = () => {
  const [stations, setStations] = useState([]);
  const [chargers, setChargers] = useState([]);
  const [selectedChargerId, setSelectedChargerId] = useState('');
  const [ocppStatus, setOcppStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Meter Values Form
  const [energyActiveImport, setEnergyActiveImport] = useState(15.4);
  const [powerKw, setPowerKw] = useState(22.0);
  const [soc, setSoc] = useState(65);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [statusRes, stationsRes] = await Promise.all([
        ocppService.getStatus(),
        stationService.getAllStations({ limit: 50 }),
      ]);
      if (statusRes.success) setOcppStatus(statusRes.data);
      if (stationsRes.success) {
        const sts = stationsRes.data.stations || stationsRes.data;
        setStations(sts);
        if (sts.length > 0 && sts[0].chargers?.length > 0) {
          setChargers(sts[0].chargers);
          setSelectedChargerId(sts[0].chargers[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load OCPP console data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStationChange = (stId) => {
    const st = stations.find(s => s._id === stId);
    if (st && st.chargers) {
      setChargers(st.chargers);
      if (st.chargers.length > 0) setSelectedChargerId(st.chargers[0]._id);
    }
  };

  const appendLog = (action, payload, response) => {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      payload,
      response,
    };
    setLogs(prev => [entry, ...prev.slice(0, 40)]);
  };

  const handleBoot = async () => {
    if (!selectedChargerId) return;
    setActionLoading(true);
    try {
      const res = await ocppService.simulateBootNotification(selectedChargerId, {
        chargePointVendor: 'EVCharge Technologies',
        chargePointModel: 'FastCharger-PRO-150',
      });
      appendLog('BootNotification', { chargerId: selectedChargerId }, res);
    } catch (err) {
      appendLog('BootNotification [ERROR]', null, err.response?.data || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHeartbeat = async () => {
    if (!selectedChargerId) return;
    setActionLoading(true);
    try {
      const res = await ocppService.simulateHeartbeat(selectedChargerId);
      appendLog('Heartbeat', { chargerId: selectedChargerId }, res);
    } catch (err) {
      appendLog('Heartbeat [ERROR]', null, err.response?.data || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusNotification = async (status, errorCode = 'NoError') => {
    if (!selectedChargerId) return;
    setActionLoading(true);
    try {
      const res = await ocppService.simulateStatusNotification(selectedChargerId, {
        connectorId: 1,
        status,
        errorCode,
      });
      appendLog(`StatusNotification (${status})`, { status, errorCode }, res);
    } catch (err) {
      appendLog('StatusNotification [ERROR]', null, err.response?.data || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMeterValues = async () => {
    if (!selectedChargerId) return;
    setActionLoading(true);
    try {
      const res = await ocppService.simulateMeterValues(selectedChargerId, {
        connectorId: 1,
        meterValue: [
          {
            timestamp: new Date().toISOString(),
            sampledValue: [
              { value: energyActiveImport.toString(), unit: 'kWh', measurand: 'Energy.Active.Import.Register' },
              { value: powerKw.toString(), unit: 'kW', measurand: 'Power.Active.Import' },
              { value: soc.toString(), unit: 'Percent', measurand: 'SoC' },
            ],
          },
        ],
      });
      appendLog('MeterValues', { energyActiveImport, powerKw, soc }, res);
    } catch (err) {
      appendLog('MeterValues [ERROR]', null, err.response?.data || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Cpu className="w-7 h-7 text-emerald-500" />
            <span>OCPP 1.6-JSON Hardware Simulator</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Standardized charging point communication protocol adapter and hardware emulation console
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>OCPP 1.6J Ready</span>
          </span>
        </div>
      </div>

      {/* Simulator Notice */}
      <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start space-x-3 text-xs text-blue-900 dark:text-blue-200">
        <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Hardware Emulation Environment:</span> This console executes compliant OCPP 1.6-JSON actions (BootNotification, Heartbeat, StatusNotification, MeterValues telemetry, and Central System Remote Commands) against the local backend server without requiring physical charger microcontrollers.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Action Panel */}
        <div className="lg:col-span-6 space-y-6">
          {/* Target Charger Selection */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Target Charging Station & Point</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Station</label>
                <select
                  onChange={(e) => handleStationChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {stations.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Charger Connector</label>
                <select
                  value={selectedChargerId}
                  onChange={(e) => setSelectedChargerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {chargers.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name || c.identifier || c._id.slice(-6)} ({c.type || 'DC Fast'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Protocol Event Triggers</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleBoot}
                disabled={actionLoading}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 transition flex items-center justify-center space-x-2"
              >
                <Cpu className="w-4 h-4 text-emerald-500" />
                <span>Send BootNotification</span>
              </button>

              <button
                onClick={handleHeartbeat}
                disabled={actionLoading}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 transition flex items-center justify-center space-x-2"
              >
                <Activity className="w-4 h-4 text-blue-500" />
                <span>Send Heartbeat</span>
              </button>
            </div>

            {/* Status Notifications */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Status Notifications</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleStatusNotification('Available')}
                  className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition"
                >
                  Available
                </button>
                <button
                  onClick={() => handleStatusNotification('Occupied')}
                  className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-100 transition"
                >
                  Occupied
                </button>
                <button
                  onClick={() => handleStatusNotification('Faulted', 'OverCurrentFailure')}
                  className="p-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-semibold hover:bg-red-100 transition"
                >
                  Faulted
                </button>
              </div>
            </div>

            {/* Simulated Meter Values */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Sampled Meter Telemetry</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block">Energy (kWh)</label>
                  <input
                    type="number"
                    value={energyActiveImport}
                    onChange={(e) => setEnergyActiveImport(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded-lg dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Power (kW)</label>
                  <input
                    type="number"
                    value={powerKw}
                    onChange={(e) => setPowerKw(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded-lg dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Battery SoC (%)</label>
                  <input
                    type="number"
                    value={soc}
                    onChange={(e) => setSoc(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs border rounded-lg dark:bg-slate-900"
                  />
                </div>
              </div>
              <button
                onClick={handleMeterValues}
                className="w-full mt-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit MeterValues Payload</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Protocol Stream Terminal */}
        <div className="lg:col-span-6 bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-mono text-slate-400 ml-2">OCPP 1.6-J Message Stream</span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="text-[10px] font-mono text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs pt-3">
            {logs.length === 0 ? (
              <div className="text-slate-500 text-center py-16">
                Awaiting OCPP protocol action triggers...
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                    <span>&gt; {l.action}</span>
                    <span className="text-slate-500">{l.timestamp}</span>
                  </div>
                  {l.payload && (
                    <div className="text-[10px] text-slate-300 overflow-x-auto">
                      REQ: {JSON.stringify(l.payload)}
                    </div>
                  )}
                  <div className="text-[10px] text-blue-400 overflow-x-auto">
                    CONF: {JSON.stringify(l.response)}
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

export default OcppConsole;
