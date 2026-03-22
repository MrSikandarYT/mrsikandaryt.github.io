// LocalStorage keys
const STORAGE = { username:'mcUsername', streak:'dailyStreak', lastClaim:'lastDailyClaim', spins:'spinsLeft', lastSword:'lastSwordWin' };

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
let rotation = 0, spinning = false;

const segments = [
  {text:"1 Hit Sword (1 use)", color:"#ff0000", weight:5},
  {text:"Try Again", color:"#666", weight:20},
  {text:"500k Money", color:"#00ff00", weight:25},
  {text:"Try Again", color:"#666", weight:15},
  {text:"5 Million!", color:"#ffd700", weight:8},
  {text:"3 Try Again", color:"#666", weight:12},
  {text:"100k Money", color:"#00ff00", weight:20},
  {text:"Try Again", color:"#666", weight:15}
];

function drawWheel(rot=0) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const step = Math.PI*2 / segments.length;
  for (let i=0; i<segments.length; i++) {
    ctx.beginPath();
    ctx.arc(160,160,150, i*step+rot, (i+1)*step+rot);
    ctx.fillStyle = segments[i].color;
    ctx.fill();
    ctx.strokeStyle="#000"; ctx.lineWidth=6; ctx.stroke();
  }
}

function getPrize() {
  let r = Math.random()*segments.reduce((a,s)=>a+s.weight,0);
  let sum=0;
  for (let s of segments) {
    sum += s.weight;
    if (r <= sum) return s;
  }
}

function startSpin() {
  const user = document.getElementById('username').value.trim();
  if (!user) return alert("Enter username first!");
  
  let spins = parseInt(localStorage.getItem(STORAGE.spins)) || 0;
  if (spins <= 0) return alert("No spins left! Claim daily first.");

  spinning = true;
  const btn = document.getElementById('spinBtn');
  btn.disabled = true; btn.textContent = "SPINNING..."; btn.style.background="#555";

  localStorage.setItem(STORAGE.spins, spins-1);
  updateSpinsDisplay();

  const prize = getPrize();
  const targetAngle = (segments.indexOf(prize) * (Math.PI*2/8)) + (Math.PI/8);

  const startTime = Date.now();
  const duration = 6500 + Math.random()*1500; // 6.5-8 sec
  const startRot = rotation;
  const totalRot = startRot + (6 + Math.random()*2)*Math.PI*2 + targetAngle;

  function animate() {
    const progress = Math.min((Date.now()-startTime)/duration, 1);
    const eased = 1 - Math.pow(1-progress, 4);
    rotation = startRot + eased * (totalRot - startRot);
    drawWheel(rotation);
    if (progress < 1) requestAnimationFrame(animate);
    else {
      spinning = false;
      btn.disabled = false; btn.textContent="SPIN NOW"; btn.style.background="#00ff41";
      document.getElementById('spin-result').innerHTML = `🎉 YOU GOT: <strong>${prize.text}</strong>!`;
      if (prize.text.includes("Million") || prize.text.includes("Sword")) confettiBurst();
    }
  }
  animate();
}

function confettiBurst() { /* simple confetti */ for(let i=0;i<80;i++){ setTimeout(()=>{ const c=document.createElement('div'); c.style.cssText=`position:fixed;left:${Math.random()*100}vw;top:-20px;width:10px;height:10px;background:${['#00ff41','#ffd700','#ff0000'][Math.random()*3|0]};z-index:9999;`; document.body.appendChild(c); let y=-20; const fall=setInterval(()=>{y+=10; c.style.top=y+'px'; if(y>window.innerHeight){clearInterval(fall);c.remove();}},16); },i*4); }}

function claimDaily() {
  const user = document.getElementById('username').value.trim();
  if (!user) return alert("Enter username first!");
  
  const now = new Date();
  const last = localStorage.getItem(STORAGE.lastClaim);
  let streak = parseInt(localStorage.getItem(STORAGE.streak)) || 0;

  if (last && new Date(last).toDateString() === now.toDateString()) {
    return alert("You already claimed today!");
  }

  if (last && (now - new Date(last)) / 86400000 > 1) streak = 1;
  else streak++;

  localStorage.setItem(STORAGE.streak, streak);
  localStorage.setItem(STORAGE.lastClaim, now.toISOString());

  const day = ((streak-1)%7)+1;
  let msg = "", spinsAdd = 0;
  if(day===1) msg="10k Money";
  else if(day===2) msg="50k Money";
  else if(day===3) msg="Netherite Armour";
  else if(day===4) msg="1 Heart + 100k";
  else if(day===5){ msg="1 Spin Ticket"; spinsAdd=1; }
  else if(day===6){ msg="2 Spin Tickets"; spinsAdd=2; }
  else if(day===7){ msg="1 Million + 2 Spins"; spinsAdd=2; }

  let spins = (parseInt(localStorage.getItem(STORAGE.spins))||0) + spinsAdd;
  localStorage.setItem(STORAGE.spins, spins);

  alert(`Day ${streak} Reward: ${msg}\nSpins added: ${spinsAdd}`);
  updateStreakDisplay();
  updateSpinsDisplay();
}

function updateStreakDisplay() { document.getElementById('streak-day').textContent = localStorage.getItem(STORAGE.streak)||0; }
function updateSpinsDisplay() { document.getElementById('spins-count').textContent = localStorage.getItem(STORAGE.spins)||0; }

function showPage(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
}

document.getElementById('hamburger').addEventListener('click', ()=>{ document.getElementById('sidebar').classList.toggle('open'); });

function init() {
  drawWheel();
  document.getElementById('spinBtn').addEventListener('click', startSpin);
  document.getElementById('dailyBtn').addEventListener('click', claimDaily);
  document.getElementById('username').value = localStorage.getItem(STORAGE.username)||'';
  document.getElementById('username').addEventListener('input', e=> localStorage.setItem(STORAGE.username, e.target.value.trim()));
  updateStreakDisplay(); updateSpinsDisplay();
  showPage('home');
}
window.onload = init;
