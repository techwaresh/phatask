# API.md — توثيق REST API
## Pasmh Work Management System

**Base URL:** `/api/v1`
**Content-Type:** `application/json`
**Auth:** `Authorization: Bearer <access_token>`

---

## Authentication

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| POST | `/auth/login` | تسجيل الدخول | عام |
| POST | `/auth/logout` | تسجيل الخروج | مسجل |
| POST | `/auth/refresh` | تجديد التوكن | عام (refresh token) |
| POST | `/auth/forgot-password` | طلب استعادة كلمة المرور | عام |
| POST | `/auth/reset-password` | إعادة تعيين كلمة المرور | رابط التوكن |
| PUT | `/auth/change-password` | تغيير كلمة المرور | مسجل |

---

## Users

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/users` | قائمة المستخدمين | مدير تنفيذي |
| GET | `/users/:id` | بيانات مستخدم | مدير تنفيذي / نفسه |
| PUT | `/users/:id` | تعديل مستخدم | مدير تنفيذي |
| PUT | `/users/:id/status` | تفعيل/إيقاف حساب | مدير تنفيذي |
| GET | `/users/me` | بيانات المستخدم الحالي | مسجل |
| PUT | `/users/me/profile` | تعديل الملف الشخصي | مسجل |

---

## Departments

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/departments` | قائمة الأقسام | مسجل |
| GET | `/departments/:id` | بيانات قسم | مسجل |
| PUT | `/departments/:id` | تعديل قسم | مدير تنفيذي |
| PUT | `/departments/:id/manager` | تعيين مدير قسم | مدير تنفيذي |

---

## Plans

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/plans` | قائمة الخطط | حسب الدور |
| POST | `/plans` | إنشاء خطة | موظف+ |
| GET | `/plans/:id` | تفاصيل خطة | صاحب/مدير/ED |
| PUT | `/plans/:id` | تعديل خطة (مسودة فقط) | صاحب |
| DELETE | `/plans/:id` | حذف خطة (مسودة فقط) | صاحب |
| POST | `/plans/:id/submit` | إرسال للمراجعة | صاحب |
| POST | `/plans/:id/approve` | اعتماد | مدير قسم/ED |
| POST | `/plans/:id/reject` | رفض | مدير قسم/ED |
| POST | `/plans/:id/request-revision` | إعادة للتعديل | مدير قسم/ED |
| GET | `/plans/:id/approval-history` | تاريخ الاعتمادات | صاحب/مدير/ED |

---

## Tasks

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/tasks` | قائمة المهام | حسب الدور |
| POST | `/tasks` | إنشاء مهمة | موظف+ |
| GET | `/tasks/:id` | تفاصيل مهمة | المعنيون |
| PUT | `/tasks/:id` | تعديل مهمة | صاحب/مسند/مدير |
| POST | `/tasks/:id/assign` | إسناد لموظف | مدير |
| PUT | `/tasks/:id/status` | تحديث الحالة | المكلف |
| PUT | `/tasks/:id/progress` | تحديث نسبة الإنجاز | المكلف |
| POST | `/tasks/:id/submit-review` | طلب مراجعة | المكلف |
| POST | `/tasks/:id/approve` | اعتماد مهمة | مدير قسم/ED |
| POST | `/tasks/:id/reject` | رفض مهمة | مدير قسم/ED |
| GET | `/tasks/:id/comments` | تعليقات المهمة | المعنيون |
| POST | `/tasks/:id/comments` | إضافة تعليق | المعنيون |
| GET | `/tasks/:id/history` | سجل التعديلات | المعنيون |
| POST | `/tasks/:id/attachments` | رفع مرفق | المعنيون |
| DELETE | `/tasks/:id/attachments/:fileId` | حذف مرفق | صاحب |

---

## Reports

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/reports` | قائمة التقارير | حسب الدور |
| POST | `/reports` | إنشاء تقرير | موظف+ |
| POST | `/reports/auto-generate` | إنشاء تقرير يومي تلقائي | موظف |
| GET | `/reports/:id` | تفاصيل تقرير | المعنيون |
| PUT | `/reports/:id` | تعديل تقرير (مسودة) | صاحب |
| POST | `/reports/:id/submit` | إرسال للمراجعة | صاحب |
| POST | `/reports/:id/approve` | اعتماد | مدير قسم/ED |
| POST | `/reports/:id/reject` | رفض | مدير قسم/ED |
| GET | `/reports/:id/export/pdf` | تصدير PDF | صاحب/مدير/ED |

---

## Approvals

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/approvals/pending` | الاعتمادات المنتظرة | مدير قسم/ED |
| GET | `/approvals/history` | تاريخ الاعتمادات | مدير قسم/ED |

---

## Notifications

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/notifications` | قائمة الإشعارات | مسجل |
| PUT | `/notifications/:id/read` | تعليم كمقروء | مسجل |
| PUT | `/notifications/read-all` | تعليم الكل كمقروء | مسجل |
| GET | `/notifications/unread-count` | عداد غير المقروء | مسجل |

---

## Dashboard

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/dashboard/executive` | لوحة المدير التنفيذي | ED |
| GET | `/dashboard/employee` | لوحة الموظف | موظف |
| GET | `/dashboard/department/:id` | إحصائيات القسم | مدير قسم/ED |

---

## Admin

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| GET | `/admin/activity-logs` | سجل العمليات | ED |
| GET | `/admin/system-settings` | إعدادات النظام | ED |
| PUT | `/admin/system-settings` | تعديل الإعدادات | ED |

---

## Files

| Method | Endpoint | الوصف | الصلاحية |
|--------|----------|-------|----------|
| POST | `/files/upload` | رفع ملف | مسجل |

---

## نماذج الاستجابة

### نجاح
```json
{
  "success": true,
  "data": { ... },
  "message": "تمت العملية بنجاح"
}
```

### خطأ
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "غير مصرح لك بهذه العملية",
    "details": []
  }
}
```

### قائمة مع Pagination
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "perPage": 20,
      "totalPages": 5
    }
  }
}
```
