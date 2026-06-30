import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

function weekDays() {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const [y, m, d] = todayStr.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d, 12);
  const jsDay = new Date(base).getUTCDay();
  const wd = jsDay === 0 ? 7 : jsDay;
  const mondayOffset = -(wd - 1);
  const days = [];
  for (let i = 0; i < 5; i++) {
    const dt = new Date(base + (mondayOffset + i) * 86400000);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    const jsD = dt.getUTCDay();
    days.push({ date: `${yy}-${mm}-${dd}`, wd: jsD === 0 ? 7 : jsD });
  }
  return { days, today: todayStr };
}

// GET /api/weekly  → สรุปสัปดาห์ปัจจุบัน (จ-ศ) + งานมอบหมายที่เสร็จสัปดาห์นี้
export async function GET() {
  const { days, today } = weekDays();
  const first = days[0].date;
  const last = days[4].date;

  const dailyTasks = await sql`select weekdays from daily_tasks where active = true`;

  const comps = await sql`
    select done_on::text as d, count(*)::int as cnt
    from daily_completions
    where done_on between ${first} and ${last}
    group by done_on`;

  const cntByDate = Object.fromEntries(comps.map((c) => [c.d, c.cnt]));

  const dayStats = days.map(({ date, wd }) => {
    const total = dailyTasks.filter((t) => t.weekdays.split(',').includes(String(wd))).length;
    const done = cntByDate[date] || 0;
    const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
    return { date, wd, done, total, pct, future: date > today };
  });

  const doneTasks = await sql`
    select id, title, done_at::text as done_at
    from tasks
    where done = true and done_at::date between ${first} and ${last}
    order by done_at desc`;

  return NextResponse.json({ days: dayStats, doneTasks });
}
