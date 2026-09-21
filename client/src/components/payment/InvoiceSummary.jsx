import React from 'react';
import {
  Zap,
  MapPin,
  Car,
  Clock,
  Calendar,
  FileText,
  ShieldCheck,
  Percent,
} from 'lucide-react';

const InvoiceSummary = ({ invoiceData }) => {
  if (!invoiceData) return null;

  const { session, booking, station, charger, vehicle, billing } = invoiceData;
  const symbol = billing?.currencySymbol || '₹';

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Station & Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Billing Summary
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 font-mono">
            {session?.sessionReference}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Booking Ref: {booking?.bookingReference}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400 block font-medium">Total Billable</span>
          <span className="text-3xl font-black text-slate-900">
            {symbol}{Number(billing?.totalAmount).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Equipment & Timing Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">Station</span>
          </div>
          <p className="font-bold text-slate-800 text-sm truncate">{station?.name}</p>
          <p className="text-slate-500 truncate">{station?.city}</p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold">Charger Unit</span>
          </div>
          <p className="font-bold text-slate-800 text-sm">{charger?.name}</p>
          <p className="text-slate-500">{charger?.chargerType} • {charger?.powerRating} kW</p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Car className="w-3.5 h-3.5 text-purple-600" />
            <span className="font-semibold">Vehicle</span>
          </div>
          <p className="font-bold text-slate-800 text-sm">{vehicle?.brand} {vehicle?.model}</p>
          <p className="text-slate-500 font-mono">{vehicle?.licensePlate}</p>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-semibold">Duration</span>
          </div>
          <p className="font-bold text-slate-800 text-sm">{session?.actualDurationMinutes} mins</p>
          <p className="text-slate-500">
            {session?.initialBatteryPercentage}% → {session?.currentBatteryPercentage}%
          </p>
        </div>
      </div>

      {/* Itemized Calculation Breakdown */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Itemized Charges
        </h3>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2.5 text-xs text-slate-700">
          <div className="flex justify-between items-center">
            <span>
              Energy Consumed: <strong>{Number(billing?.energyConsumedKwh).toFixed(2)} kWh</strong> @ {symbol}{billing?.ratePerKwh}/kWh
            </span>
            <span className="font-mono font-semibold text-slate-900">
              {symbol}{Number(billing?.energyCharge).toFixed(2)}
            </span>
          </div>

          {Number(billing?.serviceFee) > 0 && (
            <div className="flex justify-between items-center">
              <span>Platform Service Fee</span>
              <span className="font-mono font-semibold text-slate-900">
                {symbol}{Number(billing?.serviceFee).toFixed(2)}
              </span>
            </div>
          )}

          {Number(billing?.taxRate) > 0 && (
            <div className="flex justify-between items-center">
              <span>GST / Taxes ({billing?.taxRate}%)</span>
              <span className="font-mono font-semibold text-slate-900">
                {symbol}{Number(billing?.taxAmount).toFixed(2)}
              </span>
            </div>
          )}

          {Number(billing?.discountAmount) > 0 && (
            <div className="flex justify-between items-center text-emerald-600">
              <span>Promotional Discount</span>
              <span className="font-mono font-semibold">
                -{symbol}{Number(billing?.discountAmount).toFixed(2)}
              </span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
            <span>Final Payable Amount</span>
            <span className="text-lg font-black text-emerald-600 font-mono">
              {symbol}{Number(billing?.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceSummary;
