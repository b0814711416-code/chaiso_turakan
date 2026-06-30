'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

/* ---------- localStorage ---------- */
function loadInfo() {
  try { return JSON.parse(localStorage.getItem('school_info') || '{}'); } catch { return {}; }
}
function saveInfo(info) {
  localStorage.setItem('school_info', JSON.stringify(info));
}

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
function wdOfDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}
function shiftDate(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
function thaiShortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `วัน${TH_DOW[wdOfDate(dateStr)]} ${d} ${TH_MONTH[m - 1]}`;
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
const IcoReport = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
);
const IcoNote = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
);
const IcoSettings = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
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
  const [weekly, setWeekly] = useState(null);
  const [manage, setManage] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  const date = todayStr();
  const wd = weekdayNum();
  const isWeekend = wd === 6 || wd === 7;
  const [showHoliday, setShowHoliday] = useState(isWeekend);
  const [viewDate, setViewDate] = useState(date);
  const viewWd = wdOfDate(viewDate);

  useEffect(() => { setSchoolInfo(loadInfo()); }, []);

  const loadDaily = useCallback(async () => {
    const r = await fetch(`/api/daily?date=${viewDate}&wd=${viewWd}`);
    setDaily(await r.json());
  }, [viewDate, viewWd]);
  const loadTasks = useCallback(async () => {
    const r = await fetch('/api/tasks');
    setTasks(await r.json());
  }, []);
  const loadHistory = useCallback(async () => {
    const r = await fetch('/api/history');
    setHistory(await r.json());
  }, []);
  const loadWeekly = useCallback(async () => {
    const r = await fetch('/api/weekly');
    setWeekly(await r.json());
  }, []);

  useEffect(() => { loadDaily(); loadTasks(); loadHistory(); loadWeekly(); }, [loadDaily, loadTasks, loadHistory, loadWeekly]);

  const doneCount = daily.filter((d) => d.done).length;
  const pct = daily.length ? Math.round((doneCount / daily.length) * 100) : 0;
  const tasksDone = tasks.filter((t) => t.done).length;
  const tasksPct = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0;

  /* daily actions */
  async function toggleDaily(t) {
    const next = !t.done;
    setDaily((p) => p.map((x) => (x.id === t.id ? { ...x, done: next } : x)));
    await fetch('/api/daily/toggle', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: t.id, date: viewDate, done: next }),
    });
    loadHistory();
    loadWeekly();
  }
  async function addDaily(label) {
    if (!label.trim()) return;
    const r = await fetch('/api/daily', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    const row = await r.json();
    if (row.weekdays.split(',').includes(String(viewWd))) setDaily((p) => [...p, row]);
  }
  async function delDaily(id) {
    setDaily((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/daily/${id}`, { method: 'DELETE' });
    loadHistory();
  }
  async function editDaily(id, label) {
    setDaily((p) => p.map((x) => (x.id === id ? { ...x, label } : x)));
    await fetch(`/api/daily/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
  }
  async function reorderDaily(dragId, dropId) {
    const from = daily.findIndex((x) => x.id === dragId);
    const to = daily.findIndex((x) => x.id === dropId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...daily];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDaily(next);
    await Promise.all(next.map((t, i) =>
      fetch(`/api/daily/${t.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: (i + 1) * 10 }),
      })
    ));
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
  async function saveTaskNote(id, field, value) {
    const key = field === 'commandNote' ? 'command_note' : 'completion_note';
    setTasks((p) => p.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
  }
  async function delTask(id) {
    setTasks((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  }

  const titles = { today: 'งานวันนี้', tasks: 'งานมอบหมาย', history: 'ประวัติการทำงาน', report: 'รายงานประจำสัปดาห์' };
  const weeklyDone = weekly ? weekly.days.filter((d) => !d.future) : [];
  const weeklyAvg = weeklyDone.length ? Math.round(weeklyDone.reduce((s, d) => s + d.pct, 0) / weeklyDone.length) : 0;
  const ringPct = tab === 'history' && history.length
    ? Math.round(history.reduce((s, h) => s + h.pct, 0) / history.length)
    : tab === 'tasks' ? tasksPct
    : tab === 'report' ? weeklyAvg
    : pct;

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div style={{ flex: 1 }}>
            <div className="date">{tab === 'today' && viewDate !== date ? `ย้อนหลัง · ${thaiShortDate(viewDate)}` : thaiHeaderDate()}</div>
            <div className="ttl">{titles[tab]}</div>
            {(schoolInfo.adminName || schoolInfo.schoolName) && (
              <div className="header-school">
                {[schoolInfo.adminName, schoolInfo.schoolName].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Ring pct={ringPct} />
            <div className="ring-sub">
              {tab === 'history' ? 'เฉลี่ย 14 วัน'
                : tab === 'tasks' ? `เสร็จ ${tasksDone}/${tasks.length}`
                : tab === 'report' ? 'เฉลี่ยสัปดาห์'
                : `เสร็จ ${doneCount}/${daily.length}`}
            </div>
          </div>
        </div>
        <button className="settings-btn" onClick={() => setShowSettings(true)} aria-label="ตั้งค่า">
          <IcoSettings />
        </button>
      </header>

      <div className="content">
        {tab === 'today' && (
          <TodayTab
            daily={daily} manage={manage} setManage={setManage}
            onToggle={toggleDaily} onAdd={addDaily} onDelete={delDaily}
            onEdit={editDaily} onReorder={reorderDaily}
            viewDate={viewDate} setViewDate={setViewDate} today={date}
          />
        )}
        {tab === 'tasks' && (
          <TasksTab tasks={tasks} onToggle={toggleTask} onAdd={addTask} onDelete={delTask} onSaveNote={saveTaskNote} />
        )}
        {tab === 'history' && <HistoryTab history={history} />}
        {tab === 'report' && <WeeklyTab weekly={weekly} schoolInfo={schoolInfo} />}
      </div>

      <nav className="nav">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
          <span className="ico"><IcoToday /></span>วันนี้
        </button>
        <button className={tab === 'tasks' ? 'active' : ''} onClick={() => setTab('tasks')}>
          <span className="ico"><IcoTasks /></span>งาน
        </button>
        <button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>
          <span className="ico"><IcoReport /></span>รายงาน
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          <span className="ico"><IcoHistory /></span>ประวัติ
        </button>
      </nav>

      {showSettings && (
        <SettingsModal
          info={schoolInfo}
          onSave={(info) => { setSchoolInfo(info); saveInfo(info); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showHoliday && (
        <div className="popup-backdrop" onClick={() => setShowHoliday(false)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-icon">🌴</div>
            <div className="popup-title">วันหยุด!</div>
            <div className="popup-msg">
              วัน{TH_DOW[wd]}นี้ไม่มีงาน<br />พักผ่อนได้เลย
            </div>
            <button className="popup-btn" onClick={() => setShowHoliday(false)}>รับทราบ</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Today ---------- */
function TodayTab({ daily, manage, setManage, onToggle, onAdd, onDelete, onEdit, onReorder, viewDate, setViewDate, today }) {
  const [val, setVal] = useState('');
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const rowRefs = useRef({});
  const dragState = useRef({ id: null, overId: null });

  function startEdit(t, e) {
    e.stopPropagation();
    setEditId(t.id);
    setEditVal(t.label);
  }

  function commitEdit(id) {
    if (editVal.trim()) onEdit(id, editVal.trim());
    setEditId(null);
  }

  function handlePointerDown(e, id) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { id, overId: id };
    setDragId(id);
    setOverId(id);
  }

  function handlePointerMove(e) {
    if (!dragState.current.id) return;
    const y = e.clientY;
    for (const [rowId, el] of Object.entries(rowRefs.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        dragState.current.overId = Number(rowId);
        setOverId(Number(rowId));
        break;
      }
    }
  }

  function handlePointerUp() {
    const { id, overId: targetId } = dragState.current;
    dragState.current = { id: null, overId: null };
    setDragId(null);
    setOverId(null);
    if (id !== null && targetId !== null && id !== targetId) onReorder(id, targetId);
  }

  const isToday = viewDate === today;
  const [vy, vm, vd] = viewDate.split('-').map(Number);
  const viewLabel = isToday ? 'วันนี้' : `${TH_DOW_SHORT[wdOfDate(viewDate)]} ${vd} ${TH_MONTH[vm - 1]}`;
  const daysDiff = Math.round((new Date(today + 'T12:00:00Z') - new Date(viewDate + 'T12:00:00Z')) / 86400000);

  return (
    <>
      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => { setViewDate(shiftDate(viewDate, -1)); setEditId(null); }} disabled={daysDiff >= 30}>&#8592;</button>
        <div className="date-nav-label">
          {viewLabel}
          {!isToday && <span className="date-nav-ago"> ({daysDiff} วันที่แล้ว)</span>}
        </div>
        <button className="date-nav-btn" onClick={() => { setViewDate(shiftDate(viewDate, 1)); setEditId(null); }} disabled={isToday}>&#8594;</button>
        {!isToday && <button className="linkbtn date-nav-today" onClick={() => { setViewDate(today); setEditId(null); }}>วันนี้</button>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="section-note">{isToday ? 'รีเซ็ตอัตโนมัติทุกวัน · บันทึกประวัติให้เอง' : 'โหมดบันทึกย้อนหลัง · แตะเพื่อเปลี่ยนสถานะ'}</p>
        <button className="linkbtn" onClick={() => { setManage((m) => !m); setEditId(null); }}>
          {manage ? 'เสร็จสิ้น' : 'จัดการ'}
        </button>
      </div>

      {daily.length === 0 ? (
        <div className="card"><div className="empty">วันนี้ไม่มีงานประจำ<br />กด &ldquo;จัดการ&rdquo; เพื่อเพิ่มงาน</div></div>
      ) : (
        <div className="card">
          {daily.map((t) => (
            <div
              key={t.id}
              ref={(el) => { rowRefs.current[t.id] = el; }}
              className={`row ${t.done ? 'done' : ''} ${!manage ? 'tappable' : ''} ${dragId === t.id ? 'dragging' : ''} ${overId === t.id && dragId !== t.id ? 'drag-over' : ''}`}
              onClick={manage ? undefined : () => onToggle(t)}
            >
              {manage ? (
                <span
                  className="drag-handle"
                  onPointerDown={(e) => handlePointerDown(e, t.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >⠿</span>
              ) : (
                <span className="check"><Check /></span>
              )}
              <div className="row-body">
                {editId === t.id ? (
                  <input
                    className="edit-inline"
                    value={editVal}
                    autoFocus
                    onChange={(e) => setEditVal(e.target.value)}
                    onBlur={() => commitEdit(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit(t.id);
                      if (e.key === 'Escape') setEditId(null);
                    }}
                  />
                ) : (
                  <div className="row-label">{t.label}</div>
                )}
              </div>
              {manage && (
                <>
                  <button className="edit-btn" aria-label="แก้ไข" onClick={(e) => startEdit(t, e)}>✏️</button>
                  <button className="del" aria-label="ลบ" onClick={() => onDelete(t.id)}>✕</button>
                </>
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

/* ---------- Note Panel ---------- */
function NotePanel({ task, onSave }) {
  const [cmdNote, setCmdNote] = useState(task.command_note || '');
  const [cmpNote, setCmpNote] = useState(task.completion_note || '');
  return (
    <div className="note-panel">
      <div className="note-field">
        <label className="note-label">📋 บันทึกการสั่งการ</label>
        <textarea
          className="note-textarea"
          value={cmdNote}
          placeholder="บันทึกรายละเอียด/คำสั่งการ..."
          onChange={(e) => setCmdNote(e.target.value)}
          onBlur={() => onSave(task.id, 'commandNote', cmdNote)}
        />
      </div>
      {task.done && (
        <div className="note-field">
          <label className="note-label">✅ บันทึกของธุรการ</label>
          <textarea
            className="note-textarea"
            value={cmpNote}
            placeholder="บันทึกผลการดำเนินการ..."
            onChange={(e) => setCmpNote(e.target.value)}
            onBlur={() => onSave(task.id, 'completionNote', cmpNote)}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Tasks ---------- */
function TasksTab({ tasks, onToggle, onAdd, onDelete, onSaveNote }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  function submit() {
    if (!title.trim()) return;
    onAdd({ title, dueDate: due || null, urgent });
    setTitle(''); setDue(''); setUrgent(false);
  }

  function toggleNote(id) {
    setExpandedId((prev) => (prev === id ? null : id));
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
        <div className="card"><div className="empty">ยังไม่มีงานมอบหมาย</div></div>
      ) : (
        <div className="card">
          {tasks.map((t) => {
            const d = dueLabel(t.due_date);
            const hasNote = !!(t.command_note || t.completion_note);
            const isOpen = expandedId === t.id;
            return (
              <div key={t.id}>
                <div className={`row ${t.done ? 'done' : ''} tappable`}>
                  <span className="check" onClick={() => onToggle(t)}><Check /></span>
                  <div className="row-body" onClick={() => onToggle(t)}>
                    <div className="row-label" style={t.urgent && !t.done ? { color: 'var(--urgent)', fontWeight: 600 } : {}}>
                      {t.urgent && !t.done && <span className="badge" style={{ marginLeft: 0, marginRight: 8 }}>ด่วน</span>}
                      {t.title}
                    </div>
                    {d && <div className={`row-meta ${d.over && !t.done ? 'over' : ''}`} style={{ marginTop: 4 }}>📅 กำหนดส่ง: {d.text.replace(/ครบกำหนด/, '').trim()}</div>}
                  </div>
                  <button
                    className={`note-btn ${hasNote ? 'has-note' : ''} ${isOpen ? 'open' : ''}`}
                    aria-label="บันทึก"
                    onClick={(e) => { e.stopPropagation(); toggleNote(t.id); }}
                  ><IcoNote /></button>
                  <button className="del" aria-label="ลบ" onClick={() => onDelete(t.id)}>✕</button>
                </div>
                {isOpen && <NotePanel key={t.id} task={t} onSave={onSaveNote} />}
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

/* ---------- Weekly Report ---------- */
const TH_MONTH_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

function getMonthOptions() {
  const now = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const [cy, cm] = now.split('-').map(Number);
  const opts = [];
  for (let i = 0; i < 6; i++) {
    let m = cm - i;
    let y = cy;
    if (m <= 0) { m += 12; y -= 1; }
    const val = `${y}-${String(m).padStart(2, '0')}`;
    const label = `${TH_MONTH_FULL[m - 1]} ${y + 543}`;
    opts.push({ val, label });
  }
  return opts;
}

function WeeklyTab({ weekly, schoolInfo }) {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].val);

  function openPDF() {
    const url = `/print?month=${selectedMonth}&school=${encodeURIComponent(schoolInfo.schoolName || '')}&admin=${encodeURIComponent(schoolInfo.adminName || '')}`;
    window.open(url, '_blank');
  }

  if (!weekly) return <div className="card"><div className="empty">กำลังโหลด...</div></div>;

  const { days, doneTasks } = weekly;
  const [, m0, dd0] = days[0].date.split('-').map(Number);
  const [, m4, dd4] = days[4].date.split('-').map(Number);
  const weekLabel = `${dd0} ${TH_MONTH[m0 - 1]} – ${dd4} ${TH_MONTH[m4 - 1]}`;

  function copyReport() {
    const lines = [
      'รายงานประจำสัปดาห์',
      weekLabel,
      schoolInfo.schoolName ? `โรงเรียน: ${schoolInfo.schoolName}` : '',
      schoolInfo.adminName ? `ผู้รายงาน: ${schoolInfo.adminName}` : '',
      '',
      '=== งานประจำวัน ===',
      ...days.map((d) => {
        const [, dm, dd] = d.date.split('-').map(Number);
        const label = `${TH_DOW_SHORT[d.wd]} ${dd} ${TH_MONTH[dm - 1]}`;
        return d.future ? `${label} - (ยังไม่ถึง)` : `${label} - ${d.pct}% (${d.done}/${d.total})`;
      }),
      '',
      '=== งานมอบหมายที่เสร็จสัปดาห์นี้ ===',
      doneTasks.length ? doneTasks.map((t) => `- ${t.title}`).join('\n') : '- ไม่มี',
    ].filter((l) => l !== null).join('\n');
    navigator.clipboard.writeText(lines).catch(() => {});
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="section-note">{weekLabel}</p>
        <button className="linkbtn" onClick={copyReport}>คัดลอก</button>
      </div>

      <p className="section-note" style={{ marginTop: 0, marginBottom: 8 }}>งานประจำวัน จันทร์–ศุกร์</p>
      <div className="card">
        {days.map((d) => {
          const [, dm, dd] = d.date.split('-').map(Number);
          const barColor = d.future ? 'var(--border)' : d.pct >= 80 ? 'var(--primary)' : d.pct >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={d.date} className="hist-row" style={{ opacity: d.future ? 0.4 : 1 }}>
              <div className="hist-day" style={{ fontWeight: d.future ? 400 : 600 }}>
                {TH_DOW_SHORT[d.wd]} {dd} {TH_MONTH[dm - 1]}
              </div>
              <div className="hist-bar">
                <div className="hist-fill" style={{ width: d.future ? '0%' : `${d.pct}%`, background: barColor }} />
              </div>
              <div className="hist-pct" style={{ color: d.future ? 'var(--text-3)' : barColor }}>
                {d.future ? '-' : `${d.pct}%`}
              </div>
            </div>
          );
        })}
      </div>

      <p className="section-note" style={{ marginTop: 16, marginBottom: 8 }}>งานมอบหมายที่เสร็จสัปดาห์นี้</p>
      <div className="card">
        {doneTasks.length === 0 ? (
          <div className="empty" style={{ padding: '20px 16px' }}>ยังไม่มีงานมอบหมายที่เสร็จ</div>
        ) : doneTasks.map((t) => (
          <div key={t.id} className="row done">
            <div className="row-body"><div className="row-label">{t.title}</div></div>
          </div>
        ))}
      </div>

      {/* PDF report section */}
      <div style={{ marginTop: 20, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>📄 รายงานประจำเดือน (PDF)</div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ width: '100%', height: 44, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', background: '#fafbfb', color: 'var(--text)', marginBottom: 12 }}
        >
          {monthOptions.map((o) => (
            <option key={o.val} value={o.val}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={openPDF}
          style={{ width: '100%', height: 46, background: 'var(--primary)', color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 600, fontFamily: 'inherit', border: 'none', cursor: 'pointer' }}
        >
          เปิดรายงาน PDF
        </button>
      </div>
    </>
  );
}

/* ---------- Settings Modal ---------- */
function SettingsModal({ info, onSave, onClose }) {
  const [adminName, setAdminName] = useState(info.adminName || '');
  const [schoolName, setSchoolName] = useState(info.schoolName || '');

  return (
    <div className="popup-backdrop" onClick={onClose}>
      <div className="popup" style={{ textAlign: 'left', padding: '28px 24px' }} onClick={(e) => e.stopPropagation()}>
        <div className="popup-title" style={{ fontSize: 18, marginBottom: 20 }}>ตั้งค่าข้อมูล</div>
        <label className="setting-label">ชื่อ-นามสกุล</label>
        <input
          className="setting-input"
          placeholder="เช่น นางสาวสมหญิง ใจดี"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
        />
        <label className="setting-label" style={{ marginTop: 14 }}>ชื่อโรงเรียน</label>
        <input
          className="setting-input"
          placeholder="เช่น โรงเรียนบ้านสวนหลวง"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="popup-btn" style={{ background: 'var(--border)', color: 'var(--text)', flex: 1 }} onClick={onClose}>ยกเลิก</button>
          <button className="popup-btn" style={{ flex: 2 }} onClick={() => onSave({ adminName: adminName.trim(), schoolName: schoolName.trim() })}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}
