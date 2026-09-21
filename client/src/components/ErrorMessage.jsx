import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

const ErrorMessage = ({ message, errors = [], onClose }) => {
  if (!message && (!errors || errors.length === 0)) return null;

  return (
    <div
      role="alert"
      className="p-4 mb-4 text-sm text-red-800 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 transition-standard"
    >
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        {message && <p className="font-medium text-red-900">{message}</p>}
        {errors && errors.length > 0 && (
          <ul className="mt-1.5 list-disc list-inside space-y-1 text-xs text-red-700">
            {errors.map((err, index) => (
              <li key={index}>{typeof err === 'string' ? err : err.message}</li>
            ))}
          </ul>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Dismiss error"
          className="text-red-500 hover:text-red-700 transition"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
