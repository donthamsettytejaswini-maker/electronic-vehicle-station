import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  Lock,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const StationCard = ({ station }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Station Image or Banner */}
        <Link to={`/stations/${station._id}`} className="block relative h-44 bg-slate-100 overflow-hidden cursor-pointer">
          {station.image ? (
            <img
              src={station.image}
              alt={station.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-navy-900 flex items-center justify-center text-emerald-400">
              <Zap className="w-12 h-12 stroke-1" />
            </div>
          )}

          <div className="absolute top-3 left-3">
            <StatusBadge status={station.status} />
          </div>

          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1 rounded-xl text-xs font-bold text-slate-900 shadow-md">
            ₹{station.pricePerKwh} <span className="text-[10px] font-normal text-slate-500">/ kWh</span>
          </div>
        </Link>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          <div>
            <Link to={`/stations/${station._id}`}>
              <h3 className="text-base font-bold text-navy-950 group-hover:text-emerald-600 transition-colors">
                {station.name}
              </h3>
            </Link>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{station.address}, {station.city}</span>
            </p>
          </div>

          {/* Operating hours & Charger Availability Counters */}
          <div className="flex items-center justify-between py-2 border-y border-slate-100 text-xs">
            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{station.operatingHours}</span>
            </div>

            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <span className="text-emerald-600">{station.availableChargers ?? 0} Avail</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">{station.totalChargers ?? 0} Total</span>
            </div>
          </div>

          {/* Facilities pills */}
          {station.facilities && station.facilities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {station.facilities.slice(0, 4).map((facility, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 rounded-md"
                >
                  {facility}
                </span>
              ))}
              {station.facilities.length > 4 && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                  +{station.facilities.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-5 pt-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/stations/${station._id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Active Slot Reservation Button */}
          <Link
            to={`/book-slot?stationId=${station._id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Slot</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StationCard;
