const canvas = document.getElementById("circuitCanvas");
const ctx = canvas.getContext("2d");

const voltage = document.getElementById("voltage");
const r1 = document.getElementById("r1");
const r2 = document.getElementById("r2");
const voltageValue = document.getElementById("voltageValue");
const r1Value = document.getElementById("r1Value");
const r2Value = document.getElementById("r2Value");
const toggleBtn = document.getElementById("toggleBtn");
const resetBtn = document.getElementById("resetBtn");
const status = document.getElementById("status");
const circuitTitle = document.getElementById("circuitTitle");
const formula = document.getElementById("formula");

let type = "series";
let isOn = false;

document.querySelectorAll(".type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    type = btn.dataset.type;
    document.querySelectorAll(".type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    circuitTitle.textContent = type === "series" ? "Seri" : "Paralel";
    update();
  });
});

[voltage,r1,r2].forEach(el => el.addEventListener("input", update));

toggleBtn.addEventListener("click", () => {
  isOn = !isOn;
  update();
});

resetBtn.addEventListener("click", () => {
  voltage.value = 12; r1.value = 6; r2.value = 6;
  type = "series"; isOn = false;
  document.querySelectorAll(".type-btn").forEach(b => b.classList.toggle("active", b.dataset.type === "series"));
  circuitTitle.textContent = "Seri";
  update();
});

function calc() {
  const V = Number(voltage.value);
  const R1 = Number(r1.value);
  const R2 = Number(r2.value);
  let Rt, I, V1, V2, I1, I2;

  if (type === "series") {
    Rt = R1 + R2;
    I = isOn ? V / Rt : 0;
    I1 = I2 = I;
    V1 = I * R1;
    V2 = I * R2;
  } else {
    Rt = (R1 * R2) / (R1 + R2);
    I = isOn ? V / Rt : 0;
    V1 = V2 = isOn ? V : 0;
    I1 = isOn ? V / R1 : 0;
    I2 = isOn ? V / R2 : 0;
  }
  return {V,R1,R2,Rt,I,V1,V2,I1,I2};
}

function fmt(x) {
  if (Math.abs(x) < 0.005) return "0";
  return x.toFixed(2).replace(/\.00$/,"");
}

function update() {
  const c = calc();
  voltageValue.textContent = `${c.V} V`;
  r1Value.textContent = `${c.R1} Ω`;
  r2Value.textContent = `${c.R2} Ω`;

  document.getElementById("rt").textContent = `${fmt(c.Rt)} Ω`;
  document.getElementById("it").textContent = `${fmt(c.I)} A`;
  document.getElementById("v1").textContent = `${fmt(c.V1)} V`;
  document.getElementById("v2").textContent = `${fmt(c.V2)} V`;
  document.getElementById("i1").textContent = `${fmt(c.I1)} A`;
  document.getElementById("i2").textContent = `${fmt(c.I2)} A`;

  toggleBtn.textContent = isOn ? "🟢 Saklar ON" : "🔴 Saklar OFF";
  toggleBtn.classList.toggle("on", isOn);
  status.className = "status " + (isOn ? "on" : "off");
  status.textContent = isOn ? "Saklar tertutup — arus mengalir." : "Saklar terbuka — arus tidak mengalir.";

  if(type === "series") {
    formula.textContent = `Seri: Rt = R1 + R2 = ${c.R1} + ${c.R2} = ${fmt(c.Rt)} Ω`;
  } else {
    formula.textContent = `Paralel: 1/Rt = 1/R1 + 1/R2 → Rt = ${fmt(c.Rt)} Ω`;
  }

  draw(c);
}

function draw(c) {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#f8fafc"; ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.font="bold 18px Arial";
  ctx.fillStyle="#172033";
  ctx.fillText(type === "series" ? "Rangkaian Seri" : "Rangkaian Paralel", 30, 38);

  ctx.strokeStyle="#263746"; ctx.lineWidth=5; ctx.lineCap="round";
  const wire=(x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};

  // battery
  wire(90,100,90,160); wire(90,220,90,300);
  ctx.lineWidth=6; ctx.beginPath();ctx.moveTo(70,160);ctx.lineTo(110,160);ctx.stroke();
  ctx.lineWidth=3; ctx.beginPath();ctx.moveTo(78,175);ctx.lineTo(102,175);ctx.stroke();
  ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(70,200);ctx.lineTo(110,200);ctx.stroke();
  ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(78,215);ctx.lineTo(102,215);ctx.stroke();
  ctx.font="bold 15px Arial";ctx.fillStyle="#172033";ctx.fillText(`${c.V} V`,55,325);

  if(type === "series") drawSeries(c,wire);
  else drawParallel(c,wire);
}

function drawSeries(c,wire){
  wire(90,100,170,100); wire(170,100,260,100);
  drawSwitch(260,100);
  wire(300,100,380,100); drawLamp(430,100,c.V1,c.I1);
  wire(480,100,590,100); drawLamp(640,100,c.V2,c.I2);
  wire(690,100,710,100); wire(710,100,710,300); wire(710,300,90,300);

  if(isOn) drawFlow(90,100,710,100);
}

function drawParallel(c,wire){
  wire(90,100,170,100); drawSwitch(170,100);
  wire(210,100,300,100); wire(300,100,300,300);
  wire(300,100,500,100); drawLamp(550,100,c.V1,c.I1); wire(600,100,680,100); wire(680,100,680,300);
  wire(300,300,680,300); wire(680,300,680,300); wire(300,300,90,300);

  ctx.strokeStyle="#263746";ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(500,100);ctx.lineTo(500,300);ctx.stroke();
  drawLamp(500,200,c.V2,c.I2);
  if(isOn) drawFlow(90,100,300,100);
}

function drawSwitch(x,y){
  ctx.strokeStyle="#263746";ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18,y);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+22,y);ctx.lineTo(isOn?x+45:x+38,y-22);ctx.stroke();
  ctx.beginPath();ctx.arc(x+20,y,3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x+45,y,3,0,Math.PI*2);ctx.fill();
  ctx.font="bold 14px Arial";ctx.fillStyle="#172033";ctx.fillText("Saklar",x-5,y+35);
}

function drawLamp(x,y,v,i){
  ctx.fillStyle=isOn && i>0 ? "#ffd84d" : "#d9dee4";
  ctx.strokeStyle="#263746";ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(x,y,35,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-13,y-13);ctx.lineTo(x+13,y+13);ctx.moveTo(x+13,y-13);ctx.lineTo(x-13,y+13);ctx.stroke();
  if(isOn && i>0){
    ctx.beginPath();ctx.arc(x,y,47,0,Math.PI*2);ctx.strokeStyle="#ffd84d";ctx.lineWidth=2;ctx.stroke();
  }
  ctx.font="bold 14px Arial";ctx.fillStyle="#172033";ctx.textAlign="center";
  ctx.fillText(`${fmt(v)} V`,x,y+58);
  ctx.fillText(`${fmt(i)} A`,x,y+77);
  ctx.textAlign="left";
}

function drawFlow(x1,y1,x2,y2){
  ctx.strokeStyle="#15935b";ctx.lineWidth=3;ctx.setLineDash([8,8]);
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  ctx.setLineDash([]);
}

update();
