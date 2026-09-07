const USERS={
  E001:{name:"Ahmed",role:"Employee"}, E002:{name:"Sara",role:"Employee"},
  S001:{name:"Omar",role:"Support"}, S002:{name:"Mona",role:"Support"},
  M001:{name:"Karim",role:"Manager"}
};
const SEED=[
 {id:"HD-1",title:"Laptop cannot connect to Wi-Fi",description:"Office laptop loses Wi-Fi every few minutes.",employee:"E001",status:"New",priority:"High",assigned:"S001",managerNote:"",resolution:"",comments:[],created:"2026-09-04T09:20:00"},
 {id:"HD-2",title:"Request access to finance folder",description:"Please grant read access to the shared finance folder.",employee:"E002",status:"In Progress",priority:"Medium",assigned:"S002",managerNote:"Please prioritize before end of day.",resolution:"",comments:[{by:"S002",text:"Investigating permissions.",at:"2026-09-04T12:10:00"}],created:"2026-09-03T11:05:00"},
 {id:"HD-3",title:"Printer not responding",description:"The second-floor printer shows offline.",employee:"E001",status:"Resolved",priority:"Low",assigned:"S001",managerNote:"",resolution:"Printer queue was restarted and the device is online.",comments:[],created:"2026-09-01T08:40:00"}
];
function load(){try{let x=JSON.parse(localStorage.getItem("helpdesk_lite_data"));return Array.isArray(x)?x:SEED}catch{return SEED}}
let tickets=load(), current=null, view="dashboard";
function save(){localStorage.setItem("helpdesk_lite_data",JSON.stringify(tickets))}
function esc(s=""){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function statusClass(s){return "status-"+s.toLowerCase().replaceAll(" ","-")}
function badge(s){return `<span class="badge ${statusClass(s)}">${esc(s)}</span>`}
function pri(s){return `<span class="priority-${s.toLowerCase()}">${esc(s)}</span>`}
function toast(t){let d=document.createElement("div");d.className="toast";d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
function role(){return USERS[current].role}
function layout(content){
 let u=USERS[current], r=u.role;
 return `<div class="app"><header class="topbar"><div class="logo">HelpDesk Lite</div><div class="spacer"></div><div class="userpill"><div class="avatar">${u.name[0]}</div><div>${esc(u.name)} · ${r}</div></div><button class="btn secondary" onclick="logout()">Log out</button></header>
 <div class="layout"><aside class="sidebar"><div class="nav-title">Workspace</div><nav class="nav">
 <button class="${view==='dashboard'?'active':''}" onclick="setView('dashboard')">▦ <span>Dashboard</span></button>
 ${r==="Employee"?`<button class="${view==='new'?'active':''}" onclick="setView('new')">＋ <span>New ticket</span></button><button class="${view==='mine'?'active':''}" onclick="setView('mine')">☷ <span>My tickets</span></button>`:""}
 ${r==="Support"?`<button class="${view==='queue'?'active':''}" onclick="setView('queue')">☷ <span>Ticket queue</span></button><button class="${view==='board'?'active':''}" onclick="setView('board')">▥ <span>Work board</span></button>`:""}
 ${r==="Manager"?`<button class="${view==='oversight'?'active':''}" onclick="setView('oversight')">▤ <span>Oversight</span></button><button class="${view==='board'?'active':''}" onclick="setView('board')">▥ <span>Team board</span></button>`:""}
 </nav><div class="footer-note">Local edition · data stored in this browser</div></aside><main class="main">${content}</main></div></div>`;
}
function setView(v){view=v;render()}
function logout(){current=null;render()}
function render(){document.getElementById("root").innerHTML=current?layout(page()):login()}
function login(){
 return `<div class="login"><form class="loginbox" onsubmit="event.preventDefault();doLogin()"><h1>HelpDesk Lite</h1><p>Simple internal support, built around tickets and workload.</p><div class="field"><label>Employee / Staff ID</label><input id="loginId" class="input" placeholder="e.g. E001" autocomplete="off" autofocus></div><button class="btn" style="width:100%">Sign in</button><div class="demo"><b>Demo IDs</b><br>E001 / E002 — Employee<br>S001 / S002 — Support<br>M001 — Manager</div></form></div>`;
}
function doLogin(){let id=document.getElementById("loginId").value.trim().toUpperCase();if(!USERS[id]){toast("ID not found");return}current=id;view="dashboard";render()}
function page(){
 let r=role();
 if(view==="dashboard") return dashboard();
 if(r==="Employee"&&view==="new") return newTicket();
 if(r==="Employee"&&view==="mine") return employeeTickets();
 if(r==="Support"&&(view==="queue"||view==="board")) return supportView();
 if(r==="Manager"&&(view==="oversight"||view==="board")) return managerView();
 return dashboard();
}
function dashboard(){
 let r=role(), mine=tickets.filter(t=>r==="Employee"?t.employee===current:true), open=mine.filter(t=>!["Resolved","Closed"].includes(t.status)).length;
 let inprog=mine.filter(t=>t.status==="In Progress").length, resolved=mine.filter(t=>t.status==="Resolved").length;
 let title=r==="Employee"?"My support overview":r==="Support"?"Support operations":"Management overview";
 return `<div class="pagehead"><div><h1>${title}</h1><div class="sub">A quick view of current helpdesk activity.</div></div></div>
 <div class="grid"><div class="card stat"><div class="label">${r==="Employee"?"My open tickets":"Open tickets"}</div><div class="value">${open}</div></div><div class="card stat"><div class="label">In progress</div><div class="value">${inprog}</div></div><div class="card stat"><div class="label">Resolved</div><div class="value">${resolved}</div></div><div class="card stat"><div class="label">Total tickets</div><div class="value">${mine.length}</div></div></div>
 ${r==="Employee"?`<div class="card table-card"><div class="toolbar"><b>Recent requests</b><div class="spacer"></div><button class="btn" onclick="setView('new')">＋ New ticket</button></div>${ticketTable(mine.slice().reverse().slice(0,5),true)}</div>`:r==="Support"?supportSummary():managerSummary()}`;
}
function ticketTable(arr,employeeOnly=false){
 if(!arr.length)return `<div class="empty">No tickets found.</div>`;
 return `<table class="table"><thead><tr><th>Ticket</th><th>Title</th><th>Employee</th><th>Status</th><th>Priority</th><th>Assigned</th><th></th></tr></thead><tbody>${arr.map(t=>`<tr><td><span class="ticket-link" onclick="openTicket('${t.id}')">${t.id}</span></td><td>${esc(t.title)}</td><td>${esc(USERS[t.employee]?.name||t.employee)}</td><td>${badge(t.status)}</td><td>${pri(t.priority)}</td><td>${esc(USERS[t.assigned]?.name||t.assigned||"Unassigned")}</td><td><button class="btn secondary" onclick="openTicket('${t.id}')">Open</button></td></tr>`).join("")}</tbody></table>`;
}
function supportSummary(){let n=tickets.filter(t=>t.status==="New").length,o=tickets.filter(t=>!["Resolved","Closed"].includes(t.status)).length;return `<div class="card form-card"><h3 style="margin-top:0">Support queue</h3><p class="sub">There are <b>${n}</b> newly submitted tickets and <b>${o}</b> open tickets.</p><button class="btn" onclick="setView('queue')">Open queue</button></div>`}
function managerSummary(){let open=tickets.filter(t=>!["Resolved","Closed"].includes(t.status));return `<div class="card table-card"><div class="toolbar"><b>Open work requiring oversight</b><div class="spacer"></div><button class="btn" onclick="setView('oversight')">Review all</button></div>${ticketTable(open)}</div>`}
function newTicket(){return `<div class="pagehead"><div><h1>New support ticket</h1><div class="sub">Describe the issue clearly. Support will receive it immediately.</div></div></div><form class="card form-card" onsubmit="submitTicket(event)"><div class="field"><label>Title</label><input id="tTitle" class="input" required maxlength="120" placeholder="Short description of the issue"></div><div class="field"><label>Description</label><textarea id="tDesc" class="textarea" rows="7" required placeholder="Include useful details, error messages, device or location information..."></textarea></div><div class="field"><label>Priority</label><select id="tPri" class="select"><option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option></select></div><button class="btn">Submit ticket</button> <button type="button" class="btn secondary" onclick="setView('dashboard')">Cancel</button></form>`}
function submitTicket(e){e.preventDefault();let id="HD-"+(tickets.length?Math.max(...tickets.map(t=>+t.id.split("-")[1]))+1:1);tickets.push({id,title:document.getElementById("tTitle").value.trim(),description:document.getElementById("tDesc").value.trim(),employee:current,status:"New",priority:document.getElementById("tPri").value,assigned:"",managerNote:"",resolution:"",comments:[],created:new Date().toISOString()});save();toast(id+" submitted");view="mine";render()}
function employeeTickets(){let arr=tickets.filter(t=>t.employee===current);return `<div class="pagehead"><div><h1>My tickets</h1><div class="sub">Track every request you submitted and its latest outcome.</div></div><button class="btn" onclick="setView('new')">＋ New ticket</button></div><div class="card table-card">${ticketTable(arr,true)}</div>`}
function supportView(){let arr=tickets.filter(t=>view==="queue"?true:true);return view==="board"?board(arr):`<div class="pagehead"><div><h1>Ticket queue</h1><div class="sub">Central queue for incoming employee requests.</div></div><button class="btn" onclick="setView('board')">Work board</button></div><div class="card table-card"><div class="toolbar"><input id="search" class="input" placeholder="Search tickets..." oninput="filterRows()"></div><div id="rows">${ticketTable(arr)}</div></div>`}
function filterRows(){let q=document.getElementById("search").value.toLowerCase();let arr=tickets.filter(t=>JSON.stringify(t).toLowerCase().includes(q));document.getElementById("rows").innerHTML=ticketTable(arr)}
function board(arr){let states=["New","In Progress","Pending","Resolved"];return `<div class="pagehead"><div><h1>Work board</h1><div class="sub">Move work forward by opening a ticket and updating its status.</div></div><button class="btn secondary" onclick="setView('queue')">Table view</button></div><div class="kanban">${states.map(s=>`<section class="column"><h3>${s} · ${arr.filter(t=>t.status===s).length}</h3>${arr.filter(t=>t.status===s).map(t=>`<article class="kcard" onclick="openTicket('${t.id}')"><div class="id">${t.id} · ${pri(t.priority)}</div><div class="title">${esc(t.title)}</div><div>${esc(USERS[t.employee]?.name||t.employee)} · ${esc(USERS[t.assigned]?.name||"Unassigned")}</div></article>`).join("")||'<div style="padding:12px;color:#8a94a5;font-size:12px">Empty</div>'}</section>`).join("")}</div>`}
function managerView(){let open=tickets.filter(t=>!["Resolved","Closed"].includes(t.status));let counts={};tickets.forEach(t=>counts[t.assigned||"Unassigned"]=(counts[t.assigned||"Unassigned"]||0)+1);return `<div class="pagehead"><div><h1>Manager oversight</h1><div class="sub">Review open work, workload, priorities and manager guidance.</div></div><button class="btn secondary" onclick="setView('board')">Team board</button></div><div class="grid">${Object.entries(counts).map(([k,v])=>`<div class="card stat"><div class="label">${esc(USERS[k]?.name||k)} workload</div><div class="value">${v}</div></div>`).join("")}</div><div class="card table-card"><div class="toolbar"><b>Open tickets</b></div>${ticketTable(open)}</div>`}
function openTicket(id){let t=tickets.find(x=>x.id===id);if(!t)return;let canSupport=role()==="Support", canManager=role()==="Manager", isOwner=role()==="Employee"&&t.employee===current;if(!(canSupport||canManager||isOwner))return;
 document.body.insertAdjacentHTML("beforeend",`<div class="modal" id="ticketModal"><div class="modalbox"><div class="modalhead"><div><b>${t.id}</b><div style="font-size:18px;font-weight:750;margin-top:3px">${esc(t.title)}</div></div><button class="close" onclick="closeModal()">×</button></div><div class="modalbody">
 <div class="row"><div class="detail"><strong>Status</strong>${badge(t.status)}</div><div class="detail"><strong>Priority</strong>${pri(t.priority)}</div></div>
 <div class="row"><div class="detail"><strong>Employee</strong>${esc(USERS[t.employee]?.name||t.employee)}</div><div class="detail"><strong>Assigned support</strong>${esc(USERS[t.assigned]?.name||t.assigned||"Unassigned")}</div></div>
 <div class="detail"><strong>Description</strong>${esc(t.description)}</div>
 ${t.managerNote?`<div class="detail"><strong>Manager note</strong>${esc(t.managerNote)}</div>`:""}
 ${t.resolution?`<div class="detail"><strong>Resolution</strong>${esc(t.resolution)}</div>`:""}
 ${canSupport?`<div class="row"><div class="field"><label>Status</label><select id="editStatus" class="select">${["New","In Progress","Pending","Resolved","Closed"].map(x=>`<option ${x===t.status?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label>Assign to</label><select id="editAssignee" class="select"><option value="">Unassigned</option>${Object.entries(USERS).filter(([k,v])=>v.role==="Support").map(([k,v])=>`<option value="${k}" ${k===t.assigned?"selected":""}>${v.name} (${k})</option>`).join("")}</select></div></div><div class="field"><label>Resolution / progress note</label><textarea id="editResolution" class="textarea" rows="3" placeholder="What was done?">${esc(t.resolution||"")}</textarea></div><button class="btn" onclick="saveSupport('${t.id}')">Save update</button>`:""}
 ${canManager?`<div class="field"><label>Manager priority</label><select id="managerPriority" class="select">${["Low","Medium","High","Critical"].map(x=>`<option ${x===t.priority?"selected":""}>${x}</option>`).join("")}</select></div><div class="field"><label>Note to support staff</label><textarea id="managerNote" class="textarea" rows="3" placeholder="Priority, escalation or guidance...">${esc(t.managerNote||"")}</textarea></div><div class="field"><label>Final response / resolution for employee</label><textarea id="managerResolution" class="textarea" rows="3" placeholder="Resolution details visible to the employee...">${esc(t.resolution||"")}</textarea></div><button class="btn" onclick="saveManager('${t.id}')">Save manager update</button>`:""}
 ${isOwner?`<div class="detail"><strong>Current progress</strong>${badge(t.status)}<p style="margin-bottom:0">${esc(t.resolution||"No resolution has been recorded yet.")}</p></div>`:""}
 ${canSupport||canManager?`<div style="margin-top:20px"><h3>Internal activity</h3>${(t.comments||[]).map(c=>`<div class="comment"><div class="meta">${esc(USERS[c.by]?.name||c.by)} · ${new Date(c.at).toLocaleString()}</div>${esc(c.text)}</div>`).join("")||'<div class="sub">No activity yet.</div>'}</div>`:""}
 </div></div></div>`);
}
function saveSupport(id){let t=tickets.find(x=>x.id===id);t.status=document.getElementById("editStatus").value;t.assigned=document.getElementById("editAssignee").value;t.resolution=document.getElementById("editResolution").value.trim();t.comments=t.comments||[];t.comments.push({by:current,text:"Updated status to "+t.status+(t.resolution?" — "+t.resolution:""),at:new Date().toISOString()});save();closeModal();toast("Ticket updated");render()}
function saveManager(id){let t=tickets.find(x=>x.id===id);t.priority=document.getElementById("managerPriority").value;t.managerNote=document.getElementById("managerNote").value.trim();t.resolution=document.getElementById("managerResolution").value.trim();t.comments=t.comments||[];t.comments.push({by:current,text:"Manager updated priority/guidance.",at:new Date().toISOString()});save();closeModal();toast("Manager update saved");render()}
function closeModal(){document.getElementById("ticketModal")?.remove()}
render();
