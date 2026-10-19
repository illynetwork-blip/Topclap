/* ---------- SRT / VTT ---------- */
function parseSubs(txt){
  const ts=s=>{const m=s.match(/(?:(\d+):)?(\d+):(\d+)[,.](\d+)/);return m?(+(m[1]||0))*3600+ +m[2]*60+ +m[3]+ +m[4]/1000:0};
  const cues=[];for(const b of txt.replace(/\r/g,'').split(/\n\n+/)){const lines=b.split('\n').filter(Boolean);const i=lines.findIndex(l=>l.includes('-->'));if(i<0)continue;const [a,z]=lines[i].split('-->');const text=lines.slice(i+1).join(' ').replace(/<[^>]+>/g,'').trim();if(text)cues.push({s:ts(a),e:ts(z),text})}
  return cues;
}
function importSRT(txt,style='karaoke'){
  const cues=parseSubs(txt);if(!cues.length){toast('Aucun sous-titre trouvé dans ce fichier');return}
  const words=cues.flatMap(q=>wordsFromText(q.text,q.s,Math.max(q.s+.2,q.e)));
  addCaptionClip(words,'Sous-titres importés',style);commit();refreshAll();toast(`${cues.length} sous-titres importés (${words.length} mots animés)`);
}
function captionsToSRT(c){
  const gs=captionGroups(c);const f=t=>{t=Math.max(0,t);const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=Math.floor(t%60),ms=Math.round((t%1)*1000);return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`};
  return gs.map((g,i)=>`${i+1}\n${f(c.start+c.words[g[0]].s)} --> ${f(c.start+c.words[g[g.length-1]].e)}\n${g.map(k=>c.words[k].w).join(' ')}\n`).join('\n');
}
