import { env } from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export function config(){return env as unknown as Record<string,string> & {DB:D1Database};}
export async function identity(request:Request, mutation=false){const u=await getChatGPTUser();if(!u)throw Error('UNAUTHORIZED');if(mutation){const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)throw Error('FORBIDDEN');}return u.userId;}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
export async function boundedJSON(request:Request,limit=100000){if(Number(request.headers.get('content-length'))>limit)throw Error('Request too large.');const reader=request.body?.getReader();if(!reader)throw Error('Empty request.');let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('Request too large.');}chunks.push(value);}const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(all));}
export function failure(e:unknown){const m=e instanceof Error?e.message:'Unexpected error';return json({error:m},m==='UNAUTHORIZED'?401:m==='FORBIDDEN'?403:400);}
