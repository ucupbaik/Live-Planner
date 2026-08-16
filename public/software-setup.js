// Modul Setup Software - Prism Control theme
// Mengambil dari "file rakitan live" (simpanan/template live)

let swSourceBuild = null;
let swConfig = {
  software: 'OBS Studio',
  res: '1080p60',
  bitrate: 6000,
  server: '',
  scenes: [],
  outputs: []
};

const SW_SOFTWARES = ['OBS Studio', 'vMix', 'Wirecast', 'Streamlabs', 'XSplit'];

function openSoftwareModule() {
  const el = document.getElementById('software-screen');
  el.innerHTML = `
    <header class="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 h-16 flex items-center px-margin-desktop max-w-container-max mx-auto">
      <button onclick="goDashboard()" class="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-bright/10 mr-2"><span class="material-symbols-outlined">arrow_back</span></button>
      <span class="material-symbols-outlined text-tertiary text-2xl mr-2">terminal</span>
      <span class="font-headline-lg text-headline-lg rainbow-text">Setup Software</span>
    </header>
    <main class="pt-24 p-margin-desktop max-w-container-max mx-auto"><div id="sw-content"></div></main>`;
  window.showScreen('software-screen');
  renderSoftwareUI();
}

async function loadLiveBuildsForSoftware() {
  const sel = document.getElementById('sw-source-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">— memuat… —</option>';
  let opts = '';
  try {
    const r1 = await window.api('/api/saves');
    if (r1.ok && r1.data.items) {
      r1.data.items.filter(s => s.data && s.data.module === 'live').forEach(s => {
        opts += `<option value="save_${s.id}">[Simpanan] ${s.title}</option>`;
      });
    }
  } catch(e){}
  try {
    const r2 = await window.api('/api/templates?scope=public');
    if (r2.ok && r2.data.items) {
      r2.data.items.filter(t => t.module === 'live').forEach(t => {
        opts += `<option value="template_${t.id}">[Template] ${t.title}</option>`;
      });
    }
  } catch(e){}
  sel.innerHTML = opts ? `<option value="">— pilih rakitan live —</option>` + opts : '<option value="">Tidak ada rakitan live</option>';
}

async function swUseSource() {
  const sel = document.getElementById('sw-source-select');
  const val = sel.value;
  if (!val) { if (window.showToast) showToast('Pilih rakitan live dulu!'); return; }
  const [kind, id] = val.split('_');
  const path = kind === 'save' ? '/api/saves/'+id : '/api/templates/'+id;
  const { ok, data } = await window.api(path);
  if (!ok) { if (window.showToast) showToast('Gagal memuat.'); return; }
  swSourceBuild = data.data || (data.template && data.template.data);
  if (!swSourceBuild || !swSourceBuild.nodes) { if (window.showToast) showToast('Data rakitan kosong.'); return; }
  const devices = swSourceBuild.nodes.map(n => n.config).filter(Boolean);
  swConfig.scenes = devices.filter(d => /kamera|camera|webcam|ptz|video|source/i.test(d.cat || d.name || '')).map((d,i) => ({
    name: 'Scene ' + (i+1) + ' - ' + d.name,
    source: d.name
  }));
  if (swConfig.scenes.length === 0) swConfig.scenes.push({ name:'Scene 1 - Default', source:'Default' });
  renderSoftwareUI();
  if (window.showToast) showToast('Rakitkan live diambil! ' + devices.length + ' perangkat.', true);
}

function renderSoftwareUI() {
  const wrap = document.getElementById('sw-content');
  if (!wrap) return;
  if (!swSourceBuild) {
    wrap.innerHTML = `<div class="text-center text-on-surface-variant py-10 bg-surface-container-low border border-surface-variant rounded-xl rainbow-border">
      <span class="material-symbols-outlined text-4xl mb-3 text-tertiary">dvr</span>
      <p class="mb-4">Ambil konfigurasi dari rakitan live Anda.</p>
      <select id="sw-source-select" class="bg-[#020617] border border-outline-variant/30 rounded p-2 text-sm text-on-surface mb-3 max-w-xs"></select><br>
      <button onclick="loadLiveBuildsForSoftware()" class="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded text-sm font-bold mr-2 flex items-center gap-1 inline-flex"><span class="material-symbols-outlined text-sm">refresh</span> Muat Daftar</button>
      <button onclick="swUseSource()" class="px-4 py-2 rainbow-gradient text-surface-container-lowest rounded text-sm font-bold rainbow-glow inline-flex items-center gap-1"><span class="material-symbols-outlaid text-sm">download</span> Gunakan Rakitan</button>
    </div>`;
    loadLiveBuildsForSoftware();
    return;
  }
  const devices = swSourceBuild.nodes.map(n => n.config).filter(Boolean);
  wrap.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
      <div class="bg-surface-container-low rounded-xl border border-surface-variant p-4 rainbow-border">
        <h3 class="font-bold text-sm mb-3 text-tertiary flex items-center gap-1"><span class="material-symbols-outlined text-sm">tune</span> Pengaturan Software</h3>
        <div class="mb-3"><label class="block text-xs text-on-surface-variant mb-1">Software</label>
          <select id="sw-software" class="w-full bg-[#020617] border border-outline-variant/30 rounded p-2 text-sm text-on-surface" onchange="swConfig.software=this.value; renderSoftwareUI()">
            ${SW_SOFTWARES.map(s=>`<option ${s===swConfig.software?'selected':''}>${s}</option>`).join('')}
          </select></div>
        <div class="mb-3"><label class="block text-xs text-on-surface-variant mb-1">Resolusi Output</label>
          <select id="sw-res" class="w-full bg-[#020617] border border-outline-variant/30 rounded p-2 text-sm text-on-surface" onchange="swConfig.res=this.value">
            <option ${swConfig.res==='1080p60'?'selected':''}>1080p60</option><option ${swConfig.res==='1080p30'?'selected':''}>1080p30</option><option ${swConfig.res==='4K30'?'selected':''}>4K30</option><option ${swConfig.res==='720p60'?'selected':''}>720p60</option>
          </select></div>
        <div class="mb-3"><label class="block text-xs text-on-surface-variant mb-1">Bitrate (Kbps)</label>
          <input id="sw-bitrate" type="number" value="${swConfig.bitrate||6000}" class="w-full bg-[#020617] border border-outline-variant/30 rounded p-2 text-sm text-on-surface"></div>
        <div class="mb-3"><label class="block text-xs text-on-surface-variant mb-1">Server RTMP</label>
          <input id="sw-server" value="${swConfig.server||''}" placeholder="rtmp://..." class="w-full bg-[#020617] border border-outline-variant/30 rounded p-2 text-sm text-on-surface"></div>
        <button onclick="swSaveConfig()" class="w-full py-2 rainbow-gradient text-surface-container-lowest rounded text-sm font-bold rainbow-glow flex items-center justify-center gap-1"><span class="material-symbols-outlined text-sm">save</span> Simpan Setup</button>
      </div>
      <div class="bg-surface-container-low rounded-xl border border-surface-variant p-4 rainbow-border">
        <h3 class="font-bold text-sm mb-3 text-primary flex items-center gap-1"><span class="material-symbols-outlined text-sm">movie</span> Scene (otomatis dari rakitan)</h3>
        <div id="sw-scenes" class="space-y-2"></div>
        <button onclick="swAddScene()" class="mt-2 text-xs text-primary hover:text-tertiary flex items-center gap-1"><span class="material-symbols-outlined text-sm">add</span> Tambah Scene</button>
      </div>
      <div class="bg-surface-container-low rounded-xl border border-surface-variant p-4 rainbow-border">
        <h3 class="font-bold text-sm mb-3 text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-sm">memory</span> Perangkat Terhubung</h3>
        <div class="space-y-1 text-xs max-h-80 overflow-y-auto">
          ${devices.map(d=>`<div class="bg-surface-container rounded p-2"><div class="font-semibold text-on-surface">${d.name}</div><div class="text-on-surface-variant">${d.brand||''} • ${d.cat||''}</div></div>`).join('')}
        </div>
      </div>
    </div>`;
  renderSWScenes();
}

function renderSWScenes() {
  const box = document.getElementById('swf-scenes') || document.getElementById('sw-scenes');
  if (!box) return;
  box.innerHTML = swConfig.scenes.map((s,i)=>`<div class="bg-surface-container rounded p-2 flex items-center justify-between">
    <div class="flex-grow"><div class="font-semibold text-on-surface text-xs">${s.name}</div><div class="text-on-surface-variant text-[10px]">Source: ${s.source}</div></div>
    <button onclick="swRemoveScene(${i})" class="text-error hover:text-error-container ml-2"><span class="material-symbols-outlined text-sm">delete</span></button>
  </div>`).join('');
}

function swAddScene() {
  swConfig.scenes.push({ name:'Scene Baru', source:'—' });
  renderSWScenes();
}
function swRemoveScene(i) {
  swConfig.scenes.splice(i,1);
  renderSWScenes();
}

function swSaveConfig() {
  swConfig.res = document.getElementById('sw-res').value;
  swConfig.bitrate = parseInt(document.getElementById('sw-bitrate').value)||6000;
  swConfig.server = document.getElementById('sw-server').value;
  if (!window.currentUser) { if (window.showToast) showToast('Login untuk simpan!'); return; }
  const data = { type:'software', config: swConfig, source: swSourceBuild, module:'software' };
  const title = prompt('Nama setup software:', 'Setup ' + swConfig.software) || 'Setup Software';
  window.api('/api/saves', { method:'POST', body:{ title, data } }).then(({ok})=>{
    if (ok) { if (window.showToast) showToast('Setup software tersimpan!', true); } else { if (window.showToast) showToast('Gagal simpan.'); }
  });
}

window._openSoftwareModule = openSoftwareModule;
