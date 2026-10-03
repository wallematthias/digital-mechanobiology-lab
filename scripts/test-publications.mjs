import test from 'node:test';
import assert from 'node:assert/strict';
import {planImports} from './publications.mjs';
const work={id:'https://openalex.org/W123',title:'New paper',type:'article',doi:'https://doi.org/10.123/new',publication_year:2026,publication_date:'2026-01-01',primary_location:{source:{type:'journal',display_name:'Bone'}},authorships:[{author:{display_name:'Matthias Walle'}}]};
test('imports published works and leaves curated records untouched',()=>{
 const existing=[{title:'Different title',url:'https://doi.org/10.123/NEW'}];
 const before=JSON.stringify(existing);
 assert.deepEqual(planImports([work],existing),[]);
 assert.equal(JSON.stringify(existing),before);
 const additions=planImports([work,work],[]);
 assert.equal(additions.length,1);
 assert.equal(additions[0].filename,'openalex-W123.md');
 assert.match(additions[0].text,/Matthias Walle/);
});
test('skips preprints, repository copies, exclusions and title duplicates',()=>{
 assert.deepEqual(planImports([{...work,type:'preprint'},{...work,primary_location:{source:{type:'repository'}}}],[]),[]);
 assert.deepEqual(planImports([work],[{title:'NEW PAPER!'}]),[]);
 assert.deepEqual(planImports([work],[],{excludeWorks:[work.id]}),[]);
});
test('repeated import is a no-op; malformed identifiers are refused',()=>{
 const first=planImports([work],[]);
 const metadata=JSON.parse(first[0].text.split('---')[1]);
 assert.deepEqual(planImports([work],[metadata]),[]);
 assert.throws(()=>planImports([{...work,id:'../../bad'}],[]));
});
