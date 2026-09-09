const dataSet=__DATASET__;
const D=DataLab;
const byId=id=>document.getElementById(id);
const fmt=x=>x===null?'—':Number(x.toFixed(2)).toString();
const escapeText=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cleaned=false;
const cleanedData=D.cleanRows(dataSet.rows);
function graph(){
 const count=Number(byId('sample-count').value),levels=Number(byId('levels').value),s=D.samples(count,levels);
 const px=t=>55+t*680,py=v=>240-v*200;
 const curve=Array.from({length:241},(_,i)=>`${px(i/240)},${py(D.wave(i/240))}`).join(' ');
 const dots=s.map(p=>`<circle cx="${px(p.t)}" cy="${py(p.value)}" r="5" fill="#bd7628"/>`).join('');
 const marks=s.map(p=>`<line x1="${px(p.t)}" y1="240" x2="${px(p.t)}" y2="${py(p.value)}" stroke="#d3c0a7"/>`).join('');
 byId('signal').innerHTML=`<svg viewBox="0 0 790 290" role="img" aria-label="Continuous signal in blue; stored sample values as amber dots. More sample points capture more detail in time; more levels reduce amplitude rounding."><path d="M55 35V240H755" fill="none" stroke="#758a9b"/><polyline points="${curve}" fill="none" stroke="#225a83" stroke-width="3"/>${marks}${dots}<text x="55" y="268">0 s</text><text x="710" y="268">1 s</text><text x="5" y="47">1</text><text x="5" y="240">0</text></svg>`;
 const bits=Math.log2(levels);byId('sample-summary').textContent=`${count} stored samples × ${bits} bits per sample = ${count*bits} bits of amplitude payload. Timing information and other metadata excluded.`;
 byId('sample-codes').textContent=s.map(p=>p.code.toString(2).padStart(bits,'0')).join(' ');
}
byId('sample-count').onchange=graph;byId('levels').onchange=graph;
function rle(){
 try{const r=D.encodeRLE(byId('rle-input').value);byId('rle-error').textContent='';byId('encoded').textContent=r.encoded;byId('decoded').textContent=D.decodeRLE(r.encoded);byId('rle-size').textContent=`${r.originalBytes} raw bytes → ${r.encodedBytes} encoded bytes. ${r.encodedBytes<=r.originalBytes?'Saved':'Expanded by'} ${Math.abs(r.originalBytes-r.encodedBytes)} byte(s).`;
 byId('rle-percent').textContent=`Encoded size is ${fmt(r.encodedBytes/r.originalBytes*100)}% of the original; space saved is ${fmt((r.originalBytes-r.encodedBytes)/r.originalBytes*100)}%. Negative savings means expansion.`;
 }catch(e){byId('rle-error').textContent=e.message;for(const id of ['encoded','decoded','rle-size','rle-percent'])byId(id).textContent='—';}
}
byId('rle-input').oninput=rle;
function makeRows(target,rows,columns){
 target.replaceChildren();for(const row of rows){const tr=document.createElement('tr');for(const col of columns){const td=document.createElement('td');td.textContent=row[col]===null?'Missing':(col==='mode'&&row[col]!==row[col].trim()?JSON.stringify(row[col]):String(row[col]));tr.append(td);}target.append(tr);}
}
function renderData(){
 const mode=byId('mode').value,omit=byId('omit-unusual').checked;
 const rows=cleaned?D.selectRows(cleanedData.rows,mode,omit):dataSet.rows;
 makeRows(byId('data-rows'),rows,['id','mode','minutes','distance_km']);
 byId('mode').disabled=!cleaned;byId('omit-unusual').disabled=!cleaned;
 byId('data-status').textContent=cleaned?`Analysis: ${rows.length} of 13 cleaned records shown. ${omit?'Sensitivity comparison: the 120-minute value is temporarily omitted. This is not evidence that it should be deleted.':'The 120-minute value is retained by default.'}`:'Raw data: 16 records. Inspect the problems before applying the declared cleaning rules. Statistics are withheld until the data has been checked.';
 byId('clean').textContent=cleaned?'Return to raw data':'Apply cleaning rules';
 byId('analysis').hidden=!cleaned;byId('clean-log').hidden=!cleaned;
 makeRows(byId('log-rows'),cleanedData.log,['id','action','reason']);
 if(!cleaned)return;
 const summary=D.statistics(rows);byId('n').textContent=summary.n;byId('mean').textContent=fmt(summary.mean);byId('median').textContent=fmt(summary.median);
 const groups=['Walk','Bike','Bus'].map(name=>({name,...D.statistics(rows.filter(x=>x.mode===name))}));
 const max=60;
 const bars=groups.map((g,i)=>{const y=38+i*65,w=g.n?g.mean/max*540:0;return `<text x="10" y="${y+18}">${g.name}</text><rect x="100" y="${y}" width="${w}" height="26" fill="#225a83"/><text x="${Math.max(110,110+w)}" y="${y+18}">${g.n?fmt(g.mean)+' min · n='+g.n:'No records'}</text>`;}).join('');
 const ticks=[0,15,30,45,60].map(t=>`<line x1="${100+t/max*540}" y1="228" x2="${100+t/max*540}" y2="234" stroke="#677e8e"/><text x="${100+t/max*540}" y="252" text-anchor="middle">${t}</text>`).join('');
 byId('bars').innerHTML=`<svg viewBox="0 0 790 280" role="img" aria-label="Mean travel time by selected mode. Horizontal axis starts at zero and extends to 60 minutes; labels include group sample sizes.">${bars}<path d="M100 228H640" stroke="#677e8e"/>${ticks}<text x="315" y="274">Mean time (minutes)</text></svg>`;
 byId('group-table').innerHTML=groups.map(g=>`<tr><td>${escapeText(g.name)}</td><td>${g.n}</td><td>${fmt(g.mean)}</td><td>${fmt(g.median)}</td></tr>`).join('');
}
byId('clean').onclick=()=>{cleaned=!cleaned;byId('mode').value='All';byId('omit-unusual').checked=false;renderData();};
byId('mode').onchange=renderData;byId('omit-unusual').onchange=renderData;
function setTab(name){for(const value of ['sampling','compression','data']){byId(value+'-panel').hidden=value!==name;byId(value+'-tab').setAttribute('aria-pressed',String(value===name));}history.replaceState(null,'','#'+name);}
for(const name of ['sampling','compression','data'])byId(name+'-tab').onclick=()=>setTab(name);
graph();rle();renderData();if(['#sampling','#compression','#data'].includes(location.hash))setTab(location.hash.slice(1));
