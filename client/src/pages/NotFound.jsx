import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Zap } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <Zap className="w-10 h-10" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full text-white flex items-center justify-center font-bold text-xs">
            404
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-navy-950">Page Not Found</h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is currently unreachable.
          </p>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
