/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import InteractiveMap from './components/InteractiveMap';
import PropertyDetails from './components/PropertyDetails';
import AddProperty from './components/AddProperty';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import AiAssistant from './components/AiAssistant';
import AuthScreen from './components/AuthScreen';

import { Property, User, Message, Invoice, AuditLog, OperationType, PropertyType } from './types';
import {
  INITIAL_PROPERTIES,
  INITIAL_USERS,
  INITIAL_MESSAGES,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS
} from './data';

import { Sparkles, MapPin, Compass, CheckCircle2, X, ShieldAlert, Lock, Shield, ArrowLeft, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveAllItems, getAllItems } from './utils/indexedDb';
import { hashPassword } from './utils/auth';

// Utility to verify admin credentials without exposing secret key in clear text
const isSecretMatch = (input: string): boolean => {
  try {
    return btoa(input) === 'NDY4MTA=';
  } catch {
    return false;
  }
};

export default function App() {
  // Core dynamic states
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('aqar_properties');
    return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('aqar_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aqar_current_user');
    return saved ? JSON.parse(saved) : null; // Start with login/signup flow by default
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aqar_is_admin_authenticated') === 'true';
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('aqar_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('aqar_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('aqar_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Asynchronously load heavy data from High-Capacity IndexedDB on application start
  useEffect(() => {
    const loadIndexedDBData = async () => {
      try {
        const dbUsers = await getAllItems<User>('users');
        if (dbUsers && dbUsers.length > 0) {
          setUsers(dbUsers);
        } else {
          await saveAllItems('users', INITIAL_USERS);
        }

        const dbProperties = await getAllItems<Property>('properties');
        if (dbProperties && dbProperties.length > 0) {
          setProperties(dbProperties);
        } else {
          await saveAllItems('properties', INITIAL_PROPERTIES);
        }

        const dbMessages = await getAllItems<Message>('messages');
        if (dbMessages && dbMessages.length > 0) {
          setMessages(dbMessages);
        } else {
          await saveAllItems('messages', INITIAL_MESSAGES);
        }

        const dbInvoices = await getAllItems<Invoice>('invoices');
        if (dbInvoices && dbInvoices.length > 0) {
          setInvoices(dbInvoices);
        } else {
          await saveAllItems('invoices', INITIAL_INVOICES);
        }

        const dbLogs = await getAllItems<AuditLog>('auditLogs');
        if (dbLogs && dbLogs.length > 0) {
          setAuditLogs(dbLogs);
        } else {
          await saveAllItems('auditLogs', INITIAL_AUDIT_LOGS);
        }
      } catch (err) {
        console.error('Failed to load from secure IndexedDB on boot:', err);
      }
    };
    loadIndexedDBData();
  }, []);

  // State persistence triggers (Both standard storage and IndexedDB)
  useEffect(() => {
    // To prevent LocalStorage Quota Crashes when uploading multiple heavy images/videos,
    // we save a slim version in local storage but save the FULL data including rich media in IndexedDB.
    try {
      const slimProperties = properties.map(p => ({
        ...p,
        // Keep only first image metadata in local storage, or clear if base64 to avoid quota limits
        images: p.images.map(img => img.startsWith('data:') ? 'base64_placeholder' : img),
        videoUrl: p.videoUrl && p.videoUrl.startsWith('data:') ? 'base64_video_placeholder' : p.videoUrl
      }));
      localStorage.setItem('aqar_properties', JSON.stringify(slimProperties));
    } catch (e) {
      console.warn('LocalStorage size limit warning, relying strictly on High-Capacity IndexedDB');
    }
    saveAllItems('properties', properties).catch(err => console.error('IndexedDB save properties error:', err));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('aqar_users', JSON.stringify(users));
    saveAllItems('users', users).catch(err => console.error('IndexedDB save users error:', err));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aqar_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aqar_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('aqar_is_admin_authenticated', String(isAdminAuthenticated));
  }, [isAdminAuthenticated]);

  useEffect(() => {
    localStorage.setItem('aqar_messages', JSON.stringify(messages));
    saveAllItems('messages', messages).catch(err => console.error('IndexedDB save messages error:', err));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('aqar_invoices', JSON.stringify(invoices));
    saveAllItems('invoices', invoices).catch(err => console.error('IndexedDB save invoices error:', err));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('aqar_audit_logs', JSON.stringify(auditLogs));
    saveAllItems('auditLogs', auditLogs).catch(err => console.error('IndexedDB save auditLogs error:', err));
  }, [auditLogs]);

  // Layout navigation state
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'admin' | 'ai' | 'add'>('map');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['prop_2']); // prepopulate with 1 favorite

  // City center location
  const [activeCity, setActiveCity] = useState('القاهرة');

  // AI parsed search filters
  const [aiFilters, setAiFilters] = useState<{
    city?: string | null;
    type?: OperationType | null;
    propertyType?: PropertyType | null;
    rooms?: number | null;
    maxPrice?: number | null;
    minPrice?: number | null;
    maxArea?: number | null;
    minArea?: number | null;
  } | null>(null);

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Selected property object finder
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return properties.find(p => p.id === selectedPropertyId) || null;
  }, [selectedPropertyId, properties]);

  // 1. User updates (e.g., toggled roles, verification sent)
  const handleUpdateUser = (updatedFields: Partial<User>) => {
    if (!currentUser) return;
    setCurrentUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updatedFields };
      // Also sync it back in the main users list
      setUsers(all => all.map(u => u.id === prev.id ? next : u));
      return next;
    });

    // Log the update
    if (updatedFields.verificationStatus === 'pending') {
      pushAuditLog(
        currentUser.id,
        currentUser.name,
        'تقديم مستند التوثيق',
        'قام المستخدم برفق صور بطاقة الهوية الوطنية (وجه وخلف) لتوثيق الحساب بالبوابة الموحدة.'
      );
    } else if (updatedFields.activeRole) {
      pushAuditLog(
        currentUser.id,
        currentUser.name,
        'تغيير الدور النشط',
        `تم تحويل دور الحساب الموحد النشط بنجاح إلى: ${
          updatedFields.activeRole === 'buyer' ? 'مشتري' : updatedFields.activeRole === 'seller' ? 'بائع' : updatedFields.activeRole === 'landlord' ? 'مؤجر' : 'مستأجر'
        }`
      );
    }
  };

  // 2. Audit logs utility
  const pushAuditLog = (userId: string, userName: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // 3. Submitting new properties (Adds property to list with 'pending' status for moderation)
  const handleAddPropertySubmit = (propertyFields: Partial<Property>) => {
    if (!currentUser) return;
    const newProp: Property = {
      id: `prop_${Date.now()}`,
      title: propertyFields.title || '',
      description: propertyFields.description || '',
      type: propertyFields.type || 'sale',
      propertyType: propertyFields.propertyType || 'apartment',
      price: propertyFields.price || 0,
      area: propertyFields.area || 0,
      rooms: propertyFields.rooms || 3,
      bathrooms: propertyFields.bathrooms || 2,
      floor: propertyFields.floor || 1,
      yearBuilt: propertyFields.yearBuilt || 2025,
      finishing: propertyFields.finishing || 'super-lux',
      direction: propertyFields.direction || 'شمالية',
      address: propertyFields.address || '',
      city: propertyFields.city || 'الرياض',
      lat: propertyFields.lat || 24.7136,
      lng: propertyFields.lng || 46.6753,
      images: propertyFields.images || [],
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerPhone: currentUser.phone,
      isVerified: currentUser.verificationStatus === 'verified', // matches user status
      isFeatured: false,
      status: 'pending', // Pending Admin moderation
      features: propertyFields.features || [],
      nearPlaces: propertyFields.nearPlaces || [],
      viewsCount: 0,
      favoritesCount: 0,
      createdAt: new Date().toISOString()
    };

    setProperties(prev => [newProp, ...prev]);
    setActiveTab('map'); // Return to map
    
    pushAuditLog(
      currentUser.id,
      currentUser.name,
      'إعلان عقاري جديد',
      `أضاف عقاراً جديداً للـ ${newProp.type === 'sale' ? 'بيع' : 'إيجار'}: "${newProp.title}" بقيمة ${newProp.price.toLocaleString()} ر.س. حالة الإعلان: بانتظار مراجعة الإدارة.`
    );
  };

  // 4. Admin Approving/Rejecting Pending properties
  const handleApproveProperty = (id: string, status: 'available' | 'rejected' | 'sold' | 'rented') => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    const propObj = properties.find(p => p.id === id);
    
    if (propObj) {
      pushAuditLog(
        'admin_user',
        'المدير العام للمنصة',
        status === 'available' ? 'اعتماد إعلان عقاري' : 'رفض إعلان عقاري',
        `تم تعديل حالة إعلان عقار "${propObj.title}" إلى: ${
          status === 'available' ? 'منشور ونشط بالخريطة' : 'مرفوض لعدم مطابقة الصك'
        }`
      );
    }
  };

  // 5. Admin Approving User Identity Verification
  const handleVerifyUser = (userId: string, status: 'verified' | 'rejected') => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      verificationStatus: status,
      isVerified: status === 'verified'
    } : u));

    // Also update currentUser state if it matches
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          verificationStatus: status,
          isVerified: status === 'verified'
        };
      });
    }

    const userObj = users.find(u => u.id === userId);
    if (userObj) {
      pushAuditLog(
        'admin_user',
        'المدير العام للمنصة',
        status === 'verified' ? 'قبول توثيق الهوية' : 'رفض توثيق الهوية',
        `تم التحقق من هوية المستخدم "${userObj.name}" وتفعيل حالة التوثيق المعتمدة له بنجاح بالربط الخارجي.`
      );
    }
  };

  // Administrative Control Handlers for Posts and User Accounts
  const handleAdminAddProperty = (newProp: Property) => {
    setProperties(prev => [newProp, ...prev]);
    pushAuditLog('admin_user', 'المدير العام للمنصة', 'إضافة إعلان كمسؤول', `قام المدير العام بإضافة الإعلان الجديد: "${newProp.title}" بقيمة ${newProp.price.toLocaleString()} ج.م.`);
  };

  const handleAdminEditProperty = (edited: Property) => {
    setProperties(prev => prev.map(p => p.id === edited.id ? edited : p));
    pushAuditLog('admin_user', 'المدير العام للمنصة', 'تعديل إعلان كمسؤول', `قام المدير العام بتعديل بيانات الإعلان: "${edited.title}".`);
  };

  const handleAdminDeleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    pushAuditLog('admin_user', 'المدير العام للمنصة', 'حذف إعلان كمسؤول', `تم حذف الإعلان العقاري ذو المعرف (#${id}) نهائياً من قبل الإدارة.`);
  };

  const handleAdminAddUser = async (newUser: User, passwordPlain?: string) => {
    setUsers(prev => [newUser, ...prev]);
    if (passwordPlain) {
      try {
        const hashed = await hashPassword(passwordPlain);
        const storedPasswords = JSON.parse(localStorage.getItem('aqar_user_passwords') || '{}');
        storedPasswords[newUser.id] = hashed;
        localStorage.setItem('aqar_user_passwords', JSON.stringify(storedPasswords));
      } catch (err) {
        console.error('Error hashing user password on admin add:', err);
      }
    }
    pushAuditLog('admin_user', 'المدير العام للمنصة', 'إنشاء حساب كمسؤول', `قام المدير العام بإنشاء حساب مستخدم جديد: "${newUser.name}" (${newUser.email}).`);
  };

  const handleAdminEditUser = (edited: User) => {
    setUsers(prev => prev.map(u => u.id === edited.id ? edited : u));
    if (currentUser && currentUser.id === edited.id) {
      setCurrentUser(edited);
    }
    pushAuditLog('admin_user', 'المدير العام للمنصة', 'تعديل حساب كمسؤول', `قام المدير العام بتحديث بيانات حساب "${edited.name}".`);
  };

  const handleAdminDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    pushAuditLog('admin_user', 'المدير العام للمنصة', 'حذف حساب كمسؤول', `تم حذف حساب المستخدم ذو المعرف (#${id}) نهائياً من قبل الإدارة.`);
  };

  const handleAdminToggleRestrictUser = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isRestricted: !u.isRestricted } : u));
    const target = users.find(u => u.id === id);
    if (target) {
      const willBeRestricted = !target.isRestricted;
      pushAuditLog('admin_user', 'المدير العام للمنصة', willBeRestricted ? 'تقييد الحساب' : 'إلغاء تقييد الحساب', `تم ${willBeRestricted ? 'تقييد وحظر' : 'إلغاء حظر وتفعيل'} حساب المستخدم "${target.name}" لمخالفة الشروط.`);
    }
  };

  // 6. Admin Toggling Featured glows of properties
  const handleToggleFeatured = (id: string) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, isFeatured: !p.isFeatured } : p));
  };

  // 7. Internal messenger - sending message
  const handleSendMessage = (text: string, receiverId: string, propertyId: string) => {
    if (!currentUser) return;
    const prop = properties.find(p => p.id === propertyId);
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      receiverId,
      propertyName: prop ? prop.title : 'استفسار عام',
      propertyId,
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);

    pushAuditLog(
      currentUser.id,
      currentUser.name,
      'إرسال رسالة استفسار',
      `أرسل رسالة فورية عبر الموقع للمعلن حول عقار "${prop ? prop.title : 'مجهول'}": "${text.substring(0, 40)}..."`
    );
  };

  // 8. Financial payments for commission invoices
  const handlePayInvoice = (id: string) => {
    if (!currentUser) return;
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      pushAuditLog(
        currentUser.id,
        currentUser.name,
        'سداد عمولة الصفقة',
        `تم سداد فاتورة العمولة بالبوابة العقارية الموحدة بقيمة ${inv.commissionAmount.toLocaleString()} ر.س بنجاح للصفقة #${inv.id}.`
      );
    }
  };

  // Admin marking paid manually
  const handleMarkInvoicePaidFromAdmin = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      pushAuditLog(
        'admin_user',
        'المدير العام للمنصة',
        'تسجيل سداد يدوي',
        `تم تسجيل تسوية سداد يدوية لفاتورة عمولة الصفقة #${inv.id} البالغة ${inv.commissionAmount.toLocaleString()} ر.س.`
      );
    }
  };

  // 9. Manage favorites list
  const handleAddToFavorites = (propertyId: string) => {
    setFavorites(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  // 10. AI natural language search filters receiver callback
  const handleApplyAiSearchFilters = (filters: any, explanation: string) => {
    setAiFilters(filters);
    setAiExplanation(explanation);
    
    // Auto switch to interactive map to show parsed properties
    setActiveTab('map');
    setSelectedPropertyId(null); // Return to list view

    if (filters.city) {
      setActiveCity(filters.city);
    }
  };

  const handleClearAiFilters = () => {
    setAiFilters(null);
    setAiExplanation(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('aqar_current_user');
    localStorage.removeItem('aqar_is_admin_authenticated');
    setActiveTab('map');
  };

  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user, isAdmin) => {
          setCurrentUser(user);
          setIsAdminAuthenticated(isAdmin);
          if (isAdmin) {
            setActiveTab('admin');
          } else {
            setActiveTab('map');
          }
        }}
        usersList={users}
        onRegisterUser={(newUser) => {
          setUsers(prev => [...prev, newUser]);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-950 font-sans selection:bg-amber-500 selection:text-slate-950 ${activeTab === 'map' ? 'h-screen overflow-hidden' : ''}`} dir="rtl">
      
      {/* Header element - hidden on Map view for true full-screen immersion */}
      {activeTab !== 'map' && (
        <Header
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            // When navigating from tabs, dismiss active property details screen
            if (tab !== 'map') setSelectedPropertyId(null);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Main Container viewport */}
      <main className={activeTab === 'map' ? 'h-screen w-screen relative' : 'pb-16'}>
        
        {/* Render Tab views */}

        {/* 1. INTERACTIVE MAP VIEW */}
        {activeTab === 'map' && (
          <div className="h-full w-full relative overflow-hidden">
            {/* AI parsed filter banner if active (styled to float elegantly over the map) */}
            <AnimatePresence>
              {aiExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-4"
                >
                  <div className="bg-purple-950/90 backdrop-blur-md border border-purple-500/30 p-3.5 rounded-2xl shadow-2xl flex justify-between items-center gap-4 text-right">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-400 animate-pulse flex-shrink-0" />
                      <div className="text-xs">
                        <span className="font-extrabold text-purple-300 block mb-0.5">البحث بالذكاء الاصطناعي نشط:</span>
                        <p className="text-slate-200">{aiExplanation}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleClearAiFilters}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black rounded-lg flex items-center gap-1 transition-all flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                      إلغاء التصفية
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Always keep Interactive Map mounted so panning/zooming position is never lost */}
            <InteractiveMap
              properties={properties}
              activeCity={activeCity}
              setActiveCity={setActiveCity}
              onSelectProperty={(property) => setSelectedPropertyId(property ? property.id : null)}
              selectedProperty={selectedProperty}
              aiSuggestedFilters={aiFilters}
              // Pass navigation parameters for floating Snapchat bottom bar
              currentUser={currentUser}
              onUpdateUser={handleUpdateUser}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />

            {/* Slide-in Property details drawer - floats over the map */}
            <AnimatePresence>
              {selectedProperty && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 170 }}
                  className="absolute inset-y-0 right-0 z-40 w-full md:w-[500px] lg:w-[600px] bg-slate-950/95 backdrop-blur-md border-r border-slate-800 shadow-2xl flex flex-col h-full"
                >
                  <div className="overflow-y-auto h-full p-4 md:p-6 no-scrollbar">
                    <PropertyDetails
                      property={selectedProperty}
                      onBack={() => setSelectedPropertyId(null)}
                      onSendMessage={(text, propertyId) => {
                        const prop = properties.find(p => p.id === propertyId);
                        if (prop) {
                          handleSendMessage(text, prop.ownerId, propertyId);
                        }
                      }}
                      onAddToFavorites={handleAddToFavorites}
                      isFavorite={favorites.includes(selectedProperty.id)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 2. USER DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <UserDashboard
            user={currentUser}
            onUpdateUser={handleUpdateUser}
            properties={properties}
            onDeleteProperty={(id) => {
              setProperties(prev => prev.filter(p => p.id !== id));
              pushAuditLog(currentUser.id, currentUser.name, 'حذف إعلان عقاري', `قام المستخدم بحذف الإعلان العقاري (#${id}) نهائياً.`);
            }}
            onEditProperty={(edited) => {
              setProperties(prev => prev.map(p => p.id === edited.id ? edited : p));
              pushAuditLog(currentUser.id, currentUser.name, 'تعديل الإعلان العقاري', `قام المستخدم بتعديل تفاصيل ووصف الإعلان: "${edited.title}".`);
            }}
            messages={messages}
            onSendMessage={handleSendMessage}
            invoices={invoices}
            onPayInvoice={handlePayInvoice}
          />
        )}

        {/* 3. ADMIN CONTROL CENTER VIEW */}
        {activeTab === 'admin' && (
          currentUser?.id !== 'user_admin' && currentUser?.activeRole !== 'admin' ? (
            <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-center relative animate-fade-in" dir="rtl">
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-red-500/40" />
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto mb-3 animate-pulse">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">عذراً، الوصول مرفوض!</h3>
              <p className="text-xs text-slate-400 mt-2">لوحة الرقابة والتحكم مخصصة حصرياً لمدير المنصة.</p>
              <button onClick={() => setActiveTab('map')} className="mt-5 px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition-all shadow-md">
                العودة للخريطة
              </button>
            </div>
          ) : !isAdminAuthenticated ? (
            <div className="max-w-md mx-auto my-16 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative" dir="rtl">
              <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">التحقق الإداري الثلاثي للرقابة</h3>
                <p className="text-xs text-slate-400 mt-1">يُرجى إدخال بيانات التوثيق الثلاثية الخاصة بالإدارة العامة للمنصة العقارية.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const u = formData.get('admin_u') as string;
                const p = formData.get('admin_p') as string;
                const s = formData.get('admin_s') as string;
                if (u === 'admin' && isSecretMatch(p) && isSecretMatch(s)) {
                  setIsAdminAuthenticated(true);
                } else {
                  const errEl = document.getElementById('admin-gate-error');
                  if (errEl) {
                    errEl.innerText = 'عذراً، بيانات دخول الإدارة غير صحيحة أو الرمز السري غير مطابق!';
                    errEl.classList.remove('hidden');
                  }
                }
              }} className="space-y-4">
                <div id="admin-gate-error" className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[11px] font-bold hidden text-right">
                  عذراً، بيانات دخول الإدارة غير صحيحة أو الرمز السري غير مطابق!
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">اسم المستخدم (Username)</label>
                  <input
                    type="text"
                    name="admin_u"
                    required
                    placeholder="Username"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">كلمة المرور (Password)</label>
                  <input
                    type="password"
                    name="admin_p"
                    required
                    placeholder="Password"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400">الرمز السري (Secret Code)</label>
                  <input
                    type="password"
                    name="admin_s"
                    required
                    placeholder="Secret Code"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all mt-4"
                >
                  <ShieldAlert className="w-4 h-4" />
                  التحقق وفتح لوحة الرقابة
                </button>
              </form>
            </div>
          ) : (
            <AdminDashboard
              users={users}
              onVerifyUser={handleVerifyUser}
              properties={properties}
              onApproveProperty={handleApproveProperty}
              onToggleFeatured={handleToggleFeatured}
              invoices={invoices}
              onMarkInvoicePaidFromAdmin={handleMarkInvoicePaidFromAdmin}
              auditLogs={auditLogs}
              onAddProperty={handleAdminAddProperty}
              onEditProperty={handleAdminEditProperty}
              onDeleteProperty={handleAdminDeleteProperty}
              onAddUser={handleAdminAddUser}
              onEditUser={handleAdminEditUser}
              onDeleteUser={handleAdminDeleteUser}
              onToggleRestrictUser={handleAdminToggleRestrictUser}
            />
          )
        )}

        {/* 4. AI CO-PILOT ASSISTANT VIEW */}
        {activeTab === 'ai' && (
          <AiAssistant
            onApplyAiSearchFilters={handleApplyAiSearchFilters}
            activeCity={activeCity}
          />
        )}

        {/* 5. ADD PROPERTY FORM WIZARD */}
        {activeTab === 'add' && (
          <AddProperty
            onAddProperty={handleAddPropertySubmit}
            onCancel={() => setActiveTab('map')}
            activeCity={activeCity}
          />
        )}

      </main>

      {/* Mobile Floating Action Button (FAB) for publishing - ALWAYS highly visible on mobile */}
      {currentUser && activeTab !== 'add' && (
        <div className="fixed bottom-6 left-6 z-40 md:hidden">
          <button
            onClick={() => {
              let updatedRoles = [...currentUser.roles];
              let needsUpdate = false;
              if (!updatedRoles.includes('seller') && !updatedRoles.includes('landlord')) {
                updatedRoles.push('seller');
                needsUpdate = true;
              }
              const activeRole = currentUser.activeRole === 'seller' || currentUser.activeRole === 'landlord' ? currentUser.activeRole : 'seller';
              if (currentUser.activeRole !== activeRole) {
                needsUpdate = true;
              }
              if (needsUpdate) {
                handleUpdateUser({ roles: updatedRoles, activeRole });
              }
              setActiveTab('add');
            }}
            className="flex items-center gap-1.5 px-4.5 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-full shadow-2xl shadow-amber-500/40 border-2 border-slate-900 active:scale-95 focus:outline-none"
            style={{ direction: 'rtl' }}
          >
            <Plus className="w-5 h-5 stroke-[3] text-slate-950" />
            <span>أعلن عن عقارك</span>
          </button>
        </div>
      )}

    </div>
  );
}
