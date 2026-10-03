import {test} from 'node:test';
import assert from 'node:assert/strict';
const path = new URL('./content.mjs', import.meta.url);
test('content engine is available', async () => { assert.equal((await import(path).catch(()=>({}))).parseContent instanceof Function, true); });
test('metadata and body survive parsing', async () => { const {parseContent}=await import(path); assert.deepEqual(parseContent('---\n{"title":"A","status":"draft"}\n---\nHello'),{title:'A',status:'draft',body:'Hello'}); });
test('HTML is escaped and unsafe link schemes do not become links',async()=>{const {renderMarkdown}=await import(path);const html=renderMarkdown('<script>bad</script> [bad](javascript:alert) **Python**');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('href="javascript:'));assert.ok(html.includes('<strong>Python</strong>'));});
test('drafts are excluded and alumni are moved instead of duplicated',async()=>{const {published,peopleGroups}=await import(path);const a={title:'A',status:'current'},b={title:'B',status:'alumni'},c={title:'C',status:'draft'};assert.deepEqual(published([a,b,c]),[a,b]);assert.deepEqual(peopleGroups([a,b,c]),{current:[a],alumni:[b]});});
test('link query parameters are escaped exactly once',async()=>{const {renderMarkdown}=await import(path);assert.equal(renderMarkdown('[Search](https://example.org/?a=1&b=2)'),'<p><a href="https://example.org/?a=1&amp;b=2">Search</a></p>');});
