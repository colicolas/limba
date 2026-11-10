# Limba

A Next.js App Router / TypeScript / Tailwind CSS language notebook. Warm white/tan surfaces, language-specific flag accents, real page navigation, and browser-local progress.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. Romanian starts at `/`; Italian at `/italian`. `npm run build` creates the static export in `out/`.

## Courses

**Romanian:** 54 lessons, nine chapters, 73 tables, 108 annotated examples, 162 concept/reading checks, 158 unique vocabulary entries. The original Ana/Radu/Maria story and all existing lesson IDs remain in place.

**Italian:** 60 lessons, ten chapters, 77 tables, 120 annotated examples, 180 concept/reading checks, 238 unique vocabulary entries. Four foundation chapters cover pronunciation, noun/verb patterns, daily sentences, and narration. The next six connect grammar to the current AP themes: Families and Communities; Language and Culture; Art and Creativity; Science and Technology; Contemporary Life; Global Contexts.

Both courses have English pronunciation comparisons, complete conjugation paradigms, exercises immediately after concepts, progressively more demanding fictional travel episodes, writing and speaking prompts, optional local recordings, and sourced history/culture notes in every chapter. Vocabulary unlocks only when its introducing lesson is completed; duplicate words retain all completed source lessons. Grammar references and readings have individual URLs.

The Italian story follows Sofia, Luca, and Giulia from Rome through Bologna, Florence, Venice, Naples, Palermo, Milan, Turin, Genoa, and Trieste, then back to Rome. It develops into a cultural inquiry about places, words, voices, and music. Authentic external sources are labeled separately from the fictional story. Original literary excerpts link to their public-domain texts: Eminescu for Romanian, Dante for Italian.

## AP Italian

`/italian/ap` synthesizes the 2026–27 framework with the language course. It contains:

- Six theme-to-chapter mappings with Italian-language sources from Istat, Rai, and the EEA.
- Original interpretive tasks and cultural comparisons, with source-attribution and evidence limitations.
- An autosaved research notebook: inquiry, products/practices/perspectives, source URLs and notes, and a presentation outline; export to a text file.
- Interpretive and argumentative writing drafts with a word count and optional 55-minute timer.
- Three-minute preparation/presentation timers, four original 40-second Q&A rehearsals, optional self-recording, and a saved self-review checklist.

This uses College Board's revised framework, not the superseded email/conversation exam task design. The announced 2026–27 project focus is music under Art and Creativity; the official packet is scheduled for January 2027. The site links to the current official course, CED, exam format, and revision notices. It is independent practice, does not submit a PPR, does not provide an official AP score, and is not a full mock exam. Learners choose and actually consult the linked sources; this app does not invent quotations from them or fabricate national data. The data table in lesson 47 is explicitly invented practice data.

## Navigation

Romanian uses `/chapters/[number]`, `/lessons/[slug]`, `/grammar/[slug]`, `/readings/[slug]`, and `/vocabulary`.

Italian uses the same routes prefixed by `/italian`, plus `/italian/ap`. The language switcher changes course and accents. Every chapter, lesson, reference entry, and reading has its own URL. Browser Back/Forward and lesson previous/next links work normally.

## Motivation and progress

- 5 XP for each concept/reading check, awarded only once per question.
- 30 XP for first-time lesson completion, after all three checks are correct.
- 2 XP per distinct vocabulary review per local calendar day.
- Adjustable daily goals of 3, 5, or 10 practice activities; lesson completion does not double-count the checks toward the goal.
- Consecutive practice-day streaks across both languages, levels every 250 XP, course milestones, chapter stamps, and a dismissible completion reward dialog.

Romanian and Italian completion IDs, answers, writing drafts, and vocabulary familiarity remain separate. The shared XP ledger uses deduplicated event IDs; repeat clicks cannot farm the same reward. Existing completed lessons are credited without inventing historical dates or streaks. Previous prototype progress storage is left untouched.

Everything is saved in browser localStorage. Recordings remain only in the current session and are not uploaded. Audio requires an installed voice for the selected language. Writing compares one model while ignoring accents/punctuation; it is not a general translation grader. AP speaking and writing use self-review, not automatic scoring.

## Main source files

- `app/courses.ts`: course registry and language configuration
- `app/curriculum.ts`, `tables.ts`, `examples.ts`, `story.ts`: Romanian content
- `app/italian/curriculum.ts`, `story.ts`: Italian content
- `app/italian/ap-data.ts`, `ap-practice.tsx`: AP mapping and workspaces
- `app/notebook.tsx`: shared page UI and practice interactions
- `app/progress.ts`: progressive vocabulary eligibility
- `app/rewards.ts`: XP, local dates, goals, and streak calculations

## Validation

```sh
node scripts/check-curriculum.cjs
node scripts/check-italian.cjs
npm run build
node scripts/check-export.cjs
```

Checks cover both curricula, table dimensions, six-person conjugations, pronunciation coverage, example/question structures, progressive passage length, vocabulary eligibility at every stage, language isolation, AP theme mapping, reward deduplication, date boundaries, streak continuity, generated navigation targets, and obsolete-copy removal. The static export contains 372 pages including framework error pages.
