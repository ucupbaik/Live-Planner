// Modul Setup Live - simulasi seperti Cisco Packet Tracer
// Device mati/gagal jika tidak terhubung dengan benar
// Terminal dengan pilihan lubang 1-10

let liveNodes = []; // { id, name, type, x, y, ports:[{num, type, connectedTo}], powered, status }
let liveConnections = []; // { from:{node,port}, to:{node,port} }
let liveSelectedNode = null;
let liveTerminalLines = [];
let liveNextId = 1;

const LIVE_DEVICE_TYPES = {
  camera: { label:'Kamera', icon:'fa-solid fa-camera', ports:['HDMI','SDI','Audio'], needs:'power' },
  switcher: { label:'Video Switcher', icon:'fa-solid fa-sliders', ports:['HDMI','SDI','LAN'], needs:'power' },
  capture: { label:'Capture Card', icon:'fa-solid fa-video', ports:['HDMI','USB','SDI'], needs:'power' },
  pc: { label:'PC / Encoder', icon:'fa-solid fa-computer', ports:['USB','LAN','HDMI'], needs:'power' },
  mixer: { label:'Audio Mixer', icon:'fa-solid fa-microphone', ports:['XLR','Audio','LAN'], needs:'power' },
  router: { label:'Router / Switch', icon:'fa-solid fa-network-wired', ports:['LAN','LAN','LAN'], needs:'power' },
  mic: { label:'Microphone', icon:'fa-solid fa-microphone-lines', ports:['XLR','Audio'], needs:'power' },
  monitor: { label:'Monitor', icon:'fa-solid fa-tv', ports:['HDMI','SDI'], needs:'power' },
  power: { label:'Power Supply', icon:'fa-solid fa-plug', ports:['Power','Power','Power'], needs:null }
};

function openLiveSetupModule() {
  currentModule = 'live';
  document.getElementById('builder-module-badge').textContent = 'Setup Live (Simulasi)';
  showScreen('live-screen');
  renderLiveUI();
}

function liveAddDevice(type) {
  const def = LIVE_DEVICE_TYPES[type];
  if (!def) return;
  const id = 'L' + (liveNextId++);
  const node = {
    id, name: def.label + ' ' + id, type, icon: def.icon,
    x: 60 + (liveNodes.length % 4) * 220, y: 60 + Math.floor(liveNodes.length / 4) * 160,
    ports: def.ports.map((p,i)=>({ num:i+1, type:p, connectedTo:null })),
    powered: false, status: 'off'
  };
  liveNodes.push(node);
  renderLiveUI();
}

function liveTogglePower(id) {
  const n = liveNodes.find(x=>x.id===id);
  if (!n) return;
  n.powered = !n.powered;
  evaluateLiveStatus();
  renderLiveUI();
}

// Evaluasi status: device hidup hanya jika terhubung & dapat power
function evaluateLiveStatus() {
  // Reset
  liveNodes.forEach(n => { n.status = n.powered ? 'on' : 'off'; });
  // Power distribution: power device -> connected devices
  const powerNodes = liveNodes.filter(n => n.type === 'power' && n.powered);
  liveNodes.forEach(n => {
    if (n.type === 'power') return;
    const hasPower = powerNodes.some(p => liveConnections.some(c =>
      (c.from.node===p.id && c.to.node===n.id) || (c.from.node===n.id && c.to.node===p.id)));
    if (n.powered && !hasPower) n.status = 'fail-power';
  });
  // Connectivity: device with output but no connection to valid input = warning
  liveNodes.forEach(n => {
    if (n.status === 'off' || n.status === 'fail-power') return;
    const hasOut = n.ports.some(p => liveConnections.some(c => c.from.node===n.id && c.from.port===p.num));
    const hasIn = n.ports.some(p => liveConnections.some(c => c.to.node===n.id && c.to.port===p.num));
    if (n.type !== 'power' && !hasIn && !hasOut) n.status = 'idle';
  });
}

function liveConnect(fromNode, fromPort, toNode, toPort) {
  // Cek duplikat & arah
  if (fromNode === toNode) return showToast('Tidak bisa hubungkan ke diri sendiri!');
  const exists = liveConnections.some(c =>
    (c.from.node===fromNode && c.from.port===fromPort) ||
    (c.to.node===toNode && c.to.port===toPort));
  if (exists) return showToast('Port sudah terpakai!');
  liveConnections.push({ from:{node:fromNode,port:fromPort}, to:{node:toNode,port:toPort} });
  evaluateLiveStatus();
  renderLiveUI();
}

function liveDisconnect(idx) {
  liveConnections.splice(idx,1);
  evaluateLiveStatus();
  renderLiveUI();
}

function liveDeleteNode(id) {
  liveNodes = liveNodes.filter(n=>n.id!==id);
  liveConnections = liveConnections.filter(c=>c.from.node!==id && c.to.node!==id);
  evaluateLiveStatus();
  renderLiveUI();
}

// Terminal: pilihan lubang 1-10
function liveTerminalCmd(cmd) {
  const lines = liveTerminalLines;
  lines.push(`<span class="text-emerald-400">admin@live-setup</span>:<span class="text-blue-400">~$</span> ${cmd}`);
  const args = cmd.trim().toLowerCase().split(/\s+/);
  const c = args[0];
  if (c === 'help' || c === '') {
    lines.push('Perintah: list, connect &lt;node&gt; &lt;port&gt; &lt;node&gt; &lt;port&gt;, power &lt;node&gt; on|off, status, clear, ports &lt;node&gt;');
  } else if (c === 'list') {
    liveNodes.forEach(n => lines.push(`${n.id} [${n.type}] ${n.name} - ${n.status}`));
  } else if (c === 'ports') {
    const n = liveNodes.find(x=>x.id===args[1]);
    if (n) n.ports.forEach(p => lines.push(`Lubang ${p.num}: ${p.type} ${p.connectedTo?'→ '+p.connectedTo:' (kosong)'}`));
    else lines.push('Node tidak ditemukan.');
  } else if (c === 'power') {
    const n = liveNodes.find(x=>x.id===args[1]);
    if (n) { n.powered = args[2]==='on'; evaluateLiveStatus(); renderLiveUI(); lines.push(`${n.id} power ${args[2]}.`); }
    else lines.push('Node tidak ditemukan.');
  } else if (c === 'connect') {
    // connect L1 1 L2 2
    const [_, fn, fp, tn, tp] = args;
    const fpi = parseInt(fp), tpi = parseInt(tp);
    if (fn && tn && fpi>=1 && fpi<=10 && tpi>=1 && tpi<=10) {
      liveConnect(fn, fpi, tn, tpi);
      lines.push(`Menghubungkan ${fn} lubang ${fpi} → ${tn} lubang ${tpi}`);
    } else lines.push('Format: connect &lt;node&gt; &lt;1-10&gt; &lt;node&gt; &lt;1-10&gt;');
  } else if (c === 'status') {
    lines.push(`Total node: ${liveNodes.length}, Koneksi: ${liveConnections.length}`);
    const fails = liveNodes.filter(n=>n.status.startsWith('fail'));
    if (fails.length) lines.push(`PERINGATAN: ${fails.length} device gagal: ` + fails.map(f=>f.id).join(', '));
    else lines.push('Semua device normal.');
  } else if (c === 'clear') {
    liveTerminalLines = [];
    renderLiveTerminal();
    return;
  } else {
    lines.push(`Perintah tidak dikenal: ${c}. Ketik 'help'.`);
  }
  renderLiveTerminal();
}

function renderLiveTerminal() {
  const box = document.getElementById('live-terminal-output');
  if (!box) return;
  box.innerHTML = liveTerminalLines.join('<br>');
  box.scrollTop = box.scrollHeight;
}

function renderLiveUI() {
  const wrap = document.getElementById('live-content');
  if (!wrap) return;
  const statusColor = s => ({
    'on':'text-green-400', 'off':'text-slate-500', 'idle':'text-yellow-400',
    'fail-power':'text-red-400', 'fail-conn':'text-red-400'
  }[s] || 'text-slate-400');
  const statusText = s => ({
    'on':'HIDUP', 'off':'MATI', 'idle':'IDLE (tidak terhubung)',
    'fail-power':'GAGAL (tanpa power)', 'fail-conn':'GAGAL (koneksi salah)'
  }[s] || s);

  let devicesHtml = liveNodes.map(n => `
    <div class="bg-slate-800 border border-slate-700 rounded-xl p-3 ${n.status==='on'?'ring-1 ring-green-500':''} ${n.status.startsWith('fail')?'ring-1 ring-red-500':''}">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2"><i class="${n.icon} text-blue-400"></i><span class="font-bold text-sm text-white">${n.name}</span></div>
        <span class="text-[10px] font-bold ${statusColor(n.status)}">${statusText(n.status)}</span>
      </div>
      <div class="grid grid-cols-2 gap-1 mb-2">
        ${n.ports.map(p=>{
          const conn = liveConnections.find(c=>(c.from.node===n.id&&c.from.port===p.num)||(c.to.node===n.id&&c.to.port===p.num));
          return `<button onclick="liveSelectPort('${n.id}',${p.num})" class="text-[10px] bg-slate-700 hover:bg-slate-600 rounded px-1.5 py-1 text-left ${conn?'text-green-300':'text-slate-300'}">
            <span class="text-slate-500">${p.num}.</span> ${p.type} ${conn?'🔗':''}
          </button>`;
        }).join('')}
      </div>
      <div class="flex gap-1">
        <button onclick="liveTogglePower('${n.id}')" class="${n.powered?'bg-red-700 hover:bg-red-600':'bg-green-700 hover:bg-green-600'} flex-1 py-1 rounded text-[10px] font-bold">${n.powered?'Matikan':'Nyalakan'}</button>
        <button onclick="liveDeleteNode('${n.id}')" class="px-2 py-1 bg-red-900 hover:bg-red-800 rounded text-[10px]"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`).join('');

  wrap.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="flex flex-wrap gap-2 mb-4">
          ${Object.entries(LIVE_DEVICE_TYPES).map(([k,v])=>`<button onclick="liveAddDevice('${k}')" class="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold"><i class="${v.icon} mr-1"></i>${v.label}</button>`).join('')}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" id="live-devices">${devicesHtml || '<p class="text-slate-500 text-sm col-span-full">Belum ada device. Tambah dari atas.</p>'}</div>
        <div class="mt-4 bg-slate-800 rounded-xl border border-slate-700 p-3">
          <h3 class="font-bold text-sm mb-2 text-slate-300"><i class="fa-solid fa-project-diagram"></i> Koneksi (${liveConnections.length})</h3>
          <div class="space-y-1 text-xs">${liveConnections.map((c,i)=>`<div class="flex items-center justify-between bg-slate-700 rounded p-1.5">
            <span>${c.from.node} lubang ${c.from.port} → ${c.to.node} lubang ${c.to.port}</span>
            <button onclick="liveDisconnect(${i})" class="text-red-400 hover:text-red-300"><i class="fa-solid fa-unlink"></i></button>
          </div>`).join('') || '<p class="text-slate-500">Belum ada koneksi.</p>'}</div>
        </div>
      </div>
      <div class="bg-slate-900 rounded-xl border border-slate-700 flex flex-col" style="height: 500px;">
        <div class="p-3 border-b border-slate-700 font-bold text-sm text-green-400"><i class="fa-solid fa-terminal"></i> Terminal (lubang 1-10)</div>
        <div id="live-terminal-output" class="flex-grow overflow-y-auto p-3 text-xs font-mono text-slate-300 space-y-0.5"></div>
        <div class="p-2 border-t border-slate-700 flex gap-2">
          <span class="text-emerald-400 text-xs font-mono self-center">$</span>
          <input id="live-term-input" class="flex-grow bg-transparent text-xs font-mono text-green-300 outline-none" placeholder="ketik 'help'..." onkeydown="if(event.key==='Enter'){liveTerminalCmd(this.value); this.value='';}">
        </div>
      </div>
    </div>`;
  renderLiveTerminal();
}

let livePendingPort = null;
function liveSelectPort(nodeId, portNum) {
  if (!livePendingPort) {
    livePendingPort = { node:nodeId, port:portNum };
    showToast(`Pilih lubang tujuan untuk ${nodeId} lubang ${portNum}`, true);
    return;
  }
  if (livePendingPort.node === nodeId) { livePendingPort = null; showToast('Batal.'); return; }
  liveConnect(livePendingPort.node, livePendingPort.port, nodeId, portNum);
  livePendingPort = null;
}
