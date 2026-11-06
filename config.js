// ============================================================
//  SETTINGS — edit this file to change caregivers or tasks.
//  (You can edit it right on github.com: open the file, click the pencil.)
// ============================================================
window.CARE_CONFIG = {
  title: "Dad's Daily Care",

  // Paste the Google Apps Script "Web app URL" here (see README, step 3).
  // While this is empty the site runs in DEMO mode (data stays on that phone only).
  scriptUrl: "https://script.google.com/macros/s/AKfycbwB07tcHSHaI9Ps8j_5ff2zqHD_etmEmaVNGj0ar08qbc2DC_J-yFFUhhhFvLJkuTQtyg/exec",

  // Optional: link to the Google Sheet, shown on the "View" page.
  sheetUrl: "https://docs.google.com/spreadsheets/d/1bQ1qrg8wdPrKmpDV4ikPCgVUbDB-bLGs1m5-G7XQ7fg/edit",

  // Caregivers and the days they usually work.
  // The form pre-selects the right person based on the day. Add more anytime.
  caregivers: [
    { name: "Romunda", days: ["Mon", "Tue", "Thu"] },
    { name: "Mary",    days: ["Fri", "Sat"] },
  ],

  // The checklist. "col" is the column name in the Google Sheet —
  // avoid renaming it once you have data, or history will be split in two columns.
  // type: "check" (default), "yesno", or "number".
  sections: [
    {
      title: "Daily", freq: "daily",
      tasks: [
        { col: "Blood sugar", label: "Blood sugar", type: "number", unit: "mg/dL" },
        { col: "Morning pills & breakfast", label: "Morning pills & breakfast" },
        { col: "Put away worn clothes", label: "Put away worn clothes" },
        { col: "New clothes for the day", label: "Take out new clothes for the day",
          hint: "Have him wear a top so he is not always topless" },
        { col: "Brush teeth", label: "Brush teeth" },
        { col: "Cream skin", label: "Cream skin" },
        { col: "Clean glasses", label: "Clean / wash glasses" },
        { col: "Took pills last night", label: "Did he take his pills last night?", type: "yesno" },
        { col: "Make bed", label: "Make bed / have him make bed" },
        { col: "Lunch & leftovers for dinner", label: "Lunch, and leftovers for dinner" },
        { col: "Walk", label: "Walk" },
        { col: "Game / stimulation", label: "Game / stimulation" },
      ],
    },
    {
      title: "Weekly", freq: "weekly",
      tasks: [
        { col: "Shower", label: "Shower", hint: "Once a week with each caregiver", perCaregiver: true },
        { col: "Homemade dessert", label: "Cook homemade dessert" },
        { col: "Vacuum / floors", label: "Vacuum / floor cleaning" },
        { col: "Wash clothes", label: "Wash clothes" },
      ],
    },
    {
      title: "Every 2 weeks", freq: "biweekly", everyDays: 14,
      tasks: [
        { col: "Fill pill dispenser", label: "Fill up pill dispenser" },
      ],
    },
  ],

  moodCol: "His day",
  moodOptions: ["Good", "Okay", "Difficult"],
  notesCol: "Notes",
};
