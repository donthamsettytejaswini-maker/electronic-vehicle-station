import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Phone,
  DollarSign,
  Zap,
  Star,
  Shield,
  ArrowLeft,
  Calendar,
  Lock,
  Info,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { getStationById } from '../services/stationService';
import ChargerCard from '../components/ChargerCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import DemandChart from '../components/predictions/DemandChart';
import ReviewList from '../components/reviews/ReviewList';

const StationDetails = () => {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStationData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getStationById(id);
        if (response.success && response.data) {
          setStation(response.data.station);
          setChargers(response.data.chargers || []);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load station details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStationData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24">
        <LoadingSpinner text="Loading station and charger specifications..." />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ErrorMessage message={error || 'Charging station not found.'} />
        <Link
          to="/stations"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Stations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb / Back */}
      <div>
        <Link
          to="/stations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all stations
        </Link>
      </div>

      {/* Main Station Header & Hero Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-3">
        {/* Station Media / Visual */}
        <div className="relative h-64 lg:h-auto bg-slate-900 overflow-hidden">
          {station.image ? (
            <img
              src={station.image}
              alt={station.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-navy-900 to-slate-950 flex flex-col items-center justify-center text-emerald-400 p-6">
              <Zap className="w-16 h-16 stroke-1 mb-2 animate-pulse" />
              <span className="text-xs text-slate-400 font-mono">EV Hub Telemetry Active</span>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <StatusBadge status={station.status} />
          </div>
        </div>

        {/* Station Info Body */}
        <div className="p-6 sm:p-8 lg:col-span-2 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {station.name}
              </h1>
              <div className="text-xl font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                ₹{station.pricePerKwh} <span className="text-xs font-normal text-slate-600 dark:text-slate-400">/ kWh</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {station.description || 'Full-service electric vehicle charging station supporting multiple high-voltage and AC destination sockets.'}
            </p>

            {/* Spec Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Location</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {station.address || station.location?.address}, {station.city || station.location?.city}
                    {station.state ? `, ${station.state}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Operating Hours</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {station.operatingHours || '24/7 Active'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px]">Helpline</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {station.phone || 'Available on-site'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                <Star className="w-3.5 h-3.5 fill-amber-500 stroke-none" />
                {station.averageRating ? station.averageRating.toFixed(1) : '5.0'}
              </div>
              <span className="text-xs text-slate-500">
                ({station.totalReviews || 0} verified driver reviews)
              </span>
            </div>

            {/* Facilities */}
            {station.facilities && station.facilities.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Station Amenities
                </span>
                <div className="flex flex-wrap gap-2">
                  {station.facilities.map((fac, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-700"
                    >
                      {fac}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Slot Reservation Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Online Slot Reservation Active
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-400">
                  Book a guaranteed time slot, get a cryptographic check-in pass, and track live charging telemetry.
                </p>
              </div>
            </div>

            <Link
              to={`/book-slot?stationId=${station._id}`}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition shrink-0 text-center"
            >
              Reserve Slot Now
            </Link>
          </div>
        </div>
      </div>

      {/* AI Demand Forecast Section */}
      <DemandChart stationId={station._id} />

      {/* Available Chargers Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Installed Charging Points ({chargers.length})
            </h2>
            <p className="text-xs text-slate-500">
              View live socket statuses, power ratings, and connector plug standards.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              {chargers.filter((c) => c.status === 'available').length} Available
            </span>
            <span className="text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
              {chargers.filter((c) => c.status === 'charging').length} Charging
            </span>
          </div>
        </div>

        {chargers.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            No chargers configured for this station yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {chargers.map((charger) => (
              <ChargerCard
                key={charger._id}
                charger={charger}
                stationPrice={station.pricePerKwh}
              />
            ))}
          </div>
        )}
      </div>

      {/* Driver Reviews & Ratings Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Driver Reviews & Ratings</h2>
        </div>
        <ReviewList stationId={station._id} />
      </div>
    </div>
  );
};

export default StationDetails;
