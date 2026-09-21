import React from "react";
import { Activity, Flame, ShieldAlert } from "lucide-react";

const EnergyUsageCard = ({ energyConsumedKwh = 0, vehicle = null, charger = null }) => {
  const batteryCap = vehicle?.batteryCapacity || 40;
  const energyPercentage = Math.min(100, ((energyConsumedKwh / batteryCap) * 100).toFixed(1));

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Energy Delivered
            </h3>
            <p className="text-3xl font-extrabold text-slate-900">
              {Number(energyConsumedKwh).toFixed(2)}{" "}
              <span className="text-base font-normal text-slate-500">kWh</span>
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 font-medium">Vehicle Pack Cap</span>
          <p className="text-sm font-bold text-slate-700">{batteryCap} kWh</p>
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-3">
        <div
          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(2, energyPercentage))}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Approx. delivered to pack: {energyPercentage}%</span>
        <span>Charger: {charger?.chargerType || "Type 2"} ({charger?.powerRating || 30} kW)</span>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
          <span>Billing Status: <strong className="text-slate-600">Pending (Phase 5)</strong></span>
        </div>
        <span>No real payment processed</span>
      </div>
    </div>
  );
};

export default EnergyUsageCard;
