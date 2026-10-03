const svg=document.getElementById('network-map');
const select=document.getElementById('institution-select');
const panel=document.getElementById('institution-detail');
const NS='http://www.w3.org/2000/svg';
const project=(longitude,latitude)=>[(longitude+180)*2.5,(90-latitude)*2.5];
function element(tag,attrs={},text){const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);if(text)node.textContent=text;return node;}
function paragraph(text){const p=document.createElement('p');p.textContent=text;return p;}
async function init(){
 const responses=await Promise.all([fetch('assets/research-network.json'),fetch('assets/world-land.json')]);if(responses.some(r=>!r.ok))throw new Error('Map cache unavailable');const [data,land]=await Promise.all(responses.map(r=>r.json()));
 svg.setAttribute('role','group');svg.setAttribute('aria-label','Interactive map of publication affiliations');
 for(let latitude=-60;latitude<=60;latitude+=30){const [,y]=project(0,latitude);svg.append(element('path',{d:`M0 ${y} H900`,class:'map-grid'}));}
 for(let longitude=-150;longitude<=150;longitude+=30){const [x]=project(longitude,0);svg.append(element('path',{d:`M${x} 0 V450`,class:'map-grid'}));}
 for(const feature of land.features){const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;for(const polygon of polygons){const d=polygon.map(ring=>ring.map((point,i)=>`${i?'L':'M'}${project(...point).map(n=>n.toFixed(1)).join(' ')}`).join(' ')+' Z').join(' ');svg.append(element('path',{d,class:'map-land'}));}}
 const links=element('g'),markers=element('g');svg.append(links,markers);
 const origin=project(-114.0719,51.0447);let active;
 const choose=id=>{const node=data.nodes.find(n=>n.id===id);select.value=id;panel.replaceChildren();links.replaceChildren();if(active)active.classList.remove('selected');active=markers.querySelector(`[data-index="${data.nodes.indexOf(node)}"]`);active?.classList.add('selected');if(!node){panel.append(paragraph('Select an institution to explore its publications.'));return;}
 const title=document.createElement('h3');title.textContent=node.name;panel.append(title,paragraph([node.city,node.country].filter(Boolean).join(' · ')),paragraph(`${node.papers.length} shared indexed works · ${node.authors.length} co-authors`));
 const authors=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Co-authors on these papers';authors.append(summary,paragraph(node.authors.join(', ')));panel.append(authors);
 const list=document.createElement('ul');list.className='network-papers';for(const paper of node.papers){const item=document.createElement('li'),anchor=document.createElement('a');anchor.textContent=`${paper.year} · ${paper.title}`;anchor.href=/^https:\/\//.test(paper.doi??'')?paper.doi:paper.id;item.append(anchor);list.append(item);}panel.append(list);
 const point=project(node.longitude,node.latitude);const mid=[(origin[0]+point[0])/2,Math.min(origin[1],point[1])-Math.min(100,Math.abs(origin[0]-point[0])*.2)];links.append(element('path',{d:`M${origin.join(' ')} Q${mid.join(' ')} ${point.join(' ')}`,class:'map-connection'}));
 };
 data.nodes.forEach((node,index)=>{const [x,y]=project(node.longitude,node.latitude);const marker=element('g',{transform:`translate(${x} ${y})`,class:'map-marker',tabindex:'0',role:'button','aria-label':`${node.name}, ${node.papers.length} shared works`,'data-index':index});marker.append(element('circle',{r:9,class:'marker-hit'}),element('circle',{r:Math.min(6,2.5+Math.sqrt(node.papers.length)),class:'marker-dot'}),element('title',{},node.name));marker.addEventListener('click',()=>choose(node.id));marker.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();choose(node.id);}});markers.append(marker);});
 const [x,y]=origin;svg.append(element('circle',{cx:x,cy:y,r:3.5,class:'map-home'}),element('text',{x:x+10,y:y+19,class:'map-home-label'},'CALGARY'));
 select.addEventListener('change',()=>choose(select.value));choose(data.nodes.find(n=>n.country==='CH')?.id??data.nodes[0]?.id??'');
}
init().catch(()=>{panel.replaceChildren(paragraph('The interactive map is unavailable. You can still browse the institution list below.'));});
