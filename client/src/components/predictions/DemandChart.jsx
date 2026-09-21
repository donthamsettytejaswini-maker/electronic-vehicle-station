import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Clock, Info, ShieldAlert, Sparkles } from 'lucide-react';
import predictionService from '../../services/predictionService';

export const DemandChart = ({ stationId }) => {
  const [demandData, setDemandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDemand = async () => {
      try {
        setLoading(true);
        const res = await predictionService.getStationDemand(stationId);
        if (res.success) {
          setDemandData(res.data);
        }
      } catch (err) {
        setError('Demand prediction currently unavailable.');
      } finally {
        setLoading(false);
      }
    };

    if (stationId) {
      fetchDemand();
    }
  }, [stationId]);

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse text-center text-slate-400 text-xs">
        Analyzing historical charging demand patterns...
      </div>
    );
  }

  if (error || !demandData) return null;

  const currentHour = demandData.currentHour ?? new Date().getHours();
  const currentSlot = demandData.hourlyForecast?.find(h => h.hour === currentHour) || demandData.hourlyForecast?.[0];

  const getBarColor = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-500 hover:bg-red-600';
      case 'medium':
        return 'bg-amber-400 hover:bg-amber-500';
      default:
        return 'bg-emerald-500 hover:bg-emerald-600';
    }
  };

  const getDemandBadge = (level) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>Station Demand Forecast</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                AI Estimate
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expected station traffic throughout the day
            </p>
          </div>
        </div>

        {/* Current status pill */}
        {currentSlot && (
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 ${getDemandBadge(currentSlot.predictedDemand)}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>Now ({currentHour}:00): {currentSlot.predictedDemand.toUpperCase()} DEMAND</span>
          </div>
        )}
      </div>

      {/* 24-Hour Bar Chart Visualization */}
      <div className="pt-4 pb-2">
        <div className="flex items-end justify-between h-28 gap-1 border-b border-slate-200 dark:border-slate-700 pb-2">
          {demandData.hourlyForecast?.map((slot) => {
            const isCurrent = slot.hour === currentHour;
            const heightPercent = slot.predictedDemand === 'high' ? '85%' : slot.predictedDemand === 'medium' ? '50%' : '25%';

            return (
              <div
                key={slot.hour}
                className="flex-1 flex flex-col items-center group relative h-full justify-end"
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                  <div className="bg-slate-900 text-white text-[10px] rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
                    {slot.hour}:00 - {slot.predictedDemand.toUpperCase()} ({slot.predictedBookings} bookings)
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-1"></div>
                </div>

                <div
                  style={{ height: heightPercent }}
                  className={`w-full max-w-[14px] rounded-t transition-all duration-300 ${getBarColor(slot.predictedDemand)} ${
                    isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 'opacity-80 group-hover:opacity-100'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Hour markers */}
        <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>11 PM</span>
        </div>
      </div>

      {/* Recommendation alert */}
      {demandData.recommendation && (
        <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl flex items-start space-x-3 text-xs text-indigo-900 dark:text-indigo-200">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">AI Scheduling Recommendation:</span>
            <p className="text-slate-600 dark:text-slate-300">{demandData.recommendation}</p>
          </div>
        </div>
      )}

      {/* Notice */}
      <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 pt-1">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Demand estimates are calculated based on historical utilization and do not guarantee instant stall availability.</span>
      </div>
    </div>
  );
};

export default DemandChart;
