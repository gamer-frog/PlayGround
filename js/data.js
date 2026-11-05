// Game data: crops, milestones, clients, contracts, upgrades.

export const CROPS = {
  lettuce:    { name: 'Lettuce',    icon: '🥬', seedCost: 8,  sell: 22, growTime: 70,  yield: 6, color: 0x86efac, dark: 0x16a34a, shape: 'leafy' },
  kale:       { name: 'Kale',       icon: '🥦', seedCost: 15, sell: 40, growTime: 100, yield: 6, color: 0x4ade80, dark: 0x166534, shape: 'leafy' },
  basil:      { name: 'Basil',      icon: '🌿', seedCost: 12, sell: 32, growTime: 90,  yield: 5, color: 0x22c55e, dark: 0x15803d, shape: 'bush'  },
  tomato:     { name: 'Tomato',     icon: '🍅', seedCost: 20, sell: 55, growTime: 135, yield: 4, color: 0x4ade80, dark: 0x166534, shape: 'fruit', fruit: 0xef4444 },
  strawberry: { name: 'Strawberry', icon: '🍓', seedCost: 30, sell: 85, growTime: 165, yield: 4, color: 0x86efac, dark: 0x16a34a, shape: 'fruit', fruit: 0xf43f5e },
};

export const CROP_IDS = Object.keys(CROPS);

export const CLIENTS = [
  "Bella's Bistro", 'Verde Cocina', 'The Daily Salad', 'Mercado Sano',
  'Green Fork Café', 'Casa Verde Catering', 'La Huerta Kitchen', 'Fresh Roots Deli',
];

export const MILESTONES = [
  { worth: 2000,  name: 'Greenhouse Graduate', reward: 150 },
  { worth: 5000,  name: 'Hydro Hero',          reward: 400 },
  { worth: 10000, name: 'Farm Magnate',        reward: 800 },
  { worth: 25000, name: 'HYDRO TYCOON',        reward: 2000 },
];

export const UPGRADES = [
  { id: 'racks2',  name: 'Expansion Racks (Row B)', desc: 'Install 2 more grow racks in the front row.', cost: 650,  icon: '🗄️', once: true },
  { id: 'racks4',  name: 'Expansion Racks (Row C)', desc: 'Install the final 2 grow racks. Full 8-rack farm!', cost: 1400, icon: '🏗️', once: true, needs: 'racks2' },
  { id: 'led1',    name: 'LED Spectrum Lv.1',       desc: '+25% crop growth speed on every rack.', cost: 400,  icon: '💡', once: true },
  { id: 'led2',    name: 'LED Spectrum Lv.2',       desc: '+50% crop growth speed (replaces Lv.1).', cost: 900,  icon: '🔆', once: true, needs: 'led1' },
  { id: 'autoWater', name: 'Auto-Watering Drippers', desc: 'Racks never dry out — water auto-refills.', cost: 550, icon: '🚿', once: true },
  { id: 'autoDose',  name: 'Auto-Nutrient Doser',   desc: 'Nutrients slowly auto-dose up to 60 on every rack.', cost: 750, icon: '🤖', once: true },
  { id: 'market',  name: 'Premium Market Contract', desc: '+15% on every produce sale at the stall.', cost: 800,  icon: '🤝', once: true },
  { id: 'solar',   name: 'Solar Panel Array',       desc: 'Operating costs halved ($45 → $22 per day).', cost: 1500, icon: '☀️', once: true },
];

export function rollPrices() {
  // Each crop sells at 0.78–1.32 × base, rolled daily.
  const prices = {};
  for (const id of CROP_IDS) {
    prices[id] = Math.round(CROPS[id].sell * (0.78 + Math.random() * 0.54));
  }
  return prices;
}

export function rollContractOffers(day) {
  const offers = [];
  const used = new Set();
  for (let i = 0; i < 3; i++) {
    let crop = CROP_IDS[Math.floor(Math.random() * CROP_IDS.length)];
    if (used.has(crop)) crop = CROP_IDS[(CROP_IDS.indexOf(crop) + 1 + i) % CROP_IDS.length];
    used.add(crop);
    const qty = 3 + Math.floor(Math.random() * 6) + Math.floor(day / 3);
    const reward = Math.round(CROPS[crop].sell * qty * (1.4 + Math.random() * 0.35));
    const client = CLIENTS[Math.floor(Math.random() * CLIENTS.length)];
    offers.push({
      id: `c${day}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      client, crop, qty, reward,
      deadline: day + 2 + Math.floor(Math.random() * 3),
    });
  }
  return offers;
}

export function netWorth(state, racks = []) {
  let w = state.cash;
  for (const id of CROP_IDS) {
    w += state.produce[id] * state.prices[id];
    w += state.seeds[id] * CROPS[id].seedCost;
  }
  w += state.nutrient * 12 + state.pesticide * 18;
  // immature crops are worth something too
  for (const r of racks) {
    if (r.data.crop) w += Math.round((r.data.growth / 100) * CROPS[r.data.crop].sell * CROPS[r.data.crop].yield * 0.5);
  }
  return Math.round(w);
}
