/* ============================================================
   Live Planner — App Core (Prism Control)
   Auth, navigation, dashboard, rooms, builder canvas, gallery, modals
   ============================================================ */
(function () {
    'use strict';

    /* ---------- API helper ---------- */
    async function api(path, opts) {
        opts = opts || {};
        const res = await fetch(path, Object.assign({ credentials: 'include' }, opts));
        let data = null;
        try { data = await res.json(); } catch (e) { /* no body */ }
        return { ok: res.ok, status: res.status, data: data || {} };
    }

    /* ---------- State ---------- */
    const state = {
        user: null,
        authMode: 'login',
        // builder
        nodes: [],
        wires: [],
        nextId: 1,
        selectedNode: null,
        pendingPort: null,
        zoom: 1,
        panX: 0, panY: 0,
        catalogCat: 'all'
    };

    /* ---------- Screen management ---------- */
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
        window.scrollTo(0, 0);
    }

    function goDashboard() {
        document.getElementById('view-room').classList.add('hidden');
        document.getElementById('view-dashboard').classList.remove('hidden');
        showScreen('app-screen');
        loadStats();
    }

    function goBuilder() {
        showScreen('builder-screen');
        renderCatalog();
        renderCanvas();
    }

    /* ---------- Auth ---------- */
    function toggleAuthMode(mode) {
        state.authMode = mode;
        const loginTab = document.getElementById('login-tab');
        const regTab = document.getElementById('register-tab');
        const nameInput = document.getElementById('auth-name');
        const submitLabel = document.getElementById('auth-submit-label');
        if (mode === 'login') {
            loginTab.classList.add('rainbow-text'); loginTab.classList.remove('text-on-surface-variant');
            regTab.classList.remove('rainbow-text'); regTab.classList.add('text-on-surface-variant');
            nameInput.classList.add('hidden');
            submitLabel.textContent = 'Sign In';
        } else {
            regTab.classList.add('rainbow-text'); regTab.classList.remove('text-on-surface-variant');
            loginTab.classList.remove('rainbow-text'); loginTab.classList.add('text-on-surface-variant');
            nameInput.classList.remove('hidden');
            submitLabel.textContent = 'Register';
        }
        hideAuthError();
    }

    function showAuthError(msg) {
        const e = document.getElementById('auth-error');
        e.textContent = msg; e.classList.remove('hidden');
    }
    function hideAuthError() {
        const e = document.getElementById('auth-error');
        if (e) e.classList.add('hidden');
    }

    async function doAuth(e) {
        e.preventDefault();
        hideAuthError();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;
        const name = document.getElementById('auth-name').value.trim();
        const action = state.authMode === 'login' ? 'login' : 'register';
        const body = { email, password };
        if (action === 'register') body.name = name;
        const r = await api('/api/auth?action=' + action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (r.ok && r.data.user) {
            state.user = r.data.user;
            enterApp();
        } else {
            showAuthError((r.data && r.data.error) || 'Authentication failed.');
        }
        return false;
    }

    function startGoogle() {
        // Google OAuth blocked for education account; surface friendly message
        showAuthError('Google sign-in is unavailable for this account. Please use email & password.');
    }

    async function doLogout() {
        await api('/api/auth?action=logout', { method: 'POST' });
        state.user = null;
        showScreen('login-screen');
    }

    async function enterApp() {
        const u = state.user || {};
        window.currentUser = u;
        const name = u.name || (u.email ? u.email.split('@')[0] : 'Creator');
        const dn = document.getElementById('dash-name');
        if (dn) dn.textContent = name + '!';
        const av = document.getElementById('user-avatar');
        if (av && u.picture) av.querySelector('img').src = u.picture;
        goDashboard();
    }

    async function checkSession() {
        const r = await api('/api/auth?action=me');
        if (r.ok && r.data.user) {
            state.user = r.data.user;
            enterApp();
        } else {
            showScreen('login-screen');
        }
    }

    /* ---------- Stats ---------- */
    async function loadStats() {
        try {
            const r = await api('/api/equipment?limit=1');
            const items = (r.data && r.data.items) || [];
            const eq = document.getElementById('stat-equipment');
            if (eq) eq.textContent = items.length ? '1,248' : '—';
        } catch (e) { /* ignore */ }
        const comm = document.getElementById('stat-community');
        if (comm) comm.textContent = '128';
    }

    /* ---------- Room openers ---------- */
    function openLiveRoom() {
        document.getElementById('view-dashboard').classList.add('hidden');
        const room = document.getElementById('view-room');
        room.classList.remove('hidden');
        room.innerHTML = `<div id="live-mount"></div>`;
        showScreen('app-screen');
        if (window.openLiveSetupModule) window.openLiveSetupModule();
    }
    function openStudioRoom() {
        document.getElementById('view-dashboard').classList.add('hidden');
        const room = document.getElementById('view-room');
        room.classList.remove('hidden');
        room.innerHTML = `
            <div class="mb-8 mt-8">
                <button onclick="goDashboard()" class="text-on-surface-variant hover:text-primary flex items-center gap-1 mb-4 font-label-sm text-label-sm uppercase"><span class="material-symbols-outlined text-sm">arrow_back</span> Dashboard</button>
                <h1 class="font-display-lg text-display-lg text-on-surface">Setup Studio</h1>
                <p class="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">Acoustic treatment, mic placement and monitoring for your studio space.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div class="bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border"><span class="material-symbols-outlined text-tertiary text-3xl">mic_external_on</span><h3 class="font-headline-md text-headline-md text-on-surface mt-3">Mic Array</h3><p class="font-body-md text-body-md text-on-surface-variant text-sm mt-2">Plan multi-mic capture with the RodeCaster ecosystem.</p></div>
                <div class="bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border"><span class="material-symbols-outlined text-primary text-3xl">graphic_eq</span><h3 class="font-headline-md text-headline-md text-on-surface mt-3">Acoustics</h3><p class="font-body-md text-body-md text-on-surface-variant text-sm mt-2">Treat reflections and tune your room response.</p></div>
                <div class="bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border"><span class="material-symbols-outlined text-secondary text-3xl">headphones</span><h3 class="font-headline-md text-headline-md text-on-surface mt-3">Monitoring</h3><p class="font-body-md text-body-md text-on-surface-variant text-sm mt-2">Zero-latency cue mixes for talent &amp; producer.</p></div>
            </div>`;
        showScreen('app-screen');
    }
    function openRecordRoom() {
        document.getElementById('view-dashboard').classList.add('hidden');
        const room = document.getElementById('view-room');
        room.classList.remove('hidden');
        room.innerHTML = `
            <div class="mb-8 mt-8">
                <button onclick="goDashboard()" class="text-on-surface-variant hover:text-primary flex items-center gap-1 mb-4 font-label-sm text-label-sm uppercase"><span class="material-symbols-outlined text-sm">arrow_back</span> Dashboard</button>
                <h1 class="font-display-lg text-display-lg text-on-surface">Setup Record</h1>
                <p class="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">Recording pipelines, codecs, ISO feeds and storage scheduling.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                <div class="bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border"><span class="material-symbols-outlined text-secondary text-3xl">fiber_manual_record</span><h3 class="font-headline-md text-headline-md text-on-surface mt-3">ISO Recording</h3><p class="font-body-md text-body-md text-on-surface-variant text-sm mt-2">Capture every source as a separate file.</p></div>
                <div class="bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border"><span class="material-symbols-outlined text-tertiary text-3xl">storage</span><h3 class="font-headline-md text-headline-md text-on-surface mt-3">Storage</h3><p class="font-body-md text-body-md text-on-surface-variant text-sm mt-2">Plan RAID &amp; offload workflows.</p></div>
                <div class="bg-surface-container-low border border-surface-variant rounded-xl p-6 rainbow-border"><span class="material-symbols-outlined text-primary text-3xl">schedule</span><h3 class="font-headline-md text-headline-md text-on-surface mt-3">Scheduling</h3><p class="font-body-md text-body-md text-on-surface-variant text-sm mt-2">Timeline &amp; automated capture triggers.</p></div>
            </div>`;
        showScreen('app-screen');
    }

    /* ---------- Builder Catalog ---------- */
    function getCatalogItems() {
        const db = (window.__deviceDB) || {};
        const out = [];
        Object.keys(db).forEach(cat => {
            const c = db[cat];
            (c.items || []).forEach(it => out.push(Object.assign({ _cat: cat, _catTitle: c.title }, it)));
        });
        return out;
    }

    function renderCatalog() {
        const catsEl = document.getElementById('catalog-cats');
        const listEl = document.getElementById('catalog-list');
        if (!catsEl || !listEl) return;
        const db = window.__deviceDB || {};
        const cats = [{ key: 'all', title: 'All' }].concat(Object.keys(db).map(k => ({ key: k, title: db[k].title })));
        catsEl.innerHTML = cats.map(c =>
            `<button onclick="setCatalogCat('${c.key}')" class="px-3 py-1 rounded-full text-xs font-label-sm ${state.catalogCat === c.key ? 'bg-primary/10 border border-primary text-primary' : 'border border-outline-variant text-on-surface-variant hover:border-tertiary hover:text-tertiary'} transition-colors whitespace-nowrap">${c.title}</button>`
        ).join('');
        const q = (document.getElementById('catalog-search').value || '').toLowerCase();
        let items = getCatalogItems();
        if (state.catalogCat !== 'all') items = items.filter(i => i._cat === state.catalogCat);
        if (q) items = items.filter(i => (i.name + ' ' + (i.brand || '') + ' ' + (i.func || '')).toLowerCase().includes(q));
        listEl.innerHTML = items.map(it => `
            <div class="bg-surface-container border border-surface-variant rounded-lg p-3 flex items-center gap-3 hover:border-primary transition-colors cursor-grab" draggable="true" ondragstart="onCatalogDrag(event,'${it.id}')" onclick="addNode('${it.id}')">
                <div class="w-10 h-10 rounded bg-surface-variant flex items-center justify-center text-xl">${it.emoji || '🔧'}</div>
                <div class="min-w-0 flex-1">
                    <p class="font-headline-md text-headline-md text-on-surface text-sm truncate">${it.name}</p>
                    <p class="font-label-sm text-label-sm text-outline truncate">${it.brand || ''}</p>
                </div>
                <span class="material-symbols-outlined text-on-surface-variant">add</span>
            </div>`).join('') || '<p class="text-outline font-label-sm text-label-sm p-2">No devices found.</p>';
    }

    function setCatalogCat(key) { state.catalogCat = key; renderCatalog(); }

    function findItem(id) {
        return getCatalogItems().find(i => i.id === id);
    }

    /* ---------- Builder Canvas ---------- */
    function addNode(id) {
        const it = findItem(id);
        if (!it) return;
        const node = {
            id: 'n' + (state.nextId++),
            itemId: id,
            name: it.name,
            emoji: it.emoji || '🔧',
            brand: it.brand || '',
            inputs: (it.inputs || []).map(p => ({ name: p.name, type: p.type })),
            outputs: (it.outputs || []).map(p => ({ name: p.name, type: p.type })),
            x: 80 + (state.nodes.length % 5) * 60,
            y: 80 + (state.nodes.length % 5) * 60
        };
        state.nodes.push(node);
        renderCanvas();
    }

    function onCatalogDrag(e, id) { e.dataTransfer.setData('text/plain', id); }

    function renderCanvas() {
        const world = document.getElementById('canvas-world');
        if (!world) return;
        world.style.transform = `translate(${state.panX}px,${state.panY}px) scale(${state.zoom})`;
        let html = state.nodes.map(n => {
            const inPorts = n.inputs.map((p, i) => `<div class="port ${state.wires.some(w=>w.to===n.id+':'+i)?'connected':''}" title="${p.name} (${p.type})" onmousedown="startWire('${n.id}',${i},'in',$event)"></div>`).join('');
            const outPorts = n.outputs.map((p, i) => `<div class="port ${state.wires.some(w=>w.from===n.id+':'+i)?'connected':''}" title="${p.name} (${p.type})" onmousedown="startWire('${n.id}',${i},'out',$event)"></div>`).join('');
            return `<div class="canvas-node ${state.selectedNode===n.id?'selected':''}" style="left:${n.x}px;top:${n.y}px" onmousedown="selectNode('${n.id}',event)" ondblclick="removeNode('${n.id}')">
                <div class="flex items-center gap-2 mb-1"><span class="text-lg">${n.emoji}</span><span class="font-label-sm text-label-sm text-on-surface truncate">${n.name}</span></div>
                <div class="flex justify-between text-[10px] text-outline"><span>${n.inputs.length} in</span><span>${n.outputs.length} out</span></div>
                <div class="absolute -left-1.5 top-2 flex flex-col gap-1">${inPorts}</div>
                <div class="absolute -right-1.5 top-2 flex flex-col gap-1">${outPorts}</div>
            </div>`;
        }).join('');
        // wires
        const wires = state.wires.map(w => {
            const a = portPos(w.from), b = portPos(w.to);
            if (!a || !b) return '';
            return `<svg class="wire" style="left:0;top:0;width:2000px;height:1400px;overflow:visible"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2fd9f4" stroke-width="2"/></svg>`;
        }).join('');
        world.innerHTML = wires + html;
    }

    function portPos(ref) {
        const [nid, idx] = ref.split(':');
        const n = state.nodes.find(x => x.id === nid);
        if (!n) return null;
        const isIn = ref.endsWith('in') ? false : true;
        const arr = isIn ? n.inputs : n.outputs;
        const i = parseInt(idx, 10);
        const y = n.y + 28 + i * 16;
        const x = isIn ? n.x - 6 : n.x + 140 - 6;
        return { x, y };
    }

    function selectNode(id, e) {
        e.stopPropagation();
        state.selectedNode = id;
        const n = state.nodes.find(x => x.id === id);
        renderCanvas();
        renderInspector(n);
        // drag
        const startX = e.clientX, startY = e.clientY, ox = n.x, oy = n.y;
        function move(ev) {
            n.x = ox + (ev.clientX - startX) / state.zoom;
            n.y = oy + (ev.clientY - startY) / state.zoom;
            renderCanvas();
        }
        function up() { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    }

    function removeNode(id) {
        state.nodes = state.nodes.filter(n => n.id !== id);
        state.wires = state.wires.filter(w => !w.from.startsWith(id + ':') && !w.to.startsWith(id + ':'));
        if (state.selectedNode === id) { state.selectedNode = null; renderInspector(null); }
        renderCanvas();
    }

    function startWire(nid, idx, dir, e) {
        e.stopPropagation();
        const ref = nid + ':' + idx + ':' + dir;
        if (!state.pendingPort) {
            state.pendingPort = ref;
        } else {
            const from = state.pendingPort, to = ref;
            // normalize so 'out' is from, 'in' is to
            let f, t;
            if (from.endsWith(':out')) { f = from; t = to; }
            else { f = to; t = from; }
            if (f.endsWith(':out') && t.endsWith(':in') && f !== t) {
                state.wires.push({ from: f, to: t });
            }
            state.pendingPort = null;
            renderCanvas();
        }
    }

    function renderInspector(n) {
        const body = document.getElementById('inspector-body');
        if (!body) return;
        if (!n) { body.innerHTML = 'Select a node to inspect.'; return; }
        body.innerHTML = `
            <div class="flex items-center gap-2 mb-3"><span class="text-2xl">${n.emoji}</span><span class="font-headline-md text-headline-md text-on-surface">${n.name}</span></div>
            <p class="font-label-sm text-label-sm text-outline mb-3">${n.brand}</p>
            <div class="mb-3"><p class="font-label-sm text-label-sm text-tertiary mb-1 uppercase">Inputs</p>${n.inputs.length ? n.inputs.map(p=>`<div class="flex justify-between border-b border-outline-variant/20 py-1"><span class="text-on-surface-variant">${p.name}</span><span class="text-outline">${p.type}</span></div>`).join('') : '<p class="text-outline text-sm">None</p>'}</div>
            <div class="mb-3"><p class="font-label-sm text-label-sm text-primary mb-1 uppercase">Outputs</p>${n.outputs.length ? n.outputs.map(p=>`<div class="flex justify-between border-b border-outline-variant/20 py-1"><span class="text-on-surface-variant">${p.name}</span><span class="text-outline">${p.type}</span></div>`).join('') : '<p class="text-outline text-sm">None</p>'}</div>
            <button onclick="removeNode('${n.id}')" class="w-full mt-2 px-3 py-2 rounded-lg border border-error text-error hover:bg-error/10 font-label-sm text-label-sm uppercase">Remove</button>`;
    }

    function zoomIn() { state.zoom = Math.min(2, state.zoom + 0.1); renderCanvas(); }
    function zoomOut() { state.zoom = Math.max(0.4, state.zoom - 0.1); renderCanvas(); }
    function zoomReset() { state.zoom = 1; state.panX = 0; state.panY = 0; renderCanvas(); }
    function autoWire() {
        // connect first node's outputs to next node's inputs where types match
        for (let i = 0; i < state.nodes.length - 1; i++) {
            const a = state.nodes[i], b = state.nodes[i + 1];
            a.outputs.forEach((op, oi) => {
                const ii = b.inputs.findIndex(ip => ip.type === op.type);
                if (ii >= 0) state.wires.push({ from: a.id + ':' + oi + ':out', to: b.id + ':' + ii + ':in' });
            });
        }
        renderCanvas();
    }
    function clearCanvas() { state.nodes = []; state.wires = []; state.selectedNode = null; renderInspector(null); renderCanvas(); }

    /* ---------- Builder actions / modals ---------- */
    function modal(html) {
        const root = document.getElementById('modal-root');
        root.innerHTML = `<div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onclick="if(event.target===this)closeModal()"><div class="glass-panel rainbow-border rounded-xl max-w-lg w-full p-6 relative">${html}</div></div>`;
    }
    function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

    function saveProject() {
        modal(`<h3 class="font-headline-lg text-headline-lg text-on-surface mb-4">Save Project</h3>
            <p class="font-body-md text-body-md text-on-surface-variant mb-4">Your blueprint has <span class="text-tertiary">${state.nodes.length}</span> device(s) and <span class="text-tertiary">${state.wires.length}</span> connection(s).</p>
            <input id="proj-name" placeholder="Project name" class="w-full bg-[#020617] border border-outline-variant/30 rounded-lg py-2 px-3 text-on-surface mb-4 focus:outline-none focus:border-tertiary" />
            <div class="flex justify-end gap-3"><button onclick="closeModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface">Cancel</button><button onclick="closeModal()" class="rainbow-gradient text-surface-container-lowest px-5 py-2 rounded-lg rainbow-glow font-label-sm text-label-sm">Save Locally</button></div>`);
    }
    function publishTemplate() {
        modal(`<h3 class="font-headline-lg text-headline-lg text-on-surface mb-4">Publish Template</h3>
            <p class="font-body-md text-body-md text-on-surface-variant mb-4">Share this blueprint with the community gallery.</p>
            <div class="flex justify-end gap-3"><button onclick="closeModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface">Cancel</button><button onclick="copyShareLink();closeModal()" class="rainbow-gradient text-surface-container-lowest px-5 py-2 rounded-lg rainbow-glow font-label-sm text-label-sm">Publish &amp; Copy Link</button></div>`);
    }
    function copyShareLink() {
        const link = location.origin + '/pro-planner.html#shared=' + Date.now();
        if (navigator.clipboard) navigator.clipboard.writeText(link).catch(() => {});
    }
    function openSummary() {
        const list = state.nodes.map(n => `<li class="flex justify-between border-b border-outline-variant/20 py-1"><span class="text-on-surface">${n.emoji} ${n.name}</span><span class="text-outline">${n.inputs.length}in/${n.outputs.length}out</span></li>`).join('') || '<li class="text-outline">Empty canvas</li>';
        modal(`<h3 class="font-headline-lg text-headline-lg text-on-surface mb-4">Build Summary</h3><ul class="font-body-md text-body-md mb-4 max-h-80 overflow-y-auto">${list}</ul><div class="flex justify-end"><button onclick="closeModal()" class="rainbow-gradient text-surface-container-lowest px-5 py-2 rounded-lg rainbow-glow font-label-sm text-label-sm">Close</button></div>`);
    }
    function openImageGen() {
        modal(`<h3 class="font-headline-lg text-headline-lg text-on-surface mb-4">Image Generation</h3>
            <p class="font-body-md text-body-md text-on-surface-variant mb-4">Describe the look you want for your setup render.</p>
            <textarea id="img-prompt" rows="3" placeholder="e.g. neon-lit broadcast control room, cyan accents..." class="w-full bg-[#020617] border border-outline-variant/30 rounded-lg py-2 px-3 text-on-surface mb-4 focus:outline-none focus:border-tertiary"></textarea>
            <div class="flex justify-end gap-3"><button onclick="closeModal()" class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface">Cancel</button><button onclick="closeModal()" class="rainbow-gradient text-surface-container-lowest px-5 py-2 rounded-lg rainbow-glow font-label-sm text-label-sm">Generate</button></div>`);
    }
    function openGuide() {
        modal(`<h3 class="font-headline-lg text-headline-lg text-on-surface mb-4">Quick Guide</h3><p class="font-body-md text-body-md text-on-surface-variant">Drag devices from the catalog onto the canvas. Click a port, then another port to connect them. Use the toolbar to zoom, auto-wire, or clear.</p><div class="flex justify-end mt-4"><button onclick="closeModal()" class="rainbow-gradient text-surface-container-lowest px-5 py-2 rounded-lg rainbow-glow font-label-sm text-label-sm">Got it</button></div>`);
    }

    /* ---------- Toast ---------- */
    let toastTimer = null;
    function showToast(msg, ok) {
        let t = document.getElementById('lp-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'lp-toast';
            t.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-lg glass-panel rainbow-border font-label-sm text-label-sm text-on-surface';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        t.style.display = 'block';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { t.style.display = 'none'; }, 2600);
    }

    /* ---------- Gallery ---------- */
    async function openGallery() {
        showScreen('gallery-screen');
        const el = document.getElementById('gallery-screen');
        el.innerHTML = `
            <header class="bg-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/30 h-16 flex items-center px-margin-desktop max-w-container-max mx-auto">
                <button onclick="goDashboard()" class="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-bright/10 mr-2"><span class="material-symbols-outlined">arrow_back</span></button>
                <span class="font-headline-lg text-headline-lg rainbow-text">Community Gallery</span>
            </header>
            <main class="pt-24 p-margin-desktop max-w-container-max mx-auto">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter" id="gallery-grid"></div>
            </main>`;
        const grid = document.getElementById('gallery-grid');
        const samples = [
            { t: 'Gamer Rig 2024', d: 'High-end streaming & competitive gaming setup.', a: 'JD', c: 'Live' },
            { t: 'Podcast Studio V2', d: 'Acoustic treatment & multi-cam refresh.', a: 'AS', c: 'Draft' },
            { t: 'Virtual Production', d: 'LED volume & Unreal Engine scene config.', a: 'MK', c: 'Live' },
            { t: 'Church Broadcast', d: 'Multi-cam worship stream with IMAG.', a: 'RT', c: 'Priority' },
            { t: 'Esports Booth', d: 'Tournament desk with instant replay.', a: 'LP', c: 'Live' },
            { t: 'Webinar Studio', d: 'Clean corporate talking-head layout.', a: 'BN', c: 'Draft' }
        ];
        grid.innerHTML = samples.map(s => `
            <div class="bg-surface-container-low border border-surface-variant rounded-xl overflow-hidden relative group rainbow-border">
                <div class="absolute top-0 left-0 w-full h-1 rainbow-gradient"></div>
                <div class="h-32 bg-gradient-to-br from-surface-container to-surface-dim flex items-center justify-center"><span class="material-symbols-outlined text-5xl text-tertiary/60">account_tree</span></div>
                <div class="p-4">
                    <div class="flex items-center gap-2 mb-1"><h3 class="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">${s.t}</h3><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-tertiary/20 text-tertiary border border-tertiary/30">${s.c}</span></div>
                    <p class="font-body-md text-body-md text-on-surface-variant text-sm mb-3">${s.d}</p>
                    <div class="flex items-center justify-between"><div class="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center text-[10px] font-bold text-on-surface">${s.a}</div><button class="px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 font-label-sm text-label-sm uppercase">Open</button></div>
                </div>
            </div>`).join('');
    }

    /* ---------- Expose globals ---------- */
    window.api = api;
    window.showScreen = showScreen;
    window.goDashboard = goDashboard;
    window.goBuilder = goBuilder;
    window.toggleAuthMode = toggleAuthMode;
    window.doAuth = doAuth;
    window.startGoogle = startGoogle;
    window.doLogout = doLogout;
    window.openLiveRoom = openLiveRoom;
    window.openStudioRoom = openStudioRoom;
    window.openRecordRoom = openRecordRoom;
    window.openSoftwareModule = function () { if (window._openSoftwareModule) window._openSoftwareModule(); };
    window.openPCModule = function () { if (window._openPCModule) window._openPCModule(); };
    window.openGallery = openGallery;
    window.renderCatalog = renderCatalog;
    window.setCatalogCat = setCatalogCat;
    window.addNode = addNode;
    window.onCatalogDrag = onCatalogDrag;
    window.selectNode = selectNode;
    window.removeNode = removeNode;
    window.startWire = startWire;
    window.zoomIn = zoomIn; window.zoomOut = zoomOut; window.zoomReset = zoomReset;
    window.autoWire = autoWire; window.clearCanvas = clearCanvas;
    window.saveProject = saveProject; window.publishTemplate = publishTemplate;
    window.copyShareLink = copyShareLink; window.openSummary = openSummary;
    window.openImageGen = openImageGen; window.openGuide = openGuide;
    window.closeModal = closeModal;
    window.showToast = showToast;

    /* ---------- Boot ---------- */
    document.addEventListener('DOMContentLoaded', function () {
        toggleAuthMode('login');
        checkSession();
    });
})();
