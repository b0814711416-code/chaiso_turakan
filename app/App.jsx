'use client';

import { useEffect, useState, useCallback } from 'react';

/* ---------- helpers ---------- */
const TZ = 'Asia/Bangkok';
const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const weekdayNum = () => {
  const w = new Date().toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short' });
  const map = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[w];
};
const TH_DOW = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
const TH_DOW_SHORT = ['', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function thaiHeaderDate() {
  const s = todayStr();
  const [y, m, d] = s.split('-').map(Number);
  return `วัน${TH_DOW[weekdayNum()]} ${d} ${TH_MONTH[m - 1]}`;
}

function dueLabel(due) {
  if (!due) return null;
  const [y, m, d] = due.split('-').map(Number);
  const t = todayStr().split('-').map(Number);
  const a = Date.UTC(y, m - 1, d);
  const b = Date.UTC(t[0], t[1] - 1, t[2]);
  const diff = Math.round((a - b) / 86400000);
  const dateText = `${d} ${TH_MONTH[m - 1]}`;
  if (diff < 0) return { text: `เลยกำหนด ${dateText}`, over: true };
  if (diff === 0) return { text: 'ครบกำหนดวันนี้', over: true };
  if (diff === 1) return { text: 'ครบกำหนดพรุ่งนี้', over: false };
  return { text: `ครบกำหนดใน ${diff} วัน (${dateText})`, over: false };
}

/* ---------- tiny icons ---------- */
const Check = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
);
const IcoToday = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
);
const IcoTasks = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" /></svg>
);
const IcoHistory = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l3 3" /></svg>
);

/* ---------- ring ---------- */
function Ring({ pct }) {
  const R = 33;
  const C = 2 * Math.PI * R;
  return (
    <div className="ring-wrap">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle className="ring-bg" cx="38" cy="38" r={R} />
        <circle className="ring-fg" cx="38" cy="38" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} />
      </svg>
      <div className="ring-pct">{pct}%</div>
    </div>
  );
}

/* ---------- main ---------- */
export default function App() {
  const [tab, setTab] = useState('today');
  const [daily, setDaily] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [manage, setManage] = useState(false);

  const date = todayStr();
  const wd = weekdayNum();

  const loadDaily = useCallback(async () => {
    const r = await fetch(`/api/daily?date=${date}&wd=${wd}`);
    setDaily(await r.json());
  }, [date, wd]);
  const loadTasks = useCallback(async () => {
    const r = await fetch('/api/tasks');
    setTasks(await r.json());
  }, []);
  const loadHistory = useCallback(async () => {
    const r = await fetch('/api/history');
    setHistory(await r.json());
  }, []);

  useEffect(() => { loadDaily(); loadTasks(); loadHistory(); }, [loadDaily, loadTasks, loadHistory]);

  const doneCount = daily.filter((d) => d.done).length;
  const pct = daily.length ? Math.round((doneCount / daily.length) * 100) : 0;

  /* daily actions */
  async function toggleDaily(t) {
    const next = !t.done;
    setDaily((p) => p.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    await fetch('/api/daily/toggle', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: t.id, date, done: next }),
    });
    loadHistory();
  }
  async function addDaily(label) {
    if (!label.trim()) return;
    const r = await fetch('/api/daily', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    const row = await r.json();
    if (row.weekdays.split(',').includes(String(wd))) setDaily((p) => [...p, row]);
  }
  async function delDaily(id) {
    setDaily((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/daily/${id}`, { method: 'DELETE' });
    loadHistory();
  }

  /* task actions */
  async function addTask(payload) {
    const r = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await r.json();
    loadTasks();
  }
  async function toggleTask(t) {
    const next = !t.done;
    setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    await fetch(`/api/tasks/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: next }),
    });
    loadTasks();
  }
  async function delTask(id) {
    setTasks((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  }

  const titles = { today: 'งานวันนี้', tasks: 'งานครั้งคราว', history: 'ประวัติการทำงาน' };
  const ringPct = tab === 'history' && history.length
    ? Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length)
    : pct;

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div>
            <div className="date">{thaiHeaderDate()}</div>
            <div className="ttl">{titles[tab]}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Ring pct={ringPct} />
            <div className="ring-sub">
              {tab === 'history' ? 'เฉลี่ย 14 วัน' : `เสร็จ ${doneCount}/${daily.length}`}
            </div>
          </div>
        </div>
      </header>

      <div className="content">
        {tab === 'today' && (
          <TodayTab
            daily={daily} manage={manage} setManage={setManage}
            onToggle={toggleDaily} onAdd={addDaily} onDelete={delDaily}
          />
        )}
        {tab === 'tasks' && (
          <TasksTab tasks={tasks} onToggle={toggleTask} onAdd={addTask} onDelete={delTask} />
        )}
        {tab === 'history' && <HistoryTab history={history} />}
      </div>

      <nav className="nav">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
          <span className="ico"><IcoToday /></span>วันนี้
        </button>
        <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>
          <span className="ico"><IcoTasks /></span>งานอื่นๆ
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          <span className="ico"><IcoHistory /></span>ประวัติ
        </button>
      </nav>
    </div>
  );
}

/* ---------- Today ---------- */
function TodayTab({ daily, manage, setManage, onToggle, onAdd, onDelete }) {
  const [val, setVal] = useState('');
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="section-note">รีเซ็ตอัตโนมัติทุกวัน · บันทึกประวัติให้เอง</p>
        <button className="linkbtn" onClick={() => setManage((m) => !m)}>
          {manage ? 'เสร็จสิ้น' : 'จัดการ'}
        </button>
      </div>

      {daily.length === 0 ? (
        <div className="card"><div className="empty">วันนี้ไม่มีงานประจำ<br />กด “จัดการ” เพื่อเพิ่มงาน</div></div>
      ) : (
        <div className="card">
          {daily.map((t) => (
            <div key={t.id} className={`row ${t.done ? 'done' : ''} ${manage ? '' : 'tappable'}`}
              onClick={manage ? undefined : () => onToggle(t)}>
              {!manage && <span className="check"><Check /></span>}
              <div className="row-body"><div className="row-label">{t.label}</div></div>
              {manage && (
                <button className="del" aria-label="ลบ" onClick={() => onDelete(t.id)}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {manage && (
        <div className="add">
          <div className="add-line">
            <input type="text" placeholder="เพิ่มงานประจำวัน เช่น ตรวจเช็กเครื่องถ่ายเอกสาร"
              value={val} onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { onAdd(val); setVal(''); } }} />
            <button className="add-btn" aria-label="เพิ่ม" onClick={() => { onAdd(val); setVal(''); }}>+</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Tasks ---------- */
function TasksTab({ tasks, onToggle, onAdd, onDelete }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [urgent, setUrgent] = useState(false);

  function submit() {
    if (!title.trim()) return;
    onAdd({ title, dueDate: due || null, urgent });
    setTitle(''); setDue(''); setUrgent(false);
  }

  return (
    <>
      <div className="add">
        <div className="add-line">
          <input type="text" placeholder="งานที่ได้รับมอบหมาย..."
            value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
          <button className="add-btn" aria-label="เพิ่ม" onClick={submit}>+</button>
        </div>
        <div className="add-opts">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} style={{ maxWidth: 170 }} />
          <button className={`chip ${urgent ? 'on' : ''}`} onClick={() => setUrgent((u) => !u)}>
            {urgent ? '● ด่วน' : '○ ด่วน'}
          </button>
        </div>
      </div>

      <p className="section-note" style={{ marginTop: 16 }}>งานด่วนและใกล้ครบกำหนดจะอยู่บนสุด</p>

      {tasks.length === 0 ? (
        <div className="card"><div className="empty">ยังไม่มีงานครั้งคราว</div></div>
      ) : (
        <div className="card">
          {tasks.map((t) => {
            const d = dueLabel(t.due_date);
            return (
              <div key={t.id} className={`row ${t.done ? 'done' : ''} tappable`}>
                <span className="check" onClick={() => onToggle(t)}><Check /></span>
                <div className="row-body" onClick={() => onToggle(t)}>
                  <div className="row-label">
                    {t.title}
                    {t.urgent && !t.done && <span className="badge">ด่วน</span>}
                  </div>
                  {d && <div className={`row-meta ${d.over && !t.done ? 'over' : ''}`}>🕐 {d.text}</div>}
                </div>
                <button className="del" aria-label="ลบ" onClick={() => onDelete(t.id)}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------- History ---------- */
function HistoryTab({ history }) {
  return (
    <>
      <p className="section-note">เปอร์เซ็นต์งานประจำวันที่ทำได้ ย้อนหลัง 14 วัน</p>
      {history.length === 0 ? (
        <div className="card"><div className="empty">ยังไม่มีประวัติ</div></div>
      ) : (
        <div className="card">
          {history.map((h) => {
            const [y, m, d] = h.date.split('-').map(Number);
            return (
              <div key={h.date} className="hist-row">
                <div className="hist-day">{TH_DOW_SHORT[h.wd]} {d} {TH_MONTH[m - 1]}</div>
                <div className="hist-bar"><div className="hist-fill" style={{ width: `${h.pct}%` }} /></div>
                <div className="hist-pct">{h.pct}%</div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
