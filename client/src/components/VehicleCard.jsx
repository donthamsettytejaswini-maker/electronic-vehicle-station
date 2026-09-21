import React from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Zap,
  BatteryCharging,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
} from 'lucide-react';

const VehicleCard = ({ vehicle, onSetDefault, onDelete, isSettingDefault }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between relative group">
      <div>
        {/* Top bar: Brand & Default Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {vehicle.brand} {vehicle.model}
              </h3>
              <p className="text-xs font-mono font-bold text-slate-600 tracking-wider">
                {vehicle.vehicleNumber}
              </p>
            </div>
          </div>

          {vehicle.isDefault && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 rounded-full border border-emerald-300">
              <Star className="w-3 h-3 fill-emerald-600 stroke-none" />
              Default
            </span>
          )}
        </div>

        {/* Vehicle Specs Grid */}
        <div className="grid grid-cols-2 gap-2 my-4 py-3 border-y border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Battery</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
              {vehicle.batteryCapacity} kWh
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Connector</span>
            <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              {vehicle.connectorType}
            </span>
          </div>

          {vehicle.maxChargingPower && (
            <div>
              <span className="text-slate-400 block text-[11px]">Max Power</span>
              <span className="font-semibold text-slate-700">
                {vehicle.maxChargingPower} kW
              </span>
            </div>
          )}

          {vehicle.manufacturingYear && (
            <div>
              <span className="text-slate-400 block text-[11px]">Year</span>
              <span className="font-semibold text-slate-700">
                {vehicle.manufacturingYear}
              </span>
            </div>
          )}

          {vehicle.color && (
            <div className="col-span-2 flex items-center gap-1.5 text-slate-500 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-slate-200"></span>
              Color: <span className="font-medium text-slate-700">{vehicle.color}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2">
        {!vehicle.isDefault ? (
          <button
            type="button"
            onClick={() => onSetDefault(vehicle._id)}
            disabled={isSettingDefault}
            className="text-xs font-semibold text-slate-600 hover:text-emerald-600 transition flex items-center gap-1 disabled:opacity-50"
          >
            <Star className="w-3.5 h-3.5" />
            Set as Default
          </button>
        ) : (
          <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Primary EV
          </span>
        )}

        <div className="flex items-center gap-1">
          <Link
            to={`/vehicles/${vehicle._id}/edit`}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Edit vehicle"
            aria-label="Edit vehicle"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(vehicle)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
            title="Delete vehicle"
            aria-label="Delete vehicle"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
