import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Zap, ArrowLeft } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-950 overflow-hidden">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src="/ev-hero-bg.jpg"
          alt="EV Station Background"
          className="w-full h-full object-cover object-center opacity-45 filter contrast-110 brightness-95"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-900/50 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 group transition-transform hover:scale-105"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
            <Zap className="w-7 h-7 fill-white stroke-none" />
          </div>
        </Link>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
          EV<span className="text-emerald-400">Charge</span>
        </h2>
        <p className="mt-1 text-xs text-slate-300 font-medium tracking-wide uppercase">
          Clean Energy • Smart Grid Network
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/40 dark:border-slate-700/60">
          <Outlet />
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
