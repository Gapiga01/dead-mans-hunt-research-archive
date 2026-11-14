import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {ROOT,readDatabase,publicData} from './data.mjs';
import {sourceFiles,webAssets,databaseFiles} from './public-files.mjs';
export const secretPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\b(?:sk-proj-|sk_live_|ghp_|github_pat_)[A-Za-z0-9_-]{20,}/,/\bAKIA[0-9A-Z]{16}\b/];
const forbiddenIds=['d0a45f61ec1916ed01dd18e6806e43dd569431fe6dabcdb07d1164ea0aff853a','78e7637f2d1bc59cc5a9f8a86c5ce07b9d01c00b8ee70ab3d9fe28b92c6f9fd7'];
export function inspectText(text,label){
 for(const re of secretPatterns)if(re.test(text))throw Error('Possible credential in '+label+'; inspect locally. Value omitted.');
 if(/[A-Z]:[\\/]Users[\\/]/i.test(text))throw Error('Local user path in '+label);
 for(const candidate of text.match(/[A-Za-z0-9_-]{40,80}/g)||[])if(forbiddenIds.includes(createHash('sha256').update(candidate).digest('hex')))throw Error('Owner-only document reference in '+label);
}
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink())throw Error('Linked build file refused');if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
export async function auditBuild(dir=path.join(ROOT,'dist')){
 const files=await walk(dir);const manifest=JSON.parse(await fs.readFile(path.join(dir,'build-manifest.json'),'utf8'));const base=new URL(manifest.site_url);const errors=[];let links=0;const external=new Set();
 const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#39;',"'").replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');
 for(const file of files){const relative=path.relative(dir,file).replaceAll(path.sep,'/');if(/(^|\/)(\.research|\.private|node_modules|docs|\.git)(\/|$)|\.(zip|docx|mp4|wav|env|pem)$/i.test(relative))throw Error('Non-public file in build: '+relative);
  if(path.extname(file)==='.png')continue;const text=await fs.readFile(file,'utf8');inspectText(text,relative);
  if(path.extname(file)!=='.html')continue;
  const pageUrl=new URL(relative.replace(/index\.html$/,''),base);
  if(!/<title>[^<]+<\/title>/.test(text)||!text.includes('name="description"')||!text.includes('rel="canonical"'))errors.push('Missing metadata '+relative);
  for(const m of text.matchAll(/<(a|link|script|img)\b[^>]*?\b(href|src)="([^"]*)"/g)){
   const href=decode(m[3]);if(!href)continue;links++;
   if(href.startsWith('#/')){errors.push('Hash route in '+relative);continue;}
   let u;try{u=new URL(href,pageUrl);}catch{errors.push('Invalid URL in '+relative);continue;}
   if(!['http:','https:'].includes(u.protocol)){errors.push('Unsafe URL scheme in '+relative);continue;}
   if(u.origin!==base.origin){if(m[1]!=='a')errors.push('External active asset in '+relative);else external.add(u.href);continue;}
   if(!u.pathname.startsWith(base.pathname)){errors.push('Link escapes site base: '+u.pathname);continue;}
   let target=decodeURIComponent(u.pathname.slice(base.pathname.length));target=target.endsWith('/')?target+'index.html':target||'index.html';const resolved=path.resolve(dir,target);
   if(!resolved.startsWith(path.resolve(dir)+path.sep)){errors.push('Link escapes build');continue;}
   try{await fs.access(resolved);}catch{errors.push('Missing target '+target+' from '+relative);}
  }
  for(const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(m[1].includes('application/ld+json'))JSON.parse(m[2]);else if(!m[1].includes('src='))errors.push('Inline executable script '+relative);}
 }
 const sitemap=await fs.readFile(path.join(dir,'sitemap.xml'),'utf8');const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));
 if(new Set(locs).size!==locs.length)errors.push('Duplicate sitemap URL');
 for(const u of locs)if(u.includes('#')||!manifest.pages.some(p=>p.url===u&&p.index))errors.push('Invalid sitemap entry');
 if(errors.length)throw Error([...new Set(errors)].join('\n'));
 return {html_pages:files.filter(f=>f.endsWith('.html')).length,internal_and_external_references:links,sitemap_entries:locs.length,external_source_urls:[...external],mode:manifest.mode,site_url:manifest.site_url};
}
export async function auditSource(){const db=await readDatabase();publicData(db);if(db.sources.some(s=>s.visibility!=='public'))throw Error('Non-public source metadata must not enter a public source package.');const list=[...sourceFiles,...databaseFiles];for(const name of list){const p=path.join(ROOT,name);if((await fs.lstat(p)).isSymbolicLink())throw Error('Linked source '+name);if(!name.endsWith('.png'))inspectText(await fs.readFile(p,'utf8'),name);}const pkg=JSON.parse(await fs.readFile(path.join(ROOT,'package.json'),'utf8'));if(Object.keys(pkg.dependencies||{}).length||Object.keys(pkg.devDependencies||{}).length)throw Error('Dependency list changed; review before release.');return {checked_source_files:list.length,third_party_npm_dependencies:0,public_assets:webAssets.length};}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){console.log(JSON.stringify({source:await auditSource(),build:await auditBuild()},null,2));}
