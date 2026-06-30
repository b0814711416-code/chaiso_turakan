# แอปติดตามงานธุรการโรงเรียน

แอปติดตามงานที่มอบหมายสำหรับเจ้าหน้าที่ธุรการ (ใช้คนเดียว) แบ่งเป็น
**งานวันนี้** (งานประจำที่รีเซ็ตทุกวันและเก็บประวัติให้เอง),
**งานครั้งคราว** (มีวันครบกำหนด/ติดธงด่วน) และ **ประวัติ** (กราฟ % ย้อนหลัง 14 วัน)

สแต็ก: **Next.js** · **Neon** (Postgres) · **Vercel**

---

## ใช้งานในเครื่องตัวเอง

1. ติดตั้ง Node.js เวอร์ชัน 18 ขึ้นไป
2. เปิดเทอร์มินัลในโฟลเดอร์นี้แล้วรัน
   ```bash
   npm install
   ```
3. สร้างไฟล์ `.env.local` (ดูตัวอย่างจาก `.env.example`) ใส่ค่า `DATABASE_URL` จาก Neon
4. รัน
   ```bash
   npm run dev
   ```
   เปิด http://localhost:3000

---

## ขั้นตอน deploy จริง (GitHub → Neon → Vercel)

### 1) ฐานข้อมูล Neon
1. สมัคร/เข้าสู่ระบบที่ https://neon.tech แล้วสร้าง project ใหม่
2. เข้าเมนู **SQL Editor** วางเนื้อหาทั้งหมดจากไฟล์ `schema.sql` แล้วกด **Run** หนึ่งครั้ง
   (สร้างตารางและใส่งานประจำตัวอย่างให้)
3. เข้าเมนู **Connection Details** คัดลอก connection string (ขึ้นต้นด้วย `postgresql://...`) เก็บไว้

### 2) โค้ดขึ้น GitHub
```bash
git init
git add .
git commit -m "init school task tracker"
git branch -M main
git remote add origin https://github.com/<ชื่อคุณ>/school-tasks.git
git push -u origin main
```

### 3) Deploy บน Vercel
1. เข้า https://vercel.com เลือก **Add New → Project** แล้ว import repo จาก GitHub
2. ที่หน้า Configure เพิ่ม **Environment Variable**
   - Name: `DATABASE_URL`
   - Value: connection string จาก Neon (ขั้นตอน 1.3)
3. กด **Deploy** — รอสักครู่จะได้ลิงก์แอปใช้งานได้ทันทีบนมือถือ

> เพิ่มแอปลงหน้าจอมือถือได้: เปิดลิงก์ในเบราว์เซอร์ → เมนูแชร์ → “เพิ่มไปยังหน้าจอโฮม”

---

## โครงสร้างไฟล์

```
app/
  layout.js              ตั้งค่าฟอนต์ไทย + meta
  page.js                หน้าแรก
  App.jsx                หน้าตาแอปทั้งหมด (3 แท็บ)
  globals.css            สไตล์
  api/
    daily/route.js       งานประจำวัน (ดึง/เพิ่ม)
    daily/toggle/route.js  ติ๊กว่าทำแล้ว
    daily/[id]/route.js  ลบงานประจำ
    tasks/route.js       งานครั้งคราว (ดึง/เพิ่ม)
    tasks/[id]/route.js  แก้/ลบ
    history/route.js     สรุป % ย้อนหลัง
lib/db.js                เชื่อมต่อ Neon
schema.sql               โครงสร้างฐานข้อมูล
```

---

## ไอเดียต่อยอด

- แจ้งเตือน push ตอนเช้าและก่อนงานครบกำหนด (ใช้ Web Push หรือ LINE Notify)
- แนบรูปถ่ายเป็นหลักฐานงานเสร็จ (Vercel Blob)
- ใส่รหัสผ่านล็อกอินถ้าต้องการกันคนอื่นเปิด
- ตั้งงานประจำเฉพาะบางวัน (โครงสร้าง `weekdays` รองรับอยู่แล้ว — ปรับ UI เพิ่มได้)
