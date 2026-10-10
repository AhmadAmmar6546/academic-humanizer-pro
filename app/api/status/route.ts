import {config,json,identity,failure} from '@/lib/server';
export async function GET(r:Request){try{await identity(r);const c=config();return json({ready:!!(c.LLM_API_KEY&&c.LLM_MODEL),provider:c.LLM_BASE_URL?.includes('googleapis')?'Gemini':c.LLM_BASE_URL?.includes('openai.com')?'OpenAI':'OpenRouter'});}catch(e){return failure(e);}}
