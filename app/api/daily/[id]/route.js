import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE /api/daily/:id  → ลบงานประจำวัน (และประวัติของงานนั้น)
export async function DELETE(request, { params }) {
  await sql`delete from daily_tasks where id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
