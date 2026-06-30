import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/daily?date=YYYY-MM-DD&wd=1..7  → งานประจำวันของวันนั้น พร้อมสถานะว่าทำแล้วหรือยัง
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const wd = searchParams.get('wd');

  const rows = await sql`
    select d.id, d.label, d.weekdays,
      exists(
        select 1 from daily_completions c
        where c.daily_task_id = d.id and c.done_on = ${date}
      ) as done
    from daily_tasks d
    where d.active = true
    order by d.sort_order, d.id`;

  const filtered = wd
    ? rows.filter((r) => r.weekdays.split(',').includes(String(wd)))
    : rows;

  return NextResponse.json(filtered);
}

// POST /api/daily  { label, weekdays? }  → เพิ่มงานประจำวันใหม่
export async function POST(request) {
  const { label, weekdays } = await request.json();
  if (!label || !label.trim()) {
    return NextResponse.json({ error: 'ต้องระบุชื่องาน' }, { status: 400 });
  }
  const [{ max }] = await sql`select coalesce(max(sort_order), 0) as max from daily_tasks`;
  const [row] = await sql`
    insert into daily_tasks (label, sort_order, weekdays)
    values (${label.trim()}, ${max + 10}, ${weekdays || '1,2,3,4,5'})
    returning id, label, weekdays`;
  return NextResponse.json({ ...row, done: false });
}
