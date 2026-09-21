import React, { useState, useEffect } from 'react';
import { 
  MapPin, Navigation, Sparkles, Filter, List, 
  Map as MapIcon, RefreshCw, Zap, AlertCircle 
} from 'lucide-react';
import StationMap from '../components/maps/StationMap';
import StationCard from '../components/StationCard';
import RecommendationCard from '../components/recommendations/RecommendationCard';
import stationService from '../services/stationService';
import recommendationService from '../services/recommendationService';

export const StationMapPage = () => {
  const [stations, setStations] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'map', 'list'
  const [showRecommendations, setShowRecommendations] = useState(true);

  // Initial load
  useEffect(() => {
    fetchNearbyStations(12.9716, 77.5946, radiusKm); // default Bangalore
  }, [radiusKm]);

  const fetchNearbyStations = async (lat, lng, radius) => {
    try {
      setLoading(true);
      const res = await stationService.getNearbyStations(lat, lng, radius);
      if (res.success) {
        setStations(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch nearby stations:', err);
      // Fallback to regular station list if nearby endpoint errors
      try {
        const fallback = await stationService.getAllStations({ limit: 50 });
        if (fallback.success) setStations(fallback.data.stations || fallback.data);
      } catch (e) {
        console.error('Fallback failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (lat, lng) => {
    try {
      const res = await recommendationService.getRecommendations({
        latitude: lat,
        longitude: lng,
        maxDistanceKm: radiusKm,
      });
      if (res.success) {
        setRecommendations(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocationDenied(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        setLocating(false);
        fetchNearbyStations(coords.latitude, coords.longitude, radiusKm);
        fetchRecommendations(coords.latitude, coords.longitude);
      },
      (err) => {
        console.warn('Location access denied or timed out:', err);
        setLocating(false);
        setLocationDenied(true);
        // Default to fallback coordinates
        fetchNearbyStations(12.9716, 77.5946, radiusKm);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <MapPin className="w-7 h-7 text-emerald-500" />
            <span>Map-Based Station Finder</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover active charging stations nearby with live availability and route navigation
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* GPS Button */}
          <button
            onClick={handleRequestLocation}
            disabled={locating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm ${
              userLocation
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Locating...' : userLocation ? 'GPS Located' : 'Use My Location'}</span>
          </button>

          {/* Radius Selector */}
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value={5}>Within 5 km</option>
            <option value={15}>Within 15 km</option>
            <option value={25}>Within 25 km</option>
            <option value={50}>Within 50 km</option>
            <option value={100}>Within 100 km</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'split' ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-600' : 'text-slate-500'
              }`}
              title="Split View"
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'map' ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-600' : 'text-slate-500'
              }`}
              title="Map Only"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-xs text-emerald-600' : 'text-slate-500'
              }`}
              title="List Only"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Location Denied Warning */}
      {locationDenied && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <span>Location access was denied or timed out. Showing default regional charging stations.</span>
        </div>
      )}

      {/* AI Recommendations Section */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Smart Recommended Stations For You</span>
            </h2>
            <button
              onClick={() => setShowRecommendations(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.station._id} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Main Map & Station List Container */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Map Container */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-7 xl:col-span-8 h-[600px]' : 'h-[700px]'}`}>
            <StationMap
              stations={stations}
              userLocation={userLocation}
            />
          </div>
        )}

        {/* Station Cards List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-5 xl:col-span-4 h-[600px]' : ''} overflow-y-auto space-y-4 pr-1`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Found {stations.length} Nearby Stations
              </span>
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />}
            </div>

            {loading && stations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
                Finding nearby charging points...
              </div>
            ) : stations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <MapPin className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No stations in this radius</p>
                <p className="text-xs text-slate-500 mt-1">Try expanding the search radius above.</p>
              </div>
            ) : (
              stations.map((station) => (
                <StationCard key={station._id} station={station} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StationMapPage;
