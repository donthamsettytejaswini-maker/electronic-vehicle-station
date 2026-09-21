import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, MapPin, Zap } from 'lucide-react';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);

const StationPerformanceTable = ({
  stations = [],
  loading = false,
  onStationClick = null,
}) => {
  const [sortField, setSortField] = useState('grossRevenue');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedStations = [...stations].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-emerald-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-emerald-600 ml-1 inline" />
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!stations.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
        No station performance data recorded for this period.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th
                onClick={() => handleSort('stationName')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition"
              >
                Station {renderSortIcon('stationName')}
              </th>
              <th className="py-3 px-3">Chargers</th>
              <th
                onClick={() => handleSort('totalBookings')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 transition text-right"
              >
                Bookings {renderSortIcon('totalBookings')}
              </th>
              <th
                onClick={() => handleSort('completedSessions')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 transition text-right"
              >
                Sessions {renderSortIcon('completedSessions')}
              </th>
              <th
                onClick={() => handleSort('energyConsumedKwh')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 transition text-right"
              >
                Energy (kWh) {renderSortIcon('energyConsumedKwh')}
              </th>
              <th
                onClick={() => handleSort('grossRevenue')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 transition text-right"
              >
                Gross Revenue {renderSortIcon('grossRevenue')}
              </th>
              <th
                onClick={() => handleSort('netRevenue')}
                className="py-3 px-4 cursor-pointer hover:text-slate-800 transition text-right"
              >
                Net Revenue {renderSortIcon('netRevenue')}
              </th>
              <th
                onClick={() => handleSort('cancellationRate')}
                className="py-3 px-3 cursor-pointer hover:text-slate-800 transition text-center"
              >
                Cancel Rate {renderSortIcon('cancellationRate')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {sortedStations.map((st) => (
              <tr
                key={st.stationId}
                onClick={() => onStationClick && onStationClick(st.stationId)}
                className={`hover:bg-slate-50/80 transition ${
                  onStationClick ? 'cursor-pointer' : ''
                }`}
              >
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{st.stationName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-normal">
                        <MapPin className="w-2.5 h-2.5" />
                        {st.city} • ₹{st.pricePerKwh}/kWh
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <span className="font-bold text-slate-800">
                    {st.availableChargers}/{st.totalChargers}
                  </span>{' '}
                  <span className="text-[10px] text-slate-400">avail</span>
                </td>
                <td className="py-3.5 px-3 text-right font-semibold">
                  {st.totalBookings}
                </td>
                <td className="py-3.5 px-3 text-right font-semibold text-emerald-700">
                  {st.completedSessions}
                </td>
                <td className="py-3.5 px-3 text-right font-semibold">
                  {st.energyConsumedKwh.toFixed(1)}
                </td>
                <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                  {formatINR(st.grossRevenue)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                  {formatINR(st.netRevenue)}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      st.cancellationRate > 20
                        ? 'bg-rose-50 text-rose-700'
                        : st.cancellationRate > 10
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {st.cancellationRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StationPerformanceTable;
