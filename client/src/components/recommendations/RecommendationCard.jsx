import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Navigation, Star, Sparkles, CheckCircle2, ChevronRight, Clock } from 'lucide-react';

export const RecommendationCard = ({ recommendation }) => {
  const { station, score, reasons = [], distanceKm, estimatedWaitMins, availableChargers } = recommendation;
  if (!station) return null;

  return (
    <div className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all flex flex-col justify-between">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300/40 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Match Score: {score}%
            </span>
          </div>

          {distanceKm !== undefined && (
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
              <Navigation className="w-3 h-3" />
              <span>{distanceKm.toFixed(1)} km</span>
            </span>
          )}
        </div>

        {/* Station Title */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
          {station.name}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
          {station.location?.address || station.location?.city}
        </p>

        {/* Highlighted Reasons List */}
        <div className="mt-3.5 space-y-1.5 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          {reasons.slice(0, 3).map((r, i) => (
            <div key={i} className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Available</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {availableChargers ?? (station.chargers?.length || 0)} Units
            </span>
          </div>

          <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Est. Waiting</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{estimatedWaitMins || 0} mins</span>
            </span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <Link
        to={`/stations/${station._id}`}
        className="mt-4 w-full flex items-center justify-center space-x-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
      >
        <span>Select & Reserve Slot</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default RecommendationCard;
