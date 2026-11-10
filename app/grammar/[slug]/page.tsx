import {notFound} from 'next/navigation';
import Notebook from '../../notebook';
import {lessons} from '../../curriculum';
export const dynamicParams = false;
export function generateStaticParams() { return lessons.map(l=>({slug:l.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; return {title:`${lessons.find(l=>l.slug===slug)?.title || 'Grammar'} — Grammar reference`}; }
export default async function Page({params}:{params:Promise<{slug:string}>}) { const {slug}=await params; const index=lessons.findIndex(l=>l.slug===slug); if(index<0) notFound(); return <Notebook key={slug} view="grammar-entry" lessonIndex={index}/>; }
