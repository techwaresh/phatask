# DEPLOYMENT.md — دليل النشر
## Pasmh Work Management System

---

## خطة الاستضافة (مجانية - النسخة الأولى)

| الخدمة | الغرض | الخطة | الحدود |
|---------|-------|-------|--------|
| **Railway** | Backend (Node.js) + MySQL | Hobby Free | 500 ساعة/شهر، 100MB DB |
| **Vercel** | Frontend (React) | Free | نطاق غير محدود |
| **Cloudinary** | تخزين الملفات | Free | 25 GB تخزين، 25 GB bandwidth |
| **Gmail SMTP** | إرسال البريد | Free | 500 بريد/يوم |

> ⚠️ **تحذير:** Railway Free يوقف الخدمة بعد 500 ساعة/شهر (~21 يوم متواصل). للاستخدام الدائم يوصى بالانتقال لـ Railway Starter ($5/شهر) أو Render Free (يوقف بعد خمول 15 دقيقة).

---

## متغيرات البيئة المطلوبة

### Backend (.env)
```env
# Server
NODE_ENV=production
PORT=5000
APP_URL=https://your-backend.railway.app

# Database
DB_HOST=
DB_PORT=3306
DB_NAME=bwms
DB_USER=
DB_PASSWORD=

# JWT
JWT_ACCESS_SECRET=      # generate: openssl rand -hex 64
JWT_REFRESH_SECRET=     # generate: openssl rand -hex 64
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=              # App Password (not main password)
EMAIL_FROM_NAME=نظام بصمة
EMAIL_FROM_ADDRESS=

# Frontend
FRONTEND_URL=https://your-app.vercel.app

# Timezone
TZ=Asia/Aden
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://your-backend.railway.app/api/v1
```

---

## خطوات النشر

### 1. قاعدة البيانات (Railway MySQL)
```bash
# إنشاء مشروع على Railway وإضافة MySQL plugin
# نسخ بيانات الاتصال إلى .env
```

### 2. Backend (Railway)
```bash
# ربط مستودع GitHub
# إضافة متغيرات البيئة
# تشغيل الـ Migrations تلقائياً عند النشر
# إعداد Health Check: GET /api/v1/health
```

### 3. Frontend (Vercel)
```bash
# ربط مستودع GitHub
# Build Command: npm run build
# Output Directory: dist
# إضافة VITE_API_BASE_URL
```

### 4. إعداد الحسابات الأولية
```bash
# تشغيل سكريبت الإعداد الأولي (يطلب كلمات مرور تفاعلياً)
npm run setup:users
```

---

## النسخ الاحتياطي

- MySQL Dump أسبوعي (يدوي في النسخة المجانية)
- Cloudinary يحتفظ بالملفات تلقائياً

---

## التحقق بعد النشر

```bash
curl https://your-backend.railway.app/api/v1/health
# المتوقع: {"status":"ok","timestamp":"..."}
```
