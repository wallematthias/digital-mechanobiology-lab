(()=>{
  const root=document.getElementById('mech-field'),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
  const image=new Image(),mw=384,mh=256,mask=new Uint8Array(mw*mh),nodes=[];
  const stencil=document.createElement('canvas'),paint=document.createElement('canvas'),strain=document.createElement('canvas');
  stencil.width=strain.width=mw;stencil.height=strain.height=mh;
  paint.width=mw*4;paint.height=mh*4;
  const sc=stencil.getContext('2d'),pc=paint.getContext('2d'),fc=strain.getContext('2d');
  pc.setTransform(4,0,0,4,0,0);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w=1,h=1,rect={x:0,y:0,w:1,h:1},ready=false,cells=[],sites=[],hover=null,engaged=false,nextIdle=1.2,down=false,last=0,t=0,depositTime=-1,raf=0;
  const paths=globalThis.BonePaths;let mesh=[],outline=[],load=null,loadStrength=0,impulses=[],routes=null;
  function xy(i){return {x:i%mw+.5,y:Math.floor(i/mw)+.5}}
  function jet(v){v=Math.max(0,Math.min(1,v));return [3,2,1].map(n=>Math.round(255*Math.max(0,Math.min(1,1.5-Math.abs(4*v-n)))))}
  function fit(){w=Math.max(1,canvas.clientWidth);h=Math.max(1,canvas.clientHeight);const d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);const scale=Math.min(w/image.width,h/image.height)*.98;rect={w:image.width*scale,h:image.height*scale,x:(w-image.width*scale)/2,y:(h-image.height*scale)/2};draw()}
  function build(){
    sc.drawImage(image,0,0,mw,mh);const pixels=sc.getImageData(0,0,mw,mh);
    // Select the bright front plates, not the recessed gray walls or transparent surround.
    mask.set(paths.surfaceMask(pixels.data));
    // Keep only the main connected travel network after bridging tiny texture gaps.
    routes=paths.connectedSurface(paths.routingMask(mask,mw,mh),mw,mh);
    for(let i=0;i<mask.length;i++)if(!routes[i])mask[i]=0;
    const outlineMask=mask.slice(),voidMask=Uint8Array.from(mask,v=>1-v),voidSeen=new Uint8Array(mask.length);
    for(let i=0;i<voidMask.length;i++)if(voidMask[i]&&!voidSeen[i]){
      const gap=[i];voidSeen[i]=1;
      for(let j=0;j<gap.length;j++)for(const n of paths.neighbours(voidMask,mw,mh,gap[j]))if(!voidSeen[n]){voidSeen[n]=1;gap.push(n)}
      if(gap.length<35)for(const n of gap)outlineMask[n]=1;
    }
    outline=paths.contours(paths.boundaryEdges(outlineMask,mw,mh));
    for(let i=0;i<mask.length;i++)if(mask[i])nodes.push(i);
    // Clip the lattice at drawing time: rejecting whole edges left bare patches
    // wherever the scan texture interrupted an otherwise continuous plate.
    mesh=paths.meshEdges(new Uint8Array(mask.length).fill(1),mw,mh,5,'quad');
    const alpha=sc.createImageData(mw,mh);
    for(const i of nodes){alpha.data[i*4]=255;alpha.data[i*4+1]=255;alpha.data[i*4+2]=255;alpha.data[i*4+3]=255}
    sc.putImageData(alpha,0,0);
    cells=[];
    if(nodes.length)for(let j=0;j<16;j++){
      let i=nodes[Math.floor(Math.random()*nodes.length)];
      for(let attempt=0;attempt<80;attempt++){const p=xy(i);if(cells.every(c=>{const q=xy(c.i);return Math.hypot(p.x-q.x,p.y-q.y)>22}))break;i=nodes[Math.floor(Math.random()*nodes.length)]}
      const angle=Math.random()*6.28;
      cells.push({i,next:i,home:{field:paths.distances(routes,mw,mh,i)},phase:0,angle,heading:angle,turnAt:2+Math.random()*3,seed:j,r:3.5+Math.random()*.8});
    }
    ready=nodes.length>0;fit();raf=requestAnimationFrame(step);
  }
  function locate(e){const b=canvas.getBoundingClientRect();const x=(e.clientX-b.left-rect.x)/rect.w*mw,y=(e.clientY-b.top-rect.y)/rect.h*mh;const i=paths.nearest(nodes,mw,x,y);return i>=0?{i,x,y,field:paths.distances(routes,mw,mh,i)}:null}
  function deposit(){if(!hover)return;const close=sites.find(s=>!s.auto&&hover.field[s.i]>=0&&hover.field[s.i]<12);if(close)close.health=Math.min(8,close.health+.8);else if(sites.length<12)sites.push({i:hover.i,...xy(hover.i),field:hover.field,health:1});impulses.push({x:hover.x,y:hover.y,start:t,damage:close?close.health:1});depositTime=t}
  function draw(){
    ctx.clearRect(0,0,w,h);if(!ready)return;
    const warp=p=>{if(reduced)return p;const out=paths.displace(p,load,loadStrength);for(const impulse of impulses){const q=paths.displace(p,impulse,paths.clickStrength(t-impulse.start,impulse.damage));out.x+=q.x-p.x;out.y+=q.y-p.y}return out};
    ctx.drawImage(image,rect.x,rect.y,rect.w,rect.h);
    const pixels=fc.createImageData(mw,mh);
    for(const i of nodes){let value=0,alpha=0;
      if(load&&loadStrength>.01){const p=xy(i),d=Math.hypot(p.x-load.x,p.y-load.y);if(d<34){value=.9*Math.exp(-d*d/170);alpha=.58*loadStrength*Math.exp(-d*d/240)}}
      for(const s of sites){const d=s.field[i];if(d>=0&&d<40){const q=Math.exp(-d*d/(90+s.health*12));if(q*s.health*.3>alpha){value=Math.min(1,.65+s.health*.045)*q;alpha=Math.min(.8,.3+s.health*.12)*q}}}
      if(alpha>.015){const k=i*4,c=jet(value);pixels.data[k]=c[0];pixels.data[k+1]=c[1];pixels.data[k+2]=c[2];pixels.data[k+3]=alpha*255}
    }
    fc.putImageData(pixels,0,0);pc.clearRect(0,0,mw,mh);pc.drawImage(strain,0,0,mw,mh);
    // These are live vertex positions, not mesh lines baked into the image.
    pc.lineWidth=.35;pc.strokeStyle='rgba(39,51,59,.62)';pc.beginPath();
    for(const [a,b] of mesh){const da=warp(a),db=warp(b);pc.moveTo(da.x,da.y);pc.lineTo(db.x,db.y)}pc.stroke();
    pc.lineWidth=.45;pc.strokeStyle='rgba(255,243,202,.85)';pc.beginPath();
    for(const [a,b] of mesh){const x=(a.x+b.x)/2,y=(a.y+b.y)/2;const active=load&&loadStrength>.05&&Math.hypot(x-load.x,y-load.y)<29||sites.some(s=>s.health>.2&&Math.hypot(x-s.x,y-s.y)<15);if(active){const da=warp(a),db=warp(b);pc.moveTo(da.x,da.y);pc.lineTo(db.x,db.y)}}pc.stroke();
    // Damage persists in orange/red, independently of the transient hover colour.
    for(const s of sites){if(s.auto)continue;const radius=3+Math.sqrt(s.health)*2;const g=pc.createRadialGradient(s.x,s.y,0,s.x,s.y,radius);g.addColorStop(0,'rgba(224,66,24,.8)');g.addColorStop(.45,'rgba(239,122,27,.5)');g.addColorStop(1,'rgba(239,122,27,0)');pc.fillStyle=g;pc.fillRect(s.x-radius,s.y-radius,radius*2,radius*2)}
    for(const c of cells){const a=xy(c.i),b=xy(c.next),x=a.x+(b.x-a.x)*c.phase,y=a.y+(b.y-a.y)*c.phase;
      const displaced=warp({x,y});
      pc.save();pc.translate(displaced.x,displaced.y);pc.rotate(c.angle);const r=c.r;
      const g=pc.createRadialGradient(-r*.25,-r*.25,.1,0,0,r*1.4);g.addColorStop(0,'rgba(252,202,144,.95)');g.addColorStop(1,'rgba(174,26,49,.65)');pc.fillStyle=g;
      pc.beginPath();pc.roundRect(-r*1.15,-r,r*2.3,r*2,r*.65);pc.fill();pc.strokeStyle='rgba(117,23,42,.65)';pc.lineWidth=.35;pc.stroke();
      pc.fillStyle='#771b39';pc.beginPath();pc.ellipse(-r*.12,0,r*.43,r*.38,0,0,Math.PI*2);pc.fill();pc.restore();
    }
    pc.globalCompositeOperation='destination-in';pc.drawImage(stencil,0,0,mw,mh);pc.globalCompositeOperation='source-over';
    // Follow the actual clipping boundary, so the grid ends at a defined rim.
    pc.lineWidth=.35;pc.strokeStyle='rgba(39,51,59,.62)';pc.lineCap='round';pc.lineJoin='round';pc.beginPath();
    for(const loop of outline){pc.moveTo(loop[0].x,loop[0].y);for(const p of loop.slice(1))pc.lineTo(p.x,p.y);pc.closePath()}pc.stroke();
    ctx.imageSmoothingEnabled=true;ctx.drawImage(paint,rect.x,rect.y,rect.w,rect.h);
  }
  function step(now){const dt=Math.min(.04,last?(now-last)/1000:.016);last=now;t+=dt;
    const response=1-Math.exp(-dt*9);
    if(hover){if(!load)load={x:hover.x,y:hover.y};load.x+=(hover.x-load.x)*response;load.y+=(hover.y-load.y)*response}
    loadStrength+=((hover?1:0)-loadStrength)*response;
    impulses=impulses.filter(impulse=>t-impulse.start<1.6);
    if(ready&&paths.idleDue(t,nextIdle,engaged,sites.filter(s=>s.auto).length,reduced)){
      const visible=nodes.filter(i=>{const p=xy(i),x=rect.x+p.x/mw*rect.w,y=rect.y+p.y/mh*rect.h;return x>30&&x<w-30&&y>30&&y<h-30});
      if(visible.length){const i=visible[Math.floor(Math.random()*visible.length)];sites.push({i,...xy(i),field:paths.distances(routes,mw,mh,i),health:1.8,auto:true})}
      nextIdle=t+4+Math.random()*3;
    }
    for(const s of sites)if(s.auto)s.health=Math.max(0,s.health-dt*(engaged?.55:.24));
    if(down&&hover&&t-depositTime>.35)deposit();
    const damage=sites.filter(s=>!s.auto&&cells.some(c=>s.field[c.i]>=0)).sort((a,b)=>b.health-a.health)[0];
    const signal=damage||hover||sites.find(s=>s.auto);
    for(const c of cells){if(c.repair&&!paths.repairTarget(c.repair,sites,null)){c.repair=null;c.recovering=true}if(c.recovering&&c.home.field[c.i]<=28)c.recovering=false}
    const recruitment=paths.recruitment(damage?damage.health:1);
    const locked=cells.map((c,i)=>paths.repairTarget(c.repair,sites,null)?i:-1).filter(i=>i>=0);
    const recruits=new Set(locked);
    if(signal)for(const i of paths.responders(cells.map((c,i)=>recruits.has(i)||c.recovering?-1:signal.field[c.i]),recruitment.count,recruitment.radius))if(recruits.size<recruitment.count)recruits.add(i);
    if(!reduced)for(const [index,c] of cells.entries()){
      c.repair=paths.repairTarget(c.repair,sites,recruits.has(index)&&signal&&signal.health&&!signal.auto?signal:null);
      let target=c.repair||(recruits.has(index)?signal:null);
      c.returning=paths.returnHome(c.home.field[c.i],c.returning);
      if(c.recovering||!target&&c.returning)target=c.home;
      if(t>=c.turnAt){c.heading+=(Math.random()-.5)*2.2;c.turnAt=t+2+Math.random()*3}
      const distance=target?target.field[c.i]:-1;
      const repairing=target&&target.health&&paths.repairRate(distance)>0;
      const settled=target&&target!==c.home&&distance>=0&&distance<=(repairing?10:5);
      c.phase+=dt*(settled?0:target&&target!==c.home?Math.min(38,12+Math.max(0,distance)*.6):22);
      while(c.phase>=1){const previous=c.i;c.i=c.next;c.phase-=1;const ns=paths.neighbours(routes,mw,mh,c.i);if(!ns.length){c.next=c.i;c.phase=0;break}
        const current=target?target.field[c.i]:-1;
        const toward=target&&current>5?ns.filter(n=>target.field[n]>=0&&target.field[n]<current):[];
        c.next=paths.chooseStep(ns,toward,previous,Math.random(),{i:c.i,w:mw,dx:Math.cos(c.heading),dy:Math.sin(c.heading),bias:target&&target!==c.home?.92:.8});const a=xy(c.i),b=xy(c.next);c.targetAngle=Math.atan2(b.y-a.y,b.x-a.x);
      }
      c.angle=paths.easeAngle(c.angle,c.targetAngle??c.angle,dt);
      if(repairing)target.health=Math.max(0,target.health-dt*paths.repairRate(distance));
    }
    sites=sites.filter(s=>s.health>.02);draw();raf=requestAnimationFrame(step);
  }
  function pointer(e){if(!ready)return;engaged=true;const p=locate(e);if(!hover||Math.hypot(p.x-hover.x,p.y-hover.y)>1)hover=p}
  canvas.addEventListener('pointerenter',pointer);
  canvas.addEventListener('pointermove',pointer);
  canvas.addEventListener('pointerdown',e=>{if(!ready)return;engaged=true;hover=locate(e);if(!hover)return;down=true;canvas.setPointerCapture(e.pointerId);deposit()});
  for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>{down=false});
  canvas.addEventListener('pointerleave',()=>{engaged=false;nextIdle=t+3;if(!down)hover=null});
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden&&ready){last=0;raf=requestAnimationFrame(step)}});
  new ResizeObserver(()=>{if(ready)fit()}).observe(canvas);
  image.onload=build;image.onerror=()=>{root.dataset.error='Bone image could not load'};
  image.src='assets/trabecular-synthetic-slab-v1.png';
})();
