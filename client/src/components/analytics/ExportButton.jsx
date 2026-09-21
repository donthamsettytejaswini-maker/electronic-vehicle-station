import React, { useState } from 'react';
import { Download, RefreshCw, FileSpreadsheet } from 'lucide-react';

const ExportButton = ({
  onExport,
  label = 'Export CSV',
  loading = false,
  className = '',
  disabled = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async () => {
    if (loading || internalLoading || disabled) return;
    try {
      setInternalLoading(true);
      await onExport();
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setInternalLoading(false);
    }
  };

  const isBusy = loading || internalLoading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy || disabled}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isBusy ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
      ) : (
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
      )}
      <span>{isBusy ? 'Exporting...' : label}</span>
    </button>
  );
};

export default ExportButton;
