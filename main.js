const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let db, mainWindow, dbPath;

async function initDB() {
  const SQL = await initSqlJs();
  dbPath = path.join(app.getPath('userData'), 'taller.db');
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    db = new SQL.Database();
  }

  db.run(`CREATE TABLE IF NOT EXISTS config (clave TEXT PRIMARY KEY, valor TEXT);`);
  db.run(`CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL, cedula TEXT, telefono TEXT, email TEXT,
    fecha_registro TEXT DEFAULT (datetime('now','localtime'))
  );`);
  db.run(`CREATE TABLE IF NOT EXISTS trabajos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    dispositivo TEXT NOT NULL, dispositivo_otro TEXT,
    descripcion TEXT, solucion TEXT,
    fecha_ingreso TEXT, fecha_entrega TEXT,
    usa_credenciales INTEGER DEFAULT 0,
    tipo_cuenta TEXT, usuario_cuenta TEXT, password_cuenta TEXT,
    monto REAL DEFAULT 0, metodo_pago TEXT DEFAULT 'Efectivo',
    porcentaje_transferencia REAL DEFAULT 0,
    conformidad INTEGER DEFAULT 0, conformidad_bloqueada INTEGER DEFAULT 0,
    fecha_creacion TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );`);

  try { db.run(`ALTER TABLE clientes ADD COLUMN cedula TEXT;`); } catch(e) {}
  try { db.run(`ALTER TABLE trabajos ADD COLUMN dispositivo_otro TEXT;`); } catch(e) {}
  try { db.run(`ALTER TABLE trabajos ADD COLUMN porcentaje_transferencia REAL DEFAULT 0;`); } catch(e) {}
  db.run(`INSERT OR IGNORE INTO config (clave, valor) VALUES ('app_nombre', 'TallerPro');`);
  saveDB();
}

function saveDB() {
  fs.writeFile(dbPath, Buffer.from(db.export()), (err) => {
    if (err) {
      console.error("Error crítico al escribir en el disco:", err);
    }
  });
}

function queryAll(sql, params = {}) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = {}) { return queryAll(sql, params)[0] || null; }

function run(sql, params = {}) { db.run(sql, params); saveDB(); }

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, minWidth: 960, minHeight: 620,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    title: 'TallerPro'
  });
  mainWindow.loadFile('src/index.html');
}

app.whenReady().then(async () => { await initDB(); createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('get-config', (_, clave) => { const r = queryOne('SELECT valor FROM config WHERE clave=$c', {$c:clave}); return r ? r.valor : null; });
ipcMain.handle('set-config', (_, clave, valor) => { run('INSERT OR REPLACE INTO config (clave,valor) VALUES ($c,$v)', {$c:clave,$v:valor}); return {ok:true}; });

ipcMain.handle('get-clientes', (_, search = '') => {
  if (search) return queryAll(`SELECT c.*, COUNT(t.id) as total_trabajos FROM clientes c LEFT JOIN trabajos t ON t.cliente_id=c.id WHERE c.nombre LIKE $s OR c.telefono LIKE $s OR c.cedula LIKE $s OR c.email LIKE $s GROUP BY c.id ORDER BY c.fecha_registro DESC`, {$s:`%${search}%`});
  return queryAll(`SELECT c.*, COUNT(t.id) as total_trabajos FROM clientes c LEFT JOIN trabajos t ON t.cliente_id=c.id GROUP BY c.id ORDER BY c.fecha_registro DESC`);
});

ipcMain.handle('get-cliente', (_, id) => queryOne('SELECT * FROM clientes WHERE id=$id', {$id:id}));

ipcMain.handle('save-cliente', (_, d) => {
  if (d.id) {
    db.run('UPDATE clientes SET nombre=$n,cedula=$ced,telefono=$t,email=$e WHERE id=$id', {$n:d.nombre,$ced:d.cedula||null,$t:d.telefono,$e:d.email,$id:d.id});
    saveDB();
    return {id: Number(d.id)};
  } else {
    // 1. Insertamos directo usando db.run para que no ejecute saveDB todavía
    db.run('INSERT INTO clientes (nombre,cedula,telefono,email) VALUES ($n,$ced,$t,$e)', {$n:d.nombre,$ced:d.cedula||null,$t:d.telefono,$e:d.email});
    
    // 2. Capturamos el ID inmediatamente mientras sigue fresco en la memoria activa
    const res = queryOne('SELECT last_insert_rowid() as id');
    const insertId = res ? (res.id ?? res['last_insert_rowid()']) : 0;
    
    // 3. Ahora sí guardamos los cambios en el archivo físico
    saveDB();
    return {id: Number(insertId)};
  }
});

ipcMain.handle('delete-cliente', (_, id) => { run('DELETE FROM trabajos WHERE cliente_id=$id',{$id:id}); run('DELETE FROM clientes WHERE id=$id',{$id:id}); return {ok:true}; });

ipcMain.handle('get-trabajos', (_, clienteId) =>
  queryAll('SELECT * FROM trabajos WHERE cliente_id=$id ORDER BY fecha_creacion DESC', {$id: Number(clienteId)})
);

ipcMain.handle('save-trabajo', (_, d) => {
  const base = {
    $dispositivo:d.dispositivo, $dispositivo_otro:d.dispositivo_otro||null,
    $descripcion:d.descripcion, $solucion:d.solucion,
    $fi:d.fecha_ingreso, $fe:d.fecha_entrega,
    $uc:d.usa_credenciales?1:0, $tc:d.tipo_cuenta, $ucu:d.usuario_cuenta, $pc:d.password_cuenta,
    $monto:d.monto, $mp:d.metodo_pago, $pct:d.porcentaje_transferencia||0
  };
  if (d.id) {
    const existing = queryOne('SELECT conformidad_bloqueada FROM trabajos WHERE id=$id', {$id:Number(d.id)});
    if (existing && existing.conformidad_bloqueada===1) {
      db.run(`UPDATE trabajos SET dispositivo=$dispositivo,dispositivo_otro=$dispositivo_otro,descripcion=$descripcion,solucion=$solucion,fecha_ingreso=$fi,fecha_entrega=$fe,usa_credenciales=$uc,tipo_cuenta=$tc,usuario_cuenta=$ucu,password_cuenta=$pc,monto=$monto,metodo_pago=$mp,porcentaje_transferencia=$pct WHERE id=$id`, {...base,$id:Number(d.id)});
    } else {
      db.run(`UPDATE trabajos SET dispositivo=$dispositivo,dispositivo_otro=$dispositivo_otro,descripcion=$descripcion,solucion=$solucion,fecha_ingreso=$fi,fecha_entrega=$fe,usa_credenciales=$uc,tipo_cuenta=$tc,usuario_cuenta=$ucu,password_cuenta=$pc,monto=$monto,metodo_pago=$mp,porcentaje_transferencia=$pct,conformidad=$conf,conformidad_bloqueada=$cb WHERE id=$id`, {...base,$conf:d.conformidad?1:0,$cb:d.conformidad?1:0,$id:Number(d.id)});
    }
    saveDB();
    return {id:Number(d.id)};
  } else {
    // Aplicamos la misma seguridad para los nuevos trabajos
    db.run(`INSERT INTO trabajos (cliente_id,dispositivo,dispositivo_otro,descripcion,solucion,fecha_ingreso,fecha_entrega,usa_credenciales,tipo_cuenta,usuario_cuenta,password_cuenta,monto,metodo_pago,porcentaje_transferencia,conformidad,conformidad_bloqueada) VALUES ($cid,$dispositivo,$dispositivo_otro,$descripcion,$solucion,$fi,$fe,$uc,$tc,$ucu,$pc,$monto,$mp,$pct,$conf,$cb)`,
      {...base,$cid:Number(d.cliente_id),$conf:d.conformidad?1:0,$cb:d.conformidad?1:0});
    
    const res = queryOne('SELECT last_insert_rowid() as id');
    const insertId = res ? (res.id ?? res['last_insert_rowid()']) : 0;
    
    saveDB();
    return {id:Number(insertId)};
  }
});

ipcMain.handle('delete-trabajo', (_, id) => { run('DELETE FROM trabajos WHERE id=$id',{$id:id}); return {ok:true}; });

ipcMain.handle('get-stats', () => {
  const totalClientes = queryOne('SELECT COUNT(*) as n FROM clientes').n;
  const totalTrabajos = queryOne('SELECT COUNT(*) as n FROM trabajos').n;
  const totalCobrado = queryOne('SELECT SUM(monto) as s FROM trabajos').s || 0;
  const trabajosHoy = queryOne(`SELECT COUNT(*) as n FROM trabajos WHERE DATE(fecha_creacion)=DATE('now','localtime')`).n;
  const trabajosMes = queryOne(`SELECT COUNT(*) as n FROM trabajos WHERE strftime('%Y-%m',fecha_creacion)=strftime('%Y-%m','now','localtime')`).n;
  const clientesHoy = queryOne(`SELECT COUNT(*) as n FROM clientes WHERE DATE(fecha_registro)=DATE('now','localtime')`).n;
  const clientesMes = queryOne(`SELECT COUNT(*) as n FROM clientes WHERE strftime('%Y-%m',fecha_registro)=strftime('%Y-%m','now','localtime')`).n;
  const clientesAnio = queryOne(`SELECT COUNT(*) as n FROM clientes WHERE strftime('%Y',fecha_registro)=strftime('%Y','now','localtime')`).n;
  const pctHoy = totalClientes>0?((clientesHoy/totalClientes)*100).toFixed(1):0;
  const pctMes = totalClientes>0?((clientesMes/totalClientes)*100).toFixed(1):0;
  const pctAnio = totalClientes>0?((clientesAnio/totalClientes)*100).toFixed(1):0;
  return {totalClientes,totalTrabajos,totalCobrado,trabajosHoy,trabajosMes,clientesHoy,clientesMes,clientesAnio,pctHoy,pctMes,pctAnio};
});