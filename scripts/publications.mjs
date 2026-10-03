const doiKey=value=>String(value??'').toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//,'').replace(/^doi:\s*/,'').trim();
const titleKey=value=>String(value??'').normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function planImports(works,existing,overrides={}){
 const dois=new Set(existing.map(p=>doiKey(p.url)).filter(Boolean));
 const titles=new Set(existing.map(p=>titleKey(p.title)));
 const ids=new Set(existing.map(p=>p.openalexId));
 const additions=[];
 for(const work of works){
  if(!['article','review','book-chapter'].includes(work.type)||work.primary_location?.source?.type==='repository'||overrides.excludeWorks?.includes(work.id))continue;
  const title=work.title??work.display_name;
  const doi=doiKey(work.doi);
  if(!title||!work.publication_year||ids.has(work.id)||titles.has(titleKey(title))||(doi&&dois.has(doi)))continue;
  const id=work.id?.match(/^https:\/\/openalex.org\/(W\d+)$/)?.[1];
  if(!id)throw new Error('Invalid OpenAlex work identifier');
  const metadata={title,year:work.publication_year,date:work.publication_date,journal:work.primary_location?.source?.display_name??'',url:doi?`https://doi.org/${doi}`:work.id,status:'published',openalexId:work.id,source:'OpenAlex',...(work.type==='book-chapter'?{kind:'Book chapter'}:{})};
  const authors=(work.authorships??[]).map(a=>a.author?.display_name).filter(Boolean).join(', ');
  additions.push({filename:`openalex-${id}.md`,text:`---\n${JSON.stringify(metadata,null,2)}\n---\n${authors}\n`});
  ids.add(work.id);titles.add(titleKey(title));if(doi)dois.add(doi);
 }
 return additions;
}
