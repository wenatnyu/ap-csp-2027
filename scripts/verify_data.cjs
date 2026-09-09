const assert=require('node:assert/strict');const fs=require('node:fs');const D=require('./data-core.js');
const raw=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/chapter2-commute.json'),'utf8'));
for(const text of ['AAABBCCCCA','ABCABC','A'.repeat(10),'Z'.repeat(60),'ABCDEFGHIJKLMNOPQRSTUVWXYZ']){const r=D.encodeRLE(text);assert.equal(D.decodeRLE(r.encoded),text);assert.equal(r.encoded.length,r.encodedBytes);}
assert.equal(D.encodeRLE('AAABBCCCCA').encoded,'3A2B4C1A');assert.equal(D.encodeRLE('ABCABC').encodedBytes,12);assert.equal(D.encodeRLE('A'.repeat(10)).encoded,'9A1A');assert.throws(()=>D.decodeRLE('10A'));
const clean=D.cleanRows(raw.rows);assert.equal(raw.rows.length,16);assert.equal(clean.rows.length,13);assert.equal(clean.log.filter(x=>x.action==='Exclude').length,3);assert.ok(clean.rows.some(x=>x.id==='14'&&x.minutes===120));assert.equal(clean.rows.find(x=>x.id==='15').mode,'Bus');
let s=D.statistics(clean.rows);assert.equal(s.n,13);assert.equal(s.mean,381/13);assert.equal(s.median,20);
const expected={Walk:[4,45/4,11],Bike:[3,53/3,18],Bus:[6,283/6,32.5]};
for(const [mode,want] of Object.entries(expected)){const t=D.statistics(D.selectRows(clean.rows,mode));assert.deepEqual([t.n,t.mean,t.median],want);}
s=D.statistics(D.selectRows(clean.rows,'All',true));assert.deepEqual([s.n,s.mean,s.median],[12,21.75,19]);assert.equal(D.statistics(D.selectRows(clean.rows,'Bus',true)).mean,32.6);
for(const count of [4,8,16])for(const levels of [4,8,16]){const a=D.samples(count,levels);assert.equal(a.length,count);assert.equal(a[0].t,0);assert.equal(a.at(-1).t,1);assert.ok(a.every(p=>Number.isInteger(p.code)&&p.code>=0&&p.code<levels));}
console.log('Data lab verified: all three experiments, RLE round-trip and size, 16→13 cleaning, group statistics, sensitivity results, sample codes.');
