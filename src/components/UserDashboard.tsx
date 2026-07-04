/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User, Property, Message, Invoice, UserRole, VerificationStatus } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { Eye, Heart, Key, CheckCircle, RefreshCw, FileText, UserCheck, ShieldCheck, Mail, Phone, Plus, MapPin, Trash2, Edit2, CreditCard, MessageSquare, Shield, Clock, Send, Sparkles, ArrowLeft, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserDashboardProps {
  user: User;
  onUpdateUser: (updatedUser: Partial<User>) => void;
  properties: Property[];
  onDeleteProperty: (id: string) => void;
  onEditProperty: (property: Property) => void;
  messages: Message[];
  onSendMessage: (text: string, receiverId: string, propertyId: string) => void;
  invoices: Invoice[];
  onPayInvoice: (id: string) => void;
}

export default function UserDashboard({
  user,
  onUpdateUser,
  properties,
  onDeleteProperty,
  onEditProperty,
  messages,
  onSendMessage,
  invoices,
  onPayInvoice
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'properties' | 'messages' | 'finances' | 'contracts'>('overview');
  const [selectedMessageUser, setSelectedMessageUser] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Editable Profile States
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editAvatar, setEditAvatar] = useState(user.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ID Upload State Simulation (Front & Back image files as Base64)
  const [idCardFront, setIdCardFront] = useState<string>(user.idCardUrl || '');
  const [idCardBack, setIdCardBack] = useState<string>(user.idCardBackUrl || '');
  const [phoneVerified, setPhoneVerified] = useState(true);
  const [idCardFileUploaded, setIdCardFileUploaded] = useState(!!(user.idCardUrl && user.idCardBackUrl));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file)
      .then((compressedBase64) => {
        if (side === 'front') {
          setIdCardFront(compressedBase64);
        } else {
          setIdCardBack(compressedBase64);
        }
      })
      .catch((err) => {
        console.error('Error compressing ID card image:', err);
      });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, side: 'front' | 'back') => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    compressImage(file)
      .then((compressedBase64) => {
        if (side === 'front') {
          setIdCardFront(compressedBase64);
        } else {
          setIdCardBack(compressedBase64);
        }
      })
      .catch((err) => {
        console.error('Error compressing dropped ID card image:', err);
      });
  };

  // Dynamic switch roles
  const handleRoleToggle = (role: UserRole) => {
    let nextRoles = [...user.roles];
    if (nextRoles.includes(role)) {
      if (nextRoles.length > 1) {
        nextRoles = nextRoles.filter(r => r !== role);
      }
    } else {
      nextRoles.push(role);
    }
    
    // Auto adjust activeRole to one of the active roles if current activeRole was removed
    const activeRole = nextRoles.includes(user.activeRole) ? user.activeRole : nextRoles[0];
    onUpdateUser({ roles: nextRoles, activeRole });
  };

  const handleActiveRoleChange = (role: UserRole) => {
    if (user.roles.includes(role)) {
      onUpdateUser({ activeRole: role });
    }
  };

  const handleQuickConvert = (fromRole: UserRole, toRole: UserRole) => {
    let nextRoles = [...user.roles];
    if (!nextRoles.includes(toRole)) {
      nextRoles.push(toRole);
    }
    onUpdateUser({
      roles: nextRoles,
      activeRole: toRole
    });
  };

  // Submit Verification National ID document (Front & Back images)
  const handleVerifyAccount = () => {
    if (!idCardFront || !idCardBack) return;
    onUpdateUser({
      verificationStatus: 'pending',
      idCardUrl: idCardFront,
      idCardBackUrl: idCardBack
    });
    setIdCardFileUploaded(true);
  };

  // User's owned properties
  const userProperties = useMemo(() => {
    return properties.filter(p => p.ownerId === user.id);
  }, [properties, user.id]);

  // Aggregate user statistics
  const userStats = useMemo(() => {
    let totalViews = 0;
    let totalFavorites = 0;
    userProperties.forEach(p => {
      totalViews += p.viewsCount;
      totalFavorites += p.favoritesCount;
    });
    return { totalViews, totalFavorites };
  }, [userProperties]);

  // Organize chats by conversing user
  const groupedChats = useMemo(() => {
    const chats: Record<string, { partnerName: string; messages: Message[]; lastMsg: string; timestamp: string; propertyName: string; partnerId: string; propertyId: string }> = {};
    
    messages.forEach(msg => {
      const isSender = msg.senderId === user.id;
      const partnerId = isSender ? msg.receiverId : msg.senderId;
      const partnerName = isSender ? (partnerId === 'user_admin' ? 'المدير العام' : 'سارة الدوسري') : msg.senderName;
      
      const key = `${partnerId}-${msg.propertyId}`;
      if (!chats[key]) {
        chats[key] = {
          partnerId,
          partnerName,
          propertyName: msg.propertyName,
          propertyId: msg.propertyId,
          messages: [],
          lastMsg: '',
          timestamp: ''
        };
      }
      chats[key].messages.push(msg);
    });

    // Sort messages in each chat by timestamp
    Object.keys(chats).forEach(k => {
      chats[k].messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const msgs = chats[k].messages;
      chats[k].lastMsg = msgs[msgs.length - 1].text;
      chats[k].timestamp = msgs[msgs.length - 1].timestamp;
    });

    return Object.values(chats).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [messages, user.id]);

  const activeChatData = useMemo(() => {
    if (!selectedMessageUser) return null;
    return groupedChats.find(c => `${c.partnerId}-${c.propertyId}` === selectedMessageUser) || null;
  }, [selectedMessageUser, groupedChats]);

  // Send reply inside chat
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeChatData) return;
    
    onSendMessage(
      replyText.trim(),
      activeChatData.partnerId,
      activeChatData.propertyId
    );
    setReplyText('');
  };

  // Filter invoices for user properties
  const userInvoices = useMemo(() => {
    return invoices.filter(inv => userProperties.some(p => p.id === inv.propertyId));
  }, [invoices, userProperties]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 text-right" dir="rtl">
      
      {/* Top Banner with dynamic role switching options */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image')) ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 bg-slate-850"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl border-2 border-slate-700 bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black text-2xl flex items-center justify-center shadow-inner select-none">
                  {user.name ? user.name.trim().charAt(0) : 'ع'}
                </div>
              )}
              {user.isVerified && (
                <span className="absolute -bottom-1.5 -right-1.5 bg-green-500 border border-slate-900 rounded-full p-0.5" title="حساب موثق">
                  <ShieldCheck className="w-4 h-4 text-white fill-current" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">{user.name}</h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  user.verificationStatus === 'verified'
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : user.verificationStatus === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {user.verificationStatus === 'verified' ? 'شارة موثق' : user.verificationStatus === 'pending' ? 'انتظار المراجعة' : 'غير موثق'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user.email} • {user.phone}</p>
            </div>
          </div>

          {/* Unified dynamic role manager */}
          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 w-full md:w-auto">
            <h4 className="text-xs font-bold text-slate-300 mb-2.5">نظام الحساب الموحد: تفعيل وتغيير الأدوار ديناميكياً</h4>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {(['buyer', 'seller', 'landlord', 'tenant'] as UserRole[]).map(role => {
                const isOwned = user.roles.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleToggle(role)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      isOwned
                        ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {role === 'buyer' ? 'مشتري' : role === 'seller' ? 'بائع' : role === 'landlord' ? 'مؤجر' : 'مستأجر'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-400">الدور النشط الحالي للوحة التحكم:</span>
              <div className="flex gap-1.5">
                {user.roles.map(role => (
                  <button
                    key={role}
                    onClick={() => handleActiveRoleChange(role)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                      user.activeRole === role
                        ? 'bg-slate-700 text-amber-400 border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {role === 'buyer' ? 'مشتري' : role === 'seller' ? 'بائع' : role === 'landlord' ? 'مؤجر' : 'مستأجر'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar tabs */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl h-fit space-y-1.5 shadow-md">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-right px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-all ${
              activeTab === 'overview' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>لوحة التحكم الرئيسية</span>
            <Compass className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-right px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-all ${
              activeTab === 'profile' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>الملف الشخصي والتوثيق</span>
            <UserCheck className="w-4 h-4" />
          </button>

          {/* Show properties only if Seller or Landlord active roles are held */}
          {(user.roles.includes('seller') || user.roles.includes('landlord')) && (
            <button
              onClick={() => setActiveTab('properties')}
              className={`w-full text-right px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'properties' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>عقاراتي المعلنة ({userProperties.length})</span>
              <MapPin className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setActiveTab('messages')}
            className={`w-full text-right px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-all ${
              activeTab === 'messages' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>رسائل الاستفسار ({groupedChats.length})</span>
            <MessageSquare className="w-4 h-4" />
          </button>

          {(user.roles.includes('seller') || user.roles.includes('landlord')) && (
            <button
              onClick={() => setActiveTab('finances')}
              className={`w-full text-right px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-all ${
                activeTab === 'finances' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>الفواتير والعمولات المستحقة</span>
              <CreditCard className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setActiveTab('contracts')}
            className={`w-full text-right px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-all ${
              activeTab === 'contracts' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>العقود والمستندات المشتركة</span>
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {/* Tab contents panel */}
        <div className="lg:col-span-3">
          
          {/* TAB 0: Overview Hub for Members (Simplified Main Interface) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Quick Greeting */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-xl">
                <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      أهلاً بك يا {user.name} في بوابتك العقارية الموحدة
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">لقد قمنا بتبسيط واجهتك لتتمكن من الوصول لجميع الأقسام وإتمام معاملاتك بضغطة واحدة وبكل سهولة.</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-700/50">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-400">الحساب نشط</span>
                  </div>
                </div>
              </div>

              {/* Bento Grid Menu Cards for Quick Navigation */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Profile & Verification Card */}
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-amber-500/40 transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl relative flex flex-col justify-between h-[170px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">الملف الشخصي والتوثيق</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">تعديل ملفك وتوثيق هويتك الوطنية لرفع مصداقية عروضك العقارية.</p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 mt-2">
                    فتح الملف والتوثيق ←
                  </span>
                </div>

                {/* 2. My Properties Card */}
                {(user.roles.includes('seller') || user.roles.includes('landlord')) && (
                  <div 
                    onClick={() => setActiveTab('properties')}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-amber-500/40 transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl relative flex flex-col justify-between h-[170px]"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">عقاراتي المعلنة</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">متابعة إعلاناتك العقارية على الخريطة وتحديث أسعارها وصورها.</p>
                    </div>
                    <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 mt-2">
                      إدارة عقاراتك المعلنة ({userProperties.length}) ←
                    </span>
                  </div>
                )}

                {/* 3. Messages Card */}
                <div 
                  onClick={() => setActiveTab('messages')}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-amber-500/40 transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl relative flex flex-col justify-between h-[170px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">صندوق الرسائل والاستفسارات</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">محادثات مباشرة وحية مع المهتمين بعقاراتك لإنهاء الصفقات.</p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 mt-2">
                    مركز الرسائل والمحادثات ({groupedChats.length}) ←
                  </span>
                </div>

                {/* 4. Finances Card */}
                {(user.roles.includes('seller') || user.roles.includes('landlord')) && (
                  <div 
                    onClick={() => setActiveTab('finances')}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-amber-500/40 transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl relative flex flex-col justify-between h-[170px]"
                  >
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">الفواتير والعمولات</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">استعراض وسداد مستحقات ووساطة المنصة بطرق دفع مصرية آمنة.</p>
                    </div>
                    <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 mt-2">
                      الفواتير والمستحقات ←
                    </span>
                  </div>
                )}

                {/* 5. Contracts Card */}
                <div 
                  onClick={() => setActiveTab('contracts')}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-3xl hover:border-amber-500/40 transition-all duration-300 cursor-pointer group shadow-md hover:shadow-xl relative flex flex-col justify-between h-[170px]"
                >
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform mb-3">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">العقود والمستندات المشتركة</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">الاطلاع على عقود الإيجار والبيع الموحدة الموقعة الكترونياً.</p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 mt-2">
                    تصفح المستندات والعقود ←
                  </span>
                </div>

              </div>
            </div>
          )}
          
          {/* TAB 1: Profile & Document Verification Upload */}
          {activeTab === 'profile' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white mb-1">تفاصيل الحساب ونظام توثيق الهوية</h3>
                <p className="text-xs text-slate-400">توثيق الحساب يزيد ثقة المشترين بنسبة 95% ويمنحك علامة "معلن موثق" الفضية والذهبية.</p>
              </div>

              {/* Show Stats cards if seller/landlord */}
              {(user.roles.includes('seller') || user.roles.includes('landlord')) && (
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800">
                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">المشاهدات الكلية لإعلاناتي</span>
                      <Eye className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-xl font-extrabold text-white">{userStats.totalViews} مشاهدة</span>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-2xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">مرات الحفظ بالمفضلة</span>
                      <Heart className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-xl font-extrabold text-white">{userStats.totalFavorites} حفظ</span>
                  </div>
                </div>
              )}

              {/* Account details and Avatar inputs */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-6">
                <h4 className="text-xs font-black text-amber-400">تعديل الملف الشخصي وإدارة الصورة</h4>
                
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-slate-800/60">
                  <div className="relative">
                    {editAvatar && (editAvatar.startsWith('http') || editAvatar.startsWith('data:image')) ? (
                      <img
                        src={editAvatar}
                        alt="معاينة الصورة"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-700 bg-slate-900"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-2 border-slate-700 bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black text-3xl flex items-center justify-center shadow-inner select-none">
                        {editName ? editName.trim().charAt(0) : 'ع'}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 flex-1 text-center sm:text-right">
                    <span className="block text-xs text-slate-300 font-bold">صورة الحساب (الملف الشخصي)</span>
                    <p className="text-[10px] text-slate-500">يمكنك رفع صورة شخصية خاصة بك، أو تصفيرها لعرض الحرف الأول من اسمك تلقائياً.</p>
                    
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => document.getElementById('user-avatar-upload')?.click()}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all animate-none"
                      >
                        رفع صورة جديدة
                      </button>
                      <input
                        type="file"
                        id="user-avatar-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            compressImage(file)
                              .then((compressedBase64) => {
                                setEditAvatar(compressedBase64);
                              })
                              .catch((err) => {
                                console.error('Error compressing avatar:', err);
                              });
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setEditAvatar('')}
                        className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl transition-all"
                      >
                        استخدام الحرف الأول من اسمي
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-bold">اسم الحساب الكامل</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full py-2.5 px-4 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl text-xs focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-bold">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full py-2.5 px-4 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-bold">رقم الهاتف الموثق</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full py-2.5 px-4 bg-slate-900 border border-slate-700 text-slate-100 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSavingProfile(true);
                      setTimeout(() => {
                        onUpdateUser({
                          name: editName,
                          phone: editPhone,
                          email: editEmail,
                          avatar: editAvatar
                        });
                        setIsSavingProfile(false);
                      }, 500);
                    }}
                    disabled={isSavingProfile || !editName.trim()}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/10"
                  >
                    {isSavingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات والملف الشخصي'}
                  </button>
                </div>
              </div>

              {/* Quick Conversion Panel */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5 text-amber-400">
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                    التحويل الفوري والآمن للأدوار العقارية
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    من خلال نظام الحسابات الموحد، يمكنك التحويل ديناميكياً بضغطة زر واحدة بين أدوار البائع، المشتري، المؤجر، والمستأجر مع الاحتفاظ بكافة الإعلانات المدرجة وسجل الأنشطة دون فقدان أي بيانات.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Seller -> Buyer */}
                  {user.activeRole === 'seller' && (
                    <button
                      type="button"
                      onClick={() => handleQuickConvert('seller', 'buyer')}
                      className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl text-right flex items-center justify-between transition-all group"
                    >
                      <div>
                        <span className="block text-xs font-black text-white group-hover:text-amber-400 transition-colors">التحويل الفوري إلى مشتري 🔄</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">البحث وتصفح العقارات وحفظ المفضلة</span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:translate-x-[-4px] transition-transform" />
                    </button>
                  )}

                  {/* Buyer -> Seller */}
                  {user.activeRole === 'buyer' && (
                    <button
                      type="button"
                      onClick={() => handleQuickConvert('buyer', 'seller')}
                      className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl text-right flex items-center justify-between transition-all group"
                    >
                      <div>
                        <span className="block text-xs font-black text-white group-hover:text-amber-400 transition-colors">التحويل الفوري إلى بائع 🔄</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">إدراج وصك وعرض عقارات للبيع والشراء</span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:translate-x-[-4px] transition-transform" />
                    </button>
                  )}

                  {/* Landlord -> Tenant */}
                  {user.activeRole === 'landlord' && (
                    <button
                      type="button"
                      onClick={() => handleQuickConvert('landlord', 'tenant')}
                      className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl text-right flex items-center justify-between transition-all group"
                    >
                      <div>
                        <span className="block text-xs font-black text-white group-hover:text-amber-400 transition-colors">التحويل الفوري إلى مستأجر 🔄</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">تصفح الشقق السكنية المعروضة للإيجار</span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:translate-x-[-4px] transition-transform" />
                    </button>
                  )}

                  {/* Tenant -> Landlord */}
                  {user.activeRole === 'tenant' && (
                    <button
                      type="button"
                      onClick={() => handleQuickConvert('tenant', 'landlord')}
                      className="p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 rounded-xl text-right flex items-center justify-between transition-all group"
                    >
                      <div>
                        <span className="block text-xs font-black text-white group-hover:text-amber-400 transition-colors">التحويل الفوري إلى مؤجر 🔄</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">إدارة وتأجير العقارات والوحدات السكنية</span>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:translate-x-[-4px] transition-transform" />
                    </button>
                  )}

                  {/* Multi-role support message */}
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2 text-right">
                    <ShieldCheck className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-[10px] font-bold text-slate-200">ميزة امتلاك أدوار متعددة (نشطة)</span>
                      <p className="text-[9px] text-slate-500 leading-relaxed mt-0.5">يمكنك أيضاً في نفس الوقت تفعيل أدوار متعددة معاً بالضغط على الأزرار في البانر العلوي وتغيير الدور النشط لعرض إعدادات كل منها.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document verification request form */}
              <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-400" />
                    رفع وثائق الهوية الوطنية للتوثيق والتحقق المعتمد
                  </span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border ${
                    user.verificationStatus === 'verified'
                      ? 'bg-green-500/15 border-green-500/30 text-green-400 font-bold'
                      : user.verificationStatus === 'pending'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    {user.verificationStatus === 'verified' ? 'الحساب موثق بالكامل ✓' : user.verificationStatus === 'pending' ? 'بانتظار مراجعة المدققين' : 'بانتظار مستنداتك'}
                  </span>
                </div>

                {user.verificationStatus === 'unverified' ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      للتحقق من هويتك وتفعيل إعلاناتك تلقائياً على الخريطة، يرجى إرفاق صورة واضحة لبطاقتك الشخصية / الهوية الوطنية (الوجه الأمامي والخلفي).
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Front Card */}
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'front')}
                        className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[160px] relative overflow-hidden"
                        onClick={() => document.getElementById('id-front-input')?.click()}
                      >
                        <input 
                          type="file" 
                          id="id-front-input"
                          onChange={(e) => handleFileChange(e, 'front')}
                          accept="image/*"
                          className="hidden" 
                        />
                        {idCardFront ? (
                          <div className="absolute inset-0 w-full h-full">
                            <img src={idCardFront} alt="وجه البطاقة" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[11px] transition-all">
                              تغيير وجه البطاقة
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                              <Plus className="w-5 h-5 text-amber-500" />
                            </div>
                            <span className="block text-xs font-bold text-slate-200">صورة البطاقة (الوجه)</span>
                            <span className="block text-[10px] text-slate-500">اسحب الصورة هنا أو اضغط للاختيار</span>
                          </div>
                        )}
                      </div>

                      {/* Back Card */}
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'back')}
                        className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[160px] relative overflow-hidden"
                        onClick={() => document.getElementById('id-back-input')?.click()}
                      >
                        <input 
                          type="file" 
                          id="id-back-input"
                          onChange={(e) => handleFileChange(e, 'back')}
                          accept="image/*"
                          className="hidden" 
                        />
                        {idCardBack ? (
                          <div className="absolute inset-0 w-full h-full">
                            <img src={idCardBack} alt="ظهر البطاقة" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[11px] transition-all">
                              تغيير ظهر البطاقة
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                              <Plus className="w-5 h-5 text-amber-500" />
                            </div>
                            <span className="block text-xs font-bold text-slate-200">صورة البطاقة (الخلف)</span>
                            <span className="block text-[10px] text-slate-500">اسحب الصورة هنا أو اضغط للاختيار</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={handleVerifyAccount}
                        disabled={!idCardFront || !idCardBack}
                        className="w-full sm:w-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all disabled:opacity-40"
                      >
                        إرسال لمدير المنصة للمراجعة والتوثيق
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block mb-1">وجه الهوية المرفوعة:</span>
                        <div className="aspect-[3/2] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                          {user.idCardUrl?.startsWith('data:image') || user.idCardUrl?.startsWith('http') ? (
                            <img src={user.idCardUrl} alt="وجه البطاقة" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                              {user.idCardUrl || 'national_id_front.jpg'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">خلفية الهوية المرفوعة:</span>
                        <div className="aspect-[3/2] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                          {user.idCardBackUrl?.startsWith('data:image') || user.idCardBackUrl?.startsWith('http') ? (
                            <img src={user.idCardBackUrl} alt="ظهر البطاقة" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">
                              {user.idCardBackUrl || 'national_id_back.jpg'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between border-t border-slate-800/60 pt-3">
                      <span className="text-slate-100 font-bold">نشط بالبوابة الوطنية لوزارة الإسكان والبلديات</span>
                      <span className="text-slate-500">حالة الربط الخارجي:</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Properties listings control list */}
          {activeTab === 'properties' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">إدارة عقاراتي المعلنة</h3>
                  <p className="text-xs text-slate-400">تعديل مواصفات الوحدات أو حذفها أو تسجيل إتمام صفقات البيع والتأجير.</p>
                </div>
              </div>

              {userProperties.length === 0 ? (
                <div className="text-center py-12 bg-slate-850/30 rounded-2xl border border-slate-800 text-slate-500">
                  <p className="text-xs">لم تقم بإضافة أي إعلانات عقارية بعد بصفتك {user.activeRole === 'seller' ? 'بائعاً' : 'مؤجراً'}.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userProperties.map(p => (
                    <div key={p.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-850 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full md:w-32 h-24 rounded-xl object-cover border border-slate-700"
                      />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            p.type === 'sale' ? 'bg-red-500/25 text-red-400' : 'bg-blue-500/25 text-blue-400'
                          }`}>
                            {p.type === 'sale' ? 'للبيع' : 'للإيجار'}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                            p.status === 'available'
                              ? 'bg-green-500/10 text-green-400'
                              : p.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 animate-pulse'
                                : 'bg-slate-800 text-slate-400'
                          }`}>
                            {p.status === 'available' ? 'منشور ونشط' : p.status === 'pending' ? 'بانتظار الاعتماد' : 'تم البيع/التأجير'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{p.title}</h4>
                        <p className="text-xs font-black text-amber-400">{p.price.toLocaleString()} ج.م</p>
                        <p className="text-[10px] text-slate-400">{p.rooms} غرف • {p.area} م² • شوهد {p.viewsCount} مرة</p>
                      </div>

                      <div className="flex md:flex-col justify-end gap-2 h-full justify-center">
                        <button
                          onClick={() => onEditProperty(p)}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-amber-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="تعديل تفاصيل الإعلان"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          تعديل
                        </button>
                        <button
                          onClick={() => onDeleteProperty(p.id)}
                          className="px-3.5 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="إلغاء الإعلان نهائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Messages Inbox & Live conversation replies */}
          {activeTab === 'messages' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl h-[550px] flex flex-col">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3 mb-4">مركز الاستفسارات والمحادثات المباشرة</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden min-h-0">
                
                {/* Chat list sidebar */}
                <div className="border-l border-slate-800 pl-4 space-y-2 overflow-y-auto pr-1">
                  {groupedChats.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-12">لا توجد محادثات نشطة حالياً.</p>
                  ) : (
                    groupedChats.map(chat => {
                      const chatKey = `${chat.partnerId}-${chat.propertyId}`;
                      return (
                        <button
                          key={chatKey}
                          onClick={() => setSelectedMessageUser(chatKey)}
                          className={`w-full text-right p-3 rounded-2xl flex flex-col gap-1 transition-all border ${
                            selectedMessageUser === chatKey
                              ? 'bg-slate-800 border-amber-500/40 text-white'
                              : 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-xs font-bold text-slate-100">{chat.partnerName}</span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(chat.timestamp).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-400 truncate w-full">{chat.propertyName}</span>
                          <p className="text-[10px] text-slate-400 line-clamp-1 w-full">{chat.lastMsg}</p>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Chat panel */}
                <div className="md:col-span-2 flex flex-col h-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative">
                  {activeChatData ? (
                    <>
                      {/* Active Chat Header */}
                      <div className="bg-slate-900 p-3.5 border-b border-slate-800 flex justify-between items-center text-right">
                        <div>
                          <span className="text-xs font-bold text-white block">{activeChatData.partnerName}</span>
                          <span className="text-[9px] text-slate-400">{activeChatData.propertyName}</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>

                      {/* Messages logs */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col">
                        {activeChatData.messages.map(msg => {
                          const isMe = msg.senderId === user.id;
                          return (
                            <div
                              key={msg.id}
                              className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                                isMe
                                  ? 'self-start bg-amber-500 text-slate-950 font-semibold'
                                  : 'self-end bg-slate-800 text-white'
                              }`}
                            >
                              <p>{msg.text}</p>
                              <span className={`block text-[8px] mt-1 text-left ${
                                isMe ? 'text-slate-900/60' : 'text-slate-400'
                              }`}>
                                {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply textbox */}
                      <form onSubmit={handleSendReply} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="اكتب ردك أو الإجابة على الاستفسار..."
                          className="flex-1 bg-slate-850 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center"
                        >
                          <Send className="w-3.5 h-3.5 transform rotate-180" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                      <MessageSquare className="w-12 h-12 text-slate-700 mb-2 animate-bounce" />
                      <p>يرجى اختيار محادثة من القائمة الجانبية لبدء استعراض الرسائل.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: Finances Invoices and Commission calculations */}
          {activeTab === 'finances' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white mb-1">العمولات والمستحقات المالية</h3>
                <p className="text-xs text-slate-400">متابعة الفواتير والعمولات الصادرة المستحقة للموقع عن صفقات البيع والتأجير.</p>
              </div>

              {userInvoices.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-12">لا توجد فواتير أو مطالبات مالية مستحقة عليك حالياً.</p>
              ) : (
                <div className="space-y-4">
                  {userInvoices.map(inv => (
                    <div key={inv.id} className="p-5 bg-slate-850 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">رقم المطالبة: #{inv.id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            inv.status === 'paid'
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-red-500/10 text-red-400 animate-pulse'
                          }`}>
                            {inv.status === 'paid' ? 'تم السداد واكتمال الصفقة' : 'غير مسددة'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-semibold">{inv.propertyName}</p>
                        <p className="text-[10px] text-slate-400">تاريخ إصدار الفاتورة: {inv.date} • النسبة المحددة: {inv.commissionRate}%</p>
                      </div>

                      <div className="text-left w-full md:w-auto">
                        <span className="text-[10px] text-slate-400 block">عمولة المنصة</span>
                        <p className="text-xl font-black text-amber-400">{inv.commissionAmount.toLocaleString()} ج.م</p>
                        <p className="text-[9px] text-slate-500 mb-2">من أصل قيمة الصفقة البالغة {inv.amount.toLocaleString()} ج.م</p>
                        
                        {inv.status === 'unpaid' && (
                          <button
                            onClick={() => onPayInvoice(inv.id)}
                            className="w-full md:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
                          >
                            سداد العمولة إلكترونياً
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Contracts sharing */}
          {activeTab === 'contracts' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white mb-1">العقود والمستندات والوثائق المشتركة</h3>
                <p className="text-xs text-slate-400">استعرض عقود البيع والإيجار الموحدة الموقعة رسمياً عبر منصة وزارة الإسكان وشبكة إيجار.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 flex gap-4 items-start text-right">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">عقد إيجار موحد نشط #78192</h4>
                    <p className="text-[10px] text-slate-400 mb-2">شقة فاخرة بإطلالة كاملة على ممشى بحر جدة</p>
                    <span className="text-[9px] bg-green-500/15 text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-500/20">مكتمل وموقع إلكترونياً</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 flex gap-4 items-start text-right">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">عقد وساطة تسويق عقاري #56211</h4>
                    <p className="text-[10px] text-slate-400 mb-2">فيلا مودرن فاخرة مع مسبح بحي الياسمين</p>
                    <span className="text-[9px] bg-green-500/15 text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-500/20">مسجل بالهيئة العامة للعقار</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
