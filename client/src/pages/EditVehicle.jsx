import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getVehicleById, updateVehicle } from '../services/vehicleService';
import VehicleForm from '../components/VehicleForm';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const EditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const response = await getVehicleById(id);
        if (response.success && response.data?.vehicle) {
          setVehicle(response.data.vehicle);
        }
      } catch (err) {
        setServerError(
          err.response?.data?.message || 'Failed to load vehicle details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      setFieldErrors([]);

      const response = await updateVehicle(id, formData);
      if (response.success) {
        navigate('/vehicles');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to update vehicle.'
      );
      setFieldErrors(err.response?.data?.errors || []);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Loading vehicle details..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/vehicles"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Back to vehicles"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Edit Vehicle</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Modify specifications for {vehicle?.brand} {vehicle?.model} ({vehicle?.vehicleNumber}).
          </p>
        </div>
      </div>

      {vehicle ? (
        <VehicleForm
          initialData={vehicle}
          onSubmit={handleUpdate}
          isSubmitting={isSubmitting}
          serverError={serverError}
          fieldErrors={fieldErrors}
          onClearErrors={() => {
            setServerError('');
            setFieldErrors([]);
          }}
        />
      ) : (
        <ErrorMessage message={serverError || 'Vehicle not found.'} />
      )}
    </div>
  );
};

export default EditVehicle;
