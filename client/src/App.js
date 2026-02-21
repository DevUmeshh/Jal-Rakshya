import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation as useRouterLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { LocationProvider } from './context/LocationContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import { FiChevronUp } from 'react-icons/fi';

/* ─── Page transition wrapper ─── */
const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.2, ease: 'easeIn' } },
};

function PageShell({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

/* ─── Top loading bar shown between page navigations ─── */
function NavigationLoader() {
  const location = useRouterLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (!loading) return null;
  return <div className="page-loading-bar" style={{ width: '70%' }} />;
}

/* ─── Scroll to top on route change ─── */
function ScrollToTop() {
  const { pathname } = useRouterLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

/* ─── Floating scroll-to-top button ─── */
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    setVisible(window.scrollY > 400);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <button
      className={`scroll-to-top ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      <FiChevronUp size={20} />
    </button>
  );
}

/* ─── Animated routes ─── */
function AnimatedRoutes() {
  const location = useRouterLocation();
  return (
    <>
      <ScrollToTop />
      <NavigationLoader />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageShell><Home /></PageShell>} />
          <Route path="/dashboard/:location" element={<PageShell><Dashboard /></PageShell>} />
          <Route path="/analytics/:location" element={<PageShell><Analytics /></PageShell>} />
          <Route path="*" element={<PageShell><NotFound /></PageShell>} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LocationProvider>
        <Router>
          <div className="min-h-screen transition-colors duration-300">
            <Navbar />
            <main className="pt-16">
              <AnimatedRoutes />
            </main>
            <ScrollToTopButton />
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'glass',
                duration: 4000,
                style: { borderRadius: '12px', padding: '12px 16px' },
              }}
            />
          </div>
        </Router>
      </LocationProvider>
    </ThemeProvider>
  );
}

export default App;
