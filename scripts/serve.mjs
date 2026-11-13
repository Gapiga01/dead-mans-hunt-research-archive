import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ROOT} from './data.mjs';
const dir=path.join(ROOT,'dist');const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
const manifest=JSON.parse(await fs.readFile(path.join(dir,'build-manifest.json'),'utf8'));const basePath=new URL(manifest.site_url).pathname;
const server=http.createServer(async(req,res)=>{try{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
 const url=new URL(req.url,'http://localhost');let p=decodeURIComponent(url.pathname);
 if(!p.startsWith(basePath)){res.writeHead(404);res.end('Not found');return;}p='/'+p.slice(basePath.length);
 let candidate=path.resolve(dir,'.'+(p.endsWith('/')?p+'index.html':p));
 if(candidate!==dir&&!candidate.startsWith(dir+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
 const stat=await fs.stat(candidate);if(stat.isDirectory()){res.writeHead(301,{'Location':url.pathname+'/'+url.search});res.end();return;}
 const b=await fs.readFile(candidate);res.writeHead(200,{'Content-Type':types[path.extname(candidate)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?undefined:b);
}catch{res.writeHead(404);res.end('Not found');}});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}${basePath}`));
process.on('SIGTERM',()=>server.close());process.on('SIGINT',()=>server.close());
