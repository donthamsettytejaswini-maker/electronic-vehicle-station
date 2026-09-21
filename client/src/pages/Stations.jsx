import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Zap, Sparkles } from 'lucide-react';
import { getStations } from '../services/stationService';
import StationCard from '../components/StationCard';
import StationFilters from '../components/StationFilters';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';

const Stations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 1,
  });

  const [filters, setFilters] = useState({
    search: '',
    city: '',
    connectorType: '',
    chargingSpeed: '',
    minPrice: '',
    maxPrice: '',
  });

  const fetchStations = useCallback(
    async (currentPage = 1) => {
      try {
        setLoading(true);
        setError('');

        const params = {
          page: currentPage,
          limit: pagination.limit,
          status: 'active', // Normal discovery shows active stations
          ...(filters.search && { search: filters.search }),
          ...(filters.city && { city: filters.city }),
          ...(filters.connectorType && { connectorType: filters.connectorType }),
          ...(filters.chargingSpeed && { chargingSpeed: filters.chargingSpeed }),
          ...(filters.minPrice && { minPrice: filters.minPrice }),
          ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        };

        const response = await getStations(params);
        if (response.success && response.data) {
          setStations(response.data.items || []);
          setPagination(
            response.data.pagination || {
              page: currentPage,
              limit: 9,
              total: response.data.items?.length || 0,
              pages: 1,
            }
          );
        }
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load charging stations.'
        );
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStations(1);
    }, 300); // 300ms debounce for search input

    return () => clearTimeout(timer);
  }, [filters, fetchStations]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      city: '',
      connectorType: '',
      chargingSpeed: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  const handlePageChange = (newPage) => {
    fetchStations(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <Zap className="w-3.5 h-3.5" /> Station Discovery
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-950">
          Find Charging Stations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Explore certified fast-charging hubs, filter by port standard, and inspect live socket availability.
        </p>
      </div>

      {/* Filter Component */}
      <StationFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={pagination.total}
      />

      {/* Messages */}
      <ErrorMessage message={error} onClose={() => setError('')} />

      {/* Station Grid */}
      {loading ? (
        <div className="py-20">
          <LoadingSpinner text="Searching EV charging network..." />
        </div>
      ) : stations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No Stations Found"
          message="No charging stations matched your filter criteria. Try clearing search filters or broadening price thresholds."
          actionLabel="Clear All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stations.map((station) => (
              <StationCard key={station._id} station={station} />
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Stations;
