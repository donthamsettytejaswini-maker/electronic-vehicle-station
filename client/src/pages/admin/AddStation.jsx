import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building } from 'lucide-react';
import { createStation } from '../../services/stationService';
import StationForm from '../../components/admin/StationForm';

const AddStation = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      setFieldErrors([]);

      const response = await createStation(formData);
      if (response.success) {
        navigate('/admin/stations');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to create charging station.'
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
          to="/admin/stations"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Back to stations"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Add Charging Station</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure new station location, base energy tariff, and operating details.
          </p>
        </div>
      </div>

      <StationForm
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

export default AddStation;
