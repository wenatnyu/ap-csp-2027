/* Behavioral checks for the private Create journal. Run: node scripts/verify_create.cjs */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('./create-journal-core.js');
let checks = 0;
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
const truth = (value, label) => { assert.ok(value, label); checks++; };
const rejects = (fn, label) => { assert.throws(fn, label); checks++; };
const clone = value => JSON.parse(JSON.stringify(value));
const edit = fn => { const value = M.empty(); fn(value); return value; };

equal(M.empty().sessions.map(s => s.id), ['C01','C02','C03','C04','C05','C06'], 'An empty journal contains the six distinct sessions');
equal(M.totals(M.empty()), {plannedClassMinutes:540, recordedClassMinutes:0, outsideMinutes:0, sessionsWithRecords:0}, 'No automatic credit for planned lessons');
const first = M.empty();
first.sessions[0].work = 'Only this copy';
equal(M.empty().sessions[0].work, '', 'New journals do not share session objects');

// Different row orders must preserve the evidence associated with each ID.
const dated = edit(j => j.sessions.forEach((s,i) => Object.assign(s, {
  date:`2027-03-${String(i+1).padStart(2,'0')}`, classMinutes:(i+1)*10,
  outsideMinutes:i+1, work:`Session ${i+1} evidence`, status:'recorded'
})));
function* permutations(a) {
  if (!a.length) { yield []; return; }
  for (let i=0;i<a.length;i++) for (const tail of permutations(a.filter((_,n)=>n!==i))) yield [a[i],...tail];
}
for (const rows of permutations(dated.sessions)) {
  const value = {...dated, sessions:rows};
  const before = JSON.stringify(value);
  equal(M.validate(value).sessions, dated.sessions, 'Import restores canonical order without swapping evidence');
  equal(JSON.stringify(value), before, 'Validation does not mutate the imported object');
}
for (const rows of [[], dated.sessions.slice(0,5), [...dated.sessions, dated.sessions[0]],
  [...dated.sessions.slice(0,5), dated.sessions[0]], [...dated.sessions.slice(0,5), {...dated.sessions[5],id:'C07'}]]) {
  rejects(()=>M.validate({...dated,sessions:rows}), 'Missing, duplicate, unknown or extra session IDs are rejected');
}

// Calendar checks include Gregorian leap-year rules and strict storage syntax.
for (const date of ['', '0001-01-01', '1900-02-28', '2000-02-29', '2024-02-29',
  '2026-09-13', '2027-04-30', '9999-12-31']) {
  equal(M.validate(edit(j=>j.sessions[0].date=date)).sessions[0].date,date,'Valid dates round-trip');
}
for (const date of ['0000-01-01','1900-02-29','2100-02-29','2026-02-29','2027-02-30',
  '2027-04-31','2027-00-01','2027-13-01','2027-01-00','2027-01-32',
  '2027-4-01','27-04-01','2027/04/01','2027-04-01T00:00:00Z',' 2027-04-01',
  '2027-04-01 ',null,1,{},[]]) {
  rejects(()=>M.validate(edit(j=>j.sessions[0].date=date)), 'Malformed or impossible dates cannot be imported');
}

const numericFields = [
  ...M.IDS.flatMap((id,i)=>['classMinutes','outsideMinutes'].map(field=>({label:`${id}.${field}`,set:(j,v)=>j.sessions[i][field]=v}))),
  {label:'extraClassMinutes',set:(j,v)=>j.extraClassMinutes=v}
];
for (const field of numericFields) {
  for (const minutes of [0,1,89,90,540,1439,1440]) {
    const value = edit(j=>field.set(j,minutes));
    equal(M.validate(value),value,`${field.label}: inclusive whole-minute boundaries`);
  }
  for (const bad of [-1,1441,0.5,90.1,NaN,Infinity,-Infinity,'0','90','',null,true,{},[]]) {
    rejects(()=>M.validate(edit(j=>field.set(j,bad))),`${field.label}: no coercion or fractional/out-of-range minutes`);
  }
}
equal(M.totals(dated), {plannedClassMinutes:540,recordedClassMinutes:210,outsideMinutes:21,sessionsWithRecords:6}, 'Hand-calculated classroom and outside totals stay separate');
const outsideOnly = edit(j=>j.sessions.forEach(s=>s.outsideMinutes=90));
equal(M.totals(outsideOnly), {plannedClassMinutes:540,recordedClassMinutes:0,outsideMinutes:540,sessionsWithRecords:6}, 'Nine outside hours do not count toward classroom work');
equal(M.totals(edit(j=>j.extraClassMinutes=45)).recordedClassMinutes,45,'Additional classroom time counts once');
const extended = clone(dated); extended.extraClassMinutes=45;
equal(M.totals(extended).recordedClassMinutes,255,'Additional time is added to actual recorded classroom time');
equal(M.totals(extended).outsideMinutes,21,'Additional classroom time does not alter outside time');
equal(M.totals(edit(j=>j.sessions.forEach(s=>s.classMinutes=100))).recordedClassMinutes,600,'Actual work is not silently capped at the 540-minute plan');
equal(M.totals(edit(j=>j.sessions.forEach(s=>s.status='recorded'))).recordedClassMinutes,0,'Status alone cannot grant classroom minutes');

const texts = [
  {label:'extraNote',set:(j,v)=>j.extraNote=v},
  ...M.IDS.flatMap((id,i)=>['work','evidence','next'].map(field=>({label:`${id}.${field}`,set:(j,v)=>j.sessions[i][field]=v})))
];
const payload = '</textarea><img src=x onerror="globalThis.compromised=true"><script>globalThis.compromised=true</script>';
for (const field of texts) {
  for (const value of ['', '来源与修改\n版本 v2\t<not markup>',payload,'x'.repeat(20000)]) {
    const journal=edit(j=>field.set(j,value));
    equal(M.validate(journal),journal,`${field.label}: text and length boundary survive unchanged`);
  }
  for (const value of ['x'.repeat(20001),null,42,true,{},[]]) {
    rejects(()=>M.validate(edit(j=>field.set(j,value))),`${field.label}: overlong or nontext notes are rejected`);
  }
}
for (const status of M.STATUSES) equal(M.validate(edit(j=>j.sessions[0].status=status)).sessions[0].status,status,'Known statuses round-trip');
for (const status of ['final','approved','',0,null,{},[]]) rejects(()=>M.validate(edit(j=>j.sessions[0].status=status)),'Unsupported status cannot imply official approval');
for (const field of ['date','classMinutes','outsideMinutes','status','work','evidence','next']) {
  const value=edit(j=>delete j.sessions[0][field]);
  rejects(()=>M.validate(value),'Missing required session data is rejected');
}
for (const value of [null,false,0,'journal',[],{}, {format:M.FORMAT},
  {...M.empty(),format:'another-version'}, {...M.empty(),sessions:{}},
  edit(j=>j.sessions[0]=null), edit(j=>j.sessions[0]=[]),edit(j=>delete j.extraNote),edit(j=>delete j.extraClassMinutes)]) {
  rejects(()=>M.validate(value),'Wrong JSON shape/version cannot replace a valid journal');
}
const injected=JSON.parse(JSON.stringify(M.empty()).replace('"extraNote":""','"extraNote":"","__proto__":{"polluted":true},"unknown":"ignored"'));
injected.sessions[0].untrusted={script:payload};
equal(M.validate(injected),M.empty(),'Unknown keys and prototype-like JSON data are discarded by the field projection');
equal({}.polluted,undefined,'Import validation never changes object prototypes');
const normalized=M.validate(dated); normalized.sessions[0].work='different';
equal(dated.sessions[0].work,'Session 1 evidence','Validated output has independent session objects');

// Run the real UI in a minimal DOM/storage harness. This is an event/transaction
// test, not a browser-layout substitute. HTML-writing sinks deliberately throw.
const uiSource=fs.readFileSync(path.join(__dirname,'create-journal-ui.js'),'utf8');
const KEY='apcsp-create-journal-v1';
function harness(saved=null,{storageReadFails=false,storageWriteFails=false,hash='#C01'}={}) {
  const elements=new Map(), controls=[], writes=[], downloads=[], blobs=[];
  const store=new Map(saved===null?[]:[[KEY,saved]]);
  class Element {
    constructor(id,type='text') { this.id=id;this.type=type;this._value='';this.textContent='';this.events={};this.hidden=false;this.attrs={};this.classes=new Set();this.classList={toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)}; }
    set value(v) { this._value=String(v); } get value() { return this._value; }
    set innerHTML(_) { throw Error('Unsafe HTML sink reached'); }
    set outerHTML(_) { throw Error('Unsafe HTML sink reached'); }
    insertAdjacentHTML() { throw Error('Unsafe HTML sink reached'); }
    addEventListener(type,fn) { (this.events[type]??=[]).push(fn); }
    async fire(type,event={target:this}) { for (const fn of this.events[type]||[]) await fn(event); }
    checkValidity() { const v=Number(this.value);return this.type!=='number'||(this.value!==''&&Number.isFinite(v)&&Number.isInteger(v)&&v>=0&&v<=1440); }
    setAttribute(k,v) { this.attrs[k]=v; } removeAttribute(k) { delete this.attrs[k]; }
    click() { downloads.push({href:this.href,download:this.download}); }
  }
  function add(id,type,control=false) { const el=new Element(id,type);elements.set(id,el);if(control)controls.push(el);return el; }
  for (const id of M.IDS) {
    add('session-'+id);add('nav-'+id);
    for (const key of ['date','classMinutes','outsideMinutes','status','work','evidence','next']) add(id+'-'+key,key.endsWith('Minutes')?'number':key==='date'?'date':'text',true);
  }
  add('extra-minutes','number',true);add('extra-note','text',true);
  for (const id of ['save-status','m-class','m-outside','m-sessions','export-journal','import-journal']) add(id);
  const context={CSPCreateJournal:M,location:{hash},addEventListener(){},
    document:{getElementById:id=>{assert.ok(elements.has(id),`Known DOM ID ${id}`);return elements.get(id);},querySelectorAll:()=>controls,createElement:tag=>{assert.equal(tag,'a');return new Element('download');}},
    localStorage:{getItem:k=>{if(storageReadFails)throw Error('Storage inaccessible');return store.get(k)??null;},setItem:(k,v)=>{if(storageWriteFails)throw Error('Storage full');store.set(k,v);writes.push(v);}},
    Blob,URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:test-'+blobs.length;},revokeObjectURL(){}},setTimeout:fn=>fn()};
  context.window=context;
  vm.runInNewContext(uiSource,context,{filename:'create-journal-ui.js',timeout:1000});
  return {elements,controls,store,writes,downloads,blobs,context,
    snapshot:()=>controls.map(el=>[el.id,el.value]),
    async input(id,value){const el=elements.get(id);el.value=value;await el.fire('input');},
    async importText(text,{size=Buffer.byteLength(text),readError=false}={}){const el=elements.get('import-journal');el.value='chosen.json';el.files=[{size,text:async()=>{if(readError)throw Error('Cannot read file');return text;}}];await el.fire('change');},
    async export(){await elements.get('export-journal').fire('click');}
  };
}

async function uiChecks() {
  const original=JSON.stringify(dated);
  const app=harness(original);
  equal(app.elements.get('C01-work').value,'Session 1 evidence','Saved journal restores actual evidence');
  equal(app.elements.get('m-class').textContent,'210 min','UI displays classroom total');
  equal(app.elements.get('m-outside').textContent,'21 min','UI displays outside total separately');
  equal(app.writes.length,0,'Loading does not silently overwrite stored data');
  const before=app.snapshot();
  for (const bad of ['{','null','[]','{"format":"wrong"}',JSON.stringify(edit(j=>j.sessions[0].classMinutes='90')),
    JSON.stringify(edit(j=>j.sessions[0].date='2027-02-30')),JSON.stringify(edit(j=>j.sessions[0].next=null)),
    JSON.stringify(edit(j=>j.sessions[5].id='C01'))]) {
    await app.importText(bad);
    equal(app.snapshot(),before,'Failed parse/validation leaves visible records intact');
    equal(app.store.get(KEY),original,'Failed import does not overwrite the saved journal');
    equal(app.elements.get('import-journal').value,'','File picker resets after failed import');
    truth(app.elements.get('save-status').classes.has('error'),'Failure is visibly reported');
  }
  for (const settings of [{size:2000001},{readError:true}]) {
    await app.importText(JSON.stringify(M.empty()),settings);
    equal(app.snapshot(),before,'Oversized or unreadable file leaves records intact');
    equal(app.store.get(KEY),original,'Oversized or unreadable import preserves storage');
  }
  // Pending invalid form edits also survive a failed import.
  await app.input('C01-classMinutes','90.5');
  const unsaved=app.snapshot();
  await app.importText('not JSON');
  equal(app.snapshot(),unsaved,'Invalid import does not erase an unsaved field edit');
  equal(app.store.get(KEY),original,'Invalid edit is not coerced into a saved number');
  await app.export();
  equal(app.downloads.length,0,'Invalid form cannot export a misleading backup');
  await app.input('C01-classMinutes','10');
  await app.input('C01-outsideMinutes','500');
  equal(app.elements.get('m-class').textContent,'210 min','Changing outside minutes never adds classroom credit');
  equal(app.elements.get('m-outside').textContent,'520 min','Outside minutes are summed only in their own metric');

  const replacement=edit(j=>{j.extraClassMinutes=30;j.extraNote=payload;j.sessions.reverse();j.sessions[0].work=payload;j.sessions[0].classMinutes=90;});
  await app.importText(JSON.stringify(replacement),{size:2000000});
  equal(app.elements.get('C06-work').value,payload,'Imported markup remains literal textarea text');
  equal(app.elements.get('extra-note').value,payload,'Additional-note markup is also literal');
  equal(app.context.compromised,undefined,'Imported notes never execute JavaScript');
  equal(app.elements.get('m-class').textContent,'120 min','Successful import commits replacement and recomputes totals');
  equal(JSON.parse(app.store.get(KEY)),M.validate(replacement),'Successful import stores canonical sanitized data');
  await app.export();
  truth(app.downloads[0].href.startsWith('blob:'),'Backup download uses a generated local blob URL');
  equal(JSON.parse(await app.blobs[0].text()),M.validate(replacement),'Export preserves the current validated journal');
  const reopened=harness(await app.blobs[0].text());
  equal(reopened.snapshot(),app.snapshot(),'Exported journal restores the same complete form');

  const blocked=harness(null,{storageWriteFails:true});
  await blocked.importText(JSON.stringify(dated));
  equal(blocked.elements.get('C01-work').value,'Session 1 evidence','Storage failure preserves imported records in memory');
  truth(blocked.elements.get('save-status').textContent.includes('导出备份'),'Storage failure explains how to retain a backup');
  await blocked.export();
  equal(JSON.parse(await blocked.blobs[0].text()),dated,'Export remains usable when localStorage cannot save');
  const corrupt=harness('{bad saved JSON');
  equal(corrupt.elements.get('m-class').textContent,'0 min','Corrupt saved data starts a clean in-memory view');
  equal(corrupt.store.get(KEY),'{bad saved JSON','Failed restore does not immediately destroy old storage');
  truth(corrupt.elements.get('save-status').classes.has('error'),'Corrupt saved data is reported');
  const noStorage=harness(null,{storageReadFails:true});
  equal(noStorage.elements.get('C01-work').value,'','Storage read failure still allows a usable blank form');
  const unknownHash=harness(null,{hash:'#<img onerror=alert(1)>'});
  equal(unknownHash.elements.get('session-C01').hidden,false,'Unknown URL hash selects a known session');
  equal(unknownHash.elements.get('session-C02').hidden,true,'Unknown hash does not create extra content');
  console.log(`Create journal: ${checks} behavioral checks passed (model + UI event/storage harness).`);
}
uiChecks().catch(error=>{console.error(error);process.exitCode=1;});
