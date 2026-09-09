(function(root){
'use strict';
function encodeRLE(text){
  if(!/^[A-Z]{1,60}$/.test(text))throw new Error('Enter 1–60 uppercase A–Z characters, with no spaces.');
  const pairs=[];
  for(const ch of text){const last=pairs[pairs.length-1];if(last&&last[1]===ch&&last[0]<9)last[0]++;else pairs.push([1,ch]);}
  return {pairs,encoded:pairs.map(x=>x.join('')).join(''),originalBytes:text.length,encodedBytes:2*pairs.length};
}
function decodeRLE(code){
  if(!/^(?:[1-9][A-Z])+$/.test(code))throw new Error('Expected pairs: one count from 1 to 9, then one A–Z symbol.');
  return [...code.matchAll(/([1-9])([A-Z])/g)].map(x=>x[2].repeat(Number(x[1]))).join('');
}
function wave(t){return .5+.32*Math.sin(2*Math.PI*t)+.12*Math.sin(6*Math.PI*t);}
function samples(count,levels){return Array.from({length:count},(_,i)=>{const t=i/(count-1),raw=wave(t),code=Math.round(raw*(levels-1));return {t,raw,code,value:code/(levels-1)};});}
function cleanRows(rows){
  const seen=new Map(),kept=[],log=[];
  for(const original of rows){
    const row={...original,mode:original.mode.trim().toLowerCase().replace(/^./,c=>c.toUpperCase())};
    if(row.mode!==original.mode)log.push({id:row.id,action:'Normalize',reason:'Standardized mode label to '+row.mode+'.'});
    if(seen.has(row.id)){
      const first=seen.get(row.id);const same=JSON.stringify(first)===JSON.stringify(row);
      log.push({id:row.id,action:same?'Exclude':'Review',reason:same?'Later identical duplicate response.':'Conflicting duplicate: investigate before analysis.'});continue;
    }
    seen.set(row.id,row);
    if(row.minutes===null||row.minutes===''){log.push({id:row.id,action:'Exclude',reason:'Missing travel time; do not replace with zero.'});continue;}
    if(typeof row.minutes!=='number'||!Number.isFinite(row.minutes)||row.minutes<0){log.push({id:row.id,action:'Exclude',reason:'Invalid travel time.'});continue;}
    if(!['Walk','Bike','Bus'].includes(row.mode)){log.push({id:row.id,action:'Review',reason:'Unknown travel mode.'});continue;}
    if(row.minutes===120)log.push({id:row.id,action:'Retain / flag',reason:'Unusually long, but no evidence that it is an error.'});
    kept.push(row);
  }
  return {rows:kept,log};
}
function statistics(rows){
  const values=rows.map(x=>x.minutes).sort((a,b)=>a-b),n=values.length;
  if(!n)return {n:0,mean:null,median:null};
  return {n,mean:values.reduce((a,b)=>a+b,0)/n,median:n%2?values[(n-1)/2]:(values[n/2-1]+values[n/2])/2};
}
function selectRows(rows,mode='All',omitUnusual=false){return rows.filter(x=>(mode==='All'||x.mode===mode)&&(!omitUnusual||x.minutes!==120));}
const api={encodeRLE,decodeRLE,wave,samples,cleanRows,statistics,selectRows};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DataLab=api;
})(typeof window!=='undefined'?window:this);
