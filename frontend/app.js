const API = "/api/opportunities";   // same origin; change to http://localhost:5000/api/opportunities if hosting separately
let items = [];
let deleteId = null;
const $ = (id) => document.getElementById(id);
const FIELDS = ["title","description","research_area","faculty_name","department","required_skills","positions","deadline","status"];
const LABELS = {title:"Title",description:"Description",research_area:"Research area",faculty_name:"Faculty member",department:"Department",required_skills:"Required skills",positions:"Positions",deadline:"Deadline",status:"Status"};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function toast(msg, ok = true) {
  const t = document.createElement("div");
  t.className = "toast " + (ok ? "ok" : "bad");
  t.textContent = msg;
  $("toasts").appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

async function api(url, options) {
  let res;
  try { res = await fetch(url, options); }
  catch { throw { message: "Cannot reach the server. Is the backend running?" }; }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw { message: body.error || "Request failed", details: body.details, status: res.status };
  return body;
}

async function load() {
  try { items = await api(API); render(); }
  catch (e) { toast(e.message, false); $("grid").innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

function render() {
  const q = $("search").value.toLowerCase(), f = $("filter").value;
  const list = items.filter((o) =>
    (f === "All" || o.status === f) &&
    [o.title, o.research_area, o.faculty_name, o.required_skills, o.department].join(" ").toLowerCase().includes(q));

  const open = items.filter((o) => o.status === "Open");
  $("stats").innerHTML =
    `<div class="stat"><b>${open.length}</b><span>Open opportunities</span></div>
     <div class="stat"><b>${open.reduce((n, o) => n + o.positions, 0)}</b><span>Positions available</span></div>
     <div class="stat"><b>${items.length}</b><span>Total posted</span></div>`;

  $("grid").innerHTML = list.length ? list.map((o) => `
    <article class="card ${o.status === "Closed" ? "closed" : ""}">
      <div><span class="badge ${o.status}">${o.status}</span></div>
      <h3>${esc(o.title)}</h3>
      <p class="meta">${esc(o.faculty_name)} &middot; ${esc(o.department)}</p>
      <div class="tags">${o.required_skills.split(",").map((s) => `<span class="tag">${esc(s.trim())}</span>`).join("")}</div>
      <p class="meta">${o.positions} position${o.positions > 1 ? "s" : ""} &middot; Apply by ${esc(o.deadline)}</p>
      <div class="foot"><button class="btn ghost sm" onclick="showDetails(${o.id})">View details</button>
        <div class="btns">
          <button class="btn ghost sm" onclick="openForm(${o.id})">Edit</button>
          ${o.status === "Open" ? `<button class="btn ghost sm" onclick="closeOpp(${o.id})">Close</button>` : ""}
          <button class="btn danger sm" onclick="askDelete(${o.id})">Delete</button>
        </div></div>
    </article>`).join("")
    : `<div class="empty"><b>No opportunities found.</b><br>Post one with the button at the top, or clear your search.</div>`;
}

async function showDetails(id) {
  try {
    const o = await api(`${API}/${id}`);
    $("detailBody").innerHTML = `<div class="detail">
      <span class="badge ${o.status}">${o.status}</span><h2 style="margin-top:8px">${esc(o.title)}</h2>
      <dl>${FIELDS.filter((k) => k !== "title" && k !== "status").map((k) => `<dt>${LABELS[k]}</dt><dd>${esc(o[k])}</dd>`).join("")}</dl>
      <div class="actions"><button class="btn primary" data-close>Close window</button></div></div>`;
    $("detailModal").classList.add("show");
  } catch (e) { toast(e.message, false); load(); }
}

function openForm(id) {
  clearErrors();
  $("form").reset();
  $("oid").value = id || "";
  $("formTitle").textContent = id ? "Update opportunity" : "Post opportunity";
  if (id) {
    const o = items.find((x) => x.id === id);
    FIELDS.forEach((k) => ($(k).value = o[k]));
  }
  $("formModal").classList.add("show");
}

function clearErrors() {
  document.querySelectorAll(".err").forEach((e) => (e.textContent = ""));
  document.querySelectorAll(".invalid").forEach((e) => e.classList.remove("invalid"));
}
function fieldError(k, msg) { $(k).classList.add("invalid"); $(k).parentElement.querySelector(".err").textContent = msg; }

function validateForm() {
  clearErrors();
  let ok = true;
  FIELDS.forEach((k) => { if (!String($(k).value).trim()) { fieldError(k, "This field is required"); ok = false; } });
  if ($("positions").value && Number($("positions").value) < 1) { fieldError("positions", "Enter 1 or more"); ok = false; }
  return ok;
}

$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  if (!validateForm()) return toast("Please fix the highlighted fields", false);
  const id = $("oid").value;
  const payload = {};
  FIELDS.forEach((k) => (payload[k] = $(k).value.trim()));
  payload.positions = Number(payload.positions);
  try {
    await api(id ? `${API}/${id}` : API, {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    toast(id ? "Opportunity updated" : "Opportunity posted");
    hide(); load();
  } catch (e) {
    if (e.details) Object.entries(e.details).forEach(([k, m]) => $(k) && fieldError(k, m));
    toast(e.message, false);
  }
});

async function closeOpp(id) {
  try {
    await api(`${API}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "Closed" }) });
    toast("Opportunity closed"); load();
  } catch (e) { toast(e.message, false); load(); }
}

function askDelete(id) {
  deleteId = id;
  $("confirmText").textContent = `"${items.find((o) => o.id === id).title}" will be removed permanently.`;
  $("confirmModal").classList.add("show");
}
$("confirmDelete").onclick = async () => {
  try { await api(`${API}/${deleteId}`, { method: "DELETE" }); toast("Opportunity deleted"); }
  catch (e) { toast(e.message, false); }
  hide(); load();
};

function hide() { document.querySelectorAll(".overlay").forEach((m) => m.classList.remove("show")); }
document.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close") || e.target.classList.contains("overlay")) hide(); });
document.addEventListener("keydown", (e) => e.key === "Escape" && hide());
$("newBtn").onclick = () => openForm();
$("search").oninput = render;
$("filter").onchange = render;
load();
