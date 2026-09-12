const voltage = document.getElementById("voltage");
const resistance = document.getElementById("resistance");
const voltageValue = document.getElementById("voltageValue");
const resistanceValue = document.getElementById("resistanceValue");
const batteryText = document.getElementById("batteryText");
const resistanceText = document.getElementById("resistanceText");
const current = document.getElementById("current");
const power = document.getElementById("power");
const status = document.getElementById("status");
const switchBtn = document.getElementById("switchBtn");
const switchArm = document.getElementById("switchArm");
const lamp = document.getElementById("lamp");
const particles = document.getElementById("particles");
const resetBtn = document.getElementById("resetBtn");

let isOn = false;

function update() {
  const V = Number(voltage.value);
  const R = Number(resistance.value);
  voltageValue.textContent = `${V} V`;
  resistanceValue.textContent = `${R} Ω`;
  batteryText.textContent = `${V} V`;
  resistanceText.textContent = `${R} Ω`;

  const I = isOn ? V / R : 0;
  const P = isOn ? V * I : 0;

  current.textContent = `${I.toFixed(2)} A`;
  power.textContent = `${P.toFixed(2)} W`;
  status.textContent = isOn ? "Sirkuit tertutup — arus mengalir" : "Sirkuit terbuka";

  switchBtn.textContent = isOn ? "SAKELAR: ON" : "SAKELAR: OFF";
  switchBtn.className = `switch ${isOn ? "on" : "off"}`;
  switchArm.style.transform = isOn ? "rotate(55deg)" : "rotate(0deg)";

  const brightness = isOn ? Math.min(1, P / 20) : 0;
  lamp.style.fill = isOn ? `rgb(255, ${Math.round(245 - brightness * 100)}, ${Math.round(130 - brightness * 70)})` : "#e7ebf0";
  lamp.style.filter = isOn ? `drop-shadow(0 0 ${8 + brightness * 20}px rgba(255,180,40,.8))` : "none";

  particles.innerHTML = "";
  if (isOn) createParticles();
}

function createParticles() {
  const points = [
    [220,100],[300,100],[380,100],[540,100],[620,100],[700,100],
    [750,170],[750,250],[750,300],
    [650,330],[560,330],[450,330],[350,330],[250,330],
    [150,300],[150,230],[150,150]
  ];
  points.forEach((p, i) => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("class", "particle");
    c.setAttribute("cx", p[0]);
    c.setAttribute("cy", p[1]);
    c.setAttribute("r", 5);
    c.style.animation = `pulse 0.8s ${i * 0.05}s infinite alternate`;
    particles.appendChild(c);
  });
}

switchBtn.addEventListener("click", () => {
  isOn = !isOn;
  update();
});

voltage.addEventListener("input", update);
resistance.addEventListener("input", update);

resetBtn.addEventListener("click", () => {
  voltage.value = 12;
  resistance.value = 10;
  isOn = false;
  update();
});

const style = document.createElement("style");
style.textContent = `
@keyframes pulse {
  from { opacity: .25; transform: scale(.8); }
  to { opacity: 1; transform: scale(1.25); }
}`;
document.head.appendChild(style);

update();
