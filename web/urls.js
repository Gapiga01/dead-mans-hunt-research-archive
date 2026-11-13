// Shared by the static build and browser. All navigation stays within this site.
let basePath='/';
export function setBasePath(value){if(!value.startsWith('/')||!value.endsWith('/')||value.startsWith('//'))throw Error('Invalid site base path');basePath=value;}
const sections={home:'',theories:'theories/',interpretations:'interpretations/',questions:'questions/',categories:'categories/',parking:'parking/',tests:'tests/',archive:'archive/',evaluate:'about/',sources:'sources/',contribute:'contribute/'};
export function routeUrl(path='home',id=null,query={}){
 let suffix;
 if(['theory','interpretation','experiment'].includes(path)){
  if(!/^(T\d{3}|R6I\d{3}|I\d{3}|E\d{3})$/.test(id||''))return basePath+'404.html';
  suffix=({theory:'theories',interpretation:'interpretations',experiment:'tests'})[path]+'/'+id+'/';
 }else if(path in sections)suffix=sections[path];else return basePath+'404.html';
 const params=new URLSearchParams(query);
 if(path==='archive'&&!params.get('q')&&Number(params.get('page'))>1){suffix='archive/page/'+Math.floor(Number(params.get('page')))+'/';params.delete('page');}
 return basePath+suffix+(params.size?'?'+params:'');
}
export function parseLocation(pathname,search=''){
 if(!pathname.startsWith(basePath))return {path:'missing',id:null,filters:{}};
 const p=pathname.slice(basePath.length).replace(/index\.html$/,'').split('/').filter(Boolean);
 const filters=Object.fromEntries(new URLSearchParams(search));
 if(!p.length)return {path:'home',id:null,filters};
 if(p[0]==='archive'&&p[1]==='page'&&/^\d+$/.test(p[2]||'')){filters.page=p[2];return {path:'archive',id:null,filters};}
 if(['theories','interpretations','tests'].includes(p[0])&&p.length===2)return {path:({theories:'theory',interpretations:'interpretation',tests:'experiment'})[p[0]],id:p[1],filters};
 const path=p[0]==='about'?'evaluate':p[0];return {path:path in sections?path:'missing',id:null,filters};
}
export function hashUrl(hash){const [path,query='']=hash.replace(/^#\/?/,'').split('?');const p=path.split('/');return routeUrl(p[0]||'home',p[1],Object.fromEntries(new URLSearchParams(query)));}
export function rewriteLinks(html){return html.replace(/href="#\/([^"<>]*)"/g,(_,route)=>'href="'+hashUrl('#/'+route.replaceAll('&amp;','&')).replaceAll('&','&amp;')+'"');}
