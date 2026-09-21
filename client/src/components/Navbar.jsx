import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Zap,
  Menu,
  X,
  User,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  ChevronRight,
  Calendar,
  QrCode,
  History,
  Activity,
  Car,
  CreditCard,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  MapPin,
  Bell,
  Star,
  DollarSign,
  Building2,
  Cpu,
  Gauge,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDrawer from './notifications/NotificationDrawer';
import notificationService from '../services/notificationService';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getUnreadCount().then((res) => {
        if (res.success) setUnreadCount(res.data.unreadCount || 0);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  const navLinkClass = ({ isActive }) =>
    `px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
      isActive
        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-emerald-600 text-white font-bold shadow-sm'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center gap-2 group shrink-0"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-white stroke-none" />
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center">
                  EV<span className="text-emerald-600 dark:text-emerald-400">Charge</span>
                </span>
                <span className="hidden sm:block text-[9px] uppercase font-semibold tracking-wider text-slate-400 -mt-1">
                  Smart Grid Network
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>

              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" className={navLinkClass}>
                    <span className="flex items-center gap-1">
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Dashboard
                    </span>
                  </NavLink>

                  <NavLink to="/stations/map" className={navLinkClass}>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      Map Finder
                    </span>
                  </NavLink>

                  {!isAdmin ? (
                    <>
                      <NavLink to="/stations" className={navLinkClass}>
                        Stations
                      </NavLink>
                      <NavLink to="/vehicles" className={navLinkClass}>
                        Vehicles
                      </NavLink>
                      <NavLink to="/bookings" className={navLinkClass}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Bookings
                        </span>
                      </NavLink>
                      <NavLink to="/check-in" className={navLinkClass}>
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                          <QrCode className="w-3.5 h-3.5" />
                          Check-In
                        </span>
                      </NavLink>
                      <NavLink to="/charging-history" className={navLinkClass}>
                        <span className="flex items-center gap-1">
                          <History className="w-3.5 h-3.5" />
                          History
                        </span>
                      </NavLink>
                      <NavLink to="/payments" className={navLinkClass}>
                        Payments
                      </NavLink>
                      <NavLink to="/fleet" className={navLinkClass}>
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Building2 className="w-3.5 h-3.5" />
                          Fleet
                        </span>
                      </NavLink>
                    </>
                  ) : (
                    <>
                      <NavLink to="/admin/dashboard" className={navLinkClass}>
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      </NavLink>
                      <NavLink to="/admin/analytics" className={navLinkClass}>
                        <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-bold">
                          <BarChart3 className="w-3.5 h-3.5" />
                          Analytics
                        </span>
                      </NavLink>
                      <NavLink to="/admin/reviews" className={navLinkClass}>
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Star className="w-3.5 h-3.5" />
                          Reviews
                        </span>
                      </NavLink>
                      <NavLink to="/admin/pricing" className={navLinkClass}>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          Pricing
                        </span>
                      </NavLink>
                      <NavLink to="/admin/ocpp" className={navLinkClass}>
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Cpu className="w-3.5 h-3.5" />
                          OCPP
                        </span>
                      </NavLink>
                      <NavLink to="/admin/load-management" className={navLinkClass}>
                        <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                          <Gauge className="w-3.5 h-3.5" />
                          Load Mgmt
                        </span>
                      </NavLink>
                      <NavLink to="/admin/stations" className={navLinkClass}>
                        Stations
                      </NavLink>
                      <NavLink to="/admin/reports" className={navLinkClass}>
                        Reports
                      </NavLink>
                    </>
                  )}

                  <NavLink to="/profile" className={navLinkClass}>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      Profile
                    </span>
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/stations" className={navLinkClass}>
                    Find Stations
                  </NavLink>
                  <NavLink to="/stations/map" className={navLinkClass}>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      Map Finder
                    </span>
                  </NavLink>
                </>
              )}
            </nav>

            {/* Desktop Right Action Area */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {/* Notification Bell */}
                  <button
                    onClick={() => setIsNotificationOpen(true)}
                    className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium capitalize">
                      {user?.role || 'User'}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger & Bell Buttons */}
            <div className="flex lg:hidden items-center gap-1">
              {isAuthenticated && (
                <button
                  onClick={() => setIsNotificationOpen(true)}
                  className="relative p-2 text-slate-600 dark:text-slate-300 rounded-xl"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 max-h-[80vh] overflow-y-auto">
            {isAuthenticated ? (
              <div className="space-y-1">
                <NavLink to="/dashboard" onClick={closeMenu} className={mobileNavLinkClass}>
                  <span>Dashboard</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </NavLink>

                <NavLink to="/stations/map" onClick={closeMenu} className={mobileNavLinkClass}>
                  <span className="text-emerald-600 font-bold">Map Station Finder</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </NavLink>

                {!isAdmin ? (
                  <>
                    <NavLink to="/stations" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Find Stations</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/vehicles" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Vehicles</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/bookings" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Bookings</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/check-in" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span className="text-emerald-700 font-bold">Check-In</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/charging-history" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Charging History</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/payments" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Payments</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/fleet" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Fleet Operations</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/admin/dashboard" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span className="text-emerald-700 font-bold">Admin Dashboard</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/admin/analytics" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span className="text-indigo-700 font-bold">Analytics Engine</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/admin/reviews" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span className="text-amber-600 font-bold">Review Moderation</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/admin/pricing" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Dynamic Pricing</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/admin/ocpp" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>OCPP Simulator</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/admin/load-management" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Load Management</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                    <NavLink to="/admin/stations" onClick={closeMenu} className={mobileNavLinkClass}>
                      <span>Manage Stations</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </NavLink>
                  </>
                )}

                <NavLink to="/profile" onClick={closeMenu} className={mobileNavLinkClass}>
                  <span>Profile</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </NavLink>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 rounded-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <NavLink to="/stations" onClick={closeMenu} className={mobileNavLinkClass}>
                  <span>Find Stations</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </NavLink>
                <NavLink to="/stations/map" onClick={closeMenu} className={mobileNavLinkClass}>
                  <span>Map Finder</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </NavLink>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex justify-center p-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="flex justify-center p-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* In-App Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
};

export default Navbar;
