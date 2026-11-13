import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT,safeUrl} from './data.mjs';
const input=process.argv[2];if(!input){console.log('Usage: npm run review:import -- path/to/dmh-review.json');process.exitCode=1;}else{
 const raw=await fs.readFile(path.resolve(input),'utf8');if(Buffer.byteLength(raw)>25000)throw Error('Submission is too large.');
 const d=JSON.parse(raw);if(d.review_state!=='pending'||!['idea','correction','test'].includes(d.type)||typeof d.title!=='string'||typeof d.explanation!=='string')throw Error('Invalid review draft.');
 if(d.source_url&&!safeUrl(d.source_url))throw Error('Unsafe source URL.');
 const allowed=['schema_version','review_state','submitted_at','type','title','category','theory_id','explanation','source_url','previous_tests','suggested_experiment','credit'];
 if(Object.keys(d).some(k=>!allowed.includes(k)))throw Error('Unknown fields. Review the input before importing.');
 const id=crypto.randomUUID();await fs.mkdir(path.join(ROOT,'.private/submissions'),{recursive:true});await fs.writeFile(path.join(ROOT,'.private/submissions',id+'.json'),JSON.stringify(d,null,2));
 console.log('Saved to the local private review queue. Not added to the website or public database.');
}
