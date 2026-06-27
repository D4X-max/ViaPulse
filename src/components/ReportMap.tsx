import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Report, Category } from '../types';

interface ReportMapProps {
  reports: Report[];
  selectedReportId?: string;
  onSelectReport: (report: Report) => void;
  onSelectLocation?: (lat: number, lng: number) => void;
  newReportLocation?: { latitude: number; longitude: number } | null;
  categoryFilter?: string | null;
}

// Custom hook to handle Leaflet map event bindings dynamically
function useMapEvents(map: L.Map | null, events: { [key: string]: (e: L.LeafletMouseEvent) => void }) {
  useEffect(() => {
    if (!map) return;
    Object.entries(events).forEach(([eventName, handler]) => {
      map.on(eventName, handler);
    });
    return () => {
      if (!map) return;
      Object.entries(events).forEach(([eventName, handler]) => {
        try {
          map.off(eventName, handler);
        } catch (e) {
          // ignore
        }
      });
    };
  }, [map, events]);
}

export default function ReportMap({
  reports,
  selectedReportId,
  onSelectReport,
  onSelectLocation,
  newReportLocation,
  categoryFilter
}: ReportMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const selectMarkerRef = useRef<L.Marker | null>(null);

  const onSelectLocationRef = useRef(onSelectLocation);
  const onSelectReportRef = useRef(onSelectReport);

  // Categories checklist filters state
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: boolean }>({
    pothole: true,
    garbage: true,
    water: true,
    lighting: true,
    trees: true,
    traffic_signals: true,
  });

  // Handle external category filter updates from AI Copilot
  useEffect(() => {
    if (categoryFilter) {
      setSelectedFilters({
        pothole: categoryFilter === 'pothole',
        garbage: categoryFilter === 'garbage',
        water: categoryFilter === 'water',
        lighting: categoryFilter === 'lighting',
        trees: categoryFilter === 'trees',
        traffic_signals: categoryFilter === 'traffic_signals',
      });
    } else {
      setSelectedFilters({
        pothole: true,
        garbage: true,
        water: true,
        lighting: true,
        trees: true,
        traffic_signals: true,
      });
    }
  }, [categoryFilter]);

  const categoriesList = [
    { id: 'pothole', label: 'Potholes' },
    { id: 'garbage', label: 'Garbage' },
    { id: 'water', label: 'Water Leak' },
    { id: 'lighting', label: 'Streetlight' },
    { id: 'trees', label: 'Trees' },
    { id: 'traffic_signals', label: 'Traffic Signals' },
  ];

  // Wire up useMapEvents hook to capture click events on map
  useMapEvents(mapRef.current, {
    click: (e) => {
      if (onSelectLocationRef.current) {
        onSelectLocationRef.current(e.latlng.lat, e.latlng.lng);
      }
    }
  });

  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  useEffect(() => {
    onSelectReportRef.current = onSelectReport;
  }, [onSelectReport]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // San Francisco default center
    const defaultCenter: [number, number] = [37.7749, -122.4194];
    
    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    // Voyager light tile layer is beautiful and responsive
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Resize observer to handle container resizing gracefully
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        map.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      // Safely clear all markers from map before removing map
      Object.keys(markersRef.current).forEach(id => {
        try {
          const marker = markersRef.current[id];
          if (marker) {
            marker.remove();
          }
        } catch (e) {
          // ignore
        }
      });
      markersRef.current = {};

      if (selectMarkerRef.current) {
        try {
          selectMarkerRef.current.remove();
        } catch (e) {
          // ignore
        }
        selectMarkerRef.current = null;
      }

      try {
        map.remove();
      } catch (e) {
        // ignore
      }
      mapRef.current = null;
    };
  }, []);

  // Create Custom SVG Markers based on Category, Severity, and Status
  const getMarkerIcon = (report: Report, isSelected: boolean) => {
    const isClosed = report.status === 'CLOSED_VERIFIED' || report.status === 'RESOLVED';
    const isHigh = report.severity === 'high';
    const category = report.category;

    // Synchronize map pin markers dynamically based on payload state
    // - CLOSED / RESOLVED: Soft Emerald Green checkmark badge icon
    // - CRITICAL / HIGH URGENCY: Bright Red warning badge marker icon
    // - MEDIUM / LOW URGENCY: Amber / Yellow indicator badge icon
    let color = '#eab308'; // Default Amber / Yellow (Medium/Low)
    if (isClosed) {
      color = '#10b981'; // Soft Emerald Green
    } else if (isHigh) {
      color = '#ef4444'; // Bright Red (Critical/High)
    }

    const size = isSelected ? 40 : 32;

    const iconSvg = `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <path d="M50,10 C28,10 10,28 10,50 C10,78 45,95 50,95 C55,95 90,78 90,50 C90,28 72,10 50,10 Z" fill="${color}" stroke="#ffffff" stroke-width="4"/>
          <circle cx="50" cy="45" r="18" fill="#ffffff"/>
          ${
            isClosed
              ? `<path d="M42,45 L48,51 L58,39" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
              : category === 'pothole'
              ? `<path d="M48,32 L52,32 L51,48 L49,48 Z M48,54 L52,54 L52,58 L48,58 Z" fill="${color}" stroke="${color}" stroke-width="1"/>`
              : category === 'garbage'
              ? `<path d="M38,36 L62,36 M42,36 L42,56 A2,2 0 0 0 44,58 L56,58 A2,2 0 0 0 58,56 L58,36 M48,30 L52,30" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`
              : category === 'water'
              ? `<path d="M50,30 C50,30 38,45 38,51 C38,57 43,62 50,62 C57,62 62,57 62,51 C62,45 50,30 50,30 Z" fill="${color}"/>`
              : `<circle cx="50" cy="45" r="8" fill="${color}"/><path d="M50,32 L50,35 M50,55 L50,58 M37,45 L40,45 M60,45 L63,45" stroke="${color}" stroke-width="2"/>`
          }
        </g>
      </svg>
    `;

    return L.divIcon({
      className: `custom-map-marker ${!isClosed && isSelected ? 'pulse-marker' : ''}`,
      html: iconSvg,
      iconSize: [size, size],
      iconAnchor: [size / 2, size]
    });
  };

  // Sync Markers according to Filter Settings
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Filter reports locally
    const filteredReports = reports.filter(r => {
      const catKey = r.category || 'pothole';
      return selectedFilters[catKey] === true;
    });

    const currentIds = new Set(filteredReports.map(r => r.id));
    
    // Clear existing markers that are not in the filtered reports list
    Object.keys(markersRef.current).forEach(id => {
      if (!currentIds.has(id)) {
        try {
          markersRef.current[id].remove();
        } catch (e) {
          // ignore
        }
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    filteredReports.forEach(report => {
      const isSelected = report.id === selectedReportId;
      const isClosed = report.status === 'CLOSED_VERIFIED' || report.status === 'RESOLVED';
      const icon = getMarkerIcon(report, isSelected);

      const popupHtml = `
        <div class="p-2 font-sans min-w-[220px] max-w-[240px] text-gray-800">
          <div class="rounded-lg overflow-hidden border border-gray-100 mb-2 shadow-sm">
            <img src="${report.imageUrl || 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2'}" class="w-full h-24 object-cover" referrerPolicy="no-referrer" />
          </div>
          <div class="flex items-center justify-between gap-1.5 mb-1.5">
            <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-100 font-mono tracking-wider">
              📍 ${report.category.toUpperCase()}
            </span>
            <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
              isClosed ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
            }">
              ${report.status}
            </span>
          </div>
          <p class="text-xs text-gray-700 font-medium leading-normal mb-2 mt-1 truncate-3-lines">${report.description || 'No description provided.'}</p>
          <div class="flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] text-gray-400 font-mono">
            <span class="flex items-center gap-1">💬 ${report.comments?.length || 0} Comments</span>
            <span class="flex items-center gap-1">👍 ${report.upvotes || 0} Escalations</span>
          </div>
        </div>
      `;

      if (markersRef.current[report.id]) {
        // Update position and icon if already exists
        const marker = markersRef.current[report.id];
        try {
          marker.setLatLng([report.latitude, report.longitude]);
          marker.setIcon(icon);
          marker.bindPopup(popupHtml, { closeButton: false });
          if (isSelected) {
            marker.setZIndexOffset(1000);
          } else {
            marker.setZIndexOffset(0);
          }
        } catch (e) {
          // ignore
        }
      } else {
        // Create new marker
        try {
          const marker = L.marker([report.latitude, report.longitude], { icon })
            .addTo(map)
            .bindPopup(popupHtml, { closeButton: false })
            .on('click', () => {
              if (onSelectReportRef.current) {
                onSelectReportRef.current(report);
              }
            });
          
          markersRef.current[report.id] = marker;
        } catch (e) {
          // ignore
        }
      }
    });
  }, [reports, selectedReportId, selectedFilters]);

  // Center Map on selected report
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedReportId) return;

    const selectedReport = reports.find(r => r.id === selectedReportId);
    if (selectedReport) {
      try {
        map.setView([selectedReport.latitude, selectedReport.longitude], 15, {
          animate: true,
          duration: 0.8
        });
        
        // Autostart popup for selected pin if exists
        const marker = markersRef.current[selectedReportId];
        if (marker) {
          marker.openPopup();
        }
      } catch (e) {
        // ignore
      }
    }
  }, [selectedReportId, reports]);

  // Handle placing a selection pin for new reports
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (newReportLocation) {
      const { latitude, longitude } = newReportLocation;
      
      const pinIcon = L.divIcon({
        className: 'new-report-pin',
        html: `
          <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <g>
              <path d="M50,10 C28,10 10,28 10,50 C10,78 45,95 50,95 C55,95 90,78 90,50 C90,28 72,10 50,10 Z" fill="#4f46e5" stroke="#ffffff" stroke-width="4"/>
              <circle cx="50" cy="45" r="15" fill="#ffffff"/>
              <path d="M42,45 L58,45 M50,37 L50,53" stroke="#4f46e5" stroke-width="6" stroke-linecap="round"/>
            </g>
          </svg>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      try {
        if (selectMarkerRef.current) {
          selectMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          selectMarkerRef.current = L.marker([latitude, longitude], { icon: pinIcon, zIndexOffset: 2000 })
            .addTo(map);
        }

        map.setView([latitude, longitude], 16, { animate: true });
      } catch (e) {
        // ignore
      }
    } else {
      if (selectMarkerRef.current) {
        try {
          selectMarkerRef.current.remove();
        } catch (e) {
          // ignore
        }
        selectMarkerRef.current = null;
      }
    }
  }, [newReportLocation]);

  const toggleFilter = (id: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white flex flex-col">
      {/* 6. Checkbox Row at the top */}
      <div className="bg-slate-950 p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none z-50 border-b border-slate-800">
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest min-w-max mr-1">Filters:</span>
        <div className="flex gap-2 min-w-max">
          {categoriesList.map((cat) => (
            <label 
              key={cat.id} 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all border ${
                selectedFilters[cat.id]
                  ? 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <input 
                type="checkbox" 
                checked={!!selectedFilters[cat.id]} 
                onChange={() => toggleFilter(cat.id)}
                className="hidden"
              />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div id="map-canvas" ref={mapContainerRef} className="w-full flex-1 min-h-[350px]" />
      
      {/* Map Guidelines overlay */}
      <div className="absolute bottom-4 left-4 z-50 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-xs text-gray-500 font-medium select-none flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
        {onSelectLocation ? "Click map to pin hazard location" : "Click markers to view details"}
      </div>
    </div>
  );
}
