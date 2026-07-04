/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { User, Property, Invoice, AuditLog, UserRole, PropertyType, OperationType, PropertyStatus, FinishingType, VerificationStatus } from '../types';
import { 
  Users, 
  FileCheck, 
  ShieldAlert, 
  TrendingUp, 
  DollarSign, 
  ListFilter, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Calendar, 
  BarChart3, 
  Search, 
  Activity,
  Plus,
  Trash2,
  Edit,
  Eye,
  Shield,
  Ban,
  Check,
  X,
  MapPin,
  Building,
  Home,
  UserCheck,
  UserX,
  Sparkles,
  PlusCircle,
  MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  users: User[];
  onVerifyUser: (id: string, status: 'verified' | 'rejected') => void;
  properties: Property[];
  onApproveProperty: (id: string, status: 'available' | 'rejected' | 'sold' | 'rented') => void;
  onToggleFeatured: (id: string) => void;
  invoices: Invoice[];
  onMarkInvoicePaidFromAdmin: (id: string) => void;
  auditLogs: AuditLog[];
  
  // New administrative controls passed from App.tsx
  onAddProperty: (newProp: Property) => void;
  onEditProperty: (edited: Property) => void;
  onDeleteProperty: (id: string) => void;
  onAddUser: (newUser: User, passwordPlain?: string) => Promise<void> | void;
  onEditUser: (edited: User) => void;
  onDeleteUser: (id: string) => void;
  onToggleRestrictUser: (id: string) => void;
}

export default function AdminDashboard({
  users,
  onVerifyUser,
  properties,
  onApproveProperty,
  onToggleFeatured,
  invoices,
  onMarkInvoicePaidFromAdmin,
  auditLogs,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onToggleRestrictUser
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'approvals' | 'verifications' | 'posts' | 'users' | 'invoices' | 'logs'>('stats');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');

  // Deletion confirmation states (safer alternative to native blocked confirm inside iframe)
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Modals & Forms states
  const [showUserModal, setShowUserModal] = useState(false);
  const [userEditingData, setUserEditingData] = useState<User | null>(null); // null means adding a new user

  // Form states for User
  const [userFormName, setUserFormName] = useState('');
  const [userFormEmail, setUserFormEmail] = useState('');
  const [userFormPhone, setUserFormPhone] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormRoles, setUserFormRoles] = useState<UserRole[]>(['buyer']);
  const [userFormActiveRole, setUserFormActiveRole] = useState<UserRole>('buyer');
  const [userFormIsVerified, setUserFormIsVerified] = useState(false);
  const [userFormVerificationStatus, setUserFormVerificationStatus] = useState<VerificationStatus>('unverified');
  const [userFormIsRestricted, setUserFormIsRestricted] = useState(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);

  // Property Modal states
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [propertyEditingData, setPropertyEditingData] = useState<Property | null>(null); // null means adding new

  // Form states for Property
  const [propFormTitle, setPropFormTitle] = useState('');
  const [propFormDescription, setPropFormDescription] = useState('');
  const [propFormType, setPropFormType] = useState<OperationType>('sale');
  const [propFormPropType, setPropFormPropType] = useState<PropertyType>('apartment');
  const [propFormPrice, setPropFormPrice] = useState<number>(0);
  const [propFormArea, setPropFormArea] = useState<number>(0);
  const [propFormRooms, setPropFormRooms] = useState<number>(3);
  const [propFormBathrooms, setPropFormBathrooms] = useState<number>(2);
  const [propFormAddress, setPropFormAddress] = useState('');
  const [propFormCity, setPropFormCity] = useState('الرياض');
  const [propFormOwnerId, setPropFormOwnerId] = useState('user_admin');
  const [propFormOwnerName, setPropFormOwnerName] = useState('المدير العام');
  const [propFormOwnerPhone, setPropFormOwnerPhone] = useState('0500000000');
  const [propFormStatus, setPropFormStatus] = useState<PropertyStatus>('available');
  const [propFormIsFeatured, setPropFormIsFeatured] = useState(false);
  const [propFormImages, setPropFormImages] = useState<string>('');
  const [propFormError, setPropFormError] = useState<string | null>(null);

  // 1. Statistics Aggregations
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalProps = properties.length;
    const pendingProps = properties.filter(p => p.status === 'pending').length;
    const activeProps = properties.filter(p => p.status === 'available').length;
    const pendingVerifications = users.filter(u => u.verificationStatus === 'pending').length;
    const restrictedCount = users.filter(u => u.isRestricted).length;
    
    let totalCommissions = 0;
    let pendingCommissions = 0;
    invoices.forEach(inv => {
      if (inv.status === 'paid') {
        totalCommissions += inv.commissionAmount;
      } else {
        pendingCommissions += inv.commissionAmount;
      }
    });

    return {
      totalUsers,
      totalProps,
      pendingProps,
      activeProps,
      pendingVerifications,
      totalCommissions,
      pendingCommissions,
      restrictedCount
    };
  }, [users, properties, invoices]);

  // Pending properties moderation list
  const pendingProperties = useMemo(() => {
    return properties.filter(p => p.status === 'pending');
  }, [properties]);

  // Pending identity verifications list
  const pendingUserVerifications = useMemo(() => {
    return users.filter(u => u.verificationStatus === 'pending');
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery) return users;
    const query = userSearchQuery.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query) || 
      u.phone.includes(query) || 
      u.id.includes(query)
    );
  }, [users, userSearchQuery]);

  // Filtered properties/posts list
  const filteredProperties = useMemo(() => {
    if (!postSearchQuery) return properties;
    const query = postSearchQuery.toLowerCase();
    return properties.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.city.toLowerCase().includes(query) || 
      p.address.toLowerCase().includes(query) || 
      p.ownerName.toLowerCase().includes(query) || 
      p.id.includes(query)
    );
  }, [properties, postSearchQuery]);

  // Filter audit logs or search
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return auditLogs;
    return auditLogs.filter(log => 
      log.userName.includes(searchQuery) || 
      log.action.includes(searchQuery) || 
      log.details.includes(searchQuery)
    );
  }, [auditLogs, searchQuery]);

  // Handle opening user modal
  const handleOpenUserModal = (user: User | null) => {
    setUserEditingData(user);
    if (user) {
      setUserFormName(user.name);
      setUserFormEmail(user.email);
      setUserFormPhone(user.phone);
      setUserFormPassword(''); // Password is not loaded back for security, can enter new one to reset
      setUserFormRoles(user.roles);
      setUserFormActiveRole(user.activeRole);
      setUserFormIsVerified(user.isVerified);
      setUserFormVerificationStatus(user.verificationStatus);
      setUserFormIsRestricted(!!user.isRestricted);
    } else {
      setUserFormName('');
      setUserFormEmail('');
      setUserFormPhone('');
      setUserFormPassword('');
      setUserFormRoles(['buyer']);
      setUserFormActiveRole('buyer');
      setUserFormIsVerified(false);
      setUserFormVerificationStatus('unverified');
      setUserFormIsRestricted(false);
    }
    setUserFormError(null);
    setShowUserModal(true);
  };

  // Handle user form submit
  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError(null);

    if (!userFormName.trim() || !userFormPhone.trim() || !userFormEmail.trim()) {
      setUserFormError('الرجاء تعبئة جميع الحقول المطلوبة (الاسم، الهاتف، البريد).');
      return;
    }

    if (!userEditingData && userFormPassword.length !== 5) {
      setUserFormError('للأعضاء الجدد، يجب تعيين كلمة مرور من 5 خانات بالضبط (مثال: 12345).');
      return;
    }

    if (userFormPassword && userFormPassword.length !== 5) {
      setUserFormError('يجب أن تتكون كلمة المرور من 5 خانات بالضبط.');
      return;
    }

    const rolesList = userFormRoles.length > 0 ? userFormRoles : ['buyer'];

    if (userEditingData) {
      // Editing existing user
      const updatedUser: User = {
        ...userEditingData,
        name: userFormName.trim(),
        email: userFormEmail.trim(),
        phone: userFormPhone.trim(),
        roles: rolesList,
        activeRole: userFormActiveRole,
        isVerified: userFormIsVerified,
        verificationStatus: userFormVerificationStatus,
        isRestricted: userFormIsRestricted,
      };

      onEditUser(updatedUser);
      
      // If password is set, we trigger password update
      if (userFormPassword) {
        // We trigger add user logic or just save password under same id
        await onAddUser(updatedUser, userFormPassword);
      }
    } else {
      // Adding brand new user
      const newUserId = `user_${Date.now()}`;
      const newUser: User = {
        id: newUserId,
        name: userFormName.trim(),
        email: userFormEmail.trim(),
        phone: userFormPhone.trim(),
        roles: rolesList,
        activeRole: userFormActiveRole,
        isVerified: userFormIsVerified,
        verificationStatus: userFormVerificationStatus,
        isRestricted: userFormIsRestricted,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=100&h=100&fit=crop`
      };

      await onAddUser(newUser, userFormPassword);
    }

    setShowUserModal(false);
  };

  // Handle opening property modal
  const handleOpenPropertyModal = (prop: Property | null) => {
    setPropertyEditingData(prop);
    if (prop) {
      setPropFormTitle(prop.title);
      setPropFormDescription(prop.description);
      setPropFormType(prop.type);
      setPropFormPropType(prop.propertyType);
      setPropFormPrice(prop.price);
      setPropFormArea(prop.area);
      setPropFormRooms(prop.rooms);
      setPropFormBathrooms(prop.bathrooms);
      setPropFormAddress(prop.address);
      setPropFormCity(prop.city);
      setPropFormOwnerId(prop.ownerId);
      setPropFormOwnerName(prop.ownerName);
      setPropFormOwnerPhone(prop.ownerPhone);
      setPropFormStatus(prop.status);
      setPropFormIsFeatured(prop.isFeatured);
      setPropFormImages(prop.images.join(', '));
    } else {
      setPropFormTitle('');
      setPropFormDescription('');
      setPropFormType('sale');
      setPropFormPropType('apartment');
      setPropFormPrice(0);
      setPropFormArea(0);
      setPropFormRooms(3);
      setPropFormBathrooms(2);
      setPropFormAddress('');
      setPropFormCity('الرياض');
      setPropFormOwnerId('user_admin');
      setPropFormOwnerName('المدير العام');
      setPropFormOwnerPhone('0500000000');
      setPropFormStatus('available');
      setPropFormIsFeatured(false);
      setPropFormImages('');
    }
    setPropFormError(null);
    setShowPropertyModal(true);
  };

  // Handle property form submit
  const handlePropertyFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPropFormError(null);

    if (!propFormTitle.trim() || !propFormDescription.trim() || !propFormAddress.trim()) {
      setPropFormError('الرجاء تعبئة جميع الحقول المطلوبة للعقار (العنوان، الوصف، العنوان التفصيلي).');
      return;
    }

    if (propFormPrice <= 0 || propFormArea <= 0) {
      setPropFormError('يجب أن تكون قيم السعر والمساحة أكبر من صفر.');
      return;
    }

    // Process image URLs
    let imagesArr = propFormImages
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    if (imagesArr.length === 0) {
      // Use fallback premium placeholder matching types
      imagesArr = [
        propFormPropType === 'villa' 
          ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop'
      ];
    }

    if (propertyEditingData) {
      // Edit
      const updatedProp: Property = {
        ...propertyEditingData,
        title: propFormTitle.trim(),
        description: propFormDescription.trim(),
        type: propFormType,
        propertyType: propFormPropType,
        price: Number(propFormPrice),
        area: Number(propFormArea),
        rooms: Number(propFormRooms),
        bathrooms: Number(propFormBathrooms),
        address: propFormAddress.trim(),
        city: propFormCity,
        ownerId: propFormOwnerId,
        ownerName: propFormOwnerName,
        ownerPhone: propFormOwnerPhone,
        status: propFormStatus,
        isFeatured: propFormIsFeatured,
        images: imagesArr,
      };

      onEditProperty(updatedProp);
    } else {
      // Add new
      const newPropId = `prop_${Date.now()}`;
      const newProp: Property = {
        id: newPropId,
        title: propFormTitle.trim(),
        description: propFormDescription.trim(),
        type: propFormType,
        propertyType: propFormPropType,
        price: Number(propFormPrice),
        area: Number(propFormArea),
        rooms: Number(propFormRooms),
        bathrooms: Number(propFormBathrooms),
        address: propFormAddress.trim(),
        city: propFormCity,
        ownerId: propFormOwnerId,
        ownerName: propFormOwnerName,
        ownerPhone: propFormOwnerPhone,
        status: propFormStatus,
        isFeatured: propFormIsFeatured,
        images: imagesArr,
        isVerified: true,
        viewsCount: 0,
        favoritesCount: 0,
        createdAt: new Date().toISOString(),
        nearPlaces: [],
        features: [],
        yearBuilt: 2026,
        finishing: 'super-lux',
        direction: 'شمالية',
        lat: 24.7136,
        lng: 46.6753,
      };

      onAddProperty(newProp);
    }

    setShowPropertyModal(false);
  };

  // Toggle user role checkbox
  const handleToggleUserRole = (role: UserRole) => {
    if (userFormRoles.includes(role)) {
      if (userFormRoles.length > 1) {
        setUserFormRoles(prev => prev.filter(r => r !== role));
      }
    } else {
      setUserFormRoles(prev => [...prev, role]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 text-right" dir="rtl">
      
      {/* Top Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-500 animate-pulse" />
            لوحة تحكم الأدمن والرقابة العامة
          </h2>
          <p className="text-xs text-slate-400">مراقبة وإدارة المنشورات، الحسابات، مراجعة واعتماد صكوك الإعلانات، وتحصيل العمولات.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {(['stats', 'approvals', 'verifications', 'posts', 'users', 'invoices', 'logs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'stats' ? 'لوحة المراقبة' : 
               tab === 'approvals' ? `مراجعة الإعلانات (${pendingProperties.length})` : 
               tab === 'verifications' ? `توثيق الهويات (${pendingUserVerifications.length})` : 
               tab === 'posts' ? 'إدارة المنشورات' :
               tab === 'users' ? 'إدارة الحسابات' : 
               tab === 'invoices' ? 'سجل العمولات' : 'سجل العمليات (Audit Logs)'}
            </button>
          ))}
        </div>
      </div>

      {/* STATS OVERVIEW DASHBOARD PANEL */}
      {activeTab === 'stats' && (
        <div className="space-y-8">
          
          {/* Quick HUD Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-md">
              <span className="text-xs text-slate-400 block mb-1">العمولات المحصلة</span>
              <p className="text-2xl font-black text-emerald-400">{stats.totalCommissions.toLocaleString()} ج.م</p>
              <span className="text-[10px] text-slate-500 mt-1 block">مكتملة ومسددة إلكترونياً</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-md">
              <span className="text-xs text-slate-400 block mb-1">عمولات قيد التحصيل</span>
              <p className="text-2xl font-black text-amber-400">{stats.pendingCommissions.toLocaleString()} ج.م</p>
              <span className="text-[10px] text-slate-500 mt-1 block">بانتظار سداد المعلنين</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-md">
              <span className="text-xs text-slate-400 block mb-1">المنشورات الكلية</span>
              <p className="text-2xl font-black text-blue-400">{stats.totalProps} إعلان</p>
              <span className="text-[10px] text-slate-500 mt-1 block">إعلانات نشطة ومعلقة</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-md">
              <span className="text-xs text-slate-400 block mb-1">المستخدمين الكلي</span>
              <p className="text-2xl font-black text-white">{stats.totalUsers} حساب</p>
              <span className="text-[10px] text-slate-500 mt-1 block">{stats.restrictedCount} حسابات مقيدة حالياً</span>
            </div>
          </div>

          {/* Shaded area commission growth chart */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">مخطط إيرادات العمولات الشهري لعام 2026 (بالريال السعودي)</h3>
              <p className="text-xs text-slate-400">إحصاءات التدفق المالي لقيمة العمولات المحصلة إلكترونياً من الصفقات الناجحة.</p>
            </div>

            <div className="w-full h-64 bg-slate-950/70 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex items-end">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
                <defs>
                  <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="50" x2="600" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="#1e293b" strokeWidth="1" strokeDasharray="5,5" />

                <path
                  d="M 20 180 L 100 160 Q 200 120 300 80 T 500 40 L 580 30 L 580 180 Z"
                  fill="url(#areaGrad)"
                />

                <path
                  d="M 20 180 L 100 160 Q 200 120 300 80 T 500 40 L 580 30"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  filter="url(#glow-line)"
                />

                <circle cx="20" cy="180" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="100" cy="160" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="300" cy="80" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="500" cy="40" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="580" cy="30" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              </svg>

              <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[10px] text-slate-500 font-mono">
                <span>يناير</span>
                <span>فبراير</span>
                <span>مارس</span>
                <span>أبريل</span>
                <span>مايو</span>
                <span>يونيو (الحالي)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVALS: Properties verification list */}
      {activeTab === 'approvals' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white mb-1">مراجعة واعتماد الإعلانات السكنية الجديدة</h3>
            <p className="text-xs text-slate-400">يرجى تدقيق تفاصيل الإعلان والتأكد من تطابق الإحداثيات وتوفر الصك قبل النشر للجمهور على الخريطة.</p>
          </div>

          {pendingProperties.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              لا توجد إعلانات معلقة بانتظار المراجعة والاعتماد حالياً. جميع الطلبات مفرزة ومكتملة!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProperties.map(p => (
                <div key={p.id} className="p-5 bg-slate-850 rounded-2xl border border-slate-800 flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    <img src={p.images[0]} alt={p.title} className="w-24 h-20 rounded-xl object-cover border border-slate-700" />
                    <div className="space-y-1 text-right min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] px-2 py-0.5 rounded-md font-bold">{p.city}</span>
                        <span className="bg-slate-800 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded-md">{p.propertyType === 'apartment' ? 'شقة' : 'فيلا'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{p.title}</h4>
                      <p className="text-xs text-amber-400 font-extrabold">{p.price.toLocaleString()} ر.س / ج.م</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 mt-1">{p.description}</p>
                    </div>
                  </div>

                  <div className="flex lg:flex-col justify-end gap-2 items-center lg:items-end w-full lg:w-auto h-full justify-center">
                    <span className="text-[10px] text-slate-500 block">المعلن: {p.ownerName}</span>
                    <div className="flex gap-1.5 w-full">
                      <button
                        onClick={() => onApproveProperty(p.id, 'available')}
                        className="flex-1 lg:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
                      >
                        موافقة ونشر الإعلان
                      </button>
                      <button
                        onClick={() => onApproveProperty(p.id, 'rejected')}
                        className="flex-1 lg:flex-none px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-semibold rounded-xl transition-all"
                      >
                        رفض الطلب
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VERIFICATIONS: identity verifications */}
      {activeTab === 'verifications' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white mb-1">طلبات توثيق هويات معلنين العقار</h3>
            <p className="text-xs text-slate-400">قم بمطابقة وثائق الهوية الوطنية المرفوعة يدوياً بأسماء الحسابات قبل منحها الشارات المعتمدة.</p>
          </div>

          {pendingUserVerifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              لا توجد طلبات توثيق هوية وطنية قيد الانتظار حالياً. جميع المعلنين النشطين معتمدين بالكامل!
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUserVerifications.map(u => (
                <div key={u.id} className="p-4 bg-slate-850 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('data:image')) ? (
                      <img src={u.avatar} alt={u.name} className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-800" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl border border-slate-700 bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center select-none">
                        {u.name ? u.name.trim().charAt(0) : 'ع'}
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">{u.name}</h4>
                      <p className="text-[10px] text-slate-400">{u.email} • {u.phone}</p>
                      
                      <div className="flex flex-wrap gap-3 mt-2">
                        <div>
                          <span className="text-[9px] text-slate-500 block">وجه بطاقة الهوية:</span>
                          <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 mt-1">
                            {u.idCardUrl?.startsWith('data:image') || u.idCardUrl?.startsWith('http') ? (
                              <img src={u.idCardUrl} alt="وجه البطاقة" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 text-[9px] font-mono p-2 text-center leading-normal">
                                {u.idCardUrl || 'غير متوفر'}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 block">خلفية بطاقة الهوية:</span>
                          <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 mt-1">
                            {u.idCardBackUrl?.startsWith('data:image') || u.idCardBackUrl?.startsWith('http') ? (
                              <img src={u.idCardBackUrl} alt="ظهر البطاقة" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 text-[9px] font-mono p-2 text-center leading-normal">
                                {u.idCardBackUrl || 'غير متوفر'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onVerifyUser(u.id, 'verified')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      اعتماد الهوية
                    </button>
                    <button
                      onClick={() => onVerifyUser(u.id, 'rejected')}
                      className="px-3.5 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-semibold rounded-lg transition-all"
                    >
                      رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POSTS: PROPERTIES/POSTS CONTROL SECTION */}
      {activeTab === 'posts' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white mb-1">التحكم في المنشورات العقارية العامة</h3>
              <p className="text-xs text-slate-400">تحكم بجميع منشورات العقارات بالإزالة، التعديل أو إضافة عروض عقارية معتمدة جديدة كمسؤول.</p>
            </div>
            
            <button
              onClick={() => handleOpenPropertyModal(null)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              إضافة منشور جديد
            </button>
          </div>

          {/* Search bar for Posts */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="ابحث بالاسم، المدينة، العنوان، أو اسم المعلن..."
              value={postSearchQuery}
              onChange={(e) => setPostSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 bg-slate-850 border border-slate-800 text-xs text-white rounded-xl placeholder-slate-500 text-right focus:outline-none focus:border-amber-500 font-sans"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProperties.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                لا توجد منشورات مطابقة لبحثك.
              </div>
            ) : (
              filteredProperties.map(p => (
                <div key={p.id} className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex justify-between gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex gap-3 text-right">
                    <img src={p.images[0]} alt={p.title} className="w-20 h-20 rounded-xl object-cover border border-slate-700 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-800 text-[8px] font-bold text-slate-300 px-1.5 py-0.5 rounded">
                          {p.propertyType === 'apartment' ? 'شقة' : p.propertyType === 'villa' ? 'فيلا' : p.propertyType === 'land' ? 'أرض' : 'تجاري'}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          p.type === 'sale' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {p.type === 'sale' ? 'بيع' : 'إيجار'}
                        </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          p.status === 'available' ? 'bg-green-500/15 text-green-400' :
                          p.status === 'pending' ? 'bg-amber-500/15 text-amber-400 animate-pulse' :
                          'bg-slate-800 text-slate-500'
                        }`}>
                          {p.status === 'available' ? 'منشور' : p.status === 'pending' ? 'قيد المراجعة' : 'مباع/مؤجر'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{p.title}</h4>
                      <p className="text-[10px] text-amber-400 font-black mt-0.5">{p.price.toLocaleString()} ج.م • {p.city}</p>
                      <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">المعلن: {p.ownerName} ({p.ownerPhone})</p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col justify-between items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                    <div className="flex gap-1 items-center">
                      {deletingPropertyId === p.id ? (
                        <div className="flex gap-1 items-center bg-slate-950 border border-red-900/50 p-1 rounded-lg">
                          <span className="text-[10px] text-red-400 font-bold px-1 whitespace-nowrap">تأكيد الحذف؟</span>
                          <button
                            onClick={() => {
                              onDeleteProperty(p.id);
                              setDeletingPropertyId(null);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded"
                          >
                            نعم
                          </button>
                          <button
                            onClick={() => setDeletingPropertyId(null)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded"
                          >
                            لا
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenPropertyModal(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-400"
                            title="تعديل المنشور"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingPropertyId(p.id)}
                            className="p-1.5 bg-red-950/40 hover:bg-red-900/40 rounded-lg text-red-400 border border-red-900/30"
                            title="حذف المنشور"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">ID: {p.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* USERS: Users management directory list */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white mb-1">دليل الحسابات وإدارة الصلاحيات والتقييد</h3>
              <p className="text-xs text-slate-400">استعرض وسيطر على حسابات العملاء، وبائعي ومؤجري المنصة مع الصلاحيات وحظر المخالفين.</p>
            </div>

            <button
              onClick={() => handleOpenUserModal(null)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              إضافة حساب جديد
            </button>
          </div>

          {/* Search bar for Users */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، البريد الإلكتروني أو معرف الحساب..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 bg-slate-850 border border-slate-800 text-xs text-white rounded-xl placeholder-slate-500 text-right focus:outline-none focus:border-amber-500 font-sans"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                لا توجد حسابات مطابقة لبحثك.
              </div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className={`p-4 border rounded-2xl flex justify-between items-center flex-wrap md:flex-nowrap gap-3 transition-all ${
                  u.isRestricted 
                    ? 'bg-red-950/20 border-red-900/40 text-red-300' 
                    : 'bg-slate-850 border-slate-800 text-white'
                }`}>
                  <div className="flex gap-3 items-center text-right">
                    {u.avatar && (u.avatar.startsWith('http') || u.avatar.startsWith('data:image')) ? (
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0 bg-slate-800" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl border border-slate-700 bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0 select-none">
                        {u.name ? u.name.trim().charAt(0) : 'ع'}
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold flex items-center gap-1.5">
                        {u.name}
                        {u.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-green-400 fill-current" />}
                        {u.isRestricted && <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">محظور ومقيد</span>}
                      </h4>
                      <p className="text-[10px] text-slate-400">{u.email} • {u.phone}</p>
                      <div className="flex gap-1 mt-1">
                        {u.roles.map(role => (
                          <span key={role} className="bg-slate-800 text-[8px] font-bold text-slate-300 px-1.5 py-0.5 rounded-md">
                            {role === 'buyer' ? 'مشتري' : role === 'seller' ? 'بائع' : role === 'landlord' ? 'مؤجر' : role === 'tenant' ? 'مستأجر' : 'أدمن'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center w-full md:w-auto justify-end border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                      u.verificationStatus === 'verified' ? 'bg-green-500/15 text-green-400' :
                      u.verificationStatus === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-slate-800 text-slate-500'
                    }`}>
                      {u.verificationStatus === 'verified' ? 'موثق' : u.verificationStatus === 'pending' ? 'بانتظار التوثيق' : 'غير موثق'}
                    </span>
                    
                    {deletingUserId === u.id ? (
                      <div className="flex gap-1 items-center bg-slate-950 border border-red-900/50 p-1 rounded-lg">
                        <span className="text-[10px] text-red-400 font-bold px-1 whitespace-nowrap">تأكيد الحذف؟</span>
                        <button
                          onClick={() => {
                            onDeleteUser(u.id);
                            setDeletingUserId(null);
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded"
                        >
                          نعم
                        </button>
                        <button
                          onClick={() => setDeletingUserId(null)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[10px] font-bold rounded"
                        >
                          لا
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenUserModal(u)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px]"
                          title="تعديل الحساب"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button 
                          onClick={() => onToggleRestrictUser(u.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            u.isRestricted 
                              ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20' 
                              : 'bg-red-600/10 text-red-400 border-red-500/20 hover:bg-red-600/20'
                          }`}
                        >
                          {u.isRestricted ? 'تفعيل الحساب' : 'تقييد الحساب'}
                        </button>

                        <button
                          onClick={() => setDeletingUserId(u.id)}
                          className="p-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-400 rounded-lg text-[10px]"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* INVOICES: Financial Commissions history logs */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white mb-1">سجل تحصيلات عمولات صفقات المنصة</h3>
            <p className="text-xs text-slate-400">سجل حركي متكامل لمستحقات عمولات البيع (2.5%) والإيجار (5.0%) المترتبة على الصفقات.</p>
          </div>

          <div className="space-y-4">
            {invoices.map(inv => (
              <div key={inv.id} className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">مطالبة عمولة #{inv.id}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      inv.status === 'paid'
                        ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                        : 'bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse'
                    }`}>
                      {inv.status === 'paid' ? 'مسددة ومكتملة' : 'بانتظار التحصيل'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-bold">{inv.propertyName}</p>
                  <p className="text-[10px] text-slate-400">التاريخ: {inv.date} • من حساب: {inv.payerName}</p>
                </div>

                <div className="text-left w-full md:w-auto flex justify-between md:flex-col items-center md:items-end">
                  <div>
                    <span className="text-[9px] text-slate-400 block">قيمة العمولة المستحقة</span>
                    <p className="text-base font-black text-amber-400">{inv.commissionAmount.toLocaleString()} ج.م</p>
                    <span className="text-[9px] text-slate-500 block">قيمة العقد: {inv.amount.toLocaleString()} ج.م</span>
                  </div>

                  {inv.status === 'unpaid' && (
                    <button
                      onClick={() => onMarkInvoicePaidFromAdmin(inv.id)}
                      className="mt-2 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-extrabold rounded-lg shadow-md"
                    >
                      تسجيل سداد يدوي
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOGS: Audit logging records */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-white mb-1">سجل تدقيق العمليات والرقابة الحية (Audit Logs)</h3>
              <p className="text-xs text-slate-400">مراقبة حية وتتبع لكافة عمليات التغيير والإضافة في العقارات أو توثيق هوية المستخدمين لضمان الأمان والنزاهة.</p>
            </div>

            {/* Search box for logs */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="ابحث في سجل العمليات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 px-9 bg-slate-850 border border-slate-700 text-xs text-white rounded-xl placeholder-slate-500 text-right focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-855 border border-slate-800 rounded-xl text-xs flex gap-3 text-right">
                <div className="p-1.5 bg-slate-800 rounded-lg text-amber-400 h-fit">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">{log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString('ar-SA')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{log.details}</p>
                  <span className="text-[9px] text-slate-500 block">الفاعل: {log.userName} (معرف الحساب: {log.userId})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD OR EDIT USER MODAL */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowUserModal(false)}
                className="absolute top-4 left-4 p-1 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                {userEditingData ? 'تعديل صلاحيات وبيانات الحساب' : 'إضافة حساب مستخدم جديد'}
              </h3>

              {userFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4 font-bold">
                  {userFormError}
                </div>
              )}

              <form onSubmit={handleUserFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">الاسم بالكامل *</label>
                    <input
                      type="text"
                      required
                      value={userFormName}
                      onChange={(e) => setUserFormName(e.target.value)}
                      placeholder="مثال: أحمد محمد"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">رقم الهاتف الجوال *</label>
                    <input
                      type="text"
                      required
                      value={userFormPhone}
                      onChange={(e) => setUserFormPhone(e.target.value)}
                      placeholder="05xxxxxxx"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      required
                      value={userFormEmail}
                      onChange={(e) => setUserFormEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">
                      {userEditingData ? 'تغيير كلمة المرور (اختياري)' : 'كلمة المرور (5 خانات بالضبط) *'}
                    </label>
                    <input
                      type="password"
                      maxLength={5}
                      value={userFormPassword}
                      onChange={(e) => setUserFormPassword(e.target.value)}
                      placeholder="مثال: 12345"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-b border-slate-800/80 py-3">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">أدوار الحساب المتاحة في الملف الموحد:</span>
                  <div className="flex flex-wrap gap-2">
                    {(['buyer', 'seller', 'landlord', 'tenant', 'admin'] as UserRole[]).map(r => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => handleToggleUserRole(r)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          userFormRoles.includes(r)
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-slate-950 border-slate-800 text-slate-500'
                        }`}
                      >
                        {r === 'buyer' ? 'مشتري' : r === 'seller' ? 'بائع' : r === 'landlord' ? 'مؤجر' : r === 'tenant' ? 'مستأجر' : 'أدمن'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">الدور النشط حالياً</label>
                    <select
                      value={userFormActiveRole}
                      onChange={(e) => setUserFormActiveRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {userFormRoles.map(r => (
                        <option key={r} value={r}>
                          {r === 'buyer' ? 'مشتري' : r === 'seller' ? 'بائع' : r === 'landlord' ? 'مؤجر' : r === 'tenant' ? 'مستأجر' : 'أدمن'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">حالة توثيق الهوية الوطنية</label>
                    <select
                      value={userFormVerificationStatus}
                      onChange={(e) => {
                        const val = e.target.value as VerificationStatus;
                        setUserFormVerificationStatus(val);
                        setUserFormIsVerified(val === 'verified');
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="unverified">غير موثق</option>
                      <option value="pending">معلق بانتظار المراجعة</option>
                      <option value="verified">موثق ومعتمد ✓</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-red-400">
                    <input
                      type="checkbox"
                      checked={userFormIsRestricted}
                      onChange={(e) => setUserFormIsRestricted(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-900 text-red-500 focus:ring-red-500 h-4 w-4"
                    />
                    تقييد وحجب هذا الحساب (Restricted/Banned)
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all mt-6 shadow-lg"
                >
                  <Check className="w-4 h-4 stroke-[3px]" />
                  حفظ وتأكيد التغييرات
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD OR EDIT PROPERTY MODAL */}
      <AnimatePresence>
        {showPropertyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button
                onClick={() => setShowPropertyModal(false)}
                className="absolute top-4 left-4 p-1 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                {propertyEditingData ? 'تعديل تفاصيل المنشور العقاري' : 'إضافة منشور عقار جديد كمسؤول'}
              </h3>

              {propFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4 font-bold">
                  {propFormError}
                </div>
              )}

              <form onSubmit={handlePropertyFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">العنوان الإعلاني *</label>
                    <input
                      type="text"
                      required
                      value={propFormTitle}
                      onChange={(e) => setPropFormTitle(e.target.value)}
                      placeholder="مثال: شقة فاخرة بحي الملقا"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">المدينة *</label>
                    <select
                      value={propFormCity}
                      onChange={(e) => setPropFormCity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="الرياض">الرياض</option>
                      <option value="جدة">جدة</option>
                      <option value="مكة">مكة</option>
                      <option value="الدمام">الدمام</option>
                      <option value="القاهرة">القاهرة</option>
                      <option value="الإسكندرية">الإسكندرية</option>
                      <option value="الجيزة">الجيزة</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400">الوصف التفصيلي *</label>
                  <textarea
                    required
                    rows={3}
                    value={propFormDescription}
                    onChange={(e) => setPropFormDescription(e.target.value)}
                    placeholder="اكتب وصفاً جذاباً وشاملاً لمواصفات ومميزات العقار..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">نوع المعاملة</label>
                    <select
                      value={propFormType}
                      onChange={(e) => setPropFormType(e.target.value as OperationType)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="sale">بيع</option>
                      <option value="rent">إيجار</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">نوع العقار</label>
                    <select
                      value={propFormPropType}
                      onChange={(e) => setPropFormPropType(e.target.value as PropertyType)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="apartment">شقة</option>
                      <option value="villa">فيلا</option>
                      <option value="land">أرض</option>
                      <option value="commercial">تجاري</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">السعر *</label>
                    <input
                      type="number"
                      required
                      value={propFormPrice}
                      onChange={(e) => setPropFormPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 text-left font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">المساحة (م²) *</label>
                    <input
                      type="number"
                      required
                      value={propFormArea}
                      onChange={(e) => setPropFormArea(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 text-left font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">عدد الغرف</label>
                    <input
                      type="number"
                      value={propFormRooms}
                      onChange={(e) => setPropFormRooms(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 text-left font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">دورات المياه</label>
                    <input
                      type="number"
                      value={propFormBathrooms}
                      onChange={(e) => setPropFormBathrooms(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 text-left font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">حالة المنشور</label>
                    <select
                      value={propFormStatus}
                      onChange={(e) => setPropFormStatus(e.target.value as PropertyStatus)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="available">منشور ونشط (Available)</option>
                      <option value="pending">قيد المراجعة والاعتماد (Pending)</option>
                      <option value="sold">تم البيع (Sold)</option>
                      <option value="rented">تم التأجير (Rented)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">تمييز المنشور (Featured)</label>
                    <select
                      value={propFormIsFeatured ? 'true' : 'false'}
                      onChange={(e) => setPropFormIsFeatured(e.target.value === 'true')}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="false">عادي</option>
                      <option value="true">مميز بغلاف ذهبي ✓</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">العنوان التفصيلي والحي *</label>
                    <input
                      type="text"
                      required
                      value={propFormAddress}
                      onChange={(e) => setPropFormAddress(e.target.value)}
                      placeholder="مثال: حي النرجس، شارع الثمامة"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-400">معرف المعلن (المالك) أو الموظف المسؤول</label>
                    <select
                      value={propFormOwnerId}
                      onChange={(e) => {
                        const uid = e.target.value;
                        setPropFormOwnerId(uid);
                        const matched = users.find(u => u.id === uid);
                        if (matched) {
                          setPropFormOwnerName(matched.name);
                          setPropFormOwnerPhone(matched.phone);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-400">روابط الصور (مفصولة بفاصلة ,)</label>
                  <textarea
                    rows={2}
                    value={propFormImages}
                    onChange={(e) => setPropFormImages(e.target.value)}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                  />
                  <span className="text-[9px] text-slate-500">اتركها فارغة لاستخدام الصور التلقائية للمنصة المجهزة.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all mt-6 shadow-lg"
                >
                  <Check className="w-4 h-4 stroke-[3px]" />
                  حفظ تفاصيل المنشور وتأكيده
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
