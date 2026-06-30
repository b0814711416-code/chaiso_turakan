import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// สร้างรายการวันที่ย้อนหลัง n วัน ตามเวลาประเทศไทย (วันนี้อยู่บนสุด)
function dateList(n) {
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const [y, m, d] = todayStr.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d, 12);
  const out = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(base - i * 86400000);
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    const jsDay = dt.getUTCDay(); // 0=อา..6=ส
    const wd = jsDay === 0 ? 7 : jsDay; // 1=จ..7=อา
    out.push({ date: `${yy}-${mm}-${dd}`, wd });
  }
  return out;
}

// GET /api/history  → เปอร์เซ็นต์งานประจำวันที่ทำได้ ย้อนหลัง 14 วัน
export async function GET() {
  const days = dateList(14);
  const tasks = await sql`select weekdays from daily_tasks where active = true`;
  const first = days[days.length - 1].date;
  const last = days[0].date;

  const comps = await sql`
    select done_on::text as d, count(*)::int as cnt
    from daily_completions
    where done_on between ${first} and ${last}
    group by done_on`;

  const cntByDate = {};
  comps.forEach((c) => { cntByDate[c.d] = c.cnt; });

  const result = days.map(({ date, wd }) => {
    const total = tasks.filter((t) => t.weekdays.split(',').includes(String(wd))).length;
    const done = cntByDate[date] || 0;
    const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
    return { date, wd, done, total, pct };
  });

  return NextResponse.json(result);
}
