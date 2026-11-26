// src/modules/tasks/tasks-excel.service.js
import ExcelJS from 'exceljs';
import db from '../../config/database.js';
import { NotificationService } from '../notifications/notifications.service.js';

export class TasksExcelService {
  /**
   * إنشاء ملف نموذج إكسل الفارغ مع دليل الموظفين
   */
  static async generateTemplateWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Pasmh Work Management System (BWMS)';
    workbook.created = new Date();

    // 1. ورقة عمل إدخال المهام
    const taskSheet = workbook.addWorksheet('إدخال المهام', {
      views: [{ rightToLeft: true }],
      properties: { defaultRowHeight: 24 },
    });

    taskSheet.columns = [
      { header: 'رقم الموظف *', key: 'employee_id', width: 16 },
      { header: 'اسم الموظف (للتوضيح)', key: 'employee_name', width: 28 },
      { header: 'عنوان المهمة *', key: 'title', width: 36 },
      { header: 'وصف المهمة وملاحظاتها', key: 'description', width: 45 },
      { header: 'تاريخ التسليم (YYYY-MM-DD) *', key: 'due_date', width: 28 },
      { header: 'الأهمية (منخفضة / متوسطة / عالية / طارئة)', key: 'priority', width: 32 },
    ];

    // تنسيق صف العناوين الرئيسي (Header)
    const headerRow = taskSheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF173F45' }, // Institutional Dark Teal
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'medium', color: { argb: 'FF258579' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // صفوف إرشادية وتوضيحية نموذجية
    const sampleRows = [
      {
        employee_id: 2,
        employee_name: 'منير منصور حسن الوريش',
        title: 'مراجعة قيود التسوية المالية للشهر الحالي',
        description: 'التأكد من مطابقة السندات وكشوف الحسابات البنكية وإعداد ميزان المراجعة',
        due_date: '2026-12-10',
        priority: 'عالية',
      },
      {
        employee_id: 4,
        employee_name: 'عمار ناجي المرحمي',
        title: 'رفع التقرير الميداني لمشروع الإغاثة العاجلة',
        description: 'حصر أعداد المستفيدين وتوثيق مراحل التوزيع بالصور والإحصائيات',
        due_date: '2026-12-15',
        priority: 'متوسطة',
      },
    ];

    sampleRows.forEach((item) => {
      const row = taskSheet.addRow(item);
      row.alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });
    });

    // 2. ورقة عمل دليل الموظفين
    const guideSheet = workbook.addWorksheet('دليل أرقام الموظفين', {
      views: [{ rightToLeft: true }],
      properties: { defaultRowHeight: 24 },
    });

    guideSheet.columns = [
      { header: 'رقم الموظف (ID)', key: 'id', width: 18 },
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'القسم', key: 'department_name', width: 24 },
      { header: 'الدور الوظيفي', key: 'role_name', width: 24 },
      { header: 'البريد الإلكتروني', key: 'email', width: 32 },
    ];

    const guideHeaderRow = guideSheet.getRow(1);
    guideHeaderRow.height = 32;
    guideHeaderRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF258579' }, // Teal
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'medium', color: { argb: 'FF173F45' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      };
    });

    // جلب الموظفين الفعليين النشطين من قاعدة البيانات
    const employees = await db('users as u')
      .leftJoin('departments as d', 'u.department_id', 'd.id')
      .leftJoin('user_roles as ur', 'u.id', 'ur.user_id')
      .leftJoin('roles as r', 'ur.role_id', 'r.id')
      .where('u.is_active', 1)
      .whereNull('u.deleted_at')
      .select(
        'u.id',
        'u.name',
        'u.email',
        'd.name as department_name',
        'r.display_name as role_name'
      )
      .orderBy('u.id', 'asc');

    employees.forEach((emp) => {
      const row = guideSheet.addRow({
        id: emp.id,
        name: emp.name,
        department_name: emp.department_name || 'الإدارة العامة',
        role_name: emp.role_name || 'موظف',
        email: emp.email,
      });
      row.alignment = { vertical: 'middle', horizontal: 'right' };
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      });
    });

    return workbook;
  }

  /**
   * استيراد وتحليل ملف إكسل وإنشاء المهام
   */
  static async importTasksFromExcel(user, buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // اختيار ورقة عمل إدخال المهام أو الأولى
    const worksheet = workbook.getWorksheet('إدخال المهام') || workbook.worksheets[0];
    if (!worksheet) {
      const error = new Error('ملف الإكسل لا يحتوي على أوراق عمل صالحة');
      error.statusCode = 400;
      throw error;
    }

    // جلب المستخدمين النشطين
    const activeUsers = await db('users')
      .where('is_active', 1)
      .whereNull('deleted_at')
      .select('id', 'name', 'department_id');
    const userMap = new Map(activeUsers.map((u) => [Number(u.id), u]));

    const validRows = [];
    const errors = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // تخطي رأس الجدول

      let empIdRaw = row.getCell(1).value;
      if (empIdRaw && typeof empIdRaw === 'object' && empIdRaw.result !== undefined) {
        empIdRaw = empIdRaw.result;
      }
      const employeeId = empIdRaw !== null && empIdRaw !== undefined ? Number(empIdRaw) : null;

      let titleRaw = row.getCell(3).value;
      if (titleRaw && typeof titleRaw === 'object') {
        titleRaw = titleRaw.text || titleRaw.result || '';
      }
      const title = titleRaw ? String(titleRaw).trim() : '';

      let descRaw = row.getCell(4).value;
      if (descRaw && typeof descRaw === 'object') {
        descRaw = descRaw.text || descRaw.result || '';
      }
      const description = descRaw ? String(descRaw).trim() : null;

      let dueRaw = row.getCell(5).value;
      let formattedDueDate = null;
      if (dueRaw instanceof Date) {
        formattedDueDate = dueRaw.toISOString().split('T')[0];
      } else if (typeof dueRaw === 'string') {
        const str = dueRaw.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          formattedDueDate = str;
        } else {
          const parsed = new Date(str);
          if (!isNaN(parsed.getTime())) {
            formattedDueDate = parsed.toISOString().split('T')[0];
          }
        }
      } else if (typeof dueRaw === 'number') {
        // Excel serial date to JS Date (base date: Dec 30, 1899)
        const dateObj = new Date(Math.round((dueRaw - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) {
          formattedDueDate = dateObj.toISOString().split('T')[0];
        }
      }

      let priorityRaw = row.getCell(6).value;
      if (priorityRaw && typeof priorityRaw === 'object') {
        priorityRaw = priorityRaw.text || priorityRaw.result || '';
      }
      const priorityStr = priorityRaw ? String(priorityRaw).trim().toLowerCase() : '';
      let priority = 'medium';
      if (priorityStr.includes('منخفض') || priorityStr === 'low') {
        priority = 'low';
      } else if (priorityStr.includes('عالي') || priorityStr.includes('عالية') || priorityStr === 'high') {
        priority = 'high';
      } else if (
        priorityStr.includes('حرج') ||
        priorityStr.includes('حرجة') ||
        priorityStr.includes('طارئ') ||
        priorityStr.includes('عاجل') ||
        priorityStr === 'urgent'
      ) {
        priority = 'urgent';
      }

      // إذا كان الصف فارغاً بالكامل، نتخطاه دون احتسابه كخطأ
      if (!employeeId && !title && !dueRaw) {
        return;
      }

      // التحقق من الحقول
      if (!employeeId || isNaN(employeeId)) {
        errors.push({ row: rowNumber, reason: 'رقم الموظف غير محدد أو غير صالح' });
        return;
      }

      const targetUser = userMap.get(employeeId);
      if (!targetUser) {
        errors.push({
          row: rowNumber,
          reason: `رقم الموظف (${employeeId}) غير موجود أو غير نشط في النظام`,
        });
        return;
      }

      if (!title) {
        errors.push({ row: rowNumber, reason: 'عنوان المهمة مطلوب' });
        return;
      }

      if (!formattedDueDate) {
        errors.push({
          row: rowNumber,
          reason: 'تاريخ التسليم غير صالح (يجب أن يكون بصيغة YYYY-MM-DD)',
        });
        return;
      }

      validRows.push({
        rowNumber,
        employee_id: targetUser.id,
        employee_name: targetUser.name,
        department_id: targetUser.department_id,
        title,
        description,
        due_date: formattedDueDate,
        priority,
      });
    });

    if (validRows.length === 0 && errors.length === 0) {
      const error = new Error('ملف الإكسل فارغ، يرجى تعبئة المهام أولاً');
      error.statusCode = 400;
      throw error;
    }

    // إدراج المهام
    const createdTasks = [];
    if (validRows.length > 0) {
      await db.transaction(async (trx) => {
        for (const item of validRows) {
          const [taskId] = await trx('tasks').insert({
            title: item.title,
            description: item.description,
            created_by: user.id,
            assigned_to: item.employee_id,
            department_id: item.department_id,
            priority: item.priority,
            status: 'pending',
            completion_rate: 0,
            due_date: item.due_date,
            created_at: new Date(),
            updated_at: new Date(),
          });

          await trx('task_history').insert({
            task_id: taskId,
            changed_by: user.id,
            field_name: 'created',
            old_value: null,
            new_value: 'تم إنشاء المهمة عبر استيراد إكسل',
            change_reason: 'استيراد جماعي من قبل المدير التنفيذي',
          });

          createdTasks.push({
            id: taskId,
            title: item.title,
            assigned_to: item.employee_id,
            assigned_name: item.employee_name,
          });
        }
      });

      // إرسال الإشعارات
      for (const t of createdTasks) {
        NotificationService.notify({
          userId: t.assigned_to,
          type: 'task_assigned',
          title: 'مهمة جديدة مسندة إليك',
          body: `قام ${user.name} بإسناد مهمة جديدة إليك: "${t.title}"`,
          relatedEntityType: 'task',
          relatedEntityId: t.id,
        }).catch((err) => console.error('Notification dispatch error:', err));
      }
    }

    return {
      totalRows: validRows.length + errors.length,
      importedCount: validRows.length,
      failedCount: errors.length,
      errors,
      createdTasks,
    };
  }
}
