import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Report, Category } from '../types';

interface ReportMapProps {
  reports: Report[];
  selectedReportId?: string;
  onSelectReport: (report: Report) => void;
  onSelectLocation?: (lat: number, lng: number) => void;
  newReportLocation?: { latitude: number; longitude: number } | null;
}

export default function ReportMap({
  reports,
  selectedReportId,
  onSelectReport,
  onSelectLocation,
  newReportLocation
}: ReportMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const selectMarkerRef = useRef<L.Marker | null>(null);

  const onSelectLocationRef = useRef(onSelectLocation);
  const onSelectReportRef = useRef(onSelectReport);

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

    // Dark styled map layer (CartoDB Positron is clean and beautiful)
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

    // Enable clicking to place a pin
    map.on('click', (e) => {
      if (onSelectLocationRef.current) {
        onSelectLocationRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

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

  // Create Custom SVG Markers based on Category and Status
  const getMarkerIcon = (category: Category, isClosed: boolean, isSelected: boolean) => {
    const colors = {
      pothole: '#ef4444', // Red
      garbage: '#f97316', // Orange
      water: '#3b82f6',   // Blue
      lighting: '#eab308' // Yellow
    };

    const color = isClosed ? '#22c55e' : colors[category] || '#6b7280';
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
              ? `<path d="M42,45 L48,51 L58,39" fill="none" stroke="#22c55e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
              : category === 'pothole'
              ? `<path d="M48,32 L52,32 L51,48 L49,48 Z M48,54 L52,54 L52,58 L48,58 Z" fill="#ef4444" stroke="#ef4444" stroke-width="1"/>`
              : category === 'garbage'
              ? `<path d="M38,36 L62,36 M42,36 L42,56 A2,2 0 0 0 44,58 L56,58 A2,2 0 0 0 58,56 L58,36 M48,30 L52,30" fill="none" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>`
              : category === 'water'
              ? `<path d="M50,30 C50,30 38,45 38,51 C38,57 43,62 50,62 C57,62 62,57 62,51 C62,45 50,30 50,30 Z" fill="#3b82f6"/>`
              : `<circle cx="50" cy="45" r="8" fill="#eab308"/><path d="M50,32 L50,35 M50,55 L50,58 M37,45 L40,45 M60,45 L63,45" stroke="#eab308" stroke-width="2"/>`
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

  // Sync Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers that are not in the new reports list
    const currentIds = new Set(reports.map(r => r.id));
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
    reports.forEach(report => {
      const isSelected = report.id === selectedReportId;
      const isClosed = report.status === 'CLOSED_VERIFIED';
      const icon = getMarkerIcon(report.category, isClosed, isSelected);

      if (markersRef.current[report.id]) {
        // Update position and icon if already exists
        const marker = markersRef.current[report.id];
        try {
          marker.setLatLng([report.latitude, report.longitude]);
          marker.setIcon(icon);
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
  }, [reports, selectedReportId]);

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

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-gray-100">
      <div id="map-canvas" ref={mapContainerRef} className="w-full h-full min-h-[350px] md:min-h-[500px]" />
      
      {/* Map Guidelines overlay */}
      <div className="absolute bottom-4 left-4 z-50 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-xs text-gray-500 font-medium select-none flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
        {onSelectLocation ? "Click map to pin hazard location" : "Click markers to view details"}
      </div>
    </div>
  );
}
