import React from "react";
import { Info } from "lucide-react";

const SimulationNotice = ({ className = "" }) => {
  return (
    <div
      className={`bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs flex items-start gap-2 ${className}`}
      role="note"
      aria-label="Simulation Notice"
    >
      <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold">Simulated Environment:</span> Charging rates, battery percentage, power flow, and energy consumption are generated via software simulation for demonstration purposes. No physical hardware connection or real billing occurs.
      </div>
    </div>
  );
};

export default SimulationNotice;
