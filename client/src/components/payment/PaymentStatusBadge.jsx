import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

const statusConfig = {
  paid: {
    label: 'Paid',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-300',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Pending',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-300',
    icon: RefreshCw,
    spin: true,
  },
  failed: {
    label: 'Failed',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-300',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
    icon: AlertCircle,
  },
  refunded: {
    label: 'Refunded',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    icon: RotateCcw,
  },
  partially_refunded: {
    label: 'Partially Refunded',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-300',
    icon: RotateCcw,
  },
  created: {
    label: 'Created',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    icon: Clock,
  },
};

const PaymentStatusBadge = ({ status = 'pending', size = 'md' }) => {
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm font-bold gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold border capitalize ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon
        className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} ${
          config.spin ? 'animate-spin' : ''
        }`}
      />
      <span>{config.label}</span>
    </span>
  );
};

export default PaymentStatusBadge;
