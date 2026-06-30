-- ============================================================
-- โครงสร้างฐานข้อมูลสำหรับแอปติดตามงานธุรการ
-- วิธีใช้: เปิด Neon (neon.tech) > โปรเจกต์ของคุณ > SQL Editor
--          แล้ววางทั้งไฟล์นี้ กด Run หนึ่งครั้ง
-- ============================================================

-- งานประจำวัน (แม่แบบที่ทำซ้ำทุกวัน)
create table if not exists daily_tasks (
  id          serial primary key,
  label       text        not null,
  sort_order  int         not null default 0,
  -- วันที่ต้องทำ: 1=จันทร์ ... 7=อาทิตย์ (คั่นด้วยจุลภาค)
  weekdays    text        not null default '1,2,3,4,5',
  active      boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- บันทึกว่างานประจำวันชิ้นไหนถูกทำในวันใด (ใช้ทำประวัติย้อนหลัง)
create table if not exists daily_completions (
  id            serial primary key,
  daily_task_id int         not null references daily_tasks(id) on delete cascade,
  done_on       date        not null,
  done_at       timestamptz not null default now(),
  unique (daily_task_id, done_on)
);

-- งานมอบหมายครั้งคราว
create table if not exists tasks (
  id          serial primary key,
  title       text        not null,
  due_date    date,
  urgent      boolean     not null default false,
  done        boolean     not null default false,
  done_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- ตัวอย่างงานประจำวันเริ่มต้น (ลบหรือแก้ได้ภายหลังในแอป)
insert into daily_tasks (label, sort_order, weekdays) values
  ('เช็กและตอบหนังสือราชการเข้า', 10, '1,2,3,4,5'),
  ('ลงเวลาปฏิบัติงานบุคลากร',     20, '1,2,3,4,5'),
  ('รับ-ส่งหนังสือ/พัสดุ',         30, '1,2,3,4,5'),
  ('บันทึกข้อมูลนักเรียนมา-ขาด',   40, '1,2,3,4,5'),
  ('ตรวจความเรียบร้อยอาคาร',       50, '1,2,3,4,5'),
  ('จัดโต๊ะทำงานก่อนกลับ',         60, '1,2,3,4,5')
on conflict do nothing;
