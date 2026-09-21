import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowLeft,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Building,
} from 'lucide-react';
import {
  getChargersByStation,
  updateChargerStatus,
  deleteCharger,
} from '../../services/chargerService';
import ChargerCard from '../../components/ChargerCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const ManageChargers = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [station, setStation] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chargerToDelete, setChargerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchChargers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getChargersByStation(stationId);
      if (response.success && response.data) {
        setStation(response.data.station);
        setChargers(response.data.items || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load chargers for this station.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChargers();
  }, [stationId]);

  const handleStatusChange = async (chargerId, newStatus) => {
    try {
      const response = await updateChargerStatus(chargerId, newStatus);
      if (response.success) {
        setSuccessMessage(`Charger status updated to ${newStatus}.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchChargers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update charger status.');
    }
  };

  const handleOpenDelete = (charger) => {
    if (charger.status === 'charging' || charger.status === 'reserved') {
      setError(
        `Cannot delete charger ${charger.chargerNumber} while its status is '${charger.status}'. Please set it to offline or maintenance first.`
      );
      return;
    }
    setChargerToDelete(charger);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!chargerToDelete) return;
    try {
      setIsDeleting(true);
      setError('');
      const response = await deleteCharger(chargerToDelete._id);
      if (response.success) {
        setSuccessMessage(`Charger ${chargerToDelete.chargerNumber} deleted successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalOpen(false);
        setChargerToDelete(null);
        fetchChargers();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete charger.');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/stations"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            aria-label="Back to stations"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy-950 flex items-center gap-2">
              <Zap className="w-6 h-6 text-emerald-600" />
              Chargers: {station?.name || 'Station Hardware'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage socket ports, power ratings, and maintenance states for this station.
            </p>
          </div>
        </div>

        <Link
          to={`/admin/stations/${stationId}/chargers/add`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Charger
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

      {/* Charger Grid */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner text="Fetching charger bays..." />
        </div>
      ) : chargers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-4">
          <p>No chargers configured for this station yet.</p>
          <Link
            to={`/admin/stations/${stationId}/chargers/add`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" /> Add First Charger
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chargers.map((ch) => (
            <ChargerCard
              key={ch._id}
              charger={ch}
              stationPrice={station?.pricePerKwh}
              isAdmin={true}
              onEdit={() => navigate(`/admin/chargers/${ch._id}/edit`)}
              onDelete={handleOpenDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Charger Bay"
        message={`Are you sure you want to delete charger ${chargerToDelete?.chargerNumber} (${chargerToDelete?.connectorType})? This action cannot be undone.`}
        confirmText="Delete Charger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setChargerToDelete(null);
        }}
      />
    </div>
  );
};

export default ManageChargers;
