// Modul Setup Live - Prism Control theme
// Merender ke #live-mount (diinjeksi oleh app-core openLiveRoom)

let liveNodes = [];
let liveConnections = [];
let liveSelectedNode = null;
let liveTerminalLines = [];
let liveNextId = 1;
let livePendingPort = null;

const LIVE_DEVICE_TYPES = {
  camera: { label:'Kamera', icon:'videocam', color:'#4b8eff' },
  switcher: { label:'Video Switcher', icon:'switch_video', color:'#2fd9f4' },
  capture: { label:'Capture Card', icon:'memory', color:'#adc6ff' },
  pc: { label:'Production PC', icon:'computer', color:'#bec6e0' },
  mixer: { label:'Audio Mixer', icon:'graphic_eq', color:'#7ee787' },
  router: { label:'Router/Switch', icon:'hub', color:'#ffb454' },
  mic: { label:'Microphone', icon:'mic', color:'#ff7b9c' },
  monitor: { label:'Monitor', icon:'desktop_windows', color:'#c1c6d7' },
  power: { label:'Power Dist', icon:'power', color:'#ffb4ab' }
};

function openLiveSetupModule() {
  const mount = document.getElementById('live-mount');
  if (!mount) { console.warn('live-mount not found'); return; }
  mount.innerHTML = `
    <header class="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 h-16 flex items-center px-margin-desktop max-w-container-max mx-auto">
      <button onclick="goDashboard()" class="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-bright/10 mr-2"><span class="material-symbols-outlined">arrow_back</span></button>
      <span class="material-symbols-outlined text-tertiary text-2xl mr-2">sensors</span>
      <span class="font-headline-lg text-headline-lg rainbow-text">Setup Live</span>
      <div class="ml-auto flex gap-2">
        <button onclick="liveTerminalCmd()" class="text-on-surface-variant hover:text-primary px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-tertiary transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">terminal</span><span class="font-label-sm text-label-sm">Terminal</span></button>
        <button onclick="saveLiveBuild()" class="rainbow-gradient text-surface-container-lowest font-label-sm text-label-sm px-4 py-2 rounded-lg rainbow-glow transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">save</span>Simpan</button>
      </div>
    </header>
    <main class="pt-24 p-margin-desktop max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-4 gap-gutter">
      <div class="bg-surface-container-low rounded-xl border border-surface-variant p-4 rainbow-border">
        <h3 class="font-bold text-sm mb-3 text-tertiary flex items-center gap-1"><span class="material-symbols-outlined text-sm">add_circle</span> Tambah Perangkat</h3>
        <div class="space-y-1" id="live-palette"></div>
      </div>
      <div class="lg:col-span-3 bg-surface-container-low rounded-xl border border-surface-variant p-4 rainbow-border relative">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-sm text-primary flex items-center gap-1"><span class="material-symbols-outlined text-sm">account_tree</span> Wiring Canvas</h3>
          <div class="flex gap-2">
            <button onclick="liveAutoConnect()" class="text-xs px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded flex items-center gap-1"><span class="material-symbols-outlined text-sm">auto_fix</span> Auto</button>
            <button onclick="liveClear()" class="text-xs px-2 py-1 bg-surface-container hover:bg-surface-container-high rounded flex items-center gap-1"><span class="material-symbols-outlined text-sm">delete_sweep</span> Clear</button>
          </div>
        </div>
        <div id="live-canvas" class="relative bg-[#020617] rounded-lg h-[60vh] overflow-hidden border border-outline-variant/20"></div>
        <div id="live-status" class="mt-2 text-xs"></div>
      </div>
    </main>`;
  renderLivePalette();
  renderLiveUI();
}

function renderLivePalette() {
  const p = document.getElementById('live-palette');
  if (!p) return;
  p.innerHTML = Object.entries(LIVE_DEVICE_TYPES).map(([k,v])=>`<button onclick="liveAddDevice('${k}')" class="w-full text-left bg-surface-container hover:bg-surface-container-high rounded p-2 text-xs transition flex items-center gap-2">
    <span class="material-symbols-outlined" style="color:${v.color}">${v.icon}</span>
    <span class="text-on-surface">${v.label}</span>
  </button>`).join('');
}

function liveAddDevice(type) {
  const def = LIVE_DEVICE_TYPES[type];
  const node = {
    id: liveNextId++,
    type,
    label: def.label + ' ' + liveNextId,
    x: 60 + (liveNodes.length % 4) * 180,
    y: 60 + Math.floor(liveNodes.length / 4) * 120,
    on: false,
    ports: [
      { id:'in', label:'IN', type:'input', x:0, y:30 },
      { id:'out', label:'OUT', type:'output', x:160, y:30 }
    ]
  };
  liveNodes.push(node);
  renderLiveUI();
  evaluateLiveStatus();
}

function liveTogglePower(id) {
  const n = liveNodes.find(x=>x.id===id);
  if (n) { n.on = !n.on; renderLiveUI(); evaluateLiveStatus(); }
}

function evaluateLiveStatus() {
  const box = document.getElementById('live-status');
  if (!box) return;
  const onCount = liveNodes.filter(n=>n.on).length;
  const total = liveNodes.length;
  const connected = liveConnections.length;
  let ok = total>0 && onCount===total && connected>0;
  box.innerHTML = `<div class="flex items-center gap-2 ${ok?'text-tertiary':'text-on-surface-variant'}">
    <span class="material-symbols-outlined text-sm">${ok?'check_circle':'info'}</span>
    Status: ${ok?'Siap Live!':'Belum siap'} • Perangkat nyala ${onCount}/${total} • Koneksi ${connected}
  </div>`;
}

function liveConnect(fromId, fromPort, toId, toPort) {
  liveConnections.push({ from:fromId, fromPort, to:toId, toPort });
  renderLiveUI();
  evaluateLiveStatus();
}
function liveDisconnect(idx) {
  liveConnections.splice(idx,1);
  renderLiveUI();
  evaluateLiveStatus();
}
function liveDeleteNode(id) {
  liveNodes = liveNodes.filter(n=>n.id!==id);
  liveConnections = liveConnections.filter(c=>c.from!==id && c.to!==id);
  renderLiveUI();
  evaluateLiveStatus();
}

function liveSelectPort(nodeId, portId) {
  if (!livePendingPort) {
    livePendingPort = { node:nodeId, port:portId };
    if (window.showToast) showToast('Pilih port tujuan untuk menyambung.');
  } else {
    if (livePendingPort.node !== nodeId) {
      liveConnect(livePendingPort.node, livePendingPort.port, nodeId, portId);
    }
    livePendingPort = null;
  }
  renderLiveUI();
}

function liveAutoConnect() {
  const cams = liveNodes.filter(n=>n.type==='camera');
  const sw = liveNodes.find(n=>n.type==='switcher');
  const pc = liveNodes.find(n=>n.type==='pc');
  cams.forEach(c=>{ if (sw) liveConnections.push({ from:c.id, fromPort:'out', to:sw.id, toPort:'in' }); });
  if (sw && pc) liveConnections.push({ from:sw.id, fromPort:'out', to:pc.id, toPort:'in' });
  renderLiveUI();
  evaluateLiveStatus();
  if (window.showToast) showToast('Koneksi otomatis dibuat.', true);
}

function liveClear() {
  liveNodes = []; liveConnections = []; liveNextId = 1; livePendingPort = null;
  renderLiveUI();
  evaluateLiveStatus();
}

function renderLiveUI() {
  const canvas = document.getElementById('live-canvas');
  if (!canvas) return;
  let svg = `<svg class="absolute inset-0 w-full h-full pointer-events-none"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#2fd9f4"/></marker></defs>`;
  liveConnections.forEach((c,i)=>{
    const a = liveNodes.find(n=>n.id===c.from), b = liveNodes.find(n=>n.id===c.to);
    if (!a||!b) return;
    const x1=a.x+160, y1=a.y+30, x2=b.x, y2=b.y+30;
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#2fd9f4" stroke-width="2" marker-end="url(#arrow)"/>`;
    svg += `<text x="${(x1+x2)/2}" y="${(y1+y2)/2-4}" fill="#c1c6d7" font-size="9" class="pointer-events-auto cursor-pointer" onclick="liveDisconnect(${i})">x</text>`;
  });
  svg += `</svg>`;
  let nodesHtml = liveNodes.map(n=>{
    const def = LIVE_DEVICE_TYPES[n.type];
    return `<div class="absolute bg-surface-container border ${n.on?'border-tertiary rainbow-glow':'border-outline-variant/40'} rounded-lg p-2 w-40 text-xs" style="left:${n.x}px;top:${n.y}px">
      <div class="flex items-center justify-between mb-1">
        <span class="material-symbols-outlined" style="color:${def.color}">${def.icon}</span>
        <button onclick="liveDeleteNode(${n.id})" class="text-error hover:text-error-container"><span class="material-symbols-outlined text-sm">close</span></button>
      </div>
      <div class="font-semibold text-on-surface truncate">${n.label}</div>
      <div class="flex items-center justify-between mt-1">
        <button onclick="liveSelectPort(${n.id},'in')" class="text-[10px] bg-surface-container-lowest rounded px-1 ${livePendingPort&&livePendingPort.node===n.id?'text-tertiary':''}">IN</button>
        <button onclick="liveTogglePower(${n.id})" class="text-[10px] ${n.on?'text-tertiary':'text-outline'}"><span class="material-symbols-outlined text-sm">${n.on?'power':'power_off'}</span></button>
        <button onclick="liveSelectPort(${n.id},'out')" class="text-[10px] bg-surface-container-lowest rounded px-1 ${livePendingPort&&livePendingPort.node===n.id?'text-tertiary':''}">OUT</button>
      </div>
    </div>`;
  }).join('');
  canvas.innerHTML = svg + nodesHtml;
}

function liveTerminalCmd() {
  const cmd = prompt('Perintah terminal (mis. status, connect all, clear):', 'status');
  if (!cmd) return;
  liveTerminalLines.push('> ' + cmd);
  if (cmd === 'status') {
    liveTerminalLines.push(`Nodes: ${liveNodes.length}, On: ${liveNodes.filter(n=>n.on).length}, Connections: ${liveConnections.length}`);
  } else if (cmd === 'connect all') {
    liveAutoConnect();
    liveTerminalLines.push('Auto-connected.');
  } else if (cmd === 'clear') {
    liveClear();
    liveTerminalLines.push('Cleared.');
  } else {
    liveTerminalLines.push('Perintah tidak dikenal.');
  }
  renderLiveTerminal();
}

function renderLiveTerminal() {
  let box = document.getElementById('live-terminal');
  if (!box) {
    box = document.createElement('div');
    box.id = 'live-terminal';
    box.className = 'fixed bottom-4 right-4 w-80 max-h-60 overflow-y-auto bg-[#020617] border border-outline-variant/40 rounded-lg p-3 text-xs font-mono text-tertiary z-[60]';
    document.body.appendChild(box);
  }
  box.innerHTML = liveTerminalLines.map(l=>`<div>${l}</div>`).join('') + `<div class="text-outline">_</div>`;
  box.scrollTop = box.scrollHeight;
}

async function saveLiveBuild() {
  if (!window.currentUser) { if (window.showToast) showToast('Login untuk simpan!'); return; }
  const data = { type:'live', nodes: liveNodes, connections: liveConnections, module:'live' };
  const title = prompt('Nama rakitan live:', 'Rakitan Live ' + new Date().toLocaleDateString('id-ID')) || 'Rakitan Live';
  const { ok } = await window.api('/api/saves', { method:'POST', body:{ title, data } });
  if (ok) { if (window.showToast) showToast('Rakitan live tersimpan!', true); } else { if (window.showToast) showToast('Gagal simpan.'); }
}

window.openLiveSetupModule = openLiveSetupModule;
