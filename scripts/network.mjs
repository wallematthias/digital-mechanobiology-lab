export function aggregateNetwork(works,lookup,authorId,overrides={}){
 const nodes=new Map();
 for(const work of works){if(overrides.excludeWorks?.includes(work.id)||!work.authorships?.some(a=>a.author?.id===authorId))continue;
 for(const authorship of work.authorships){if(authorship.author?.id===authorId)continue;
 for(const ref of authorship.institutions??[]){if(overrides.excludeInstitutions?.includes(ref.id))continue;const institution={...lookup[ref.id],...overrides.institutions?.[ref.id]};const geo=institution.geo;if(!geo||!Number.isFinite(geo.latitude)||!Number.isFinite(geo.longitude)||Math.abs(geo.latitude)>90||Math.abs(geo.longitude)>180)continue;
 if(!nodes.has(ref.id))nodes.set(ref.id,{id:ref.id,name:institution.display_name??ref.display_name,city:geo.city??'',country:institution.country_code??'',latitude:geo.latitude,longitude:geo.longitude,authors:new Set(),papers:new Map()});const node=nodes.get(ref.id);if(authorship.author?.display_name)node.authors.add(authorship.author.display_name);node.papers.set(work.id,{id:work.id,title:work.title??work.display_name,year:work.publication_year,doi:work.doi});
 }}}
 return [...nodes.values()].map(n=>({...n,authors:[...n.authors].sort(),papers:[...n.papers.values()].sort((a,b)=>b.year-a.year)})).sort((a,b)=>b.papers.length-a.papers.length||a.name.localeCompare(b.name));
}
