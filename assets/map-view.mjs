const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function constrain(view){return {...view,x:clamp(view.x,0,900-view.width),y:clamp(view.y,0,470-view.height)};}
export function zoomView(view,factor,anchor={x:view.x+view.width/2,y:view.y+view.height/2}){
 const width=clamp(view.width/factor,900/8,900),ratio=width/view.width;
 return constrain({x:anchor.x-(anchor.x-view.x)*ratio,y:anchor.y-(anchor.y-view.y)*ratio,width,height:width*470/900});
}
export function panView(view,dx,dy){return constrain({...view,x:view.x+dx,y:view.y+dy});}
