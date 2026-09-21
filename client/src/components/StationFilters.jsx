import React from 'react';
import { Search, Filter, RotateCcw, Zap, DollarSign, MapPin } from 'lucide-react';

const CONNECTOR_OPTIONS = ['All', 'CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Other'];
const SPEED_OPTIONS = ['All', 'Slow', 'Normal', 'Fast', 'Rapid'];

const StationFilters = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults = 0,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search stations by name, address, or locality..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* City Input */}
        <div className="relative w-full md:w-52">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="City (e.g. Vijayawada)"
            value={filters.city || ''}
            onChange={(e) => onFilterChange('city', e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 sm:text-xs rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Reset Filter Button */}
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      {/* Advanced Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
        {/* Connector Type */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Connector
          </label>
          <select
            value={filters.connectorType || 'All'}
            onChange={(e) =>
              onFilterChange(
                'connectorType',
                e.target.value === 'All' ? '' : e.target.value
              )
            }
            className="block w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-slate-800 text-xs"
          >
            {CONNECTOR_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Speed Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Charging Speed
          </label>
          <select
            value={filters.chargingSpeed || 'All'}
            onChange={(e) =>
              onFilterChange(
                'chargingSpeed',
                e.target.value === 'All' ? '' : e.target.value
              )
            }
            className="block w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-slate-800 text-xs"
          >
            {SPEED_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Min Price */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Min Price (₹)
          </label>
          <input
            type="number"
            min="0"
            placeholder="Min ₹"
            value={filters.minPrice || ''}
            onChange={(e) => onFilterChange('minPrice', e.target.value)}
            className="block w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-slate-800 text-xs"
          />
        </div>

        {/* Max Price */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Max Price (₹)
          </label>
          <input
            type="number"
            min="0"
            placeholder="Max ₹"
            value={filters.maxPrice || ''}
            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
            className="block w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 text-slate-800 text-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default StationFilters;
