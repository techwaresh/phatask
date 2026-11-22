# DATABASE.md — تصميم قاعدة البيانات
## Pasmh Work Management System

---

## الإعدادات العامة

- **محرك قاعدة البيانات:** MySQL 8.0
- **Storage Engine:** InnoDB
- **Charset:** utf8mb4
- **Collation:** utf8mb4_unicode_ci
- **Timezone:** UTC (التحويل للعرض في Asia/Aden يتم في التطبيق)

---

## ERD — مخطط العلاقات

```
users (1) ─────────── (*) user_roles ─────────── (1) roles
users (1) ─────────── (*) plans
users (1) ─────────── (*) tasks (assigned_to)
users (1) ─────────── (*) tasks (created_by)
users (1) ─────────── (*) reports
users (1) ─────────── (*) notifications
users (1) ─────────── (*) task_comments
users (1) ─────────── (*) activity_logs
departments (1) ────── (*) users (dept membership)
departments (1) ────── (1) users (manager)
plans (1) ──────────── (*) plan_items
plans (1) ──────────── (*) approval_steps
tasks (1) ──────────── (*) task_comments
tasks (1) ──────────── (*) task_attachments
tasks (1) ──────────── (*) task_history
tasks (1) ──────────── (*) report_tasks
reports (1) ─────────── (*) report_attachments
reports (1) ─────────── (*) report_tasks
reports (1) ─────────── (*) approval_steps
files (1) ──────────── (*) task_attachments
files (1) ──────────── (*) report_attachments
roles (1) ──────────── (*) role_permissions ────── (1) permissions
```

---

## تفصيل الجداول

### 1. `users`
| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | BIGINT UNSIGNED | PK, AI | المعرف الفريد |
| name | VARCHAR(150) | NOT NULL | الاسم الكامل |
| email | VARCHAR(191) | UNIQUE, NOT NULL | البريد الإلكتروني |
| password_hash | VARCHAR(255) | NOT NULL | كلمة المرور (Argon2id) |
| department_id | BIGINT UNSIGNED | FK → departments | القسم |
| is_active | TINYINT(1) | DEFAULT 1 | هل الحساب نشط |
| avatar_url | VARCHAR(500) | NULL | رابط الصورة الشخصية |
| last_login_at | TIMESTAMP | NULL | آخر تسجيل دخول |
| email_verified_at | TIMESTAMP | NULL | تاريخ تأكيد البريد |
| created_at | TIMESTAMP | DEFAULT NOW | تاريخ الإنشاء |
| updated_at | TIMESTAMP | AUTO | تاريخ التعديل |
| deleted_at | TIMESTAMP | NULL | الحذف اللين |

**Indexes:** `email`, `department_id`, `is_active`

---

### 2. `departments`
| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | BIGINT UNSIGNED | PK, AI | |
| name | VARCHAR(100) | NOT NULL | اسم القسم |
| slug | VARCHAR(100) | UNIQUE | مختصر فريد |
| manager_id | BIGINT UNSIGNED | FK → users, NULL | مدير القسم |
| description | TEXT | NULL | وصف القسم |
| is_active | TINYINT(1) | DEFAULT 1 | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |

**الأقسام السبعة المحددة:**
1. الحسابات
2. المشاريع
3. الموارد البشرية
4. الحماية
5. المخازن واللوجستيات
6. الإعلام
7. الإدارة (للمدير التنفيذي)

---

### 3. `roles`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(50) UNIQUE | executive_director, department_manager, employee |
| display_name | VARCHAR(100) | المسمى بالعربية |
| created_at | TIMESTAMP | |

---

### 4. `permissions`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(100) UNIQUE | مثل: plans.create, tasks.assign |
| module | VARCHAR(50) | الوحدة (plans, tasks, reports…) |
| description | VARCHAR(255) | |

---

### 5. `user_roles`
| العمود | النوع | الوصف |
|--------|-------|-------|
| user_id | BIGINT UNSIGNED FK | |
| role_id | BIGINT UNSIGNED FK | |
| PRIMARY KEY | (user_id, role_id) | |

---

### 6. `role_permissions`
| العمود | النوع | الوصف |
|--------|-------|-------|
| role_id | BIGINT UNSIGNED FK | |
| permission_id | BIGINT UNSIGNED FK | |
| PRIMARY KEY | (role_id, permission_id) | |

---

### 7. `plans`
| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | BIGINT UNSIGNED | PK, AI | |
| user_id | BIGINT UNSIGNED | FK → users | منشئ الخطة |
| department_id | BIGINT UNSIGNED | FK → departments | |
| type | ENUM('daily','weekly','monthly') | NOT NULL | نوع الخطة |
| title | VARCHAR(255) | NOT NULL | العنوان |
| period_start | DATE | NOT NULL | بداية الفترة |
| period_end | DATE | NOT NULL | نهاية الفترة |
| status | ENUM('draft','submitted','under_review','approved','rejected','revision_requested') | DEFAULT 'draft' | |
| notes | TEXT | NULL | ملاحظات |
| submitted_at | TIMESTAMP | NULL | |
| approved_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Unique:** `(user_id, type, period_start)` — منع تكرار الخطة لنفس المستخدم والفترة

---

### 8. `plan_items`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| plan_id | BIGINT UNSIGNED FK | |
| item_type | ENUM('goal','activity','expected_result') | نوع البند |
| content | TEXT NOT NULL | المحتوى |
| order_index | INT DEFAULT 0 | الترتيب |
| completion_rate | TINYINT UNSIGNED DEFAULT 0 | نسبة الإنجاز % |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### 9. `tasks`
| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | BIGINT UNSIGNED | PK, AI | |
| title | VARCHAR(255) | NOT NULL | |
| description | TEXT | NULL | |
| created_by | BIGINT UNSIGNED | FK → users | |
| assigned_to | BIGINT UNSIGNED | FK → users | |
| department_id | BIGINT UNSIGNED | FK → departments | |
| plan_id | BIGINT UNSIGNED | FK → plans, NULL | الخطة المرتبطة |
| priority | ENUM('low','medium','high','urgent') | DEFAULT 'medium' | |
| status | ENUM('pending','in_progress','completed','under_review','approved','rejected','cancelled') | DEFAULT 'pending' | |
| completion_rate | TINYINT UNSIGNED | DEFAULT 0 | % الإنجاز |
| due_date | DATE | NOT NULL | موعد التسليم |
| completed_at | TIMESTAMP | NULL | |
| approved_at | TIMESTAMP | NULL | |
| approved_by | BIGINT UNSIGNED | FK → users, NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Indexes:** `assigned_to`, `created_by`, `department_id`, `status`, `due_date`

---

### 10. `task_comments`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| task_id | BIGINT UNSIGNED FK | |
| user_id | BIGINT UNSIGNED FK | |
| content | TEXT NOT NULL | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

### 11. `task_history`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| task_id | BIGINT UNSIGNED FK | |
| changed_by | BIGINT UNSIGNED FK | |
| field_name | VARCHAR(100) | الحقل الذي تغير |
| old_value | TEXT | القيمة القديمة |
| new_value | TEXT | القيمة الجديدة |
| change_reason | TEXT NULL | سبب التغيير |
| created_at | TIMESTAMP | |

---

### 12. `files`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| uploaded_by | BIGINT UNSIGNED FK | |
| original_name | VARCHAR(255) | الاسم الأصلي |
| storage_key | VARCHAR(500) | المفتاح في Cloud Storage |
| storage_provider | VARCHAR(50) DEFAULT 'cloudinary' | |
| mime_type | VARCHAR(100) | |
| file_size | INT UNSIGNED | بالبايت |
| public_url | VARCHAR(500) | رابط عام (للصور) |
| created_at | TIMESTAMP | |

---

### 13. `task_attachments`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| task_id | BIGINT UNSIGNED FK | |
| file_id | BIGINT UNSIGNED FK | |
| created_at | TIMESTAMP | |

---

### 14. `reports`
| العمود | النوع | القيود | الوصف |
|--------|-------|--------|-------|
| id | BIGINT UNSIGNED | PK | |
| user_id | BIGINT UNSIGNED | FK → users | |
| department_id | BIGINT UNSIGNED | FK → departments | |
| type | ENUM('daily','weekly','monthly') | | |
| title | VARCHAR(255) | | |
| period_start | DATE | | |
| period_end | DATE | | |
| content | LONGTEXT | | المحتوى الكامل (يدعم HTML/Markdown) |
| is_auto_generated | TINYINT(1) | DEFAULT 0 | هل تم إنشاؤه تلقائياً |
| status | ENUM('draft','submitted','under_review','approved','rejected','revision_requested') | DEFAULT 'draft' | |
| submitted_at | TIMESTAMP | NULL | |
| approved_at | TIMESTAMP | NULL | |
| created_at | TIMESTAMP | | |
| updated_at | TIMESTAMP | | |
| deleted_at | TIMESTAMP | NULL | |

**Unique:** `(user_id, type, period_start)` — منع تكرار التقرير

---

### 15. `report_tasks`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| report_id | BIGINT UNSIGNED FK | |
| task_id | BIGINT UNSIGNED FK | |
| notes | TEXT NULL | ملاحظة الموظف على المهمة في التقرير |

---

### 16. `report_attachments`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| report_id | BIGINT UNSIGNED FK | |
| file_id | BIGINT UNSIGNED FK | |
| created_at | TIMESTAMP | |

---

### 17. `approval_steps`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| entity_type | ENUM('plan','report','task') | نوع الكيان |
| entity_id | BIGINT UNSIGNED | معرف الكيان |
| step_order | TINYINT UNSIGNED | ترتيب خطوة الاعتماد (1=مدير قسم، 2=مدير تنفيذي) |
| approver_id | BIGINT UNSIGNED FK → users | المعتمد |
| status | ENUM('pending','approved','rejected','revision_requested') | DEFAULT 'pending' | |
| notes | TEXT NULL | سبب الرفض أو الإعادة |
| acted_at | TIMESTAMP NULL | وقت القرار |
| created_at | TIMESTAMP | |

**Index:** `(entity_type, entity_id)`

---

### 18. `notifications`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK | المستلم |
| type | VARCHAR(100) | نوع الإشعار (task.assigned, plan.approved…) |
| title | VARCHAR(255) | عنوان الإشعار |
| body | TEXT | نص الإشعار |
| related_entity_type | VARCHAR(50) NULL | |
| related_entity_id | BIGINT UNSIGNED NULL | |
| is_read | TINYINT(1) DEFAULT 0 | |
| read_at | TIMESTAMP NULL | |
| created_at | TIMESTAMP | |

---

### 19. `notification_logs`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| notification_id | BIGINT UNSIGNED FK | |
| channel | ENUM('in_app','email') | |
| status | ENUM('pending','sent','failed') | |
| sent_at | TIMESTAMP NULL | |
| error_message | TEXT NULL | |

---

### 20. `activity_logs`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK | |
| action | VARCHAR(100) | الفعل (created, updated, deleted, approved…) |
| entity_type | VARCHAR(50) | |
| entity_id | BIGINT UNSIGNED | |
| description | TEXT | |
| ip_address | VARCHAR(45) | |
| user_agent | TEXT | |
| created_at | TIMESTAMP | |

---

### 21. `password_resets`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK | |
| token_hash | VARCHAR(255) | هاش التوكن |
| expires_at | TIMESTAMP | |
| used_at | TIMESTAMP NULL | |
| created_at | TIMESTAMP | |

---

### 22. `system_settings`
| العمود | النوع | الوصف |
|--------|-------|-------|
| id | BIGINT UNSIGNED PK | |
| key | VARCHAR(100) UNIQUE | |
| value | TEXT | |
| description | VARCHAR(255) | |
| updated_at | TIMESTAMP | |

---

## قواعد البيانات المهمة

1. **لا حذف نهائي** للخطط والتقارير المعتمدة وسجلات التدقيق.
2. **Transactions** لعمليات الاعتماد والإنشاء التلقائي.
3. **Unique constraints** لمنع تكرار الخطط والتقارير.
4. **Foreign Keys** مع ON DELETE RESTRICT للبيانات الحساسة.
