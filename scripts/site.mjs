import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT} from './data.mjs';
import {escapeHtml as h} from '../web/core.js';
import {setBasePath,routeUrl,rewriteLinks,primarySection} from '../web/urls.js';
import {renderPage} from '../web/views.js';
import {fillReadingViews} from '../web/readings.js';
export const SITE_NAME="Dead Man's Hunt Research Archive";
export async function loadSite(env=process.env,{production=false}={}){
 const config=JSON.parse(await fs.readFile(path.join(ROOT,'site.config.json'),'utf8'));
 const raw=env.SITE_URL||config.url||'http://127.0.0.1:4173/';const u=new URL(raw);
 if(u.username||u.password||u.search||u.hash||!['http:','https:'].includes(u.protocol))throw Error('SITE_URL must be a plain HTTPS website URL, including any repository path.');
 const local=['localhost','127.0.0.1','[::1]'].includes(u.hostname);
 if(!local&&u.protocol!=='https:')throw Error('Public SITE_URL must use HTTPS.');
 if(production&&local)throw Error('A public SITE_URL is required for a production build.');
 if(!u.pathname.endsWith('/'))u.pathname+='/';
 const verification=env.GOOGLE_SITE_VERIFICATION||config.google_site_verification||'';
 if(verification&&!/^[A-Za-z0-9_-]{10,250}$/.test(verification))throw Error('Paste only the Google HTML-tag verification content value.');
 const form=env.GOOGLE_FORM_URL||config.google_form_url||'';
 if(form){const f=new URL(form);if(f.protocol!=='https:'||!(f.hostname==='forms.gle'||f.hostname==='docs.google.com'&&f.pathname.startsWith('/forms/'))||f.username||f.password)throw Error('Use a public HTTPS Google Form link.');}
 return {...config,name:SITE_NAME,url:u.href,basePath:u.pathname,local,verification,google_form_url:form};
}
const descriptions={
 home:"Explore Hypixel SkyBlock Dead Man's Hunt research, solved R1–R5 mechanics, R6 interpretations, attributed reports and historical routes.",
 guide:'Start Dead Man’s Hunt with the original R1–R5 clues, documented solutions, item and timing conditions, sources and the limits of their connection to Riddle 6.',
 explore:'Explore the unsolved Dead Man’s Hunt Riddle 6 through interpretations, developed investigations, test coverage, source evidence and open questions.',
 search:'Search reviewed public Dead Man’s Hunt research by theory, item, mechanic, NPC, route ID, test or attributed contributor.',
 interpretations:'Compare 27 readings of Dead Man’s Hunt Riddle 6, grouped by literal meanings, body, disappearance, assembly, grammar, literature and environmental conditions.',
 theories:'Browse Hypixel SkyBlock Dead Man’s Hunt theories, their evidence, reported tests, weaknesses and personal assessments. Speculation stays separate from confirmed mechanics.',
 questions:'Find specific unanswered Dead Man’s Hunt research questions, why they matter and the evidence that would help answer them.',
 tests:'Read attributed Dead Man’s Hunt test reports and observations, with procedures, conditions, results and verification limits.',
 archive:'Browse 116 Dead Man’s Hunt research routes: 104 original records and 12 later additions, with detailed readings, historical descriptions and qualified testing coverage.',
 parking:'Read parked and retired Dead Man’s Hunt ideas, why they were set aside and what evidence could reopen them.',
 categories:'Explore Dead Man’s Hunt research by progression, identity, mechanics, hidden messages, literature and group events.',
 evaluate:'About the Dead Man’s Hunt research archive, contributor credits, ChatGPT and Sol assistance, editorial priorities, corrections and submission availability.',
 sources:'Follow original Dead Man’s Hunt player reports, game documentation, developer notes and literary sources, with contributor credit and verification limits.',
 contribute:'Submission availability for the Dead Man’s Hunt Research Archive. Submissions are closed until a Google Form is connected and tested.'
};
const names={home:SITE_NAME,guide:'Start Here — R1–R5',explore:'Explore R6',search:'Search the archive',interpretations:'Ways to read R6',theories:'Dead Man’s Hunt theories',questions:'Open research questions',tests:'Tests and observations',archive:'Research Archive',parking:'Parked and retired ideas',categories:'Research categories',evaluate:'About, credits & corrections',sources:'Sources and contributor credits',contribute:'Contributions & corrections'};
export function pagesFor(db,site){
 setBasePath(site.basePath);
 const pages=Object.keys(names).map(route=>({route,id:null,filters:{},index:!['contribute','search'].includes(route)}));
 for(let n=2;n<=Math.ceil(db.routes.length/20);n++)pages.push({route:'archive',id:null,filters:{page:String(n)},index:true});
 for(const t of [...db.theories,...db.groups.filter(g=>g.publication_state==='planned')])pages.push({route:'theory',id:t.id,filters:{},index:t.publication_state!=='planned'});
 for(const i of db.interpretations)pages.push({route:'interpretation',id:i.id,filters:{},index:true});
 for(const i of db.legacy_interpretations)pages.push({route:'interpretation',id:i.id,filters:{},index:false});
 for(const e of db.experiments)pages.push({route:'experiment',id:e.id,filters:{},index:true});
 for(const r of db.routes)pages.push({route:'route',id:r.id,filters:{},index:db.breakdowns.some(b=>b.subject_id===r.id)});
 return pages.map(p=>{
  const record=p.route==='theory'?(db.theories.find(t=>t.id===p.id)||db.groups.find(t=>t.id===p.id)):p.route==='interpretation'?(db.interpretations.find(i=>i.id===p.id)||db.legacy_interpretations.find(i=>i.id===p.id)):p.route==='experiment'?db.experiments.find(e=>e.id===p.id):p.route==='route'?db.routes.find(r=>r.id===p.id):null;
  const title=(record?.title||names[p.route]+(p.filters.page?' — page '+p.filters.page:''))+(p.route==='route'?' · '+p.id:'');
  let description=record?(record.summary||record.meaning||record.procedure||record.description||'Original research routes grouped for future investigation; this is not a finished theory page.'):descriptions[p.route];
  if(p.filters.page)description=`Routes ${(Number(p.filters.page)-1)*20+1}–${Math.min(Number(p.filters.page)*20,db.routes.length)} of the Dead Man’s Hunt research archive. Read the original descriptions, testing qualifications and source links.`;
  description=description.replace(/\s+/g,' ').trim();if(description.length>190)description=description.slice(0,187).replace(/\s+\S*$/,'')+'…';
  const pathname=routeUrl(p.route,p.id,p.filters);
  return {...p,title,description,pathname,url:new URL(pathname,site.url).href,lastmod:record?.last_reviewed||db.config.reviewed_at};
 });
}
const jsonScript=value=>JSON.stringify(value).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026');
export function documentFor(page,db,site,shell){
 setBasePath(site.basePath);const content=rewriteLinks(fillReadingViews(renderPage(db,page.route,page.filters,page.id),db,page.route,page.filters));
 const title=page.route==='home'?SITE_NAME+' | Hypixel SkyBlock':page.title+' | '+SITE_NAME;
 const image=new URL('social-preview.png',site.url).href;
 const crumbs=[{'@type':'ListItem',position:1,name:SITE_NAME,item:site.url}];
 if(page.route!=='home')crumbs.push({'@type':'ListItem',position:2,name:page.title,item:page.url});
 const graph=[{'@type':'WebPage','@id':page.url+'#page',url:page.url,name:page.title,description:page.description,inLanguage:'en',isPartOf:{'@id':site.url+'#website'},about:{'@type':'VideoGame',name:'Hypixel SkyBlock'},dateModified:page.lastmod},{'@type':'BreadcrumbList',itemListElement:crumbs}];
 if(page.route==='home')graph.unshift({'@type':'WebSite','@id':site.url+'#website',url:site.url,name:SITE_NAME,description:descriptions.home,inLanguage:'en'});
 const robots=site.local||!page.index?'noindex,follow':'index,follow';
 const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(title)}</title><meta name="description" content="${h(page.description)}"><meta name="robots" content="${robots}"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'"><link rel="canonical" href="${h(page.url)}"><meta property="og:type" content="website"><meta property="og:site_name" content="${h(SITE_NAME)}"><meta property="og:title" content="${h(title)}"><meta property="og:description" content="${h(page.description)}"><meta property="og:url" content="${h(page.url)}"><meta property="og:image" content="${h(image)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Dead Man's Hunt Research Archive — theories, interpretations and test reports"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${h(title)}"><meta name="twitter:description" content="${h(page.description)}"><meta name="twitter:image" content="${h(image)}">${site.verification?`<meta name="google-site-verification" content="${h(site.verification)}">`:''}<script type="application/ld+json">${jsonScript({'@context':'https://schema.org','@graph':graph})}</script><link rel="icon" href="${site.basePath}mark.svg" type="image/svg+xml"><link rel="stylesheet" href="${site.basePath}styles.css"><script type="module" src="${site.basePath}app.js"></script>`;
 let html=shell.replace(/<head>[\s\S]*?<\/head>/,()=>'<head>'+head+'</head>').replace(/<main id="main"[^>]*>[\s\S]*?<\/main>/,()=>`<main id="main" tabindex="-1">${content}</main>`).replace(/<noscript>[\s\S]*?<\/noscript>/,'<noscript>Search filters need JavaScript. All research pages and links remain readable without it.</noscript>');
 html=html.replace('STAGE 1–3 · LOCAL PROTOTYPE',site.local?'REVIEW COPY · NOT PUBLISHED':'COMMUNITY RESEARCH');
 html=html.replace('__ABOUT_METHOD__',routeUrl('evaluate')+'#methodology');
 const logical=page.route==='theory'?'theories':page.route==='interpretation'?'interpretations':page.route==='experiment'?'tests':page.route;
 html=html.replace(/(<a data-nav="([^"]+)"[^>]*)(>)/g,(_,start,nav,end)=>start+([logical,primarySection(page.route)].includes(nav)?' class="active" aria-current="'+(nav===logical?'page':'location')+'"':'')+end);
 return rewriteLinks(html);
}
export function sitemapFor(pages){return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.filter(p=>p.index).map(p=>`  <url><loc>${h(p.url)}</loc><lastmod>${p.lastmod}</lastmod></url>`).join('\n')+'\n</urlset>\n';}
export function robotsFor(site){return site.local?'User-agent: *\nDisallow: /\n':'User-agent: *\nAllow: /\nSitemap: '+new URL('sitemap.xml',site.url).href+'\n';}
