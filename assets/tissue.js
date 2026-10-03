(()=>{
const root=document.getElementById('mech-field'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),status={textContent:''};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let w=736,h=420,last=0,time=0,damage=[],cells=[],particles=[],force=0,target=0,px=.5,py=.5,down=false,active=false,lastDeposit=-9,raf=0;
let palette={};
function colors(){
 const probe=document.createElement('span');probe.style.display='none';root.appendChild(probe);
 function get(k,f){probe.style.color=f;probe.style.color='var('+k+', '+f+')';return getComputedStyle(probe).color||f}
 palette={mesh:'#697079',cell:'#c8102e',strain:'#ffcd00',damage:'#302d2b',core:'#ffcd00'};probe.remove();
}
function jet(value){const t=Math.max(0,Math.min(1,value));const channel=n=>Math.round(255*Math.max(0,Math.min(1,1.5-Math.abs(4*t-n))));return 'rgb('+channel(3)+','+channel(2)+','+channel(1)+')'}
function reset(){damage=[];particles=[];cells=Array.from({length:25},(_,i)=>({x:.08+Math.random()*.84,y:.14+Math.random()*.72,a:Math.random()*6.28,r:12+Math.random()*7,seed:i,trail:[]}));force=0;status.textContent='Tissue at rest';draw();}
function size(){w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);let d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);colors();draw();}
function deposit(click=false){if(!click&&time-lastDeposit<.16)return;lastDeposit=time;let near=damage.find(d=>Math.hypot((d.x-px)*w,(d.y-py)*h)<28);if(near)near.health=Math.min(6,near.health+(click?.8:.12));else if(damage.length<32)damage.push({x:px,y:py,health:1,angle:Math.random()*6.28});status.textContent='Damage created · cells recruiting';}
function point(x,y){let dx=x-px,dy=y-py,r2=dx*dx+dy*dy,s=force*Math.exp(-r2/.007),z=s*.09;
 const wave=Math.sin(x*9+y*5)*.026+Math.cos(x*5-y*8)*.022;
 let strain=s;
 for(const d of damage){let ddx=x-d.x,ddy=y-d.y,q=Math.min(d.health,2)*Math.exp(-(ddx*ddx+ddy*ddy)/.005);z+=q*.037;strain+=q*.65}
 return{x:(x+dx*s*.22+.012*Math.sin(y*10+x*3))*w,y:(y+dy*s*.22+z+wave)*h,strain};}
function segment(a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function glow(x,y,r,color,opacity){if(![x,y,r,opacity].every(Number.isFinite)||r<=0)return;ctx.save();const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.globalAlpha=opacity;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
function draw(){
 ctx.clearRect(0,0,w,h);
 // Two displaced fiber layers give a transparent, volumetric scaffold.
 for(let layer=1;layer>=0;layer--){const cols=26,rows=16;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
   let x=.03+i/cols*.94,y=.08+j/rows*.79,a=point(x,y),edge=Math.max(0,Math.min(i/5,(cols-i)/5,j/4,(rows-j)/4,1));
   const offset=layer*14;a.y+=offset;
   ctx.globalAlpha=edge*(layer?.035:.10+a.strain*.30);
   ctx.strokeStyle=a.strain>.045?jet(a.strain):palette.mesh;ctx.lineWidth=layer?.5:a.strain>.2?1.15:.65;
   if(!layer&&i<cols&&j<rows){
    const b=point(x+.94/cols,y),c=point(x+.94/cols,y+.79/rows),d=point(x,y+.79/rows);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();
    ctx.fillStyle=a.strain>.045?jet(a.strain):palette.mesh;
    ctx.globalAlpha=edge*(.025+.035*(.5+.5*Math.sin(x*9+y*5))+a.strain*.12);ctx.fill();
    ctx.globalAlpha=edge*(.10+a.strain*.30);
   }
   if(i<cols){let b=point(x+.94/cols,y);b.y+=offset;segment(a,b)}
   if(j<rows){let b=point(x,y+.79/rows);b.y+=offset;segment(a,b)}
   if(!layer&&i<cols&&j<rows){ctx.globalAlpha*=.08;segment(a,point(x+.94/cols,y+.79/rows))}
   if(!layer&&i%3===0&&j%3===0){ctx.globalAlpha=edge*.5;ctx.fillStyle=a.strain>.045?jet(a.strain):palette.mesh;ctx.beginPath();ctx.arc(a.x,a.y,.9,0,Math.PI*2);ctx.fill()}
  }
 }
 ctx.globalAlpha=1;
 if(force>.02){const a=point(px,py);glow(a.x,a.y,110,jet(force),force*.13);
  for(let ring=1;ring<=5;ring++){ctx.beginPath();for(let n=0;n<=90;n++){let angle=n/90*Math.PI*2,r=ring*.015,b=point(px+Math.cos(angle)*r,py+Math.sin(angle)*r);if(n===0)ctx.moveTo(b.x,b.y);else ctx.lineTo(b.x,b.y)}ctx.strokeStyle=jet(force*Math.exp(-Math.pow(ring*.015,2)/.007));ctx.globalAlpha=force*(.65-ring*.07);ctx.lineWidth=1.2;ctx.stroke()}
 }
 ctx.globalAlpha=1;
 for(const d of damage){const a=point(d.x,d.y);glow(a.x,a.y,35+Math.sqrt(d.health)*12,palette.cell,Math.min(.8,.25+d.health*.12));}
 for(const c of cells){
  ctx.strokeStyle=palette.cell;ctx.lineWidth=.8;
  for(let i=1;i<c.trail.length;i++){ctx.globalAlpha=i/c.trail.length*.18;segment(point(c.trail[i-1].x,c.trail[i-1].y),point(c.trail[i].x,c.trail[i].y))}
  const a=point(c.x,c.y),depth=.7+c.y*.5,r=c.r*depth;if(![a.x,a.y,r].every(Number.isFinite)||r<=0)continue;glow(a.x,a.y,r*4,palette.cell,.09);
  ctx.save();ctx.translate(a.x,a.y);ctx.rotate(c.a);ctx.fillStyle=palette.cell;ctx.strokeStyle=palette.cell;
  // Irregular membrane, internal organelles, bright nucleus, and leading filopodia.
  ctx.beginPath();for(let n=0;n<=32;n++){let t=n/32*Math.PI*2,rr=1+.06*Math.sin(t*5+c.seed);let x=Math.cos(t)*r*1.15*rr,y=Math.sin(t)*r*rr;if(n===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();
  const body=ctx.createRadialGradient(-r*.35,-r*.3,r*.15,0,0,r*1.4);body.addColorStop(0,palette.cell);body.addColorStop(1,'transparent');ctx.fillStyle=body;ctx.globalAlpha=.65;ctx.fill();ctx.globalAlpha=.28;ctx.lineWidth=.65;ctx.shadowColor=palette.cell;ctx.shadowBlur=7;ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=palette.cell;
  ctx.globalAlpha=.22;ctx.lineWidth=.65;for(let k=0;k<6;k++){const t=k*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(t)*r,Math.sin(t)*r);ctx.lineTo(Math.cos(t)*r*1.35,Math.sin(t)*r*1.35);ctx.stroke()}
  for(let k=0;k<4;k++){ctx.beginPath();ctx.arc(Math.cos(k*2+c.seed)*r*.8,Math.sin(k*2+c.seed)*r*.5,1,0,Math.PI*2);ctx.fill()}
  ctx.globalAlpha=.9;ctx.fillStyle=palette.core;ctx.shadowColor=palette.core;ctx.shadowBlur=6;ctx.beginPath();ctx.ellipse(-r*.15,0,r*.50,r*.43,0,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 for(const p of particles){const a=point(p.x,p.y);ctx.globalAlpha=p.life;ctx.fillStyle=palette.cell;ctx.shadowColor=palette.cell;ctx.shadowBlur=5;ctx.beginPath();ctx.arc(a.x,a.y,1.7,0,Math.PI*2);ctx.fill()}ctx.shadowBlur=0;ctx.globalAlpha=1;
}
function step(now){
const elapsed=Number.isFinite(now)&&last? (now-last)/1000:.016;
let dt=Number.isFinite(elapsed)?Math.max(0,Math.min(elapsed,.045)):.016;
last=Number.isFinite(now)?now:0;time+=dt;force+=(target-force)*Math.min(1,dt*9);if(down)deposit();
for(const c of cells){
 if(time-(c.trailTime||0)>.08){c.trail.push({x:c.x,y:c.y});if(c.trail.length>20)c.trail.shift();c.trailTime=time}
 let nearest=null,best=Infinity,score=-Infinity;
 for(const d of damage){let dist=Math.hypot(c.x-d.x,c.y-d.y),attraction=d.health/(dist*dist+.012);if(attraction>score){score=attraction;best=dist;nearest=d}}
 if(nearest){
  const dx=nearest.x-c.x,dy=nearest.y-c.y;c.a=Math.atan2(dy*h,dx*w);
  let speed=(.045+(c.seed%5)*.004)*(1+.55*Math.sqrt(nearest.health)),travel=Math.min(best,speed*dt);
  c.x+=dx/(best||1)*travel;c.y+=dy/(best||1)*travel;
  if(best<.055){nearest.health-=dt*.10;if(Math.random()<dt*8)particles.push({x:c.x,y:c.y,life:1})}
 }else if(active&&force>.025){
  // Small personal offsets keep recruited cells spread around the deformation.
  const angle=c.seed*2.39996+Math.sin(time*.25+c.seed)*.7,radius=.08+(c.seed%6)*.016;
  const dx=px+Math.cos(angle)*radius-c.x,dy=py+Math.sin(angle)*radius-c.y;
  const dist=Math.hypot(dx,dy);c.a=Math.atan2(dy*h,dx*w);
  const travel=Math.min(dist,(.045+(c.seed%5)*.004)*dt);
  c.x+=dx/(dist||1)*travel;c.y+=dy/(dist||1)*travel;
 }
 // Correlated wandering and short-range repulsion preserve individual movement.
 if(!reduced){
  c.wander=(c.wander??c.seed*2.39996)+(Math.random()-.5)*Math.sqrt(dt)*1.8;
  c.x+=Math.cos(c.wander)*dt*.012;c.y+=Math.sin(c.wander)*dt*.012;
 }
 let rx=0,ry=0;
 for(const other of cells){if(other===c)continue;const dx=c.x-other.x,dy=c.y-other.y,dist=Math.hypot(dx,dy),min=.065;
  if(dist<min){const a=dist<.00001?c.seed*2.39996:Math.atan2(dy,dx);const push=(1-dist/min)*.07;rx+=Math.cos(a)*push;ry+=Math.sin(a)*push}
 }
 c.x=Math.max(.055,Math.min(.945,c.x+rx*dt));c.y=Math.max(.12,Math.min(.82,c.y+ry*dt));
}
for(const d of damage)d.health=Math.max(0,d.health);
let was=damage.length;damage=damage.filter(d=>d.health>.02);
let message=damage.length?(down?'Damage created · cells recruiting':'Cells migrating · repairing tissue'):active&&force>.025?'Cells following deformation':was?'Repaired · tissue restored':null;
if(!message&&status.textContent==='Cells following deformation')message='Tissue at rest';
if(message&&status.textContent!==message)status.textContent=message;
particles.forEach(p=>p.life-=dt*.8);particles=particles.filter(p=>p.life>0);draw();raf=requestAnimationFrame(step);
}
function pos(e){let r=canvas.getBoundingClientRect();if(r.width<=0||r.height<=0||![e.clientX,e.clientY].every(Number.isFinite))return;px=Math.max(.06,Math.min(.94,(e.clientX-r.left)/r.width));py=Math.max(.12,Math.min(.82,(e.clientY-r.top)/r.height));active=true;target=down?1:.55;}
canvas.addEventListener('pointermove',pos);canvas.addEventListener('pointerdown',e=>{down=true;pos(e);canvas.setPointerCapture(e.pointerId);deposit(true);});canvas.addEventListener('pointerup',()=>{down=false;active=false;target=0;});canvas.addEventListener('pointercancel',()=>{down=false;active=false;target=0;});canvas.addEventListener('pointerleave',()=>{if(!down){active=false;target=0;}});
colors();reset();size();new ResizeObserver(size).observe(canvas);raf=requestAnimationFrame(step);
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden){last=0;raf=requestAnimationFrame(step)}});
})();

