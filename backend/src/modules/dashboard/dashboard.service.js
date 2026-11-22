// src/modules/dashboard/dashboard.service.js
import db from '../../config/database.js';

export class DashboardService {
  /**
   * لوحة المدير التنفيذي
   * جميع الأرقام تأتي مباشرة من API وقاعدة البيانات
   */
  static async getExecutiveStats() {
    const today = new Date().toISOString().split('T')[0];

    // إجمالي الموظفين النشطين
    const [{ employeeCount }] = await db('users')
      .where({ is_active: 1 })
      .whereNull('deleted_at')
      .count('id as employeeCount');

    // إجمالي المهام وحالاتها
    const [taskStats] = await db('tasks')
      .whereNull('deleted_at')
      .select(
        db.raw('COUNT(id) as totalTasks'),
        db.raw("SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as completedTasks"),
        db.raw("SUM(CASE WHEN status != 'approved' AND status != 'cancelled' AND due_date < ? THEN 1 ELSE 0 END) as overdueTasks", [today]),
        db.raw("SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as inReviewTasks")
      );

    // الخطط بانتظار الاعتماد
    const [{ pendingPlans }] = await db('plans')
      .where({ status: 'under_review' })
      .whereNull('deleted_at')
      .count('id as pendingPlans');

    // التقارير بانتظار الاعتماد
    const [{ pendingReports }] = await db('reports')
      .where({ status: 'under_review' })
      .whereNull('deleted_at')
      .count('id as pendingReports');

    // إحصائيات الأقسام
    const departments = await db('departments as d')
      .leftJoin('users as u', 'd.manager_id', 'u.id')
      .where({ 'd.is_active': 1 })
      .select('d.id', 'd.name', 'd.slug', 'u.name as manager_name');

    const deptStats = [];
    for (const d of departments) {
      const [stats] = await db('tasks')
        .where({ department_id: d.id })
        .whereNull('deleted_at')
        .select(
          db.raw('COUNT(id) as totalTasks'),
          db.raw("SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as completedTasks"),
          db.raw('AVG(completion_rate) as avgCompletion')
        );

      const [{ members }] = await db('users')
        .where({ department_id: d.id, is_active: 1 })
        .whereNull('deleted_at')
        .count('id as members');

      deptStats.push({
        id: d.id,
        name: d.name,
        managerName: d.manager_name || 'بدون مدير معين (إشراف تنفيذي)',
        memberCount: Number(members),
        totalTasks: Number(stats?.totalTasks || 0),
        completedTasks: Number(stats?.completedTasks || 0),
        avgCompletion: Math.round(Number(stats?.avgCompletion || 0)),
      });
    }

    // آخر 10 نشاطات
    const recentActivities = await db('activity_logs as a')
      .leftJoin('users as u', 'a.user_id', 'u.id')
      .select('a.*', 'u.name as user_name')
      .orderBy('a.created_at', 'desc')
      .limit(10);

    return {
      cards: {
        totalEmployees: Number(employeeCount),
        totalTasks: Number(taskStats?.totalTasks || 0),
        completedTasks: Number(taskStats?.completedTasks || 0),
        overdueTasks: Number(taskStats?.overdueTasks || 0),
        pendingPlans: Number(pendingPlans),
        pendingReports: Number(pendingReports),
      },
      departments: deptStats,
      recentActivities,
    };
  }

  /**
   * لوحة الموظف
   */
  static async getEmployeeStats(userId) {
    const today = new Date().toISOString().split('T')[0];

    // مهامي
    const [taskStats] = await db('tasks')
      .where({ assigned_to: userId })
      .whereNull('deleted_at')
      .select(
        db.raw('COUNT(id) as totalTasks'),
        db.raw("SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as completedTasks"),
        db.raw("SUM(CASE WHEN due_date = ? THEN 1 ELSE 0 END) as todayTasks", [today]),
        db.raw("SUM(CASE WHEN status != 'approved' AND status != 'cancelled' AND due_date < ? THEN 1 ELSE 0 END) as overdueTasks", [today])
      );

    // مهام اليوم
    const todayTasksList = await db('tasks')
      .where({ assigned_to: userId })
      .whereNull('deleted_at')
      .where((b) => {
        b.where('due_date', today).orWhere('status', 'in_progress');
      })
      .select('id', 'title', 'priority', 'status', 'completion_rate', 'due_date')
      .limit(5);

    // أحدث خطة حالية
    const activePlan = await db('plans')
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .orderBy('period_start', 'desc')
      .first();

    // أحدث تقرير
    const latestReport = await db('reports')
      .where({ user_id: userId })
      .whereNull('deleted_at')
      .orderBy('period_start', 'desc')
      .first();

    // عدد الإشعارات غير المقروءة
    const [{ unreadNotifications }] = await db('notifications')
      .where({ user_id: userId, is_read: 0 })
      .count('id as unreadNotifications');

    return {
      cards: {
        myTasks: Number(taskStats?.totalTasks || 0),
        todayTasks: Number(taskStats?.todayTasks || 0),
        completedTasks: Number(taskStats?.completedTasks || 0),
        overdueTasks: Number(taskStats?.overdueTasks || 0),
        unreadNotifications: Number(unreadNotifications),
      },
      todayTasks: todayTasksList,
      activePlan: activePlan || null,
      latestReport: latestReport || null,
    };
  }
}
