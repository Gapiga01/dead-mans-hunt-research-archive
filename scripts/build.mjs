import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT,readDatabase,publicData,csv} from './data.mjs';
import {loadSite,pagesFor,documentFor,sitemapFor,robotsFor} from './site.mjs';
import {webAssets} from './public-files.mjs';
const db=await readDatabase();const data=publicData(db);const site=await loadSite(process.env,{production:process.argv.includes('--production')});
data.site={name:site.name,google_form_url:site.google_form_url};
const dist=path.join(ROOT,'dist');
// Rebuild only this generated child folder, so stale files cannot be published.
if(path.resolve(dist)!==path.resolve(ROOT,'dist')||path.dirname(dist)!==ROOT)throw Error('Unexpected build target.');
const previous=await fs.lstat(dist).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
if(previous?.isSymbolicLink())throw Error('Refusing to replace a linked build directory.');
await fs.rm(dist,{recursive:true,force:true});
await fs.mkdir(dist,{recursive:true});
for(const file of webAssets){const src=path.join(ROOT,'web',file);if((await fs.lstat(src)).isSymbolicLink())throw Error('Linked asset refused: '+file);await fs.copyFile(src,path.join(dist,file));}
const shell=await fs.readFile(path.join(ROOT,'web/index.html'),'utf8');const pages=pagesFor(data,site);
for(const page of pages){const relative=page.pathname.slice(site.basePath.length);const folder=path.join(dist,relative);await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'index.html'),documentFor(page,data,site,shell));}
await fs.writeFile(path.join(dist,'sitemap.xml'),sitemapFor(pages));await fs.writeFile(path.join(dist,'robots.txt'),robotsFor(site));
const notFound={route:'missing',id:null,filters:{},title:'Page not found',description:'This research page could not be found. Browse the Dead Man’s Hunt archive to continue.',url:new URL('404.html',site.url).href,index:false,lastmod:db.config.reviewed_at};
await fs.writeFile(path.join(dist,'404.html'),documentFor(notFound,data,site,shell));
await fs.mkdir(path.join(dist,'data'),{recursive:true});await fs.writeFile(path.join(dist,'data/hub.json'),JSON.stringify(data));
await fs.writeFile(path.join(dist,'.nojekyll'),'');
await fs.writeFile(path.join(dist,'build-manifest.json'),JSON.stringify({site_url:site.url,mode:site.local?'local-review':'public-ready',pages:pages.map(({pathname,index,url})=>({pathname,index,url})),name:site.name},null,2));
await fs.mkdir(path.join(ROOT,'database/csv'),{recursive:true});for(const [name,rows] of Object.entries(db))if(Array.isArray(rows))await fs.writeFile(path.join(ROOT,'database/csv',name+'.csv'),csv(rows));
console.log(`Built ${pages.length} HTML pages (${pages.filter(p=>p.index).length} sitemap entries), ${data.theories.length} developed theories, ${data.interpretations.length} readings and ${data.routes.length} route records. Mode: ${site.local?'local review (noindex)':'public-ready'}. No publication performed.`);
