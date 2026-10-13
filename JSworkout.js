const $ = s => document.querySelector(s);
const root = document.documentElement;
const store = {
  get(k, d) { try { return localStorage.getItem(k) || d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} }
};

/* ---------- Theme & style ---------- */
function applyTheme(t) { root.dataset.theme = t; $('#themeBtn').textContent = t === 'dark' ? '🌙' : '☀️'; store.set('theme', t); }
applyTheme(store.get('theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
$('#themeBtn').onclick = () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
root.dataset.style = store.get('style', 'ocean'); $('#styleSel').value = root.dataset.style;
$('#styleSel').onchange = e => { root.dataset.style = e.target.value; store.set('style', e.target.value); };

/* ---------- Calculator ---------- */
let user = { weight: 70, cat: 'all' };
const catOf = b => b < 18.5 ? 'under' : b < 25 ? 'normal' : b < 30 ? 'over' : 'obese';
const catName = { under: 'Underweight', normal: 'Normal', over: 'Overweight', obese: 'Obese' };

$('#calcForm').onsubmit = e => {
  e.preventDefault();
  const a = +$('#age').value, h = +$('#height').value, w = +$('#weight').value;
  const bmi = w / (h / 100) ** 2;
  const bmr = 10 * w + 6.25 * h - 5 * a + ($('#sex').value === 'm' ? 5 : -161); // Mifflin-St Jeor
  const tdee = bmr * +$('#activity').value;
  const target = Math.max(1200, tdee + +$('#goal').value);
  const protein = w * 1.8, fat = target * 0.25 / 9, carbs = (target - protein * 4 - fat * 9) / 4;
  user = { weight: w, cat: catOf(bmi) };
  const box = (v, l) => `<div class="res"><b>${v}</b><span>${l}</span></div>`;
  $('#results').hidden = false;
  $('#results').innerHTML = box(bmi.toFixed(1), 'BMI') + box(catName[user.cat], 'Category') + box(Math.round(bmr), 'BMR kcal') +
    box(Math.round(tdee), 'Maintenance kcal') + box(Math.round(target), 'Daily target kcal') +
    box(Math.round(protein) + 'g', 'Protein') + box(Math.round(carbs) + 'g', 'Carbs') + box(Math.round(fat) + 'g', 'Fat');
  $('#catSel').value = user.cat; renderRoutines();
  $('#workouts').scrollIntoView({ behavior: 'smooth' });
};

/* ---------- 120 routines: 4 BMI groups x 30 themes ---------- */
const POOLS = {
  under: ['Goblet Squat', 'Push-Up', 'Dumbbell Row', 'Romanian Deadlift', 'Overhead Press', 'Walking Lunge', 'Glute Bridge', 'Plank', 'Inverted Row', 'Bench Dip', "Farmer's Carry", 'Step-Up', 'Bicep Curl', 'Calf Raise'],
  normal: ['Burpee', 'Jump Squat', 'Mountain Climber', 'Push-Up', 'Pull-Up', 'Kettlebell Swing', 'Lunge', 'Plank', 'Bicycle Crunch', 'High Knees', 'Dip', 'Deadlift', 'Russian Twist', 'Box Jump'],
  over: ['Brisk March', 'Bodyweight Squat', 'Incline Push-Up', 'Step Touch', 'Glute Bridge', 'Bird Dog', 'Wall Sit', 'Standing Knee Raise', 'Dumbbell Row', 'Side Lunge', 'Low-Impact Jacks', 'Plank (knees)', 'Shadow Boxing', 'Stationary Bike'],
  obese: ['Chair Squat', 'Wall Push-Up', 'Seated March', 'Seated Leg Raise', 'Standing Marching', 'Arm Circles', 'Band Row', 'Standing Side Bend', 'Glute Squeeze', 'Heel Raise', 'Seated Torso Twist', 'Slow Walk', 'Water Walking', 'Supported Step']
};
const THEMES = `Full-Body Starter|Strength|3 x 10|60;Upper Power|Strength|4 x 8|75;Lower Burn|Strength|4 x 12|60;Core Crusher|Core|3 x 45s|30;HIIT Blast|HIIT|40s on / 20s off x 4|20;Cardio Flow|Cardio|3 x 3 min|30;Mobility Reset|Mobility|2 x 12|20;Endurance Circuit|Circuit|4 rounds x 12|30;Fat-Burn Ladder|HIIT|ladder 10-8-6-4|30;Morning Wake-Up|Mobility|2 x 10|15;Strength Pyramid|Strength|5-8-10-8-5|60;Tabata Twist|HIIT|20s on / 10s off x 8|10;Posture Fixer|Mobility|3 x 12|20;Power Hour|Circuit|5 rounds x 10|45;Lazy-Day Light|Cardio|2 x 15|30;EMOM Engine|HIIT|every min x 10|0;Glute Builder|Strength|4 x 15|45;Back & Biceps|Strength|4 x 10|60;Chest & Triceps|Strength|4 x 10|60;Shoulder Shaper|Strength|3 x 12|45;Total Core 2.0|Core|4 x 30s|20;Steady Burner|Cardio|3 x 5 min|30;Metabolic Mix|Circuit|3 rounds x 15|30;Balance & Control|Mobility|3 x 10 each side|20;AMRAP 15|HIIT|max rounds in 15 min|0;Slow Burn|Strength|3 x 15 tempo 3-1-3|45;Cool-Down Stretch|Mobility|2 x 30s hold|10;Weekend Warrior|Circuit|6 rounds x 8|40;Sweat Starter|Cardio|4 x 2 min|30;Legs & Lungs|HIIT|30s on / 30s off x 6|30`.split(';').map(s => s.split('|'));
const MET = { Strength: 5, Core: 4, HIIT: 8, Cardio: 6, Mobility: 2.5, Circuit: 6.5 };
const LEVEL = ['Beginner', 'Intermediate', 'Advanced'];
const FOCUS = { under: 'Build muscle & mass', normal: 'Performance & tone', over: 'Low-impact fat loss', obese: 'Gentle, joint-friendly start' };

const ROUTINES = [];
Object.keys(POOLS).forEach(cat => THEMES.forEach(([name, type, scheme, rest], t) => {
  const pool = POOLS[cat];
  const moves = [0, 1, 2, 3, 4].map(k => pool[(t * 5 + k * 3) % pool.length]);
  const lvl = cat === 'obese' ? 0 : cat === 'over' ? t % 2 : t % 3;
  ROUTINES.push({
    id: ROUTINES.length + 1, cat, type, name: `${name} (${catName[cat]})`, level: LEVEL[lvl], scheme, rest,
    mins: 15 + (t % 6) * 5 + lvl * 5, moves, focus: FOCUS[cat]
  });
}));

const types = [...new Set(THEMES.map(t => t[1]))];
$('#typeSel').innerHTML += types.map(t => `<option>${t}</option>`).join('');

function renderRoutines() {
  const c = $('#catSel').value, ty = $('#typeSel').value, q = $('#search').value.toLowerCase();
  const list = ROUTINES.filter(r => (c === 'all' || r.cat === c) && (ty === 'all' || r.type === ty) &&
    (r.name + r.moves.join(' ')).toLowerCase().includes(q));
  $('#count').textContent = `(${list.length} of ${ROUTINES.length})`;
  $('#routines').innerHTML = list.map(r => {
    const kcal = Math.round(MET[r.type] * user.weight * r.mins / 60);
    return `<details><summary>#${r.id} ${r.name}</summary>
      <span class="tag">${r.type}</span><span class="tag">${r.level}</span><span class="tag">${r.mins} min</span><span class="tag">~${kcal} kcal</span>
      <p class="hint">${r.focus}</p>
      <ol>${r.moves.map(m => `<li>${m} — ${r.scheme}</li>`).join('')}</ol>
      <p class="hint">Rest: ${r.rest}s between sets · Warm up 5 min first.</p></details>`;
  }).join('') || '<p class="hint">No routines match.</p>';
}
['catSel', 'typeSel'].forEach(i => $('#' + i).onchange = renderRoutines);
$('#search').oninput = renderRoutines;
renderRoutines();

/* ---------- Map & GPS tracker ---------- */
const map = L.map('map').setView([15.3, 120.9], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
const track = L.polyline([], { color: '#f43f5e', weight: 5 }).addTo(map);
const planned = L.polyline([], { color: '#3b82f6', weight: 4, dashArray: '8 8' }).addTo(map);
let me, watchId, pts = [], dist = 0, secs = 0, timer, planning = false, plan = [];

const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
const km = (a, b) => { // haversine
  const R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
function updateStats() {
  $('#sDist').textContent = dist.toFixed(2); $('#sTime').textContent = fmt(secs);
  $('#sPace').textContent = dist > 0.02 ? (() => { const p = secs / 60 / dist; return Math.floor(p) + ':' + String(Math.round(p % 1 * 60)).padStart(2, '0'); })() : '--';
  $('#sCal').textContent = Math.round(+$('#mode').value * user.weight * secs / 3600);
}
function onPos(p) {
  if (p.coords.accuracy > 50) { $('#mapMsg').textContent = 'Waiting for a better GPS signal…'; return; }
  const pt = { lat: p.coords.latitude, lng: p.coords.longitude };
  if (pts.length) { const d = km(pts[pts.length - 1], pt); if (d < 0.003) return; dist += d; }
  pts.push(pt); track.addLatLng(pt);
  me ? me.setLatLng(pt) : me = L.circleMarker(pt, { radius: 8, color: '#fff', fillColor: '#3b82f6', fillOpacity: 1 }).addTo(map);
  map.setView(pt, 17); $('#mapMsg').textContent = 'Tracking… keep going! 🔥'; updateStats();
}
$('#startBtn').onclick = () => {
  if (!navigator.geolocation) return $('#mapMsg').textContent = 'Geolocation is not supported on this device.';
  watchId = navigator.geolocation.watchPosition(onPos, e => $('#mapMsg').textContent = 'Location error: ' + e.message, { enableHighAccuracy: true });
  timer = setInterval(() => { secs++; updateStats(); }, 1000);
  $('#startBtn').disabled = true; $('#stopBtn').disabled = false;
};
function pause() { navigator.geolocation.clearWatch(watchId); clearInterval(timer); $('#startBtn').disabled = false; $('#stopBtn').disabled = true; $('#mapMsg').textContent = 'Paused.'; }
$('#stopBtn').onclick = pause;
$('#resetBtn').onclick = () => {
  if (!$('#stopBtn').disabled) pause();
  pts = []; dist = 0; secs = 0; track.setLatLngs([]); plan = []; planned.setLatLngs([]); updateStats(); $('#mapMsg').textContent = 'Reset.';
};
$('#mode').onchange = updateStats;
$('#planBtn').onclick = e => {
  planning = !planning; e.target.textContent = 'Plan route: ' + (planning ? 'ON' : 'OFF'); e.target.classList.toggle('on', planning);
};
map.on('click', e => {
  if (!planning) return;
  plan.push({ lat: e.latlng.lat, lng: e.latlng.lng }); planned.setLatLngs(plan);
  const d = plan.slice(1).reduce((s, p, i) => s + km(plan[i], p), 0);
  const mins = Math.round(d / ({ 3.5: 5, 7: 9, 9.8: 12 }[$('#mode').value] || 5) * 60);
  $('#mapMsg').textContent = `Planned: ${d.toFixed(2)} km · ~${Math.round(d * 60 / ({ 3.5: 5, 7: 9, 9.8: 12 }[$('#mode').value]))} min · ~${Math.round(+$('#mode').value * user.weight * d / ({ 3.5: 5, 7: 9, 9.8: 12 }[$('#mode').value]))} kcal`;
});
navigator.geolocation && navigator.geolocation.getCurrentPosition(p => map.setView([p.coords.latitude, p.coords.longitude], 15), () => {});