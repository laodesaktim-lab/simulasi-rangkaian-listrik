const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  mode: "series",
  running: false,
  selected: null,
  battery: { id:"battery-1", type:"battery", name:"Baterai", voltage:12, x:90, y:260 },
  components: [
    {id:"lamp-1", type:"lamp", name:"R1", resistance:6, x:360, y:270, on:true},
    {id:"lamp-2", type:"lamp", name:"R2", resistance:6, x:560, y:270, on:true},
    {id:"lamp-3", type:"lamp", name:"R3", resistance:6, x:760, y:270, on:true}
  ],
  wires:[]
};

const circuit = $("#circuit");

function uid(type){ return type+"-"+Date.now()+"-"+Math.floor(Math.random()*9999); }

function iconFor(type){
  return {lamp:"💡",resistor:"▱",battery:"🔋",switch:"━╱",voltmeter:"V",ammeter:"A"}[type] || "?";
}
function typeName(type){
  return {lamp:"Lampu",resistor:"Resistor",battery:"Baterai",switch:"Saklar",voltmeter:"Voltmeter",ammeter:"Amperemeter"}[type] || type;
}

function addComponent(type){
  if(type==="battery" && state.battery) { toast("Baterai utama sudah tersedia."); return; }
  const n = state.components.length;
  const item = {
    id:uid(type), type, name:type==="lamp" ? `R${n+1}` : typeName(type),
    resistance:type==="lamp" ? 6 : type==="resistor" ? 10 : undefined,
    x: 300 + (n%4)*120, y: 160 + Math.floor(n/4)*110,
    on:true
  };
  state.components.push(item);
  render();
  select(item);
}

function render(){
  circuit.innerHTML="";
  const all = [state.battery, ...state.components].filter(Boolean);
  renderWires();
  all.forEach(renderNode);
  if(state.mode!=="series") createJunctions();
  calculate();
}

function renderNode(item){
  const el=document.createElement("div");
  el.className="node"+(state.selected?.id===item.id?" selected":"");
  el.dataset.id=item.id;
  el.style.left=item.x+"px"; el.style.top=item.y+"px";
  let body="";
  if(item.type==="lamp") body=`<div class="lamp-body ${item.on?"on":""}">💡</div>`;
  else if(item.type==="resistor") body=`<div class="res-body"></div>`;
  else if(item.type==="battery") body=`<div class="battery-body"></div>`;
  else if(item.type==="switch") body=`<div class="switch-body">${item.on?"━╱":"━━"}</div>`;
  else body=`<div class="meter-body">${item.type==="voltmeter"?"V":"A"}</div>`;
  el.innerHTML=body+`<div class="label">${item.name}</div>`;
  el.addEventListener("pointerdown", startDrag);
  el.addEventListener("click", e=>{e.stopPropagation();select(item)});
  circuit.appendChild(el);
}

function renderWires(){
  const all=[state.battery,...state.components].filter(Boolean);
  if(all.length<2)return;
  if(state.mode==="series"){
    let points=all.map(c=>({x:c.x+38,y:c.y+32}));
    for(let i=0;i<points.length-1;i++) line(points[i],points[i+1]);
  } else if(state.mode==="parallel"){
    const lamps=state.components.filter(c=>["lamp","resistor"].includes(c.type));
    const battery=state.battery;
    if(!battery)return;
    const bx=battery.x+38, by=battery.y+32;
    const left=bx+100, right=Math.max(...lamps.map(c=>c.x))+40;
    line({x:bx,y:by},{x:left,y:by});
    line({x:left,y:by},{x:left,y:Math.min(...lamps.map(c=>c.y))+32});
    line({x:left,y:Math.max(...lamps.map(c=>c.y))+32},{x:left,y:by});
    lamps.forEach(c=>{
      const cy=c.y+32;
      line({x:left,y:cy},{x:c.x+38,y:cy});
      line({x:c.x+38,y:cy},{x:right,y:cy});
    });
    line({x:right,y:Math.min(...lamps.map(c=>c.y))+32},{x:right,y:Math.max(...lamps.map(c=>c.y))+32});
    line({x:right,y:by},{x:bx,y:by});
  } else {
    const lamps=state.components.filter(c=>["lamp","resistor"].includes(c.type));
    if(lamps.length>=2){
      line({x:state.battery.x+38,y:state.battery.y+32},{x:lamps[0].x+38,y:lamps[0].y+32});
      line({x:lamps[0].x+38,y:lamps[0].y+32},{x:lamps[1].x+38,y:lamps[1].y+32});
      for(let i=1;i<lamps.length-1;i++) line({x:lamps[i].x+38,y:lamps[i].y+32},{x:lamps[i+1].x+38,y:lamps[i+1].y+32});
    }
  }
}
function line(a,b){
  const el=document.createElement("div"); el.className="wire-line";
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
  el.style.left=a.x+"px";el.style.top=a.y+"px";el.style.width=len+"px";
  el.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;
  el.addEventListener("click",e=>{e.stopPropagation();el.remove();toast("Kabel dipilih. Klik Hapus untuk menghapus.")});
  circuit.appendChild(el);
}
function createJunctions(){
  const js=document.createElement("div"); js.className="junction";js.style.left="145px";js.style.top="300px";circuit.appendChild(js);
}

function select(item){
  state.selected=item; render();
  $("#emptySettings").hidden=true; $("#settingsContent").hidden=false;
  $("#selectedIcon").textContent=iconFor(item.type); $("#selectedName").textContent=typeName(item.type);
  $("#nameInput").value=item.name;
  $("#valueLabel").hidden=!["lamp","resistor"].includes(item.type);
  $("#voltageLabel").hidden=item.type!=="battery";
  $("#switchRow").hidden=!["lamp","switch"].includes(item.type);
  if(item.type==="battery")$("#voltageInput").value=item.voltage;
  if(item.resistance)$("#valueInput").value=item.resistance;
  updateToggle();
}
function updateToggle(){
  if(!state.selected)return;
  const on=state.selected.on!==false;
  $("#switchToggle").classList.toggle("off",!on);
  $("#switchToggle").classList.toggle("on",on);
  $("#switchToggle b").textContent=on?"Hidup":"Mati";
}
$("#nameInput").addEventListener("input",e=>{if(state.selected){state.selected.name=e.target.value;render()}});
$("#valueInput").addEventListener("input",e=>{if(state.selected){state.selected.resistance=Math.max(1,Math.min(100,+e.target.value||1));calculate()}});
$("#voltageInput").addEventListener("input",e=>{if(state.selected){state.selected.voltage=Math.max(1,Math.min(24,+e.target.value||1));calculate()}});
$("#switchToggle").addEventListener("click",()=>{if(state.selected){state.selected.on=!state.selected.on;updateToggle();render()}});
$("#closeSettings").addEventListener("click",()=>{state.selected=null;$("#emptySettings").hidden=false;$("#settingsContent").hidden=true;render()});

function calculate(){
  const V=state.battery?.voltage||12;
  const loads=state.components.filter(c=>["lamp","resistor"].includes(c.type));
  let rt=0;
  if(state.mode==="parallel") rt=loads.length?1/loads.reduce((s,c)=>s+1/(c.resistance||1),0):0;
  else if(state.mode==="mixed" && loads.length>=3) {
    const parallel=1/((1/(loads[1].resistance||1))+(1/(loads[2].resistance||1)));
    rt=(loads[0].resistance||1)+parallel;
  } else rt=loads.reduce((s,c)=>s+(c.resistance||1),0);
  const I=rt?V/rt:0;
  $("#resultVoltage").textContent=`${fmt(V)} V`;
  $("#resultResistance").textContent=`${fmt(rt)} Ω`;
  $("#resultCurrent").textContent=`${fmt(I)} A`;
  const title=$("#branchTitle"), br=$("#branchResults"); br.innerHTML="";
  if(state.mode==="parallel"){
    title.textContent="Cabang Paralel";
    loads.forEach((c,i)=>{const row=document.createElement("div");row.className="branch";row.innerHTML=`<span>${c.name} (${fmt(c.resistance)} Ω)</span><b>${fmt(V/(c.resistance||1))} A</b>`;br.appendChild(row)});
  } else {
    title.textContent="Komponen";
    loads.forEach(c=>{const row=document.createElement("div");row.className="branch";row.innerHTML=`<span>${c.name} (${fmt(c.resistance)} Ω)</span><b>${fmt(I)} A</b>`;br.appendChild(row)});
  }
}
function fmt(n){return Number(n).toFixed(2).replace(/\.00$/,"").replace(/(\.\d)0$/,"$1")}

let drag=null;
function startDrag(e){
  const item=[state.battery,...state.components].find(x=>x.id===e.currentTarget.dataset.id);
  if(!item)return;
  select(item);
  drag={item,ox:e.clientX-item.x,oy:e.clientY-item.y};
  e.currentTarget.setPointerCapture?.(e.pointerId);
  e.currentTarget.addEventListener("pointermove",moveDrag);
  e.currentTarget.addEventListener("pointerup",endDrag,{once:true});
}
function moveDrag(e){if(!drag)return;drag.item.x=Math.max(10,e.clientX-drag.ox);drag.item.y=Math.max(10,e.clientY-drag.oy);render()}
function endDrag(){drag=null}

$$(".component").forEach(btn=>btn.addEventListener("click",()=>addComponent(btn.dataset.type)));
$$(".mode").forEach(btn=>btn.addEventListener("click",()=>{
  $$(".mode").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  state.mode=btn.dataset.mode; arrangeMode(); render(); toast(`Mode ${btn.textContent} aktif.`);
}));
function arrangeMode(){
  if(state.mode==="parallel"){
    state.battery.x=70;state.battery.y=260;
    state.components.forEach((c,i)=>{c.x=360+i*160;c.y=180+(i%3)*130});
  }else if(state.mode==="series"){
    state.battery.x=70;state.battery.y=260;
    state.components.forEach((c,i)=>{c.x=310+i*150;c.y=260});
  }else{
    state.battery.x=70;state.battery.y=260;
    state.components.forEach((c,i)=>{c.x=350+i*150;c.y=i===0?260:160+(i%2)*200});
  }
}
$("#runBtn").addEventListener("click",()=>{state.running=true;document.body.classList.add("running");$("#statusText").textContent="Simulasi sedang berjalan.";render();toast("Rangkaian dijalankan.")});
$("#stopBtn").addEventListener("click",()=>{state.running=false;document.body.classList.remove("running");$("#statusText").textContent="Simulasi dihentikan.";render();toast("Simulasi dihentikan.")});
$("#resetBtn").addEventListener("click",()=>{
  state.mode="parallel";state.running=false;state.selected=null;
  state.battery={id:"battery-1",type:"battery",name:"Baterai",voltage:12,x:70,y:260};
  state.components=[
    {id:"lamp-1",type:"lamp",name:"R1",resistance:6,x:360,y:180,on:true},
    {id:"lamp-2",type:"lamp",name:"R2",resistance:6,x:520,y:310,on:true},
    {id:"lamp-3",type:"lamp",name:"R3",resistance:6,x:680,y:440,on:true}
  ];
  $$(".mode").forEach(b=>b.classList.toggle("active",b.dataset.mode==="parallel"));
  $("#emptySettings").hidden=false;$("#settingsContent").hidden=true;document.body.classList.remove("running");render();toast("Rangkaian direset.");
});
$("#deleteBtn").addEventListener("click",()=>{
  if(!state.selected){toast("Pilih komponen terlebih dahulu.");return}
  if(state.selected.type==="battery"){toast("Baterai utama tidak dapat dihapus.");return}
  const id=state.selected.id;state.components=state.components.filter(c=>c.id!==id);state.selected=null;
  $("#emptySettings").hidden=false;$("#settingsContent").hidden=true;render();toast("Komponen dihapus.");
});
$("#settingsBtn").addEventListener("click",()=>{$(".settings-panel").scrollIntoView({behavior:"smooth"})});
circuit.addEventListener("click",()=>{state.selected=null;$("#emptySettings").hidden=false;$("#settingsContent").hidden=true;render()});

function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.classList.remove("show"),1700)}

arrangeMode();
render();
