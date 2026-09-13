/* Behavioral checks for the original review quiz. Run: node scripts/verify_review.cjs */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '../review/questions.json'), 'utf8'));
const M = require('./review-core.js').make(bank);
const KEY = 'apcsp-review-v1';
const clone = value => JSON.parse(JSON.stringify(value));
let checks = 0;
const failures = [];
function check(label, fn) {
  checks++;
  try { fn(); } catch (error) { failures.push(label + ': ' + error.message); }
}
const eq = (a, b, label) => check(label, () => assert.deepEqual(a, b));
const ok = (a, label) => check(label, () => assert.ok(a));
const reject = (fn, label) => check(label, () => assert.throws(fn));
const edit = fn => { const state = M.empty(); fn(state); return state; };
const first = bank.sets[0], single = bank.questions.find(q => q.answer.length === 1);
const double = bank.questions.find(q => q.answer.length === 2);

// Score every possible subset, including blanks and partial two-answer selections.
for (const set of bank.sets) {
  const fresh = M.freshSet(set.id), initial = M.grade(set.id, fresh);
  eq(initial.correct, 0, set.id + ': no automatic credit on a fresh attempt');
  eq(initial.unanswered, set.questionIds.length, set.id + ': all unanswered questions counted');
  eq(initial.total, set.questionIds.length, set.id + ': total comes only from this set');
  const allCorrect = M.freshSet(set.id);
  for (const id of set.questionIds) {
    const q = bank.questions.find(q => q.id === id);
    for (const index of [...q.answer].reverse()) M.select(allCorrect, id, index, true);
    for (let mask = 0; mask < 16; mask++) {
      const selected = [0, 1, 2, 3].filter(i => mask & (1 << i));
      const rec = M.freshSet(set.id);
      rec.answers[id] = selected;
      const row = M.grade(set.id, rec).rows.find(row => row.id === id);
      const expected = selected.length === q.answer.length && q.answer.every(i => selected.includes(i));
      eq(row.correct, expected, id + ': exact-set score for subset ' + mask);
      eq(row.blank, selected.length === 0, id + ': blank differs from partial selection ' + mask);
    }
  }
  eq(M.grade(set.id, allCorrect).correct, set.questionIds.length, set.id + ': full correct answer set');
  eq(M.grade(set.id, allCorrect).unanswered, 0, set.id + ': complete answer set has no blanks');
  eq(Object.values(M.grade(set.id, allCorrect).byTopic).reduce((n, t) => n + t.total, 0), set.questionIds.length, set.id + ': topic denominators cover this set exactly');
}
let rec = M.freshSet(first.id);
M.select(rec, single.id, 0, true); M.select(rec, single.id, 2, true);
eq(rec.answers[single.id], [2], 'A second radio selection replaces the first');
M.select(rec, single.id, 2, false);
eq(rec.answers[single.id], [], 'Unchecking a selected option leaves a blank answer');
M.select(rec, double.id, 3, true); M.select(rec, double.id, 1, true);
eq(rec.answers[double.id], [1, 3], 'Checkbox choices are stored canonically');
eq(M.select(rec, double.id, 2, true), false, 'A third checked option is rejected');
eq(rec.answers[double.id], [1, 3], 'Rejected third choice preserves the existing two');
M.select(rec, double.id, 3, false); M.select(rec, double.id, 2, true);
eq(rec.answers[double.id], [1, 2], 'Unchecking makes room for a replacement choice');
for (const index of [-1, 4, 1.5, '1', null, NaN]) reject(() => M.select(rec, single.id, index, true), 'Invalid option index rejected: ' + index);
reject(() => M.select(rec, 'Q999', 0, true), 'Unknown question rejected');
rec.submitted = true;
reject(() => M.select(rec, single.id, 0, true), 'Submitted attempts are locked');
reject(() => M.freshSet('unknown'), 'Unknown question set rejected');
reject(() => M.grade('unknown', rec), 'Unknown grading set rejected');

// Stored data is validated before restoration; answers are copied, not aliased.
const full = M.empty();
for (const set of bank.sets) for (const id of set.questionIds) {
  full.sets[set.id].answers[id] = [...bank.questions.find(q => q.id === id).answer].reverse();
}
const before = JSON.stringify(full), normalized = M.normalize(full);
eq(JSON.stringify(full), before, 'Normalization does not mutate the input record');
for (const set of bank.sets) eq(M.grade(set.id, normalized.sets[set.id]).correct, set.questionIds.length, 'Restored correct choices score correctly in ' + set.id);
normalized.sets[first.id].answers[single.id].push(3);
eq(JSON.stringify(full), before, 'Normalized selections do not alias stored arrays');
for (const raw of [null, false, [], {}, {format:'other'}, {...M.empty(), format:'other'}, {...M.empty(), sets:null}]) reject(() => M.normalize(raw), 'Malformed record/version rejected');
for (const value of [undefined, null, [], 'yes', 1]) reject(() => M.normalize(edit(s => s.sets[first.id].submitted = value)), 'Submitted status must be Boolean');
for (const value of [undefined, null, [], 'answers', 2]) reject(() => M.normalize(edit(s => s.sets[first.id].answers = value)), 'Answers must be an object');
for (const value of [-1, Infinity, NaN, '1000', null, first.minutes * 60000 + 1]) reject(() => M.normalize(edit(s => s.sets[first.id].remainingMs = value)), 'Invalid remaining time rejected: ' + value);
for (const value of [-1, 1.5, Infinity, NaN, '123', undefined]) reject(() => M.normalize(edit(s => s.sets[first.id].deadline = value)), 'Invalid running deadline rejected: ' + value);
for (const value of [null, 1, '1', {}, [-1], [4], [0.5], ['0'], [true], [0, 0], [0, 1]]) reject(() => M.normalize(edit(s => s.sets[first.id].answers[single.id] = value)), 'Malformed single-answer selection rejected');
for (const value of [[0, 1, 2], [0, 0], [2, 8]]) reject(() => M.normalize(edit(s => s.sets[first.id].answers[double.id] = value)), 'Malformed two-answer selection rejected');
reject(() => M.normalize(edit(s => s.sets[first.id].answers.Q999 = [0])), 'Unknown stored question rejected');
reject(() => M.normalize(edit(s => s.sets[first.id].answers[bank.sets[1].questionIds[0]] = [0])), 'Cross-set stored answer rejected');
reject(() => M.normalize(edit(s => delete s.sets[first.id])), 'Missing stored set rejected');
const extension = edit(s => { s.unknown = 'ignored'; s.sets[first.id].unknown = 'ignored'; });
eq(M.normalize(extension), M.empty(), 'Unknown nonsemantic record fields are not imported');

// Time uses elapsed milliseconds, and expiration never submits an attempt.
rec = M.freshSet(first.id);
const allotted = first.minutes * 60000;
M.start(rec, 1000000);
eq(M.remaining(rec, 1001500), allotted - 1500, 'Running clock subtracts actual elapsed time');
M.start(rec, 1001600);
eq(M.remaining(rec, 1002000), allotted - 2000, 'Repeated start cannot reset a running clock');
M.pause(rec, 1002500);
eq(rec.deadline, null, 'Pause clears the running deadline');
eq(M.remaining(rec, 9000000), allotted - 2500, 'Paused clock does not consume time');
M.start(rec, 9000000);
eq(M.remaining(rec, 9000500), allotted - 3000, 'Resume retains time already used');
eq(M.remaining(rec, 8000000), allotted - 2500, 'Backward wall clock does not add more than stored time');
M.pause(rec, 9000000 + allotted);
eq(rec.remainingMs, 0, 'Expired clock clamps at zero');
eq(rec.submitted, false, 'Expiration does not submit automatically');
M.start(rec, 99999999);
eq(rec.deadline, null, 'An expired timer does not restart itself');
rec = M.freshSet(first.id); rec.submitted = true; M.start(rec, 1000);
eq(rec.deadline, null, 'A submitted attempt cannot start its timer');
const isolated = M.empty(), otherBefore = clone(isolated.sets[bank.sets[1].id]);
M.select(isolated.sets[first.id], single.id, 2, true); M.start(isolated.sets[first.id], 1000);
eq(isolated.sets[bank.sets[1].id], otherBefore, 'Answer and clock mutations do not change another set');
eq(M.empty().sets[first.id].answers, {}, 'Fresh states do not share mutable answers');

// Minimal DOM harness: run the real browser scripts, simulate events and storage.
// This exercises state transactions and UI warnings, not visual browser layout.
function harness({saved = null, now = 2000000, hash = '#diagnostic', readFails = false, writeFails = false} = {}) {
  const elements = new Map(), events = new Map(), intervals = [], blobs = [], downloads = [];
  const store = new Map(saved === null ? [] : [[KEY, saved]]), writes = [];
  const control = {now, readFails, writeFails};
  function unregister(node) { if (elements.get(node.id) === node) elements.delete(node.id); for (const c of node.children) unregister(c); }
  class Element {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this._text = ''; this._id = ''; this.attrs = {}; this.events = {}; this.hidden = false; this.disabled = false; this.checked = false; this.classes = new Set(); this.classList = {toggle:(name, on) => on ? this.classes.add(name) : this.classes.delete(name)}; }
    set id(value) { if (elements.get(this._id) === this) elements.delete(this._id); this._id = value; if (value) elements.set(value, this); }
    get id() { return this._id; }
    set textContent(value) { for (const c of this.children) unregister(c); this.children = []; this._text = String(value); }
    get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
    set innerHTML(value) { throw Error('Unexpected HTML-writing sink'); }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { for (const c of this.children) unregister(c); this.children = []; this._text = ''; this.append(...nodes); }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    removeAttribute(name) { delete this.attrs[name]; }
    addEventListener(type, fn) { (this.events[type] ??= []).push(fn); }
    fire(type) { if (this.disabled) return; for (const fn of this.events[type] || []) fn({target:this}); }
    click() { if (this.tagName === 'A' && this.download) downloads.push({href:this.href, download:this.download}); this.fire('click'); }
    scrollIntoView() { this.scrolled = true; }
  }
  for (const id of ['question-data','quiz-status','clock','start-clock','pause-clock','time-note','results','set-title','set-info','questions','finish','restart-panel','restart','cancel-restart','confirm-restart','export-report',...bank.sets.map(s => 'tab-' + s.id)]) {
    const el = new Element('div'); el.id = id;
  }
  elements.get('question-data').textContent = JSON.stringify(bank);
  class TestDate extends Date { static now() { return control.now; } }
  const context = {
    Date:TestDate, location:{hash},
    document:{getElementById:id => { if (!elements.has(id)) throw Error('Missing DOM element: ' + id); return elements.get(id); }, createElement:tag => new Element(tag), createTextNode:text => { const el = new Element('#text'); el.textContent = text; return el; }},
    localStorage:{getItem:key => { if (control.readFails) throw Error('Storage denied'); return store.get(key) ?? null; }, setItem:(key, value) => { if (control.writeFails) throw Error('Storage full'); store.set(key, value); writes.push(value); }},
    Blob, URL:{createObjectURL:blob => { blobs.push(blob); return 'blob:review-' + blobs.length; }, revokeObjectURL(){}},
    setTimeout:fn => fn(), setInterval:fn => { intervals.push(fn); return intervals.length; },
    addEventListener:(type, fn) => { if (!events.has(type)) events.set(type, []); events.get(type).push(fn); }
  };
  context.window = context;
  vm.createContext(context);
  for (const file of ['review-core.js','review-ui.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context, {filename:file, timeout:3000});
  const fire = type => { for (const fn of events.get(type) || []) fn(); };
  return {elements, control, store, writes, blobs, downloads,
    get:id => elements.get(id), click:id => elements.get(id).click(),
    choose(id, index, checked = true) { const input = elements.get(id + '-' + index); if (input.disabled) return; if (input.type === 'radio' && checked) for (const node of elements.values()) if (node.tagName === 'INPUT' && node.name === id) node.checked = false; input.checked = checked; input.fire('change'); },
    advance(ms) { control.now += ms; for (const fn of intervals) fn(); },
    navigate(id) { context.location.hash = '#' + id; fire('hashchange'); },
    pagehide() { fire('pagehide'); },
    stored() { return JSON.parse(store.get(KEY)); }
  };
}
async function uiChecks() {
  const app = harness();
  eq(app.get('clock').textContent, '18:00', 'UI begins with the diagnostic time allocation');
  ok(app.get('results').hidden, 'Results are hidden before submission');
  eq(app.writes.length, 0, 'Opening the page does not immediately overwrite storage');
  ok(!app.get('questions').textContent.includes('Answer:'), 'Initial question cards do not reveal answers');
  app.choose(single.id, 0); app.choose(single.id, 2);
  eq(app.stored().sets.diagnostic.answers[single.id], [2], 'Radio changes persist only the latest choice');
  app.choose(double.id, 0); app.choose(double.id, 1); app.choose(double.id, 2);
  eq(app.get(double.id + '-2').checked, false, 'Rejected third checkbox is visually unchecked');
  eq(app.stored().sets.diagnostic.answers[double.id], [0, 1], 'Rejected third checkbox does not corrupt saved choices');
  ok(app.get('quiz-status').classes.has('error'), 'Selection-limit warning is visible');
  app.choose(double.id, 1, false); app.choose(double.id, 2);
  eq(app.stored().sets.diagnostic.answers[double.id], [0, 2], 'Checkbox replacement persists correctly');
  app.click('start-clock'); app.advance(1500);
  eq(app.get('clock').textContent, '17:59', 'UI rounds remaining seconds up for display');
  app.click('pause-clock'); const paused = app.stored().sets.diagnostic.remainingMs;
  app.advance(5000); eq(app.get('clock').textContent, '17:59', 'UI does not tick while paused');
  app.click('start-clock'); app.advance(500); app.navigate('algorithms');
  eq(app.stored().sets.diagnostic.remainingMs, paused - 500, 'Switching sets pauses elapsed time in the old set');
  eq(app.stored().sets.diagnostic.deadline, null, 'The old set has no active timer after navigation');
  eq(app.get('clock').textContent, '20:00', 'Another set starts with its own allocation');
  app.choose('Q11', 1); app.click('start-clock'); app.advance(2000); app.navigate('diagnostic');
  eq(app.get(single.id + '-2').checked, true, 'Returning to a set restores its selected radio option');
  const other = clone(app.stored().sets.algorithms);
  app.click('restart'); ok(!app.get('restart-panel').hidden, 'Restart first opens a confirmation panel');
  app.click('cancel-restart'); ok(app.get('restart-panel').hidden, 'Cancel closes the panel');
  eq(app.stored().sets.diagnostic.answers[single.id], [2], 'Cancelled restart preserves answers');
  app.click('restart'); app.click('confirm-restart');
  eq(app.stored().sets.diagnostic, M.freshSet('diagnostic'), 'Confirmed restart resets only the selected attempt');
  eq(app.stored().sets.algorithms, other, 'Restart preserves another set’s answers and elapsed time');
  app.click('start-clock'); app.advance(18 * 60000 + 1);
  ok(app.get('time-note').textContent.includes('不会自动交卷'), 'Expiry explicitly states that submission is manual');
  eq(app.stored().sets.diagnostic.submitted, false, 'Expiry leaves the attempt unsubmitted');
  eq(app.get('finish').disabled, false, 'The student can still finish after time expires');
  app.choose(single.id, single.answer[0]);
  eq(app.stored().sets.diagnostic.answers[single.id], single.answer, 'Answers remain editable after time expiry');
  app.click('finish');
  ok(!app.get('results').hidden, 'Manual submission reveals results');
  eq(app.stored().sets.diagnostic.submitted, true, 'Manual submission is saved');
  ok(app.get(single.id + '-0').disabled, 'Submitted inputs are disabled');
  ok(app.get('questions').textContent.includes('Answer:'), 'Submission reveals per-question explanations');
  ok(app.get('results').textContent.includes('1 / 10'), 'One answered correct question scores one with nine blanks');
  app.choose(single.id, (single.answer[0] + 1) % 4);
  eq(app.stored().sets.diagnostic.answers[single.id], single.answer, 'Disabled submitted inputs cannot change the record');
  app.click('export-report');
  const report = await app.blobs.at(-1).text();
  ok(report.includes('Correct: 1/10'), 'Export includes a completed set’s result');
  ok(report.includes('In progress; answers not graded'), 'Export does not grade other unfinished sets');
  ok(!report.includes('Q11 AAP:'), 'Export does not reveal answers for an unfinished set');
  eq(app.downloads.at(-1).download, 'AP_CSP_Review_Report.txt', 'Export uses a plain-text review filename');

  const restored = harness({saved:app.store.get(KEY), now:app.control.now});
  ok(restored.get('quiz-status').textContent.includes('已恢复'), 'Valid local records show a restore notice');
  ok(!restored.get('results').hidden, 'A submitted result survives a reload');
  restored.navigate('algorithms');
  ok(restored.get('Q11-1').checked, 'Unsubmitted choices also survive reload');
  ok(restored.get('pause-clock').disabled, 'Restoration pauses all timers');
  restored.click('start-clock'); restored.advance(1700); restored.pagehide();
  eq(restored.stored().sets.algorithms.deadline, null, 'Leaving the page saves a paused timer');

  for (const saved of ['{', 'null', '[]', '{"format":"unknown"}', JSON.stringify(edit(s => s.sets.diagnostic.answers.Q11 = [0]))]) {
    const damaged = harness({saved});
    ok(damaged.get('quiz-status').classes.has('error'), 'Invalid saved data shows an error instead of silently restoring');
    ok(damaged.get('results').hidden, 'Invalid saved data opens an unsubmitted attempt');
    eq(damaged.writes.length, 0, 'Invalid saved data is not overwritten merely by loading');
    eq(damaged.store.get(KEY), saved, 'Original invalid storage is retained until an actual user action');
  }
  const running = M.empty(); M.start(running.sets.diagnostic, 3000000);
  const runningReload = harness({saved:JSON.stringify(running), now:3007000});
  eq(runningReload.get('clock').textContent, '17:53', 'Reload deducts elapsed time from a previously running saved clock');
  ok(runningReload.get('pause-clock').disabled, 'Reload leaves a previously running timer paused');
  runningReload.advance(10000);
  eq(runningReload.get('clock').textContent, '17:53', 'A restored timer does not resume without the student starting it');
  const unknownHash = harness({hash:'#nonexistent'});
  eq(unknownHash.get('set-title').textContent, first.title, 'An unknown hash falls back to the first supported set');

  const denied = harness({readFails:true});
  ok(denied.get('quiz-status').textContent.includes('未能读取'), 'Storage read failure is explicitly reported');
  for (const action of ['select','start','pause','finish','restart']) {
    const failed = harness();
    if (action === 'pause') failed.click('start-clock');
    failed.control.writeFails = true;
    if (action === 'select') failed.choose(single.id, 0);
    if (action === 'start') failed.click('start-clock');
    if (action === 'pause') failed.click('pause-clock');
    if (action === 'finish') failed.click('finish');
    if (action === 'restart') { failed.click('restart'); failed.click('confirm-restart'); }
    ok(failed.get('quiz-status').classes.has('error') && failed.get('quiz-status').textContent.includes('无法保存'), action + ': failed storage must remain visibly reported after the action');
  }
}
uiChecks().then(() => {
  if (failures.length) { console.error(failures.map((s, i) => (i + 1) + '. ' + s).join('\n')); console.error(`${failures.length} failures / ${checks} behavioral checks`); process.exitCode = 1; }
  else console.log(`Review behavioral checks passed: ${checks}`);
}).catch(error => { console.error(error.stack); process.exitCode = 1; });
