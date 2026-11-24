import {escapeHtml as h,normalize,safeHref} from './core.js';
import {routeUrl} from './urls.js';

const date=value=>new Date(value+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
const badge=status=>`<span class="badge status-${h(status.toLowerCase().replace(/[^a-z]+/g,'-'))}">${h(status)}</span>`;
export const orderedInvestigations=db=>[...(db.investigations||[])].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
export const investigationUrl=(entry,{topic=true}={})=>routeUrl('investigations',null,topic?{topic:entry.topic}:{})+'#'+entry.id;
export function matchingInvestigations(db,f={}){
 return orderedInvestigations(db).filter(e=>(!f.topic||e.topic===f.topic)&&(!f.status||e.status===f.status)&&normalize(f.q||'').split(/\s+/).filter(Boolean).every(term=>normalize(JSON.stringify(e)).includes(term)));
}
export function currentInvestigations(db){
 const questions = (db.config.current_focus_question_ids || []).map(id => db.questions.find(q => q.id === id)).filter(Boolean);
 if (!questions.length) return '';
 return `<section class="current-investigations current-focus">
  <div class="log-section-heading"><h2 id="current-heading">Current research focus</h2><a href="${routeUrl('investigations')}">Investigation Log</a></div>
  <article class="current-investigation">
   <h3><a href="${routeUrl('explore')}#why-r6">How would a player recognize the solution?</a></h3>
   <p>Find the original Journal cues, check what survives R5, and trace what pointed hunters to the earlier solutions.</p>
   <ul class="recognition-links">
    ${questions.map((q, index) => `<li><a href="${routeUrl('questions')}#${h(q.id)}">${h(['Tooltip colors', 'R5 aftermath', 'Discovery history'][index] || q.title)}</a></li>`).join('')}
   </ul>
   <p class="source-note">Related method: <a href="${routeUrl('route','R094')}">R094 · Assembly versus a finished offering</a></p>
  </article>
 </section>`;
}
function sourceLinks(db,ids){return `<ul class="log-sources">${ids.map(id=>{const s=db.sources.find(s=>s.id===id);return `<li><a href="${h(safeHref(s.url))}" target="_blank" rel="noopener noreferrer">${h(s.title)} ↗</a><span>${h(s.author||'Author not identified')}${s.date?' · '+h(s.date):''}</span><small>${h(s.limitation)}</small></li>`;}).join('')}</ul>`;}
function revisionHistory(e){return e.revisions?.length?`<details class="entry-revisions"><summary>Earlier assessment (${e.revisions.length})</summary>${e.revisions.map(r=>`<div><p class="source-note"><time datetime="${h(r.date)}">${date(r.date)}</time> · ${h(r.note)}</p><h4>${h(r.title)}</h4><p>${h(r.hypothesis)}</p><p>${h(r.assessment)}</p></div>`).join('')}</details>`:'';}
export function investigationEntry(db,e){
 const later=orderedInvestigations(db).find(x=>x.updates===e.id),earlier=db.investigations.find(x=>x.id===e.updates);
 const theoryLinks = e.theory_ids.map(id => {
  const group = db.groups.find(g => g.id === id);
  return [routeUrl('theory',id), id+' · '+group.title+(group.publication_state==='planned'?' (route group)':'')];
 });
 const related=[
  ...theoryLinks,
  ...e.route_ids.map(id=>[routeUrl('route',id),id+' · '+db.routes.find(r=>r.id===id).title]),
  ...e.interpretation_ids.map(id=>[routeUrl('interpretation',id),id+' · '+db.interpretations.find(i=>i.id===id).title])
 ];
 return `<details class="investigation-entry research-note" id="${e.id}"><summary><span><span class="record-id"><time datetime="${e.date}">${date(e.date)}</time> · ${h(e.topic)} · ${e.id}</span><strong>${h(e.title)}</strong><span class="log-summary">${h(e.hypothesis)}</span></span>${badge(e.status)}</summary><div class="note-body">${later?`<p class="notice">Later assessment: <a href="${h(investigationUrl(later))}">${h(later.title)} (${later.id})</a>. This earlier entry is preserved.</p>`:''}${earlier?`<p class="source-note">Updates <a href="${h(investigationUrl(earlier))}">${h(earlier.title)} (${earlier.id})</a>; the earlier assessment remains available.</p>`:''}<dl><dt>What I investigated</dt><dd>${h(e.investigated)}</dd><dt>Why I considered it</dt><dd>${h(e.why)}</dd></dl><h3>What the evidence says</h3>${e.evidence.map(f=>`<p><span class="evidence-label">${h(f.label)}</span> ${h(f.text)}</p>`).join('')}<h3>What weakens it</h3><ul>${e.against.map(x=>`<li>${h(x)}</li>`).join('')}</ul><h3>Where I stand at this update</h3><p class="assessment">${h(e.assessment)}</p>${revisionHistory(e)}<p><strong>What would help:</strong> ${h(e.next_evidence)}</p>${e.id==='L009'?`<p><a href="${routeUrl('explore')}#meta-puzzle">Compare the seven meta-puzzle observations ↗</a></p>`:''}<h3>Related research</h3><div class="related-links">${related.map(([url,label])=>`<a href="${url}">${h(label)}</a>`).join('')}</div><h3>Sources & credits</h3>${sourceLinks(db,e.source_ids)}<p class="source-note"><a href="${h(investigationUrl(e,{topic:false}))}">Link to ${e.id}</a> · Documentation date; not a claim of first discovery.</p></div></details>`;
}
export function investigationResults(db,f={}){
 const rows=matchingInvestigations(db,f),filtered=Boolean(f.q||f.topic||f.status);
 if(filtered)return `<p id="log-count" role="status">${rows.length} of ${(db.investigations||[]).length} updates</p><div class="investigation-feed">${rows.map(e=>investigationEntry(db,e)).join('')||'<div class="empty">No updates match these filters. Clear filters to browse the full history.</div>'}</div>`;
 const recent=rows.filter(e=>e.status!=='Parked').slice(0,4),parked=rows.filter(e=>e.status==='Parked').slice(0,3),shown=new Set([...recent,...parked].map(e=>e.id)),older=rows.filter(e=>!shown.has(e.id));
 return `<p id="log-count" role="status">${rows.length} documented updates · four newest outcomes shown first</p><h2>Latest research outcomes</h2><div class="investigation-feed">${recent.map(e=>investigationEntry(db,e)).join('')}</div><details class="older-investigations"><summary>View older investigations (${older.length})</summary><div class="investigation-feed">${older.map(e=>investigationEntry(db,e)).join('')}</div></details><details class="recently-parked"><summary>Recently parked investigations (${parked.length})</summary><p class="source-note">Meaningful decisions, not the complete list of inactive theories. <a href="${routeUrl('parking')}">Open the full Parking Lot ↗</a></p><div class="investigation-feed">${parked.map(e=>investigationEntry(db,e)).join('')}</div></details>`;
}
export function investigationPage(db,f={}){
 const all=db.investigations||[],topics=[...new Set(all.map(e=>e.topic))].sort(),statuses=[...new Set(all.map(e=>e.status))].sort();
 const options=(values,selected)=>values.map(v=>`<option value="${h(v)}" ${v===selected?'selected':''}>${h(v)}</option>`).join('');
 return `<div class="page-heading"><p class="eyebrow">Curated research history</p><h1>Investigation Log</h1><p class="lead">What I checked, what changed my mind, and what is still open. The theory pages keep the full explanations.</p></div>${currentInvestigations(db)}<p class="reading-intro">Newest outcomes first. Dates show when I documented the review, not when a hunter first proposed an idea or ran a test. Statuses are my priorities at that update, not community consensus. Earlier assessments stay visible when a later entry corrects them.</p>${all.length?`<form id="investigation-filters" class="filters log-filters" action="${routeUrl('investigations')}" method="get" role="search"><label for="log-query">Search updates<input id="log-query" type="search" name="q" value="${h(f.q||'')}" placeholder="Arachne, DEFAG, body…"></label><label for="log-topic">Topic<select id="log-topic" name="topic"><option value="">All topics</option>${options(topics,f.topic)}</select></label><label for="log-status">Status at update<select id="log-status" name="status"><option value="">All statuses</option>${options(statuses,f.status)}</select></label><button class="button secondary" type="submit">Filter updates</button><a class="text-button" href="${routeUrl('investigations')}">Clear filters</a></form><div id="investigation-results">${investigationResults(db,f)}</div><noscript><p class="notice">Interactive filters need JavaScript. The full feed remains readable below each expandable heading.</p></noscript>`:'<div class="empty">No investigation updates have been approved for this release yet. Existing theories and research remain available in the archive.</div>'}`;
}
export function relatedInvestigationHistory(db,theoryId){
 const rows=orderedInvestigations(db).filter(e=>e.theory_ids.includes(theoryId));if(!rows.length)return '';
 return `<section class="linked-investigation-history" id="investigation-history"><h2>Investigation history</h2><p class="source-note">Dated follow-ups to this page. Earlier assessments remain in the log; they do not replace the theory above.</p><ul>${rows.map(e=>`<li><a href="${h(investigationUrl(e))}">${h(e.title)}</a><span>${date(e.date)} · ${h(e.status)}</span></li>`).join('')}</ul><a href="${routeUrl('investigations')}">Browse the Investigation Log ↗</a></section>`;
}
export function bindInvestigations(db,path){
 const reveal=()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(!/^L\d{3}$/.test(id))return;const target=document.getElementById(id);if(target?.tagName==='DETAILS'){for(let parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;target.open=true;target.scrollIntoView({block:'start'});}};
 if(path!=='investigations')return;
 const form=document.getElementById('investigation-filters');if(form){const update=event=>{event.preventDefault();const filters=Object.fromEntries(new FormData(form));const hash=location.hash;const selected=matchingInvestigations(db,filters).some(e=>'#'+e.id===hash)?hash:'';history.replaceState(null,'',routeUrl('investigations',null,Object.fromEntries(Object.entries(filters).filter(([,v])=>v)))+selected);document.getElementById('investigation-results').innerHTML=investigationResults(db,filters);if(selected)reveal();document.getElementById('announcement').textContent=document.getElementById('log-count').textContent;};form.addEventListener('submit',update);form.addEventListener('input',update);form.addEventListener('change',update);}
 reveal();window.addEventListener('hashchange',reveal);
}
