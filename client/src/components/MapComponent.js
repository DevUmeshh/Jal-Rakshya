import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, useMap, ZoomControl, LayersControl, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarkerColor } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet default marker icon path issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Nashik district bounding box (expanded to cover all locations in new_nsk_gwater.csv)
const NASHIK_BOUNDS = [
  [19.35, 73.20], // SW corner
  [20.90, 74.90], // NE corner
];

// Clean pin marker for single-location dashboard view — no animation
function createPinIcon(color) {
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <div style="position:relative;width:36px;height:48px;cursor:pointer;">
        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 12.8 16.5 27.1 17.22 27.74a1.2 1.2 0 001.56 0C19.5 45.1 36 30.8 36 18 36 8.06 27.94 0 18 0z" fill="${color}"/>
          <circle cx="18" cy="18" r="9" fill="white" opacity="0.92"/>
          <circle cx="18" cy="18" r="5.5" fill="${color}"/>
        </svg>
      </div>
    `,
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -44],
  });
}

// Component to fly/pan to a new center when it changes
function FlyToCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Tile layer URLs
const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    name: 'Street',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    name: 'Topographic',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a> World Imagery',
    name: 'Satellite',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com">CARTO</a>',
    name: 'Dark',
  },
  watercolor: {
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    name: 'Terrain',
  },
};

export default function MapComponent({ center, markers = [], zoom = 12, singleMarker, height = '100%', showAllOverview = false, onMarkerClick, isDashboard = false }) {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const mapRef = useRef(null);

  const defaultCenter = center || { lat: 19.9975, lng: 73.7898 };
  const defaultTile = darkMode ? 'dark' : 'street';

  // Build all markers to render — filter to Nashik district only
  const allMarkers = [];
  const isInNashik = (lat, lng) =>
    lat >= NASHIK_BOUNDS[0][0] && lat <= NASHIK_BOUNDS[1][0] &&
    lng >= NASHIK_BOUNDS[0][1] && lng <= NASHIK_BOUNDS[1][1];

  if (singleMarker) {
    allMarkers.push({
      ...singleMarker,
      position: [defaultCenter.lat, defaultCenter.lng],
      isSingle: true,
    });
  }
  markers.forEach((m) => {
    const lat = m.position ? m.position.lat : m.coordinates?.latitude;
    const lng = m.position ? m.position.lng : m.coordinates?.longitude;
    if (lat && lng && isInNashik(lat, lng)) {
      allMarkers.push({
        ...m,
        position: [lat, lng],
        isSingle: false,
      });
    }
  });

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-white/10 dark:border-gray-700/30" style={{ height, minHeight: '300px' }}>
      {/* Gradient overlay at top for title */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none bg-gradient-to-b from-black/30 to-transparent h-16" />
      <div className="absolute top-3 left-4 z-[1001] text-white text-sm font-bold drop-shadow-lg pointer-events-none flex items-center gap-2">
        {singleMarker?.location || 'Nashik District — Groundwater Monitoring'}
      </div>

      {/* ===== Compact Color Legend ===== */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto" style={{ maxWidth: '150px' }}>
        <div className="rounded-xl p-2.5 text-[10px] leading-tight" style={{ background: darkMode ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', border: darkMode ? '1px solid rgba(51,65,85,0.5)' : '1px solid rgba(226,232,240,0.7)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
          <p className="font-bold text-[9px] uppercase tracking-wider mb-1.5" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>Legend</p>
          {/* Status colors */}
          <div className="flex items-center gap-1.5 mb-1">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', border: '1.5px solid white', flexShrink: 0 }} />
            <span style={{ color: darkMode ? '#cbd5e1' : '#334155' }}>Safe</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', display: 'inline-block', border: '1.5px solid white', flexShrink: 0 }} />
            <span style={{ color: darkMode ? '#cbd5e1' : '#334155' }}>Warning</span>
          </div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', border: '1.5px solid white', flexShrink: 0 }} />
            <span style={{ color: darkMode ? '#cbd5e1' : '#334155' }}>Critical</span>
          </div>
          {/* Divider */}
          <div style={{ height: 1, background: darkMode ? '#1e293b' : '#e2e8f0', margin: '3px 0' }} />
          {/* Bubble size meaning */}
          <div className="flex items-center gap-1.5 mb-1" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
            <svg width="14" height="10" viewBox="0 0 14 10" style={{ flexShrink: 0 }}>
              <circle cx="3" cy="7" r="2.5" fill={darkMode ? '#475569' : '#94a3b8'} opacity="0.7" />
              <circle cx="8" cy="5" r="3.5" fill={darkMode ? '#475569' : '#94a3b8'} opacity="0.7" />
            </svg>
            <span>Size = Score</span>
          </div>
          {/* Hover hint */}
          <p style={{ color: darkMode ? '#475569' : '#94a3b8', marginTop: 2 }}>Hover for details</p>
        </div>
      </div>

      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={zoom}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        whenReady={() => {}}
        maxBounds={NASHIK_BOUNDS}
        maxBoundsViscosity={0.8}
        minZoom={9}
      >
        <ZoomControl position="topright" />

        {/* Layer switcher */}
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked={defaultTile === 'street'} name="Street">
            <TileLayer url={TILE_LAYERS.street.url} attribution={TILE_LAYERS.street.attribution} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked={defaultTile === 'dark'} name="Dark">
            <TileLayer url={TILE_LAYERS.dark.url} attribution={TILE_LAYERS.dark.attribution} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer url={TILE_LAYERS.satellite.url} attribution={TILE_LAYERS.satellite.attribution} maxZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer url={TILE_LAYERS.watercolor.url} attribution={TILE_LAYERS.watercolor.attribution} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topographic">
            <TileLayer url={TILE_LAYERS.topo.url} attribution={TILE_LAYERS.topo.attribution} maxZoom={17} />
          </LayersControl.BaseLayer>
        </LayersControl>

        <FlyToCenter center={[defaultCenter.lat, defaultCenter.lng]} zoom={zoom} />

        {/* Render location bubbles — Nashik regions only */}
        {allMarkers.map((m, i) => {
          const color = getMarkerColor(m.status);

          // Bubble radius based on waterScore — compact but visible
          const baseRadius = m.isSingle ? 18 : Math.max(6, Math.min(13, (m.waterScore || 50) / 6));

          // Depletion severity color for the mini-bar
          const deplColor = (m.depletionRate || 0) >= 5 ? '#ef4444' : (m.depletionRate || 0) >= 3 ? '#f59e0b' : '#22c55e';

          return (
            <React.Fragment key={`${m.location || i}-${m.position[0]}`}>
              {/* Outer glow ring */}
              <CircleMarker
                center={m.position}
                radius={baseRadius + 6}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.10,
                  weight: 0,
                  opacity: 0,
                }}
              />

              {/* Main colored bubble */}
              <CircleMarker
                center={m.position}
                radius={baseRadius}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: color,
                  fillOpacity: 0.55,
                  weight: 2,
                  opacity: 0.9,
                }}
                eventHandlers={{
                  click: () => {
                    if (m.location) {
                      // If already on dashboard, go to analytics; otherwise go to dashboard
                      if (isDashboard) {
                        navigate(`/analytics/${encodeURIComponent(m.location)}`);
                      } else {
                        navigate(`/dashboard/${encodeURIComponent(m.location)}`);
                      }
                    } else if (onMarkerClick) {
                      onMarkerClick(m);
                    }
                  },
                  mouseover: (e) => {
                    const layer = e.target;
                    layer.setStyle({ fillOpacity: 0.8, weight: 3 });
                    layer.bringToFront();
                  },
                  mouseout: (e) => {
                    const layer = e.target;
                    layer.setStyle({ fillOpacity: 0.55, weight: 2 });
                  },
                }}
              >
                {/* Compact analytics tooltip on hover */}
                <Tooltip
                  direction="top"
                  offset={[0, -baseRadius - 4]}
                  opacity={0.98}
                  className="nashik-bubble-tooltip"
                  sticky={false}
                >
                  <div className="jal-tooltip-inner">
                    {/* Header */}
                    <div className="jal-tt-header">
                      <span className="jal-tt-dot" style={{ background: color }} />
                      <span className="jal-tt-name">{m.location}</span>
                      <span className="jal-tt-badge" style={{ background: color }}>{m.status}</span>
                    </div>

                    {/* Compact metrics grid */}
                    <div className="jal-tt-grid">
                      <div className="jal-tt-metric">
                        <span className="jal-tt-label">💧 Level</span>
                        <span className="jal-tt-value">{m.groundwaterLevel ?? '—'}m</span>
                      </div>
                      <div className="jal-tt-metric">
                        <span className="jal-tt-label">🌧️ Rain</span>
                        <span className="jal-tt-value">{m.rainfall ?? '—'}mm</span>
                      </div>
                      <div className="jal-tt-metric">
                        <span className="jal-tt-label">📉 Depl.</span>
                        <span className="jal-tt-value" style={{ color: deplColor }}>{m.depletionRate ?? '—'}%</span>
                      </div>
                      <div className="jal-tt-metric">
                        <span className="jal-tt-label">🧪 pH</span>
                        <span className="jal-tt-value">{m.ph ?? '—'}</span>
                      </div>
                    </div>

                    {/* Depletion mini-bar */}
                    <div className="jal-tt-bar-wrap">
                      <div className="jal-tt-bar-track">
                        <div className="jal-tt-bar-fill" style={{ width: `${Math.min(100, ((m.depletionRate || 0) / 8) * 100)}%`, background: deplColor }} />
                      </div>
                    </div>

                    {/* Score + Scarcity */}
                    <div className="jal-tt-footer">
                      {m.waterScore !== undefined && (
                        <span className="jal-tt-score">Score: <strong style={{ color }}>{m.waterScore}</strong></span>
                      )}
                      {m.scarcityLevel && (
                        <span className="jal-tt-scarcity">{m.scarcityLevel}</span>
                      )}
                    </div>

                    <div className="jal-tt-hint">{isDashboard ? 'Click → Analytics' : 'Click → Dashboard'}</div>
                  </div>
                </Tooltip>
              </CircleMarker>

              {/* Pin icon overlay for single-location dashboard view — pointer-events disabled so hover works on bubble */}
              {m.isSingle && (
                <Marker
                  position={m.position}
                  icon={createPinIcon(color)}
                  interactive={false}
                  bubblingMouseEvents={false}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Styles — bubble tooltips & controls */}
      <style>{`
        .custom-marker { background: transparent !important; border: none !important; }
        .custom-pin-marker { background: transparent !important; border: none !important; pointer-events: none !important; }

        /* ===== Bubble Tooltip ===== */
        .nashik-bubble-tooltip {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
          padding: 0 !important;
          font-family: system-ui, -apple-system, sans-serif;
          min-width: 200px;
          max-width: 230px;
        }
        .nashik-bubble-tooltip::before {
          border-top-color: #ffffff !important;
        }
        html.dark .nashik-bubble-tooltip {
          background: #0f172a !important;
          border-color: #1e293b !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.45) !important;
        }
        html.dark .nashik-bubble-tooltip::before {
          border-top-color: #0f172a !important;
        }

        /* Tooltip inner container */
        .jal-tooltip-inner {
          padding: 8px 10px 6px;
        }

        /* Header row */
        .jal-tt-header {
          display: flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 6px;
          padding-bottom: 5px;
          border-bottom: 1px solid #f1f5f9;
        }
        html.dark .jal-tt-header { border-color: #1e293b; }
        .jal-tt-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
        }
        .jal-tt-name {
          font-weight: 700; font-size: 11.5px; color: #0f172a; flex: 1;
        }
        html.dark .jal-tt-name { color: #f1f5f9; }
        .jal-tt-badge {
          font-size: 8px; font-weight: 700; color: #fff;
          padding: 1px 6px; border-radius: 8px; text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        /* Metrics grid */
        .jal-tt-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          margin-bottom: 6px;
        }
        .jal-tt-metric {
          display: flex; flex-direction: column;
          background: #f8fafc; border-radius: 6px;
          padding: 3px 6px;
        }
        html.dark .jal-tt-metric { background: #1e293b; }
        .jal-tt-label {
          font-size: 8.5px; color: #94a3b8; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.2px;
          margin-bottom: 0;
        }
        html.dark .jal-tt-label { color: #64748b; }
        .jal-tt-value {
          font-size: 11.5px; font-weight: 700; color: #1e293b;
        }
        html.dark .jal-tt-value { color: #e2e8f0; }

        /* Depletion risk bar */
        .jal-tt-bar-wrap {
          margin-bottom: 5px;
        }
        .jal-tt-bar-track {
          height: 3px; background: #f1f5f9; border-radius: 3px;
          overflow: hidden;
        }
        html.dark .jal-tt-bar-track { background: #1e293b; }
        .jal-tt-bar-fill {
          height: 100%; border-radius: 3px;
          transition: width 0.4s ease;
        }
        .jal-tt-bar-label {
          font-size: 9px; color: #94a3b8; margin-top: 2px;
          display: block;
        }

        /* Footer */
        .jal-tt-footer {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 10px; color: #64748b;
          margin-bottom: 3px;
        }
        .jal-tt-score strong, .jal-tt-scarcity strong { font-weight: 700; }
        html.dark .jal-tt-footer { color: #94a3b8; }

        /* Hint */
        .jal-tt-hint {
          font-size: 8px; color: #94a3b8; text-align: center;
          padding-top: 4px; border-top: 1px solid #f1f5f9;
          font-weight: 500;
        }
        html.dark .jal-tt-hint { color: #475569; border-color: #1e293b; }

        /* CircleMarker cursor */
        .leaflet-interactive { cursor: pointer !important; }

        /* Controls */
        .leaflet-control-layers {
          border-radius: 12px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important;
          border: none !important;
        }
        .leaflet-control-zoom a {
          border-radius: 8px !important;
          margin: 2px !important;
        }
      `}</style>
    </div>
  );
}
