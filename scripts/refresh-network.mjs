import {readFile,writeFile,rename} from 'node:fs/promises';
import {aggregateNetwork} from './network.mjs';
const root=new URL('../',import.meta.url);
const authorId='https://openalex.org/A5038718884';
const orcid='https://orcid.org/0000-0003-3250-8143';
async function request(path){const url=new URL(path,'https://api.openalex.org/');if(process.env.OPENALEX_API_KEY)url.searchParams.set('api_key',process.env.OPENALEX_API_KEY);const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`OpenAlex returned ${response.status}; existing cache is unchanged. An OPENALEX_API_KEY may be needed.`);return response.json();}
const author=await request('authors/A5038718884');if(author.orcid!==orcid)throw new Error('ORCID identity mismatch');
const works=[];let cursor='*';
while(cursor){const page=await request(`works?filter=author.id:A5038718884&per-page=200&cursor=${encodeURIComponent(cursor)}`);if(!Array.isArray(page.results))throw new Error('Invalid works response');works.push(...page.results);cursor=page.results.length?page.meta.next_cursor:null;}
const refs=new Map(works.flatMap(w=>(w.authorships??[]).flatMap(a=>a.institutions??[])).map(i=>[i.id,i]));const lookup={};
// One bulk request per 50 institutions avoids an individual API call per marker.
const ids=[...refs.keys()];for(let i=0;i<ids.length;i+=50){const filter=ids.slice(i,i+50).map(id=>id.split('/').pop()).join('|');const page=await request(`institutions?filter=openalex_id:${filter}&per-page=200&select=id,display_name,geo,country_code`);if(!Array.isArray(page.results))throw new Error('Invalid institution response');for(const institution of page.results)lookup[institution.id]=institution;}
const overrides=JSON.parse(await readFile(new URL('content/network-overrides.json',root),'utf8'));
const nodes=aggregateNetwork(works,lookup,authorId,overrides);if(!nodes.length)throw new Error('No geographic nodes; refusing to replace cache');
const data={source:'OpenAlex',authorId,orcid,updated:new Date().toISOString().slice(0,10),workCount:works.length,nodes};
const target=new URL('assets/research-network.json',root),temp=new URL('assets/research-network.json.tmp',root);await writeFile(temp,JSON.stringify(data,null,2));await rename(temp,target);console.log(`Cached ${nodes.length} institutions from ${works.length} publications. Run npm run build.`);
