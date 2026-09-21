import React from 'react';

const ChartCard = ({
  title,
  subtitle,
  actions = null,
  loading = false,
  empty = false,
  emptyMessage = 'No chart data available for the selected period.',
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Body / Loading / Empty / Content */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center animate-pulse">
          <div className="w-full h-48 bg-slate-100 rounded-xl mb-3"></div>
          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
        </div>
      ) : empty ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
            <span className="text-xl">📊</span>
          </div>
          <p className="text-xs font-semibold text-slate-600 mb-1">{emptyMessage}</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Try broadening your date range or adjusting the station filters.
          </p>
        </div>
      ) : (
        <div className="w-full">{children}</div>
      )}
    </div>
  );
};

export default ChartCard;
