const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=(m,f)=>{const result=ts.transpileModule(fs.readFileSync(f,'utf8'),{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});assert.equal(result.diagnostics.length,0,`Syntax diagnostics: ${f}`);m._compile(result.outputText,f)};
const {italianLessons:lessons,italianUnits:units,italianExamples:examples}=require('../app/italian/curriculum.ts');
const {italianStops:stops}=require('../app/italian/story.ts');
const {getVocabulary}=require('../app/progress.ts');
const {courses}=require('../app/courses.ts');
const {apThemes,qaPrompts}=require('../app/italian/ap-data.ts');
const {localDay,previousDay,addActivity,activityStats}=require('../app/rewards.ts');
assert.equal(lessons.length,60);assert.equal(units.length,10);assert.equal(stops.length,10);
assert.equal(new Set(lessons.map(l=>l.slug)).size,60);
assert.equal(lessons[0].tables[0].rows.length,21);
assert.ok(lessons[0].tables[0].headers.some(h=>h.includes('English equivalent')));
let tableCount=0;
for(const [i,l]of lessons.entries()){
 assert.equal(l.id,`it-${i+1}`);assert.equal(l.unit,Math.floor(i/6));
 assert.match(l.slug,/^[0-9]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/);
 assert.equal(l.rule.split('\n\n').length,2);
 assert.ok(l.rule.length>500,`${l.id}: detailed instruction`);
 assert.ok(l.reading.length>20&&l.english.length>20);
 assert.equal(l.questions.length,3);
 assert.equal(l.words.length,4);
 for(const w of l.words)assert.equal(w.length,2);
 for(const q of l.questions){assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert.ok(q.answer>=0&&q.answer<3);assert.ok(q.explanation.length>10)}
 assert.equal(examples[i+1].length,2);
 for(const example of examples[i+1])assert.equal(example.length,3,`${l.id}: complete worked example`);
 assert.ok(l.tables.length>0);
 for(const t of l.tables){tableCount++;assert.ok(t.rows.length);for(const r of t.rows)assert.equal(r.length,t.headers.length,`${l.id}: ${t.caption}`);if(t.headers[0]==='Subject'&&t.rows[0][0]==='io')assert.equal(t.rows.length,6)}
}
for(let i=0;i<10;i++){assert.equal(lessons.filter(l=>l.unit===i).length,6);assert.ok(stops[i].culture.url.startsWith('https://'));assert.ok(stops[i].culture.text.length>200)}
assert.equal(apThemes.length,6);assert.equal(qaPrompts.length,4);
for(const [i,theme]of apThemes.entries()){assert.equal(theme.title,units[i+4].title);assert.equal(theme.chapter,i+5);assert.ok(theme.source.url.startsWith('https://'));assert.ok(theme.task.length>100&&theme.comparison.length>100)}
assert.deepEqual(getVocabulary([],lessons),[]);
for(let n=1;n<=60;n++){const ids=lessons.slice(0,n).map(l=>l.id),v=getVocabulary(ids,lessons);assert.equal(v.length,new Set(lessons.slice(0,n).flatMap(l=>l.words.map(w=>w[0]))).size);assert.ok(v.every(w=>w.lessons.every(l=>ids.includes(l.id))))}
assert.deepEqual(getVocabulary(courses.ro.lessons.map(l=>l.id),lessons),[]);
assert.deepEqual(getVocabulary(lessons.map(l=>l.id),courses.ro.lessons),[]);
const avg=ls=>ls.reduce((n,l)=>n+l.reading.split(/\s+/).length,0)/ls.length;
assert.ok(avg(lessons.slice(54))>avg(lessons.slice(24,30)));assert.ok(avg(lessons.slice(24,30))>avg(lessons.slice(0,6)));
assert.equal(previousDay('2027-01-01'),'2026-12-31');assert.equal(previousDay('2024-03-01'),'2024-02-29');assert.equal(previousDay('2026-03-01'),'2026-02-28');assert.equal(localDay(new Date(2026,10,10,0,1)),'2026-11-10');
const a={id:'a',kind:'exercise',day:'2026-11-10',xp:5};const b={id:'b',kind:'vocabulary',day:'2026-11-09',xp:2};
let events=addActivity([],a);events=addActivity(events,a);assert.equal(events.length,1);events=addActivity(events,b);
assert.deepEqual(activityStats(events,'2026-11-10'),{xp:7,streak:2,today:1,level:1,levelProgress:7});
assert.equal(activityStats(events,'2026-11-11').streak,2);assert.equal(activityStats(events,'2026-11-12').streak,0);
assert.equal(activityStats([...events,{id:'lesson',kind:'lesson',day:'2026-11-10',xp:30}],'2026-11-10').today,1);
assert.equal(activityStats([{id:'m',kind:'lesson',day:'',xp:500}],'2026-11-10').level,3);
console.log(`Italian: ${lessons.length} lessons, ${tableCount} tables, 120 annotated examples, 180 question structures, ${getVocabulary(lessons.map(l=>l.id),lessons).length} vocabulary entries; AP theme mapping and cross-language isolation pass. XP deduplication, daily goals, date boundaries, and streak continuity pass.`);
