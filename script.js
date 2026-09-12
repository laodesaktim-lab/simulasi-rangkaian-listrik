const workspace = document.getElementById("workspace");
const wiresSvg = document.getElementById("wires");
const hint = document.getElementById("hint");
const editor = document.getElementById("editor");
const emptyPanel = document.getElementById("emptyPanel");
const nameInput = document.getElementById("nameInput");
const valueInput = document.getElementById("valueInput");
const unitLabel = document.getElementById("unitLabel");
const applyBtn = document.getElementById("apply");
const toggleSwitchBtn = document.getElementById("toggleSwitch");
const status = document.getElementById("status");

let components = [];
let wires = [];
let selectedComponent = null;
let selectedWire = null;
let terminalStart = null;
let wireMode = false;
let dragging = null;
let offsetX = 0, offsetY = 0;
let nextId = 1;

const defaults = {
  battery:{label:"Baterai", value:12, unit:"V"},
  resistor:{label:"Resistor", value:6, unit:"Ω"},
  lamp:{label:"Lampu", value:6, unit:"Ω"},
  switch:{label:"Saklar", value:1, unit:"", state:true}
};

document.querySelectorAll("[data-add]").forEach(btn=>{
  btn.onclick=()=>addComponent(btn.dataset.add);
});

function addComponent(type){
  const d=defaults[type];
  const c={id:nextId++,type,name:d.label,value:d.value,unit:d.unit,state:d.state ?? true,x:60+(components.length%5)*150,y:100+Math.floor(components.length/5)*120};
  components.push(c);
  renderComponents();
  selectComponent(c.id);
  updateHint();
}

function renderComponents(){
  document.querySelectorAll(".component").forEach(e=>e.remove());
  components.forEach(c=>{
    const el=document.createElement("div");
    el.className="component"+(selectedComponent===c.id?" selected":"");
    el.dataset.id=c.id;
    el.style.left=c.x+"px"; el.style.top=c.y+"px";
    el.innerHTML=`
      <div class="terminal left" data-terminal="${c.id}:L"></div>
      <div class="terminal right" data-terminal="${c.id}:R"></div>
      <div class="title">${escapeHtml(c.name)}</div>
      <div class="value">${c.type==="switch"?(c.state?"ON":"OFF"):(c.value+" "+c.unit)}</div>`;
    el.addEventListener("pointerdown", startDrag);
    el.addEventListener("dblclick", ()=>{
      if(c.type==="switch"){c.state=!c.state;renderComponents();selectComponent(c.id);updateStatus();}
    });
    el.addEventListener("click", e=>{
      if(e.target.classList.contains("terminal")) return;
      selectComponent(c.id);
    });
    el.querySelectorAll(".terminal").forEach(t=>t.addEventListener("click", terminalClick));
    workspace.appendChild(el);
  });
  drawWires();
}

function startDrag(e){
  if(e.target.classList.contains("terminal")) return;
  const c=components.find(x=>x.id===Number(e.currentTarget.dataset.id));
  if(!c) return;
  dragging=c;
  const r=workspace.getBoundingClientRect();
  offsetX=e.clientX-r.left-c.x; offsetY=e.clientY-r.top-c.y;
  e.currentTarget.setPointerCapture(e.pointerId);
  e.currentTarget.classList.add("dragging");
  selectComponent(c.id);
}
workspace.addEventListener("pointermove",e=>{
  if(!dragging)return;
  const r=workspace.getBoundingClientRect();
  dragging.x=Math.max(5,Math.min(workspace.clientWidth-130,e.clientX-r.left-offsetX));
  dragging.y=Math.max(5,Math.min(workspace.clientHeight-80,e.clientY-r.top-offsetY));
  const el=document.querySelector(`.component[data-id="${dragging.id}"]`);
  if(el){el.style.left=dragging.x+"px";el.style.top=dragging.y+"px";}
  drawWires();
});
workspace.addEventListener("pointerup",()=>{if(dragging){document.querySelector(".dragging")?.classList.remove("dragging");dragging=null}});

function terminalClick(e){
  e.stopPropagation();
  const key=e.currentTarget.dataset.terminal;
  if(!wireMode){ wireMode=true; terminalStart=key; status.textContent="Status: terminal pertama dipilih. Pilih terminal kedua."; drawWires(); return; }
  if(key===terminalStart){return;}
  const exists=wires.some(w=>(w.a===terminalStart&&w.b===key)||(w.a===key&&w.b===terminalStart));
  if(!exists) wires.push({id:Date.now()+Math.random(),a:terminalStart,b:key});
  terminalStart=null;
  wireMode=false;
  selectedWire=null;
  drawWires();
  updateStatus();
}

wiresSvg.addEventListener("click",e=>{
  if(e.target.classList.contains("wire")){
    selectedWire=Number(e.target.dataset.id);
    terminalStart=null; wireMode=false;
    drawWires();
    status.textContent="Status: kabel dipilih (merah). Klik “Putus Kabel” untuk memutusnya.";
  }
});

document.getElementById("wireMode").onclick=()=>{
  wireMode=true; terminalStart=null; selectedWire=null;
  status.textContent="Status: mode kabel aktif. Klik terminal pertama lalu terminal kedua.";
  drawWires();
};

document.getElementById("deleteWire").onclick=()=>{
  if(selectedWire==null){status.textContent="Status: pilih kabel terlebih dahulu.";return;}
  wires=wires.filter(w=>w.id!==selectedWire);
  selectedWire=null; drawWires(); updateStatus();
};

document.getElementById("deleteComp").onclick=()=>{
  if(selectedComponent==null)return;
  const id=selectedComponent;
  components=components.filter(c=>c.id!==id);
  wires=wires.filter(w=>!w.a.startsWith(id+":")&&!w.b.startsWith(id+":"));
  selectedComponent=null; renderComponents(); updateEditor(); updateStatus();
};

document.getElementById("clearAll").onclick=()=>{
  if(confirm("Hapus semua komponen dan kabel?")){
    components=[];wires=[];selectedComponent=null;selectedWire=null;terminalStart=null;
    renderComponents();updateEditor();updateStatus();updateHint();
  }
};

applyBtn.onclick=()=>{
  const c=components.find(x=>x.id===selectedComponent);
  if(!c)return;
  c.name=nameInput.value||c.name;
  if(c.type!=="switch") c.value=Number(valueInput.value)||c.value;
  renderComponents();selectComponent(c.id);updateStatus();
};

toggleSwitchBtn.onclick=()=>{
  const c=components.find(x=>x.id===selectedComponent);
  if(c&&c.type==="switch"){c.state=!c.state;renderComponents();selectComponent(c.id);updateStatus();}
};

function selectComponent(id){
  selectedComponent=id; selectedWire=null; renderComponents(); updateEditor();
}

function updateEditor(){
  const c=components.find(x=>x.id===selectedComponent);
  if(!c){emptyPanel.hidden=false;editor.hidden=true;return;}
  emptyPanel.hidden=true;editor.hidden=false;
  nameInput.value=c.name;
  valueInput.value=c.value;
  unitLabel.textContent=c.type==="battery"?"Volt (V)":(c.type==="switch"?"": "Ohm (Ω)");
  valueInput.disabled=c.type==="switch";
  toggleSwitchBtn.hidden=c.type!=="switch";
  if(c.type==="switch")toggleSwitchBtn.textContent=c.state?"Matikan saklar":"Nyalakan saklar";
}

function terminalPos(key){
  const [id,side]=key.split(":");
  const c=components.find(x=>x.id===Number(id));
  if(!c)return null;
  return {x:c.x+(side==="L"?0:125),y:c.y+35};
}
function drawWires(){
  wiresSvg.innerHTML="";
  wires.forEach(w=>{
    const a=terminalPos(w.a),b=terminalPos(w.b); if(!a||!b)return;
    const line=document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1",a.x);line.setAttribute("y1",a.y);
    line.setAttribute("x2",b.x);line.setAttribute("y2",b.y);
    line.dataset.id=w.id;line.classList.add("wire");
    if(selectedWire===w.id)line.classList.add("selected");
    wiresSvg.appendChild(line);
  });
  if(terminalStart){
    const p=terminalPos(terminalStart);
    if(p){
      const c=document.createElementNS("http://www.w3.org/2000/svg","circle");
      c.setAttribute("cx",p.x);c.setAttribute("cy",p.y);c.setAttribute("r",7);c.setAttribute("fill","#e67e22");
      wiresSvg.appendChild(c);
    }
  }
}

function updateHint(){hint.style.display=components.length?"none":"block";}
function updateStatus(){
  const closed=wires.length>0;
  status.textContent=`Status: ${components.length} komponen, ${wires.length} kabel terpisah. ${closed?"Kabel dapat dipilih dan diputus satu per satu.":"Belum ada kabel."}`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

renderComponents();updateEditor();updateHint();updateStatus();
