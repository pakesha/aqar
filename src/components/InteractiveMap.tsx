/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Property, OperationType, PropertyType, User } from '../types';
import {
  ZoomIn,
  ZoomOut,
  Navigation,
  MapPin,
  Search,
  Maximize2,
  Sparkles,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  Compass,
  PenTool,
  RefreshCw,
  LayoutDashboard,
  Shield,
  Plus,
  X,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';

interface InteractiveMapProps {
  properties: Property[];
  onSelectProperty: (property: Property | null) => void;
  selectedProperty?: Property | null;
  activeCity: string;
  setActiveCity: (city: string) => void;
  filterType?: OperationType | 'all';
  setFilterType?: (type: OperationType | 'all') => void;
  filterPropertyType?: PropertyType | 'all';
  setFilterPropertyType?: (type: PropertyType | 'all') => void;
  minPrice?: string;
  setMinPrice?: (price: string) => void;
  maxPrice?: string;
  setMaxPrice?: (price: string) => void;
  roomsCount?: string;
  setRoomsCount?: (rooms: string) => void;
  drawnPolygonPoints?: { x: number; y: number }[];
  setDrawnPolygonPoints?: React.Dispatch<React.SetStateAction<{ x: number; y: number }[]>>;
  isDrawMode?: boolean;
  setIsDrawMode?: (isDraw: boolean) => void;
  aiSuggestedFilters?: any;
  currentUser: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  activeTab: 'map' | 'dashboard' | 'admin' | 'ai' | 'add';
  setActiveTab: (tab: 'map' | 'dashboard' | 'admin' | 'ai' | 'add') => void;
}

// Global list of coordinates for major Egypt and Saudi cities
const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom?: number }> = {
  'مصر (الكل)': { lat: 26.8206, lng: 30.8025, zoom: 6 },
  'القاهرة': { lat: 30.0444, lng: 31.2357, zoom: 12 },
  'الجيزة': { lat: 29.9765, lng: 31.1313, zoom: 12 },
  'الإسكندرية': { lat: 31.2001, lng: 29.9187, zoom: 12 },
  'الساحل الشمالي': { lat: 30.9328, lng: 28.8475, zoom: 11 },
  'المنصورة': { lat: 31.0413, lng: 31.3785, zoom: 12 },
  'الغردقة': { lat: 27.2579, lng: 33.8116, zoom: 12 },
  'السعودية (الكل)': { lat: 23.8859, lng: 45.0792, zoom: 5 },
  'الرياض': { lat: 24.7136, lng: 46.6753, zoom: 12 },
  'جدة': { lat: 21.5433, lng: 39.1728, zoom: 12 },
  'مكة المكرمة': { lat: 21.4267, lng: 39.8262, zoom: 12 },
  'الدمام': { lat: 26.4207, lng: 50.0888, zoom: 12 }
};

export default function InteractiveMap({
  properties,
  onSelectProperty,
  selectedProperty: propSelectedProperty,
  activeCity,
  setActiveCity,
  filterType: propFilterType,
  setFilterType: propSetFilterType,
  filterPropertyType: propFilterPropertyType,
  setFilterPropertyType: propSetFilterPropertyType,
  minPrice: propMinPrice,
  setMinPrice: propSetMinPrice,
  maxPrice: propMaxPrice,
  setMaxPrice: propSetMaxPrice,
  roomsCount: propRoomsCount,
  setRoomsCount: propSetRoomsCount,
  aiSuggestedFilters,
  currentUser,
  onUpdateUser,
  activeTab,
  setActiveTab
}: InteractiveMapProps) {
  // Resolve states
  const [internalSelectedProperty, setInternalSelectedProperty] = useState<Property | null>(null);
  const [internalFilterType, setInternalFilterType] = useState<OperationType | 'all'>('all');
  const [internalFilterPropertyType, setInternalFilterPropertyType] = useState<PropertyType | 'all'>('all');
  const [internalMinPrice, setInternalMinPrice] = useState('');
  const [internalMaxPrice, setInternalMaxPrice] = useState('');
  const [internalRoomsCount, setInternalRoomsCount] = useState('all');

  const selectedProperty = propSelectedProperty !== undefined ? propSelectedProperty : internalSelectedProperty;
  const filterType = propFilterType !== undefined ? propFilterType : internalFilterType;
  const setFilterType = propSetFilterType !== undefined ? propSetSetFilterType() : setInternalFilterType;
  const filterPropertyType = propFilterPropertyType !== undefined ? propFilterPropertyType : internalFilterPropertyType;
  const setFilterPropertyType = propSetFilterPropertyType !== undefined ? propSetFilterPropertyType : setInternalFilterPropertyType;
  const minPrice = propMinPrice !== undefined ? propMinPrice : internalMinPrice;
  const setMinPrice = propSetMinPrice !== undefined ? propSetMinPrice : setInternalMinPrice;
  const maxPrice = propMaxPrice !== undefined ? propMaxPrice : internalMaxPrice;
  const setMaxPrice = propSetMaxPrice !== undefined ? propSetMaxPrice : setInternalMaxPrice;
  const roomsCount = propRoomsCount !== undefined ? propRoomsCount : internalRoomsCount;
  const setRoomsCount = propSetRoomsCount !== undefined ? propSetRoomsCount : setInternalRoomsCount;

  function propSetSetFilterType() {
    return propSetFilterType || setInternalFilterType;
  }

  // Map settings and local states
  const [zoom, setZoom] = useState<number>(12);
  const [mapTheme, setMapTheme] = useState<'snap' | 'satellite' | 'classic'>('snap');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [activePreviewProperty, setActivePreviewProperty] = useState<Property | null>(null);
  
  // Viewport bounds state for Lazy Loading
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const referenceLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const egyptBoundaryRef = useRef<L.GeoJSON | null>(null);

  // Return the correct tile url for each selected theme (completely key-free)
  const getTileUrl = (theme: string) => {
    if (theme === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (theme === 'classic') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else {
      // 'snap' - CartoDB Dark Matter (perfectly matching dark HUD theme)
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
    }
  };

  // Convert real-world coordinates helper
  const handleCityChange = (city: string) => {
    setActiveCity(city);
    setActivePreviewProperty(null);
    if (mapRef.current) {
      const coords = CITY_COORDINATES[city];
      if (coords) {
        mapRef.current.setView([coords.lat, coords.lng], coords.zoom || 12);
      }
    }
  };

  // Expose global callback for Leaflet popup click trigger
  useEffect(() => {
    (window as any).selectPropertyById = (id: string) => {
      const found = properties.find(p => p.id === id);
      if (found) {
        onSelectProperty(found);
        setActivePreviewProperty(found);
      }
    };
    return () => {
      delete (window as any).selectPropertyById;
    };
  }, [properties, onSelectProperty]);

  // Handle free text location search using OSM Nominatim API
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        if (mapRef.current) {
          mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 13);
          
          // Temporary marker for searched location
          const searchIcon = L.divIcon({
            html: `
              <div class="relative flex items-center justify-center">
                <div class="w-4 h-4 bg-amber-500 rounded-full border-2 border-white animate-ping"></div>
                <div class="w-3 h-3 bg-amber-400 rounded-full border border-white absolute"></div>
              </div>
            `,
            className: 'search-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          
          L.marker([parseFloat(lat), parseFloat(lon)], { icon: searchIcon })
            .addTo(mapRef.current)
            .bindPopup(`<div class="text-xs font-bold text-slate-900 p-1" dir="rtl">${display_name}</div>`)
            .openPopup();
        }
      }
    } catch (err) {
      console.error('OSM Nominatim Search failed:', err);
    }
  };

  // Handle automatic Geolocation
  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapRef.current) {
            mapRef.current.flyTo([latitude, longitude], 14);
            
            const userIcon = L.divIcon({
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="absolute w-8 h-8 bg-blue-500/30 rounded-full animate-ping"></div>
                  <div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_12px_#3b82f6]"></div>
                </div>
              `,
              className: 'user-location-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            L.marker([latitude, longitude], { icon: userIcon }).addTo(mapRef.current);
          }
        },
        (err) => {
          console.error('GPS Geolocation denied or failed:', err);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // 1. Filtered properties (Base dynamic list)
  const baseFilteredProperties = useMemo(() => {
    return properties.filter(p => {
      // Lazy load filter by visible map boundary bounds (or default to city if bounds not loaded yet)
      if (mapBounds) {
        if (!mapBounds.contains([p.lat, p.lng])) return false;
      } else {
        if (p.city !== activeCity) return false;
      }

      // Sidebar Filters
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterPropertyType !== 'all' && p.propertyType !== filterPropertyType) return false;
      if (minPrice && p.price < parseFloat(minPrice)) return false;
      if (maxPrice && p.price > parseFloat(maxPrice)) return false;
      if (roomsCount && roomsCount !== 'all' && roomsCount !== 'any') {
        const rCount = parseInt(roomsCount);
        if (p.rooms < rCount) return false;
      }
      return true;
    });
  }, [properties, activeCity, filterType, filterPropertyType, minPrice, maxPrice, roomsCount, mapBounds]);

  // Distance-based clustering algorithm for optimized, high-performance rendering of many properties
  const clusteredMarkers = useMemo(() => {
    if (zoom >= 14) {
      return baseFilteredProperties.map(p => ({ isCluster: false, count: 1, properties: [p], lat: p.lat, lng: p.lng }));
    }

    const clusters: Array<{
      isCluster: boolean;
      count: number;
      properties: Property[];
      lat: number;
      lng: number;
    }> = [];

    // Cluster threshold range dynamically adjusted by zoom
    const threshold = 0.55 / Math.pow(2, zoom - 6);

    baseFilteredProperties.forEach(prop => {
      let found = null;
      for (const c of clusters) {
        const d = Math.sqrt(Math.pow(c.lat - prop.lat, 2) + Math.pow(c.lng - prop.lng, 2));
        if (d < threshold) {
          found = c;
          break;
        }
      }

      if (found) {
        found.count += 1;
        found.properties.push(prop);
        found.lat = (found.lat * (found.count - 1) + prop.lat) / found.count;
        found.lng = (found.lng * (found.count - 1) + prop.lng) / found.count;
        found.isCluster = true;
      } else {
        clusters.push({
          isCluster: false,
          count: 1,
          properties: [prop],
          lat: prop.lat,
          lng: prop.lng
        });
      }
    });

    return clusters;
  }, [baseFilteredProperties, zoom]);

  // Map Mounting & Lifecycle
  useEffect(() => {
    if (!containerRef.current) return;

    const coords = CITY_COORDINATES[activeCity] || CITY_COORDINATES['القاهرة'];
    const initialZoom = coords.zoom || 12;

    // Instantiate map
    const map = L.map(containerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    mapRef.current = map;

    // Create markers layer group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Handle updates to viewport bounds
    map.on('moveend zoomend', () => {
      setMapBounds(map.getBounds());
      setZoom(map.getZoom());
    });

    // Set initial bounds
    setMapBounds(map.getBounds());
    setZoom(map.getZoom());

    // Pull beautiful glowing boundary of Egypt from world geojson
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/EGY.geo.json')
      .then(res => res.json())
      .then(data => {
        if (mapRef.current && data) {
          const boundary = L.geoJSON(data, {
            style: {
              color: '#fbbf24', // beautiful amber boundary
              weight: 2,
              opacity: 0.5,
              fillColor: '#fbbf24',
              fillOpacity: 0.03
            }
          }).addTo(mapRef.current);
          egyptBoundaryRef.current = boundary;
        }
      })
      .catch(err => {
        console.warn('Could not load Egypt province GeoJSON boundary, falling back gracefully.', err);
      });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        referenceLayerRef.current = null;
        markersLayerRef.current = null;
        egyptBoundaryRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer Theme
  useEffect(() => {
    if (mapRef.current) {
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
      }
      if (referenceLayerRef.current) {
        referenceLayerRef.current.remove();
      }

      const tileUrl = getTileUrl(mapTheme);
      const newTile = L.tileLayer(tileUrl, {
        maxZoom: 19
      }).addTo(mapRef.current);
      tileLayerRef.current = newTile;

      // Overlay high-contrast Arabic city and street names labels layer for satellite/dark map
      if (mapTheme === 'satellite') {
        const labelsUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
        const newRef = L.tileLayer(labelsUrl, {
          maxZoom: 19,
          opacity: 0.9
        }).addTo(mapRef.current);
        referenceLayerRef.current = newRef;
      } else if (mapTheme === 'snap') {
        const labelsUrl = 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png';
        const newRef = L.tileLayer(labelsUrl, {
          maxZoom: 19,
          opacity: 0.95
        }).addTo(mapRef.current);
        referenceLayerRef.current = newRef;
      }
    }
  }, [mapTheme]);

  // Update Marker Layer items
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    clusteredMarkers.forEach(c => {
      if (c.isCluster) {
        const clusterHtml = `
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500 shadow-lg shadow-amber-500/30 group cursor-pointer transition-transform duration-300 hover:scale-110">
            <div class="absolute inset-0.5 rounded-full bg-slate-950/80 flex items-center justify-center">
              <span class="text-xs font-black text-amber-400 font-mono">${c.count}</span>
            </div>
            <div class="absolute -inset-1 rounded-full border border-amber-500/40 animate-pulse"></div>
          </div>
        `;

        const clusterIcon = L.divIcon({
          html: clusterHtml,
          className: 'custom-cluster-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker([c.lat, c.lng], { icon: clusterIcon })
          .addTo(markersLayerRef.current!);

        marker.on('click', () => {
          mapRef.current?.setView([c.lat, c.lng], mapRef.current.getZoom() + 2);
        });

      } else {
        const p = c.properties[0];
        const isSelected = selectedProperty?.id === p.id;
        const priceText = p.price >= 1000000
          ? `${(p.price / 1000000).toFixed(1)} م`
          : `${(p.price / 1000).toLocaleString()} ألف`;
        
        const currency = 'ج.م';

        const markerHtml = `
          <div class="relative flex flex-col items-center group cursor-pointer transition-transform duration-300 ${isSelected ? 'scale-110 z-[1000]' : 'z-10 hover:scale-105'}">
            <!-- Price badge -->
            <div class="px-2 py-1 rounded-lg text-[10px] font-black border shadow-md whitespace-nowrap transition-all duration-300 ${
              isSelected ? 'bg-amber-500 text-slate-950 border-white shadow-amber-500/50 scale-110 animate-bounce' : 'bg-slate-900/95 text-white border-slate-700'
            }">
              ${priceText}
            </div>
            <!-- Main property image with beautiful border instead of colored dots -->
            <div class="w-8 h-8 rounded-full border-2 overflow-hidden mt-1 shadow-md transition-all duration-300 ${
              isSelected
                ? 'border-amber-400 scale-125 shadow-[0_0_12px_rgba(251,191,36,0.8)] ring-2 ring-amber-500/50'
                : p.isFeatured
                ? 'border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : p.type === 'sale'
                ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                : 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
            }">
              <img src="${p.images[0]}" class="w-full h-full object-cover" />
            </div>
          </div>
        `;

        const markerIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-property-marker',
          iconSize: [60, 45],
          iconAnchor: [30, 40]
        });

        const marker = L.marker([p.lat, p.lng], { icon: markerIcon })
          .addTo(markersLayerRef.current!);

        // Translucent custom popup card
        const popupContent = `
          <div class="p-1 min-w-[200px] text-right font-sans" dir="rtl">
            <img src="${p.images[0]}" class="w-full h-24 object-cover rounded-lg mb-2" />
            <div class="text-xs font-bold text-white mb-1">${p.title}</div>
            <div class="flex items-center justify-between text-[11px] mb-2">
              <span class="text-amber-400 font-black">${p.price.toLocaleString()} ${currency}</span>
              <span class="text-slate-300">${p.area} م²</span>
            </div>
            <div class="text-[10px] text-slate-400 mb-2">نوع العقار: ${p.propertyType === 'villa' ? 'فيلا' : p.propertyType === 'apartment' ? 'شقة' : p.propertyType === 'land' ? 'أرض' : 'تجاري'}</div>
            <button class="w-full py-1.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-md text-center hover:bg-amber-400 transition-all shadow-md cursor-pointer" onclick="window.selectPropertyById('${p.id}')">عرض التفاصيل 🔍</button>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'custom-leaflet-popup'
        });

        marker.on('click', () => {
          setActivePreviewProperty(p);
          onSelectProperty(p);
        });
      }
    });
  }, [clusteredMarkers, selectedProperty]);

  return (
    <div id="interactive-map-screen" className="relative h-screen w-screen overflow-hidden bg-slate-950">
      
      {/* Self-contained CSS Styles for Custom Dark Popup */}
      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          color: #ffffff !important;
          border: 1px solid rgba(245, 158, 11, 0.35) !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6) !important;
          backdrop-filter: blur(12px) !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border-right: 1px solid rgba(245, 158, 11, 0.35) !important;
          border-bottom: 1px solid rgba(245, 158, 11, 0.35) !important;
        }
        .leaflet-grab {
          cursor: grab !important;
        }
        .leaflet-grabbing {
          cursor: grabbing !important;
        }
      `}</style>

      {/* Floating Header Navigation Overlay (Minimal & Translucent Glass) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap gap-3 md:flex-nowrap items-center justify-between bg-slate-900/85 backdrop-blur-lg p-3 rounded-2xl border border-slate-800/80 shadow-2xl" dir="rtl">
        
        {/* City Filter Toggles */}
        <div className="flex gap-1 overflow-x-auto p-0.5 bg-slate-950/60 rounded-xl max-w-full no-scrollbar border border-slate-800/60">
          {Object.keys(CITY_COORDINATES).map(city => (
            <button
              key={city}
              id={`city-btn-${city}`}
              onClick={() => handleCityChange(city)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap flex items-center gap-1 ${
                activeCity === city
                  ? 'bg-amber-500 text-slate-950 shadow-lg font-black scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Compass className="w-3.5 h-3.5 animate-pulse" />
              {city}
            </button>
          ))}
        </div>

        {/* Search HUD & Filters */}
        <div className="flex items-center gap-2">
          {aiSuggestedFilters && (
            <span className="flex items-center gap-1 bg-purple-500/15 text-purple-300 text-[10px] px-2.5 py-1 rounded-full border border-purple-500/25">
              <Sparkles className="w-3 h-3 text-purple-400" />
              تصفية الذكاء الاصطناعي نشطة
            </span>
          )}

          {/* Collapsible Advanced Filters Panel Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
              showFilters
                ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 animate-pulse" />
            <span>تصفية متقدمة</span>
          </button>
        </div>

        {/* Map Theme Toggle */}
        <div className="flex gap-1 p-0.5 bg-slate-950/60 rounded-xl border border-slate-800/60">
          {([
            { id: 'satellite', label: '🛰️ قمر صناعي' },
            { id: 'snap', label: '🗺️ خريطة شوارع' },
            { id: 'classic', label: 'كلاسيكي' }
          ] as const).map(style => (
            <button
              key={style.id}
              onClick={() => setMapTheme(style.id)}
              className={`px-2.5 py-1.5 text-[10px] font-black rounded-lg transition-all whitespace-nowrap ${
                mapTheme === style.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actual OpenStreetMap Leaflet Container */}
      <div 
        ref={containerRef}
        id="leaflet-live-map"
        className="w-full h-full z-0 relative"
      />

      {/* Floating Zoom / Geolocation Coordinates Controls on Right Side */}
      <div className="absolute bottom-24 right-6 z-20 flex flex-col gap-2">
        <button
          onClick={() => mapRef.current?.zoomIn()}
          className="w-11 h-11 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
          title="تكبير"
        >
          <ZoomIn className="w-5 h-5 text-amber-400" />
        </button>
        <button
          onClick={() => mapRef.current?.zoomOut()}
          className="w-11 h-11 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
          title="تصغير"
        >
          <ZoomOut className="w-5 h-5 text-amber-400" />
        </button>
        <button
          onClick={handleLocateUser}
          className="w-11 h-11 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
          title="تحديد موقعي الحالي GPS"
        >
          <Navigation className="w-5 h-5 text-amber-400 animate-pulse" />
        </button>
        <button
          onClick={() => handleCityChange(activeCity)}
          className="w-11 h-11 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
          title="إعادة تركيز"
        >
          <RefreshCw className="w-5 h-5 text-amber-400" />
        </button>
      </div>

      {/* HUD Analytics Glass widget (Bottom Left) */}
      <div className="absolute bottom-24 left-6 z-20 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 max-w-[280px] sm:max-w-xs shadow-2xl text-right hidden sm:block" dir="rtl">
        <div className="flex items-center gap-2 mb-1.5 justify-end">
          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">الربط والتحليل العقاري الموحد</span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
        <h4 className="text-xs font-black text-white mb-2">عقارات نشطة في {activeCity}</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
            <span className="text-slate-500 block text-[9px] mb-0.5 font-bold">معروض المدينة</span>
            <span className="text-sm font-extrabold text-amber-400">
              {properties.filter(p => p.city === activeCity).length} عقار
            </span>
          </div>
          <div className="bg-slate-950/50 p-2 rounded-xl border border-slate-800/50">
            <span className="text-slate-500 block text-[9px] mb-0.5 font-bold">بمحيط الرؤية</span>
            <span className="text-sm font-extrabold text-white">
              {baseFilteredProperties.length} عقار
            </span>
          </div>
        </div>
      </div>

      {/* Floating Advanced Filter Sidebar Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="absolute top-24 left-4 z-40 w-80 max-h-[calc(100vh-250px)] overflow-y-auto bg-slate-950/95 backdrop-blur-md p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-right no-scrollbar"
            dir="rtl"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                تصفية متقدمة للنتائج
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Keyword Search Input */}
            <form onSubmit={handleLocationSearch} className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400">البحث عن مدينة أو حي أو شارع بالخريطة</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="مثال: الزمالك، الإسكندرية، الدقي..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-right"
                />
                <button type="submit" className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Operation Type selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400">نوع العملية</label>
              <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-900 rounded-xl border border-slate-800">
                {(['all', 'sale', 'rent'] as const).map(op => (
                  <button
                    key={op}
                    onClick={() => setFilterType(op)}
                    className={`py-1 rounded-lg text-[10px] font-black transition-all ${
                      filterType === op
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {op === 'all' ? 'الكل' : op === 'sale' ? 'للبيع' : 'للإيجار'}
                  </button>
                ))}
              </div>
            </div>

            {/* Property Type selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400">تصنيف العقار</label>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-900 rounded-xl border border-slate-800">
                {(['all', 'apartment', 'villa', 'land'] as const).map(pType => (
                  <button
                    key={pType}
                    onClick={() => setFilterPropertyType(pType)}
                    className={`py-1 rounded-lg text-[9px] font-black transition-all ${
                      filterPropertyType === pType
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pType === 'all' ? 'الكل' : pType === 'apartment' ? 'شقة' : pType === 'villa' ? 'فيلا' : 'أرض'}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400">نطاق السعر</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="من"
                  className="w-1/2 py-1.5 px-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="إلى"
                  className="w-1/2 py-1.5 px-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                />
              </div>
            </div>

            {/* Rooms Selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400">عدد الغرف الأدنى</label>
              <div className="grid grid-cols-5 gap-1 p-0.5 bg-slate-900 rounded-xl border border-slate-800">
                {(['all', '1', '2', '3', '4'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRoomsCount(r)}
                    className={`py-1 rounded-lg text-[9px] font-black transition-all ${
                      roomsCount === r
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r === 'all' ? 'الكل' : `+${r}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filters button */}
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterPropertyType('all');
                setMinPrice('');
                setMaxPrice('');
                setRoomsCount('all');
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-black border border-slate-800 rounded-xl transition-all"
            >
              إعادة تعيين كافة الفلاتر
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snapchat-style Floating Glass Navigation tab bar at the bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-35 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 select-none" dir="rtl">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'map'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>الخريطة</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'dashboard'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>لوحة التحكم</span>
        </button>

        {(currentUser.activeRole === 'admin' || currentUser.id === 'user_admin') && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>الأدمن</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'ai'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>المساعد الذكي</span>
        </button>

        <div className="w-[1px] h-6 bg-slate-800" />

        {/* User Role Quick Switcher Display inside bottom menu */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-[10px] font-black text-amber-400 flex items-center gap-1 transition-all"
          >
            <span>
              {currentUser.activeRole === 'buyer' ? 'مشتري' : currentUser.activeRole === 'seller' ? 'بائع' : currentUser.activeRole === 'landlord' ? 'مؤجر' : 'مستأجر'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Collapsible switch panel list */}
          <AnimatePresence>
            {showRoleSwitcher && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-12 left-0 w-36 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl space-y-1 text-right"
              >
                {currentUser.roles.map((role: any) => (
                  <button
                    key={role}
                    onClick={() => {
                      onUpdateUser({ activeRole: role });
                      setShowRoleSwitcher(false);
                    }}
                    className={`w-full px-2 py-1.5 rounded-lg text-[10px] font-bold text-right flex items-center justify-between transition-all ${
                      currentUser.activeRole === role
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{role === 'buyer' ? 'مشتري' : role === 'seller' ? 'بائع' : role === 'landlord' ? 'مؤجر' : 'مستأجر'}</span>
                    {currentUser.activeRole === role && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* "أعلن عن عقارك" Add Action button inside bottom navigation */}
        {(currentUser.roles.includes('seller') || currentUser.roles.includes('landlord')) && (
          <button
            onClick={() => setActiveTab('add')}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition-all shadow-md shadow-amber-500/10 hover:scale-[1.03]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">أعلن</span>
          </button>
        )}
      </div>

    </div>
  );
}
