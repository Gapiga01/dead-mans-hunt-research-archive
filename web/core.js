export const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeHref=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:'#';}catch{return '#';}};
export const routeIds=(db,id)=>db.theory_routes.filter(m=>m.theory_id===id).map(m=>m.route_id);
export const experimentIds=(db,id)=>db.theory_experiments.filter(m=>m.theory_id===id).map(m=>m.experiment_id);
export function matchesTheory(t,f,db){
 if(f.status&&t.status!==f.status)return false;
 if(f.category&&!t.categories.includes(f.category))return false;
 if(f.scope&&t.scope!==f.scope)return false;
 if(f.reason&&t.parking?.reason!==f.reason)return false;
 const tests=experimentIds(db,t.id).map(id=>db.experiments.find(e=>e.id===id));
 const observations=t.supports.map(s=>db.observations.find(o=>o.id===s.observation_id));
 const hay=normalize(JSON.stringify([t,routeIds(db,t.id),tests,observations]));
 return normalize(f.q||'').split(/\s+/).filter(Boolean).every(token=>hay.includes(token));
}
export function makeSubmission(values){
 const title=String(values.title||'').trim(),explanation=String(values.explanation||'').trim();
 if(title.length<3||title.length>140)throw Error('Give the draft a title between 3 and 140 characters.');
 if(explanation.length<20||explanation.length>3000)throw Error('Explain the idea in 20–3000 characters.');
 const source=String(values.source||'').trim();if(source&&safeHref(source)==='#')throw Error('Use an http or https source link, or leave it blank.');
 if(!['idea','correction','test'].includes(values.type))throw Error('Choose a submission type.');
 if(!values.category)throw Error('Choose a category.');
 return {schema_version:'1.0',review_state:'pending',submitted_at:new Date().toISOString(),type:values.type,title,category:values.category,theory_id:String(values.theory_id||'').trim(),explanation,source_url:source||null,previous_tests:String(values.previous_tests||'').trim()||null,suggested_experiment:String(values.experiment||'').trim()||null,credit:String(values.credit||'').trim()||null};
}
