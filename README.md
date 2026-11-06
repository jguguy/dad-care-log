# Daily Care Checklist

A simple daily checklist that caregivers fill in on their phone. Every answer is saved to a Google Sheet that the family can read.

- **Form** (`index.html`): for caregivers. Made for iPhone: big buttons, and it can be added to the Home Screen like an app. It picks the caregiver from the day of the week (Romunda: Mon/Tue/Thu, Mary: Fri/Sat). "Someone else" covers anyone else. If they save more than once on the same day, the same entry is updated.
- **Log** (`view.html`): for the family. It shows each day's entry, any missed tasks, notes, blood sugar averages, days when nobody filled in the form, and whether the weekly and every-2-weeks tasks were done.
- **Google Sheet**: holds all the data, one row per caregiver per day, newest first.

How it fits together: the website is hosted free on GitHub Pages. It sends each entry to a small Google Apps Script, which writes it into your Google Sheet. **No data is stored on GitHub.**

---

## One-time setup (about 10 minutes)

> ✅ This is already done for this copy. The steps are here in case it ever needs to be redone. The script was created at script.google.com as a standalone project, so `SHEET_ID` is filled in.

### 1. Create the Google Sheet
1. Go to <https://sheets.new> and name the sheet, for example "Dad care log".
2. Open **Extensions → Apps Script**.

### 2. Add the backend script
1. Delete everything in `Code.gs` and paste in all of [`apps-script/Code.gs`](apps-script/Code.gs).
2. **Change the two codes** at the top:
   - `FORM_PIN`: the caregivers' code. They type it once per phone.
   - `VIEW_PIN`: your code for the Log page. Keep it private.
3. Click 💾 **Save**.

### 3. Publish the script as a web app
1. Click **Deploy → New deployment**. Click the gear icon ⚙ and choose **Web app**.
2. Set **Execute as: Me** and **Who has access: Anyone**.
3. Click **Deploy**, then **Authorize access**, and pick your Google account. Google will warn you that the app is unverified, because you wrote it yourself. Click **Advanced → Go to … (unsafe) → Allow**.
4. Copy the **Web app URL** (it ends in `/exec`).

### 4. Connect the website
1. On GitHub, open `config.js` and click the ✏️ pencil icon.
2. Paste the URL between the quotes in `scriptUrl: ""`.
3. Optional: paste the Google Sheet's address into `sheetUrl: ""`.
4. Click **Commit changes**. The site updates in about a minute.

### 5. Send the link to the caregivers
Form: `https://jguguy.github.io/dad-care-log/`

On each caregiver's iPhone:
1. Open the link in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open the new icon and enter the caregiver code once.

The Log page is at `https://jguguy.github.io/dad-care-log/view.html` and asks for the viewer code.

---

## Changing things later
- **Add a caregiver, or change their days**: edit the `caregivers` list in `config.js`.
- **Add or remove a task**: edit `sections` in `config.js`. The sheet adds a new column by itself. Don't rename an existing `col` once you have data, or the old and new answers will end up in two separate columns.
- **Change the codes**: edit them in Apps Script, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. You have to redeploy after **any** change to the script. Everyone will be asked for the new code once.

## Notes
- Until `scriptUrl` is filled in, the site runs in **demo mode**: entries stay on that one device, so you can try it safely.
- The weekly status uses Monday–Sunday weeks. "Shower" is tracked separately for each caregiver.
