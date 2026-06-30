import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/tasks  → งานครั้งคราว (ด่วนขึ้นก่อน, ใกล้ครบกำหนดขึ้นก่อน, ที่เสร็จแล้วลงล่าง)
export async function GET() {
  const rows = await sql`
    select * from (
      select id, title, due_date::text as due_date, urgent, done, command_note, completion_note, created_at
      from tasks
      order by created_at desc
      limit 20
    ) t
    order by done asc, urgent desc, due_date asc nulls last, created_at asc`;
  return NextResponse.json(rows);
}

// POST /api/tasks  { title, dueDate?, urgent? }
export async function POST(request) {
  const { title, dueDate, urgent } = await request.json();
  if (!title || !title.trim()) {
    return NextResponse.json({ error: 'ต้องระบุชื่องาน' }, { status: 400 });
  }
  const [row] = await sql`
    insert into tasks (title, due_date, urgent)
    values (${title.trim()}, ${dueDate || null}, ${!!urgent})
    returning id, title, due_date::text as due_date, urgent, done, command_note, completion_note, created_at`;
  return NextResponse.json(row);
}
