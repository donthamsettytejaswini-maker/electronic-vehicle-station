import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Zap, Navigation, Star, MapPin, ExternalLink } from 'lucide-react';

// Fix for default Leaflet icon paths in Vite / React
delete L.Icon.Default.prototype._getIconUrl;

const customStationIcon = (status = 'active') =>
  L.divIcon({
    className: 'custom-station-pin',
    html: `
      <div style="
        background: ${status === 'active' ? '#10b981' : '#f59e0b'};
        color: white;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <svg style="width: 18px; height: 18px; fill: white;" viewBox="0 0 24 24">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

const userLocationIcon = L.divIcon({
  className: 'custom-user-pin',
  html: `
    <div style="
      background: #3b82f6;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 12px #3b82f6;
      animation: pulse 2s infinite;
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Helper component to center map on user or stations
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

export const StationMap = ({ stations = [], userLocation, onStationSelect }) => {
  // Default coordinates fallback: Bangalore (12.9716, 77.5946)
  const defaultCenter = [12.9716, 77.5946];
  const center = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : stations.length > 0 && stations[0].location?.coordinates
    ? [stations[0].location.coordinates.latitude, stations[0].location.coordinates.longitude]
    : defaultCenter;

  return (
    <div className="w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 relative z-0">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[500px]"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRecenter center={center} />

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="p-1 font-sans text-xs">
                <p className="font-bold text-blue-600 flex items-center space-x-1">
                  <Navigation className="w-3.5 h-3.5 inline mr-1" />
                  <span>Your Current Location</span>
                </p>
                <p className="text-slate-500 mt-0.5">Searching nearby chargers within range</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Station Markers */}
        {stations.map((st) => {
          const lat = st.location?.coordinates?.latitude;
          const lng = st.location?.coordinates?.longitude;
          if (!lat || !lng) return null;

          return (
            <Marker
              key={st._id}
              position={[lat, lng]}
              icon={customStationIcon(st.status)}
            >
              <Popup>
                <div className="p-1 min-w-[200px] font-sans">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {st.status || 'Active'}
                    </span>
                    {st.distanceKm !== undefined && (
                      <span className="text-xs font-bold text-blue-600">
                        {st.distanceKm.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                    {st.location?.address || st.location?.city}
                  </p>

                  <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100 my-1">
                    <span className="text-slate-600">Available:</span>
                    <span className="font-bold text-emerald-600">
                      {st.availableChargers ?? (st.chargers?.length || 0)} chargers
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-slate-600">Base Price:</span>
                    <span className="font-bold text-slate-900">
                      ₹{st.pricing?.pricePerKwh ?? 15}/kWh
                    </span>
                  </div>

                  {st.averageRating > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-amber-500 my-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-800">{st.averageRating.toFixed(1)}</span>
                      <span className="text-slate-400">({st.totalReviews || 0})</span>
                    </div>
                  )}

                  <Link
                    to={`/stations/${st._id}`}
                    className="mt-2 w-full flex items-center justify-center space-x-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition text-center"
                  >
                    <span>View & Book Slot</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default StationMap;
