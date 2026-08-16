const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const vm = require('vm');

const root = 'c:/Users/yusuf/Downloads/EVENT BROADCAST PLANNER/public';
const html = fs.readFileSync(path.join(root, 'pro-planner.html'), 'utf8');

// Extract inline scripts
const inlineScripts = [];
const re = /<script>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(html)) !== null) { inlineScripts.push(m[1]); }

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.com/' });
const { window } = dom;
window.fetch = async () => ({ ok: true, json: async () => ({ ok: true, saves: [], templates: [] }) });

const ctx = dom.getInternalVMContext();
// Combine all JS files + inline scripts into ONE script (mimics browser global scope sharing)
let combined = '';
for (const f of ['equipment-data.js', 'pc-builder.js', 'software-setup.js', 'live-setup.js']) {
  combined += '\n//=== ' + f + ' ===\n' + fs.readFileSync(path.join(root, f), 'utf8');
}
combined += '\n//=== inline ===\n' + inlineScripts.join('\n');

try {
  vm.runInContext(combined, ctx, { filename: 'combined.js' });
} catch (e) {
  console.log('COMBINED LOAD ERROR: ' + e.message);
}

const results = [];
function check(name, fn) {
  try { const r = fn(); results.push('OK ' + name + (r !== undefined ? ' -> ' + JSON.stringify(r) : '')); }
  catch (e) { results.push('FAIL ' + name + ': ' + e.message); }
}

check('PC_COMPONENTS', () => typeof PC_COMPONENTS);
check('openPCModule()', () => { openPCModule(); return !document.getElementById('pc-screen').classList.contains('hidden'); });
check('addPC', () => { const g = Object.keys(PC_COMPONENTS)[0]; addPC(g, PC_COMPONENTS[g].items[0].id); return Object.keys(pcBuild).length; });
check('validatePC', () => { validatePC(); return 'ran'; });
check('SW_SOFTWARES', () => typeof SW_SOFTWARES);
check('openSoftwareModule()', () => { openSoftwareModule(); return !document.getElementById('software-screen').classList.contains('hidden'); });
check('swAddScene', () => { swAddScene(); return swConfig.scenes.length; });
check('LIVE_DEVICE_TYPES', () => typeof LIVE_DEVICE_TYPES);
check('openLiveSetupModule()', () => { openLiveSetupModule(); return !document.getElementById('live-screen').classList.contains('hidden'); });
check('liveAddDevice', () => { liveAddDevice('camera'); return liveNodes.length; });
check('liveTerminalCmd help', () => { liveTerminalCmd('help'); return liveTerminalLines.length > 0; });
check('liveTerminalCmd list', () => { liveTerminalCmd('list'); return 'ran'; });
check('liveTerminalCmd status', () => { liveTerminalCmd('status'); return 'ran'; });
check('liveTogglePower', () => { liveTogglePower(liveNodes[0].id); return liveNodes[0].powered; });
check('evaluateLiveStatus', () => { evaluateLiveStatus(); return liveNodes[0].status; });
check('liveConnect', () => { liveAddDevice('pc'); liveConnect(liveNodes[0].id, 1, liveNodes[1].id, 1); return liveConnections.length; });

console.log(results.join('\n'));
