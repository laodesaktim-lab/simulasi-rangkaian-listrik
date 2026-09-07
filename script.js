const mode = document.getElementById("mode");
const voltage = document.getElementById("voltage");
const r1 = document.getElementById("r1");
const r2 = document.getElementById("r2");
const switchBtn = document.getElementById("switchBtn");

let isOn = false;

function update() {
  const V = Number(voltage.value);
  const R1 = Number(r1.value);
  const R2 = Number(r2.value);

  let totalR;
  let current;
  let V1;
  let V2;

  if (mode.value === "series") {
    totalR = R1 + R2;

    current = isOn ? V / totalR : 0;

    V1 = current * R1;
    V2 = current * R2;

  } else {
    totalR = (R1 * R2) / (R1 + R2);

    current = isOn ? V / totalR : 0;

    V1 = isOn ? V : 0;
    V2 = isOn ? V : 0;
  }

  document.getElementById("voltageValue").textContent = V + " V";
  document.getElementById("batteryText").textContent = V + " V";

  document.getElementById("r1Value").textContent = R1 + " Ω";
  document.getElementById("r2Value").textContent = R2 + " Ω";

  document.getElementById("r1Display").textContent = R1 + " Ω";
  document.getElementById("r2Display").textContent = R2 + " Ω";

  document.getElementById("totalR").textContent =
    totalR.toFixed(2) + " Ω";

  document.getElementById("current").textContent =
    current.toFixed(2) + " A";

  document.getElementById("v1").textContent =
    V1.toFixed(2) + " V";

  document.getElementById("v2").textContent =
    V2.toFixed(2) + " V";

  const lamp1 = document.getElementById("lamp1");
  const lamp2 = document.getElementById("lamp2");

  if (isOn && current > 0) {
    lamp1.classList.add("on");
    lamp2.classList.add("on");
  } else {
    lamp1.classList.remove("on");
    lamp2.classList.remove("on");
  }
}

switchBtn.addEventListener("click", () => {
  isOn = !isOn;

  switchBtn.textContent = isOn
    ? "🟢 Saklar ON"
    : "🔴 Saklar OFF";

  update();
});

voltage.addEventListener("input", update);
r1.addEventListener("input", update);
r2.addEventListener("input", update);
mode.addEventListener("change", update);

update();