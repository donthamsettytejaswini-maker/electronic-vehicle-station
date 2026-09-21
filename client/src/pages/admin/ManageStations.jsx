import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  MapPin,
  Zap,
  Edit2,
  Trash2,
  Settings,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  getStations,
  deleteStation,
  updateStationStatus,
} from '../../services/stationService';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import Pagination from '../../components/Pagination';

const ManageStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [stationToDelete, setStationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStations = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError('');
        const params = {
          page,
          limit: pagination.limit,
          status: statusFilter,
          ...(searchTerm && { search: searchTerm }),
        };

        const response = await getStations(params);
        if (response.success && response.data) {
          setStations(response.data.items || []);
          setPagination(
            response.data.pagination || {
              page,
              limit: 10,
              total: response.data.items?.length || 0,
              pages: 1,
            }
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load station directory.'
        );
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, statusFilter, pagination.limit]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStations(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, fetchStations]);

  const handleStatusChange = async (stationId, newStatus) => {
    try {
      const response = await updateStationStatus(stationId, newStatus);
      if (response.success) {
        setSuccessMessage(`Station status updated to ${newStatus}.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchStations(pagination.page);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to update station status.'
      );
    }
  };

  const handleOpenDelete = (station) => {
    setStationToDelete(station);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!stationToDelete) return;
    try {
      setIsDeleting(true);
      setError('');
      const response = await deleteStation(stationToDelete._id);
      if (response.success) {
        setSuccessMessage(`Station "${stationToDelete.name}" deleted successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalOpen(false);
        setStationToDelete(null);
        fetchStations(pagination.page);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to delete station. Make sure all chargers are removed first.'
      );
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">
            Station Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Provision charging stations, configure operating rates, and manage hardware bays.
          </p>
        </div>

        <Link
          to="/admin/stations/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Station
        </Link>
      </div>

      {/* Messages */}
      <ErrorMessage message={error} onClose={() => setError('')} />

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search stations by name or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="maintenance">Maintenance Only</option>
          </select>
        </div>
      </div>

      {/* Station Table (Desktop) / Cards (Mobile) */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner text="Loading station records..." />
        </div>
      ) : stations.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No stations found matching your criteria.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Station & Location</th>
                    <th className="px-6 py-3.5">Base Rate</th>
                    <th className="px-6 py-3.5">Chargers</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Created</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {stations.map((st) => (
                    <tr key={st._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">
                          {st.name}
                        </div>
                        <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{st.address}, {st.city}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-900">
                        ₹{st.pricePerKwh} / kWh
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/stations/${st._id}/chargers`}
                          className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition border border-emerald-200"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{st.availableChargers ?? 0} / {st.totalChargers ?? 0} Ports</span>
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={st.status}
                          onChange={(e) => handleStatusChange(st._id, e.target.value)}
                          className="text-[11px] font-semibold py-1 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {new Date(st.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/stations/${st._id}/chargers`}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Manage Chargers"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>

                          <Link
                            to={`/admin/stations/${st._id}/edit`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Edit Station"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleOpenDelete(st)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Station"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={(p) => fetchStations(p)}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Charging Station"
        message={`Are you sure you want to delete station "${stationToDelete?.name}"? Note: Deletion will be rejected if any charger hardware records exist.`}
        confirmText="Delete Station"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setStationToDelete(null);
        }}
      />
    </div>
  );
};

export default ManageStations;
