/* Behavioral checks for the fictional Chapter 6 models. Run: node scripts/verify_impact.cjs */
'use strict';
const assert = require('node:assert/strict');
const impact = require('./impact-core.js');
let checks = 0;
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
const rejects = (fn, label) => { assert.throws(fn, Error, label); checks++; };
const truth = (value, label) => { assert.ok(value, label); checks++; };

// Independent, hand-calculated truth table: bit order connection, device, skills, accessibility.
const ids = ['connection', 'device', 'skills', 'accessibility'];
const accessTotals = [40,60,55,85,50,70,65,95,45,65,60,90,55,75,70,100];
const supportCosts = [0,2,2,4,1,3,3,5,1,3,3,5,2,4,4,6];
for (let mask = 0; mask < 16; mask++) {
  const selected = ids.filter((_, bit) => mask & (1 << bit));
  for (let budget = 0; budget <= 6; budget++) {
    const result = impact.access(selected, budget);
    equal(result.eligible, accessTotals[mask], `Access count: mask ${mask}, budget ${budget}`);
    equal(result.cost, supportCosts[mask], `Support cost: mask ${mask}`);
    equal(result.withinBudget, supportCosts[mask] <= budget, `Budget boundary: mask ${mask}, budget ${budget}`);
    equal(result.total, 100, 'Population total is fixed, not number of respondents');
  }
}
equal(impact.access(['connection']).groups.at(-1).remaining, ['device'], 'Connection alone leaves the dual-barrier group blocked');
equal(impact.access(['device']).groups.at(-1).remaining, ['connection'], 'Device alone leaves the dual-barrier group blocked');
equal(impact.access(['connection', 'device']).groups.at(-1).eligible, true, 'Both supports unlock the dual-barrier group');
equal(impact.access(['connection', 'connection', 'device', 'device']), impact.access(['connection', 'device']), 'Repeated selections do not increase cost or access');
for (const selected of [null, 'connection', ['network'], ['connection', null], [1]]) rejects(() => impact.access(selected), 'Invalid intervention selection');
for (const budget of [-1, 7, 1.5, NaN, Infinity, '4', null]) rejects(() => impact.access([], budget), 'Invalid budget');
const damagedCopy = impact.access([]);
damagedCopy.groups[0].count = 999;
damagedCopy.groups.at(-1).barriers.push('invented');
equal(impact.access([]).eligible, 40, 'Mutating one result does not alter later counts');
equal(impact.access([]).groups.at(-1).barriers, ['connection', 'device'], 'Returned nested barriers are independent');

for (const [north, south, northNeed, southNeed, samplePercent] of [
  [80,20,16,16,32], [60,40,12,32,44], [40,60,8,48,56], [5,95,1,76,77], [95,5,19,4,23],
]) {
  const result = impact.bias(north);
  equal([result.north, result.south, result.northNeed, result.southNeed, result.samplePercent],
    [north, south, northNeed, southNeed, samplePercent], `Sample construction at North ${north}`);
  equal(result.populationWeightedPercent, 44, 'Population weighting remains based on 60/40, not sample mix');
}
for (const north of [0, 100, 6, 7.5, -5, NaN, Infinity, '80', null]) rejects(() => impact.bias(north), 'Invalid sample count');

const minimal = impact.privacy();
equal([minimal.purposeSupported, minimal.minimal, minimal.missing, minimal.extra], [true, true, [], []], 'Goal uses exactly zone and shadeRating');
equal(impact.privacy([]).purposeSupported, false, 'No fields cannot support the comparison');
equal(impact.privacy(['zone']).missing, ['Need-more-shade response'], 'Zone alone omits the outcome');
equal(impact.privacy(['shadeRating']).missing, ['North / South zone'], 'Response alone omits the grouping');
const extra = impact.privacy(['zone','shadeRating','exactGPS','email','name']);
equal([extra.purposeSupported, extra.minimal, extra.extra.length], [true, false, 3], 'Useful required fields do not justify extra personal data');
equal(impact.privacy(['zone','zone','shadeRating']).selected, ['zone','shadeRating'], 'Repeated privacy fields do not duplicate collection');
const raw = impact.privacy(['zone','shadeRating'], 'raw');
equal(raw.release, 'raw', 'Raw release retains its stated mode');
truth(raw.risks.some(x => x.includes('individual records')), 'Raw release warns about individual-record exposure');
truth(minimal.risks.some(x => /small groups|linkage/.test(x)), 'Aggregation retains residual risk');
truth(minimal.risks.some(x => /Encryption does not decide/.test(x)), 'Encryption does not substitute for a collection/release decision');
for (const fields of [null, 'zone', ['unknown']]) rejects(() => impact.privacy(fields), 'Invalid fields');
rejects(() => impact.privacy(['zone'], 'anonymous'), 'Unimplemented release mode');

for (const factors of [[], ['password'], ['password','pin'], ['phone','phone']]) equal(impact.authentication(factors).multifactor, false, 'One category is not MFA');
for (const factors of [['password','phone'], ['pin','fingerprint'], ['phone','fingerprint'], ['password','phone','fingerprint']]) equal(impact.authentication(factors).multifactor, true, 'Distinct factor categories qualify in this model');
equal(impact.authentication(['password','pin']).categories, ['knowledge'], 'Two knowledge examples remain one category');
for (const factors of [null, 'password', ['face']]) rejects(() => impact.authentication(factors), 'Unlisted factor');

const keys = ['shared','blakePublic','blakePrivate','alexPublic'];
for (const mode of ['symmetric','public']) for (const encryption of keys) for (const decryption of keys) {
  const result = impact.keyRoles(mode, encryption, decryption);
  const correct = mode === 'symmetric' ? encryption === 'shared' && decryption === 'shared'
    : encryption === 'blakePublic' && decryption === 'blakePrivate';
  equal(result.correct, correct, `${mode}: ${encryption} / ${decryption}`);
}
equal(impact.keyRoles('public','alexPublic','blakePrivate').encryptionCorrect, false, 'Use receiver Blake public key, not sender Alex public key');
equal(impact.keyRoles('public','blakePrivate','blakePublic').correct, false, 'Reversing keys is not the confidentiality model');
rejects(() => impact.keyRoles('hash','shared','shared'), 'Unknown key model');
rejects(() => impact.keyRoles('public','unknown','blakePrivate'), 'Unknown key');

for (const asset of ['icon','chart','code','photo']) {
  equal(impact.licenseReview(asset,'ask').ready, false, 'A request alone is not permission');
  equal(impact.licenseReview(asset,'replace').ready, true, 'Choose an authorized replacement without using this asset');
  truth(impact.licenseReview(asset,'replace').explanation.includes('Do not use this asset'), 'Replacement approval does not approve the old asset');
}
for (const credit of [false,true]) for (const changes of [false,true]) equal(impact.licenseReview('icon','reuse',credit,changes).ready, credit && changes, 'Icon requires both credit and a changes/unchanged statement');
equal(impact.licenseReview('code','reuse').ready, true, 'The stated team-original code can be used for this project');
for (const asset of ['chart','photo']) for (const credit of [false,true]) for (const changes of [false,true]) equal(impact.licenseReview(asset,'reuse',credit,changes).ready, false, 'Credit and change notes cannot invent reuse permission');
rejects(() => impact.licenseReview('unknown','reuse'), 'Unknown asset');
rejects(() => impact.licenseReview('icon','download'), 'Unknown action');
console.log(`Chapter 6 impact models: ${checks} behavioral checks passed.`);
