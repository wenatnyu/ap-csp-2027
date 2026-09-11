const PRESETS=__PRESETS__;
const $=s=>document.querySelector(s);
let session=null;
const format=CSPProgramming.format;
function cells(row,values){for(const value of values){const td=document.createElement('td');td.textContent=String(value);row.append(td);}return row;}
function render(){
  $('#output').textContent=session?.outputs.length?session.outputs.map(String).join('\n'):'No output yet.';
  $('#variables').replaceChildren();
  for(const [key,value] of Object.entries(session?.vars||{}))$('#variables').append(cells(document.createElement('tr'),[key,format(value)]));
  $('#empty-vars').hidden=Boolean(Object.keys(session?.vars||{}).length);
  const last=session?.trace.at(-1);
  $('#last-step').textContent=last?'Line '+last.line+' · '+last.effect:'Predict the path first.';
  $('#next-step').textContent=session?.error?'Review the error and reset.':session?.done?'End of program.':session?'Line '+session.next.line+' · '+session.next.code:'Press Step to begin.';
  $('#progress-text').textContent=session?session.steps+' steps · '+session.inputPosition+'/'+session.inputs.length+' inputs used · '+session.drawPosition+' random draws':'0 steps';
  $('#last-step').className=last?.condition===true?'state true':last?.condition===false?'state false':'state';
  $('#trace').replaceChildren();
  for(const item of (session?.trace||[]).slice(-120)){
    const extra=[item.inputs.length?'INPUT: '+item.inputs.map(format).join(', '):'',item.draws.length?'RANDOM: '+item.draws.map(x=>x.value+' in ['+x.a+', '+x.b+']').join('; '):''].filter(Boolean).join(' · ');
    $('#trace').append(cells(document.createElement('tr'),[item.step,item.line,item.code,item.effect+(extra?' · '+extra:''),Object.entries(item.variables).map(([k,v])=>k+'='+format(v)).join('; ')]));
  }
  $('#trace-count').textContent=session?.trace.length>120?'Showing the latest 120 of '+session.trace.length+' steps. Save the work record for the full trace.':'Each row is an executed statement or a condition check. Skipped statements do not produce rows.';
  $('#step').disabled=Boolean(session?.done);$('#run').disabled=Boolean(session?.done);
  if(session){$('#status').textContent=session.error||(session.done?'Finished. Compare the output and path with your prediction.':'Paused. Read the next line before stepping.');$('#status').classList.toggle('error',Boolean(session.error));}
}
function reset(){session=null;$('#status').textContent='Ready. Write a prediction before running.';$('#status').classList.remove('error');render();}
function start(){if(!session){try{session=new CSPProgramming.Program($('#program').value,$('#inputs').value,{replay:$('#random-mode').value==='replay',draws:$('#draws').value});}catch(e){$('#status').textContent='Syntax / input error · '+e.message;$('#status').classList.add('error');return false;}}return true;}
function loadExample(){const preset=PRESETS.find(x=>x.id===$('#example').value)||PRESETS[0];$('#program').value=preset.code;$('#inputs').value=preset.inputs;$('#draws').value=preset.draws||'';$('#activity').textContent=preset.prompt;$('#random-mode').value='sample';$('#replay-box').hidden=true;history.replaceState(null,'','#'+preset.id);reset();}
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#example').replaceChildren(...PRESETS.map(x=>{const option=document.createElement('option');option.value=x.id;option.textContent=x.title;return option;}));
const selected=location.hash.slice(1);if(PRESETS.some(x=>x.id===selected))$('#example').value=selected;
$('#load').onclick=loadExample;
$('#step').onclick=()=>{if(start()){session.step();render();}};
$('#run').onclick=()=>{if(start()){session.run();render();}};
$('#reset').onclick=reset;
for(const selector of ['#program','#inputs','#draws'])$(selector).addEventListener('input',reset);
$('#random-mode').onchange=()=>{$('#replay-box').hidden=$('#random-mode').value!=='replay';reset();};
$('#save-code').onclick=()=>download('my-chapter-3-program.txt',$('#program').value+'\n','text/plain');
$('#save-work').onclick=()=>download('chapter-3-work-record.json',JSON.stringify({chapter:3,example:$('#example').value,code:$('#program').value,inputs:$('#inputs').value,randomMode:$('#random-mode').value,replayDraws:$('#draws').value,prediction:$('#prediction').value,reflection:$('#reflection').value,outputs:session?.outputs||[],trace:session?.trace||[],error:session?.error||null},null,2),'application/json');
loadExample();
