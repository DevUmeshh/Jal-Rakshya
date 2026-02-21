import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Network Error';
    return Promise.reject(new Error(message));
  }
);

// ---- Location APIs ----
export const fetchLocations = (search = '') =>
  api.get('/locations', { params: { search } });

export const fetchLocationByName = (name) =>
  api.get(`/locations/${encodeURIComponent(name)}`);

// ---- Water Data APIs ----
export const fetchWaterData = (location) =>
  api.get(`/water/${encodeURIComponent(location)}`);

export const fetchLatestData = (location) =>
  api.get(`/water/${encodeURIComponent(location)}/latest`);

export const fetchAlerts = (location) =>
  api.get(`/water/${encodeURIComponent(location)}/alerts`);

export const fetchGovUpdates = (location) =>
  api.get(`/water/${encodeURIComponent(location)}/gov-updates`);

export const fetchPredictions = (location, years = 3) =>
  api.get(`/water/${encodeURIComponent(location)}/predictions`, { params: { years } });

export const fetchAllOverview = () => api.get('/water/overview/all');

export const fetchDistrictStats = () => api.get('/water/stats/district');

export const fetchDistrictAlerts = () => api.get('/water/district-alerts');

export const fetchDistrictGovUpdates = () => api.get('/water/district-gov-updates');

export const compareLocations = (loc1, loc2) =>
  api.get('/water/compare', { params: { loc1, loc2 } });

// ---- New Enhanced APIs ----
export const fetchLocationSummary = (location) =>
  api.get(`/water/${encodeURIComponent(location)}/summary`);

export const fetchRankings = () => api.get('/water/rankings');

export const fetchYearlyChanges = (location) =>
  api.get(`/water/${encodeURIComponent(location)}/yearly-changes`);

export const fetchSearchSuggestions = (q) =>
  api.get('/water/search-suggestions', { params: { q } });

export const fetchHeatmapData = () => api.get('/water/heatmap-data');

// ---- Upload ----
export const uploadCSV = (formData) =>
  api.post('/upload/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export default api;
