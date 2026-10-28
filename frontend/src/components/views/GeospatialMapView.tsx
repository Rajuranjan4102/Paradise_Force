import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { GrievanceModel } from '../../types';
import L from 'leaflet';
import {
  MapPin,
  RefreshCw,
  Layers,
  Filter,
  Eye,
  Info,
  Flame,
  AlertTriangle,
} from 'lucide-react';

export const GeospatialMapView: React.FC = () => {
  const { districtFilter, setDistrictFilter, openCaseDrawer, refreshTrigger } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [grievances, setGrievances] = useState<GrievanceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Load grievances for map
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    api
      .fetchGrievances({
        limit: 100,
        district: districtFilter !== 'ALL' ? districtFilter : undefined,
        severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      })
      .then(data => {
        if (isCurrent) {
          setGrievances(data.items);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (isCurrent) setLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [districtFilter, selectedSeverity, selectedCategory, refreshTrigger]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Bihar Center: 25.6° N, 85.1° E (Patna)
      const map = L.map(mapContainerRef.current, {
        center: [25.5941, 85.1376],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | JANRAKSHA Bihar State Command',
        className: 'dark-tiles',
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers whenever grievances update
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    grievances.forEach(item => {
      if (!item.location) return;
      const { latitude, longitude, locality, district } = item.location;
      if (!latitude || !longitude) return;

      const latLng = L.latLng(latitude, longitude);
      bounds.extend(latLng);

      // Restrained executive palette: only CRITICAL has crimson alert
      const color =
        item.severity === 'CRITICAL'
          ? '#BE123C'
          : item.severity === 'HIGH'
          ? '#B45309'
          : item.severity === 'MEDIUM'
          ? '#57534E'
          : '#78716C';

      const customIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="
            position: relative;
            width: 26px;
            height: 26px;
            background: #FFFFFF;
            border: 2px solid ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(50, 40, 30, 0.15);
            cursor: pointer;
          ">
            <div style="width: 8px; height: 8px; background: ${color}; border-radius: 50%;"></div>
            ${item.severity === 'CRITICAL' ? `<div style="position: absolute; inset: -4px; border: 2px solid #BE123C; border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>` : ''}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      const popupHtml = `
        <div style="padding: 4px; font-family: sans-serif; min-width: 220px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-family: monospace; font-size: 11px; font-weight: bold; color: #B45309;">${item.trackingId}</span>
            <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${color}20; color: ${color};">${item.severity}</span>
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #1C1917; margin-bottom: 4px; line-height: 1.3;">${item.title}</div>
          <div style="font-size: 11px; color: #78716C; margin-bottom: 8px;">${locality}, ${district}</div>
          <button
            id="btn-inspect-${item.id}"
            style="
              width: 100%;
              background: #1C1917;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: bold;
              padding: 6px;
              border-radius: 6px;
              border: none;
              cursor: pointer;
            "
          >
            Inspect Case Details →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${item.id}`);
        if (btn) {
          btn.onclick = () => {
            openCaseDrawer(item.id);
          };
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });

    if (bounds.isValid() && grievances.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [grievances]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col relative select-none">
      {/* Top Map Filter Overlay Bar */}
      <div className="absolute top-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-white/95 border border-[#E5DFD3] backdrop-blur-md p-2 rounded-xl shadow-warm-md">
          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-stone-800">
            <Layers className="w-4 h-4 text-stone-700" />
            <span>Map Layers</span>
          </div>

          <select
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="bg-[#FAF7F2] text-stone-800 text-xs rounded-lg px-2.5 py-1.5 border border-[#E5DFD3] font-medium focus:outline-none focus:border-stone-500"
          >
            <option value="ALL">All Districts</option>
            <option value="Patna Central">Patna Central</option>
            <option value="Gaya City">Gaya City</option>
            <option value="Muzaffarpur North">Muzaffarpur North</option>
            <option value="Bhagalpur East">Bhagalpur East</option>
            <option value="Darbhanga West">Darbhanga West</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="bg-[#FAF7F2] text-stone-800 text-xs rounded-lg px-2.5 py-1.5 border border-[#E5DFD3] font-medium focus:outline-none focus:border-stone-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Pins Only</option>
            <option value="HIGH">High Severity</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-[#FAF7F2] text-stone-800 text-xs rounded-lg px-2.5 py-1.5 border border-[#E5DFD3] font-medium focus:outline-none focus:border-stone-500"
          >
            <option value="ALL">All Categories</option>
            <option value="ROAD_DAMAGE">Roads & Potholes</option>
            <option value="WATERLOGGING">Waterlogging & Flooding</option>
            <option value="GARBAGE_WASTE">Garbage & Waste</option>
            <option value="ELECTRICITY">Electricity & Transformer</option>
            <option value="WATER_SUPPLY">Water Supply</option>
          </select>
        </div>

        {/* Marker Count Pill */}
        <div className="pointer-events-auto bg-white/95 border border-[#E5DFD3] backdrop-blur-md px-3.5 py-2 rounded-xl shadow-warm-md flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-800" />
            <span className="font-mono font-bold text-stone-900">{grievances.length} Active Pins</span>
          </div>
          <span className="text-stone-300">|</span>
          <span className="text-[11px] text-stone-500 font-medium">Click marker to inspect case details</span>
        </div>
      </div>

      {/* Official Jurisdictional Dispatch Banner */}
      <div className="absolute bottom-4 left-6 z-20 pointer-events-auto bg-white/95 border border-[#E5DFD3] backdrop-blur-md px-3.5 py-1.5 rounded-lg text-[10px] text-stone-600 font-mono flex items-center gap-2 shadow-xs">
        <MapPin className="w-3.5 h-3.5 text-stone-700" />
        <span>JURISDICTIONAL DISPATCH GRID • BIHAR STATE POLICE & MUNICIPAL COMMAND</span>
      </div>

      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-10" />
    </div>
  );
};
