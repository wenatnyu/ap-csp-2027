/* A deliberately small AP-style pseudocode teaching interpreter; never evals code. */
(function(root){
'use strict';
function tokens(source){
  const result=[]; let i=0;
  while(i<source.length){
    const tail=source.slice(i);
    const ws=tail.match(/^\s+/); if(ws){i+=ws[0].length;continue;}
    const match=tail.match(/^(?:\d+(?:\.\d+)?|\.[0-9]+)|^[A-Za-z_][A-Za-z0-9_]*|^"(?:[^"\\]|\\["\\nrt])*"|^[()+*/-]/);
    if(!match)throw new Error('Syntax error: unsupported symbol near '+tail.slice(0,18));
    const t=match[0]; result.push(t);i+=t.length;
  }
  return result;
}
function expression(source,vars,getInput){
  const ts=tokens(source);let p=0;
  function atom(){
    const t=ts[p++];
    if(t===undefined)throw new Error('Syntax error: expected a value.');
    if(t==='+'||t==='-'){const v=atom();if(typeof v!=='number')throw new Error('Runtime error: a sign needs a number.');return t==='-'?-v:v;}
    if(t==='('){const v=sum();if(ts[p++]!==')')throw new Error('Syntax error: missing closing parenthesis.');return v;}
    if(/^"/.test(t))return JSON.parse(t);
    if(/^(?:\d|\.)/.test(t))return Number(t);
    if(t.toUpperCase()==='INPUT'){
      if(ts[p++]!=='('||ts[p++]!==')')throw new Error('Syntax error: write INPUT().');
      return getInput();
    }
    if(/^[A-Za-z_]/.test(t)){
      if(!Object.prototype.hasOwnProperty.call(vars,t))throw new Error('Runtime error: '+t+' has no value yet. Check assignment order and letter case.');
      return vars[t];
    }
    throw new Error('Syntax error: unexpected '+t+'.');
  }
  function calc(a,op,b){
    if(typeof a!=='number'||typeof b!=='number')throw new Error('Runtime error: arithmetic requires numeric values in this lab.');
    if(op==='/'&&b===0)throw new Error('Runtime error: division by zero.');
    const v=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:a/b;
    if(!Number.isFinite(v))throw new Error('Runtime error: numeric result is outside this lab\'s range.');
    return v;
  }
  function product(){let v=atom();while(ts[p]==='*'||ts[p]==='/'){const op=ts[p++];v=calc(v,op,atom());}return v;}
  function sum(){let v=product();while(ts[p]==='+'||ts[p]==='-'){const op=ts[p++];v=calc(v,op,product());}return v;}
  const value=sum();if(p!==ts.length)throw new Error('Syntax error: unexpected '+ts[p]+'.');return value;
}
class LabProgram{
  constructor(code,inputText){
    if(code.length>12000)throw new Error('This teaching lab supports at most 12,000 characters.');
    this.lines=code.split(/\r?\n/).map((text,i)=>({number:i+1,text:text.trim()})).filter(x=>x.text&&!x.text.startsWith('//'));
    if(this.lines.length>100)throw new Error('This teaching lab supports at most 100 statements.');
    this.inputs=inputText.trim()?inputText.split(',').map(x=>{
      if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(x.trim()))throw new Error('Input error: enter numeric values separated by commas.');
      const v=Number(x);if(!Number.isFinite(v))throw new Error('Input error: use a finite number.');return v;
    }):[];
    this.vars=Object.create(null);this.outputs=[];this.trace=[];this.position=0;this.inputPosition=0;this.error=null;
  }
  get done(){return this.error!==null||this.position>=this.lines.length;}
  step(){
    if(this.done)return null;
    const line=this.lines[this.position];
    const input=()=>{if(this.inputPosition>=this.inputs.length)throw new Error('Runtime error: INPUT() has no remaining value. Add a value to the input queue and reset.');return this.inputs[this.inputPosition++];};
    try{
      let m=line.text.match(/^DISPLAY\s*\((.*)\)$/i);let effect;
      if(m){const v=expression(m[1],this.vars,input);this.outputs.push(v);effect='Output: '+String(v);}
      else{
        m=line.text.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(?:←|<-)\s*(.+)$/);
        if(!m||/^(INPUT|DISPLAY)$/i.test(m[1]))throw new Error('Syntax error: use name ← expression or DISPLAY(expression), one statement per line.');
        const value=expression(m[2],this.vars,input);this.vars[m[1]]=value;effect=m[1]+' = '+String(value);
      }
      const row={line:line.number,code:line.text,effect,variables:{...this.vars}};
      this.trace.push(row);this.position++;return row;
    }catch(e){this.error='Line '+line.number+' · '+e.message;return null;}
  }
  run(){while(!this.done)this.step();return this;}
}
if(typeof module!=='undefined'&&module.exports)module.exports={LabProgram,expression};
else root.LabProgram=LabProgram;
})(typeof window!=='undefined'?window:this);
