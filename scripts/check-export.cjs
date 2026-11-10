const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../out');
const files=[];
function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else if(f.name.endsWith('.html'))files.push(p);}}
walk(root);
let links=0;
const banned=['A good day to learn something','That’s how a language stays','A new way to','A little clarity','YOUR ROMANIAN JOURNEY','Your learning path','MADE FOR THE LONG'];
for(const f of files){const html=fs.readFileSync(f,'utf8');for(const phrase of banned)assert.ok(!html.includes(phrase),`${f}: obsolete copy ${phrase}`);for(const m of html.matchAll(/href="(\/[^"#?]*)(?:#[^"]*)?"/g)){const href=decodeURIComponent(m[1]);if(href.startsWith('//'))continue;const p=path.join(root,href);assert.ok(fs.existsSync(p)||fs.existsSync(p+'.html')||fs.existsSync(path.join(p,'index.html')),`${f}: broken internal link ${href}`);links++;}}
for(const route of ['/','/vocabulary','/grammar','/readings',...Array.from({length:9},(_,i)=>`/chapters/${i+1}`)])assert.ok(fs.existsSync(path.join(root,route==='/'?'index.html':route+'.html')));
assert.equal(files.filter(f=>path.relative(root,f).startsWith('lessons/')).length,54);
assert.equal(files.filter(f=>path.relative(root,f).startsWith('grammar/')).length,54);
assert.equal(files.filter(f=>path.relative(root,f).startsWith('readings/')).length,54);
for(const section of ['lessons','grammar','readings'])assert.equal(files.filter(f=>path.relative(root,f).startsWith(`italian/${section}/`)).length,60);
for(const route of ['/italian','/italian/ap','/italian/vocabulary','/italian/grammar','/italian/readings',...Array.from({length:10},(_,i)=>`/italian/chapters/${i+1}`)])assert.ok(fs.existsSync(path.join(root,route+'.html')));
for(const f of files.filter(f=>path.relative(root,f).startsWith('italian/'))) {const html=fs.readFileSync(f,'utf8');assert.ok(!/href="\/(?:lessons|chapters|grammar|readings|vocabulary)(?:\/|")/.test(html),`${f}: Italian navigation escaped into Romanian`);}
console.log(`Checked ${files.length} exported pages and ${links} internal links; all lesson, chapter, reading, and grammar routes resolve.`);
