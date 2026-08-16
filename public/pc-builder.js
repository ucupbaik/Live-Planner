// Modul Perakitan PC - Prism Control theme
// Terintegrasi dengan pro-planner.html

const PC_COMPONENTS = {
  cpu: {
    label: 'CPU (Processor)',
    icon: 'memory',
    items: [
      { id:'cpu_i9_14900k', name:'Intel Core i9-14900K', brand:'Intel', socket:'LGA1700', tdp:253, cores:24, igpu:true, func:'Flagship desktop, 24-core (8P+16E), boost 6.0GHz' },
      { id:'cpu_i7_14700k', name:'Intel Core i7-14700K', brand:'Intel', socket:'LGA1700', tdp:253, cores:20, igpu:true, func:'20-core (8P+12E), boost 5.6GHz, cocok streaming' },
      { id:'cpu_i5_14600k', name:'Intel Core i5-14600K', brand:'Intel', socket:'LGA1700', tdp:181, cores:14, igpu:true, func:'14-core (6P+8E), boost 5.3GHz, value terbaik' },
      { id:'cpu_r9_7950x', name:'AMD Ryzen 9 7950X', brand:'AMD', socket:'AM5', tdp:170, cores:16, igpu:true, func:'16-core Zen4, boost 5.7GHz, multi-task berat' },
      { id:'cpu_r7_7800x3d', name:'AMD Ryzen 7 7800X3D', brand:'AMD', socket:'AM5', tdp:120, cores:8, igpu:true, func:'8-core 3D V-Cache, terbaik gaming & OBS' },
      { id:'cpu_r5_7600', name:'AMD Ryzen 5 7600', brand:'AMD', socket:'AM5', tdp:65, cores:6, igpu:true, func:'6-core Zen4, efisien untuk build hemat' }
    ]
  },
  motherboard: {
    label: 'Motherboard',
    icon: 'developer_board',
    items: [
      { id:'mb_z790', name:'ASUS ROG Maximus Z790 Hero', brand:'ASUS', socket:'LGA1700', ram:'DDR5', form:'ATX', func:'High-end Intel Z790, DDR5, PCIe 5.0' },
      { id:'mb_b760', name:'MSI PRO B760M', brand:'MSI', socket:'LGA1700', ram:'DDR5', form:'mATX', func:'Budget Intel B760 mATX' },
      { id:'mb_x670e', name:'ASUS ROG X670E-E', brand:'ASUS', socket:'AM5', ram:'DDR5', form:'ATX', func:'High-end AMD X670E, DDR5' },
      { id:'mb_b650', name:'Gigabyte B650 AORUS', brand:'Gigabyte', socket:'AM5', ram:'DDR5', form:'ATX', func:'Mid AMD B650, DDR5' }
    ]
  },
  gpu: {
    label: 'GPU (VGA)',
    icon: 'videogame_asset',
    items: [
      { id:'gpu_rtx4090', name:'NVIDIA RTX 4090', brand:'NVIDIA', vram:24, tdp:450, func:'24GB GDDR6X, NVENC ganda untuk encode berat' },
      { id:'gpu_rtx4080', name:'NVIDIA RTX 4080 Super', brand:'NVIDIA', vram:16, tdp:320, func:'16GB GDDR6X, encode 4K halus' },
      { id:'gpu_rtx4070', name:'NVIDIA RTX 4070', brand:'NVIDIA', vram:12, tdp:200, func:'12GB GDDR6X, efisien untuk stream' },
      { id:'gpu_rx7900', name:'AMD RX 7900 XTX', brand:'AMD', vram:24, tdp:355, func:'24GB GDDR6, raw power gaming' },
      { id:'gpu_intel_a770', name:'Intel Arc A770', brand:'Intel', vram:16, tdp:225, func:'16GB, encode AV1 native' }
    ]
  },
  ram: {
    label: 'RAM',
    icon: 'memory',
    items: [
      { id:'ram_ddr5_32', name:'Corsair Vengeance 32GB', brand:'Corsair', type:'DDR5', speed:6000, func:'2x16GB DDR5-6000 CL30' },
      { id:'ram_ddr5_64', name:'G.Skill Trident 64GB', brand:'G.Skill', type:'DDR5', speed:6000, func:'2x32GB DDR5-6000' },
      { id:'ram_ddr4_32', name:'Kingston Fury 32GB', brand:'Kingston', type:'DDR4', speed:3200, func:'2x16GB DDR4-3200' }
    ]
  },
  storage: {
    label: 'Storage (SSD)',
    icon: 'storage',
    items: [
      { id:'ssd_980pro', name:'Samsung 990 Pro 2TB', brand:'Samsung', iface:'NVMe', func:'PCIe 4.0 NVMe, read 7450MB/s' },
      { id:'ssd_sn850', name:'WD Black SN850X 1TB', brand:'WD', iface:'NVMe', func:'PCIe 4.0 NVMe gaming' },
      { id:'ssd_sata', name:'Crucial MX500 1TB', brand:'Crucial', iface:'SATA', func:'SATA SSD andalan' }
    ]
  },
  psu: {
    label: 'PSU (Power Supply)',
    icon: 'power',
    items: [
      { id:'psu_1000w', name:'Seasonic Prime 1000W', brand:'Seasonic', watt:1000, rating:'80+ Titanium', func:'Untuk RTX 4090 + i9' },
      { id:'psu_850w', name:'Corsair RM850x', brand:'Corsair', watt:850, rating:'80+ Gold', func:'Untuk RTX 4080 / 4070' },
      { id:'psu_650w', name:'be quiet! 650W', brand:'be quiet!', watt:650, rating:'80+ Gold', func:'Untuk build hemat daya' }
    ]
  },
  cooler: {
    label: 'Cooler',
    icon: 'ac_unit',
    items: [
      { id:'cool_aio360', name:'NZXT Kraken 360', brand:'NZXT', type:'AIO', func:'Liquid 360mm untuk i9/R9' },
      { id:'cool_air', name:'Noctua NH-D15', brand:'Noctua', type:'Air', func:'Tower air cooler premium' },
      { id:'cool_stock', name:'Stock Cooler', brand:'Intel/AMD', type:'Air', func:'Bundling prosesor' }
    ]
  },
  case: {
    label: 'Case',
    icon: 'check_box_outline_blank',
    items: [
      { id:'case_o11', name:'Lian Li O11 Dynamic', brand:'Lian Li', form:'ATX', func:'Mid-tower tempered glass' },
      { id:'case_h510', name:'NZXT H510', brand:'NZXT', form:'ATX', func:'Minimalis ATX' },
      { id:'case_nr200', name:'Cooler Master NR200', brand:'Cooler Master', form:'mATX', func:'Mini-ITX compact' }
    ]
  }
};

let pcBuild = {};

function renderPCCatalog() {
  const wrap = document.getElementById('pc-catalog');
  if (!wrap) return;
  let html = '';
  for (const [key, grp] of Object.entries(PC_COMPONENTS)) {
    const selected = pcBuild[key];
    html += `<div class="mb-3">
      <div class="flex items-center justify-between mb-1">
        <span class="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-1"><span class="material-symbols-outlined text-sm text-tertiary">${grp.icon}</span>${grp.label}</span>
        ${selected ? `<button onclick="removePC('${key}')" class="text-[10px] text-error hover:text-error-container flex items-center gap-1"><span class="material-symbols-outlined text-sm">close</span> hapus</button>` : ''}
      </div>`;
    if (selected) {
      html += `<div class="bg-primary/10 border border-primary rounded-lg p-2 text-xs">
        <div class="font-bold text-on-surface">${selected.name}</div>
        <div class="text-on-surface-variant">${selected.brand} • ${selected.func}</div>
      </div>`;
    } else {
      html += `<div class="space-y-1">` + grp.items.map(it => `
        <button onclick="addPC('${key}','${it.id}')" class="w-full text-left bg-surface-container hover:bg-surface-container-high rounded p-2 text-xs transition flex items-center gap-2">
          <span class="material-symbols-outlined text-outline text-sm">add_circle</span>
          <div><div class="font-semibold text-on-surface">${it.name}</div><div class="text-on-surface-variant">${it.brand}</div></div>
        </button>`).join('') + `</div>`;
    }
    html += `</div>`;
  }
  wrap.innerHTML = html;
  validatePC();
}

function addPC(group, id) {
  const item = PC_COMPONENTS[group].items.find(x => x.id === id);
  if (!item) return;
  pcBuild[group] = item;
  renderPCCatalog();
  renderPCSummary();
  renderPCVisual();
  if (window.showToast) showToast(`${item.name} ditambahkan.`, true);
}
function removePC(group) {
  delete pcBuild[group];
  renderPCCatalog();
  renderPCSummary();
  renderPCVisual();
}

function validatePC() {
  const issues = [];
  const cpu = pcBuild.cpu, mb = pcBuild.motherboard, ram = pcBuild.ram, psu = pcBuild.psu, gpu = pcBuild.gpu;
  if (cpu && mb && cpu.socket !== mb.socket) issues.push(`Socket tidak cocok: CPU ${cpu.socket} vs MB ${mb.socket}`);
  if (mb && ram && mb.ram !== ram.type) issues.push(`RAM tidak cocok: MB butuh ${mb.ram}, RAM ${ram.type}`);
  if (cpu && psu) {
    const need = (cpu.tdp||0) + (gpu?gpu.tdp:0) + 150;
    if (psu.watt < need) issues.push(`PSU kurang: butuh ~${need}W, punya ${psu.watt}W`);
  }
  const box = document.getElementById('pc-validation');
  if (!box) return;
  if (issues.length === 0) {
    box.innerHTML = `<div class="text-tertiary text-xs flex items-center gap-1"><span class="material-symbols-outlined text-sm">check_circle</span> Semua komponen kompatibel!</div>`;
  } else {
    box.innerHTML = `<div class="text-error text-xs space-y-1">` + issues.map(i=>`<div class="flex items-center gap-1"><span class="material-symbols-outlined text-sm">warning</span> ${i}</div>`).join('') + `</div>`;
  }
}

function renderPCSummary() {
  const box = document.getElementById('pc-summary');
  if (!box) return;
  const groups = Object.keys(PC_COMPONENTS);
  let totalTDP = 0;
  let rows = groups.map(g => {
    const it = pcBuild[g];
    if (it) {
      if (g==='cpu'||g==='gpu') totalTDP += (it.tdp||0);
      if (g==='psu') totalTDP += 50;
    }
    return `<tr><td class="text-on-surface-variant py-1">${PC_COMPONENTS[g].label}</td><td class="text-on-surface font-semibold py-1">${it?it.name:'<span class="text-outline">— belum dipilih —</span>'}</td></tr>`;
  }).join('');
  box.innerHTML = `<table class="w-full text-xs"><tbody>${rows}</tbody></table>
    <div class="mt-2 pt-2 border-t border-outline-variant/30 text-xs text-on-surface-variant">Estimasi daya: <span class="text-on-surface font-bold">${totalTDP}W</span></div>`;
}

function openPCModule() {
  const el = document.getElementById('pc-screen');
  el.innerHTML = `
    <header class="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 h-16 flex items-center px-margin-desktop max-w-container-max mx-auto">
      <button onclick="goDashboard()" class="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-bright/10 mr-2"><span class="material-symbols-outlined">arrow_back</span></button>
      <span class="material-symbols-outlined text-tertiary text-2xl mr-2">memory</span>
      <span class="font-headline-lg text-headline-lg rainbow-text">Rakit PC</span>
      <div class="ml-auto flex gap-2">
        <button onclick="renderPCVisual()" class="text-on-surface-variant hover:text-primary px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-tertiary transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">view_in_ar</span><span class="font-label-sm text-label-sm">Visual</span></button>
        <button onclick="savePCBuild()" class="rainbow-gradient text-surface-container-lowest font-label-sm text-label-sm px-4 py-2 rounded-lg rainbow-glow transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">save</span>Simpan</button>
      </div>
    </header>
    <main class="pt-24 p-margin-desktop max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-3 gap-gutter">
      <div class="lg:col-span-2 bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border">
        <h2 class="font-headline-md text-headline-md text-on-surface mb-4">Component Catalog</h2>
        <div id="pc-catalog" class="max-h-[60vh] overflow-y-auto pr-2"></div>
      </div>
      <div class="flex flex-col gap-gutter">
        <div class="bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border">
          <h3 class="font-headline-md text-headline-md text-on-surface mb-3">Summary</h3>
          <div id="pc-summary"></div>
          <div id="pc-validation" class="mt-3"></div>
        </div>
        <div class="bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border">
          <h3 class="font-headline-md text-headline-md text-on-surface mb-3">Build Visual</h3>
          <div id="pc-visual" class="space-y-2"></div>
        </div>
      </div>
    </main>`;
  window.showScreen('pc-screen');
  renderPCCatalog();
  renderPCSummary();
  renderPCVisual();
}

function renderPCVisual() {
  const box = document.getElementById('pc-visual');
  if (!box) return;
  const order = ['case','motherboard','cpu','cooler','gpu','ram','storage','psu'];
  let html = '';
  order.forEach(g => {
    const it = pcBuild[g];
    const grp = PC_COMPONENTS[g];
    if (it) {
      html += `<div class="flex items-center gap-2 bg-surface-container rounded p-2">
        <span class="material-symbols-outlined text-tertiary">${grp.icon}</span>
        <div class="flex-grow"><div class="font-semibold text-on-surface text-xs">${it.name}</div><div class="text-on-surface-variant text-[10px]">${it.brand}</div></div>
        <span class="material-symbols-outlined text-tertiary text-sm">check_circle</span>
      </div>`;
    } else {
      html += `<div class="flex items-center gap-2 bg-surface-container-lowest rounded p-2 border border-dashed border-outline-variant/40">
        <span class="material-symbols-outlined text-outline">${grp.icon}</span>
        <div class="flex-grow text-outline text-xs">${grp.label} — kosong</div>
        <span class="material-symbols-outlined text-outline text-sm">circle</span>
      </div>`;
    }
  });
  box.innerHTML = html;
}

async function savePCBuild() {
  if (!window.currentUser) { if (window.showToast) showToast('Login diperlukan untuk menyimpan!'); return; }
  if (Object.keys(pcBuild).length === 0) { if (window.showToast) showToast('Pilih komponen dulu!'); return; }
  const data = { type:'pc', build: pcBuild, module:'pc' };
  const title = prompt('Nama rakitan PC:', 'Rakitan PC ' + new Date().toLocaleDateString('id-ID')) || 'Rakitan PC';
  const { ok } = await window.api('/api/saves', { method:'POST', body:{ title, data } });
  if (ok) { if (window.showToast) showToast('Rakitan PC tersimpan!', true); } else { if (window.showToast) showToast('Gagal simpan.'); }
}

window._openPCModule = openPCModule;
