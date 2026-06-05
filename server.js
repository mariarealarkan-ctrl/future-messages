require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PAYPAL_LINK = process.env.PAYPAL_LINK;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ التحقق من المتغيرات المطلوبة عند بدء التطبيق
if (!OPENAI_API_KEY) {
  console.error('❌ خطأ: OPENAI_API_KEY غير معرّف في .env');
  process.exit(1);
}

if (!PAYPAL_LINK) {
  console.error('❌ خطأ: PAYPAL_LINK غير معرّف في .env');
  process.exit(1);
}

// 🔒 API Route - توليد الرسائل (آمن تماماً)
app.post('/api/generate-message', async (req, res) => {
  try {
    const { name, age, country } = req.body;

    // ✅ التحقق من المدخلات
    if (!name || !age || !country) {
      return res.status(400).json({
        error: 'جميع الحقول مطلوبة'
      });
    }

    // ✅ التحقق من صحة البيانات
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'الاسم غير صحيح'
      });
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      return res.status(400).json({
        error: 'العمر غير صحيح'
      });
    }

    if (typeof country !== 'string' || country.trim().length === 0) {
      return res.status(400).json({
        error: 'البلد غير صحيح'
      });
    }

    // تجنب الهجمات - تنظيف المدخلات
    const cleanName = name.trim().substring(0, 50);
    const cleanCountry = country.trim().substring(0, 50);

    // ✅ استدعاء OpenAI API من الخادم (API Key محمي)
    const prompt = `اكتب رسالة خيالية قصيرة وملهمة من المستقبل (بحد أقصى 150 كلمة) لشخص اسمه ${cleanName} عمره ${ageNum} من ${cleanCountry}. اجعلها إيجابية وتتحدث عن إنجازات وأحلام تحققت.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'أنت كاتب رسائل من المستقبل. اكتب رسائل إيجابية وملهمة.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const message = response.data.choices[0].message.content.trim();

    res.json({
      success: true,
      message: message
    });

  } catch (error) {
    console.error('❌ خطأ في API:', error.message);

    // معالجة أخطاء محددة
    if (error.response?.status === 401) {
      return res.status(500).json({
        error: 'خطأ في المصادقة. تحقق من مفتاح OpenAI API'
      });
    }

    if (error.response?.status === 429) {
      return res.status(429).json({
        error: 'عدد الطلبات كثير جداً. حاول لاحقاً'
      });
    }

    res.status(500).json({
      error: 'حدث خطأ في توليد الرسالة. حاول مرة أخرى لاحقاً'
    });
  }
});

// 🔗 Redirect to PayPal (آمن)
app.get('/api/paypal-redirect', (req, res) => {
  // يمكنك إضافة تتبع أو معالجة إضافية هنا
  res.redirect(PAYPAL_LINK);
});

// ✅ Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ✅ عرض الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'الصفحة غير موجودة'
  });
});

// بدء الخادم
app.listen(PORT, () => {
  console.log(`✅ التطبيق يعمل على http://localhost:${PORT}`);
  console.log('🔒 جميع مفاتيح API محمية في الخادم');
});

module.exports = app;