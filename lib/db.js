import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL ยังไม่ได้ตั้งค่า — ตั้งใน .env.local หรือใน Vercel Environment Variables');
}

export const sql = neon(process.env.DATABASE_URL);
