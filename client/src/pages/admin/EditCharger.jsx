import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getChargerById, updateCharger } from '../../services/chargerService';
import ChargerForm from '../../components/admin/ChargerForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const EditCharger = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [charger, setCharger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    const fetchCharger = async () => {
      try {
        setLoading(true);
        const response = await getChargerById(id);
        if (response.success && response.data?.charger) {
          setCharger(response.data.charger);
        }
      } catch (err) {
        setServerError(
          err.response?.data?.message || 'Failed to load charger details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCharger();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      setFieldErrors([]);

      const response = await updateCharger(id, formData);
      if (response.success) {
        const targetStationId = charger.stationId?._id || charger.stationId;
        navigate(`/admin/stations/${targetStationId}/chargers`);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to update charger details.'
      );
      setFieldErrors(err.response?.data?.errors || []);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Loading charger parameters..." />
      </div>
    );
  }

  const stationId = charger?.stationId?._id || charger?.stationId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={stationId ? `/admin/stations/${stationId}/chargers` : '/admin/stations'}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Back to chargers"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy-950">
            Edit Charger: {charger?.chargerNumber}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Update power rating, connector type, and charging rate.
          </p>
        </div>
      </div>

      {charger ? (
        <ChargerForm
          initialData={charger}
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
        <ErrorMessage message={serverError || 'Charger record not found.'} />
      )}
    </div>
  );
};

export default EditCharger;
