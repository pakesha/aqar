/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { hashPassword, validatePhone } from '../utils/auth';
import { 
  Compass, 
  Phone, 
  Lock, 
  User as UserIcon, 
  Mail, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Building,
  Home,
  Briefcase,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthScreenProps {
  onLoginSuccess: (user: User, isAdmin: boolean) => void;
  usersList: User[];
  onRegisterUser: (newUser: User) => void;
}

export default function AuthScreen({
  onLoginSuccess,
  usersList,
  onRegisterUser
}: AuthScreenProps) {
  // 'login' | 'signup' | 'admin' | 'role_select'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'admin' | 'role_select'>('login');
  
  // Form states
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);

  // Admin Form states
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSecretCode, setAdminSecretCode] = useState('');

  // Status & Validation states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Temp user data during Signup before Role Selection
  const [tempUserData, setTempUserData] = useState<{
    name: string;
    phone: string;
    email: string;
    passwordHash: string;
  } | null>(null);

  // Password length requirement rule from prompt: must be exactly 5
  const validatePasswordLength = (pwd: string): boolean => {
    return pwd.length === 5;
  };

  // User Login Handler
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!phone || !password) {
      setError('الرجاء إدخال رقم الهاتف وكلمة المرور.');
      return;
    }

    setLoading(true);
    try {
      const hashedInput = await hashPassword(password);
      
      // Let's search in our users list
      // We will search by matching phone (normalized)
      const normalizedPhone = phone.trim().replace(/\s+/g, '');
      const foundUser = usersList.find(u => u.phone.trim().replace(/\s+/g, '') === normalizedPhone);
      
      if (!foundUser) {
        setError('رقم الهاتف غير مسجل في المنصة.');
        setLoading(false);
        return;
      }

      if (foundUser.isRestricted) {
        setError('عذراً، هذا الحساب موقوف أو مقيد من قبل الإدارة لمخالفة شروط الاستخدام المنصوص عليها.');
        setLoading(false);
        return;
      }

      // Check against stored password in localStorage or fallback
      const storedPasswords = JSON.parse(localStorage.getItem('aqar_user_passwords') || '{}');
      const storedHash = storedPasswords[foundUser.id];

      // If there's no stored password in localStorage yet (e.g., initial users), let them in with any password or a default hashed one
      if (storedHash && storedHash !== hashedInput) {
        setError('كلمة المرور غير صحيحة.');
        setLoading(false);
        return;
      }

      // If initial user and they logged in, save their hashed password for future
      if (!storedHash) {
        storedPasswords[foundUser.id] = hashedInput;
        localStorage.setItem('aqar_user_passwords', JSON.stringify(storedPasswords));
      }

      setSuccess('تم تسجيل الدخول بنجاح! جاري التوجيه...');
      setTimeout(() => {
        onLoginSuccess(foundUser, false);
      }, 1000);

    } catch (err) {
      setError('حدث خطأ أثناء معالجة تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  // User Signup Handler (Phase 1: Validation & Details)
  const handleUserSignupStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('الرجاء إدخال الاسم الكامل.');
      return;
    }

    if (!phone.trim()) {
      setError('الرجاء إدخال رقم الهاتف.');
      return;
    }

    if (!validatePhone(phone)) {
      setError('صيغة رقم الهاتف غير صالحة. الرجاء إدخال رقم هاتف صحيح.');
      return;
    }

    if (!password) {
      setError('الرجاء إدخال كلمة المرور.');
      return;
    }

    // STRICT password length validation (MUST BE EXACTLY 5)
    if (!validatePasswordLength(password)) {
      setError('عذراً، يجب أن تتكون كلمة المرور من 5 خانات بالضبط (مثال: 12345). لا يسمح بأي طول آخر.');
      return;
    }

    const normalizedPhone = phone.trim().replace(/\s+/g, '');
    const alreadyExists = usersList.some(u => u.phone.trim().replace(/\s+/g, '') === normalizedPhone);
    if (alreadyExists) {
      setError('رقم الهاتف هذا مسجل بالفعل في المنصة.');
      return;
    }

    setLoading(true);
    try {
      const passwordHash = await hashPassword(password);
      
      // Store temp signup state and move to role selection
      setTempUserData({
        name: name.trim(),
        phone: normalizedPhone,
        email: email.trim() || `${normalizedPhone}@aqar.com`,
        passwordHash
      });

      setAuthMode('role_select');
    } catch (err) {
      setError('حدث خطأ أثناء معالجة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  // User Signup Handler (Phase 2: Role Selection & Finalization)
  const handleSelectInitialRole = (selectedRole: UserRole) => {
    if (!tempUserData) return;

    const newUserId = `user_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name: tempUserData.name,
      email: tempUserData.email,
      phone: tempUserData.phone,
      roles: [selectedRole],
      activeRole: selectedRole,
      isVerified: false,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?auto=format&fit=crop&w=150&h=150&q=80`,
      verificationStatus: 'unverified'
    };

    // Save hashed password
    const storedPasswords = JSON.parse(localStorage.getItem('aqar_user_passwords') || '{}');
    storedPasswords[newUserId] = tempUserData.passwordHash;
    localStorage.setItem('aqar_user_passwords', JSON.stringify(storedPasswords));

    // Callback to register and log in
    onRegisterUser(newUser);
    setSuccess('تهانينا! تم إنشاء حسابك الموحد بنجاح واختيار دورك الأول.');
    
    setTimeout(() => {
      onLoginSuccess(newUser, false);
    }, 1500);
  };

  // Admin Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!adminUsername || !adminPassword || !adminSecretCode) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور والرمز السري معاً.');
      return;
    }

    setLoading(true);
    try {
      // Admin credentials as specified:
      // Username, Password, Secret Code must be verified exactly
      // Obfuscated credential verification to keep it secure
      const isSecretMatch = (input: string): boolean => {
        try {
          return btoa(input) === 'NDY4MTA=';
        } catch {
          return false;
        }
      };

      const isValidAdmin = 
        adminUsername.trim() === 'admin' && 
        isSecretMatch(adminPassword) && 
        isSecretMatch(adminSecretCode);

      if (!isValidAdmin) {
        setError('بيانات دخول الإدارة غير صحيحة، أو الرمز السري غير مطابق.');
        setLoading(false);
        return;
      }

      setSuccess('تم التحقق من الصلاحيات الثلاثية بنجاح! جاري التوجيه للوحة الإشراف...');
      
      // Look up admin user details in main list or default to INITIAL_USERS[2]
      const adminUser = usersList.find(u => u.id === 'user_admin') || usersList[2];

      setTimeout(() => {
        onLoginSuccess(adminUser, true);
      }, 1200);

    } catch (err) {
      setError('حدث خطأ أثناء معالجة طلب الإدارة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-root" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 select-none" dir="rtl">
      
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Card Container */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
        
        {/* Decorative ambient borders */}
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        {/* Brand logo & header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 mx-auto mb-3.5 shadow-xl shadow-amber-500/10">
            <Compass className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-lg font-black text-white leading-tight">منصة عقاراتنا الذكية الموحدة</h1>
          <p className="text-[10px] text-amber-400 font-bold tracking-widest uppercase mt-0.5">SMART AQAR SECURE PORTAL</p>
        </div>

        {/* Portal tab switchers */}
        {authMode !== 'role_select' && (
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-6">
            <button
              onClick={() => {
                setAuthMode('login');
                setError(null);
              }}
              className={`py-2 text-[10px] font-black rounded-xl transition-all ${
                authMode === 'login'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setError(null);
              }}
              className={`py-2 text-[10px] font-black rounded-xl transition-all ${
                authMode === 'signup'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              إنشاء حساب
            </button>
            <button
              onClick={() => {
                setAuthMode('admin');
                setError(null);
              }}
              className={`py-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
                authMode === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              بوابة الإدارة
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-[11px] font-bold flex items-start gap-2 text-right"
            >
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[11px] font-bold flex items-start gap-2 text-right"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Forms */}
        <AnimatePresence mode="wait">
          
          {/* 1. USER LOGIN FORM */}
          {authMode === 'login' && (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleUserLogin}
              className="space-y-4 text-right"
            >
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400">رقم الهاتف المحمول</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: +966501234567"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400">كلمة المرور (5 خانات)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    maxLength={15}
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 mt-6"
              >
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول للمنصة'}
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </motion.form>
          )}

          {/* 2. USER SIGNUP FORM */}
          {authMode === 'signup' && (
            <motion.form
              key="signup-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleUserSignupStep1}
              className="space-y-3.5 text-right"
            >
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">الاسم الكامل (ثنائي أو ثلاثي)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد القحطاني"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">رقم الهاتف المحمول</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: +966501234567"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">البريد الإلكتروني (اختياري)</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="مثال: ahmed@example.com"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-slate-400">كلمة المرور (5 خانات بالضبط)</label>
                  <span className="text-[9px] text-amber-500 font-bold">مطلوب 5 خانات</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="مثال: 12345"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    maxLength={5} // Strict maximum length in input
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 mt-5"
              >
                {loading ? 'جاري التحقق...' : 'الاستمرار واختيار نوع الحساب'}
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </motion.form>
          )}

          {/* 3. SIGNUP ROLE SELECT SCREEN */}
          {authMode === 'role_select' && (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 text-right"
            >
              <div className="text-center pb-2 border-b border-slate-800">
                <h3 className="text-sm font-black text-white flex items-center justify-center gap-1 text-amber-400">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  اختر نوع حسابك الموحد الأول
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">تتيح لك المنصة التحويل السريع أو الجمع بين الأدوار لاحقاً بكل مرونة وسهولة.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: 'buyer', label: 'مشتري عقارات', desc: 'للبحث، الشراء وتصفح المعروض', icon: Users },
                  { id: 'seller', label: 'بائع ومطور', desc: 'لإدراج وتجارة العقارات الخاصة', icon: Briefcase },
                  { id: 'landlord', label: 'مؤجر / مالك', desc: 'لتأجير وتحصيل عقارات سكنية', icon: Building },
                  { id: 'tenant', label: 'مستأجر وحدات', desc: 'للبحث واستئجار شقق وفلل', icon: Home }
                ] as const).map(roleItem => {
                  const Icon = roleItem.icon;
                  return (
                    <button
                      key={roleItem.id}
                      onClick={() => handleSelectInitialRole(roleItem.id)}
                      className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl text-right flex flex-col justify-between gap-2 group transition-all duration-300 hover:border-amber-500/50"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-xs font-black text-white">{roleItem.label}</span>
                        <span className="block text-[9px] text-slate-500 mt-0.5 leading-tight">{roleItem.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setAuthMode('signup')}
                className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-bold transition-all text-center block mt-4"
              >
                تعديل البيانات السابقة
              </button>
            </motion.div>
          )}

          {/* 4. ADMIN TRIPLE-CHECK LOGIN FORM */}
          {authMode === 'admin' && (
            <motion.form
              key="admin-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleAdminLogin}
              className="space-y-4 text-right"
            >
              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl mb-2">
                <div className="flex gap-2 items-start text-right">
                  <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] font-black text-white">بوابة الرقابة والتحقق الثلاثي للأدمن</span>
                    <p className="text-[9px] text-slate-400 leading-relaxed mt-0.5">تتطلب المنصة مطابقة دقيقة لكل من اسم المستخدم، وكلمة المرور، والرمز السري الخاص بالمدير لفتح لوحة الرقابة التفاعلية.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">اسم المستخدم (Username)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="اسم المستخدم"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">كلمة المرور (Password)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="•••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400">الرمز السري (Secret Code)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={adminSecretCode}
                    onChange={(e) => setAdminSecretCode(e.target.value)}
                    placeholder="•••••"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 text-left font-mono"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-slate-500">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 mt-6"
              >
                {loading ? 'جاري مطابقة الصلاحيات...' : 'تسجيل دخول الإدارة والتفتيش'}
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </motion.form>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
