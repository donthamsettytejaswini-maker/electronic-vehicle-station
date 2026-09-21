import React from 'react';
import { BarChart3 } from 'lucide-react';

const AnalyticsEmptyState = ({
  title = 'No analytics records found',
  description = 'There are no transactions or logs recorded matching the selected filter criteria.',
  icon: Icon = BarChart3,
  action = null,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center justify-center my-6">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h4 className="text-sm font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default AnalyticsEmptyState;
