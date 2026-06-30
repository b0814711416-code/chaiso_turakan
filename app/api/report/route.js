import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

const TH_MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_MONTH_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function pad(n) { return String(n).padStart(2, '0'); }

function weekdaysInMonth(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const days = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(year, month - 1, d));
    const jsDay = dt.getUTCDay();
    if (jsDay < 1 || jsDay > 5) continue;
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    const monDt = new Date(dt);
    monDt.setUTCDate(d - (jsDay - 1));
    const weekKey = `${monDt.getUTCFullYear()}-${pad(monDt.getUTCMonth() + 1)}-${pad(monDt.getUTCDate())}`;
    days.push({ date: dateStr, wd: jsDay, d, month, weekKey });
  }
  return days;
}

// GET /api/report?month=YYYY-MM
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const param = searchParams.get('month');
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const [ty, tm] = todayStr.split('-').map(Number);
  const [year, month] = param ? param.split('-').map(Number) : [ty, tm];

  const allDays = weekdaysInMonth(year, month);
  if (!allDays.length) return NextResponse.json({ weeks: [], monthAvg: null });

  const first = allDays[0].date;
  const last = allDays[allDays.length - 1].date;

  const [dailyTasks, comps, doneTasks] = await Promise.all([
    sql`select weekdays from daily_tasks where active = true`,
    sql`select done_on::text as d, count(*)::int as cnt from daily_completions
        where done_on between ${first} and ${last} group by done_on`,
    sql`select id, title, command_note, completion_note,
          done_at::date::text as done_date
        from tasks
        where done = true and done_at::date between ${first} and ${last}
        order by done_at`,
  ]);

  const cntByDate = Object.fromEntries(comps.map((c) => [c.d, c.cnt]));

  const weekMap = {};
  for (const { date, wd, d, month: m, weekKey } of allDays) {
    if (!weekMap[weekKey]) weekMap[weekKey] = { weekKey, days: [], doneTasks: [] };
    const total = dailyTasks.filter((t) => t.weekdays.split(',').includes(String(wd))).length;
    const done = cntByDate[date] || 0;
    const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
    weekMap[weekKey].days.push({ date, wd, d, m, done, total, pct, future: date > todayStr });
  }

  for (const task of doneTasks) {
    if (!task.done_date) continue;
    const [dy, dm, dd] = task.done_date.split('-').map(Number);
    const dt = new Date(Date.UTC(dy, dm - 1, dd));
    const jsDay = dt.getUTCDay();
    const mon = new Date(dt);
    mon.setUTCDate(dd - (jsDay === 0 ? 6 : jsDay - 1));
    const wk = `${mon.getUTCFullYear()}-${pad(mon.getUTCMonth() + 1)}-${pad(mon.getUTCDate())}`;
    if (weekMap[wk]) weekMap[wk].doneTasks.push(task);
  }

  const weeks = Object.values(weekMap).map((w, i) => {
    const valid = w.days.filter((d) => !d.future && d.total > 0);
    const weekPct = valid.length ? Math.round(valid.reduce((s, d) => s + d.pct, 0) / valid.length) : null;
    const f = w.days[0];
    const l = w.days[w.days.length - 1];
    const weekLabel = f.d === l.d
      ? `${f.d} ${TH_MONTH_SHORT[f.m - 1]}`
      : `${f.d}–${l.d} ${TH_MONTH_SHORT[f.m - 1]}`;
    return { ...w, weekPct, weekLabel, weekNo: i + 1 };
  });

  const validWeeks = weeks.filter((w) => w.weekPct !== null);
  const monthAvg = validWeeks.length
    ? Math.round(validWeeks.reduce((s, w) => s + w.weekPct, 0) / validWeeks.length)
    : null;

  return NextResponse.json({
    month: `${year}-${pad(month)}`,
    monthLabel: `${TH_MONTH_FULL[month - 1]} ${year + 543}`,
    weeks,
    monthAvg,
  });
}
