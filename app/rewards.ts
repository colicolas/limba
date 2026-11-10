export type Activity={id:string;day:string;kind:'exercise'|'lesson'|'vocabulary';xp:number};
export function localDay(date=new Date()):string{return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function previousDay(day:string):string{const [y,m,d]=day.split('-').map(Number);return localDay(new Date(y,m-1,d-1,12));}
export function addActivity(events:readonly Activity[],event:Activity):Activity[]{return events.some(e=>e.id===event.id)?[...events]:[...events,event];}
export function activityStats(events:readonly Activity[],today=localDay()){
 const days=new Set(events.filter(e=>e.day&&e.kind!=='lesson').map(e=>e.day));
 let cursor=days.has(today)?today:previousDay(today),streak=0;
 while(days.has(cursor)){streak++;cursor=previousDay(cursor);}
 const xp=events.reduce((n,e)=>n+e.xp,0);
 return {xp,streak,today:events.filter(e=>e.day===today&&e.kind!=='lesson').length,level:1+Math.floor(xp/250),levelProgress:xp%250};
}
