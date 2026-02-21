import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { FiSun, FiMoon, FiDroplet, FiHome, FiBarChart2, FiMenu, FiX, FiActivity } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { selectedLocation } = useLocation();
  const navigate = useNavigate();
  const { pathname } = useRouterLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => pathname === path;
  const isDashboard = pathname.startsWith('/dashboard/');
  const isAnalytics = pathname.startsWith('/analytics/');

  const linkClass = (active) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 ${
      active
        ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-200/60 dark:border-slate-700/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-primary-600 rounded-lg p-1.5 group-hover:bg-primary-700 transition-colors">
              <FiDroplet className="text-white text-base" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                JalRakshya
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5 font-medium">
                Groundwater Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Link to="/" className={linkClass(isActive('/'))}>
              <FiHome size={14} />
              <span>Home</span>
            </Link>

            {selectedLocation && (
              <>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                <button
                  onClick={() => navigate(`/dashboard/${encodeURIComponent(selectedLocation)}`)}
                  className={linkClass(isDashboard)}
                >
                  <FiBarChart2 size={14} />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => navigate(`/analytics/${encodeURIComponent(selectedLocation)}`)}
                  className={linkClass(isAnalytics)}
                >
                  <FiActivity size={14} />
                  <span>Analytics</span>
                </button>
              </>
            )}

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="relative flex items-center w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-700/60 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-pressed={darkMode}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-sm transform transition-transform duration-200 flex items-center justify-center ${
                  darkMode ? 'translate-x-[30px]' : 'translate-x-0.5'
                }`}
              >
                {darkMode ? (
                  <FiMoon className="text-indigo-400" size={11} />
                ) : (
                  <FiSun className="text-amber-500" size={11} />
                )}
              </span>
            </button>
          </div>

          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <FiSun size={16} /> : <FiMoon size={16} />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <FiX size={16} /> : <FiMenu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden border-t border-slate-200/60 dark:border-slate-700/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-2 space-y-0.5">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <FiHome size={15} /> Home
              </Link>
              {selectedLocation && (
                <>
                  <button
                    onClick={() => { navigate(`/dashboard/${encodeURIComponent(selectedLocation)}`); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isDashboard ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FiBarChart2 size={15} /> Dashboard
                  </button>
                  <button
                    onClick={() => { navigate(`/analytics/${encodeURIComponent(selectedLocation)}`); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isAnalytics ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <FiActivity size={15} /> Analytics
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
