import dayjs from 'dayjs';

/**
 * تحسين عرض التاريخ وإزالة صيغ ISO مثل 2026-12-12T00:00:00.000Z
 * يعرض إما بصيغة قياسية نظيفة (YYYY-MM-DD) أو بصيغة عربية كاملة (12 ديسمبر 2026)
 */
export function formatDate(
  dateStr?: string | Date | null,
  format: 'standard' | 'readable' = 'standard'
): string {
  if (!dateStr) return '—';

  let cleanStr = String(dateStr).trim();
  // إزالة جزء الوقت في حال وجود T00:00:00.000Z لتفادي أخطاء فروق التوقيت
  if (cleanStr.includes('T')) {
    cleanStr = cleanStr.split('T')[0];
  }

  const d = dayjs(cleanStr);
  if (!d.isValid()) return String(dateStr);

  if (format === 'readable') {
    const arabicMonths = [
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'مايو',
      'يونيو',
      'يوليو',
      'أغسطس',
      'سبتمبر',
      'أكتوبر',
      'نوفمبر',
      'ديسمبر',
    ];
    return `${d.date()} ${arabicMonths[d.month()]} ${d.year()}`;
  }

  return d.format('YYYY-MM-DD');
}

/**
 * تنسيق التاريخ والوقت (مثل: 2026-12-12 08:30 م)
 */
export function formatDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '—';
  const d = dayjs(dateStr);
  if (!d.isValid()) return String(dateStr);

  return d
    .format('YYYY-MM-DD hh:mm A')
    .replace('AM', 'ص')
    .replace('PM', 'م');
}
