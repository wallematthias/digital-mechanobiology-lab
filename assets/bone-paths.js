(function(scope){
  function neighbours(mask,w,h,i){
    const x=i%w,y=Math.floor(i/w),out=[];
    if(x&&mask[i-1])out.push(i-1);
    if(x<w-1&&mask[i+1])out.push(i+1);
    if(y&&mask[i-w])out.push(i-w);
    if(y<h-1&&mask[i+w])out.push(i+w);
    return out;
  }
  function distances(mask,w,h,start){
    const d=new Int32Array(mask.length).fill(-1),q=new Int32Array(mask.length);
    if(start<0||!mask[start])return d;
    let a=0,b=1;q[0]=start;d[start]=0;
    while(a<b){const i=q[a++];for(const n of neighbours(mask,w,h,i))if(d[n]<0){d[n]=d[i]+1;q[b++]=n}}
    return d;
  }
  function nearest(nodes,w,x,y){let best=-1,d=Infinity;for(const i of nodes){const q=(i%w+.5-x)**2+(Math.floor(i/w)+.5-y)**2;if(q<d){d=q;best=i}}return best}
  function frontFace(u,v){return v>.145&&v<.95&&u>.045+.29*Math.pow(v,1.7)&&u<.98-.16*Math.pow(v,1.8)}
  function idleDue(t,next,engaged,count,reduced){return !engaged&&!reduced&&count===0&&t>=next}
  function routingMask(mask,w,h){return thicken(mask,w,h,1,new Uint8Array(mask.length).fill(1))}
  function senses(distance,radius=36){return distance>=0&&distance<=radius}
  function recruitment(damage){const extra=Math.max(0,Math.min(7,damage-1));return {count:Math.min(12,4+Math.ceil(extra*1.2)),radius:85+extra*32}}
  function responders(distances,count=4,radius=Infinity){return distances.map((d,i)=>({d,i})).filter(p=>p.d>=0&&p.d<=radius).sort((a,b)=>a.d-b.d).slice(0,count).map(p=>p.i)}
  function repairRate(distance){return distance>=0&&distance<=12?.3*(1-distance/24):0}
  function returnHome(distance,returning){return distance>(returning?28:80)}
  function connectedSurface(mask,w,h){
    const seen=new Uint8Array(mask.length);let largest=[];
    for(let i=0;i<mask.length;i++)if(mask[i]&&!seen[i]){const component=[i];seen[i]=1;for(let j=0;j<component.length;j++)for(const n of neighbours(mask,w,h,component[j]))if(!seen[n]){seen[n]=1;component.push(n)}if(component.length>largest.length)largest=component}
    const out=new Uint8Array(mask.length);for(const i of largest)out[i]=1;return out;
  }
  function repairTarget(current,sites,candidate){return current&&current.health>.02&&sites.includes(current)?current:candidate}
  function smoothLoop(points){
    let out=points;
    for(let pass=0;pass<3;pass++){const next=[];for(let i=0;i<out.length;i++){const a=out[i],b=out[(i+1)%out.length];next.push({x:.75*a.x+.25*b.x,y:.75*a.y+.25*b.y},{x:.25*a.x+.75*b.x,y:.25*a.y+.75*b.y})}out=next}return out;
  }
  function contours(edges){
    const key=p=>`${p.x},${p.y}`,adj=new Map(),used=new Set(),loops=[];
    edges.forEach(([a,b],i)=>{for(const p of [a,b]){const k=key(p);if(!adj.has(k))adj.set(k,[]);adj.get(k).push(i)}});
    edges.forEach(([start],id)=>{if(used.has(id))return;const loop=[start];let p=start,next=id;
      while(next!==undefined&&!used.has(next)){used.add(next);const [a,b]=edges[next];p=key(a)===key(p)?b:a;if(key(p)===key(start))break;loop.push(p);next=(adj.get(key(p))||[]).find(i=>!used.has(i))}
      if(loop.length>=12)loops.push(smoothLoop(loop.filter((_,i)=>i%4===0)));
    });return loops;
  }
  function boundaryEdges(mask,w,h){
    const edges=[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){
      if(!y||!mask[(y-1)*w+x])edges.push([{x,y},{x:x+1,y}]);
      if(y===h-1||!mask[(y+1)*w+x])edges.push([{x,y:y+1},{x:x+1,y:y+1}]);
      if(!x||!mask[y*w+x-1])edges.push([{x,y},{x,y:y+1}]);
      if(x===w-1||!mask[y*w+x+1])edges.push([{x:x+1,y},{x:x+1,y:y+1}]);
    }return edges;
  }
  function easeAngle(angle,target,dt){const delta=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));return angle+delta*(1-Math.exp(-dt*6))}
  function chooseStep(ns,toward,previous,random,motion){
    const forward=ns.filter(n=>n!==previous),wander=forward.length?forward:ns;
    const bias=motion?motion.bias:.52;
    if(motion&&!toward.length&&random<.85){
      const score=n=>((n%motion.w)-(motion.i%motion.w))*motion.dx+(Math.floor(n/motion.w)-Math.floor(motion.i/motion.w))*motion.dy;
      return wander.reduce((best,n)=>score(n)>score(best)?n:best,wander[0]);
    }
    const guided=toward.length&&random<bias;
    const options=guided?toward:wander;
    const fraction=guided?random/bias:toward.length?(random-bias)/(1-bias):random;
    return options[Math.min(options.length-1,Math.max(0,Math.floor(fraction*options.length)))];
  }
  function thicken(mask,w,h,radius,allowed){
    const out=mask.slice();
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(out[i]||!allowed[i])continue;
      for(let dy=-Math.ceil(radius);dy<=radius;dy++)for(let dx=-Math.ceil(radius);dx<=radius;dx++)if(dx*dx+dy*dy<=radius*radius&&x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&mask[(y+dy)*w+x+dx])out[i]=1;
    }return out;
  }
  function meshEdges(mask,w,h,spacing,type='triangle'){
    const edges=[],rows=[];
    for(let y=1,row=0;y<h-1;y+=spacing,row++){
      const points=[];for(let x=1+(type==='quad'?0:(row%2)*spacing*.5),col=0;x<w-1;x+=spacing,col++)points.push(type==='quad'?{x,y}:{x:x+.22*Math.sin(row*19+col*7),y:y+.22*Math.cos(row*11+col*13)});rows.push(points);
    }
    function edge(a,b){if(!a||!b)return;const count=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)*2);for(let j=0;j<=count;j++){const f=j/count,x=Math.floor(a.x+(b.x-a.x)*f),y=Math.floor(a.y+(b.y-a.y)*f);if(x<0||x>=w||y<0||y>=h||!mask[y*w+x])return}edges.push([a,b])}
    rows.forEach((row,j)=>row.forEach((p,k)=>{edge(p,row[k+1]);if(j){edge(p,rows[j-1][k]);if(type!=='quad')edge(p,rows[j-1][k+(j%2?1:-1)])}}));
    return edges;
  }
  function surfaceMask(pixels){const out=new Uint8Array(pixels.length/4);for(let i=0;i<out.length;i++){const k=i*4,lum=.2126*pixels[k]+.7152*pixels[k+1]+.0722*pixels[k+2];out[i]=pixels[k+3]>240&&lum>132?1:0}return out}
  function repairVisual(distance,health,time,seed,reduced){
    if(!(health>.02)||!repairRate(distance))return null;
    if(reduced)return {particles:[]};
    return {particles:Array.from({length:8},(_,j)=>{
      const progress=((time/1.7+seed*.137+j/8)%1+1)%1,angle=seed*2.4+j*2.399;
      const radius=1.35+progress*1.1;
      return {x:Math.cos(angle)*radius,y:Math.sin(angle)*radius,alpha:Math.sin(progress*Math.PI),radius:1.25+.35*(1-progress)};
    })};
  }
  function clickStrength(age,damage){return age>=1.6?0:(1.65+Math.min(8,damage)*.18)*Math.exp(-age*3)*Math.cos(age*5)}
  function displace(p,load,strength){
    if(!load||!strength)return {x:p.x,y:p.y};
    const dx=p.x-load.x,dy=p.y-load.y,q=Math.exp(-(dx*dx+dy*dy)/(2*23*23))*strength;
    return {x:p.x+q*(-.2*dx+.065*dy),y:p.y+q*(-.16*dy+.075*dx+2)};
  }
  const api={neighbours,distances,nearest,frontFace,idleDue,thicken,meshEdges,surfaceMask,displace,clickStrength,routingMask,chooseStep,senses,responders,repairRate,repairVisual,easeAngle,returnHome,boundaryEdges,repairTarget,smoothLoop,contours,connectedSurface,recruitment};
  if(typeof module!=='undefined')module.exports=api;else scope.BonePaths=api;
})(globalThis);
