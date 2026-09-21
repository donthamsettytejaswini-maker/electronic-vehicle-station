import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[150px]">
        <p className="font-bold text-slate-300 mb-1.5">{label}</p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 my-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-300">{item.name}:</span>
            </span>
            <span className="font-bold">{formatINR(item.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ data = [], height = 300, showBreakdown = true }) => {
  const [chartType, setChartType] = useState('area'); // 'area' | 'bar'

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
        No revenue data recorded for this timeline.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end gap-1 mb-2">
        <button
          type="button"
          onClick={() => setChartType('area')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
            chartType === 'area'
              ? 'bg-emerald-100 text-emerald-800'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Area
        </button>
        <button
          type="button"
          onClick={() => setChartType('bar')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
            chartType === 'bar'
              ? 'bg-emerald-100 text-emerald-800'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          Bar
        </button>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          {chartType === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              />
              <Area
                type="monotone"
                dataKey="grossRevenue"
                name="Gross Revenue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#grossGrad)"
              />
              <Area
                type="monotone"
                dataKey="netRevenue"
                name="Net Revenue"
                stroke="#0284c7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#netGrad)"
              />
              {showBreakdown && (
                <Area
                  type="monotone"
                  dataKey="refunds"
                  name="Refunds"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  fillOpacity={0.1}
                  fill="#f43f5e"
                />
              )}
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              />
              <Bar dataKey="grossRevenue" name="Gross Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netRevenue" name="Net Revenue" fill="#0284c7" radius={[4, 4, 0, 0]} />
              {showBreakdown && (
                <Bar dataKey="refunds" name="Refunds" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
