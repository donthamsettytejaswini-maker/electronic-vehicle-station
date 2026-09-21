import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw, AlertTriangle } from "lucide-react";

const QrScanner = ({ onScanSuccess, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const scannerRef = useRef(null);
  const containerId = "html5-qrcode-reader";

  const startScanner = async () => {
    setScannerError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }

      const qrCodeSuccessCallback = (decodedText) => {
        try {
          // Parse JSON if available
          let parsed;
          try {
            parsed = JSON.parse(decodedText);
          } catch {
            parsed = decodedText;
          }
          stopScanner();
          onScanSuccess(parsed);
        } catch (err) {
          console.error("Scan parse error:", err);
        }
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {
          // Ignore frequent frame-read errors
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.warn("Scanner initiation error:", err);
      setScannerError(
        "Camera permission denied or camera not available. Please allow camera access or use manual verification below."
      );
      setIsScanning(false);
      if (onError) onError(err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch((e) => console.warn("Cleanup stop error:", e));
        }
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center">
      <div className="w-full max-w-sm">
        {/* Scanner container for html5-qrcode */}
        <div
          id={containerId}
          className={`w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden relative flex items-center justify-center ${
            !isScanning ? "border-2 border-dashed border-slate-300 bg-slate-50" : ""
          }`}
        >
          {!isScanning && (
            <div className="text-center p-6 space-y-3">
              <Camera className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Camera Check-In Scanner</p>
              <p className="text-xs text-slate-400">
                Click below to activate device camera and scan station QR code.
              </p>
              <button
                type="button"
                onClick={startScanner}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition"
              >
                Start Camera
              </button>
            </div>
          )}
        </div>

        {/* Scanning active indicator */}
        {isScanning && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full animate-pulse">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Scanning for EVCharge QR code...</span>
            </div>
            <button
              type="button"
              onClick={stopScanner}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Stop Camera
            </button>
          </div>
        )}

        {/* Scanner error banner */}
        {scannerError && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>{scannerError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrScanner;
