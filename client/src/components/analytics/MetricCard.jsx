import React from 'react';

const MetricCard = ({
  title,
  value,
  unit = '',
  subtitle = '',
  icon: Icon,
  color = 'emerald', // emerald, blue, indigo, violet, amber, rose
  loading = false,
  badge = null,
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-600',
      border: 'hover:border-emerald-200',
      accent: 'text-emerald-600',
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-600',
      border: 'hover:border-blue-200',
      accent: 'text-blue-600',
    },
    indigo: {
      bg: 'bg-indigo-500/10 text-indigo-600',
      border: 'hover:border-indigo-200',
      accent: 'text-indigo-600',
    },
    violet: {
      bg: 'bg-violet-500/10 text-violet-600',
      border: 'hover:border-violet-200',
      accent: 'text-violet-600',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-600',
      border: 'hover:border-amber-200',
      accent: 'text-amber-600',
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-600',
      border: 'hover:border-rose-200',
      accent: 'text-rose-600',
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 bg-slate-200 rounded w-24"></div>
          <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
        </div>
        <div className="h-7 bg-slate-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md ${scheme.border}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scheme.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-black text-slate-900 tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{subtitle}</span>
        {badge && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
