/**
 * Google Apps Script backend for the daily care checklist.
 * Paste this whole file into Extensions → Apps Script of your Google Sheet (see README).
 *
 * CHANGE THESE TWO CODES before deploying:
 */
const FORM_PIN = '1234';  // caregivers type this once on their phone
const VIEW_PIN = '5678';  // family code to see the full log (also works on the form)

// Leave empty if this script was opened from the Sheet (Extensions → Apps Script).
// For a standalone script, paste the Sheet's ID (the long part of its URL between /d/ and /edit).
const SHEET_ID = '';

const SHEET_NAME = 'Entries';
const FIXED = ['Date', 'Caregiver', 'Last saved'];

function doGet() {
  return ContentService.createTextOutput('Care checklist backend is running.');
}

function doPost(e) {
  let out;
  try {
    const p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    out = route(p);
    out.ok = true;
  } catch (err) {
    out = { ok: false, error: String(err.message || err), code: err.code || '' };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function pinError() { const e = new Error('Wrong code'); e.code = 'PIN'; return e; }

function route(p) {
  const pin = String(p.pin || '').trim().toLowerCase();
  const isView = pin === VIEW_PIN.toLowerCase();
  if (!isView && pin !== FORM_PIN.toLowerCase()) throw pinError();
  switch (p.action) {
    case 'ping':   return { role: isView ? 'view' : 'form' };
    case 'save':   return { entry: saveEntry(p.entry) };
    case 'status': return { entries: readEntries().filter(function (x) { return x.date >= String(p.since || ''); }) };
    case 'list':   if (!isView) throw pinError(); return { entries: readEntries() };
  }
  throw new Error('Unknown action');
}

function getSheet() {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME, 0);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, FIXED.length).setValues([FIXED]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setFrozenColumns(2);
    sh.getRange('A:A').setNumberFormat('@'); // keep dates as plain YYYY-MM-DD text
  }
  return sh;
}

function getHeaders(sh) {
  return sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getDisplayValues()[0].filter(String);
}

function saveEntry(entry) {
  if (!entry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !String(entry.caregiver || '').trim()) {
    throw new Error('Missing date or caregiver');
  }
  const caregiver = String(entry.caregiver).trim().slice(0, 60);
  const values = entry.values || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sh = getSheet();
    let headers = getHeaders(sh);
    const newCols = Object.keys(values).filter(function (k) { return headers.indexOf(k) === -1; });
    if (newCols.length) {
      sh.getRange(1, headers.length + 1, 1, newCols.length).setValues([newCols]).setFontWeight('bold');
      headers = headers.concat(newCols);
    }

    // Find an existing row for the same date + caregiver (then we update it).
    const last = sh.getLastRow();
    let target = -1, existing = null;
    if (last > 1) {
      const keys = sh.getRange(2, 1, last - 1, 2).getDisplayValues();
      for (let i = 0; i < keys.length; i++) {
        if (keys[i][0] === entry.date && keys[i][1].toLowerCase() === caregiver.toLowerCase()) { target = i + 2; break; }
      }
      if (target > 0) existing = sh.getRange(target, 1, 1, headers.length).getValues()[0];
    }
    if (target < 0) target = last + 1;

    const savedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    const row = headers.map(function (h, i) {
      if (h === 'Date') return entry.date;
      if (h === 'Caregiver') return caregiver;
      if (h === 'Last saved') return savedAt;
      if (Object.prototype.hasOwnProperty.call(values, h)) return String(values[h]).slice(0, 2000);
      return existing ? existing[i] : '';
    });
    sh.getRange(target, 1).setNumberFormat('@');
    sh.getRange(target, 1, 1, headers.length).setValues([row]);

    // Newest first, so the sheet is easy to read.
    if (sh.getLastRow() > 2) sh.getRange(2, 1, sh.getLastRow() - 1, headers.length).sort({ column: 1, ascending: false });

    const out = { date: entry.date, caregiver: caregiver, savedAt: savedAt, values: {} };
    headers.forEach(function (h, i) { if (FIXED.indexOf(h) === -1) out.values[h] = String(row[i]); });
    return out;
  } finally {
    lock.releaseLock();
  }
}

function readEntries() {
  const sh = getSheet();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const headers = getHeaders(sh);
  const data = sh.getRange(2, 1, last - 1, headers.length).getDisplayValues();
  return data.filter(function (r) { return r[0]; }).map(function (r) {
    const e = { date: r[0], caregiver: r[1], savedAt: r[2], values: {} };
    headers.forEach(function (h, i) { if (i > 2) e.values[h] = r[i]; });
    return e;
  });
}
