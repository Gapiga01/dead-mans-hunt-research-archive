import {normalize,escapeHtml as h,routeIds,experimentIds} from './core.js';
import {routeUrl} from './urls.js';
import {noSearchResults,spreadsheetSearchLink} from './search-help.js';
import {recognitionTitle, recognitionSummary, wordEdgeTitle, wordEdgeSummary, wordEdgeRows} from './recognition.js';

const currentRecord=record=>Object.fromEntries(Object.entries(record||{}).filter(([key])=>key!=='previous_versions'&&!key.startsWith('original_')));
const words=value=>JSON.stringify(value??'');
const summary=s=>String(s||'').replace(/\s+/g,' ').trim().slice(0,240);
// Keep text entered into the static search form while its index is loading.
export function bootSearchFilters(urlState,fields,defaults){return {...urlState,...Object.fromEntries(Object.entries(fields).filter(([key,value])=>value!==defaults[key]))};}
export function buildSearchIndex(db){
 const index=[];
 const add=(type,id,title,description,label,route,target,text,anchor='')=>index.push({key:type+':'+id,type,id,title,summary:summary(description),label,route,target,anchor,text:normalize(words([id,title,description,text]))});
 const sourcesFor=ids=>db.sources.filter(s=>(ids||[]).includes(s.id));
 for(const t of db.theories.filter(t=>t.publication_state==='developed')){const routes=routeIds(db,t.id),tests=db.experiments.filter(e=>experimentIds(db,t.id).includes(e.id));const sources=sourcesFor([...new Set([...t.source_ids,...tests.flatMap(e=>e.source_ids)])]);add('Theory',t.id,t.title,t.summary,t.status,'theory',t.id,[t,routes,tests,sources]);}
 for(const {id,title,publication_state} of db.groups||db.theories){
  if(publication_state==='planned')add('Route group',id,title,'Browse the archive routes grouped under this topic.','Research directory','theory',id,title);
 }
 for(const i of db.interpretations){const b=db.breakdowns.find(b=>b.subject_id===i.id);add('Interpretation',i.source_id,i.title,i.meaning,i.status,'interpretation',i.id,[i,b]);}
 for(const r of db.routes){const b=db.breakdowns.find(b=>b.subject_id===r.id);const tests=db.experiments.filter(e=>e.route_ids.includes(r.id));add(b?'Route theory':'Archive route',r.id,r.title,b?.proposal||r.description,b?.status||r.evidence_label,'route',r.id,[currentRecord(r),currentRecord(b),tests,sourcesFor(tests.flatMap(e=>e.source_ids))]);}
 for(const e of db.experiments)add('Test report',e.id,e.title,e.procedure,e.evidence_label+' · '+e.testing_label,'experiment',e.id,[e,sourcesFor(e.source_ids)]);
 for(const o of db.observations)add('Observation',o.id,o.text.slice(0,100),o.text,o.label,'tests',null,[o,sourcesFor(o.source_ids)],o.id);
 for(const s of db.sources)add('Source',s.id,s.title,s.limitation,s.kind,'sources',null,s,s.id);
 for(const q of db.questions)add('Open question',q.id,q.title,q.why,q.state,'questions',null,q,q.id);
 for(const r of db.riddles)add('Solved riddle',r.id,r.title,r.solution,'R1–R5 context','guide',null,[r,sourcesFor(r.source_ids)],r.id);
 for(const e of (db.investigations||[]).filter(e=>e.publication_state==='approved'||db.investigations_review))add('Investigation update',e.id,e.title,e.hypothesis,e.status,'investigations',null,[e,sourcesFor(e.source_ids)],e.id);
 for(const p of db.patterns)add('Pattern',p.id,p.title,p.established,'Observation / interpretation','explore',null,p,'pattern-'+p.id);
 add('Research note','recognition-branches',recognitionTitle,recognitionSummary,'Research framework','explore',null,[
  'task-specific insufficiency','discovering versus executing','physical, informational and mixed readings','surviving information'
 ],'recognition-branches');
 add('Research note','word-edge-check',wordEdgeTitle,wordEdgeSummary,'Desk check','guide',null,wordEdgeRows(db),'word-edge-check');
 for(const i of db.legacy_interpretations)add('Earlier summary','Legacy '+i.id,i.title,i.summary,'Preserved earlier reading','interpretation',i.id,i);
 return index;
}
export function searchRecords(index,query,type=''){
 const q=normalize(query).trim(),tokens=q.split(/\s+/).filter(Boolean);if(!tokens.length)return [];
 return index.filter(r=>(!type||r.type===type)&&tokens.every(t=>r.text.includes(t))).map(r=>({record:r,score:(normalize(r.id)===q?100:0)+(normalize(r.title).includes(q)?30:0)+(normalize(r.summary).includes(q)?10:0)+(r.type==='Earlier summary'?-10:0)})).sort((a,b)=>b.score-a.score||a.record.title.localeCompare(b.record.title)).map(x=>x.record);
}
export function searchResultCard(r){const url=routeUrl(r.route,r.target)+(r.anchor?'#'+encodeURIComponent(r.anchor):'');return `<article class="search-card"><div class="card-top"><span class="record-id">${h(r.id)} · ${h(r.type)}</span><span class="search-label">${h(r.label)}</span></div><h2><a href="${h(url)}">${h(r.title)}</a></h2><p>${h(r.summary)}</p></article>`;}
export function searchResults(index,f={}){const rows=searchRecords(index,f.q||'',f.type||'');const page=Math.max(1,Math.min(Number(f.page)||1,Math.ceil(rows.length/24)||1));return `<p id="search-count" role="status">${f.q?rows.length+(rows.length===1?' matching record':' matching records'):'Enter a term to search the public archive.'}</p><div class="search-results">${rows.slice((page-1)*24,page*24).map(searchResultCard).join('')||(f.q?noSearchResults({filtered:Boolean(f.type)}):'<div class="empty">Search the reviewed theories, interpretations, route notes, tests and sources.</div>')}</div>${rows.length>24?`<div class="pager">${page>1?`<a class="button secondary" href="${h(routeUrl('search',null,{...f,page:String(page-1)}))}">Previous results</a>`:'<span></span>'}<span>Page ${page} of ${Math.ceil(rows.length/24)}</span>${page*24<rows.length?`<a class="button secondary" href="${h(routeUrl('search',null,{...f,page:String(page+1)}))}">Next results</a>`:'<span></span>'}</div>`:''}`;}
export function searchPage(db,f={}){const index=db.search_index||buildSearchIndex(db);const types=[...new Set(index.map(r=>r.type))];return `<div class="page-heading"><p class="eyebrow">One search, all the public research</p><h1>Search the archive</h1><p class="lead">Find an idea, a mechanic, an attributed report or an original record. A search match is not a confirmed connection.</p></div><form id="universal-search" class="global-search filters" action="${routeUrl('search')}" method="get" role="search"><label for="all-search">Search theories, items, mechanics or IDs<input id="all-search" name="q" type="search" value="${h(f.q||'')}" placeholder="Search theories, items, mechanics or IDs..." autocomplete="off"></label><label for="search-type">Content type<select id="search-type" name="type"><option value="">All content</option>${types.map(t=>`<option value="${h(t)}" ${f.type===t?'selected':''}>${h(t)}</option>`).join('')}</select></label><button class="button primary" type="submit">Search</button></form>${spreadsheetSearchLink()}<div id="universal-results">${searchResults(index,f)}</div><noscript><p class="notice">Search needs JavaScript. All research pages remain readable through the <a href="${routeUrl('archive')}">archive</a> and <a href="${routeUrl('interpretations')}">interpretation directory</a>.</p></noscript>`;}
