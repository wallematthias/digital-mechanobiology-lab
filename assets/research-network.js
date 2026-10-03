import {zoomView,panView} from './map-view.mjs';
const svg=document.getElementById('network-map');
const select=document.getElementById('institution-select');
const panel=document.getElementById('institution-detail');
const NS='http://www.w3.org/2000/svg';
const project=(longitude,latitude)=>[(longitude+180)*2.5,(90-latitude)*2.5];
function element(tag,attrs={},text){const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);if(text)node.textContent=text;return node;}
function paragraph(text){const p=document.createElement('p');p.textContent=text;return p;}
function enableNavigation(){
 const initial={x:0,y:0,width:900,height:470};let view={...initial},dragged=false;
 const toolbar=document.createElement('div');toolbar.className='map-controls';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Map navigation');
 const controls=[['+','Zoom in',()=>update(zoomView(view,1.5))],['−','Zoom out',()=>update(zoomView(view,1/1.5))],['Reset view','Reset map view',()=>update({...initial})]];
 const buttons=controls.map(([label,name,action])=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-label',name);button.addEventListener('click',action);toolbar.append(button);return button;});
 const hint=document.createElement('span');hint.id='map-navigation-help';hint.textContent='Drag to pan · click map to enable scroll zoom';toolbar.append(hint);svg.before(toolbar);
 svg.setAttribute('tabindex','0');svg.setAttribute('aria-describedby',hint.id);
 const screenPoint=p=>{const point=svg.createSVGPoint();point.x=p.x;point.y=p.y;return point.matrixTransform(svg.getScreenCTM().inverse());};
 function update(next){view=next;svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.width} ${view.height}`);const scale=900/view.width;svg.querySelectorAll('.map-marker circle').forEach(circle=>{circle.setAttribute('r',Number(circle.dataset.radius)/scale);});svg.querySelector('.map-home').setAttribute('r',3.5/scale);const label=svg.querySelector('.map-home-label');label.style.fontSize=`${9/scale}px`;label.style.letterSpacing=`${1/scale}px`;buttons[0].disabled=view.width<=900/8;buttons[1].disabled=view.width>=900;}
 svg.querySelectorAll('.map-marker circle').forEach(circle=>circle.dataset.radius=circle.getAttribute('r'));
 svg.querySelectorAll('path,.marker-dot').forEach(node=>node.setAttribute('vector-effect','non-scaling-stroke'));
 svg.addEventListener('wheel',event=>{if(!svg.contains(document.activeElement)&&document.activeElement!==svg)return;event.preventDefault();const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?svg.clientHeight:1);update(zoomView(view,Math.exp(-Math.max(-200,Math.min(200,pixels))*.003),screenPoint({x:event.clientX,y:event.clientY})));},{passive:false});
 const pointers=new Map();let start;
 svg.addEventListener('pointerdown',event=>{if(event.button!==0)return;svg.focus({preventScroll:true});if(!pointers.size){dragged=false;start={x:event.clientX,y:event.clientY};}pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});});
 svg.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;
  const before=[...pointers.values()];const old=pointers.get(event.pointerId),next={x:event.clientX,y:event.clientY};
  pointers.set(event.pointerId,next);
  if(!dragged&&Math.hypot(next.x-start.x,next.y-start.y)<4&&pointers.size===1)return;
  dragged=true;svg.classList.add('is-panning');svg.setPointerCapture(event.pointerId);
  if(pointers.size===2){
   const after=[...pointers.values()],center=points=>({x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2}),distance=points=>Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
   const a=center(before),b=center(after),anchor=screenPoint(a),oldDistance=distance(before);
   if(oldDistance>0)update(zoomView(view,distance(after)/oldDistance,anchor));
   const from=screenPoint(a),to=screenPoint(b);update(panView(view,from.x-to.x,from.y-to.y));
  }else {const a=screenPoint(old),b=screenPoint(next);update(panView(view,a.x-b.x,a.y-b.y));}
 });
 const end=event=>{pointers.delete(event.pointerId);if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);if(!pointers.size)svg.classList.remove('is-panning');};
 svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('pointerleave',event=>{if(!svg.hasPointerCapture(event.pointerId))end(event);});
 svg.addEventListener('click',event=>{if(dragged){event.preventDefault();event.stopImmediatePropagation();dragged=false;}},true);
 svg.addEventListener('keydown',event=>{if(event.key==='+'||event.key==='='){event.preventDefault();update(zoomView(view,1.5));}else if(event.key==='-'){event.preventDefault();update(zoomView(view,1/1.5));}else if(event.key==='Home'){event.preventDefault();update({...initial});}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];update(panView(view,direction[0]*view.width*.1,direction[1]*view.height*.1));}});
 update(view);
}
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
 enableNavigation();
}
init().catch(()=>{panel.replaceChildren(paragraph('The interactive map is unavailable. You can still browse the institution list below.'));});
