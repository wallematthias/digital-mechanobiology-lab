import {readFile,writeFile,rename} from 'node:fs/promises';
import {aggregateNetwork} from './network.mjs';
import {request,authorWorks,authorId,orcid} from './openalex.mjs';
const root=new URL('../',import.meta.url);
const works=await authorWorks();
const refs=new Map(works.flatMap(w=>(w.authorships??[]).flatMap(a=>a.institutions??[])).map(i=>[i.id,i]));const lookup={};
// One bulk request per 50 institutions avoids an individual API call per marker.
const ids=[...refs.keys()];for(let i=0;i<ids.length;i+=50){const filter=ids.slice(i,i+50).map(id=>id.split('/').pop()).join('|');const page=await request(`institutions?filter=openalex_id:${filter}&per_page=200&select=id,display_name,geo,country_code`);if(!Array.isArray(page.results))throw new Error('Invalid institution response');for(const institution of page.results)lookup[institution.id]=institution;}
const overrides=JSON.parse(await readFile(new URL('content/network-overrides.json',root),'utf8'));
const nodes=aggregateNetwork(works,lookup,authorId,overrides);if(!nodes.length)throw new Error('No geographic nodes; refusing to replace cache');
const data={source:'OpenAlex',authorId,orcid,updated:new Date().toISOString().slice(0,10),workCount:works.length,nodes};
const target=new URL('assets/research-network.json',root),temp=new URL('assets/research-network.json.tmp',root);
const previous=JSON.parse(await readFile(target,'utf8'));
const {updated:oldDate,...oldContent}=previous;
const {updated:newDate,...newContent}=data;
if(JSON.stringify(oldContent)===JSON.stringify(newContent))console.log('Network unchanged.');
else {await writeFile(temp,JSON.stringify(data,null,2));await rename(temp,target);console.log(`Cached ${nodes.length} institutions from ${works.length} publications. Run npm run build.`);}
