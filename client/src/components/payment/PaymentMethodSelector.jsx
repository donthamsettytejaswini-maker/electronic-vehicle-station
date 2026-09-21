import React from 'react';
import { Smartphone, CreditCard, Banknote, ShieldCheck } from 'lucide-react';

const PaymentMethodSelector = ({ selectedMethod, onSelectMethod, provider = 'mock' }) => {
  const methods = [
    {
      id: 'mock_upi',
      name: 'Demo UPI / QR',
      description: 'Simulate instant UPI intent / Google Pay / PhonePe',
      icon: Smartphone,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'mock_card',
      name: 'Demo Debit / Credit Card',
      description: 'Simulate Visa, Mastercard or RuPay transaction',
      icon: CreditCard,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'mock_cash',
      name: 'Demo Cash / Counter',
      description: 'Simulate on-site station terminal cash receipt',
      icon: Banknote,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Payment Method
        </h3>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
          Demo Sandbox
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {methods.map((m) => {
          const isSelected = selectedMethod === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelectMethod(m.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                )}
              </div>

              <div>
                <p className="font-bold text-slate-800 text-xs">{m.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {m.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethodSelector;
