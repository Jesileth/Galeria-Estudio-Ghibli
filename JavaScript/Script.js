/* ---------- Aca va la parte de la API ---------- */
const API_URLS = ["https://ghibliapi.vercel.app/films"];
const $ = (id) => document.getElementById(id);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- 1. Reloj y fecha (se actualiza cada segundo) ---------- */
function tick() {
  const now = new Date();
  $("time").textContent = now.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  $("date").textContent = now.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
tick();
setInterval(tick, 1000);

/* ---------- 2. Calendario del mes (semana desde lunes) ---------- */
let view = new Date();
function drawCalendar() {
  const y = view.getFullYear(), m = view.getMonth();
  $("cal-title").textContent = view.toLocaleDateString("es", { month: "long", year: "numeric" });
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const t = new Date();
  let html = ["L", "M", "X", "J", "V", "S", "D"].map((d) => `<span class="dow">${d}</span>`).join("");
  html += "<span></span>".repeat(offset);
  for (let d = 1; d <= days; d++) {
    const hoy = d === t.getDate() && m === t.getMonth() && y === t.getFullYear();
    html += `<span class="day${hoy ? " today" : ""}">${d}</span>`;
  }
  $("cal-grid").innerHTML = html;
}
$("prev").onclick = () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); drawCalendar(); };
$("next").onclick = () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); drawCalendar(); };
$("today").onclick = () => { view = new Date(); drawCalendar(); };
drawCalendar();

/* ---------- 3. Consumo de la API con fetch + async/await ---------- */
let films = [];
let meta = "";
async function fetchWithTimeout(url, ms = 25000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms); // corta la petición si tarda demasiado
  try { return await fetch(url, { signal: ctrl.signal }); }
  finally { clearTimeout(timer); }
}
 
async function loadFilms() {
  const status = $("status");
  status.className = "status";
  status.textContent = "Cargando películas…";


   for (const url of API_URLS) {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

       const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No hay datos");
      }

       films = data;
      status.textContent = `${films.length} películas cargadas`;
      render();
      return;
    } catch (err) {
      console.error("Error cargando películas:", err);
    }
  }

  status.className = "status error";
  status.innerHTML =
    'No se pudieron cargar las películas. <button type="button" class="link" id="retry">Reintentar</button>';

  document.getElementById("retry").onclick = loadFilms;
}

loadFilms();


/* ---------- 4. Buscar, ordenar y pintar ---------- */
function visible() {
  const q = $("q").value.trim().toLowerCase();
  const list = films.filter((f) => f.title.toLowerCase().includes(q) || f.original_title_romanised.toLowerCase().includes(q));
  const sorters = {
    "year-desc": (a, b) => b.release_date - a.release_date,
    "year-asc": (a, b) => a.release_date - b.release_date,
    title: (a, b) => a.title.localeCompare(b.title),
    score: (a, b) => b.rt_score - a.rt_score,
  };
  return list.sort(sorters[$("sort").value]);
}
function render() {
  const list = visible();
  $("status").className = "status";
  $("status").textContent = list.length ? `${list.length} película(s) · ${meta}` : "Sin resultados. Prueba con otro título.";
  $("results").innerHTML = list.map((f) => `
    <button class="film" data-id="${esc(f.id)}">
      <img src="${esc(f.movie_banner)}" alt="Escena de ${esc(f.title)}" loading="lazy" />
      <span class="info"><h3>${esc(f.title)}</h3><small>${esc(f.release_date)} · ★ ${esc(f.rt_score)}</small></span>
    </button>`).join("");
}
function drawGallery() {
  $("gallery").innerHTML = films.map((f) => `
    <button data-id="${esc(f.id)}" aria-label="${esc(f.title)}"><img src="${esc(f.image)}" alt="Póster de ${esc(f.title)}" loading="lazy" /></button>`).join("");
}
$("form").addEventListener("submit", (e) => { e.preventDefault(); render(); });
$("q").addEventListener("input", render);
$("sort").addEventListener("change", render);


/* ---------- 5. Detalle en ventana modal ---------- */
function openDetail(id) {
  const f = films.find((x) => x.id === id);
  if (!f) return;
  $("modal-body").innerHTML = `
    <img class="modal-banner" src="${esc(f.movie_banner)}" alt="Escena de ${esc(f.title)}" />
    <div class="modal-content">
      <h2>${esc(f.title)}</h2>
      <p class="muted">${esc(f.original_title)} · ${esc(f.original_title_romanised)}</p>
      <div class="chips"><span class="chip">${esc(f.release_date)}</span><span class="chip">${esc(f.running_time)} min</span><span class="chip">★ ${esc(f.rt_score)}</span></div>
      <p>${esc(f.description)}</p>
      <p class="muted">Director: ${esc(f.director)} · Productor: ${esc(f.producer)}</p>
    </div>`;
  $("modal").showModal();
}
["results", "gallery"].forEach((id) =>
  $(id).addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) openDetail(b.dataset.id); }));
$("close").onclick = () => $("modal").close();
$("modal").addEventListener("click", (e) => { if (e.target === $("modal")) $("modal").close(); });
 
loadFilms();