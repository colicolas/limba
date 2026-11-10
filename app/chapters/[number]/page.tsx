import {notFound} from 'next/navigation';
import Notebook from '../../notebook';
import {units} from '../../curriculum';
export const dynamicParams = false;
export function generateStaticParams() { return units.map((_,i)=>({number:String(i+1)})); }
export async function generateMetadata({params}:{params:Promise<{number:string}>}) { const {number}=await params; return {title:`Chapter ${number}: ${units[Number(number)-1]?.title || 'Romanian'} — Limba`}; }
export default async function Page({params}:{params:Promise<{number:string}>}) { const {number}=await params; const index=Number(number)-1; if(!Number.isInteger(index)||!units[index]) notFound(); return <Notebook key={number} view="chapter" chapterIndex={index}/>; }
