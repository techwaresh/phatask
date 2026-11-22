// src/modules/tasks/tasks.service.js
import db from '../../config/database.js';
import { NotificationService } from '../notifications/notifications.service.js';

export class TasksService {
  /**
   * جلب المهام مع الفلاتر وحدود الوصول
   */
  static async listTasks(user, {
    status,
    priority,
    assignedTo,
    createdBy,
    departmentId,
    planId,
    dueBefore,
    search,
    page = 1,
    limit = 20,
  }) {
    const offset = (page - 1) * limit;

    let query = db('tasks as t')
      .leftJoin('users as u_assign', 't.assigned_to', 'u_assign.id')
      .leftJoin('users as u_creator', 't.created_by', 'u_creator.id')
      .leftJoin('departments as d', 't.department_id', 'd.id')
      .whereNull('t.deleted_at')
      .select(
        't.*',
        'u_assign.name as assigned_to_name',
        'u_assign.email as assigned_to_email',
        'u_creator.name as created_by_name',
        'd.name as department_name'
      );

    // تطبيق حدود الوصول المؤسسي
    if (!user.isExecutive) {
      if (user.isDepartmentManager) {
        // مدير القسم يرى مهام قسمه أو المهام التي أسندها أو المسندة إليه
        query = query.where((b) => {
          b.where('t.department_id', user.department_id)
            .orWhere('t.assigned_to', user.id)
            .orWhere('t.created_by', user.id);
        });
      } else {
        // الموظف يرى المهام المسندة إليه أو التي أنشأها
        query = query.where((b) => {
          b.where('t.assigned_to', user.id).orWhere('t.created_by', user.id);
        });
      }
    }

    if (status) query = query.where('t.status', status);
    if (priority) query = query.where('t.priority', priority);
    if (assignedTo) query = query.where('t.assigned_to', assignedTo);
    if (createdBy) query = query.where('t.created_by', createdBy);
    if (departmentId) query = query.where('t.department_id', departmentId);
    if (planId) query = query.where('t.plan_id', planId);
    if (dueBefore) query = query.where('t.due_date', '<=', dueBefore);

    if (search) {
      query = query.where((b) => {
        b.where('t.title', 'like', `%${search}%`).orWhere('t.description', 'like', `%${search}%`);
      });
    }

    const [{ total }] = await query.clone().count('t.id as total');

    const tasks = await query
      .orderBy('t.due_date', 'asc')
      .limit(limit)
      .offset(offset);

    return {
      items: tasks,
      pagination: {
        total: Number(total),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  /**
   * جلب تفاصيل مهمة مع التعليقات والمرفقات والتاريخ
   */
  static async getTaskById(id, user) {
    const task = await db('tasks as t')
      .leftJoin('users as u_assign', 't.assigned_to', 'u_assign.id')
      .leftJoin('users as u_creator', 't.created_by', 'u_creator.id')
      .leftJoin('users as u_appr', 't.approved_by', 'u_appr.id')
      .leftJoin('departments as d', 't.department_id', 'd.id')
      .leftJoin('plans as p', 't.plan_id', 'p.id')
      .where('t.id', id)
      .whereNull('t.deleted_at')
      .select(
        't.*',
        'u_assign.name as assigned_to_name',
        'u_assign.email as assigned_to_email',
        'u_assign.avatar_url as assigned_to_avatar',
        'u_creator.name as created_by_name',
        'u_appr.name as approved_by_name',
        'd.name as department_name',
        'p.title as plan_title'
      )
      .first();

    if (!task) {
      const error = new Error('المهمة غير موجودة');
      error.statusCode = 404;
      throw error;
    }

    // التحقق من صلاحية الوصول
    if (!user.isExecutive) {
      const isAssigned = task.assigned_to === user.id;
      const isCreator = task.created_by === user.id;
      const isManagerOfDept = user.isDepartmentManager && task.department_id === user.department_id;

      if (!isAssigned && !isCreator && !isManagerOfDept) {
        const error = new Error('غير مصرح لك بعرض هذه المهمة');
        error.statusCode = 403;
        throw error;
      }
    }

    // جلب التعليقات
    const comments = await db('task_comments as c')
      .leftJoin('users as u', 'c.user_id', 'u.id')
      .where({ task_id: id })
      .select('c.*', 'u.name as user_name', 'u.avatar_url as user_avatar')
      .orderBy('c.created_at', 'asc');

    // جلب المرفقات
    const attachments = await db('task_attachments as ta')
      .join('files as f', 'ta.file_id', 'f.id')
      .where({ 'ta.task_id': id })
      .select('f.*', 'ta.created_at as attached_at');

    // جلب سجل التعديلات
    const history = await db('task_history as h')
      .leftJoin('users as u', 'h.changed_by', 'u.id')
      .where({ task_id: id })
      .select('h.*', 'u.name as changed_by_name')
      .orderBy('h.created_at', 'desc');

    task.comments = comments;
    task.attachments = attachments;
    task.history = history;

    return task;
  }

  /**
   * إنشاء مهمة جديدة
   */
  static async createTask(user, data) {
    let assignedTo = data.assigned_to || user.id;
    let departmentId = data.department_id || user.department_id;

    // قواعد الإسناد:
    // - الموظف العادي: إما مهمة شخصية (لنفسه) فقط
    // - مدير القسم: لنفسه أو لموظفي قسمه
    // - المدير التنفيذي: لأي موظف في أي قسم
    if (!user.isExecutive) {
      if (user.isDepartmentManager) {
        // التحقق أن الموظف المسند إليه ينتمي لنفس القسم
        if (assignedTo !== user.id) {
          const targetUser = await db('users').where({ id: assignedTo }).first();
          if (!targetUser || targetUser.department_id !== user.department_id) {
            const error = new Error('يمكن لمدير القسم إسناد المهام لموظفي قسمه فقط');
            error.statusCode = 403;
            throw error;
          }
        }
      } else {
        // موظف عادي
        if (assignedTo !== user.id) {
          const error = new Error('الموظف يستطيع إنشاء مهامه الشخصية فقط');
          error.statusCode = 403;
          throw error;
        }
      }
    }

    const [taskId] = await db('tasks').insert({
      title: data.title,
      description: data.description || null,
      created_by: user.id,
      assigned_to: assignedTo,
      department_id: departmentId,
      plan_id: data.plan_id || null,
      priority: data.priority || 'medium',
      status: 'pending',
      completion_rate: 0,
      due_date: data.due_date,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // تسجيل في التاريخ
    await db('task_history').insert({
      task_id: taskId,
      changed_by: user.id,
      field_name: 'created',
      old_value: null,
      new_value: 'تم إنشاء المهمة',
      change_reason: 'إنشاء المهمة في النظام',
    });

    // إرسال إشعار للمكلف بالمهمة إذا كان شخصاً آخر
    if (assignedTo !== user.id) {
      await NotificationService.notify({
        userId: assignedTo,
        type: 'task.assigned',
        title: 'تم إسناد مهمة جديدة لك',
        body: `قام ${user.name} بإسناد المهمة (${data.title}) إليك، موعد التسليم: ${data.due_date}`,
        relatedEntityType: 'task',
        relatedEntityId: taskId,
      });
    }

    return this.getTaskById(taskId, user);
  }

  /**
   * تحديث نسبة الإنجاز وحالة المهمة (من قبل المكلف)
   */
  static async updateProgress(id, user, { completion_rate, status, note }) {
    const task = await db('tasks').where({ id }).whereNull('deleted_at').first();
    if (!task) {
      const error = new Error('المهمة غير موجودة');
      error.statusCode = 404;
      throw error;
    }

    // المكلف بالمهمة أو صاحب الصلاحية الإدارية
    const canEdit = task.assigned_to === user.id || user.isExecutive || (user.isDepartmentManager && task.department_id === user.department_id);
    if (!canEdit) {
      const error = new Error('غير مصرح لك بتحديث هذه المهمة');
      error.statusCode = 403;
      throw error;
    }

    const updates = {
      completion_rate,
      updated_at: new Date(),
    };

    let newStatus = status || task.status;
    if (completion_rate === 100 && task.status !== 'approved') {
      // قاعدة العمل: عند وصول الإنجاز 100% تتحول إلى قيد المراجعة ولا تصبح مكتملة إلا بالاعتماد
      newStatus = 'under_review';
    } else if (completion_rate > 0 && task.status === 'pending') {
      newStatus = 'in_progress';
    }
    updates.status = newStatus;

    if (completion_rate === 100) {
      updates.completed_at = new Date();
    }

    await db.transaction(async (trx) => {
      await trx('tasks').where({ id }).update(updates);

      // تسجيل التغيير في السجل
      if (task.completion_rate !== completion_rate) {
        await trx('task_history').insert({
          task_id: id,
          changed_by: user.id,
          field_name: 'completion_rate',
          old_value: `${task.completion_rate}%`,
          new_value: `${completion_rate}%`,
          change_reason: note || 'تحديث نسبة الإنجاز',
        });
      }

      if (task.status !== newStatus) {
        await trx('task_history').insert({
          task_id: id,
          changed_by: user.id,
          field_name: 'status',
          old_value: task.status,
          new_value: newStatus,
          change_reason: note || 'تحديث حالة المهمة',
        });
      }
    });

    // إشعار المنشئ أو المدير إذا تحولت للمراجعة
    if (newStatus === 'under_review' && task.created_by !== user.id) {
      await NotificationService.notify({
        userId: task.created_by,
        type: 'task.review_requested',
        title: 'مهمة بانتظار مراجعتك واعتمادها',
        body: `أكمل ${user.name} المهمة (${task.title}) بنسبة 100% وهي بانتظار اعتمادك.`,
        relatedEntityType: 'task',
        relatedEntityId: id,
      });
    }

    return this.getTaskById(id, user);
  }

  /**
   * اعتماد المهمة أو إعادتها
   */
  static async approveTask(id, user, { action, notes }) {
    const task = await db('tasks').where({ id }).whereNull('deleted_at').first();
    if (!task) {
      const error = new Error('المهمة غير موجودة');
      error.statusCode = 404;
      throw error;
    }

    // قاعدة العمل: لا يعتمد الموظف مهمته بنفسه
    if (task.assigned_to === user.id && !user.isExecutive) {
      const error = new Error('لا يمكنك اعتماد مهمتك الشخصية بنفسك');
      error.statusCode = 403;
      throw error;
    }

    const canApprove =
      user.isExecutive ||
      task.created_by === user.id ||
      (user.isDepartmentManager && task.department_id === user.department_id);

    if (!canApprove) {
      const error = new Error('ليس لديك صلاحية اعتماد هذه المهمة');
      error.statusCode = 403;
      throw error;
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await db.transaction(async (trx) => {
      await trx('tasks').where({ id }).update({
        status: newStatus,
        approved_at: action === 'approve' ? new Date() : null,
        approved_by: action === 'approve' ? user.id : null,
        updated_at: new Date(),
      });

      await trx('task_history').insert({
        task_id: id,
        changed_by: user.id,
        field_name: 'approval',
        old_value: task.status,
        new_value: newStatus,
        change_reason: notes || (action === 'approve' ? 'تم اعتماد المهمة' : 'تم رفض المهمة وإعادتها'),
      });
    });

    // إشعار المكلف بالمهمة
    if (task.assigned_to) {
      await NotificationService.notify({
        userId: task.assigned_to,
        type: action === 'approve' ? 'task.approved' : 'task.rejected',
        title: action === 'approve' ? 'تم اعتماد إنجاز مهمتك' : 'تمت إعادة المهمة مع ملاحظات',
        body: `قام ${user.name} بـ ${action === 'approve' ? 'اعتماد' : 'إعادة'} المهمة (${task.title})${notes ? `: ${notes}` : ''}`,
        relatedEntityType: 'task',
        relatedEntityId: id,
      });
    }

    return this.getTaskById(id, user);
  }

  /**
   * إضافة تعليق على المهمة
   */
  static async addComment(id, user, content) {
    const task = await db('tasks').where({ id }).whereNull('deleted_at').first();
    if (!task) {
      const error = new Error('المهمة غير موجودة');
      error.statusCode = 404;
      throw error;
    }

    const [commentId] = await db('task_comments').insert({
      task_id: id,
      user_id: user.id,
      content,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // إشعار الطرف الآخر (المكلف أو المنشئ)
    const notifyTarget = task.assigned_to === user.id ? task.created_by : task.assigned_to;
    if (notifyTarget && notifyTarget !== user.id) {
      await NotificationService.notify({
        userId: notifyTarget,
        type: 'task.comment',
        title: 'تعليق جديد على المهمة',
        body: `أضاف ${user.name} تعليقاً على المهمة (${task.title}): ${content.slice(0, 80)}...`,
        relatedEntityType: 'task',
        relatedEntityId: id,
      });
    }

    return db('task_comments as c')
      .leftJoin('users as u', 'c.user_id', 'u.id')
      .where('c.id', commentId)
      .select('c.*', 'u.name as user_name', 'u.avatar_url as user_avatar')
      .first();
  }
}
