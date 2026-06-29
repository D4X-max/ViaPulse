import React, { useEffect, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';
import { Report } from '../types';

interface ReportMapProps {
  reports: Report[];
  selectedReportId?: string;
  onSelectReport: (report: Report) => void;
  onSelectLocation?: (lat: number, lng: number) => void;
  newReportLocation?: { latitude: number; longitude: number } | null;
  categoryFilter?: string | null;
}

// Inner component to handle map events and effects requiring the map instance
function MapContent({
  reports,
  selectedReportId,
  onSelectReport,
  newReportLocation,
  selectedFilters
}: {
  reports: Report[];
  selectedReportId?: string;
  onSelectReport: (report: Report) => void;
  newReportLocation?: { latitude: number; longitude: number } | null;
  selectedFilters: { [key: string]: boolean };
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedReportId) return;

    const selectedReport = (reports || []).find(r => r?.id === selectedReportId);
    if (selectedReport) {
      map.panTo({ lat: Number(selectedReport.latitude), lng: Number(selectedReport.longitude) });
      map.setZoom(15);
    }
  }, [map, selectedReportId, reports]);

  useEffect(() => {
    if (!map || !newReportLocation) return;
    map.panTo({ lat: Number(newReportLocation.latitude), lng: Number(newReportLocation.longitude) });
    map.setZoom(16);
  }, [map, newReportLocation]);

  const filteredReports = (reports || []).filter(r => {
    const catKey = r?.category || 'pothole';
    return selectedFilters[catKey] === true;
  });

  return (
    <>
      {filteredReports.map(report => {
        if (!report || !report.id) return null;
        const isSelected = report.id === selectedReportId;
        const isClosed = report.status === 'CLOSED_VERIFIED' || report.status === 'RESOLVED';
        const isHigh = report.severity === 'high';

        let color = '#eab308'; // Default Amber / Yellow
        if (isClosed) {
          color = '#10b981'; // Soft Emerald Green
        } else if (isHigh) {
          color = '#ef4444'; // Bright Red
        }

        const numLat = Number(report.latitude);
        const numLng = Number(report.longitude);
        
        return (
          <React.Fragment key={report.id}>
            <AdvancedMarker
              position={{ lat: numLat, lng: numLng }}
              onClick={() => onSelectReport(report)}
              zIndex={isSelected ? 1000 : 0}
            >
              <Pin background={color} glyphColor="#fff" borderColor="#fff" scale={isSelected ? 1.2 : 1} />
            </AdvancedMarker>
            {isSelected && (
              <InfoWindow
                position={{ lat: numLat, lng: numLng }}
                onCloseClick={() => {}}
                headerDisabled={true}
              >
                <div className="p-3 min-w-[160px] flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={`w-2 h-2 rounded-full ${isClosed ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    <span className="text-[11px] font-bold text-slate-900 tracking-tight">
                      {String(report.category || 'hazard').toUpperCase()} - {report.status || 'REPORTED'}
                    </span>
                  </div>
                  {report.imageUrl ? (
                    <img src={report.imageUrl} alt="Hazard" className="w-full h-28 object-cover rounded-md bg-slate-100 border border-slate-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-28 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-xs text-slate-400 font-mono">No Image</div>
                  )}
                </div>
              </InfoWindow>
            )}
          </React.Fragment>
        );
      })}

      {newReportLocation && (
        <AdvancedMarker
          position={{ lat: Number(newReportLocation.latitude), lng: Number(newReportLocation.longitude) }}
          zIndex={2000}
        >
          <Pin background="#4f46e5" glyphColor="#fff" borderColor="#fff" scale={1.5} />
        </AdvancedMarker>
      )}
    </>
  );
}

export default function ReportMap(props: ReportMapProps) {
  const { categoryFilter, onSelectLocation } = props;
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || '';

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

  const toggleFilter = (id: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleMapClick = (e: MapMouseEvent) => {
    if (onSelectLocation && e.detail.latLng) {
      onSelectLocation(e.detail.latLng.lat, e.detail.latLng.lng);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white flex flex-col">
      {/* Checkbox Row at the top */}
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

      <div className="w-full flex-1 min-h-[350px] relative">
        {API_KEY ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={{ lat: 37.7749, lng: -122.4194 }}
              defaultZoom={13}
              mapId="REPORT_MAP_ID"
              disableDefaultUI={true}
              onClick={handleMapClick}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <MapContent {...props} selectedFilters={selectedFilters} />
            </Map>
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-4 text-center absolute inset-0 z-10">
            <p className="text-sm text-slate-500 mb-2 font-semibold">Google Maps API Key Required</p>
            <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">Get an API Key</a>
          </div>
        )}
      </div>
      
      {/* Map Guidelines overlay */}
      <div className="absolute bottom-4 left-4 z-50 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm text-xs text-gray-500 font-medium select-none flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
        {onSelectLocation ? "Click map to pin hazard location" : "Click markers to view details"}
      </div>
    </div>
  );
}
