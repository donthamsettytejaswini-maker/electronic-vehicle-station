import React from "react";
import { Zap, PauseCircle, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

const statusConfig = {
  initiated: {
    label: "Initiated",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-200",
    icon: Clock,
  },
  charging: {
    label: "Charging",
    bgColor: "bg-emerald-100",
    textColor: "text-emerald-800",
    borderColor: "border-emerald-300",
    icon: Zap,
    pulse: true,
  },
  paused: {
    label: "Paused",
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
    borderColor: "border-amber-300",
    icon: PauseCircle,
  },
  completed: {
    label: "Completed",
    bgColor: "bg-slate-100",
    textColor: "text-slate-800",
    borderColor: "border-slate-300",
    icon: CheckCircle2,
  },
  stopped: {
    label: "Stopped",
    bgColor: "bg-rose-100",
    textColor: "text-rose-800",
    borderColor: "border-rose-300",
    icon: XCircle,
  },
  failed: {
    label: "Failed",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-300",
    icon: AlertCircle,
  },
};

const SessionStatusBadge = ({ status = "initiated", size = "md" }) => {
  const config = statusConfig[status?.toLowerCase()] || statusConfig.initiated;
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-base font-semibold gap-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon className={`${size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} ${config.pulse ? "animate-pulse text-emerald-600" : ""}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default SessionStatusBadge;
