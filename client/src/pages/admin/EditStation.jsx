import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getStationById, updateStation } from '../../services/stationService';
import StationForm from '../../components/admin/StationForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';

const EditStation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const response = await getStationById(id);
        if (response.success && response.data?.station) {
          setStation(response.data.station);
        }
      } catch (err) {
        setServerError(
          err.response?.data?.message || 'Failed to load station details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      setFieldErrors([]);

      const response = await updateStation(id, formData);
      if (response.success) {
        navigate('/admin/stations');
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message || 'Failed to update charging station.'
      );
      setFieldErrors(err.response?.data?.errors || []);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Loading station configurations..." />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-navy-950">Edit Charging Station</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Update pricing, operating hours, and location for {station?.name}.
          </p>
        </div>
      </div>

      {station ? (
        <StationForm
          initialData={station}
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
        <ErrorMessage message={serverError || 'Station not found.'} />
      )}
    </div>
  );
};

export default EditStation;
