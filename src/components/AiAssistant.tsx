/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Search, Send, Landmark, Compass, TrendingUp, HelpCircle, ArrowLeft, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Property, PropertyType, FinishingType, OperationType } from '../types';

interface AiAssistantProps {
  onApplyAiSearchFilters: (filters: {
    city?: string | null;
    type?: OperationType | null;
    propertyType?: PropertyType | null;
    rooms?: number | null;
    maxPrice?: number | null;
    minPrice?: number | null;
    maxArea?: number | null;
    minArea?: number | null;
  }, explanation: string) => void;
  activeCity: string;
}

export default function AiAssistant({ onApplyAiSearchFilters, activeCity }: AiAssistantProps) {
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'valuation'>('search');
  
  // Custom toast state for iframe safety
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 5000);
  };

  // Natural Language Search states
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Valuation Estimator states
  const [valCity, setValCity] = useState(activeCity || 'الرياض');
  const [valPropType, setValPropType] = useState<PropertyType>('apartment');
  const [valArea, setValArea] = useState('160');
  const [valRooms, setValRooms] = useState('3');
  const [valBathrooms, setValBathrooms] = useState('2');
  const [valFinishing, setValFinishing] = useState<FinishingType>('super-lux');
  
  const [isValuating, setIsValuating] = useState(false);
  const [valuationResult, setValuationResult] = useState<{
    estimatedPrice: number;
    minEstimatedPrice: number;
    maxEstimatedPrice: number;
    confidenceScore: number;
    marketAnalysis: string;
    suggestedTitle: string;
    optimizedDescription: string;
  } | null>(null);

  // Trigger server-side Natural Language Search parsing
  const handleSmartSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPrompt.trim()) return;

    setIsSearching(true);
    setSearchFeedback(null);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchPrompt.trim() })
      });
      const data = await response.json();
      
      if (data.parsed) {
        setSearchFeedback(data.explanation || 'تم استخلاص المعايير وتطبيق الفلاتر بنجاح!');
        // Call callback to apply filters in core state
        onApplyAiSearchFilters(data.parsed, data.explanation);
      }
    } catch (err) {
      console.error('Failed to query smart search:', err);
      setSearchFeedback('حدث خطأ أثناء الاتصال بنموذج الذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger server-side fair valuation estimation
  const handleValuationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valArea) return;

    setIsValuating(true);
    setValuationResult(null);

    try {
      const response = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: valCity,
          propertyType: valPropType,
          area: parseFloat(valArea),
          rooms: parseInt(valRooms),
          bathrooms: parseInt(valBathrooms),
          finishing: valFinishing
        })
      });
      const data = await response.json();
      if (data.estimatedPrice) {
        setValuationResult(data);
      }
    } catch (err) {
      console.error('Failed to calculate valuation:', err);
      showToast('حدث خطأ أثناء احتساب التثمين الذكي. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setIsValuating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-right" dir="rtl">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            المساعد العقاري الذكي والذكاء الاصطناعي
          </h2>
          <p className="text-xs text-slate-400">ابحث باللغة الطبيعية العادية، أو احسب القيمة العادلة والأوراق الثبوتية لأي عقار بالمنطقة الخليجية.</p>
        </div>

        {/* Sub toggles */}
        <div className="flex gap-1 p-0.5 bg-slate-850 rounded-xl border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('search')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'search'
                ? 'bg-purple-600 text-white font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            البحث بالذكاء الاصطناعي
          </button>
          
          <button
            onClick={() => setActiveSubTab('valuation')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'valuation'
                ? 'bg-purple-600 text-white font-extrabold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            المثمن والتسعير الذكي
          </button>
        </div>
      </div>

      {/* RENDER TAB 1: SMART NATURAL LANGUAGE SEARCH PARSER */}
      {activeSubTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div>
              <h3 className="text-base font-bold text-white mb-1">ابحث مثل البشر، دع الذكاء الاصطناعي يقوم بالتصفية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                اكتب جملة بحث عادية تصف متطلباتك بالتفصيل (مثل: "أريد شقة 3 غرف في الرياض بسعر تحت 2 مليون") وسيقوم نموذج Gemini باستخراج المعايير، وتركيز الخريطة التفاعلية عليها وتصفية النتائج تلقائياً!
              </p>
            </div>

            <form onSubmit={handleSmartSearchSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchPrompt}
                  onChange={(e) => setSearchPrompt(e.target.value)}
                  placeholder="مثال: أريد شقة للإيجار بجدة تحتوي على غرفتين نوم بسعر أقل من 90 ألف ريال..."
                  disabled={isSearching}
                  className="w-full py-4 pl-12 pr-4 bg-slate-850 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-right"
                />
                
                <button
                  type="submit"
                  disabled={isSearching || !searchPrompt.trim()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all disabled:opacity-40"
                  title="ابحث الآن"
                >
                  <Send className="w-4 h-4 transform rotate-180" />
                </button>
              </div>

              {/* Loader */}
              {isSearching && (
                <div className="flex items-center gap-2 justify-center py-4 text-xs text-purple-400 animate-pulse font-semibold">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>يقوم الذكاء الاصطناعي الآن بقراءة وتحليل لغتك الطبيعية وصياغة المعايير...</span>
                </div>
              )}

              {/* Feedback Alert bubble */}
              <AnimatePresence>
                {searchFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-300 text-xs flex gap-3 items-start leading-relaxed text-right"
                  >
                    <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-white mb-1">تمت صياغة طلبك ذكياً:</h4>
                      <p>{searchFeedback}</p>
                      <span className="block text-[10px] text-purple-400 mt-2">
                        * يرجى التوجه الآن للخريطة التفاعلية بالضغط على زر "الخريطة" في الأعلى لمشاهدة العقارات المطابقة المحددة!
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Quick suggestions blocks to help users */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => setSearchPrompt('أريد فيلا للبيع في الرياض بمساحة تزيد عن 400 متر وبسعر تحت الـ 5 مليون')}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-right cursor-pointer hover:border-purple-500/50 transition-all space-y-1"
            >
              <span className="text-[10px] text-purple-400 font-extrabold block">مثال مبيعات:</span>
              <p className="text-xs text-slate-300 font-medium">"أريد فيلا للبيع في الرياض بمساحة تزيد عن 400 متر وبسعر تحت الـ 5 مليون"</p>
            </div>

            <div 
              onClick={() => setSearchPrompt('أريد شقة مفروشة للإيجار في جدة غرفتين سعرها بحدود 100 ألف')}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-right cursor-pointer hover:border-purple-500/50 transition-all space-y-1"
            >
              <span className="text-[10px] text-purple-400 font-extrabold block">مثال تأجير:</span>
              <p className="text-xs text-slate-300 font-medium">"أريد شقة مفروشة للإيجار في جدة غرفتين سعرها بحدود 100 ألف"</p>
            </div>

            <div 
              onClick={() => setSearchPrompt('أبحث عن مكتب تجاري للإيجار في الرياض')}
              className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-right cursor-pointer hover:border-purple-500/50 transition-all space-y-1"
            >
              <span className="text-[10px] text-purple-400 font-extrabold block">مثال تجاري:</span>
              <p className="text-xs text-slate-300 font-medium">"أبحث عن مكتب تجاري للإيجار في الرياض"</p>
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2: PROPERTY VALUATION ESTIMATOR */}
      {activeSubTab === 'valuation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Form controls */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-3xl h-fit space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">تفاصيل العقار للتثمين</h3>
            
            <form onSubmit={handleValuationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">المدينة</label>
                <select
                  value={valCity}
                  onChange={(e) => setValCity(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-850 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none"
                >
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="مكة المكرمة">مكة المكرمة</option>
                  <option value="الدمام">الدمام</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">نوع العقار</label>
                <select
                  value={valPropType}
                  onChange={(e) => setValPropType(e.target.value as PropertyType)}
                  className="w-full py-2.5 px-3 bg-slate-850 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none"
                >
                  <option value="apartment">شقة سكنية</option>
                  <option value="villa">فيلا / دوبلكس مستقل</option>
                  <option value="land">أرض فضاء</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">المساحة (م²)</label>
                <input
                  type="number"
                  value={valArea}
                  onChange={(e) => setValArea(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-850 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">عدد الغرف</label>
                <input
                  type="number"
                  value={valRooms}
                  onChange={(e) => setValRooms(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-850 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">مستوى التشطيب</label>
                <select
                  value={valFinishing}
                  onChange={(e) => setValFinishing(e.target.value as FinishingType)}
                  className="w-full py-2.5 px-3 bg-slate-850 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none"
                >
                  <option value="super-lux">سوبر لوكس ذكي</option>
                  <option value="lux">فاخر ديلوكس</option>
                  <option value="normal">عادي / معقول</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isValuating || !valArea}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-purple-600/15"
              >
                {isValuating ? 'جارِ احتساب التثمين...' : 'احسب التقييم الذكي العادل'}
              </button>
            </form>
          </div>

          {/* Right valuation report display */}
          <div className="lg:col-span-2 space-y-6">
            
            {isValuating && (
              <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center space-y-4 animate-pulse shadow-xl">
                <Sparkles className="w-12 h-12 text-purple-400 mx-auto animate-spin" />
                <h4 className="text-base font-bold text-white">جارِ مقارنة بيانات العقار بآخر مبيعات الصفقات المعتمدة...</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  يقوم خوارزم ذكاء الآلة في البوابة وموديل Gemini بالربط بالمنظومة لتحليل متوسط سعر المتر ونسبة العرض والطلب لإعطائك تثميناً آمناً وحقيقياً بنسبة دقة عالية.
                </p>
              </div>
            )}

            {!isValuating && !valuationResult && (
              <div className="bg-slate-900 border border-slate-800 p-12 rounded-3xl text-center space-y-3 shadow-md">
                <Landmark className="w-12 h-12 text-slate-700 mx-auto" />
                <h4 className="text-sm font-bold text-slate-400">بانتظار البيانات لتوليد تقرير التثمين الفني</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  قم بملء تفاصيل العقار من غرف، تشطيب ومساحة في النموذج الجانبي، وسنعطيك تسعيراً تقديرياً مع تحليل كامل لحالة السوق وعنوان ووصف محسن تلقائياً للعقار.
                </p>
              </div>
            )}

            {/* Valuation results panel */}
            <AnimatePresence>
              {!isValuating && valuationResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  
                  {/* Valuation main stats card */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl text-right">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        تقرير تسعير تقديري ذكي معتمد
                      </span>
                      <span className="text-[10px] bg-green-500/15 text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-500/20">
                        نسبة ثقة: {valuationResult.confidenceScore}%
                      </span>
                    </div>

                    <div className="text-center py-4 bg-slate-950 rounded-2xl border border-slate-850">
                      <span className="text-xs text-slate-400 block mb-1">القيمة العادلة المقدرة للملكية</span>
                      <p className="text-3xl font-black text-amber-400">
                        {valuationResult.estimatedPrice.toLocaleString()} ر.س
                      </p>
                      
                      <div className="flex justify-center gap-6 text-xs text-slate-500 mt-3 border-t border-slate-900 pt-3 max-w-md mx-auto">
                        <div>
                          <span>الحد الأدنى التقريبي</span>
                          <span className="block font-bold text-slate-300">{valuationResult.minEstimatedPrice.toLocaleString()} ر.س</span>
                        </div>
                        <div className="border-l border-slate-800" />
                        <div>
                          <span>الحد الأقصى التقريبي</span>
                          <span className="block font-bold text-slate-300">{valuationResult.maxEstimatedPrice.toLocaleString()} ر.س</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valuation analysis block */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                    <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">تحليل خبراء المنصة لحالة السوق</h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {valuationResult.marketAnalysis}
                    </p>
                  </div>

                  {/* AI Generated description block copyable */}
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="text-sm font-bold text-white">العنوان والوصف الإعلاني المقترح للتسويق</h3>
                      <span className="text-[10px] text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">صياغة Gemini الذكي</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">العنوان الإعلاني الجذاب:</span>
                        <p className="text-xs font-bold text-white bg-slate-950 p-2.5 rounded-xl border border-slate-850">{valuationResult.suggestedTitle}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block mb-1">الوصف التسويقي المقنع:</span>
                        <p className="text-xs text-slate-300 bg-slate-950 p-3.5 rounded-xl border border-slate-850 leading-relaxed whitespace-pre-line">{valuationResult.optimizedDescription}</p>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      )}

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
