/* Original classroom practice; counts are not AP score estimates. */
(function(root){'use strict';
function make(bank){
 const sets=new Map(bank.sets.map(s=>[s.id,s])),qs=new Map(bank.questions.map(q=>[q.id,q]));
 const FORMAT='apcsp-review-v1';
 function freshSet(id){const s=sets.get(id);if(!s)throw Error('Unknown set');return {answers:{},submitted:false,remainingMs:s.minutes*60000,deadline:null};}
 function empty(){return {format:FORMAT,sets:Object.fromEntries([...sets.keys()].map(id=>[id,freshSet(id)]))};}
 function normalize(raw){if(!raw||raw.format!==FORMAT||!raw.sets||typeof raw.sets!=='object')throw Error('Invalid review record');const out=empty();for(const [id,s] of sets){const r=raw.sets[id];if(!r||typeof r.submitted!=='boolean'||!r.answers||typeof r.answers!=='object'||Array.isArray(r.answers))throw Error('Invalid set record');if(!Number.isFinite(r.remainingMs)||r.remainingMs<0||r.remainingMs>s.minutes*60000)throw Error('Invalid time');if(r.deadline!==null&&(!Number.isSafeInteger(r.deadline)||r.deadline<0))throw Error('Invalid clock');const answers={};for(const key of Object.keys(r.answers)){if(!s.questionIds.includes(key))throw Error('Unknown question');const a=r.answers[key];if(!Array.isArray(a)||a.length>qs.get(key).answer.length||a.some(x=>!Number.isInteger(x)||x<0||x>=qs.get(key).options.length)||new Set(a).size!==a.length)throw Error('Invalid answer selection');answers[key]=a.slice().sort((a,b)=>a-b);}out.sets[id]={answers,submitted:r.submitted,remainingMs:r.remainingMs,deadline:r.deadline};}return out;}
 function remaining(record,now){return record.deadline===null?record.remainingMs:Math.max(0,Math.min(record.remainingMs,record.deadline-now));}
 function pause(record,now){record.remainingMs=remaining(record,now);record.deadline=null;return record;}
 function start(record,now){if(!record.submitted&&record.deadline===null&&record.remainingMs>0)record.deadline=now+record.remainingMs;return record;}
 function select(record,qid,index,checked){const q=qs.get(qid);if(!q||!Number.isInteger(index)||index<0||index>=q.options.length)throw Error('Unknown option');if(record.submitted)throw Error('Start another attempt to change answers');let a=(record.answers[qid]||[]).filter(x=>x!==index);if(checked){if(q.answer.length===1)a=[index];else if(a.length<q.answer.length)a.push(index);else return false;}record.answers[qid]=a.sort((a,b)=>a-b);return true;}
 function grade(id,record){const s=sets.get(id);if(!s)throw Error('Unknown set');const rows=s.questionIds.map(qid=>{const q=qs.get(qid),a=record.answers[qid]||[],expected=[...q.answer].sort((a,b)=>a-b);return {id:qid,topic:q.topic,selected:a.slice(),correct:a.length===expected.length&&a.every((x,i)=>x===expected[i]),blank:a.length===0,incomplete:a.length!==expected.length};});const byTopic={};for(const row of rows){const t=byTopic[row.topic]||(byTopic[row.topic]={correct:0,total:0});t.total++;if(row.correct)t.correct++;}return {rows,correct:rows.filter(r=>r.correct).length,total:rows.length,unanswered:rows.filter(r=>r.blank).length,byTopic};}
 return {FORMAT,empty,freshSet,normalize,remaining,pause,start,select,grade};
}
if(typeof module!=='undefined'&&module.exports)module.exports={make};else root.CSPReview={make};
})(typeof window!=='undefined'?window:this);
