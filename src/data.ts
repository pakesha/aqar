/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Property, User, Message, Invoice, AuditLog } from './types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user_1',
    name: 'أحمد القحطاني',
    email: 'ahmed@aqar.com',
    phone: '+966501234567',
    roles: ['buyer', 'seller', 'landlord'],
    activeRole: 'buyer',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    verificationStatus: 'verified',
    idCardUrl: 'national_id_ahmed.jpg'
  },
  {
    id: 'user_2',
    name: 'سارة الدوسري',
    email: 'sara@aqar.com',
    phone: '+966549876543',
    roles: ['landlord', 'tenant'],
    activeRole: 'landlord',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    verificationStatus: 'verified'
  },
  {
    id: 'user_admin',
    name: 'مدير المنصة الذكية',
    email: 'admin@aqar.com',
    phone: '+966551112223',
    roles: ['admin'],
    activeRole: 'admin',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    verificationStatus: 'verified'
  }
];

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop_1',
    title: 'فيلا مودرن فاخرة مع مسبح بحي الياسمين',
    description: 'فيلا حديثة بتصميم هندسي فريد تقع في أرقى أحياء شمال الرياض (حي الياسمين). تتميز الفيلا بواجهات زجاجية واسعة تسمح بدخول الإضاءة الطبيعية بالكامل، مسبح خارجي دافئ، حديقة منسقة بعناية، وموقف سيارة ذكي يتسع لسيارتين. الأرضيات من الرخام الإيطالي الفاخر والتشطيبات متكاملة بجودة سوبر لوكس مع تكييف مركزي ونظام تحكم ذكي بالكامل للإضاءة والتكييف والأمان (Smart Home).',
    type: 'sale',
    propertyType: 'villa',
    price: 4850000,
    area: 450,
    rooms: 5,
    bathrooms: 6,
    floor: 1,
    yearBuilt: 2024,
    finishing: 'super-lux',
    direction: 'شمالية',
    address: 'شارع القنوات، حي الياسمين، الرياض',
    city: 'الرياض',
    lat: 24.8105,
    lng: 46.6450,
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'
    ],
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-with-minimalist-furniture-41584-large.mp4',
    isFeatured: true,
    isVerified: true,
    status: 'available',
    ownerId: 'user_1',
    ownerName: 'أحمد القحطاني',
    ownerPhone: '+966501234567',
    features: ['مسبح ذكي', 'تكييف مركزي', 'نظام ذكي (Smart Home)', 'حديقة منسقة', 'غرفة خادمة مع حمام', 'غرفة سائق', 'ملحق خارجي'],
    nearPlaces: [
      { type: 'school', name: 'مدارس الرواد العالمية', distance: 0.8 },
      { type: 'hospital', name: 'مستشفى دله الرقمي', distance: 2.1 },
      { type: 'mall', name: 'الرياض بارك مول', distance: 3.5 },
      { type: 'mosque', name: 'جامع الملك سلمان الجديد', distance: 0.3 }
    ],
    viewsCount: 1240,
    favoritesCount: 84,
    createdAt: '2026-05-12T10:00:00Z'
  },
  {
    id: 'prop_2',
    title: 'شقة فاخرة بإطلالة كاملة على ممشى بحر جدة',
    description: 'شقة سكنية متكاملة تقع على طريق الكورنيش بحي الشاطئ بجدة. إطلالة بحرية بانورامية ساحرة من الصالون وغرفة النوم الرئيسية. الشقة مجهزة بالكامل بأفخم قطع الأثاث الإيطالي الحديث، وتضم مطبخاً أمريكياً مفتوحاً ومجهزاً بأجهزة بلت-إن عالية الجودة. يقع العقار في برج فاخر يوفر خدمات الحراسة على مدار الساعة، صالة ألعاب رياضية مجهزة، مسبح مشترك، وموقف سيارة خاص مغطى.',
    type: 'rent',
    propertyType: 'apartment',
    price: 135000, // annual rent
    area: 180,
    rooms: 3,
    bathrooms: 3,
    floor: 14,
    yearBuilt: 2023,
    finishing: 'lux',
    direction: 'غربية',
    address: 'طريق الكورنيش، حي الشاطئ، جدة',
    city: 'جدة',
    lat: 21.6015,
    lng: 39.1050,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    isVerified: true,
    status: 'available',
    ownerId: 'user_2',
    ownerName: 'سارة الدوسري',
    ownerPhone: '+966549876543',
    features: ['إطلالة بحرية بانورامية', 'أثاث فاخر مدمج', 'مطبخ مجهز', 'نادي رياضي مشترك', 'حراسة 24 ساعة', 'موقف خاص للسيارة', 'شرفة واسعة'],
    nearPlaces: [
      { type: 'school', name: 'المدرسة البريطانية الدولية بجدة', distance: 1.5 },
      { type: 'hospital', name: 'مستشفى جدة الدولي', distance: 2.8 },
      { type: 'mall', name: 'رد سي مول', distance: 1.2 },
      { type: 'mosque', name: 'مسجد الرحمة العائم', distance: 0.9 }
    ],
    viewsCount: 950,
    favoritesCount: 61,
    createdAt: '2026-05-18T14:30:00Z'
  },
  {
    id: 'prop_3',
    title: 'شقة ذكية بتشطيبات راقية حي الملقا',
    description: 'شقة ذكية مميزة تقع في حي الملقا (شمال الرياض) في عمارة حديثة ممتازة ذات واجهة كلاسيكية راقية. تتميز الشقة بنظام دخول ذكي بالبطاقة والرقم السري، نظام صوتي مدمج بالأسقف، وتكييف مخفي عالي الكفاءة. المساحات مستغلة بطريقة ذكية، وتحتوي الشقة على مجلس مستقل وصالة واسعة للعائلة، بالإضافة إلى غرفة خادمة ومخزن صغير.',
    type: 'sale',
    propertyType: 'apartment',
    price: 1850000,
    area: 165,
    rooms: 3,
    bathrooms: 4,
    floor: 2,
    yearBuilt: 2025,
    finishing: 'super-lux',
    direction: 'شرقية',
    address: 'شارع الدهناء، حي الملقا، الرياض',
    city: 'الرياض',
    lat: 24.7950,
    lng: 46.6150,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672014263-0c15141e12d7?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: false,
    isVerified: true,
    status: 'available',
    ownerId: 'user_1',
    ownerName: 'أحمد القحطاني',
    ownerPhone: '+966501234567',
    features: ['دخول ذكي بالأرقام والبطاقة', 'نظام صوتي بالأسقف', 'تكييف مخفي', 'غرفة خادمة', 'مجلس مستقل بالكامل', 'كاميرات مراقبة بالعمارة'],
    nearPlaces: [
      { type: 'school', name: 'مدارس المنهل الحديثة', distance: 0.5 },
      { type: 'hospital', name: 'مستشفى المركز التخصصي الطبي', distance: 3.1 },
      { type: 'mall', name: 'يو ووك الرياض', distance: 2.2 },
      { type: 'mosque', name: 'مسجد حي الملقا الكبير', distance: 0.2 }
    ],
    viewsCount: 450,
    favoritesCount: 22,
    createdAt: '2026-06-01T12:00:00Z'
  },
  {
    id: 'prop_4',
    title: 'فيلا كلاسيكية فخمة حي الحمراء الشرقية',
    description: 'فيلا كلاسيكية فخمة تقع في شرق الرياض بحي الحمراء. تتميز الفيلا بحجر الرياض الطبيعي الأبيض الفاخر من الخارج، مجلس خارجي كبير (مشب)، صالة استقبال واسعة بارتفاع طابقين (Double Height Ceiling) مع درج لولبي رخامي فخم، ثريات كريستال فاخرة، وجناح نوم رئيسي ملكي مع جاكوزي وغرفة ملابس متكاملة. الفيلا تقع على شارعين وتطل على حديقة الحي الكبيرة.',
    type: 'sale',
    propertyType: 'villa',
    price: 6200000,
    area: 600,
    rooms: 6,
    bathrooms: 7,
    floor: 2,
    yearBuilt: 2019,
    finishing: 'lux',
    direction: 'شمالية شرقية',
    address: 'شارع خالد بن الوليد، حي الحمراء، الرياض',
    city: 'الرياض',
    lat: 24.7735,
    lng: 46.7450,
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: false,
    isVerified: true,
    status: 'sold', // Mark as sold for testing
    ownerId: 'user_1',
    ownerName: 'أحمد القحطاني',
    ownerPhone: '+966501234567',
    features: ['مجلس خارجي كبير (مشب)', 'واجهة حجر الرياض الفاخر', 'جاكوزي بجناح النوم الملكي', 'درج لولبي فخم', 'مطبخ داخلي ومطبخ خارجي', 'بئر ماء ارتوازي للحديقة'],
    nearPlaces: [
      { type: 'school', name: 'مدارس التربية النموذجية', distance: 1.1 },
      { type: 'hospital', name: 'مستشفى أستور سند', distance: 1.8 },
      { type: 'mall', name: 'الحمراء مول الشهير', distance: 0.9 },
      { type: 'mosque', name: 'جامع الحمد الكبير', distance: 0.4 }
    ],
    viewsCount: 2310,
    favoritesCount: 142,
    createdAt: '2026-04-10T11:20:00Z'
  },
  {
    id: 'prop_5',
    title: 'شقة فندقية فاخرة بإطلالة مباشرة على الحرم المكي الشريف',
    description: 'للباحثين عن الروحانية والرفاهية المطلقة، شقة فندقية رائعة للبيع في برج الساعة (أبراج البيت) المطلة مباشرة وبشكل كامل على الحرم المكي الشريف والكعبة المشرفة. الشقة مجهزة بنظام صوتي متصل مباشرة بمكبرات صوت الحرم للاستماع للأذان والصلوات مباشرة. مجهزة بالكامل بأفخم المفروشات والديكورات الإسلامية الراقية، وتتم إدارتها عبر فندق 5 نجوم للحصول على عوائد استثمارية ممتازة طوال العام.',
    type: 'sale',
    propertyType: 'apartment',
    price: 8900000,
    area: 110,
    rooms: 2,
    bathrooms: 2,
    floor: 32,
    yearBuilt: 2018,
    finishing: 'super-lux',
    direction: 'شمالية',
    address: 'برج الساعة، أبراج البيت، مكة المكرمة',
    city: 'مكة المكرمة',
    lat: 21.4185,
    lng: 39.8262,
    images: [
      'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    isVerified: true,
    status: 'available',
    ownerId: 'user_2',
    ownerName: 'سارة الدوسري',
    ownerPhone: '+966549876543',
    features: ['إطلالة كاملة ومباشرة على الكعبة', 'نظام صوتي متصل بصلوات الحرم', 'تأثيث فندقي 5 نجوم', 'إدارة فندقية لفرص الاستثمار والـتأجير', 'خدمة الغرف على مدار الساعة', 'مواقف خاصة بالبرج'],
    nearPlaces: [
      { type: 'school', name: 'مدرسة الحرم المكي الابتدائية', distance: 0.5 },
      { type: 'hospital', name: 'مركز صحي الحرم الطوارئ', distance: 0.1 },
      { type: 'mall', name: 'مركز مكة التجاري داخل الأبراج', distance: 0.1 },
      { type: 'mosque', name: 'المسجد الحرام الشريف', distance: 0.05 }
    ],
    viewsCount: 3100,
    favoritesCount: 290,
    createdAt: '2026-05-01T08:00:00Z'
  },
  {
    id: 'prop_6',
    title: 'أرض تجارية استثمارية على طريق الملك فهد بالدمام',
    description: 'أرض تجارية ممتازة جداً تقع على طريق الملك فهد السريع بالدمام (حي الفيصلية). موقع استراتيجي نادر ومناسب لإنشاء برج تجاري، صالات عرض، معرض سيارات، أو مجمع مطاعم ومقاهي (Drive-thru). الأرض مستوية ومفرزة بشكل كامل ومحاطة بالعديد من الشركات الكبرى والمراكز الحيوية.',
    type: 'sale',
    propertyType: 'land',
    price: 12000000,
    area: 1500,
    rooms: 0,
    bathrooms: 0,
    yearBuilt: 2026,
    finishing: 'normal',
    direction: 'غربية (على طريق رئيسي)',
    address: 'طريق الملك فهد، حي الفيصلية، الدمام',
    city: 'الدمام',
    lat: 26.3985,
    lng: 50.1150,
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80'
    ],
    isFeatured: false,
    isVerified: true,
    status: 'available',
    ownerId: 'user_2',
    ownerName: 'سارة الدوسري',
    ownerPhone: '+966549876543',
    features: ['على شارع رئيسي سريع', 'موقع استراتيجي ممتاز', 'تراخيص تجارية جاهزة للبناء المرتفع', 'مستوية وصالحة للحفر فوراً'],
    nearPlaces: [
      { type: 'school', name: 'المدرسة الثانوية الصناعية بالدمام', distance: 2.0 },
      { type: 'hospital', name: 'مستشفى المانع العام بالدمام', distance: 3.2 },
      { type: 'mall', name: 'الدمام مول الشهير', distance: 1.7 },
      { type: 'mosque', name: 'جامع الفيصلية الكبير', distance: 0.6 }
    ],
    viewsCount: 320,
    favoritesCount: 11,
    createdAt: '2026-06-15T09:40:00Z'
  },
  {
    id: 'prop_7',
    title: 'شقة أنيقة للإيجار السنوي بحي السليمانية ورشة عمل',
    description: 'شقة حديثة ومؤثثة بالكامل للإيجار السنوي بحي السليمانية بوسط الرياض. موقع رائع قريب من كافة المقاهي والمطاعم الفاخرة والمجمعات الطبية والمستشفيات (مثل مستشفى الملك فيصل التخصصي). الشقة بالدور الأول وتضم غرفتين وصالة عائلية ومطبخاً مستقلاً وراكباً بكامل أجهزته الكهربائية.',
    type: 'rent',
    propertyType: 'apartment',
    price: 75000,
    area: 120,
    rooms: 2,
    bathrooms: 2,
    floor: 1,
    yearBuilt: 2022,
    finishing: 'lux',
    direction: 'جنوبية',
    address: 'شارع التخصصي، حي السليمانية، الرياض',
    city: 'الرياض',
    lat: 24.7005,
    lng: 46.6900,
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: false,
    isVerified: true,
    status: 'available',
    ownerId: 'user_1',
    ownerName: 'أحمد القحطاني',
    ownerPhone: '+966501234567',
    features: ['موقع حيوي وسطي بالرياض', 'مطبخ راكب بالكامل بالأجهزة', 'تكييف سبليت راكب', 'إنترنت ألياف بصرية سريع للغاية', 'موقف سيارة سفلي بقبو العمارة'],
    nearPlaces: [
      { type: 'school', name: 'مدارس منارات الرياض الأهلية', distance: 1.0 },
      { type: 'hospital', name: 'مستشفى الملك فيصل التخصصي ومراكز الأبحاث', distance: 0.7 },
      { type: 'mall', name: 'لوكالايزر مول بشارع التحلية', distance: 1.4 },
      { type: 'mosque', name: 'جامع الملك خالد الشهير', distance: 1.2 }
    ],
    viewsCount: 780,
    favoritesCount: 34,
    createdAt: '2026-06-10T15:00:00Z'
  },
  {
    id: 'prop_8',
    title: 'مكتب تجاري فاخر وصالات عرض بحي الصحافة',
    description: 'مقر تجاري مذهل يصلح كمعرض أو مجمع مكاتب فاخرة للشركات الكبرى بحي الصحافة (شمال الرياض) على طريق الملك فهد مباشرة. المساحة الكلية واسعة للغاية ومقسمة بدقة عالية الجودة لتشمل غرف اجتماعات زجاجية، مكاتب فردية، صالة استقبال عملاء، كافيتريا مستقلة، ومرافق صحية منفصلة للرجال والنساء.',
    type: 'rent',
    propertyType: 'commercial',
    price: 450000,
    area: 380,
    rooms: 8,
    bathrooms: 4,
    floor: 3,
    yearBuilt: 2024,
    finishing: 'super-lux',
    direction: 'شرقية على طريق الملك فهد',
    address: 'طريق الملك فهد، حي الصحافة، الرياض',
    city: 'الرياض',
    lat: 24.8010,
    lng: 46.6295,
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    isVerified: true,
    status: 'available',
    ownerId: 'user_1',
    ownerName: 'أحمد القحطاني',
    ownerPhone: '+966501234567',
    features: ['على طريق الملك فهد مباشرة', 'تصميم مكتبي عصري زجاجي', 'غرفة خوادم سيرفرات مستقلة ومبردة', 'مصعد خاص ومواقف قبو واسعة للعملاء والشركة', 'نظام متطور لمكافحة وإخماد الحرائق الذكي'],
    nearPlaces: [
      { type: 'school', name: 'مدرسة القيادة الذكية بالصحافة', distance: 2.2 },
      { type: 'hospital', name: 'مستشفى الحبيب بالصحافة', distance: 1.1 },
      { type: 'mall', name: 'الصحافة بلازا التجاري', distance: 0.5 },
      { type: 'mosque', name: 'جامع حي الصحافة العام', distance: 0.3 }
    ],
    viewsCount: 1120,
    favoritesCount: 49,
    createdAt: '2026-05-20T10:15:00Z'
  },
  {
    id: 'prop_egy_1',
    title: 'شقة بنتهاوس فاخرة تطل مباشرة على النيل بالزمالك',
    description: 'شقة بنتهاوس فاخرة جداً تقع في قلب الزمالك، القاهرة. تتميز بإطلالة بانورامية ساحرة ومباشرة على نهر النيل وبرج القاهرة. تشطيب ألترا سوبر لوكس بالكامل بالرخام المستورد والباركيه الطبيعي، مع تراس خارجي واسع جداً وجاكوزي خاص. تقع في عمارة كلاسيكية مرموقة مع أمن وحراسة على مدار الساعة.',
    type: 'sale',
    propertyType: 'apartment',
    price: 15500000,
    area: 320,
    rooms: 4,
    bathrooms: 4,
    floor: 9,
    yearBuilt: 2022,
    finishing: 'super-lux',
    direction: 'شمالية غربية',
    address: 'شارع أبو الفدا، الزمالك، القاهرة',
    city: 'القاهرة',
    lat: 30.0626,
    lng: 31.2201,
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    isVerified: true,
    status: 'available',
    ownerId: 'user_1',
    ownerName: 'أحمد القحطاني',
    ownerPhone: '+966501234567',
    features: ['إطلالة بانورامية على النيل', 'تراس كبير مع جاكوزي', 'تكييف مركزي', 'موقف سيارة مغطى', 'أمن وحراسة 24 ساعة'],
    nearPlaces: [
      { type: 'school', name: 'المدرسة البريطانية الدولية بالزمالك', distance: 0.5 },
      { type: 'hospital', name: 'مستشفى الشروق', distance: 1.2 },
      { type: 'mall', name: 'يمامة سنتر', distance: 0.3 },
      { type: 'mosque', name: 'مسجد الزمالك', distance: 0.2 }
    ],
    viewsCount: 2450,
    favoritesCount: 198,
    createdAt: '2026-06-01T12:00:00Z'
  },
  {
    id: 'prop_egy_2',
    title: 'شاليه صف أول على البحر في الساحل الشمالي (هاسيندا)',
    description: 'شاليه راقٍ جداً صف أول مباشر على مياه البحر الأبيض المتوسط الفيروزية في هاسيندا باي الساحل الشمالي. الشاليه أرضي بحديقة خاصة وحمام سباحة خاص صغير. تصميم مودرن بمدخلين وتراس زجاجي مفتوح بالكامل. يباع بالفرش الفاخر والتكييفات والمطبخ المجهز بالكامل.',
    type: 'sale',
    propertyType: 'villa',
    price: 18900000,
    area: 210,
    rooms: 3,
    bathrooms: 3,
    floor: 0,
    yearBuilt: 2023,
    finishing: 'super-lux',
    direction: 'شمالية',
    address: 'الكيلو 124، هاسيندا باي، الساحل الشمالي',
    city: 'الساحل الشمالي',
    lat: 30.9328,
    lng: 28.8475,
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=crop&w=800&q=80'
    ],
    isFeatured: true,
    isVerified: true,
    status: 'available',
    ownerId: 'user_2',
    ownerName: 'سارة الدوسري',
    ownerPhone: '+966549876543',
    features: ['صف أول مباشر على البحر', 'حديقة خاصة ومسبح', 'تأثيث كامل فاخر', 'موقف سيارتين', 'دخول مباشر للمنطقة الشاطئية'],
    nearPlaces: [
      { type: 'school', name: 'مدرسة الحرمين التجريبية بالساحل', distance: 4.5 },
      { type: 'hospital', name: 'مستشفى العلمين النموذجى', distance: 12.0 },
      { type: 'mall', name: 'بورتو مارينا مول', distance: 15.0 },
      { type: 'mosque', name: 'مسجد هاسيندا الكبير', distance: 0.5 }
    ],
    viewsCount: 1890,
    favoritesCount: 125,
    createdAt: '2026-06-15T15:00:00Z'
  },
  {
    id: 'prop_egy_3',
    title: 'فيلا مستقلة فاخرة تطل على الأهرامات بالجيزة',
    description: 'فيلا مستقلة رائعة وتاريخية بتصميم ملكي فاخر تقع في منطقة هضبة الأهرام بالجيزة، بإطلالة مباشرة وساحرة على أهرامات الجيزة الخالدة الثلاثة. الفيلا مبنية على أرض مساحتها 800 متر مربع وتضم حديقة واسعة منسقة بأشجار النخيل والورود وحمام سباحة كبير جداً وصالة سينما وصالة جيم خاصة.',
    type: 'sale',
    propertyType: 'villa',
    price: 32000000,
    area: 650,
    rooms: 6,
    bathrooms: 6,
    floor: 2,
    yearBuilt: 2021,
    finishing: 'super-lux',
    direction: 'شمالية شرقية',
    address: 'طريق المنصورية، هضبة الأهرام، الجيزة',
    city: 'الجيزة',
    lat: 29.9865,
    lng: 31.1313,
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: true,
    isVerified: true,
    status: 'available',
    ownerId: 'user_1',
    ownerName: 'أحمد القحطاني',
    ownerPhone: '+966501234567',
    features: ['إطلالة ساحرة ومباشرة على الأهرامات', 'مسبح أوليمبي خاص', 'سينما وجيم خاصين بالفيلا', 'حديقة منسقة كبيرة جداً', 'تشطيب كلاسيكي فاخر'],
    nearPlaces: [
      { type: 'school', name: 'مدارس رمسيس الدولية بالجيزة', distance: 2.1 },
      { type: 'hospital', name: 'مستشفى الهرم', distance: 1.5 },
      { type: 'mall', name: 'مول مصر الشهير', distance: 8.0 },
      { type: 'mosque', name: 'جامع خاتم المرسلين', distance: 1.0 }
    ],
    viewsCount: 3950,
    favoritesCount: 450,
    createdAt: '2026-05-25T09:00:00Z'
  },
  {
    id: 'prop_egy_4',
    title: 'شقة غرفتين وصالة فاخرة في سموحة بالإسكندرية',
    description: 'شقة سكنية متكاملة ومكيفة تقع في أرقى مناطق الإسكندرية (حي سموحة)، بالقرب من نادي سموحة الرياضي ومسجد علي بن أبي طالب. الشقة بالدور الرابع في برج حديث ممتاز ذو تصميم معماري حديث رائع، ومزودة بمصعدين ومولد كهربائي احتياطي وموقف سيارات سفلي للبرج.',
    type: 'rent',
    propertyType: 'apartment',
    price: 18000,
    area: 145,
    rooms: 2,
    bathrooms: 2,
    floor: 4,
    yearBuilt: 2024,
    finishing: 'lux',
    direction: 'بحري',
    address: 'شارع فوزي معاذ، سموحة، الإسكندرية',
    city: 'الإسكندرية',
    lat: 31.2081,
    lng: 29.9556,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    ],
    isFeatured: false,
    isVerified: true,
    status: 'available',
    ownerId: 'user_2',
    ownerName: 'سارة الدوسري',
    ownerPhone: '+966549876543',
    features: ['موقع حيوي راقٍ بسموحة', 'تكييفات راكبة بالكامل', 'أرضيات باركيه ممتازة', 'موقف خاص بالسيارة مغطى', 'مولد كهربائي خاص بالبرج طوارئ'],
    nearPlaces: [
      { type: 'school', name: 'مدرسة ليسيه الحرية بالإسكندرية', distance: 1.1 },
      { type: 'hospital', name: 'مستشفى أندلسية سموحة', distance: 0.5 },
      { type: 'mall', name: 'جرين بلازا مول', distance: 1.8 },
      { type: 'mosque', name: 'مسجد علي بن أبي طالب', distance: 0.2 }
    ],
    viewsCount: 810,
    favoritesCount: 29,
    createdAt: '2026-06-20T10:00:00Z'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_1',
    senderId: 'user_1',
    receiverId: 'user_2',
    propertyId: 'prop_2',
    propertyName: 'شقة فاخرة بإطلالة كاملة على ممشى بحر جدة',
    senderName: 'أحمد القحطاني',
    text: 'السلام عليكم ورحمة الله وبركاته، هل الشقة المطلة على كورنيش جدة لا تزال متوفرة للإيجار؟ وهل السعر قابل للتفاوض البسيط؟',
    timestamp: '2026-06-25T14:30:00Z'
  },
  {
    id: 'msg_2',
    senderId: 'user_2',
    receiverId: 'user_1',
    propertyId: 'prop_2',
    propertyName: 'شقة فاخرة بإطلالة كاملة على ممشى بحر جدة',
    senderName: 'سارة الدوسري',
    text: 'وعليكم السلام ورحمة الله وبركاته يا هلا أخ أحمد. نعم الشقة لا تزال متوفرة وصالحة للمعاينة في أي وقت. بالنسبة للسعر فهو قابل للتفاوض البسيط للجادين والدفع دفعة واحدة.',
    timestamp: '2026-06-25T15:12:00Z'
  },
  {
    id: 'msg_3',
    senderId: 'user_1',
    receiverId: 'user_2',
    propertyId: 'prop_2',
    propertyName: 'شقة فاخرة بإطلالة كاملة على ممشى بحر جدة',
    senderName: 'أحمد القحطاني',
    text: 'رائع جداً، يسعدني التنسيق معكم للمعاينة غداً بعد صلاة العصر إن شاء الله.',
    timestamp: '2026-06-25T16:00:00Z'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_1001',
    propertyId: 'prop_4',
    propertyName: 'فيلا كلاسيكية فخمة حي الحمراء الشرقية',
    amount: 6200000,
    commissionRate: 2.5,
    commissionAmount: 155000,
    type: 'sale',
    status: 'paid',
    date: '2026-05-24',
    payerName: 'أحمد القحطاني'
  },
  {
    id: 'inv_1002',
    propertyId: 'prop_2',
    propertyName: 'شقة فاخرة بإطلالة كاملة على ممشى بحر جدة',
    amount: 135000,
    commissionRate: 5.0,
    commissionAmount: 6750,
    type: 'rent',
    status: 'unpaid',
    date: '2026-06-25',
    payerName: 'سارة الدوسري'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    userId: 'user_1',
    userName: 'أحمد القحطاني',
    action: 'إضافة عقار جديد',
    details: 'تمت إضافة العقار "فيلا مودرن فاخرة مع مسبح بحي الياسمين" بنجاح وبانتظار مراجعة الإدارة.',
    timestamp: '2026-05-12T10:05:00Z'
  },
  {
    id: 'log_2',
    userId: 'user_admin',
    userName: 'المدير العام',
    action: 'اعتماد ونشر عقار',
    details: 'تمت الموافقة وتفعيل الإعلان للعقار "فيلا مودرن فاخرة مع مسبح بحي الياسمين" بعد التدقيق من جودتها وموقعها.',
    timestamp: '2026-05-12T11:30:00Z'
  },
  {
    id: 'log_3',
    userId: 'user_2',
    userName: 'سارة الدوسري',
    action: 'توثيق حساب شخصي',
    details: 'تم رفع وثائق الهوية الوطنية وطلب توثيق الحساب والتحقق من رقم الهاتف الجوال.',
    timestamp: '2026-05-17T09:15:00Z'
  },
  {
    id: 'log_4',
    userId: 'user_admin',
    userName: 'المدير العام',
    action: 'الموافقة على توثيق مستخدم',
    details: 'تم التحقق من هوية سارة الدوسري وتوثيق حسابها رسمياً ومنحها شارة الحساب الموثق.',
    timestamp: '2026-05-17T14:00:00Z'
  }
];
