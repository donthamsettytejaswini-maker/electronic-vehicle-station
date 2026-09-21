import React from "react";
import { Zap, Clock, Hourglass, Gauge } from "lucide-react";

const ChargingProgressCard = ({
  chargingPowerKw = 30,
  estimatedRemainingMinutes = 0,
  elapsedMinutes = 0,
  estimatedCompletionTime = null,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Charging Power */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
          <Gauge className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Charging Speed
          </span>
          <p className="text-2xl font-bold text-slate-800">
            {chargingPowerKw} <span className="text-sm font-normal text-slate-500">kW</span>
          </p>
        </div>
      </div>

      {/* Elapsed Time */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Elapsed Time
          </span>
          <p className="text-2xl font-bold text-slate-800">
            {elapsedMinutes} <span className="text-sm font-normal text-slate-500">mins</span>
          </p>
        </div>
      </div>

      {/* Remaining Time */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
          <Hourglass className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Est. Remaining
          </span>
          <p className="text-2xl font-bold text-slate-800">
            {estimatedRemainingMinutes}{" "}
            <span className="text-sm font-normal text-slate-500">mins</span>
          </p>
        </div>
      </div>

      {/* Est Completion Time */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Est. Finish Time
          </span>
          <p className="text-lg font-bold text-slate-800 truncate">
            {estimatedCompletionTime
              ? new Date(estimatedCompletionTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Calculating..."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChargingProgressCard;
