import { lessons, type Lesson } from './curriculum';
export type VocabularyEntry = {word:string; meaning:string; lessons:Lesson[]};
/** Only vocabulary explicitly introduced by completed lessons is eligible for review. */
export function getVocabulary(completedIds:readonly string[], curriculum:readonly Lesson[]=lessons):VocabularyEntry[] {
  const completed=new Set(completedIds);
  const entries=new Map<string,VocabularyEntry>();
  for(const lesson of curriculum) {
    if(!completed.has(lesson.id)) continue;
    for(const [word,meaning] of lesson.words) {
      const previous=entries.get(word);
      if(previous) previous.lessons.push(lesson);
      else entries.set(word,{word,meaning,lessons:[lesson]});
    }
  }
  return Array.from(entries.values());
}
