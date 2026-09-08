const slides = __SLIDES__;
const exercises = __EXERCISES__;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = s => document.querySelector(s);
let index = 0, currentView = 'slides', notesVisible = false, bitValue = 0;
const reveals = new Map();
function fit() {
  const frame = $('.viewport');
  const scale = Math.min((frame.clientWidth - 34) / 1440, (frame.clientHeight - 28) / 810);
  $('#slide').style.transform = `translate(-50%,-50%) scale(${Math.max(.1,scale)})`;
}
function saveReveals() { reveals.set(index, [...$('#slide').querySelectorAll('details')].map(x => x.open)); }
function renderSlide() {
  const s = slides[index];
  $('#slide').className = 'slide' + (s.kind ? ' ' + s.kind : '');
  $('#slide').innerHTML = `<div class="eyebrow">${s.tag}</div>${s.kind === 'dark' ? '' : `<h2>${s.title}</h2>`}${s.html}<div class="foot"><span>AP CSP · ${s.code}</span><span>${s.time} &nbsp; / &nbsp; ${String(index+1).padStart(2,'0')}</span></div>`;
  $('#counter').textContent = `${index+1} / ${slides.length}`;
  $('#jump').value = index;
  $('#previous').disabled = index === 0;
  $('#next').disabled = index === slides.length-1;
  $('#progress').style.width = `${(index+1)/slides.length*100}%`;
  $('#note-text').textContent = s.note;
  $('#slide').querySelectorAll('details').forEach((d,i) => d.open = reveals.get(index)?.[i] || false);
  if ($('#bits')) renderBits();
  fit();
}
function updateHash() { history.replaceState(null,'',currentView === 'slides' ? `#slide-${index+1}` : `#${currentView}`); }
function go(n) { saveReveals(); index=Math.max(0,Math.min(slides.length-1,n)); renderSlide(); updateHash(); }
function setView(v) {
  currentView=v;
  for (const name of ['slides','homework','guide']) {
    $(`#${name}-view`).hidden = name !== v;
    const b=$(`[data-view="${name}"]`);
    b.classList.toggle('active',name === v);
    b.setAttribute('aria-pressed',String(name === v));
  }
  window.scrollTo(0,0);
  if(v === 'slides') fit();
  updateHash();
}
function renderBits() {
  const weights=[128,64,32,16,8,4,2,1];
  $('#bits').innerHTML=weights.map(w=>`<div><label>${w}</label><button data-weight="${w}" aria-label="Toggle bit with value ${w}" aria-pressed="${Boolean(bitValue&w)}">${bitValue&w ? 1 : 0}</button></div>`).join('');
  $('#bits').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
    bitValue ^= Number(b.dataset.weight); renderBits();
    $('#bit-message').textContent='Fixed-width model: eight bits, unsigned values 0–255.';
  }));
  $('#bit-value').textContent=`${bitValue.toString(2).padStart(8,'0')}₂ = ${bitValue}₁₀`;
  $('#bit-sum').textContent=`${weights.filter(w=>bitValue&w).join(' + ') || '0'} = ${bitValue}`;
  $('#reset-bits').onclick=()=>{bitValue=0;renderBits();$('#bit-message').textContent='Reset to zero. Predict a value, then set the bits.';};
  $('#increment-bits').onclick=()=>{
    if(bitValue===255) $('#bit-message').textContent='Overflow: 256 needs 9 bits. This model keeps 255 and reports the error.';
    else {bitValue++;renderBits();$('#bit-message').textContent='Added one. Which bits changed?';}
  };
  if(!$('#bit-message').textContent) $('#bit-message').textContent='Fixed-width model: eight bits, unsigned values 0–255.';
}
function formatValue(a) {
  if(Array.isArray(a)) return a.join(' and ');
  if(typeof a === 'object' && a !== null) return Object.entries(a).map(([k,v])=>`${k}: ${v}`).join('\n');
  return a;
}
function renderHomework() {
  $('#questions').innerHTML=exercises.questions.map(q=>`<article class="question" data-id="${q.id}"><div class="qhead"><b>${q.id}${q.type==='multi' ? ' · Select TWO' : ''}</b><span>${q.marks} ${q.marks===1?'mark':'marks'}</span></div><p>${esc(q.prompt)}</p>${q.options ? `<div class="hw-options">${q.options.map(o=>`<div><b>${esc(o.label)}.</b><span>${esc(o.text)}</span></div>`).join('')}</div>` : ''}<div class="working">${q.type==='written' ? Array.from({length:q.lines || 6},()=>'<div class="response-line"></div>').join('') : '<span class="sub">Answer: __________</span>'}</div><details><summary>Answer & explanation</summary><div class="hw-answer"><b>${esc(formatValue(q.answer))}</b><p>${esc(formatValue(q.explanation))}</p>${q.rubric ? `<ul>${q.rubric.map(x=>`<li>${esc(typeof x==='string' ? x : `${x.marks} mark: ${x.criterion}`)}</li>`).join('')}</ul>` : ''}</div></details></article>`).join('');
}
function toggleNotes() {
  notesVisible=!notesVisible;
  $('#notes').hidden=!notesVisible;
  $('#notes-toggle').setAttribute('aria-pressed',String(notesVisible));
}
$('#jump').innerHTML=slides.map((s,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} · ${s.title}</option>`).join('');
$('#jump').onchange=e=>go(Number(e.target.value));
$('#previous').onclick=()=>go(index-1);
$('#next').onclick=()=>go(index+1);
$('#notes-toggle').onclick=toggleNotes;
$('#reading-toggle').onclick=()=>{
  const state=document.body.classList.toggle('reading');
  $('#reading-toggle').setAttribute('aria-pressed',String(state));fit();
};
$('#fullscreen').onclick=async()=>{
  try {if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen();}
  catch {$('#fullscreen').textContent='Use browser fullscreen';}
};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
window.addEventListener('resize',fit);
document.addEventListener('keydown',e=>{
  if(currentView!=='slides'||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,select,textarea'))return;
  if(e.key.toLowerCase()==='n'){e.preventDefault();toggleNotes();return;}
  if(e.target.closest('button,summary,a'))return;
  if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();go(index+1);}
  if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();go(index-1);}
});
$('#all-answers').onclick=()=>{
  const ds=[...$('#questions').querySelectorAll('details')];
  const show=!ds.every(d=>d.open);ds.forEach(d=>d.open=show);
  $('#all-answers').textContent=show?'Hide all answers':'Show all answers';
};
let printRestore=[];
function printSheet(withAnswers) {
  const ds=[...$('#questions').querySelectorAll('details')];
  printRestore=ds.map(d=>d.open);
  document.body.classList.toggle('print-answers',withAnswers);
  if(withAnswers)ds.forEach(d=>d.open=true);
  window.print();
}
window.addEventListener('afterprint',()=>{
  document.body.classList.remove('print-answers');
  $('#questions').querySelectorAll('details').forEach((d,i)=>{if(i<printRestore.length)d.open=printRestore[i];});
  printRestore=[];
});
$('#print-student').onclick=()=>printSheet(false);
$('#print-key').onclick=()=>printSheet(true);
renderHomework();
const match=location.hash.match(/^#slide-(\d+)$/);
if(match)index=Math.max(0,Math.min(slides.length-1,Number(match[1])-1));
renderSlide();
if(location.hash==='#homework')setView('homework');
else if(location.hash==='#guide')setView('guide');
