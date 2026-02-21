import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/30 rounded-xl p-8 text-center max-w-sm w-full"
      >
        <h1 className="text-4xl font-extrabold text-primary-600 mb-1">404</h1>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/" className="btn-primary flex items-center gap-1.5 text-sm">
            <FiHome size={13} /> Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <FiArrowLeft size={13} /> Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
