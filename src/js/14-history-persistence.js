/* ---------- history & persistence ---------- */
const hist={stack:[],i:-1};
function snap(){return JSON.stringify({tracks:P.tracks,clips:P.clips,aspect:P.aspect,bg:P.bg,name:P.name})}
function commit(){const s=snap();if(hist.stack[hist.i]===s)return;hist.stack=hist.stack.slice(0,hist.i+1);hist.stack.push(s);if(hist.stack.length>150)hist.stack.shift();hist.i=hist.stack.length-1;updUndo();saveSoon()}
function restore(s){const o=JSON.parse(s);const asp=P.aspect;Object.assign(P,o);if(S.sel&&!clipById(S.sel))S.sel=null;pauseAll();if(asp!==P.aspect){$('#aspectSel').value=P.aspect;setRes(S.pq)}refreshAll();saveSoon()}
function undo(){if(hist.i>0){hist.i--;restore(hist.stack[hist.i]);updUndo()}}
function redo(){if(hist.i<hist.stack.length-1){hist.i++;restore(hist.stack[hist.i]);updUndo()}}
function updUndo(){$('#undoBtn').disabled=hist.i<=0;$('#redoBtn').disabled=hist.i>=hist.stack.length-1}
const LS_KEY='topclap-v1';let saveT=0;
function saveSoon(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(LS_KEY,JSON.stringify({P,S:{pps:S.pps,magnet:S.magnet,snap:S.snap},media:Object.values(media).map(m=>({id:m.id,type:m.type,name:m.name,demo:m.demo||null}))}))}catch(e){}},500)}
const IDB={db:null,
  open(){return new Promise(res=>{try{const r=indexedDB.open('topclap-media',1);r.onupgradeneeded=()=>r.result.createObjectStore('files');r.onsuccess=()=>{this.db=r.result;res(this.db)};r.onerror=()=>res(null)}catch(e){res(null)}})},
  async put(id,blob){try{const db=this.db||await this.open();if(!db)return;db.transaction('files','readwrite').objectStore('files').put(blob,id)}catch(e){}},
  async get(id){try{const db=this.db||await this.open();if(!db)return null;return await new Promise(res=>{const r=db.transaction('files').objectStore('files').get(id);r.onsuccess=()=>res(r.result||null);r.onerror=()=>res(null)})}catch(e){return null}},
  async del(id){try{const db=this.db||await this.open();if(!db)return;db.transaction('files','readwrite').objectStore('files').delete(id)}catch(e){}}
};
