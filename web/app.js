import {renderPage,renderCard} from './views.js';
import {bindReadingViews,fillReadingViews} from './readings.js';
import {escapeHtml as h,matchesTheory,makeSubmission} from './core.js';
import {setBasePath,parseLocation,routeUrl,hashUrl,rewriteLinks} from './urls.js';
const rootUrl=new URL('./',import.meta.url);setBasePath(rootUrl.pathname);
const main=document.querySelector('main');let db;
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView();});
const cardFor=t=>renderCard(db,t);
function refreshDirectory(f,parking){const filters={...f,...(parking?{status:f.status||'Parked'}:{})};const rows=db.theories.filter(t=>matchesTheory(t,filters,db));document.querySelector('#result-count').textContent=`${rows.length} of ${parking?db.theories.filter(t=>t.status===filters.status).length:db.theories.length} investigations`;document.querySelector('#theory-results').innerHTML=rows.length?rewriteLinks(rows.map(t=>cardFor(t)).join('')):'<div class="empty"><strong>No matching investigations.</strong>Try a different category, status or search term. An empty result does not mean the archive never discussed the idea.</div>';document.querySelector('#announcement').textContent=`${rows.length} investigations shown`;}
function bind(path,f){
 document.querySelectorAll('[data-scroll]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'})));
 const ff=document.querySelector('#filters');if(ff){ff.addEventListener('submit',e=>e.preventDefault());let filterSignature;const update=()=>{const state=Object.fromEntries(new FormData(ff));if(path==='parking')state.status=f.status||'Parked';const p=new URLSearchParams(Object.entries(state).filter(([,v])=>v));if(filterSignature===p.toString())return;filterSignature=p.toString();history.replaceState(null,'',routeUrl(path,null,Object.fromEntries(p)));refreshDirectory(state,path==='parking');};ff.addEventListener('input',update);ff.addEventListener('change',update);document.querySelector('#clear-filters').addEventListener('click',()=>{location.assign(routeUrl(path,null,path==='parking'?{status:f.status||'Parked'}:{}));});refreshDirectory(f,path==='parking');}
 for(const id of ['archive-search','tests-search']){const form=document.querySelector('#'+id);if(form)form.addEventListener('submit',e=>{e.preventDefault();location.assign(routeUrl(id==='archive-search'?'archive':'tests',null,{q:new FormData(form).get('q')||''}));});}
 const form=document.querySelector('#submission-form');if(form)form.addEventListener('submit',e=>{e.preventDefault();const msg=document.querySelector('#form-message');try{const data=makeSubmission(Object.fromEntries(new FormData(form)));const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`dmh-review-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);msg.textContent='Draft downloaded. Nothing was sent or published.';}catch(error){msg.textContent=error.message;}});
}

function render(){
 const {path,id,filters:f}=parseLocation(location.pathname,location.search);
 main.innerHTML=rewriteLinks(fillReadingViews(renderPage(db,path,f,id),db,path,f));
 document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(path==='interpretation'?'interpretations':path==='theory'?'theories':path==='experiment'?'tests':path)));
 bind(path,f);bindReadingViews(db,path,f);
}
function legacy(){if(location.hash.startsWith('#/')){location.replace(hashUrl(location.hash));return true;}return false;}
if(!legacy())try{const response=await fetch(new URL('./data/hub.json',rootUrl));if(!response.ok)throw Error('Research data could not be loaded.');db=await response.json();render();window.addEventListener('hashchange',legacy);}catch(error){const note=document.createElement('p');note.className='notice';note.textContent='Interactive search is unavailable. The research content and links below are still readable.';main.prepend(note);}
