// src/modules/approvals/approvals.service.js
import db from '../../config/database.js';

export class ApprovalsService {
  /**
   * جلب جميع عناصر الاعتماد المعلقة الموجهة لهذا المستخدم
   */
  static async getPendingApprovals(user) {
    let query = db('approval_steps as a')
      .leftJoin('users as u', 'a.approver_id', 'u.id')
      .where('a.status', 'pending');

    if (!user.isExecutive) {
      query = query.where('a.approver_id', user.id);
    }

    const steps = await query
      .select('a.*', 'u.name as approver_name')
      .orderBy('a.created_at', 'desc');

    // تجميع المعرفات
    const planIds = steps.filter((s) => s.entity_type === 'plan').map((s) => s.entity_id);
    const reportIds = steps.filter((s) => s.entity_type === 'report').map((s) => s.entity_id);

    const plans = planIds.length > 0
      ? await db('plans as p')
          .leftJoin('users as u', 'p.user_id', 'u.id')
          .leftJoin('departments as d', 'p.department_id', 'd.id')
          .whereIn('p.id', planIds)
          .select('p.id', 'p.title', 'p.type', 'p.period_start', 'p.period_end', 'p.status', 'u.name as creator_name', 'd.name as department_name')
      : [];

    const reports = reportIds.length > 0
      ? await db('reports as r')
          .leftJoin('users as u', 'r.user_id', 'u.id')
          .leftJoin('departments as d', 'r.department_id', 'd.id')
          .whereIn('r.id', reportIds)
          .select('r.id', 'r.title', 'r.type', 'r.period_start', 'r.period_end', 'r.status', 'u.name as creator_name', 'd.name as department_name')
      : [];

    const planMap = Object.fromEntries(plans.map((p) => [p.id, p]));
    const reportMap = Object.fromEntries(reports.map((r) => [r.id, r]));

    return steps.map((s) => ({
      ...s,
      entity_details: s.entity_type === 'plan' ? planMap[s.entity_id] : reportMap[s.entity_id],
    }));
  }

  /**
   * جلب سجل قرارات الاعتماد السابقة
   */
  static async getApprovalHistory(user, { page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    let query = db('approval_steps as a')
      .leftJoin('users as u', 'a.approver_id', 'u.id')
      .whereNot('a.status', 'pending');

    if (!user.isExecutive) {
      query = query.where('a.approver_id', user.id);
    }

    const [{ total }] = await query.clone().count('a.id as total');

    const steps = await query
      .select('a.*', 'u.name as approver_name')
      .orderBy('a.acted_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      items: steps,
      pagination: {
        total: Number(total),
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(Number(total) / limit),
      },
    };
  }
}
