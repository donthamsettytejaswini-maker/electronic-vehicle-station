import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import { createCharger } from '../../services/chargerService';
import ChargerForm from '../../components/admin/ChargerForm';

const AddCharger = () => {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  const handleCreate = async (formData) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      setFieldErrors([]);

      const response = await createCharger(stationId, formData);
      if (response.success) {
        navigate(`/admin/stations/${stationId}/chargers`);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to add charger to station.'
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
          to={`/admin/stations/${stationId}/chargers`}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Back to chargers"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">Add Charger Bay</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure connector standard, charging power, and socket ID.
          </p>
        </div>
      </div>

      <ChargerForm
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

export default AddCharger;
