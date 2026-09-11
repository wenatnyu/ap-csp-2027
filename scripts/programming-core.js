/* Chapter 3 AP-style teaching interpreter. Parses a bounded subset; never evaluates JavaScript. */
(function(root){
'use strict';
const RESERVED=new Set(['IF','ELSE','REPEAT','TIMES','UNTIL','MOD','AND','OR','NOT','TRUE','FALSE','INPUT','DISPLAY','RANDOM','CONCAT','SUBSTRING','LENGTH']);
function scan(source){
  const out=[];let p=0;
  while(p<source.length){
    const tail=source.slice(p),space=tail.match(/^\s+/);if(space){p+=space[0].length;continue;}
    const m=tail.match(/^"(?:[^"\\]|\\["\\nrt])*"|^(?:\d+(?:\.\d+)?|\.\d+)|^[A-Za-z_][A-Za-z0-9_]*|^(?:<=|>=|!=|[(),+*/=<>≠≤≥-])/);
    if(!m)throw new Error('Unsupported symbol near '+tail.slice(0,16)+'. Use double quotes for strings.');
    out.push(m[0]);p+=m[0].length;
  }
  return out;
}
function parseExpression(source){
  const ts=scan(source);let p=0,depth=0;
  function match(t){if((ts[p]||'').toUpperCase()===t){p++;return true;}return false;}
  function needed(t){if(!match(t))throw new Error('Expected '+t+'.');}
  function atom(){
    if(++depth>60)throw new Error('Expression is too deeply nested.');
    const t=ts[p++];let node;
    if(t===undefined)throw new Error('Expected a value.');
    if(t==='+'||t==='-')node={type:'unary',op:t,arg:atom()};
    else if(t==='('){node=or();needed(')');}
    else if(t[0]==='"')node={type:'literal',value:JSON.parse(t)};
    else if(/^(?:\d|\.)/.test(t))node={type:'literal',value:Number(t)};
    else if(/^(TRUE|FALSE)$/i.test(t))node={type:'literal',value:t.toUpperCase()==='TRUE'};
    else if(/^[A-Za-z_]/.test(t)){
      if(match('(')){
        const name=t.toUpperCase(),args=[];
        if(!match(')')){do{args.push(or());}while(match(','));needed(')');}
        const arity={INPUT:0,RANDOM:2,CONCAT:2,SUBSTRING:3,LENGTH:1};
        if(!(name in arity)||args.length!==arity[name])throw new Error('Use INPUT(), RANDOM(a,b), CONCAT(a,b), SUBSTRING(text,start,length), or LENGTH(text) with the stated arguments.');
        node={type:'call',name,args};
      }else{
        if(RESERVED.has(t.toUpperCase()))throw new Error(t+' is reserved; expected a value.');
        node={type:'variable',name:t};
      }
    }else throw new Error('Unexpected '+t+'.');
    depth--;return node;
  }
  function product(){let node=atom();while(['*','/','MOD'].includes((ts[p]||'').toUpperCase())){const op=ts[p++].toUpperCase();node={type:'binary',op,left:node,right:atom()};}return node;}
  function sum(){let node=product();while(['+','-'].includes(ts[p])){const op=ts[p++];node={type:'binary',op,left:node,right:product()};}return node;}
  function comparison(){let node=sum();if(['=','≠','!=','<','>','≤','≥','<=','>='].includes(ts[p])){const op=ts[p++];node={type:'binary',op,left:node,right:sum()};}return node;}
  function not(){if(match('NOT'))return {type:'unary',op:'NOT',arg:not()};return comparison();}
  function and(){let node=not();while(match('AND'))node={type:'binary',op:'AND',left:node,right:not()};return node;}
  function or(){let node=and();while(match('OR'))node={type:'binary',op:'OR',left:node,right:and()};return node;}
  const result=or();if(p!==ts.length)throw new Error('Unexpected '+ts[p]+'. Parenthesize each comparison and join with AND or OR.');return result;
}
function boolean(v){if(typeof v!=='boolean')throw new Error('A condition must be true or false, not '+JSON.stringify(v)+'.');return v;}
function numeric(v){if(typeof v!=='number'||!Number.isFinite(v))throw new Error('This operation needs finite numbers.');return v;}
function textValue(v){if(typeof v!=='string')throw new Error('This string procedure needs string arguments.');return v;}
function finite(v){if(typeof v==='number'&&!Number.isFinite(v))throw new Error('Numeric result exceeds the lab range.');if(typeof v==='string'&&v.length>10000)throw new Error('A string exceeds the 10,000-character lab limit.');return v;}
function evaluate(node,context){
  if(node.type==='literal')return finite(node.value);
  if(node.type==='variable'){if(!Object.prototype.hasOwnProperty.call(context.vars,node.name))throw new Error(node.name+' has no value yet. Check assignment order and letter case.');return context.vars[node.name];}
  if(node.type==='unary'){const v=evaluate(node.arg,context);return node.op==='NOT'?!boolean(v):node.op==='-'?-numeric(v):numeric(v);}
  if(node.type==='call'){
    const args=node.args.map(x=>evaluate(x,context));
    if(node.name==='INPUT')return context.input();
    if(node.name==='RANDOM'){
      const [a,b]=args;
      if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a>b||!Number.isSafeInteger(b-a+1))throw new Error('RANDOM requires safe integer endpoints a ≤ b.');
      return context.random(a,b);
    }
    if(node.name==='CONCAT')return finite(textValue(args[0])+textValue(args[1]));
    if(node.name==='LENGTH')return Array.from(textValue(args[0])).length;
    const chars=Array.from(textValue(args[0])),start=args[1],length=args[2];
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(length)||start<1||length<0||start>chars.length+1||start-1+length>chars.length)throw new Error('SUBSTRING uses a 1-based start and a nonnegative length that stays inside the string.');
    return chars.slice(start-1,start-1+length).join('');
  }
  const a=evaluate(node.left,context),b=evaluate(node.right,context),op=node.op;
  if(op==='AND'||op==='OR'){boolean(a);boolean(b);return op==='AND'?a&&b:a||b;}
  if(['+','-','*','/','MOD'].includes(op)){
    numeric(a);numeric(b);
    if(op==='/'&&b===0)throw new Error('Division by zero.');
    if(op==='MOD'&&(!Number.isSafeInteger(a)||a<0||!Number.isSafeInteger(b)||b<=0))throw new Error('MOD assumes a nonnegative integer and a positive integer divisor.');
    return finite(op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:a%b);
  }
  if(typeof a!==typeof b)throw new Error('Compare values of the same type in this lab.');
  if(op==='=')return a===b;
  if(op==='≠'||op==='!=')return a!==b;
  numeric(a);numeric(b);
  return op==='<'?a<b:op==='>'?a>b:(op==='≤'||op==='<=')?a<=b:a>=b;
}
function stripComment(line){let quoted=false,escaped=false;for(let i=0;i<line.length;i++){const c=line[i];if(escaped){escaped=false;continue;}if(quoted&&c==='\\'){escaped=true;continue;}if(c==='"')quoted=!quoted;if(!quoted&&line.slice(i,i+2)==='//')return line.slice(0,i);}return line;}
function compile(code){
  if(code.length>24000)throw new Error('Use at most 24,000 characters.');
  const lines=code.split(/\r?\n/).map((s,i)=>({text:stripComment(s).trim(),line:i+1})).filter(x=>x.text);
  if(lines.length>300)throw new Error('Use at most 300 nonblank lines.');
  const instructions=[];let p=0,blockDepth=0;
  function expression(s,line){try{return parseExpression(s);}catch(e){throw new Error('Line '+line+' · '+e.message);}}
  function emit(type,line,extra={}){instructions.push({type,line:line.line,code:line.text,...extra});return instructions.length-1;}
  function braceBlock(){
    if(!lines[p]||lines[p].text!=='{')throw new Error('Line '+(lines[p]?.line||lines.at(-1)?.line||1)+' · Put { on its own line after a condition or loop.');
    p++;block(true);
  }
  function block(nested){
    if(++blockDepth>30)throw new Error('Too many nested blocks.');
    while(p<lines.length){
      const source=lines[p++],s=source.text;let m;
      if(s==='}'){if(!nested)throw new Error('Line '+source.line+' · Unexpected }.');blockDepth--;return;}
      if((m=s.match(/^IF\s*\((.*)\)$/i))){
        const idx=emit('if',source,{expr:expression(m[1],source.line)});braceBlock();
        if(lines[p]?.text.toUpperCase()==='ELSE'){
          p++;const jump=emit('jump',source);instructions[idx].target=instructions.length;braceBlock();instructions[jump].target=instructions.length;
        }else instructions[idx].target=instructions.length;
      }else if((m=s.match(/^REPEAT\s+UNTIL\s*\((.*)\)$/i))){
        const idx=emit('until',source,{expr:expression(m[1],source.line)});braceBlock();emit('jump',source,{target:idx});instructions[idx].target=instructions.length;
      }else if((m=s.match(/^REPEAT\s+(.+)\s+TIMES$/i))){
        const idx=emit('repeat',source,{expr:expression(m[1],source.line)});braceBlock();emit('repeatEnd',source,{start:idx});instructions[idx].target=instructions.length;
      }else if((m=s.match(/^DISPLAY\s*\((.*)\)$/i))){emit('display',source,{expr:expression(m[1],source.line)});}
      else if((m=s.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(?:←|<-)\s*(.+)$/))&&!RESERVED.has(m[1].toUpperCase())){emit('assign',source,{name:m[1],expr:expression(m[2],source.line)});}
      else throw new Error('Line '+source.line+' · Use one supported statement per line; put {, }, and ELSE on separate lines.');
    }
    if(nested)throw new Error('Missing } at the end of a block.');blockDepth--;
  }
  block(false);return instructions;
}
function inputQueue(source){
  if(typeof source!=='string')throw new Error('Input queue must be text.');
  if(source.length>24000)throw new Error('Input queue is too large.');
  return source.split(/\r?\n/).filter(x=>x.trim()).map((row,i)=>{
    let value;try{value=JSON.parse(row);}catch(e){throw new Error('Input row '+(i+1)+' · Enter one number, true/false, or double-quoted string per line.');}
    if(!['number','boolean','string'].includes(typeof value)||value===null)throw new Error('Input row '+(i+1)+' · Lists and objects are not inputs in this chapter.');return finite(value);
  });
}
class Program{
  constructor(code,inputs='',options={}){
    this.instructions=compile(code);this.inputs=inputQueue(inputs);this.inputPosition=0;this.vars=Object.create(null);this.outputs=[];this.trace=[];this.pc=0;this.loops=new Map();this.error=null;this.steps=0;this.limit=options.limit||3000;
    this.replay=options.replay?inputQueue(options.draws||''):null;this.drawPosition=0;this.rng=options.rng||Math.random;
  }
  get done(){return this.error!==null||this.pc>=this.instructions.length;}
  get next(){return this.instructions[this.pc]||null;}
  step(){
    if(this.done)return null;
    const context={vars:this.vars,input:()=>{if(this.inputPosition>=this.inputs.length)throw new Error('INPUT() has no remaining value. Add inputs and reset.');return this.inputs[this.inputPosition++];},random:(a,b)=>{
      let value;
      if(this.replay){if(this.drawPosition>=this.replay.length)throw new Error('Replay has no remaining random draw. Add draws or choose random mode.');value=this.replay[this.drawPosition++];if(!Number.isSafeInteger(value)||value<a||value>b)throw new Error('Replay value '+value+' is outside RANDOM('+a+', '+b+').');}
      else {const u=this.rng();if(typeof u!=='number'||!Number.isFinite(u)||u<0||u>=1)throw new Error('Random source must return a number in [0,1).');value=a+Math.floor(u*(b-a+1));this.drawPosition++;}
      draws.push({a,b,value});return value;
    }};
    const draws=[];
    try{
      // Hidden jumps connect blocks; each visible step still records a statement or a condition check.
      while(!this.done){
        const item=this.instructions[this.pc];
        if(item.type==='jump'){this.pc=item.target;continue;}
        if(item.type==='repeatEnd'){
          const state=this.loops.get(item.start);state.completed++;
          if(state.completed<state.count){this.pc=item.start;state.returning=true;}else{this.loops.delete(item.start);this.pc++;}
          continue;
        }
        if(this.steps>=this.limit)throw new Error('Stopped at the '+this.limit+'-step classroom limit. Check the loop condition and its updates; this is a lab safeguard, not an AP rule.');
        let effect='',condition=null;const beforeInput=this.inputPosition;
        if(item.type==='assign'){const value=evaluate(item.expr,context);this.vars[item.name]=value;effect=item.name+' ← '+format(value);this.pc++;}
        else if(item.type==='display'){const value=evaluate(item.expr,context);this.outputs.push(value);effect='DISPLAY: '+format(value);this.pc++;}
        else if(item.type==='if'){condition=boolean(evaluate(item.expr,context));effect=condition?'true → execute IF block':'false → skip IF block / use ELSE if present';this.pc=condition?this.pc+1:item.target;}
        else if(item.type==='until'){condition=boolean(evaluate(item.expr,context));effect=condition?'true → stop this loop':'false → execute loop body';this.pc=condition?item.target:this.pc+1;}
        else if(item.type==='repeat'){
          let state=this.loops.get(this.pc);
          if(!state){const count=evaluate(item.expr,context);if(!Number.isSafeInteger(count)||count<0||count>10000)throw new Error('REPEAT needs a whole-number count from 0 to 10,000 in this lab.');state={count,completed:0};this.loops.set(this.pc,state);}
          if(state.count===0){effect='0 repetitions → skip body';this.loops.delete(this.pc);this.pc=item.target;}
          else{effect='Iteration '+(state.completed+1)+' of '+state.count+' → execute body';this.pc++;}
        }
        this.steps++;
        const row={step:this.steps,line:item.line,code:item.code,effect,condition,variables:{...this.vars},inputs:this.inputs.slice(beforeInput,this.inputPosition),draws};this.trace.push(row);
        // Finish transparent control transitions so the UI points to the next real source line.
        this.normalize();return row;
      }
      return null;
    }catch(e){this.error='Line '+(this.next?.line||this.trace.at(-1)?.line||1)+' · '+e.message;return null;}
  }
  normalize(){
    while(!this.done){const item=this.next;if(item.type==='jump'){this.pc=item.target;continue;}if(item.type==='repeatEnd'){const state=this.loops.get(item.start);state.completed++;if(state.completed<state.count)this.pc=item.start;else{this.loops.delete(item.start);this.pc++;}continue;}break;}
  }
  run(){while(!this.done)this.step();return this;}
}
function format(value){return typeof value==='string'?JSON.stringify(value):String(value);}
const api={Program,compile,parseExpression,evaluate,inputQueue,format};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CSPProgramming=api;
})(typeof window!=='undefined'?window:this);
