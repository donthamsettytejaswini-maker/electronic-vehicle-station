import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, Plus, ShieldCheck, 
  Trash2, DollarSign, Activity, BarChart3, RefreshCw 
} from 'lucide-react';
import fleetService from '../../services/fleetService';

export const FleetDashboard = () => {
  const [orgData, setOrgData] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState(50000);

  const [driverEmail, setDriverEmail] = useState('');
  const [role, setRole] = useState('fleet_driver');
  const [dailyQuotaKw, setDailyQuotaKw] = useState(100);

  const [submitting, setSubmitting] = useState(false);

  const fetchFleetData = async () => {
    try {
      setLoading(true);
      const orgRes = await fleetService.getMyOrganization();
      if (orgRes.success && orgRes.data) {
        setOrgData(orgRes.data);
        const reportRes = await fleetService.getFleetReport(orgRes.data.organization._id);
        if (reportRes.success) {
          setReport(reportRes.data);
        }
      }
    } catch (err) {
      console.error('Failed to load fleet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleetData();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fleetService.createOrganization({
        name: orgName,
        billingEmail,
        monthlyBudget: parseFloat(monthlyBudget),
      });
      if (res.success) {
        setShowOrgModal(false);
        fetchFleetData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!orgData?.organization?._id) return;
    setSubmitting(true);
    try {
      const res = await fleetService.addMember(orgData.organization._id, {
        email: driverEmail,
        role,
        dailyQuotaKw: parseFloat(dailyQuotaKw),
      });
      if (res.success) {
        setShowDriverModal(false);
        setDriverEmail('');
        fetchFleetData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member to fleet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this driver from your fleet organization?')) return;
    try {
      await fleetService.removeMember(orgData.organization._id, memberId);
      fetchFleetData();
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 flex items-center justify-center space-x-2">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
        <span>Loading corporate fleet workspace...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Building2 className="w-7 h-7 text-emerald-500" />
            <span>Corporate Fleet Operations</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage organization charging quotas, company vehicles, driver authorizations, and billing budgets
          </p>
        </div>

        {!orgData?.organization && (
          <button
            onClick={() => setShowOrgModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register Fleet Organization</span>
          </button>
        )}
      </div>

      {!orgData?.organization ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-slate-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active Fleet Organization</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            You are not currently enrolled in a fleet account. Register your enterprise organization to manage multiple EV drivers, set budget caps, and view consolidated billing reports.
          </p>
          <button
            onClick={() => setShowOrgModal(true)}
            className="mt-4 inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Setup Fleet Account</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Org Key Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-semibold">Organization</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {orgData.organization.name}
              </div>
              <span className="text-xs text-emerald-600 mt-1 inline-block">Active Enterprise</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-semibold">Fleet Members</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {orgData.members?.length || 1} Drivers
              </div>
              <span className="text-xs text-slate-400 mt-1 inline-block">Enrolled active drivers</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-semibold">Monthly Budget</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                ₹{orgData.organization.monthlyBudget?.toLocaleString() || '50,000'}
              </div>
              <span className="text-xs text-blue-500 mt-1 inline-block">Auto-enforced limit</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <span className="text-xs text-slate-500 uppercase font-semibold">Total Energy Consumed</span>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {report?.totalEnergyConsumedKwh?.toFixed(1) || '0.0'} kWh
              </div>
              <span className="text-xs text-slate-400 mt-1 inline-block">Across all fleet vehicles</span>
            </div>
          </div>

          {/* Members / Drivers Management */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Authorized Fleet Drivers</h3>
              </div>

              <button
                onClick={() => setShowDriverModal(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite Driver</span>
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {orgData.members?.map((m) => (
                <div key={m._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                      {(m.userId?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {m.userId?.name || 'Fleet Member'}
                      </h4>
                      <p className="text-xs text-slate-500">{m.userId?.email || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                      {m.role?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      Quota: <strong>{m.dailyQuotaKw || 100} kWh/day</strong>
                    </span>
                    <button
                      onClick={() => handleRemoveMember(m._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                      title="Remove Driver"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Org Creation Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Register Fleet Organization</h3>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. EcoRide Logistics"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Corporate Billing Email</label>
                <input
                  type="email"
                  required
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="billing@ecoride.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Monthly Charging Budget (INR)</label>
                <input
                  type="number"
                  required
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Fleet Driver</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registered User Email</label>
                <input
                  type="email"
                  required
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  placeholder="driver@ecoride.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fleet Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="fleet_driver">Fleet Driver</option>
                    <option value="fleet_manager">Fleet Manager</option>
                    <option value="organization_admin">Org Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Daily Cap (kWh)</label>
                  <input
                    type="number"
                    value={dailyQuotaKw}
                    onChange={(e) => setDailyQuotaKw(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriverModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {submitting ? 'Adding...' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetDashboard;
