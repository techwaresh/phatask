// src/modules/plans/plans.service.js
import db from '../../config/database.js';
import { NotificationService } from '../notifications/notifications.service.js';

export class PlansService {
  /**
   * جلب الخطط بحسب الصلاحيات والحدود المؤسسية
   */
  static async listPlans(user, { type, status, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    let query = db('plans as p')
      .leftJoin('users as u', 'p.user_id', 'u.id')
      .leftJoin('departments as d', 'p.department_id', 'd.id')
      .whereNull('p.deleted_at')
      .select(
        'p.*',
        'u.name as user_name',
        'u.email as user_email',
        'd.name as department_name'
      );

    // تطبيق حدود الوصول
    if (!user.isExecutive) {
      if (user.isDepartmentManager) {
        // مدير القسم يرى خطط قسمه
        query = query.where('p.department_id', user.department_id);
      } else {
        // الموظف يرى خططه فقط
        query = query.where('p.user_id', user.id);
      }
    }

    if (type) query = query.where('p.type', type);
    if (status) query = query.where('p.status', status);

    const [{ total }] = await query.clone().count('p.id as total');

    const plans = await query
      .orderBy('p.period_start', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      items: plans,
      pagination: {
        total: Number(total),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  /**
   * جلب خطة محددة مع بنودها وخطوات الاعتماد
   */
  static async getPlanById(id, user) {
    const plan = await db('plans as p')
      .leftJoin('users as u', 'p.user_id', 'u.id')
      .leftJoin('departments as d', 'p.department_id', 'd.id')
      .where('p.id', id)
      .whereNull('p.deleted_at')
      .select(
        'p.*',
        'u.name as user_name',
        'u.email as user_email',
        'd.name as department_name'
      )
      .first();

    if (!plan) {
      const error = new Error('الخطة غير موجودة');
      error.statusCode = 404;
      throw error;
    }

    // التحقق من الصلاحية
    if (!user.isExecutive) {
      if (user.isDepartmentManager && plan.department_id !== user.department_id) {
        const error = new Error('غير مصرح لك بعرض خطة خارج قسمك');
        error.statusCode = 403;
        throw error;
      }
      if (!user.isDepartmentManager && plan.user_id !== user.id) {
        const error = new Error('غير مصرح لك بعرض خطة خاصة بموظف آخر');
        error.statusCode = 403;
        throw error;
      }
    }

    const items = await db('plan_items')
      .where({ plan_id: id })
      .orderBy('order_index', 'asc');

    const approvalSteps = await db('approval_steps as a')
      .leftJoin('users as u', 'a.approver_id', 'u.id')
      .where({ entity_type: 'plan', entity_id: id })
      .select(
        'a.*',
        'u.name as approver_name'
      )
      .orderBy('a.step_order', 'asc');

    plan.items = items;
    plan.approval_steps = approvalSteps;

    return plan;
  }

  /**
   * إنشاء خطة جديدة
   */
  static async createPlan(user, data) {
    // التحقق من عدم وجود خطة سابقة لنفس الفترة
    const existing = await db('plans')
      .where({
        user_id: user.id,
        type: data.type,
        period_start: data.period_start,
      })
      .whereNull('deleted_at')
      .first();

    if (existing) {
      const error = new Error('توجد خطة مسجلة مسبقاً لهذه الفترة ونفس النوع');
      error.statusCode = 409;
      error.code = 'PLAN_ALREADY_EXISTS';
      throw error;
    }

    let createdId;
    await db.transaction(async (trx) => {
      const [planId] = await trx('plans').insert({
        user_id: user.id,
        department_id: user.department_id,
        type: data.type,
        title: data.title,
        period_start: data.period_start,
        period_end: data.period_end,
        status: 'draft',
        notes: data.notes || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      createdId = planId;

      if (data.items && data.items.length > 0) {
        const planItems = data.items.map((item, idx) => ({
          plan_id: planId,
          item_type: item.item_type,
          content: item.content,
          order_index: item.order_index ?? idx,
          completion_rate: item.completion_rate || 0,
          created_at: new Date(),
          updated_at: new Date(),
        }));
        await trx('plan_items').insert(planItems);
      }
    });

    return this.getPlanById(createdId, user);
  }

  /**
   * تعديل خطة (يجب أن تكون في حالة draft أو revision_requested وصاحبها فقط)
   */
  static async updatePlan(id, user, data) {
    const plan = await db('plans').where({ id }).whereNull('deleted_at').first();
    if (!plan) {
      const error = new Error('الخطة غير موجودة');
      error.statusCode = 404;
      throw error;
    }

    if (plan.user_id !== user.id) {
      const error = new Error('لا يمكنك تعديل خطة مستخدم آخر');
      error.statusCode = 403;
      throw error;
    }

    if (plan.status !== 'draft' && plan.status !== 'revision_requested') {
      const error = new Error('لا يمكن تعديل الخطة بعد إرسالها للمراجعة أو اعتمادها');
      error.statusCode = 400;
      throw error;
    }

    await db.transaction(async (trx) => {
      const updateData = { updated_at: new Date() };
      if (data.title) updateData.title = data.title;
      if (data.period_start) updateData.period_start = data.period_start;
      if (data.period_end) updateData.period_end = data.period_end;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await trx('plans').where({ id }).update(updateData);

      if (data.items) {
        await trx('plan_items').where({ plan_id: id }).delete();
        if (data.items.length > 0) {
          const planItems = data.items.map((item, idx) => ({
            plan_id: id,
            item_type: item.item_type,
            content: item.content,
            order_index: item.order_index ?? idx,
            completion_rate: item.completion_rate || 0,
            created_at: new Date(),
            updated_at: new Date(),
          }));
          await trx('plan_items').insert(planItems);
        }
      }
    });

    return this.getPlanById(id, user);
  }

  /**
   * إرسال الخطة للمراجعة
   */
  static async submitPlan(id, user) {
    const plan = await db('plans').where({ id }).whereNull('deleted_at').first();
    if (!plan) {
      const error = new Error('الخطة غير موجودة');
      error.statusCode = 404;
      throw error;
    }

    if (plan.user_id !== user.id) {
      const error = new Error('يمكن لصاحب الخطة فقط إرسالها للمراجعة');
      error.statusCode = 403;
      throw error;
    }

    if (plan.status !== 'draft' && plan.status !== 'revision_requested') {
      const error = new Error('الخطة مرسلة مسبقاً أو معتمدة');
      error.statusCode = 400;
      throw error;
    }

    // تحديد المعتمد التالي:
    // إذا كان للمستخدم قسم وله مدير غير المستخدم نفسه -> مدير القسم
    // إذا كان المستخدم هو مدير القسم أو القسم ليس له مدير -> المدير التنفيذي
    let nextApproverId = null;
    let stepOrder = 1;

    const department = plan.department_id
      ? await db('departments').where({ id: plan.department_id }).first()
      : null;

    const executiveUser = await db('user_roles as ur')
      .join('roles as r', 'ur.role_id', 'r.id')
      .where('r.name', 'executive_director')
      .select('ur.user_id')
      .first();

    const edId = executiveUser ? executiveUser.user_id : null;

    if (user.isExecutive) {
      // استثناء إداري خاص بالمدير التنفيذي لمنع الاعتماد الذاتي
      // تُسجل الخطة وتُعتمد بنظام خاص مسجل
      nextApproverId = null; // سيتم اعتمادها مباشرة كاستثناء إداري موثق
    } else if (
      department &&
      department.manager_id &&
      department.manager_id !== user.id
    ) {
      nextApproverId = department.manager_id;
      stepOrder = 1;
    } else {
      nextApproverId = edId;
      stepOrder = 1; // تخطي مدير القسم للمدير التنفيذي مباشرة
    }

    await db.transaction(async (trx) => {
      if (user.isExecutive) {
        await trx('plans').where({ id }).update({
          status: 'approved',
          submitted_at: new Date(),
          approved_at: new Date(),
          updated_at: new Date(),
        });
        await trx('approval_steps').insert({
          entity_type: 'plan',
          entity_id: id,
          step_order: 1,
          approver_id: user.id,
          status: 'approved',
          notes: 'اعتماد إداري ذاتي للمدير التنفيذي (إعفاء موثق)',
          acted_at: new Date(),
        });
      } else {
        await trx('plans').where({ id }).update({
          status: 'under_review',
          submitted_at: new Date(),
          updated_at: new Date(),
        });

        if (nextApproverId) {
          await trx('approval_steps').insert({
            entity_type: 'plan',
            entity_id: id,
            step_order: stepOrder,
            approver_id: nextApproverId,
            status: 'pending',
          });

          // إرسال إشعار للمعتمد
          await NotificationService.notify({
            userId: nextApproverId,
            type: 'plan.submitted',
            title: 'خطة جديدة بانتظار مراجعتك',
            body: `قام الموظف ${user.name} بإرسال الخطة (${plan.title}) لمراجعتها واعتمادها.`,
            relatedEntityType: 'plan',
            relatedEntityId: id,
          });
        }
      }
    });

    return this.getPlanById(id, user);
  }

  /**
   * إجراء اعتماد الخطة (approve, reject, request_revision)
   */
  static async handleApprovalAction(id, approver, { action, notes }) {
    const plan = await db('plans as p')
      .leftJoin('users as u', 'p.user_id', 'u.id')
      .where('p.id', id)
      .whereNull('p.deleted_at')
      .select('p.*', 'u.name as owner_name')
      .first();

    if (!plan) {
      const error = new Error('الخطة غير موجودة');
      error.statusCode = 404;
      throw error;
    }

    // قاعدة العمل: لا يجوز لأحد اعتماد خطته الشخصية
    if (plan.user_id === approver.id) {
      const error = new Error('لا يجوز للمستخدم اعتماد خطته الشخصية بنفسه');
      error.statusCode = 403;
      throw error;
    }

    if (plan.status !== 'under_review') {
      const error = new Error('الخطة ليست قيد المراجعة حالياً');
      error.statusCode = 400;
      throw error;
    }

    // جلب الخطوة المعلقة لهذا المعتمد
    const pendingStep = await db('approval_steps')
      .where({
        entity_type: 'plan',
        entity_id: id,
        approver_id: approver.id,
        status: 'pending',
      })
      .first();

    // إذا كان المعتمد مديراً تنفيذياً فله سلطة البت حتى لو لم تكن الخطوة باسمه
    if (!pendingStep && !approver.isExecutive) {
      const error = new Error('لست المعتمد المعين لهذه الخطوة');
      error.statusCode = 403;
      throw error;
    }

    await db.transaction(async (trx) => {
      const stepId = pendingStep ? pendingStep.id : null;

      if (stepId) {
        await trx('approval_steps').where({ id: stepId }).update({
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision_requested',
          notes: notes || null,
          acted_at: new Date(),
        });
      }

      if (action === 'request_revision') {
        await trx('plans').where({ id }).update({
          status: 'revision_requested',
          updated_at: new Date(),
        });

        await NotificationService.notify({
          userId: plan.user_id,
          type: 'plan.revision_requested',
          title: 'إعادة الخطة للتعديل',
          body: `طلب ${approver.name} تعديلات على الخطة (${plan.title}): ${notes}`,
          relatedEntityType: 'plan',
          relatedEntityId: id,
        });
      } else if (action === 'reject') {
        await trx('plans').where({ id }).update({
          status: 'rejected',
          updated_at: new Date(),
        });

        await NotificationService.notify({
          userId: plan.user_id,
          type: 'plan.rejected',
          title: 'تم رفض الخطة',
          body: `تم رفض الخطة (${plan.title}) بواسطة ${approver.name}. السبب: ${notes}`,
          relatedEntityType: 'plan',
          relatedEntityId: id,
        });
      } else if (action === 'approve') {
        // إذا كان المعتمد مدير قسم ولم تكن الخطوة الأخيرة، تُصعَّد للمدير التنفيذي
        const isLastStep = approver.isExecutive;

        if (isLastStep) {
          await trx('plans').where({ id }).update({
            status: 'approved',
            approved_at: new Date(),
            updated_at: new Date(),
          });

          await NotificationService.notify({
            userId: plan.user_id,
            type: 'plan.approved',
            title: 'تم اعتماد خطتك نهائياً',
            body: `تم اعتماد الخطة (${plan.title}) بنجاح من المدير التنفيذي.`,
            relatedEntityType: 'plan',
            relatedEntityId: id,
          });
        } else {
          // تصعيد للمدير التنفيذي
          const executiveUser = await trx('user_roles as ur')
            .join('roles as r', 'ur.role_id', 'r.id')
            .where('r.name', 'executive_director')
            .select('ur.user_id')
            .first();

          if (executiveUser) {
            await trx('approval_steps').insert({
              entity_type: 'plan',
              entity_id: id,
              step_order: 2,
              approver_id: executiveUser.user_id,
              status: 'pending',
            });

            await NotificationService.notify({
              userId: executiveUser.user_id,
              type: 'plan.submitted',
              title: 'خطة معتمدة من مدير القسم بانتظار اعتمادك النهائي',
              body: `اعتمد مدير القسم ${approver.name} خطة الموظف (${plan.owner_name}) وهي بانتظار موافقتك النهائية.`,
              relatedEntityType: 'plan',
              relatedEntityId: id,
            });
          }
        }
      }
    });

    return this.getPlanById(id, approver);
  }
}
