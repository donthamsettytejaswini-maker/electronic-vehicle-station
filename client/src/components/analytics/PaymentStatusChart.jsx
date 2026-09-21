import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const METHOD_COLORS = {
  mock_upi: '#10b981',
  upi: '#10b981',
  mock_card: '#0284c7',
  card: '#0284c7',
  mock_cash: '#f59e0b',
  cash: '#f59e0b',
  netbanking: '#8b5cf6',
  wallet: '#ec4899',
};

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-slate-900/95 backdrop-blur text-white px-3 py-2 rounded-xl shadow-xl text-xs border border-slate-700">
        <div className="font-semibold text-slate-300 capitalize mb-1">{item.name}</div>
        <div>
          Volume:{' '}
          <span className="font-bold text-white">{formatINR(item.value)}</span>
        </div>
        <div className="text-[10px] text-slate-400">
          Transactions: {item.payload.count}
        </div>
      </div>
    );
  }
  return null;
};

const PaymentStatusChart = ({ data = [], height = 260 }) => {
  const chartData = data.map((item) => ({
    name: item.method ? item.method.replace('mock_', 'Demo ').toUpperCase() : 'OTHER',
    value: item.totalAmount || 0,
    count: item.count || 0,
    rawKey: item.method,
  }));

  if (!chartData.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs">
        No payment method breakdown available.
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
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={METHOD_COLORS[entry.rawKey] || '#64748b'}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentStatusChart;
