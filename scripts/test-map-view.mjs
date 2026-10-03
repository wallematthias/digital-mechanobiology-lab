import test from 'node:test';
import assert from 'node:assert/strict';
const moduleURL=new URL('../assets/map-view.mjs',import.meta.url);
test('map view helpers are available',async()=>{
 const mod=await import(moduleURL).catch(()=>({}));
 assert.equal(typeof mod.zoomView,'function');
});
test('zoom anchors the cursor and preserves aspect ratio',async()=>{
 const {zoomView}=await import(moduleURL);
 const view=zoomView({x:0,y:0,width:900,height:470},2,{x:300,y:200});
 assert.deepEqual(view,{x:150,y:100,width:450,height:235});
});
test('panning and zoom stay inside the world and respect scale limits',async()=>{
 const {zoomView,panView}=await import(moduleURL);
 const original={x:0,y:0,width:900,height:470};
 assert.deepEqual(zoomView(original,.5,{x:0,y:0}),original);
 const close=zoomView(original,100,{x:450,y:235});
 assert.equal(close.width,112.5);
 const moved=panView(close,9999,-9999);
 assert.equal(moved.x,900-moved.width);
 assert.equal(moved.y,0);
});
