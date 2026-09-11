#!/usr/bin/env node
'use strict';
// Independent behavioral checks for the Chapter 4 teaching models.
// Scope/copy and list-mutation restrictions below describe this lab's documented
// subset; they are not claims that every programming language uses these rules.
const assert = require('node:assert/strict');
const {Program, DEFAULT_ROBOT} = require('./algorithms-core.js');
const {search, growth} = require('./algorithm-models.js');
let passed = 0;
const failures = [];
function test(name, check) {
  try { check(); passed++; }
  catch (error) { failures.push({name, message: error.message}); }
}
function execute(code, inputs = '', options = {}) {
  const program = new Program(code, inputs, options).run();
  assert.equal(program.error, null, program.error || 'Program must complete successfully');
  assert.equal(program.done, true);
  return program;
}
function outputs(code, expected, inputs = '', options = {}) {
  assert.deepEqual(execute(code, inputs, options).outputs, expected);
}
function runtimeError(code, pattern, options = {}) {
  const program = new Program(code, '', options).run();
  assert.match(program.error || '', pattern);
  assert.equal(program.done, true);
  return program;
}
const state = program => [program.robot.row, program.robot.col, program.robot.direction];
const robotAt = (row, col, direction) => ({...DEFAULT_ROBOT, row, col, direction});

test('assignment copies lists and displayed snapshots retain earlier values', () => {
  outputs(`original ← [10,20]
copy ← original
DISPLAY(copy)
copy[1] ← 99
APPEND(copy,30)
DISPLAY(original)
DISPLAY(copy)`, [[10,20], [10,20], [99,20,30]]);
});
test('one-based read, insert shifts, and remove shifts are observable', () => {
  outputs(`values ← [10,30]
INSERT(values,2,20)
DISPLAY(values[1])
DISPLAY(values[3])
REMOVE(values,1)
DISPLAY(values)
DISPLAY(LENGTH(values))`, [10,30,[20,30],2]);
});
test('invalid list indices halt before later output; append grows an empty list', () => {
  for (const index of [0,-1,1.5,3]) {
    const program = runtimeError(`values ← [10,20]\nDISPLAY(values[${index}])\nDISPLAY("later")`, /List index/);
    assert.deepEqual(program.outputs, []);
  }
  runtimeError('values ← []\nINSERT(values,1,10)', /List index/);
  runtimeError('values ← [10]\nINSERT(values,2,20)', /List index/);
  runtimeError('values ← []\nREMOVE(values,1)', /List index/);
  outputs('values ← []\nAPPEND(values,10)\nDISPLAY(values[1])', [10]);
});
test('FOR EACH handles empty inputs, duplicate values, and a separate filtered result', () => {
  outputs(`visits ← 0
FOR EACH item IN []
{
  visits ← visits + 1
}
DISPLAY(visits)
values ← [30,10,30,29,31]
kept ← []
FOR EACH item IN values
{
  IF(item >= 30)
  {
    APPEND(kept,item)
  }
}
DISPLAY(kept)
DISPLAY(values)`, [0,[30,30,31],[30,10,30,29,31]]);
});
test('traversal forbids mutating its source while copied output remains independent', () => {
  runtimeError(`values ← [1,2]
FOR EACH item IN values
{
  APPEND(values,item)
}`, /Keep the traversed list unchanged/);
  outputs(`values ← [1,2]
result ← values
FOR EACH item IN values
{
  APPEND(result,item)
}
DISPLAY(result)
DISPLAY(values)`, [[1,2,1,2],[1,2]]);
});
test('nested calls preserve caller parameters and return into a pending expression', () => {
  outputs(`PROCEDURE double(value)
{
  RETURN(value * 2)
}
PROCEDURE combine(value, offset)
{
  local ← double(value)
  RETURN(local + double(offset))
}
value ← 99
DISPLAY(1 + combine(3,4) * 2)
DISPLAY(value)`, [29,99]);
});
test('procedure-local list changes and returned copies do not mutate the caller list', () => {
  outputs(`PROCEDURE change(items)
{
  items[1] ← 50
  RETURN(items)
}
source ← [10,20]
result ← change(source)
result[2] ← 70
DISPLAY(source)
DISPLAY(result)`, [[10,20],[50,70]]);
});
test('early RETURN stops remaining loop and procedure statements', () => {
  outputs(`PROCEDURE firstMatch(items)
{
  FOR EACH value IN items
  {
    IF(value >= 30)
    {
      RETURN(value)
    }
  }
  RETURN(-1)
  DISPLAY("unreachable")
}
DISPLAY(firstMatch([10,30,45]))
DISPLAY(firstMatch([10,20]))`, [30,-1]);
});
test('this lab requires explicit parameters for procedure inputs and keeps locals private', () => {
  runtimeError(`PROCEDURE hidden()
{
  RETURN(globalValue)
}
globalValue ← 7
DISPLAY(hidden())`, /globalValue has no value in hidden/);
  runtimeError(`PROCEDURE makeLocal()
{
  localValue ← 7
  RETURN(localValue)
}
result ← makeLocal()
DISPLAY(localValue)`, /localValue has no value in main/);
});
test('a no-return procedure can be called as an action but not used as a value', () => {
  const definition = `PROCEDURE announce()
{
  DISPLAY("Hello")
}`;
  outputs(definition + '\nannounce()\nDISPLAY("After")', ['Hello','After']);
  const program = runtimeError(definition + '\nresult ← announce()\nDISPLAY("After")', /did not return a value/);
  assert.deepEqual(program.outputs, ['Hello']);
  assert.throws(() => new Program('RETURN(1)'), /RETURN belongs inside a procedure/);
});
test('local goal counts reset across calls, equality counts, empty input returns zero', () => {
  outputs(`PROCEDURE countGoals(sessions,goal)
{
  hits ← 0
  FOR EACH minutes IN sessions
  {
    IF(minutes >= goal)
    {
      hits ← hits + 1
    }
  }
  RETURN(hits)
}
sessions ← [20,30,45,10]
DISPLAY(countGoals(sessions,30))
DISPLAY(countGoals(sessions,50))
DISPLAY(countGoals([29,30,31],30))
DISPLAY(countGoals([],30))`, [2,0,2,0]);
});
test('pretest UNTIL skips an initially satisfied loop and consumes no input', () => {
  const program = execute(`REPEAT UNTIL(true)
{
  unused ← INPUT()
}
DISPLAY(INPUT())`, '42');
  assert.deepEqual(program.outputs, [42]);
  assert.equal(program.inputPosition, 1);
});
test('nonterminating loops stop at the classroom limit, not at a false success', () => {
  const program = runtimeError(`REPEAT UNTIL(false)
{
}
DISPLAY("After")`, /classroom limit/, {limit:25});
  assert.equal(program.steps, 25);
  assert.deepEqual(program.outputs, []);
  runtimeError(`PROCEDURE again()
{
  again()
}
again()`, /Recursion is outside this classroom subset/);
});
test('sensors use relative headings and never move or rotate the robot', () => {
  const program = execute(`DISPLAY(CAN_MOVE(forward))
DISPLAY(CAN_MOVE(left))
DISPLAY(CAN_MOVE(right))
DISPLAY(CAN_MOVE(backward))`, '', {robot:robotAt(4,2,0)});
  assert.deepEqual(program.outputs, [false,true,true,true]);
  assert.deepEqual(state(program), [4,2,0]);
  assert.deepEqual(state(execute('ROTATE_LEFT()','',{robot:true})), [4,1,0]);
  assert.deepEqual(state(execute('ROTATE_RIGHT()','',{robot:true})), [4,1,2]);
});
const route = `REPEAT 3 TIMES
{
  MOVE_FORWARD()
}
ROTATE_LEFT()
REPEAT 3 TIMES
{
  MOVE_FORWARD()
}`;
test('the classroom route reaches the goal but the goal itself does not terminate execution', () => {
  const program = execute(route + '\nDISPLAY("After goal")\nROTATE_RIGHT()', '', {robot:true});
  assert.deepEqual(program.outputs, ['After goal']);
  assert.deepEqual(state(program), [1,4,1]);
  const alternative = route.replace('ROTATE_LEFT()', 'REPEAT 3 TIMES\n{\n  ROTATE_RIGHT()\n}');
  assert.deepEqual(state(execute(route,'',{robot:true})), [1,4,0]);
  assert.deepEqual(state(execute(alternative,'',{robot:true})), [1,4,0]);
});
test('wall and exterior collisions leave the state unchanged and halt later commands', () => {
  for (const robot of [robotAt(4,2,0),robotAt(1,4,0)]) {
    const program = runtimeError('MOVE_FORWARD()\nROTATE_RIGHT()\nDISPLAY("later")', /Blocked move/, {robot});
    assert.deepEqual(state(program), [robot.row,robot.col,robot.direction]);
    assert.deepEqual(program.outputs, []);
  }
  const guard = execute('IF(CAN_MOVE(forward))\n{\n  MOVE_FORWARD()\n}\nROTATE_RIGHT()', '', {robot:robotAt(4,2,0)});
  assert.deepEqual(state(guard), [4,2,1]);
});
test('linear and binary produce the taught successful and missing-target traces', () => {
  const values = [3,8,12,19,27,34,50];
  assert.deepEqual(search(values,34).map(step => step.value), [19,34]);
  assert.deepEqual(search(values,28).map(step => step.value), [19,34,27]);
  assert.equal(search(values,28).at(-1).found, false);
  assert.equal(search(values,34,'linear').length, 6);
  assert.equal(search(values,3,'linear').length, 1);
  assert.equal(search(values,3).length, 3);
  assert.equal(search(values,50).length, 3);
  assert.equal(search([1,2,3,4],1)[0].index, 2, 'even intervals use the lower midpoint');
});
test('search covers both endpoints, missing extremes, singleton, duplicates, and sorted prerequisite', () => {
  assert.throws(() => search([9,1,7,3,5],9), /sorted/);
  assert.equal(search([9,1,7,3,5],9,'linear').at(-1).found, true);
  assert.equal(search([2,2,2],2).at(-1).found, true);
  for (let length = 1; length <= 20; length++) {
    const values = Array.from({length},(_,index) => 2 * index);
    for (let target = -1; target <= 2 * length; target++) {
      const expected = values.includes(target);
      for (const mode of ['linear','binary']) {
        const steps = search(values,target,mode), last = steps.at(-1);
        assert.equal(last.found, expected, `${mode} n=${length}, target=${target}`);
        assert.equal(last.done, true);
        assert.ok(steps.length <= (mode === 'linear' ? length : Math.floor(Math.log2(length)) + 1));
        assert.equal(new Set(steps.map(s => s.index)).size, steps.length);
        steps.forEach((step,index) => {
          assert.equal(step.comparison, index+1);
          assert.equal(values[step.index-1], step.value);
          assert.ok(step.index >= step.before[0] && step.index <= step.before[1]);
        });
        if (!expected) assert.ok(last.after[0] > last.after[1], 'not found ends with an empty interval');
      }
    }
  }
});
test('growth compares operation counts and modeled durations without changing the formulas', () => {
  assert.deepEqual(growth(8,2).map(row => [row.steps,row.seconds]), [[8,4],[64,32],[256,128]]);
  assert.deepEqual(growth(12).map(row => row.steps), [12,144,4096]);
  for (const n of [0,1.5,61,NaN,Infinity]) assert.throws(() => growth(n));
  assert.throws(() => growth(8,0));
});
test('growth rejects a non-finite processing rate instead of producing NaN or artificial zero time', () => {
  for (const rate of [NaN,Infinity,-Infinity]) assert.throws(() => growth(8,rate));
});

if (failures.length) {
  for (const failure of failures) console.error('FAIL · '+failure.name+'\n  '+failure.message);
  console.error(`${passed} passed; ${failures.length} failed.`);
  process.exitCode = 1;
} else console.log(`Algorithms: ${passed} behavioral groups passed (including exhaustive search targets for lengths 1–20).`);
