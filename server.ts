/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Standard import for ES Modules in case we are bundling with fallback
const resolvedFilename = typeof __filename !== 'undefined' ? __filename : (typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : '');
const resolvedDirname = typeof __dirname !== 'undefined' ? __dirname : (resolvedFilename ? path.dirname(resolvedFilename) : process.cwd());

const isProduction = process.env.NODE_ENV === 'production' || resolvedFilename.includes('dist') || resolvedDirname.includes('dist');

// In-memory Database initialized with static data
import { INITIAL_PROPERTIES, INITIAL_USERS, INITIAL_MESSAGES, INITIAL_INVOICES, INITIAL_AUDIT_LOGS } from './src/data.js';
import { Property, Message, Invoice, AuditLog, User } from './src/types.js';

let properties: Property[] = [...INITIAL_PROPERTIES];
let users: User[] = [...INITIAL_USERS];
let messages: Message[] = [...INITIAL_MESSAGES];
let invoices: Invoice[] = [...INITIAL_INVOICES];
let auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini API client:', error);
  }
} else {
  console.log('No GEMINI_API_KEY found in env. Falling back to intelligent heuristic models.');
}

// Resilient helper with exponential backoff for Gemini API calls to gracefully handle transient 503 / 429 errors
async function generateContentWithRetry(params: any, retries = 3, delay = 1000) {
  if (!ai) {
    throw new Error('Gemini API client is not initialized.');
  }
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      const isTransient = errorMsg.includes('503') || errorMsg.includes('429') || errorMsg.includes('UNAVAILABLE') || errorMsg.includes('high demand') || errorMsg.includes('Overloaded');
      
      if (i === retries - 1) {
        throw error;
      }
      
      console.warn(`Gemini API call attempt ${i + 1} failed (isTransient: ${isTransient}). Error: ${errorMsg}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API ROUTES

  // Properties API
  app.get('/api/properties', (req: Request, res: Response) => {
    res.json(properties);
  });

  app.post('/api/properties', (req: Request, res: Response) => {
    const newProperty: Property = {
      id: `prop_${Date.now()}`,
      viewsCount: 0,
      favoritesCount: 0,
      createdAt: new Date().toISOString(),
      isFeatured: false,
      isVerified: false,
      status: 'pending', // Requires admin approval first
      ...req.body,
    };
    properties.unshift(newProperty);

    // Create Audit Log
    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      userId: req.body.ownerId || 'user_1',
      userName: req.body.ownerName || 'أحمد القحطاني',
      action: 'إضافة عقار جديد',
      details: `تمت إضافة العقار "${newProperty.title}" بنجاح وبانتظار مراجعة الإدارة وتفعيل الإعلان.`,
      timestamp: new Date().toISOString()
    };
    auditLogs.unshift(newLog);

    res.status(201).json(newProperty);
  });

  app.put('/api/properties/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = properties.findIndex(p => p.id === id);
    if (index !== -1) {
      properties[index] = { ...properties[index], ...req.body };
      res.json(properties[index]);
    } else {
      res.status(404).json({ error: 'Property not found' });
    }
  });

  app.delete('/api/properties/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = properties.findIndex(p => p.id === id);
    if (index !== -1) {
      const propTitle = properties[index].title;
      properties.splice(index, 1);

      // Create Audit Log
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        userId: 'user_1',
        userName: 'أحمد القحطاني',
        action: 'حذف عقار',
        details: `تم حذف العقار "${propTitle}" بالكامل من النظام.`,
        timestamp: new Date().toISOString()
      };
      auditLogs.unshift(newLog);

      res.json({ message: 'Property deleted successfully' });
    } else {
      res.status(404).json({ error: 'Property not found' });
    }
  });

  // Admin approval / verification endpoints
  app.post('/api/properties/approve/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // 'available' or 'rejected'
    const index = properties.findIndex(p => p.id === id);
    if (index !== -1) {
      properties[index].status = status;
      if (status === 'available') {
        properties[index].isVerified = true; // Set verified once approved
      }

      // Add to invoices if sale/rent is recorded
      if (status === 'sold' || status === 'rented') {
        const p = properties[index];
        const commissionRate = p.type === 'sale' ? 2.5 : 5.0;
        const commissionAmount = (p.price * commissionRate) / 100;
        const invoiceId = `inv_${Date.now().toString().slice(-4)}`;
        const newInvoice: Invoice = {
          id: invoiceId,
          propertyId: p.id,
          propertyName: p.title,
          amount: p.price,
          commissionRate,
          commissionAmount,
          type: p.type,
          status: 'unpaid',
          date: new Date().toISOString().split('T')[0],
          payerName: p.ownerName
        };
        invoices.unshift(newInvoice);
      }

      // Create Audit Log
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        userId: 'user_admin',
        userName: 'المدير العام',
        action: 'تغيير حالة عقار من الأدمن',
        details: `تم تعديل حالة العقار "${properties[index].title}" إلى "${status}" بعد مراجعة مستنداته ومواصفاته.`,
        timestamp: new Date().toISOString()
      };
      auditLogs.unshift(newLog);

      res.json(properties[index]);
    } else {
      res.status(404).json({ error: 'Property not found' });
    }
  });

  app.post('/api/properties/toggle-featured/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = properties.findIndex(p => p.id === id);
    if (index !== -1) {
      properties[index].isFeatured = !properties[index].isFeatured;
      res.json(properties[index]);
    } else {
      res.status(404).json({ error: 'Property not found' });
    }
  });

  // Users API
  app.get('/api/users', (req: Request, res: Response) => {
    res.json(users);
  });

  app.post('/api/users/verify/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, idCardUrl } = req.body; // 'verified' or 'rejected' or 'pending'
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index].verificationStatus = status;
      users[index].isVerified = status === 'verified';
      if (idCardUrl) {
        users[index].idCardUrl = idCardUrl;
      }

      // Create Audit Log
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        userId: 'user_admin',
        userName: 'المدير العام',
        action: 'توثيق مستخدم من الأدمن',
        details: `تمت مراجعة وثائق وتغيير حالة توثيق حساب المستخدم "${users[index].name}" إلى "${status}".`,
        timestamp: new Date().toISOString()
      };
      auditLogs.unshift(newLog);

      res.json(users[index]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });

  // Messages API
  app.get('/api/messages', (req: Request, res: Response) => {
    res.json(messages);
  });

  app.post('/api/messages', (req: Request, res: Response) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...req.body,
    };
    messages.push(newMessage);
    res.status(201).json(newMessage);
  });

  // Invoices API
  app.get('/api/invoices', (req: Request, res: Response) => {
    res.json(invoices);
  });

  app.post('/api/invoices/pay/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const index = invoices.findIndex(inv => inv.id === id);
    if (index !== -1) {
      invoices[index].status = 'paid';

      // Create Audit Log
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        userId: 'user_admin',
        userName: 'المدير العام',
        action: 'تسجيل سداد عمولة',
        details: `تم تسجيل سداد فاتورة العمولة رقم (${invoices[index].id}) للعقار "${invoices[index].propertyName}" بقيمة ${invoices[index].commissionAmount} ريال.`,
        timestamp: new Date().toISOString()
      };
      auditLogs.unshift(newLog);

      res.json(invoices[index]);
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  });

  // Audit Logs API
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    res.json(auditLogs);
  });

  // Smart AI Search Parsing using Gemini
  app.post('/api/ai/search', async (req: Request, res: Response) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query text is required' });
    }

    if (!ai) {
      // Fallback heuristics parser if API key is not configured
      console.log('No Gemini API Client configured. Using fallback regex parser.');
      const q = query.toLowerCase();
      let city = null;
      if (q.includes('رياض') || q.includes('riyadh')) city = 'الرياض';
      else if (q.includes('جدة') || q.includes('jeddah')) city = 'جدة';
      else if (q.includes('دمام') || q.includes('dammam')) city = 'الدمام';
      else if (q.includes('مكة') || q.includes('mecca')) city = 'مكة المكرمة';

      let type = null;
      if (q.includes('بيع') || q.includes('شراء') || q.includes('للبيع') || q.includes('sale')) type = 'sale';
      else if (q.includes('إيجار') || q.includes('ايجار') || q.includes('rent')) type = 'rent';

      let propertyType = null;
      if (q.includes('شقة') || q.includes('apartment')) propertyType = 'apartment';
      else if (q.includes('فيلا') || q.includes('villa')) propertyType = 'villa';
      else if (q.includes('أرض') || q.includes('ارض') || q.includes('land')) propertyType = 'land';
      else if (q.includes('مكتب') || q.includes('تجاري') || q.includes('commercial')) propertyType = 'commercial';

      let rooms = null;
      const roomsMatch = q.match(/(\d+)\s*غرف/);
      if (roomsMatch) rooms = parseInt(roomsMatch[1]);

      let maxPrice = null;
      const priceMatch = q.match(/(أقل من|تحت|تحت الـ|تحت ال|بحدود|سعر|بأقل من)\s*(\d+)\s*(ألف|مليون|ريال)?/);
      if (priceMatch) {
        let rawVal = parseInt(priceMatch[2]);
        if (priceMatch[3] === 'ألف' || priceMatch[3] === 'الف') {
          maxPrice = rawVal * 1000;
        } else if (priceMatch[3] === 'مليون') {
          maxPrice = rawVal * 1000000;
        } else {
          maxPrice = rawVal < 10000 ? rawVal * 1000 : rawVal; // Heuristic
        }
      }

      return res.json({
        parsed: { city, type, propertyType, rooms, maxPrice, minPrice: null, maxArea: null, minArea: null },
        explanation: `فهمت أنك تبحث عن: ${propertyType || 'عقار'} ${type === 'sale' ? 'للبيع' : type === 'rent' ? 'للإيجار' : ''} في ${city || 'كل المدن'}. ${rooms ? `بعدد غرف ${rooms}.` : ''} ${maxPrice ? `بسعر أقصى ${maxPrice.toLocaleString()} ريال.` : ''}`,
      });
    }

    try {
      const response = await generateContentWithRetry({
        model: 'gemini-3.5-flash',
        contents: `قم بتحليل جملة البحث الطبيعية التالية باللغة العربية المتعلقة بطلب عقار، واستخراج معايير التصفية ككائن JSON بالخصائص التالية فقط:
        "city" (يمكن أن تكون: "الرياض", "جدة", "الدمام", "مكة المكرمة" أو null)،
        "type" (يمكن أن تكون "sale" للبيع أو "rent" للإيجار أو null)،
        "propertyType" (يمكن أن تكون "apartment", "villa", "land", "commercial" أو null)،
        "maxPrice" (رقم يمثل السعر الأقصى بالريال أو null)،
        "minPrice" (رقم يمثل السعر الأدنى بالريال أو null)،
        "rooms" (رقم يمثل عدد الغرف المطلوب أو null)،
        "maxArea" (رقم يمثل المساحة القصوى بالمتر المربع أو null)،
        "minArea" (رقم يمثل المساحة الدنيا بالمتر المربع أو null).

        أرجع فقط كود JSON خالص ولا تضيف أي نصوص أخرى قبله أو بعده.
        الجملة المراد تحليلها: "${query}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: { type: Type.STRING, nullable: true },
              type: { type: Type.STRING, nullable: true },
              propertyType: { type: Type.STRING, nullable: true },
              maxPrice: { type: Type.NUMBER, nullable: true },
              minPrice: { type: Type.NUMBER, nullable: true },
              rooms: { type: Type.INTEGER, nullable: true },
              maxArea: { type: Type.NUMBER, nullable: true },
              minArea: { type: Type.NUMBER, nullable: true },
            },
          },
        },
      });

      const parsedJson = JSON.parse(response.text || '{}');
      res.json({
        parsed: parsedJson,
        explanation: `فهمت أنك تبحث عن: ${parsedJson.propertyType === 'apartment' ? 'شقة' : parsedJson.propertyType === 'villa' ? 'فيلا' : parsedJson.propertyType === 'land' ? 'أرض' : parsedJson.propertyType === 'commercial' ? 'عقار تجاري' : 'عقار'} ${parsedJson.type === 'sale' ? 'للبيع' : parsedJson.type === 'rent' ? 'للإيجار' : ''} في ${parsedJson.city || 'جميع المدن'}. ${parsedJson.rooms ? `بعدد غرف ${parsedJson.rooms}.` : ''} ${parsedJson.maxPrice ? `بسعر لا يتجاوز ${parsedJson.maxPrice.toLocaleString()} ريال.` : ''}`,
      });
    } catch (error) {
      console.error('Gemini API search parsing failed:', error);
      
      // Fallback heuristics parser if API fails or is rate-limited (e.g. 503 error)
      const q = query.toLowerCase();
      let city = null;
      if (q.includes('رياض') || q.includes('riyadh')) city = 'الرياض';
      else if (q.includes('جدة') || q.includes('jeddah')) city = 'جدة';
      else if (q.includes('دمام') || q.includes('dammam')) city = 'الدمام';
      else if (q.includes('مكة') || q.includes('mecca')) city = 'مكة المكرمة';

      let type = null;
      if (q.includes('بيع') || q.includes('شراء') || q.includes('للبيع') || q.includes('sale')) type = 'sale';
      else if (q.includes('إيجار') || q.includes('ايجار') || q.includes('rent')) type = 'rent';

      let propertyType = null;
      if (q.includes('شقة') || q.includes('apartment')) propertyType = 'apartment';
      else if (q.includes('فيلا') || q.includes('villa')) propertyType = 'villa';
      else if (q.includes('أرض') || q.includes('ارض') || q.includes('land')) propertyType = 'land';
      else if (q.includes('مكتب') || q.includes('تجاري') || q.includes('commercial')) propertyType = 'commercial';

      let rooms = null;
      const roomsMatch = q.match(/(\d+)\s*غرف/);
      if (roomsMatch) rooms = parseInt(roomsMatch[1]);

      let maxPrice = null;
      const priceMatch = q.match(/(أقل من|تحت|تحت الـ|تحت ال|بحدود|سعر|بأقل من)\s*(\d+)\s*(ألف|مليون|ريال)?/);
      if (priceMatch) {
        let rawVal = parseInt(priceMatch[2]);
        if (priceMatch[3] === 'ألف' || priceMatch[3] === 'الف') {
          maxPrice = rawVal * 1000;
        } else if (priceMatch[3] === 'مليون') {
          maxPrice = rawVal * 1000000;
        } else {
          maxPrice = rawVal < 10000 ? rawVal * 1000 : rawVal;
        }
      }

      res.json({
        parsed: { city, type, propertyType, rooms, maxPrice, minPrice: null, maxArea: null, minArea: null },
        explanation: `فهمت أنك تبحث عن: ${propertyType === 'apartment' ? 'شقة' : propertyType === 'villa' ? 'فيلا' : propertyType === 'land' ? 'أرض' : propertyType === 'commercial' ? 'عقار تجاري' : 'عقار'} ${type === 'sale' ? 'للبيع' : type === 'rent' ? 'للإيجار' : ''} في ${city || 'جميع المدن'}. ${rooms ? `بعدد غرف ${rooms}.` : ''} ${maxPrice ? `بسعر أقصى ${maxPrice.toLocaleString()} ريال.` : ''} (تم استخدام نظام التحليل الاحتياطي المؤقت بسبب زيادة الطلب على خادم الذكاء الاصطناعي)`,
      });
    }
  });

  // Smart AI Property Valuation Estimator
  app.post('/api/ai/estimate', async (req: Request, res: Response) => {
    const { city, propertyType, area, rooms, bathrooms, finishing } = req.body;

    if (!city || !propertyType || !area) {
      return res.status(400).json({ error: 'City, Property Type, and Area are required for estimation.' });
    }

    // Heuristics base calculator (works as robust fallback & baseline)
    let basePricePerSqm = 4500; // default (apartment Riyadh/Jeddah)
    if (city === 'الرياض') {
      basePricePerSqm = propertyType === 'villa' ? 9000 : propertyType === 'apartment' ? 7000 : 3500;
    } else if (city === 'جدة') {
      basePricePerSqm = propertyType === 'villa' ? 8000 : propertyType === 'apartment' ? 6200 : 3000;
    } else if (city === 'مكة المكرمة') {
      basePricePerSqm = propertyType === 'villa' ? 10000 : propertyType === 'apartment' ? 8500 : 5000;
    } else { // الدمام
      basePricePerSqm = propertyType === 'villa' ? 7500 : propertyType === 'apartment' ? 5500 : 2500;
    }

    // Adjust for finishing
    if (finishing === 'super-lux') basePricePerSqm *= 1.25;
    else if (finishing === 'lux') basePricePerSqm *= 1.1;

    // Adjust for rooms & bathrooms
    const roomsFactor = (rooms || 0) * 25000 + (bathrooms || 0) * 15000;

    const baseValuation = area * basePricePerSqm + roomsFactor;
    const minValuation = Math.round(baseValuation * 0.93);
    const maxValuation = Math.round(baseValuation * 1.07);
    const estPrice = Math.round(baseValuation);

    if (!ai) {
      return res.json({
        estimatedPrice: estPrice,
        minEstimatedPrice: minValuation,
        maxEstimatedPrice: maxValuation,
        confidenceScore: 82,
        marketAnalysis: `بناءً على المعايير التاريخية لمبيعات العقارات في حي متطور بمدينة ${city}، تبلغ القيمة العادلة التقريبية للمتر المربع لهذا النوع من العقارات (${propertyType === 'villa' ? 'فيلا' : 'شقة'}) حوالي ${(basePricePerSqm).toLocaleString()} ريال. يشهد السوق حالياً طلباً مرتفعاً لخيارات التشطيب ${finishing === 'super-lux' ? 'سوبر لوكس الذكية' : 'الفاخرة'} وتوفر خدمات ممتازة بالبنية التحتية.`,
        suggestedTitle: `${propertyType === 'villa' ? 'فيلا' : 'شقة'} راقية بتشطيب ${finishing === 'super-lux' ? 'سوبر ديلوكس' : 'ممتاز'} بحي ممتاز في ${city}`,
        optimizedDescription: `فرصة استثنائية للتملك والاستثمار في ${city}! ${propertyType === 'villa' ? 'فيلا' : 'شقة'} مميزة بمساحة ${area} متر مربع تتكون من ${rooms || 3} غرف نوم و${bathrooms || 3} دورات مياه. العقار مشطب بجودة ${finishing} ومصمم بطابع عصري جذاب يسمح بدخول الإضاءة والتهوية المناسبة. موقع ممتاز قريب من جميع الخدمات التعليمية والصحية والمراكز التجارية الحيوية.`,
      });
    }

    try {
      const response = await generateContentWithRetry({
        model: 'gemini-3.5-flash',
        contents: `بصفتك خبيراً ومثمناً عقارياً معتمداً في السوق السعودي والخليجي، قم بتقدير السعر والتقييم العادل للعقار التالي ومحاكاة التسعير التقديري الذكي مع توفير تحليل سوقي ووصف محسن:
        - المدينة: ${city}
        - نوع العقار: ${propertyType}
        - المساحة الكلية: ${area} متر مربع
        - غرف النوم: ${rooms || 'غير محدد'}
        - دورات المياه: ${bathrooms || 'غير محدد'}
        - نوع التشطيب: ${finishing}

        يرجى إرجاع النتائج بدقة ككائن JSON بالخصائص التالية فقط:
        "estimatedPrice" (رقم يمثل السعر المقدر المتوسط بالريال السعودي، يجب أن يكون قريباً من ${estPrice}),
        "minEstimatedPrice" (الحد الأدنى المتوقع للسعر بالريال),
        "maxEstimatedPrice" (الحد الأقصى المتوقع للسعر بالريال),
        "confidenceScore" (نسبة الثقة في التقدير من 0 إلى 100 بناءً على توفر البيانات),
        "marketAnalysis" (فقرة غنية جداً ومفصلة باللغة العربية تحلل حالة سوق العقار والطلب في تلك المدينة للعقار المحدد)،
        "suggestedTitle" (عنوان إعلاني جذاب باللغة العربية للعقار)،
        "optimizedDescription" (وصف إعلاني طويل، احترافي ومقنع جداً ومكتوب بعناية لجذب المستثمرين والمشترين باللغة العربية).

        أرجع فقط كود JSON خالص ولا تضيف أي نصوص أخرى قبله أو بعده.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedPrice: { type: Type.NUMBER },
              minEstimatedPrice: { type: Type.NUMBER },
              maxEstimatedPrice: { type: Type.NUMBER },
              confidenceScore: { type: Type.INTEGER },
              marketAnalysis: { type: Type.STRING },
              suggestedTitle: { type: Type.STRING },
              optimizedDescription: { type: Type.STRING },
            },
          },
        },
      });

      const parsedJson = JSON.parse(response.text || '{}');
      res.json(parsedJson);
    } catch (error) {
      console.error('Gemini API property valuation failed:', error);
      // Fallback in case of server/API error during execution
      res.json({
        estimatedPrice: estPrice,
        minEstimatedPrice: minValuation,
        maxEstimatedPrice: maxValuation,
        confidenceScore: 78,
        marketAnalysis: `تم تقدير القيمة بناءً على نظام النمذجة الرياضية والبيانات المتاحة لمدينة ${city}. يتميز السوق بثبات نسبي مع رغبة متزايدة في تملك الوحدات السكنية ذات المساحات المستغلة بعناية وتجهيزات كفاءة الطاقة.`,
        suggestedTitle: `${propertyType === 'villa' ? 'فيلا' : 'شقة'} سكنية راقية في ${city} بمساحة ${area}م²`,
        optimizedDescription: `${propertyType === 'villa' ? 'فيلا' : 'شقة'} ممتازة تقع في حي مميز بـ ${city} وتضم كافة المواصفات التي تبحث عنها العائلة العصرية. تشطيبات راقية، غرف مريحة، وقريبة من الشوارع الرئيسية والمواقع الخدمية.`,
      });
    }
  });

  // Serve static assets in production, otherwise mount Vite
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Real Estate full-stack app running on http://localhost:${PORT}`);
  });
}

startServer();
