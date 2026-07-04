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

    // Force invalidating layout size after a tiny tick to make sure Leaflet measures the container correctly
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

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
    <div id="interactive-map-screen" className="flex flex-col h-full w-full bg-slate-950 text-white" dir="rtl">
      
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
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* TOP PANEL: THE MAP (Nisf Al-Shashah) */}
      <div className="relative h-[40vh] md:h-[45vh] w-full border-b border-slate-800 bg-slate-900 overflow-hidden shrink-0">
        {/* Actual OpenStreetMap Leaflet Container */}
        <div 
          ref={containerRef}
          id="leaflet-live-map"
          className="w-full h-full z-0 relative"
        />

        {/* Floating Theme Selector on top-left of the map */}
        <div className="absolute top-3 left-3 z-20 flex gap-1 p-0.5 bg-slate-900/85 backdrop-blur-md rounded-xl border border-slate-800/80 shadow-lg">
          {([
            { id: 'satellite', label: '🛰️ قمر صناعي' },
            { id: 'snap', label: '🗺️ خريطة' },
            { id: 'classic', label: 'كلاسيكي' }
          ] as const).map(style => (
            <button
              key={style.id}
              onClick={() => setMapTheme(style.id)}
              className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all whitespace-nowrap ${
                mapTheme === style.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>

        {/* Floating Zoom / Geolocation Coordinates Controls on Right Side */}
        <div className="absolute bottom-4 right-3 z-20 flex flex-col gap-1.5">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-8 h-8 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-8 h-8 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={handleLocateUser}
            className="w-8 h-8 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
            title="تحديد موقعي الحالي GPS"
          >
            <Navigation className="w-4 h-4 text-amber-400" />
          </button>
          <button
            onClick={() => handleCityChange(activeCity)}
            className="w-8 h-8 bg-slate-900/85 backdrop-blur border border-slate-800 rounded-lg flex items-center justify-center text-white hover:bg-slate-800 shadow-xl active:scale-95 transition-all"
            title="إعادة تركيز"
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Floating HUD Analytics (Bottom Left) */}
        <div className="absolute bottom-4 left-3 z-20 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800/80 shadow-lg text-right hidden sm:block">
          <div className="flex items-center gap-1.5 justify-end mb-0.5">
            <span className="text-[8px] font-bold text-slate-400">عقارات نشطة في {activeCity}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="text-[10px] font-extrabold text-amber-400">
            {properties.filter(p => p.city === activeCity).length} عقار بالمدينة
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: THE CONTROL CENTER AND NAVIGATION BUTTONS */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden relative">
        
        {/* SECTION 1: THE CORE TAB BAR (PROUDLY PLACED & CANNOT BE COVERED BY THE MAP) */}
        <div className="bg-slate-900/95 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar shadow-md shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                activeTab === 'map'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>الخريطة</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>لوحة التحكم</span>
            </button>

            {(currentUser.activeRole === 'admin' || currentUser.id === 'user_admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  activeTab === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>الأدمن</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                activeTab === 'ai'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>المساعد الذكي</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Role switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold text-amber-400 flex items-center gap-1 transition-all"
              >
                <span>
                  {currentUser.activeRole === 'buyer' ? 'مشتري' : currentUser.activeRole === 'seller' ? 'بائع' : currentUser.activeRole === 'landlord' ? 'مؤجر' : 'مستأجر'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <AnimatePresence>
                {showRoleSwitcher && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-10 left-0 w-36 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-2xl space-y-1 text-right z-50"
                  >
                    {currentUser.roles.map((role: any) => (
                      <button
                        key={role}
                        onClick={() => {
                          onUpdateUser({ activeRole: role });
                          setShowRoleSwitcher(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-right flex items-center justify-between transition-all ${
                          currentUser.activeRole === role
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'text-slate-300 hover:bg-slate-800'
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

            {/* "أعلن" Add Button */}
            {(currentUser.roles.includes('seller') || currentUser.roles.includes('landlord')) && (
              <button
                onClick={() => setActiveTab('add')}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition-all hover:scale-105 shadow-md shadow-amber-500/10"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>أعلن</span>
              </button>
            )}
          </div>
        </div>

        {/* SECTION 2: SCROLLABLE ACTIVE CONTROL PANEL & PROPERTY RESULT GRID */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-slate-950/40">
          
          {/* A. City Quick Slider */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-black text-slate-400 flex items-center gap-1.5 justify-start">
              <Compass className="w-3.5 h-3.5 text-amber-500" />
              اختر المدينة للتركيز الفوري:
            </h3>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {Object.keys(CITY_COORDINATES).map(city => (
                <button
                  key={city}
                  onClick={() => handleCityChange(city)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap ${
                    activeCity === city
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10 scale-[1.02]'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-750'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* B. Two Column Filter & Search Panel */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 text-right">
            
            {/* Search inputs */}
            <div className="md:col-span-2 space-y-1">
              <span className="block text-[10px] font-bold text-slate-400">البحث بالاسم أو المنطقة:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="مثال: التجمع الخامس، الرياض، الدقي..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <button onClick={handleLocationSearch} className="absolute left-2.5 top-2.5 text-slate-400 hover:text-white">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Price Filter inputs */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-slate-400">نطاق السعر (ج.م):</span>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="من"
                  className="w-1/2 py-1 px-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 text-center"
                />
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="إلى"
                  className="w-1/2 py-1 px-2 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-200 focus:outline-none focus:border-amber-500 text-center"
                />
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-end gap-1.5">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  showFilters
                    ? 'bg-amber-500 border-amber-500 text-slate-950 font-black'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>خيارات أكثر</span>
              </button>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterPropertyType('all');
                  setMinPrice('');
                  setMaxPrice('');
                  setRoomsCount('all');
                }}
                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[10px] font-bold rounded-xl transition-all"
                title="إعادة تعيين الفلاتر"
              >
                إعادة ضبط
              </button>
            </div>
          </div>

          {/* C. Interactive Filter Expansion Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden text-right"
              >
                {/* Operation type selector */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400">نوع العملية:</span>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800">
                    {(['all', 'sale', 'rent'] as const).map(op => (
                      <button
                        key={op}
                        onClick={() => setFilterType(op)}
                        className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                          filterType === op
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {op === 'all' ? 'الكل' : op === 'sale' ? 'للبيع' : 'للإيجار'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type selection */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400">تصنيف العقار:</span>
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800">
                    {(['all', 'apartment', 'villa', 'land'] as const).map(pType => (
                      <button
                        key={pType}
                        onClick={() => setFilterPropertyType(pType)}
                        className={`py-1 rounded-lg text-[9px] font-bold transition-all ${
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

                {/* Rooms Selector */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-slate-400">الحد الأدنى للغرف:</span>
                  <div className="grid grid-cols-5 gap-1 p-0.5 bg-slate-950 rounded-xl border border-slate-800">
                    {(['all', '1', '2', '3', '4'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setRoomsCount(r)}
                        className={`py-1 rounded-lg text-[9px] font-bold transition-all ${
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* D. Beautiful Interactive Property List (Matching Current Map View) */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-amber-500 rounded-full" />
                العقارات المكتشفة بالمنطقة المحددة ({baseFilteredProperties.length}):
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">انقر للتركيز وعرض التفاصيل</span>
            </div>

            {baseFilteredProperties.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/30 border border-slate-800 rounded-2xl text-slate-400 text-xs">
                لا توجد عقارات متاحة ضمن نطاق رؤية الخريطة وفلاتر البحث الحالية.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-6">
                {baseFilteredProperties.map(p => {
                  const isSelected = selectedProperty?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        // Fly to coordinate and select
                        if (mapRef.current) {
                          mapRef.current.flyTo([p.lat, p.lng], 14);
                        }
                        onSelectProperty(p);
                        setActivePreviewProperty(p);
                      }}
                      className={`group relative p-3 rounded-2xl border transition-all duration-300 cursor-pointer text-right flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-950/20 border-amber-500/70 shadow-lg shadow-amber-500/5'
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      {/* Image representation & badges */}
                      <div className="relative w-full h-28 rounded-xl overflow-hidden mb-2">
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase text-white shadow-md ${
                            p.type === 'sale' ? 'bg-red-600' : 'bg-blue-600'
                          }`}>
                            {p.type === 'sale' ? 'للبيع' : 'للإيجار'}
                          </span>
                          {p.isFeatured && (
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-amber-500 text-slate-950 flex items-center gap-0.5 shadow-md">
                              <Sparkles className="w-2.5 h-2.5" />
                              مميز
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-950/80 backdrop-blur rounded-lg text-[9px] font-black text-amber-400">
                          {p.price.toLocaleString()} ج.م
                        </div>
                      </div>

                      {/* Property text metadata */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-white group-hover:text-amber-400 transition-colors line-clamp-1">{p.title}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{p.location}</p>
                        <div className="flex gap-2.5 text-[9px] text-slate-500 font-bold pt-1 border-t border-slate-800/60">
                          <span>🚪 {p.rooms} غرف</span>
                          <span>📐 {p.area} م²</span>
                          <span>🏙️ {p.city}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
