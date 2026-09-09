const editor=document.querySelector('#program');
const inputBox=document.querySelector('#inputs');
const status=document.querySelector('#status');
let session=null;
const presets={
  starter:'tickets ← INPUT()\nprice ← 12\ntotal ← tickets * price\nDISPLAY(total)',
  fee:'tickets ← INPUT()\nprice ← 12\nfee ← 3\ntotal ← tickets * price + fee\nDISPLAY(total)',
  bug:'tickets ← INPUT()\nprice ← 12\nfee ← 3\ntotal ← tickets * (price + fee)\nDISPLAY(total)',
  trace:'a ← 4\nb ← a\na ← a + 3\nDISPLAY(b)\nDISPLAY(a)'
};
function render(){
  document.querySelector('#output').textContent=session?.outputs.length?session.outputs.map(String).join('\n'):'No output yet.';
  const variables=document.querySelector('#variables');variables.replaceChildren();
  for(const [name,value] of Object.entries(session?.vars||{})){
    const row=document.createElement('tr');for(const text of [name,String(value)]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}variables.append(row);
  }
  document.querySelector('#empty-vars').hidden=Boolean(Object.keys(session?.vars||{}).length);
  const trace=document.querySelector('#trace');trace.replaceChildren();
  for(const item of session?.trace||[]){const row=document.createElement('tr');for(const text of [item.line,item.code,item.effect,Object.entries(item.variables).map(([k,v])=>k+'='+JSON.stringify(v)).join('; ')]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}trace.append(row);}
  if(session){
    status.textContent=session.error||(session.done?'Finished. Compare the result with your prediction. '+(session.inputs.length-session.inputPosition)+' unused input value(s).':'Next: line '+session.lines[session.position].number+' — '+session.lines[session.position].text);
    status.classList.toggle('error',Boolean(session.error));
  }
  document.querySelector('#step').disabled=Boolean(session?.done);
  document.querySelector('#run').disabled=Boolean(session?.done);
}
function reset(){session=null;status.textContent='Ready. Predict the output before running.';status.classList.remove('error');render();}
function start(){if(!session)try{session=new LabProgram(editor.value,inputBox.value);}catch(e){status.textContent=e.message;status.classList.add('error');return false;}return true;}
document.querySelector('#step').onclick=()=>{if(start()){session.step();render();}};
document.querySelector('#run').onclick=()=>{if(start()){session.run();render();}};
document.querySelector('#reset').onclick=reset;
editor.oninput=reset;inputBox.oninput=reset;
document.querySelector('#load').onclick=()=>{editor.value=presets[document.querySelector('#example').value];inputBox.value='2';reset();};
document.querySelector('#download-code').onclick=()=>{const blob=new Blob([editor.value+'\n'],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='my-ticket-program.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
editor.value=presets.starter;reset();
