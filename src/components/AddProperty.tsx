/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Property, OperationType, PropertyType, FinishingType } from '../types';
import { Upload, X, MapPin, Compass, ShieldCheck, Sparkles, Plus, Image as ImageIcon, ChevronRight, CheckCircle2, ZoomIn, ZoomOut, RefreshCw, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';

const PRESET_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80'
];

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

interface AddPropertyProps {
  onAddProperty: (property: Partial<Property>) => void;
  onCancel: () => void;
  activeCity: string;
}

export default function AddProperty({ onAddProperty, onCancel, activeCity }: AddPropertyProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OperationType>('sale');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [rooms, setRooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('2');
  const [floor, setFloor] = useState('2');
  const [yearBuilt, setYearBuilt] = useState('2025');
  const [finishing, setFinishing] = useState<FinishingType>('super-lux');
  const [direction, setDirection] = useState('شمالية');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(activeCity || 'القاهرة');

  // Toast state for custom alerts (since native alert() is blocked in iframes)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 5000);
  };

  // Country state
  const [country, setCountry] = useState<'Egypt' | 'Saudi' | 'Other'>(() => {
    const saudiCities = ['الرياض', 'جدة', 'مكة المكرمة', 'الدمام', 'السعودية (الكل)'];
    if (saudiCities.includes(activeCity)) {
      return 'Saudi';
    }
    return 'Egypt';
  });
  const [customCity, setCustomCity] = useState('');

  // Coordinates
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Map search and layer states
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isMapSearching, setIsMapSearching] = useState(false);
  const [mapLayerType, setMapLayerType] = useState<'satellite' | 'streets'>('satellite');
  const [isConfirmingAddress, setIsConfirmingAddress] = useState(false);

  // Map Refs for Step 3
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  // Automatically request GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setLat(parseFloat(userLat.toFixed(5)));
          setLng(parseFloat(userLng.toFixed(5)));

          // Find closest preset city
          let closestCity = 'الرياض';
          let minDist = Infinity;
          Object.entries(CITY_COORDINATES).forEach(([cName, coords]) => {
            const dist = Math.hypot(userLat - coords.lat, userLng - coords.lng);
            if (dist < minDist) {
              minDist = dist;
              closestCity = cName;
            }
          });
          setCity(closestCity);
        },
        (error) => {
          console.warn("User geolocation unavailable on mount: ", error.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Update map when step === 3 or selected city changes or layer type changes
  useEffect(() => {
    if (step !== 3 || !mapContainerRef.current) return;

    // Center map around either current lat/lng or the selected city coordinates
    const initialLat = lat || CITY_COORDINATES[city]?.lat || 30.0444;
    const initialLng = lng || CITY_COORDINATES[city]?.lng || 31.2357;

    // Save initial coordinates if they are currently null so they aren't empty on submit
    if (lat === null || lng === null) {
      setLat(initialLat);
      setLng(initialLng);
    }

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15, // zoom in a bit more for satellite buildings view
      zoomControl: false,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // Dynamic Tile Layer setup based on mapLayerType
    if (mapLayerType === 'satellite') {
      // 1. ESRI World Imagery Base Satellite
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
      }).addTo(map);

      // 2. ESRI World Transportation Overlay (Adds street grid, roads, and lines on top of imagery)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);

      // 3. ESRI World Boundaries and Places Overlay (Adds text labels for street names, cities, districts, landmarks)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);
    }

    // Marker Setup
    const pinIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 bg-amber-500/20 rounded-full animate-ping"></div>
          <div class="w-5 h-5 bg-amber-500 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-[10px] text-slate-950 font-black">
            ع
          </div>
        </div>
      `,
      className: 'mini-marker-pin',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([initialLat, initialLng], { icon: pinIcon, draggable: true }).addTo(map);
    markerInstanceRef.current = marker;

    // Handle map clicks to update pin location
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      const rLat = parseFloat(clickLat.toFixed(6));
      const rLng = parseFloat(clickLng.toFixed(6));
      setLat(rLat);
      setLng(rLng);
      marker.setLatLng([rLat, rLng]);
    });

    // Handle marker dragging
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setLat(parseFloat(position.lat.toFixed(6)));
      setLng(parseFloat(position.lng.toFixed(6)));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [step, mapLayerType]);

  // Handle map coordinates search using OpenStreetMap Nominatim
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;
    setIsMapSearching(true);
    try {
      const countrySuffix = country === 'Egypt' ? ' Egypt' : country === 'Saudi' ? ' Saudi Arabia' : '';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery + countrySuffix)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat: sLat, lon: sLng, display_name } = data[0];
        const numLat = parseFloat(sLat);
        const numLng = parseFloat(sLng);
        setLat(numLat);
        setLng(numLng);
        setAddress(display_name);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([numLat, numLng], 14);
        }
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([numLat, numLng]);
        }
      } else {
        showToast('لم يتم العثور على هذا الموقع، يرجى المحاولة بصيغة أخرى.', 'error');
      }
    } catch (err) {
      console.error('AddProperty Map Search failed:', err);
    } finally {
      setIsMapSearching(false);
    }
  };

  // Handle flying map to selected city's preset coords
  useEffect(() => {
    if (step === 3 && mapInstanceRef.current) {
      const coords = CITY_COORDINATES[city];
      if (coords) {
        setLat(coords.lat);
        setLng(coords.lng);
        mapInstanceRef.current.setView([coords.lat, coords.lng], 13);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([coords.lat, coords.lng]);
        }
      }
    }
  }, [city, step]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = parseFloat(position.coords.latitude.toFixed(6));
          const userLng = parseFloat(position.coords.longitude.toFixed(6));
          setLat(userLat);
          setLng(userLng);
          
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([userLat, userLng], 14);
          }
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setLatLng([userLat, userLng]);
          }
          showToast('تم تحديد موقعك الحالي بنجاح!', 'success');
        },
        (error) => {
          showToast("تعذر الحصول على موقعك الحالي. تأكد من تفعيل صلاحيات الـ GPS بالمتصفح.", 'error');
        }
      );
    } else {
      showToast("جهازك أو متصفحك لا يدعم تحديد الموقع الجغرافي GPS.", 'error');
    }
  };

  const handleConfirmAndPinAddress = async () => {
    if (lat === null || lng === null) {
      showToast('يرجى تحديد الموقع على الخريطة أولاً.', 'info');
      return;
    }
    setIsConfirmingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        showToast(`تم تأكيد وتثبيت العنوان بنجاح:\n${data.display_name}`, 'success');
      } else {
        showToast('تم تثبيت الإحداثيات بنجاح! يمكنك كتابة اسم الشارع يدوياً في حقل العنوان.', 'success');
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      showToast('تم تثبيت الإحداثيات بنجاح! يمكنك كتابة اسم الشارع يدوياً في حقل العنوان.', 'success');
    } finally {
      setIsConfirmingAddress(false);
    }
  };

  // Drag & drop images state (Images & videos are optional)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  // Features list
  const [featureInput, setFeatureInput] = useState('');
  const [features, setFeatures] = useState<string[]>([
    'تكييف راكب', 'موقف خاص لقبو العمارة', 'دخول ذكي ورقمي'
  ]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // File Input Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Process files
  const processImageFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast('يرجى اختيار ملفات صور صالحة فقط (PNG, JPG, JPEG).', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const processVideoFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('video/')) {
      showToast('يرجى اختيار ملف فيديو صالح فقط (MP4, MOV, WebM).', 'error');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      showToast('حجم ملف الفيديو كبير نوعاً ما. نوصي باختيار فيديو أصغر من 50 ميجابايت لتصفح سريع.', 'info');
    }

    setIsVideoUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setVideoUrl(event.target!.result as string);
      }
      setIsVideoUploading(false);
    };
    reader.onerror = () => {
      showToast('حدث خطأ أثناء قراءة ملف الفيديو.', 'error');
      setIsVideoUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  const addManualImage = () => {
    const nextMockImg = PRESET_MOCK_IMAGES[uploadedImages.length % PRESET_MOCK_IMAGES.length];
    setUploadedImages(prev => [...prev, nextMockImg]);
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoUrl('');
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFeatures(prev => [...prev, featureInput.trim()]);
    setFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index));
  };

  // AI Description Generator (Simulating backend API)
  const handleAiOptimize = async () => {
    if (!title) return;
    setIsAiGenerating(true);
    
    try {
      const response = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          propertyType,
          area: parseFloat(area || '150'),
          rooms: parseInt(rooms),
          bathrooms: parseInt(bathrooms),
          finishing
        })
      });
      const data = await response.json();
      if (data.optimizedDescription) {
        setDescription(data.optimizedDescription);
        if (data.suggestedTitle) {
          setTitle(data.suggestedTitle);
        }
      }
    } catch (e) {
      setDescription(`فرصة عقارية ممتازة! ${propertyType === 'apartment' ? 'شقة' : 'فيلا'} راقية ومميزة في مدينة ${city}. المساحة الكلية ${area || 180} متر مربع بتشطيبات ممتازة ونظام كفاءة طاقة حديث. مناسبة جداً للسكن العائلي الهادئ والاستثماري.`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleDirectPublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !area) {
      showToast('الرجاء إدخال الحقول الأساسية أولاً: العنوان الإعلاني، السعر المطلوب، والمساحة.', 'error');
      return;
    }

    const resolvedCity = (city === 'أخرى') ? (customCity || (country === 'Egypt' ? 'القاهرة' : 'الرياض')) : city;
    const finalAddress = address.trim() || `شارع رئيسي، ${resolvedCity}`;
    const defaultCoords = CITY_COORDINATES[resolvedCity] || { lat: 30.0444, lng: 31.2357 };
    const finalLat = lat || defaultCoords.lat;
    const finalLng = lng || defaultCoords.lng;

    const payload: Partial<Property> = {
      title,
      description: description || `عقار جديد معروض للـ ${type === 'sale' ? 'بيع' : 'إيجار'} بمساحة ${area}م² يضم كافة المرافق والخدمات.`,
      type,
      propertyType,
      price: parseFloat(price),
      area: parseFloat(area),
      rooms: parseInt(rooms),
      bathrooms: parseInt(bathrooms),
      floor: parseInt(floor),
      yearBuilt: parseInt(yearBuilt),
      finishing,
      direction,
      address: finalAddress,
      city: resolvedCity,
      lat: finalLat,
      lng: finalLng,
      images: uploadedImages.length > 0 ? uploadedImages : [PRESET_MOCK_IMAGES[Math.floor(Math.random() * PRESET_MOCK_IMAGES.length)]],
      videoUrl: videoUrl || undefined,
      ownerId: 'user_1',
      ownerName: 'أحمد القحطاني',
      ownerPhone: '+966501234567',
      features,
      nearPlaces: [
        { type: 'school', name: 'مدارس الحي القريبة المعترف بها', distance: 0.9 },
        { type: 'hospital', name: 'مجمع العيادات الطبية الشامل', distance: 1.4 },
        { type: 'mall', name: 'المركز التجاري والهايبرماركت', distance: 2.2 },
        { type: 'mosque', name: 'مسجد الحي الجامع الكبير', distance: 0.3 }
      ]
    };

    onAddProperty(payload);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !area) {
      showToast('الرجاء إدخال الحقول الأساسية: العنوان، السعر، والمساحة.', 'error');
      return;
    }

    const resolvedCity = (city === 'أخرى') ? (customCity || (country === 'Egypt' ? 'القاهرة' : 'الرياض')) : city;
    const finalAddress = address.trim() || `شارع رئيسي، ${resolvedCity}`;
    const defaultCoords = CITY_COORDINATES[resolvedCity] || { lat: 30.0444, lng: 31.2357 };
    const finalLat = lat || defaultCoords.lat;
    const finalLng = lng || defaultCoords.lng;

    const payload: Partial<Property> = {
      title,
      description: description || `عقار جديد معروض للـ ${type === 'sale' ? 'بيع' : 'إيجار'} بمساحة ${area}م² يضم كافة المرافق والخدمات.`,
      type,
      propertyType,
      price: parseFloat(price),
      area: parseFloat(area),
      rooms: parseInt(rooms),
      bathrooms: parseInt(bathrooms),
      floor: parseInt(floor),
      yearBuilt: parseInt(yearBuilt),
      finishing,
      direction,
      address: finalAddress,
      city: resolvedCity,
      lat: finalLat,
      lng: finalLng,
      images: uploadedImages.length > 0 ? uploadedImages : [PRESET_MOCK_IMAGES[Math.floor(Math.random() * PRESET_MOCK_IMAGES.length)]],
      videoUrl: videoUrl || undefined,
      ownerId: 'user_1',
      ownerName: 'أحمد القحطاني',
      ownerPhone: '+966501234567',
      features,
      nearPlaces: [
        { type: 'school', name: 'مدارس الحي القريبة المعترف بها', distance: 0.9 },
        { type: 'hospital', name: 'مجمع العيادات الطبية الشامل', distance: 1.4 },
        { type: 'mall', name: 'المركز التجاري والهايبرماركت', distance: 2.2 },
        { type: 'mosque', name: 'مسجد الحي الجامع الكبير', distance: 0.3 }
      ]
    };

    onAddProperty(payload);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-right" dir="rtl">
      
      {/* Header step guide */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white">إضافة إعلان عقاري ذكي</h2>
          <p className="text-xs text-slate-400">يرجى استيفاء البيانات لتدقيق الإعلان من الإدارة وتنشيطه بالخريطة التفاعلية</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${step === 1 ? 'bg-amber-500 text-slate-950 scale-105 shadow-md' : 'bg-slate-800 text-slate-400'}`}>1. بيانات العقار</span>
          <span className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${step === 2 ? 'bg-amber-500 text-slate-950 scale-105 shadow-md' : 'bg-slate-800 text-slate-400'}`}>2. الصور والملفات</span>
          <span className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${step === 3 ? 'bg-amber-500 text-slate-950 scale-105 shadow-md' : 'bg-slate-800 text-slate-400'}`}>3. تحديد الموقع</span>
        </div>
      </div>

      {/* Information Banner for Direct Publishing */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-6 flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-emerald-300">نظام النشر المباشر السريع مفعل الآن! 🚀</h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            يمكنك الآن تعبئة تفاصيل العقار ونشره <strong>فوراً</strong> بنقرة واحدة بالضغط على زر <strong>"نشر مباشر الآن (تخطي الخريطة)"</strong>، دون الحاجة للوصول إلى خطوة تحديد الخريطة أو خدمات GPS أو أي متطلبات لجوجل كلاود. سنقوم تلقائياً بتحديد الإحداثيات بناءً على مدينتك لتوفير وقتك.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">نوع العملية</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('sale')}
                    className={`py-3 rounded-xl font-extrabold text-xs transition-all ${type === 'sale' ? 'bg-red-500/20 border-2 border-red-500 text-red-300' : 'bg-slate-800 text-slate-400'}`}
                  >
                    للبيع
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('rent')}
                    className={`py-3 rounded-xl font-extrabold text-xs transition-all ${type === 'rent' ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-300' : 'bg-slate-800 text-slate-400'}`}
                  >
                    للإيجار
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">نوع العقار</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 text-right font-semibold"
                >
                  <option value="apartment">شقة سكنية</option>
                  <option value="villa">فيلا مستقلة / دوبلكس</option>
                  <option value="land">أرض ساحلية / سكنية</option>
                  <option value="commercial">مقر تجاري / صالات عرض</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">الدولة</label>
                <select
                  value={country}
                  onChange={(e) => {
                    const selectedCountry = e.target.value as 'Egypt' | 'Saudi' | 'Other';
                    setCountry(selectedCountry);
                    if (selectedCountry === 'Egypt') {
                      setCity('القاهرة');
                    } else if (selectedCountry === 'Saudi') {
                      setCity('الرياض');
                    } else {
                      setCity('');
                    }
                  }}
                  className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="Egypt">جمهورية مصر العربية (مصر)</option>
                  <option value="Saudi">المملكة العربية السعودية</option>
                  <option value="Other">دولة أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">المدينة</label>
                {country === 'Egypt' ? (
                  <select
                    value={city}
                    onChange={(e) => {
                      const selectedCity = e.target.value;
                      setCity(selectedCity);
                      if (selectedCity !== 'أخرى') {
                        setCustomCity('');
                      }
                    }}
                    className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="مصر (الكل)">مصر (عامة)</option>
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="الساحل الشمالي">الساحل الشمالي</option>
                    <option value="المنصورة">المنصورة</option>
                    <option value="الغردقة">الغردقة</option>
                    <option value="أخرى">مدينة أخرى (كتابة يدوية)</option>
                  </select>
                ) : country === 'Saudi' ? (
                  <select
                    value={city}
                    onChange={(e) => {
                      const selectedCity = e.target.value;
                      setCity(selectedCity);
                      if (selectedCity !== 'أخرى') {
                        setCustomCity('');
                      }
                    }}
                    className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="السعودية (الكل)">السعودية (عامة)</option>
                    <option value="الرياض">الرياض</option>
                    <option value="جدة">جدة</option>
                    <option value="مكة المكرمة">مكة المكرمة</option>
                    <option value="الدمام">الدمام</option>
                    <option value="أخرى">مدينة أخرى (كتابة يدوية)</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="اكتب اسم المدينة والدولة"
                    className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                )}
              </div>

              {((country === 'Egypt' || country === 'Saudi') && city === 'أخرى') && (
                <div>
                  <label className="block text-xs text-slate-300 font-bold mb-2">اسم المدينة الأخرى</label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="اكتب اسم المدينة هنا"
                    className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">السعر المطلوب</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="مثال: 1500000"
                  className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">المساحة الإجمالية (م²)</label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="مثال: 320"
                  className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">عدد الغرف</label>
                <input
                  type="number"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">دورات المياه</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">الطابق / الدور</label>
                <input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-bold mb-2">مستوى التشطيب</label>
                <select
                  value={finishing}
                  onChange={(e) => setFinishing(e.target.value as FinishingType)}
                  className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none"
                >
                  <option value="super-lux">سوبر ديلوكس / لوكس ذكي</option>
                  <option value="lux">تشطيب ديلوكس فاخر</option>
                  <option value="normal">تشطيب عادي / معقول</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs text-slate-300 font-bold">العنوان الإعلاني للعقار</label>
                <button
                  type="button"
                  onClick={handleAiOptimize}
                  disabled={!area || !finishing}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20 transition-all disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  تحسين وصياغة العنوان والوصف بالذكاء الاصطناعي
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: شقة ذكية للبيع بحي الزمالك بإطلالة نيلية مباشرة"
                className="w-full py-3 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-bold mb-2">وصف تفصيلي كامل للعقار للمستثمرين</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="تحدث بالتفصيل عن العقار، الواجهة، الخدمات القريبة، مزايا الخصوصية..."
                rows={5}
                className="w-full bg-slate-850 border border-slate-700 rounded-2xl p-4 text-xs text-slate-100 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-bold mb-2">المميزات والتسهيلات الخاصة بالوحدة</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="أضف ميزة جديدة (مثال: مسبح دافئ)"
                  className="flex-1 py-2.5 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 bg-slate-800 hover:bg-slate-750 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  أضف ميزة
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {features.map((feat, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700/50"
                  >
                    {feat}
                    <button type="button" onClick={() => handleRemoveFeature(i)} className="text-red-400 hover:text-red-300 text-[10px] font-bold">✕</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800/40 mt-4">
              <button
                type="button"
                onClick={handleDirectPublish}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/15 hover:scale-[1.02] active:scale-95"
              >
                🚀 نشر مباشر الآن (تخطي الخريطة)
              </button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/15"
              >
                الخطوة التالية (الصور والملفات)
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Photo Drop and drag */}
        {step === 2 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl" dir="rtl">
            
            {/* Hidden native inputs for mobile file upload */}
            <input
              type="file"
              ref={imageInputRef}
              onChange={(e) => processImageFiles(e.target.files)}
              multiple
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              onChange={(e) => processVideoFile(e.target.files)}
              accept="video/*"
              className="hidden"
            />

            <div>
              <h3 className="text-base font-bold text-white mb-2">إضافة صور العقار ومقطع الفيديو</h3>
              <p className="text-xs text-slate-400">يمكنك رفع الصور والفيديو الحقيقية مباشرة من هاتفك المحمول أو جهازك لتسهيل معاينة العقار.</p>
            </div>

            {/* Images Zone */}
            <div className="space-y-3">
              <label className="block text-xs text-slate-300 font-bold">صور العقار (يمكنك اختيار عدة صور)</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => imageInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                  isDraggingOver 
                    ? 'border-amber-500 bg-amber-500/5 text-amber-300' 
                    : 'border-slate-700 bg-slate-850 text-slate-400 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-amber-400 mb-4 animate-pulse">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">اضغط هنا أو اسحب الصور لرفعها من الهاتف مباشرة</h4>
                <p className="text-xs text-slate-400 mb-4">يدعم جميع صيغ الصور (PNG, JPG, JPEG)</p>
                
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      imageInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition-all inline-flex items-center gap-1 shadow-md shadow-amber-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    اختيار صور من الهاتف
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addManualImage();
                    }}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-650 text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    إضافة عينة صور جاهزة للتجربة
                  </button>
                </div>
              </div>
            </div>

            {uploadedImages.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">الصور المرفقة حالياً ({uploadedImages.length})</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden group border border-slate-700 h-24">
                      <img src={img} alt="uploaded" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(idx)}
                          className="p-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                          title="حذف الملف"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-amber-400">
                        {idx === 0 ? 'صورة الغلاف' : `صورة ${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Zone - File Upload and URL support */}
            <div className="space-y-3 pt-2 border-t border-slate-800/60">
              <label className="block text-xs text-slate-300 font-bold">مقطع الفيديو التعريفي للعقار (اختياري)</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Option A: Upload from Phone */}
                <div className="bg-slate-850 border border-slate-750 p-5 rounded-2xl flex flex-col justify-between items-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white mb-1">رفع فيديو من الهاتف مباشرة</h5>
                    <p className="text-[10px] text-slate-400">قم بتصوير جولة حية للعقار ورفعها مباشرة</p>
                  </div>
                  <button
                    type="button"
                    disabled={isVideoUploading}
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full py-2 bg-slate-700 hover:bg-slate-650 text-white rounded-xl text-xs font-semibold transition-all"
                  >
                    {isVideoUploading ? 'جاري التحميل وقراءة الفيديو...' : 'اختر مقطع فيديو'}
                  </button>
                </div>

                {/* Option B: Direct URL */}
                <div className="bg-slate-850 border border-slate-750 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="text-xs font-bold text-white mb-1">أو إدخال رابط فيديو خارجي</h5>
                    <p className="text-[10px] text-slate-400">إذا كان الفيديو مرفوعاً على يوتيوب أو سيرفر خاص</p>
                  </div>
                  <input
                    type="text"
                    value={videoUrl.startsWith('data:') ? '' : videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="أدخل رابط فيديو (https://...)"
                    className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                  />
                  <span className="text-[9px] text-slate-500 block">يفضل استخدام روابط يوتيوب أو روابط مباشرة بصيغة MP4</span>
                </div>
              </div>

              {/* Video Preview Player */}
              {videoUrl && (
                <div className="mt-4 bg-slate-850 border border-slate-750 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      مقطع الفيديو جاهز للمعاينة
                    </span>
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      إزالة الفيديو
                    </button>
                  </div>
                  <video
                    src={videoUrl}
                    controls
                    className="w-full max-h-48 rounded-xl object-cover bg-black"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold"
              >
                الرجوع للبيانات
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDirectPublish}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/15 hover:scale-[1.02] active:scale-95"
                >
                  🚀 نشر مباشر الآن (تخطي الخريطة)
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/15"
                >
                  الخطوة التالية (تحديد الموقع)
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* STEP 3: Pin GPS coordinate selector */}
        {step === 3 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl text-right">
            
            <div>
              <h3 className="text-base font-bold text-white mb-2">تحديد موقع العقار على الخريطة</h3>
              <p className="text-xs text-slate-400 font-medium">انقر في أي مكان على لوحة الخريطة لتحديد دبوس الموقع بدقة واستخراج إحداثيات GPS (العرض والطول).</p>
            </div>

            <div className="relative rounded-2xl border border-slate-700 h-72 bg-slate-950 overflow-hidden shadow-inner flex flex-col">
              {/* Floating Map Search Box inside Map Container wrapper */}
              <div
                className="absolute top-4 left-4 right-4 z-[1000] flex gap-2 bg-slate-900/90 backdrop-blur p-2 rounded-xl border border-slate-700 shadow-lg"
                dir="rtl"
              >
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleMapSearch(e as any);
                    }
                  }}
                  placeholder="ابحث عن أي موقع أو حي (مثال: الزمالك، المهندسين)..."
                  className="flex-1 py-1.5 px-3 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-right"
                />
                <button
                  type="button"
                  onClick={(e) => handleMapSearch(e as any)}
                  disabled={isMapSearching}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 text-xs font-bold rounded-lg transition-all"
                >
                  {isMapSearching ? 'جاري...' : 'بحث بالخريطة'}
                </button>
              </div>

              {/* Leaflet Live Map selector block */}
              <div 
                ref={mapContainerRef} 
                className="w-full h-full min-h-[250px] relative z-0" 
              />
              
              {/* GPS Auto-location Button (Bottom-Left) */}
              <div className="absolute bottom-4 left-4 z-[1000]">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                  title="استخدام موقعي الحالي بالـ GPS"
                >
                  <Navigation className="w-3.5 h-3.5 fill-current animate-pulse" />
                  <span>تحديد موقعي التلقائي (GPS)</span>
                </button>
              </div>

              {/* Satellite vs. Streets Map Layer Type Switcher (Bottom-Right) */}
              <div className="absolute bottom-4 right-4 z-[1000] flex gap-1 bg-slate-900/90 backdrop-blur p-1 rounded-lg border border-slate-700 shadow-lg">
                <button
                  type="button"
                  onClick={() => setMapLayerType('satellite')}
                  className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${
                    mapLayerType === 'satellite'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  قمر صناعي (هجين)
                </button>
                <button
                  type="button"
                  onClick={() => setMapLayerType('streets')}
                  className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all ${
                    mapLayerType === 'streets'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  خريطة شوارع
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-bold">خط العرض (Latitude)</label>
                  <input
                    type="number"
                    value={lat ?? ''}
                    onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
                    step="0.0001"
                    className="w-full py-2.5 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-300 text-left font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-bold">خط الطول (Longitude)</label>
                  <input
                    type="number"
                    value={lng ?? ''}
                    onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)}
                    step="0.0001"
                    className="w-full py-2.5 px-4 bg-slate-850 border border-slate-700 rounded-xl text-xs text-slate-300 text-left font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="block text-xs text-slate-300 font-bold">العنوان وتأكيد الموقع الجغرافي</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثال: شارع النيل، الزمالك، بجوار فندق شهير"
                    className="flex-1 py-2.5 px-4 bg-slate-900 border border-slate-750 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmAndPinAddress}
                    disabled={isConfirmingAddress || lat === null}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {isConfirmingAddress ? 'جاري الاستعلام...' : 'تأكيد وتثبيت العنوان'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  * اضغط على زر <strong className="text-emerald-400">"تأكيد وتثبيت العنوان"</strong> لتقوم البوابة تلقائياً باستقصاء العنوان التفصيلي (الشارع والحي والرمز البريدي) من الدبوس المثبت على الخريطة وملء الحقل لراحتك.
                </p>
              </div>
            </div>

            <div className="flex gap-3 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/80">
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                أتعهد بصفتي مالك العقار أو وكيله الشرعي بصحة كافة البيانات المذكورة وتفاصيل الموقع الجغرافي، وأتحمل المسؤولية القانونية كاملة عن صحة معلومات وصكوك التمليك.
              </p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl text-xs font-bold"
              >
                الرجوع للصور
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 rounded-xl text-xs font-semibold"
                >
                  إلغاء التقديم
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/15"
                >
                  تأكيد وإرسال الإعلان للمراجعة
                </button>
              </div>
            </div>

          </div>
        )}

      </form>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-md w-[90%] bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-bounce">
          <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 animate-pulse' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
          <span className="text-xs text-slate-100 font-bold flex-1 text-right">{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-200 text-xs font-black p-1">✕</button>
        </div>
      )}
    </div>
  );
}
