import React from 'react';
import {
  Zap,
  Printer,
  Download,
  CheckCircle2,
  MapPin,
  Car,
  Clock,
  Calendar,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import PaymentStatusBadge from './PaymentStatusBadge';

const ReceiptCard = ({ receipt, onPrint }) => {
  if (!receipt) return null;

  const {
    invoiceNumber,
    paymentReference,
    paidAt,
    status,
    paymentMethod,
    provider,
    providerPaymentId,
    customer,
    station,
    charger,
    vehicle,
    session,
    booking,
    lineItems,
    refund,
  } = receipt;

  const symbol = lineItems?.currencySymbol || '₹';

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Actions Bar (Hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <span className="text-xs font-semibold text-slate-500">Official Digital Tax Receipt</span>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Main Printable Card */}
      <div
        id="printable-receipt"
        className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg text-slate-800 space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                EV<span className="text-emerald-600">Charge</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Smart EV Charging Station Network & Billing</p>
          </div>

          <div className="text-right space-y-1">
            <div className="flex items-center justify-end gap-2">
              <PaymentStatusBadge status={status} size="md" />
            </div>
            <p className="text-sm font-black font-mono text-slate-900">{invoiceNumber}</p>
            <p className="text-xs text-slate-400 font-mono">Ref: {paymentReference}</p>
            <p className="text-xs text-slate-500">
              Date: {paidAt ? new Date(paidAt).toLocaleString() : '—'}
            </p>
          </div>
        </div>

        {/* Customer & Station Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Billed To
            </span>
            <p className="text-sm font-bold text-slate-900">{customer?.name}</p>
            <p className="text-slate-500">{customer?.email}</p>
            <p className="text-slate-500">{customer?.phone || 'EV Driver Account'}</p>
            <p className="text-slate-700 font-mono mt-1">
              Vehicle: {vehicle?.brand} {vehicle?.model} ({vehicle?.licensePlate})
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Charging Location
            </span>
            <p className="text-sm font-bold text-slate-900">{station?.name}</p>
            <p className="text-slate-500">{station?.address}, {station?.city}</p>
            <p className="text-slate-500">
              Charger: {charger?.name} ({charger?.type} • {charger?.powerRating} kW)
            </p>
            <p className="text-slate-400 font-mono mt-1">
              Txn ID: {providerPaymentId || 'MOCK-SETTLEMENT'}
            </p>
          </div>
        </div>

        {/* Session Milestones Summary */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block">Session Ref</span>
            <span className="font-mono font-bold text-slate-800">{session?.sessionReference}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Booking Ref</span>
            <span className="font-mono font-bold text-slate-800">{booking?.bookingReference}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Duration</span>
            <span className="font-bold text-slate-800">{session?.actualDurationMinutes} mins</span>
          </div>
          <div>
            <span className="text-slate-400 block">Payment Method</span>
            <span className="font-bold text-slate-800 capitalize">
              {paymentMethod?.replace('mock_', 'Demo ').replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-3">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-400 uppercase font-bold">
              <tr>
                <th className="py-2.5">Description</th>
                <th className="py-2.5 text-center">Quantity</th>
                <th className="py-2.5 text-right">Unit Rate</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-3">
                  <div className="font-bold text-slate-800">Electric Vehicle Charging Energy</div>
                  <div className="text-[11px] text-slate-400">
                    Delivered via {charger?.name} ({charger?.powerRating} kW)
                  </div>
                </td>
                <td className="py-3 text-center font-mono">{Number(lineItems?.energyConsumedKwh).toFixed(2)} kWh</td>
                <td className="py-3 text-right font-mono">{symbol}{lineItems?.ratePerKwh}/kWh</td>
                <td className="py-3 text-right font-mono font-bold text-slate-900">
                  {symbol}{Number(lineItems?.energyCharge).toFixed(2)}
                </td>
              </tr>
              {Number(lineItems?.serviceFee) > 0 && (
                <tr>
                  <td className="py-3">Platform Service Fee</td>
                  <td className="py-3 text-center font-mono">1</td>
                  <td className="py-3 text-right font-mono">{symbol}{lineItems?.serviceFee}</td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900">
                    {symbol}{Number(lineItems?.serviceFee).toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Subtotals & Final Amount */}
          <div className="pt-4 border-t border-slate-200 flex flex-col items-end space-y-2 text-xs">
            <div className="flex justify-between w-64 text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{symbol}{Number(lineItems?.subtotal).toFixed(2)}</span>
            </div>
            {Number(lineItems?.taxRate) > 0 && (
              <div className="flex justify-between w-64 text-slate-600">
                <span>Tax ({lineItems?.taxRate}%):</span>
                <span className="font-mono font-semibold">{symbol}{Number(lineItems?.taxAmount).toFixed(2)}</span>
              </div>
            )}
            {Number(lineItems?.discountAmount) > 0 && (
              <div className="flex justify-between w-64 text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono font-semibold">-{symbol}{Number(lineItems?.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
              <span>Total Paid:</span>
              <span className="font-mono text-base text-emerald-600">
                {symbol}{Number(lineItems?.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Refund Notice if Refunded */}
        {refund && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span>
                <strong>Refund Processed:</strong> {symbol}{Number(refund.refundAmount).toFixed(2)} refunded on{' '}
                {new Date(refund.refundedAt).toLocaleDateString()} ({refund.refundReason})
              </span>
            </div>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Thank you for driving electric with EVCharge Network.</span>
          <span>Payment Gateway: {provider.toUpperCase()} (Sandbox)</span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptCard;
