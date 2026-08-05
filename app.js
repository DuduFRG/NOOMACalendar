
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile, updateEmail, updatePassword, signOut, onAuthStateChanged, reauthenticateWithCredential, EmailAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeFirestore, persistentLocalCache, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, writeBatch, query, where, arrayUnion, arrayRemove, deleteField, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// NoomaPicker precisa estar declarado ANTES de qualquer uso (top-level)
const NoomaPicker = {
  // Converte HEX \u2192 {h,s,v}
  hexToHsv(hex){
    let r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
    const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
    let h=0,s=max===0?0:d/max,v=max;
    if(d!==0){
      if(max===r)h=((g-b)/d)%6;
      else if(max===g)h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h=Math.round(h*60);if(h<0)h+=360;
    }
    return{h,s,v};
  },
  hsvToHex(h,s,v){
    const f=n=>{const k=(n+h/60)%6;return v-v*s*Math.max(Math.min(k,4-k,1),0);};
    const toH=x=>Math.round(f(x)*255).toString(16).padStart(2,'0');
    return`#${toH(5)}${toH(3)}${toH(1)}`;
  },
  hexToRgb(hex){
    return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};
  },
  rgbToHex(r,g,b){
    return`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  },
  // Cria um picker e monta no swatchEl
  // swatchEl: o div que mostra a cor atual (clic\u00E1vel)
  // initialColor: '#rrggbb'
  // onChange: fn(hex) chamada a cada mudan\u00E7a
  create(swatchEl, initialColor, onChange){
    if(swatchEl._ncpInit)return;
    swatchEl._ncpInit=true;
    let hex=initialColor||'#edf252';
    let hsv=NoomaPicker.hexToHsv(hex);

    // Popup
    const popup=document.createElement('div');
    popup.className='ncp-popup';
    popup.innerHTML=`
      <div class="ncp-preview-row">
        <div class="ncp-preview" id="_ncpPrev"></div>
        <div style="font-size:11px;font-weight:700;color:var(--muted)">Cor atual</div>
      </div>
      <div class="ncp-gradient" id="_ncpGrad">
        <div class="ncp-gradient-sat"></div>
        <div class="ncp-gradient-dark"></div>
        <div class="ncp-cursor" id="_ncpCursor"></div>
      </div>
      <div class="ncp-hue" id="_ncpHue"><div class="ncp-hue-thumb" id="_ncpHueThumb"></div></div>
      <div class="ncp-inputs">
        <div class="ncp-hex-wrap">
          <div class="ncp-hex-label">HEX</div>
          <input class="ncp-hex-input" id="_ncpHex" maxlength="7"/>
        </div>
        <div class="ncp-rgb-group">
          <div class="ncp-rgb-field"><span class="ncp-hex-label">R</span><input id="_ncpR" type="number" min="0" max="255"/></div>
          <div class="ncp-rgb-field"><span class="ncp-hex-label">G</span><input id="_ncpG" type="number" min="0" max="255"/></div>
          <div class="ncp-rgb-field"><span class="ncp-hex-label">B</span><input id="_ncpB" type="number" min="0" max="255"/></div>
        </div>
      </div>`;

    // Usar IDs \u00FAnicos para este picker
    const pid='ncp_'+Math.random().toString(36).slice(2,7);
    popup.querySelectorAll('[id^="_ncp"]').forEach(el=>{el.id=el.id.replace('_ncp',pid+'_');});
    
    const $ = id=>popup.querySelector('#'+pid+'_'+id);
    const grad=$('Grad'), cursor=$('Cursor'), hue=$('Hue'), hueThumb=$('HueThumb');
    const hexInput=$('Hex'), rIn=$('R'), gIn=$('G'), bIn=$('B'), prev=$('Prev');

    function updateUI(){
      const gradBg=NoomaPicker.hsvToHex(hsv.h,1,1);
      grad.style.setProperty('--ncp-hue',gradBg);
      grad.style.background=gradBg;
      cursor.style.left=(hsv.s*100)+'%';
      cursor.style.top=((1-hsv.v)*100)+'%';
      hueThumb.style.left=(hsv.h/360*100)+'%';
      hex=NoomaPicker.hsvToHex(hsv.h,hsv.s,hsv.v);
      const rgb=NoomaPicker.hexToRgb(hex);
      hexInput.value=hex;
      rIn.value=rgb.r;gIn.value=rgb.g;bIn.value=rgb.b;
      prev.style.background=hex;
      swatchEl.style.background=hex;
      if(onChange)onChange(hex);
    }

    function gradClick(e){
      const rect=grad.getBoundingClientRect();
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      const cy=e.touches?e.touches[0].clientY:e.clientY;
      hsv.s=Math.max(0,Math.min(1,(cx-rect.left)/rect.width));
      hsv.v=Math.max(0,Math.min(1,1-(cy-rect.top)/rect.height));
      updateUI();
    }
    function hueClick(e){
      const rect=hue.getBoundingClientRect();
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      hsv.h=Math.max(0,Math.min(360,((cx-rect.left)/rect.width)*360));
      updateUI();
    }

    // Drag no gradiente
    let draggingGrad=false,draggingHue=false;
    grad.addEventListener('mousedown',e=>{draggingGrad=true;gradClick(e);e.preventDefault();});
    grad.addEventListener('touchstart',e=>{draggingGrad=true;gradClick(e);e.preventDefault();},{passive:false});
    hue.addEventListener('mousedown',e=>{draggingHue=true;hueClick(e);e.preventDefault();});
    hue.addEventListener('touchstart',e=>{draggingHue=true;hueClick(e);e.preventDefault();},{passive:false});
    document.addEventListener('mousemove',e=>{if(draggingGrad)gradClick(e);if(draggingHue)hueClick(e);});
    document.addEventListener('touchmove',e=>{if(draggingGrad)gradClick(e);if(draggingHue)hueClick(e);},{passive:false});
    document.addEventListener('mouseup',()=>{draggingGrad=false;draggingHue=false;});
    document.addEventListener('touchend',()=>{draggingGrad=false;draggingHue=false;});

    // Inputs HEX e RGB
    hexInput.addEventListener('input',()=>{
      const v=hexInput.value;
      if(/^#[0-9a-fA-F]{6}$/.test(v)){hsv=NoomaPicker.hexToHsv(v);updateUI();}
    });
    hexInput.addEventListener('blur',()=>{
      const v=hexInput.value;
      if(!/^#[0-9a-fA-F]{6}$/.test(v))hexInput.value=hex;
    });
    [rIn,gIn,bIn].forEach(inp=>{
      inp.addEventListener('input',()=>{
        const r=Math.max(0,Math.min(255,+rIn.value||0));
        const g=Math.max(0,Math.min(255,+gIn.value||0));
        const b=Math.max(0,Math.min(255,+bIn.value||0));
        const newHex=NoomaPicker.rgbToHex(r,g,b);
        hsv=NoomaPicker.hexToHsv(newHex);updateUI();
      });
    });

    // Toggle popup — anexado ao <body> (portal) para nunca ser cortado por
    // overflow:hidden/auto de modais pais. Posicionado com fixed, recalculado a cada abertura.
    popup.style.position='fixed';
    document.body.appendChild(popup);
    function positionPopup(){
      const rect=swatchEl.getBoundingClientRect();
      const popupW=220,popupH=320;
      let left=rect.left;
      let top=rect.bottom+6;
      if(left+popupW>window.innerWidth-10)left=window.innerWidth-popupW-10;
      if(left<10)left=10;
      if(top+popupH>window.innerHeight-10)top=rect.top-popupH-6;
      if(top<10)top=10;
      popup.style.left=left+'px';
      popup.style.top=top+'px';
    }
    swatchEl.addEventListener('click',e=>{
      e.stopPropagation();
      const willOpen=!popup.classList.contains('open');
      document.querySelectorAll('.ncp-popup.open').forEach(p=>p.classList.remove('open'));
      if(willOpen){positionPopup();popup.classList.add('open');}
    });
    window.addEventListener('scroll',()=>{if(popup.classList.contains('open'))positionPopup();},true);
    window.addEventListener('resize',()=>{if(popup.classList.contains('open'))positionPopup();});
    document.addEventListener('click',e=>{
      if(!swatchEl.contains(e.target)&&!popup.contains(e.target))popup.classList.remove('open');
    });

    // Init
    hsv=NoomaPicker.hexToHsv(hex);
    updateUI();
    swatchEl._ncpSetColor=(newHex)=>{hex=newHex;hsv=NoomaPicker.hexToHsv(hex);updateUI();};
    swatchEl._ncpGetColor=()=>hex;
    return swatchEl;
  }
};

// Helper: criar swatch div que substitui input[type=color]
function makeColorSwatch(containerId, initialColor, onChange){
  const container=document.getElementById(containerId);if(!container)return;
  const swatch=document.createElement('div');
  swatch.className='ncp-swatch';
  swatch.style.background=initialColor||'#edf252';
  container.appendChild(swatch);
  NoomaPicker.create(swatch,initialColor,onChange);
  return swatch;
}

// Biblioteca de icones (ICON_SET, renderIcon, openIconPicker, makeIconPickerButton) agora vive em icons.js




// ================================================================
// I18N — Sistema de internacionalizacao
// ================================================================
// Sistema de traducao (I18N, t, setLang, applyI18n etc.) agora vive em i18n.js

updateLangButtonsActive();
updateLangHdrActive();



// \u2500\u2500\u2500 Constants \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// ================================================================
// SEGURANCA: neutralizar texto digitado pelo usuario antes de exibir
// ================================================================
// Qualquer texto que uma pessoa digita (nome de cliente, titulo de
// projeto, anotacoes, nome de workspace, etc.) passa por aqui antes
// de ser inserido na tela. Sem isso, alguem poderia digitar algo como
// "<script>...</script>" num campo de texto e esse codigo rodaria de
// verdade na tela de QUALQUER pessoa que visse aquele dado depois --
// inclusive outros membros do mesmo workspace. Isso e conhecido como
// XSS (Cross-Site Scripting) e e uma das vulnerabilidades mais comuns
// e mais perigosas que existem em aplicacoes web.
const _escapeMap={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
function esc(str){
  if(str===null||str===undefined)return '';
  return String(str).replace(/[&<>"']/g,c=>_escapeMap[c]);
}

const ADMIN_EMAIL = 'kabomboombam@hotmail.com';
// MONTHS/DAYS agora declarados no bloco i18n (topo do arquivo) e preenchidos por rebuildLocaleArrays()
const MIN_Y=2026,MIN_M=7,MAX_Y=2032,MAX_M=12;
const FIREBASE_CONFIG={apiKey:'AIzaSyASbEQ2oZd5uWtIGdl5iE_hvzL5_9k5k68',authDomain:'calendario-agencia.firebaseapp.com',projectId:'calendario-agencia',storageBucket:'calendario-agencia.firebasestorage.app',messagingSenderId:'449749401473',appId:'1:449749401473:web:5814994bc306a316903280',measurementId:'G-01MR0BS7D6'};
const DEFAULT_CONTENT_TYPES=[
  {id:'Reels',    name:'Reels',    label:'REELS',    icon:'video', bgColor:'#ff4444',textColor:'#fff',order:0},
  {id:'Feed',     name:'Feed',     label:'FEED',     icon:'image', bgColor:'#2ed573',textColor:'#fff',order:1},
  {id:'Carrossel',name:'Carrossel',label:'CARROSSEL',icon:'layers',bgColor:'#74b9ff',textColor:'#fff',order:2},
  {id:'Foto',     name:'Foto',     label:'FOTO',     icon:'camera',bgColor:'#ffa502',textColor:'#fff',order:3},
];
const DEFAULT_STATUSES=[
  {id:'draft',    name:'Rascunho',          icon:'edit',        color:'#888888',order:0},
  {id:'review',   name:'Revis\u00E3o do Cliente',icon:'eye',   color:'#ffa502',order:1},
  {id:'approved', name:'Aprovado',          icon:'check-circle',color:'#2ed573',order:2},
  {id:'scheduled',name:'Agendado',          icon:'calendar',    color:'#74b9ff',order:3},
  {id:'published',name:'Publicado',         icon:'rocket',      color:'#edf252',order:4},
];
const DEFAULT_PLATFORMS=[
  {id:'instagram',name:'Instagram',icon:'instagram',color:'#E1306C',order:0},
  {id:'youtube',  name:'YouTube',  icon:'youtube',  color:'#FF0000',order:1},
  {id:'tiktok',   name:'TikTok',   icon:'music',    color:'#FF0050',order:2},
];
const PLATFORM_BEST_TIMES={instagram:['09:00','12:00','19:00'],youtube:['15:00','17:00','20:00'],tiktok:['07:00','15:00','21:00']};

// NOTIF_MESSAGES_ALL e NOTIF_MESSAGES agora vivem em i18n.js



// \u2500\u2500\u2500 State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let fbApp,auth,db,currentUser=null;
let unsubClients=null,unsubPosts=null,unsubCT=null,unsubST=null,unsubPlat=null,unsubWorkspaces=null,unsubProjects=null;
const pendingListeners={};
let clientDdOpen=false,platDdOpen=false,pendingLogoBase64=null;
let heatmapActive=false;
let chartsActive=false;
let currentView='month';
let sidebarOpen=false,sidebarCollapsed=false;
let deferredPwaPrompt=null;
let notifCheckInterval=null;
let authKillTimer=null;

const state={
  year:2026,month:7,weekOffset:0,
  clients:[],posts:{},
  contentTypes:[...DEFAULT_CONTENT_TYPES],
  postStatuses:[...DEFAULT_STATUSES],
  platforms:[...DEFAULT_PLATFORMS],
  filterClientId:null,filterContentType:null,filterPlatform:null,filterStatus:null,
  currentWorkspace:null,userWorkspaces:[],
  form:{selectedClients:[],selectedType:null,status:'draft',scheduledTime:'',platform:''},
  notifications:[],
};

// \u2500\u2500\u2500 Utilities \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dk=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const getC=id=>state.clients.find(c=>c.id===id);
const getCT=id=>{if(!id)return null;return state.contentTypes.find(t=>t.id===id)||state.contentTypes.find(t=>t.name===id)||state.contentTypes.find(t=>t.id.toLowerCase()===id.toLowerCase());};
const getST=id=>state.postStatuses.find(s=>s.id===id)||state.postStatuses[0];
const getPlat=id=>state.platforms.find(p=>p.id===id);
const fmtDate=d=>d.toISOString().slice(0,10);
const generateCode=()=>{
  // Gerador criptograficamente seguro (crypto.getRandomValues), em vez de
  // Math.random() -- que nao e adequado para nada relacionado a seguranca,
  // mesmo que o espaco de combinacoes ja fosse grande.
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I para evitar confusao ao digitar
  const bytes=new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes,b=>chars[b%chars.length]).join('');
};
const buildGradient=cs=>!cs.length?'transparent':cs.length===1?cs[0]:`linear-gradient(90deg,${cs.map((c,i)=>`${c} ${i*100/cs.length}%,${c} ${(i+1)*100/cs.length}%`).join(',')})`;
let _tt=null;
function toast(msg,dur=2800){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');if(_tt)clearTimeout(_tt);_tt=setTimeout(()=>el.classList.remove('show'),dur);}
function relativeTime(ts){if(!ts)return'nunca';const d=ts.seconds?new Date(ts.seconds*1000):new Date(ts);const diff=Math.floor((Date.now()-d)/1000);if(diff<60)return'agora';if(diff<3600)return`${Math.floor(diff/60)} min atr\u00E1s`;if(diff<86400)return`${Math.floor(diff/3600)}h atr\u00E1s`;if(diff<2592000)return`${Math.floor(diff/86400)} dias atr\u00E1s`;return d.toLocaleDateString('pt-BR');}

// \u2500\u2500\u2500 Screen \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function showScreen(id){
  ['screenLoading','screenSetup','screenLogin','screenApp'].forEach(s=>{
    const el=document.getElementById(s);if(!el)return;
    el.style.display=(s===id)?'flex':'none';
    if(s===id)el.style.flexDirection='column';
  });
}

// \u2500\u2500\u2500 LocalStorage \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function saveNav(){localStorage.setItem('nooma_nav',JSON.stringify({y:state.year,m:state.month,view:currentView}));}
function loadNav(){try{const o=JSON.parse(localStorage.getItem('nooma_nav')||'{}');if(o.y){state.year=o.y;state.month=o.m;}if(o.view)currentView=o.view;}catch(e){}}


// \u2500\u2500\u2500 Data Path \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function dataRoot(){return state.currentWorkspace?`workspaces/${state.currentWorkspace.id}`:`users/${currentUser.uid}`;}
function canEdit(){if(!state.currentWorkspace)return true;return['owner','editor'].includes(state.currentWorkspace.role);}


// \u2500\u2500\u2500 Utilities extras \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const isMobile=()=>window.innerWidth<=768;

// \u2500\u2500\u2500 VIEW SWITCHING \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function setView(v){
  currentView=v;
  document.querySelectorAll('.view-btn').forEach(b=>{b.classList.toggle('active',b.dataset.view===v);});
  const vm=document.getElementById('viewMonth');if(vm)vm.style.display=v==='month'?'block':'none';
  const vw=document.getElementById('viewWeek');if(vw){vw.style.display=v==='week'?'flex':'none';vw.classList.toggle('active',v==='week');}
  const vl=document.getElementById('viewList');if(vl){vl.style.display=v==='list'?'block':'none';vl.classList.toggle('active',v==='list');}
  const bp=document.getElementById('btnPrev'),bn=document.getElementById('btnNext');
  if(bp)bp.style.display=v==='list'?'none':'flex';if(bn)bn.style.display=v==='list'?'none':'flex';
  renderCurrentView();saveNav();
}
function renderCurrentView(){
  if(currentView==='month')renderCalendar();
  else if(currentView==='week')renderWeekView();
  else if(currentView==='list')renderListView();
}
document.querySelectorAll('.view-btn').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

// \u2500\u2500\u2500 SIDEBAR TOGGLE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let projRailMobileOpen=false;
function closeProjRailMobile(){
  const rail=document.getElementById('projRail');
  const overlay=document.getElementById('projRailOverlay');
  projRailMobileOpen=false;
  if(rail){
    rail.classList.remove('mobile-open');
    rail.style.transform='translateX(-100%)';
  }
  overlay?.classList.remove('open');
}
function openProjRailMobile(){
  const rail=document.getElementById('projRail');
  const overlay=document.getElementById('projRailOverlay');
  projRailMobileOpen=true;
  if(rail){
    rail.style.cssText='display:flex!important;flex-direction:column;position:fixed;top:0;left:0;bottom:0;width:240px;z-index:250;box-shadow:0 0 40px rgba(0,0,0,0.6);padding-top:calc(14px + env(safe-area-inset-top));transform:translateX(0);transition:transform 0.28s cubic-bezier(0.4,0,0.2,1);background:var(--bg);overflow-y:auto;';
    rail.classList.add('mobile-open');
  }
  overlay?.classList.add('open');
}
function toggleSidebar(){
  if(currentAppTab==='projects'){
    // Na aba Projetos, o botao de menu controla a coluna de Status/Servicos (proj-rail)
    if(projRailMobileOpen)closeProjRailMobile();else openProjRailMobile();
    return;
  }
  if(isMobile()){sidebarOpen=!sidebarOpen;document.getElementById('sidebar')?.classList.toggle('open',sidebarOpen);document.getElementById('sidebarOverlay')?.classList.toggle('open',sidebarOpen);}
  else{sidebarCollapsed=!sidebarCollapsed;document.getElementById('sidebar')?.classList.toggle('collapsed',sidebarCollapsed);}
}
document.getElementById('btnSidebarToggle')?.addEventListener('click',toggleSidebar);
document.getElementById('projRailOverlay')?.addEventListener('click',closeProjRailMobile);
document.getElementById('sidebarOverlay')?.addEventListener('click',()=>{sidebarOpen=false;document.getElementById('sidebar')?.classList.remove('open');document.getElementById('sidebarOverlay')?.classList.remove('open');});

// \u2500\u2500\u2500 HEATMAP \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function toggleHeatmap(){
  heatmapActive=!heatmapActive;
  document.getElementById('heatmapToggleBtn')?.classList.toggle('active',heatmapActive);
  document.getElementById('heatmapLegend')?.classList.toggle('show',heatmapActive);
  renderCalendar();
}
function getHeatmapColor(count,max){if(!count||!max)return null;const ratio=count/max;const r=Math.round(255*Math.min(ratio*2,1));const g=Math.round(255*(1-Math.max(ratio*2-1,0)));return`rgba(${r},${g},0,${0.15+ratio*0.35})`;}

// \u2500\u2500\u2500 WEEK VIEW \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function getWeekDates(){
  const today=new Date();const ref=today.getFullYear()===state.year&&today.getMonth()+1===state.month?today:new Date(state.year,state.month-1,1);
  const sun=new Date(ref);sun.setDate(ref.getDate()-ref.getDay()+state.weekOffset*7);
  return Array.from({length:7},(_,i)=>{const d=new Date(sun);d.setDate(sun.getDate()+i);return d;});
}
function renderWeekView(){
  const dates=getWeekDates();
  const todayStr=fmtDate(new Date());
  const hdr=document.getElementById('weekHeader');
  const cols=document.getElementById('weekCols');
  if(!hdr||!cols)return;
  // Update month label
  const lbl=document.getElementById('monthLbl');
  if(lbl){
    const f=dates[0],la=dates[6];
    if(f.getMonth()===la.getMonth())lbl.innerHTML=`${MONTHS[f.getMonth()]} <em>${f.getFullYear()}</em>`;
    else lbl.innerHTML=`${MONTHS[f.getMonth()].slice(0,3)}\u2013${MONTHS[la.getMonth()].slice(0,3)} <em>${la.getFullYear()}</em>`;
  }
  // Header row
  hdr.innerHTML=dates.map(d=>{
    const key=fmtDate(d);const isT=key===todayStr;
    return`<div class="week-day-hdr${isT?' today-col':''}">
      <div class="week-day-name">${DAYS[d.getDay()].slice(0,3).toUpperCase()}</div>
      <div class="week-day-num">${d.getDate()}</div>
    </div>`;
  }).join('');
  // Columns
  cols.innerHTML=dates.map(d=>{
    const key=fmtDate(d);const isT=key===todayStr;
    let posts=state.posts[key]||[];
    if(state.filterClientId)posts=posts.filter(p=>p.clientId===state.filterClientId);
    if(state.filterContentType)posts=posts.filter(p=>p.contentType===state.filterContentType||getCT(p.contentType)?.id===state.filterContentType);
    if(state.filterPlatform)posts=posts.filter(p=>p.platform===state.filterPlatform);
    if(state.filterStatus)posts=posts.filter(p=>(p.status||'draft')===state.filterStatus);
    const cards=posts.map(p=>{
      const cl=getC(p.clientId);if(!cl)return'';
      const ct=getCT(p.contentType);const st=getST(p.status||'draft');const plat=getPlat(p.platform);
      return`<div class="week-post-card" style="background:${cl.color}" data-key="${key}" data-pid="${p.id}">
        <div class="week-post-name">${esc(cl.name)}</div>
        <div class="week-post-meta">
          <span>${ct?renderIcon(ct.icon,11)+' '+ct.label:''}</span>
          ${p.scheduledTime?`<span style="margin-left:auto">\uD83D\uDD50${p.scheduledTime}</span>`:`<span style="margin-left:auto">${renderIcon(st.icon,13)}</span>`}
        </div>
        ${p.note?`<div class="week-post-note">${p.note.slice(0,40)}</div>`:''}
      </div>`;
    }).join('');
    return`<div class="week-col${isT?' today-col':''}" data-key="${key}">
      ${cards||'<div class="week-empty">Sem posts</div>'}
      <div class="week-add-hint">+ Adicionar</div>
    </div>`;
  }).join('');
  // Events
  cols.querySelectorAll('.week-col').forEach(col=>{
    col.addEventListener('click',e=>{
      if(e.target.closest('.week-post-card'))return;
      const[y,m,d]=col.dataset.key.split('-').map(Number);openDayModal(y,m,d);
    });
  });
  cols.querySelectorAll('.week-post-card').forEach(card=>{
    card.addEventListener('click',e=>{
      e.stopPropagation();
      const[y,m,d]=card.dataset.key.split('-').map(Number);openDayModal(y,m,d);
    });
  });
}

function renderListView(){
  const el=document.getElementById('listContent');if(!el)return;
  const lbl=document.getElementById('monthLbl');if(lbl)lbl.innerHTML='Todos os Posts';
  const allPosts=[];Object.entries(state.posts).forEach(([key,arr])=>{arr.forEach(p=>{allPosts.push({...p,dateKey:key});});});
  let filtered=allPosts;
  if(state.filterClientId)filtered=filtered.filter(p=>p.clientId===state.filterClientId);
  if(state.filterContentType)filtered=filtered.filter(p=>p.contentType===state.filterContentType);
  if(state.filterPlatform)filtered=filtered.filter(p=>p.platform===state.filterPlatform);
  if(state.filterStatus)filtered=filtered.filter(p=>(p.status||'draft')===state.filterStatus);
  filtered.sort((a,b)=>a.dateKey.localeCompare(b.dateKey));
  if(!filtered.length){el.innerHTML='<div class="list-empty">\uD83D\uDCED Nenhum post encontrado</div>';return;}
  const todayStr=fmtDate(new Date());
  const byMonth={};filtered.forEach(p=>{const mk=p.dateKey.slice(0,7);if(!byMonth[mk])byMonth[mk]=[];byMonth[mk].push(p);});
  let html='';
  Object.entries(byMonth).sort(([a],[b])=>a.localeCompare(b)).forEach(([mk,posts])=>{
    const[y,m]=mk.split('-').map(Number);
    const byDay={};posts.forEach(p=>{if(!byDay[p.dateKey])byDay[p.dateKey]=[];byDay[p.dateKey].push(p);});
    let dayHtml='';
    Object.entries(byDay).sort(([a],[b])=>a.localeCompare(b)).forEach(([key,dayPosts])=>{
      const[dy,dm,dd]=key.split('-').map(Number);const isToday=key===todayStr;const dow=new Date(dy,dm-1,dd).getDay();
      dayHtml+=`<div class="list-day-group"><div class="list-day-hdr${isToday?' today-hdr':''}"><span class="list-day-dot"></span><span class="list-day-label">${DAYS[dow]}, ${dd}${isToday?' \u00B7 Hoje':''}</span></div>`;
      dayPosts.forEach(p=>{
        const cl=getC(p.clientId);if(!cl)return;const ct=getCT(p.contentType);const st=getST(p.status||'draft');const plat=getPlat(p.platform);
        dayHtml+=`<div class="list-post-row" data-key="${key}"><span class="list-post-color" style="background:${cl.color}"></span><div class="list-post-info"><div class="list-post-client">${esc(cl.name)}</div><div class="list-post-meta">${ct?`<span class="list-badge" style="background:${ct.bgColor}20;color:${ct.bgColor}">${renderIcon(ct.icon,13)} ${esc(ct.label)}</span>`:''} ${plat?`<span class="list-badge" style="background:${plat.color}20;color:${plat.color}">${renderIcon(plat.icon,13)} ${esc(plat.name)}</span>`:''} <span class="list-badge" style="background:${st.color}18;color:${st.color}">${renderIcon(st.icon,13)} ${esc(st.name)}</span>${p.scheduledTime?` <span>\uD83D\uDD50 ${p.scheduledTime}</span>`:''}</div>${p.note?`<div class="list-post-note">\uD83D\uDCAC ${esc(p.note)}</div>`:''}</div><div class="list-post-time">${isToday?'Hoje':''}</div></div>`;
      });
      dayHtml+='</div>';
    });
    html+=`<div class="list-month-group"><div class="list-month-hdr">${MONTHS[m-1]} ${y} <span class="list-month-count">(${posts.length} posts)</span></div>${dayHtml}</div>`;
  });
  el.innerHTML=html;
  el.querySelectorAll('.list-post-row').forEach(row=>{row.addEventListener('click',()=>{const[y,m,d]=row.dataset.key.split('-').map(Number);openDayModal(y,m,d);});});
}

// \u2500\u2500\u2500 NOTIFICATIONS \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function getStoredNotifs(){try{return JSON.parse(localStorage.getItem('nooma_notifs')||'[]');}catch{return[];}}
function saveNotifs(notifs){localStorage.setItem('nooma_notifs',JSON.stringify(notifs.slice(0,100)));}

// ================================================================
// NOTIFICACOES DE ATRIBUICAO DE RESPONSAVEL (entre membros do workspace)
// ================================================================
async function notifyProjectAssignment(toUid,proj){
  if(!db||!state.currentWorkspace||!toUid)return;
  try{
    const ref=doc(collection(db,'workspaces',state.currentWorkspace.id,'notifications'));
    await setDoc(ref,{
      forUid:toUid,
      type:'project_assigned',
      projectId:proj.id,
      projectTitle:proj.title,
      fromUid:currentUser.uid,
      fromName:currentUser.displayName||currentUser.email||'',
      createdAt:Date.now(),
      read:false,
    });
  }catch(e){console.error('Erro ao notificar responsavel:',e);}
}

let unsubAssignNotifs=null;
function setupAssignmentNotifListener(){
  if(unsubAssignNotifs){unsubAssignNotifs();unsubAssignNotifs=null;}
  if(!db||!state.currentWorkspace||!currentUser)return;
  const q=query(
    collection(db,'workspaces',state.currentWorkspace.id,'notifications'),
    where('forUid','==',currentUser.uid)
  );
  unsubAssignNotifs=onSnapshot(q,snap=>{
    snap.docChanges().forEach(change=>{
      if(change.type==='removed')return;
      const n=change.doc.data();
      if(n.read)return;
      addNotif({
        key:`proj_assign_${change.doc.id}`,
        icon:'\uD83D\uDCBC',
        bg:'rgba(237,242,82,0.12)',
        title:t('notif.assignedTitle'),
        body:t('notif.assignedBody',{name:n.fromName,project:n.projectTitle}),
        actions:[{label:t('notif.viewProject'),act:'view_project',primary:true,projectId:n.projectId,notifDocId:change.doc.id}],
      });
    });
  },e=>console.warn('assignment notifs:',e.message));
}
async function markAssignmentNotifRead(notifDocId){
  if(!db||!state.currentWorkspace||!notifDocId)return;
  try{await updateDoc(doc(db,'workspaces',state.currentWorkspace.id,'notifications',notifDocId),{read:true});}catch(e){}
}

function addNotif(n){const notifs=getStoredNotifs();if(n.key&&notifs.some(x=>x.key===n.key))return;notifs.unshift({id:uid(),createdAt:Date.now(),read:false,...n});saveNotifs(notifs);renderNotifCenter();updateNotifBell();}
function markAllRead(){const notifs=getStoredNotifs();notifs.forEach(n=>n.read=true);saveNotifs(notifs);renderNotifCenter();updateNotifBell();}
function updateNotifBell(){const notifs=getStoredNotifs();const unread=notifs.filter(n=>!n.read).length;const bell=document.getElementById('btnNotifCenter');const badge=document.getElementById('notifBellBadge');if(bell)bell.classList.toggle('has-unread',unread>0);if(badge){badge.style.display=unread>0?'flex':'none';badge.textContent=unread>9?'9+':unread;}}
function renderNotifCenter(){
  const el=document.getElementById('notifList');if(!el)return;
  const notifs=getStoredNotifs();
  if(!notifs.length){el.innerHTML='<div class="notif-empty">\uD83C\uDF89 Tudo em dia!</div>';return;}
  el.innerHTML=notifs.map(n=>`<div class="notif-item${n.read?'':' unread'}" data-nid="${n.id}">${!n.read?'<span class="notif-unread-dot"></span>':''}<div class="notif-icon" style="background:${n.bg||'rgba(237,242,82,0.1)'}">${n.icon||'\uD83D\uDD14'}</div><div class="notif-content"><div class="notif-title">${esc(n.title)}</div><div class="notif-body">${esc(n.body)}</div><div class="notif-time">${relativeTime({seconds:Math.floor(n.createdAt/1000)})}</div>${n.actions?`<div class="notif-action">${n.actions.map(a=>`<button class="notif-btn ${a.primary?'notif-btn-primary':'notif-btn-secondary'}" data-act="${a.act}" data-project-id="${a.projectId||''}" data-notif-doc-id="${a.notifDocId||''}" data-date-key="${a.dateKey||''}">${a.label}</button>`).join('')}</div>`:''}</div></div>`).join('');
  el.querySelectorAll('.notif-item').forEach(item=>{
    item.addEventListener('click',e=>{if(e.target.matches('.notif-btn'))return;const nfs=getStoredNotifs();const n=nfs.find(x=>x.id===item.dataset.nid);if(n)n.read=true;saveNotifs(nfs);item.classList.remove('unread');item.querySelector('.notif-unread-dot')?.remove();updateNotifBell();});
    item.querySelectorAll('.notif-btn').forEach(btn=>{btn.addEventListener('click',()=>{const nfs=getStoredNotifs();const n=nfs.find(x=>x.id===item.dataset.nid);if(n)n.read=true;saveNotifs(nfs);if(btn.dataset.act==='open_ws_settings')openWsSettings();
              else if(btn.dataset.act==='view_calendar'){
                closeNotifCenter();
                if(currentAppTab!=='calendar')switchAppTab('calendar');
                setView('month');
                if(btn.dataset.dateKey){
                  const[yy,mm,dd]=btn.dataset.dateKey.split('-').map(Number);
                  state.year=yy;state.month=mm;
                  renderCalendar();
                  openDayModal(yy,mm,dd);
                }
              }
              else if(btn.dataset.act==='view_project'){
                closeNotifCenter();
                if(btn.dataset.notifDocId)markAssignmentNotifRead(btn.dataset.notifDocId);
                if(currentAppTab!=='projects')switchAppTab('projects');
                if(btn.dataset.projectId&&projState.projects.some(p=>p.id===btn.dataset.projectId))openProjModal(btn.dataset.projectId);
              }renderNotifCenter();updateNotifBell();});});
  });
}
function openNotifCenter(){document.getElementById('notifCenter')?.classList.add('open');document.getElementById('notifCenterOverlay')?.classList.add('open');renderNotifCenter();}
function closeNotifCenter(){document.getElementById('notifCenter')?.classList.remove('open');document.getElementById('notifCenterOverlay')?.classList.remove('open');}
document.getElementById('btnNotifCenter')?.addEventListener('click',openNotifCenter);
document.getElementById('btnCloseNotifCenter')?.addEventListener('click',closeNotifCenter);
document.getElementById('notifCenterOverlay')?.addEventListener('click',closeNotifCenter);
document.getElementById('btnMarkAllRead')?.addEventListener('click',()=>{markAllRead();toast(t('t.allRead'));});

// \u2500\u2500\u2500 NOTIFICATION CHECKER \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function checkNotifications(){
  if(!currentUser||!state.posts)return;
  const now=Date.now();const today=fmtDate(new Date());
  const allPosts=[];Object.entries(state.posts).forEach(([key,arr])=>{arr.forEach(p=>{allPosts.push({...p,dateKey:key});});});
  allPosts.forEach(p=>{
    const cl=getC(p.clientId);if(!cl)return;
    const postDate=new Date(p.dateKey+'T12:00:00');const daysDiff=Math.floor((now-postDate.getTime())/86400000);
    const note=p.note?`"${p.note.slice(0,28)}${p.note.length>28?'...':''}"`:cl.name;
    if((p.status||'draft')==='draft'&&daysDiff>=1){const msgs=NOTIF_MESSAGES.draft_reminder;const msg=msgs[Math.floor(Math.random()*msgs.length)];addNotif({key:`draft_${p.id}_${p.dateKey}`,icon:'\uD83D\uDCDD',bg:'rgba(136,136,136,0.15)',title:'Rascunho pendente',body:msg.replace('{client}',cl.name).replace('{note}',note).replace('{days}',daysDiff).replace('{date}',p.dateKey),actions:[{label:'Ver calend\u00E1rio',act:'view_calendar',primary:true,dateKey:p.dateKey}]});}
    if(p.status==='approved'&&daysDiff>=1){const msgs=NOTIF_MESSAGES.approved_reminder;const msg=msgs[Math.floor(Math.random()*msgs.length)];addNotif({key:`approved_${p.id}_${p.dateKey}`,icon:'\u2705',bg:'rgba(46,213,115,0.1)',title:'Post aprovado aguardando',body:msg.replace('{client}',cl.name).replace('{note}',note).replace('{days}',daysDiff),actions:[{label:'Abrir calend\u00E1rio',act:'view_calendar',primary:true,dateKey:p.dateKey}]});}
    if(p.status==='scheduled'&&p.dateKey===today&&p.scheduledTime){const[h]=p.scheduledTime.split(':').map(Number);const nowD=new Date();if(nowD.getHours()>=h&&nowD.getHours()<=h+1){const msgs=NOTIF_MESSAGES.scheduled_reminder;const msg=msgs[Math.floor(Math.random()*msgs.length)];addNotif({key:`sched_${p.id}_${today}`,icon:'\uD83D\uDE80',bg:'rgba(116,185,255,0.15)',title:'Hora de publicar!',body:msg.replace('{client}',cl.name).replace('{time}',p.scheduledTime),actions:[{label:'Confirmar publica\u00E7\u00E3o',act:'view_calendar',primary:true,dateKey:p.dateKey}]});}}
  });
  state.userWorkspaces.filter(w=>w.ownerId===currentUser.uid&&(w.pendingCount||0)>0).forEach(ws=>{(ws.pendingList||[]).forEach(req=>{addNotif({key:`join_${req.uid}_${ws.id}`,icon:'\uD83D\uDD14',bg:'rgba(255,165,2,0.1)',title:'Solicita\u00E7\u00E3o de entrada',body:NOTIF_MESSAGES.workspace_join[0].replace('{name}',req.displayName).replace('{workspace}',ws.name),actions:[{label:'Ver solicita\u00E7\u00F5es',act:'open_ws_settings',primary:true}]});});});
}

// \u2500\u2500\u2500 SEARCH \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openSearch(){document.getElementById('searchOverlay')?.classList.add('open');document.getElementById('searchInput')?.focus();document.getElementById('searchInput').value='';document.getElementById('searchResults').innerHTML='<div class="search-hint">Digite para buscar em todo o calend\u00E1rio</div>';}
function closeSearch(){document.getElementById('searchOverlay')?.classList.remove('open');}
function doSearch(q){
  const el=document.getElementById('searchResults');if(!el)return;q=q.trim().toLowerCase();
  if(!q){el.innerHTML='<div class="search-hint">Digite para buscar em todo o calend\u00E1rio</div>';return;}
  const results=[];
  Object.entries(state.posts).forEach(([key,arr])=>{arr.forEach(p=>{const cl=getC(p.clientId);if(!cl)return;const ct=getCT(p.contentType);const st=getST(p.status||'draft');if([cl.name,p.note||'',key,ct?.name||'',st.name].join(' ').toLowerCase().includes(q))results.push({...p,dateKey:key,cl,ct,st});});});
  results.sort((a,b)=>b.dateKey.localeCompare(a.dateKey));
  if(!results.length){el.innerHTML='<div class="search-no-results">\uD83D\uDE15 Nenhum resultado</div>';return;}
  el.innerHTML=results.slice(0,30).map(r=>{const[y,m,d]=r.dateKey.split('-').map(Number);const dow=new Date(y,m-1,d).getDay();return`<div class="search-result-item" data-key="${r.dateKey}"><span class="search-result-dot" style="background:${r.cl.color}"></span><div class="search-result-info"><div class="search-result-name">${esc(r.cl.name)}</div><div class="search-result-meta">${r.ct?renderIcon(r.ct.icon,12)+' '+esc(r.ct.label):''} \u00B7 ${renderIcon(r.st.icon,12)} ${esc(r.st.name)}${r.note?' \u00B7 '+esc(r.note.slice(0,35)):''}</div></div><div class="search-result-date">${DAYS[dow].slice(0,3)}, ${d} ${MONTHS[m-1].slice(0,3)}</div></div>`;}).join('');
  el.querySelectorAll('.search-result-item').forEach(item=>{item.addEventListener('click',()=>{const[y,m,d]=item.dataset.key.split('-').map(Number);closeSearch();setView('month');state.year=y;state.month=m;renderAll();setTimeout(()=>openDayModal(y,m,d),100);});});
}
document.getElementById('btnSearch')?.addEventListener('click',openSearch);
document.getElementById('btnSearchClose')?.addEventListener('click',closeSearch);
document.getElementById('searchOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeSearch();});
document.getElementById('searchInput')?.addEventListener('input',e=>doSearch(e.target.value));

// \u2500\u2500\u2500 ONBOARDING WIZARD \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// \u2500\u2500\u2500 Projetos  -  Constantes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const PROJ_STATUSES = [
  {id:'contato',    label:'Contato',     color:'#a29bfe', icon:'send'},
  {id:'proposta',   label:'Proposta',    color:'#74b9ff', icon:'user'},
  {id:'producao',   label:'Em Produ\u00E7\u00E3o', color:'#fdcb6e', icon:'zap'},
  {id:'revisao',    label:'Revis\u00E3o',     color:'#e17055', icon:'refresh-cw'},
  {id:'entregue',   label:'Entregue',    color:'#00b894', icon:'package'},
  {id:'concluido',  label:'Conclu\u00EDdo',   color:'#2ed573', icon:'check-circle'},
  {id:'cancelado',  label:'Cancelado',   color:'#636e72', icon:'x-circle'},
];

const PROJ_SERVICES = [
  'Social Media','V\u00EDdeo (Reels/YT)','Fotografia','Tr\u00E1fego Pago',
  'Desenvolvimento de Sites','Edi\u00E7\u00E3o de V\u00EDdeo','Design Gr\u00E1fico',
  'Cobertura de Eventos','Identidade Visual','Consultoria',
];

const PROJ_PRIORITY = {
  high:   {label:'Alta',   color:'#ff4d4d', icon:'flag'},
  normal: {label:'Normal', color:'#ffa502', icon:'flag'},
  low:    {label:'Baixa',  color:'#2ed573', icon:'flag'},
};

// \u2500\u2500\u2500 Projetos  -  Estado \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let projState = {
  projects: [],
  filterStatus: 'all',
  filterService: null,
  showCompleted: false,
  syncWithCalendarMonth: false,
  searchQuery: '',
  sortBy: 'deadline',
  editingId: null,
  editChecklist: [],
  editParcelas: [],
  editOwners: [],
  customStatuses: [],
  _selClientId: null,
  _selStatus: 'contato',
  _selPriority: 'normal',
  _selPayMode: '5050',
};

let taskState = {
  tasks: [],
  showDone: true,
  searchQuery: '',
  editingId: null,
  editChecklist: [],
  _selPriority: 'normal',
  _selDueDate: '',
};

// WIZARD_STEPS_ALL e WIZARD_STEPS agora vivem em i18n.js

let wizardStep=0,wizardData={clientName:'',clientColor:'#edf252',platforms:[]};
function showWizard(){if(localStorage.getItem('nooma_wizard_done'))return;document.getElementById('wizardOverlay').style.display='flex';renderWizardStep();}
function renderWizardStep(){
  const step=WIZARD_STEPS[wizardStep];
  document.getElementById('wizardDots').innerHTML=WIZARD_STEPS.map((_,i)=>`<div class="wizard-dot${i===wizardStep?' active':''}"></div>`).join('');
  const isLast=wizardStep===WIZARD_STEPS.length-1;
  let fieldsHtml='';
  step.fields.forEach(f=>{
    if(f.type==='info')fieldsHtml+=`<div style="padding:14px;border-radius:10px;background:var(--accent-low);border:1px solid rgba(237,242,82,0.2);font-size:12px;color:var(--muted);line-height:1.7">${f.text}</div>`;
    if(f.type==='client_wizard')fieldsHtml+=`<div class="wizard-field"><label class="wizard-label">Nome do cliente</label><input class="wizard-input" id="wizardClientName" type="text" placeholder="${f.placeholder}" value="${wizardData.clientName}"/><div style="display:flex;align-items:center;gap:8px;margin-top:8px"><div style="width:32px;height:32px;border-radius:8px;border:2px solid var(--border);position:relative;overflow:hidden"><input type="color" id="wizardClientColor" value="${wizardData.clientColor}" style="position:absolute;inset:-4px;width:150%;height:150%;opacity:0;cursor:pointer"/></div><div id="wizardColorPreview" style="width:32px;height:32px;border-radius:8px;background:${wizardData.clientColor};border:2px solid rgba(255,255,255,0.2)"></div><span style="font-size:11px;color:var(--muted)">Cor do cliente</span></div></div>`;
    if(f.type==='platform_picker')fieldsHtml+=`<div class="wizard-field"><label class="wizard-label">Plataformas</label><div class="wizard-chips">${f.options.map(o=>`<div class="wizard-chip${wizardData.platforms.includes(o)?' sel':''}" data-plat="${o}">${o}</div>`).join('')}</div></div>`;
    if(f.type==='feature_list')fieldsHtml+=`<div class="wizard-feature-list">${f.items.map(it=>`<div class="wizard-feature-item"><div class="wizard-feature-icon">${renderIcon(it.icon,18)}</div><div class="wizard-feature-text"><div class="wizard-feature-title">${it.title}</div><div class="wizard-feature-desc">${it.desc}</div></div></div>`).join('')}</div>`;
  });
  document.getElementById('wizardContent').innerHTML=`<div class="wizard-icon">${step.icon}</div><div class="wizard-title">${step.title}</div><div class="wizard-sub">${step.sub}</div>${fieldsHtml}<div class="wizard-actions">${wizardStep>0?'<button class="btn-wizard-skip" id="btnWizardSkip">Pular</button>':''}<button class="btn-wizard-next" id="btnWizardNext">${isLast?'Come\u00E7ar! \uD83D\uDE80':wizardStep===0?'Vamos l\u00E1!':'Pr\u00F3ximo \u2192'}</button></div>`;
  document.getElementById('btnWizardNext')?.addEventListener('click',wizardNext);
  document.getElementById('btnWizardSkip')?.addEventListener('click',wizardSkip);
  document.getElementById('wizardClientName')?.addEventListener('input',e=>{wizardData.clientName=e.target.value;});
  document.getElementById('wizardClientColor')?.addEventListener('input',e=>{wizardData.clientColor=e.target.value;document.getElementById('wizardColorPreview').style.background=e.target.value;});
  document.querySelectorAll('.wizard-chip').forEach(chip=>{chip.addEventListener('click',()=>{const p=chip.dataset.plat;const idx=wizardData.platforms.indexOf(p);if(idx>=0)wizardData.platforms.splice(idx,1);else wizardData.platforms.push(p);chip.classList.toggle('sel',wizardData.platforms.includes(p));});});
}
async function wizardNext(){
  if(wizardStep===1&&wizardData.clientName.trim()){const cl={id:uid(),name:wizardData.clientName.trim(),color:wizardData.clientColor,order:state.clients.length};state.clients.push(cl);await saveClient(cl);}
  if(wizardStep===2&&wizardData.platforms.length){
    const exist=state.platforms.map(p=>p.name);const toAdd=wizardData.platforms.filter(p=>!exist.includes(p));
    const iconMap={'Instagram':'\uD83D\uDCF8','YouTube':'\u25B6\uFE0F','TikTok':'\uD83C\uDFB5','Facebook':'\uD83D\uDC64','LinkedIn':'\uD83D\uDCBC','Twitter/X':'\uD83D\uDC26','Pinterest':'\uD83D\uDCCC','Kwai':'\uD83C\uDFAC'};
    const colorMap={'Instagram':'#E1306C','YouTube':'#FF0000','TikTok':'#FF0050','Facebook':'#1877F2','LinkedIn':'#0A66C2','Twitter/X':'#1DA1F2','Pinterest':'#E60023','Kwai':'#FF6200'};
    for(const p of toAdd){const plat={id:uid(),name:p,icon:iconMap[p]||'\uD83D\uDCF1',color:colorMap[p]||'#888',order:state.platforms.length};state.platforms.push(plat);await savePlat(plat);}
  }
  if(wizardStep<WIZARD_STEPS.length-1){wizardStep++;renderWizardStep();}else wizardDone();
}
function wizardSkip(){if(wizardStep<WIZARD_STEPS.length-1){wizardStep++;renderWizardStep();}else wizardDone();}
function wizardDone(){localStorage.setItem('nooma_wizard_done','1');document.getElementById('wizardOverlay').style.display='none';renderAll();toast(t('t.welcome'));}

// Reabrir o wizard manualmente (botao "Ver tutorial novamente")

// ================================================================
// TEMA (claro / escuro / sistema) -- padrao escuro
// ================================================================
function resolveTheme(pref){
  if(pref==='system'){
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  return pref==='light' ? 'light' : 'dark';
}
function getThemePref(){
  return localStorage.getItem('nooma_theme') || 'dark';
}
function applyTheme(pref){
  const resolved = resolveTheme(pref);
  if(resolved==='light') document.documentElement.setAttribute('data-theme','light');
  else document.documentElement.removeAttribute('data-theme');
  const metaTheme=document.querySelector('meta[name="theme-color"]');
  if(metaTheme) metaTheme.setAttribute('content', resolved==='light' ? '#f6f6f4' : '#0d0d0d');
  document.querySelectorAll('.theme-opt-btn').forEach(btn=>{
    const isActive = btn.dataset.themePref===pref;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });
}
function setThemePref(pref){
  localStorage.setItem('nooma_theme', pref);
  applyTheme(pref);
}
// Se a pessoa escolheu "Sistema", reagir automaticamente se o SO trocar de tema
if(window.matchMedia){
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', ()=>{
    if(getThemePref()==='system') applyTheme('system');
  });
}
document.querySelectorAll('.theme-opt-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>setThemePref(btn.dataset.themePref));
});
applyTheme(getThemePref());

function replayWizard(){
  wizardStep=0;
  document.getElementById('wizardOverlay').style.display='flex';
  renderWizardStep();
}

// Botao "Ver tutorial novamente" (dentro do perfil)
document.getElementById('btnReplayWizard')?.addEventListener('click',()=>{
  closeProfileModal();
  setTimeout(replayWizard,150);
});

// Modal de Suporte / Contato
function openSupportModal(){document.getElementById('supportOverlay')?.classList.add('open');}
function closeSupportModal(){document.getElementById('supportOverlay')?.classList.remove('open');}
document.getElementById('btnOpenSupport')?.addEventListener('click',()=>{
  closeProfileModal();
  setTimeout(openSupportModal,150);
});
document.getElementById('btnCloseSupport')?.addEventListener('click',closeSupportModal);
document.getElementById('supportOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeSupportModal();});

// \u2500\u2500\u2500 PWA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPwaPrompt=e;if(!localStorage.getItem('nooma_pwa_dismissed'))setTimeout(()=>document.getElementById('pwaBanner')?.classList.add('show'),3000);});
document.getElementById('btnPwaInstall')?.addEventListener('click',async()=>{if(!deferredPwaPrompt)return;deferredPwaPrompt.prompt();const{outcome}=await deferredPwaPrompt.userChoice;if(outcome==='accepted')toast(t('t.appInstalled'));deferredPwaPrompt=null;document.getElementById('pwaBanner')?.classList.remove('show');});
document.getElementById('btnPwaDismiss')?.addEventListener('click',()=>{document.getElementById('pwaBanner')?.classList.remove('show');localStorage.setItem('nooma_pwa_dismissed','1');});

// \u2500\u2500 Header: Logout, Perfil, Workspace Switcher \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('btnLogout')?.addEventListener('click',async()=>{
  if(confirm('Sair do NOOMA Calendar?')){
    if(notifCheckInterval)clearInterval(notifCheckInterval);
    teardownListeners();
    await signOut(auth);
    showScreen('screenLogin');
  }
});

document.getElementById('userChip')?.addEventListener('click',openProfileModal);

document.getElementById('btnWsSwitcher')?.addEventListener('click',e=>{
  e.stopPropagation();
  const dd=document.getElementById('wsDropdown');
  if(dd)dd.classList.toggle('open');
});

// Fechar dropdown de workspace ao clicar fora
document.addEventListener('click',e=>{
  const dd=document.getElementById('wsDropdown');
  const btn=document.getElementById('btnWsSwitcher');
  if(dd&&dd.classList.contains('open')&&!dd.contains(e.target)&&!btn?.contains(e.target)){
    dd.classList.remove('open');
  }
});


// \u2500\u2500\u2500 Firebase Init \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function initFirebase(){
  if(fbApp)return;
  try{
    fbApp=initializeApp(FIREBASE_CONFIG);
    // getAuth() ja usa, por padrao, a cadeia de persistencia mais robusta do SDK
    // (IndexedDB -> localStorage -> sessionStorage) e configura corretamente o
    // resolver de popup/redirect necessario para signInWithRedirect funcionar.
    // (Uma tentativa anterior de chamar initializeAuth() manualmente sem o
    // resolver quebrou o login com "auth/argument-error" -- getAuth() e o
    // caminho correto e mais confiavel aqui.)
    auth=getAuth(fbApp);
    // persistentLocalCache usa IndexedDB e pode travar em alguns browsers/dispositivos
    try{
      db=initializeFirestore(fbApp,{localCache:persistentLocalCache()});
    }catch(cacheErr){
      console.warn('Cache persistente indispon\u00EDvel, usando mem\u00F3ria:',cacheErr.message);
      db=initializeFirestore(fbApp,{});
    }

    // Processar resultado do redirect (sessionPersistence garante funcionamento no iOS)
    try{
      const redirectResult=await getRedirectResult(auth);
      if(redirectResult?.user){
        const user=redirectResult.user;
        if(db){
          const snap=await getDoc(doc(db,'_users',user.uid));
          const existing=snap.exists()?snap.data():{};
          const provId=redirectResult.providerId||user.providerData?.[0]?.providerId||'';
          const prov=provId.includes('apple')?'apple':provId.includes('google')?'google':'email';
          await setDoc(doc(db,'_users',user.uid),{
            displayName:user.displayName||existing.displayName||'',
            email:user.email||existing.email||'',
            photoURL:user.photoURL||existing.photoURL||null,
            provider:prov,lastSeen:Date.now()
          },{merge:true});
          if(!existing.phone){pendingAuthUser=user;}
        }
      }
    }catch(redirectErr){
      if(redirectErr.code&&!['auth/null-user','auth/no-auth-event','auth/operation-not-supported-in-this-environment'].includes(redirectErr.code))
        console.warn('getRedirectResult:',redirectErr.code,redirectErr.message);
    }
    onAuthStateChanged(auth,async user=>{
      // Firebase ja determinou definitivamente o estado (logado ou nao) --
      // o guardrail de seguranca do init() nao e mais necessario a partir daqui.
      clearTimeout(authKillTimer);
      localStorage.removeItem('nooma_redirect_pending');
      if(user){
        currentUser=user;
        // CRITICO: mostrar a tela do app IMEDIATAMENTE apos confirmar o login.
        // Antes, isso so acontecia depois de carregar listeners e checar convite --
        // se qualquer uma dessas etapas secundarias falhasse (rede lenta, erro de
        // permissao no Firestore etc), a troca de tela nunca acontecia e o usuario
        // ficava preso na tela de carregamento (que depois de um tempo volta ao
        // login), parecendo que \"nada aconteceu\". Agora a tela do app aparece
        // primeiro, e qualquer problema nas etapas seguintes fica isolado e
        // registrado no console, sem travar a experiencia do usuario.
        showScreen('screenApp');
        renderAll();

        // Carregar dados do perfil do Firestore (pode ter foto base64, phone etc)
        let userData={};
        try{
          const snap=await getDoc(doc(db,'_users',user.uid));
          if(snap.exists())userData=snap.data();
        }catch(e){console.error('Erro ao carregar perfil do usuario:',e);}

        const av=document.getElementById('userAvatar'),un=document.getElementById('userName');
        const photo=userData.photoBase64||user.photoURL||null;
        if(av&&photo)av.src=photo;
        if(un)un.textContent=userData.displayName||user.displayName||'Voc\u00EA';
        if(user.email===ADMIN_EMAIL){document.getElementById('btnAnalytics').style.display='flex';syncHMoreVisibility();}
        trackActivity(user);

        try{
          await setupAllListeners(user.uid);
        }catch(e){console.error('Erro ao configurar listeners de dados:',e);}

        try{
          await checkInviteURL();
        }catch(e){console.error('Erro ao verificar convite:',e);}

        updateNotifBell();
        setupProjectsListener();
        setupTasksListener();
        setupAssignmentNotifListener();
        loadProjStatuses();
        if(notifCheckInterval)clearInterval(notifCheckInterval);
        notifCheckInterval=setInterval(checkNotifications,5*60*1000);
        setTimeout(checkNotifications,3000);

        // Verificar se usu\u00E1rio tem telefone cadastrado
        setTimeout(async()=>{
          try{
            const snap=await getDoc(doc(db,'_users',user.uid));
            if(!snap.exists()||!snap.data().phone){
              pendingAuthUser=user;
              showPhoneCollectModal(user.displayName||userData.displayName||'');
            } else {
              showWizard();
            }
          }catch(e){console.error('Erro ao verificar telefone do usuario:',e);showWizard();}
        },1500);
      }else{currentUser=null;teardownListeners();showScreen('screenLogin');}
    });
  }catch(e){
    console.error('Erro ao inicializar Firebase:',e);
    showScreen('screenLogin');
  }
}

async function trackActivity(user){
  if(!db)return;
  try{
    const today=fmtDate(new Date()),ref=doc(db,'_users',user.uid),snap=await getDoc(ref),isNew=!snap.exists();
    await setDoc(ref,{email:user.email||'',displayName:user.displayName||'',photoURL:user.photoURL||null,lastSeen:serverTimestamp(),...(isNew?{createdAt:serverTimestamp()}:{})},{merge:true});
    await setDoc(doc(db,'_daily',today),{users:arrayUnion(user.uid)},{merge:true});
  }catch(e){}
}


// \u2500\u2500\u2500 checkInviteURL \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function checkInviteURL(){
  const params=new URLSearchParams(window.location.search);
  const joinCode=params.get('join')||localStorage.getItem('nooma_pending_join');
  if(!joinCode||!currentUser)return;
  localStorage.removeItem('nooma_pending_join');
  window.history.replaceState({},'',window.location.pathname);
  await requestToJoin(joinCode);
}

// \u2500\u2500\u2500 setupProjectsListener \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// ================================================================
// TAREFAS -- listener de dados (mesmo padrao de setupProjectsListener)
// ================================================================
let unsubTasks=null;
function setupTasksListener(){
  if(unsubTasks)unsubTasks();
  try{
    unsubTasks=onSnapshot(
      collection(db,dataRoot(),'tasks'),
      snap=>{
        taskState.tasks=snap.docs.map(d=>({...d.data(),id:d.id}));
        renderTasksIfActive();
        updateTaskTabBadge();
      },
      err=>console.warn('tasks listener:',err.message)
    );
  }catch(e){console.warn('setupTasksListener:',e.message);}
}
async function saveTask(task){
  if(!db||!currentUser)return;
  await setDoc(doc(db,dataRoot(),'tasks',task.id),task);
}
async function deleteTaskDoc(taskId){
  if(!db||!currentUser)return;
  await deleteDoc(doc(db,dataRoot(),'tasks',taskId));
}

function setupProjectsListener(){
  if(unsubProjects)unsubProjects();
  try{
    unsubProjects=onSnapshot(
      collection(db,dataRoot(),'projects'),
      snap=>{
        projState.projects=snap.docs.map(d=>({...d.data(),id:d.id}));
        renderProjectsIfActive();
        updateProjTabBadge();
      },
      err=>console.warn('projects listener:',err.message)
    );
  }catch(e){console.warn('setupProjectsListener:',e.message);}
}

// \u2500\u2500\u2500 saveProject / deleteProject \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function saveProject(proj){
  if(!db||!currentUser)return;
  await setDoc(doc(db,dataRoot(),'projects',proj.id),proj);
}
async function deleteProject(projId){
  if(!db||!currentUser)return;
  await deleteDoc(doc(db,dataRoot(),'projects',projId));
}

// \u2500\u2500\u2500 chartsActive + toggleCharts + renderCharts \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

function toggleCharts(){
  chartsActive=!chartsActive;
  document.getElementById('chartsPanel')?.classList.toggle('open',chartsActive);
  document.getElementById('chartToggleBtn')?.classList.toggle('active',chartsActive);
  if(chartsActive)renderCharts();
}
function closeCharts(){
  chartsActive=false;
  document.getElementById('chartsPanel')?.classList.remove('open');
  document.getElementById('chartToggleBtn')?.classList.remove('active');
}
document.getElementById('btnCloseCharts')?.addEventListener('click',closeCharts);

function getAllPostsInRange(){
  const all=[];
  Object.entries(state.posts).forEach(([key,arr])=>arr.forEach(p=>all.push({...p,dateKey:key})));
  return all;
}
function drawBarChart(el,data,colorFn){
  if(!el)return;
  const max=Math.max(...data.map(d=>d.val),1);
  el.innerHTML=data.length?data.map(d=>`
    <div class="chart-bar-row">
      <div class="chart-bar-label" title="${esc(d.labelText||d.label)}">${d.label}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width:${Math.max(4,(d.val/max)*100)}%;background:${colorFn(d)}">
          <span class="chart-bar-val">${d.val}</span>
        </div>
      </div>
      <div class="chart-bar-pct">${Math.round((d.val/Math.max(1,data.reduce((s,x)=>s+x.val,0)))*100)}%</div>
    </div>`).join('')
  :'<div class="chart-empty">Nenhum dado</div>';
}
function drawDonut(svgEl,legendEl,data){
  if(!svgEl)return;
  const total=data.reduce((s,d)=>s+d.val,0);
  if(!total){svgEl.innerHTML='<text x="80" y="88" text-anchor="middle" fill="#555" font-size="12">Sem dados</text>';return;}
  const cx=80,cy=80,r=60,stroke=24;let offset=0;
  const paths=data.map(d=>{
    const pct=d.val/total,angle=pct*2*Math.PI;
    const x1=cx+r*Math.sin(offset),y1=cy-r*Math.cos(offset);
    offset+=angle;
    const x2=cx+r*Math.sin(offset),y2=cy-r*Math.cos(offset);
    return`<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${angle>Math.PI?1:0},1 ${x2},${y2} Z" fill="${d.color}" opacity="0.9"/>`;
  });
  svgEl.innerHTML=paths.join('')+`<circle cx="${cx}" cy="${cy}" r="${r-stroke}" fill="var(--bg2)"/><text x="${cx}" y="${cy+5}" text-anchor="middle" fill="white" font-size="18" font-weight="900">${total}</text>`;
  if(legendEl)legendEl.innerHTML=data.map(d=>`<div class="chart-legend-item"><span class="chart-legend-dot" style="background:${d.color}"></span><span class="chart-legend-name">${d.label}</span><span class="chart-legend-pct">${d.val} (${Math.round(d.val/total*100)}%)</span></div>`).join('');
}
function renderCharts(){
  const posts=getAllPostsInRange();const total=posts.length;
  const mk=`${state.year}-${String(state.month).padStart(2,'0')}`;
  const monthPosts=posts.filter(p=>p.dateKey.startsWith(mk));
  const sub=document.getElementById('chartsSubtitle');
  if(sub)sub.textContent=`${MONTHS[state.month-1]} ${state.year} \u00B7 ${monthPosts.length} posts este m\u00EAs \u00B7 ${total} no total`;
  const pub=posts.filter(p=>p.status==='published').length;
  const sched=posts.filter(p=>p.status==='scheduled').length;
  const draft=posts.filter(p=>p.status==='draft').length;
  const el=document.getElementById('chartsSummary');
  if(el)el.innerHTML=`<div class="chart-kpi"><div class="chart-kpi-num">${total}</div><div class="chart-kpi-label">Total</div></div><div class="chart-kpi"><div class="chart-kpi-num" style="color:#2ed573">${pub}</div><div class="chart-kpi-label">Publicados</div></div><div class="chart-kpi"><div class="chart-kpi-num" style="color:#74b9ff">${sched}</div><div class="chart-kpi-label">Agendados</div></div><div class="chart-kpi"><div class="chart-kpi-num" style="color:#888">${draft}</div><div class="chart-kpi-label">Rascunhos</div></div>`;
  const byClient={};state.clients.forEach(c=>{byClient[c.id]={label:c.name,val:0,color:c.color};});
  posts.forEach(p=>{if(byClient[p.clientId])byClient[p.clientId].val++;});
  const byPlat={};state.platforms.forEach(p=>{byPlat[p.id]={label:renderIcon(p.icon,13)+' '+esc(p.name),labelText:p.name,val:0,color:p.color};});
  posts.forEach(p=>{const id=p.platform||'none';if(byPlat[id])byPlat[id].val++;else{byPlat[id]={label:id||'Sem plataforma',val:(byPlat[id]?.val||0)+1,color:'#555'};}});
  const byCT={};state.contentTypes.forEach(ct=>{byCT[ct.id]={label:renderIcon(ct.icon,13)+' '+esc(ct.name),labelText:ct.name,val:0,color:ct.bgColor};});
  posts.forEach(p=>{const ct=getCT(p.contentType);if(ct&&byCT[ct.id])byCT[ct.id].val++;});
  const bySt={};state.postStatuses.forEach(s=>{bySt[s.id]={label:renderIcon(s.icon,13)+' '+esc(s.name),labelText:s.name,val:0,color:s.color};});
  posts.forEach(p=>{const id=p.status||'draft';if(bySt[id])bySt[id].val++;});
  const trendMonths=[];
  for(let i=7;i>=0;i--){let m=state.month-i,y=state.year;while(m<1){m+=12;y--;}const key=`${y}-${String(m).padStart(2,'0')}`;trendMonths.push({label:MONTHS[m-1].slice(0,3),val:posts.filter(p=>p.dateKey.startsWith(key)).length});}
  const tMax=Math.max(...trendMonths.map(t=>t.val),1);
  const byDow=DAYS.map((name,i)=>({label:name.slice(0,3),val:0,dow:i}));
  posts.forEach(p=>{try{const[y,m,d]=p.dateKey.split('-').map(Number);byDow[new Date(y,m-1,d).getDay()].val++;}catch(e){}});
  const grid=document.getElementById('chartsGrid');
  if(!grid)return;
  grid.innerHTML=`
    <div class="chart-card"><div class="chart-card-title">\uD83D\uDC65 Por Cliente</div><div id="chartClients"></div></div>
    <div class="chart-card"><div class="chart-card-title">\uD83D\uDCF1 Por Plataforma</div><div class="chart-donut-wrap"><svg id="chartPlatSvg" viewBox="0 0 160 160" width="130" height="130" style="flex-shrink:0"></svg><div class="chart-legend" id="chartPlatLegend"></div></div></div>
    <div class="chart-card"><div class="chart-card-title">\uD83C\uDFAC Por Tipo</div><div id="chartCT"></div></div>
    <div class="chart-card"><div class="chart-card-title">\uD83D\uDCCB Por Status</div><div id="chartSt"></div></div>
    <div class="chart-card"><div class="chart-card-title">\uD83D\uDCC8 Tend\u00EAncia de 8 Meses</div><div class="chart-trend-line">${trendMonths.map(t=>`<div class="chart-trend-bar" data-val="${t.val}" style="height:${Math.max(4,(t.val/tMax)*56)}px;background:${t.val===Math.max(...trendMonths.map(x=>x.val))?'var(--accent)':'rgba(237,242,82,0.3)'}"></div>`).join('')}</div><div class="chart-trend-labels">${trendMonths.map(t=>`<div class="chart-trend-label">${t.label}</div>`).join('')}</div></div>
    <div class="chart-card"><div class="chart-card-title">\uD83D\uDCC5 Dias Mais Ativos</div><div id="chartDow"></div></div>`;
  drawBarChart(document.getElementById('chartClients'),Object.values(byClient).filter(d=>d.val>0).sort((a,b)=>b.val-a.val),d=>d.color);
  drawBarChart(document.getElementById('chartCT'),Object.values(byCT).filter(d=>d.val>0).sort((a,b)=>b.val-a.val),d=>d.color);
  drawBarChart(document.getElementById('chartSt'),Object.values(bySt).filter(d=>d.val>0).sort((a,b)=>b.val-a.val),d=>d.color);
  drawBarChart(document.getElementById('chartDow'),byDow,d=>`hsl(${d.dow*51},70%,55%)`);
  drawDonut(document.getElementById('chartPlatSvg'),document.getElementById('chartPlatLegend'),Object.values(byPlat).filter(d=>d.val>0).sort((a,b)=>b.val-a.val));
}

// \u2500\u2500\u2500 Listeners \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function teardownListeners(){
  [unsubClients,unsubPosts,unsubCT,unsubST,unsubPlat,unsubWorkspaces,unsubAssignNotifs,unsubTasks].forEach(u=>u&&u());
  unsubClients=unsubPosts=unsubCT=unsubST=unsubPlat=unsubWorkspaces=unsubAssignNotifs=unsubTasks=null;
  Object.values(pendingListeners).forEach(u=>u());Object.keys(pendingListeners).forEach(k=>delete pendingListeners[k]);
}

async function setupAllListeners(uid){
  if(unsubWorkspaces)unsubWorkspaces();
  const wsQ=query(collection(db,'workspaces'),where('memberUids','array-contains',uid));
  unsubWorkspaces=onSnapshot(wsQ,snap=>{
    state.userWorkspaces=snap.docs.map(d=>{const data=d.data();const m=data.members?.[uid];const role=data.ownerId===uid?'owner':(m?.role||'viewer');return{id:d.id,...data,role};});
    setupPendingListeners();renderWorkspaceSwitcher();
  });
  setupDataListeners();
}

async function initDefaults(root,collName,defaults){
  const snap=await getDocs(collection(db,root,collName));
  if(snap.empty){const batch=writeBatch(db);defaults.forEach(item=>batch.set(doc(db,root,collName,item.id),item));await batch.commit();}
}

function setupDataListeners(){
  [unsubClients,unsubPosts,unsubCT,unsubST,unsubPlat].forEach(u=>u&&u());
  unsubClients=unsubPosts=unsubCT=unsubST=unsubPlat=null;
  const root=dataRoot();

  unsubClients=onSnapshot(collection(db,root,'clients'),snap=>{
    state.clients=snap.docs.map((d,i)=>({order:i,...d.data(),id:d.id})).sort((a,b)=>a.order-b.order);
    renderAll();
  },e=>console.warn('clients:',e.message));

  unsubPosts=onSnapshot(collection(db,root,'posts'),snap=>{
    state.posts={};
    snap.docs.forEach(d=>{const data=d.data();if(!state.posts[data.date])state.posts[data.date]=[];state.posts[data.date].push({id:d.id,...data});});
    renderAll();
  },e=>console.warn('posts:',e.message));

  initDefaults(root,'contentTypes',DEFAULT_CONTENT_TYPES).catch(()=>{});
  unsubCT=onSnapshot(collection(db,root,'contentTypes'),snap=>{
    if(snap.empty){state.contentTypes=[...DEFAULT_CONTENT_TYPES];}
    else{state.contentTypes=snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>a.order-b.order);}
    renderAll();
  },()=>{state.contentTypes=[...DEFAULT_CONTENT_TYPES];renderAll();});

  initDefaults(root,'postStatuses',DEFAULT_STATUSES).catch(()=>{});
  unsubST=onSnapshot(collection(db,root,'postStatuses'),snap=>{
    if(snap.empty){state.postStatuses=[...DEFAULT_STATUSES];}
    else{state.postStatuses=snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>a.order-b.order);}
    renderAll();
  },()=>{state.postStatuses=[...DEFAULT_STATUSES];renderAll();});

  initDefaults(root,'platforms',DEFAULT_PLATFORMS).catch(()=>{});
  unsubPlat=onSnapshot(collection(db,root,'platforms'),snap=>{
    if(snap.empty){state.platforms=[...DEFAULT_PLATFORMS];}
    else{state.platforms=snap.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>a.order-b.order);}
    renderAll();
  },()=>{state.platforms=[...DEFAULT_PLATFORMS];renderAll();});
}

function setupPendingListeners(){
  const ownedIds=new Set(state.userWorkspaces.filter(w=>w.ownerId===currentUser?.uid).map(w=>w.id));
  Object.keys(pendingListeners).forEach(wid=>{if(!ownedIds.has(wid)){pendingListeners[wid]();delete pendingListeners[wid];}});
  ownedIds.forEach(wid=>{if(pendingListeners[wid])return;pendingListeners[wid]=onSnapshot(collection(db,'workspaces',wid,'pendingRequests'),snap=>{const ws=state.userWorkspaces.find(w=>w.id===wid);if(ws){ws.pendingCount=snap.size;ws.pendingList=snap.docs.map(d=>({uid:d.id,...d.data()}));}renderWorkspaceSwitcher();});});
}

// \u2500\u2500\u2500 Workspace Ops \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function switchWorkspace(ws){
  state.currentWorkspace=ws;state.clients=[];state.posts={};state.filterClientId=null;state.filterContentType=null;state.filterPlatform=null;state.filterStatus=null;
  projState.projects=[];projState.editingId=null;projState.filterStatus='all';
  taskState.tasks=[];taskState.editingId=null;
  setupDataListeners();setupProjectsListener();setupTasksListener();setupAssignmentNotifListener();closeWsDropdown();renderAll();renderWorkspaceSwitcher();
  document.getElementById('btnWsSettings').style.display=ws?'flex':'none';syncHMoreVisibility();
  document.getElementById('readonlyBanner')?.classList.toggle('show',ws&&ws.role==='viewer');
  if(currentAppTab==='projects')renderProjects();
  if(currentAppTab==='tasks')renderTasks();
}

async function updateWorkspaceInfo(wsId,name,logoBase64,currency){
  if(!db||!currentUser)return;
  const updates={name};
  if(logoBase64)updates.logo=logoBase64;
  if(currency)updates.currency=currency;
  await updateDoc(doc(db,'workspaces',wsId),updates);
  // Atualizar estado local imediatamente (sem esperar o listener do Firestore)
  if(state.currentWorkspace&&state.currentWorkspace.id===wsId){
    state.currentWorkspace.name=name;
    if(logoBase64)state.currentWorkspace.logo=logoBase64;
    if(currency)state.currentWorkspace.currency=currency;
  }
  const wsLocal=state.userWorkspaces.find(w=>w.id===wsId);
  if(wsLocal){wsLocal.name=name;if(logoBase64)wsLocal.logo=logoBase64;if(currency)wsLocal.currency=currency;}
  renderWorkspaceSwitcher();
  if(state.currentWorkspace)await renderWsSettings(state.currentWorkspace);
  renderAll();
}

async function createWorkspace(name,logo){
  const wid=uid(),code=generateCode();
  const wsData={name,logo:logo||null,ownerId:currentUser.uid,ownerEmail:currentUser.email,memberUids:[currentUser.uid],editorUids:[currentUser.uid],members:{[currentUser.uid]:{email:currentUser.email,displayName:currentUser.displayName||currentUser.email,photoURL:currentUser.photoURL||null,role:'owner',joinedAt:serverTimestamp()}},inviteCode:code,createdAt:serverTimestamp()};
  const batch=writeBatch(db);
  batch.set(doc(db,'workspaces',wid),wsData);
  batch.set(doc(db,'_invites',code),{workspaceId:wid,workspaceName:name,ownerId:currentUser.uid,ownerName:currentUser.displayName||currentUser.email});
  await batch.commit();
  toast(t('t.wsCreated',{name}));
  return{id:wid,...wsData,role:'owner'};
}

async function requestToJoin(code){
  try{
    // Passo 1: ler o convite  -  permitido para qualquer usu\u00E1rio autenticado
    const inviteDoc=await getDoc(doc(db,'_invites',code));
    if(!inviteDoc.exists()){toast(t('t.inviteInvalid'));return;}
    const{workspaceId,workspaceName}=inviteDoc.data();

    // Passo 2: verificar se j\u00E1 \u00E9 membro  -  sem ler Firestore, usando dados locais
    const alreadyMember=state.userWorkspaces.some(w=>w.id===workspaceId);
    if(alreadyMember){
      const ws=state.userWorkspaces.find(w=>w.id===workspaceId);
      toast(t('t.alreadyMember'));
      if(ws)switchWorkspace(ws);
      return;
    }

    // Passo 3: enviar pedido de entrada  -  permitido para qualquer usu\u00E1rio autenticado (pr\u00F3prio uid)
    await setDoc(doc(db,'workspaces',workspaceId,'pendingRequests',currentUser.uid),{
      uid:currentUser.uid,
      email:currentUser.email,
      displayName:currentUser.displayName||currentUser.email,
      photoURL:currentUser.photoURL||null,
      requestedAt:serverTimestamp()
    });
    toast(`\uD83D\uDD14 Solicita\u00E7\u00E3o enviada para "${workspaceName}"! Aguarde o dono aprovar.`,5000);
  }catch(e){toast(t('toast.error',{msg:e.message}));}
}
async function approveRequest(wid,req,role){const batch=writeBatch(db);batch.delete(doc(db,'workspaces',wid,'pendingRequests',req.uid));const updates={memberUids:arrayUnion(req.uid),[`members.${req.uid}`]:{email:req.email,displayName:req.displayName,photoURL:req.photoURL||null,role,joinedAt:serverTimestamp()}};if(role!=='viewer')updates.editorUids=arrayUnion(req.uid);batch.update(doc(db,'workspaces',wid),updates);await batch.commit();toast(t('t.userApproved',{name:req.displayName}));}
async function rejectRequest(wid,reqUid,reqName){if(!confirm(`Rejeitar solicita\u00E7\u00E3o de "${reqName}"?`))return;await deleteDoc(doc(db,'workspaces',wid,'pendingRequests',reqUid));toast(t('t.rejected'));}
async function updateMemberRole(wid,targetUid,newRole){const updates={[`members.${targetUid}.role`]:newRole};if(newRole==='viewer')updates.editorUids=arrayRemove(targetUid);else if(newRole==='editor')updates.editorUids=arrayUnion(targetUid);await updateDoc(doc(db,'workspaces',wid),updates);toast(t('t.roleUpdated'));}
async function removeMember(wid,targetUid,targetName){if(!confirm(`Remover "${targetName}"?`))return;await updateDoc(doc(db,'workspaces',wid),{memberUids:arrayRemove(targetUid),editorUids:arrayRemove(targetUid),[`members.${targetUid}`]:deleteField()});toast(t('t.memberRemoved',{name:targetName}));}
async function leaveWorkspace(wid){if(!confirm('Sair deste workspace?'))return;await updateDoc(doc(db,'workspaces',wid),{memberUids:arrayRemove(currentUser.uid),editorUids:arrayRemove(currentUser.uid),[`members.${currentUser.uid}`]:deleteField()});switchWorkspace(null);toast(t('t.youLeft'));}
async function deleteWorkspace(wid,wsName){if(!confirm(`Deletar workspace "${wsName}" permanentemente?`))return;const ws=state.userWorkspaces.find(w=>w.id===wid);try{const[cs,ps,prs]=await Promise.all([getDocs(collection(db,'workspaces',wid,'clients')),getDocs(collection(db,'workspaces',wid,'posts')),getDocs(collection(db,'workspaces',wid,'pendingRequests'))]);const batch=writeBatch(db);[...cs.docs,...ps.docs,...prs.docs].forEach(d=>batch.delete(d.ref));batch.delete(doc(db,'workspaces',wid));if(ws?.inviteCode)batch.delete(doc(db,'_invites',ws.inviteCode));await batch.commit();switchWorkspace(null);toast(t('t.wsDeleted'));}catch(e){toast(t('toast.error',{msg:e.message}));}}
async function regenerateInviteCode(wid){const ws=state.userWorkspaces.find(w=>w.id===wid);if(!ws)return;const newCode=generateCode();const batch=writeBatch(db);if(ws.inviteCode)batch.delete(doc(db,'_invites',ws.inviteCode));batch.set(doc(db,'_invites',newCode),{workspaceId:wid,workspaceName:ws.name,ownerId:currentUser.uid,ownerName:currentUser.displayName||currentUser.email});batch.update(doc(db,'workspaces',wid),{inviteCode:newCode});await batch.commit();toast(t('t.newLink'));}

// \u2500\u2500\u2500 Firestore CRUD \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function saveClient(client){if(!db||!currentUser)return;await setDoc(doc(db,dataRoot(),'clients',client.id),client);}
async function removeClient(clientId){if(!db||!currentUser)return;const root=dataRoot();await deleteDoc(doc(db,root,'clients',clientId));const snap=await getDocs(collection(db,root,'posts'));const batch=writeBatch(db);snap.docs.forEach(d=>{if(d.data().clientId===clientId)batch.delete(d.ref);});await batch.commit();}
async function updateClientOrder(clients){if(!db||!currentUser)return;const batch=writeBatch(db);clients.forEach((c,i)=>batch.update(doc(db,dataRoot(),'clients',c.id),{order:i}));await batch.commit();}
async function savePost(dateKey,post){if(!db||!currentUser)return;const data={...post,date:dateKey};if(state.currentWorkspace)data.addedBy={uid:currentUser.uid,displayName:currentUser.displayName||currentUser.email,photoURL:currentUser.photoURL||null};await setDoc(doc(db,dataRoot(),'posts',post.id),data);}
async function removePost(postId){if(!db||!currentUser)return;await deleteDoc(doc(db,dataRoot(),'posts',postId));}
async function updatePostField(postId,fields){if(!db||!currentUser)return;await updateDoc(doc(db,dataRoot(),'posts',postId),fields);}
async function saveCT(ct){if(!db||!currentUser)return;await setDoc(doc(db,dataRoot(),'contentTypes',ct.id),ct);}
async function removeCT(ctId){if(!db||!currentUser)return;await deleteDoc(doc(db,dataRoot(),'contentTypes',ctId));}
async function saveST(st){if(!db||!currentUser)return;await setDoc(doc(db,dataRoot(),'postStatuses',st.id),st);}
async function removeST(stId){if(!db||!currentUser)return;await deleteDoc(doc(db,dataRoot(),'postStatuses',stId));}
async function savePlat(plat){if(!db||!currentUser)return;await setDoc(doc(db,dataRoot(),'platforms',plat.id),plat);}
async function removePlat(platId){if(!db||!currentUser)return;await deleteDoc(doc(db,dataRoot(),'platforms',platId));}

// \u2500\u2500\u2500 Render All \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderAll(){
  renderCurrentView();
  if(chartsActive)renderCharts();renderSidebar();renderStatusFilterBar();saveNav();
  if(document.getElementById('clientsOverlay')?.classList.contains('open'))renderClientsManager();
  if(document.getElementById('ctOverlay')?.classList.contains('open'))renderCTManager();
  if(document.getElementById('settingsOverlay')?.classList.contains('open')){renderPlatManager();renderSTManager();}
  if(activeDayKey&&document.getElementById('dayOverlay')?.classList.contains('open')){renderDayModalPosts();renderClientDd();renderTypeGrid();renderPlatDd();renderNselPostStatus(state.form.status);updateTimeSuggestions();}
}

// \u2500\u2500\u2500 Workspace Switcher \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderWorkspaceSwitcher(){
  const list=document.getElementById('wsDdList'),btnName=document.getElementById('wsBtnName'),btnIcon=document.getElementById('wsBtnIcon'),badge=document.getElementById('wsBadge');
  if(!list)return;
  const isP=!state.currentWorkspace;
  btnName.textContent=isP?'Pessoal':state.currentWorkspace.name;
  const wsLogo=state.currentWorkspace?.logo;
  btnIcon.innerHTML=wsLogo?`<img class="ws-logo-sm" src="${wsLogo}" alt=""/>`:isP?'\uD83D\uDCC5':'\uD83C\uDFE2';
  const totalPending=state.userWorkspaces.reduce((n,w)=>n+(w.pendingCount||0),0);
  if(totalPending>0){badge.textContent=totalPending;badge.style.display='flex';}else badge.style.display='none';
  const notifBtn=document.getElementById('btnNotif'),notifBadgeEl=document.getElementById('notifBadge');
  if(notifBtn&&notifBadgeEl){
    const isOwnerSomewhere=state.userWorkspaces.some(w=>w.ownerId===currentUser?.uid);
    if(isOwnerSomewhere&&totalPending>0){notifBtn.style.display='flex';notifBtn.classList.add('has-pending');notifBadgeEl.textContent=totalPending;}
    else{notifBtn.style.display='none';notifBtn.classList.remove('has-pending');}
  }
  let html=`<div class="ws-dd-item ${isP?'active':''}" id="dd-personal"><span class="ws-dd-item-icon">\uD83D\uDCC5</span><div class="ws-dd-item-info"><div class="ws-dd-item-name">Pessoal</div><div class="ws-dd-item-sub">S\u00F3 voc\u00EA</div></div></div>`;
  if(state.userWorkspaces.length)html+='<div class="ws-dd-sep"></div>';
  state.userWorkspaces.forEach(ws=>{
    const active=state.currentWorkspace?.id===ws.id,pending=ws.pendingCount||0;
    const iconHtml=ws.logo?`<img src="${ws.logo}" alt="" style="width:22px;height:22px;object-fit:cover;border-radius:5px"/>`:'\uD83C\uDFE2';
    html+=`<div class="ws-dd-item ${active?'active':''}" id="dd-ws-${ws.id}"><span class="ws-dd-item-icon">${iconHtml}</span><div class="ws-dd-item-info"><div class="ws-dd-item-name">${esc(ws.name)}</div><div class="ws-dd-item-sub">${ws.role} \u00B7 ${(ws.memberUids||[]).length} membros</div></div>${pending>0?`<span class="ws-dd-item-badge">${pending}</span>`:''}</div>`;
  });
  list.innerHTML=html;
  document.getElementById('dd-personal')?.addEventListener('click',()=>switchWorkspace(null));
  state.userWorkspaces.forEach(ws=>document.getElementById(`dd-ws-${ws.id}`)?.addEventListener('click',()=>switchWorkspace(ws)));
}
function closeWsDropdown(){document.getElementById('wsDropdown')?.classList.remove('open');}

// \u2500\u2500\u2500 Status Filter Bar (top) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderStatusFilterBar(){
  const bar=document.getElementById('statusFilterBar');
  const mk=`${state.year}-${String(state.month).padStart(2,'0')}`;
  const counts={};state.postStatuses.forEach(s=>{counts[s.id]=0;});
  let total=0;
  Object.entries(state.posts).forEach(([k,arr])=>{if(k.startsWith(mk))arr.forEach(p=>{const sid=p.status||'draft';total++;if(counts[sid]!==undefined)counts[sid]++;});});
  let html=`<span class="filter-label">Status:</span><div class="filter-chip ${!state.filterStatus?'active-all':''}" data-id="">Todos <span style="opacity:.6">(${total})</span></div><div class="filter-sep"></div>`;
  state.postStatuses.forEach(s=>{const isA=state.filterStatus===s.id;const stC=s.color||'#888';html+=`<div class="filter-chip ${isA?'active-status':''}" data-id="${s.id}" style="${isA?`color:${stC};border-color:${stC}`:''}">${renderIcon(s.icon,13)} ${esc(s.name)} <span style="opacity:.6">(${counts[s.id]||0})</span></div>`;});
  html+=`<div class="filter-sep"></div><div class="heatmap-toggle${heatmapActive?' active':''}" id="heatmapToggleBtn" title="${t('heatmap.tooltip')}" data-i18n-title="heatmap.tooltip">${renderIcon('grid',13)} <span data-i18n="heatmap.label">Mapa de Calor</span></div><div class="chart-toggle${chartsActive?' active':''}" id="chartToggleBtn" title="${t('charts.tooltip')}" data-i18n-title="charts.tooltip">${renderIcon('bar-chart',13)} <span data-i18n="charts.label">An\u00E1lise</span></div>`;
  bar.innerHTML=html;
  document.getElementById('heatmapToggleBtn')?.addEventListener('click',toggleHeatmap);
  document.getElementById('chartToggleBtn')?.addEventListener('click',toggleCharts);
  bar.querySelectorAll('.filter-chip').forEach(chip=>chip.addEventListener('click',()=>{const id=chip.dataset.id;state.filterStatus=(id&&id!==state.filterStatus)?id:null;renderCalendar();renderStatusFilterBar();}));
}

// \u2500\u2500\u2500 Sidebar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderSidebar(){
  // Clients
  const cEl=document.getElementById('sidebarClients');
  if(cEl){
    const mk=`${state.year}-${String(state.month).padStart(2,'0')}`;
    const counts={};state.clients.forEach(c=>{counts[c.id]=0;});
    Object.entries(state.posts).forEach(([k,arr])=>{if(k.startsWith(mk))arr.forEach(p=>{if(counts[p.clientId]!==undefined)counts[p.clientId]++;});});
    cEl.innerHTML=state.clients.length?state.clients.map(c=>`<div class="s-client-item"><span class="s-dot" style="background:${c.color}"></span><span class="s-name">${esc(c.name)}</span><span class="s-count">${counts[c.id]||0}</span></div>`).join(''):'<div class="s-empty">Nenhum cliente ainda</div>';
  }
  // Content types
  const ctEl=document.getElementById('sidebarCT');
  if(ctEl) ctEl.innerHTML=state.contentTypes.map(ct=>`<div class="ct-row-sb"><span class="ico">${renderIcon(ct.icon,14)}</span>${esc(ct.name)}<span class="ct-badge-sb" style="background:${ct.bgColor}20;color:${ct.bgColor}">${esc(ct.label)}</span></div>`).join('');
  // Sidebar filter dropdowns
  renderSidebarFilters();
}

function renderSidebarFilters(){
  // Atualizar nsels (NOOMA dropdowns)
  renderSidebarNsels();
  // Show active hint
  const hasFilter=state.filterClientId||state.filterContentType||state.filterPlatform;
  const hint=document.getElementById('filterActiveHint');
  if(hint)hint.style.display=hasFilter?'flex':'none';
}

// \u2500\u2500\u2500 Calendar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// \u2500\u2500\u2500 Navega\u00E7\u00E3o de M\u00EAs/Semana (bot\u00F5es < >) \u2500\u2500\u2500
const NAV_MIN_YEAR=2020,NAV_MIN_MONTH=1;
const NAV_MAX_YEAR=2030,NAV_MAX_MONTH=12;

function isBeforeNavMin(y,m){return y<NAV_MIN_YEAR||(y===NAV_MIN_YEAR&&m<NAV_MIN_MONTH);}
function isAfterNavMax(y,m){return y>NAV_MAX_YEAR||(y===NAV_MAX_YEAR&&m>NAV_MAX_MONTH);}

function goPrev(){
  if(currentView==='week'){
    state.weekOffset=(state.weekOffset||0)-1;
    renderCurrentView();saveNav();return;
  }
  let{year,month}=state;
  month--;if(month<1){month=12;year--;}
  if(isBeforeNavMin(year,month))return;
  state.year=year;state.month=month;
  renderCurrentView();saveNav();
}
function goNext(){
  if(currentView==='week'){
    state.weekOffset=(state.weekOffset||0)+1;
    renderCurrentView();saveNav();return;
  }
  let{year,month}=state;
  month++;if(month>12){month=1;year++;}
  if(isAfterNavMax(year,month))return;
  state.year=year;state.month=month;
  renderCurrentView();saveNav();
}
document.getElementById('btnPrev')?.addEventListener('click',goPrev);
document.getElementById('btnNext')?.addEventListener('click',goNext);

function renderCalendar(){
  const grid=document.getElementById('calGrid');if(!grid)return;
  const{year,month}=state;
  const firstDay=new Date(year,month-1,1).getDay(),daysInMonth=new Date(year,month,0).getDate();
  const today=new Date(),isThisM=today.getFullYear()===year&&today.getMonth()+1===month;
  const lbl=document.getElementById('monthLbl');if(lbl)lbl.innerHTML=`${MONTHS[month-1]} <em>${year}</em>`;
  // Heatmap max
  let maxPosts=0;
  if(heatmapActive){for(let d=1;d<=daysInMonth;d++){const cnt=(state.posts[dk(year,month,d)]||[]).length;if(cnt>maxPosts)maxPosts=cnt;}}
  // Helper: render tags for outside days (ghost)
  function ghostTags(posts){
    if(!posts||!posts.length)return'';
    return posts.slice(0,2).map(p=>{const cl=getC(p.clientId);if(!cl)return'';return`<div class="cp-tag ghost-tag" style="background:${cl.color}"><div class="cp-tag-line1">${esc(cl.name)}</div></div>`;}).join('');
  }
  let html='';
  // \u2500\u2500 Days BEFORE this month (from previous month)
  const pm=month===1?12:month-1,py=month===1?year-1:year,dpPrev=new Date(py,pm,0).getDate();
  for(let i=0;i<firstDay;i++){
    const d=dpPrev-firstDay+1+i;
    const key=dk(py,pm,d);
    const prevPosts=state.posts[key]||[];
    const hasPrev=prevPosts.length>0;
    html+=`<div class="day-cell outside${hasPrev?' outside-has-posts':''}" data-outside-key="${key}">
      <div class="day-color-bar" style="background:${hasPrev?buildGradient([...new Set(prevPosts.map(p=>p.clientId))].map(id=>getC(id)?.color).filter(Boolean)):'transparent'}"></div>
      <div class="day-num">${d}</div>
      <div class="day-posts-wrap">${ghostTags(prevPosts)}${hasPrev&&prevPosts.length>2?`<div class="cp-more ghost">+${prevPosts.length-2}</div>`:''}</div>
    </div>`;
  }
  // \u2500\u2500 Days IN this month
  for(let d=1;d<=daysInMonth;d++){
    const key=dk(year,month,d),dayPosts=state.posts[key]||[],isToday=isThisM&&today.getDate()===d;
    let visible=dayPosts;
    if(state.filterClientId)visible=visible.filter(p=>p.clientId===state.filterClientId);
    if(state.filterContentType)visible=visible.filter(p=>p.contentType===state.filterContentType||getCT(p.contentType)?.id===state.filterContentType);
    if(state.filterPlatform)visible=visible.filter(p=>p.platform===state.filterPlatform);
    if(state.filterStatus)visible=visible.filter(p=>(p.status||'draft')===state.filterStatus);
    const hasFilter=state.filterClientId||state.filterContentType||state.filterPlatform||state.filterStatus;
    const filtered=hasFilter?(visible.length>0?'f-hi':'f-dim'):'';
    const usedIds=[...new Set(visible.map(p=>p.clientId))];
    const gradient=buildGradient(usedIds.map(id=>getC(id)?.color).filter(Boolean));
    const maxShow=3,shown=visible.slice(0,maxShow),extra=visible.length-maxShow;
    const tagsHtml=shown.map(p=>{const cl=getC(p.clientId),ct=getCT(p.contentType);if(!cl)return'';const st=getST(p.status||'draft');return`<div class="cp-tag" style="background:${cl.color}"><div class="cp-tag-line1">${esc(cl.name)} <span class="cp-tag-type">[${ct?esc(ct.label):esc(p.contentType)}]</span><span class="cp-tag-st" style="background:${st.color}" title="${esc(st.name)}"></span></div>${p.note?`<div class="cp-tag-note">${esc(p.note)}</div>`:''}</div>`;}).join('');
    const heatHtml=heatmapActive&&dayPosts.length?`<div class="heatmap-layer" style="background:${getHeatmapColor(dayPosts.length,maxPosts)}"></div>`:'';
    html+=`<div class="day-cell${isToday?' today':''}${filtered?' '+filtered:''}" id="dc_${key}">${heatHtml}<div class="day-color-bar" style="background:${gradient}"></div><div class="day-num">${d}</div><div class="day-posts-wrap">${tagsHtml}${extra>0?`<div class="cp-more">+${extra} mais</div>`:''}${dayPosts.length===0?`<div class="cp-empty">+</div>`:''}</div></div>`;
  }
  // \u2500\u2500 Days AFTER this month (from next month)
  const total=firstDay+daysInMonth,pad=total%7===0?0:7-(total%7);
  const nm=month===12?1:month+1,ny=month===12?year+1:year;
  for(let i=1;i<=pad;i++){
    const key=dk(ny,nm,i);
    const nextPosts=state.posts[key]||[];
    const hasNext=nextPosts.length>0;
    html+=`<div class="day-cell outside${hasNext?' outside-has-posts':''}" data-outside-key="${key}">
      <div class="day-color-bar" style="background:${hasNext?buildGradient([...new Set(nextPosts.map(p=>p.clientId))].map(id=>getC(id)?.color).filter(Boolean)):'transparent'}"></div>
      <div class="day-num">${i}</div>
      <div class="day-posts-wrap">${ghostTags(nextPosts)}${hasNext&&nextPosts.length>2?`<div class="cp-more ghost">+${nextPosts.length-2}</div>`:''}</div>
    </div>`;
  }
  grid.innerHTML=html;
  for(let d=1;d<=daysInMonth;d++){const cell=document.getElementById(`dc_${dk(year,month,d)}`);if(cell)cell.addEventListener('click',()=>openDayModal(year,month,d));}
  // Outside days: click navigates to that month
  grid.querySelectorAll('.day-cell.outside').forEach(cell=>{
    cell.addEventListener('click',()=>{
      const key=cell.dataset.outsideKey;if(!key)return;
      const[y,m]=key.split('-').map(Number);state.year=y;state.month=m;state.weekOffset=0;renderAll();
    });
  });
}

// \u2500\u2500\u2500 Sidebar filter events \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('btnClearFilters')?.addEventListener('click',()=>{state.filterClientId=null;state.filterContentType=null;state.filterPlatform=null;renderCalendar();renderSidebarFilters();});

// \u2500\u2500\u2500 Day Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
let activeDayKey=null;
function openDayModal(y,m,d){
  activeDayKey=dk(y,m,d);state.form={selectedClients:[],selectedType:null,status:'draft',scheduledTime:'',platform:''};
  const dow=new Date(y,m-1,d).getDay();
  document.getElementById('dayModalTitle').textContent=`${DAYS[dow]}, ${d} de ${MONTHS[m-1]}`;
  document.getElementById('dayModalSub').textContent=`${y}`;
  document.getElementById('noteInput').value='';
  document.getElementById('newPostTime').value='';
  document.getElementById('inlineAddForm').style.display='none';
  document.getElementById('addPostSection').style.display=canEdit()?'':'none';
  clientDdOpen=false;platDdOpen=false;
  renderDayModalPosts();renderClientDd();renderTypeGrid();renderPlatDd();
  renderNselPostStatus();// status nsel
  updateTimeSuggestions();updateAddBtn();
  document.getElementById('dayOverlay')?.classList.add('open');
}
function closeDayModal(){document.getElementById('dayOverlay')?.classList.remove('open');activeDayKey=null;clientDdOpen=false;platDdOpen=false;}

// ================================================================
// DROPDOWN NOOMA para os "pills" editaveis do post (tipo, plataforma,
// status) dentro do modal do dia -- substitui os antigos <select> nativos.
// ================================================================
function openPostPillDropdown(anchorBtn){
  document.querySelector('.post-pill-dd-popup')?.remove();

  const postId=anchorBtn.dataset.postid;
  const idx=parseInt(anchorBtn.dataset.idx);
  const field=anchorBtn.dataset.field;
  const dp=state.posts[activeDayKey]||[];
  const post=dp[idx];
  if(!post)return;

  let items, currentVal;
  if(field==='contentType'){
    items=state.contentTypes.map(c=>({id:c.id,icon:c.icon,name:c.label,color:c.bgColor}));
    currentVal=post.contentType;
  }else if(field==='platform'){
    items=[{id:'',icon:null,name:t('pm.noPlatform'),color:null},...state.platforms.map(p=>({id:p.id,icon:p.icon,name:p.name,color:p.color}))];
    currentVal=post.platform||'';
  }else{
    items=state.postStatuses.map(s=>({id:s.id,icon:s.icon,name:s.name,color:s.color}));
    currentVal=post.status||'draft';
  }

  const popup=document.createElement('div');
  popup.className='post-pill-dd-popup';
  popup.innerHTML=items.map(it=>`
    <button type="button" class="post-pill-dd-opt${it.id===currentVal?' sel':''}" data-value="${it.id}">
      ${it.icon?renderIcon(it.icon,14):''}
      <span>${esc(it.name)}</span>
    </button>`).join('');
  document.body.appendChild(popup);

  function position(){
    const rect=anchorBtn.getBoundingClientRect();
    const w=200;
    let left=rect.left;
    if(left+w>window.innerWidth-10)left=window.innerWidth-w-10;
    if(left<10)left=10;
    let top=rect.bottom+6;
    const popupH=Math.min(280,items.length*38+10);
    if(top+popupH>window.innerHeight-10)top=rect.top-popupH-6;
    popup.style.left=left+'px';
    popup.style.top=Math.max(10,top)+'px';
  }
  popup.style.position='fixed';
  position();
  requestAnimationFrame(()=>popup.classList.add('open'));

  popup.querySelectorAll('.post-pill-dd-opt').forEach(opt=>{
    opt.addEventListener('click',async()=>{
      const val=opt.dataset.value;
      popup.remove();
      if(field==='contentType'){
        post.contentType=val;
        await updatePostField(post.id,{contentType:val});
        renderDayModalPosts();renderCalendar();renderSidebar();toast(t('t.postUpdated'));
      }else if(field==='platform'){
        const newVal=val||null;
        post.platform=newVal;
        await updatePostField(post.id,{platform:newVal});
        renderDayModalPosts();renderCalendar();toast(t('t.postUpdated'));
      }else{
        post.status=val;
        await updatePostField(post.id,{status:val});
        renderDayModalPosts();renderStatusFilterBar();renderCalendar();checkNotifications();
      }
    });
  });

  window.addEventListener('scroll',()=>{if(document.body.contains(popup))position();},true);
  setTimeout(()=>{
    document.addEventListener('click',function handler(ev){
      if(!popup.contains(ev.target)&&ev.target!==anchorBtn&&!anchorBtn.contains(ev.target)){
        popup.remove();
        document.removeEventListener('click',handler);
      }
    });
  },50);
}

function renderDayModalPosts(){
  const list=document.getElementById('postsList'),noMsg=document.getElementById('noPostsMsg');
  const posts=state.posts[activeDayKey]||[];
  if(!posts.length){list.innerHTML='';noMsg.style.display='block';return;}
  noMsg.style.display='none';
  list.innerHTML=posts.map((p,idx)=>{
    const cl=getC(p.clientId),ct=getCT(p.contentType);if(!cl)return'';
    const st=getST(p.status||'draft'),plat=getPlat(p.platform);
    const ctStyle=ct?`background:${ct.bgColor}25;color:${ct.bgColor}`:'background:rgba(255,255,255,0.1);color:var(--muted)';
    const platBadge=plat?`<span class="post-badge" style="background:${plat.color}20;color:${plat.color}">${renderIcon(plat.icon,13)} ${esc(plat.name)}</span>`:'';
    const timeHtml=p.scheduledTime?`<span class="post-time">\uD83D\uDD50 ${p.scheduledTime}</span>`:'';
    const noteHtml=p.note?`<div class="post-note">\uD83D\uDCAC ${esc(p.note)}</div>`:'';
    const creatorHtml=p.addedBy&&state.currentWorkspace?`<div class="post-creator"><img class="post-creator-avatar" src="${p.addedBy.photoURL||''}" onerror="this.style.display='none'" alt=""/><span>${esc(p.addedBy.displayName)}</span></div>`:'';
    const actionBtns=canEdit()?`<button class="btn-post-action" data-action="edit" data-idx="${idx}" title="Editar anota\u00E7\u00E3o">\u270F\uFE0F</button><button class="btn-post-action del" data-action="del" data-idx="${idx}" title="Remover">\uD83D\uDDD1</button>`:'';
    return`<div class="post-item" id="pi_${p.id}">
      <span class="post-colordot" style="background:${cl.color}"></span>
      <div class="post-info">
        <div class="post-cname">${esc(cl.name)}</div>
        <div class="post-badges">
          ${canEdit()?`<button type="button" class="post-pill-dd" data-postid="${p.id}" data-idx="${idx}" data-field="contentType" style="${ctStyle}">${ct?renderIcon(ct.icon,12):''} <span>${ct?esc(ct.label):esc(p.contentType)}</span> ${renderIcon('chevron-down',10)}</button>`:`<span class="post-badge" style="${ctStyle}">${ct?renderIcon(ct.icon,12):''} ${ct?esc(ct.label):esc(p.contentType)}</span>`}
          ${canEdit()?`<button type="button" class="post-pill-dd" data-postid="${p.id}" data-idx="${idx}" data-field="platform" style="${plat?`background:${plat.color}20;color:${plat.color}`:'background:var(--glass);color:var(--muted)'}">${plat?renderIcon(plat.icon,12):''} <span>${plat?esc(plat.name):t('pm.noPlatform')}</span> ${renderIcon('chevron-down',10)}</button>`:platBadge}
          ${canEdit()?`<button type="button" class="post-pill-dd" data-postid="${p.id}" data-idx="${idx}" data-field="status" style="background:${st.color}18;color:${st.color}">${renderIcon(st.icon,12)} <span>${esc(st.name)}</span> ${renderIcon('chevron-down',10)}</button>`:`<span class="post-badge" style="background:${st.color}18;color:${st.color}">${renderIcon(st.icon,13)} ${esc(st.name)}</span>`}
          ${timeHtml}
        </div>
        ${noteHtml}
        <div class="inline-note-edit" id="noteEdit_${p.id}" style="display:none"></div>
        ${creatorHtml}
      </div>
      <div class="post-actions">${actionBtns}</div>
    </div>`;
  }).join('');

  list.querySelectorAll('.post-pill-dd').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      openPostPillDropdown(btn);
    });
  });
  list.querySelectorAll('.btn-post-action').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const idx=parseInt(btn.dataset.idx),dp=state.posts[activeDayKey]||[],post=dp[idx];if(!post)return;
      if(btn.dataset.action==='del'){
        await removePost(post.id);dp.splice(idx,1);
        if(!dp.length)delete state.posts[activeDayKey];else state.posts[activeDayKey]=dp;
        renderDayModalPosts();renderAll();toast(t('t.postRemoved'));
      }else if(btn.dataset.action==='edit'){
        const editDiv=document.getElementById(`noteEdit_${post.id}`);
        if(editDiv.style.display==='none'){
          editDiv.innerHTML=`<textarea class="inline-note-ta" id="noteTA_${post.id}">${post.note||''}</textarea><div class="inline-note-actions"><button class="btn-note-save" data-postid="${post.id}">\uD83D\uDCBE Salvar</button><button class="btn-note-cancel" data-postid="${post.id}">\u2715 Cancelar</button></div>`;
          editDiv.style.display='block';
          editDiv.querySelector('.btn-note-save').addEventListener('click',async()=>{const n=document.getElementById(`noteTA_${post.id}`).value.trim();post.note=n;await updatePostField(post.id,{note:n});renderDayModalPosts();renderAll();toast(t('t.noteUpdated'));});
          editDiv.querySelector('.btn-note-cancel').addEventListener('click',()=>{editDiv.style.display='none';editDiv.innerHTML='';});
        }else{editDiv.style.display='none';editDiv.innerHTML='';}
      }
    });
  });
}

// Client Dropdown
function renderClientDd(){
  const menu=document.getElementById('cddMenu'),selItems=document.getElementById('cddSelItems'),btn=document.getElementById('cddBtn');
  const sel=state.form.selectedClients;
  if(!sel.length)selItems.innerHTML=`<span class="cdd-placeholder">Selecionar Cliente / Rede Social</span>`;
  else selItems.innerHTML=sel.map(id=>{const cl=getC(id);return cl?`<span class="cdd-sel-pill" style="background:${cl.color}20;color:${cl.color}">\u25CF ${esc(cl.name)}</span>`:''}).join('');
  btn.classList.toggle('open',clientDdOpen);
  const opts=state.clients.map(c=>`<div class="cdd-opt${sel.includes(c.id)?' sel':''}" data-id="${c.id}"><span class="cdd-check">${sel.includes(c.id)?'\u2713':''}</span><span class="cdd-dot-opt" style="background:${c.color}"></span><span class="cdd-opt-name">${esc(c.name)}</span></div>`).join('');
  menu.innerHTML=`${state.clients.length?opts:'<div style="padding:10px 13px;font-size:12px;color:var(--dim)">Nenhum cliente</div>'}<div class="cdd-sep"></div><div class="cdd-new" id="cddNewLink">+ Novo Cliente</div>`;
  menu.classList.toggle('open',clientDdOpen);
  menu.querySelectorAll('.cdd-opt').forEach(opt=>{
    opt.addEventListener('click',e=>{e.stopPropagation();const id=opt.dataset.id;const idx=sel.indexOf(id);if(idx>=0)sel.splice(idx,1);else sel.push(id);renderClientDd();updateAddBtn();updateTimeSuggestions();});
  });
  document.getElementById('cddNewLink')?.addEventListener('click',()=>{document.getElementById('inlineAddForm').style.display='block';clientDdOpen=false;renderClientDd();});
}

// Type grid
function renderTypeGrid(){
  const grid=document.getElementById('typeGrid');
  grid.innerHTML=state.contentTypes.map(ct=>`<div class="topt${state.form.selectedType===ct.id?' sel':''}" data-id="${ct.id}"><span class="ico">${renderIcon(ct.icon,14)}</span><span class="lbl">${esc(ct.name)}</span><span class="tbadge" style="border-color:${ct.bgColor};color:${ct.bgColor}">${esc(ct.label)}</span></div>`).join('');
  grid.querySelectorAll('.topt').forEach(opt=>{
    opt.addEventListener('click',()=>{grid.querySelectorAll('.topt').forEach(o=>o.classList.remove('sel'));opt.classList.add('sel');state.form.selectedType=opt.dataset.id;updateAddBtn();});
  });
}

// Platform custom dropdown (single-select, same style as client dd)
function renderPlatDd(){
  const menu=document.getElementById('platDdMenu'),selItems=document.getElementById('platDdSelItems'),btn=document.getElementById('platDdBtn');
  if(!menu||!selItems||!btn)return;
  const selId=state.form.platform;
  const selPlat=getPlat(selId);
  if(selPlat){
    selItems.innerHTML=`<span class="cdd-sel-pill" style="background:${selPlat.color}20;color:${selPlat.color}">${renderIcon(selPlat.icon,13)} ${esc(selPlat.name)}</span>`;
  }else{
    selItems.innerHTML=`<span class="cdd-placeholder">N\u00E3o especificada</span>`;
  }
  btn.classList.toggle('open',platDdOpen);
  const noneOpt=`<div class="cdd-opt${!selId?' sel':''}" data-platid=""><span class="cdd-dot-opt" style="background:rgba(255,255,255,0.15)"></span><span class="cdd-opt-name" style="color:var(--dim)">N\u00E3o especificada</span></div>`;
  const opts=state.platforms.map(p=>`<div class="cdd-opt${selId===p.id?' sel':''}" data-platid="${p.id}"><span class="cdd-dot-opt" style="background:${p.color}"></span><span class="cdd-opt-name">${renderIcon(p.icon,13)} ${esc(p.name)}</span></div>`).join('');
  menu.innerHTML=noneOpt+opts;
  menu.classList.toggle('open',platDdOpen);
  menu.querySelectorAll('.cdd-opt').forEach(opt=>{
    opt.addEventListener('click',e=>{e.stopPropagation();state.form.platform=opt.dataset.platid;platDdOpen=false;renderPlatDd();});
  });
}
document.getElementById('platDdBtn')?.addEventListener('click',e=>{e.stopPropagation();platDdOpen=!platDdOpen;renderPlatDd();});

// Status select


// Smart time suggestions
function getTimeSuggestions(){
  const sel=state.form.selectedClients;if(!sel.length)return['09:00','12:00','18:00'];
  const clientId=sel[0];
  const hist=Object.values(state.posts).flat().filter(p=>p.clientId===clientId&&p.scheduledTime).map(p=>p.scheduledTime);
  if(hist.length>=3){const freq={};hist.forEach(t=>{freq[t]=(freq[t]||0)+1;});return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);}
  // Use platform best times if client has a platform post
  const platPosts=Object.values(state.posts).flat().filter(p=>p.clientId===clientId&&p.platform);
  const mainPlatId=platPosts.length?platPosts[0].platform:null;
  const times=mainPlatId&&PLATFORM_BEST_TIMES[mainPlatId]?PLATFORM_BEST_TIMES[mainPlatId]:['09:00','12:00','18:00'];
  return times;
}
function updateTimeSuggestions(){
  const wrap=document.getElementById('timeSuggestions');if(!wrap)return;
  const sug=getTimeSuggestions();
  const isHist=Object.values(state.posts).flat().filter(p=>state.form.selectedClients.includes(p.clientId)&&p.scheduledTime).length>=3;
  wrap.innerHTML=sug.map(t=>`<span class="time-chip" data-t="${t}"><span class="time-chip-label">${isHist?'\uD83D\uDCCA':'\uD83D\uDCA1'}</span>${t}</span>`).join('');
  wrap.querySelectorAll('.time-chip').forEach(chip=>chip.addEventListener('click',()=>{document.getElementById('newPostTime').value=chip.dataset.t;state.form.scheduledTime=chip.dataset.t;}));
}
function updateAddBtn(){const btn=document.getElementById('btnAddPost');if(btn)btn.disabled=!(state.form.selectedClients.length>0&&state.form.selectedType);}

// Client dropdown toggle
document.getElementById('cddBtn')?.addEventListener('click',e=>{e.stopPropagation();clientDdOpen=!clientDdOpen;renderClientDd();});

// Add post
document.getElementById('btnAddPost')?.addEventListener('click',async()=>{
  if(!state.form.selectedClients.length||!state.form.selectedType)return;
  const note=document.getElementById('noteInput').value.trim();
  const time=document.getElementById('newPostTime').value||null;
  const status=getNselPostStatusValue()||'draft';
  const platform=state.form.platform||null;
  if(!state.posts[activeDayKey])state.posts[activeDayKey]=[];
  const newPosts=state.form.selectedClients.map(clientId=>({id:uid(),clientId,contentType:state.form.selectedType,note,scheduledTime:time,status,platform}));
  for(const post of newPosts){state.posts[activeDayKey].push(post);await savePost(activeDayKey,post);}
  state.form={selectedClients:[],selectedType:null,status:'draft',scheduledTime:'',platform:''};
  document.getElementById('noteInput').value='';document.getElementById('newPostTime').value='';
  clientDdOpen=false;platDdOpen=false;renderClientDd();renderTypeGrid();renderPlatDd();
  renderNselPostStatus('draft');// nsel
  renderDayModalPosts();renderAll();toast(t('t.postAdded'));setTimeout(checkNotifications,1000);
});

document.getElementById('btnCloseDayModal')?.addEventListener('click',closeDayModal);
document.getElementById('dayOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeDayModal();});

// Inline add client
const inlineColorSwatch=document.getElementById('inlineClientColorSwatch');
if(inlineColorSwatch)NoomaPicker.create(inlineColorSwatch,'#edf252',()=>{});
document.getElementById('btnSaveInlineClient')?.addEventListener('click',async()=>{
  const name=document.getElementById('inlineClientName').value.trim();if(!name){toast(t('toast.enterName'));return;}
  const color=inlineColorSwatch?._ncpGetColor?.()||'#edf252';
  const cl={id:uid(),name,color,order:state.clients.length};state.clients.push(cl);await saveClient(cl);
  document.getElementById('inlineClientName').value='';document.getElementById('inlineAddForm').style.display='none';
  renderClientDd();renderAll();toast(t('toast.created',{name}));
});

// \u2500\u2500\u2500 Clients Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openClientsModal(){
  const sub=document.getElementById('clientsModalSub');if(sub)sub.textContent=state.currentWorkspace?`Workspace: ${state.currentWorkspace.name}`:'Calend\u00E1rio Pessoal';
  renderClientsManager();document.getElementById('clientsOverlay')?.classList.add('open');
}
function closeClientsModal(){document.getElementById('clientsOverlay')?.classList.remove('open');}

function renderClientsManager(){
  const el=document.getElementById('clientsManager');if(!el)return;
  if(!state.clients.length){el.innerHTML='<div class="s-empty" style="padding:8px 0">Nenhum cliente. Crie abaixo!</div>';return;}
  el.innerHTML=state.clients.map((c,idx)=>`
    <div class="cm-item" id="cmRow_${c.id}">
      <div class="reorder-btns"><button class="btn-reorder" data-dir="up" data-id="${c.id}" ${idx===0?'disabled style="opacity:0.3"':''}>\u2191</button><button class="btn-reorder" data-dir="dn" data-id="${c.id}" ${idx===state.clients.length-1?'disabled style="opacity:0.3"':''}>\u2193</button></div>
      <div class="cm-swatch" style="background:${c.color}"><input type="color" value="${c.color}" class="cm-color-pick" data-id="${c.id}"/></div>
      <input class="cm-name" value="${esc(c.name)}" data-id="${c.id}" maxlength="30"/>
      <input class="cm-hex" value="${c.color.toUpperCase()}" data-id="${c.id}" maxlength="7"/>
      <button class="btn-cm-save" data-id="${c.id}">Salvar</button>
      <button class="btn-cm-del" data-id="${c.id}">\uD83D\uDDD1</button>
    </div>`).join('');

  el.querySelectorAll('.btn-reorder').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const id=btn.dataset.id,dir=btn.dataset.dir,idx=state.clients.findIndex(c=>c.id===id);if(idx<0)return;
      const si=dir==='up'?idx-1:idx+1;if(si<0||si>=state.clients.length)return;
      const tmp=state.clients[idx];state.clients[idx]=state.clients[si];state.clients[si]=tmp;
      state.clients.forEach((c,i)=>c.order=i);await updateClientOrder(state.clients);
      renderClientsManager();renderAll();
    });
  });
  el.querySelectorAll('.cm-color-pick').forEach(pick=>{pick.addEventListener('input',()=>{const row=document.getElementById(`cmRow_${pick.dataset.id}`);row.querySelector('.cm-hex').value=pick.value.toUpperCase();pick.closest('.cm-swatch').style.background=pick.value;});});
  el.querySelectorAll('.cm-hex').forEach(hi=>{hi.addEventListener('input',()=>{let v=hi.value;if(!v.startsWith('#'))v='#'+v;if(/^#[0-9a-fA-F]{6}$/.test(v)){const row=document.getElementById(`cmRow_${hi.dataset.id}`);const pick=row.querySelector('.cm-color-pick');pick.value=v;pick.closest('.cm-swatch').style.background=v;}});});
  el.querySelectorAll('.btn-cm-save').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,row=document.getElementById(`cmRow_${id}`),cl=state.clients.find(c=>c.id===id);if(!cl)return;cl.name=row.querySelector('.cm-name').value.trim()||cl.name;cl.color=row.querySelector('.cm-color-pick').value;await saveClient(cl);renderAll();toast(t('t.clientUpdated'));});});
  el.querySelectorAll('.btn-cm-del').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,cl=state.clients.find(c=>c.id===id);if(!confirm(`Deletar "${cl?.name}"?`))return;await removeClient(id);state.clients=state.clients.filter(c=>c.id!==id);Object.keys(state.posts).forEach(k=>{state.posts[k]=state.posts[k].filter(p=>p.clientId!==id);if(!state.posts[k].length)delete state.posts[k];});if(state.filterClientId===id)state.filterClientId=null;renderClientsManager();renderAll();toast(t('t.clientRemoved'));});});
}

const newColorSwatch=document.getElementById('newClientColorSwatch');
if(newColorSwatch)NoomaPicker.create(newColorSwatch,'#edf252',()=>{});
document.getElementById('btnCreateClient')?.addEventListener('click',async()=>{
  const name=document.getElementById('newClientName').value.trim();if(!name){toast(t('toast.enterName'));return;}
  const color=newColorSwatch?._ncpGetColor?.()||'#edf252';
  const cl={id:uid(),name,color,order:state.clients.length};state.clients.push(cl);await saveClient(cl);
  document.getElementById('newClientName').value='';renderClientsManager();renderAll();toast(t('toast.created',{name}));
});
['btnManageSide','fabClients'].forEach(id=>document.getElementById(id)?.addEventListener('click',openClientsModal));
document.getElementById('btnCloseClientsModal')?.addEventListener('click',closeClientsModal);
document.getElementById('clientsOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeClientsModal();});

// \u2500\u2500\u2500 Content Types Modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openCTModal(){renderCTManager();document.getElementById('ctOverlay')?.classList.add('open');}
function closeCTModal(){document.getElementById('ctOverlay')?.classList.remove('open');}

function renderCTManager(){
  const el=document.getElementById('ctManager');if(!el)return;
  el.innerHTML=state.contentTypes.map((ct,idx)=>`
    <div class="ct-item" id="ctRow_${ct.id}">
      <div class="reorder-btns"><button class="btn-reorder btn-ct-up" data-id="${ct.id}" ${idx===0?'disabled style="opacity:0.3"':''}>\u2191</button><button class="btn-reorder btn-ct-dn" data-id="${ct.id}" ${idx===state.contentTypes.length-1?'disabled style="opacity:0.3"':''}>\u2193</button></div>
      <div class="ct-icon-wrap" id="ctIconWrap_${ct.id}" data-icon="${ct.icon}"></div>
      <input class="ct-name-input" type="text" value="${esc(ct.name)}" data-id="${ct.id}" maxlength="20" placeholder="Nome"/>
      <input class="ct-label-input" type="text" value="${esc(ct.label)}" data-id="${ct.id}" maxlength="12" placeholder="BADGE"/>
      <div class="ct-color-pick" style="background:${ct.bgColor}" data-id="${ct.id}"><input type="color" value="${ct.bgColor}"/></div>
      <button class="btn-ct-save" data-id="${ct.id}">Salvar</button>
      <button class="btn-ct-del" data-id="${ct.id}">\uD83D\uDDD1</button>
    </div>`).join('');

  // Inicializar botoes de icone customizavel (auto-salva ao escolher, evita perder a selecao)
  state.contentTypes.forEach(ct=>{
    makeIconPickerButton(`ctIconWrap_${ct.id}`, ct.icon, async(newIcon)=>{
      ct.icon=newIcon;
      await saveCT(ct);
      renderAll();
      toast(t('t.typeUpdated'));
    });
  });

  el.querySelectorAll('.btn-ct-up,.btn-ct-dn').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,up=btn.classList.contains('btn-ct-up'),idx=state.contentTypes.findIndex(t=>t.id===id);if(idx<0)return;const si=up?idx-1:idx+1;if(si<0||si>=state.contentTypes.length)return;const tmp=state.contentTypes[idx];state.contentTypes[idx]=state.contentTypes[si];state.contentTypes[si]=tmp;state.contentTypes.forEach((t,i)=>{t.order=i;saveCT(t);});renderCTManager();renderSidebar();});});
  el.querySelectorAll('.ct-color-pick').forEach(wrap=>{const p=wrap.querySelector('input');p.addEventListener('input',()=>{wrap.style.background=p.value;});});
  el.querySelectorAll('.btn-ct-save').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,row=document.getElementById(`ctRow_${id}`),ct=state.contentTypes.find(t=>t.id===id);if(!ct)return;const iconBtn=row.querySelector(`#ctIconWrap_${id} .icon-picker-trigger`);ct.icon=iconBtn?.dataset.iconValue||ct.icon;ct.name=row.querySelector('.ct-name-input').value.trim()||ct.name;ct.label=row.querySelector('.ct-label-input').value.trim().toUpperCase()||ct.label;ct.bgColor=row.querySelector('.ct-color-pick input').value;await saveCT(ct);renderAll();toast(t('t.typeUpdated'));});});
  el.querySelectorAll('.btn-ct-del').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,ct=state.contentTypes.find(t=>t.id===id);if(!confirm(`Deletar tipo "${ct?.name}"?`))return;await removeCT(id);state.contentTypes=state.contentTypes.filter(t=>t.id!==id);renderCTManager();renderAll();toast(t('t.typeRemoved'));});});
}

document.getElementById('btnAddCT')?.addEventListener('click',async()=>{const ct={id:uid(),name:'Novo Tipo',label:'NOVO',icon:'\u2728',bgColor:'#8888ff',textColor:'#fff',order:state.contentTypes.length};state.contentTypes.push(ct);await saveCT(ct);renderCTManager();renderAll();});
['btnManageCT','fabCT'].forEach(id=>document.getElementById(id)?.addEventListener('click',openCTModal));
document.getElementById('btnCloseCT')?.addEventListener('click',closeCTModal);
document.getElementById('ctOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeCTModal();});

// \u2500\u2500\u2500 Settings Modal (Plataformas + Status) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openSettingsModal(){renderPlatManager();renderSTManager();document.getElementById('settingsOverlay')?.classList.add('open');}
function closeSettingsModal(){document.getElementById('settingsOverlay')?.classList.remove('open');}

// Platforms manager
function renderPlatManager(){
  const el=document.getElementById('platManager');if(!el)return;
  el.innerHTML=state.platforms.map((p,idx)=>`
    <div class="plat-item" id="platRow_${p.id}">
      <div class="reorder-btns"><button class="btn-reorder btn-plat-up" data-id="${p.id}" ${idx===0?'disabled style="opacity:0.3"':''}>\u2191</button><button class="btn-reorder btn-plat-dn" data-id="${p.id}" ${idx===state.platforms.length-1?'disabled style="opacity:0.3"':''}>\u2193</button></div>
      <div class="ct-icon-wrap" id="platIconWrap_${p.id}" data-icon="${p.icon}"></div>
      <input class="plat-name-input" type="text" value="${esc(p.name)}" data-id="${p.id}" maxlength="30" placeholder="Nome da plataforma"/>
      <div class="plat-color-pick" style="background:${p.color}" data-id="${p.id}"><input type="color" value="${p.color}"/></div>
      <button class="btn-plat-save" data-id="${p.id}">Salvar</button>
      <button class="btn-plat-del" data-id="${p.id}">\uD83D\uDDD1</button>
    </div>`).join('');

  state.platforms.forEach(p=>{
    makeIconPickerButton(`platIconWrap_${p.id}`, p.icon, async(newIcon)=>{
      p.icon=newIcon;
      await savePlat(p);
      renderAll();
      toast(t('t.platformUpdated'));
    });
  });
  el.querySelectorAll('.btn-plat-up,.btn-plat-dn').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,up=btn.classList.contains('btn-plat-up'),idx=state.platforms.findIndex(p=>p.id===id);if(idx<0)return;const si=up?idx-1:idx+1;if(si<0||si>=state.platforms.length)return;const tmp=state.platforms[idx];state.platforms[idx]=state.platforms[si];state.platforms[si]=tmp;state.platforms.forEach((p,i)=>{p.order=i;savePlat(p);});renderPlatManager();renderSidebarFilters();});});
  el.querySelectorAll('.plat-color-pick').forEach(wrap=>{const p=wrap.querySelector('input');p.addEventListener('input',()=>{wrap.style.background=p.value;});});
  el.querySelectorAll('.btn-plat-save').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,row=document.getElementById(`platRow_${id}`),p=state.platforms.find(x=>x.id===id);if(!p)return;const iconBtn=row.querySelector(`#platIconWrap_${id} .icon-picker-trigger`);p.icon=iconBtn?.dataset.iconValue||p.icon;p.name=row.querySelector('.plat-name-input').value.trim()||p.name;p.color=row.querySelector('.plat-color-pick input').value;await savePlat(p);renderAll();toast(t('t.platformUpdated'));});});
  el.querySelectorAll('.btn-plat-del').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,p=state.platforms.find(x=>x.id===id);if(!confirm(`Deletar plataforma "${p?.name}"?`))return;await removePlat(id);state.platforms=state.platforms.filter(x=>x.id!==id);if(state.filterPlatform===id)state.filterPlatform=null;renderPlatManager();renderAll();toast(t('t.platformRemoved'));});});
}

document.getElementById('btnAddPlat')?.addEventListener('click',async()=>{const p={id:uid(),name:'Nova Plataforma',icon:'\uD83D\uDCF1',color:'#888888',order:state.platforms.length};state.platforms.push(p);await savePlat(p);renderPlatManager();renderSidebarFilters();});

// Status manager
function renderSTManager(){
  const el=document.getElementById('stManager');if(!el)return;
  el.innerHTML=state.postStatuses.map((s,idx)=>`
    <div class="st-item" id="stRow_${s.id}">
      <div class="reorder-btns"><button class="btn-reorder btn-st-up" data-id="${s.id}" ${idx===0?'disabled style="opacity:0.3"':''}>\u2191</button><button class="btn-reorder btn-st-dn" data-id="${s.id}" ${idx===state.postStatuses.length-1?'disabled style="opacity:0.3"':''}>\u2193</button></div>
      <div class="ct-icon-wrap" id="stIconWrap_${s.id}" data-icon="${s.icon}"></div>
      <input class="st-name-input" type="text" value="${esc(s.name)}" data-id="${s.id}" maxlength="30" placeholder="Nome do status"/>
      <div class="st-color-pick" style="background:${s.color}"><input type="color" value="${s.color}"/></div>
      <button class="btn-st-save" data-id="${s.id}">Salvar</button>
      <button class="btn-st-del" data-id="${s.id}">\uD83D\uDDD1</button>
    </div>`).join('');

  state.postStatuses.forEach(s=>{
    makeIconPickerButton(`stIconWrap_${s.id}`, s.icon, async(newIcon)=>{
      s.icon=newIcon;
      await saveST(s);
      renderAll();
      toast(t('t.statusUpdated'));
    });
  });
  el.querySelectorAll('.btn-st-up,.btn-st-dn').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,up=btn.classList.contains('btn-st-up'),idx=state.postStatuses.findIndex(s=>s.id===id);if(idx<0)return;const si=up?idx-1:idx+1;if(si<0||si>=state.postStatuses.length)return;const tmp=state.postStatuses[idx];state.postStatuses[idx]=state.postStatuses[si];state.postStatuses[si]=tmp;state.postStatuses.forEach((s,i)=>{s.order=i;saveST(s);});renderSTManager();renderStatusFilterBar();});});
  el.querySelectorAll('.st-color-pick').forEach(wrap=>{const p=wrap.querySelector('input');p.addEventListener('input',()=>{wrap.style.background=p.value;});});
  el.querySelectorAll('.btn-st-save').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,row=document.getElementById(`stRow_${id}`),s=state.postStatuses.find(x=>x.id===id);if(!s)return;const iconBtn=row.querySelector(`#stIconWrap_${id} .icon-picker-trigger`);s.icon=iconBtn?.dataset.iconValue||s.icon;s.name=row.querySelector('.st-name-input').value.trim()||s.name;s.color=row.querySelector('.st-color-pick input').value;await saveST(s);renderAll();toast(t('t.statusUpdated'));});});
  el.querySelectorAll('.btn-st-del').forEach(btn=>{btn.addEventListener('click',async()=>{const id=btn.dataset.id,s=state.postStatuses.find(x=>x.id===id);if(!confirm(`Deletar status "${s?.name}"?`))return;await removeST(id);state.postStatuses=state.postStatuses.filter(x=>x.id!==id);if(state.filterStatus===id)state.filterStatus=null;renderSTManager();renderStatusFilterBar();toast(t('t.statusRemoved'));});});
}

document.getElementById('btnAddST')?.addEventListener('click',async()=>{const s={id:uid(),name:'Novo Status',icon:'\uD83D\uDD35',color:'#4488ff',order:state.postStatuses.length};state.postStatuses.push(s);await saveST(s);renderSTManager();renderAll();});

['btnSettings','fabSettings'].forEach(id=>document.getElementById(id)?.addEventListener('click',openSettingsModal));
// ---- Header "mais opcoes" (menu compacto mobile) ----
document.getElementById('btnHdrMore')?.addEventListener('click',e=>{
  e.stopPropagation();
  const menu=document.getElementById('hMoreMenu');
  const btn=document.getElementById('btnHdrMore');
  const isOpen=menu?.classList.toggle('open');
  btn?.setAttribute('aria-expanded',isOpen?'true':'false');
});
document.addEventListener('click',e=>{
  if(!e.target.closest('#hMoreWrap')){
    document.getElementById('hMoreMenu')?.classList.remove('open');
    document.getElementById('btnHdrMore')?.setAttribute('aria-expanded','false');
  }
});
function closeHMoreMenu(){document.getElementById('hMoreMenu')?.classList.remove('open');}
document.querySelectorAll('.h-more-lang-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    setLang(btn.dataset.lang);
    closeHMoreMenu();
  });
});
document.getElementById('hMoreSearch')?.addEventListener('click',()=>{closeHMoreMenu();openSearch();});
document.getElementById('hMoreSettings')?.addEventListener('click',()=>{closeHMoreMenu();openSettingsModal();});
document.getElementById('hMoreWsSettings')?.addEventListener('click',()=>{closeHMoreMenu();openWsSettings();});
document.getElementById('hMoreAnalytics')?.addEventListener('click',()=>{closeHMoreMenu();openAnalytics();});

// Espelhar a visibilidade condicional (workspace ativo / admin) no menu "mais"
function syncHMoreVisibility(){
  const wsBtn=document.getElementById('btnWsSettings');
  const anBtn=document.getElementById('btnAnalytics');
  const hWs=document.getElementById('hMoreWsSettings');
  const hAn=document.getElementById('hMoreAnalytics');
  if(hWs)hWs.style.display=(wsBtn&&wsBtn.style.display!=='none')?'flex':'none';
  if(hAn)hAn.style.display=(anBtn&&anBtn.style.display!=='none')?'flex':'none';
}

document.getElementById('btnCloseSettings')?.addEventListener('click',closeSettingsModal);
document.getElementById('settingsOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeSettingsModal();});

// \u2500\u2500\u2500 Workspace Settings \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function openWsSettings(){
  const ws=state.currentWorkspace;if(!ws)return;
  document.getElementById('wsSettingsTitle').textContent=`\u2699\uFE0F ${esc(ws.name)}`;
  document.getElementById('wsSettingsSub').textContent=`${(ws.memberUids||[]).length} membros \u00B7 Voc\u00EA \u00E9 ${ws.role}`;
  await renderWsSettings(ws);document.getElementById('wsSettingsOverlay')?.classList.add('open');
}
function closeWsSettings(){document.getElementById('wsSettingsOverlay')?.classList.remove('open');}
async function renderWsSettings(ws){
  const el=document.getElementById('wsSettingsContent'),myUid=currentUser.uid,isOwner=ws.ownerId===myUid;
  // Defini\u00E7\u00E3o dos roles dispon\u00EDveis
  const ROLES=[{v:'editor',label:'\u270f\ufe0f Editor',color:'#2ed573'},{v:'viewer',label:'\ud83d\udc41 Viewer',color:'#888888'}];
  // Gera HTML do dropdown customizado de role
  const rdd=(id,cur)=>{
    const s=ROLES.find(r=>r.v===cur)||ROLES[0];
    const opts=ROLES.map(r=>`<div class="rdd-item${r.v===s.v?' sel':''}" data-v="${r.v}" data-color="${r.color}" data-label="${r.label}"><span class="rdd-dot" style="background:${r.color}"></span><span>${r.label}</span></div>`).join('');
    return `<div class="rdd-wrap" id="${id}" data-val="${s.v}"><div class="rdd-btn"><span class="rdd-dot" style="background:${s.color}"></span><span class="rdd-lbl">${esc(s.label)}</span><span class="rdd-arr">\u25BE</span></div><div class="rdd-menu">${opts}</div></div>`;
  };
  let html='';
  // \u2500\u2500\u2500 Editar Workspace (nome + logo) \u2500\u2500\u2500 s\u00F3 para o dono
  if(isOwner){
    const logoDisplay=ws.logo?`<img src="${ws.logo}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`:'\uD83C\uDFE2';
    html+=`<div class="sect-title" style="margin-bottom:8px">Editar Workspace</div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;padding:14px;background:var(--glass);border:1px solid var(--border);border-radius:12px">
      <div style="position:relative;flex-shrink:0">
        <div id="wsEditLogoPreview" style="width:56px;height:56px;border-radius:12px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:26px;overflow:hidden;border:2px solid var(--border)">${logoDisplay}</div>
        <label for="wsEditLogoInput" style="position:absolute;bottom:-4px;right:-4px;width:24px;height:24px;border-radius:50%;background:var(--accent);color:var(--accent-text);display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;border:2px solid var(--bg2)">\uD83D\uDCF7</label>
        <input type="file" id="wsEditLogoInput" accept="image/png,image/jpeg" style="display:none"/>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:8px">
        <input class="finput" type="text" id="wsEditNameInput" value="${esc(ws.name||'')}" placeholder="Nome do workspace..." maxlength="40" style="width:100%"/>
        <div class="nsel-wrap" id="wsEditCurrencyWrap" style="width:100%">
          <div class="nsel-btn" id="wsEditCurrencyBtn" style="width:100%">
            <span class="nsel-label" id="wsEditCurrencyLabel">${(CURRENCY_OPTIONS.find(c=>c.code===(ws.currency||'BRL'))||CURRENCY_OPTIONS[0]).label}</span>
            <span class="nsel-arrow">\u25BE</span>
          </div>
          <div class="nsel-menu" id="wsEditCurrencyMenu">${CURRENCY_OPTIONS.map(c=>`<div class="nsel-opt${((ws.currency||'BRL')===c.code)?' sel':''}" data-currency="${c.code}" data-label="${c.label}">${c.label}</div>`).join('')}</div>
          <input type="hidden" id="wsEditCurrencySelect" value="${ws.currency||'BRL'}"/>
        </div>
        <button class="btn-proj-save" id="btnSaveWsInfo" style="padding:8px;font-size:12px;width:100%">\uD83D\uDCBE Salvar altera\u00E7\u00F5es</button>
      </div>
    </div>
    <div class="divider"></div>`;
  }
  html+=`<div class="sect-title" style="margin-bottom:8px">Membros (${(ws.memberUids||[]).length})</div>`;
  Object.entries(ws.members||{}).forEach(([muid,m])=>{
    const isMe=muid===myUid,rc=`role-${m.role}`;
    const roleEl=isOwner&&!isMe&&m.role!=='owner'?rdd(`rdd_m_${muid}`,m.role):`<span class="ws-role-badge ${rc}">${m.role}</span>`;
    const rmBtn=isOwner&&!isMe?`<button class="btn-ws-icon btn-rm-member" data-uid="${muid}" data-name="${esc(m.displayName)}">\uD83D\uDDD1</button>`:'';
    html+=`<div class="ws-member-item"><img class="ws-member-avatar" src="${m.photoURL||''}" onerror="this.style.background='var(--bg3)';this.src=''" alt=""/><div class="ws-member-info"><div class="ws-member-name">${esc(m.displayName)}${isMe?' (voc\u00EA)':''}</div><div class="ws-member-email">${esc(m.email)}</div></div>${roleEl}${rmBtn}</div>`;
  });
  const ws2=state.userWorkspaces.find(w=>w.id===ws.id),pending=ws2?.pendingList||[];
  if(isOwner&&pending.length>0){
    html+=`<div class="pending-section-hdr" id="pendingSection"><span class="pending-section-icon">\uD83D\uDD14</span><div><div style="font-size:13px;font-weight:800;color:#ffa502">Aguardando Aprova\u00E7\u00E3o</div><div style="font-size:10px;color:rgba(255,165,2,0.7);margin-top:2px">${pending.length} pessoa${pending.length>1?'s':''} quer entrar neste workspace</div></div></div>`;
    pending.forEach(req=>{
      html+=`<div class="pending-item"><img class="ws-member-avatar" src="${req.photoURL||''}" onerror="this.style.background='var(--bg3)';this.src=''" alt=""/><div class="ws-member-info"><div class="ws-member-name">${esc(req.displayName)}</div><div class="ws-member-email">${esc(req.email)}&nbsp;\u00B7&nbsp;${relativeTime(req.requestedAt)}</div></div>${rdd(`rdd_p_${req.uid}`,'editor')}<button class="btn-approve" data-uid="${req.uid}" data-name="${esc(req.displayName)}" data-email="${esc(req.email)}" data-photo="${req.photoURL||''}">\u2713 Aprovar</button><button class="btn-reject" data-uid="${req.uid}" data-name="${esc(req.displayName)}">\u2717</button></div>`;
    });
  }
  if(isOwner){const inviteUrl=`${location.origin}${location.pathname}?join=${ws.inviteCode}`;html+=`<div class="divider"></div><div class="sect-title" style="margin-bottom:8px">\uD83D\uDD17 Link de Convite</div><div class="invite-box" id="inviteLinkBox">${inviteUrl}</div><div class="invite-btns"><button class="btn-copy" id="btnCopyLink">\uD83D\uDCCB Copiar</button><button class="btn-regen" id="btnRegenCode">\uD83D\uDD04 Novo</button></div>`;}
  html+=`<div class="divider"></div><div class="danger-zone"><div class="danger-title">\u26A0\uFE0F Danger Zone</div>${!isOwner?`<button class="btn-danger" id="btnLeaveWs">\uD83D\uDC4B Sair do Workspace</button>`:`<button class="btn-danger" id="btnDeleteWs">\uD83D\uDDD1 Deletar Workspace</button>`}</div>`;
  el.innerHTML=html;
  // Inicializar dropdowns de role customizados
  el.querySelectorAll('.rdd-wrap').forEach(wrap=>{
    const btn=wrap.querySelector('.rdd-btn'),menu=wrap.querySelector('.rdd-menu');
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      const isOpen=menu.classList.contains('open');
      el.querySelectorAll('.rdd-menu.open').forEach(m=>{m.classList.remove('open');m.previousElementSibling?.classList.remove('open');});
      if(!isOpen){btn.classList.add('open');menu.classList.add('open');}
    });
    menu.querySelectorAll('.rdd-item').forEach(item=>{
      item.addEventListener('click',e=>{
        e.stopPropagation();
        wrap.dataset.val=item.dataset.v;
        wrap.querySelector('.rdd-lbl').textContent=item.dataset.label;
        wrap.querySelector('.rdd-btn .rdd-dot').style.background=item.dataset.color;
        menu.querySelectorAll('.rdd-item').forEach(i=>i.classList.remove('sel'));
        item.classList.add('sel');
        btn.classList.remove('open');menu.classList.remove('open');
      });
    });
  });
  // Mudan\u00E7a de role de membros existentes
  el.querySelectorAll('[id^="rdd_m_"]').forEach(wrap=>{
    const muid=wrap.id.replace('rdd_m_','');
    wrap.querySelectorAll('.rdd-item').forEach(item=>{item.addEventListener('click',async()=>{await updateMemberRole(ws.id,muid,item.dataset.v);});});
  });
  el.querySelectorAll('.btn-rm-member').forEach(btn=>btn.addEventListener('click',async()=>{await removeMember(ws.id,btn.dataset.uid,btn.dataset.name);await openWsSettings();}));
  el.querySelectorAll('.btn-approve').forEach(btn=>btn.addEventListener('click',async()=>{const role=document.getElementById(`rdd_p_${btn.dataset.uid}`)?.dataset.val||'editor';await approveRequest(ws.id,{uid:btn.dataset.uid,email:btn.dataset.email,displayName:btn.dataset.name,photoURL:btn.dataset.photo},role);await renderWsSettings(state.currentWorkspace||ws);}));
  el.querySelectorAll('.btn-reject').forEach(btn=>btn.addEventListener('click',async()=>{await rejectRequest(ws.id,btn.dataset.uid,btn.dataset.name);await renderWsSettings(state.currentWorkspace||ws);}));
  document.getElementById('btnCopyLink')?.addEventListener('click',()=>{const txt=document.getElementById('inviteLinkBox')?.textContent;if(txt)navigator.clipboard.writeText(txt).then(()=>toast(t('t.linkCopied')));});
  document.getElementById('btnRegenCode')?.addEventListener('click',async()=>{await regenerateInviteCode(ws.id);const ws2=state.userWorkspaces.find(w=>w.id===ws.id);if(ws2)await renderWsSettings(ws2);});
  document.getElementById('btnLeaveWs')?.addEventListener('click',async()=>{await leaveWorkspace(ws.id);closeWsSettings();});
  document.getElementById('btnDeleteWs')?.addEventListener('click',async()=>{await deleteWorkspace(ws.id,ws.name);closeWsSettings();});
}
// Upload de logo do workspace (edi\u00E7\u00E3o)
let pendingWsEditLogoBase64=null;
document.addEventListener('change',e=>{
  if(e.target.id!=='wsEditLogoInput')return;
  const file=e.target.files[0];if(!file)return;
  if(file.size>2*1024*1024){toast(t('t.imgTooBig2'));return;}
  const reader=new FileReader();
  reader.onerror=()=>{toast(t('t.imgProcessError'));};
  reader.onload=ev=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d');const img=new Image();
    img.onload=()=>{
      const s=Math.min(img.width,img.height);
      ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,256,256);
      pendingWsEditLogoBase64=canvas.toDataURL('image/jpeg',0.85);
      const prev=document.getElementById('wsEditLogoPreview');
      if(prev)prev.innerHTML=`<img src="${pendingWsEditLogoBase64}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`;
    };
    img.onerror=()=>{toast(t('t.imgProcessError'));};
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
});
document.addEventListener('click',async e=>{
  if(e.target.id!=='btnSaveWsInfo')return;
  const ws=state.currentWorkspace;if(!ws)return;
  const name=document.getElementById('wsEditNameInput')?.value.trim();
  const currency=document.getElementById('wsEditCurrencySelect')?.value||'BRL';
  if(!name){toast(t('t.enterWsName'));return;}
  const btn=e.target;btn.innerHTML='<span class=\"ld\"></span>';btn.disabled=true;
  try{
    await updateWorkspaceInfo(ws.id,name,pendingWsEditLogoBase64,currency);
    pendingWsEditLogoBase64=null;
    toast(t('t.wsUpdated'));
  }catch(err){toast(t('toast.error',{msg:err.message}));}
  finally{btn.innerHTML='\uD83D\uDCBE Salvar altera\u00E7\u00F5es';btn.disabled=false;}
});

// --- Dropdown NOOMA para moeda do workspace (delegado, pois o HTML e recriado a cada render) ---
document.addEventListener('click',e=>{
  const btn=e.target.closest('#wsEditCurrencyBtn');
  if(btn){
    e.stopPropagation();
    document.getElementById('wsEditCurrencyMenu')?.classList.toggle('open');
    return;
  }
  const opt=e.target.closest('#wsEditCurrencyMenu .nsel-opt');
  if(opt){
    const code=opt.dataset.currency;
    const label=opt.dataset.label;
    const hidden=document.getElementById('wsEditCurrencySelect');
    const lbl=document.getElementById('wsEditCurrencyLabel');
    if(hidden)hidden.value=code;
    if(lbl)lbl.textContent=label;
    document.querySelectorAll('#wsEditCurrencyMenu .nsel-opt').forEach(o=>o.classList.toggle('sel',o===opt));
    document.getElementById('wsEditCurrencyMenu')?.classList.remove('open');
    return;
  }
  if(!e.target.closest('#wsEditCurrencyWrap'))document.getElementById('wsEditCurrencyMenu')?.classList.remove('open');
});
document.getElementById('btnWsSettings')?.addEventListener('click',openWsSettings);
document.getElementById('btnCloseWsSettings')?.addEventListener('click',closeWsSettings);
document.getElementById('wsSettingsOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeWsSettings();});
document.getElementById('btnNotif')?.addEventListener('click',async()=>{
  const wsWithPending=state.userWorkspaces.find(w=>(w.pendingCount||0)>0&&w.ownerId===currentUser?.uid);
  if(wsWithPending&&state.currentWorkspace?.id!==wsWithPending.id){switchWorkspace(wsWithPending);await new Promise(r=>setTimeout(r,350));}
  await openWsSettings();
  setTimeout(()=>{document.getElementById('pendingSection')?.scrollIntoView({behavior:'smooth',block:'start'});},200);
});

// \u2500\u2500\u2500 Create Workspace \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openCreateWs(){pendingLogoBase64=null;document.getElementById('wsLogoPreview').innerHTML='\uD83C\uDFE2';document.getElementById('wsNameInput').value='';document.getElementById('createWsOverlay')?.classList.add('open');closeWsDropdown();}
function closeCreateWs(){document.getElementById('createWsOverlay')?.classList.remove('open');}
document.getElementById('wsLogoInput')?.addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;if(file.size>500*1024){toast(t('t.imgTooBig500'));e.target.value='';return;}
  const reader=new FileReader();
  reader.onload=ev=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');
    const img=new Image();
    img.onload=()=>{
      const size=Math.min(img.width,img.height),sx=(img.width-size)/2,sy=(img.height-size)/2;
      ctx.drawImage(img,sx,sy,size,size,0,0,128,128);
      pendingLogoBase64=canvas.toDataURL('image/jpeg',0.85);
      document.getElementById('wsLogoPreview').innerHTML=`<img src="${pendingLogoBase64}" alt="Logo"/>`;
    };
    img.onerror=()=>{toast(t('t.imgProcessError'));e.target.value='';};
    img.src=ev.target.result;
  };
  reader.onerror=()=>{toast(t('t.imgProcessError'));e.target.value='';};
  reader.readAsDataURL(file);
});
['btnCreateWsLink'].forEach(id=>document.getElementById(id)?.addEventListener('click',openCreateWs));
document.getElementById('btnCloseCreateWs')?.addEventListener('click',closeCreateWs);
document.getElementById('createWsOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeCreateWs();});
document.getElementById('btnConfirmCreateWs')?.addEventListener('click',async()=>{
  const name=document.getElementById('wsNameInput').value.trim();if(!name){toast(t('toast.enterName'));return;}
  const btn=document.getElementById('btnConfirmCreateWs');btn.innerHTML='<span class="ld"></span> Criando...';btn.disabled=true;
  try{const ws=await createWorkspace(name,pendingLogoBase64);closeCreateWs();setTimeout(()=>switchWorkspace({...ws,role:'owner'}),500);}
  catch(e){toast(t('toast.error',{msg:e.message}));}
  finally{btn.innerHTML='\uD83C\uDFE2 Criar Workspace';btn.disabled=false;}
});

// \u2500\u2500\u2500 Analytics \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
async function openAnalytics(){document.getElementById('analyticsOverlay')?.classList.add('open');document.getElementById('analyticsContent').innerHTML='<div style="text-align:center;padding:30px 0;color:var(--muted)"><span class="ld"></span><br><br>Carregando...</div>';renderAnalyticsModal(await loadAnalytics());}
function closeAnalytics(){document.getElementById('analyticsOverlay')?.classList.remove('open');}
document.getElementById('btnAnalytics')?.addEventListener('click',openAnalytics);
document.getElementById('btnCloseAnalytics')?.addEventListener('click',closeAnalytics);
document.getElementById('analyticsOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeAnalytics();});
async function loadAnalytics(){
  if(currentUser?.email!==ADMIN_EMAIL)return null;
  try{const fmt=d=>d.toISOString().slice(0,10),today=new Date(),ago=n=>fmt(new Date(today.getTime()-n*86400000));const[usersSnap,todayDoc,ago3Doc,ago7Doc,ago30Doc]=await Promise.all([getDocs(collection(db,'_users')),getDoc(doc(db,'_daily',fmt(today))),getDoc(doc(db,'_daily',ago(3))),getDoc(doc(db,'_daily',ago(7))),getDoc(doc(db,'_daily',ago(30)))]);return{stats:{total:usersSnap.size,today:(todayDoc.data()?.users||[]).length,ago3:(ago3Doc.data()?.users||[]).length,ago7:(ago7Doc.data()?.users||[]).length,ago30:(ago30Doc.data()?.users||[]).length},users:usersSnap.docs.map(d=>({uid:d.id,...d.data()})).sort((a,b)=>(b.lastSeen?.seconds||0)-(a.lastSeen?.seconds||0))};}catch(e){return null;}
}
function renderAnalyticsModal(data){
  const el=document.getElementById('analyticsContent');
  if(!data){el.innerHTML='<div style="color:var(--danger);text-align:center;padding:20px">\u274C Erro.</div>';return;}
  const{stats,users}=data;
  const providerLabel=(p)=>p==='google'?'\uD83D\uDD0D Google':p==='apple'?'\uD83C\uDF4E Apple':p==='email'?'\uD83D\uDCE7 E-mail/Senha':'\uD83D\uDD11 Conta direta';
  el.innerHTML=`<div class="analytics-grid">
    <div class="stat-card main"><div class="stat-num">${stats.total}</div><div class="stat-label">Contas Registradas</div></div>
    <div class="stat-card"><div class="stat-num">${stats.today}</div><div class="stat-label">Usaram Hoje</div></div>
    <div class="stat-card"><div class="stat-num">${stats.ago3}</div><div class="stat-label">3 Dias Atr\u00E1s</div></div>
    <div class="stat-card"><div class="stat-num">${stats.ago7}</div><div class="stat-label">7 Dias Atr\u00E1s</div></div>
    <div class="stat-card"><div class="stat-num">${stats.ago30}</div><div class="stat-label">1 M\u00EAs Atr\u00E1s</div></div>
  </div>
  <div class="divider"></div>
  <div class="sect-title" style="margin-bottom:10px">Usu\u00E1rios (${users.length})</div>
  <div>${users.map(u=>`<div class="au-item">
    <img class="au-avatar" src="${u.photoURL||u.photoBase64||''}" onerror="this.style.display='none'" alt=""/>
    <div class="au-info">
      <div class="au-name">${esc(u.displayName||'Sem nome')}</div>
      <div class="au-email">${u.email||'-'}</div>
      <div style="font-size:10px;color:var(--dim);margin-top:2px;display:flex;gap:8px;flex-wrap:wrap">
        <span>${providerLabel(u.provider||'')}</span>
        ${u.phone?`<span>\uD83D\uDCF1 ${u.phone}</span>`:'<span style="color:#ff4d4d">\u26A0\uFE0F Sem telefone</span>'}
      </div>
    </div>
    <div class="au-last">${relativeTime(u.lastSeen)}</div>
  </div>`).join('')}</div>`;
}

function showLoginLoading(show){
  const l=document.getElementById('loginLoading');if(l)l.style.display=show?'flex':'none';
}
function showLoginError(msg){
  const e=document.getElementById('loginErr');if(e){e.style.display=msg?'block':'none';e.textContent=msg||'';}
}

// \u2500\u2500 Tabs Entrar / Criar conta \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.querySelectorAll('.login-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.login-tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const which=tab.dataset.ltab;
    const si=document.getElementById('loginSignIn');
    const su=document.getElementById('loginSignUp');
    if(si)si.style.display=which==='signin'?'flex':'none';
    if(su)su.style.display=which==='signup'?'flex':'none';
    showLoginError('');
  });
});

// \u2500\u2500 Entrar com email/senha \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('btnSignIn')?.addEventListener('click',async()=>{
  const email=document.getElementById('siEmail').value.trim();
  const pass=document.getElementById('siPassword').value;
  if(!email||!pass){showLoginError('Preencha e-mail e senha.');return;}
  showLoginLoading(true);showLoginError('');
  try{await signInWithEmailAndPassword(auth,email,pass);showLoginLoading(false);}
  catch(e){
    showLoginLoading(false);
    const msgs={'auth/user-not-found':t('auth.userNotFound'),'auth/wrong-password':t('auth.wrongPassword'),'auth/invalid-credential':t('auth.invalidCredential'),'auth/invalid-email':t('auth.invalidEmail'),'auth/too-many-requests':t('auth.tooManyRequests')};
    showLoginError(msgs[e.code]||`Erro: ${e.message}`);
  }
});

// \u2500\u2500 Esqueceu a senha \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('btnForgot')?.addEventListener('click',async()=>{
  const email=document.getElementById('siEmail').value.trim();
  if(!email){showLoginError('Digite seu e-mail para redefinir a senha.');return;}
  try{await sendPasswordResetEmail(auth,email);showLoginError('');toast(t('t.resetSent'));}
  catch(e){showLoginError('Erro ao enviar e-mail de redefini\u00E7\u00E3o.');}
});

// \u2500\u2500 Cadastrar com email/senha \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('btnSignUp')?.addEventListener('click',async()=>{
  const name=document.getElementById('suName').value.trim();
  const phone=document.getElementById('suPhone').value.trim();
  const email=document.getElementById('suEmail').value.trim();
  const pass=document.getElementById('suPassword').value;
  if(!name){showLoginError('Nome completo \u00E9 obrigat\u00F3rio.');return;}
  if(!phone){showLoginError('N\u00FAmero de celular \u00E9 obrigat\u00F3rio.');return;}
  if(!email){showLoginError('E-mail \u00E9 obrigat\u00F3rio.');return;}
  if(!pass||pass.length<6){showLoginError('Senha deve ter pelo menos 6 caracteres.');return;}
  showLoginLoading(true);showLoginError('');
  try{
    const cred=await createUserWithEmailAndPassword(auth,email,pass);
    await updateProfile(cred.user,{displayName:name});
    if(db) await setDoc(doc(db,'_users',cred.user.uid),{
      phone,displayName:name,email,
      provider:'email',
      createdAt:Date.now()
    },{merge:true});
    showLoginLoading(false);
    toast(t('t.accountCreated',{name}));
  }
  catch(e){
    showLoginLoading(false);
    const msgs={'auth/email-already-in-use':t('auth.emailInUse'),'auth/invalid-email':t('auth.invalidEmail'),'auth/weak-password':t('auth.weakPassword')};
    showLoginError(msgs[e.code]||`Erro: ${e.message}`);
  }
});

// \u2500\u2500 Google \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// \u2500\u2500 Detectar navegador in-app (WhatsApp, Instagram, Facebook) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function isInAppBrowser(){
  const ua=navigator.userAgent||navigator.vendor||window.opera||'';
  return /FBAN|FBAV|Instagram|WhatsApp|Line\/|MicroMessenger|TikTok/i.test(ua);
}
function isSafariIOS(){
  // iPhone/iPad Safari  -  popup funciona; redirect perde cookies por ITP
  const ua=navigator.userAgent||'';
  const isIOS=/iPad|iPhone|iPod/.test(ua)&&!window.MSStream;
  // Safari nativo no iOS (n\u00E3o Chrome/Firefox mobile)
  const isSafari=/^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return isIOS&&isSafari;
}
function showInAppBrowserWarning(){
  showLoginError('\u26A0\uFE0F Abra este link no Safari ou Chrome (n\u00E3o dentro do WhatsApp/Instagram). Toque em \u00B7\u00B7\u00B7 e escolha "Abrir no navegador".');
}

async function loginWithGoogle(){
  if(isInAppBrowser()){showInAppBrowserWarning();return;}
  showLoginLoading(true);showLoginError('');
  const provider=new GoogleAuthProvider();
  provider.setCustomParameters({prompt:'select_account'});
  try{
    // Popup e mais confiavel que redirect: nao depende do navegador manter o
    // estado entre uma navegacao completa de saida e volta do site, o que
    // alguns navegadores mobile bloqueiam por particionamento de armazenamento.
    await signInWithPopup(auth,provider);
    showLoginLoading(false);
  }
  catch(e){
    if(e.code==='auth/popup-closed-by-user'){
      showLoginLoading(false);
      return;
    }
    if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'||e.code==='auth/cancelled-popup-request'){
      // Popup bloqueado pelo navegador: usar redirect como alternativa
      try{
        localStorage.setItem('nooma_redirect_pending',Date.now().toString());
        await signInWithRedirect(auth,provider);
      }catch(e2){
        showLoginLoading(false);
        localStorage.removeItem('nooma_redirect_pending');
        showLoginError(`Erro ao conectar: ${e2.message}`);
      }
      return;
    }
    showLoginLoading(false);
    showLoginError(`Erro ao conectar: ${e.message}`);
  }
}

async function loginWithApple(){
  if(isInAppBrowser()){showInAppBrowserWarning();return;}
  showLoginLoading(true);showLoginError('');
  const provider=new OAuthProvider('apple.com');
  provider.addScope('email');provider.addScope('name');
  try{
    await signInWithPopup(auth,provider);
    showLoginLoading(false);
  }
  catch(e){
    if(e.code==='auth/popup-closed-by-user'){
      showLoginLoading(false);
      return;
    }
    if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment'||e.code==='auth/cancelled-popup-request'){
      try{
        localStorage.setItem('nooma_redirect_pending',Date.now().toString());
        await signInWithRedirect(auth,provider);
      }catch(e2){
        showLoginLoading(false);
        localStorage.removeItem('nooma_redirect_pending');
        showLoginError(`Erro ao conectar com Apple: ${e2.message}`);
      }
      return;
    }
    showLoginLoading(false);
    showLoginError(`Erro ao conectar com Apple: ${e.message}`);
  }
}

// Processar resultado de popup (Google/Apple): mesmo fluxo do redirect



let pendingAuthUser=null;

// \u2500\u2500 Modal de coleta de telefone (p\u00F3s-Google/Apple) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const COUNTRY_CODES=[
  {code:'+55', name:'Brasil',     flag:'\uD83C\uDDE7\uD83C\uDDF7', mask:'## #####-####'},
  {code:'+1',  name:'EUA/Canad\u00E1', flag:'\uD83C\uDDFA\uD83C\uDDF8', mask:'(###) ###-####'},
  {code:'+351',name:'Portugal',   flag:'\uD83C\uDDF5\uD83C\uDDF9', mask:'### ### ###'},
  {code:'+44', name:'Reino Unido',flag:'\uD83C\uDDEC\uD83C\uDDE7', mask:'#### ### ####'},
  {code:'+34', name:'Espanha',    flag:'\uD83C\uDDEA\uD83C\uDDF8', mask:'### ### ###'},
  {code:'+54', name:'Argentina',  flag:'\uD83C\uDDE6\uD83C\uDDF7', mask:'## ####-####'},
  {code:'+52', name:'M\u00E9xico',     flag:'\uD83C\uDDF2\uD83C\uDDFD', mask:'## ####-####'},
  {code:'+57', name:'Col\u00F4mbia',   flag:'\uD83C\uDDE8\uD83C\uDDF4', mask:'### ###-####'},
  {code:'+49', name:'Alemanha',   flag:'\uD83C\uDDE9\uD83C\uDDEA', mask:'#### ######'},
  {code:'+33', name:'Fran\u00E7a',     flag:'\uD83C\uDDEB\uD83C\uDDF7', mask:'## ## ## ## ##'},
  {code:'+39', name:'It\u00E1lia',     flag:'\uD83C\uDDEE\uD83C\uDDF9', mask:'### ### ####'},
  {code:'+81', name:'Jap\u00E3o',      flag:'\uD83C\uDDEF\uD83C\uDDF5', mask:'##-####-####'},
  {code:'+86', name:'China',      flag:'\uD83C\uDDE8\uD83C\uDDF3', mask:'### #### ####'},
  {code:'+91', name:'\u00CDndia',      flag:'\uD83C\uDDEE\uD83C\uDDF3', mask:'##### #####'},
];

function applyPhoneMask(raw,mask){
  const digits=raw.replace(/\D/g,'');let result='',di=0;
  for(let i=0;i<mask.length&&di<digits.length;i++){
    if(mask[i]==='#'){result+=digits[di++];}else result+=mask[i];
  }
  return result;
}

function showPhoneCollectModal(prefillName=''){
  const overlay=document.createElement('div');
  overlay.id='phoneCollectOverlay';
  overlay.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;padding:20px;';
  const codeOpts=COUNTRY_CODES.map(c=>`<option value="${c.code}" data-mask="${c.mask}">${c.flag||''} ${c.name} (${c.code})</option>`).join('');
  overlay.innerHTML=`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:20px;padding:28px;width:100%;max-width:400px;box-shadow:var(--shadow)">
    <div style="font-size:18px;font-weight:900;margin-bottom:4px">Quase l\u00E1! \uD83D\uDC4B</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:20px">Precisamos de mais algumas informa\u00E7\u00F5es</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div>
        <label style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.9px;color:var(--muted);display:block;margin-bottom:5px">Nome completo</label>
        <input class="login-input" type="text" id="pcName" value="${prefillName}" placeholder="Seu nome completo..."/>
      </div>
      <div>
        <label style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.9px;color:var(--muted);display:block;margin-bottom:5px">Pa\u00EDs</label>
        <select id="pcCountry" style="width:100%;padding:12px 14px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--text);font-size:15px;font-family:inherit">${codeOpts}</select>
      </div>
      <div>
        <label style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.9px;color:var(--muted);display:block;margin-bottom:5px">Celular</label>
        <div style="display:flex;align-items:center;gap:6px">
          <div id="pcCodeBadge" style="padding:12px 10px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid var(--border);color:var(--muted);font-size:14px;font-weight:700;flex-shrink:0;white-space:nowrap">+55</div>
          <input class="login-input" type="tel" id="pcPhone" placeholder="## #####-####" style="flex:1"/>
        </div>
      </div>
      <div id="pcErr" style="font-size:12px;color:var(--danger);display:none"></div>
      <button class="btn-login-primary" id="btnPcSave" style="margin-top:6px">Concluir cadastro \u2192</button>
    </div>
  </div>`;
  document.body.appendChild(overlay);
  
  // M\u00E1scara ao trocar pa\u00EDs
  const country=document.getElementById('pcCountry');
  const phone=document.getElementById('pcPhone');
  const badge=document.getElementById('pcCodeBadge');
  function updateCountry(){
    const sel=country.options[country.selectedIndex];
    const mask=sel.dataset.mask||'';
    const code=sel.value;
    badge.textContent=code;
    phone.placeholder=mask.replace(/#/g,'0');
    phone.value='';
  }
  country.addEventListener('change',updateCountry);
  phone.addEventListener('input',()=>{
    const sel=country.options[country.selectedIndex];
    const mask=sel?.dataset.mask||'';
    if(mask)phone.value=applyPhoneMask(phone.value,mask);
  });
  
  document.getElementById('btnPcSave')?.addEventListener('click',async()=>{
    const name=document.getElementById('pcName').value.trim();
    const phoneVal=document.getElementById('pcPhone').value.trim();
    const code=document.getElementById('pcCountry').value;
    const errEl=document.getElementById('pcErr');
    if(!name){errEl.style.display='block';errEl.textContent='Nome completo \u00E9 obrigat\u00F3rio.';return;}
    if(!phoneVal){errEl.style.display='block';errEl.textContent='Celular \u00E9 obrigat\u00F3rio.';return;}
    const fullPhone=`${code} ${phoneVal}`;
    const btn=document.getElementById('btnPcSave');
    btn.innerHTML='<span class="ld"></span>';btn.disabled=true;
    try{
      const user=pendingAuthUser||auth.currentUser;
      if(user){
        await updateProfile(user,{displayName:name||user.displayName});
        const providerData=user.providerData||[];
        const prov=providerData[0]?.providerId==='apple.com'?'apple':providerData[0]?.providerId==='google.com'?'google':'email';
        await setDoc(doc(db,'_users',user.uid),{
          phone:fullPhone,displayName:name||user.displayName||'',
          email:user.email||'',photoURL:user.photoURL||null,
          provider:prov,createdAt:Date.now()
        },{merge:true});
        const un=document.getElementById('userName');if(un)un.textContent=name;
        const av=document.getElementById('userAvatar');if(av&&user.photoURL)av.src=user.photoURL;
      }
      overlay.remove();pendingAuthUser=null;
      toast(t('t.signupComplete'));
    }catch(e){
      btn.innerHTML='Concluir cadastro \u2192';btn.disabled=false;
      errEl.style.display='block';errEl.textContent=`Erro: ${e.message}`;
    }
  });
}

document.getElementById('btnGoogle')?.addEventListener('click',loginWithGoogle);
document.getElementById('btnGoogleSignUp')?.addEventListener('click',loginWithGoogle);

// \u2500\u2500 Apple buttons (se existirem) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('btnApple')?.addEventListener('click',loginWithApple);
document.getElementById('btnAppleSignUp')?.addEventListener('click',loginWithApple);


// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// APP TABS  -  Calend\u00E1rio / Projetos
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
let currentAppTab = 'calendar';

// ================================================================
// TAREFAS -- quadro simples de 2 colunas (Pendentes / Concluidas),
// no mesmo padrao visual e de dados do resto do app.
// ================================================================
const TASK_PRIORITIES = {
  alta:   {label:'Alta',   color:'#ff4d4d'},
  normal: {label:'Normal', color:'#ffa502'},
  baixa:  {label:'Baixa',  color:'#2ed573'},
};

function getTaskDueChip(task){
  if(!task.dueDate)return '';
  const today=fmtDate(new Date());
  const cls=task.dueDate<today?'due-overdue':task.dueDate===today?'due-today':'';
  const label=new Date(task.dueDate+'T12:00:00').toLocaleDateString(getLocale(),{day:'2-digit',month:'2-digit'});
  return `<span class="task-chip ${cls}">${renderIcon('calendar',10)} ${label}</span>`;
}

function renderTaskCard(task){
  const pr=TASK_PRIORITIES[task.priority||'normal'];
  const checklist=task.checklist||[];
  const doneCk=checklist.filter(c=>c.done).length;
  const isDone=!!task.done;
  return `<div class="task-card${isDone?' is-done':''}" data-tid="${task.id}">
    <div class="task-card-top">
      <button type="button" class="task-check-btn${isDone?' checked':''}" data-tid="${task.id}" title="${t('tasks.markDone')}" aria-label="${t('tasks.markDone')}">
        ${isDone?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}
      </button>
      <div class="task-card-title">${esc(task.title)}</div>
    </div>
    <div class="task-card-meta">
      ${!isDone?`<span class="task-chip priority-${task.priority||'normal'}">${renderIcon('flag',10)} ${esc(pr.label)}</span>`:''}
      ${!isDone?getTaskDueChip(task):''}
      ${checklist.length?`<span class="task-chip">${renderIcon('check-circle',10)} ${doneCk}/${checklist.length}</span>`:''}
    </div>
  </div>`;
}

function getFilteredTasks(){
  const q=(taskState.searchQuery||'').toLowerCase().trim();
  return taskState.tasks.filter(t=>{
    if(q&&!(t.title||'').toLowerCase().includes(q)&&!(t.desc||'').toLowerCase().includes(q))return false;
    return true;
  });
}

function renderTasks(){
  const board=document.getElementById('taskBoard');
  const emptyState=document.getElementById('taskEmptyState');
  if(!board)return;

  if(taskState.tasks.length===0){
    board.style.display='none';
    if(emptyState)emptyState.style.display='flex';
    updateTaskTabBadge();
    return;
  }
  board.style.display='flex';
  if(emptyState)emptyState.style.display='none';

  const all=getFilteredTasks();
  const pending=all.filter(t=>!t.done).sort((a,b)=>{
    // Vencidas e proximas primeiro, depois por data de criacao
    if(a.dueDate&&b.dueDate)return a.dueDate.localeCompare(b.dueDate);
    if(a.dueDate)return -1;
    if(b.dueDate)return 1;
    return (a.createdAt||0)-(b.createdAt||0);
  });
  const done=all.filter(t=>t.done).sort((a,b)=>(b.completedAt||0)-(a.completedAt||0));

  const showDone=taskState.showDone;
  const cols=[
    {id:'pending',label:t('tasks.colPending'),color:'#74b9ff',items:pending},
  ];
  if(showDone)cols.push({id:'done',label:t('tasks.colDone'),color:'#2ed573',items:done});

  board.innerHTML=cols.map(col=>`
    <div class="task-col" data-col="${col.id}">
      <div class="task-col-hdr" style="border-top:3px solid ${col.color}">
        <span class="task-col-dot" style="background:${col.color}"></span>
        <span class="task-col-title">${esc(col.label)}</span>
        <span class="task-col-count">${col.items.length}</span>
      </div>
      <div class="task-col-body">
        ${col.items.length?col.items.map(renderTaskCard).join(''):`<div class="task-col-empty">${renderIcon(col.id==='done'?'check-circle':'circle-dashed',24)}<span>${t('tasks.colEmpty')}</span></div>`}
      </div>
    </div>
  `).join('');

  board.querySelectorAll('.task-check-btn').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      toggleTaskDone(btn.dataset.tid);
    });
  });
  board.querySelectorAll('.task-card').forEach(card=>{
    card.addEventListener('click',()=>openTaskModal(card.dataset.tid));
  });

  updateTaskTabBadge();
}

async function toggleTaskDone(taskId){
  const task=taskState.tasks.find(t=>t.id===taskId);
  if(!task)return;
  task.done=!task.done;
  task.completedAt=task.done?Date.now():null;
  task.updatedAt=Date.now();
  renderTasks();
  try{await saveTask(task);}catch(e){toast(t('toast.error',{msg:e.message}));}
}

// ---- Modal (criar/editar) ----
function renderTaskPriorityDd(){
  const lbl=document.getElementById('taskPriorityLabel');
  const menu=document.getElementById('taskPriorityMenu');
  if(!lbl||!menu)return;
  const cur=TASK_PRIORITIES[taskState._selPriority]||TASK_PRIORITIES.normal;
  lbl.innerHTML=`${renderIcon('flag',13)} ${esc(cur.label)}`;
  menu.innerHTML=Object.entries(TASK_PRIORITIES).map(([id,p])=>
    `<div class="nsel-opt${id===taskState._selPriority?' sel':''}" data-pv="${id}"><span class="nsel-opt-dot" style="background:${p.color}"></span>${esc(p.label)}</div>`
  ).join('');
  menu.querySelectorAll('.nsel-opt').forEach(opt=>{
    opt.addEventListener('click',()=>{
      taskState._selPriority=opt.dataset.pv;
      renderTaskPriorityDd();
      document.getElementById('taskPriorityMenu')?.classList.remove('open');
    });
  });
}
document.getElementById('taskPriorityBtn')?.addEventListener('click',e=>{
  e.stopPropagation();
  document.getElementById('taskPriorityMenu')?.classList.toggle('open');
});
document.addEventListener('click',e=>{
  if(!e.target.closest('#taskPriorityWrap'))document.getElementById('taskPriorityMenu')?.classList.remove('open');
});

function renderTaskChecklistEdit(){
  const el=document.getElementById('taskChecklistWrap');
  if(!el)return;
  if(!taskState.editChecklist.length){
    el.innerHTML=`<div style="font-size:11px;color:var(--dim);padding:4px 0">${t('tasks.checklistEmpty')}</div>`;
    return;
  }
  el.innerHTML=taskState.editChecklist.map((item,i)=>`
    <div class="proj-check-item">
      <div class="proj-check-box${item.done?' checked':''}" data-ci="${i}">${item.done?'\u2713':''}</div>
      <span class="proj-check-text${item.done?' done':''}">${esc(item.text)}</span>
      <button class="proj-check-del" data-di="${i}">\u2715</button>
    </div>`).join('');
  el.querySelectorAll('.proj-check-box').forEach(box=>{
    box.addEventListener('click',()=>{
      const i=+box.dataset.ci;
      taskState.editChecklist[i].done=!taskState.editChecklist[i].done;
      renderTaskChecklistEdit();
    });
  });
  el.querySelectorAll('.proj-check-del').forEach(btn=>{
    btn.addEventListener('click',()=>{
      taskState.editChecklist.splice(+btn.dataset.di,1);
      renderTaskChecklistEdit();
    });
  });
}
document.getElementById('btnAddTaskChecklistItem')?.addEventListener('click',()=>{
  const inp=document.getElementById('taskChecklistInput');
  const txt=inp?.value.trim();if(!txt)return;
  taskState.editChecklist.push({id:uid(),text:txt,done:false});
  inp.value='';
  renderTaskChecklistEdit();
});
document.getElementById('taskChecklistInput')?.addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();document.getElementById('btnAddTaskChecklistItem')?.click();}
});

function openTaskModal(taskId){
  const task=taskId?taskState.tasks.find(t=>t.id===taskId):null;
  taskState.editingId=taskId||null;
  taskState.editChecklist=task?.checklist?[...task.checklist]:[];
  taskState._selPriority=task?.priority||'normal';

  document.getElementById('taskTitleInput').value=task?.title||'';
  document.getElementById('taskDesc').value=task?.desc||'';
  document.getElementById('taskDueDate').value=task?.dueDate||'';
  document.getElementById('btnDeleteTask').style.display=task?'inline-flex':'none';
  renderTaskPriorityDd();
  renderTaskChecklistEdit();

  document.getElementById('taskModalOverlay')?.classList.add('open');
  setTimeout(()=>document.getElementById('taskTitleInput')?.focus(),50);
}
function closeTaskModal(){
  document.getElementById('taskModalOverlay')?.classList.remove('open');
}
document.getElementById('btnNewTask')?.addEventListener('click',()=>openTaskModal(null));
document.getElementById('btnCloseTaskModal')?.addEventListener('click',closeTaskModal);
document.getElementById('btnCancelTask')?.addEventListener('click',closeTaskModal);
document.getElementById('taskModalOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeTaskModal();});

document.getElementById('btnSaveTask')?.addEventListener('click',async()=>{
  const title=document.getElementById('taskTitleInput').value.trim();
  if(!title){toast(t('tasks.enterTitle'));return;}

  const existing=taskState.editingId?taskState.tasks.find(t=>t.id===taskState.editingId):null;
  const task={
    id: taskState.editingId||uid(),
    title,
    desc: document.getElementById('taskDesc').value.trim(),
    priority: taskState._selPriority||'normal',
    dueDate: document.getElementById('taskDueDate').value||null,
    checklist: taskState.editChecklist,
    done: existing?.done||false,
    completedAt: existing?.completedAt||null,
    createdAt: existing?.createdAt||Date.now(),
    updatedAt: Date.now(),
  };

  const btn=document.getElementById('btnSaveTask');
  const originalHtml=btn.innerHTML;
  btn.innerHTML=`<span class="ld"></span> ${t('tasks.saving')}`;btn.disabled=true;
  try{
    await saveTask(task);
    closeTaskModal();
    toast(taskState.editingId?t('tasks.updated'):t('tasks.created'));
  }catch(e){
    toast(t('toast.error',{msg:e.message}));
  }finally{
    btn.innerHTML=originalHtml;btn.disabled=false;
  }
});

document.getElementById('btnDeleteTask')?.addEventListener('click',async()=>{
  const task=taskState.tasks.find(t=>t.id===taskState.editingId);
  if(!task||!confirm(t('tasks.confirmDelete',{title:task.title})))return;
  try{
    await deleteTaskDoc(task.id);
    closeTaskModal();
    toast(t('tasks.deleted'));
  }catch(e){toast(t('toast.error',{msg:e.message}));}
});

// ---- Busca e filtros ----
document.getElementById('taskSearch')?.addEventListener('input',e=>{
  taskState.searchQuery=e.target.value;
  renderTasks();
});
document.getElementById('taskShowDoneCheck')?.addEventListener('change',e=>{
  taskState.showDone=e.target.checked;
  renderTasks();
});

function switchAppTab(tab){
  currentAppTab = tab;
  document.querySelectorAll('.app-tab').forEach(b=>{
    b.classList.toggle('active', b.dataset.tab===tab);
  });
  const calBody = document.getElementById('appBody');
  const projBody = document.getElementById('screenProjects');
  const taskBody = document.getElementById('screenTasks');
  const sfBar = document.getElementById('statusFilterBar');
  const tabLabel = document.getElementById('appTabLabel');

  // Esconder todas as telas primeiro (mais simples e seguro do que
  // um if/else encadeado, agora que temos 3 abas em vez de 2)
  if(calBody){calBody.style.display='none';}
  if(projBody){projBody.style.display='none';projBody.style.flex='0';}
  if(taskBody){taskBody.style.display='none';taskBody.style.flex='0';}
  if(sfBar)sfBar.style.display='none';

  if(tab==='calendar'){
    if(calBody){calBody.style.display='flex';calBody.style.flex='1';}
    if(sfBar)sfBar.style.display='flex';
    if(tabLabel)tabLabel.textContent='Calendar';
  } else if(tab==='projects'){
    if(projBody){
      projBody.style.display='flex';
      projBody.style.flexDirection='column';
      projBody.style.flex='1';
      projBody.style.minHeight='0';
      projBody.style.overflow='hidden';
    }
    if(tabLabel)tabLabel.textContent='Projetos';
    setTimeout(()=>renderProjects(), 10);
  } else if(tab==='tasks'){
    if(taskBody){
      taskBody.style.display='flex';
      taskBody.style.flexDirection='column';
      taskBody.style.flex='1';
      taskBody.style.minHeight='0';
      taskBody.style.overflow='hidden';
    }
    if(tabLabel)tabLabel.textContent='Tarefas';
    setTimeout(()=>renderTasks(), 10);
  }
}

document.querySelectorAll('.app-tab').forEach(btn=>{
  btn.addEventListener('click',()=>switchAppTab(btn.dataset.tab));
});


function renderProjectsIfActive(){
  if(currentAppTab==='projects')renderProjects();
}

function updateProjTabBadge(){
  const badge = document.getElementById('projTabBadge');
  if(!badge)return;
  const urgent = getUrgentProjects().length;
  if(urgent>0){badge.textContent=urgent;badge.style.display='inline-flex';}
  else badge.style.display='none';
}

function renderTasksIfActive(){
  if(currentAppTab==='tasks')renderTasks();
}
function updateTaskTabBadge(){
  const badge = document.getElementById('taskTabBadge');
  if(!badge)return;
  const pending = taskState.tasks.filter(t=>!t.done).length;
  if(pending>0){badge.textContent=pending;badge.style.display='inline-flex';}
  else badge.style.display='none';
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// URG\u00CANCIA
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function getDaysUntilDeadline(proj){
  if(!proj.deadline)return null;
  const diff = Math.ceil((new Date(proj.deadline+'T23:59:59') - new Date()) / 86400000);
  return diff;
}
function getUrgencyLevel(proj){
  if(['concluido','cancelado'].includes(proj.status))return 'done';
  const d = getDaysUntilDeadline(proj);
  if(d===null)return 'none';
  if(d<0)return 'overdue';
  if(d<=2)return 'urgent';
  if(d<=7)return 'warning';
  return 'ok';
}
function getUrgentProjects(){
  return projState.projects.filter(p=>{
    const u=getUrgencyLevel(p);
    return u==='urgent'||u==='overdue';
  });
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// RENDER RAIL (sidebar desktop)
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function renderProjRail(){
  const rail = document.getElementById('projRailItems');
  const mobileTabsEl = document.getElementById('projStatusTabsMobile');
  if(!rail)return;

  const allCount = projState.showCompleted
    ? projState.projects.length
    : projState.projects.filter(p=>p.status!=='cancelado'&&p.status!=='concluido').length;
  const urgentAll = getUrgentProjects().length;

  let railHtml = `<div class="proj-rail-item${projState.filterStatus==='all'?' active':''}" data-status="all">
    <span class="proj-rail-dot" style="background:var(--accent)"></span>
    <span class="proj-rail-label">Todos</span>
    <span class="proj-rail-count">${allCount}</span>
    ${urgentAll>0?`<span class="proj-rail-urgent">\uD83D\uDD34 ${urgentAll}</span>`:''}
  </div>`;

  let mobileTabs = `<button class="proj-status-tab${projState.filterStatus==='all'?' active':''}" data-status="all">Todos (${allCount})</button>`;

  getAllProjStatuses().forEach(s=>{
    const count = projState.projects.filter(p=>p.status===s.id).length;
    const urgentCount = getUrgentProjects().filter(p=>p.status===s.id).length;
    railHtml += `<div class="proj-rail-item${projState.filterStatus===s.id?' active':''}" data-status="${s.id}">
      <span class="proj-rail-dot" style="background:${s.color}"></span>
      <span class="proj-rail-label">${renderIcon(s.icon,13)} ${esc(s.label)}</span>
      <span class="proj-rail-count">${count}</span>
      ${urgentCount>0?`<span class="proj-rail-urgent">${urgentCount}</span>`:''}
    </div>`;
    mobileTabs += `<button class="proj-status-tab${projState.filterStatus===s.id?' active':''}" data-status="${s.id}">${renderIcon(s.icon,13)} ${esc(s.label)}${count>0?` (${count})`:''}</button>`;
  });

  rail.innerHTML = railHtml;
  if(mobileTabsEl)mobileTabsEl.innerHTML = mobileTabs;

  // Services rail
  const svcRail = document.getElementById('projRailServices');
  if(svcRail){
    const usedServices = [...new Set(projState.projects.flatMap(p=>p.services||[]))];
    svcRail.innerHTML = usedServices.map(s=>`<div class="proj-rail-item${projState.filterService===s?' active':''}" data-service="${s}">
      <span class="proj-rail-label" style="font-size:11px">${s}</span>
    </div>`).join('');
    svcRail.querySelectorAll('[data-service]').forEach(el=>{
      el.addEventListener('click',()=>{
        projState.filterService = projState.filterService===el.dataset.service?null:el.dataset.service;
        renderProjects();
      });
    });
  }

  // Events
  document.querySelectorAll('[data-status]').forEach(el=>{
    el.addEventListener('click',()=>{
      projState.filterStatus = el.dataset.status;
      renderProjects();
      // Fechar drawer mobile ao selecionar um status
      closeProjRailMobile();
    });
  });
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// RENDER LISTA DE PROJETOS
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function filterAndSortProjects(){
  let list = [...projState.projects];
  // filter status
  if(projState.filterStatus!=='all'){
    list = list.filter(p=>p.status===projState.filterStatus);
  } else if(!projState.showCompleted){
    // Por padrao, "Todos" esconde projetos Concluidos/Cancelados (estilo Zoho)
    list = list.filter(p=>p.status!=='concluido'&&p.status!=='cancelado');
  }

  // Sincronizar com o mes selecionado no Calendario: mostra apenas projetos
  // cujo periodo (data de inicio -> prazo final) cruza com o mes em exibicao.
  if(projState.syncWithCalendarMonth){
    const monthStart=`${state.year}-${String(state.month).padStart(2,'0')}-01`;
    const lastDay=new Date(state.year,state.month,0).getDate();
    const monthEnd=`${state.year}-${String(state.month).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    list = list.filter(p=>{
      if(!p.startDate&&!p.deadline)return false;
      const s=p.startDate||p.deadline;
      const e=p.deadline||p.startDate;
      return s<=monthEnd&&e>=monthStart;
    });
  }
  // filter service
  if(projState.filterService){
    list = list.filter(p=>(p.services||[]).includes(projState.filterService));
  }
  // search
  if(projState.searchQuery){
    const q = projState.searchQuery.toLowerCase();
    list = list.filter(p=>[p.title,p.clientName,p.desc,p.notes,...(p.services||[])].join(' ').toLowerCase().includes(q));
  }
  // sort
  list.sort((a,b)=>{
    if(projState.sortBy==='deadline'){
      const da = a.deadline||'9999-12-31', db2 = b.deadline||'9999-12-31';
      return da.localeCompare(db2);
    }
    if(projState.sortBy==='urgency'){
      const order={overdue:0,urgent:1,warning:2,ok:3,none:4,done:5};
      return (order[getUrgencyLevel(a)]||4)-(order[getUrgencyLevel(b)]||4);
    }
    if(projState.sortBy==='client') return (a.clientName||'').localeCompare(b.clientName||'');
    if(projState.sortBy==='value')  return (b.value||0)-(a.value||0);
    if(projState.sortBy==='created')return (b.createdAt||0)-(a.createdAt||0);
    return 0;
  });
  return list;
}

function renderProjects(){
  renderProjRail();
  renderUrgencyBanner();
  updateProjSyncCalLabel();

  const list = filterAndSortProjects();
  const el = document.getElementById('projList');
  const colsEl = document.getElementById('projColsView');
  const title = document.getElementById('projToolbarTitle');

  const statusLabel = projState.filterStatus==='all'?t('proj.allProjects'):
    (getAllProjStatuses().find(s=>s.id===projState.filterStatus)?.label||'');
  if(title)title.textContent = statusLabel + (projState.searchQuery?` ("${esc(projState.searchQuery)}")`:'');

  // Cols view
  if(projView!=='list'){
    if(el)el.style.display='none';
    if(colsEl){colsEl.style.display='flex';}
    renderColsView(list, projView);
    return;
  }
  // List view
  if(colsEl)colsEl.style.display='none';
  if(!el)return;
  el.style.display='block';

  if(!list.length){
    el.innerHTML = `<div class="proj-empty">
      <div class="proj-empty-icon">\uD83D\uDCC2</div>
      <div class="proj-empty-title">Nenhum projeto aqui</div>
      <div class="proj-empty-sub">Clique em "+ Novo Projeto" para come\u00E7ar</div>
    </div>`;
    return;
  }

  el.innerHTML = list.map(proj=>renderProjCard(proj)).join('');

  // Events nos cards
  el.querySelectorAll('.proj-card').forEach(card=>{
    card.addEventListener('click',e=>{
      if(e.target.closest('.proj-action-btn'))return;
      openProjModal(card.dataset.id);
    });
  });
  el.querySelectorAll('.proj-action-btn[data-action="status"]').forEach(btn=>{
    btn.addEventListener('click',e=>{e.stopPropagation();cycleStatus(btn.dataset.id);});
  });
}

function renderUrgencyBanner(){
  const banner = document.getElementById('projUrgencyBanner');
  const text = document.getElementById('projUrgencyText');
  const link = document.getElementById('projUrgencyLink');
  if(!banner)return;
  const urgent = getUrgentProjects();
  if(urgent.length>0){
    banner.classList.add('show');
    const overdue = urgent.filter(p=>getDaysUntilDeadline(p)<0).length;
    const critical = urgent.filter(p=>(getDaysUntilDeadline(p)||999)>=0&&(getDaysUntilDeadline(p)||999)<=2).length;
    let msg = '';
    if(overdue>0) msg += `${overdue} projeto${overdue>1?'s':''} vencido${overdue>1?'s':''}`;
    if(critical>0) msg += `${msg?', ':''}${critical} vence em menos de 3 dias`;
    text.textContent = '\u26A0\uFE0F ' + msg;
    link.onclick = ()=>{
      projState.filterStatus='all';
      projState.showCompleted=false;
      projState.searchQuery='';
      const searchInput=document.getElementById('projSearch');
      if(searchInput)searchInput.value='';
      projState.sortBy='urgency';
      const lbl=document.getElementById('projSortLabel');
      if(lbl)lbl.textContent='\uD83D\uDD34 Urg\u00EAncia';
      document.querySelectorAll('#projSortMenu .nsel-opt').forEach(o=>o.classList.toggle('sel',o.dataset.sv==='urgency'));
      // Forcar a visualizacao em Lista -- e onde a ordenacao por urgencia
      // realmente aparece visualmente (as visoes em coluna agrupam por
      // status/responsavel e ignoram a ordenacao, dando a impressao de
      // que o botao "nao fez nada").
      setProjView('list');
      renderProjRail();
      document.querySelector('.proj-content')?.scrollTo({top:0,behavior:'smooth'});
    };
  } else {
    banner.classList.remove('show');
  }
}

function renderProjCard(proj){
  const status = getAllProjStatuses().find(s=>s.id===proj.status)||getAllProjStatuses()[0];
  const priority = PROJ_PRIORITY[proj.priority||'normal'];
  const urgency = getUrgencyLevel(proj);
  const days = getDaysUntilDeadline(proj);
  const cl = state.clients.find(c=>c.id===proj.clientId);
  const clientColor = cl?.color||'#888';
  const clientName = proj.clientName||(cl?.name)||'Sem cliente';

  // Deadline chip
  let deadlineChip = '';
  if(proj.deadline){
    const deadlineClass = urgency==='overdue'?'deadline-urgent':urgency==='urgent'?'deadline-urgent':urgency==='warning'?'deadline-warning':'deadline-ok';
    const deadlineText = urgency==='overdue'?`Vencido h\u00E1 ${Math.abs(days)}d`:
      days===0?'Vence hoje':days===1?'Vence amanh\u00E3':`${days}d restantes`;
    deadlineChip = `<span class="proj-meta-chip ${deadlineClass}">\uD83D\uDCC5 ${deadlineText}</span>`;
  }
  // Chip de periodo (inicio -> fim), quando a data de inicio estiver preenchida
  let periodChip = '';
  if(proj.startDate){
    const fmtShort=(iso)=>new Date(iso+'T12:00:00').toLocaleDateString(getLocale(),{day:'2-digit',month:'2-digit'});
    periodChip = `<span class="proj-meta-chip proj-period-chip">${renderIcon('calendar',11)} ${fmtShort(proj.startDate)} \u2192 ${proj.deadline?fmtShort(proj.deadline):'?'}</span>`;
  }

  // Services chips
  const servicesHtml = (proj.services||[]).slice(0,3).map(s=>`<span class="proj-meta-chip">${s}</span>`).join('');

  // Payment pills
  let payHtml = '';
  if(proj.value>0){
    const parcelas = proj.parcelas||[];
    const totalPaid = parcelas.filter(p=>p.paid).reduce((s,p)=>s+p.amount,0);
    const totalPending = parcelas.filter(p=>!p.paid).reduce((s,p)=>s+p.amount,0);
    const fmt = v=>fmtMoney(v);
    if(totalPaid>0) payHtml += `<span class="proj-pay-pill paid">\u2713 ${fmt(totalPaid)}</span>`;
    if(totalPending>0) payHtml += `<span class="proj-pay-pill ${urgency==='overdue'?'overdue':'pending'}">\u23F3 ${fmt(totalPending)}</span>`;
  }

  // Checklist progress
  const checks = proj.checklist||[];
  const done = checks.filter(c=>c.done).length;
  const checkText = checks.length>0?`${done}/${checks.length} entregas`:'';

  const cardClass = urgency==='overdue'||urgency==='urgent'?'urgent':urgency==='warning'?'warning':'';

  return `<div class="proj-card ${cardClass}" data-id="${proj.id}">
    <div class="proj-card-accent" style="background:${status.color}"></div>
    <div class="proj-card-body">
      <div class="proj-card-top">
        <div class="proj-card-priority" style="background:${priority.color}22;color:${priority.color}" title="Prioridade ${priority.label}">${renderIcon(priority.icon,15)}</div>
        <div class="proj-card-main">
          <div class="proj-card-client">
            <span class="proj-card-client-dot" style="background:${clientColor}"></span>
            ${clientName}
          </div>
          <div class="proj-card-title">${esc(proj.title||'Sem t\u00EDtulo')}</div>
          ${proj.desc?`<div class="proj-card-desc">${esc(proj.desc)}</div>`:''}
        </div>
        <div class="proj-card-status-wrap">
          <span class="proj-status-pill" style="background:${status.color}18;color:${status.color};border:1px solid ${status.color}44">${renderIcon(status.icon,13)} ${esc(status.label)}</span>
          ${(proj.owners||[proj.owner].filter(Boolean)).length>0?
            (proj.owners||[proj.owner]).filter(Boolean).slice(0,3).map(o=>{
              const name=ownerName(o);
              const hue=Math.abs(name.split('').reduce((a,c)=>a+c.charCodeAt(0),0))%360;
              const initials=name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
              return`<div title="${esc(name)}" style="width:22px;height:22px;border-radius:50%;background:hsl(${hue},60%,50%);display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#fff;border:2px solid var(--bg2);margin-right:-6px">${initials}</div>`;
            }).join('')
          :''}
        </div>
      </div>
      <div class="proj-card-meta">
        ${deadlineChip}
        ${periodChip}
        ${servicesHtml}
        ${checkText?`<span class="proj-meta-chip">${done===checks.length&&checks.length>0?'\u2705':'\uD83D\uDCCB'} ${checkText}</span>`:''}
        ${proj.value>0?`<span class="proj-meta-chip">\uD83D\uDCB0 ${fmtMoney(proj.value)}</span>`:''}
        <div class="proj-card-actions" style="margin-left:auto">
          <button class="proj-action-btn" data-action="status" data-id="${proj.id}" title="Avan\u00E7ar status">\u27F3</button>
        </div>
      </div>
      ${payHtml?`<div class="proj-payment-bar"><span class="proj-payment-label">Pagamento</span><div class="proj-payment-pills">${payHtml}</div></div>`:''}
      ${checks.length>0?`<div class="proj-progress-wrap" style="margin-top:8px"><div class="proj-progress-fill" style="width:${Math.round(done/checks.length*100)}%"></div></div>`:''}
    </div>
  </div>`;
}


// \u2500\u2500\u2500 Auto-add ao calend\u00E1rio quando projeto atinge Entregue/Conclu\u00EDdo \u2500\u2500\u2500
const PROJECT_MILESTONE_STATUSES=['entregue','concluido'];

async function ensureProjectContentType(){
  let ct=state.contentTypes.find(t=>t.id==='Projeto');
  if(!ct){
    ct={id:'Projeto',name:'Projeto',label:'PROJETO',icon:'\uD83D\uDCC1',bgColor:'#a29bfe',textColor:'#fff',order:state.contentTypes.length};
    state.contentTypes.push(ct);
    await saveCT(ct);
  }
  return ct;
}

async function addProjectMilestoneToCalendar(proj,statusId){
  if(!db||!currentUser)return;
  await ensureProjectContentType();
  const stObj=getAllProjStatuses().find(s=>s.id===statusId);
  const stLabel=stObj?stObj.label:statusId;
  const today=new Date();
  const dateKey=dk(today.getFullYear(),today.getMonth()+1,today.getDate());
  // ID determin\u00EDstico: evita duplicar se o mesmo marco for atingido de novo
  const postId='proj_'+proj.id+'_'+statusId;
  const post={
    id:postId,
    clientId:proj.clientId||null,
    contentType:'Projeto',
    note:`${esc(proj.title)}${proj.clientName?' - '+esc(proj.clientName):''} (${esc(stLabel)})`,
    scheduledTime:null,
    status:'published',
    platform:null,
    projectId:proj.id,
    fromProject:true,
  };
  if(!state.posts[dateKey])state.posts[dateKey]=[];
  // Evitar duplicar visualmente se j\u00E1 existe post com esse id
  const existingIdx=state.posts[dateKey].findIndex(p=>p.id===postId);
  if(existingIdx>=0)state.posts[dateKey][existingIdx]=post;
  else state.posts[dateKey].push(post);
  await savePost(dateKey,post);
  renderAll();
  toast(t('t.addedToCalendar',{label:stLabel}));
}

async function cycleStatus(projId){
  const proj = projState.projects.find(p=>p.id===projId);
  if(!proj)return;
  const order = getAllProjStatuses().map(s=>s.id);
  const idx = order.indexOf(proj.status||'contato');
  const next = order[(idx+1)%order.length];
  proj.status = next;
  await saveProject(proj);
  toast(`${getAllProjStatuses().find(s=>s.id===next)?.label}`);
  if(PROJECT_MILESTONE_STATUSES.includes(next)){
    await addProjectMilestoneToCalendar(proj,next);
  }
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// MODAL DE PROJETO
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function openProjModal(projId=null){
  const isNew = !projId;
  const proj = projId ? projState.projects.find(p=>p.id===projId) : null;
  projState.editingId = projId||null;
  projState.editChecklist = proj ? JSON.parse(JSON.stringify(proj.checklist||[])) : [];
  projState.editParcelas  = proj ? JSON.parse(JSON.stringify(proj.parcelas||[]))  : [];
  // current selections
  projState._selClientId  = proj?.isFreelancer?'__freelancer__':(proj?.clientId||null);
  projState._selStatus    = proj?.status||'contato';
  projState._selPriority  = proj?.priority||'normal';
  projState._selPayMode   = proj?.payMode||'5050';

  // Basic fields
  document.getElementById('projTitleInput').value = proj?.title||'';
  document.getElementById('projDesc').value        = proj?.desc||'';
  document.getElementById('projNotes').value       = proj?.notes||'';
  // Respons\u00E1veis m\u00FAltiplos
  // Normaliza responsaveis antigos (string livre) para o formato {name,uid}
  projState.editOwners = (proj?.owners ? [...proj.owners] : (proj?.owner ? [proj.owner] : []))
    .map(o=>typeof o==='string'?{name:o,uid:null}:o);
  renderProjOwners();
  document.getElementById('projStartDate').value   = proj?.startDate||'';
  document.getElementById('projDeadline').value    = proj?.deadline||'';
  document.getElementById('projValue').value       = proj?.value||'';

  // Fechar todos os menus pdd e RESETAR completamente os formul\u00E1rios
  // inline de criar cliente/status  -  sem isso, se o usu\u00E1rio fechasse o modal
  // com um form de cria\u00E7\u00E3o aberto, o bot\u00E3o "+ Criar novo" ficava
  // escondido para sempre nas pr\u00F3ximas aberturas.
  document.querySelectorAll('.pdd-menu').forEach(m=>m.classList.remove('open'));
  document.querySelectorAll('.pdd-btn').forEach(b=>b.classList.remove('open'));
  document.querySelectorAll('.pdd-create-inline').forEach(f=>f.style.display='none');
  document.querySelectorAll('.pdd-new-trigger').forEach(t=>t.style.display='flex');
  // Limpar campos residuais de cria\u00E7\u00E3o inline (cliente e status)
  const projClientNewNameEl=document.getElementById('projClientNewName');if(projClientNewNameEl)projClientNewNameEl.value='';
  const projStatusNewNameEl=document.getElementById('projStatusNewName');if(projStatusNewNameEl)projStatusNewNameEl.value='';
  const projStatusNewIconEl=document.getElementById('projStatusNewIcon');if(projStatusNewIconEl)projStatusNewIconEl.value='';
  // Limpar busca de cliente
  const projClientSearchEl=document.getElementById('projClientSearch');if(projClientSearchEl)projClientSearchEl.value='';
  // Limpar/preencher nome do freelancer de forma s\u00EDncrona (sem depender de setTimeout)
  const freInpNow=document.getElementById('projFreelancerName');
  const isFreelancerNow=projState._selClientId==='__freelancer__';
  if(freInpNow)freInpNow.value=(isFreelancerNow&&proj?.clientName)?proj.clientName:'';
  const freFormNow=document.getElementById('projFreelancerForm');
  if(freFormNow)freFormNow.style.display=isFreelancerNow?'flex':'none';

  // Render all custom dropdowns
  renderProjClientDd();
  renderProjStatusDd();
  renderProjPriorityDd();
  renderProjPayModeDd();

  // Services chips
  const svcs = proj?.services||[];
  document.getElementById('projServiceChips').innerHTML = PROJ_SERVICES.map(s=>
    `<div class="proj-service-chip${svcs.includes(s)?' sel':''}" data-svc="${s}">${s}</div>`
  ).join('');
  document.querySelectorAll('.proj-service-chip').forEach(chip=>{
    chip.addEventListener('click',()=>chip.classList.toggle('sel'));
  });

  // Modal accent
  const stObj = getAllProjStatuses().find(s=>s.id===projState._selStatus)||getAllProjStatuses()[0];
  document.getElementById('projModalAccent').style.background = stObj?.color||'var(--accent)';

  // Delete button
  document.getElementById('btnDeleteProj').style.display = isNew?'none':'block';

  // Parcelas
  if(!proj?.parcelas?.length){
    const val = parseFloat(document.getElementById('projValue').value)||0;
    projState.editParcelas = generateParcelas(projState._selPayMode, val);
  }
  renderParcelasEdit();

  // Checklist
  renderProjChecklistEdit();

  document.getElementById('projOverlay')?.classList.add('open');
  // Ativar color pickers NOOMA nos swatches
  setTimeout(()=>upgradePddColorSwatches(), 50);
}

// \u2500\u2500 Helpers: get all statuses (default + custom) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function getAllProjStatuses(){
  const custom = (projState.customStatuses||[]);
  return [...PROJ_STATUSES, ...custom];
}

// \u2500\u2500 DROPDOWN: Cliente \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderProjClientDd(filter=''){
  const menu = document.getElementById('projClientDdOpts');
  if(!menu)return;
  const cl = projState._selClientId;
  const clients = state.clients.filter(c=>!filter||c.name.toLowerCase().includes(filter.toLowerCase()));
  const noneClass = !cl?'sel':'';
  // Verificar se tem cliente freelancer j\u00E1 setado
  const isFreelancer = projState._selClientId==='__freelancer__';
  let html = `<div class="pdd-opt ${!cl&&!isFreelancer?' sel':''}" data-cid=""><span class="pdd-opt-dot" style="background:var(--dim)"></span><span class="pdd-opt-name" style="color:var(--dim)">Sem cliente</span></div>`;
  html += clients.map(c=>`<div class="pdd-opt${cl===c.id?' sel':''}" data-cid="${c.id}">
    <span class="pdd-opt-dot" style="background:${c.color}"></span>
    <span class="pdd-opt-name">${esc(c.name)}</span>
  </div>`).join('');
  if(!clients.length && filter) html += `<div class="pdd-empty">Nenhum cliente encontrado</div>`;
  // Se\u00E7\u00E3o freelancer
  html += `<div class="pdd-sep"></div>
  <div class="pdd-opt${isFreelancer?' sel':''}" data-cid="__freelancer__">
    <span class="pdd-opt-dot" style="background:#fd79a8"></span>
    <span class="pdd-opt-name">\uD83D\uDC64 Freelancer / Avulso</span>
  </div>`;
  menu.innerHTML = html;
  menu.querySelectorAll('.pdd-opt').forEach(opt=>{
    opt.addEventListener('click',()=>{
      projState._selClientId = opt.dataset.cid||null;
      if(opt.dataset.cid==='__freelancer__'){
        // Mostrar campo de nome freelancer
        const form=document.getElementById('projFreelancerForm');
        if(form)form.style.display='flex';
        updateProjClientDdBtn();
        closeProjDd('projClientDd');
        setTimeout(()=>document.getElementById('projFreelancerName')?.focus(),50);
      } else {
        const form=document.getElementById('projFreelancerForm');
        if(form)form.style.display='none';
        updateProjClientDdBtn();
        closeProjDd('projClientDd');
      }
    });
  });
  // Update button label
  updateProjClientDdBtn();
}
function updateProjClientDdBtn(){
  const isFreelancer = projState._selClientId==='__freelancer__';
  const cl = !isFreelancer?state.clients.find(c=>c.id===projState._selClientId):null;
  const dot = document.getElementById('projClientDdDot');
  const lbl = document.getElementById('projClientDdLabel');
  if(isFreelancer){
    if(dot){dot.style.background='#fd79a8';dot.classList.add('visible');}
    const fname=document.getElementById('projFreelancerName')?.value.trim();
    if(lbl)lbl.textContent=fname||'\uD83D\uDC64 Freelancer / Avulso';
  } else if(cl){
    if(dot){dot.style.background=cl.color;dot.classList.add('visible');}
    if(lbl)lbl.textContent=cl.name;
  } else {
    if(dot)dot.classList.remove('visible');
    if(lbl)lbl.textContent='Sem cliente';
  }
}

// \u2500\u2500 DROPDOWN: Status \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderProjStatusDd(){
  const menu = document.getElementById('projStatusDdOpts');
  if(!menu)return;
  const sel = projState._selStatus;
  menu.innerHTML = getAllProjStatuses().map(s=>`<div class="pdd-opt${sel===s.id?' sel':''}" data-sid="${s.id}" data-scolor="${s.color}">
    <span class="pdd-opt-dot" style="background:${s.color}"></span>
    <span class="pdd-opt-icon">${renderIcon(s.icon,13)}</span>
    <span class="pdd-opt-name">${esc(s.label)}</span>
  </div>`).join('');
  menu.querySelectorAll('.pdd-opt').forEach(opt=>{
    opt.addEventListener('click',()=>{
      projState._selStatus=opt.dataset.sid;
      updateProjStatusDdBtn();
      document.getElementById('projModalAccent').style.background=opt.dataset.scolor;
      closeProjDd('projStatusDd');
    });
  });
  updateProjStatusDdBtn();
}
function updateProjStatusDdBtn(){
  const st = getAllProjStatuses().find(s=>s.id===projState._selStatus)||getAllProjStatuses()[0];
  const dot = document.getElementById('projStatusDdDot');
  const lbl = document.getElementById('projStatusDdLabel');
  if(dot)dot.style.background=st.color;if(dot)dot.classList.add('visible');
  if(lbl)lbl.innerHTML=`${renderIcon(st.icon,13)} ${esc(st.label)}`;
}

// \u2500\u2500 DROPDOWN: Prioridade \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderProjPriorityDd(){
  const opts = document.querySelectorAll('#projPriorityDdMenu .pdd-opt');
  opts.forEach(opt=>{
    opt.classList.toggle('sel', opt.dataset.pval===projState._selPriority);
    opt.addEventListener('click',()=>{
      projState._selPriority=opt.dataset.pval;
      const dot=document.getElementById('projPriorityDdDot');
      const lbl=document.getElementById('projPriorityDdLabel');
      if(dot){dot.style.background=opt.dataset.pcolor;dot.classList.add('visible');}
      if(lbl)lbl.textContent=opt.textContent.trim();
      opts.forEach(o=>o.classList.remove('sel'));opt.classList.add('sel');
      closeProjDd('projPriorityDd');
    });
  });
  // Set initial
  const pr = PROJ_PRIORITY[projState._selPriority]||PROJ_PRIORITY.normal;
  const dot=document.getElementById('projPriorityDdDot');const lbl=document.getElementById('projPriorityDdLabel');
  if(dot){dot.style.background=pr.color;dot.classList.add('visible');}
  if(lbl)lbl.innerHTML=`${renderIcon(pr.icon,13)} ${pr.label}`;
}

// \u2500\u2500 DROPDOWN: Forma de Pagamento \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderProjPayModeDd(){
  const opts = document.querySelectorAll('#projPayModeDdMenu .pdd-opt');
  const labels = {avista:'\uD83D\uDCB3 \u00C0 vista','5050':'\u2702\uFE0F 50% + 50%','2x':'\uD83D\uDCC5 2x parcelado','3x':'\uD83D\uDCC5 3x parcelado',custom:'\u270F\uFE0F Personalizado'};
  opts.forEach(opt=>{
    opt.classList.toggle('sel', opt.dataset.pmval===projState._selPayMode);
    opt.addEventListener('click',()=>{
      projState._selPayMode=opt.dataset.pmval;
      const lbl=document.getElementById('projPayModeDdLabel');
      if(lbl)lbl.textContent=labels[opt.dataset.pmval]||opt.textContent.trim();
      opts.forEach(o=>o.classList.remove('sel'));opt.classList.add('sel');
      closeProjDd('projPayModeDd');
      const val=parseFloat(document.getElementById('projValue').value)||0;
      if(opt.dataset.pmval!=='custom')projState.editParcelas=generateParcelas(opt.dataset.pmval,val);
      renderParcelasEdit();
    });
  });
  const lbl=document.getElementById('projPayModeDdLabel');
  if(lbl)lbl.textContent=labels[projState._selPayMode]||'50% + 50%';
}

// \u2500\u2500 Generic PDD open/close \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openProjDd(wrapId){
  const wrap=document.getElementById(wrapId);if(!wrap)return;
  // Close others
  document.querySelectorAll('.pdd-menu.open').forEach(m=>{
    if(!wrap.contains(m)){m.classList.remove('open');m.previousElementSibling?.classList.remove('open');}
  });
  const btn=wrap.querySelector('.pdd-btn');const menu=wrap.querySelector('.pdd-menu');
  btn?.classList.toggle('open');menu?.classList.toggle('open');
}
function closeProjDd(wrapId){
  const wrap=document.getElementById(wrapId);if(!wrap)return;
  wrap.querySelector('.pdd-btn')?.classList.remove('open');
  wrap.querySelector('.pdd-menu')?.classList.remove('open');
  wrap.querySelectorAll('.pdd-create-inline').forEach(f=>f.style.display='none');
  wrap.querySelectorAll('.pdd-new-trigger').forEach(t=>t.style.display='flex');
}

// Wire up pdd-btn clicks
['projClientDd','projStatusDd','projPriorityDd','projPayModeDd'].forEach(id=>{
  document.getElementById(id+'Btn')?.addEventListener('click',e=>{e.stopPropagation();openProjDd(id);});
});

// Client search
document.getElementById('projClientSearch')?.addEventListener('input',e=>{renderProjClientDd(e.target.value);});
document.getElementById('projFreelancerName')?.addEventListener('input',()=>{updateProjClientDdBtn();});

// Client create inline
document.getElementById('projClientNewTrigger')?.addEventListener('click',()=>{
  document.getElementById('projClientCreateForm').style.display='block';
  document.getElementById('projClientNewTrigger').style.display='none';
  document.getElementById('projClientNewName')?.focus();
});
document.getElementById('projClientCancelBtn')?.addEventListener('click',()=>{
  document.getElementById('projClientCreateForm').style.display='none';
  document.getElementById('projClientNewTrigger').style.display='flex';
  document.getElementById('projClientNewName').value='';
});
// Client color picker  -  init quando trigger \u00E9 clicado
document.getElementById('projClientNewTrigger')?.addEventListener('click',()=>{
  document.getElementById('projClientCreateForm').style.display='block';
  document.getElementById('projClientNewTrigger').style.display='none';
  document.getElementById('projClientNewName')?.focus();
  const sw=document.getElementById('projClientColorSwatch');
  if(sw&&!sw._ncpInit)NoomaPicker.create(sw,'#edf252',hex=>{sw.style.background=hex;});
});
document.getElementById('projClientCreateBtn')?.addEventListener('click',async()=>{
  const name=document.getElementById('projClientNewName').value.trim();
  if(!name){toast(t('toast.enterName'));return;}
  const sw=document.getElementById('projClientColorSwatch');
  const color=sw?._ncpGetColor?.()||'#edf252';
  const cl={id:uid(),name,color,order:state.clients.length};
  state.clients.push(cl);
  await saveClient(cl);
  projState._selClientId=cl.id;
  document.getElementById('projClientCreateForm').style.display='none';
  document.getElementById('projClientNewTrigger').style.display='flex';
  document.getElementById('projClientNewName').value='';
  renderProjClientDd();
  closeProjDd('projClientDd');
  toast(t('toast.created',{name}));
});

// Status create inline
document.getElementById('projStatusNewTrigger')?.addEventListener('click',()=>{
  document.getElementById('projStatusCreateForm').style.display='block';
  document.getElementById('projStatusNewTrigger').style.display='none';
  document.getElementById('projStatusNewName')?.focus();
  const sw=document.getElementById('projStatusColorSwatch');
  if(sw&&!sw._ncpInit)NoomaPicker.create(sw,'#74b9ff',hex=>{sw.style.background=hex;});
});
document.getElementById('projStatusCancelBtn')?.addEventListener('click',()=>{
  document.getElementById('projStatusCreateForm').style.display='none';
  document.getElementById('projStatusNewTrigger').style.display='flex';
  document.getElementById('projStatusNewName').value='';document.getElementById('projStatusNewIcon').value='';
});
// color handled by NoomaPicker onChange callback
document.getElementById('projStatusCreateBtn')?.addEventListener('click',()=>{
  const name=document.getElementById('projStatusNewName').value.trim();
  const icon=document.getElementById('projStatusNewIcon').value.trim()||'\u2B50';
  const swSt=document.getElementById('projStatusColorSwatch');
  const color=swSt?._ncpGetColor?.()||'#74b9ff';
  if(!name){toast(t('t.enterStatusName'));return;}
  const newSt={id:uid(),label:name,icon,color};
  if(!projState.customStatuses)projState.customStatuses=[];
  projState.customStatuses.push(newSt);
  projState._selStatus=newSt.id;
  document.getElementById('projStatusCreateForm').style.display='none';
  document.getElementById('projStatusNewTrigger').style.display='flex';
  document.getElementById('projStatusNewName').value='';document.getElementById('projStatusNewIcon').value='';
  document.getElementById('projModalAccent').style.background=color;
  renderProjStatusDd();closeProjDd('projStatusDd');
  toast(t('t.statusCreated',{name}));
});

// Update value \u2192 recalc parcelas
document.getElementById('projValue')?.addEventListener('input',()=>{
  const val=parseFloat(document.getElementById('projValue').value)||0;
  if(projState._selPayMode!=='custom')projState.editParcelas=generateParcelas(projState._selPayMode,val);
  renderParcelasEdit();
});

// Close dropdowns on outside click (override global handler)

// \u2500\u2500 Parcelas \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function generateParcelas(mode, total){
  if(!total||total<=0)return[];
  if(mode==='avista') return [{id:uid(),label:'\u00C0 vista',amount:total,paid:false,paidAt:null}];
  if(mode==='5050')   return [{id:uid(),label:'Entrada (50%)',amount:total*0.5,paid:false,paidAt:null},{id:uid(),label:'Entrega (50%)',amount:total*0.5,paid:false,paidAt:null}];
  if(mode==='2x')     return [{id:uid(),label:'1\u00AA parcela',amount:total/2,paid:false,paidAt:null},{id:uid(),label:'2\u00AA parcela',amount:total/2,paid:false,paidAt:null}];
  if(mode==='3x')     return [{id:uid(),label:'1\u00AA parcela',amount:total/3,paid:false,paidAt:null},{id:uid(),label:'2\u00AA parcela',amount:total/3,paid:false,paidAt:null},{id:uid(),label:'3\u00AA parcela',amount:total/3,paid:false,paidAt:null}];
  return [];
}

function renderParcelasEdit(){
  const el = document.getElementById('projParcelas');if(!el)return;
  const isCustom = projState._selPayMode==='custom';
  const totalPaid = projState.editParcelas.filter(p=>p.paid).reduce((s,p)=>s+p.amount,0);
  const total = projState.editParcelas.reduce((s,p)=>s+p.amount,0);
  const fmt = v=>fmtMoney(v);
  document.getElementById('projPayTotal').textContent = fmt(total);
  document.getElementById('projPayReceived').textContent = `${fmt(totalPaid)} recebidos`;
  if(!projState.editParcelas.length){
    el.innerHTML=`<div style="font-size:11px;color:var(--dim);padding:4px 0">
      ${isCustom?'Clique em "+ Nova Parcela" para adicionar':'Informe o valor e a forma de pagamento'}
    </div>`;
    if(isCustom) renderCustomAddRow(el);
    return;
  }
  el.innerHTML = projState.editParcelas.map((p,i)=>`
    <div class="proj-parcela-row${p.paid?' paid-row':''}" data-pi="${i}">
      <div class="proj-parcela-check${p.paid?' checked':''}" data-pi="${i}">${p.paid?'\u2713':''}</div>
      <div class="proj-parcela-info" style="flex:1;min-width:0">
        ${isCustom
          ? `<input class="parcela-label-input" data-pi="${i}" value="${esc(p.label)}" placeholder="Ex: Entrada (60%)" maxlength="40" style="background:transparent;border:none;border-bottom:1px solid var(--border);color:var(--text);font-size:12px;font-weight:700;width:100%;padding:2px 0;outline:none"/>`
          : `<div class="proj-parcela-label">${esc(p.label)}</div>`
        }
        <div class="proj-parcela-sub">${p.paid?'\u2705 Recebido':'\u23F3 Aguardando'}${p.paidAt?' \u00B7 '+new Date(p.paidAt).toLocaleDateString('pt-BR'):''}</div>
      </div>
      ${isCustom
        ? `<input class="parcela-val-input" data-pi="${i}" type="number" value="${p.amount}" min="0" step="0.01" style="width:90px;text-align:right;background:var(--glass);border:1px solid var(--border);color:var(--accent);font-size:13px;font-weight:800;border-radius:7px;padding:4px 7px;outline:none"/>
           <button class="proj-parcela-del" data-pi="${i}" title="Remover">\u2715</button>`
        : `<div class="proj-parcela-val">${fmt(p.amount)}</div>`
      }
    </div>`).join('');
  if(isCustom) renderCustomAddRow(el);
  // Events
  el.querySelectorAll('.proj-parcela-check').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const i=+btn.dataset.pi;
      projState.editParcelas[i].paid=!projState.editParcelas[i].paid;
      projState.editParcelas[i].paidAt=projState.editParcelas[i].paid?Date.now():null;
      renderParcelasEdit();
    });
  });
  el.querySelectorAll('.parcela-label-input').forEach(inp=>{
    inp.addEventListener('input',()=>{const i=+inp.dataset.pi;projState.editParcelas[i].label=inp.value;});
  });
  el.querySelectorAll('.parcela-val-input').forEach(inp=>{
    inp.addEventListener('input',()=>{
      const i=+inp.dataset.pi;
      projState.editParcelas[i].amount=parseFloat(inp.value)||0;
      const total2=projState.editParcelas.reduce((s,p)=>s+p.amount,0);
      document.getElementById('projPayTotal').textContent=fmtMoney(total2);
    });
  });
  el.querySelectorAll('.proj-parcela-del').forEach(btn=>{
    btn.addEventListener('click',()=>{projState.editParcelas.splice(+btn.dataset.pi,1);renderParcelasEdit();});
  });
}

function renderCustomAddRow(el){
  const addRow=document.createElement('div');
  addRow.style.cssText='display:flex;gap:7px;margin-top:8px;align-items:center';
  addRow.innerHTML=`<input id="newParcelaLabel" placeholder="Nome da parcela..." maxlength="40" style="flex:1;padding:8px 10px;border-radius:8px;background:var(--glass);border:1px solid var(--border);color:var(--text);font-size:12px;font-family:inherit"/>
    <input id="newParcelaVal" type="number" placeholder="Valor" min="0" step="0.01" style="width:100px;padding:8px 10px;border-radius:8px;background:var(--glass);border:1px solid var(--border);color:var(--text);font-size:12px;font-family:inherit;text-align:right"/>
    <button style="padding:8px 12px;border-radius:8px;background:var(--accent);color:var(--accent-text);font-size:11px;font-weight:800;border:none;cursor:pointer;white-space:nowrap;min-height:36px" id="btnAddParcela">+ Parcela</button>`;
  el.appendChild(addRow);
  document.getElementById('btnAddParcela')?.addEventListener('click',()=>{
    const label=document.getElementById('newParcelaLabel').value.trim();
    const amount=parseFloat(document.getElementById('newParcelaVal').value)||0;
    if(!label){toast(t('t.enterParcelName'));return;}
    projState.editParcelas.push({id:uid(),label,amount,paid:false,paidAt:null});
    renderParcelasEdit();
  });
}

// \u2500\u2500 Checklist edit \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderProjChecklistEdit(){
  const el = document.getElementById('projChecklist');if(!el)return;
  if(!projState.editChecklist.length){
    el.innerHTML='<div style="font-size:11px;color:var(--dim);padding:4px 0">Nenhuma entrega adicionada ainda</div>';
  } else {
    el.innerHTML = projState.editChecklist.map((item,i)=>`
      <div class="proj-check-item">
        <div class="proj-check-box${item.done?' checked':''}" data-ci="${i}">${item.done?'\u2713':''}</div>
        <span class="proj-check-text${item.done?' done':''}">${esc(item.text)}</span>
        <button class="proj-check-del" data-di="${i}">\u2715</button>
      </div>`).join('');
    el.querySelectorAll('.proj-check-box').forEach(box=>{
      box.addEventListener('click',()=>{
        const i=+box.dataset.ci;
        projState.editChecklist[i].done=!projState.editChecklist[i].done;
        renderProjChecklistEdit();
      });
    });
    el.querySelectorAll('.proj-check-del').forEach(btn=>{
      btn.addEventListener('click',()=>{
        projState.editChecklist.splice(+btn.dataset.di,1);
        renderProjChecklistEdit();
      });
    });
  }
  const done = projState.editChecklist.filter(c=>c.done).length;
  const pct = projState.editChecklist.length?Math.round(done/projState.editChecklist.length*100):0;
  const bar = document.getElementById('projCheckProgress');
  if(bar)bar.style.width=pct+'%';
}


function addCustomParcela(){
  const label=document.getElementById('newParcLabel')?.value.trim()||'Parcela';
  const amount=parseFloat(document.getElementById('newParcAmt')?.value)||0;
  projState.editParcelas.push({id:uid(),label,amount,paid:false,paidAt:null});
  renderParcelasEdit();
}

// \u2500\u2500 Save \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('btnSaveProj')?.addEventListener('click',async()=>{
  const title = document.getElementById('projTitleInput').value.trim();
  if(!title){toast(t('t.enterProjectName'));return;}

  const startDateVal=document.getElementById('projStartDate').value;
  const deadlineVal=document.getElementById('projDeadline').value;
  if(startDateVal&&deadlineVal&&deadlineVal<startDateVal){
    toast(t('t.deadlineBeforeStart'));
    return;
  }

  const isFreelancer = projState._selClientId==='__freelancer__';
  const clientId = isFreelancer?null:(projState._selClientId||null);
  const cl = state.clients.find(c=>c.id===clientId);
  const freelancerName = isFreelancer?document.getElementById('projFreelancerName')?.value.trim()||'Freelancer':null;
  const services = [...document.querySelectorAll('.proj-service-chip.sel')].map(c=>c.dataset.svc);
  const value = parseFloat(document.getElementById('projValue').value)||0;
  const oldProj = projState.editingId?projState.projects.find(p=>p.id===projState.editingId):null;
  const oldStatus = oldProj?.status||null;

  const proj = {
    id: projState.editingId||uid(),
    title,
    clientId: clientId||null,
    clientName: freelancerName||(cl?.name||''),
    isFreelancer: isFreelancer||false,
    status: projState._selStatus||'contato',
    priority: projState._selPriority||'normal',
    startDate: document.getElementById('projStartDate').value||null,
    deadline: document.getElementById('projDeadline').value||null,
    desc: document.getElementById('projDesc').value.trim(),
    owner: projState.editOwners[0]?ownerName(projState.editOwners[0]):'',
    owners: [...projState.editOwners],
    notes: document.getElementById('projNotes').value.trim(),
    services,
    value,
    payMode: projState._selPayMode||'5050',
    parcelas: projState.editParcelas,
    checklist: projState.editChecklist,
    createdAt: projState.editingId?(projState.projects.find(p=>p.id===projState.editingId)?.createdAt||Date.now()):Date.now(),
    updatedAt: Date.now(),
  };

  const btn = document.getElementById('btnSaveProj');
  btn.innerHTML='<span class="ld"></span> Salvando...';btn.disabled=true;
  try{
    await saveProject(proj);
    // Notificar membros do workspace recem-atribuidos como responsaveis
    if(state.currentWorkspace){
      const oldOwnerUids=new Set((oldProj?.owners||[]).map(o=>ownerUid(o)).filter(Boolean));
      const newlyAssigned=proj.owners.filter(o=>{const u=ownerUid(o);return u&&!oldOwnerUids.has(u)&&u!==currentUser.uid;});
      newlyAssigned.forEach(o=>notifyProjectAssignment(o.uid,proj));
    }
    closeProjModal();
    toast(projState.editingId?'\u2705 Projeto atualizado!':'\u2705 Projeto criado!');
    // Se o status mudou para Entregue/Conclu\u00EDdo, adicionar automaticamente ao calend\u00E1rio
    if(proj.status!==oldStatus&&PROJECT_MILESTONE_STATUSES.includes(proj.status)){
      await addProjectMilestoneToCalendar(proj,proj.status);
    }
  }catch(e){toast(t('toast.error',{msg:e.message}));}
  finally{btn.innerHTML='\uD83D\uDCBE Salvar Projeto';btn.disabled=false;}
});

document.getElementById('btnDeleteProj')?.addEventListener('click',async()=>{
  const proj = projState.projects.find(p=>p.id===projState.editingId);
  if(!proj||!confirm(`Excluir "${esc(proj.title)}"?`))return;
  await deleteProject(proj.id);
  closeProjModal();
  toast(t('t.projectDeleted'));
});

function closeProjModal(){document.getElementById('projOverlay')?.classList.remove('open');}
document.getElementById('btnCloseProjModal')?.addEventListener('click',closeProjModal);
document.getElementById('projOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeProjModal();});
document.getElementById('btnNewProj')?.addEventListener('click',()=>openProjModal(null));

// \u2500\u2500 Checklist listeners \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('btnAddCheck')?.addEventListener('click',()=>{
  const inp=document.getElementById('projCheckInput');
  const txt=inp.value.trim();if(!txt)return;
  projState.editChecklist.push({id:uid(),text:txt,done:false});
  inp.value='';renderProjChecklistEdit();
});
document.getElementById('projCheckInput')?.addEventListener('keydown',e=>{
  if(e.key==='Enter')document.getElementById('btnAddCheck')?.click();
});


// \u2500\u2500 Search e sort \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
document.getElementById('projSearch')?.addEventListener('input',e=>{projState.searchQuery=e.target.value;renderProjects();});
document.getElementById('projShowCompletedCheck')?.addEventListener('change',e=>{
  projState.showCompleted=e.target.checked;
  renderProjects();
});
document.getElementById('projSyncCalCheck')?.addEventListener('change',e=>{
  projState.syncWithCalendarMonth=e.target.checked;
  updateProjSyncCalLabel();
  renderProjects();
});
function updateProjSyncCalLabel(){
  const lbl=document.getElementById('projSyncCalLabel');
  if(!lbl)return;
  lbl.textContent=projState.syncWithCalendarMonth
    ? `${MONTHS[state.month-1]} ${state.year}`
    : t('proj.syncCalendar');
}
// (handled by NOOMA nsel)

// \u2500\u2500 ESC fecha modal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500


// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// PROJ VIEW: toggle Lista / Colunas
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
let projView = 'list'; // 'list' | 'cols-status' | 'cols-owner'

function setProjView(v){
  projView = v;
  document.querySelectorAll('.proj-view-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.pview===v);
  });
  const listEl = document.getElementById('projList');
  const colsEl = document.getElementById('projColsView');
  const sortWrap = document.querySelector('.proj-sort-wrap');
  if(v==='list'){
    if(listEl)listEl.style.display='block';
    if(colsEl)colsEl.style.display='none';
    if(sortWrap)sortWrap.style.display='flex';
  } else {
    if(listEl)listEl.style.display='none';
    if(colsEl)colsEl.style.display='flex';
    if(sortWrap)sortWrap.style.display='none';
  }
  renderProjects();
}

document.querySelectorAll('.proj-view-btn').forEach(btn=>{
  btn.addEventListener('click',()=>setProjView(btn.dataset.pview));
});

// \u2500\u2500 Override renderProjects to handle view mode \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const _origRenderProjects = renderProjects;
// We'll inline the cols rendering inside renderProjects below

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// COLS VIEW RENDERER
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function renderColsView(projects, byMode){
  const el = document.getElementById('projColsView');
  if(!el)return;

  let columns = [];
  if(byMode==='cols-status'){
    // One column per status
    columns = getAllProjStatuses().map(s=>({
      id: s.id,
      title: `${renderIcon(s.icon,13)} ${esc(s.label)}`,
      color: s.color,
      projects: projects.filter(p=>(p.status||'contato')===s.id),
      addStatus: s.id,
    }));
  } else {
    // One column per responsible + one "Sem respons\u00E1vel"
    const owners = [...new Set(projects.map(p=>p.owner||''))].filter(Boolean).sort();
    if(projects.some(p=>!p.owner))owners.unshift('');
    columns = owners.map(owner=>({
      id: owner||'__none__',
      title: owner ? `${renderIcon('user',13)} ${esc(owner)}` : `${renderIcon('user',13)} Sem respons\u00E1vel`,
      color: owner ? getOwnerColor(owner) : '#636e72',
      projects: projects.filter(p=>(p.owner||'')===owner),
      addStatus: null,
    }));
    if(!columns.length) columns = [{id:'__none__',title:'\uD83D\uDC64 Nenhum respons\u00E1vel',color:'#636e72',projects:[],addStatus:null}];
  }

  // Remove empty status columns (optional  -  show all so user can drag)
  el.innerHTML = columns.map(col=>{
    const urgent = col.projects.filter(p=>getUrgencyLevel(p)==='urgent'||getUrgencyLevel(p)==='overdue').length;
    const cardsHtml = col.projects.length
      ? col.projects.map(p=>renderMiniCard(p)).join('')
      : `<div class="proj-col-empty">Nenhum projeto aqui</div>`;

    return `<div class="proj-col" data-col-id="${col.id}">
      <div class="proj-col-hdr" style="border-top:3px solid ${col.color}">
        <span class="proj-col-dot" style="background:${col.color}"></span>
        <span class="proj-col-title">${col.title}</span>
        <span class="proj-col-count">${col.projects.length}</span>
        ${urgent>0?`<span class="proj-col-urgent">\uD83D\uDD34 ${urgent}</span>`:''}
      </div>
      <div class="proj-col-body" data-col-status="${col.addStatus||''}">${cardsHtml}</div>
      <div class="proj-col-add" data-add-status="${col.addStatus||''}" data-add-owner="${col.id!=='__none__'?col.id:''}">+ Adicionar</div>
    </div>`;
  }).join('');

  // Card click \u2192 open modal
  el.querySelectorAll('.proj-mini-card').forEach(card=>{
    card.addEventListener('click',()=>openProjModal(card.dataset.pid));
  });
  // Add button \u2192 new project pre-filled
  el.querySelectorAll('.proj-col-add').forEach(btn=>{
    btn.addEventListener('click',()=>{
      openProjModal(null);
      // Pre-fill status or owner after modal opens
      if(btn.dataset.addStatus && btn.dataset.addStatus!=='__none__'){
        setTimeout(()=>{
          projState._selStatus = btn.dataset.addStatus;
          renderProjStatusDd();
          const st = getAllProjStatuses().find(s=>s.id===projState._selStatus);
          if(st)document.getElementById('projModalAccent').style.background=st.color;
        },50);
      }
      if(btn.dataset.addOwner){
        setTimeout(()=>{
          const inp = document.getElementById('projOwner');
          if(inp)inp.value = btn.dataset.addOwner;
        },50);
      }
    });
  });
}

function renderMiniCard(proj){
  const status = getAllProjStatuses().find(s=>s.id===proj.status)||getAllProjStatuses()[0];
  const cl = state.clients.find(c=>c.id===proj.clientId);
  const urgency = getUrgencyLevel(proj);
  const days = getDaysUntilDeadline(proj);
  const cardClass = urgency==='overdue'||urgency==='urgent'?'urgent':urgency==='warning'?'warning':'';

  let deadlineChip = '';
  if(proj.deadline && !['concluido','cancelado'].includes(proj.status)){
    const cls = urgency==='overdue'||urgency==='urgent'?'deadline-urgent':urgency==='warning'?'deadline-warning':'deadline-ok';
    const txt = urgency==='overdue'?`Vencido ${Math.abs(days)}d`:days===0?'Hoje':days===1?'Amanh\u00E3':`${days}d`;
    deadlineChip = `<span class="proj-mini-chip ${cls}">\uD83D\uDCC5 ${txt}</span>`;
  }

  const checks = proj.checklist||[];
  const done = checks.filter(c=>c.done).length;
  const checkChip = checks.length?`<span class="proj-mini-chip">${done===checks.length?'\u2705':'\uD83D\uDCCB'} ${done}/${checks.length}</span>`:'';

  const payChip = proj.value>0?`<span class="proj-mini-chip">\uD83D\uDCB0 ${fmtMoney(proj.value)}</span>`:'';

  const initials = (proj.owner||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  return `<div class="proj-mini-card ${cardClass}" data-pid="${proj.id}">
    <div class="proj-mini-card-bar" style="background:${cl?.color||status.color}"></div>
    <div class="proj-mini-card-body">
      ${cl?`<div class="proj-mini-client"><span class="proj-mini-client-dot" style="background:${cl.color}"></span>${esc(cl.name)}</div>`:''}
      <div class="proj-mini-title">${esc(proj.title||'Sem t\u00EDtulo')}</div>
      <div class="proj-mini-footer">
        ${deadlineChip}${checkChip}${payChip}
        ${proj.owner?`<span class="proj-mini-avatar" style="margin-left:auto" title="${proj.owner}">${initials}</span>`:''}
      </div>
    </div>
  </div>`;
}

function getOwnerColor(name){
  // Deterministic color from name
  let hash=0;for(let i=0;i<name.length;i++)hash=name.charCodeAt(i)+((hash<<5)-hash);
  const h=Math.abs(hash)%360;return`hsl(${h},60%,55%)`;
}

// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// STATUS CONFIG MODAL
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// Stored in Firestore: dataRoot()/settings/projStatuses
let projCustomStatuses = null; // null = not loaded yet

async function loadProjStatuses(){
  if(!db||!currentUser)return;
  try{
    const snap = await getDoc(doc(db, dataRoot(),'settings','projStatuses'));
    if(snap.exists()&&snap.data().statuses){
      projCustomStatuses = snap.data().statuses;
      projState.customStatuses = projCustomStatuses.filter(s=>!PROJ_STATUSES.find(d=>d.id===s.id));
    }
  }catch(e){console.warn('loadProjStatuses:',e.message);}
}

async function saveProjStatuses(statuses){
  if(!db||!currentUser)return;
  await setDoc(doc(db, dataRoot(),'settings','projStatuses'),{statuses},{merge:false});
  projCustomStatuses = statuses;
  // Update projState.customStatuses (only non-default ones)
  projState.customStatuses = statuses.filter(s=>!PROJ_STATUSES.find(d=>d.id===s.id));
}

function openProjStatusConfig(){
  renderProjStatusConfigList();
  document.getElementById('projStatusConfigOverlay')?.classList.add('open');
}
function closeProjStatusConfig(){
  document.getElementById('projStatusConfigOverlay')?.classList.remove('open');
}

function renderProjStatusConfigList(){
  const el = document.getElementById('projStatusConfigList');if(!el)return;
  const all = getAllProjStatuses();
  el.innerHTML = all.map((s,i)=>{
    const isDefault = !!PROJ_STATUSES.find(d=>d.id===s.id);
    return `<div class="psc-item" data-sid="${s.id}">
      <span class="psc-drag">\u283F</span>
      <div class="ct-icon-wrap" id="pscIconWrap_${s.id}" data-icon="${s.icon}"></div>
      <input class="psc-name" type="text" value="${esc(s.label)}" maxlength="30" data-field="label" data-sid="${s.id}"/>
      <div class="ncp-swatch psc-color" style="background:${s.color};width:28px;height:28px;border-radius:6px;flex-shrink:0" data-sid="${s.id}" data-color="${s.color}"></div>
      ${isDefault
        ? `<span class="psc-default-badge">padr\u00E3o</span>`
        : `<button class="psc-del" data-sid="${s.id}">\uD83D\uDDD1</button>`
      }
    </div>`;
  }).join('');

  // Inicializar botoes de icone customizavel (auto-salva ao escolher)
  all.forEach(s=>{
    makeIconPickerButton(`pscIconWrap_${s.id}`, s.icon, async(newIcon)=>{
      const target=getAllProjStatuses().find(x=>x.id===s.id);
      if(target){
        target.icon=newIcon;
        if(PROJ_STATUSES.find(d=>d.id===s.id)){
          // Status padrao: salvar direto na lista customizada de overrides
          if(!projState.customStatuses)projState.customStatuses=[];
          const existing=projState.customStatuses.find(x=>x.id===s.id);
          if(existing)existing.icon=newIcon;
        }
        await saveProjStatuses(getAllProjStatuses());
        toast(t('t.statusUpdated'));
      }
    });
  });

  // Inicializar color pickers NOOMA nos swatches de cor
  el.querySelectorAll('.psc-color').forEach(sw=>{
    if(sw._ncpInit)return;
    NoomaPicker.create(sw,sw.dataset.color||'#74b9ff',()=>{});
  });
  // Delete
  el.querySelectorAll('.psc-del').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const id = btn.dataset.sid;
      if(!projState.customStatuses)return;
      projState.customStatuses = projState.customStatuses.filter(s=>s.id!==id);
      renderProjStatusConfigList();
    });
  });
}

// Add new status button
// Init newStatusColorSwatch quando config abre
document.getElementById('btnProjSettings')?.addEventListener('click',()=>{
  openProjStatusConfig();
  const sw=document.getElementById('newStatusColorSwatch');
  if(sw&&!sw._ncpInit)NoomaPicker.create(sw,'#74b9ff',hex=>{sw.style.background=hex;});
});
document.getElementById('btnAddProjStatus')?.addEventListener('click',()=>{
  const icon = document.getElementById('newStatusIcon').value.trim()||'\u2B50';
  const name = document.getElementById('newStatusName').value.trim();
  const sw=document.getElementById('newStatusColorSwatch');
  const color = sw?._ncpGetColor?.()||'#74b9ff';
  if(!name){toast(t('t.enterStatusName'));return;}
  if(!projState.customStatuses)projState.customStatuses=[];
  projState.customStatuses.push({id:uid(),label:name,icon,color});
  document.getElementById('newStatusIcon').value='';
  document.getElementById('newStatusName').value='';
  renderProjStatusConfigList();
  toast(t('t.statusCreated',{name}));
});

document.getElementById('newStatusColor')?.addEventListener('input',e=>{
  document.getElementById('newStatusColorSwatch').style.background=e.target.value;
});

// Save all statuses to Firestore
document.getElementById('btnSaveProjStatuses')?.addEventListener('click',async()=>{
  const el = document.getElementById('projStatusConfigList');
  const items = el.querySelectorAll('.psc-item');
  const merged = [];
  items.forEach(item=>{
    const sid = item.dataset.sid;
    const orig = getAllProjStatuses().find(s=>s.id===sid);
    if(!orig)return;
    const iconBtn = item.querySelector('.icon-picker-trigger');
    const icon = iconBtn?.dataset.iconValue||orig.icon;
    const label = item.querySelector('input[data-field="label"]').value.trim()||orig.label;
    const swatchEl = item.querySelector('.psc-color');
    const color = swatchEl?._ncpGetColor?.()||orig.color;
    merged.push({...orig, icon, label, color});
  });
  const btn = document.getElementById('btnSaveProjStatuses');
  btn.innerHTML='<span class="ld"></span>';btn.disabled=true;
  try{
    await saveProjStatuses(merged);
    closeProjStatusConfig();
    renderProjects();
    toast(t('t.statusesSaved'));
  }catch(e){toast(t('toast.error',{msg:e.message}));}
  finally{btn.innerHTML='\uD83D\uDCBE Salvar';btn.disabled=false;}
});

// btnProjSettings listener is above (with color picker init)
document.getElementById('btnCloseProjStatusConfig')?.addEventListener('click',closeProjStatusConfig);
document.getElementById('projStatusConfigOverlay')?.addEventListener('click',e=>{
  if(e.target===e.currentTarget)closeProjStatusConfig();
});



// \u2500\u2500 PERFIL DO USU\u00C1RIO \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function openProfileModal(){
  if(!currentUser)return;
  const modal=document.getElementById('profileOverlay');if(!modal)return;
  
  // Popular dropdown custom de pa\u00EDs
  const countryMenu=document.getElementById('profileCountryDdMenu');
  const countryBtn=document.getElementById('profileCountryDdBtn');
  const countryFlag=document.getElementById('profileCountryFlag');
  const countryCodeEl=document.getElementById('profileCountryCode');
  const countryHidden=document.getElementById('profilePhoneCountry');
  if(countryMenu&&!countryMenu.dataset.populated){
    countryMenu.dataset.populated='1';
    countryMenu.innerHTML=COUNTRY_CODES.map(c=>
      `<div class="pdd-opt" data-code="${c.code}" data-mask="${c.mask}" data-flag="${c.flag||'\uD83C\uDF10'}">
        <span style="font-size:14px">${c.flag||'\uD83C\uDF10'}</span>
        <span class="pdd-opt-name">${c.name}</span>
        <span style="font-size:11px;color:var(--muted);margin-left:auto">${c.code}</span>
      </div>`
    ).join('');
    countryMenu.querySelectorAll('.pdd-opt').forEach(opt=>{
      opt.addEventListener('click',()=>{
        const code=opt.dataset.code,mask=opt.dataset.mask,flag=opt.dataset.flag||'\uD83C\uDF10';
        if(countryFlag)countryFlag.textContent=flag;
        if(countryCodeEl)countryCodeEl.textContent=code;
        if(countryHidden)countryHidden.value=code;
        const ph=document.getElementById('profilePhone');
        if(ph){ph.placeholder=mask.replace(/#/g,'0');ph.value='';}
        countryMenu.classList.remove('open');
        countryBtn?.classList.remove('open');
      });
    });
    countryBtn?.addEventListener('click',e=>{
      e.stopPropagation();
      countryMenu.classList.toggle('open');
      countryBtn.classList.toggle('open');
    });
    document.getElementById('profilePhone')?.addEventListener('input',e=>{
      const code=countryHidden?.value||'+55';
      const country=COUNTRY_CODES.find(c=>c.code===code);
      if(country?.mask)e.target.value=applyPhoneMask(e.target.value,country.mask);
    });
  }
  
  // Preencher dados
  const av=document.getElementById('profileAvatarPreview');
  const initial=encodeURIComponent((currentUser.displayName||'?')[0].toUpperCase());
  if(av)av.src=currentUser.photoURL||`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='20' fill='%23333'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-size='18'>${initial}</text></svg>`;
  
  const dn=document.getElementById('profileDisplayName');if(dn)dn.textContent=currentUser.displayName||'Sem nome';
  const de=document.getElementById('profileDisplayEmail');if(de)de.textContent=currentUser.email||'';
  document.getElementById('profileName').value=currentUser.displayName||'';
  document.getElementById('profileEmail').value=currentUser.email||'';
  
  // Carregar telefone do Firestore
  if(db&&currentUser.uid){
    getDoc(doc(db,'_users',currentUser.uid)).then(snap=>{
      if(snap.exists()){
        const d=snap.data();
        // Detectar c\u00F3digo do pa\u00EDs no telefone
        const phoneVal=d.phone||'';
        let foundCode='+55';let number=phoneVal;
        COUNTRY_CODES.forEach(c=>{if(phoneVal.startsWith(c.code+' ')){foundCode=c.code;number=phoneVal.slice(c.code.length+1);}});
        // Atualizar dropdown custom
        const country=COUNTRY_CODES.find(c=>c.code===foundCode)||COUNTRY_CODES[0];
        if(countryFlag)countryFlag.textContent=country.flag||'\uD83C\uDF10';
        if(countryCodeEl)countryCodeEl.textContent=foundCode;
        if(countryHidden)countryHidden.value=foundCode;
        const ph=document.getElementById('profilePhone');if(ph)ph.value=number;
        // Carregar foto base64 se existir
        if(d.photoBase64&&av)av.src=d.photoBase64;
        if(dn&&d.displayName)dn.textContent=d.displayName;
      }
    }).catch(()=>{});
  }
  
  // Providers
  const providers=currentUser.providerData||[];
  const provEl=document.getElementById('profileProvider');
  const provLabels={'google.com':'\uD83D\uDD0D Google','apple.com':'\uD83C\uDF4E Apple','password':'\uD83D\uDCE7 E-mail/Senha'};
  if(provEl)provEl.textContent=providers.map(p=>provLabels[p.providerId]||p.providerId).join(' \u00B7 ');
  
  const provList=document.getElementById('profileProvidersList');
  if(provList)provList.innerHTML=providers.map(p=>`<div style="display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:9px;background:var(--glass);border:1px solid var(--border);font-size:12px;font-weight:600">${provLabels[p.providerId]||p.providerId}<span style="margin-left:auto;font-size:10px;color:var(--muted)">${p.email||''}</span></div>`).join('');
  
  const hasPassword=providers.some(p=>p.providerId==='password');
  const passSection=document.getElementById('profilePasswordSection');
  if(passSection)passSection.style.display=hasPassword?'block':'none';
  
  modal.classList.add('open');
}

function closeProfileModal(){document.getElementById('profileOverlay')?.classList.remove('open');}

document.getElementById('btnCloseProfile')?.addEventListener('click',closeProfileModal);
document.getElementById('profileOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeProfileModal();});

// Avatar upload
document.getElementById('profileAvatarInput')?.addEventListener('change',e=>{
  const file=e.target.files[0];if(!file)return;
  if(file.size>2*1024*1024){toast(t('t.imgTooBig2'));return;}
  const reader=new FileReader();
  reader.onerror=()=>{toast(t('t.imgProcessError'));};
  reader.onload=ev=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const ctx=canvas.getContext('2d');const img=new Image();
    img.onload=()=>{const s=Math.min(img.width,img.height);ctx.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,256,256);
      const dataURL=canvas.toDataURL('image/jpeg',0.85);
      document.getElementById('profileAvatarPreview').src=dataURL;
      // Atualizar tambem a bolinha do cabecalho na hora, sem esperar reload
      const headerAvatar=document.getElementById('userAvatar');
      if(headerAvatar)headerAvatar.src=dataURL;
      // updateProfile com photoURL nao funciona com base64 grande -- guardar no Firestore
      if(db&&currentUser)setDoc(doc(db,'_users',currentUser.uid),{photoBase64:dataURL},{merge:true}).then(()=>toast(t('t.photoUpdated')));
    };
    img.onerror=()=>{toast(t('t.imgProcessError'));};
    img.src=ev.target.result;
  };reader.readAsDataURL(file);
});

// Salvar perfil
document.getElementById('btnSaveProfile')?.addEventListener('click',async()=>{
  if(!currentUser)return;
  const name=document.getElementById('profileName').value.trim();
  const phone=document.getElementById('profilePhone').value.trim();
  const email=document.getElementById('profileEmail').value.trim();
  const oldPass=document.getElementById('profileOldPass')?.value;
  const newPass=document.getElementById('profileNewPass')?.value;
  const btn=document.getElementById('btnSaveProfile');
  btn.innerHTML='<span class="ld"></span>';btn.disabled=true;
  try{
    const updates={};
    if(name&&name!==currentUser.displayName){
      await updateProfile(currentUser,{displayName:name});
      updates.displayName=name;
      const un=document.getElementById('userName');if(un)un.textContent=name;
      const dn=document.getElementById('profileDisplayName');if(dn)dn.textContent=name;
    }
    if(phone)updates.phone=phone;
    if(Object.keys(updates).length)await setDoc(doc(db,'_users',currentUser.uid),updates,{merge:true});
    if(newPass&&oldPass){
      const cred=EmailAuthProvider.credential(currentUser.email,oldPass);
      await reauthenticateWithCredential(currentUser,cred);
      await updatePassword(currentUser,newPass);
      document.getElementById('profileOldPass').value='';
      document.getElementById('profileNewPass').value='';
      toast(t('t.passwordUpdated'));
    }
    // Atualizar UI
    const un=document.getElementById('userName');if(un)un.textContent=currentUser.displayName||'Voc\u00EA';
    document.getElementById('profileDisplayName').textContent=currentUser.displayName||'';
    closeProfileModal();toast(t('t.profileUpdated'));
  }catch(e){
    const msgs={'auth/wrong-password':t('auth.wrongPasswordCurrent'),'auth/requires-recent-login':t('auth.requiresRecentLogin')};
    toast(`\u274C ${msgs[e.code]||e.message}`);
  }finally{btn.innerHTML='\uD83D\uDCBE Salvar altera\u00E7\u00F5es';btn.disabled=false;}
});
document.getElementById('btnProfileLogout')?.addEventListener('click',()=>{if(confirm('Sair do NOOMA Calendar?'))signOut(auth);closeProfileModal();});

// Abrir perfil ao clicar no chip do usu\u00E1rio


// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// NOOMA COLOR PICKER  -  substitui input[type=color] nativo
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function createNoomaColorPicker(opts){
  // opts: { targetId (input hidden), swatchId (div de preview), onChange }
  // Retorna o panel DOM para inserir onde quiser
  let h=0,s=100,v=100; // HSV
  let dragging=null;

  function hsvToRgb(h,s,v){
    s/=100;v/=100;
    const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;
    let r,g,b;
    if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}
    else if(h<180){r=0;g=c;b=x;}else if(h<240){r=0;g=x;b=c;}
    else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}
    return[Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)];
  }
  function rgbToHex(r,g,b){return'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');}
  function hexToRgb(hex){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return[r,g,b];}
  function rgbToHsv(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let hh=0,ss=max?d/max:0,vv=max;if(d){if(max===r)hh=((g-b)/d)%6;else if(max===g)hh=(b-r)/d+2;else hh=(r-g)/d+4;hh=Math.round(hh*60);if(hh<0)hh+=360;}return[hh,Math.round(ss*100),Math.round(vv*100)];}

  const panel=document.createElement('div');
  panel.className='nooma-color-panel';
  panel.innerHTML=`
    <canvas class="nooma-color-gradient" id="ncg_${opts.targetId}" width="208" height="140"></canvas>
    <div class="nooma-color-cursor" id="ncc_${opts.targetId}"></div>
    <div class="nooma-color-hue" id="nch_${opts.targetId}"><div class="nooma-color-hue-thumb" id="ncht_${opts.targetId}"></div></div>
    <div class="nooma-color-inputs">
      <div style="flex:1"><input class="nooma-color-hex" id="nchex_${opts.targetId}" maxlength="7" placeholder="#EDF252"/></div>
      <div class="nooma-color-rgb">
        <div><input type="number" min="0" max="255" id="ncr_${opts.targetId}" placeholder="R"/><div class="nooma-color-rgb-label">R</div></div>
        <div><input type="number" min="0" max="255" id="ncg2_${opts.targetId}" placeholder="G"/><div class="nooma-color-rgb-label">G</div></div>
        <div><input type="number" min="0" max="255" id="ncb_${opts.targetId}" placeholder="B"/><div class="nooma-color-rgb-label">B</div></div>
      </div>
    </div>`;
  // Inserir cursor dentro do canvas parent
  const canvasWrap=document.createElement('div');
  canvasWrap.style.cssText='position:relative;margin-bottom:12px';

  function getEls(){
    return{
      canvas:document.getElementById(`ncg_${opts.targetId}`),
      cursor:document.getElementById(`ncc_${opts.targetId}`),
      hue:document.getElementById(`nch_${opts.targetId}`),
      hueThumb:document.getElementById(`ncht_${opts.targetId}`),
      hex:document.getElementById(`nchex_${opts.targetId}`),
      rInp:document.getElementById(`ncr_${opts.targetId}`),
      gInp:document.getElementById(`ncg2_${opts.targetId}`),
      bInp:document.getElementById(`ncb_${opts.targetId}`),
    };
  }

  function drawGradient(){
    const {canvas}=getEls();if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const w=canvas.width,ht=canvas.height;
    // Base hue
    const [r,g,b]=hsvToRgb(h,100,100);
    const grad1=ctx.createLinearGradient(0,0,w,0);
    grad1.addColorStop(0,'#fff');
    grad1.addColorStop(1,`rgb(${r},${g},${b})`);
    ctx.fillStyle=grad1;ctx.fillRect(0,0,w,ht);
    const grad2=ctx.createLinearGradient(0,0,0,ht);
    grad2.addColorStop(0,'rgba(0,0,0,0)');
    grad2.addColorStop(1,'#000');
    ctx.fillStyle=grad2;ctx.fillRect(0,0,w,ht);
  }

  function updateUI(){
    const {canvas,cursor,hueThumb,hex,rInp,gInp,bInp}=getEls();
    if(!canvas)return;
    drawGradient();
    const cw=canvas.width,ch=canvas.height;
    const cx=Math.round(s/100*cw),cy=Math.round((1-v/100)*ch);
    if(cursor){cursor.style.left=cx+'px';cursor.style.top=cy+'px';}
    if(hueThumb)hueThumb.style.left=`calc(${h/360*100}% - 9px)`;
    const [r,g,b]=hsvToRgb(h,s,v);
    const hexVal=rgbToHex(r,g,b);
    if(hex)hex.value=hexVal;
    if(rInp)rInp.value=r;if(gInp)gInp.value=g;if(bInp)bInp.value=b;
    // Update swatch and hidden input
    const sw=document.getElementById(opts.swatchId);if(sw)sw.style.background=hexVal;
    const ti=document.getElementById(opts.targetId);if(ti)ti.value=hexVal;
    if(opts.onChange)opts.onChange(hexVal);
  }

  function initFromHex(hexVal){
    if(!hexVal||hexVal.length<4)return;
    const full=hexVal.length===4?'#'+hexVal[1]+hexVal[1]+hexVal[2]+hexVal[2]+hexVal[3]+hexVal[3]:hexVal;
    try{const [r,g,b]=hexToRgb(full);[h,s,v]=rgbToHsv(r,g,b);}catch(e){}
    updateUI();
  }

  // Wire events after panel is added to DOM
  function wireEvents(){
    const {canvas,hue,hex,rInp,gInp,bInp}=getEls();
    if(!canvas)return;

    function handleCanvas(e){
      const rect=canvas.getBoundingClientRect();
      const cx=Math.min(Math.max(0,(e.touches?e.touches[0].clientX:e.clientX)-rect.left),rect.width);
      const cy=Math.min(Math.max(0,(e.touches?e.touches[0].clientY:e.clientY)-rect.top),rect.height);
      s=Math.round(cx/rect.width*100);
      v=Math.round((1-cy/rect.height)*100);
      updateUI();
    }
    canvas.addEventListener('mousedown',e=>{dragging='canvas';handleCanvas(e);});
    canvas.addEventListener('touchstart',e=>{dragging='canvas';handleCanvas(e);e.preventDefault();},{passive:false});

    function handleHue(e){
      const rect=hue.getBoundingClientRect();
      const cx=Math.min(Math.max(0,(e.touches?e.touches[0].clientX:e.clientX)-rect.left),rect.width);
      h=Math.round(cx/rect.width*360);
      updateUI();
    }
    hue.addEventListener('mousedown',e=>{dragging='hue';handleHue(e);});
    hue.addEventListener('touchstart',e=>{dragging='hue';handleHue(e);e.preventDefault();},{passive:false});

    document.addEventListener('mousemove',e=>{if(dragging==='canvas')handleCanvas(e);else if(dragging==='hue')handleHue(e);});
    document.addEventListener('touchmove',e=>{if(dragging==='canvas')handleCanvas(e.touches[0]);else if(dragging==='hue')handleHue(e.touches[0]);},{passive:true});
    document.addEventListener('mouseup',()=>dragging=null);
    document.addEventListener('touchend',()=>dragging=null);

    hex.addEventListener('change',()=>initFromHex(hex.value.startsWith('#')?hex.value:'#'+hex.value));
    hex.addEventListener('keydown',e=>{if(e.key==='Enter')initFromHex(hex.value.startsWith('#')?hex.value:'#'+hex.value);});
    [rInp,gInp,bInp].forEach(inp=>inp?.addEventListener('change',()=>{
      const r=+rInp.value,g=+gInp.value,b=+bInp.value;
      [h,s,v]=rgbToHsv(r,g,b);updateUI();
    }));
    // Init
    const ti=document.getElementById(opts.targetId);
    initFromHex(ti?.value||'#edf252');
    setTimeout(updateUI,50);
  }

  return{panel,wireEvents,initFromHex};
}

// Substituir todos os pdd-color-swatch por color pickers NOOMA
function upgradePddColorSwatches(){
  document.querySelectorAll('.pdd-color-swatch').forEach(swatch=>{
    const colorInput=swatch.querySelector('input[type="color"]');
    if(!colorInput||swatch.dataset.upgraded)return;
    swatch.dataset.upgraded='1';
    const inputId=colorInput.id||('cpinp_'+uid());
    colorInput.id=inputId;
    const swatchId='cpsw_'+inputId;
    swatch.id=swatchId;
    swatch.style.background=colorInput.value||'#edf252';
    // Criar hidden input para o valor
    const hidden=document.createElement('input');
    hidden.type='hidden';hidden.id=inputId;hidden.value=colorInput.value||'#edf252';
    swatch.parentNode.insertBefore(hidden,swatch.nextSibling);
    colorInput.remove();
    // Criar picker
    const{panel,wireEvents,initFromHex}=createNoomaColorPicker({
      targetId:inputId,
      swatchId:swatchId,
      onChange:(hex)=>{swatch.style.background=hex;}
    });
    panel.style.zIndex='800';
    swatch.parentNode.style.position='relative';
    swatch.parentNode.appendChild(panel);
    swatch.addEventListener('click',e=>{
      e.stopPropagation();
      panel.classList.toggle('open');
      if(panel.classList.contains('open')){
        wireEvents();
        initFromHex(hidden.value);
        setTimeout(()=>document.addEventListener('click',function handler(ev){
          if(!panel.contains(ev.target)&&ev.target!==swatch){panel.classList.remove('open');document.removeEventListener('click',handler);}
        }),10);
      }
    });
  });
}


// \u2500\u2500 Respons\u00E1veis m\u00FAltiplos \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// Responsavel de projeto: aceita string legada (nome livre) ou objeto
// {name, uid} vinculado a um membro do workspace (para poder notificar).
function ownerName(o){return typeof o==='string'?o:(o&&o.name)||'';}
function ownerUid(o){return typeof o==='string'?null:(o&&o.uid)||null;}
function ownerEquals(a,b){
  const ua=ownerUid(a),ub=ownerUid(b);
  if(ua||ub)return ua===ub;
  return ownerName(a)===ownerName(b);
}

function renderProjOwners(){
  const wrap=document.getElementById('projOwnersWrap');if(!wrap)return;
  if(!projState.editOwners.length){
    wrap.innerHTML='<div style="font-size:11px;color:var(--dim);padding:2px 0" data-i18n="pm.noOwners">Nenhum respons\u00E1vel adicionado</div>';
    return;
  }
  wrap.innerHTML=projState.editOwners.map((owner,i)=>{
    const name=ownerName(owner),uid=ownerUid(owner);
    const initials=name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const hue=Math.abs(name.split('').reduce((a,c)=>a+c.charCodeAt(0),0))%360;
    return`<div class="proj-owner-chip${uid?' linked':''}" title="${uid?t('pm.workspaceMember'):t('pm.customOwner')}">
      <div class="proj-owner-chip-avatar" style="background:hsl(${hue},60%,50%)">${initials}</div>
      <span>${esc(name)}</span>
      ${uid?`<span class="proj-owner-chip-badge">${renderIcon('briefcase',10)}</span>`:''}
      <button class="proj-owner-chip-del" data-oi="${i}">\u2715</button>
    </div>`;
  }).join('');
  wrap.querySelectorAll('.proj-owner-chip-del').forEach(btn=>{
    btn.addEventListener('click',()=>{projState.editOwners.splice(+btn.dataset.oi,1);renderProjOwners();});
  });
}
document.getElementById('btnAddOwner')?.addEventListener('click',()=>{
  const inp=document.getElementById('projOwnerInput');
  const name=inp?.value.trim();if(!name)return;
  const newOwner={name,uid:null};
  if(!projState.editOwners.some(o=>ownerEquals(o,newOwner)))projState.editOwners.push(newOwner);
  inp.value='';
  renderProjOwners();
});

// ---- Escolher responsavel dentre os membros do workspace ----
function openOwnerMemberPicker(anchorEl){
  const ws=state.currentWorkspace;
  if(!ws||!ws.members||!Object.keys(ws.members).length){
    toast(t('pm.noWorkspaceMembers'));
    return;
  }
  document.querySelector('.owner-picker-popup')?.remove();
  const popup=document.createElement('div');
  popup.className='owner-picker-popup';
  const entries=Object.entries(ws.members);
  popup.innerHTML=`
    <div class="owner-picker-hdr">${t('pm.pickWorkspaceMember')}</div>
    ${entries.map(([uid,m])=>`
      <button type="button" class="owner-picker-item" data-uid="${uid}" data-name="${esc(m.displayName||m.email||'')}">
        <img class="owner-picker-avatar" src="${m.photoURL||''}" onerror="this.style.visibility='hidden'" alt=""/>
        <span class="owner-picker-name">${esc(m.displayName||m.email)}</span>
      </button>`).join('')}
  `;
  document.body.appendChild(popup);
  const rect=anchorEl.getBoundingClientRect();
  popup.style.position='fixed';
  popup.style.left=Math.min(rect.left,window.innerWidth-260-10)+'px';
  popup.style.top=Math.min(rect.bottom+6,window.innerHeight-260)+'px';
  requestAnimationFrame(()=>popup.classList.add('open'));
  popup.querySelectorAll('.owner-picker-item').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const newOwner={name:btn.dataset.name,uid:btn.dataset.uid};
      if(!projState.editOwners.some(o=>ownerEquals(o,newOwner)))projState.editOwners.push(newOwner);
      renderProjOwners();
      popup.remove();
    });
  });
  setTimeout(()=>{
    document.addEventListener('click',function handler(ev){
      if(!popup.contains(ev.target)&&ev.target!==anchorEl){
        popup.remove();
        document.removeEventListener('click',handler);
      }
    });
  },50);
}
document.getElementById('btnPickOwnerMember')?.addEventListener('click',e=>{
  e.stopPropagation();
  openOwnerMemberPicker(e.currentTarget);
});
document.getElementById('projOwnerInput')?.addEventListener('keydown',e=>{
  if(e.key==='Enter')document.getElementById('btnAddOwner')?.click();
});


// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// NOOMA COLOR PICKER  -  RGB + HEX custom, estilo do app
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550



// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
// NOOMA SELECT  -  Substituto gen\u00E9rico para <select> nativos
// \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
function nselOpen(wrapId){
  // Fechar outros abertos
  document.querySelectorAll('.nsel-menu.open').forEach(m=>{
    m.classList.remove('open');
    m.previousElementSibling?.classList.remove('open');
  });
  const wrap=document.getElementById(wrapId);if(!wrap)return;
  const btn=wrap.querySelector('.nsel-btn');
  const menu=wrap.querySelector('.nsel-menu');
  btn?.classList.toggle('open');menu?.classList.toggle('open');
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.nsel-wrap')){
    document.querySelectorAll('.nsel-menu.open').forEach(m=>{
      m.classList.remove('open');m.previousElementSibling?.classList.remove('open');
    });
  }
});

// \u2500\u2500 Sidebar filtros \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderSidebarNsels(){
  // Cliente
  const cMenu=document.getElementById('filterSelClientMenu');
  const cLbl=document.getElementById('filterSelClientLabel');
  const cDot=document.getElementById('filterSelClientDot');
  if(cMenu){
    cMenu.innerHTML=`<div class="nsel-opt${!state.filterClientId?' sel':''}" data-cid="">Todos os clientes</div>`+
      state.clients.map(c=>`<div class="nsel-opt${state.filterClientId===c.id?' sel':''}" data-cid="${c.id}"><span class="nsel-opt-dot" style="background:${c.color}"></span>${esc(c.name)}</div>`).join('');
    cMenu.querySelectorAll('.nsel-opt').forEach(opt=>{
      opt.addEventListener('click',()=>{
        state.filterClientId=opt.dataset.cid||null;
        const cl=state.clients.find(c=>c.id===state.filterClientId);
        if(cLbl)cLbl.textContent=cl?cl.name:'Todos os clientes';
        if(cDot){cDot.style.background=cl?.color||'';cDot.classList.toggle('show',!!cl);}
        cMenu.classList.remove('open');cMenu.previousElementSibling?.classList.remove('open');
        renderCalendar();renderSidebar();
      });
    });
  }
  document.getElementById('filterSelClientBtn')?.addEventListener('click',()=>nselOpen('filterSelClientWrap'));

  // Tipo de conte\u00FAdo
  const ctMenu=document.getElementById('filterSelCTMenu');
  const ctLbl=document.getElementById('filterSelCTLabel');
  const ctDot=document.getElementById('filterSelCTDot');
  if(ctMenu){
    ctMenu.innerHTML=`<div class="nsel-opt${!state.filterContentType?' sel':''}" data-ctid="">Todos os tipos</div>`+
      state.contentTypes.map(ct=>`<div class="nsel-opt${state.filterContentType===ct.id?' sel':''}" data-ctid="${ct.id}"><span class="nsel-label">${renderIcon(ct.icon,13)} ${esc(ct.name)}</span></div>`).join('');
    ctMenu.querySelectorAll('.nsel-opt').forEach(opt=>{
      opt.addEventListener('click',()=>{
        state.filterContentType=opt.dataset.ctid||null;
        const ct=state.contentTypes.find(c=>c.id===state.filterContentType);
        if(ctLbl)ctLbl.innerHTML=ct?`${renderIcon(ct.icon,13)} ${esc(ct.name)}`:'Todos os tipos';
        if(ctDot){ctDot.style.background=ct?.bgColor||'';ctDot.classList.toggle('show',!!ct);}
        ctMenu.classList.remove('open');ctMenu.previousElementSibling?.classList.remove('open');
        renderCalendar();renderSidebar();
      });
    });
  }
  document.getElementById('filterSelCTBtn')?.addEventListener('click',()=>nselOpen('filterSelCTWrap'));

  // Plataforma
  const pMenu=document.getElementById('filterSelPlatMenu');
  const pLbl=document.getElementById('filterSelPlatLabel');
  const pDot=document.getElementById('filterSelPlatDot');
  if(pMenu){
    pMenu.innerHTML=`<div class="nsel-opt${!state.filterPlatform?' sel':''}" data-pid="">Todas as plataformas</div>`+
      state.platforms.map(p=>`<div class="nsel-opt${state.filterPlatform===p.id?' sel':''}" data-pid="${p.id}"><span class="nsel-opt-dot" style="background:${p.color}"></span>${renderIcon(p.icon,13)} ${esc(p.name)}</div>`).join('');
    pMenu.querySelectorAll('.nsel-opt').forEach(opt=>{
      opt.addEventListener('click',()=>{
        state.filterPlatform=opt.dataset.pid||null;
        const pl=state.platforms.find(p=>p.id===state.filterPlatform);
        if(pLbl)pLbl.innerHTML=pl?`${renderIcon(pl.icon,13)} ${esc(pl.name)}`:'Todas as plataformas';
        if(pDot){pDot.style.background=pl?.color||'';pDot.classList.toggle('show',!!pl);}
        pMenu.classList.remove('open');pMenu.previousElementSibling?.classList.remove('open');
        renderCalendar();renderSidebar();
      });
    });
  }
  document.getElementById('filterSelPlatBtn')?.addEventListener('click',()=>nselOpen('filterSelPlatWrap'));
}

// \u2500\u2500 projSort \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const projSortLabels={deadline:'\uD83D\uDCC5 Prazo \u2191',urgency:'\uD83D\uDD34 Urg\u00EAncia',client:'\uD83D\uDC65 Cliente A\u2013Z',value:'\uD83D\uDCB0 Valor \u2193',created:'\uD83D\uDD50 Mais recente'};
document.getElementById('projSortBtn')?.addEventListener('click',()=>nselOpen('projSortWrap'));
document.querySelectorAll('#projSortMenu .nsel-opt').forEach(opt=>{
  opt.addEventListener('click',()=>{
    projState.sortBy=opt.dataset.sv;
    const lbl=document.getElementById('projSortLabel');if(lbl)lbl.textContent=projSortLabels[opt.dataset.sv]||opt.textContent.trim();
    document.querySelectorAll('#projSortMenu .nsel-opt').forEach(o=>o.classList.toggle('sel',o===opt));
    document.getElementById('projSortMenu')?.classList.remove('open');
    document.getElementById('projSortBtn')?.classList.remove('open');
    renderProjects();
  });
});

// \u2500\u2500 newPostStatus (modal do dia)  -  populado via JS quando modal abre \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function renderNselPostStatus(defaultVal='draft'){
  const menu=document.getElementById('newPostStatusMenu');
  const lbl=document.getElementById('newPostStatusLabel');
  const dot=document.getElementById('newPostStatusDot');
  if(!menu)return;
  menu.innerHTML=state.postStatuses.map(s=>`<div class="nsel-opt${s.id===defaultVal?' sel':''}" data-sid="${s.id}"><span class="nsel-opt-dot" style="background:${s.color}"></span>${renderIcon(s.icon,13)} ${esc(s.name)}</div>`).join('');
  const defaultSt=state.postStatuses.find(s=>s.id===defaultVal)||state.postStatuses[0];
  if(defaultSt&&lbl){lbl.innerHTML=`${renderIcon(defaultSt.icon,13)} ${esc(defaultSt.name)}`;dot.style.background=defaultSt.color;}
  menu.querySelectorAll('.nsel-opt').forEach(opt=>{
    opt.addEventListener('click',()=>{
      const st=state.postStatuses.find(s=>s.id===opt.dataset.sid);
      if(st&&lbl){lbl.innerHTML=`${renderIcon(st.icon,13)} ${esc(st.name)}`;dot.style.background=st.color;}
      menu.querySelectorAll('.nsel-opt').forEach(o=>o.classList.toggle('sel',o===opt));
      menu.classList.remove('open');menu.previousElementSibling?.classList.remove('open');
    });
  });
  document.getElementById('newPostStatusBtn')?.addEventListener('click',()=>nselOpen('newPostStatusWrap'));
}

// Obter valor do newPostStatus nsel
function getNselPostStatusValue(){
  const menu=document.getElementById('newPostStatusMenu');
  const sel=menu?.querySelector('.nsel-opt.sel');
  return sel?.dataset.sid||'draft';
}

// \u2500\u2500\u2500 Init \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

// ================================================================
// EXPORTAR RELATORIO DE PROJETOS CONCLUIDOS (Excel / PDF / Word)
// ================================================================
// ================================================================
// EXPORTAR RELATORIO DE PROJETOS - com selecao de status via modal
// ================================================================
let exportSelectedStatuses = new Set(['concluido']); // padrao: apenas concluidos

function getProjectsForReport(){
  return projState.projects
    .filter(p=>exportSelectedStatuses.has(p.status||'contato'))
    .sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
}

function reportRows(){
  return getProjectsForReport().map(p=>{
    const paid=(p.parcelas||[]).filter(pc=>pc.paid).reduce((s,pc)=>s+pc.amount,0);
    const total=(p.parcelas||[]).reduce((s,pc)=>s+pc.amount,0)||p.value||0;
    const pending=Math.max(0,total-paid);
    const doneCk=(p.checklist||[]).filter(c=>c.done).length;
    const totalCk=(p.checklist||[]).length;
    const stObj=getAllProjStatuses().find(s=>s.id===p.status);
    return{
      client:p.clientName||'-',
      title:p.title||'-',
      status:stObj?stObj.label:(p.status||'-'),
      services:(p.services||[]).join(', ')||'-',
      owners:(p.owners||[]).map(ownerName).join(', ')||'-',
      startDate:p.startDate?new Date(p.startDate+'T12:00:00').toLocaleDateString(getLocale()):'-',
      deadline:p.deadline?new Date(p.deadline+'T12:00:00').toLocaleDateString(getLocale()):'-',
      total, paid, pending,
      checklist:totalCk?`${doneCk}/${totalCk}`:'-',
      completedAt:p.updatedAt?new Date(p.updatedAt).toLocaleDateString(getLocale()):'-',
    };
  });
}

function reportHeaders(){
  return [
    t('report.client'),t('report.project'),t('report.status'),t('report.services'),t('report.owners'),
    t('pm.startDate'),t('report.deadline'),t('report.total'),t('report.paid'),t('report.pending'),
    t('report.checklist'),t('report.completedAt')
  ];
}

// ---- EXCEL (.xlsx) via SheetJS ----
function exportProjectsXLSX(){
  const rows=reportRows();
  if(!rows.length){toast(t('report.empty'));return;}
  const headers=reportHeaders();
  const data=[headers,...rows.map(r=>[
    r.client,r.title,r.status,r.services,r.owners,r.startDate,r.deadline,
    r.total,r.paid,r.pending,r.checklist,r.completedAt
  ])];
  const ws=XLSX.utils.aoa_to_sheet(data);
  ws['!cols']=[{wch:20},{wch:28},{wch:14},{wch:24},{wch:18},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:10},{wch:14}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,t('report.sheetName'));
  const fname=`NOOMA_${t('report.sheetName')}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb,fname);
  toast(t('report.exported'));
  closeProjExportModal();
}

// ---- PDF via jsPDF + autoTable ----
function exportProjectsPDF(){
  const rows=reportRows();
  if(!rows.length){toast(t('report.empty'));return;}
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'pt'});
  doc.setFontSize(16);
  doc.text('NOOMA - '+t('report.title'),40,40);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleDateString(getLocale())+' \u00b7 '+rows.length+' '+t('report.projectsCount'),40,58);
  doc.autoTable({
    startY:75,
    head:[reportHeaders()],
    body:rows.map(r=>[
      r.client,r.title,r.status,r.services,r.owners,r.startDate,r.deadline,
      fmtMoney(r.total),fmtMoney(r.paid),fmtMoney(r.pending),r.checklist,r.completedAt
    ]),
    styles:{fontSize:8,cellPadding:5},
    headStyles:{fillColor:[237,242,82],textColor:[20,20,20],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[245,245,245]},
  });
  const fname=`NOOMA_${t('report.sheetName')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fname);
  toast(t('report.exported'));
  closeProjExportModal();
}

// ---- WORD (.doc via HTML) ----
function exportProjectsWord(){
  const rows=reportRows();
  if(!rows.length){toast(t('report.empty'));return;}
  const headers=reportHeaders();
  const tableRows=rows.map(r=>`<tr>
    <td>${esc(r.client)}</td><td>${esc(r.title)}</td><td>${esc(r.status)}</td><td>${esc(r.services)}</td><td>${esc(r.owners)}</td>
    <td>${esc(r.startDate)}</td><td>${esc(r.deadline)}</td><td>${fmtMoney(r.total)}</td><td>${fmtMoney(r.paid)}</td><td>${fmtMoney(r.pending)}</td>
    <td>${esc(r.checklist)}</td><td>${esc(r.completedAt)}</td>
  </tr>`).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t('report.title')}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#222}
    h1{color:#111;font-size:20px}
    p{color:#666;font-size:11px;margin-bottom:20px}
    table{border-collapse:collapse;width:100%;font-size:11px}
    th{background:#edf252;color:#111;padding:8px;text-align:left;border:1px solid #ccc}
    td{padding:7px;border:1px solid #ddd}
    tr:nth-child(even){background:#f7f7f7}
  </style></head>
  <body>
    <h1>NOOMA: ${t('report.title')}</h1>
    <p>${new Date().toLocaleDateString(getLocale())} \u00b7 ${rows.length} ${t('report.projectsCount')}</p>
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
  </body></html>`;
  const blob=new Blob(['\ufeff',html],{type:'application/msword'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`NOOMA_${t('report.sheetName')}_${new Date().toISOString().slice(0,10)}.doc`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(t('report.exported'));
  closeProjExportModal();
}

// ---- Modal de selecao de status para exportar ----
function renderExportStatusList(){
  const el=document.getElementById('exportStatusList');if(!el)return;
  const statuses=getAllProjStatuses();
  el.innerHTML=statuses.map(s=>{
    const count=projState.projects.filter(p=>(p.status||'contato')===s.id).length;
    const checked=exportSelectedStatuses.has(s.id);
    return `<div class="export-status-item" data-sid="${s.id}">
      <div class="export-status-check${checked?' checked':''}">${checked?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>
      <span class="export-status-dot" style="background:${s.color}"></span>
      ${renderIcon(s.icon,15)}
      <span class="export-status-name">${esc(s.label)}</span>
      <span class="export-status-count">${count}</span>
    </div>`;
  }).join('');
  el.querySelectorAll('.export-status-item').forEach(item=>{
    item.addEventListener('click',()=>{
      const sid=item.dataset.sid;
      if(exportSelectedStatuses.has(sid))exportSelectedStatuses.delete(sid);
      else exportSelectedStatuses.add(sid);
      renderExportStatusList();
      updateExportCountHint();
    });
  });
  updateExportCountHint();
}

function updateExportCountHint(){
  const hint=document.getElementById('exportCountHint');if(!hint)return;
  const n=getProjectsForReport().length;
  hint.textContent=n>0?`${n} ${t('report.projectsCount')}`:t('report.empty');
  document.querySelectorAll('.export-format-btn').forEach(btn=>{btn.disabled=(n===0);});
}

// Bibliotecas de exportacao (SheetJS, jsPDF) carregadas sob demanda --
// a maioria das visitas nunca abre o relatorio, entao carregar isso sempre
// no carregamento inicial so deixaria o app mais lento para todo mundo.
let _exportLibsPromise=null;
function loadExportLibs(){
  if(window.XLSX && window.jspdf)return Promise.resolve();
  if(_exportLibsPromise)return _exportLibsPromise;
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(s);
    });
  }
  _exportLibsPromise=loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js')
    .then(()=>loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'))
    .then(()=>loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'))
    .catch(e=>{_exportLibsPromise=null;throw e;});
  return _exportLibsPromise;
}

// ================================================================
// EXPORTAR RELATORIO DETALHADO DO CALENDARIO (mes em exibicao)
// ================================================================
let calExportClientIds = new Set();
let calExportStatusIds = new Set();

function getCalendarMonthPosts(){
  const y=state.year, m=state.month;
  const prefix=`${y}-${String(m).padStart(2,'0')}`;
  const all=[];
  Object.entries(state.posts).forEach(([dateKey,arr])=>{
    if(dateKey.startsWith(prefix))arr.forEach(p=>all.push({...p,dateKey}));
  });
  return all;
}

function getCalendarReportRows(){
  const posts=getCalendarMonthPosts().filter(p=>{
    return calExportClientIds.has(p.clientId)&&calExportStatusIds.has(p.status||'draft');
  });
  return posts.sort((a,b)=>a.dateKey.localeCompare(b.dateKey)).map(p=>{
    const cl=getC(p.clientId),ct=getCT(p.contentType),st=getST(p.status||'draft'),plat=getPlat(p.platform);
    return{
      date:new Date(p.dateKey+'T12:00:00').toLocaleDateString(getLocale()),
      client:cl?cl.name:'-',
      contentType:ct?ct.label:(p.contentType||'-'),
      platform:plat?plat.name:t('pm.noPlatform'),
      status:st?st.name:'-',
      time:p.scheduledTime||'-',
      note:p.note||'-',
    };
  });
}

function calReportHeaders(){
  return [t('calExport.colDate'),t('calExport.colClient'),t('calExport.colType'),t('calExport.colPlatform'),t('calExport.colStatus'),t('calExport.colTime'),t('calExport.colNote')];
}

function exportCalendarXLSX(){
  const rows=getCalendarReportRows();
  if(!rows.length){toast(t('calExport.empty'));return;}
  const data=[calReportHeaders(),...rows.map(r=>[r.date,r.client,r.contentType,r.platform,r.status,r.time,r.note])];
  const ws=XLSX.utils.aoa_to_sheet(data);
  ws['!cols']=[{wch:12},{wch:20},{wch:14},{wch:14},{wch:14},{wch:8},{wch:36}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,t('calExport.sheetName'));
  XLSX.writeFile(wb,`NOOMA_${t('calExport.sheetName')}_${state.year}-${String(state.month).padStart(2,'0')}.xlsx`);
  toast(t('report.exported'));
  closeCalExportModal();
}

function exportCalendarPDF(){
  const rows=getCalendarReportRows();
  if(!rows.length){toast(t('calExport.empty'));return;}
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'pt'});
  doc.setFontSize(16);
  doc.text('NOOMA - '+t('calExport.title'),40,40);
  doc.setFontSize(10);doc.setTextColor(120);
  doc.text(`${MONTHS[state.month-1]} ${state.year} \u00b7 ${rows.length} ${t('report.projectsCount')}`,40,58);
  doc.autoTable({
    startY:75,
    head:[calReportHeaders()],
    body:rows.map(r=>[r.date,r.client,r.contentType,r.platform,r.status,r.time,r.note]),
    styles:{fontSize:8,cellPadding:5},
    headStyles:{fillColor:[237,242,82],textColor:[20,20,20],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[245,245,245]},
  });
  doc.save(`NOOMA_${t('calExport.sheetName')}_${state.year}-${String(state.month).padStart(2,'0')}.pdf`);
  toast(t('report.exported'));
  closeCalExportModal();
}

function exportCalendarWord(){
  const rows=getCalendarReportRows();
  if(!rows.length){toast(t('calExport.empty'));return;}
  const headers=calReportHeaders();
  const tableRows=rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.client)}</td><td>${esc(r.contentType)}</td><td>${esc(r.platform)}</td><td>${esc(r.status)}</td><td>${esc(r.time)}</td><td>${esc(r.note)}</td></tr>`).join('');
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${t('calExport.title')}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#222}
    h1{color:#111;font-size:20px}
    p{color:#666;font-size:11px;margin-bottom:20px}
    table{border-collapse:collapse;width:100%;font-size:11px}
    th{background:#edf252;color:#111;padding:8px;text-align:left;border:1px solid #ccc}
    td{padding:7px;border:1px solid #ddd}
    tr:nth-child(even){background:#f7f7f7}
  </style></head>
  <body>
    <h1>NOOMA: ${t('calExport.title')}</h1>
    <p>${MONTHS[state.month-1]} ${state.year} \u00b7 ${rows.length} ${t('report.projectsCount')}</p>
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
  </body></html>`;
  const blob=new Blob(['\ufeff',html],{type:'application/msword'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=`NOOMA_${t('calExport.sheetName')}_${state.year}-${String(state.month).padStart(2,'0')}.doc`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast(t('report.exported'));
  closeCalExportModal();
}

function renderCalExportLists(){
  const clientEl=document.getElementById('calExportClientList');
  if(clientEl){
    clientEl.innerHTML=state.clients.map(c=>{
      const checked=calExportClientIds.has(c.id);
      const count=getCalendarMonthPosts().filter(p=>p.clientId===c.id).length;
      return`<div class="export-status-item" data-cid="${c.id}">
        <div class="export-status-check${checked?' checked':''}">${checked?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>
        <span class="export-status-dot" style="background:${c.color}"></span>
        <span class="export-status-name">${esc(c.name)}</span>
        <span class="export-status-count">${count}</span>
      </div>`;
    }).join('')||`<div class="export-count-hint">${t('calExport.noClients')}</div>`;
    clientEl.querySelectorAll('.export-status-item').forEach(item=>{
      item.addEventListener('click',()=>{
        const cid=item.dataset.cid;
        if(calExportClientIds.has(cid))calExportClientIds.delete(cid);else calExportClientIds.add(cid);
        renderCalExportLists();updateCalExportCountHint();
      });
    });
  }
  const statusEl=document.getElementById('calExportStatusList');
  if(statusEl){
    statusEl.innerHTML=state.postStatuses.map(s=>{
      const checked=calExportStatusIds.has(s.id);
      const count=getCalendarMonthPosts().filter(p=>(p.status||'draft')===s.id).length;
      return`<div class="export-status-item" data-sid="${s.id}">
        <div class="export-status-check${checked?' checked':''}">${checked?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>':''}</div>
        <span class="export-status-dot" style="background:${s.color}"></span>
        ${renderIcon(s.icon,15)}
        <span class="export-status-name">${esc(s.name)}</span>
        <span class="export-status-count">${count}</span>
      </div>`;
    }).join('');
    statusEl.querySelectorAll('.export-status-item').forEach(item=>{
      item.addEventListener('click',()=>{
        const sid=item.dataset.sid;
        if(calExportStatusIds.has(sid))calExportStatusIds.delete(sid);else calExportStatusIds.add(sid);
        renderCalExportLists();updateCalExportCountHint();
      });
    });
  }
  updateCalExportCountHint();
}

function updateCalExportCountHint(){
  const hint=document.getElementById('calExportCountHint');if(!hint)return;
  const n=getCalendarReportRows().length;
  hint.textContent=n>0?`${n} ${t('report.projectsCount')}`:t('calExport.empty');
  document.querySelectorAll('#calExportOverlay .export-format-btn').forEach(btn=>{btn.disabled=(n===0);});
}

let _calExportInitialized=false;
function openCalExportModal(){
  const sub=document.getElementById('calExportSub');
  if(sub)sub.textContent=`${MONTHS[state.month-1]} ${state.year}`;
  if(!_calExportInitialized){
    calExportClientIds=new Set(state.clients.map(c=>c.id));
    calExportStatusIds=new Set(state.postStatuses.map(s=>s.id));
    _calExportInitialized=true;
  }
  renderCalExportLists();
  document.getElementById('calExportOverlay')?.classList.add('open');
  const xlsxBtn=document.getElementById('btnCalExportXlsx'),pdfBtn=document.getElementById('btnCalExportPdf');
  if(xlsxBtn)xlsxBtn.disabled=true;
  if(pdfBtn)pdfBtn.disabled=true;
  loadExportLibs().then(()=>{updateCalExportCountHint();}).catch(()=>{
    if(xlsxBtn)xlsxBtn.disabled=true;if(pdfBtn)pdfBtn.disabled=true;
    toast(t('report.libsLoadError'));
  });
}
function closeCalExportModal(){document.getElementById('calExportOverlay')?.classList.remove('open');}

document.getElementById('btnCalExport')?.addEventListener('click',openCalExportModal);
document.getElementById('btnCloseCalExport')?.addEventListener('click',closeCalExportModal);
document.getElementById('calExportOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeCalExportModal();});

document.getElementById('btnCalExportAllClients')?.addEventListener('click',()=>{calExportClientIds=new Set(state.clients.map(c=>c.id));renderCalExportLists();});
document.getElementById('btnCalExportNoClients')?.addEventListener('click',()=>{calExportClientIds=new Set();renderCalExportLists();});
document.getElementById('btnCalExportAllStatuses')?.addEventListener('click',()=>{calExportStatusIds=new Set(state.postStatuses.map(s=>s.id));renderCalExportLists();});
document.getElementById('btnCalExportNoStatuses')?.addEventListener('click',()=>{calExportStatusIds=new Set();renderCalExportLists();});

document.getElementById('btnCalExportXlsx')?.addEventListener('click',exportCalendarXLSX);
document.getElementById('btnCalExportPdf')?.addEventListener('click',exportCalendarPDF);
document.getElementById('btnCalExportWord')?.addEventListener('click',exportCalendarWord);

function openProjExportModal(){
  renderExportStatusList();
  document.getElementById('projExportOverlay')?.classList.add('open');
  // Carrega Excel/PDF em segundo plano assim que o modal abre (Word nao
  // depende de biblioteca nenhuma, entao nao precisa esperar).
  const xlsxBtn=document.getElementById('btnExportXlsx'),pdfBtn=document.getElementById('btnExportPdf');
  if(xlsxBtn)xlsxBtn.disabled=true;
  if(pdfBtn)pdfBtn.disabled=true;
  loadExportLibs().then(()=>{
    updateExportCountHint();
  }).catch(()=>{
    if(xlsxBtn)xlsxBtn.disabled=true;
    if(pdfBtn)pdfBtn.disabled=true;
    toast(t('report.libsLoadError'));
  });
}
function closeProjExportModal(){
  document.getElementById('projExportOverlay')?.classList.remove('open');
}

document.getElementById('btnProjExport')?.addEventListener('click',openProjExportModal);
document.getElementById('btnCloseProjExport')?.addEventListener('click',closeProjExportModal);
document.getElementById('projExportOverlay')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closeProjExportModal();});

document.getElementById('btnExportPresetCompleted')?.addEventListener('click',()=>{
  exportSelectedStatuses=new Set(['concluido']);
  renderExportStatusList();
});
document.getElementById('btnExportPresetAll')?.addEventListener('click',()=>{
  exportSelectedStatuses=new Set(getAllProjStatuses().map(s=>s.id));
  renderExportStatusList();
});
document.getElementById('btnExportPresetNone')?.addEventListener('click',()=>{
  exportSelectedStatuses=new Set();
  renderExportStatusList();
});

document.getElementById('btnExportXlsx')?.addEventListener('click',exportProjectsXLSX);
document.getElementById('btnExportPdf')?.addEventListener('click',exportProjectsPDF);
document.getElementById('btnExportWord')?.addEventListener('click',exportProjectsWord);

async function init(){
  loadNav();
  applyI18n();
  // Mostrar aviso de in-app browser proativamente
  if(isInAppBrowser()){
    const w=document.getElementById('inAppWarning');
    if(w)w.style.display='block';
  }
  // Mostrar tela de loading imediatamente
  const loading=document.getElementById('screenLoading');
  const login=document.getElementById('screenLogin');
  const app=document.getElementById('screenApp');
  if(loading)loading.style.display='flex';
  if(login)login.style.display='none';
  if(app)app.style.display='none';

  // Guardrail absoluto: rede movel + fluxo de redirect (Google/Apple) podem levar
  // bem mais que alguns segundos para resolver (varios round-trips de rede).
  // Este timer SO existe para o caso extremo de o Firebase nunca responder --
  // ele e cancelado assim que onAuthStateChanged() disparar pela primeira vez,
  // ou seja, assim que o Firebase realmente determinar se ha usuario logado ou nao.
  clearTimeout(authKillTimer);
  authKillTimer=setTimeout(()=>{
    if(loading&&loading.style.display!=='none'){
      loading.style.display='none';
      if(login)login.style.display='flex';
      // Se havia um redirect de login pendente (Google/Apple) e ele nao resolveu
      // a tempo, avisar o usuario com clareza em vez de voltar ao login em silencio.
      const pendingSince=localStorage.getItem('nooma_redirect_pending');
      if(pendingSince){
        localStorage.removeItem('nooma_redirect_pending');
        showLoginError(t('login.redirectFailed'));
      }
    }
  },20000);

  const params=new URLSearchParams(window.location.search),joinCode=params.get('join');
  if(joinCode)localStorage.setItem('nooma_pending_join',joinCode);

  // initFirebase n\u00E3o \u00E9 aguardado: onAuthStateChanged cuida das transi\u00E7\u00F5es de tela
  setView(currentView);
  initFirebase().catch(e=>{
    console.error('initFirebase falhou:',e);
    clearTimeout(authKillTimer);
    if(loading)loading.style.display='none';
    if(login)login.style.display='flex';
  });
}
init();
