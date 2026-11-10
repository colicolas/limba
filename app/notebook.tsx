'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Bookmark, Check, ChevronDown, Layers, Library, Menu, RotateCcw, Search, Volume2, X } from './icons';
import { type Lesson, type Question, type Table } from './curriculum';
import { getCourse, type Language } from './courses';
import { addActivity, activityStats, localDay, type Activity } from './rewards';
import { getVocabulary } from './progress';
import { APPractice } from './italian/ap-practice';

type View = 'course' | 'chapter' | 'lesson' | 'vocabulary' | 'grammar' | 'grammar-entry' | 'readings' | 'reader' | 'ap';
type Props = { view: View; lessonIndex?: number; chapterIndex?: number; language?: Language };
const normalize = (s: string) => s.toLocaleLowerCase('ro').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

function FormTable({ table }: { table: Table }) {
  return <figure className="form-table"><div className="table-scroll" tabIndex={0} aria-label={`${table.caption}, scroll horizontally if needed`}><table><caption>{table.caption}</caption><thead><tr>{table.headers.map(h => <th scope="col" key={h}>{h}</th>)}</tr></thead><tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th scope="row" key={j}>{c}</th> : <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>{table.note && <figcaption>{table.note}</figcaption>}</figure>;
}

function Exercise({ question, number, saved, onAnswer, language }: { question: Question; number: string; saved?: number; onAnswer: (n: number) => void; language: Language }) {
  const [selected, setSelected] = useState<number | null>(saved ?? null);
  const [checked, setChecked] = useState(saved !== undefined);
  useEffect(() => { if (saved !== undefined) { setSelected(saved); setChecked(true); } }, [saved]);
  const correct = checked && selected === question.answer;
  return <div className="exercise"><div className="section-label">EXERCISE {number}{correct && <span className="exercise-complete"><Check size={13} /> Correct</span>}</div><h3>{question.prompt}</h3><fieldset><legend className="sr-only">{question.prompt}</legend>{question.options.map((o, i) => <label key={o} className={`answer ${selected === i ? 'picked' : ''} ${checked && i === question.answer ? 'correct-answer' : ''}`}><input type="radio" name={`question-${number}`} checked={selected === i} onChange={() => { setSelected(i); setChecked(false); }} /><span className="answer-letter">{String.fromCharCode(65 + i)}</span><span>{o}</span></label>)}</fieldset><button className="outline" disabled={selected === null} onClick={() => { if (selected !== null) { setChecked(true); onAnswer(selected); } }}>Check answer</button>{checked && <div className={`answer-feedback ${correct ? 'success' : ''}`} role="status"><b>{correct ? 'Correct.' : 'Review this answer.'}</b> {question.explanation}{!correct && <div>Correct answer: <span lang={language}>{question.options[question.answer]}</span></div>}</div>}</div>;
}

export default function Notebook({ view, lessonIndex, chapterIndex, language = 'ro' }: Props) {
  const course=getCourse(language);
  const {lessons,units,stops,examples,base}=course;
  const paths={course:base||'/',vocabulary:`${base}/vocabulary`,grammar:`${base}/grammar`,readings:`${base}/readings`,ap:'/italian/ap'};
  const lessonUrl=(l:Lesson)=>`${base}/lessons/${l.slug}`;
  const chapterUrl=(n:number)=>`${base}/chapters/${n+1}`;
  const completedKey=`limba-${language}-completed-v2`;
  const answersKey=`limba-${language}-answers-v2`;
  const vocabKey=language==='ro'?'limba-vocab':'limba-it-vocab';
  const [activities,setActivities]=useState<Activity[]>([]);
  const [goal,setGoal]=useState(3);
  const [reward,setReward]=useState<{xp:number;words:number}|null>(null);
  const [languageOpen,setLanguageOpen]=useState(false);
  const rewardDialog=useRef<HTMLDialogElement|null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [known, setKnown] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [card, setCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [translation, setTranslation] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobile, setMobile] = useState(false);
  const [written, setWritten] = useState('');
  const [writeChecked, setWriteChecked] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const urlRef = useRef('');
  const lesson = lessonIndex !== undefined ? lessons[lessonIndex] : undefined;
  const unit = lesson?.unit ?? chapterIndex ?? 0;
  const navView = view === 'lesson' || view === 'chapter' ? 'course' : view === 'grammar-entry' ? 'grammar' : view === 'reader' ? 'readings' : view;

  useEffect(() => {
    try {
      const savedActivity=JSON.parse(localStorage.getItem('limba-activity-v1')||'[]');
      let ledger:Activity[]=Array.isArray(savedActivity)?savedActivity.filter(e=>e&&typeof e.id==='string'&&typeof e.day==='string'&&['exercise','lesson','vocabulary'].includes(e.kind)&&Number.isFinite(e.xp)&&e.xp>=0):[];
      // Credit existing completed work without inventing dates or a historical streak.
      for(const code of ['ro','it'] as const){
        const historical=JSON.parse(localStorage.getItem(`limba-${code}-completed-v2`)||'[]');
        if(!Array.isArray(historical)) continue;
        for(const l of getCourse(code).lessons.filter(l=>historical.includes(l.id))){
          ledger=addActivity(ledger,{id:`complete:${l.id}`,kind:'lesson',day:'',xp:30});
          for(let i=0;i<3;i++) ledger=addActivity(ledger,{id:`answer:${l.id}:${i}`,kind:'exercise',day:'',xp:5});
        }
      }
      setActivities(ledger);
      localStorage.setItem('limba-activity-v1',JSON.stringify(ledger));
      const savedGoal=Number(localStorage.getItem('limba-daily-goal'));
      if([3,5,10].includes(savedGoal)) setGoal(savedGoal);
      const savedDone = JSON.parse(localStorage.getItem(completedKey) || '[]');
      const savedKnown = JSON.parse(localStorage.getItem(vocabKey) || '[]');
      const savedAnswers = JSON.parse(localStorage.getItem(answersKey) || '{}');
      if (Array.isArray(savedDone)) setDone(savedDone.filter(id => lessons.some(l => l.id === id)));
      if (Array.isArray(savedKnown)) setKnown(savedKnown.filter(k => typeof k === 'string'));
      if (savedAnswers && typeof savedAnswers === 'object' && !Array.isArray(savedAnswers)) setAnswers(savedAnswers);
    } catch { /* A fresh notebook is safe if old storage is malformed. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    setWritten(''); setWriteChecked(false); setTranslation(false);
    if (lesson) { try { setWritten(localStorage.getItem(`limba-writing-${lesson.id}`) || ''); } catch {} }
  }, [lesson]);
  useEffect(() => () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  function persist(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { setNotice('Your browser could not save progress. Keep this tab open, or enable site storage.'); }
  }
  function grant(kind:Activity['kind'],id:string,xp:number) {
    let current=activities;
    try {const saved=JSON.parse(localStorage.getItem('limba-activity-v1')||'[]');if(Array.isArray(saved)) current=saved.filter(e=>e&&typeof e.id==='string'&&typeof e.day==='string'&&['exercise','lesson','vocabulary'].includes(e.kind)&&Number.isFinite(e.xp)&&e.xp>=0);} catch {}
    if(current.some(e=>e.id===id)) return 0;
    const updated=addActivity(current,{kind,id,xp,day:localDay()});
    setActivities(updated);persist('limba-activity-v1',updated);return xp;
  }
  useEffect(()=>{if(reward&&!rewardDialog.current?.open) rewardDialog.current?.showModal();},[reward]);
  function complete() {
    if (!lesson) return;
    const updated = Array.from(new Set([...done, lesson.id]));
    if(done.includes(lesson.id)) return;
    setDone(updated); persist(completedKey, updated);
    const wordCount=getVocabulary(updated,lessons).length-getVocabulary(done,lessons).length;
    const earned=grant('lesson',`complete:${lesson.id}`,30);
    setReward({xp:earned,words:wordCount});
  }
  function answer(index: number, selected: number) {
    if (!lesson) return;
    const updated = { ...answers, [`${lesson.id}-${index}`]: selected };
    setAnswers(updated); persist(answersKey, updated);
    if(selected===lesson.questions[index].answer) grant('exercise',`answer:${lesson.id}:${index}`,5);
  }
  function say(text: string) {
    if (!('speechSynthesis' in window)) { setNotice('Audio is unavailable in this browser.'); return; }
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(language));
    if (!voice) { setNotice(`Add a voice for ${course.name} in your device’s speech settings to use pronunciation audio. The written sound guides remain available.`); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text); utterance.voice = voice; utterance.lang = course.speechLocale; utterance.rate = .8;
    window.speechSynthesis.speak(utterance);
  }
  async function record() {
    if (recording && recorder.current) { recorder.current.stop(); setRecording(false); return; }
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('unavailable');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream;
      const rec = new MediaRecorder(stream); recorder.current = rec; const chunks: BlobPart[] = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); const url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })); urlRef.current = url; setRecordingUrl(url); stream.getTracks().forEach(t => t.stop()); };
      rec.start(); setRecording(true);
    } catch { setNotice('Microphone access is unavailable. Read the prompt aloud and use the example audio for self-review.'); }
  }

  const completedLessons = lessons.filter(l => done.includes(l.id));
  const vocabulary = getVocabulary(done,lessons);
  const filteredWords = vocabulary.filter(w => normalize(`${w.word} ${w.meaning}`).includes(normalize(query)) && (statusFilter === 'all' || (statusFilter === 'familiar' ? known.includes(w.word) : !known.includes(w.word))));
  const word = filteredWords[card % Math.max(filteredWords.length, 1)];
  const nextIndex = lessons.findIndex(l => !done.includes(l.id));
  const current = lessons[nextIndex < 0 ? 0 : nextIndex];
  const stats=activityStats(activities);
  const nav = [ ['course', 'Lessons', BookOpen], ['vocabulary', 'Vocabulary', Layers], ['grammar', 'Grammar reference', Library], ['readings', 'Readings', Bookmark], ...(language==='it'?[['ap','AP practice',Library] as const]:[]) ] as const;
  const exerciseCount = lesson ? lesson.questions.filter((q, i) => answers[`${lesson.id}-${i}`] === q.answer).length : 0;

  const reader = lesson && <>
    <div className="story-context"><span className="section-label">EPISODE {lessonIndex! + 1} · {stops[unit].place}</span><p>{stops[unit].summary}</p><span className="text-muted">Fictional course story · {lesson.reading.split(/\s+/).length} words</span></div>
    <div className="passage" lang={language}>{lesson.reading.split('\n').map((p, i) => <p key={i}>{p}</p>)}</div>
    <div className="inline-actions"><button className="text-button" onClick={() => say(lesson.reading)}><Volume2 size={16} /> Listen</button><button className="text-button" onClick={() => setTranslation(!translation)}>{translation ? 'Hide translation' : 'Show translation'} <ChevronDown size={15} /></button></div>
    {translation && <div className="translation">{lesson.english.split('\n').map((p, i) => <p key={i}>{p}</p>)}</div>}
    <details className="glossary"><summary>Lesson vocabulary <ChevronDown size={15} /></summary><dl>{lesson.words.map(([w, m]) => <div key={w}><dt lang={language}>{w}</dt><dd>{m}</dd></div>)}</dl></details>
  </>;

  return <div className="app-shell" data-language={language}><aside className={`sidebar ${mobile ? 'shown' : ''}`}><Link href={base || '/'} className="brand">limba<span className="brand-period">.</span></Link><div className="language-switch"><button className="language-select" aria-expanded={languageOpen} aria-controls="language-options" onClick={()=>setLanguageOpen(!languageOpen)}><span className="flag" aria-hidden="true" /><span>{course.name}</span><ChevronDown size={14}/></button>{languageOpen&&<div className="language-options" id="language-options"><Link href="/" onClick={()=>setLanguageOpen(false)}><span className="flag flag-ro"/>Romanian{language==='ro'&&<Check size={14}/>}</Link><Link href="/italian" onClick={()=>setLanguageOpen(false)}><span className="flag flag-it"/>Italian{language==='it'&&<Check size={14}/>}</Link></div>}</div><nav aria-label="Main navigation">{nav.map(([id, label, Icon]) => <Link href={paths[id]} key={id} className={`nav-item ${navView === id ? 'on' : ''}`} aria-current={navView === id ? 'page' : undefined} onClick={() => setMobile(false)}><Icon size={18} /><span>{label}</span>{id === 'vocabulary' && <span className="nav-count">{ready ? vocabulary.length : '—'}</span>}</Link>)}</nav><div className="sidebar-bottom"><div className="sidebar-progress"><span>{done.length} / {lessons.length} lessons</span><div className="progress-track"><i style={{ width: `${done.length / lessons.length * 100}%` }} /></div></div><small>Progress saved on this browser</small></div></aside>
    <div className="main-wrap"><header className="topbar"><button className="mobile-menu" aria-label={mobile ? 'Close navigation' : 'Open navigation'} aria-expanded={mobile} onClick={() => setMobile(!mobile)}>{mobile ? <X size={21} /> : <Menu size={21} />}</button><nav aria-label="Breadcrumb"><Link href={base || '/'}>{course.name}</Link>{view !== 'course' && <><span>/</span>{view === 'chapter' ? <span>Chapter {unit + 1}</span> : lesson ? <><Link href={view === 'grammar-entry' ? paths.grammar : view === 'reader' ? paths.readings : chapterUrl(unit)}>{view === 'grammar-entry' ? 'Grammar reference' : view === 'reader' ? 'Readings' : `Chapter ${unit + 1}`}</Link><span>/</span><span>Lesson {lessonIndex! + 1}</span></> : <span>{nav.find(n => n[0] === navView)?.[1]}</span>}</>}</nav><div className="learning-score" aria-label={`${stats.xp} experience points; ${stats.streak} day streak`}><span className="streak-score"><span aria-hidden="true">♨</span>{stats.streak}<small>day streak</small></span><span className="xp-score"><span aria-hidden="true">✦</span>{stats.xp}<small>XP</small></span></div></header>
      <main id="main-content">
        {view === 'course' && <>
          <div className="page-title"><div><span className="section-label">{course.name.toUpperCase()}</span><h1>Lessons</h1><p>{lessons.length} lessons · {units.length} chapters · {language==='it'?'Pronunciation to AP language & culture':'Pronunciation to literary reading'}</p></div><div className="course-total"><strong>{Math.round(done.length / lessons.length * 100)}<span>%</span></strong><span>completed</span></div></div>
          {nextIndex >= 0 ? <section className="continue-card"><div><span className="section-label">{done.length ? 'NEXT LESSON' : 'START HERE'} · {String(nextIndex + 1).padStart(2, '0')}</span><h2>{current.title}</h2><p>{current.desc}</p></div><Link href={lessonUrl(current)} className="primary">{done.length ? 'Continue' : 'Start lesson'}<ArrowRight size={17} /></Link></section> : <div className="completion-banner"><Check size={20} /><div><h2>Course completed</h2><p>All {lessons.length} lessons are marked complete. Review any chapter below.</p></div><Link className="outline" href={paths.vocabulary}>Review vocabulary</Link></div>}
          <section className="motivation-strip"><div className="goal-widget"><div className="goal-ring" style={{'--goal-progress':`${Math.min(stats.today/goal,1)*100}%`} as React.CSSProperties}>{stats.today>=goal?<Check size={21}/>:<span>{Math.min(stats.today,goal)}<small>/{goal}</small></span>}</div><div><b>Daily goal</b><label><select aria-label="Daily practice goal" value={goal} onChange={e=>{const n=Number(e.target.value);setGoal(n);try{localStorage.setItem('limba-daily-goal',String(n))}catch{}}}><option value={3}>3 activities</option><option value={5}>5 activities</option><option value={10}>10 activities</option></select></label></div></div><div className="level-widget"><span className="level-emblem">{stats.level}</span><div><b>Level {stats.level}</b><div className="level-track"><i style={{width:`${stats.levelProgress/250*100}%`}}/></div><small>{250-stats.levelProgress} XP to next level</small></div></div><Link href={done.length?paths.vocabulary:lessonUrl(current)} className="review-widget"><span aria-hidden="true">↻</span><div><b>{done.length?'Word review':'First lesson'}</b><small>{done.length?`${vocabulary.filter(w=>!known.includes(w.word)).length} still learning`:'+45 XP'}</small></div><ArrowRight size={15}/></Link></section>
          <div className="milestone-row" aria-label="Course milestones">{[{label:'First lesson',icon:'✦',earned:done.length>=1},{label:'First chapter',icon:'◎',earned:units.some((_,i)=>lessons.filter(l=>l.unit===i).every(l=>done.includes(l.id)))},{label:'10 lessons',icon:'✧',earned:done.length>=10},{label:'50 words familiar',icon:'◇',earned:vocabulary.filter(w=>known.includes(w.word)).length>=50}].map(m=><span className={`milestone ${m.earned?'earned':''}`} key={m.label} title={m.earned?'Earned':'Not yet earned'}><span>{m.icon}</span>{m.label}{m.earned&&<Check size={11}/>}</span>)}</div>
          <div className="list-heading"><h2>Chapters</h2><span>6 lessons each</span></div>
          <div className="chapter-list">{units.map((u, i) => { const chapterLessons = lessons.filter(l => l.unit === i); const n = chapterLessons.filter(l => done.includes(l.id)).length; return <Link href={chapterUrl(i)} className="chapter-row" key={u.title}><span className={`chapter-number ${n === 6 ? 'complete' : ''}`}>{n === 6 ? <Check size={21} /> : String(i + 1).padStart(2, '0')}</span><div className="chapter-row-main"><span className="section-label">{u.level} · {stops[i].place}</span><h3>{u.title}</h3><p>{u.description}</p></div><div className="chapter-row-progress"><span>{n} / 6</span><div className="mini-dots">{chapterLessons.map(l => <i key={l.id} className={done.includes(l.id) ? 'filled' : ''} />)}</div></div><ArrowUpRight size={19} /></Link>; })}</div>
          <section className="story-overview"><div><span className="section-label">COURSE STORY</span><h2>{course.storyTitle}</h2><p>{course.storyDescription}</p><Link href={paths.readings} className="text-button">Browse episodes <ArrowRight size={16} /></Link></div><ol className="route-list">{stops.map((s, i) => <li key={s.place}><Link href={chapterUrl(i)}><span>{i + 1}</span>{s.place}</Link></li>)}</ol></section>
        </>}

        {view === 'chapter' && <>
          <Link href={base || '/'} className="back"><ArrowLeft size={15} /> All chapters</Link><div className="page-title"><div><span className="section-label">CHAPTER {unit + 1} · {units[unit].level}</span><h1>{units[unit].title}</h1><p>{units[unit].description}</p></div></div>
          <section className="chapter-story"><span className="stop-number">{String(unit + 1).padStart(2, '0')}</span><div><span className="section-label">{stops[unit].place}</span><h2>{stops[unit].episode}</h2><p>{stops[unit].summary}</p></div></section>
          {language==='it'&&unit>=4&&<Link className="ap-chapter-link" href={`/italian/ap#theme-${unit-3}`}><span>AP theme {unit-3}</span>Source work & practice <ArrowUpRight size={15}/></Link>}<h2 className="block-heading">Lessons</h2><div className="chapter-lessons">{lessons.filter(l => l.unit === unit).map(l => <Link href={lessonUrl(l)} key={l.id}><span className="lesson-number">{String(lessons.indexOf(l) + 1).padStart(2, '0')}</span><div><h3>{l.title}</h3><p>{l.desc}</p></div><span className="lesson-status">{done.includes(l.id) ? <><Check size={15} /> Complete</> : '3 exercises + writing'}</span><ArrowRight size={17} /></Link>)}</div>
          <section className="culture-section" id="culture"><span className="section-label">HISTORY & CULTURE · {stops[unit].place}</span><h2>{stops[unit].culture.title}</h2><p>{stops[unit].culture.text}</p><a href={stops[unit].culture.url} target="_blank" rel="noreferrer" className="source-link">Source: {stops[unit].culture.source} <ArrowUpRight size={13} /></a><div className="reflection"><b>Think about it</b><p>{stops[unit].culture.question}</p></div></section>
          <nav className="page-pagination" aria-label="Chapters">{unit > 0 ? <Link href={chapterUrl(unit - 1)}><ArrowLeft size={16} /> Chapter {unit}</Link> : <span />}{unit < units.length - 1 && <Link href={chapterUrl(unit + 1)}>Chapter {unit + 2}<ArrowRight size={16} /></Link>}</nav>
        </>}

        {view === 'lesson' && lesson && <>
          <Link href={chapterUrl(unit)} className="back"><ArrowLeft size={15} /> Chapter {unit + 1}: {units[unit].title}</Link>
          <div className="page-title lesson-title"><div><span className="section-label">LESSON {String(lessonIndex! + 1).padStart(2, '0')} · {stops[unit].place}</span><h1>{lesson.title}</h1><p>{lesson.desc}</p></div>{done.includes(lesson.id) && <span className="status-badge"><Check size={14} /> Completed</span>}</div>
          <div className="textbook-layout"><article className="textbook"><section className="lesson-objective"><b>In this lesson</b><p>{lesson.desc} Complete two concept checks, read episode {lessonIndex! + 1}, then write and speak using the new forms.</p><Link href={`${base}/grammar/${lesson.slug}`} className="text-button">Grammar reference <ArrowUpRight size={14} /></Link></section>
            {lesson.rule.split('\n\n').map((paragraph, i) => <section className="concept-section" id={`section-${i + 1}`} key={i}><span className="section-label">{lessonIndex! + 1}.{i + 1}</span><h2>{i === 0 ? 'Forms and meaning' : 'Usage and contrasts'}</h2><p>{paragraph}</p>{(i === 0 ? lesson.tables.slice(0, 1) : lesson.tables.slice(1)).map(t => <FormTable key={t.caption} table={t} />)}<div className="worked-examples"><h3>Worked example</h3>{(examples[lessonIndex! + 1] || []).slice(i, i + 1).map(([ro, en, note]) => <div className="worked-example" key={ro}><button aria-label={`Listen: ${ro}`} onClick={() => say(ro)}><Volume2 size={17} /></button><p lang={language}>{ro}</p><span>{en}</span><p className="annotation">{note}</p></div>)}</div><Exercise language={language} key={`${lesson.id}-${i}`} question={lesson.questions[i]} number={`${lessonIndex! + 1}.${i + 1}`} saved={answers[`${lesson.id}-${i}`]} onAnswer={n => answer(i, n)} /></section>)}
            <section className="concept-section" id="reading"><span className="section-label">{lessonIndex! + 1}.3</span><h2>Reading</h2>{reader}<Exercise language={language} key={`${lesson.id}-reading`} question={lesson.questions[2]} number={`${lessonIndex! + 1}.3`} saved={answers[`${lesson.id}-2`]} onAnswer={n => answer(2, n)} /></section>
            <section className="concept-section" id="writing"><span className="section-label">{lessonIndex! + 1}.4</span><h2>Writing</h2><p>Translate the sentence below. Check your answer against the model and review the forms you used.</p><div className="writing-prompt">{lesson.translation}</div><label className="input-label" htmlFor="writing">Your {course.name} sentence</label><textarea id="writing" value={written} onChange={e => { setWritten(e.target.value); setWriteChecked(false); try { localStorage.setItem(`limba-writing-${lesson.id}`, e.target.value); } catch {} }} placeholder="Write your answer…" rows={3} /><button className="outline" disabled={!written.trim()} onClick={() => setWriteChecked(true)}>Compare with model</button>{writeChecked && <div className="answer-feedback" role="status"><b>{normalize(written) === normalize(lesson.example) ? 'Your answer matches the model.' : 'Model answer'}</b><p lang={language}>{lesson.example}</p><p>Other translations may also be valid. This checks one model and ignores punctuation and accents; review the correct Romanian spelling above.</p></div>}<div className="writing-extension"><b>Extend it</b><p>Use the same construction to add two sentences to the travel notebook. Change the person, place, or time where the grammar allows.</p></div></section>
            <section className="concept-section" id="speaking"><span className="section-label">{lessonIndex! + 1}.5</span><h2>Speaking</h2><p>{lesson.speak}</p><div className="spoken-model"><p lang={language}>{lesson.example}</p><button className="text-button" onClick={() => say(lesson.example)}><Volume2 size={16} /> Listen to model</button></div><div className="inline-actions"><button className={`outline ${recording ? 'is-recording' : ''}`} onClick={record}>{recording ? '■ Stop recording' : '● Record yourself'}</button><span className="text-muted">Optional · self-review · not uploaded</span></div>{recordingUrl && <audio controls src={recordingUrl} />}<ul className="self-check"><li>Check the sound or grammar pattern introduced in this lesson.</li><li>Repeat with a different person or object.</li><li>Listen again and identify one thing to improve.</li></ul></section>
            <section className="lesson-finish"><div><h2>{done.includes(lesson.id) ? 'Lesson completed' : 'Finish lesson'}</h2><p>{exerciseCount} / 3 exercises correct · {lesson.words.length} vocabulary entries {done.includes(lesson.id) ? 'available' : 'to unlock'}</p></div><button className="primary" onClick={complete} disabled={!ready || done.includes(lesson.id) || exerciseCount < 3}>{done.includes(lesson.id) ? 'Completed' : 'Mark complete'}<Check size={16} /></button>{exerciseCount < 3 && !done.includes(lesson.id) && <p className="completion-hint">Answer the three concept and reading checks correctly to complete the lesson.</p>}</section>
          </article><aside className="lesson-toc"><span className="section-label">CONTENTS</span><a href="#section-1">1. Forms and meaning</a><a href="#section-2">2. Usage and contrasts</a><a href="#reading">3. Reading</a><a href="#writing">4. Writing</a><a href="#speaking">5. Speaking</a><hr /><Link href={`${base}/grammar/${lesson.slug}`}>Reference tables <ArrowUpRight size={13} /></Link><Link href={`${chapterUrl(unit)}#culture`}>History & culture <ArrowUpRight size={13} /></Link>{language==='it'&&unit>=4&&<Link href={`/italian/ap#theme-${unit-3}`}>AP theme practice <ArrowUpRight size={13}/></Link>}</aside></div>
          <nav className="page-pagination" aria-label="Lessons">{lessonIndex! > 0 ? <Link href={lessonUrl(lessons[lessonIndex! - 1])}><ArrowLeft size={16} /><span><small>PREVIOUS LESSON</small>{lessons[lessonIndex! - 1].title}</span></Link> : <Link href={chapterUrl(unit)}><ArrowLeft size={16} /> Chapter contents</Link>}{lessonIndex! < lessons.length - 1 ? <Link href={lessonUrl(lessons[lessonIndex! + 1])}><span><small>NEXT LESSON</small>{lessons[lessonIndex! + 1].title}</span><ArrowRight size={16} /></Link> : <Link href={paths.vocabulary}>Vocabulary review <ArrowRight size={16} /></Link>}</nav>
        </>}

        {view === 'vocabulary' && <>
          <div className="page-title"><div><h1>Vocabulary</h1><p>{vocabulary.length} words from {completedLessons.length} completed lessons · {vocabulary.filter(w => known.includes(w.word)).length} familiar</p></div></div>
          {!ready ? <p className="empty-state">Loading your vocabulary…</p> : !vocabulary.length ? <section className="empty-state"><Layers size={28} /><h2>No vocabulary yet</h2><p>Complete a lesson to add its vocabulary here. Words unlock as you progress through the course.</p><Link href={lessonUrl(current)} className="primary">Open lesson {lessons.indexOf(current) + 1}<ArrowRight size={16} /></Link></section> : <>
            <div className="toolbar"><label className="search"><Search size={17} /><input aria-label="Search vocabulary" placeholder={`Search ${course.name} or English…`} value={query} onChange={e => { setQuery(e.target.value); setCard(0); setFlipped(false); }} /></label><select aria-label="Vocabulary practice status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCard(0); setFlipped(false); }}><option value="all">All words</option><option value="learning">Still learning</option><option value="familiar">Familiar</option></select></div>
            {word ? <><div className="flashcard"><div className="flash-top"><span className="section-label">{known.includes(word.word) ? 'FAMILIAR' : 'STILL LEARNING'}</span><span>{card % filteredWords.length + 1} / {filteredWords.length}</span></div><button className="flash-word" onClick={() => setFlipped(!flipped)}><h2 lang={flipped ? 'en' : language}>{flipped ? word.meaning : word.word}</h2><p>{flipped ? 'Tap to return to Romanian' : 'Recall the meaning, then tap to reveal'}</p></button><button className="text-button" onClick={() => say(word.word)}><Volume2 size={17} /> Listen</button><Link href={lessonUrl(word.lessons[0])} className="flash-source">Lesson {lessons.indexOf(word.lessons[0]) + 1}: {word.lessons[0].title} <ArrowUpRight size={12} /></Link></div><div className="flash-actions"><button className="outline" onClick={() => { grant('vocabulary',`review:${language}:${word.word}:${localDay()}`,2); const n = known.filter(w => w !== word.word); setKnown(n); persist(vocabKey, n); if (statusFilter !== 'familiar') setCard(card + 1); setFlipped(false); }}><RotateCcw size={16} /> Still learning</button><button className="primary" onClick={() => { grant('vocabulary',`review:${language}:${word.word}:${localDay()}`,2); const n = Array.from(new Set([...known, word.word])); setKnown(n); persist(vocabKey, n); if (statusFilter !== 'learning') setCard(card + 1); setFlipped(false); }}>Familiar <Check size={16} /></button></div><div className="vocabulary-list"><div className="vocabulary-list-head"><span>{course.name}</span><span>Meaning</span><span>Source</span></div>{filteredWords.map(w => <div key={w.word}><button className="vocabulary-word" onClick={() => { setCard(filteredWords.indexOf(w)); setFlipped(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }} lang={language}>{w.word}{known.includes(w.word) && <Check size={12} />}</button><span>{w.meaning}</span><Link href={lessonUrl(w.lessons[0])}>Lesson {lessons.indexOf(w.lessons[0]) + 1}<ArrowUpRight size={12} /></Link></div>)}</div></> : <div className="empty-state"><h2>No matching words</h2><p>Try another search or practice-status filter.</p></div>}
          </>}
        </>}

        {view === 'grammar' && <>
          <div className="page-title"><div><h1>Grammar reference</h1><p>Pronunciation, noun forms, verb conjugations, and sentence structure</p></div></div>
          <div className="toolbar"><label className="search"><Search size={17} /><input aria-label="Search grammar reference" placeholder="Search verbs, cases, pronunciation…" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="Grammar topic" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All topics</option>{units.map((u, i) => <option value={i} key={u.title}>{u.title}</option>)}</select></div>
          <div className="reference-list">{units.map((u, i) => { const matches = lessons.filter(l => l.unit === i && (category === 'all' || Number(category) === i) && normalize(`${l.title} ${l.desc} ${l.rule} ${l.tables.map(t => t.caption).join(' ')}`).includes(normalize(query))); return matches.length ? <section key={u.title}><h2>{u.title}</h2>{matches.map(l => <Link key={l.id} href={`${base}/grammar/${l.slug}`}><span><h3>{l.title}</h3><p>{l.desc}</p></span><span className="reference-count">{l.tables.length} {l.tables.length === 1 ? 'table' : 'tables'}</span><ArrowUpRight size={17} /></Link>)}</section> : null; })}</div>{!lessons.some(l => (category === 'all' || l.unit === Number(category)) && normalize(`${l.title} ${l.desc} ${l.rule} ${l.tables.map(t => t.caption).join(' ')}`).includes(normalize(query))) && <div className="empty-state"><h2>No matching topics</h2><p>Try a broader search or select all topics.</p></div>}
        </>}

        {view === 'grammar-entry' && lesson && <>
          <Link href={paths.grammar} className="back"><ArrowLeft size={15} /> Grammar reference</Link><div className="page-title"><div><span className="section-label">{units[unit].title}</span><h1>{lesson.title}</h1></div></div><article className="reference-entry">{lesson.rule.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}{lesson.tables.map(t => <FormTable key={t.caption} table={t} />)}<div className="worked-examples"><h2>Examples</h2>{(examples[lessonIndex! + 1] || []).map(([ro, en, note]) => <div key={ro} className="worked-example"><p lang={language}>{ro}</p><span>{en}</span><p className="annotation">{note}</p></div>)}</div><Link className="primary" href={lessonUrl(lesson)}>Study lesson {lessonIndex! + 1}<ArrowRight size={17} /></Link></article>
        </>}

        {view === 'readings' && <>
          <div className="page-title"><div><h1>Readings</h1><p>{lessons.length} episodes · {course.storyTitle} · {course.country}</p></div></div><section className="story-cast">{course.cast.map(c=><div key={c.name}><span>{c.name[0]}</span><b>{c.name}</b><p>{c.role}</p></div>)}</section>
          <div className="reading-chapters">{units.map((u, i) => <section key={u.title}><div className="reading-chapter-heading"><span className="section-label">CHAPTER {i + 1} · {stops[i].place}</span><h2>{stops[i].episode}</h2><p>{stops[i].summary}</p></div><div className="episode-grid">{lessons.filter(l => l.unit === i).map(l => <Link href={`${base}/readings/${l.slug}`} key={l.id}><span className="section-label">EPISODE {lessons.indexOf(l) + 1}</span><h3>{l.title}</h3><p lang={language}>{l.reading.slice(0, 110)}…</p><span className="episode-meta">{l.reading.split(/\s+/).length} words <ArrowUpRight size={15} /></span></Link>)}</div><Link className="text-button" href={`${chapterUrl(i)}#culture`}>Chapter history & culture <ArrowRight size={14} /></Link></section>)}</div>
          <section className="culture-section literary-source"><span className="section-label">ORIGINAL LITERATURE</span><h2>{course.literature.title}</h2><p>{course.literature.author}</p><blockquote lang={language}>{course.literature.text.split('\n').map((line,i)=><span key={i}>{line}<br/></span>)}</blockquote><Link href={lessonUrl(lessons[course.literature.lessonIndex])} className="text-button">Annotated reading in lesson {course.literature.lessonIndex+1}<ArrowRight size={14}/></Link><a href={course.literature.url} target="_blank" rel="noreferrer" className="source-link">Complete public-domain text · Wikisource <ArrowUpRight size={13}/></a></section>
        </>}

        {view === 'reader' && lesson && <>
          <Link href={paths.readings} className="back"><ArrowLeft size={15} /> All readings</Link><div className="page-title"><div><span className="section-label">CHAPTER {unit + 1} · {stops[unit].episode}</span><h1>{lesson.title}</h1></div></div><article className="standalone-reader">{reader}<Link className="primary" href={`${lessonUrl(lesson)}#reading`}>Open lesson & exercises <ArrowRight size={16} /></Link></article><nav className="page-pagination" aria-label="Reading episodes">{lessonIndex! > 0 ? <Link href={`${base}/readings/${lessons[lessonIndex! - 1].slug}`}><ArrowLeft size={16} /> Previous episode</Link> : <span />}{lessonIndex! < lessons.length-1 && <Link href={`${base}/readings/${lessons[lessonIndex! + 1].slug}`}>Next episode<ArrowRight size={16} /></Link>}</nav>
        </>}
        {view==='ap'&&language==='it'&&<APPractice record={record} recording={recording} recordingUrl={recordingUrl}/>}
      </main><footer><span>{course.name}</span><span>{done.length} / {lessons.length} lessons completed</span></footer>
    </div><dialog ref={rewardDialog} className="reward-dialog" onClose={()=>setReward(null)} onCancel={()=>setReward(null)} aria-labelledby="reward-title">{reward&&<><button className="reward-close" aria-label="Close reward" onClick={()=>rewardDialog.current?.close()}><X size={18}/></button><div className="reward-confetti" aria-hidden="true">{Array.from({length:9},(_,i)=><i key={i}/>)}</div><div className="reward-stamp"><Check size={35}/></div><h2 id="reward-title">Lesson complete</h2><div className="reward-numbers"><span>+{reward.xp}<small>XP</small></span><span>+{reward.words}<small>words unlocked</small></span></div><div className="reward-actions">{lessonIndex!==undefined&&lessonIndex<lessons.length-1&&<Link className="primary" href={lessonUrl(lessons[lessonIndex+1])} onClick={()=>rewardDialog.current?.close()}>Next lesson<ArrowRight size={16}/></Link>}<Link className="outline" href={paths.vocabulary} onClick={()=>rewardDialog.current?.close()}>Practice vocabulary</Link></div></>}</dialog>{notice && <div className="toast" role="status"><p>{notice}</p><button aria-label="Dismiss notice" onClick={() => setNotice('')}><X size={18} /></button></div>}
  </div>;
}
