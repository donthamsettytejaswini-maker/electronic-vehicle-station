import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Download, RefreshCw, AlertCircle } from "lucide-react";

const QrCodeDisplay = ({
  qrPayload = null,
  bookingReference = "",
  qrGeneratedAt = null,
  isRegenerating = false,
  onRegenerate = null,
  canRegenerate = true,
}) => {
  if (!qrPayload) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="font-semibold text-slate-700">No QR Code Generated Yet</p>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Generate a secure check-in QR code for your confirmed booking.
        </p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {isRegenerating ? "Generating..." : "Generate QR Code"}
          </button>
        )}
      </div>
    );
  }

  const payloadString = typeof qrPayload === "string" ? qrPayload : JSON.stringify(qrPayload);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-xs font-semibold mb-4">
        <ShieldCheck className="w-4 h-4" />
        <span>Cryptographically Verified QR</span>
      </div>

      <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md mb-4 relative group">
        <QRCodeSVG
          value={payloadString}
          size={200}
          level="H"
          includeMargin={true}
          className="rounded-lg"
        />
      </div>

      <div className="w-full space-y-1 mb-4">
        <span className="text-xs text-slate-400 font-mono">Reference</span>
        <p className="text-base font-extrabold text-slate-900 font-mono tracking-wider">
          {bookingReference}
        </p>
        {qrGeneratedAt && (
          <p className="text-[11px] text-slate-400">
            Generated: {new Date(qrGeneratedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100 max-w-sm mb-4">
        🔒 Only scan or share this QR code through the official EVCharge system for on-site check-in.
      </div>

      {canRegenerate && onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-600 font-semibold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin text-emerald-600" : ""}`} />
          <span>Regenerate QR Token</span>
        </button>
      )}
    </div>
  );
};

export default QrCodeDisplay;
