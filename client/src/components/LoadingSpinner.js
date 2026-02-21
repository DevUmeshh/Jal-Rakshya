import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
        className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-primary-500"
      />
      <p className="text-slate-500 dark:text-slate-400 text-sm">{text}</p>
    </div>
  );
}
