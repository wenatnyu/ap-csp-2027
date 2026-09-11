#!/usr/bin/env node
'use strict';
// These deterministic classroom tests validate modeled rules, not real network
// latency or a guarantee that the list-scheduling strategy is always optimal.
const assert = require('node:assert/strict');
const {NODES,EDGES,edgeKey,shortestPath,splitPackets,Transfer,schedule} = require('./network-core.js');
let passed = 0;
const failures = [];
function test(name, check) {
  try { check(); passed++; }
  catch (error) { failures.push({name, message:error.message}); }
}
// A distance-matrix oracle is independent of the model's queue-based BFS.
function distance(disabled,start,end) {
  const off = new Set(disabled), size = NODES.length;
  const matrix = Array.from({length:size},(_,i) => Array.from({length:size},(_,j) => i===j ? 0 : Infinity));
  EDGES.forEach(([a,b]) => {
    if (!off.has(edgeKey(a,b))) matrix[NODES.indexOf(a)][NODES.indexOf(b)] = matrix[NODES.indexOf(b)][NODES.indexOf(a)] = 1;
  });
  for(let k=0;k<size;k++) for(let i=0;i<size;i++) for(let j=0;j<size;j++) matrix[i][j] = Math.min(matrix[i][j],matrix[i][k]+matrix[k][j]);
  return matrix[NODES.indexOf(start)][NODES.indexOf(end)];
}

test('BFS reroutes after a link failure and reports failure when every route is cut', () => {
  assert.deepEqual(shortestPath(), ['S','A','C','T']);
  assert.deepEqual(shortestPath([edgeKey('C','T')]), ['S','A','D','T']);
  assert.equal(shortestPath([edgeKey('S','A'),edgeKey('S','B')]), null);
  const all = EDGES.map(([a,b]) => edgeKey(a,b));
  assert.equal(shortestPath(all), null);
  assert.deepEqual(shortestPath(all,'S','S'), ['S'], 'zero hops reaches the current node even in a disconnected graph');
  assert.deepEqual(shortestPath([],'T','S'), ['T','C','A','S']);
  assert.throws(() => shortestPath([],'unknown','T'), /Unknown network node/);
});
test('all 256 link-failure combinations preserve shortest valid routing or return null', () => {
  for(let mask=0;mask<2**EDGES.length;mask++) {
    const disabled = EDGES.filter((edge,index) => mask & (1<<index)).map(([a,b]) => edgeKey(a,b));
    const path = shortestPath(disabled), expected = distance(disabled,'S','T');
    if (!Number.isFinite(expected)) assert.equal(path,null,`disconnected mask ${mask}`);
    else {
      assert.equal(path.length-1,expected,`shortest path for mask ${mask}`);
      assert.equal(path[0],'S'); assert.equal(path.at(-1),'T');
      assert.equal(new Set(path).size,path.length,'route contains no cycles');
      for(let i=1;i<path.length;i++) {
        const key=edgeKey(path[i-1],path[i]);
        assert.ok(EDGES.some(([a,b]) => edgeKey(a,b)===key));
        assert.ok(!disabled.includes(key));
      }
    }
  }
});
test('packet metadata is one-based and reassembly preserves Unicode code points', () => {
  const packets = splitPackets('A🙂中BC',2);
  assert.deepEqual(packets.map(p=>[p.id,p.total,p.payload]), [[1,3,'A🙂'],[2,3,'中B'],[3,3,'C']]);
  assert.equal(packets.map(p=>p.payload).join(''),'A🙂中BC');
  assert.throws(() => splitPackets(''), /1–48/);
  assert.throws(() => splitPackets('a'.repeat(49)), /1–48/);
  for(const size of [0,1.5,13]) assert.throws(() => splitPackets('ABC',size));
});
test('out-of-order packets reconstruct by identifier, not by arrival order', () => {
  const transfer = new Transfer('HELLO AP CSP');
  assert.equal(transfer.complete,false);
  assert.equal(transfer.message,null);
  for(const id of [4,1,3,2]) assert.equal(transfer.receive(id),true);
  assert.equal(transfer.complete,true);
  assert.equal(transfer.message,'HELLO AP CSP');
  assert.deepEqual(transfer.log.map(entry=>entry.id),[4,1,3,2]);
  assert.deepEqual(transfer.missing,[]);
});
test('loss stays incomplete until retry; duplicates never become extra message content', () => {
  const transfer = new Transfer('ALGORITHM');
  transfer.receive(3); transfer.receive(1);
  assert.deepEqual(transfer.missing,[2]);
  assert.equal(transfer.message,null);
  assert.equal(transfer.receive(3),false);
  assert.equal(transfer.received.size,2);
  assert.equal(transfer.log.at(-1).duplicate,true);
  assert.equal(transfer.receive(2),true);
  assert.equal(transfer.complete,true);
  assert.equal(transfer.message,'ALGORITHM');
  transfer.receive(2);
  assert.equal(transfer.received.size,3);
  assert.equal(transfer.message,'ALGORITHM');
  const entries=transfer.log.length;
  assert.throws(() => transfer.receive(99), /Unknown packet/);
  assert.equal(transfer.log.length,entries);
});
test('the taught schedule yields sequential 18, two-processor 11 and three-processor 8', () => {
  const jobs=[6,4,3,3];
  const sequential=schedule(jobs,1,2), two=schedule(jobs,2,2), three=schedule(jobs,3,2);
  assert.equal(sequential.total,18);
  assert.equal(two.total,11);
  assert.equal(three.total,8);
  assert.equal(two.baseline,18);
  assert.equal(two.speedup,18/11);
  assert.equal(three.speedup,18/8);
  assert.deepEqual(two.assignments.map(a=>[a.job,a.processor,a.start,a.end]), [[1,1,2,8],[2,2,2,6],[3,2,6,9],[4,1,8,11]]);
  assert.equal(schedule(jobs,4,2).total,8,'adding a fourth processor cannot shorten the longest six-unit job');
});
test('parallel overhead can make short jobs slower than the sequential baseline', () => {
  const jobs=[1,1,1,1];
  const sequential=schedule(jobs,1,2,0), parallel=schedule(jobs,4,2,6);
  assert.equal(sequential.total,6);
  assert.equal(parallel.total,9);
  assert.equal(parallel.baseline,6);
  assert.ok(parallel.total>sequential.total);
  assert.ok(parallel.speedup<1);
  assert.equal(parallel.speedup,2/3);
});
test('scheduled jobs execute exactly once with no per-processor overlap, and setup stays serial', () => {
  for(const jobs of [[1],[6,4,3,3],[2,7,1,4,3],[20,20,20,20],[1,1,1,1]]) {
    for(const processors of [1,2,3,4]) {
      const plan=schedule(jobs,processors,3,2);
      assert.equal(plan.assignments.length,jobs.length);
      assert.deepEqual(plan.assignments.map(a=>a.job),jobs.map((_,i)=>i+1));
      const available=Array(processors).fill(3);
      for(const assignment of plan.assignments) {
        assert.ok(assignment.processor>=1 && assignment.processor<=processors);
        assert.ok(assignment.start>=available[assignment.processor-1]);
        assert.equal(assignment.end-assignment.start,jobs[assignment.job-1]);
        available[assignment.processor-1]=assignment.end;
      }
      assert.equal(plan.finish,Math.max(...plan.assignments.map(a=>a.end)));
      assert.equal(plan.total,plan.finish+2);
      assert.equal(plan.baseline,3+jobs.reduce((sum,n)=>sum+n,0));
    }
  }
});
test('invalid work and overhead are rejected instead of yielding misleading speedups', () => {
  for(const jobs of [[],[0],[-1],[Infinity],[NaN],[21]]) assert.throws(()=>schedule(jobs));
  for(const processors of [0,1.5,5]) assert.throws(()=>schedule([1],processors));
  for(const overhead of [-1,7,NaN,Infinity]) assert.throws(()=>schedule([1],2,2,overhead));
  for(const serial of [-1,21,NaN,Infinity]) assert.throws(()=>schedule([1],2,serial));
});

if(failures.length) {
  for(const failure of failures) console.error('FAIL · '+failure.name+'\n  '+failure.message);
  console.error(`${passed} passed; ${failures.length} failed.`);
  process.exitCode=1;
} else console.log(`Network: ${passed} behavioral groups passed (including all 256 network link-failure combinations).`);
