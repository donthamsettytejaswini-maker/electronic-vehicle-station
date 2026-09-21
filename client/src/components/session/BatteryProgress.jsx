import React from "react";
import { BatteryCharging, Battery, Zap } from "lucide-react";

const BatteryProgress = ({
  initialBattery = 20,
  currentBattery = 50,
  targetBattery = 80,
  isCharging = true,
  status = "charging",
}) => {
  const current = Math.min(100, Math.max(0, currentBattery || 0));
  const target = Math.min(100, Math.max(0, targetBattery || 80));
  const initial = Math.min(100, Math.max(0, initialBattery || 0));

  // Determine bar fill color based on battery level
  const getBarColor = () => {
    if (status === "paused") return "bg-amber-500";
    if (status === "stopped" || status === "failed") return "bg-rose-500";
    if (current >= target) return "bg-emerald-500";
    if (current < 20) return "bg-rose-500";
    if (current < 50) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            {isCharging && status === "charging" ? (
              <BatteryCharging className="w-8 h-8 animate-bounce text-emerald-600" />
            ) : (
              <Battery className="w-8 h-8 text-slate-700" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Battery Level
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                {current}%
              </span>
              <span className="text-sm text-slate-500">of {target}% target</span>
            </div>
          </div>
        </div>

        {status === "charging" && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold animate-pulse">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Charging Active</span>
          </div>
        )}
      </div>

      {/* Main visual battery container */}
      <div className="relative pt-2 pb-6">
        {/* Track */}
        <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner relative border border-slate-200">
          {/* Fill */}
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor()}`}
            style={{ width: `${current}%` }}
          />
        </div>

        {/* Markers */}
        <div className="relative w-full mt-2 h-6 text-xs text-slate-500 font-medium">
          {/* Initial level marker */}
          <div
            className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${initial}%` }}
          >
            <div className="w-0.5 h-3 bg-slate-400 mb-0.5" />
            <span className="text-[10px] text-slate-600 whitespace-nowrap">Start: {initial}%</span>
          </div>

          {/* Target marker */}
          <div
            className="absolute -top-1 transform -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${target}%` }}
          >
            <div className="w-0.5 h-3 bg-indigo-600 mb-0.5" />
            <span className="text-[10px] text-indigo-700 font-bold whitespace-nowrap">Target: {target}%</span>
          </div>
        </div>
      </div>

      {/* Accessible text description */}
      <div className="text-xs text-slate-500 text-center bg-slate-50 rounded-lg p-2 border border-slate-100" aria-live="polite">
        Battery is currently at {current} percent. Target is {target} percent. Started from {initial} percent.
      </div>
    </div>
  );
};

export default BatteryProgress;
