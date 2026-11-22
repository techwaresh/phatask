# Pasmh Work Management System (BWMS)
## نظام إدارة العمل — مؤسسة بصمة للأعمال الإنسانية

نظام ويب داخلي متكامل لإدارة المهام والخطط والتقارير لمؤسسة بصمة للأعمال الإنسانية.

---

## 🏗️ هيكل المشروع

```
phatask/
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── config/        # إعدادات DB، JWT، Mail، Storage
│   │   ├── middleware/    # Auth، RBAC، Error Handler
│   │   ├── modules/       # الوحدات (auth, users, tasks, plans, reports…)
│   │   ├── utils/         # أدوات مساعدة
│   │   ├── validators/    # Zod Schemas
│   │   └── jobs/          # Cron Jobs (إنشاء التقارير التلقائية)
│   ├── database/
│   │   ├── migrations/    # Knex Migrations
│   │   └── seeds/         # Seeders
│   └── tests/             # Vitest + Supertest
├── frontend/          # React + Vite + Ant Design
│   └── src/
│       ├── api/           # Axios clients
│       ├── components/    # مكونات مشتركة
│       ├── features/      # وحدات الواجهة
│       ├── hooks/         # Custom Hooks
│       ├── stores/        # Zustand Stores
│       └── types/         # TypeScript Types
└── docs/              # التوثيق الكامل
```

---

## 🚀 متطلبات التشغيل

- Node.js >= 20
- MySQL 8.0
- npm >= 9

## ⚙️ إعداد البيئة

```bash
# Backend
cd backend
cp .env.example .env
# عدّل .env بإعدادات قاعدة البيانات والبريد
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

## 🧪 تشغيل الاختبارات

```bash
cd backend
npm test
```

---

## 👥 الفريق والأدوار

| المستخدم | الدور |
|----------|-------|
| محمد صالح القطوي | مدير تنفيذي |
| منير الوريش | مدير قسم (الحسابات) |
| عمار المرحمي | مدير قسم (المشاريع) |
| بشار الوريش | موظف (الموارد البشرية) |
| عبدالغني المسوري | موظف (الحماية) |
| أحمد الشرعبي | موظف (المخازن) |
| بدر القطوي | موظف (الإعلام) |
| محمد جابر | موظف (الحسابات) |

---

## 📄 الوثائق

- [SRS.md](docs/SRS.md) — متطلبات النظام
- [DATABASE.md](docs/DATABASE.md) — تصميم قاعدة البيانات
- [API.md](docs/API.md) — توثيق API
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — دليل النشر
- [DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) — خطة التطوير
- [DECISIONS.md](docs/DECISIONS.md) — القرارات المعمارية
