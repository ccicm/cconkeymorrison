// =============================================================
// Reading List → GitHub Sync
// Google Apps Script for Connor's academic website
// =============================================================

const CONFIG = {
  GITHUB_OWNER:       'ccicm',
  GITHUB_REPO:        'cconkeymorrison',
  GITHUB_BRANCH:      'main',
  FILE_PATH:          'data/reading.json',
  SHEET_NAME:         'Reading List',
  APA_SHEET_NAME:     'APA Input',
  TAGS_SHEET_NAME:    'Tags',
  COMMIT_MSG:         'Update reading list from Google Sheet'
};

// ── Tags ─────────────────────────────────────────────────────
// Each paper has:
//   Theme 1 / Theme 2   broad strand (THEMES)
//   Tag 1 / 2 / 3       specific topics (TOPIC_GROUPS)
//   Study type          kind of paper (STUDY_TYPES)
// TOPIC_MAP / TYPE_MAP rename every old tag to the current ones ('' = drop).
// They are applied by "Tidy tags" and again on every sync, so old names
// never reach the website. Edit these lists to change the vocabulary.
const THEMES = ["School attendance", "Loneliness & connection", "AI & technology", "Mental health"];
const TOPIC_GROUPS = {
  "School attendance": [
    "School avoidance (EBSA)",
    "Return to school (re-engagement)",
    "Teachers & schools",
    "Whole-system approaches",
    "Education outcomes"
  ],
  "Loneliness & connection": [
    "Loneliness",
    "Social isolation",
    "Social support & belonging",
    "Community & social prescribing",
    "Policy & public health"
  ],
  "AI & technology": [
    "AI companions & chatbots",
    "Social media",
    "Online & digital programmes",
    "Machine learning & prediction",
    "AI & creativity"
  ],
  "Mental health": [
    "Anxiety",
    "Depression",
    "Neurodiversity & autism",
    "Bullying & peer relationships",
    "Childhood adversity (ACEs)",
    "Behavioural addiction"
  ],
  "Across themes": [
    "Interventions & treatment",
    "Therapy approaches (CBT, DBT)",
    "Measurement & assessment",
    "Definitions & concepts",
    "Parents & family",
    "Young people's views (student voice)",
    "Life transitions",
    "Gender & sexuality",
    "Older adults",
    "Individual differences"
  ]
};
const TOPIC_TAGS = Object.values(TOPIC_GROUPS).flat();
const STUDY_TYPES = ["Meta-analysis", "Systematic review", "Scoping review", "Review", "RCT", "Feasibility", "Qualitative", "Methods", "Conceptual", "Editorial"];
const TYPE_MAP = {
  "Meta-analysis": "Meta-analysis",
  "Systematic review": "Systematic review",
  "Scoping review": "Scoping review",
  "Review": "Review",
  "Clinical review": "Review",
  "Clinical synthesis": "Review",
  "Practitioner review": "Review",
  "RCT": "RCT",
  "Feasibility": "Feasibility",
  "Qualitative": "Qualitative",
  "Methods": "Methods",
  "Network analysis": "Methods",
  "Risk of bias": "Methods",
  "Conceptual": "Conceptual",
  "Framework": "Conceptual",
  "Foundational": "Conceptual",
  "Editorial": "Editorial"
};
const TOPIC_MAP = {
  "EBSA": "School avoidance (EBSA)",
  "Chronic absenteeism": "School avoidance (EBSA)",
  "Re-engagement": "Return to school (re-engagement)",
  "Rehabilitation": "Return to school (re-engagement)",
  "School staff": "Teachers & schools",
  "Systems": "Whole-system approaches",
  "Systems model": "Whole-system approaches",
  "Systems framework": "Whole-system approaches",
  "Systems theory": "Whole-system approaches",
  "Education system": "Whole-system approaches",
  "Education outcomes": "Education outcomes",
  "AI & machine learning": "AI companions & chatbots",
  "AI": "AI companions & chatbots",
  "Machine learning": "Machine learning & prediction",
  "Digital": "Online & digital programmes",
  "VR": "Online & digital programmes",
  "Social Media": "Social media",
  "Creativity": "AI & creativity",
  "Anxiety": "Anxiety",
  "Mental health": "",
  "Psychopathology": "",
  "Comorbidity": "",
  "Autism": "Neurodiversity & autism",
  "Neurodiversity": "Neurodiversity & autism",
  "Neurodiversity & autism": "Neurodiversity & autism",
  "Bullying": "Bullying & peer relationships",
  "ACEs": "Childhood adversity (ACEs)",
  "Behavioural addiction": "Behavioural addiction",
  "Intervention": "Interventions & treatment",
  "Intervention development": "Interventions & treatment",
  "Intervention outcomes": "Interventions & treatment",
  "Treatment outcomes": "Interventions & treatment",
  "CBT": "Therapy approaches (CBT, DBT)",
  "CBT play therapy": "Therapy approaches (CBT, DBT)",
  "CBT programme": "Therapy approaches (CBT, DBT)",
  "School-based CBT": "Therapy approaches (CBT, DBT)",
  "DBT": "Therapy approaches (CBT, DBT)",
  "Mindfulness": "Therapy approaches (CBT, DBT)",
  "Pharmacology": "Interventions & treatment",
  "Measurement": "Measurement & assessment",
  "Measurement tool": "Measurement & assessment",
  "Definitions": "Definitions & concepts",
  "Parent": "Parents & family",
  "Parent experience": "Parents & family",
  "Parent factors": "Parents & family",
  "Parent program": "Parents & family",
  "Family coaching": "Parents & family",
  "Multifamily therapy": "Parents & family",
  "Parents & family": "Parents & family",
  "Student voice": "Young people's views (student voice)",
  "Transition": "Life transitions",
  "Gender": "Gender & sexuality",
  "Individual differences": "Individual differences",
  "Personality": "Individual differences",
  "Inclusion": "",
  "Differentiation": "",
  "Developmental": ""
};

const DEFAULT_TAGS = TOPIC_TAGS;
const TOPIC_THEME = {};
THEMES.forEach(theme => (TOPIC_GROUPS[theme] || []).forEach(t => { TOPIC_THEME[t] = theme; }));

// Keyword hints, used only when no Groq key is set.
const THEME_KEYWORDS = {
  'School attendance':       ['school refusal','school attendance','school avoidance','absentee','ebsa','truan','school reintegration'],
  'Loneliness & connection': ['lonel','social isolation','social connect','social prescrib'],
  'AI & technology':         ['artificial intelligence',' ai ','chatbot','language model','llm','generative','social media','machine learning','virtual reality'],
  'Mental health':           ['anxiety','depress','mental health','psychiatr','autis','adhd','addiction','bully'],
};
const TAG_KEYWORDS = {
  'School avoidance (EBSA)':             ['ebsa','school refusal','school avoidance','school attendance','absentee','emotionally based'],
  'Return to school (re-engagement)':    ['re-engag','reintegrat','return to school'],
  'Teachers & schools':                  ['teacher','school staff','educator'],
  'Loneliness':                          ['lonel'],
  'Social isolation':                    ['social isolation','socially isolated'],
  'Community & social prescribing':      ['social prescrib','community program','community intervention'],
  'AI companions & chatbots':            ['chatbot','companion','conversational agent','replika'],
  'Social media':                        ['social media','reddit','twitter','instagram','tiktok'],
  'Machine learning & prediction':       ['machine learning','predict','classif','deep learning'],
  'Anxiety':                             ['anxiety','anxious'],
  'Depression':                          ['depress'],
  'Neurodiversity & autism':             ['autis','asperger','neurodiver','adhd'],
  'Bullying & peer relationships':       ['bully','victimis','victimiz'],
  'Therapy approaches (CBT, DBT)':       ['cbt','cognitive behav','dialectical'],
  'Parents & family':                    ['parent','caregiver','multifamily','multi-family'],
  'Older adults':                        ['older adult','elderly','aged care','long-term care'],
  'Gender & sexuality':                  ['gender','sexual minorit','lgbt'],
};
// Checked in this order; the first match becomes the suggested study type.
const STUDY_TYPE_KEYWORDS = {
  'Meta-analysis':     ['meta-analy'],
  'Systematic review': ['systematic review'],
  'Scoping review':    ['scoping review'],
  'RCT':               ['randomis','randomiz','controlled trial'],
  'Feasibility':       ['feasibility','pilot study'],
  'Qualitative':       ['qualitative','thematic analysis','grounded theory','interviews'],
  'Editorial':         ['editorial'],
  'Review':            ['review','overview'],
};

// Turns any mix of old/new tags into { themes, topics, studyType }.
// Themes missing? They are filled in from the topics' groups.
function tidyTagList_(tags, themes) {
  const topics = [];
  const types = [];
  const chosenThemes = (themes || []).map(t => String(t || '').trim()).filter(t => THEMES.indexOf(t) !== -1);
  const themesFromTags = [];
  (tags || []).forEach(raw => {
    const t = String(raw || '').trim();
    if (!t) return;
    if (THEMES.indexOf(t) !== -1) { themesFromTags.push(t); return; }
    if (TYPE_MAP[t]) { types.push(TYPE_MAP[t]); return; }
    if (STUDY_TYPES.indexOf(t) !== -1) { types.push(t); return; }
    const topic = Object.prototype.hasOwnProperty.call(TOPIC_MAP, t) ? TOPIC_MAP[t] : t;
    if (topic && topics.indexOf(topic) === -1) topics.push(topic);
  });
  if (!chosenThemes.length) {
    topics.map(t => TOPIC_THEME[t]).concat(themesFromTags).forEach(theme => {
      if (theme && chosenThemes.indexOf(theme) === -1) chosenThemes.push(theme);
    });
  }
  return {
    themes: THEMES.filter(t => chosenThemes.indexOf(t) !== -1).slice(0, 2),
    topics: topics.slice(0, 3),
    studyType: STUDY_TYPES.find(s => types.indexOf(s) !== -1) || ''
  };
}

// Column order is detected by header name — reorder freely in the sheet.

// ── Menu ─────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Reading List')
    .addItem('Rescue misplaced abstracts', 'rescueMisplacedAbstracts')
    .addItem('Fill missing abstracts', 'fillMissingAbstracts')
    .addItem('Generate missing insights', 'generateMissingInsights')
    .addItem('Tidy tags (rename + themes)', 'tidyTags')
    .addItem('Re-tag with AI (rows without a Tag status)', 'retagWithAi')
    .addSeparator()
    .addItem('Sync to website now', 'syncReadingList')
    .addSeparator()
    .addItem('1. Set GitHub token', 'promptForToken')
    .addItem('2. Set Groq API key', 'promptForApiKey')
    .addItem('3. Set up sheets & tags (first time)', 'setupSheets')
    .addItem('4. Migrate existing data (first time)', 'migrateExistingData')
    .addItem('5. Install APA trigger (first time)', 'setupTrigger')
    .addToUi();
}

// ── Auth management ───────────────────────────────────────────
function promptForToken() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('GitHub token', 'Paste your GitHub personal access token', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  const token = result.getResponseText().trim();
  if (!token) { ui.alert('No token entered.'); return; }
  PropertiesService.getUserProperties().setProperty('GITHUB_TOKEN', token);
  ui.alert('✅ Token saved.');
}

function getToken_() {
  const token = PropertiesService.getUserProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('No GitHub token. Use the menu to set it first.');
  return token;
}

function promptForApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Groq API key', 'Paste your key from console.groq.com', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getUserProperties().setProperty('GROQ_KEY', result.getResponseText().trim());
  ui.alert('✅ Key saved.');
}

function getGroqKey_() {
  return PropertiesService.getUserProperties().getProperty('GROQ_KEY') || null;
}

// ── Sheet setup ───────────────────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let tagsSheet = ss.getSheetByName(CONFIG.TAGS_SHEET_NAME);
  if (!tagsSheet) tagsSheet = ss.insertSheet(CONFIG.TAGS_SHEET_NAME);
  tagsSheet.clearContents();
  writeTagsSheet_(tagsSheet);

  let apaSheet = ss.getSheetByName(CONFIG.APA_SHEET_NAME);
  if (!apaSheet) apaSheet = ss.insertSheet(CONFIG.APA_SHEET_NAME);
  apaSheet.clearContents();
  apaSheet.getRange('A1').setValue('Paste APA, DOI, PMID, or title here').setFontWeight('bold');
  apaSheet.getRange('B1').setValue('Status').setFontWeight('bold');
  apaSheet.setColumnWidth(1, 600);
  apaSheet.setColumnWidth(2, 180);

  SpreadsheetApp.getUi().alert('✅ Sheets created. Run "Migrate existing data" next.');
}

function writeTagsSheet_(tagsSheet) {
  tagsSheet.clearContents();
  tagsSheet.getRange(1, 1, 1, 3).setValues([['Theme', 'Topic', 'Study type']]).setFontWeight('bold');
  tagsSheet.getRange(2, 1, THEMES.length, 1).setValues(THEMES.map(t => [t]));
  tagsSheet.getRange(2, 2, TOPIC_TAGS.length, 1).setValues(TOPIC_TAGS.map(t => [t]));
  tagsSheet.getRange(2, 3, STUDY_TYPES.length, 1).setValues(STUDY_TYPES.map(t => [t]));
}

function headersOf_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(h => String(h).trim().toLowerCase());
}

function applyTagValidation_(rlSheet) {
  const tagsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.TAGS_SHEET_NAME);
  if (!tagsSheet) return;
  const lastRow = Math.max(rlSheet.getLastRow(), 2);
  const rule = range => SpreadsheetApp.newDataValidation()
    .requireValueInRange(range, true)
    .setAllowInvalid(true)
    .build();
  const rules = {
    theme: rule(tagsSheet.getRange(2, 1, THEMES.length + 10, 1)),
    topic: rule(tagsSheet.getRange(2, 2, TOPIC_TAGS.length + 30, 1)),
    type:  rule(tagsSheet.getRange(2, 3, STUDY_TYPES.length + 10, 1))
  };
  const headers = headersOf_(rlSheet);
  const apply = (name, r) => {
    const c = headers.indexOf(name);
    if (c !== -1) rlSheet.getRange(2, c + 1, lastRow - 1, 1).setDataValidation(r);
  };
  ['theme 1','theme 2'].forEach(n => apply(n, rules.theme));
  ['tag 1','tag 2','tag 3'].forEach(n => apply(n, rules.topic));
  apply('study type', rules.type);
}

// Adds any missing tag columns (Theme 1/2 before Tag 1; Study type and
// Tag status after Tag 3). Returns the sheet's lower-case headers.
function ensureTagColumns_(sheet) {
  let headers = headersOf_(sheet);
  const insert = (name, refName, before) => {
    if (headers.indexOf(name.toLowerCase()) !== -1) return;
    const ref = headers.indexOf(refName);   // 0-based, -1 if missing
    let col;                                // 1-based column of the new header
    if (ref === -1) { sheet.insertColumnAfter(headers.length); col = headers.length + 1; }
    else if (before) { sheet.insertColumnBefore(ref + 1); col = ref + 1; }
    else { sheet.insertColumnAfter(ref + 1); col = ref + 2; }
    sheet.getRange(1, col).setValue(name).setFontWeight('bold');
    headers = headersOf_(sheet);
  };
  insert('Theme 1', 'tag 1', true);
  insert('Theme 2', 'tag 1', true);
  insert('Study type', 'tag 3', false);
  insert('Tag status', 'study type', false);
  return headers;
}

function tagColumns_(headers) {
  const c = {
    themes: ['theme 1','theme 2'].map(n => headers.indexOf(n)),
    topics: ['tag 1','tag 2','tag 3'].map(n => headers.indexOf(n)),
    type: headers.indexOf('study type'),
    status: headers.indexOf('tag status'),
    title: headers.indexOf('title'),
    abstract: headers.indexOf('abstract'),
    note: headers.indexOf('note')
  };
  if (c.topics.concat(c.themes, [c.type, c.status]).some(i => i === -1)) {
    throw new Error('Could not find the Theme, Tag, Study type and Tag status columns.');
  }
  return c;
}

function refreshTagsSheet_(sheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let tagsSheet = ss.getSheetByName(CONFIG.TAGS_SHEET_NAME);
  if (!tagsSheet) tagsSheet = ss.insertSheet(CONFIG.TAGS_SHEET_NAME);
  writeTagsSheet_(tagsSheet);
  applyTagValidation_(sheet);
}

// Pop-up messages when run from the sheet's menu; Execution log when run
// from the Apps Script editor (where pop-ups aren't available).
function safeUi_() {
  try { return SpreadsheetApp.getUi(); } catch (e) {
    return {
      alert: (title, msg) => Logger.log(`${title}${msg ? ': ' + msg : ''}`),
      ButtonSet: { OK: null }
    };
  }
}

// ── Tidy tags ─────────────────────────────────────────────────
// Renames old tags, moves study types into their own column and fills in
// themes from topics. Safe to run more than once.
function tidyTags() {
  const ui = safeUi_();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { ui.alert(`Sheet "${CONFIG.SHEET_NAME}" not found.`); return; }
  let c;
  try { c = tagColumns_(ensureTagColumns_(sheet)); } catch (e) { ui.alert(e.message); return; }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const width = sheet.getLastColumn();
  const data = sheet.getRange(2, 1, lastRow - 1, width).getValues();
  const cols = c.themes.concat(c.topics, [c.type]);
  let changed = 0;
  data.forEach(row => {
    const before = cols.map(i => row[i]).join('|');
    const tidy = tidyTagList_(c.topics.map(i => row[i]).concat([row[c.type]]), c.themes.map(i => row[i]));
    c.themes.forEach((i, n) => { row[i] = tidy.themes[n] || ''; });
    c.topics.forEach((i, n) => { row[i] = tidy.topics[n] || ''; });
    row[c.type] = tidy.studyType;
    if (before !== cols.map(i => row[i]).join('|')) changed++;
  });
  cols.forEach(i => sheet.getRange(2, i + 1, data.length, 1).setValues(data.map(row => [row[i]])));
  refreshTagsSheet_(sheet);
  ui.alert('✅ Tags tidied', `${changed} rows updated.\n\nNext: "Re-tag with AI" to fix inaccurate tags, or "Sync to website now".`, ui.ButtonSet.OK);
}

// ── Re-tag with AI ────────────────────────────────────────────
// Asks Groq to choose themes, topics and a study type for each paper, using
// ONLY the lists above. Skips rows whose "Tag status" is filled in, so you can
// run it again to continue, and it never touches rows you marked "Checked".
// To redo a row, clear its Tag status. Changed cells are highlighted yellow.
const AI_TAG_STATUS = 'AI – please check';
// Groq retires models over time, so the script asks Groq which models this
// key can use and takes the first match from this preference list.
const AI_TAG_MODEL_PREFERENCES = [
  'openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'moonshotai/kimi-k2-instruct',
  'qwen/qwen3-32b', 'meta-llama/llama-4-maverick-17b-128e-instruct',
  'openai/gpt-oss-20b', 'llama-3.1-8b-instant'
];
let aiTagModel_ = null;

function listGroqModels_() {
  const key = getGroqKey_();
  if (!key) return [];
  try {
    const res = UrlFetchApp.fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': 'Bearer ' + key }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) {
      Logger.log(`Groq models error ${res.getResponseCode()}: ${res.getContentText().slice(0, 300)}`);
      return [];
    }
    return (JSON.parse(res.getContentText()).data || []).map(m => m.id);
  } catch (e) {
    Logger.log('Groq models error: ' + e.message);
    return [];
  }
}

function pickAiTagModel_() {
  if (aiTagModel_) return aiTagModel_;
  const available = listGroqModels_();
  aiTagModel_ = AI_TAG_MODEL_PREFERENCES.find(m => available.indexOf(m) !== -1)
    || available.find(m => /llama|gpt-oss|qwen/i.test(m) && !/guard|whisper|tts|vision/i.test(m))
    || 'llama-3.1-8b-instant';
  return aiTagModel_;
}

function retagWithAi() {
  const ui = safeUi_();
  if (!getGroqKey_()) { ui.alert('No Groq key set. Use "2. Set Groq API key" first.'); return; }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { ui.alert(`Sheet "${CONFIG.SHEET_NAME}" not found.`); return; }
  let c;
  try { c = tagColumns_(ensureTagColumns_(sheet)); } catch (e) { ui.alert(e.message); return; }
  refreshTagsSheet_(sheet);

  const startedAt = Date.now();
  const data = sheet.getDataRange().getValues();
  let done = 0, failed = 0, remaining = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const title = String(row[c.title] || '').trim();
    if (!title || String(row[c.status] || '').trim()) continue;
    if (Date.now() - startedAt > 4 * 60 * 1000) { remaining++; continue; }

    const result = aiTag_(title, c.abstract !== -1 ? row[c.abstract] : '', c.note !== -1 ? row[c.note] : '');
    if (!result) { failed++; continue; }
    const values = {};
    c.themes.forEach((col, n) => { values[col] = result.themes[n] || ''; });
    c.topics.forEach((col, n) => { values[col] = result.topics[n] || ''; });
    values[c.type] = result.studyType;
    Object.keys(values).forEach(col => {
      const cell = sheet.getRange(i + 1, Number(col) + 1);
      if (String(row[col] || '') !== values[col]) cell.setBackground('#fff4c2');
      cell.setValue(values[col]);
    });
    sheet.getRange(i + 1, c.status + 1).setValue(AI_TAG_STATUS);
    done++;
    Utilities.sleep(300);
  }

  let msg = `${done} papers re-tagged. Changed cells are highlighted yellow.`;
  if (failed) msg += `\n${failed} could not be tagged (try again later).`;
  if (remaining) msg += `\n${remaining} still to do: run "Re-tag with AI" again to continue.`;
  msg += '\n\nCheck the tags, set Tag status to "Checked" when happy, then sync.';
  ui.alert('✅ AI re-tag', msg, ui.ButtonSet.OK);
}

// Run this from the Apps Script editor (select it, click Run) to check the
// AI tagging works; the result and any Groq error appear in the Execution log.
function testAiTagging() {
  Logger.log('Groq key set: ' + !!getGroqKey_());
  Logger.log('Models available: ' + listGroqModels_().join(', '));
  Logger.log('Model used for tagging: ' + pickAiTagModel_());
  Logger.log(JSON.stringify(aiTag_(
    'A randomised controlled trial of a parent-led online programme for adolescent school refusal', '', '')));
}

function aiTag_(title, abstract, note) {
  const topicList = Object.keys(TOPIC_GROUPS)
    .map(g => `${g}: ${TOPIC_GROUPS[g].join('; ')}`).join('\n');
  const prompt =
    'You tag papers for an academic reading list. Choose ONLY from these lists, copying labels exactly.\n\n' +
    `THEMES (choose 1, or 2 only if the paper is clearly about both):\n${THEMES.join('; ')}\n\n` +
    `TOPICS (choose 1 to 3 that describe what the paper is mainly about; prefer topics from the chosen themes):\n${topicList}\n\n` +
    `STUDY TYPES (choose exactly 1, or "" if none fits):\n${STUDY_TYPES.join('; ')}\n` +
    '(Review = narrative or clinical review; Conceptual = theory, framework or definitions paper; Methods = methodological or measurement-development paper.)\n\n' +
    `Paper title: ${title}\n` +
    (abstract ? `Abstract: ${String(abstract).slice(0, 1500)}\n` : '') +
    (note ? `Reader's note: ${String(note).slice(0, 600)}\n` : '') +
    '\nReply with JSON only: {"themes": [...], "topics": [...], "studyType": "..."}';
  const text = callGroq_(prompt, 800, 0, { model: pickAiTagModel_(), json: true });
  return parseAiTags_(text);
}

// Keeps only labels that exist in the lists, so a bad reply can't add junk.
function parseAiTags_(text) {
  if (!text) return null;
  let obj;
  try { obj = JSON.parse(String(text).replace(/^```(?:json)?|```$/g, '').trim()); } catch (e) { return null; }
  const keep = (list, allowed) => (Array.isArray(list) ? list : [list])
    .map(v => String(v || '').trim()).filter(v => allowed.indexOf(v) !== -1)
    .filter((v, i, a) => a.indexOf(v) === i);
  const themes = keep(obj.themes, THEMES).slice(0, 2);
  const topics = keep(obj.topics, TOPIC_TAGS).slice(0, 3);
  const studyType = keep(obj.studyType, STUDY_TYPES)[0] || '';
  if (!themes.length && !topics.length) return null;
  const tidy = tidyTagList_(topics.concat([studyType]), themes);
  return tidy;
}

// ── Migration (one-time) ──────────────────────────────────────
function migrateExistingData() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Migrate existing data',
    'Restructures Reading List to new columns and fetches from CrossRef. Existing notes are preserved. Continue?',
    ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { ui.alert('Reading List sheet not found.'); return; }

  const data = sheet.getDataRange().getValues();
  const h    = data[0].map(x => String(x).trim().toLowerCase());
  const col  = name => h.indexOf(name);

  const doiCol  = col('doi');
  if (doiCol === -1) { ui.alert('No DOI column found.'); return; }

  const newData = [['DOI','Title','Authors','Year','Journal','Tag 1','Tag 2','Tag 3','Note','Abstract']];

  for (let i = 1; i < data.length; i++) {
    const doi = String(data[i][doiCol] || '').trim();
    if (!doi) continue;

    const get = name => col(name) !== -1 ? String(data[i][col(name)] || '').trim() : '';
    let title    = get('title');
    let authors  = get('authors');
    let year     = get('year');
    let journal  = get('journal');
    let abstract = get('abstract');

    if (!title || !authors || !abstract) {
      const meta = fetchMetaFromCrossRef_(doi);
      if (!title)    title    = meta.title    || '';
      if (!authors)  authors  = meta.authors  || '';
      if (!year)     year     = meta.year     ? String(meta.year) : '';
      if (!journal)  journal  = meta.journal  || '';
      if (!abstract) abstract = meta.abstract || '';
      Utilities.sleep(200);
    }

    const tags = col('tag 1') !== -1
      ? ['tag 1','tag 2','tag 3'].map(n => get(n)).filter(Boolean)
      : (col('tags') !== -1 ? get('tags').split(',').map(t => t.trim()).filter(Boolean) : []);

    newData.push([doi, title, authors, year, journal,
      tags[0]||'', tags[1]||'', tags[2]||'', get('note'), abstract]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, newData.length, 10).setValues(newData);
  sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  applyTagValidation_(sheet);
  ui.alert(`✅ Migration complete. ${newData.length - 1} entries migrated.`);
}

// ── Trigger setup ─────────────────────────────────────────────
function setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'onApaEdit')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onApaEdit').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  SpreadsheetApp.getUi().alert('✅ APA auto-process trigger installed.');
}

// ── APA input handler ─────────────────────────────────────────
function onApaEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.APA_SHEET_NAME) return;
  if (e.range.getColumn() !== 1 || e.range.getRow() < 2) return;

  const input = e.range.getValue().toString().trim();
  if (!input) return;

  const statusCell = sheet.getRange(e.range.getRow(), 2);
  statusCell.setValue('Processing…');

  const doi = resolveInput_(input);
  if (!doi) { statusCell.setValue('⚠️ Could not find a DOI'); return; }

  const ss      = SpreadsheetApp.getActiveSpreadsheet();
  const rlSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!rlSheet) { statusCell.setValue('⚠️ Reading List sheet not found'); return; }

  const existing  = rlSheet.getDataRange().getValues();
  const doiColIdx = existing[0].map(h => String(h).toLowerCase()).indexOf('doi');
  if (doiColIdx === -1) {
    statusCell.setValue('⚠️ Reading List has no DOI column');
    return;
  }
  const normalizedDoi = normalizeDoi_(doi);
  if (existing.slice(1).some(row => normalizeDoi_(String(row[doiColIdx] || '').trim()) === normalizedDoi)) {
    statusCell.setValue('⚠️ Already in list'); return;
  }

  const meta      = fetchMetaFromCrossRef_(doi);
  const suggested = (getGroqKey_() && aiTag_(meta.title || input, meta.abstract, ''))
    || suggestTags_(meta.title || input, meta.abstract);

  const headers = rlSheet.getRange(1, 1, 1, rlSheet.getLastColumn()).getValues()[0]
    .map(h => String(h).trim().toLowerCase());
  const newRow  = rlSheet.getLastRow() + 1;
  const set = (name, val) => {
    const c = headers.indexOf(name);
    if (c !== -1) rlSheet.getRange(newRow, c + 1).setValue(val);
  };
  set('doi',      doi);
  set('title',    meta.title    || '');
  set('authors',  meta.authors  || '');
  set('year',     meta.year ? String(meta.year) : '');
  set('journal',  meta.journal  || '');
  set('abstract', meta.abstract || '');
  set('theme 1',  suggested.themes[0] || '');
  set('theme 2',  suggested.themes[1] || '');
  set('tag 1',    suggested.topics[0] || '');
  set('tag 2',    suggested.topics[1] || '');
  set('tag 3',    suggested.topics[2] || '');
  set('study type', suggested.studyType);
  set('tag status', AI_TAG_STATUS);
  set('note',     '');

  applyTagValidation_(rlSheet);

  statusCell.setValue('✅ Added');
}

function resolveInput_(text) {
  const doiMatch = text.match(/10\.\d{4,9}\/[^\s,;)\]"]+/);
  if (doiMatch) return doiMatch[0].replace(/[.,;)\]"]+$/, '');
  const pmidMatch = text.match(/^\s*(?:PMID:?\s*)?(\d{7,8})\s*$/i);
  if (pmidMatch) return lookupPmid_(pmidMatch[1]);
  return searchByTitle_(text);
}

function lookupPmid_(pmid) {
  try {
    const res = UrlFetchApp.fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`,
      { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    const ids = JSON.parse(res.getContentText()).result?.[pmid]?.articleids || [];
    return ids.find(id => id.idtype === 'doi')?.value || null;
  } catch (e) { return null; }
}

function searchByTitle_(title) {
  try {
    const res = UrlFetchApp.fetch(
      `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(title)}&rows=1&mailto=connorconkeymorrison@gmail.com`,
      { muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) return null;
    return JSON.parse(res.getContentText()).message?.items?.[0]?.DOI || null;
  } catch (e) { return null; }
}

function decodeHtml_(str) {
  return str
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── CrossRef + Europe PMC + Semantic Scholar lookup ──────────
function fetchMetaFromCrossRef_(doi) {
  let title = '', authors = '', year = '', journal = '', abstract = '';

  // CrossRef — title, authors, year, journal, abstract (patchy for psych/edu)
  try {
    const res = UrlFetchApp.fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=connorconkeymorrison@gmail.com`,
      { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const w = JSON.parse(res.getContentText()).message;
      const authorList = (w.author || []).slice(0, 3).map(a =>
        a.given ? `${a.family||''}, ${a.given[0]}.` : (a.family||''));
      if ((w.author||[]).length > 3) authorList.push('et al.');
      title    = decodeHtml_(w.title?.[0] || '');
      authors  = authorList.join(', ');
      year     = w.published?.['date-parts']?.[0]?.[0] || '';
      journal  = decodeHtml_(w['container-title']?.[0] || '');
      abstract = w.abstract ? decodeHtml_(w.abstract) : '';
    }
  } catch (e) { Logger.log('CrossRef error: ' + e.message); }

  // Europe PMC fallback
  if (!abstract) {
    try {
      const res = UrlFetchApp.fetch(
        `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:${encodeURIComponent(doi)}&resultType=core&format=json`,
        { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const item = JSON.parse(res.getContentText()).resultList?.result?.[0];
        if (item?.abstractText) abstract = item.abstractText.replace(/\s+/g,' ').trim();
      }
    } catch (e) { Logger.log('Europe PMC error: ' + e.message); }
  }

  // Semantic Scholar fallback — best abstract coverage for psych/edu
  if (!abstract) abstract = fetchSemanticScholarAbstract_(doi);

  return { title, authors, year, journal, abstract };
}

function fetchSemanticScholarAbstract_(doi) {
  try {
    const res = UrlFetchApp.fetch(
      `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=abstract`,
      { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const data = JSON.parse(res.getContentText());
      if (data.abstract) return data.abstract.replace(/\s+/g,' ').trim();
    }
  } catch (e) { Logger.log('Semantic Scholar error: ' + e.message); }
  return '';
}

// ── Tag suggester ─────────────────────────────────────────────
function suggestTags_(title, abstract) {
  const lower = ' ' + (title + ' ' + (abstract || '')).toLowerCase() + ' ';
  const hit = keywords => keywords.some(kw => lower.includes(kw.toLowerCase()));
  const themes = THEMES.filter(t => hit(THEME_KEYWORDS[t] || [])).slice(0, 2);
  const topics = Object.keys(TAG_KEYWORDS).filter(t => hit(TAG_KEYWORDS[t])).slice(0, 3);
  const studyType = Object.keys(STUDY_TYPE_KEYWORDS).find(t => hit(STUDY_TYPE_KEYWORDS[t])) || '';
  return tidyTagList_(topics.concat([studyType]), themes);
}

// ── Groq helper ───────────────────────────────────────────────
function callGroq_(prompt, maxTokens, temperature, options) {
  options = options || {};
  const key = getGroqKey_();
  if (!key) return null;
  try {
    for (let attempt = 0; attempt < 4; attempt++) {
    const res = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        model: options.model || 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: temperature,
        ...(options.json ? { response_format: { type: 'json_object' } } : {})
      }),
      muteHttpExceptions: true
    });
    // Free-tier rate limit: wait as long as Groq asks, then try again.
    if (res.getResponseCode() === 429 && attempt < 3) {
      const m = res.getContentText().match(/try again in ([\d.]+)(ms|s)/);
      const wait = m ? Number(m[1]) * (m[2] === 'ms' ? 1 : 1000) : 10000;
      Utilities.sleep(Math.min(wait + 500, 30000));
      continue;
    }
    if (res.getResponseCode() !== 200) {
      Logger.log(`Groq error ${res.getResponseCode()}: ${res.getContentText().slice(0, 500)}`);
      return null;
    }
    return JSON.parse(res.getContentText()).choices?.[0]?.message?.content?.trim() || null;
    }
    return null;
  } catch (e) {
    Logger.log('Groq error: ' + e.message);
    return null;
  }
}

// ── Rescue abstracts that landed in tag columns ───────────────
function rescueMisplacedAbstracts() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { SpreadsheetApp.getUi().alert('Reading List sheet not found.'); return; }

  const data = sheet.getDataRange().getValues();
  const h    = data[0].map(x => String(x).trim().toLowerCase());
  const absCol  = h.indexOf('abstract');
  const tag1Col = h.indexOf('tag 1');
  const tag2Col = h.indexOf('tag 2');
  const tag3Col = h.indexOf('tag 3');
  if (absCol === -1) { SpreadsheetApp.getUi().alert('No Abstract column found.'); return; }

  let moved = 0;
  for (let i = 1; i < data.length; i++) {
    const abstract = String(data[i][absCol] || '').trim();
    if (abstract) continue; // already has one

    // Check each tag column for long text (>80 chars = almost certainly an abstract)
    for (const tagCol of [tag1Col, tag2Col, tag3Col]) {
      if (tagCol === -1) continue;
      const val = String(data[i][tagCol] || '').trim();
      if (val.length > 80) {
        sheet.getRange(i + 1, absCol  + 1).setValue(val);
        sheet.getRange(i + 1, tagCol  + 1).setValue('');
        moved++;
        break;
      }
    }
  }

  SpreadsheetApp.getUi().alert(`✅ Done. Moved ${moved} misplaced abstract(s) to the Abstract column.`);
}

// ── Fill missing abstracts ────────────────────────────────────
function fillMissingAbstracts() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { SpreadsheetApp.getUi().alert('Reading List sheet not found.'); return; }

  const data   = sheet.getDataRange().getValues();
  const h      = data[0].map(x => String(x).trim().toLowerCase());
  const doiCol = h.indexOf('doi');
  const absCol = h.indexOf('abstract');
  if (doiCol === -1) { SpreadsheetApp.getUi().alert('No DOI column found. Run migration first.'); return; }
  if (absCol  === -1) { SpreadsheetApp.getUi().alert('No Abstract column found.'); return; }

  let filled = 0, skipped = 0;
  for (let i = 1; i < data.length; i++) {
    const doi      = String(data[i][doiCol] || '').trim();
    const abstract = String(data[i][absCol] || '').trim();
    if (!doi || abstract) { if (abstract) skipped++; continue; }

    // CrossRef → Europe PMC → Semantic Scholar
    let fetched = '';
    try {
      const res = UrlFetchApp.fetch(
        `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=connorconkeymorrison@gmail.com`,
        { muteHttpExceptions: true });
      if (res.getResponseCode() === 200) {
        const w = JSON.parse(res.getContentText()).message;
        if (w.abstract) fetched = w.abstract.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
      }
    } catch (e) { Logger.log('CrossRef row ' + (i+1) + ': ' + e.message); }

    if (!fetched) {
      try {
        const res = UrlFetchApp.fetch(
          `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:${encodeURIComponent(doi)}&resultType=core&format=json`,
          { muteHttpExceptions: true });
        if (res.getResponseCode() === 200) {
          const item = JSON.parse(res.getContentText()).resultList?.result?.[0];
          if (item?.abstractText) fetched = item.abstractText.replace(/\s+/g,' ').trim();
        }
      } catch (e) { Logger.log('Europe PMC row ' + (i+1) + ': ' + e.message); }
    }

    if (!fetched) fetched = fetchSemanticScholarAbstract_(doi);

    if (fetched) {
      sheet.getRange(i + 1, absCol + 1).setValue(fetched);
      filled++;
    }
    Utilities.sleep(150);
  }

  SpreadsheetApp.getUi().alert(`✅ Done. Abstracts filled: ${filled}. Already had one: ${skipped}.`);
}

// ── Generate missing insights ─────────────────────────────────
function generateMissingInsights() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { SpreadsheetApp.getUi().alert('Reading List sheet not found.'); return; }
  if (!getGroqKey_()) { SpreadsheetApp.getUi().alert('No Groq key set.'); return; }

  const data = sheet.getDataRange().getValues();
  const h    = data[0].map(x => String(x).trim().toLowerCase());
  const doiCol   = h.indexOf('doi');
  const titleCol = h.indexOf('title');
  const noteCol  = h.indexOf('note');
  const absCol   = h.indexOf('abstract');
  if (doiCol === -1 || noteCol === -1) { SpreadsheetApp.getUi().alert('Run migration first.'); return; }

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const doi  = String(data[i][doiCol]  || '').trim();
    const note = String(data[i][noteCol] || '').trim();
    if (!doi || note) continue;

    const title    = String(data[i][titleCol] || '').trim();
    const abstract = absCol !== -1 ? String(data[i][absCol] || '').trim() : '';
    const insight  = generateInsight_(title, abstract);
    if (insight) { sheet.getRange(i+1, noteCol+1).setValue(insight); count++; }
    Utilities.sleep(200);
  }

  SpreadsheetApp.getUi().alert(`✅ Generated insights for ${count} entries.`);
}

function generateInsight_(title, abstract) {
  if (!title) return '';
  const context = abstract ? `Abstract: ${abstract}\n\n` : '';
  const prompt =
    `You write sharp, opinionated research notes — 2 sentences, plain prose, no bold, no asterisks.\n\n` +
    `Examples:\n` +
    `"An Australian online parenting program for adolescent school refusal. Interesting because parents found it acceptable — but attendance didn't actually improve, raising questions about whether parent-only approaches are sufficient."\n` +
    `"Foundational clinical review that established the integrative models still referenced today. Worth reading as baseline — but the framing has shifted considerably since."\n` +
    `"Feasibility study of VR exposure for school anxiety. Early-stage, limited generalisability, but a useful marker of where digital intervention design is heading."\n\n` +
    `Now write a note in exactly this style for:\nPaper: "${title}"\n${context}` +
    `2 sentences only. No formatting. Start with what's notable, end with why it matters or what it raises.`;
  return callGroq_(prompt, 100, 0.5) || '';
}

// ── Sheet → JSON ──────────────────────────────────────────────
function normalizeDoi_(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .toLowerCase();
}

function sheetToJson_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found.`);

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const h    = data[0].map(x => String(x).trim().toLowerCase());
  const col  = name => h.indexOf(name);
  const doiCol = col('doi');
  if (doiCol === -1) throw new Error('Missing "DOI" column.');
  const seenDois = new Set();

  return data.slice(1).reduce((acc, row) => {
    const doi = normalizeDoi_(row[doiCol]);
    if (!doi) return acc;
    if (seenDois.has(doi)) return acc;
    seenDois.add(doi);

    const get  = name => col(name) !== -1 ? String(row[col(name)] || '').trim() : '';
    const clean = val => decodeHtml_(val);
    const entry = { doi };
    if (get('title'))    entry.title    = clean(get('title'));
    if (get('authors'))  entry.authors  = get('authors');
    if (get('year'))     entry.year     = get('year');
    const journal = get('journal') || get('journal / source');
    if (journal)         entry.journal  = clean(journal);
    if (get('abstract')) entry.abstract = clean(get('abstract'));
    if (get('note'))     entry.note     = get('note');

    const rawTags = col('tag 1') !== -1
      ? ['tag 1','tag 2','tag 3'].map(n => get(n)).filter(Boolean)
      : col('tags') !== -1 ? get('tags').split(',').map(t => t.trim()).filter(Boolean) : [];
    const tidy = tidyTagList_(rawTags.concat([get('study type')]), [get('theme 1'), get('theme 2')]);
    if (tidy.themes.length) entry.themes = tidy.themes;
    if (tidy.topics.length) entry.tags = tidy.topics;
    if (tidy.studyType) entry.studyType = tidy.studyType;

    acc.push(entry);
    return acc;
  }, []);
}

// ── GitHub sync ───────────────────────────────────────────────
function getCurrentSha_(token) {
  const res = UrlFetchApp.fetch(
    `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.FILE_PATH}?ref=${CONFIG.GITHUB_BRANCH}`,
    { method: 'GET',
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
      muteHttpExceptions: true });
  const code = res.getResponseCode();
  if (code === 200) return JSON.parse(res.getContentText()).sha;
  if (code === 404) {
    throw new Error(
      `GitHub could not find ${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}:${CONFIG.GITHUB_BRANCH}/${CONFIG.FILE_PATH}. ` +
      'Check the owner, repository, branch, and file path.'
    );
  }
  if (code === 401) throw new Error('GitHub rejected the token (401). Re-enter the token using “1. Set GitHub token”.');
  if (code === 403) throw new Error('GitHub denied repository access (403). The token needs Contents: Read and write permission.');
  let message = res.getContentText();
  try { message = JSON.parse(message).message || message; } catch (_) {}
  throw new Error(`Could not read ${CONFIG.FILE_PATH} from GitHub (${code}): ${message}`);
}

function syncReadingList() {
  const ui = SpreadsheetApp.getUi();
  try {
    const token   = getToken_();
    const entries = sheetToJson_();
    if (!entries.length) throw new Error('No reading-list entries found in the sheet.');

    let sha = getCurrentSha_(token);
    for (let attempt = 0; attempt < 2; attempt++) {
      const payload = {
        message: CONFIG.COMMIT_MSG,
        content: Utilities.base64Encode(JSON.stringify(entries, null, 2) + '\n', Utilities.Charset.UTF_8),
        branch: CONFIG.GITHUB_BRANCH,
        ...(sha ? { sha } : {})
      };
      const res = UrlFetchApp.fetch(
        `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.FILE_PATH}`,
        { method: 'PUT', contentType: 'application/json',
          headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' },
          payload: JSON.stringify(payload), muteHttpExceptions: true });
      const code = res.getResponseCode();
      if (code === 200 || code === 201) {
        ui.alert('✅ Synced!', `${entries.length} entries pushed. Site rebuilds in ~2 minutes.`, ui.ButtonSet.OK);
        return;
      }
      let message = res.getContentText();
      try { message = JSON.parse(message).message || message; } catch (_) {}
      if ((code === 409 || code === 422) && attempt === 0) {
        sha = getCurrentSha_(token);
        continue;
      }
      throw new Error(`GitHub API ${code}: ${message}`);
    }
  } catch (e) {
    ui.alert('❌ Sync failed', e.message, ui.ButtonSet.OK);
  }
}
