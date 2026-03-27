// ──────────────────────────────────────────────
// STORAGE KEYS
// ──────────────────────────────────────────────
const STORAGE = {
  username: 'mcUsername',
  streak: 'dailyStreak',
  lastClaim: 'lastDailyClaim',
  lastSpin: 'lastSpinDate',
  bonusSpinsToday: 'bonusSpinsToday'
};

// ──────────────────────────────────────────────
// YOUR NODE.JS BACKEND
// ──────────────────────────────────────────────
const NODEJS_URL = "https://990bcd1e-2e9d-4b31-95ae-d02835f0239c-00-1qirfplstlop.pike.replit.dev";
const API_KEY = "Sikandar123";

// Send reward to Node.js + Discord
async function sendRewardToBot(username, reward) {
  try {
    const response = await fetch(`${NODEJS_URL}/reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, reward: reward, key: API_KEY })
    });
    const data = await response.json();
    if (data.success) console.log(`✅ Reward sent: ${reward} for ${username}`);
    else console.error("Server error:", data.message);
  } catch (err) {
    console.error("Cannot connect to reward server", err);
  }
}

// Wheel Setup
const canvas = document.getElementById('wheel');
const ctx = canvas?.getContext('2d');
let rotation = 0;
let spinning = false;

const segments = [
  { text: "1 Hit Sword (1 use)", color: "#ff0000", weight: 5 },
  { text: "Try Again", color: "#666666", weight: 20 },
  { text: "500k Money", color: "#00ff00", weight: 25 },
  { text: "Try Again", color: "#666666", weight: 15 },
  { text: "5 Million!", color: "#ffd700", weight: 8 },
  { text: "3 Try Again", color: "#666666", weight: 12 },
  { text: "100k Money", color: "#00ff00", weight: 20 },
  { text: "Try Again", color: "#666666", weight: 15 }
];

function drawWheel(rot = 0) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = 145;
  const step = (Math.PI * 2) / segments.length;

  for (let i = 0; i < segments.length; i++) {
    const start = i * step + rot;
    const end = (i + 1) * step + rot;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = segments[i].color;
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.stroke();

    const mid = start + step / 2;
    const tx = cx + Math.cos(mid) * (radius * 0.68);
    const ty = cy + Math.sin(mid) * (radius * 0.68);
    ctx.save();
    ctx.translate(tx, ty);
    let rotText = mid + Math.PI / 2;
    if (rotText > Math.PI / 2 && rotText < Math.PI * 1.5) {
      rotText += Math.PI;
      ctx.scale(-1, -1);
    }
    ctx.rotate(rotText);
    ctx.font = "bold 10px Arial Black, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(segments[i].text, 0, 0);
    ctx.fillText(segments[i].text, 0, 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
  ctx.strokeStyle = "#00ff41";
  ctx.lineWidth = 14;
  ctx.stroke();
}

// Helpers
function getToday() { return new Date().toISOString().split('T')[0]; }
function isNewDay(last) { return !last || getToday() !== last; }

function resetIfNewDay() {
  const today = getToday();
  const lastClaim = localStorage.getItem(STORAGE.lastClaim);
  if (isNewDay(lastClaim)) {
    let streak = parseInt(localStorage.getItem(STORAGE.streak)) || 0;
    if (lastClaim && (new Date() - new Date(lastClaim)) > 86400000 * 1.2) streak = 0;
    localStorage.setItem(STORAGE.streak, streak);
    localStorage.setItem(STORAGE.bonusSpinsToday, '0');
  }
}

function getAvailableSpins() {
  resetIfNewDay();
  const bonus = parseInt(localStorage.getItem(STORAGE.bonusSpinsToday)) || 0;
  const lastSpin = localStorage.getItem(STORAGE.lastSpin);
  const daily = isNewDay(lastSpin) ? 1 : 0;
  return bonus + daily;
}

function consumeSpin() {
  resetIfNewDay();
  let bonus = parseInt(localStorage.getItem(STORAGE.bonusSpinsToday)) || 0;
  if (bonus > 0) localStorage.setItem(STORAGE.bonusSpinsToday, bonus - 1);
  else localStorage.setItem(STORAGE.lastSpin, getToday());
}

function getPrize() {
  let total = segments.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  let sum = 0;
  for (let s of segments) {
    sum += s.weight;
    if (r <= sum) return s;
  }
  return segments[0];
}

// Spin Function
async function startSpin() {
  const username = document.getElementById('username').value.trim();
  if (!username) return alert("Enter Minecraft username first!");

  const avail = getAvailableSpins();
  if (avail <= 0) return alert("No spins left today!");

  spinning = true;
  const btn = document.getElementById('spinBtn');
  btn.disabled = true;
  btn.textContent = "SPINNING...";

  consumeSpin();
  updateSpinsDisplay();

  const prize = getPrize();
  const idx = segments.findIndex(s => s.text === prize.text && s.color === prize.color);
  const segAngle = (Math.PI * 2) / segments.length;
  const target = - (idx * segAngle + segAngle / 2) + Math.PI;
  const duration = 6800 + Math.random() * 1200;
  const startTime = Date.now();
  const startRot = rotation;
  const extra = (6 + Math.random() * 2) * Math.PI * 2;
  const total = extra + target;

  function animate() {
    const elapsed = Date.now() - startTime;
    const p = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3.5);
    rotation = startRot + ease * total;
    drawWheel(rotation);

    if (p < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      btn.disabled = false;
      btn.textContent = "SPIN NOW";

      document.getElementById('spin-result').innerHTML = `🎉 YOU GOT: <strong>${prize.text}</strong>!`;
      sendRewardToBot(username, prize.text);

      if (prize.text.includes("Million") || prize.text.includes("Sword")) confettiBurst();
    }
  }
  animate();
}

// Daily Claim
async function claimDaily() {
  const username = document.getElementById('username').value.trim();
  if (!username) return alert("Enter Minecraft username first!");

  resetIfNewDay();
  const today = getToday();
  const last = localStorage.getItem(STORAGE.lastClaim);
  if (last === today) return alert("You already claimed today!");

  let streak = parseInt(localStorage.getItem(STORAGE.streak)) || 0;
  streak++;
  localStorage.setItem(STORAGE.streak, streak);
  localStorage.setItem(STORAGE.lastClaim, today);

  const day = ((streak - 1) % 7) + 1;
  let rewardText = "", addSpins = 0;

  if (day === 1) rewardText = "10k Money";
  else if (day === 2) rewardText = "50k Money";
  else if (day === 3) rewardText = "Netherite Armour";
  else if (day === 4) rewardText = "1 Heart + 100k";
  else if (day === 5) { rewardText = "Daily Bonus Spin"; addSpins = 1; }
  else if (day === 6) { rewardText = "Daily Bonus Spins"; addSpins = 2; }
  else if (day === 7) { rewardText = "1 Million + 2 Spins"; addSpins = 2; }

  if (addSpins > 0) {
    let cur = parseInt(localStorage.getItem(STORAGE.bonusSpinsToday)) || 0;
    localStorage.setItem(STORAGE.bonusSpinsToday, cur + addSpins);
  }

  alert(`✅ Day ${streak} Claimed!\n${rewardText}\nSpins added: ${addSpins}`);

  if (rewardText) await sendRewardToBot(username, rewardText);

  updateStreakDisplay();
  updateSpinsDisplay();
}

// UI Functions
function updateStreakDisplay() {
  document.getElementById('streak-day').textContent = localStorage.getItem(STORAGE.streak) || 0;
}
function updateSpinsDisplay() {
  document.getElementById('spins-count').textContent = getAvailableSpins();
}

// Tab System (combined with your original)
function showTab(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (el) el.classList.add('active');

  if (name === 'rewards') {
    if (canvas) drawWheel(0);
    updateStreakDisplay();
    updateSpinsDisplay();
  }
}

// Original functions (copy from your old script.js)
function openDiscord() { window.open('https://discord.gg/yourinvite', '_blank'); }
function copyIP() {
  navigator.clipboard.writeText('fakelapataop.aternos.me:43833');
  showToast('✅ IP Copied!');
}

// Toast
function showToast(msg) {
  const t = document.getElementById('toast') || document.createElement('div');
  t.id = 'toast';
  t.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--surface);border:2px solid var(--green);color:var(--green);padding:12px 20px;font-family:"Press Start 2P",monospace;z-index:9999;';
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// Confetti
function confettiBurst() {
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const conf = document.createElement('div');
      conf.style.cssText = `position:fixed;left:${Math.random()*100}vw;top:-20px;width:10px;height:10px;background:${['#00ff41','#ffd700','#ff0000'][Math.floor(Math.random()*3)]};z-index:9999;pointer-events:none;`;
      document.body.appendChild(conf);
      let y = -20;
      const anim = setInterval(() => {
        y += 12;
        conf.style.top = y + 'px';
        if (y > window.innerHeight + 50) { clearInterval(anim); conf.remove(); }
      }, 16);
    }, i * 5);
  }
}

// Init
window.addEventListener('load', () => {
  if (canvas) drawWheel(0);
  document.getElementById('spinBtn').addEventListener('click', startSpin);
  document.getElementById('dailyBtn').addEventListener('click', claimDaily);

  const uname = document.getElementById('username');
  if (uname) {
    uname.value = localStorage.getItem(STORAGE.username) || '';
    uname.addEventListener('input', e => localStorage.setItem(STORAGE.username, e.target.value.trim()));
  }

  // For testing
  // document.getElementById('testResetBtn')?.addEventListener('click', () => { ... });
});
