import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Car, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  getVehicles,
  deleteVehicle,
  setDefaultVehicle,
} from '../services/vehicleService';
import VehicleCard from '../components/VehicleCard';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  // Dialog state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUserVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getVehicles();
      if (response.success && response.data) {
        setVehicles(response.data.items || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load your vehicles.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserVehicles();
  }, []);

  const handleSetDefault = async (vehicleId) => {
    try {
      setSettingDefaultId(vehicleId);
      const response = await setDefaultVehicle(vehicleId);
      if (response.success) {
        setSuccessMessage('Default vehicle updated successfully.');
        setTimeout(() => setSuccessMessage(''), 3000);
        // Refresh list
        fetchUserVehicles();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set default vehicle.');
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleOpenDelete = (vehicle) => {
    setVehicleToDelete(vehicle);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    try {
      setIsDeleting(true);
      const response = await deleteVehicle(vehicleToDelete._id);
      if (response.success) {
        setSuccessMessage(
          `Vehicle ${vehicleToDelete.vehicleNumber} removed successfully.`
        );
        setTimeout(() => setSuccessMessage(''), 3000);
        setDeleteModalOpen(false);
        setVehicleToDelete(null);
        fetchUserVehicles();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950">My Vehicles</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your registered electric vehicles and connector specifications.
          </p>
        </div>

        <Link
          to="/vehicles/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Link>
      </div>

      {/* Messages */}
      <ErrorMessage message={error} onClose={() => setError('')} />

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Vehicle List */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner text="Fetching your vehicles..." />
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No Vehicles Added"
          message="You have not added a vehicle yet. Add your EV to make future charging bookings easier."
          actionLabel="Add Your First EV"
          onAction={() => (window.location.href = '/vehicles/add')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              onSetDefault={handleSetDefault}
              onDelete={handleOpenDelete}
              isSettingDefault={settingDefaultId === vehicle._id}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        title="Delete Vehicle"
        message={`Are you sure you want to delete ${vehicleToDelete?.brand} ${vehicleToDelete?.model} (${vehicleToDelete?.vehicleNumber})? This action cannot be undone.`}
        confirmText="Delete Vehicle"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setVehicleToDelete(null);
        }}
      />
    </div>
  );
};

export default Vehicles;
