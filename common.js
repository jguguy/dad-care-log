// Shared helpers for the form (index.html) and the viewer (view.html).
const CFG = window.CARE_CONFIG;
const DAYNAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------- dates (always local time, "YYYY-MM-DD") ----------
function ymd(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function todayStr() { return ymd(new Date()); }
function parseYmd(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(s, n) { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
function fmtDate(s, long) {
  return parseYmd(s).toLocaleDateString(undefined, long
    ? { weekday: "long", month: "long", day: "numeric" }
    : { weekday: "short", month: "short", day: "numeric" });
}
function weekStart(s) { const d = parseYmd(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return ymd(d); } // Monday
function expectedCaregiver(s) {
  const dn = DAYNAMES[parseYmd(s).getDay()];
  const c = CFG.caregivers.find((c) => c.days.includes(dn));
  return c ? c.name : null;
}
function sameName(a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); }

// ---------- tasks ----------
function allTasks() {
  return CFG.sections.flatMap((s) => s.tasks.map((t) => ({ ...t, freq: s.freq, everyDays: s.everyDays })));
}
function isDone(t, v) {
  if (t.type === "number") return v !== "" && v != null;
  return v === "Yes";
}

/** Status line for a weekly / bi-weekly task, based on other entries up to `date`. */
function taskStatus(task, entries, date, excludeCaregiver) {
  const others = entries.filter((e) => e.date <= date && !(e.date === date && sameName(e.caregiver, excludeCaregiver)));
  const done = others.filter((e) => e.values[task.col] === "Yes").sort((a, b) => (a.date < b.date ? 1 : -1));
  const last = done[0];
  const ws = weekStart(date);

  if (task.perCaregiver) {
    const names = CFG.caregivers.map((c) => c.name);
    done.filter((e) => e.date >= ws).forEach((e) => { if (!names.some((n) => sameName(n, e.caregiver))) names.push(e.caregiver); });
    const parts = names.map((n) => {
      const hit = done.find((e) => e.date >= ws && sameName(e.caregiver, n));
      return { name: n, date: hit && hit.date };
    });
    return { kind: "per", parts };
  }
  if (task.freq === "weekly") {
    if (last && last.date >= ws) return { level: "ok", text: `Done this week — ${fmtDate(last.date)} (${last.caregiver})` };
    if (last) return { level: "warn", text: `Not yet this week · last ${fmtDate(last.date)} (${last.caregiver})` };
    return { level: "warn", text: "No record yet" };
  }
  if (task.freq === "biweekly") {
    if (!last) return { level: "alert", text: "No record yet" };
    const due = addDays(last.date, task.everyDays || 14);
    if (due <= date) return { level: "alert", text: `Due now · last ${fmtDate(last.date)} (${last.caregiver})` };
    return { level: "ok", text: `Last ${fmtDate(last.date)} (${last.caregiver}) · next due ${fmtDate(due)}` };
  }
  return null;
}

// ---------- safe localStorage ----------
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};

// ---------- backend (Google Apps Script) ----------
const Api = {
  demo: !CFG.scriptUrl,
  async call(action, params = {}) {
    if (this.demo) return demoCall(action, params);
    // text/plain avoids a CORS preflight, which Apps Script cannot answer.
    const res = await fetch(CFG.scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...params }),
    });
    const data = await res.json();
    if (!data.ok) { const e = new Error(data.error || "Error"); e.code = data.code; throw e; }
    return data;
  },
};

// Demo mode: stores entries in this browser only, so the site can be tried before setup.
function demoCall(action, p) {
  const key = "care-demo-entries";
  let entries = [];
  try { entries = JSON.parse(store.get(key) || "[]"); } catch (e) {}
  if (action === "save") {
    const now = new Date();
    const entry = { ...p.entry, savedAt: ymd(now) + " " + now.toTimeString().slice(0, 5) };
    entries = entries.filter((e) => !(e.date === entry.date && sameName(e.caregiver, entry.caregiver)));
    entries.push(entry);
    store.set(key, JSON.stringify(entries));
    return Promise.resolve({ ok: true, entry });
  }
  if (action === "status") return Promise.resolve({ ok: true, entries: entries.filter((e) => e.date >= p.since) });
  return Promise.resolve({ ok: true, entries, role: "view" });
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
