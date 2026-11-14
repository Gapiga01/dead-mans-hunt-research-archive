import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,readDatabase,publicData,validate} from '../scripts/data.mjs';
import {buildSearchIndex,searchRecords,searchResults} from '../web/search.js';
import {renderPage} from '../web/views.js';
import {loadSite,pagesFor,documentFor} from '../scripts/site.mjs';
import {setBasePath,routeUrl,hashUrl} from '../web/urls.js';
const raw=await readDatabase(),db=publicData(raw),index=buildSearchIndex(db);

test('the 90 detailed entries map to exactly 27 interpretations and 63 existing routes',()=>{
 assert.equal(db.breakdowns.length,90);assert.equal(db.breakdowns.filter(b=>b.kind==='interpretation').length,27);
 assert.equal(db.breakdowns.filter(b=>b.id.startsWith('R')).length,51);assert.equal(db.breakdowns.filter(b=>b.id.startsWith('N')).length,12);
 assert.equal(new Set(db.breakdowns.map(b=>b.subject_id)).size,90);
 for(const b of db.breakdowns){const html=renderPage(db,b.kind==='interpretation'?'interpretation':'route',{},b.subject_id);for(const key of ['proposal','support','weakness','test_coverage','assessment'])assert(html.includes(b[key].replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')),b.id+'.'+key);}
 const broken=structuredClone(raw);broken.breakdowns[0].subject_id='R999';assert.throws(()=>validate(broken),/missing interpretations/);
});

test('the current sheet is faithfully synchronized when owner snapshots are available',async(t)=>{
 let rows;try{rows=JSON.parse(await fs.readFile(path.join(ROOT,'.research/snapshots/routes-2026-11-14.json'),'utf8')).values.slice(5);}catch(e){if(e.code==='ENOENT'){t.skip('Owner-only snapshot excluded from public source.');return;}throw e;}
 assert.equal(rows.length,116);for(const r of rows){const actual=db.routes.find(x=>x.id===r[0]);assert(actual);assert.equal(actual.description,r[3]);assert.equal(actual.testing_label,r[5]);assert.equal(actual.evidence_label,r[4]);}
 const detailed=JSON.parse(await fs.readFile(path.join(ROOT,'.research/snapshots/breakdowns-2026-11-14.json'),'utf8')).values.slice(1);assert.equal(detailed.length,90);
 for(const r of detailed){const b=db.breakdowns.find(x=>x.id===r[0]);for(const [key,column] of [['proposal',2],['support',3],['weakness',4],['test_coverage',5],['verify_next',6],['assessment',9]])assert.equal(b[key],r[column]);}
});

test('new search supports IDs, partial words, contributors, type filters and safe empty results',()=>{
 assert.deepEqual(buildSearchIndex(raw),index);
 assert.equal(searchRecords(index,'R074')[0].id,'R074');const skeletor=searchRecords(index,'Skele','Route theory');assert(skeletor.some(r=>r.id==='R074'&&r.route==='route'));
 assert(searchRecords(index,'Starphi').length);assert(searchRecords(index,'Double2').some(r=>r.type==='Source'));
 assert.equal(searchRecords(index,'N012')[0].id,'N012');assert.equal(searchRecords(index,'I027')[0].id,'I027');
 assert.equal(searchRecords(index,'absolutelynonexistentzz').length,0);assert(searchResults(index,{q:'absolutelynonexistentzz'}).includes('No matching records'));
 assert(!searchResults(index,{q:'<img src=x onerror=alert(1)>'}).includes('<img'));
 assert.equal(new Set(index.map(r=>r.key)).size,index.length);
});

test('sourced tests, historical coverage, unknown outcomes and corrected relationships stay separate',()=>{
 assert.deepEqual(db.experiments.find(e=>e.id==='E013').route_ids,['R021']);assert(db.experiments.find(e=>e.id==='E013').previous_route_ids.includes('R095'));
 const remnant=renderPage(db,'route',{},'R095');assert(!remnant.includes('id="E013"'));assert(remnant.includes('mapping')||remnant.includes('fossil'));
 const theory=renderPage(db,'theory',{},'T005');for(const anchor of ['theory','testing','sources'])assert(theory.includes('id="'+anchor+'"'));
 const missing=renderPage(db,'experiment',{},'E006');assert(missing.includes('No explicit outcome in the source'));
 const skeletor=renderPage(db,'route',{},'R074');assert(skeletor.includes('not independently authenticated'));assert(skeletor.includes('Historical summary'));
});

test('guide uses original Journal transcription and keeps behavior separate from interpretation',()=>{
 assert.equal(db.riddles.length,5);assert(db.riddles[0].clue.replace(/\s+/g,' ').endsWith('almost kills everything.'));
 assert(db.riddles.find(r=>r.id==='R3').clue.includes('which'));assert(db.riddles.find(r=>r.id==='R4').action.includes('10'));
 const html=renderPage(db,'guide');assert.equal((html.match(/class="riddle-step"/g)||[]).length,5);assert(html.includes('Why it fits — interpretation'));assert(html.includes('What the mechanic demonstrates'));
 const about=renderPage(db,'evaluate');assert(about.includes('ChatGPT and Sol'));assert(about.includes('not an official Hunters Discord consensus'));
 const contribution=renderPage(db,'contribute');assert(contribution.includes('Submissions are closed'));assert(contribution.includes('disabled'));assert(!contribution.includes('id="submission-form"'));
});

test('new static detail URLs and all legacy canonical URLs survive under a Pages prefix',async()=>{
 const site=await loadSite({SITE_URL:'https://example.test/hunt/',GOOGLE_SITE_VERIFICATION:'public_verification_fixture'},{production:true});const pages=pagesFor(db,site);
 assert.equal(pages.filter(p=>p.route==='route').length,116);assert.equal(pages.filter(p=>p.route==='route'&&p.index).length,63);
 for(const id of ['T001','T015','R6I001','R6I026','I001','E015'])assert(pages.some(p=>p.id===id));
 assert.equal(routeUrl('route','N012'),'/hunt/routes/N012/');assert.equal(hashUrl('#/theory/T002'),'/hunt/theories/T002/');
 const html=documentFor(pages.find(p=>p.route==='guide'),db,site,await fs.readFile(path.join(ROOT,'web/index.html'),'utf8'));assert(html.includes('public_verification_fixture'));assert(html.includes('form-action \'self\''));assert(!html.includes('__ABOUT_METHOD__'));
 setBasePath('/');
});
