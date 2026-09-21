import React from 'react';

const RevenueCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'emerald',
  prefix = '',
  suffix = '',
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    slate: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200',
    },
  };

  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-base font-bold text-slate-500">{prefix}</span>}
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {suffix && <span className="text-xs font-semibold text-slate-500">{suffix}</span>}
        </div>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>

      {Icon && (
        <div className={`w-12 h-12 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default RevenueCard;
