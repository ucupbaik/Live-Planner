// Modul Setup Software - mengambil dari "file rakitan live" (simpanan/template live)
// Menampilkan konfigurasi software (OBS/vMix/dll) berdasarkan perangkat di setup live

let swSourceBuild = null; // data build live yang diambil
let swConfig = {
  software: 'OBS Studio',
  scenes: [],
  outputs: []
};

const SW_SOFTWARES = ['OBS Studio', 'vMix', 'Wirecast', 'Streamlabs', 'XSplit'];

function openSoftwareModule() {
  currentModule = 'software';
  document.getElementById('builder-module-badge').textContent = 'Setup Software';
  showScreen('software-screen');
  renderSoftwareUI();
}

// Ambil data dari rakitan live (simpanan atau template bertipe live)
async function loadLiveBuildsForSoftware() {
  const sel = document.getElementById('sw-source-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">— memuat… —</option>';
  let opts = '';
  try {
    const r1 = await api('/api/saves'); 
    if (r1.ok && r1.data.items) {
      r1.data.items.filter(s => s.data && s.data.module === 'live').forEach(s => {
        opts += `<option value="save_${s.id}">[Simpanan] ${s.title}</option>`;
      });
    }
  } catch(e){}
  try {
    const r2 = await api('/api/templates?scope=public');
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
  if (!val) { showToast('Pilih rakitan live dulu!'); return; }
  const [kind, id] = val.split('_');
  const path = kind === 'save' ? '/api/saves/'+id : '/api/templates/'+id;
  const { ok, data } = await api(path);
  if (!ok) { showToast('Gagal memuat.'); return; }
  swSourceBuild = data.data || (data.template && data.template.data);
  if (!swSourceBuild || !swSourceBuild.nodes) { showToast('Data rakitan kosong.'); return; }
  // Ekstrak perangkat dari nodes
  const devices = swSourceBuild.nodes.map(n => n.config).filter(Boolean);
  // Buat scene otomatis: 1 scene per kamera/sumber video
  swConfig.scenes = devices.filter(d => /kamera|camera|webcam|ptz|video|source/i.test(d.cat || d.name || '')).map((d,i) => ({
    name: 'Scene ' + (i+1) + ' - ' + d.name,
    source: d.name
  }));
  if (swConfig.scenes.length === 0) swConfig.scenes.push({ name:'Scene 1 - Default', source:'Default' });
  renderSoftwareUI();
  showToast('Rakitkan live diambil! ' + devices.length + ' perangkat.', true);
}

function renderSoftwareUI() {
  const wrap = document.getElementById('sw-content');
  if (!wrap) return;
  if (!swSourceBuild) {
    wrap.innerHTML = `<div class="text-center text-slate-400 py-10">
      <i class="fa-solid fa-display text-4xl mb-3 text-emerald-400"></i>
      <p class="mb-4">Ambil konfigurasi dari rakitan live Anda.</p>
      <select id="sw-source-select" class="bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white mb-3 max-w-xs"></select><br>
      <button onclick="loadLiveBuildsForSoftware()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-bold mr-2"><i class="fa-solid fa-rotate"></i> Muat Daftar</button>
      <button onclick="swUseSource()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-bold"><i class="fa-solid fa-download"></i> Gunakan Rakitan</button>
    </div>`;
    loadLiveBuildsForSoftware();
    return;
  }
  const devices = swSourceBuild.nodes.map(n => n.config).filter(Boolean);
  wrap.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 class="font-bold text-sm mb-3 text-emerald-300"><i class="fa-solid fa-sliders"></i> Pengaturan Software</h3>
        <div class="mb-3"><label class="block text-xs text-slate-400 mb-1">Software</label>
          <select id="sw-software" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" onchange="swConfig.software=this.value; renderSoftwareUI()">
            ${SW_SOFTWARES.map(s=>`<option ${s===swConfig.software?'selected':''}>${s}</option>`).join('')}
          </select></div>
        <div class="mb-3"><label class="block text-xs text-slate-400 mb-1">Resolusi Output</label>
          <select id="sw-res" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white" onchange="swConfig.res=this.value">
            <option ${swConfig.res==='1080p60'?'selected':''}>1080p60</option><option ${swConfig.res==='1080p30'?'selected':''}>1080p30</option><option ${swConfig.res==='4K30'?'selected':''}>4K30</option><option ${swConfig.res==='720p60'?'selected':''}>720p60</option>
          </select></div>
        <div class="mb-3"><label class="block text-xs text-slate-400 mb-1">Bitrate (Kbps)</label>
          <input id="sw-bitrate" type="number" value="${swConfig.bitrate||6000}" class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"></div>
        <div class="mb-3"><label class="block text-xs text-slate-400 mb-1">Server RTMP</label>
          <input id="sw-server" value="${swConfig.server||''}" placeholder="rtmp://..." class="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white"></div>
        <button onclick="swSaveConfig()" class="w-full py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-bold"><i class="fa-solid fa-floppy-disk"></i> Simpan Setup</button>
      </div>
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 class="font-bold text-sm mb-3 text-blue-300"><i class="fa-solid fa-film"></i> Scene (otomatis dari rakitan)</h3>
        <div id="sw-scenes" class="space-y-2"></div>
        <button onclick="swAddScene()" class="mt-2 text-xs text-blue-400 hover:text-blue-300"><i class="fa-solid fa-plus"></i> Tambah Scene</button>
      </div>
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 class="font-bold text-sm mb-3 text-purple-300"><i class="fa-solid fa-microchip"></i> Perangkat Terhubung</h3>
        <div class="space-y-1 text-xs max-h-80 overflow-y-auto">
          ${devices.map(d=>`<div class="bg-slate-700 rounded p-2"><div class="font-semibold text-white">${d.name}</div><div class="text-slate-400">${d.brand||''} • ${d.cat||''}</div></div>`).join('')}
        </div>
      </div>
    </div>`;
  renderSWScenes();
}

function renderSWScenes() {
  const box = document.getElementById('sw-scenes');
  if (!box) return;
  box.innerHTML = swConfig.scenes.map((s,i)=>`<div class="bg-slate-700 rounded p-2 flex items-center justify-between">
    <div class="flex-grow"><div class="font-semibold text-white text-xs">${s.name}</div><div class="text-slate-400 text-[10px]">Source: ${s.source}</div></div>
    <button onclick="swRemoveScene(${i})" class="text-red-400 hover:text-red-300 ml-2"><i class="fa-solid fa-trash"></i></button>
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
  if (!currentUser) { showToast('Login untuk simpan!'); return; }
  const data = { type:'software', config: swConfig, source: swSourceBuild, module:'software' };
  const title = prompt('Nama setup software:', 'Setup ' + swConfig.software) || 'Setup Software';
  api('/api/saves', { method:'POST', body:{ title, data } }).then(({ok})=>{
    if (ok) showToast('Setup software tersimpan!', true); else showToast('Gagal simpan.');
  });
}
