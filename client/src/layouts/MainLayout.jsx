import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Zap, Heart, Shield, HelpCircle } from 'lucide-react';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy-900 text-slate-400 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 fill-white stroke-none" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  EV<span className="text-emerald-400">Charge</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Smart EV Charging Station Management and Slot Booking System.
                Smart charging. Simple booking. Better journeys.
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Phase 1 Foundation Active
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                Platform
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/" className="hover:text-emerald-400 transition">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-emerald-400 transition">
                    User Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-emerald-400 transition">
                    User Profile
                  </Link>
                </li>
                <li>
                  <span className="text-slate-500">Live Station Map (Phase 4)</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                Roadmap
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>Phase 2: Stations & Chargers</li>
                <li>Phase 3: Slot Booking & Calendar</li>
                <li>Phase 4: QR Check-in & Maps</li>
                <li>Phase 5: Payments & Live Energy</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                Security & Support
              </h4>
              <div className="space-y-2 text-xs text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  JWT & Bcrypt Encrypted
                </p>
                <p className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Role-based Access Control
                </p>
                <p className="pt-2 text-[11px] text-slate-500">
                  Built for scalable micro-mobility & EV fleet operations.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} EVCharge System. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Engineered with <Heart className="w-3 h-3 text-emerald-500 fill-emerald-500" /> for Clean Energy Transition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
