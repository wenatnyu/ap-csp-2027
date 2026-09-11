const assert=require('node:assert/strict');
const {Program,compile}=require('./programming-core.js');
const presets=require('./programming-presets.json');
function run(code,inputs='',options={}){const p=new Program(code,inputs,options).run();assert.equal(p.error,null,p.error);return p;}
function out(code,inputs='',options={}){return run(code,inputs,options).outputs;}
function fails(code,inputs='',pattern=/./,options={}){let message;try{message=new Program(code,inputs,options).run().error;}catch(e){message=e.message;}assert.match(message||'',pattern);}
const block=(header,body)=>header+'\n{\n'+body+'\n}';
assert.deepEqual(out('x ← 4\ny ← x\nx ← x + 3\nDISPLAY(y)\nDISPLAY(x)'),[4,7]);
assert.deepEqual(out('DISPLAY(17 / 5)\nDISPLAY(17 MOD 5)\nDISPLAY(2 + 3 * 4)\nDISPLAY((2 + 3) * 4)\nDISPLAY(20 / 5 * 2)\nDISPLAY(20 MOD 6 * 2)'),[3.4,2,14,20,8,4]);
assert.deepEqual(out('DISPLAY(CONCAT("AP ", "CSP"))\nDISPLAY(SUBSTRING("AP CSP", 4, 3))\nDISPLAY(LENGTH("AP CSP"))'),['AP CSP','CSP',6]);
assert.deepEqual(out('a ← INPUT()\nb ← INPUT()\nc ← INPUT()\nDISPLAY(a)\nDISPLAY(b)\nDISPLAY(c)','"Ada"\ntrue\n30'),['Ada',true,30]);
assert.deepEqual(out('DISPLAY("https://example.test") // comment\nDISPLAY("<script>alert(1)</script>")'),['https://example.test','<script>alert(1)</script>']);
for(const a of [false,true])for(const b of [false,true]){
 assert.deepEqual(out(`DISPLAY(${a} AND ${b})\nDISPLAY(${a} OR ${b})\nDISPLAY(NOT ${a})\nDISPLAY(NOT (${a} AND ${b}))\nDISPLAY((NOT ${a}) OR (NOT ${b}))`),[a&&b,a||b,!a,!(a&&b),!a||!b]);
}
for(const [value,expected]of [[29,'Keep going'],[30,'Goal met'],[31,'Goal met']])assert.deepEqual(out(presets.find(x=>x.id==='selection').code,String(value)),[expected]);
assert.deepEqual(out('x ← 1\n'+block('IF (x = 2)','x ← 9')+'\nDISPLAY(x)'),[1]);
assert.deepEqual(out('x ← 1\n'+block('IF (x = 1)','x ← 2')+'\n'+block('IF (x = 2)','x ← 3')+'\nDISPLAY(x)'),[3]);
for(const [age,price]of [[0,5],[11,5],[12,12],[64,12],[65,7],[120,7]])assert.deepEqual(out(presets.find(x=>x.id==='nested').code,String(age)),[price]);
assert.deepEqual(out('total ← 0\n'+block('REPEAT 3 TIMES','total ← total + INPUT()')+'\nDISPLAY(total)','20\n30\n40'),[90]);
assert.deepEqual(out('x ← 7\n'+block('REPEAT 0 TIMES','x ← 9')+'\nDISPLAY(x)'),[7]);
assert.deepEqual(out('n ← 0\n'+block('REPEAT 2 TIMES',block('REPEAT 3 TIMES','n ← n + 1'))+'\nDISPLAY(n)'),[6]);
assert.deepEqual(out('n ← 3\n'+block('REPEAT n TIMES','n ← n - 1')+'\nDISPLAY(n)'),[0]);
assert.deepEqual(out('n ← 0\n'+block('REPEAT UNTIL (n >= 3)','n ← n + 1')+'\nDISPLAY(n)'),[3]);
assert.deepEqual(out('n ← 5\n'+block('REPEAT UNTIL (n >= 3)','n ← n + 1')+'\nDISPLAY(n)'),[5]);
const sentinel=presets.find(x=>x.id==='until').code;
assert.deepEqual(out(sentinel,'10\n20\n-1'),[30]);assert.deepEqual(out(sentinel,'-1'),[0]);
const nested='sum ← 0\n'+block('REPEAT 2 TIMES','j ← 0\n'+block('REPEAT UNTIL (j = 3)',block('IF (j MOD 2 = 0)','sum ← sum + 1')+'\nj ← j + 1'))+'\nDISPLAY(sum)';
assert.deepEqual(out(nested),[4]);
assert.deepEqual(out(block('REPEAT 2 TIMES','')+'\nDISPLAY("done")'),['done']);
const untilTrace=run('i ← 0\n'+block('REPEAT UNTIL (i = 2)','i ← i + 1'));assert.deepEqual(untilTrace.trace.filter(x=>x.code.startsWith('REPEAT')).map(x=>x.condition),[false,false,true]);
let rngValues=[0,.999999,.5];assert.deepEqual(out('DISPLAY(RANDOM(3,7))\nDISPLAY(RANDOM(3,7))\nDISPLAY(RANDOM(3,7))','',{rng:()=>rngValues.shift()}),[3,7,5]);
const random=presets.find(x=>x.id==='random');assert.deepEqual(out(random.code,'',{replay:true,draws:random.draws}),[1,6,2,6,5,3,'Number of sixes',2]);
assert.deepEqual(out('DISPLAY(RANDOM(4,4))','',{rng:()=>.6}),[4]);
const project='goalHits ← 0\n'+block('REPEAT 3 TIMES','minutes ← INPUT()\n'+block('IF (minutes >= 30)','DISPLAY("Goal met")\ngoalHits ← goalHits + 1')+'\nELSE\n{\nDISPLAY("Keep going")\n}')+'\nDISPLAY(goalHits)\n'+block('IF (goalHits >= 2)','DISPLAY("On track")')+'\nELSE\n{\nDISPLAY("Try again")\n}';
for(const [inputs,expected]of [['29\n30\n31',['Keep going','Goal met','Goal met',2,'On track']],['0\n0\n0',['Keep going','Keep going','Keep going',0,'Try again']],['30\n30\n30',['Goal met','Goal met','Goal met',3,'On track']],['180\n0\n29',['Goal met','Keep going','Keep going',1,'Try again']]])assert.deepEqual(out(project,inputs),expected);
const stepwise=new Program(project,'29\n30\n31');while(!stepwise.done)stepwise.step();assert.deepEqual(stepwise.outputs,out(project,'29\n30\n31'));assert.deepEqual(stepwise.trace,run(project,'29\n30\n31').trace);
fails('DISPLAY(1 / 0)','',/Division by zero/);fails('DISPLAY(-1 MOD 3)','',/MOD assumes/);fails('DISPLAY(3 MOD 0)','',/MOD assumes/);fails('DISPLAY(unknown)','',/has no value/);fails('DISPLAY(INPUT())','',/no remaining/);fails('x ← INPUT()','[]',/Lists and objects/);fails('x ← INPUT()','null',/Lists and objects/);fails('DISPLAY(CONCAT("a", 1))','',/string arguments/);fails('DISPLAY(SUBSTRING("abc",0,1))','',/1-based/);fails('DISPLAY(SUBSTRING("abc",3,2))','',/1-based/);fails('DISPLAY(2 < 3 < 4)','',/Parenthesize/);fails(block('IF (1)','DISPLAY(1)'),' ',/condition must/);fails(block('REPEAT -1 TIMES','DISPLAY(1)'),' ',/whole-number/);fails('DISPLAY(RANDOM(1,3))','',/outside/,{replay:true,draws:'4'});fails('DISPLAY(RANDOM(1,3))','',/no remaining/,{replay:true,draws:''});fails('DISPLAY(RANDOM(1,3))','',/Random source/,{rng:()=>NaN});fails(block('REPEAT UNTIL (false)',''),' ',/30-step/,{limit:30});fails('IF (true)\n{\nDISPLAY(1)','',/Missing }/);
assert.throws(()=>compile('IF (true)\n{\nDISPLAY(1)\n}\nELSE\n{\nBAD()\n}'),/Line 7/);
for(const preset of presets){const p=run(preset.code,preset.inputs,preset.draws?{replay:true,draws:preset.draws}:{});assert.ok(p.steps>0);}
console.log('Chapter 3 verified: expression and string rules, truth tables, branch boundaries, nested loops, zero iterations, prechecked UNTIL, termination safeguard, inclusive random/replay, all presets, and Study Goal Tracker tests.');
