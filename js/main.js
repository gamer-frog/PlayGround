// ══════════ HIDROPONÍA — main game logic ══════════
import * as THREE from 'three';
import { buildWorld, makePlantMesh } from './world.js';
import { CROPS, CROP_IDS, MILESTONES, UPGRADES, rollPrices, rollContractOffers, netWorth } from './data.js';
import { sfx, setMuted, isMuted } from './audio.js';

const $ = (id) => document.getElementById(id);
const DAY_LEN = 210;               // real seconds per in-game day
const DAY_START = 6 * 60, DAY_END = 22 * 60;
const SAVE_KEY = 'hidroponia.save.v1';

/* ═══════════ STATE ═══════════ */
const defaultState = () => ({
  cash: 400, day: 1, timeMin: DAY_START,
  seeds: { lettuce: 4, kale: 2, basil: 2, tomato: 1, strawberry: 0 },
  produce: { lettuce: 0, kale: 0, basil: 0, tomato: 0, strawberry: 0 },
  nutrient: 2, pesticide: 1,
  selectedSeed: 'lettuce',
  upgrades: { led2: false, led1: false, autoWater: false, autoDose: false, market: false, solar: false, racks2: false, racks4: false },
  prices: rollPrices(),
  offers: rollContractOffers(1),
  activeContracts: [],
  milestonesClaimed: [],
  dayStats: { earned: 0, spent: 0, harvested: 0 },
});

let state = defaultState();
let world = null;
let scene, camera, renderer, clock;
let screen = 'title';         // title | playing | paused | sleep
let modal = null;             // null | shop | sell | contracts
let currentInteract = null;   // { type, rack? }
let yaw = 0, pitch = 0;
const playerPos = new THREE.Vector3(0, 1.66, 6.4);
const keys = {};
const raycaster = new THREE.Raycaster();
raycaster.far = 3.6;

/* ═══════════ BOOT / RENDERER ═══════════ */
function init() {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.domElement.id = 'game-canvas';
  document.body.prepend(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 220);
  camera.rotation.order = 'YXZ';
  camera.position.copy(playerPos);

  world = buildWorld(scene);
  syncRacksFromState();

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
  bindUI();
  bindInput();

  // autostart param for quick testing: ?autostart=1
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') {
    newGame(false);
  } else {
    $('btn-continue').style.visibility = localStorage.getItem(SAVE_KEY) ? 'visible' : 'hidden';
  }
  animate();
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* ═══════════ SAVE / LOAD ═══════════ */
function serialize() {
  return JSON.stringify({
    ...state,
    racks: world.racks.map(r => ({ unlocked: r.unlocked, data: r.data })),
  });
}
function saveGame(showToast = true) {
  try {
    localStorage.setItem(SAVE_KEY, serialize());
    if (showToast) toast('💾 Game saved.', 'info');
    $('btn-continue').style.visibility = 'visible';
  } catch (e) { toast('Could not save: ' + e.message, 'bad'); }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    state = { ...defaultState(), ...s };
    for (const r of world.racks) {
      const saved = s.racks && s.racks[r.index];
      if (saved) { r.unlocked = saved.unlocked; r.data = { ...r.data, ...saved.data }; }
      r.group.visible = r.unlocked;
      r.stageCache = -1; r.cropCache = null;
      refreshRackVisual(r, true);
    }
    return true;
  } catch (e) { console.error(e); return false; }
}
function syncRacksFromState() {
  for (const r of world.racks) { r.stageCache = -1; r.cropCache = null; refreshRackVisual(r, true); }
}
function applyUnlocks() {
  for (const r of world.racks) {
    if (r.index === 4 || r.index === 5) r.unlocked = state.upgrades.racks2;
    if (r.index === 6 || r.index === 7) r.unlocked = state.upgrades.racks4;
    if (r.index < 4) r.unlocked = true;
    r.group.visible = r.unlocked;
  }
}

/* ═══════════ UI HELPERS ═══════════ */
function toast(msg, type = 'info') {
  const box = $('toasts');
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'info' ? '' : ' ' + type);
  el.innerHTML = msg;
  box.appendChild(el);
  while (box.children.length > 5) box.removeChild(box.firstChild);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; setTimeout(() => el.remove(), 350); }, 4600);
}
function refreshRackVisual(rack, force = false) {
  const stage = !rack.data.crop ? -1 : rack.data.growth < 15 ? 0 : rack.data.growth < 50 ? 1 : 2;
  if (!force && stage === rack.stageCache && rack.cropCache === rack.data.crop) { updateRackFlags(rack); return; }
  rack.stageCache = stage; rack.cropCache = rack.data.crop;
  // clear old plants
  while (rack.plantsG.children.length) {
    const c = rack.plantsG.children.pop();
    c.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    rack.plantsG.remove(c);
  }
  if (rack.data.crop) {
    const def = CROPS[rack.data.crop];
    for (const slot of rack.slots) {
      const p = makePlantMesh(rack.data.crop, def, rack.data.growth);
      p.position.copy(slot);
      p.rotation.y = Math.random() * Math.PI * 2;
      rack.plantsG.add(p);
    }
  }
  updateRackFlags(rack);
}
function updateRackFlags(rack) {
  rack.aphids.visible = !!rack.data.pests;
  rack.wrench.visible = !!rack.data.broken;
  for (const m of rack.ledMats) {
    m.emissiveIntensity = rack.data.broken ? 0.03 : 2.1;
    m.emissive.setHex(rack.data.broken ? 0x444444 : 0xfff7ae);
  }
}

/* ═══════════ ECONOMY HELPERS ═══════════ */
const sellPrice = (id) => Math.round(state.prices[id] * (state.upgrades.market ? 1.15 : 1));
const cropSellTotal = () => CROP_IDS.reduce((s, id) => s + state.produce[id] * sellPrice(id), 0);
function operatingCost() { return state.upgrades.solar ? 22 : 45; }
function ledBonus() { return state.upgrades.led2 ? 1.5 : state.upgrades.led1 ? 1.25 : 1; }
function spend(amount) { state.cash -= amount; state.dayStats.spent += amount; }
function earn(amount) { state.cash += amount; state.dayStats.earned += amount; }
function checkMilestones() {
  const worth = netWorth(state, world.racks);
  for (const m of MILESTONES) {
    if (worth >= m.worth && !state.milestonesClaimed.includes(m.name)) {
      state.milestonesClaimed.push(m.name);
      state.cash += m.reward; state.dayStats.earned += m.reward;
      $('milestone-name').textContent = m.name;
      $('milestone-reward').textContent = `Net worth $${m.worth.toLocaleString()} · +$${m.reward} bonus`;
      $('milestone-toast').classList.remove('hidden');
      sfx.success();
      setTimeout(() => $('milestone-toast').classList.add('hidden'), 5200);
    }
  }
}

/* ═══════════ HUD ═══════════ */
function updateHUD() {
  $('hud-cash').textContent = '$' + Math.floor(state.cash).toLocaleString();
  $('hud-networth').textContent = 'Net worth $' + netWorth(state, world.racks).toLocaleString();
  $('hud-day').textContent = 'Day ' + state.day;
  const h = Math.floor(state.timeMin / 60), m = Math.floor(state.timeMin % 60);
  $('hud-clock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  $('hud-contracts').textContent = `${state.activeContracts.length} contract${state.activeContracts.length === 1 ? '' : 's'}`;
  // milestone
  const next = MILESTONES.find(m => !state.milestonesClaimed.includes(m.name));
  $('hud-milestone').textContent = next ? `$${next.worth.toLocaleString()} — ${next.name}` : '🏆 All milestones reached!';
  // prices ticker
  $('hud-prices').innerHTML = CROP_IDS.map(id => {
    const up = state.prices[id] >= CROPS[id].sell;
    return `<span>${CROPS[id].icon} $${state.prices[id]}<i class="${up ? 'price-up' : 'price-down'}">${up ? '▲' : '▼'}</i></span>`;
  }).join('');
  // hotbar
  $('hotbar').innerHTML = CROP_IDS.map((id, i) => `
    <div class="hotbar-slot ${state.selectedSeed === id ? 'selected' : ''}" data-crop="${id}">
      <div class="hb-key">${i + 1}</div>
      <div class="hb-icon">${CROPS[id].icon}</div>
      <div class="hb-name">${CROPS[id].name}</div>
      <div class="hb-count">×${state.seeds[id]}</div>
    </div>`).join('');
  $('hud-nutrient').textContent = state.nutrient;
  $('hud-pesticide').textContent = state.pesticide;
  // day progress
  const t = (state.timeMin - DAY_START) / (DAY_END - DAY_START);
  $('daybar-fill').style.width = (t * 100).toFixed(1) + '%';
  $('daybar-sun').style.left = (t * 100).toFixed(1) + '%';
}

/* rack inspector */
function updateRackPanel() {
  const r = currentInteract && currentInteract.type === 'rack' ? currentInteract.rack : null;
  const panel = $('rack-panel');
  if (!r) { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  const d = r.data;
  $('rp-index').textContent = (r.index + 1);
  $('rp-crop').textContent = d.crop ? `${CROPS[d.crop].icon} ${CROPS[d.crop].name}${d.growth >= 100 ? ' — READY!' : ''}` : 'Empty rack — plant seeds (E)';
  $('rp-growth').style.width = d.crop ? d.growth + '%' : '0%';
  $('rp-water').style.width = d.water + '%';
  $('rp-nutr').style.width = d.nutr + '%';
  $('rp-health').style.width = d.health + '%';
  $('rp-ph').textContent = 'pH ' + d.ph.toFixed(2);
  $('rp-ph').style.color = (d.ph >= 5.9 && d.ph <= 7.0) ? '#4ade80' : '#f87171';
  $('rp-flags').textContent = [d.broken ? '⚡ LIGHT OUT' : '', d.pests ? '🐛 PESTS!' : ''].filter(Boolean).join(' ');
}

/* ═══════════ PROMPT ═══════════ */
function updatePrompt() {
  const el = $('prompt');
  if (!currentInteract || screen !== 'playing' || modal) { el.classList.add('hidden'); return; }
  let text = '';
  const ci = currentInteract;
  if (ci.type === 'rack') {
    const d = ci.rack.data, sel = state.selectedSeed;
    if (d.broken) text = `[E] Repair light fixture ($15)`;
    else if (!d.crop) text = state.seeds[sel] > 0
      ? `[E] Plant ${CROPS[sel].name} seed  (have ${state.seeds[sel]})`
      : `No ${CROPS[sel].name} seeds — press [B] to buy`;
    else if (d.growth >= 100) text = `[E] 🌾 Harvest ${CROPS[d.crop].name}!`;
    else text = `${CROPS[d.crop].name} growing… ${Math.floor(d.growth)}%`;
    text += `\n[F] Water   [C] Nutrient   [V] pH $4   [X] Spray`;
  } else if (ci.type === 'tank') text = `[E] Inspect nutrient tank`;
  else if (ci.type === 'mixer') text = `[E] Mix nutrient batch — $25 → +2 units`;
  else if (ci.type === 'computer') text = `[E] Open VerdiaOS — Contracts & Deliveries`;
  else if (ci.type === 'stall') text = `[E] Open Market Stall — Sell produce`;
  if (!text) { el.classList.add('hidden'); return; }
  el.textContent = text;
  el.classList.remove('hidden');
}

/* ═══════════ MODALS ═══════════ */
function openModal(name) {
  modal = name;
  document.exitPointerLock?.();
  $('prompt').classList.add('hidden');
  $('rack-panel').classList.add('hidden');
  renderModal(name);
  $(name + '-modal').classList.remove('hidden');
}
function closeModal() {
  if (!modal) return;
  $(modal + '-modal').classList.add('hidden');
  modal = null;
  if (screen === 'playing') lockPointer();
}
function renderModal(name) {
  if (name === 'shop') renderShop();
  else if (name === 'sell') renderSell();
  else if (name === 'contracts') renderContracts();
}

/* ── shop ── */
function renderShop() {
  $('shop-cash').textContent = '$' + Math.floor(state.cash).toLocaleString();
  $('shop-seeds').innerHTML = CROP_IDS.map(id => {
    const c = CROPS[id];
    return `<div class="shop-item">
      <div class="si-icon">${c.icon}</div>
      <div class="si-body"><div class="si-name">${c.name} Seed</div><div class="si-desc">grows in ${c.growTime}s · sells ~$${c.sell}</div></div>
      <button class="buy-btn" data-buy-seed="${id}" ${state.cash < c.seedCost ? 'disabled' : ''}>$${c.seedCost}</button>
      <button class="buy-btn" data-buy-seed5="${id}" ${state.cash < c.seedCost * 5 ? 'disabled' : ''}>×5 $${c.seedCost * 5}</button>
    </div>`;
  }).join('');
  $('shop-supplies').innerHTML = `
    <div class="shop-item"><div class="si-icon">🧴</div><div class="si-body"><div class="si-name">Pesticide</div><div class="si-desc">cures aphid outbreaks</div></div>
      <button class="buy-btn" data-buy-pesticide="1" ${state.cash < 18 ? 'disabled' : ''}>$18</button></div>
    <div class="shop-item"><div class="si-icon">🧪</div><div class="si-body"><div class="si-name">Nutrient Concentrate</div><div class="si-desc">+2 nutrient units (or mix at the station)</div></div>
      <button class="buy-btn" data-buy-nutrient="1" ${state.cash < 25 ? 'disabled' : ''}>+2 · $25</button></div>`;
  $('shop-upgrades').innerHTML = UPGRADES.map(u => {
    const owned = state.upgrades[u.id];
    const locked = u.needs && !state.upgrades[u.needs];
    const afford = state.cash >= u.cost;
    let btn;
    if (owned) btn = `<button class="buy-btn owned" disabled>OWNED ✓</button>`;
    else if (locked) btn = `<button class="buy-btn" disabled>NEEDS ${u.needs === 'racks2' ? 'ROW B' : 'LV.1'}</button>`;
    else btn = `<button class="buy-btn" data-buy-upgrade="${u.id}" ${afford ? '' : 'disabled'}>$${u.cost.toLocaleString()}</button>`;
    return `<div class="shop-item"><div class="si-icon">${u.icon}</div>
      <div class="si-body"><div class="si-name">${u.name}</div><div class="si-desc">${u.desc}</div></div>${btn}</div>`;
  }).join('');
}
function buySeed(id, qty) {
  const cost = CROPS[id].seedCost * qty;
  if (state.cash < cost) return sfx.error();
  spend(cost); state.seeds[id] += qty;
  sfx.click(); renderShop(); updateHUD();
}
function buyUpgrade(id) {
  const u = UPGRADES.find(x => x.id === id);
  if (!u || state.upgrades[id] || state.cash < u.cost) return sfx.error();
  spend(u.cost); state.upgrades[id] = true;
  if (id === 'racks2' || id === 'racks4') applyUnlocks();
  sfx.build();
  toast(`${u.icon} <b>${u.name}</b> installed!`);
  renderShop(); updateHUD(); checkMilestones();
}

/* ── sell ── */
function renderSell() {
  $('sell-cash').textContent = '$' + Math.floor(state.cash).toLocaleString();
  const rows = CROP_IDS.filter(id => state.produce[id] > 0);
  if (!rows.length) {
    $('sell-rows').innerHTML = `<div class="sell-empty">Your storage is empty.<br>Harvest ready crops with <b>E</b> first!</div>`;
    $('sell-total').textContent = '$0';
  } else {
    $('sell-rows').innerHTML = rows.map(id => {
      const q = state.produce[id], p = sellPrice(id);
      const base = CROPS[id].sell, up = state.prices[id] >= base;
      return `<div class="sell-row">
        <span style="font-size:24px">${CROPS[id].icon}</span>
        <span class="sell-name">${CROPS[id].name} <small class="dim">×${q}</small></span>
        <span class="sell-price">$${p} <small class="${up ? 'price-up' : 'price-down'}">${up ? '▲' : '▼'}</small></span>
        <button class="buy-btn" data-sell-one="${id}">SELL $${q * p}</button>
      </div>`;
    }).join('');
    $('sell-total').textContent = '$' + cropSellTotal().toLocaleString();
  }
}
function sellAll() {
  const total = cropSellTotal();
  if (total <= 0) return sfx.error();
  for (const id of CROP_IDS) state.produce[id] = 0;
  earn(total);
  sfx.cash();
  toast(`🏪 Sold the whole harvest for <b>$${total.toLocaleString()}</b>!`);
  renderSell(); updateHUD(); checkMilestones();
}
function sellOne(id) {
  const q = state.produce[id]; if (!q) return;
  const total = q * sellPrice(id);
  state.produce[id] = 0; earn(total);
  sfx.cash(); renderSell(); updateHUD(); checkMilestones();
}

/* ── contracts ── */
function renderContracts() {
  $('contracts-day').textContent = 'Day ' + state.day;
  const act = $('active-contracts');
  if (!state.activeContracts.length) act.innerHTML = `<div class="contract-empty">No active contracts.<br>Accept offers on the right →</div>`;
  else act.innerHTML = state.activeContracts.map(c => {
    const have = state.produce[c.crop], ok = have >= c.qty, daysLeft = c.deadline - state.day;
    return `<div class="contract-card">
      <div class="cc-client">🍽️ ${c.client}</div>
      <div class="cc-detail">${CROPS[c.crop].icon} <b>${c.qty}× ${CROPS[c.crop].name}</b> — reward <span class="cc-reward">$${c.reward.toLocaleString()}</span></div>
      <div class="cc-deadline">${daysLeft <= 0 ? '⚠️ Due TODAY' : `Due Day ${c.deadline} (${daysLeft}d left)`} · you have ${have}/${c.qty}</div>
      <div class="cc-actions"><button class="buy-btn" data-deliver="${c.id}" ${ok ? '' : 'disabled'}>🚚 DELIVER (${have}/${c.qty})</button></div>
    </div>`;
  }).join('');
  const off = $('offer-contracts');
  if (!state.offers.length) off.innerHTML = `<div class="contract-empty">No offers today. Check back tomorrow!</div>`;
  else off.innerHTML = state.offers.map(c => `
    <div class="contract-card">
      <div class="cc-client">📨 ${c.client}</div>
      <div class="cc-detail">${CROPS[c.crop].icon} <b>${c.qty}× ${CROPS[c.crop].name}</b> — reward <span class="cc-reward">$${c.reward.toLocaleString()}</span></div>
      <div class="cc-deadline">Deadline Day ${c.deadline}</div>
      <div class="cc-actions"><button class="buy-btn" data-accept="${c.id}" ${state.activeContracts.length >= 4 ? 'disabled' : ''}>✍️ ACCEPT</button></div>
    </div>`).join('');
}
function acceptOffer(id) {
  const i = state.offers.findIndex(o => o.id === id);
  if (i < 0 || state.activeContracts.length >= 4) return sfx.error();
  state.activeContracts.push(state.offers.splice(i, 1)[0]);
  sfx.click(); renderContracts(); updateHUD();
}
function deliverContract(id) {
  const i = state.activeContracts.findIndex(c => c.id === id);
  if (i < 0) return;
  const c = state.activeContracts[i];
  if (state.produce[c.crop] < c.qty) return sfx.error();
  state.produce[c.crop] -= c.qty;
  earn(c.reward);
  state.activeContracts.splice(i, 1);
  sfx.cash();
  toast(`🚚 Delivered to <b>${c.client}</b> — earned <b>$${c.reward.toLocaleString()}</b>!`);
  renderContracts(); updateHUD(); checkMilestones();
}

/* ═══════════ GAME FLOW ═══════════ */
function newGame(lock = true) {
  state = defaultState();
  for (const r of world.racks) { r.unlocked = r.index < 4; r.group.visible = r.unlocked; r.data = { crop: null, growth: 0, water: 80, nutr: 60, ph: 6.5, health: 100, pests: false, broken: false }; r.stageCache = -1; r.cropCache = null; refreshRackVisual(r, true); }
  applyUnlocks();
  playerPos.set(0, 1.66, 6.4); yaw = 0; pitch = 0;
  dayStatsReset();
  startPlaying(lock);
  toast('🌱 Welcome to Verdia Farms! Look at a rack and press <b>E</b> to plant.');
  setTimeout(() => screen === 'playing' && toast('💧 Crops need water, nutrients and balanced pH — check the rack panel.'), 2600);
  setTimeout(() => screen === 'playing' && toast('🏪 Press <b>B</b> for the shop · market stall is front-right · office is front-left.'), 5600);
}
function dayStatsReset() { state.dayStats = { earned: 0, spent: 0, harvested: 0 }; }

function startPlaying(lock = true) {
  screen = 'playing';
  $('title-screen').classList.add('hidden');
  $('pause-screen').classList.add('hidden');
  $('sleep-screen').classList.add('hidden');
  $('hud').classList.remove('hidden');
  updateHUD();
  if (lock) lockPointer();
}
function lockPointer() {
  try { renderer.domElement.requestPointerLock?.(); } catch (e) { /* headless */ }
}
function togglePause() {
  if (screen !== 'playing' && screen !== 'paused') return;
  if (screen === 'paused') {
    screen = 'playing';
    $('pause-screen').classList.add('hidden');
    lockPointer();
  } else {
    screen = 'paused';
    document.exitPointerLock?.();
    $('pause-screen').classList.remove('hidden');
  }
}
function sleep() {
  screen = 'sleep';
  modal = null;
  document.exitPointerLock?.();
  $('prompt').classList.add('hidden');
  $('rack-panel').classList.add('hidden');
  sfx.sleep();
  const cost = operatingCost();
  $('sleep-title').textContent = `🌙 Day ${state.day} Complete`;
  $('sleep-summary').innerHTML = `
    <div>💰 Revenue today: <b>$${state.dayStats.earned.toLocaleString()}</b></div>
    <div>💸 Expenses today: <b>$${state.dayStats.spent.toLocaleString()}</b></div>
    <div>🌾 Crops harvested: <b>${state.dayStats.harvested}</b></div>
    <div>🧾 Operating costs (power + water): <b>−$${cost}</b></div>`;
  $('btn-next-day').textContent = `☀️ START DAY ${state.day + 1}`;
  $('sleep-screen').classList.remove('hidden');
}
function nextDay() {
  // deduct operating costs
  const cost = operatingCost();
  state.cash -= cost;
  // expire contracts
  const expired = state.activeContracts.filter(c => c.deadline < state.day + 1);
  for (const c of expired) toast(`⌛ Contract with ${c.client} expired.`, 'bad');
  state.activeContracts = state.activeContracts.filter(c => c.deadline >= state.day + 1);
  // advance day
  state.day += 1;
  state.timeMin = DAY_START;
  state.prices = rollPrices();
  state.offers = rollContractOffers(state.day);
  dayStatsReset();
  // random events
  const plantedRacks = world.racks.filter(r => r.unlocked && r.data.crop && !r.data.pests);
  if (plantedRacks.length && Math.random() < 0.4) {
    const r = plantedRacks[Math.floor(Math.random() * plantedRacks.length)];
    r.data.pests = true; updateRackFlags(r);
    setTimeout(() => toast(`🐛 Aphids detected on <b>Rack ${r.index + 1}</b>! Spray with <b>X</b>.`, 'warn'), 900);
  }
  const anyRacks = world.racks.filter(r => r.unlocked && !r.data.broken);
  if (anyRacks.length && Math.random() < 0.16) {
    const r = anyRacks[Math.floor(Math.random() * anyRacks.length)];
    r.data.broken = true; updateRackFlags(r);
    setTimeout(() => toast(`⚡ Light fixture failed on <b>Rack ${r.index + 1}</b>! Repair with <b>E</b> ($15).`, 'warn'), 1600);
  }
  $('sleep-screen').classList.add('hidden');
  screen = 'playing';
  saveGame(false);
  updateHUD();
  lockPointer();
}

/* ═══════════ INTERACTIONS ═══════════ */
function findInteract() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(world.interactables, true);
  for (const hit of hits) {
    let o = hit.object;
    while (o && !o.userData.type) o = o.parent;
    if (!o) continue;
    const t = o.userData.type;
    if (t === 'rack') {
      const idx = o.userData.rackIndex ?? 0;
      const rack = world.racks.find(r => r.index === idx);
      if (!rack || !rack.unlocked) return null;
      return { type: 'rack', rack };
    }
    return { type: t };
  }
  return null;
}
function doInteract() {
  if (!currentInteract) return;
  const ci = currentInteract;
  if (ci.type === 'rack') {
    const d = ci.rack.data;
    if (d.broken) {
      if (state.cash < 15) return toast('Need $15 to repair.', 'bad'), sfx.error();
      spend(15); d.broken = false; updateRackFlags(ci.rack);
      sfx.build(); toast('🔧 Light fixture repaired.');
      updateHUD(); return;
    }
    if (!d.crop) {
      const sel = state.selectedSeed;
      if (state.seeds[sel] <= 0) { toast(`No ${CROPS[sel].name} seeds left — press <b>B</b> to buy.`, 'warn'); return sfx.error(); }
      state.seeds[sel]--;
      Object.assign(d, { crop: sel, growth: 3, water: Math.max(d.water, 75), nutr: Math.max(d.nutr, 55), health: 100, pests: false, ph: 6.5, readyNotified: false });
      refreshRackVisual(ci.rack, true);
      sfx.plant(); toast(`🌱 Planted ${CROPS[sel].name} in Rack ${ci.rack.index + 1}.`);
      updateHUD(); return;
    }
    if (d.growth >= 100) {
      const def = CROPS[d.crop];
      state.produce[d.crop] += def.yield;
      state.dayStats.harvested += def.yield;
      d.crop = null; d.growth = 0; d.pests = false; d.readyNotified = false;
      refreshRackVisual(ci.rack, true);
      sfx.harvest();
      toast(`🌾 Harvested <b>${def.yield}× ${def.name}</b>! Sell it at the stall.`);
      updateHUD(); return;
    }
    toast(`${CROPS[d.crop].name} is at ${Math.floor(d.growth)}% — keep caring for it!`);
    sfx.blip(); return;
  }
  if (ci.type === 'tank') { sfx.blip(); toast('💧 Water tank: full & filtered. pH of water feed: 6.8. All good.'); return; }
  if (ci.type === 'mixer') {
    if (state.cash < 25) { toast('Mixing costs $25 (nutrient salts + pH buffer).', 'bad'); return sfx.error(); }
    spend(25); state.nutrient += 2;
    sfx.dose(); toast('🧪 Mixed a fresh nutrient batch: <b>+2 units</b>.');
    updateHUD(); return;
  }
  if (ci.type === 'computer') return openModal('contracts');
  if (ci.type === 'stall') return openModal('sell');
}
function rackCare(action) {
  const r = currentInteract && currentInteract.type === 'rack' ? currentInteract.rack : null;
  if (!r) return;
  const d = r.data;
  if (action === 'water') {
    if (d.water >= 99.5) return;
    d.water = 100; sfx.water();
  } else if (action === 'dose') {
    if (state.nutrient <= 0) { toast('No nutrient units — mix at the station or buy in the shop (B).', 'warn'); return sfx.error(); }
    if (!d.crop) { toast('Nothing planted yet.', 'warn'); return; }
    state.nutrient--; d.nutr = Math.min(100, d.nutr + 45);
    sfx.dose();
  } else if (action === 'ph') {
    if (state.cash < 4) { toast('pH buffer costs $4.', 'bad'); return sfx.error(); }
    spend(4); d.ph = 6.5; sfx.click(); toast('⚗️ pH balanced to 6.5.');
    updateHUD();
  } else if (action === 'spray') {
    if (state.pesticide <= 0) { toast('No pesticide — buy some in the shop (B).', 'warn'); return sfx.error(); }
    if (!d.pests) { toast('No pests here. 🌿'); return; }
    state.pesticide--; d.pests = false; updateRackFlags(r);
    sfx.spray(); toast('🧴 Aphids eliminated.');
    updateHUD();
  }
  updateRackPanel();
}

/* ═══════════ INPUT ═══════════ */
function bindInput() {
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k === 'escape') { if (modal) closeModal(); else togglePause(); return; }
    if (k === 'm') { setMuted(!isMuted()); toast(isMuted() ? '🔇 Muted' : '🔊 Sound on'); return; }
    if (screen !== 'playing') return;
    if (k === 'b') { modal ? closeModal() : (sfx.click(), openModal('shop')); return; }
    if (modal) return;
    if (k === 'e') doInteract();
    else if (k === 'f') rackCare('water');
    else if (k === 'c') rackCare('dose');
    else if (k === 'v') rackCare('ph');
    else if (k === 'x') rackCare('spray');
    else if (['1','2','3','4','5'].includes(k)) { state.selectedSeed = CROP_IDS[+k - 1]; sfx.blip(); updateHUD(); }
  });
  document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== renderer.domElement) return;
    yaw -= e.movementX * 0.00235;
    pitch -= e.movementY * 0.0021;
    pitch = Math.max(-1.35, Math.min(1.35, pitch));
  });
  renderer.domElement.addEventListener('click', () => {
    if (screen === 'playing' && !modal && document.pointerLockElement !== renderer.domElement) lockPointer();
  });
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement !== renderer.domElement && screen === 'playing' && !modal) {
      screen = 'paused';
      $('pause-screen').classList.remove('hidden');
    }
  });
}

function bindUI() {
  $('btn-new-game').addEventListener('click', () => { sfx.success(); newGame(true); });
  $('btn-continue').addEventListener('click', () => { if (loadGame()) { sfx.success(); startPlaying(true); toast('💾 Save loaded. Welcome back!'); } });
  $('btn-howto').addEventListener('click', () => { sfx.click(); $('howto-modal').classList.remove('hidden'); });
  $('btn-howto-close').addEventListener('click', () => { sfx.click(); $('howto-modal').classList.add('hidden'); });
  $('btn-resume').addEventListener('click', () => togglePause());
  $('btn-save').addEventListener('click', () => saveGame(true));
  $('btn-pause-howto').addEventListener('click', () => $('howto-modal').classList.remove('hidden'));
  $('btn-quit-title').addEventListener('click', () => {
    saveGame(false);
    screen = 'title';
    $('pause-screen').classList.add('hidden');
    $('hud').classList.add('hidden');
    $('title-screen').classList.remove('hidden');
    $('btn-continue').style.visibility = localStorage.getItem(SAVE_KEY) ? 'visible' : 'hidden';
  });
  $('btn-next-day').addEventListener('click', () => nextDay());
  $('btn-shop-close').addEventListener('click', () => closeModal());
  $('btn-sell-close').addEventListener('click', () => closeModal());
  $('btn-contracts-close').addEventListener('click', () => closeModal());
  $('btn-sell-all').addEventListener('click', sellAll);

  // delegated clicks for dynamic content
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-buy-seed],[data-buy-seed5],[data-buy-pesticide],[data-buy-nutrient],[data-buy-upgrade],[data-sell-one],[data-accept],[data-deliver],[data-crop]');
    if (!t) return;
    if (t.dataset.buySeed) buySeed(t.dataset.buySeed, 1);
    else if (t.dataset.buySeed5) buySeed(t.dataset.buySeed5, 5);
    else if (t.dataset.buyPesticide) { if (state.cash >= 18) { spend(18); state.pesticide++; sfx.click(); renderShop(); updateHUD(); } else sfx.error(); }
    else if (t.dataset.buyNutrient) { if (state.cash >= 25) { spend(25); state.nutrient += 2; sfx.click(); renderShop(); updateHUD(); } else sfx.error(); }
    else if (t.dataset.buyUpgrade) buyUpgrade(t.dataset.buyUpgrade);
    else if (t.dataset.sellOne) sellOne(t.dataset.sellOne);
    else if (t.dataset.accept) acceptOffer(t.dataset.accept);
    else if (t.dataset.deliver) deliverContract(t.dataset.deliver);
    else if (t.dataset.crop) { state.selectedSeed = t.dataset.crop; sfx.blip(); updateHUD(); }
  });
  // hotbar built via innerHTML — delegate already handled above
}

/* ═══════════ UPDATE LOOP ═══════════ */
const TIME_SCALE = (DAY_END - DAY_START) / DAY_LEN; // game-minutes per real second
let hudTimer = 0, panelTimer = 0;

function update(dt) {
  if (screen !== 'playing' || modal) return;

  // clock
  state.timeMin += dt * TIME_SCALE;
  if (state.timeMin >= DAY_END) { state.timeMin = DAY_END; sleep(); return; }

  // movement
  const run = keys['shift'] ? 5.4 : 3.3;
  const fwd = (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
  const str = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
  if (fwd || str) {
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const dx = (-sin * fwd + cos * str), dz = (-cos * fwd - sin * str);
    const len = Math.hypot(dx, dz) || 1;
    playerPos.x += (dx / len) * run * dt;
    playerPos.z += (dz / len) * run * dt;
    // collide (circle vs AABB)
    const R = 0.34;
    for (const c of world.colliders) {
      const cx = Math.max(c.minX, Math.min(playerPos.x, c.maxX));
      const cz = Math.max(c.minZ, Math.min(playerPos.z, c.maxZ));
      const ddx = playerPos.x - cx, ddz = playerPos.z - cz;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 < R * R) {
        if (d2 === 0) { playerPos.x += R; continue; }
        const d = Math.sqrt(d2); playerPos.x += (ddx / d) * (R - d); playerPos.z += (ddz / d) * (R - d);
      }
    }
    playerPos.x = Math.max(-14.6, Math.min(14.6, playerPos.x));
    playerPos.z = Math.max(-8.6, Math.min(8.6, playerPos.z));
  }
  camera.position.copy(playerPos);
  camera.rotation.set(pitch, yaw, 0);
  // subtle head bob
  if (fwd || str) camera.position.y = playerPos.y + Math.sin(clock.elapsedTime * 9) * 0.035;

  // racks simulation
  for (const rack of world.racks) {
    if (!rack.unlocked) continue;
    const d = rack.data;
    if (!d.crop) continue;
    // drains
    const waterDrain = state.upgrades.autoWater ? 0.3 : 1.0;
    d.water = Math.max(0, d.water - 1.05 * waterDrain * dt);
    d.nutr = Math.max(0, d.nutr - 0.72 * dt);
    // auto systems
    if (state.upgrades.autoWater && d.water < 55) d.water = Math.min(100, d.water + 26 * dt);
    if (state.upgrades.autoDose && d.nutr < 60) d.nutr = Math.min(60, d.nutr + 7 * dt);
    // pH random walk + mild pull to alkaline
    d.ph += (Math.random() - 0.48) * 0.055 * dt * 2;
    d.ph = Math.max(5.3, Math.min(7.7, d.ph));
    const phOK = d.ph >= 5.9 && d.ph <= 7.0;
    // health
    let stressed = false;
    if (d.water <= 0) { d.health -= 2.5 * dt; stressed = true; }
    if (d.nutr <= 0) { d.health -= 1.5 * dt; stressed = true; }
    if (!phOK) d.health -= 1.1 * dt;
    if (d.pests) { d.health -= 2.1 * dt; stressed = true; }
    if (!stressed && phOK) d.health = Math.min(100, d.health + 1.9 * dt);
    // growth
    if (!d.broken && d.growth < 100) {
      const def = CROPS[d.crop];
      const rate = (100 / def.growTime) * ledBonus() * Math.max(0.3, d.health / 100) * (phOK ? 1 : 0.4);
      d.growth = Math.min(100, d.growth + rate * dt);
      if (d.growth >= 100 && !d.readyNotified) {
        d.readyNotified = true;
        sfx.blip();
        toast(`✅ <b>Rack ${rack.index + 1}</b>: ${CROPS[d.crop].name} is ready to harvest!`);
      }
    }
    // death
    if (d.health <= 0) {
      toast(`💀 Your ${CROPS[d.crop].name} on Rack ${rack.index + 1} died from neglect!`, 'bad');
      d.crop = null; d.growth = 0; d.health = 100; d.pests = false; d.readyNotified = false;
      sfx.error();
      refreshRackVisual(rack, true);
      continue;
    }
    refreshRackVisual(rack);
  }

  // daylight
  world.updateDaylight((state.timeMin - DAY_START) / (DAY_END - DAY_START));

  // interact raycast
  currentInteract = findInteract();
  updatePrompt();

  hudTimer += dt;
  if (hudTimer > 0.33) { hudTimer = 0; updateHUD(); }
  panelTimer += dt;
  if (panelTimer > 0.25) { panelTimer = 0; updateRackPanel(); }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (screen === 'title') {
    // slow interior orbit establishing shot behind the title
    const t = clock.elapsedTime * 0.14;
    camera.position.set(Math.sin(t) * 5.1, 2.05 + Math.sin(t * 0.6) * 0.25, Math.cos(t) * 5.1);
    camera.lookAt(Math.sin(t + 1.2) * 2, 1.1, Math.cos(t + 1.2) * 2);
    world.updateDaylight(0.55);
    renderer.render(scene, camera);
    return;
  }
  update(dt);
  // monitor flicker
  if (world.screenMat) world.screenMat.emissiveIntensity = 1.0 + Math.sin(clock.elapsedTime * 7.3) * 0.12 + Math.random() * 0.05;
  renderer.render(scene, camera);
}

/* debug / test hook (harmless in production) */
window.__hidro = {
  getState: () => state,
  world,
  teleport(x, z, y = 0) { playerPos.set(x, 1.66, z); yaw = y; },
  plant(i, id) { const r = world.racks[i]; Object.assign(r.data, { crop: id, growth: 3, water: 90, nutr: 70, health: 100, pests: false, broken: false, ph: 6.5 }); refreshRackVisual(r, true); },
  grow(i, g) { const r = world.racks[i]; r.data.growth = g; refreshRackVisual(r, true); },
  fillProduce(n) { for (const id of CROP_IDS) state.produce[id] = n; updateHUD(); },
  addCash(n) { state.cash += n; updateHUD(); checkMilestones(); },
};

/* boot */
init();
