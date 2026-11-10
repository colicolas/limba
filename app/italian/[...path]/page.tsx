import {notFound} from 'next/navigation';
import Notebook from '../../notebook';
import {italianLessons,italianUnits} from '../curriculum';
export const dynamicParams=false;
export function generateStaticParams(){return [
 ...['vocabulary','grammar','readings'].map(p=>({path:[p]})),
 ...italianUnits.map((_,i)=>({path:['chapters',String(i+1)]})),
 ...italianLessons.flatMap(l=>['lessons','grammar','readings'].map(section=>({path:[section,l.slug]})))
];}
function resolve(path:string[]){
 if(path.length===1){if(path[0]==='vocabulary')return {view:'vocabulary' as const,title:'Vocabulary'};if(path[0]==='grammar')return {view:'grammar' as const,title:'Grammar reference'};if(path[0]==='readings')return {view:'readings' as const,title:'Readings'};}
 if(path.length===2&&path[0]==='chapters'){const chapterIndex=Number(path[1])-1;if(Number.isInteger(chapterIndex)&&italianUnits[chapterIndex])return {view:'chapter' as const,chapterIndex,title:italianUnits[chapterIndex].title};}
 const lessonIndex=italianLessons.findIndex(l=>l.slug===path[1]);
 if(path.length===2&&lessonIndex>=0){const view:'lesson'|'grammar-entry'|'reader'|null=path[0]==='lessons'?'lesson':path[0]==='grammar'?'grammar-entry':path[0]==='readings'?'reader':null;if(view)return {view,lessonIndex,title:italianLessons[lessonIndex].title};}
 return null;
}
export async function generateMetadata({params}:{params:Promise<{path:string[]}>}){const {path}=await params;return {title:`${resolve(path)?.title||'Italian'} — Italian — Limba`};}
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;const page=resolve(path);if(!page)notFound();return <Notebook key={`it-${path.join('/')}`} language="it" view={page.view} lessonIndex={'lessonIndex'in page?page.lessonIndex:undefined} chapterIndex={'chapterIndex'in page?page.chapterIndex:undefined}/>;}
