import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,readDatabase,publicData,validate} from '../scripts/data.mjs';
import {renderPage} from '../web/views.js';
import {buildSearchIndex,searchRecords} from '../web/search.js';
import {setBasePath,routeUrl,parseLocation} from '../web/urls.js';
import {matchingInvestigations,orderedInvestigations,investigationEntry} from '../web/investigations.js';
import {phraseReadings,phraseExplorer} from '../web/phrase-explorer.js';
import {loadSite,pagesFor,documentFor,sitemapFor} from '../scripts/site.mjs';
const raw=await readDatabase(),preview=publicData(raw,{includeDraftInvestigations:true});

test('investigation drafts are visible locally and excluded from the public payload and search',()=>{
 assert.equal(preview.investigations.length,15);
 const draft=structuredClone(raw);draft.investigations.forEach(e=>e.publication_state='draft');
 const approvedOnly=publicData(draft);assert.equal(approvedOnly.investigations.length,0);
 assert(!buildSearchIndex(approvedOnly).some(r=>r.type==='Investigation update'));
 const index=buildSearchIndex(preview);assert.equal(searchRecords(index,'L006','Investigation update')[0].anchor,'L006');
 const approved=structuredClone(raw);approved.investigations.forEach(e=>e.publication_state='approved');assert.equal(publicData(approved).investigations.length,15);
});

test('invalid IDs, dates, source references, private fields and broken correction chains fail review',()=>{
 for(const change of [d=>d.investigations[0].date='2026-02-31',d=>d.investigations[0].source_ids=['S999'],d=>d.investigations[0].private_notes='should not export',d=>d.investigations[5].updates='L006',d=>{d.investigations[4].publication_state='draft';d.investigations[5].publication_state='approved';}]){const d=structuredClone(raw);change(d);assert.throws(()=>validate(d));}
 const privateSource=structuredClone(raw);privateSource.sources.find(s=>s.id==='S010').visibility='private';assert.throws(()=>publicData(privateSource),/Private source/);
});

test('topic, status and search intersect while chronological older entries remain accessible',()=>{
 assert.equal(orderedInvestigations(preview)[0].id,'L015');assert.equal(orderedInvestigations(preview).at(-1).id,'L001');
 assert.deepEqual(matchingInvestigations(preview,{topic:'Arachne reconstruction'}).map(e=>e.id),['L006','L005']);
 assert.deepEqual(matchingInvestigations(preview,{topic:'Arachne reconstruction',status:'Parked',q:'Fragments'}).map(e=>e.id),['L006']);
 assert.equal(matchingInvestigations(preview,{topic:'Arachne reconstruction',status:'Active'}).length,0);
 const log=renderPage(preview,'investigations');for(const e of preview.investigations)assert(log.includes('id="'+e.id+'"'));
 assert(log.includes('Later assessment:'));assert(log.includes('earlier assessment remains available'));
});

test('homepage highlights at most three current topics and keeps all existing destinations',()=>{
 const home=renderPage(preview,'home');assert.equal((home.match(/class="current-investigation"/g)||[]).length,1);
 for(const route of ['guide','explore','archive','evaluate'])assert(home.includes(routeUrl(route)));
 const broken=structuredClone(raw);broken.investigations[0].featured=true;assert.throws(()=>validate(broken),/Inactive investigation featured|At most three/);
});

test('theory history links resolve both earlier and revised assessments without replacing theory text',()=>{
 const t=preview.theories.find(t=>t.id==='T009'),html=renderPage(preview,'theory',{},t.id);
 assert(html.includes('id="investigation-history"'));assert(html.includes('#L005'));assert(html.includes('#L006'));
 assert(html.includes(t.assessment.replaceAll('&','&amp;').replaceAll("'",'&#39;')));
 assert(!renderPage(preview,'theory',{},'T013').includes('id="investigation-history"'));
});

test('log has one physical indexable URL, sitemap entry, metadata and stable entry anchors under a Pages prefix',async()=>{
 const site=await loadSite({SITE_URL:'https://example.test/hunt/'},{production:true});const pages=pagesFor(preview,site),p=pages.find(p=>p.route==='investigations');
 assert.equal(p.pathname,'/hunt/investigation-log/');assert.equal(p.lastmod,'2026-11-24');assert(sitemapFor(pages).includes('https://example.test/hunt/investigation-log/'));
 const html=documentFor(p,preview,site,await fs.readFile(path.join(ROOT,'web/index.html'),'utf8'));
 assert(html.includes('id="L001"'));assert(html.includes('og:title'));assert(html.includes('rel="canonical" href="https://example.test/hunt/investigation-log/"'));
 assert(!html.includes('href="#/'));assert.equal(parseLocation('/hunt/investigation-log/').path,'investigations');setBasePath('/');
 const drafts=structuredClone(raw);drafts.investigations.forEach(e=>e.publication_state='draft');const emptyPage=pagesFor(publicData(drafts),site).find(p=>p.route==='investigations');assert.equal(emptyPage.index,false);setBasePath('/');
});

test('investigation rendering escapes content and filter text rather than executing markup',()=>{
 const db=structuredClone(preview);db.investigations[0].title='<img src=x onerror=alert(1)>';
 assert(!investigationEntry(db,db.investigations[0]).includes('<img'));
 const html=renderPage(db,'investigations',{q:'"><script>alert(1)</script>'});assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));
});

test('the six phrase choices link to existing records and keep all 29 full interpretations',()=>{
 assert.equal(phraseReadings.length,6);assert.equal(new Set(phraseReadings.map(p=>p.id)).size,6);
 for(const p of phraseReadings){for(const [,ids] of p.meanings)for(const id of ids)assert(preview.interpretations.some(i=>i.id===id),id);assert(p.examples.length>=1&&p.examples.length<=2);for(const [kind,id] of p.examples)assert(preview[kind==='theory'?'theories':kind==='interpretation'?'interpretations':'routes'].some(x=>x.id===id),id);}
 const html=renderPage(preview,'interpretations');assert.equal((html.match(/type="radio"/g)||[]).length,6);assert.equal((html.match(/class="phrase-panel"/g)||[]).length,6);assert.equal((html.match(/ checked/g)||[]).length,1);
 assert(html.includes('Both are grammatically plausible. Neither is verified.'));assert(html.includes('Speculative: more than one body'));assert(html.includes('does not prove that the player must cause a disappearance'));
});

test('essential phrase meanings and comparison are server-rendered without script-dependent controls',async()=>{
 const site=await loadSite({}),p=pagesFor(preview,site).find(p=>p.route==='interpretations');const html=documentFor(p,preview,site,await fs.readFile(path.join(ROOT,'web/index.html'),'utf8'));
 for(const phrase of phraseReadings){assert(html.includes('id="phrase-'+phrase.id+'"'));assert(html.includes('for="phrase-'+phrase.id+'"'));assert(html.includes('id="panel-'+phrase.id+'"'));}
 assert.equal((html.match(/class="interpretation-card"/g)||[]).length,29);assert(html.includes('A · Complement'));assert(html.includes('B · Substitution'));
 const css=await fs.readFile(path.join(ROOT,'web/styles.css'),'utf8');for(const p of phraseReadings)assert(css.includes('#phrase-'+p.id+':checked~.phrase-panels #panel-'+p.id));
 const escaped=structuredClone(preview);escaped.config.riddle='<img src=x onerror=alert(1)>';assert(!phraseExplorer(escaped).includes('<img'));setBasePath('/');
});

test('L003 keeps its prior assessment and the About/source clarification does not enable submissions',()=>{
 const entry=preview.investigations.find(e=>e.id==='L003');assert.equal(entry.status,'Needs verification');assert(entry.revisions[0].assessment.startsWith('I’m keeping one narrow question open'));
 const log=investigationEntry(preview,entry);assert(log.includes('Earlier assessment'));assert(log.includes('roughly ten months'));assert(log.includes('not confirmed R6 clues'));assert(log.includes('first live release date'));
 const about=renderPage(preview,'evaluate');assert(about.includes('Project Status &amp; Updates'));assert(about.includes('goal, not a guaranteed schedule'));assert(about.includes('Google Form is not connected yet'));
 assert.equal(preview.sources.find(s=>s.id==='S001').title,'Original Research Spreadsheet (Detailed Source Data)');assert(renderPage(preview,'contribute').includes('disabled'));
 const bad=structuredClone(raw);bad.investigations.find(e=>e.id==='L003').revisions[0].private_notes='do not export';assert.throws(()=>validate(bad),/revision record/);
});

test('explorer entry links, navigation and labels retain one canonical reading directory',async()=>{
 setBasePath('/hunt/');
 for(const route of ['home','explore'])assert(renderPage(preview,route).includes('href="/hunt/interpretations/#clue-explorer"'));
 const readings=renderPage(preview,'interpretations');
 assert.equal((readings.match(/id="clue-explorer"/g)||[]).length,1);
 assert(readings.includes('id="reading-directory"'));assert(readings.includes('id="reading-filters"'));
 assert(readings.includes('role="status" aria-live="polite"'));
 const {fillReadingViews}=await import('../web/readings.js');assert(fillReadingViews(readings,preview,'interpretations',{}).includes('id="reading-count" role="status" aria-live="polite">29 readings'));
 assert(renderPage(preview,'interpretation',{},'R6I001').includes('Back to the phrase explorer'));
 const about=renderPage(preview,'evaluate');assert(about.includes('Confirmed precedent'));assert(about.includes('Firsthand report'));assert(about.includes('not a verified R6 solution'));
 const group=renderPage(preview,'theory',{},'T016');assert(group.includes('Thematic route group · T016'));assert(group.includes('not one of the 15 developed theory pages'));
 const shell=await fs.readFile(path.join(ROOT,'web/index.html'),'utf8');assert.equal((shell.match(/Research update ·/g)||[]).length,1);
 setBasePath('/');
});

test('new unapproved follow-ups stay out of public pages and search beside approved history',()=>{
 const draft=structuredClone(raw.investigations[0]);Object.assign(draft,{id:'L999',date:'2026-11-25',title:'UNPUBLISHED-CHECK-ONLY',publication_state:'draft',featured:false,updates:null});
 const db=structuredClone(raw);db.investigations.push(draft);
 const publicView=publicData(db),reviewView=publicData(db,{includeDraftInvestigations:true});
 assert.equal(publicView.investigations.length,15);assert.equal(reviewView.investigations.length,16);
 assert(!JSON.stringify(buildSearchIndex(publicView)).includes('UNPUBLISHED-CHECK-ONLY'));
 assert(!renderPage(publicView,'investigations').includes('UNPUBLISHED-CHECK-ONLY'));
 assert(publicView.investigations.some(e=>e.id==='L005'));assert(publicView.investigations.some(e=>e.id==='L006'&&e.updates==='L005'));
});

test('publication wording keeps report limitations without exposing maintenance phrasing',async()=>{
 const publicText=JSON.stringify(publicData(raw));assert(!/raw exports|historical handoff|archived audit|raw clips/i.test(publicText));
 const r=raw.routes.find(r=>r.id==='R074');assert(r.description.includes('original recording was unavailable'));assert(r.description.includes('Separate experiments used summoned skeletons'));
 assert(raw.breakdowns.find(b=>b.id==='R099').test_coverage.includes('not independently rechecked'));
 const readme=await fs.readFile(path.join(ROOT,'README.md'),'utf8');assert(!/raw exports|private notes|historical source snapshots/i.test(readme));
});
