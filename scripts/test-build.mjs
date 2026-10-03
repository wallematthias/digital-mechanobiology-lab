import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,cp,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const document=(meta,body='Profile')=>`---\n${JSON.stringify(meta)}\n---\n${body}`;
async function fixture(t){const dir=await mkdtemp(join(tmpdir(),'lab-site-test-'));t.after(()=>rm(dir,{recursive:true,force:true}));for(const name of ['scripts','templates','content'])await cp(new URL(name,root),join(dir,name),{recursive:true});await mkdir(join(dir,'assets'));await cp(new URL('assets/research/',root),join(dir,'assets/research'),{recursive:true});await cp(new URL('assets/brand/',root),join(dir,'assets/brand'),{recursive:true});await writeFile(join(dir,'assets/matthias-walle.png'),'fixture portrait');return dir;}
const build=dir=>spawnSync(process.execPath,['scripts/build.mjs'],{cwd:dir,encoding:'utf8'});
test('student videos deploy only on project detail pages with controls and no autoplay',async t=>{
 const dir=await fixture(t);
 await writeFile(join(dir,'assets/research/student-video.mp4'),'video fixture');
 await writeFile(join(dir,'content/opportunities/video-student.md'),document({title:'Video project',status:'direction',video:'assets/research/student-video.mp4',videoAlt:'Rotating spine model'}));
 const result=build(dir);assert.equal(result.status,0,result.stderr);
 const detail=await readFile(join(dir,'_site/opportunities/video-student.html'),'utf8');
 assert.match(detail,/<video[^>]*controls[^>]*>/);
 assert.match(detail,/src="\.\.\/assets\/research\/student-video.mp4"/);
 assert.ok(!detail.includes('autoplay'));
 assert.ok(!(await readFile(join(dir,'_site/index.html'),'utf8')).includes('student-video.mp4'));
 assert.equal(await readFile(join(dir,'_site/assets/research/student-video.mp4'),'utf8'),'video fixture');
});
test('all published pages resolve their lab logo and icons within the site subpath',async t=>{
 const dir=await fixture(t);
 for(const name of ['dm-mark.svg','favicon.svg','apple-touch-icon.png','social-card.png'])await writeFile(join(dir,'assets/brand',name),'brand fixture');
 assert.equal(build(dir).status,0);
 for(const path of ['index.html','people/members.html','opportunities/01-cancer-imaging.html']){
  const html=await readFile(join(dir,'_site',path),'utf8');
  const prefix=path==='index.html'?'':'../';
  assert.ok(html.includes(`href="${prefix}assets/brand/favicon.svg"`),`${path} favicon`);
  assert.match(html,/<span class="mark"[^>]*>dm<span>·<\/span><\/span>/,`${path} original logo`);
  assert.ok(html.includes(`href="${prefix}assets/brand/apple-touch-icon.png"`),`${path} mobile icon`);
 }
 assert.equal(await readFile(join(dir,'_site/assets/brand/favicon.svg'),'utf8'),'brand fixture');
});
test('student project figures stay off homepage cards and deploy with their detail page',async t=>{
 const dir=await fixture(t);
 await writeFile(join(dir,'assets/research/student-figure.png'),'student figure');
 await writeFile(join(dir,'content/opportunities/illustrated-student.md'),document({title:'Student project',status:'direction',level:'MSc / PhD',image:'assets/research/student-figure.png',imageAlt:'Longitudinal CT workflow'}));
 const result=build(dir);assert.equal(result.status,0,result.stderr);
 assert.ok(!(await readFile(join(dir,'_site/index.html'),'utf8')).includes('assets/research/student-figure.png'));
 assert.match(await readFile(join(dir,'_site/opportunities/illustrated-student.html'),'utf8'),/src="\.\.\/assets\/research\/student-figure.png"/);
 assert.equal(await readFile(join(dir,'_site/assets/research/student-figure.png'),'utf8'),'student figure');
});
test('a new member portrait is included in deployable output',async t=>{const dir=await fixture(t);await writeFile(join(dir,'assets','new-member.jpg'),'fixture image');await writeFile(join(dir,'content/people/new-member.md'),document({title:'New Member',status:'current',role:'Student',image:'assets/new-member.jpg'}));const result=build(dir);assert.equal(result.status,0,result.stderr);assert.equal(await readFile(join(dir,'_site/assets/new-member.jpg'),'utf8'),'fixture image');});
test('unsafe filename slugs are rejected before generating HTML',async t=>{const dir=await fixture(t);await writeFile(join(dir,'content/projects/unsafe"slug.md'),document({title:'Unsafe',summary:'Test'}));assert.notEqual(build(dir).status,0);});
test('a drafted project disappears from root preview and publication output',async t=>{const dir=await fixture(t);const file=join(dir,'content/projects/lifecycle.md');await writeFile(file,document({title:'Lifecycle',status:'published',summary:'Test'}));assert.equal(build(dir).status,0);await access(join(dir,'_site/projects/lifecycle.html'));await writeFile(file,document({title:'Lifecycle',status:'draft',summary:'Test'}));assert.equal(build(dir).status,0);await assert.rejects(access(join(dir,'projects/lifecycle.html')));await assert.rejects(access(join(dir,'_site/projects/lifecycle.html')));assert.ok(!(await readFile(join(dir,'index.html'),'utf8')).includes('Lifecycle'));});
test('categorized members and alumni share one directory, not the homepage',async t=>{
 const dir=await fixture(t);
 for(const [slug,title,category] of [['staff','Research Staff','staff'],['postdoc','New Postdoc','postdocs'],['new','New Student','grad-students'],['visitor','Visiting Student','undergrad-visiting']])await writeFile(join(dir,`content/people/${slug}.md`),document({title,status:'current',category,role:'Researcher',image:'assets/matthias-walle.png'}));
 await writeFile(join(dir,'content/people/former.md'),document({title:'Former Student',status:'alumni',category:'grad-students',role:'Former MSc student'}));
 assert.equal(build(dir).status,0);
 const home=await readFile(join(dir,'index.html'),'utf8');assert.ok(!home.includes('New Student')&&!home.includes('Former Student'));assert.ok(home.includes('people/members.html'));assert.ok(!home.includes('people/alumni.html'));
 const members=await readFile(join(dir,'_site/people/members.html'),'utf8');
 const headings=['Staff','Postdocs','Grad Students','Undergrad / Visiting','Alumni'];
 for(const title of headings)assert.ok(members.includes(`<h2>${title}</h2>`),title);
 for(let i=1;i<headings.length;i++)assert.ok(members.indexOf(`<h2>${headings[i-1]}</h2>`)<members.indexOf(`<h2>${headings[i]}</h2>`));
 assert.match(members,/<section[^>]*id="grad-students"[\s\S]*?<h3>New Student<\/h3>[\s\S]*?<\/section>/);
 assert.match(members,/<section[^>]*id="alumni"[\s\S]*?<h3>Former Student<\/h3>/);
 assert.ok(members.includes('src="../assets/matthias-walle.png"'));
 await writeFile(join(dir,'content/people/new.md'),document({title:'New Student',status:'alumni',category:'grad-students',role:'MSc graduate'}));assert.equal(build(dir).status,0);
 const moved=await readFile(join(dir,'_site/people/members.html'),'utf8');assert.equal((moved.match(/<h3>New Student<\/h3>/g)||[]).length,1);assert.match(moved,/<section[^>]*id="alumni"[\s\S]*?<h3>New Student<\/h3>/);
});
test('empty member categories are hidden',async t=>{const dir=await fixture(t);assert.equal(build(dir).status,0);const page=await readFile(join(dir,'_site/people/members.html'),'utf8');assert.ok(!page.includes('<h2>Staff</h2>'));assert.ok(!page.includes('<h2>Postdocs</h2>'));});
test('project figures render accessibly and are copied to deployment',async t=>{const dir=await fixture(t);await writeFile(join(dir,'assets/research/example.jpg'),'fixture research figure');await writeFile(join(dir,'content/projects/illustrated.md'),document({title:'Illustrated project',summary:'Example',status:'published',theme:'Bone Adaptation & Remodelling',image:'assets/research/example.jpg',imageAlt:'Registered bone changes',imageCredit:'Walle et al., Figure 2 · CC BY 4.0',url:'https://doi.org/example'}));const result=build(dir);assert.equal(result.status,0,result.stderr);const home=await readFile(join(dir,'index.html'),'utf8');assert.ok(!home.includes('Illustrated project'));assert.ok(home.includes('research-grid'));const html=await readFile(join(dir,'_site/research/03-bone-adaptation.html'),'utf8');assert.match(html,/<img[^>]*src="\.\.\/assets\/research\/example.jpg"[^>]*alt="Registered bone changes"/);assert.ok(html.includes('Walle et al., Figure 2 · CC BY 4.0'));assert.equal(await readFile(join(dir,'_site/assets/research/example.jpg'),'utf8'),'fixture research figure');const page=await readFile(join(dir,'_site/projects/illustrated.html'),'utf8');assert.ok(page.includes('src="../assets/research/example.jpg"'));});
test('project image paths cannot escape the asset directory',async t=>{const dir=await fixture(t);await writeFile(join(dir,'secret.jpg'),'private');await writeFile(join(dir,'content/projects/unsafe-image.md'),document({title:'Unsafe image',summary:'Example',image:'assets/../secret.jpg'}));const result=build(dir);assert.notEqual(result.status,0);assert.match(result.stderr,/Invalid local image path/);});
test('publications render newest year first regardless of editorial order',async t=>{const dir=await fixture(t);await writeFile(join(dir,'content/publications/older.md'),document({title:'Older publication',year:2020,order:0,journal:'Journal',url:'https://doi.org/older'}));await writeFile(join(dir,'content/publications/newer.md'),document({title:'Newest publication',year:2027,order:100,journal:'Journal',url:'https://doi.org/newer'}));const result=build(dir);assert.equal(result.status,0,result.stderr);const html=await readFile(join(dir,'index.html'),'utf8');assert.ok(html.indexOf('Newest publication')<html.indexOf('Older publication'));assert.match(html,/<details class="publication-archive">[\s\S]*Older publication/);});
