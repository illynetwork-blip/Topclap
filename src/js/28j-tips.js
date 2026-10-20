/* ---------- tips and pitfalls guide (content: src/tips.json, injected by build.py, also written to ASTUCES.md) ---------- */
const TIPS=__TIPS__;
function openTips(sel){
  pause();const cur=sel||TIPS[0].id;
  const m=modal(`<h3>Astuces et pièges à éviter</h3><p class="note">Ce qui fait la différence sur YouTube, Reels, TikTok et Facebook, et les erreurs qui coûtent cher (droits, obligations des annonces, IA).</p>
    <div class="chip-row tips-tabs">${TIPS.map(s=>`<button class="btn${s.id===cur?' on':''}" data-tip="${s.id}">${esc(s.title)}</button>`).join('')}</div>
    <div class="tips-body">${(TIPS.find(s=>s.id===cur)||TIPS[0]).tips.map(([t,d])=>`<div class="tip"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div>
    <div class="mrow"><button class="btn" data-x="check">${ic('check')}Vérifier ma vidéo</button><span class="sp"></span><button class="btn pri" data-x="close">Fermer</button></div>`);
  m.addEventListener('click',e=>{const b=e.target.closest('[data-tip],[data-x]');if(!b)return;
    if(b.dataset.tip){m.parentElement.remove();openTips(b.dataset.tip);return}
    m.parentElement.remove();if(b.dataset.x==='check')openCheck()});
}
