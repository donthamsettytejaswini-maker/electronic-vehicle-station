import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  MapPin,
  Calendar,
  Activity,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Users,
  Settings,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user, isAdmin } = useAuth();

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section with Cinematic EV Station Background */}
      <section className="relative overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 border border-slate-200/80 dark:border-slate-800 shadow-2xl">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src="/ev-hero-bg.jpg"
            alt="Ultra-Fast Smart EV Charging Hub"
            className="w-full h-full object-cover object-center scale-100 filter brightness-90 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-900/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/40" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 sm:py-28 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-lg">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Clean Energy • Smart Grid Network
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] drop-shadow-lg max-w-3xl">
            Powering the Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Electric Mobility</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-200 max-w-2xl leading-relaxed drop-shadow">
            Smart charging station network with real-time port telemetry, automated slot reservations, contactless QR check-in, and instant digital billing.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin/dashboard' : '/dashboard'}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/40 transition transform hover:-translate-y-0.5"
              >
                Go to {isAdmin ? 'Admin Dashboard' : 'User Dashboard'}
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/stations"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/40 transition transform hover:-translate-y-0.5"
                >
                  Find Charging Stations
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 transition transform hover:-translate-y-0.5 shadow-lg"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>

          {/* Quick Metrics in Glass Panel */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl">
            <div className="p-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
              <p className="text-2xl font-black text-emerald-400">17+</p>
              <p className="text-xs font-semibold text-slate-300">Active Stations</p>
            </div>
            <div className="p-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
              <p className="text-2xl font-black text-teal-300">49+</p>
              <p className="text-xs font-semibold text-slate-300">Fast Chargers</p>
            </div>
            <div className="p-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
              <p className="text-2xl font-black text-cyan-300">100%</p>
              <p className="text-xs font-semibold text-slate-300">Green Energy</p>
            </div>
            <div className="p-4 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg">
              <p className="text-2xl font-black text-white">24/7</p>
              <p className="text-xs font-semibold text-slate-300">Grid Availability</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy-950">
            Engineered for Seamless EV Mobility
          </h2>
          <p className="mt-2 text-slate-600 text-sm sm:text-base">
            Explore the core pillars of the EVCharge ecosystem (Planned roadmap rollout).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition relative group">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200 mb-2">
              Phase 2 Preview
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Find Charging Stations
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Locate ultra-fast DC and AC chargers nearby with real-time port availability, connector types, and dynamic pricing.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition relative group">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200 mb-2">
              Phase 3 Preview
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Reserve Your Slot
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eliminate charging anxiety by booking specific timeslots and power outlets in advance with instant calendar confirmation.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition relative group">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200 mb-2">
              Phase 4 Preview
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Track Charging Sessions
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitor energy dispensed, current battery SoC, estimated completion time, and receive instant push notifications.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition relative group">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="inline-block px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 rounded-full border border-amber-200 mb-2">
              Phase 5 Preview
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Manage Payment Records
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Secure wallet integration, GST-compliant e-invoices, downloadable receipts, and flexible payment gateways.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4" /> 4 Simple Steps
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy-950">
              How EVCharge Works
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Your frictionless journey from registration to 100% battery charge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-emerald-500/30">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Create an Account
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sign up with your credentials (Active in Phase 1) and set up your personal EV profile.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Find a Station
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Browse nearby certified EV chargers filtered by port standard and distance.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Reserve a Slot
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pick an available time window and reserve with guaranteed socket availability.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-navy-800 text-white font-bold flex items-center justify-center text-lg mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Charge Your Vehicle
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Scan QR at the charging bay, plug in, and monitor energy transfer in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Architecture & Roles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-navy-900 via-slate-900 to-navy-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" /> Dual-Role Architecture
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4">
                Unified Ecosystem for Drivers & Operators
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                EVCharge is built with clear role boundaries to ensure operational integrity, secure token validation, and reliable grid resource scheduling.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">EV Driver Dashboard</h4>
                    <p className="text-xs text-slate-400">
                      Personalized profile, booking history, live consumption metrics, and vehicle association.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10 text-teal-400">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Station Admin Control Center</h4>
                    <p className="text-xs text-slate-400">
                      Fleet management, station and charger provisioning, tariff configuration, and system telemetry.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur space-y-4">
              <h3 className="text-base font-semibold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Phase 1 Implementation Checklist
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  React 18 + Vite + Tailwind CSS Single Page Architecture
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Node.js / Express.js REST API with CORS & Cookie Support
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  MongoDB Atlas / Mongoose Schema with Hashed Passwords
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Stateless JWT Token Verification & Auth State Hydration
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Role-guarded Protected Routes (`user` vs `admin`)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Safe Profile Viewing & Editing Endpoints
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
