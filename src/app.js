let trabajoEditandoId = null;
let clienteModalId = null;

document.addEventListener('DOMContentLoaded', async () => {
  setFechaHoy();
  await cargarNombreApp();
  cargarStats();
  showView('dashboard');
  document.getElementById('trabajo-conformidad').addEventListener('change', function() {
    document.getElementById('conf-label').textContent = this.checked ? 'Cliente CONFORME ✓' : 'Cliente NO conforme';
  });
});

async function cargarNombreApp() {
  const nombre = await window.api.getConfig('app_nombre') || 'TallerPro';
  document.getElementById('app-nombre').textContent = nombre;
  document.getElementById('dash-title').textContent = nombre;
  document.getElementById('input-app-nombre').value = nombre;
  document.title = nombre;
}

async function guardarNombreApp() {
  const val = document.getElementById('input-app-nombre').value.trim();
  if (!val) return;
  await window.api.setConfig('app_nombre', val);
  await cargarNombreApp();
  toast('Nombre actualizado ✓', 'success');
}

function showView(nombre) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${nombre}`).classList.add('active');
  document.querySelector(`[data-view="${nombre}"]`).classList.add('active');
  if (nombre === 'dashboard') cargarStats();
  if (nombre === 'clientes') cargarClientes();
  if (nombre === 'trabajos' && !trabajoEditandoId) resetForm();
}

async function cargarStats() {
  const s = await window.api.getStats();
  document.getElementById('stat-clientes').textContent = s.totalClientes;
  document.getElementById('stat-trabajos').textContent = s.totalTrabajos;
  document.getElementById('stat-cobrado').textContent = `$${Number(s.totalCobrado).toFixed(2)}`;
  document.getElementById('stat-hoy').textContent = s.trabajosHoy;
  document.getElementById('stat-trabajos-sub').textContent = `Este mes: ${s.trabajosMes}`;
  document.getElementById('stat-clientes-sub').textContent = `Activos este mes: ${s.clientesMes}`;
  document.getElementById('pct-hoy').textContent = s.clientesHoy;
  document.getElementById('pct-mes').textContent = s.clientesMes;
  document.getElementById('pct-anio').textContent = s.clientesAnio;
  document.getElementById('pct-hoy-txt').textContent = `${s.pctHoy}% del total`;
  document.getElementById('pct-mes-txt').textContent = `${s.pctMes}% del total`;
  document.getElementById('pct-anio-txt').textContent = `${s.pctAnio}% del total`;
}

async function cargarClientes(search = '') {
  const lista = await window.api.getClientes(search);
  const container = document.getElementById('clientes-list');
  if (!lista.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div>${search ? 'No se encontraron clientes.' : 'Aún no hay clientes registrados.'}</div>`;
    return;
  }
  container.innerHTML = lista.map(c => `
    <div class="cliente-card">
      <div class="cliente-card-badge">${c.total_trabajos} trabajo${c.total_trabajos !== 1 ? 's' : ''}</div>
      <div class="cliente-card-name">${esc(c.nombre)}</div>
      ${c.cedula ? `<div class="cliente-card-info">🪪 ${esc(c.cedula)}</div>` : ''}
      <div class="cliente-card-info">📞 ${esc(c.telefono || '—')}</div>
      <div class="cliente-card-info">✉ ${esc(c.email || '—')}</div>
      <div class="cliente-card-info" style="margin-top:6px;color:var(--text3)">Desde ${formatFecha(c.fecha_registro)}</div>
      <div class="cliente-card-actions">
        <button class="btn-secondary small" onclick="abrirHistorial(${c.id})">Ver trabajos</button>
        <button class="btn-primary small" onclick="nuevoTrabajoParaClienteId(${c.id})">+ Trabajo</button>
      </div>
    </div>`).join('');
}

function buscarClientes(val) { cargarClientes(val); }

async function abrirHistorial(clienteId) {
  clienteModalId = Number(clienteId);
  const cliente = await window.api.getCliente(clienteModalId);
  const trabajos = await window.api.getTrabajos(clienteModalId);
  document.getElementById('modal-cliente-nombre').textContent = cliente.nombre;
  const info = [cliente.cedula ? `🪪 ${cliente.cedula}` : '', cliente.telefono || '', cliente.email || ''].filter(Boolean).join('  ·  ');
  document.getElementById('modal-cliente-info').textContent = info || 'Sin datos de contacto';
  const container = document.getElementById('historial-trabajos');
  container.innerHTML = trabajos.length ? trabajos.map(t => renderTrabajo(t)).join('') : `<div class="empty-state"><div class="empty-icon">🔧</div>Sin trabajos registrados aún.</div>`;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function renderTrabajo(t) {
  const bloqueado = t.conformidad_bloqueada === 1;
  const credenciales = t.usa_credenciales === 1;
  const dispositivo = t.dispositivo === 'Otro' && t.dispositivo_otro ? `Otro: ${esc(t.dispositivo_otro)}` : esc(t.dispositivo);
  const esTransferencia = t.metodo_pago === 'Transferencia';
  return `
    <div class="trabajo-card">
      <div class="trabajo-card-header">
        <div>
          <div class="trabajo-dispositivo">${dispositivo}</div>
          <div class="trabajo-fecha">Ingreso: ${esc(t.fecha_ingreso||'—')} · Entrega: ${esc(t.fecha_entrega||'—')}</div>
        </div>
        <div class="trabajo-monto">$${Number(t.monto||0).toFixed(2)}</div>
      </div>
      ${t.descripcion?`<div class="trabajo-detalle"><strong>Problema:</strong> ${esc(t.descripcion)}</div>`:''}
      ${t.solucion?`<div class="trabajo-detalle"><strong>Solución:</strong> ${esc(t.solucion)}</div>`:''}
      <div class="trabajo-detalle"><strong>Pago:</strong> ${esc(t.metodo_pago||'—')}${esTransferencia?` · <span style="color:var(--accent)">${t.porcentaje_transferencia||0}%</span>`:''}</div>
      ${credenciales?`<div class="cred-badge">🔑 ${esc(t.tipo_cuenta||'Cuenta')}${t.usuario_cuenta?` · ${esc(t.usuario_cuenta)}`:''}</div>`:''}
      ${bloqueado?`<div class="trabajo-conformidad">🔒 <div><strong>Cliente conforme</strong></div></div>`:''}
      <div class="trabajo-card-actions">
        ${!bloqueado?`<button class="btn-edit" onclick="editarTrabajo(${t.id})">✏ Editar</button>`:''}
        <button class="btn-edit" style="color:var(--red);border-color:rgba(232,64,64,0.3)" onclick="eliminarTrabajo(${t.id})">🗑 Eliminar</button>
      </div>
    </div>`;
}

function closeModal(e) {
  if (!e || e.target.id === 'modal-overlay') {
    document.getElementById('modal-overlay').classList.add('hidden');
    clienteModalId = null;
  }
}

async function nuevoTrabajoParaClienteId(id) {
  resetForm();
  showView('trabajos');
  setTimeout(() => precargarClienteEnForm(Number(id)), 50);
}

async function precargarClienteEnForm(clienteId) {
  const c = await window.api.getCliente(Number(clienteId));
  document.getElementById('cliente-id').value = c.id;
  document.getElementById('cliente-nombre').value = c.nombre;
  document.getElementById('cliente-cedula').value = c.cedula || '';
  document.getElementById('cliente-telefono').value = c.telefono || '';
  document.getElementById('cliente-email').value = c.email || '';
  document.getElementById('cliente-search').value = c.nombre;
}

async function eliminarClienteActual() {
  if (!confirm('¿Eliminar este cliente y todos sus trabajos?\nEsta acción no se puede deshacer.')) return;
  await window.api.deleteCliente(clienteModalId);
  closeModal();
  cargarClientes();
  toast('Cliente eliminado', 'success');
}

function setFechaHoy() {
  const hoy = new Date().toISOString().split('T')[0];
  const campo = document.getElementById('trabajo-fecha-ingreso');
  if (campo && !campo.value) campo.value = hoy;
}

function resetForm() {
  trabajoEditandoId = null;
  document.getElementById('trabajo-form').reset();
  document.getElementById('cliente-id').value = '';
  document.getElementById('cliente-search').value = '';
  document.getElementById('credenciales-fields').classList.add('hidden');
  document.getElementById('lock-badge').style.display = 'none';
  document.getElementById('trabajo-conformidad').disabled = false;
  document.getElementById('conf-label').textContent = 'Cliente NO conforme';
  document.getElementById('form-title').textContent = 'Registrar Trabajo';
  document.getElementById('pct-wrap').style.display = 'none';
  document.getElementById('otro-dispositivo-wrap').style.display = 'none';
  document.getElementById('pct-valor').textContent = '0';
  setFechaHoy();
}

function cancelarForm() { resetForm(); showView('clientes'); }
function toggleCredenciales(checked) { document.getElementById('credenciales-fields').classList.toggle('hidden', !checked); }
function togglePass() { const i = document.getElementById('password-cuenta'); i.type = i.type==='password'?'text':'password'; }
function togglePorcentaje(val) { document.getElementById('pct-wrap').style.display = val==='Transferencia'?'flex':'none'; }
function toggleOtroDispositivo(val) {
  document.getElementById('otro-dispositivo-wrap').style.display = val==='Otro'?'block':'none';
  document.getElementById('dispositivo-otro').required = val==='Otro';
}
function limpiarCliente() {
  ['cliente-id','cliente-nombre','cliente-cedula','cliente-telefono','cliente-email','cliente-search'].forEach(id => document.getElementById(id).value='');
  document.getElementById('cliente-nombre').focus();
}

let searchTimeout = null;
async function buscarClienteForm(val) {
  clearTimeout(searchTimeout);
  const dropdown = document.getElementById('cliente-suggestions');
  if (!val || val.length < 2) { dropdown.classList.add('hidden'); return; }
  searchTimeout = setTimeout(async () => {
    const resultados = await window.api.getClientes(val);
    if (!resultados.length) { dropdown.classList.add('hidden'); return; }
    dropdown.innerHTML = resultados.slice(0,6).map(c=>`
      <div class="suggestion-item" onclick="seleccionarCliente(${c.id})">
        <div class="suggestion-name">${esc(c.nombre)}</div>
        <div class="suggestion-info">${c.cedula?`🪪 ${esc(c.cedula)}  `:''}${esc(c.telefono||'')} ${esc(c.email||'')}</div>
      </div>`).join('');
    dropdown.classList.remove('hidden');
  }, 250);
}

async function seleccionarCliente(id) {
  await precargarClienteEnForm(Number(id));
  document.getElementById('cliente-suggestions').classList.add('hidden');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-cliente-wrap')) document.getElementById('cliente-suggestions').classList.add('hidden');
});

async function editarTrabajo(trabajoId) {
  const trabajos = await window.api.getTrabajos(clienteModalId);
  const t = trabajos.find(x => Number(x.id) === Number(trabajoId));
  if (!t) return;
  closeModal();
  trabajoEditandoId = Number(trabajoId);
  document.getElementById('form-title').textContent = 'Editar Trabajo';
  showView('trabajos');
  await precargarClienteEnForm(t.cliente_id);
  document.getElementById('trabajo-dispositivo').value = t.dispositivo||'';
  toggleOtroDispositivo(t.dispositivo);
  if (t.dispositivo==='Otro') document.getElementById('dispositivo-otro').value = t.dispositivo_otro||'';
  document.getElementById('trabajo-fecha-ingreso').value = t.fecha_ingreso||'';
  document.getElementById('trabajo-fecha-entrega').value = t.fecha_entrega||'';
  document.getElementById('trabajo-descripcion').value = t.descripcion||'';
  document.getElementById('trabajo-solucion').value = t.solucion||'';
  document.getElementById('trabajo-monto').value = t.monto||'';
  document.getElementById('metodo-pago').value = t.metodo_pago||'Efectivo';
  togglePorcentaje(t.metodo_pago);
  document.getElementById('porcentaje-transferencia').value = t.porcentaje_transferencia||0;
  document.getElementById('pct-valor').textContent = t.porcentaje_transferencia||0;
  const usaCred = t.usa_credenciales===1;
  document.getElementById('usa-credenciales').checked = usaCred;
  toggleCredenciales(usaCred);
  if (usaCred) {
    document.getElementById('tipo-cuenta').value = t.tipo_cuenta||'';
    document.getElementById('usuario-cuenta').value = t.usuario_cuenta||'';
    document.getElementById('password-cuenta').value = t.password_cuenta||'';
  }
  if (t.conformidad_bloqueada===1) {
    document.getElementById('trabajo-conformidad').checked = true;
    document.getElementById('trabajo-conformidad').disabled = true;
    document.getElementById('conf-label').textContent = 'Cliente CONFORME ✓';
    document.getElementById('lock-badge').style.display = 'inline-flex';
  }
}

async function eliminarTrabajo(trabajoId) {
  if (!confirm('¿Eliminar este trabajo?')) return;
  await window.api.deleteTrabajo(Number(trabajoId));
  toast('Trabajo eliminado', 'success');
  await abrirHistorial(clienteModalId);
}

async function guardarTrabajo(e) {
  e.preventDefault();
  const nombre = document.getElementById('cliente-nombre').value.trim();
  if (!nombre) { toast('El nombre del cliente es obligatorio', 'error'); return; }
  const dispositivo = document.getElementById('trabajo-dispositivo').value;
  const dispositivoOtro = dispositivo==='Otro' ? document.getElementById('dispositivo-otro').value.trim() : null;
  if (dispositivo==='Otro' && !dispositivoOtro) { toast('Especifica el dispositivo', 'error'); return; }

  // 1. Guardamos o actualizamos el cliente
  const clienteResult = await window.api.saveCliente({
    id: document.getElementById('cliente-id').value ? Number(document.getElementById('cliente-id').value) : null,
    nombre,
    cedula: document.getElementById('cliente-cedula').value.trim() || null,
    telefono: document.getElementById('cliente-telefono').value.trim(),
    email: document.getElementById('cliente-email').value.trim(),
  });

  // 2. Extracción ultra-segura del ID (Evita el bache del NaN)
  let clienteId = null;
  if (clienteResult) {
    if (typeof clienteResult === 'object' && clienteResult.id !== undefined) {
      clienteId = Number(clienteResult.id);
    } else if (typeof clienteResult === 'number' || typeof clienteResult === 'string') {
      clienteId = Number(clienteResult);
    }
  }

  // Validación de seguridad para no corromper la base de datos
  if (!clienteId || isNaN(clienteId)) {
    console.error("Error crítico: No se pudo obtener un ID de cliente válido.", clienteResult);
    toast('Error al asociar el cliente con el trabajo', 'error');
    return;
  }

  const conformidad = document.getElementById('trabajo-conformidad').checked;
  const metodoPago = document.getElementById('metodo-pago').value;

  // 3. Guardamos el trabajo con el ID garantizado
  await window.api.saveTrabajo({
    id: trabajoEditandoId ? Number(trabajoEditandoId) : null,
    cliente_id: clienteId,
    dispositivo, dispositivo_otro: dispositivoOtro,
    descripcion: document.getElementById('trabajo-descripcion').value.trim(),
    solucion: document.getElementById('trabajo-solucion').value.trim(),
    fecha_ingreso: document.getElementById('trabajo-fecha-ingreso').value,
    fecha_entrega: document.getElementById('trabajo-fecha-entrega').value,
    usa_credenciales: document.getElementById('usa-credenciales').checked,
    tipo_cuenta: document.getElementById('tipo-cuenta').value,
    usuario_cuenta: document.getElementById('usuario-cuenta').value.trim(),
    password_cuenta: document.getElementById('password-cuenta').value,
    monto: parseFloat(document.getElementById('trabajo-monto').value) || 0,
    metodo_pago: metodoPago,
    porcentaje_transferencia: metodoPago==='Transferencia' ? parseInt(document.getElementById('porcentaje-transferencia').value) : 0,
    conformidad,
  });

  toast(trabajoEditandoId ? 'Trabajo actualizado ✓' : 'Trabajo guardado ✓', 'success');
  resetForm();
  showView('clientes');
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatFecha(str) { return str ? str.split(' ')[0] : '—'; }

let toastTimer = null;
function toast(msg, tipo='') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `toast ${tipo}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast hidden'; }, 3000);
}