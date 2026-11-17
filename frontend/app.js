const API_URL = "http://127.0.0.1:8000";

function obtenerToken() {
  return localStorage.getItem("token_escolar");
}

function headersAuth(esJson = true) {
  const headers = { Authorization: `Bearer ${obtenerToken()}` };
  if (esJson) headers["Content-Type"] = "application/json";
  return headers;
}

// --- INICIO Y LOGIN ---
document.addEventListener("DOMContentLoaded", () => {
  if (obtenerToken()) {
    mostrarPanel();
  }
});

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Error al iniciar sesión");

    localStorage.setItem("token_escolar", data.access_token);
    localStorage.setItem("usuario_escolar", JSON.stringify(data.usuario));
    mostrarPanel();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

function mostrarPanel() {
  document.getElementById("vista-login").classList.add("oculto");
  document.getElementById("vista-app").classList.remove("oculto");
  const user = JSON.parse(localStorage.getItem("usuario_escolar") || "{}");
  document.getElementById("info-usuario").textContent = `(${user.nombre} - Rol: ${user.rol})`;
  cargarCursosSelect();
}

document.getElementById("btn-salir").addEventListener("click", () => {
  localStorage.clear();
  location.reload();
});

// --- NAVEGACIÓN POR PESTAÑAS ---
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("activa"));
    document.querySelectorAll(".contenido-tab").forEach((c) => c.classList.add("oculto"));
    btn.classList.add("activa");
    document.getElementById(btn.dataset.tab).classList.remove("oculto");
  });
});

async function cargarCursosSelect() {
  const res = await fetch(`${API_URL}/cursos/`, { headers: headersAuth() });
  if (!res.ok) return;
  const cursos = await res.json();
  const select = document.getElementById("select-curso-asistencia");
  select.innerHTML = cursos.length
    ? cursos.map((c) => `<option value="${c.id}">${c.anio}° "${c.division}" (${c.turno})</option>`).join("")
    : `<option value="">Sin cursos cargados (creá uno en la pestaña 3)</option>`;
}

// --- MÓDULO 1: ASISTENCIA Y ALERTAS ---
document.getElementById("btn-cargar-lista").addEventListener("click", async () => {
  const cursoId = document.getElementById("select-curso-asistencia").value;
  if (!cursoId) return alert("Primero creá un curso en la pestaña 3.");

  const res = await fetch(`${API_URL}/alumnos/?curso_id=${cursoId}`, { headers: headersAuth() });
  const alumnos = await res.json();
  const tbody = document.getElementById("tbody-asistencia");

  tbody.innerHTML = alumnos.map((al) => `
    <tr data-alumno-id="${al.id}">
      <td>${al.dni}</td>
      <td>${al.apellido}, ${al.nombre}</td>
      <td>
        <select class="estado-select">
          <option value="P">Presente (P)</option>
          <option value="A">Ausente (A)</option>
          <option value="J">Justificado (J)</option>
          <option value="T">Tarde (T)</option>
        </select>
      </td>
      <td><input type="text" class="obs-input" placeholder="Opcional" /></td>
    </tr>
  `).join("");

  document.getElementById("contenedor-tabla-asistencia").classList.remove("oculto");
});

document.getElementById("btn-guardar-asistencia").addEventListener("click", async () => {
  const asignaturaId = parseInt(document.getElementById("input-asignatura-asistencia").value);
  const filas = document.querySelectorAll("#tbody-asistencia tr");
  const registros = Array.from(filas).map((tr) => ({
    alumno_id: parseInt(tr.dataset.alumnoId),
    estado: tr.querySelector(".estado-select").value,
    observacion: tr.querySelector(".obs-input").value || null
  }));

  const res = await fetch(`${API_URL}/asistencias/lote/`, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify({ asignatura_id: asignaturaId, registros })
  });
  const data = await res.json();
  const msg = document.getElementById("msg-asistencia");
  msg.style.color = res.ok ? "var(--exito)" : "var(--peligro)";
  msg.textContent = data.mensaje || data.detail;
});

document.getElementById("btn-ver-alertas").addEventListener("click", async () => {
  const cursoId = document.getElementById("select-curso-asistencia").value;
  if (!cursoId) return;

  const res = await fetch(`${API_URL}/asistencias/alertas/${cursoId}`, { headers: headersAuth() });
  const data = await res.json();
  const tbody = document.getElementById("tbody-alertas");

  tbody.innerHTML = data.alertas.length
    ? data.alertas.map((a) => `
        <tr>
          <td>${a.alumno}</td>
          <td>${a.porcentaje_asistencia}%</td>
          <td>${a.faltas_consecutivas}</td>
          <td><span class="badge-riesgo">${a.alerta_regularidad ? "Baja Regularidad" : ""} ${a.alerta_consecutivas ? "3+ Faltas Seguidas" : ""}</span></td>
        </tr>
      `).join("")
    : `<tr><td colspan="4">No hay alumnos en riesgo en este curso.</td></tr>`;

  document.getElementById("tarjeta-alertas").classList.remove("oculto");
});

// --- DESCARGA DE PDFs CON TOKEN ---
async function descargarArchivoPDF(endpoint, nombreArchivo) {
  const res = await fetch(`${API_URL}${endpoint}`, { headers: headersAuth(false) });
  if (!res.ok) return alert("No se pudo generar el PDF. Verificá que existan datos.");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
}

document.getElementById("btn-pdf-asistencia").addEventListener("click", () => {
  const cursoId = document.getElementById("select-curso-asistencia").value;
  if (cursoId) descargarArchivoPDF(`/reportes/asistencia/${cursoId}/pdf`, `asistencia_curso_${cursoId}.pdf`);
});

document.getElementById("btn-pdf-temas").addEventListener("click", () => {
  const asigId = document.getElementById("lt-asignatura").value;
  if (asigId) descargarArchivoPDF(`/reportes/libro-temas/${asigId}/pdf`, `libro_temas_${asigId}.pdf`);
});

// --- MÓDULO 2: LIBRO DE TEMAS ---
document.getElementById("form-libro-temas").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    asignatura_id: parseInt(document.getElementById("lt-asignatura").value),
    unidad_didactica: document.getElementById("lt-unidad").value,
    eje_tematico: document.getElementById("lt-eje").value,
    contenidos_dictados: document.getElementById("lt-contenidos").value,
    observaciones_pedagogicas: document.getElementById("lt-obs").value || null
  };

  const res = await fetch(`${API_URL}/libro-temas/`, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  const msg = document.getElementById("msg-libro");
  msg.style.color = res.ok ? "var(--exito)" : "var(--peligro)";
  msg.textContent = data.mensaje || data.detail;
  if (res.ok) e.target.reset();
});

document.getElementById("btn-ver-temas").addEventListener("click", async () => {
  const asigId = document.getElementById("lt-asignatura").value;
  const res = await fetch(`${API_URL}/libro-temas/${asigId}`, { headers: headersAuth() });
  const temas = await res.json();
  document.getElementById("lista-temas").innerHTML = temas.map((t) => `
    <div style="border-left: 3px solid var(--primario); padding-left: 0.75rem; margin-bottom: 0.75rem;">
      <strong>${t.fecha} - ${t.unidad_didactica}</strong> (${t.eje_tematico})
      <p style="font-size: 0.9rem;">${t.contenidos_dictados}</p>
    </div>
  `).join("") || "<p>Sin registros aún.</p>";
});

// --- PESTAÑA 3: ALTAS ---
async function enviarAlta(endpoint, payload, form) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: headersAuth(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  const msg = document.getElementById("msg-admin");
  msg.style.color = res.ok ? "var(--exito)" : "var(--peligro)";
  msg.textContent = data.mensaje || data.detail;
  if (res.ok) {
    form.reset();
    cargarCursosSelect();
  }
}

document.getElementById("form-curso").addEventListener("submit", (e) => {
  e.preventDefault();
  enviarAlta("/cursos/", {
    anio: parseInt(document.getElementById("c-anio").value),
    division: document.getElementById("c-division").value,
    turno: document.getElementById("c-turno").value
  }, e.target);
});

document.getElementById("form-usuario").addEventListener("submit", (e) => {
  e.preventDefault();
  enviarAlta("/usuarios/", {
    dni: document.getElementById("u-dni").value,
    nombre: document.getElementById("u-nombre").value,
    apellido: document.getElementById("u-apellido").value,
    email: document.getElementById("u-email").value,
    password: document.getElementById("u-pass").value,
    rol: document.getElementById("u-rol").value
  }, e.target);
});

document.getElementById("form-alumno").addEventListener("submit", (e) => {
  e.preventDefault();
  enviarAlta("/alumnos/", {
    dni: document.getElementById("a-dni").value,
    nombre: document.getElementById("a-nombre").value,
    apellido: document.getElementById("a-apellido").value,
    curso_id: parseInt(document.getElementById("a-curso").value)
  }, e.target);
});

document.getElementById("form-asignatura").addEventListener("submit", (e) => {
  e.preventDefault();
  enviarAlta("/asignaturas/", {
    nombre: document.getElementById("m-nombre").value,
    curso_id: parseInt(document.getElementById("m-curso").value),
    docente_id: parseInt(document.getElementById("m-docente").value)
  }, e.target);
});