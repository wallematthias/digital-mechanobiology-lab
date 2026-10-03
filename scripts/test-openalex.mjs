import test from 'node:test';
import assert from 'node:assert/strict';
import {authorWorks,orcid} from './openalex.mjs';
test('checks identity and reads every page',async()=>{
 const responses=[{orcid},{results:[{id:'one'}],meta:{next_cursor:'next'}},{results:[{id:'two'}],meta:{next_cursor:null}}];
 assert.deepEqual(await authorWorks(async()=>responses.shift()),[{id:'one'},{id:'two'}]);
});
test('rejects wrong identity, broken pagination and empty responses',async()=>{
 await assert.rejects(authorWorks(async()=>({orcid:'wrong'})),/identity/);
 let n=0;await assert.rejects(authorWorks(async()=>n++?{results:[{}],meta:{next_cursor:'*'}}:{orcid}),/Repeated/);
 n=0;await assert.rejects(authorWorks(async()=>n++?{results:[]}:{orcid}),/Empty/);
});
