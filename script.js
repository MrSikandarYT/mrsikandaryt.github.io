// ==================== STORAGE KEYS ====================
const STORAGE = {
  username: 'mcUsername',
  streak: 'dailyStreak',
  lastClaim: 'lastDailyClaim',
  lastSpin: 'lastSpinDate',
  bonusSpinsToday: 'bonusSpinsToday'
};

// ==================== BACKEND CONFIG ====================
const NODEJS_URL = "https://0088e729-ea11-43c8-a211-4a55e01e432a-00-358d41x6y5xji.sisko.replit.dev"; // Correct URL
const API_KEY = "Sikandar123";

// ==================== SEND REWARD ====================
async function sendRewardToBot(username, reward) {
  if (!reward.toLowerCase().includes("try again")) {
    try {
      const response = await fetch(`${NODEJS_URL}/reward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, reward, key: API_KEY })
      });
      const data = await response.json();
      if (data.success) console.log(`✅ Reward sent: ${reward} for ${username}`);
      else console.error("Server error:", data.message);
    } catch (err) {
      console.error("Cannot connect to reward server", err);
    }
  }
}

// ==================== WHEEL ====================
const canvas = document.getElementById('wheel');
const ctx = canvas?.getContext('2d');
let rotation = 0, spinning = false;

const segments = [
  { text: "1 Hit Sword (1 use)", color: "#ff0000", weight: 5 },
  { text: "Try Again", color: "#666", weight: 20 },
  { text: "500k Money", color: "#0f0", weight: 25 },
  { text: "Try Again", color: "#666", weight: 15 },
  { text: "5 Million!", color: "#ffd700", weight: 8 },
  { text: "3 Try Again", color: "#666", weight: 12 },
  { text: "100k Money", color: "#0f0", weight: 20 },
  { text: "Try Again", color: "#666", weight: 15 }
];

function drawWheel(rot = 0) {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width/2, cy = canvas.height/2, radius = 145;
  const step = (Math.PI*2)/segments.length;
  for (let i=0;i<segments.length;i++){
    const start=i*step+rot, end=(i+1)*step+rot;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,radius,start,end);
    ctx.closePath();
    ctx.fillStyle=segments[i].color;
    ctx.fill();
    ctx.strokeStyle="#000"; ctx.lineWidth=4; ctx.stroke();
    const mid=start+step/2, tx=cx+Math.cos(mid)*radius*0.68, ty=cy+Math.sin(mid)*radius*0.68;
    ctx.save();
    ctx.translate(tx,ty);
    let rotText=mid+Math.PI/2;
    if(rotText>Math.PI/2 && rotText<Math.PI*1.5){rotText+=Math.PI; ctx.scale(-1,-1);}
    ctx.rotate(rotText);
    ctx.font="bold 10px Arial Black, Arial, sans-serif";
    ctx.fillStyle="#fff"; ctx.strokeStyle="#000"; ctx.lineWidth=3;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.strokeText(segments[i].text,0,0);
    ctx.fillText(segments[i].text,0,0);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(cx,cy,radius+12,0,Math.PI*2);
  ctx.strokeStyle="#0f0"; ctx.lineWidth=14; ctx.stroke();
}

// ==================== DAILY REWARDS ====================
const DAILY_REWARDS = {
  1: { text: "10k Money" },
  2: { text: "50k Money" },
  3: { text: "Netherite Kit" },
  4: { text: "1 Heart + 100k" },
  5: { text: "1 Spin", spins: 1 },
  6: { text: "2 Spins", spins: 2 },
  7: { text: "1 Million + 2 Spins", spins: 2 }
};

// ==================== HELPER FUNCTIONS ====================
function getToday(){ return new Date().toISOString().split('T')[0]; }
function isNewDay(last){ return !last || getToday()!==last; }
function resetIfNewDay(){
  const today = getToday();
  const lastClaim = localStorage.getItem(STORAGE.lastClaim);
  if(isNewDay(lastClaim)){
    localStorage.setItem(STORAGE.streak, '0');
    localStorage.setItem(STORAGE.bonusSpinsToday,'0');
  }
}
function getAvailableSpins(){
  resetIfNewDay();
  const bonus = parseInt(localStorage.getItem(STORAGE.bonusSpinsToday))||0;
  const lastSpin = localStorage.getItem(STORAGE.lastSpin);
  const daily = isNewDay(lastSpin)?1:0;
  return bonus + daily;
}
function consumeSpin(){
  resetIfNewDay();
  let bonus = parseInt(localStorage.getItem(STORAGE.bonusSpinsToday))||0;
  if(bonus>0) localStorage.setItem(STORAGE.bonusSpinsToday, bonus-1);
  else localStorage.setItem(STORAGE.lastSpin,getToday());
}
function getPrize(){
  let total = segments.reduce((a,b)=>a+b.weight,0);
  let r = Math.random()*total, sum=0;
  for(let s of segments){ sum+=s.weight; if(r<=sum) return s; }
  return segments[0];
}

// ==================== SPIN ====================
async function startSpin(){
  const username=document.getElementById('username')?.value.trim();
  if(!username) return alert("Enter Minecraft username!");
  const avail=getAvailableSpins();
  if(avail<=0) return alert("No spins left!");
  spinning=true;
  const btn=document.getElementById('spinBtn'); if(btn){btn.disabled=true; btn.textContent="SPINNING...";}
  consumeSpin();
  updateSpinsDisplay();
  const prize=getPrize();
  const idx=segments.findIndex(s=>s.text===prize.text && s.color===prize.color);
  const segAngle=(Math.PI*2)/segments.length;
  const target=-(idx*segAngle+segAngle/2)+Math.PI;
  const duration=6800+Math.random()*1200;
  const startTime=Date.now(); const startRot=rotation;
  const extra=(6+Math.random()*2)*Math.PI*2; const totalRot=extra+target;
  function animate(){
    const elapsed=Date.now()-startTime;
    const p=Math.min(elapsed/duration,1);
    const ease=1-Math.pow(1-p,3.5);
    rotation=startRot+ease*totalRot;
    drawWheel(rotation);
    if(p<1) requestAnimationFrame(animate);
    else{
      spinning=false;
      if(btn){btn.disabled=false; btn.textContent="SPIN NOW";}
      document.getElementById('spin-result')?.innerHTML=`🎉 YOU GOT: <strong>${prize.text}</strong>!`;
      sendRewardToBot(username, prize.text);
    }
  } animate();
}

// ==================== DAILY CLAIM ====================
async function claimDaily(){
  const username=document.getElementById('username')?.value.trim();
  if(!username) return alert("Enter Minecraft username!");
  resetIfNewDay();
  const today = getToday();
  if(localStorage.getItem(STORAGE.lastClaim)===today) return alert("Already claimed today!");
  let streak = parseInt(localStorage.getItem(STORAGE.streak))||0; streak++;
  localStorage.setItem(STORAGE.streak,streak);
  localStorage.setItem(STORAGE.lastClaim,today);
  const day = ((streak-1)%7)+1;
  const reward = DAILY_REWARDS[day];
  if(reward.spins){
    let cur = parseInt(localStorage.getItem(STORAGE.bonusSpinsToday))||0;
    localStorage.setItem(STORAGE.bonusSpinsToday, cur+reward.spins);
  }
  alert(`✅ Day ${streak} Claimed!\n${reward.text}\nSpins added: ${reward.spins||0}`);
  sendRewardToBot(username,reward.text);
  updateStreakDisplay(); updateSpinsDisplay();
}

// ==================== UI ====================
function updateStreakDisplay(){ document.getElementById('streak-day')?.textContent=localStorage.getItem(STORAGE.streak)||0; }
function updateSpinsDisplay(){ document.getElementById('spins-count')?.textContent=getAvailableSpins(); }

// ==================== INIT ====================
window.addEventListener('load', ()=>{
  drawWheel();
  document.getElementById('spinBtn')?.addEventListener('click', startSpin);
  document.getElementById('dailyBtn')?.addEventListener('click', claimDaily);
  const uname=document.getElementById('username');
  if(uname){
    uname.value=localStorage.getItem(STORAGE.username)||'';
    uname.addEventListener('input',e=>localStorage.setItem(STORAGE.username,e.target.value.trim()));
  }
  updateStreakDisplay();
  updateSpinsDisplay();
});
