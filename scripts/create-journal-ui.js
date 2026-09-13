(function(){'use strict';
const M=window.CSPCreateJournal,KEY='apcsp-create-journal-v1';const $=id=>document.getElementById(id);let state=M.empty();
function status(message,error=false){$('save-status').textContent=message;$('save-status').classList.toggle('error',error);}
function metrics(){const t=M.totals(state);$('m-class').textContent=t.recordedClassMinutes+' min';$('m-outside').textContent=t.outsideMinutes+' min';$('m-sessions').textContent=t.sessionsWithRecords+' / 6';}
function paint(){for(const s of state.sessions){for(const key of ['date','classMinutes','outsideMinutes','status','work','evidence','next'])$(s.id+'-'+key).value=s[key];}$('extra-minutes').value=state.extraClassMinutes;$('extra-note').value=state.extraNote;metrics();}
function numberInput(id){const el=$(id);if(el.value===''||!el.checkValidity())throw Error('请填写0–1440之间的整数分钟；没有记录的时间填0。');return Number(el.value);}
function collect(){const next={format:M.FORMAT,extraClassMinutes:numberInput('extra-minutes'),extraNote:$('extra-note').value,sessions:M.IDS.map(id=>({id,date:$(id+'-date').value,classMinutes:numberInput(id+'-classMinutes'),outsideMinutes:numberInput(id+'-outsideMinutes'),status:$(id+'-status').value,work:$(id+'-work').value,evidence:$(id+'-evidence').value,next:$(id+'-next').value}))};return M.validate(next);}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));status('已保存到当前浏览器。请定期导出备份；换设备或清理浏览器可能丢失记录。');}catch(e){status('浏览器暂时无法保存。当前页面仍保留记录，请立即导出备份。',true);}metrics();}
function changed(){try{state=collect();persist();}catch(e){status('有输入尚未保存：'+e.message,true);}}
function tab(){const id=M.IDS.includes(location.hash.slice(1))?location.hash.slice(1):'C01';for(const key of M.IDS){$('session-'+key).hidden=key!==id;const link=$('nav-'+key);if(key===id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}}
try{const saved=localStorage.getItem(KEY);if(saved){state=M.validate(JSON.parse(saved));status('已恢复当前浏览器的过程记录。请定期导出备份。');}}catch(e){status('未能读取原有浏览器记录；本页先显示空白表。可导入已有备份，或开始新记录。',true);}
paint();tab();window.addEventListener('hashchange',tab);
document.querySelectorAll('input:not([type=file]),textarea,select').forEach(el=>el.addEventListener('input',changed));
$('export-journal').addEventListener('click',()=>{try{state=collect();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AP_CSP_Create_Journal_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);persist();}catch(e){status('无法导出：'+e.message,true);}});
$('import-journal').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{if(file.size>2000000)throw Error('备份文件超过2 MB。');const parsed=M.validate(JSON.parse(await file.text()));state=parsed;paint();persist();}catch(e){status('未导入，当前记录保持不变：'+e.message,true);}finally{event.target.value='';}});
})();
