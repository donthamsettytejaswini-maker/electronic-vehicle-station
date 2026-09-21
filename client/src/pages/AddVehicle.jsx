import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Car } from 'lucide-react';
import { createVehicle } from '../services/vehicleService';
import VehicleForm from '../components/VehicleForm';

const AddVehicle = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const navigate = useNavigate();

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      setFieldErrors([]);

      const response = await createVehicle(formData);
      if (response.success) {
        navigate('/vehicles', {
          state: { flashMessage: 'Vehicle added successfully!' },
        });
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to add vehicle. Please check your entries.'
      );
      setFieldErrors(err.response?.data?.errors || []);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-navy-950">Add Electric Vehicle</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Register your EV specs and battery details for optimal charging recommendations.
          </p>
        </div>
      </div>

      <VehicleForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        serverError={serverError}
        fieldErrors={fieldErrors}
        onClearErrors={() => {
          setServerError('');
          setFieldErrors([]);
        }}
      />
    </div>
  );
};

export default AddVehicle;
