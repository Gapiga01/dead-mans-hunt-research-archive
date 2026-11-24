import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,readDatabase,publicData,validate} from '../scripts/data.mjs';
import {renderPage} from '../web/views.js';
import {buildSearchIndex,searchRecords,searchResults,bootSearchFilters} from '../web/search.js';
import {fillReadingViews} from '../web/readings.js';
import {noSearchResults,RESEARCH_SPREADSHEET_URL} from '../web/search-help.js';
import {setBasePath} from '../web/urls.js';
import {wordEdgeRows} from '../web/recognition.js';
const raw=await readDatabase(),db=publicData(raw),index=buildSearchIndex(db);

test('the direct clue check reproduces the reviewed word-edge results and links from search',()=>{
 assert.deepEqual(wordEdgeRows(db).map(({count,first,last})=>[count,first,last]),[
  [11,'THROWINLAKE','TYDNRNYETSG'],
  [22,'TFWCNLTTHOSWOWIWPBWMWI','ODHSTKOETFLSYTSRDDRYET'],
  [13,'TFWCNDNLLIFFA','ODHSTTTDTTLMR'],
  [13,'TWCNDNHTFCNTS','THSTSTDETLRED'],
  [12,'TFWCNLTPOTSL','ODTSTKOTSTLR'],
  [19,'TFOWCNTBINEATWRWIIG','ODTHSTEYSTHETHSNTSE']
 ]);
 const result=searchRecords(index,'word-edge','Research note')[0];
 assert.equal(result.anchor,'word-edge-check');
 assert(renderPage(db,'guide').includes('<details class="recognition-note" id="word-edge-check">'));
});

test('the new source readings and reported procedures retain their scope and stable IDs',()=>{
 for(const [id,row] of [['I028',29],['I029',30]]){
  const reading=db.interpretations.find(i=>i.source_id===id);
  assert.equal(reading.source_row,row);
  assert.equal(reading.experiment_ids.length,0);
  assert.equal(searchRecords(index,id,'Interpretation')[0].target,'R6'+id);
 }
 for(const id of ['E016','E018']){
  const report=db.experiments.find(e=>e.id===id);
  assert.equal(report.result,null);
  assert.equal(report.testing_label,'Inconclusive');
 }
 assert.equal(db.experiments.find(e=>e.id==='E017').evidence_label,'Reported');
 assert(db.experiments.filter(e=>e.testing_label==='Verified positive result').every(e=>/^R[1-5]$/.test(e.stage)));
});

test('the released outcome log keeps the four latest entries, nested history and named route groups',()=>{
 const preview=publicData(raw,{includeDraftInvestigations:true});const html=renderPage(preview,'investigations');
 assert.equal(preview.investigations.length,15);assert.equal(db.investigations.length,15);
 for(const id of ['L001','L006','L007','L008','L009','L010','L011','L012','L013','L014','L015'])assert(html.includes('id="'+id+'"'));
 assert(html.includes('View older investigations'));assert(html.includes('Recently parked investigations'));assert(html.includes('Current research focus'));assert(html.includes('R094'));
 const recent=html.split('<h2>Latest research outcomes</h2>')[1].split('<details class="older-investigations">')[0];assert.equal((recent.match(/class="investigation-entry/g)||[]).length,4);
 assert(!html.includes('· undefined'));
 for(const id of ['T016','T018','T020']){
  const group=db.groups.find(g=>g.id===id);
  assert(html.includes(id+' · '+group.title+' (route group)'));
  assert.equal(searchRecords(index,id,'Route group')[0].target,id);
 }
 assert.equal(raw.investigations.find(e=>e.id==='L009').updates,'L001');
});

test('the guide shows R5 presence without assuming how the Feather was recognized',()=>{
 const html=renderPage(db,'guide');
 assert(html.includes('Three separate drops within ten seconds'));
 assert(html.includes('Three Calling units already in the lake'));
 assert(html.includes('Jonas explained his Feather choice after success'));
 const evidence=renderPage(db,'tests',{q:'O018'});
 assert(evidence.includes('Matching observations are below.'));
 assert(!evidence.includes('No results found'));
});

test('the full parking list retains all parked routes and readings with reopen criteria',async()=>{
 const {parkedRecords}=await import('../web/patterns.js');const html=renderPage(db,'parking');
 assert.equal((html.match(/class="parked-record"/g)||[]).length,63);
 for(const id of ['R6I009','R6I002','R6I005','R6I007'])assert(html.includes('/interpretations/'+id+'/'));
 assert(parkedRecords(db,{q:'GIVE'}).includes('N004'));assert.equal(parkedRecords(db,{status:'Retired'}),'');
 assert(html.includes('What would reopen it'));assert(html.includes('Parked is not a negative test result'));
});

test('the meta overview is initially collapsed and all seven details remain in static HTML',()=>{
 const html=renderPage(db,'explore');assert(html.includes('<details class="meta-overview" id="meta-puzzle">'));
 assert.equal((html.match(/class="pattern-card"/g)||[]).length,7);assert(html.includes('Latest documented investigation'));
 assert(raw.sources.find(s=>s.id==='S051').url.includes('skyblock-2024-recap'));
 assert(raw.sources.find(s=>s.id==='S051').limitation.includes('does not establish'));
});

test('search startup preserves early typing without erasing query-string searches or filters',()=>{
 assert.deepEqual(bootSearchFilters({q:'Burp',type:'Pattern',page:'2'},{q:'',type:''},{q:'',type:''}),{q:'Burp',type:'Pattern',page:'2'});
 assert.deepEqual(bootSearchFilters({},{q:'R020',type:''},{q:'',type:''}),{q:'R020'});
 assert.deepEqual(bootSearchFilters({q:'Journal'},{q:'',type:'Route theory'},{q:'',type:''}),{q:'Journal',type:'Route theory'});
});

test('all 118 routes have a unique detailed entry with the same name; all 29 readings remain',()=>{
 assert.equal(db.config.version,'0.7.0');assert.equal(db.routes.length,118);assert.equal(db.breakdowns.length,147);assert.equal(db.interpretations.length,29);
 for(const r of db.routes){const matches=db.breakdowns.filter(b=>b.subject_id===r.id);assert.equal(matches.length,1,r.id);assert.equal(matches[0].title,r.title);}
 for(const i of db.interpretations)assert.equal(db.breakdowns.find(b=>b.subject_id===i.id).title,i.title);
 for(const id of ['N013','N014'])assert(db.theory_routes.some(j=>j.route_id===id&&j.theory_id==='T010'));
});

test('the preserved November 18 source snapshot matches every imported field when available',async t=>{
 let source;try{source=JSON.parse(await fs.readFile(path.join(ROOT,'.research/snapshots/source-2026-11-18.json'),'utf8'));}catch(e){if(e.code==='ENOENT'){t.skip('Owner snapshot is not part of the public source package.');return;}throw e;}
 const publicWording=(id,key,text)=>id==='R074'&&['description','test_coverage'].includes(key)?text.replace('The historical handoff reports','An earlier research summary reports'):id==='R099'&&key==='test_coverage'?'An earlier recording comparison reported these sample matches. The source recordings were not independently rechecked for this summary.':text;
 for(const {values:a} of source.tabs.Routes){const r=db.routes.find(x=>x.id===a[0]);assert(r);for(const [key,col] of [['title',1],['description',3],['evidence_label',4],['testing_label',5],['gap',6]])assert.equal(r[key],publicWording(r.id,key,a[col]),r.id+'.'+key);}
 for(const {values:a} of source.tabs['Theory breakdowns'].slice(1)){const b=db.breakdowns.find(x=>x.id===a[0]);assert(b);for(const [key,col] of [['title',1],['proposal',2],['support',3],['weakness',4],['test_coverage',5],['verify_next',6],['assessment',9]])assert.equal(b[key],publicWording(b.id,key,a[col]),b.id+'.'+key);}
});

test('the corrected perk and second Journal report retain attribution and evidence limits',()=>{
 const r=db.routes.find(r=>r.id==='R020');assert.match(r.description,/HOTM perk/);assert.equal(r.testing_label,'Partially tested');assert(r.website_note.includes('confused'));assert(r.previous_versions[0].description.includes('maxed Chest'));
 const j=db.routes.find(r=>r.id==='R010');assert.match(j.description,/different UUID/);assert.match(j.description,/firsthand report/);assert.match(j.gap,/does not establish/);
 assert(db.theories.find(t=>t.id==='T003').supports.some(x=>x.observation_id==='O017'));assert(db.observations.find(o=>o.id==='O017').source_ids.includes('S047'));
 assert.equal(db.observations.find(o=>o.id==='O009').source_ids.includes('S047'),false);
 assert(db.riddles.find(r=>r.id==='R4').limitations.some(x=>x.includes('continuous footage has not been independently verified')));
 assert(db.riddles.find(r=>r.id==='R5').action.includes('three'));
});

test('seven navigable patterns separate observations, R6 interpretations and disproof conditions',()=>{
 assert.equal(db.patterns.length,7);const html=renderPage(db,'explore');
 assert(html.includes('Why is R6 so difficult?'));assert(html.includes('Could R6 be a meta-puzzle?'));
 assert.equal((html.match(/class="pattern-card"/g)||[]).length,7);assert.equal((html.match(/What would prove this is intentional\?/g)||[]).length,7);
 for(const p of db.patterns){assert(html.includes('id="pattern-'+p.id+'"'));assert(p.strengthen.length>40&&p.falsify.length>40);for(const id of p.route_ids)assert(html.includes('/routes/'+id+'/'));}
 assert(searchRecords(index,'UUID','Pattern').some(r=>r.id==='P007'));
 const broken=structuredClone(raw);broken.patterns[0].route_ids=['R999'];assert.throws(()=>validate(broken),/missing routes/);
});

test('empty queries and filtered no-match searches have the explicit external spreadsheet fallback',()=>{
 assert(searchResults(index,{}).includes('Enter a term'));assert(!searchResults(index,{}).includes('No results found'));
 for(const f of [{q:'zzqzeroresultv07'},{q:'R010',type:'Solved riddle'},{q:'<img src=x onerror=alert(1)>',type:'Theory'}]){const html=searchResults(index,f);assert(html.includes('No results found'));assert(html.includes('Check the research spreadsheet'));assert(html.includes(RESEARCH_SPREADSHEET_URL));assert(html.includes('does not automatically search the spreadsheet'));assert(!html.includes('<img'));}
 for(const q of ['R020','Calling','Journey','Griffin','JJSR','Perdix']){if(q==='Journey')continue;assert(searchRecords(index,q).length>0,q);}
 assert.equal(searchRecords(index,'R020')[0].id,'R020');
 for(const route of ['search','home','archive'])assert(renderPage(db,route).includes('Website search does not search the spreadsheet'));
 for(const route of ['archive','theories','parking','tests'])assert(renderPage(db,route,{q:'zzqzeroresultv07'}).includes('No results found'),route);
 for(const route of ['interpretations','questions'])assert(fillReadingViews(renderPage(db,route,{q:'zzqzeroresultv07'}),db,route,{q:'zzqzeroresultv07'}).includes('No results found'),route);
 setBasePath('/hunt/');assert(noSearchResults().includes('href="/hunt/archive/"'));assert(noSearchResults().includes(RESEARCH_SPREADSHEET_URL));setBasePath('/');
});

test('historical text stays readable but does not become the current search description',()=>{
 const html=renderPage(db,'route',{},'R020');assert(html.includes('Earlier website wording'));assert(html.includes('current assessment above takes precedence'));
 const r=index.find(r=>r.type==='Route theory'&&r.id==='R020');assert.match(r.summary,/HOTM perk/);assert(!r.text.includes('offered the maxed chest,'));
 for(const route of db.routes)assert(route.source_url.includes('gid=1865734368&range=A'));
 assert(!JSON.stringify(db.routes).includes('forms.gle'));assert(!JSON.stringify(db.breakdowns).includes('forms.gle'));
 assert(renderPage(db,'contribute').includes('Submissions are closed'));
});
