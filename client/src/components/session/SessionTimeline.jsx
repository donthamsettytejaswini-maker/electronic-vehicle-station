import React from "react";
import { CheckCircle2, Clock, Play, PauseCircle, Flag } from "lucide-react";

const SessionTimeline = ({ session, booking }) => {
  const steps = [
    {
      title: "Booking Confirmed",
      time: booking?.createdAt ? new Date(booking.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      status: "completed",
      icon: CheckCircle2,
    },
    {
      title: "QR Verified & Checked In",
      time: booking?.checkedInAt ? new Date(booking.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      status: booking?.checkedInAt ? "completed" : "pending",
      icon: Clock,
    },
    {
      title: "Charging Initiated",
      time: session?.startedAt ? new Date(session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      status: session?.startedAt ? "completed" : "pending",
      icon: Play,
    },
    {
      title: session?.status === "paused" ? "Session Paused" : "Charging In-Progress",
      time: session?.pausedAt ? new Date(session.pausedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      status: session?.status === "charging" || session?.status === "paused" || session?.status === "completed" ? "completed" : "pending",
      icon: PauseCircle,
    },
    {
      title: "Session Completed",
      time: session?.completedAt ? new Date(session.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      status: session?.status === "completed" || session?.status === "stopped" ? "completed" : "pending",
      icon: Flag,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Session Milestones
      </h3>
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isDone = step.status === "completed";
          const Icon = step.icon;
          return (
            <div key={idx} className="flex items-start gap-3">
              <div
                className={`p-1.5 rounded-full mt-0.5 ${
                  isDone ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 flex items-baseline justify-between">
                <span className={`text-sm font-medium ${isDone ? "text-slate-800" : "text-slate-400"}`}>
                  {step.title}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {step.time || "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionTimeline;
