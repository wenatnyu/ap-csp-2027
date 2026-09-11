/* Deterministic classroom models; these are not network measurements. */
(function(root){'use strict';
const NODES=['S','A','B','C','D','T'];
const EDGES=[['S','A'],['S','B'],['A','C'],['A','D'],['B','D'],['C','T'],['D','T'],['C','D']];
const POS={S:[65,160],A:[230,65],B:[230,255],C:[425,65],D:[425,255],T:[590,160]};
const edgeKey=(a,b)=>[a,b].sort().join('-');
function shortestPath(disabled=[],start='S',end='T'){
  if(!NODES.includes(start)||!NODES.includes(end))throw Error('Unknown network node.');
  const off=new Set(disabled),queue=[[start]],seen=new Set([start]);
  while(queue.length){const path=queue.shift(),last=path.at(-1);if(last===end)return path;
    const neighbors=EDGES.filter(([a,b])=>!off.has(edgeKey(a,b))&&(a===last||b===last)).map(([a,b])=>a===last?b:a).sort();
    for(const n of neighbors)if(!seen.has(n)){seen.add(n);queue.push([...path,n]);}
  }return null;
}
function splitPackets(text,size=3){const chars=Array.from(text);if(!chars.length||chars.length>48||!Number.isInteger(size)||size<1||size>12)throw Error('Use 1–48 characters and a positive packet payload size up to 12.');const count=Math.ceil(chars.length/size);return Array.from({length:count},(_,i)=>({id:i+1,total:count,payload:chars.slice(i*size,(i+1)*size).join('')}));}
class Transfer{
  constructor(text='HELLO AP CSP'){this.packets=splitPackets(text);this.received=new Map();this.log=[];}
  receive(id){const p=this.packets.find(p=>p.id===id);if(!p)throw Error('Unknown packet identifier.');const duplicate=this.received.has(id);if(!duplicate)this.received.set(id,p.payload);this.log.push({id,duplicate,count:this.received.size});return !duplicate;}
  get complete(){return this.received.size===this.packets.length;}
  get message(){return this.complete?this.packets.map(p=>this.received.get(p.id)).join(''):null;}
  get missing(){return this.packets.filter(p=>!this.received.has(p.id)).map(p=>p.id);}
}
function schedule(jobs,processors=2,serial=2,overhead=0){
  if(!Array.isArray(jobs)||!jobs.length||jobs.length>12||jobs.some(n=>!Number.isFinite(n)||n<=0||n>20)||![1,2,3,4].includes(processors)||!Number.isFinite(serial)||serial<0||serial>20||!Number.isFinite(overhead)||overhead<0||overhead>6)throw Error('Use 1–12 positive job times up to 20, 1–4 processors, setup 0–20 and overhead 0–6.');
  const free=Array(processors).fill(serial),assignments=[];
  jobs.forEach((duration,i)=>{const start=Math.min(...free),processor=free.indexOf(start),end=start+duration;assignments.push({job:i+1,processor:processor+1,start,end,duration});free[processor]=end;});
  const finish=Math.max(...free),total=finish+overhead,baseline=serial+jobs.reduce((s,x)=>s+x,0);
  return {assignments,finish,total,baseline,speedup:baseline/total,serial,overhead,processors};
}
const api={NODES,EDGES,POS,edgeKey,shortestPath,splitPackets,Transfer,schedule};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CSPNetwork=api;
})(typeof window!=='undefined'?window:this);
