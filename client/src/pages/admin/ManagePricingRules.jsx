import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, Clock, Calendar, Check, 
  Trash2, ToggleLeft, ToggleRight, Sparkles, AlertCircle, RefreshCw 
} from 'lucide-react';
import pricingService from '../../services/pricingService';
import stationService from '../../services/stationService';

export const ManagePricingRules = () => {
  const [rules, setRules] = useState([]);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Rule Form State
  const [name, setName] = useState('');
  const [stationId, setStationId] = useState('');
  const [ruleType, setRuleType] = useState('peak_surge'); // 'peak_surge', 'off_peak_discount', 'weekend_special'
  const [multiplier, setMultiplier] = useState(1.2);
  const [fixedPricePerKwh, setFixedPricePerKwh] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('21:00');
  const [daysOfWeek, setDaysOfWeek] = useState([1, 2, 3, 4, 5]);
  const [priority, setPriority] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRules = async () => {
    try {
      setLoading(true);
      const [rulesRes, stationsRes] = await Promise.all([
        pricingService.getAllRules(),
        stationService.getAllStations({ limit: 100 }),
      ]);
      if (rulesRes.success) setRules(rulesRes.data);
      if (stationsRes.success) setStations(stationsRes.data.stations || stationsRes.data);
    } catch (err) {
      console.error('Failed to load dynamic pricing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const res = await pricingService.toggleRuleStatus(id);
      if (res.success) {
        setRules(prev => prev.map(r => r._id === id ? res.data : r));
      }
    } catch (err) {
      alert('Failed to update rule status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await pricingService.deleteRule(id);
      setRules(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert('Failed to delete pricing rule');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name,
        stationId: stationId || null,
        ruleType,
        multiplier: parseFloat(multiplier),
        fixedPricePerKwh: fixedPricePerKwh ? parseFloat(fixedPricePerKwh) : null,
        startTime,
        endTime,
        daysOfWeek,
        priority: parseInt(priority, 10),
      };

      const res = await pricingService.createRule(payload);
      if (res.success) {
        setRules(prev => [res.data, ...prev]);
        setShowCreateModal(false);
        // Reset form
        setName('');
        setStationId('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create pricing rule');
    } finally {
      setSubmitting(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <DollarSign className="w-7 h-7 text-emerald-500" />
            <span>Dynamic Pricing Engine</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure peak surges, off-peak discounts, and time-of-use tariffs across charging stations
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Pricing Rule</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
            <span>Loading pricing rules...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No dynamic pricing rules configured</p>
            <p className="text-xs text-slate-400">Standard base station tariffs will apply for all bookings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Rule Name</th>
                  <th className="p-4">Scope & Station</th>
                  <th className="p-4">Rate Adjustment</th>
                  <th className="p-4">Active Hours & Days</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {rules.map((rule) => (
                  <tr key={rule._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {rule.name}
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                      {rule.stationId?.name || (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold">
                          Network-wide
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold">
                      {rule.multiplier ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          rule.multiplier > 1.0 ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {rule.multiplier}x Multiplier
                        </span>
                      ) : rule.fixedPricePerKwh ? (
                        <span className="text-emerald-600">₹{rule.fixedPricePerKwh}/kWh</span>
                      ) : (
                        'Standard'
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center space-x-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rule.startTime || '00:00'} - {rule.endTime || '23:59'}</span>
                      </div>
                      <div className="flex space-x-1 mt-1">
                        {rule.daysOfWeek?.map(d => (
                          <span key={d} className="px-1 bg-slate-100 dark:bg-slate-700 text-[10px] rounded">
                            {dayNames[d]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-xs text-slate-700 dark:text-slate-300">
                      {rule.priority || 0}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(rule._id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-full border transition flex items-center space-x-1 ${
                          rule.active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {rule.active ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                        <span>{rule.active ? 'Active' : 'Disabled'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(rule._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Create Dynamic Pricing Rule</h3>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{error}</div>
            )}

            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Evening Peak Hour Surge"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Station (Optional)</label>
                <select
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Network-wide (All Stations)</option>
                  {stations.map(s => (
                    <option key={s._id} value={s._id}>{s.name} - {s.location?.city}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rate Multiplier (e.g. 1.25x)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="5.0"
                    value={multiplier}
                    onChange={(e) => setMultiplier(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority (Higher wins)</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time (HH:MM)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time (HH:MM)</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {submitting ? 'Creating...' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePricingRules;
