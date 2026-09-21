import React from 'react';
import { Zap, Gauge, DollarSign, Edit2, Trash2, Power } from 'lucide-react';
import StatusBadge from './StatusBadge';

const ChargerCard = ({
  charger,
  stationPrice,
  isAdmin = false,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const displayPrice = charger.pricePerKwh ?? stationPrice;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:border-slate-300 transition">
      <div>
        {/* Header: Charger Number & Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shadow-inner">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm tracking-tight font-mono">
                {charger.chargerNumber}
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {charger.chargingSpeed} • {charger.powerRating} kW
              </span>
            </div>
          </div>

          <StatusBadge status={charger.status} size="xs" />
        </div>

        {/* Specs breakdown */}
        <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Connector Port:</span>
            <span className="font-semibold text-slate-800 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md text-[11px]">
              {charger.connectorType}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Rate:</span>
            <span className="font-semibold text-slate-800">
              ₹{displayPrice} <span className="text-[10px] text-slate-400">/ kWh</span>
            </span>
          </div>

          {charger.description && (
            <p className="text-[11px] text-slate-500 italic pt-1 truncate">
              {charger.description}
            </p>
          )}
        </div>
      </div>

      {/* Admin Action Controls */}
      {isAdmin && (
        <div className="pt-3 flex items-center justify-between gap-2">
          {/* Quick status dropdown for Admin */}
          <select
            value={charger.status}
            onChange={(e) => onStatusChange && onStatusChange(charger._id, e.target.value)}
            className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="charging">Charging</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEdit && onEdit(charger)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Edit charger specs"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete && onDelete(charger)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
              title="Delete charger"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargerCard;
