import React, { useState } from "react";
import { Search, Loader2, KeyRound } from "lucide-react";

const ManualBookingVerification = ({ onVerifyReference, onVerifyToken, isLoading }) => {
  const [tab, setTab] = useState("reference"); // "reference" | "token"
  const [reference, setReference] = useState("");
  const [tokenReference, setTokenReference] = useState("");
  const [rawToken, setRawToken] = useState("");

  const handleRefSubmit = (e) => {
    e.preventDefault();
    if (!reference.trim()) return;
    onVerifyReference(reference.trim());
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    if (!tokenReference.trim() || !rawToken.trim()) return;
    onVerifyToken({
      bookingReference: tokenReference.trim(),
      verificationToken: rawToken.trim(),
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("reference")}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition ${
            tab === "reference"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          By Booking Reference
        </button>
        <button
          type="button"
          onClick={() => setTab("token")}
          className={`pb-2 px-3 text-xs font-semibold border-b-2 transition ${
            tab === "token"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          By QR Verification Payload
        </button>
      </div>

      {tab === "reference" ? (
        <form onSubmit={handleRefSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Booking Reference Code
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. EV-20260919-A1B2C3"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                className="w-full text-sm font-mono border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Check-in using your assigned booking reference ID.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !reference.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Verify Booking</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleTokenSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Booking Reference
            </label>
            <input
              type="text"
              placeholder="e.g. EV-20260919-A1B2C3"
              value={tokenReference}
              onChange={(e) => setTokenReference(e.target.value.toUpperCase())}
              className="w-full text-sm font-mono border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Raw Verification Token (from QR)
            </label>
            <input
              type="text"
              placeholder="Paste raw QR token hex string"
              value={rawToken}
              onChange={(e) => setRawToken(e.target.value)}
              className="w-full text-sm font-mono border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !tokenReference.trim() || !rawToken.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>Verify QR Token</span>
          </button>
        </form>
      )}
    </div>
  );
};

export default ManualBookingVerification;
