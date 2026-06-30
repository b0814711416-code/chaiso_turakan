import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/daily/toggle  { taskId, date, done }
export async function POST(request) {
  const { taskId, date, done } = await request.json();
  if (!taskId || !date) {
    return NextResponse.json({ error: 'ต้องระบุ taskId และ date' }, { status: 400 });
  }
  if (done) {
    await sql`
      insert into daily_completions (daily_task_id, done_on)
      values (${taskId}, ${date})
      on conflict (daily_task_id, done_on) do nothing`;
  } else {
    await sql`
      delete from daily_completions
      where daily_task_id = ${taskId} and done_on = ${date}`;
  }
  return NextResponse.json({ ok: true });
}
