// Modul Perakitan PC - seperti buildcores.com tapi tanpa harga & link pembelian
// Terintegrasi dengan pro-planner.html

const PC_COMPONENTS = {
  cpu: {
    label: 'CPU (Processor)',
    icon: 'fa-solid fa-microchip',
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
    icon: 'fa-solid fa-server',
    items: [
      { id:'mb_z790', name:'ASUS ROG Maximus Z790 Hero', brand:'ASUS', socket:'LGA1700', ram:'DDR5', form:'ATX', func:'High-end Intel Z790, DDR5, PCIe 5.0' },
      { id:'mb_b760', name:'MSI PRO B760M', brand:'MSI', socket:'LGA1700', ram:'DDR5', form:'mATX', func:'Budget Intel B760 mATX' },
      { id:'mb_x670e', name:'ASUS ROG X670E-E', brand:'ASUS', socket:'AM5', ram:'DDR5', form:'ATX', func:'High-end AMD X670E, DDR5' },
      { id:'mb_b650', name:'Gigabyte B650 AORUS', brand:'Gigabyte', socket:'AM5', ram:'DDR5', form:'ATX', func:'Mid AMD B650, DDR5' }
    ]
  },
  gpu: {
    label: 'GPU (VGA)',
    icon: 'fa-solid fa-gamepad',
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
    icon: 'fa-solid fa-memory',
    items: [
      { id:'ram_ddr5_32', name:'Corsair Vengeance 32GB', brand:'Corsair', type:'DDR5', speed:6000, func:'2x16GB DDR5-6000 CL30' },
      { id:'ram_ddr5_64', name:'G.Skill Trident 64GB', brand:'G.Skill', type:'DDR5', speed:6000, func:'2x32GB DDR5-6000' },
      { id:'ram_ddr4_32', name:'Kingston Fury 32GB', brand:'Kingston', type:'DDR4', speed:3200, func:'2x16GB DDR4-3200' }
    ]
  },
  storage: {
    label: 'Storage (SSD)',
    icon: 'fa-solid fa-hard-drive',
    items: [
      { id:'ssd_980pro', name:'Samsung 990 Pro 2TB', brand:'Samsung', iface:'NVMe', func:'PCIe 4.0 NVMe, read 7450MB/s' },
      { id:'ssd_sn850', name:'WD Black SN850X 1TB', brand:'WD', iface:'NVMe', func:'PCIe 4.0 NVMe gaming' },
      { id:'ssd_sata', name:'Crucial MX500 1TB', brand:'Crucial', iface:'SATA', func:'SATA SSD andalan' }
    ]
  },
  psu: {
    label: 'PSU (Power Supply)',
    icon: 'fa-solid fa-plug',
    items: [
      { id:'psu_1000w', name:'Seasonic Prime 1000W', brand:'Seasonic', watt:1000, rating:'80+ Titanium', func:'Untuk RTX 4090 + i9' },
      { id:'psu_850w', name:'Corsair RM850x', brand:'Corsair', watt:850, rating:'80+ Gold', func:'Untuk RTX 4080 / 4070' },
      { id:'psu_650w', name:'be quiet! 650W', brand:'be quiet!', watt:650, rating:'80+ Gold', func:'Untuk build hemat daya' }
    ]
  },
  cooler: {
    label: 'Cooler',
    icon: 'fa-solid fa-snowflake',
    items: [
      { id:'cool_aio360', name:'NZXT Kraken 360', brand:'NZXT', type:'AIO', func:'Liquid 360mm untuk i9/R9' },
      { id:'cool_air', name:'Noctua NH-D15', brand:'Noctua', type:'Air', func:'Tower air cooler premium' },
      { id:'cool_stock', name:'Stock Cooler', brand:'Intel/AMD', type:'Air', func:'Bundling prosesor' }
    ]
  },
  case: {
    label: 'Case',
    icon: 'fa-solid fa-box',
    items: [
      { id:'case_o11', name:'Lian Li O11 Dynamic', brand:'Lian Li', form:'ATX', func:'Mid-tower tempered glass' },
      { id:'case_h510', name:'NZXT H510', brand:'NZXT', form:'ATX', func:'Minimalis ATX' },
      { id:'case_nr200', name:'Cooler Master NR200', brand:'Cooler Master', form:'mATX', func:'Mini-ITX compact' }
    ]
  }
};

// State perakitan PC
let pcBuild = {}; // { cpu: itemObj, motherboard: itemObj, ... }

function renderPCCatalog() {
  const wrap = document.getElementById('pc-catalog');
  if (!wrap) return;
  let html = '';
  for (const [key, grp] of Object.entries(PC_COMPONENTS)) {
    const selected = pcBuild[key];
    html += `<div class="mb-3">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-bold text-slate-300 uppercase"><i class="${grp.icon} mr-1"></i>${grp.label}</span>
        ${selected ? `<button onclick="removePC('${key}')" class="text-[10px] text-red-400 hover:text-red-300"><i class="fa-solid fa-xmark"></i> hapus</button>` : ''}
      </div>`;
    if (selected) {
      html += `<div class="bg-blue-900/40 border border-blue-600 rounded-lg p-2 text-xs">
        <div class="font-bold text-white">${selected.name}</div>
        <div class="text-slate-400">${selected.brand} • ${selected.func}</div>
      </div>`;
    } else {
      html += `<div class="space-y-1">` + grp.items.map(it => `
        <button onclick="addPC('${key}','${it.id}')" class="w-full text-left bg-slate-700 hover:bg-slate-600 rounded p-2 text-xs transition">
          <div class="font-semibold text-white">${it.name}</div>
          <div class="text-slate-400">${it.brand}</div>
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
  showToast(`${item.name} ditambahkan.`, true);
}
function removePC(group) {
  delete pcBuild[group];
  renderPCCatalog();
  renderPCSummary();
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
    box.innerHTML = `<div class="text-green-400 text-xs"><i class="fa-solid fa-circle-check"></i> Semua komponen kompatibel!</div>`;
  } else {
    box.innerHTML = `<div class="text-red-400 text-xs space-y-1">` + issues.map(i=>`<div><i class="fa-solid fa-triangle-exclamation"></i> ${i}</div>`).join('') + `</div>`;
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
      if (g==='psu') totalTDP += 50; // base system
    }
    return `<tr><td class="text-slate-400">${PC_COMPONENTS[g].label}</td><td class="text-white font-semibold">${it?it.name:'<span class="text-slate-600">— belum dipilih —</span>'}</td></tr>`;
  }).join('');
  box.innerHTML = `<table class="w-full text-xs"><tbody>${rows}</tbody></table>
    <div class="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">Estimasi daya: <span class="text-white font-bold">${totalTDP}W</span></div>`;
}

function openPCModule() {
  currentModule = 'pc';
  document.getElementById('builder-module-badge').textContent = 'Perakitan PC';
  showScreen('pc-screen');
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
      html += `<div class="flex items-center gap-2 bg-slate-700 rounded p-2">
        <i class="${grp.icon} text-amber-400"></i>
        <div class="flex-grow"><div class="font-semibold text-white text-xs">${it.name}</div><div class="text-slate-400 text-[10px]">${it.brand}</div></div>
        <i class="fa-solid fa-circle-check text-green-400"></i>
      </div>`;
    } else {
      html += `<div class="flex items-center gap-2 bg-slate-900 rounded p-2 border border-dashed border-slate-700">
        <i class="${grp.icon} text-slate-600"></i>
        <div class="flex-grow text-slate-600 text-xs">${grp.label} — kosong</div>
        <i class="fa-solid fa-circle text-slate-700"></i>
      </div>`;
    }
  });
  box.innerHTML = html;
}

async function savePCBuild() {
  if (!currentUser) { showToast('Login diperlukan untuk menyimpan!'); return; }
  if (Object.keys(pcBuild).length === 0) { showToast('Pilih komponen dulu!'); return; }
  const data = { type:'pc', build: pcBuild, module:'pc' };
  const title = prompt('Nama rakitan PC:', 'Rakitan PC ' + new Date().toLocaleDateString('id-ID')) || 'Rakitan PC';
  const { ok } = await api('/api/saves', { method:'POST', body:{ title, data } });
  if (ok) showToast('Rakitan PC tersimpan!', true); else showToast('Gagal simpan.');
}
