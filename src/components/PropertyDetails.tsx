/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Property, Message } from '../types';
import { ArrowRight, Phone, MessageSquare, Share2, Heart, CheckCircle2, MapPin, Eye, Calendar, ShieldCheck, HelpCircle, School, Hospital, Landmark, Compass, Sparkles, Send, Play, Camera, Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PropertyDetailsProps {
  property: Property;
  onBack: () => void;
  onSendMessage: (text: string, propertyId: string) => void;
  onAddToFavorites: (propertyId: string) => void;
  isFavorite: boolean;
}

export default function PropertyDetails({
  property,
  onBack,
  onSendMessage,
  onAddToFavorites,
  isFavorite
}: PropertyDetailsProps) {
  const [activeImage, setActiveImage] = useState<string>(property.images[0]);
  const [viewMode, setViewMode] = useState<'gallery' | 'video'>('gallery');
  const [copiedLink, setCopiedLink] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);

  // Simulate sharing copy link
  const handleShare = () => {
    setCopiedLink(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Simulate WhatsApp direct link
  const handleWhatsApp = () => {
    const text = encodeURIComponent(`مرحباً ${property.ownerName}، أنا مهتم بعقارك المعلن عنه في منصة عقاراتنا الذكية: ${property.title} بسعر ${property.price.toLocaleString()} ر.س. هل هو متاح؟`);
    window.open(`https://wa.me/${property.ownerPhone.replace('+', '')}?text=${text}`, '_blank');
  };

  // Send message
  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    onSendMessage(newMessageText, property.id);
    setNewMessageText('');
    setMessageSentSuccess(true);
    setTimeout(() => setMessageSentSuccess(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" dir="rtl">
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-6 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-all text-sm font-semibold"
      >
        <ArrowRight className="w-4 h-4" />
        الرجوع إلى الخريطة التفاعلية
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Image Media Gallery & Detailed Information */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Visual Display Block */}
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 h-[450px] shadow-2xl">
            
            {/* 1. Gallery Render Mode */}
            {viewMode === 'gallery' && (
              <img
                src={activeImage}
                alt={property.title}
                className="w-full h-full object-cover transition-all duration-500"
              />
            )}

            {/* 2. Video Render Mode */}
            {viewMode === 'video' && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
                <div className="text-center p-6 space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Play className="w-8 h-8 fill-current" />
                  </div>
                  <h4 className="text-lg font-bold">معاينة فيديو تفصيلي للمنشأة</h4>
                  <p className="text-slate-400 text-xs">
                    استمتع بجولة افتراضية عالية الدقة للمساحات الداخلية والغرف ومستوى التشطيب. يتم تحميل الفيديو...
                  </p>
                  <video
                    src={property.videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-with-minimalist-furniture-41584-large.mp4'}
                    controls
                    autoPlay
                    muted
                    loop
                    className="w-full h-44 rounded-2xl object-cover border border-slate-700 shadow-md mt-4"
                  />
                </div>
              </div>
            )}

            {/* Float tags overlays */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className={`text-xs font-black px-3 py-1.5 rounded-xl shadow-lg ${
                property.type === 'sale' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
              }`}>
                {property.type === 'sale' ? 'للبيع' : 'للإيجار'}
              </span>

              {property.isVerified && (
                <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  عقار موثق
                </span>
              )}
            </div>

            {/* Media Mode switch controller */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/60 flex gap-1 z-10 shadow-xl">
              <button
                onClick={() => setViewMode('gallery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  viewMode === 'gallery'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                معرض الصور
              </button>
              
              <button
                onClick={() => setViewMode('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  viewMode === 'video'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                معاينة الفيديو
              </button>
            </div>
          </div>

          {/* Miniature Image Thumbnails */}
          {viewMode === 'gallery' && (
            <div className="flex gap-3 overflow-x-auto py-1 no-scrollbar justify-start">
              {property.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-24 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImage === img ? 'border-amber-500 scale-105 shadow-md' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`thumbnail-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Primary Information Header */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <span className="text-xs text-amber-400 font-bold tracking-wider uppercase block mb-1">{property.city} • {property.address}</span>
                <h1 className="text-xl md:text-2xl font-black text-white leading-snug">{property.title}</h1>
              </div>
              <div className="text-left bg-slate-800/40 p-3 rounded-2xl border border-slate-700/30">
                <span className="text-xs text-slate-400 block">السعر المطلوب</span>
                <p className="text-2xl font-black text-amber-400">
                  {property.price.toLocaleString()} {['الرياض', 'جدة', 'مكة المكرمة', 'الدمام', 'المدينة المنورة', 'السعودية (الكل)'].includes(property.city) ? 'ر.س' : 'ج.م'}
                  {property.type === 'rent' && <span className="text-sm font-normal text-slate-400"> / سنوي</span>}
                </p>
              </div>
            </div>

            {/* Quick specifications grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-800 text-sm">
              <div className="bg-slate-800/20 p-3 rounded-2xl text-center">
                <span className="text-slate-400 text-xs block mb-0.5">المساحة الكلية</span>
                <span className="text-base font-extrabold text-white">{property.area} م²</span>
              </div>
              <div className="bg-slate-800/20 p-3 rounded-2xl text-center">
                <span className="text-slate-400 text-xs block mb-0.5">غرف النوم</span>
                <span className="text-base font-extrabold text-white">{property.rooms} غرف</span>
              </div>
              <div className="bg-slate-800/20 p-3 rounded-2xl text-center">
                <span className="text-slate-400 text-xs block mb-0.5">دورات المياه</span>
                <span className="text-base font-extrabold text-white">{property.bathrooms} دورات</span>
              </div>
              <div className="bg-slate-800/20 p-3 rounded-2xl text-center">
                <span className="text-slate-400 text-xs block mb-0.5">سنة البناء</span>
                <span className="text-base font-extrabold text-white">{property.yearBuilt}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1 justify-between">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-500" />
                <span>شوهد {property.viewsCount} مرة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-slate-500" />
                <span>حُفظ بالمفضلة {property.favoritesCount} مرة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>تاريخ الإعلان: {new Date(property.createdAt).toLocaleDateString('ar-SA')}</span>
              </div>
            </div>
          </div>

          {/* Description Block */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">وصف تفصيلي للعقار</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Facilities and Near Services Proximity Block (Simulated calculated GPS distances) */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              الخدمات والمرافق القريبة من الموقع
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {property.nearPlaces.map((place, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-2xl border border-slate-700/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      {place.type === 'school' && <School className="w-4 h-4 text-blue-400" />}
                      {place.type === 'hospital' && <Hospital className="w-4 h-4 text-red-400" />}
                      {place.type === 'mall' && <Landmark className="w-4 h-4 text-yellow-400" />}
                      {place.type === 'mosque' && <Star className="w-4 h-4 text-green-400" />}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">
                        {place.type === 'school' ? 'منشأة تعليمية' : place.type === 'hospital' ? 'منشأة طبية' : place.type === 'mall' ? 'مجمع تجاري' : 'دور عبادة'}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{place.name}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-amber-400">يبعد {place.distance} كم</span>
                    <span className="block text-[9px] text-slate-500">تقريباً {Math.round(place.distance * 12)} دقيقة مشي</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features and Amenities Chips */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-2">مميزات ومرافق الإعلان</h3>
            <div className="flex flex-wrap gap-2">
              {property.features.map((feature, i) => (
                <span 
                  key={i}
                  className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-green-400 stroke-[3]" />
                  {feature}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Interaction, Sharing, Favorites and Live Chat with owner */}
        <div className="space-y-6">
          
          {/* Main action dashboard block */}
          <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl space-y-6 shadow-xl sticky top-24">
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">تواصل آمن وموثق</span>
              {property.isVerified && (
                <div className="flex items-center gap-1 bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full border border-green-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  حساب معتمد
                </div>
              )}
            </div>

            {/* Owner Details Card */}
            <div className="flex items-center gap-3 bg-slate-800/30 p-3.5 rounded-2xl border border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
                alt={property.ownerName}
                className="w-12 h-12 rounded-xl object-cover border border-slate-700"
              />
              <div className="flex-1 text-right">
                <span className="text-[10px] text-slate-400 block">المعلن وصاحب العقار</span>
                <span className="text-sm font-extrabold text-white block">{property.ownerName}</span>
                <span className="text-[10px] text-amber-400">عضو موثق منذ عامين</span>
              </div>
            </div>

            {/* Instant direct call / social icons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleWhatsApp}
                className="py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-600/15"
              >
                <Phone className="w-4 h-4 fill-current" />
                تواصل واتساب
              </button>
              
              <button
                onClick={() => window.open(`tel:${property.ownerPhone}`)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-4 h-4" />
                اتصال هاتفي
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onAddToFavorites(property.id)}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  isFavorite
                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                    : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                {isFavorite ? 'محفوظ بالمفضلة' : 'حفظ بالمفضلة'}
              </button>

              <button
                onClick={handleShare}
                className="py-2.5 px-4 bg-slate-800/40 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    تم نسخ الرابط!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    مشاركة الإعلان
                  </>
                )}
              </button>
            </div>

            {/* Internal site secure messenger panel */}
            <div className="border-t border-slate-800/80 pt-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h4>إرسال رسالة فورية عبر الموقع</h4>
              </div>

              <form onSubmit={handleSendMessageSubmit} className="space-y-2">
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="اكتب رسالتك أو استفسارك هنا للمعادنة..."
                  rows={3}
                  className="w-full bg-slate-800/70 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-right resize-none"
                />
                
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5 transform rotate-180" />
                  إرسال الرسالة للمعلن
                </button>
              </form>

              <AnimatePresence>
                {messageSentSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center gap-2 text-right"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>تم إرسال رسالتك بنجاح! سيصلك تنبيه فور رد المعلن عليها.</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Safe deal guarantee badge info */}
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-3xl text-right flex gap-3 items-start shadow-md" dir="rtl">
            <ShieldCheck className="w-10 h-10 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <h5 className="font-bold text-white mb-1">ضمانات السلامة العقارية</h5>
              <p className="text-slate-400 leading-relaxed">
                تحرص منصتنا على مراجعة وثائق وصكوك الملكية لكل عقار يتم تفعيل إعلانه لضمان صفقات مبيعات آمنة وعقود إيجار متوافقة مع الأنظمة البلدية والوزارية.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
