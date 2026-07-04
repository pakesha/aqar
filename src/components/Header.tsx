/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Map, LayoutDashboard, Shield, Sparkles, Plus, Bell, ShieldCheck, Compass, CheckCircle2, CreditCard, MessageSquare, ChevronDown, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  user: User | null;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  activeTab: 'map' | 'dashboard' | 'admin' | 'ai' | 'add';
  setActiveTab: (tab: 'map' | 'dashboard' | 'admin' | 'ai' | 'add') => void;
  onLogout: () => void;
}

export default function Header({
  user,
  onUpdateUser,
  activeTab,
  setActiveTab,
  onLogout
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Mock Notifications list
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'تم توثيق حسابك الشخصي بنجاح',
      desc: 'تم فحص وثيقة هويتك الوطنية وربط حسابك ببوابة الإسكان.',
      time: 'قبل ساعتين',
      type: 'verify',
      unread: true
    },
    {
      id: 2,
      title: 'استفسار جديد بخصوص شقة كورنيش جدة',
      desc: 'أحمد القحطاني أرسل رسالة يستفسر عن موعد المعاينة.',
      time: 'قبل 4 ساعات',
      type: 'msg',
      unread: true
    },
    {
      id: 3,
      title: 'فاتورة عمولة جديدة بانتظار السداد',
      desc: 'فاتورة بقيمة 6,750 ر.س لعقد إيجار شقة جدة.',
      time: 'أمس',
      type: 'finance',
      unread: false
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleNotificationClick = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    setShowNotifications(false);
    setActiveTab('dashboard');
  };

  const handleActiveRoleSelect = (role: UserRole) => {
    if (user && user.roles.includes(role)) {
      onUpdateUser({ activeRole: role });
      setShowRoleSwitcher(false);
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 py-3.5 px-4 shadow-lg text-right" dir="rtl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Logo and Brand Title */}
        <div 
          onClick={() => setActiveTab('map')}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 select-none group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-tight">منصة عقاراتنا الذكية</h1>
            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">SMART AQAR PLATFORM</span>
          </div>
        </div>

        {/* Primary Tabs Navigation bar */}
        <nav className="flex items-center gap-1 bg-slate-850 p-1 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar max-w-full whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
              activeTab === 'map'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            الخريطة التفاعلية
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            لوحة التحكم
          </button>

          {(user.activeRole === 'admin' || user.id === 'user_admin') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              لوحة الرقابة (الأدمن)
            </button>
          )}

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
              activeTab === 'ai'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            المساعد العقاري بالذكاء الاصطناعي
          </button>
        </nav>

        {/* Right side interaction controls */}
        <div className="flex items-center gap-3">
          
          {/* Notifications Panel Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl flex items-center justify-center transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-black text-white rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 mt-2.5 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 z-50 text-right"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                    <span className="text-xs font-black text-white">التنبيهات والإشعارات ({unreadCount})</span>
                    <button onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))} className="text-[10px] text-amber-400 hover:text-amber-300">تحديد المقروء</button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className={`p-2.5 rounded-xl text-xs hover:bg-slate-850 transition-all cursor-pointer border ${
                          notif.unread ? 'bg-slate-850/60 border-amber-500/20' : 'border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-bold text-slate-200">{notif.title}</span>
                          <span className="text-[8px] text-slate-500 whitespace-nowrap">{notif.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Active Role Display & Switcher Dropdown inside Header */}
          {user.activeRole === 'admin' || user.id === 'user_admin' ? (
            <div className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-black text-amber-400 flex items-center gap-1.5 select-none">
              <span>المدير العام 🛡️</span>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all select-none"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[8px] text-slate-500">الدور النشط</span>
                  <span className="text-amber-400 font-extrabold text-[10px]">
                    {user.activeRole === 'buyer' ? 'مشتري' : user.activeRole === 'seller' ? 'بائع' : user.activeRole === 'landlord' ? 'مؤجر' : 'مستأجر'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown switch */}
              <AnimatePresence>
                {showRoleSwitcher && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1 text-right"
                  >
                    <span className="text-[9px] text-slate-500 px-2 block mb-1">تغيير دور لوحة التحكم:</span>
                    {user.roles.map(role => (
                      <button
                        key={role}
                        onClick={() => handleActiveRoleSelect(role)}
                        className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold text-right flex items-center justify-between transition-all ${
                          user.activeRole === role
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span>{role === 'buyer' ? 'مشتري' : role === 'seller' ? 'بائع' : role === 'landlord' ? 'مؤجر' : 'مستأجر'}</span>
                        {user.activeRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Add Property Action button - ALWAYS visible with amber pulsating glow */}
          <button
            onClick={() => {
              if (user) {
                let updatedRoles = [...user.roles];
                let needsUpdate = false;
                if (!updatedRoles.includes('seller') && !updatedRoles.includes('landlord')) {
                  updatedRoles.push('seller');
                  needsUpdate = true;
                }
                const activeRole = user.activeRole === 'seller' || user.activeRole === 'landlord' ? user.activeRole : 'seller';
                if (user.activeRole !== activeRole) {
                  needsUpdate = true;
                }
                if (needsUpdate) {
                  onUpdateUser({ roles: updatedRoles, activeRole });
                }
              }
              setActiveTab('add');
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.05] active:scale-95 ring-2 ring-amber-500/30 hover:ring-amber-500/60 animate-none shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3] text-slate-950" />
            أعلن عن عقارك (نشر)
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            title="تسجيل الخروج من الحساب"
            className="w-10 h-10 bg-slate-850 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-300 hover:text-red-400 rounded-xl flex items-center justify-center transition-all relative"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>

        </div>

      </div>
    </header>
  );
}
