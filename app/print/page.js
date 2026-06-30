'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const TH_DOW = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์'];

const PRINT_CSS = `
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; }
  }
  @page { size: A4 portrait; margin: 15mm 18mm; }
`;

function pctColor(pct) {
  if (pct >= 80) return '#0f766e';
  if (pct >= 50) return '#d97706';
  return '#dc2626';
}

function ReportContent() {
  const params = useSearchParams();
  const month = params.get('month') || new Date().toISOString().slice(0, 7);
  const school = params.get('school') || '';
  const admin = params.get('admin') || '';

  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/report?month=${month}`)
      .then((r) => r.json())
      .then(setData);
  }, [month]);

  if (!data) return <p style={{ padding: 40 }}>กำลังโหลดข้อมูล...</p>;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px 28px', fontSize: 14, lineHeight: 1.6 }}>

      {/* ปุ่มพิมพ์ */}
      <div className="no-print" style={{ textAlign: 'right', marginBottom: 20 }}>
        <button
          onClick={() => window.print()}
          style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 28px', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}
        >🖨️&nbsp; พิมพ์ / บันทึก PDF</button>
      </div>

      {/* หัวรายงาน */}
      <div style={{ textAlign: 'center', borderBottom: '2.5px solid #0f766e', paddingBottom: 14, marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#5b6b66', letterSpacing: 1 }}>รายงานงานธุรการโรงเรียน</div>
        <h1 style={{ margin: '4px 0', fontSize: 20, fontWeight: 700, color: '#0b5a54' }}>
          ประจำเดือน {data.monthLabel}
        </h1>
        {school && <div style={{ marginTop: 4, fontSize: 13 }}>โรงเรียน: <strong>{school}</strong></div>}
        {admin && <div style={{ fontSize: 13 }}>ผู้รายงาน: <strong>{admin}</strong></div>}
      </div>

      {/* แต่ละสัปดาห์ */}
      {data.weeks.map((week) => (
        <div key={week.weekKey} style={{ marginBottom: 28, pageBreakInside: 'avoid' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 4, height: 18, background: '#0f766e', borderRadius: 2, flexShrink: 0 }} />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0b5a54' }}>
              สัปดาห์ที่ {week.weekNo}: {week.weekLabel}
            </h2>
            {week.weekPct !== null && (
              <span style={{ fontSize: 13, color: pctColor(week.weekPct), fontWeight: 600 }}>
                เฉลี่ย {week.weekPct}%
              </span>
            )}
          </div>

          {/* ตารางงานประจำวัน */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 10 }}>
            <thead>
              <tr style={{ background: '#e3f1ee' }}>
                <th style={th}>วัน</th>
                <th style={{ ...th, textAlign: 'center' }}>ทำแล้ว</th>
                <th style={{ ...th, textAlign: 'center' }}>ทั้งหมด</th>
                <th style={{ ...th, textAlign: 'center', width: 80 }}>%</th>
                <th style={{ ...th, width: '40%' }}>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {week.days.map((d) => (
                <tr key={d.date} style={{ opacity: d.future ? 0.35 : 1 }}>
                  <td style={td}>{TH_DOW[d.wd]} {d.d}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{d.future ? '–' : d.done}</td>
                  <td style={{ ...td, textAlign: 'center' }}>{d.future ? '–' : d.total}</td>
                  <td style={{ ...td, textAlign: 'center', fontWeight: 700, color: d.future ? '#ccc' : pctColor(d.pct) }}>
                    {d.future ? '–' : `${d.pct}%`}
                  </td>
                  <td style={td}></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* งานมอบหมายที่เสร็จ */}
          {week.doneTasks.length > 0 && (
            <div style={{ background: '#f8fbfa', border: '1px solid #e3e8e6', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#0b5a54', marginBottom: 6 }}>งานมอบหมายที่เสร็จสัปดาห์นี้</div>
              {week.doneTasks.map((t) => (
                <div key={t.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 600 }}>• {t.title}</div>
                  {t.command_note && (
                    <div style={{ marginLeft: 14, fontSize: 12, color: '#5b6b66' }}>📋 สั่งการ: {t.command_note}</div>
                  )}
                  {t.completion_note && (
                    <div style={{ marginLeft: 14, fontSize: 12, color: '#0b5a54' }}>✅ ธุรการ: {t.completion_note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* สรุปเดือน */}
      <div style={{ borderTop: '2px solid #0f766e', paddingTop: 14, marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            สรุปเดือน {data.monthLabel}&nbsp;—&nbsp;งานประจำวันเฉลี่ย&nbsp;
            <span style={{ color: '#0f766e', fontSize: 20 }}>
              {data.monthAvg !== null ? `${data.monthAvg}%` : '–'}
            </span>
          </span>
          <span style={{ fontSize: 11, color: '#9aa8a3' }}>
            พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
        {(school || admin) && (
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', fontSize: 13 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #333', paddingTop: 4, width: 180 }}>
                {admin || 'ผู้รายงาน'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const th = { border: '1px solid #d1d9d6', padding: '7px 10px', fontWeight: 600, textAlign: 'left' };
const td = { border: '1px solid #d1d9d6', padding: '6px 10px' };

export default function PrintPage() {
  return (
    <>
      <style>{PRINT_CSS}</style>
      <Suspense fallback={<p style={{ padding: 40 }}>กำลังโหลด...</p>}>
        <ReportContent />
      </Suspense>
    </>
  );
}
