export const styles = ['Natural Academic','Simple Academic','Formal Research','Clear and Structured','Professional'] as const;
export const modes = ['Humanizer','Grammar Checker','Academic Paraphraser','Readability'] as const;
export const words = (s:string) => s.trim() ? s.trim().split(/\s+/).length : 0;
export function protectedSpans(text:string) {
  const re = /\[[^\]\n]*\d[^\]\n]*\]|\([^()\n]*(?:19|20)\d{2}[a-z]?[^()\n]*\)|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|https?:\/\/[^\s]+|\b\d+(?:[.,]\d+)*(?:%|\b)/g;
  return [...text.matchAll(re)].map(m=>m[0]);
}
export function preserve(original:string, revised:string) {
 const a=protectedSpans(original).sort(), b=protectedSpans(revised).sort();
 return JSON.stringify(a)===JSON.stringify(b);
}
export function mask(text:string) {
 let i=0;const values:string[]=[];
 const result=text.replace(/\[[^\]\n]*\d[^\]\n]*\]|\([^()\n]*(?:19|20)\d{2}[a-z]?[^()\n]*\)|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|https?:\/\/[^\s]+|\b\d+(?:[.,]\d+)*(?:%|\b)/g, s=>{values.push(s);return `⟦KEEP_${i++}⟧`;});
 return {text:result,restore:(s:string)=>{for(let j=0;j<values.length;j++){const token=`⟦KEEP_${j}⟧`;if(s.split(token).length!==2)throw Error('Protected content changed. Original retained.');s=s.replace(token,values[j]);}if(/⟦KEEP_/.test(s))throw Error('Unexpected protected marker.');return s;}};
}
export function repetition(text:string){const counts=new Map<string,number>();for(const s of text.toLowerCase().match(/[a-z]{4,}/g)||[])counts.set(s,(counts.get(s)||0)+1);return [...counts].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).slice(0,8);}
