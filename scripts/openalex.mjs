export const authorId='https://openalex.org/A5038718884';
export const orcid='https://orcid.org/0000-0003-3250-8143';
export async function request(path){
 const url=new URL(path,'https://api.openalex.org/');
 if(process.env.OPENALEX_API_KEY)url.searchParams.set('api_key',process.env.OPENALEX_API_KEY);
 const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`OpenAlex returned ${response.status}; cached content is unchanged.`);
 return response.json();
}
export async function authorWorks(get=request){
 const author=await get('authors/A5038718884');
 if(author.orcid!==orcid)throw new Error('ORCID identity mismatch');
 const works=[],seen=new Set();let cursor='*';
 while(cursor){
  if(seen.has(cursor))throw new Error('Repeated OpenAlex cursor');
  seen.add(cursor);
  const page=await get(`works?filter=author.id:A5038718884&per_page=200&cursor=${encodeURIComponent(cursor)}`);
  if(!Array.isArray(page.results))throw new Error('Invalid works response');
  works.push(...page.results);
  cursor=page.results.length?page.meta?.next_cursor:null;
 }
 if(!works.length)throw new Error('Empty author works response; refusing refresh');
 return works;
}
