/* Chapter 4 AP-style teaching VM. Explicit bytecode, local procedure frames and copied lists; no eval. */
(function(root){
'use strict';
const RESERVED=new Set(['IF','ELSE','REPEAT','TIMES','UNTIL','MOD','AND','OR','NOT','TRUE','FALSE','INPUT','DISPLAY','RANDOM','CONCAT','SUBSTRING','LENGTH','PROCEDURE','RETURN','FOR','EACH','IN','APPEND','INSERT','REMOVE','MOVE_FORWARD','ROTATE_LEFT','ROTATE_RIGHT','CAN_MOVE']);
function scan(source){
  const out=[];let p=0;
  while(p<source.length){
    const tail=source.slice(p),space=tail.match(/^\s+/);if(space){p+=space[0].length;continue;}
    const m=tail.match(/^"(?:[^"\\]|\\["\\nrt])*"|^(?:\d+(?:\.\d+)?|\.\d+)|^[A-Za-z_][A-Za-z0-9_]*|^(?:<=|>=|!=|[\[\](),+*/=<>≠≤≥-])/);
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
    else if(t==='['){const items=[];if(!match(']')){do{items.push(or());}while(match(','));needed(']');}node={type:'list',items};}
    else if(t[0]==='"')node={type:'literal',value:JSON.parse(t)};
    else if(/^(?:\d|\.)/.test(t))node={type:'literal',value:Number(t)};
    else if(/^(TRUE|FALSE)$/i.test(t))node={type:'literal',value:t.toUpperCase()==='TRUE'};
    else if(/^[A-Za-z_]/.test(t)){
      if(match('(')){
        const name=RESERVED.has(t.toUpperCase())?t.toUpperCase():t,args=[];
        if(!match(')')){do{args.push(or());}while(match(','));needed(')');}
        if(name==='CAN_MOVE'&&args.length===1&&args[0].type==='variable'&&['left','right','forward','backward'].includes(args[0].name))args[0]={type:'literal',value:args[0].name};
        node={type:'call',name,args};
      }else{
        if(RESERVED.has(t.toUpperCase()))throw new Error(t+' is reserved; expected a value.');
        node={type:'variable',name:t};
      }
    }else throw new Error('Unexpected '+t+'.');
    while(match('[')){const index=or();needed(']');node={type:'index',list:node,index};}
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
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const copy=v=>Array.isArray(v)?v.map(copy):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,copy(x)])):v;
const format=v=>JSON.stringify(v);
function valid(v){
  if(v===undefined)throw Error('This procedure did not return a value. Use RETURN(value) before using its result.');
  if(Array.isArray(v)){if(v.length>100)throw Error('This lab allows at most 100 list elements.');for(const x of v){if(Array.isArray(x))throw Error('Use flat lists in this chapter.');valid(x);}return v;}
  if(!['number','boolean','string'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v))throw Error('Use finite numbers, Boolean values, strings or a flat list.');
  if(typeof v==='string'&&v.length>10000)throw Error('String exceeds the lab limit.');return v;
}
function numeric(v){if(typeof v!=='number'||!Number.isFinite(v))throw Error('This operation needs finite numbers.');return v;}
function bool(v){if(typeof v!=='boolean')throw Error('A condition must be true or false.');return v;}
function list(v){if(!Array.isArray(v))throw Error('This operation needs a list.');return v;}
function indexOf(v,i){list(v);if(!Number.isInteger(i)||i<1||i>v.length)throw Error('List index '+i+' is invalid. Valid indices are 1 through LENGTH(list).');return i-1;}
function binary(op,a,b){
  if(op==='AND'||op==='OR'){bool(a);bool(b);return op==='AND'?a&&b:a||b;}
  if(['+','-','*','/','MOD'].includes(op)){
    numeric(a);numeric(b);if(op==='/'&&b===0)throw Error('Division by zero.');
    if(op==='MOD'&&(!Number.isSafeInteger(a)||a<0||!Number.isSafeInteger(b)||b<=0))throw Error('MOD needs a nonnegative integer and a positive integer divisor.');
    return valid(op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:a%b);
  }
  if(Array.isArray(a)||Array.isArray(b)||typeof a!==typeof b)throw Error('Compare scalar values of matching types.');
  if(op==='=')return a===b;if(op==='!='||op==='≠')return a!==b;numeric(a);numeric(b);
  return op==='<'?a<b:op==='>'?a>b:['<=','≤'].includes(op)?a<=b:a>=b;
}
function stripComment(line){let quoted=false,escape=false;for(let i=0;i<line.length;i++){let c=line[i];if(escape){escape=false;continue;}if(quoted&&c==='\\'){escape=true;continue;}if(c==='"')quoted=!quoted;if(!quoted&&line.slice(i,i+2)==='//')return line.slice(0,i);}return line;}
function compile(code){
  if(code.length>24000)throw Error('Use at most 24,000 source characters.');
  const lines=code.split(/\r?\n/).map((s,i)=>({text:stripComment(s).trim(),line:i+1})).filter(x=>x.text);
  if(lines.length>300)throw Error('Use at most 300 nonblank source lines.');
  let p=0,depth=0;const procedures=Object.create(null);
  function expr(s,line){try{return parseExpression(s);}catch(e){throw Error('Line '+line+' · '+e.message);}}
  function name(s){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)||RESERVED.has(s.toUpperCase()))throw Error('Invalid or reserved name '+s+'.');return s;}
  function body(inProc){if(lines[p]?.text!=='{')throw Error('Put { on its own line after the header.');p++;return block(true,inProc);}
  function block(nested,inProc){
    if(++depth>25)throw Error('Too many nested blocks.');const result=[];
    while(p<lines.length){const src=lines[p++],s=src.text;let m,node;
      if(s==='}'){if(!nested)throw Error('Unexpected } on line '+src.line);depth--;return result;}
      if((m=s.match(/^PROCEDURE\s+([A-Za-z_]\w*)\s*\((.*)\)$/i))){
        if(nested||inProc)throw Error('Define procedures at the top level.');const n=name(m[1]),params=m[2].trim()?m[2].split(',').map(x=>name(x.trim())):[];
        if(own(procedures,n)||new Set(params).size!==params.length)throw Error('Duplicate procedure or parameter name.');
        procedures[n]={name:n,params,body:body(true)};continue;
      }
      if((m=s.match(/^IF\s*\((.*)\)$/i))){node={type:'if',expr:expr(m[1],src.line),body:body(inProc),other:[]};if(lines[p]?.text.toUpperCase()==='ELSE'){p++;node.other=body(inProc);}}
      else if((m=s.match(/^REPEAT\s+UNTIL\s*\((.*)\)$/i)))node={type:'until',expr:expr(m[1],src.line),body:body(inProc)};
      else if((m=s.match(/^REPEAT\s+(.+)\s+TIMES$/i)))node={type:'repeat',expr:expr(m[1],src.line),body:body(inProc)};
      else if((m=s.match(/^FOR\s+EACH\s+([A-Za-z_]\w*)\s+IN\s+(.+)$/i)))node={type:'each',name:name(m[1]),expr:expr(m[2],src.line),body:body(inProc)};
      else if((m=s.match(/^RETURN\s*\((.*)\)$/i))){if(!inProc)throw Error('RETURN belongs inside a procedure.');node={type:'return',expr:expr(m[1],src.line)};}
      else if((m=s.match(/^DISPLAY\s*\((.*)\)$/i)))node={type:'display',expr:expr(m[1],src.line)};
      else if((m=s.match(/^([A-Za-z_]\w*)(?:\s*\[(.+)\])?\s*(?:←|<-)\s*(.+)$/)))node={type:m[2]?'setIndex':'assign',name:name(m[1]),index:m[2]?expr(m[2],src.line):null,expr:expr(m[3],src.line)};
      else {const call=expr(s,src.line);if(call.type!=='call')throw Error('Use a supported statement on line '+src.line);node={type:'callStatement',expr:call};}
      result.push({...node,line:src.line,code:src.text});
    }
    if(nested)throw Error('Missing } at the end of a block.');depth--;return result;
  }
  const main=block(false,false),builtins={INPUT:0,RANDOM:2,LENGTH:1,CONCAT:2,SUBSTRING:3,CAN_MOVE:1},mutators={APPEND:2,INSERT:3,REMOVE:2,MOVE_FORWARD:0,ROTATE_LEFT:0,ROTATE_RIGHT:0};
  function translate(nodes,inProc){const out=[];const emit=(op,n,extra={})=>{out.push({op,line:n.line,code:n.code,...extra});return out.length-1;};
    function expression(e,n){
      if(e.type==='literal')emit('push',n,{value:e.value});
      else if(e.type==='variable')emit('load',n,{name:e.name});
      else if(e.type==='list'){e.items.forEach(x=>expression(x,n));emit('list',n,{count:e.items.length});}
      else if(e.type==='index'){expression(e.list,n);expression(e.index,n);emit('getIndex',n);}
      else if(e.type==='unary'){expression(e.arg,n);emit('unary',n,{operator:e.op});}
      else if(e.type==='binary'){expression(e.left,n);expression(e.right,n);emit('binary',n,{operator:e.op});}
      else if(e.type==='call'){
        if(own(mutators,e.name))throw Error(e.name+' is a statement, not a returned value.');
        const count=own(builtins,e.name)?builtins[e.name]:procedures[e.name]?.params.length;
        if(count===undefined||count!==e.args.length)throw Error('Unknown procedure or wrong argument count: '+e.name);
        e.args.forEach(x=>expression(x,n));emit(own(builtins,e.name)?'builtin':'call',n,{name:e.name,count});
      }
    }
    function statements(ns){for(const n of ns){
      if(['if','until'].includes(n.type)){const start=out.length;expression(n.expr,n);const test=emit(n.type,n);statements(n.body);
        if(n.type==='until')emit('jump',n,{target:start});
        else if(n.other.length){const jump=emit('jump',n);out[test].target=out.length;statements(n.other);out[jump].target=out.length;continue;}
        out[test].target=out.length;
      }else if(['repeat','each'].includes(n.type)){
        expression(n.expr,n);const start=emit('loopInit',n,{kind:n.type,name:n.name,source:n.expr.type==='variable'?n.expr.name:null});
        const check=emit('loopCheck',n,{start});statements(n.body);emit('loopEnd',n,{start,check});out[check].target=out.length;
      }else if(n.type==='callStatement'&&own(mutators,n.expr.name)){
        const e=n.expr;if(e.args.length!==mutators[e.name])throw Error('Wrong argument count for '+e.name);
        const robot=e.name.startsWith('MOVE_')||e.name.startsWith('ROTATE_');
        if(!robot&&e.args[0].type!=='variable')throw Error('The list to modify must be a named list.');
        (robot?[]:e.args.slice(1)).forEach(x=>expression(x,n));emit('mutate',n,{name:e.name,listName:robot?null:e.args[0].name,count:robot?0:e.args.length-1});
      }else if(n.type==='callStatement'){expression(n.expr,n);emit('discard',n);}
      else {if(n.index)expression(n.index,n);expression(n.expr,n);emit(n.type,n,{name:n.name});}
    }}statements(nodes);if(inProc)out.push({op:'implicitReturn',line:nodes.at(-1)?.line||1,code:'End of procedure'});return out;
  }
  const instructions=translate(main,false);for(const proc of Object.values(procedures))proc.instructions=translate(proc.body,true);return {instructions,procedures};
}
function inputQueue(text){if(text.length>24000)throw Error('Input queue exceeds the lab limit.');return text.split(/\r?\n/).filter(x=>x.trim()).map((s,i)=>{let v;try{v=JSON.parse(s);}catch(e){throw Error('Input row '+(i+1)+' must be one number, Boolean or quoted string.');}if(Array.isArray(v))throw Error('Create lists in the code; INPUT receives a scalar in this lab.');return valid(v);});}
const DEFAULT_ROBOT={rows:5,cols:5,row:4,col:1,direction:1,goal:[1,4],walls:[[3,2],[3,3],[2,2]]};
class Program{
  constructor(code,inputs='',options={}){
    const parsed=compile(code);this.procedures=parsed.procedures;this.frame=this.newFrame('main',parsed.instructions);this.frames=[];
    this.inputs=inputQueue(inputs);this.inputPosition=0;this.outputs=[];this.trace=[];this.steps=0;this.limit=options.limit||5000;this.error=null;this.rng=options.rng||Math.random;
    this.robot=options.robot?JSON.parse(JSON.stringify(options.robot===true?DEFAULT_ROBOT:options.robot)):null;
  }
  newFrame(name,instructions,vars=Object.create(null)){return {name,instructions,vars,pc:0,stack:[],loops:new Map()};}
  get vars(){return this.frame.vars;}
  get scope(){return this.frame.name;}
  get done(){return this.error!==null||this.frame.pc>=this.frame.instructions.length&&this.frames.length===0;}
  get next(){return this.frame.instructions[this.frame.pc]||null;}
  get callStack(){return [...this.frames.map(f=>f.name),this.frame.name];}
  canMove(direction){if(!this.robot)throw Error('Robot commands belong in the Robot workspace.');const turns={forward:0,right:1,backward:2,left:3};if(!own(turns,direction))throw Error('CAN_MOVE uses forward, right, backward or left.');const d=(this.robot.direction+turns[direction])%4,[dr,dc]=[[-1,0],[0,1],[1,0],[0,-1]][d],r=this.robot.row+dr,c=this.robot.col+dc;return r>=1&&r<=this.robot.rows&&c>=1&&c<=this.robot.cols&&!this.robot.walls.some(w=>w[0]===r&&w[1]===c);}
  protectList(name){for(const loop of this.frame.loops.values())if(loop.kind==='each'&&loop.source===name)throw Error('Keep the traversed list unchanged. Write to a separate result list.');}
  builtin(name,args){
    if(name==='INPUT'){if(this.inputPosition>=this.inputs.length)throw Error('No INPUT value remains.');return this.inputs[this.inputPosition++];}
    if(name==='LENGTH')return list(args[0]).length;
    if(name==='CAN_MOVE')return this.canMove(args[0]);
    if(name==='RANDOM'){const[a,b]=args,u=this.rng();if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a>b||!Number.isSafeInteger(b-a+1)||typeof u!=='number'||u<0||u>=1||!Number.isFinite(u))throw Error('Invalid RANDOM endpoints or random source.');return a+Math.floor(u*(b-a+1));}
    if(name==='CONCAT'){if(args.some(v=>typeof v!=='string'))throw Error('CONCAT needs two strings.');return valid(args[0]+args[1]);}
    const [s,start,length]=args;if(typeof s!=='string'||!Number.isInteger(start)||!Number.isInteger(length)||start<1||length<0||start-1+length>Array.from(s).length)throw Error('Invalid supplied SUBSTRING arguments.');return Array.from(s).slice(start-1,start-1+length).join('');
  }
  returnToCaller(value){if(!this.frames.length)throw Error('RETURN must execute in a procedure.');this.frame=this.frames.pop();this.frame.stack.push(copy(value));}
  normalize(){let guard=0;while(!this.done&&guard++<10000){const i=this.next,f=this.frame;if(!i)break;
    if(i.op==='jump'){f.pc=i.target;continue;}
    if(i.op==='loopEnd'){f.loops.get(i.start).position++;f.pc=i.check;continue;}
    if(i.op==='discard'){f.stack.pop();f.pc++;continue;}
    if(i.op==='implicitReturn'){this.returnToCaller(undefined);continue;}break;
  }}
  step(){if(this.done)return null;let internal=0;
    try{while(!this.done){if(++internal>10000)throw Error('Expression exceeds the lab work limit.');const f=this.frame,i=this.next;const pop=()=>f.stack.pop(),args=n=>n?f.stack.splice(-n):[];let value,effect=null,condition=null,scope=f.name,snapshot=null;
      if(this.steps>=this.limit)throw Error('Stopped at the '+this.limit+'-step classroom limit; check termination.');
      if(i.op==='push'){f.stack.push(copy(i.value));f.pc++;}
      else if(i.op==='load'){if(!own(f.vars,i.name))throw Error(i.name+' has no value in '+f.name+'. Pass needed data as a parameter.');f.stack.push(f.vars[i.name]);f.pc++;}
      else if(i.op==='list'){f.stack.push(valid(copy(args(i.count))));f.pc++;}
      else if(i.op==='getIndex'){const at=pop(),values=pop();f.stack.push(copy(values[indexOf(values,at)]));f.pc++;}
      else if(i.op==='unary'){value=pop();f.stack.push(i.operator==='NOT'?!bool(value):i.operator==='-'?-numeric(value):numeric(value));f.pc++;}
      else if(i.op==='binary'){const b=pop(),a=pop();f.stack.push(binary(i.operator,a,b));f.pc++;}
      else if(i.op==='builtin'){f.stack.push(this.builtin(i.name,args(i.count)));f.pc++;}
      else if(i.op==='call'){
        const proc=this.procedures[i.name],values=args(i.count);if(this.callStack.includes(i.name))throw Error('Recursion is outside this classroom subset.');if(this.frames.length>=8)throw Error('Too many procedure calls.');
        values.forEach(valid);const vars=Object.create(null);proc.params.forEach((p,j)=>vars[p]=copy(values[j]));f.pc++;this.frames.push(f);this.frame=this.newFrame(i.name,proc.instructions,vars);scope=i.name;effect='Call '+i.name+'('+values.map(format).join(', ')+')';
      }else if(i.op==='assign'){this.protectList(i.name);value=valid(pop());f.vars[i.name]=copy(value);effect=i.name+' ← '+format(value);f.pc++;}
      else if(i.op==='setIndex'){this.protectList(i.name);value=valid(pop());const at=pop(),values=f.vars[i.name];values[indexOf(values,at)]=copy(value);valid(values);effect=i.name+'['+at+'] ← '+format(value);f.pc++;}
      else if(i.op==='display'){value=valid(pop());this.outputs.push(copy(value));effect='DISPLAY '+format(value);f.pc++;}
      else if(i.op==='return'){value=valid(pop());effect='RETURN '+format(value)+' to caller';snapshot=copy(f.vars);this.returnToCaller(value);}
      else if(i.op==='if'||i.op==='until'){condition=bool(pop());effect=i.op==='if'?(condition?'true → IF block':'false → skip IF / choose ELSE'):(condition?'true → stop loop':'false → repeat body');f.pc=(i.op==='if'?condition:!condition)?f.pc+1:i.target;}
      else if(i.op==='loopInit'){value=pop();if(i.kind==='repeat'&&(!Number.isInteger(value)||value<0||value>10000))throw Error('REPEAT needs a count from 0 to 10,000.');if(i.kind==='each')list(value);f.loops.set(f.pc,{kind:i.kind,name:i.name,source:i.source,values:copy(value),count:i.kind==='each'?value.length:value,position:0});f.pc++;}
      else if(i.op==='loopCheck'){const loop=f.loops.get(i.start);if(loop.position>=loop.count){effect='Traversal / repetition complete ('+loop.count+' iterations)';f.loops.delete(i.start);f.pc=i.target;}else{if(loop.kind==='each')f.vars[loop.name]=copy(loop.values[loop.position]);effect='Iteration '+(loop.position+1)+' of '+loop.count+(loop.kind==='each'?' · '+loop.name+' = '+format(f.vars[loop.name]):'');f.pc++;}}
      else if(i.op==='mutate'){
        const a=args(i.count);if(i.listName){this.protectList(i.listName);const values=list(f.vars[i.listName]);if(i.name==='APPEND'){if(values.length>=100)throw Error('List limit is 100 elements.');values.push(copy(valid(a[0])));}
          else if(i.name==='INSERT'){const at=indexOf(values,a[0]);if(values.length>=100)throw Error('List limit is 100 elements.');values.splice(at,0,copy(valid(a[1])));}
          else values.splice(indexOf(values,a[0]),1);valid(values);effect=i.name+' → '+i.listName+' = '+format(values);
        }else{if(!this.robot)throw Error('Use robot commands in the Robot workspace.');if(i.name==='MOVE_FORWARD'){if(!this.canMove('forward'))throw Error('Blocked move: robot stays here and this program terminates.');const[dr,dc]=[[-1,0],[0,1],[1,0],[0,-1]][this.robot.direction];this.robot.row+=dr;this.robot.col+=dc;}else this.robot.direction=(this.robot.direction+(i.name==='ROTATE_RIGHT'?1:3))%4;effect=i.name+' → row '+this.robot.row+', column '+this.robot.col+', facing '+['N','E','S','W'][this.robot.direction];}f.pc++;
      }else {this.normalize();continue;}
      if(effect!==null){this.steps++;const row={step:this.steps,line:i.line,code:i.code,scope,effect,condition,variables:snapshot||copy(this.frame.vars),robot:this.robot?copy(this.robot):null};this.trace.push(row);this.normalize();return row;}
      this.normalize();
    }return null;}catch(e){this.error='Line '+(this.next?.line||1)+' · '+e.message;return null;}
  }
  run(){while(!this.done)this.step();return this;}
}
const api={Program,compile,parseExpression,inputQueue,format,DEFAULT_ROBOT};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CSPAlgorithms=api;
})(typeof window!=='undefined'?window:this);
