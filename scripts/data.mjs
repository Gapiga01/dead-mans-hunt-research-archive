import fs from 'node:fs/promises';
import path from 'node:path';
export const ROOT=path.resolve(import.meta.dirname,'..');
export const tables=['config','categories','theories','routes','observations','experiments','sources','theory_routes','theory_experiments','interpretations','questions','interpretation_groups','interpretation_angles','legacy_interpretations'];
export async function readDatabase(root=ROOT){return Object.fromEntries(await Promise.all(tables.map(async name=>[name,JSON.parse(await fs.readFile(path.join(root,'database',name+'.json'),'utf8'))])));}
export function safeUrl(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol);}catch{return false;}}
export function validate(db){
 const errors=[];const assert=(ok,msg)=>{if(!ok)errors.push(msg);};
 const maps={};for(const table of ['categories','theories','routes','observations','experiments','sources','interpretations','questions','interpretation_groups','interpretation_angles','legacy_interpretations']){maps[table]=new Map();for(const row of db[table]){assert(typeof row.id==='string'&&!maps[table].has(row.id),`Duplicate/missing ID in ${table}: ${row.id}`);maps[table].set(row.id,row);}}
 const refs=(ids,table,where)=>{for(const id of ids||[])assert(maps[table].has(id),`${where}: missing ${table} ${id}`);};
 for(const s of db.sources)assert(safeUrl(s.url),`Unsafe source URL ${s.id}`);
 for(const r of db.routes){assert(/^(R\d{3}|N\d{3})$/.test(r.id),`Invalid legacy route ID ${r.id}`);assert(safeUrl(r.source_url),`Unsafe archive URL ${r.id}`);}
 for(const t of db.theories){
  assert(/^T\d{3}$/.test(t.id),`Invalid theory ID ${t.id}`);assert(db.config.statuses.includes(t.status),`Invalid status ${t.id}`);
  if(t.publication_state==='planned')continue;
  for(const key of ['title','summary','origin','assessment','change_my_mind','last_reviewed'])assert(typeof t[key]==='string'&&t[key].length>8,`Missing developed field ${t.id}.${key}`);
  assert(/^(I |I’m|I’d|I’ve|I think|I like)/.test(t.assessment),`Assessment must be personal: ${t.id}`);
  refs(t.categories,'categories',t.id);refs(t.source_ids,'sources',t.id);
  assert(db.config.testing_labels.includes(t.testing_label),`Invalid testing label ${t.id}`);
  for(const s of t.supports){refs([s.observation_id],'observations',t.id);assert(s.why.length>15,`Weak support note ${t.id}`);}
  assert(t.against.length>=2,`Missing counterarguments ${t.id}`);
  if(t.status==='Parked')for(const key of ['reason','investigated','unresolved','reopen'])assert(t.parking?.[key]?.length>8,`Missing parking field ${t.id}.${key}`);
  if(t.status==='Retired')assert(t.retirement_reason?.length>20,`Missing retirement reason ${t.id}`);
  if(t.status==='Merged / Superseded')refs([t.superseded_by],'theories',t.id);
 }
 for(const o of db.observations){assert(db.config.evidence_labels.includes(o.label),`Invalid evidence label ${o.id}`);refs(o.source_ids,'sources',o.id);}
 for(const e of db.experiments){assert(db.config.testing_labels.includes(e.testing_label),`Invalid test label ${e.id}`);assert(db.config.evidence_labels.includes(e.evidence_label),`Invalid evidence label ${e.id}`);refs(e.route_ids,'routes',e.id);refs(e.source_ids,'sources',e.id);if(e.testing_label==='Verified positive result')assert(e.result&&e.stage,`Positive needs stage and result: ${e.id}`);}
 for(const i of db.interpretations){
  assert(/^R6I\d{3}$/.test(i.id)&&i.id==='R6'+i.source_id,`Invalid source interpretation ${i.id}`);
  for(const key of ['title','meaning','pros','cons','check','assessment','last_reviewed'])assert(i[key]?.length>8,`Missing reading field ${i.id}.${key}`);
  assert(db.config.statuses.includes(i.status),`Invalid reading status ${i.id}`);
  assert(safeUrl(i.source_url),`Unsafe interpretation source ${i.id}`);
  refs([i.group_id],'interpretation_groups',i.id);refs(i.route_ids,'routes',i.id);refs(i.theory_ids,'theories',i.id);refs(i.experiment_ids,'experiments',i.id);refs(i.question_ids,'questions',i.id);
  assert(new Set(i.route_ids).size===i.route_ids.length,`Duplicate route in reading ${i.id}`);
 }
 for(const a of db.interpretation_angles){
  assert(/^A\d{3}$/.test(a.id),`Invalid angle ${a.id}`);
  refs([a.group_id],'interpretation_groups',a.id);refs(a.interpretation_ids,'interpretations',a.id);refs(a.route_ids,'routes',a.id);refs(a.theory_ids,'theories',a.id);
 }
 for(const i of db.legacy_interpretations){
  assert(/^I\d{3}$/.test(i.id),`Invalid legacy interpretation ${i.id}`);
  refs(i.successor_ids,'interpretations',i.id);refs(i.theory_ids,'theories',i.id);refs(i.experiment_ids,'experiments',i.id);
  for(const key of ['body','gone','remains','assemble','signal'])assert(i.chain?.[key]?.length>15,`Missing preserved chain ${i.id}.${key}`);
 }
 for(const q of db.questions){
  assert(/^Q\d{3}$/.test(q.id),`Invalid question ${q.id}`);
  for(const key of ['why','known','answer_needed','how','would_change'])assert(q[key]?.length>15,`Missing question field ${q.id}.${key}`);
  refs(q.interpretation_ids,'interpretations',q.id);refs(q.theory_ids,'theories',q.id);refs(q.source_ids,'sources',q.id);
 }
 for(const m of db.theory_routes){refs([m.theory_id],'theories','Route join');refs([m.route_id],'routes','Route join');}
 for(const m of db.theory_experiments){refs([m.theory_id],'theories','Test join');refs([m.experiment_id],'experiments','Test join');}
 for(const r of db.routes)assert(db.theory_routes.some(m=>m.route_id===r.id),`Unmapped route ${r.id}`);
 assert(new Set(db.theory_routes.map(m=>m.theory_id+':'+m.route_id)).size===db.theory_routes.length,'Duplicate route join');
 if(errors.length)throw Error(errors.join('\n'));return true;
}
export function publicData(db){
 validate(db);
 const sources=db.sources.filter(s=>s.visibility==='public');const allowed=new Set(sources.map(s=>s.id));
 for(const record of [...db.questions,...db.observations,...db.experiments,...db.theories.filter(t=>t.publication_state==='developed')])for(const id of record.source_ids||[])if(!allowed.has(id))throw Error('Private source reference in public record: '+id);
 return {...db,theories:db.theories.filter(t=>t.publication_state==='developed'),groups:db.theories.map(({id,title,publication_state})=>({id,title,publication_state})),sources};
}
export function csv(rows){if(!rows.length)return '';const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';return [keys.map(q).join(','),...rows.map(r=>keys.map(k=>q(typeof r[k]==='object'&&r[k]!==null?JSON.stringify(r[k]):r[k])).join(','))].join('\r\n')+'\r\n';}
