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
  COMMIT_MSG:         'Update reading list from Google Sheet',
  GITHUB_API_VERSION: '2022-11-28'
};

const DEFAULT_TAGS = [
  'EBSA', 'Intervention', 'Neurodiversity', 'Parent', 'Digital',
  'Autism', 'CBT', 'Systematic review', 'Scoping review', 'Meta-analysis',
  'RCT', 'Qualitative', 'Methods', 'Risk of bias', 'Measurement',
  'Conceptual', 'Review', 'Foundational', 'Definitions',
  'School staff', 'Student voice', 'Family coaching',
  'Anxiety', 'Mental health', 'Psychopathology', 'Comorbidity',
  'Re-engagement', 'Transition', 'Rehabilitation',
  'Systems model', 'Systems framework', 'Network analysis',
  'AI', 'Creativity', 'Machine learning',
  'VR', 'Mindfulness', 'DBT', 'Pharmacology',
  'Parent experience', 'Gender', 'Inclusion', 'Bullying',
  'Behavioural addiction', 'Chronic absenteeism', 'ACEs',
  'Feasibility', 'Individual differences', 'Treatment outcomes',
  'Education outcomes', 'Education system', 'Multifamily therapy',
  'Practitioner review', 'Clinical review', 'Developmental'
];

const TAG_KEYWORDS = {
  'EBSA':                ['ebsa','school refusal','school avoidance','school attendance','absenteeism','emotionally based'],
  'Intervention':        ['intervention','treatment','program','programme','therapy','trial','randomised','randomized'],
  'Autism':              ['autis','ASD','asperger','neurodev'],
  'Neurodiversity':      ['neurodiverse','neurodiversity','ADHD','dyslexia'],
  'CBT':                 ['CBT','cognitive behav'],
  'Parent':              ['parent','family','caregiver','mother','father'],
  'Digital':             ['online','digital','app','internet','telehealth','web-based','coach-supported'],
  'VR':                  ['virtual reality','VR','immersive'],
  'Mindfulness':         ['mindfulness','yoga','meditation'],
  'DBT':                 ['DBT','dialectical'],
  'Pharmacology':        ['fluoxetine','medication','pharmacol','drug'],
  'Systematic review':   ['systematic review'],
  'Scoping review':      ['scoping review'],
  'Meta-analysis':       ['meta-analy'],
  'RCT':                 ['randomis','randomiz','controlled trial'],
  'Qualitative':         ['qualitative','thematic','grounded theory','lived experience'],
  'Methods':             ['SWiM','ROBINS','RoB','risk of bias','synthesis','narrative synthesis'],
  'Measurement':         ['outcome measure','assessment','scale','instrument','SRAS'],
  'Anxiety':             ['anxiety','anxious','worry','fear'],
  'Mental health':       ['mental health','psychiatr','psychological'],
  'Conceptual':          ['conceptual','theoretical','framework','taxonomy','definition'],
  'Review':              ['review','synthesis','overview'],
  'Foundational':        ['foundational','historical','classic','early','1990','1991','1992','1993','1994','1995','1996','1997','1998','1999','2000','2001','2002','2003'],
  'School staff':        ['teacher','staff','school-based','educator'],
  'Student voice':       ['student','young person','youth','adolescent voice','lived'],
  'Systems model':       ['system','multi-disciplin','coordinated','home.school','clinic'],
  'Multifamily therapy': ['multifamily','multi-family'],
  'Re-engagement':       ['re-engag','reintegrat','return to school'],
  'Transition':          ['transition','moving','secondary school'],
  'Developmental':       ['developmental','trajector','lifespan'],
  'Network analysis':    ['network analysis','comorbid network'],
  'AI':                  ['artificial intelligence',' AI ','machine learning','language model'],
  'Comorbidity':         ['comorbid','co-occur'],
  'Bullying':            ['bully','victimis','victimiz','peer'],
  'Gender':              ['girl','gender','female','sex difference'],
};

// ── Menu ─────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📚 Reading List')
    .addItem('Sync to website now', 'syncReadingList')
    .addItem('Generate missing insights', 'generateMissingInsights')
    .addSeparator()
    .addItem('1. Set up sheets & tags (first time)', 'setupSheets')
    .addItem('2. Migrate existing data (first time)', 'migrateExistingData')
    .addItem('3. Install APA trigger (first time)', 'setupTrigger')
    .addItem('Set Groq API key', 'promptForApiKey')
    .addSeparator()
    .addItem('Set GitHub token', 'promptForToken')
    .addToUi();
}

// ── Token & key management ────────────────────────────────────
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
  if (!token) throw new Error('No GitHub token found. Use the menu to set it first.');
  return token;
}

function promptForApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt('Groq API key', 'Paste your key from console.groq.com', ui.ButtonSet.OK_CANCEL);
  if (result.getSelectedButton() !== ui.Button.OK) return;
  PropertiesService.getUserProperties().setProperty('GROQ_KEY', result.getResponseText().trim());
  ui.alert('✅ Key saved.');
}

// ── First-time setup ──────────────────────────────────────────
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let tagsSheet = ss.getSheetByName(CONFIG.TAGS_SHEET_NAME);
  if (!tagsSheet) tagsSheet = ss.insertSheet(CONFIG.TAGS_SHEET_NAME);
  tagsSheet.clearContents();
  tagsSheet.getRange(1, 1).setValue('Tag').setFontWeight('bold');
  tagsSheet.getRange(2, 1, DEFAULT_TAGS.length, 1).setValues(DEFAULT_TAGS.map(t => [t]));

  let apaSheet = ss.getSheetByName(CONFIG.APA_SHEET_NAME);
  if (!apaSheet) apaSheet = ss.insertSheet(CONFIG.APA_SHEET_NAME);
  apaSheet.clearContents();
  apaSheet.getRange('A1').setValue('Paste APA, DOI, PMID, or title here').setFontWeight('bold');
  apaSheet.getRange('B1').setValue('Status').setFontWeight('bold');
  apaSheet.setColumnWidth(1, 600);
  apaSheet.setColumnWidth(2, 180);

  SpreadsheetApp.getUi().alert('✅ Sheets created. Run "Migrate existing data" next.');
}

// Tag columns are 6, 7, 8 (1-indexed) in new layout:
// DOI | Title | Authors | Year | Journal | Tag 1 | Tag 2 | Tag 3 | Note
function applyTagValidation_(rlSheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tagsSheet = ss.getSheetByName(CONFIG.TAGS_SHEET_NAME);
  if (!tagsSheet) return;
  const lastRow = Math.max(rlSheet.getLastRow(), 2);
  const tagsRange = tagsSheet.getRange(2, 1, DEFAULT_TAGS.length + 50, 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(tagsRange, true)
    .setAllowInvalid(true)
    .build();
  for (let col = 6; col <= 8; col++) {
    rlSheet.getRange(2, col, lastRow - 1, 1).setDataValidation(rule);
  }
}

// ── Migration (one-time) ──────────────────────────────────────
function migrateExistingData() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Migrate existing data',
    'Restructures Reading List to new columns (adds Authors, Year, Journal, Abstract) and fetches from CrossRef. Existing notes are preserved. Continue?',
    ui.ButtonSet.OK_CANCEL
  );
  if (confirm !== ui.Button.OK) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { ui.alert('Reading List sheet not found.'); return; }

  const data = sheet.getDataRange().getValues();
  const h = data[0].map(x => String(x).trim().toLowerCase());
  const doiCol     = h.indexOf('doi');
  const titleCol   = h.indexOf('title');
  const authCol    = h.indexOf('authors');
  const yearCol    = h.indexOf('year');
  const journalCol = h.indexOf('journal');
  const tag1Col    = h.indexOf('tag 1');
  const tag2Col    = h.indexOf('tag 2');
  const tag3Col    = h.indexOf('tag 3');
  const tagsCol    = h.indexOf('tags');
  const noteCol    = h.indexOf('note');
  const absCol     = h.indexOf('abstract');
  if (doiCol === -1) { ui.alert('No DOI column found.'); return; }

  // DOI | Title | Authors | Year | Journal | Tag 1 | Tag 2 | Tag 3 | Note | Abstract
  const newData = [['DOI', 'Title', 'Authors', 'Year', 'Journal', 'Tag 1', 'Tag 2', 'Tag 3', 'Note', 'Abstract']];

  for (let i = 1; i < data.length; i++) {
    const doi = String(data[i][doiCol] || '').trim();
    if (!doi) continue;

    let title    = titleCol   !== -1 ? String(data[i][titleCol]   || '').trim() : '';
    let authors  = authCol    !== -1 ? String(data[i][authCol]    || '').trim() : '';
    let year     = yearCol    !== -1 ? String(data[i][yearCol]    || '').trim() : '';
    let journal  = journalCol !== -1 ? String(data[i][journalCol] || '').trim() : '';
    let abstract = absCol     !== -1 ? String(data[i][absCol]     || '').trim() : '';

    if (!title || !authors || !abstract) {
      const meta = fetchMetaFromCrossRef_(doi);
      if (!title)    title    = meta.title    || '';
      if (!authors)  authors  = meta.authors  || '';
      if (!year)     year     = meta.year ? String(meta.year) : '';
      if (!journal)  journal  = meta.journal  || '';
      if (!abstract) abstract = meta.abstract || '';
      Utilities.sleep(200);
    }

    let tags = [];
    if (tag1Col !== -1) {
      tags = [tag1Col, tag2Col, tag3Col].filter(c => c !== -1).map(c => String(data[i][c] || '').trim()).filter(Boolean);
    } else if (tagsCol !== -1) {
      tags = String(data[i][tagsCol] || '').split(',').map(t => t.trim()).filter(Boolean);
    }

    const note = noteCol !== -1 ? String(data[i][noteCol] || '').trim() : '';
    newData.push([doi, title, authors, year, journal, tags[0] || '', tags[1] || '', tags[2] || '', note, abstract]);
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
  ScriptApp.newTrigger('onApaEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
  SpreadsheetApp.getUi().alert('✅ APA auto-process trigger installed.');
}

// ── APA auto-process (installable trigger) ────────────────────
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

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rlSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!rlSheet) { statusCell.setValue('⚠️ Reading List sheet not found'); return; }

  const existing = rlSheet.getDataRange().getValues();
  const doiColIdx = existing[0].map(h => String(h).toLowerCase()).indexOf('doi');
  const isDuplicate = existing.slice(1).some(row => String(row[doiColIdx]).trim() === doi);
  if (isDuplicate) { statusCell.setValue('⚠️ Already in list'); return; }

  const meta = fetchMetaFromCrossRef_(doi);
  const suggested = suggestTags_(meta.title || input, meta.abstract);

  // Append row — note left blank, use "Generate missing insights" to fill
  rlSheet.appendRow([
    doi,
    meta.title    || '',
    meta.authors  || '',
    meta.year     ? String(meta.year) : '',
    meta.journal  || '',
    suggested[0]  || '',
    suggested[1]  || '',
    suggested[2]  || '',
    '',
    meta.abstract || ''
  ]);

  const newRow = rlSheet.getLastRow();
  const tagsSheet = ss.getSheetByName(CONFIG.TAGS_SHEET_NAME);
  if (tagsSheet) {
    const tagsRange = tagsSheet.getRange(2, 1, DEFAULT_TAGS.length + 50, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInRange(tagsRange, true)
      .setAllowInvalid(true)
      .build();
    for (let col = 6; col <= 8; col++) {
      rlSheet.getRange(newRow, col).setDataValidation(rule);
    }
  }

  statusCell.setValue('✅ Added — run "Generate missing insights" for note');
}

// ── Input resolver (DOI / PMID / title / full APA) ────────────
function resolveInput_(text) {
  // 1. DOI anywhere in the string (handles full APA references too)
  const doiMatch = text.match(/10\.\d{4,9}\/[^\s,;)\]"]+/);
  if (doiMatch) return doiMatch[0].replace(/[.,;)\]"]+$/, '');

  // 2. PMID — 7 or 8 digit number, optionally prefixed
  const pmidMatch = text.match(/^\s*(?:PMID:?\s*)?(\d{7,8})\s*$/i);
  if (pmidMatch) return lookupPmid_(pmidMatch[1]);

  // 3. Treat as title — fuzzy CrossRef search
  return searchByTitle_(text);
}

function lookupPmid_(pmid) {
  try {
    const res = UrlFetchApp.fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`,
      { muteHttpExceptions: true }
    );
    if (res.getResponseCode() !== 200) return null;
    const ids = JSON.parse(res.getContentText()).result?.[pmid]?.articleids || [];
    const doiEntry = ids.find(id => id.idtype === 'doi');
    return doiEntry ? doiEntry.value : null;
  } catch (e) {
    Logger.log('PMID lookup error: ' + e.message);
    return null;
  }
}

function searchByTitle_(title) {
  try {
    const res = UrlFetchApp.fetch(
      `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(title)}&rows=1&mailto=connorconkeymorrison@gmail.com`,
      { muteHttpExceptions: true }
    );
    if (res.getResponseCode() !== 200) return null;
    return JSON.parse(res.getContentText()).message?.items?.[0]?.DOI || null;
  } catch (e) {
    Logger.log('Title search error: ' + e.message);
    return null;
  }
}

// ── CrossRef lookup ───────────────────────────────────────────
function fetchMetaFromCrossRef_(doi) {
  try {
    const res = UrlFetchApp.fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}?mailto=connorconkeymorrison@gmail.com`,
      { muteHttpExceptions: true }
    );
    if (res.getResponseCode() !== 200) return {};
    const w = JSON.parse(res.getContentText()).message;

    const title = w.title?.[0] || '';

    const authorList = (w.author || []).slice(0, 3).map(a => {
      const last = a.family || '';
      const init = a.given ? a.given[0] + '.' : '';
      return init ? `${last}, ${init}` : last;
    });
    if ((w.author || []).length > 3) authorList.push('et al.');
    const authors = authorList.join(', ');

    const year    = w.published?.['date-parts']?.[0]?.[0] || '';
    const journal = w['container-title']?.[0] || '';
    const abstract = w.abstract ? w.abstract.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : '';

    return { title, authors, year, journal, abstract };
  } catch (e) {
    Logger.log('CrossRef error: ' + e.message);
    return {};
  }
}

// ── Tag suggester ─────────────────────────────────────────────
function suggestTags_(title, abstract) {
  const lower = (title + ' ' + (abstract || '')).toLowerCase();
  const matched = [];
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      matched.push(tag);
      if (matched.length === 3) break;
    }
  }
  return matched;
}

// ── Batch insight generator ───────────────────────────────────
function generateMissingInsights() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) { SpreadsheetApp.getUi().alert('Reading List sheet not found.'); return; }

  const data = sheet.getDataRange().getValues();
  const h = data[0].map(x => String(x).trim().toLowerCase());
  const doiCol   = h.indexOf('doi');
  const titleCol = h.indexOf('title');
  const noteCol  = h.indexOf('note');
  const absCol   = h.indexOf('abstract');
  if (doiCol === -1 || noteCol === -1) { SpreadsheetApp.getUi().alert('Missing columns. Run migration first.'); return; }

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const doi  = String(data[i][doiCol]  || '').trim();
    const note = String(data[i][noteCol] || '').trim();
    if (!doi || note) continue;

    const title    = titleCol !== -1 ? String(data[i][titleCol] || '').trim() : '';
    const abstract = absCol   !== -1 ? String(data[i][absCol]   || '').trim() : '';
    const insight  = generateInsight_(title, abstract);
    if (insight) {
      sheet.getRange(i + 1, noteCol + 1).setValue(insight);
      count++;
    }
    Utilities.sleep(200);
  }

  SpreadsheetApp.getUi().alert(`✅ Generated insights for ${count} entries.`);
}

// ── Insight generator (Groq / Llama) ─────────────────────────
function generateInsight_(title, abstract) {
  const key = PropertiesService.getUserProperties().getProperty('GROQ_KEY');
  if (!key || !title) return '';
  const context = abstract ? `Abstract: ${abstract}\n\n` : '';
  const prompt =
    `You write sharp, opinionated research notes — 2 sentences, plain prose, no bold, no asterisks, no bullet points.\n\n` +
    `Examples of the style:\n` +
    `"An Australian online parenting program for adolescent school refusal. Interesting because parents found it acceptable — but attendance didn't actually improve, raising questions about whether parent-only approaches are sufficient."\n` +
    `"Foundational clinical review that established the integrative models still referenced today. Worth reading as baseline — but the framing has shifted considerably since."\n` +
    `"Feasibility study of VR exposure for school anxiety. Early-stage, limited generalisability, but a useful marker of where digital intervention design is heading."\n\n` +
    `Now write a note in exactly this style for:\nPaper: "${title}"\n${context}` +
    `2 sentences only. No formatting. Start with what's notable, end with why it matters or what it raises.`;
  try {
    const res = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      payload: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.5
      }),
      muteHttpExceptions: true
    });
    return JSON.parse(res.getContentText()).choices?.[0]?.message?.content?.trim() || '';
  } catch (e) {
    return '';
  }
}

// ── Read sheet → JSON ─────────────────────────────────────────
function sheetToJson_() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found.`);

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const h          = data[0].map(x => String(x).trim().toLowerCase());
  const doiCol     = h.indexOf('doi');
  const titleCol   = h.indexOf('title');
  const authCol    = h.indexOf('authors');
  const yearCol    = h.indexOf('year');
  const journalCol = h.indexOf('journal');
  const tag1Col    = h.indexOf('tag 1');
  const tag2Col    = h.indexOf('tag 2');
  const tag3Col    = h.indexOf('tag 3');
  const tagsCol    = h.indexOf('tags');
  const noteCol    = h.indexOf('note');
  const absCol     = h.indexOf('abstract');
  if (doiCol === -1) throw new Error('Missing "DOI" column.');

  return data.slice(1).reduce((acc, row) => {
    const doi = String(row[doiCol] || '').trim();
    if (!doi) return acc;
    const entry = { doi };
    if (titleCol   !== -1 && row[titleCol])   entry.title    = String(row[titleCol]).trim();
    if (authCol    !== -1 && row[authCol])     entry.authors  = String(row[authCol]).trim();
    if (yearCol    !== -1 && row[yearCol])     entry.year     = String(row[yearCol]).trim();
    if (journalCol !== -1 && row[journalCol])  entry.journal  = String(row[journalCol]).trim();
    if (absCol     !== -1 && row[absCol])      entry.abstract = String(row[absCol]).trim();
    const tags = tag1Col !== -1
      ? [tag1Col, tag2Col, tag3Col].filter(c => c !== -1).map(c => String(row[c] || '').trim()).filter(Boolean)
      : tagsCol !== -1 ? String(row[tagsCol] || '').split(',').map(t => t.trim()).filter(Boolean) : [];
    if (tags.length) entry.tags = tags;
    if (noteCol !== -1 && row[noteCol]) entry.note = String(row[noteCol]).trim();
    acc.push(entry);
    return acc;
  }, []);
}

// ── GitHub helpers ────────────────────────────────────────────
function getCurrentSha_(token) {
  const res = UrlFetchApp.fetch(
    `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.FILE_PATH}?ref=${CONFIG.GITHUB_BRANCH}`,
    { method: 'GET', headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true }
  );
  return res.getResponseCode() === 200 ? JSON.parse(res.getContentText()).sha : null;
}

// ── Main sync ─────────────────────────────────────────────────
function syncReadingList() {
  const ui = SpreadsheetApp.getUi();
  try {
    const token   = getToken_();
    const entries = sheetToJson_();
    const content = JSON.stringify(entries, null, 2) + '\n';
    const sha     = getCurrentSha_(token);
    const payload = {
      message: CONFIG.COMMIT_MSG,
      content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
      branch:  CONFIG.GITHUB_BRANCH,
      ...(sha ? { sha } : {})
    };
    const res = UrlFetchApp.fetch(
      `https://api.github.com/repos/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/contents/${CONFIG.FILE_PATH}`,
      { method: 'PUT', contentType: 'application/json', headers: { Authorization: 'Bearer ' + token }, payload: JSON.stringify(payload), muteHttpExceptions: true }
    );
    const code = res.getResponseCode();
    if (code === 200 || code === 201) {
      ui.alert('✅ Synced!', `${entries.length} entries pushed. Site rebuilds in ~2 minutes.`, ui.ButtonSet.OK);
    } else {
      throw new Error(`GitHub API ${code}: ${JSON.parse(res.getContentText()).message}`);
    }
  } catch (e) {
    ui.alert('❌ Sync failed', e.message, ui.ButtonSet.OK);
  }
}

