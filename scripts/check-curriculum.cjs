const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
require.extensions['.ts']=function(module,filename) { const source=fs.readFileSync(filename,'utf8'); module._compile(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,filename); };
const {lessons,units}=require('../app/curriculum.ts');
const {examples}=require('../app/examples.ts');
const {stops,earlyStory}=require('../app/story.ts');
const {getVocabulary}=require('../app/progress.ts');
assert.equal(lessons.length,54);
assert.equal(units.length,9);
assert.equal(stops.length,units.length);
assert.equal(earlyStory.length,24);
assert.equal(new Set(lessons.map(l=>l.id)).size,54);
assert.equal(new Set(lessons.map(l=>l.slug)).size,54);
for(let unit=0;unit<units.length;unit++) {
  assert.equal(lessons.filter(l=>l.unit===unit).length,6);
  assert.ok(stops[unit].culture.text.length>200);
  assert.ok(stops[unit].culture.url.startsWith('https://'));
}
let tables=0;
for(const [i,l] of lessons.entries()) {
  assert.match(l.slug,/^[0-9]{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.equal(l.rule.split('\n\n').length,2,`${l.id}: two concept sections`);
  assert.ok(l.rule.length>500,`${l.id}: substantial explanations`);
  assert.equal(l.questions.length,3);
  assert.equal(l.words.length,3);
  assert.ok(l.reading.length>20 && l.english.length>20);
  assert.equal(examples[i+1].length,2);
  for(const q of l.questions) {
    assert.equal(q.options.length,3);
    assert.equal(new Set(q.options).size,3);
    assert.ok(q.answer>=0 && q.answer<3);
    assert.ok(q.explanation.length>20);
  }
  assert.ok(l.tables.length>0,`${l.id}: has tables`);
  for(const t of l.tables) {
    tables++;
    assert.ok(t.rows.length>0);
    for(const r of t.rows) assert.equal(r.length,t.headers.length,`${l.id}: table column count`);
    if(t.headers[0]==='Subject' && t.rows[0][0]==='eu') assert.equal(t.rows.length,6,`${l.id}: full conjugation`);
  }
}
assert.equal(lessons[0].tables[0].rows.length,31);
assert.deepEqual(getVocabulary([]),[]);
assert.deepEqual(getVocabulary(['nonexistent']),[]);
const first=getVocabulary([lessons[0].id]);
assert.deepEqual(first.map(w=>w.word),lessons[0].words.map(w=>w[0]));
assert.equal(getVocabulary([lessons[0].id,lessons[0].id]).length,first.length);
for(let n=1;n<=54;n++) {
  const completed=lessons.slice(0,n);
  const v=getVocabulary(completed.map(l=>l.id));
  assert.equal(v.length,new Set(completed.flatMap(l=>l.words.map(w=>w[0]))).size);
  assert.ok(v.every(w=>w.lessons.every(l=>completed.includes(l))));
  assert.ok(v.length>=getVocabulary(lessons.slice(0,n-1).map(l=>l.id)).length);
}
const avg=ls=>ls.reduce((n,l)=>n+l.reading.split(/\s+/).length,0)/ls.length;
assert.ok(avg(lessons.slice(48))>avg(lessons.slice(24,30)));
assert.ok(avg(lessons.slice(24,30))>avg(lessons.slice(0,6)));
console.log(`Validated ${lessons.length} lessons, ${lessons.length*3} answer keys, ${tables} tables, ${lessons.length*2} worked examples, ${stops.length} cultural sections, and ${getVocabulary(lessons.map(l=>l.id)).length} progressively unlocked vocabulary entries.`);
