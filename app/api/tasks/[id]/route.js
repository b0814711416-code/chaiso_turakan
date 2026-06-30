import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/tasks/:id  { done?, urgent? }
export async function PATCH(request, { params }) {
  const id = params.id;
  const body = await request.json();

  if (typeof body.done === 'boolean') {
    await sql`
      update tasks
      set done = ${body.done}, done_at = ${body.done ? new Date() : null}
      where id = ${id}`;
  }
  if (typeof body.urgent === 'boolean') {
    await sql`update tasks set urgent = ${body.urgent} where id = ${id}`;
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/tasks/:id
export async function DELETE(request, { params }) {
  await sql`delete from tasks where id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
