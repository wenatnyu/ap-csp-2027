const assert=require('node:assert/strict');
const {LabProgram}=require('./lab-core.js');
function run(code,input=''){return new LabProgram(code,input).run();}
const fee='tickets ← INPUT()\nprice ← 12\nfee ← 3\ntotal ← tickets * price + fee\nDISPLAY(total)';
for(const [input,want] of [[1,15],[2,27],[50,603]])assert.deepEqual(run(fee,String(input)).outputs,[want]);
const copy=run('a ← 4\nb ← a\na ← a + 3\nDISPLAY(b)\nDISPLAY(a)');
assert.deepEqual(copy.outputs,[4,7]);assert.equal(copy.trace[1].variables.a,4);
assert.deepEqual(run('x <- INPUT()\ny <- INPUT()\nDISPLAY((x+y)*2)','2,3').outputs,[10]);
assert.deepEqual(run('DISPLAY(8 / 2 * 3 - -2)\nDISPLAY("Total")').outputs,[14,'Total']);
const step=new LabProgram('a ← 3\nDISPLAY(a)','');step.step();assert.deepEqual(step.outputs,[]);step.step();assert.deepEqual(step.outputs,[3]);assert.equal(step.done,true);
for(const [code,input,phrase] of [['DISPLAY(x)','','has no value'],['x ← INPUT()','','no remaining'],['DISPLAY(5/0)','','division by zero'],['x = 3','','Syntax error'],['IF (a)','','Syntax error'],['x ← 2\nDISPLAY(X)','','letter case'],['DISPLAY("hi"+3)','','numeric values']])assert.ok(run(code,input).error.includes(phrase));
const bug=fee.replace('tickets * price + fee','tickets * (price + fee)');assert.deepEqual(run(bug,'1').outputs,[15]);assert.deepEqual(run(bug,'2').outputs,[30]);
assert.throws(()=>new LabProgram('x ← INPUT()','hello'),/numeric/);
console.log('Lab verified: project boundaries, precedence, value-copy trace, queue, step/run, syntax/runtime failures and fee-bug detection.');
