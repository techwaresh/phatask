// src/modules/projects/projects.service.js
import db from '../../config/database.js';
import { NotificationService } from '../notifications/notifications.service.js';

export const PROJECT_STAGES = [
  { key: 'intake', label: 'وصول المشروع والاعتماد', role: 'executive' },
  { key: 'financial_analysis', label: 'التحليل المالي والموازنة', role: 'accounts', targetUserId: 2 },
  { key: 'procurement', label: 'عروض الأسعار والتوريد', role: 'logistics', targetUserId: 6 },
  { key: 'field_execution', label: 'التخطيط الميداني والتنفيذ', role: 'projects', targetUserId: 3 },
  { key: 'media_production', label: 'التوثيق الإعلامي والمونتاج', role: 'media', targetUserId: 7 },
  { key: 'evaluation', label: 'المتابعة والتقييم M&E', role: 'projects', targetUserId: 3 },
  { key: 'donor_handover', label: 'حزمة الجهة الداعمة والإغلاق', role: 'executive', targetUserId: 1 },
  { key: 'completed', label: 'مكتمل ومؤرشف', role: 'all' },
];

export class ProjectsService {
  /**
   * جلب قائمة المشاريع مع الفلاتر
   */
  static async listProjects(user, { search, status, stage, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    let query = db('projects as p')
      .leftJoin('users as u_mgr', 'p.manager_id', 'u_mgr.id')
      .leftJoin('users as u_creator', 'p.created_by', 'u_creator.id')
      .whereNull('p.deleted_at')
      .select(
        'p.*',
        'u_mgr.name as manager_name',
        'u_creator.name as creator_name'
      );

    if (status) query = query.where('p.status', status);
    if (stage) query = query.where('p.current_stage', stage);
    if (search) {
      query = query.where((b) => {
        b.where('p.name', 'like', `%${search}%`)
          .orWhere('p.code', 'like', `%${search}%`)
          .orWhere('p.donor', 'like', `%${search}%`)
          .orWhere('p.location', 'like', `%${search}%`);
      });
    }

    const [{ total }] = await query.clone().count('p.id as total');

    const items = await query
      .orderBy('p.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    // إضافة إحصائية المهام لكل مشروع
    for (const item of items) {
      const taskStats = await db('tasks')
        .where({ project_id: item.id })
        .whereNull('deleted_at')
        .select(
          db.raw('count(id) as total_tasks'),
          db.raw('sum(case when status in ("approved", "completed") then 1 else 0 end) as completed_tasks')
        )
        .first();

      item.total_tasks = Number(taskStats?.total_tasks || 0);
      item.completed_tasks = Number(taskStats?.completed_tasks || 0);
      item.tasks_progress = item.total_tasks > 0
        ? Math.round((item.completed_tasks / item.total_tasks) * 100)
        : 0;
    }

    return {
      items,
      pagination: {
        total: Number(total),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }

  /**
   * جلب تفاصيل مشروع شاملة (البيانات، المراحل، المهام، المرفقات)
   */
  static async getProjectById(id, user) {
    const project = await db('projects as p')
      .leftJoin('users as u_mgr', 'p.manager_id', 'u_mgr.id')
      .leftJoin('users as u_creator', 'p.created_by', 'u_creator.id')
      .where('p.id', id)
      .whereNull('p.deleted_at')
      .select(
        'p.*',
        'u_mgr.name as manager_name',
        'u_creator.name as creator_name'
      )
      .first();

    if (!project) {
      const error = new Error('المشروع غير موجود');
      error.statusCode = 404;
      throw error;
    }

    // جلب بيانات المراحل المنفذة
    const stagesDataRows = await db('project_stages_data as psd')
      .leftJoin('users as u', 'psd.submitted_by', 'u.id')
      .where({ project_id: id })
      .select('psd.*', 'u.name as submitted_by_name');

    const stagesData = {};
    for (const row of stagesDataRows) {
      stagesData[row.stage] = {
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        submitted_by: row.submitted_by_name,
        submitted_at: row.submitted_at,
      };
    }

    // جلب المهام المرتبطة بالمشروع
    const tasks = await db('tasks as t')
      .leftJoin('users as u_assign', 't.assigned_to', 'u_assign.id')
      .where({ project_id: id })
      .whereNull('t.deleted_at')
      .select(
        't.id',
        't.title',
        't.description',
        't.priority',
        't.status',
        't.completion_rate',
        't.due_date',
        'u_assign.name as assigned_to_name',
        'u_assign.id as assigned_to_id'
      )
      .orderBy('t.due_date', 'asc');

    // جلب مرفقات ومستندات المشروع
    const files = await db('project_files as pf')
      .leftJoin('users as u', 'pf.uploaded_by', 'u.id')
      .where({ project_id: id })
      .select('pf.*', 'u.name as uploaded_by_name')
      .orderBy('pf.created_at', 'desc');

    project.stages_data = stagesData;
    project.tasks = tasks;
    project.files = files;

    return project;
  }

  /**
   * إنشاء مشروع جديد وتوليد الكود تلقائياً
   */
  static async createProject(user, data) {
    const year = new Date().getFullYear();
    const [{ count }] = await db('projects').count('id as count');
    const nextSeq = String(Number(count) + 1).padStart(3, '0');
    const code = data.code || `PRJ-${year}-${nextSeq}`;

    const [projectId] = await db('projects').insert({
      code,
      name: data.name,
      donor: data.donor,
      description: data.description || null,
      location: data.location,
      start_date: data.start_date,
      end_date: data.end_date,
      total_budget: data.total_budget,
      currency: data.currency || 'USD',
      current_stage: 'intake',
      status: 'active',
      created_by: user.id,
      manager_id: data.manager_id || 3, // الافتراضي: عمار المرحمي (مدير المشاريع)
      created_at: new Date(),
      updated_at: new Date(),
    });

    // إنشاء أول مهمة تلقائية لقسم الحسابات (منير الوريش) لدراسة الموازنة وصافي المبلغ
    const taskDueDate = new Date();
    taskDueDate.setDate(taskDueDate.getDate() + 3);

    const [taskId] = await db('tasks').insert({
      project_id: projectId,
      title: `إعداد التحليل المالي والموازنة لمشروع: ${data.name}`,
      description: `مطلوب من قسم الحسابات احتساب صافي مبلغ المشروع ونسب التشغيل 10% والإدارة 10% وتحديد أجور النقل والعمولات وإرفاق كشف الموازنة.`,
      created_by: user.id,
      assigned_to: 2, // منير منصور الوريش (مدير الحسابات)
      department_id: 2, // الحسابات
      priority: 'high',
      status: 'pending',
      completion_rate: 0,
      due_date: taskDueDate.toISOString().split('T')[0],
      created_at: new Date(),
      updated_at: new Date(),
    });

    // إشعار المحاسب
    NotificationService.notify({
      userId: 2,
      type: 'project_assigned',
      title: 'مشروع جديد بحاجة للتحليل المالي',
      body: `تم اعتماد مشروع جديد (${data.name}) من قبل الإدارة، يرجى إعداد التحليل المالي والموازنة الصافية.`,
      relatedEntityType: 'task',
      relatedEntityId: taskId,
    }).catch((err) => console.error('Notification error:', err));

    return this.getProjectById(projectId, user);
  }

  /**
   * حفظ بيانات مرحلة معينة
   */
  static async saveStageData(projectId, stage, stageData, user) {
    const project = await db('projects').where({ id: projectId }).first();
    if (!project) {
      const error = new Error('المشروع غير موجود');
      error.statusCode = 404;
      throw error;
    }

    const payload = {
      project_id: projectId,
      stage,
      data: JSON.stringify(stageData),
      submitted_by: user.id,
      submitted_at: new Date(),
      updated_at: new Date(),
    };

    const existing = await db('project_stages_data')
      .where({ project_id: projectId, stage })
      .first();

    if (existing) {
      await db('project_stages_data')
        .where({ project_id: projectId, stage })
        .update(payload);
    } else {
      payload.created_at = new Date();
      await db('project_stages_data').insert(payload);
    }

    return this.getProjectById(projectId, user);
  }

  /**
   * الانتقال للمرحلة التالية في دورة حياة المشروع وتوليد المهمة المقابلة
   */
  static async advanceStage(projectId, nextStage, user) {
    const project = await db('projects').where({ id: projectId }).first();
    if (!project) {
      const error = new Error('المشروع غير موجود');
      error.statusCode = 404;
      throw error;
    }

    await db('projects')
      .where({ id: projectId })
      .update({
        current_stage: nextStage,
        status: nextStage === 'completed' ? 'completed' : 'active',
        updated_at: new Date(),
      });

    // توليد المهمة الميدانية/الإدارية المقابلة للمرحلة الجديدة
    let assignedUserId = null;
    let departmentId = null;
    let taskTitle = '';
    let taskDesc = '';

    if (nextStage === 'financial_analysis') {
      assignedUserId = 2; // الحسابات
      departmentId = 2;
      taskTitle = `إعداد التحليل المالي لمشروع: ${project.name}`;
      taskDesc = `احتساب صافي المبلغ ونسب الـ 10% التشغيلية والإدارية.`;
    } else if (nextStage === 'procurement') {
      assignedUserId = 6; // أحمد الشرعبي (اللوجستيات)
      departmentId = 6;
      taskTitle = `جمع عروض الأسعار وأمر الشراء لمشروع: ${project.name}`;
      taskDesc = `التواصل مع الموردين والتجار وجمع عروض الأسعار وتحرير نموذج التحليل وأمر الشراء.`;
    } else if (nextStage === 'field_execution') {
      assignedUserId = 3; // عمار المرحمي (المشاريع)
      departmentId = 3;
      taskTitle = `التجهيز الميداني والتصاريح وكشوفات المستفيدين: ${project.name}`;
      taskDesc = `استخراج التصاريح الرسمية، التنسيق مع اللجان المجتمعية، حصر كشوفات المستفيدين وتحديد فرق التوزيع.`;
    } else if (nextStage === 'media_production') {
      assignedUserId = 7; // بدر القطوي (الإعلام)
      departmentId = 7;
      taskTitle = `التوثيق الإعلامي والمونتاج الميداني لمشروع: ${project.name}`;
      taskDesc = `تغطية مراحل التوزيع والتجهيز بالفيديو والصور عالية الدقة وإعداد المونتاج النهائي.`;
    } else if (nextStage === 'evaluation') {
      assignedUserId = 3; // عمار المرحمي / التقييم
      departmentId = 3;
      taskTitle = `إعداد استمارة التقييم والتقرير الفني لمشروع: ${project.name}`;
      taskDesc = `حصر الإيجابيات والسلبيات والتحديات وإعداد التقرير الفني الختامي للمشروع.`;
    } else if (nextStage === 'donor_handover') {
      assignedUserId = 1; // المدير التنفيذي
      departmentId = 1;
      taskTitle = `اعتماد وتسليم الحزمة الختامية للداعم: ${project.name}`;
      taskDesc = `مراجعة كشوف المستفيدين، التقرير الفني، الفواتير وسند القبض والتوثيق وتسليمها للمانح.`;
    }

    if (assignedUserId) {
      const taskDueDate = new Date();
      taskDueDate.setDate(taskDueDate.getDate() + 5);

      const [taskId] = await db('tasks').insert({
        project_id: projectId,
        title: taskTitle,
        description: taskDesc,
        created_by: user.id,
        assigned_to: assignedUserId,
        department_id: departmentId,
        priority: 'high',
        status: 'pending',
        completion_rate: 0,
        due_date: taskDueDate.toISOString().split('T')[0],
        created_at: new Date(),
        updated_at: new Date(),
      });

      NotificationService.notify({
        userId: assignedUserId,
        type: 'project_stage_advanced',
        title: `مرحلة جديدة في مشروع: ${project.name}`,
        body: taskTitle,
        relatedEntityType: 'task',
        relatedEntityId: taskId,
      }).catch((err) => console.error('Notification error:', err));
    }

    return this.getProjectById(projectId, user);
  }

  /**
   * إضافة مهمة يدوية مخصصة مرتبطة بالمشروع
   */
  static async createProjectTask(projectId, user, data) {
    const project = await db('projects').where({ id: projectId }).first();
    if (!project) {
      const error = new Error('المشروع غير موجود');
      error.statusCode = 404;
      throw error;
    }

    const [taskId] = await db('tasks').insert({
      project_id: projectId,
      title: data.title,
      description: data.description || null,
      created_by: user.id,
      assigned_to: data.assigned_to || user.id,
      department_id: data.department_id || user.department_id,
      priority: data.priority || 'medium',
      status: 'pending',
      completion_rate: 0,
      due_date: data.due_date,
      created_at: new Date(),
      updated_at: new Date(),
    });

    if (data.assigned_to && data.assigned_to !== user.id) {
      NotificationService.notify({
        userId: data.assigned_to,
        type: 'task_assigned',
        title: `مهمة جديدة مرتبطة بمشروع (${project.name})`,
        body: data.title,
        relatedEntityType: 'task',
        relatedEntityId: taskId,
      }).catch((err) => console.error('Notification error:', err));
    }

    return taskId;
  }

  /**
   * تسجيل مستند/مرفق جديد في المشروع
   */
  static async addProjectFile(projectId, user, { stage, file_name, file_url, file_size, mime_type }) {
    const [fileId] = await db('project_files').insert({
      project_id: projectId,
      stage: stage || 'general',
      file_name,
      file_url,
      file_size: file_size || 0,
      mime_type: mime_type || null,
      uploaded_by: user.id,
      created_at: new Date(),
    });

    return fileId;
  }
}
