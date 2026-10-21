/* ---------- Aca va la parte de la API ---------- */


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