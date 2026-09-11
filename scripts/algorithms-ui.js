(function(){'use strict';
const $=id=>document.getElementById(id),A=CSPAlgorithms,M=CSPAlgorithmModels;
const presets={lists:[['Insert, remove, copy','Predict both lists after the edits. Which index changes after REMOVE?',`scores ← [10, 20, 30]
backup ← scores
INSERT(scores, 2, 15)
REMOVE(scores, 1)
APPEND(scores, 40)
DISPLAY(scores)
DISPLAY(backup)`],['Build an empty list','Why does APPEND work when there is no existing position?',`items ← []
APPEND(items, 7)
APPEND(items, 9)
items[1] ← 8
DISPLAY(LENGTH(items))
DISPLAY(items)`]],traversal:[['Sum and filter','Predict the sum and the new list. Duplicate values are separate elements.',`minutes ← [20, 30, 30, 10]
total ← 0
selected ← []
FOR EACH value IN minutes
{
  total ← total + value
  IF(value >= 30)
  {
    APPEND(selected, value)
  }
}
DISPLAY(total)
DISPLAY(selected)`]],procedures:[['Parameters and return','Predict the two results. Watch local values when each call begins.',`PROCEDURE addBonus(score, bonus)
{
  result ← score + bonus
  RETURN(result)
}
first ← addBonus(20, 5)
second ← addBonus(20, 10)
DISPLAY(first)
DISPLAY(second)`]],project:[['Study Session Analyzer · starter','Replace the TODO section. Test the returned count before explaining the feedback.',`PROCEDURE countGoals(sessions, goal)
{
  // TODO: count sessions whose minutes are at least goal
  RETURN(0)
}
sessions ← [20, 30, 45, 10]
count ← countGoals(sessions, 30)
DISPLAY(count)
IF(count >= 2)
{
  DISPLAY("On track")
}
ELSE
{
  DISPLAY("Try again")
}`]]};
const robotPresets={path:`REPEAT 3 TIMES
{
  MOVE_FORWARD()
}
ROTATE_LEFT()
REPEAT 3 TIMES
{
  MOVE_FORWARD()
}`,check:`IF(CAN_MOVE(forward))
{
  MOVE_FORWARD()
}
IF(CAN_MOVE(left))
{
  ROTATE_LEFT()
  MOVE_FORWARD()
}`,blocked:`MOVE_FORWARD()
ROTATE_LEFT()
MOVE_FORWARD()`};
let category='',program=null,robot=null,searchState=null;
function setText(id,value){$(id).textContent=value;}
function status(id,value,error=false){setText(id,value);$(id).classList.toggle('error',error);}
function cellRow(tbody,values){const row=document.createElement('tr');values.forEach(value=>{const cell=document.createElement('td');cell.textContent=String(value);row.append(cell);});tbody.append(row);}
function download(name,text,type='text/plain'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function valuesText(values){return Object.entries(values).map(([k,v])=>k+' = '+A.format(v)).join('; ')||'No variables yet';}
function drawLists(values){$('a-lists').replaceChildren();Object.entries(values).filter(([,v])=>Array.isArray(v)).forEach(([name,list])=>{const h=document.createElement('h3');h.textContent=name+' · '+list.length+' elements';const row=document.createElement('div');row.className='list-row';if(!list.length)row.textContent='[ ] · empty list';list.forEach((v,i)=>{const cell=document.createElement('div');cell.className='list-cell';const at=document.createElement('small');at.textContent='index '+(i+1);const value=document.createElement('b');value.textContent=A.format(v);cell.append(at,value);row.append(cell);});$('a-lists').append(h,row);});}
function renderProgram(){const p=program,last=p?.trace.at(-1);status('a-status',p?.error||(!p?'Ready · predict, then step.':p.done?'Program complete · '+p.steps+' visible steps.':'Paused · '+p.steps+' visible steps.'),Boolean(p?.error));setText('a-last',last?.effect||'No statement executed yet.');setText('a-next',p?.next&&!p.done?'Next source line '+p.next.line+': '+p.next.code:'');setText('a-scope','Call stack: '+(p?.callStack.join(' → ')||'main'));setText('a-output',p?.outputs.map(v=>typeof v==='string'?v:A.format(v)).join('\n')||'');$('a-vars').replaceChildren();Object.entries(p?.vars||{}).forEach(([k,v])=>cellRow($('a-vars'),[k,A.format(v)]));drawLists(p?.vars||{});$('a-trace').replaceChildren();(p?.trace||[]).slice(-120).forEach(row=>cellRow($('a-trace'),[row.step+' / '+row.line,row.scope,row.code,row.effect,valuesText(row.variables)]));}
function execute(all){try{program ||= new A.Program($('a-code').value,$('a-inputs').value);all?program.run():program.step();renderProgram();}catch(e){status('a-status',e.message,true);}}
function resetProgram(){program=null;renderProgram();}
function loadExample(){const example=presets[category][Number($('a-example').value)||0];$('a-code').value=example[2];$('a-inputs').value='';setText('a-activity',example[1]);resetProgram();}
$('a-load').onclick=loadExample;$('a-step').onclick=()=>execute(false);$('a-run').onclick=()=>execute(true);$('a-reset').onclick=resetProgram;['a-code','a-inputs'].forEach(id=>$(id).addEventListener('input',resetProgram));$('a-save').onclick=()=>download('AP_CSP_Chapter4_'+category+'.txt',$('a-code').value);$('a-record').onclick=()=>download('AP_CSP_Chapter4_Work_Record.json',JSON.stringify({workspace:category,code:$('a-code').value,inputs:$('a-inputs').value,prediction:$('a-prediction').value,explanation:$('a-reflection').value,output:program?.outputs||[],trace:program?.trace||[],error:program?.error||null},null,2),'application/json');
function loadSearch(){try{const raw=$('s-values').value.split(',');if(raw.some(x=>!x.trim())||!$('s-target').value.trim())throw Error('Enter a number in every list position and a numeric target.');const values=raw.map(Number),target=Number($('s-target').value),steps=M.search(values,target,$('s-mode').value);searchState={values,target,steps,cursor:0};renderSearch();}catch(e){searchState=null;status('s-status',e.message,true);$('s-list').replaceChildren();$('s-log').replaceChildren();['s-count','s-range','s-result'].forEach(id=>setText(id,'—'));}}
function renderSearch(){const s=searchState;if(!s)return;const last=s.steps[s.cursor-1],range=last?.after||[1,s.values.length],done=Boolean(last?.done);status('s-status',last?(last.found?'Found target at position '+last.index:done?'No matching element.':'Inspected '+last.value+' at position '+last.index):'Ready · predict the first inspected element.');setText('s-count',s.cursor);setText('s-range',done?'Search complete':range[0]+'–'+range[1]);setText('s-result',last?.found?'Index '+last.index:done?'Not found':'Searching');$('s-list').replaceChildren();s.values.forEach((v,i)=>{const div=document.createElement('div');div.className='list-cell'+(last?.found&&last.index===i+1?' found':last?.index===i+1?' current':i+1<range[0]||i+1>range[1]?' discarded':'');const small=document.createElement('small');small.textContent='index '+(i+1);const b=document.createElement('b');b.textContent=v;div.append(small,b);$('s-list').append(div);});$('s-log').replaceChildren();s.steps.slice(0,s.cursor).forEach(step=>{const li=document.createElement('li');li.textContent='Inspect index '+step.index+' → '+step.value+(step.found?' · match':step.done?' · no candidates remain':' · next interval '+step.after.join('–'));$('s-log').append(li);});$('s-step').disabled=done;$('s-run').disabled=done;}
$('s-reset').onclick=loadSearch;$('s-step').onclick=()=>{if(!searchState)loadSearch();if(searchState){searchState.cursor=Math.min(searchState.cursor+1,searchState.steps.length);renderSearch();}};$('s-run').onclick=()=>{if(!searchState)loadSearch();if(searchState){searchState.cursor=searchState.steps.length;renderSearch();}};['s-values','s-target','s-mode'].forEach(id=>$(id).addEventListener('input',()=>{searchState=null;$('s-step').disabled=false;$('s-run').disabled=false;status('s-status','Inputs changed · load/reset or inspect to start a new search.');}));
function renderRobot(){const r=robot?.robot||A.DEFAULT_ROBOT;let svg='<svg viewBox="0 0 360 360" role="img" aria-label="Robot grid, row '+r.row+', column '+r.col+', facing '+['north','east','south','west'][r.direction]+'">';for(let row=1;row<=5;row++)for(let col=1;col<=5;col++){const wall=r.walls.some(w=>w[0]===row&&w[1]===col),goal=r.goal[0]===row&&r.goal[1]===col,x=35+(col-1)*60,y=35+(row-1)*60;svg+='<rect x="'+x+'" y="'+y+'" width="60" height="60" fill="'+(wall?'#34495d':goal?'#c9e9ce':'#f1f5f7')+'" stroke="#aabcc8"/>';if(goal)svg+='<text x="'+(x+30)+'" y="'+(y+18)+'" text-anchor="middle" font-size="12">GOAL</text>';}for(let n=1;n<=5;n++)svg+='<text x="20" y="'+(70+(n-1)*60)+'" text-anchor="middle">'+n+'</text><text x="'+(65+(n-1)*60)+'" y="23" text-anchor="middle">'+n+'</text>';svg+='<g transform="translate('+(65+(r.col-1)*60)+' '+(65+(r.row-1)*60)+') rotate('+(r.direction*90)+')"><path d="M0 -20 L17 17 L0 9 L-17 17 Z" fill="#225a83" stroke="white" stroke-width="2"/></g></svg>';$('r-grid').innerHTML=svg;const last=robot?.trace.at(-1);status('r-status',robot?.error||('Row '+r.row+', column '+r.col+', facing '+['N','E','S','W'][r.direction]+(robot?.done?' · program complete':robot?' · paused':' · ready')),Boolean(robot?.error));setText('r-last',last?.effect||'Predict the final square and direction.');setText('r-next',robot?.next&&!robot.done?'Next line '+robot.next.line+': '+robot.next.code:'');$('r-trace').replaceChildren();(robot?.trace||[]).slice(-120).forEach(step=>cellRow($('r-trace'),[step.step+' / '+step.line,step.code,step.effect]));}
function resetRobot(){robot=null;renderRobot();}function runRobot(all){try{robot ||=new A.Program($('r-code').value,'',{robot:true});all?robot.run():robot.step();renderRobot();}catch(e){status('r-status',e.message,true);}}$('r-load').onclick=()=>{$('r-code').value=robotPresets[$('r-example').value];resetRobot();};$('r-step').onclick=()=>runRobot(false);$('r-run').onclick=()=>runRobot(true);$('r-reset').onclick=resetRobot;$('r-code').oninput=resetRobot;$('r-save').onclick=()=>download('AP_CSP_Robot_Algorithm.txt',$('r-code').value);
function efficiency(){const n=Number($('e-size').value),rows=M.growth(n);setText('e-label',n);$('e-table').replaceChildren();let svg='<text x="150" y="23" font-size="14">Steps · logarithmic axis</text>';[0,3,6,9,12,15,18].forEach(power=>{const x=150+power/19*520;svg+='<line x1="'+x+'" y1="45" x2="'+x+'" y2="213" stroke="#dae2e8"/><text x="'+x+'" y="233" text-anchor="middle" font-size="12">10^'+power+'</text>';});rows.forEach((r,i)=>{cellRow($('e-table'),[r.name,r.steps<1e12?r.steps.toLocaleString('en-US'):r.steps.toExponential(6),r.seconds<1?r.seconds.toFixed(6)+' seconds':r.seconds.toLocaleString('en-US',{maximumFractionDigits:2})+' seconds']);const width=Math.max(2,Math.log10(r.steps)/19*520),y=60+i*55;svg+='<text x="110" y="'+(y+20)+'" text-anchor="end" font-size="18">'+r.name+'</text><rect x="150" y="'+y+'" width="'+width+'" height="28" rx="4" fill="'+['#225a83','#28766f','#ae742a'][i]+'"/>';});$('e-chart').innerHTML=svg;}$('e-size').oninput=efficiency;
const drafts={};function route(){const hash=location.hash.slice(1),key=[...Object.keys(presets),'search','robot','efficiency'].includes(hash)?hash:'lists';document.querySelectorAll('.tabs a').forEach(a=>{if(a.hash==='#'+key)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});['program','search','robot','efficiency'].forEach(panel=>$('workspace-'+panel).hidden=panel!==(presets[key]?'program':key));if(presets[key]&&category!==key){if(category)drafts[category]={code:$('a-code').value,inputs:$('a-inputs').value,prediction:$('a-prediction').value,reflection:$('a-reflection').value,choice:$('a-example').value};category=key;$('a-example').replaceChildren();presets[key].forEach((p,i)=>{const option=document.createElement('option');option.value=i;option.textContent=p[0];$('a-example').append(option);});if(drafts[key]){const d=drafts[key];$('a-code').value=d.code;$('a-inputs').value=d.inputs;$('a-prediction').value=d.prediction;$('a-reflection').value=d.reflection;$('a-example').value=d.choice;setText('a-activity',presets[key][Number(d.choice)][1]);resetProgram();}else{$('a-prediction').value='';$('a-reflection').value='';loadExample();}}}
window.addEventListener('hashchange',route);$('r-load').click();loadSearch();efficiency();route();
})();
