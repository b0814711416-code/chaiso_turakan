import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/daily/:id  { label?, sortOrder? }  → แก้ไขชื่อหรือลำดับงาน
export async function PATCH(request, { params }) {
  const { label, sortOrder } = await request.json();
  if (label !== undefined) {
    await sql`update daily_tasks set label = ${label} where id = ${params.id}`;
  }
  if (sortOrder !== undefined) {
    await sql`update daily_tasks set sort_order = ${sortOrder} where id = ${params.id}`;
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/daily/:id  → ลบงานประจำวัน (และประวัติของงานนั้น)
export async function DELETE(request, { params }) {
  await sql`delete from daily_tasks where id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
