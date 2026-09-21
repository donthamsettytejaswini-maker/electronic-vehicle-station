import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const STATUS_COLORS = {
  Available: '#10b981', // emerald
  available: '#10b981',
  Charging: '#0284c7', // sky/blue
  charging: '#0284c7',
  Reserved: '#f59e0b', // amber
  reserved: '#f59e0b',
  Maintenance: '#f43f5e', // rose
  maintenance: '#f43f5e',
  Offline: '#94a3b8', // slate
  offline: '#94a3b8',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-slate-900/95 backdrop-blur text-white px-3 py-2 rounded-xl shadow-xl text-xs border border-slate-700">
        <span className="font-semibold text-slate-300 capitalize">{item.name}:</span>{' '}
        <span className="font-bold text-white">{item.value} Ports</span>
      </div>
    );
  }
  return null;
};

const ChargerStatusChart = ({ statusMap = {}, height = 260 }) => {
  const chartData = Object.entries(statusMap)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      rawKey: status,
    }));

  if (!chartData.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
        No charger status data available.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.rawKey] || '#64748b'}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChargerStatusChart;
