const LOGO = 'logo.png';
/* ====== Salón Dorado · Gestión ====== */
const CFG = window.SALON_CONFIG || {};
const FIREBASE_ON = !!(CFG.firebase && CFG.firebase.apiKey);

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const num = v => { if (v === '' || v == null) return 0; const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
const numOrNull = v => (v === '' || v == null) ? null : num(v);
const pct = v => { if (v === '' || v == null) return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
const fmt$ = n => (n < 0 ? '-' : '') + '$ ' + Math.round(Math.abs(n || 0)).toLocaleString('es-AR');
const fmtN = n => (Math.round((n || 0) * 10) / 10).toLocaleString('es-AR', { maximumFractionDigits: 1 });
const fmtP = n => n == null ? '—' : n.toLocaleString('es-AR', { maximumFractionDigits: 2 }) + '%';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const fmtD = s => s ? s.split('-').reverse().join('/') : '';
const ym = s => (s || '').slice(0, 7);
const addMonths = (ymStr, n) => { let [y, m] = ymStr.split('-').map(Number); m += n; y += Math.floor((m - 1) / 12); m = ((m - 1) % 12 + 12) % 12 + 1; return `${y}-${pad(m)}`; };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 86400000);
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const fmtYM = s => s ? MESES[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4) : '';
const fmtYMc = s => s ? MESES[+s.slice(5, 7) - 1].slice(0, 3) + ' ' + s.slice(2, 4) : '';
const dow = s => parseD(s).getDay();
const fmtDL = s => s ? `${DIAS[dow(s)]} ${fmtD(s)}` : '';
const sum = (arr, f = x => x) => arr.reduce((a, x) => a + (num(f(x)) || 0), 0);
/* ---------- feriados de Argentina (Ley 27.399), calculados para cualquier año ---------- */
const FERIADOS_INAMOVIBLES = [['01-01', 'Año Nuevo'], ['03-24', 'Día de la Memoria'], ['04-02', 'Malvinas'], ['05-01', 'Día del Trabajador'], ['05-25', 'Revolución de Mayo'],
  ['06-20', 'Día de la Bandera'], ['07-09', 'Día de la Independencia'], ['12-08', 'Inmaculada Concepción'], ['12-25', 'Navidad']];
// trasladables: si caen martes o miércoles pasan al lunes anterior; jueves o viernes, al lunes siguiente
const FERIADOS_TRASLADABLES = [['06-17', 'Paso a la Inmortalidad de Güemes'], ['08-17', 'Paso a la Inmortalidad de San Martín'], ['10-12', 'Día de la Diversidad Cultural'], ['11-20', 'Día de la Soberanía Nacional']];
// días no laborables con fines turísticos (puentes): los fija el Gobierno cada año por decreto
const FERIADOS_PUENTE = {
  2025: ['2025-05-02', '2025-08-15', '2025-11-21'],
  2026: ['2026-03-23', '2026-07-10', '2026-12-07'],
};
function pascua(y) { // algoritmo de Meeus/Jones/Butcher
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${pad(mes)}-${pad(dia)}`;
}
// feriados calculados automáticamente (sin los cambios hechos a mano): { 'AAAA-MM-DD': 'Nombre' }
function feriadosAuto(y) {
  const r = {}, add = (f, n) => { r[f] = r[f] ? r[f] + ' y ' + n : n; };
  FERIADOS_INAMOVIBLES.forEach(([md, n]) => add(`${y}-${md}`, n));
  const pa = pascua(y);
  add(addDays(pa, -48), 'Carnaval'); add(addDays(pa, -47), 'Carnaval');
  add(addDays(pa, -3), 'Jueves Santo (no laborable)'); add(addDays(pa, -2), 'Viernes Santo');
  FERIADOS_TRASLADABLES.forEach(([md, n]) => {
    const f = `${y}-${md}`, d = dow(f), mov = { 2: -1, 3: -2, 4: 4, 5: 3 }[d] || 0;
    add(addDays(f, mov), n + (mov ? ` (trasladado del ${fmtD(f).slice(0, 5)})` : ''));
  });
  (FERIADOS_PUENTE[y] || []).forEach(f => add(f, 'Puente turístico'));
  return r;
}

/* teléfono: guarda solo dígitos con código país (ej. 5491155554444) */
function normTel(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54') && d.length >= 12) { d = d.slice(2); if (d.startsWith('9')) d = d.slice(1); }
  d = d.replace(/^0/, '');
  if (d.length === 12 && d.startsWith('1115')) d = '11' + d.slice(4); // 11 15 xxxx-xxxx
  if (d.length === 10 && d.startsWith('15')) d = '11' + d.slice(2);    // 15 xxxx-xxxx
  if (d.length === 8) d = '11' + d;                                      // sin característica → CABA
  if (d.length === 10) return '549' + d;
  return d; // otros formatos (exterior) quedan como se cargaron
}
function fmtTel(d) {
  if (!d) return '';
  if (/^54911\d{8}$/.test(d)) return `+54911 ${d.slice(5, 9)}-${d.slice(9)}`;
  if (d.startsWith('549')) return `+549 ${d.slice(3)}`;
  return '+' + d;
}
const waLink = (d, txt = '') => `https://wa.me/${d}${txt ? '?text=' + encodeURIComponent(txt) : ''}`;

/* ---------- valores por defecto ---------- */
const DEFAULT_CONFIG = {
  id: 'general',
  listas: {
    tipos: ['Fiesta de XV', 'Bar Mitzvá', 'Bat Mitzvá', 'Casamiento', 'Corporativo', 'Cumpleaños', 'Aniversario'],
    menus: ['Menú 1 Fiesta XV', 'Menú 1 Bar/Bat', 'Menú sin buffet'],
    principalAdultos: ['Carne', 'Pollo', 'Bondiola', 'Salmón'],
    guarnicionAdultos: ['Papas rústicas', 'Milhojas de papa'],
    principalNinos: ['Suprema de pollo', 'Chicken fingers', 'Milanesa de ternera', 'Muzzarellas a la milanesa', 'Hamburguesa con cheddar'],
    guarnicionNinos: ['Papas noisette', 'Papas bastón', 'Papas rejilla'],
    medios: ['Transferencia', 'Efectivo', 'Dólares (anotado en pesos)', 'Otro'],
    especiales: ['Celíaco (sin TACC)', 'Vegetariano', 'Vegano', 'Kosher (comprado)', 'Lácteo', 'Sin sal', 'Diabético (sin azúcar)', 'Sin lactosa', 'Intolerancia / alergia'],
    centrosMesa: [],
    religiones: ['Católica', 'Judía', 'Evangélica', 'Otra'],
    egresos: ['Alquiler mensual', 'Electricidad', 'ABL', 'Gas', 'Empleados', 'Carnicería', 'Mayorista', 'Pescadería', 'Verdulería', 'Caja chica', 'Arreglos y mantenimiento', 'Remodelaciones', 'Quesos', 'Hielo', 'Congelados', 'Comisiones Juan', 'Pauta', 'Contenido', 'Otros'],
  },
  minimos: { 5: 120 /*sáb*/, 4: 100 /*vie*/, otro: 100 },
  sena: 20,
  reservaSemana: 30,
  mesesCongelado: 1,
  validezPendiente: 10,
  iva: { activoPorDefecto: false, pct: 21 },
  // timings modelo: cada momento empieza a una hora y termina cuando empieza el siguiente
  timings: [
    { id: 'noche', nombre: 'Noche 21.30 a 5 hs', fin: '05:00', items: [
      { hora: '21:30', momento: 'Recepción' }, { hora: '23:00', momento: 'Presentación, Vals, Tanda de música' }, { hora: '00:00', momento: 'Plato Principal' },
      { hora: '00:45', momento: 'Tanda de música' }, { hora: '01:35', momento: 'Postre' }, { hora: '02:20', momento: 'Tanda de música' },
      { hora: '03:10', momento: 'Brindis y Mesa Dulce' }, { hora: '03:50', momento: 'Tanda de música' }, { hora: '04:45', momento: 'Se sirve Final de Fiesta' }] },
    { id: 'barbat-sab', nombre: 'Bar/Bat Mitzvá · sábado noche', fin: '03:30', items: [
      { hora: '20:30', momento: 'Recepción' }, { hora: '22:00', momento: 'Presentación, Tanda de música Judía', nota: 'Video de entrada' }, { hora: '22:30', momento: 'Plato Principal + Homenajes' },
      { hora: '23:15', momento: 'Tanda de música' }, { hora: '00:00', momento: 'Postre + Homenajes' }, { hora: '00:40', momento: 'Velas' },
      { hora: '01:30', momento: 'Brindis y Mesa Dulce' }, { hora: '02:00', momento: 'Tanda de música' }, { hora: '03:00', momento: 'Fin de Fiesta' }] },
    { id: 'barbat-dom', nombre: 'Bar/Bat Mitzvá · domingo mediodía', fin: '19:15', items: [
      { hora: '12:30', momento: 'Recepción' }, { hora: '14:00', momento: 'Presentación, Tanda de música Judía', nota: 'Video de entrada' }, { hora: '14:30', momento: 'Plato Principal + Homenajes' },
      { hora: '15:15', momento: 'Tanda de música' }, { hora: '16:00', momento: 'Postre + Homenajes' }, { hora: '16:40', momento: 'Velas' },
      { hora: '17:20', momento: 'Brindis y Mesa Dulce' }, { hora: '18:00', momento: 'Tanda de música' }, { hora: '18:45', momento: 'Fin de Fiesta' }] },
  ],
  feriadosExtra: [],
  feriadosQuitados: [],
  feriadosNombres: {},
  aniosExtra: [],
  contratoResp: {},   // { email: { nombre, dni } } quién firma por el salón
};
const LISTA_LABELS = {
  tipos: 'Tipos de evento', menus: 'Menús', principalAdultos: 'Plato principal adultos', guarnicionAdultos: 'Guarnición adultos',
  principalNinos: 'Plato principal niños', guarnicionNinos: 'Guarnición niños', medios: 'Medios de pago', especiales: 'Menús especiales', centrosMesa: 'Centros de mesa', religiones: 'Religión / colectividad', egresos: 'Categorías de egresos',
};
// Catálogo inicial de extras (lista de precios enviada por Juan, nov 2026). Costos a completar.
const EXTRAS_INICIALES = [
  ['Pantalla y efectos', 'Pantalla LED todo el evento con VJ + fuegos (chispas) de entrada', 450000, 'Sin VJ la pantalla queda en blackout y solo se pasan los videos principales.'],
  ['Pantalla y efectos', 'Pantalla LED todo el evento con VJ (sin fuegos)', 300000, 'Sin VJ la pantalla queda en blackout y solo se pasan los videos principales.'],
  ['Pantalla y efectos', 'Fuegos (chispas) de entrada', 180000, ''],
  ['Shows', 'Show DJs con 2 bailarines y pistola CO2 (1 carga)', 690000, 'Opcional: entrada con coreo sencilla de un trend de TikTok con los bailarines.'],
  ['Shows', 'Carga extra pistola CO2', 150000, ''],
  ['Shows', 'Show DJs sin bailarines con pistola CO2 humo frío (1 carga)', 520000, ''],
  ['Shows', 'Pistola CO2 humo frío para homenajeada (tanda sobre tarima)', 350000, ''],
  ['Muñecos', 'Muñecos inflables x1', 150000, 'Unicornio, Alien, Pelícano, Dinosaurio.'],
  ['Muñecos', 'Muñecos inflables x2', 250000, 'Unicornio, Alien, Pelícano, Dinosaurio.'],
  ['Muñecos', 'Muñecos inflables x3', 300000, 'Unicornio, Alien, Pelícano, Dinosaurio.'],
  ['Muñecos', 'Muñecos inflables x4', 350000, 'Unicornio, Alien, Pelícano, Dinosaurio.'],
  ['Muñecos', 'Muñecos gigantes (oso rosa y polar)', 750000, ''],
  ['Glitter', 'Stand glitter full', 750000, ''],
  ['Glitter', 'Stand glitter básico', 600000, ''],
  ['Personalización', 'Letras (nombre gigante)', 250000, ''],
  ['Personalización', 'Cartel de LED con nombre', 320000, ''],
  ['Recepción', 'Artistas en recepción (c/u)', 350000, 'Precio por artista.'],
  ['Recepción', 'Cabina de fotos / Espejo / 360 (2 hs)', 400000, ''],
  ['Recepción', 'Shimmer en recepción todo el evento', 300000, ''],
];

/* ---------- datos ---------- */
const COLS = ['clientes', 'eventos', 'ipc', 'extrasCat', 'egresos', 'config'];
const S = {}; COLS.forEach(c => S[c] = {});
const CONF = () => {
  const c = S.config.general || {};
  return { ...DEFAULT_CONFIG, ...c, listas: { ...DEFAULT_CONFIG.listas, ...(c.listas || {}) }, minimos: { ...DEFAULT_CONFIG.minimos, ...(c.minimos || {}) }, iva: { ...DEFAULT_CONFIG.iva, ...(c.iva || {}) } };
};
const clean = o => JSON.parse(JSON.stringify(o));
// agrega opciones nuevas a listas que ya estaban guardadas (una sola vez por migración)
const MIGRACIONES = { ninos2026: { principalNinos: ['Milanesa de ternera', 'Muzzarellas a la milanesa', 'Hamburguesa con cheddar'] } };
function migrarConfig() {
  const g = S.config.general; if (!g) return;
  const hechas = g.migraciones || [], pend = Object.keys(MIGRACIONES).filter(k => !hechas.includes(k));
  if (!pend.length) return;
  const listas = { ...(g.listas || {}) };
  pend.forEach(k => Object.entries(MIGRACIONES[k]).forEach(([lista, items]) => { if (listas[lista]) listas[lista] = [...listas[lista], ...items.filter(i => !listas[lista].includes(i))]; }));
  DB.save('config', { ...g, listas, migraciones: [...hechas, ...pend] });
}

const DB = {
  mode: FIREBASE_ON ? 'firebase' : 'demo',
  user: null, fb: null, onChange: () => { },
  LS_KEY: 'salonDorado.demo.v1', mem: null,

  async init(onChange) {
    this.onChange = onChange;
    if (this.mode === 'demo') {
      let raw = null;
      try { raw = localStorage.getItem(this.LS_KEY); } catch (e) { }
      if (raw) { try { Object.assign(S, JSON.parse(raw)); COLS.forEach(c => S[c] = S[c] || {}); } catch (e) { } }
      else seedDemo();
      migrarConfig();
      return;
    }
    const v = '10.12.2', base = `https://www.gstatic.com/firebasejs/${v}/`;
    const [appM, authM, fsM] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
    const app = appM.initializeApp(CFG.firebase);
    const db = fsM.initializeFirestore(app, { localCache: fsM.persistentLocalCache({ tabManager: fsM.persistentMultipleTabManager() }) });
    const auth = authM.getAuth(app);
    this.fb = { authM, fsM, db, auth, unsubs: [] };
  },
  // Firebase: escucha cambios de sesión
  watchAuth(cb) {
    if (this.mode === 'demo') { this.user = { email: 'demo' }; cb(this.user); return; }
    const { authM, auth } = this.fb;
    authM.onAuthStateChanged(auth, u => {
      this.user = u;
      this.fb.unsubs.forEach(f => f()); this.fb.unsubs = [];
      if (u) this.listen();
      cb(u);
    });
  },
  login(email, pass) { const { authM, auth } = this.fb; return authM.signInWithEmailAndPassword(auth, email, pass); },
  logout() { if (this.mode === 'demo') return; const { authM, auth } = this.fb; return authM.signOut(auth); },
  resetPass(email) { const { authM, auth } = this.fb; return authM.sendPasswordResetEmail(auth, email); },
  listen() {
    const { fsM, db } = this.fb;
    const seen = new Set();
    COLS.forEach(col => {
      const un = fsM.onSnapshot(fsM.collection(db, col), snap => {
        snap.docChanges().forEach(ch => {
          if (ch.type === 'removed') delete S[col][ch.doc.id];
          else S[col][ch.doc.id] = { ...ch.doc.data(), id: ch.doc.id };
        });
        if (!snap.metadata.fromCache && !seen.has(col)) { seen.add(col); if (seen.size === COLS.length) this.afterFirstLoad(); }
        this.onChange(true);
      }, err => { console.error(err); toast('Error de conexión con la base: ' + err.code); });
      this.fb.unsubs.push(un);
    });
  },
  afterFirstLoad() {
    // primera vez: carga el catálogo de extras y la configuración
    if (!S.config.general) this.save('config', { ...clean(DEFAULT_CONFIG), id: 'general', migraciones: Object.keys(MIGRACIONES) });
    else migrarConfig();
    if (!Object.keys(S.extrasCat).length && !(S.config.general || {}).catalogoCargado) {
      EXTRAS_INICIALES.forEach(([grupo, nombre, precio, desc], i) => this.save('extrasCat', { grupo, nombre, precio, costo: null, desc, orden: i, activo: true }, true));
      this.save('config', { ...(S.config.general || clean(DEFAULT_CONFIG)), id: 'general', catalogoCargado: true });
    }
  },
  save(col, obj, silent) {
    if (!obj.id) obj.id = uid();
    obj.actualizado = new Date().toISOString();
    if (this.user && this.user.email) obj.por = this.user.email;
    const data = clean(obj);
    S[col][obj.id] = data;
    if (this.mode === 'demo') this.persist();
    else {
      const { fsM, db } = this.fb;
      fsM.setDoc(fsM.doc(db, col, obj.id), data).catch(e => { console.error(e); toast('No se pudo guardar: ' + e.code); });
    }
    if (!silent) this.onChange(false);
    return obj.id;
  },
  remove(col, id) {
    delete S[col][id];
    if (this.mode === 'demo') this.persist();
    else { const { fsM, db } = this.fb; fsM.deleteDoc(fsM.doc(db, col, id)).catch(e => toast('No se pudo borrar: ' + e.code)); }
    this.onChange(false);
  },
  persist() { try { localStorage.setItem(this.LS_KEY, JSON.stringify(S)); } catch (e) { } },
  resetDemo() { COLS.forEach(c => S[c] = {}); seedDemo(); this.persist(); this.onChange(false); },
};

/* ---------- helpers de dominio ---------- */
const ev = id => S.eventos[id];
const cli = id => S.clientes[id] || {};
const eventosActivos = () => Object.values(S.eventos).filter(e => e.estado !== 'cancelado');
const eventoEnFecha = f => eventosActivos().find(e => e.fecha === f);
const nombreCli = c => [c.nombre, c.apellido].filter(Boolean).join(' ') || '(sin nombre)';
const tipoEv = e => e.tipo === 'Otro' ? (e.tipoOtro || 'Otro') : (e.tipo || '');
const tituloEv = e => `${tipoEv(e)}${e.homenajeado ? ' · ' + e.homenajeado : ''}`;
const minimoPorFecha = f => { const c = CONF(); const d = f ? dow(f) : -1; return d === 6 ? num(c.minimos[5]) : d === 5 ? num(c.minimos[4]) : num(c.minimos.otro); };
// feriados del año con los cambios de Configuración (agregados y quitados a mano)
function feriadosAnio(y) {
  const c = CONF(), key = y + '|' + JSON.stringify([c.feriadosExtra, c.feriadosQuitados, c.feriadosNombres]);
  if (feriadosAnio.cache[key]) return feriadosAnio.cache[key];
  const r = feriadosAuto(+y);
  (c.feriadosQuitados || []).forEach(f => delete r[f]);
  (c.feriadosExtra || []).filter(f => f.startsWith(y + '-')).forEach(f => r[f] = (c.feriadosNombres || {})[f] || r[f] || 'Feriado agregado');
  return feriadosAnio.cache[key] = r;
}
feriadosAnio.cache = {};
const nombreFeriado = f => feriadosAnio(f.slice(0, 4))[f] || '';
const esFeriado = f => !!nombreFeriado(f);
function estadoVisual(e) {
  if (e.estado === 'pendiente' && e.vencePendiente && e.vencePendiente < todayISO()) return 'vencido';
  return e.estado;
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  const dl = [...document.querySelectorAll('dialog[open]')].pop(); (dl || document.body).appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ====== cálculos del estado de cuenta ====== */
/*
  Reglas:
  - El mes base (por defecto, el de contratación) tiene el valor base del cubierto.
  - Los primeros N meses siguientes (mesesCongelado) no ajustan; desde ahí ajusta todos los meses,
    salvo que se desmarque un mes puntual. Un mes sin ajuste pierde ese índice (no se acumula).
  - El ajuste del mes M usa el IPC del mes anterior (M-1), que se publica a mediados de M.
    Se puede escribir un % distinto para un mes puntual de un evento.
  - Ajuste compuesto: valor(M) = valor(M-1) × (1 + %/100), redondeado al peso.
  - Cada pago guarda el valor del cubierto con el que se tomó (queda congelado).
    Cubiertos cancelados = parte entera de (pago + saldo a favor previo) / valor; el resto queda a favor en pesos.
  - Cubiertos a facturar: los contratados; con el número final confirmado, máx(mínimo, adultos + 0,5 × niños de 4 a 10).
*/
function cuentaDefaults(e) {
  const c = CONF();
  return {
    valorBase: null, mesBase: ym(e.fechaContratacion || todayISO()), mesesCongelado: c.mesesCongelado,
    minimo: minimoPorFecha(e.fecha), cubiertosIniciales: minimoPorFecha(e.fecha), reservaSemana: c.reservaSemana,
    iva: { activo: !!c.iva.activoPorDefecto, pct: c.iva.pct }, ajustes: {}, pagos: [],
    final: { adultos: null, ninos: null, menores: null, confirmado: false },
  };
}
function getCuenta(e) {
  const d = cuentaDefaults(e), c = e.cuenta || {};
  return { ...d, ...c, iva: { ...d.iva, ...(c.iva || {}) }, final: { ...d.final, ...(c.final || {}) }, ajustes: c.ajustes || {}, pagos: c.pagos || [] };
}

function calcCuenta(e, hoy = todayISO()) {
  const c = getCuenta(e);
  const base = num(c.valorBase);
  const desde = c.mesBase || ym(e.fecha);
  const hasta = ym(e.fecha) < desde ? desde : ym(e.fecha);
  const congel = num(c.mesesCongelado);
  const meses = []; let valor = base, m = desde, i = 0;
  while (m <= hasta && i < 120) {
    const aj = c.ajustes[m] || {};
    let aplica = false, p = null, pend = false, manual = false;
    if (i > 0) {
      aplica = aj.aplica !== undefined ? !!aj.aplica : i > congel;
      if (aplica) {
        if (aj.pct !== undefined && aj.pct !== null && aj.pct !== '') { p = num(aj.pct); manual = true; }
        else { const r = S.ipc[addMonths(m, -1)]; p = r && r.valor !== null && r.valor !== undefined && r.valor !== '' ? num(r.valor) : null; }
        if (p === null) pend = true; else valor = Math.round(valor * (1 + p / 100));
      }
    }
    meses.push({ mes: m, i, aplica, pct: p, pend, manual, valor, ipcDe: addMonths(m, -1) });
    m = addMonths(m, 1); i++;
  }
  const valorEnMes = mes => { if (!meses.length) return base; if (mes <= meses[0].mes) return meses[0].valor; const r = meses.find(x => x.mes === mes); return r ? r.valor : meses[meses.length - 1].valor; };
  const mesHoy = ym(hoy);
  const valorHoy = valorEnMes(mesHoy);
  const ipcPendienteHoy = !!(meses.find(x => x.mes === mesHoy) || {}).pend;

  // pagos de cubiertos
  const pagos = [...c.pagos].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.creado || '').localeCompare(b.creado || ''));
  let credito = 0, acum = 0, montoCub = 0, montoIva = 0;
  const pagosCalc = pagos.map(p => {
    const r = { ...p };
    if (p.tipo === 'iva') { montoIva += num(p.monto); r.cubiertos = 0; r.credito = credito; return r; }
    const v = num(p.valor);
    credito += num(p.monto); montoCub += num(p.monto);
    const n = v > 0 ? Math.floor(credito / v + 1e-9) : 0;
    credito = Math.round(credito - n * v);
    acum += n;
    r.cubiertos = n; r.credito = credito; r.acum = acum;
    return r;
  });

  const f = c.final;
  const equivFinal = num(f.adultos) + 0.5 * num(f.ninos);
  const facturar = f.confirmado ? Math.max(num(c.minimo), equivFinal) : num(c.cubiertosIniciales || c.minimo);
  const pendientes = Math.round((facturar - acum) * 10) / 10;
  let montoPendiente = 0, aFavor = 0, cubAFavor = 0;
  if (pendientes > 0) {
    const bruto = Math.round(pendientes * valorHoy);
    montoPendiente = Math.max(0, bruto - credito);
    aFavor = Math.max(0, credito - bruto);
  } else {
    cubAFavor = -pendientes;
    // valoriza los cubiertos de más con los valores de los últimos pagos (a los que se congelaron)
    let resto = cubAFavor, val = 0;
    for (let k = pagosCalc.length - 1; k >= 0 && resto > 0; k--) {
      const p = pagosCalc[k]; if (p.tipo === 'iva' || !p.cubiertos) continue;
      const t = Math.min(resto, p.cubiertos); val += t * num(p.valor); resto -= t;
    }
    aFavor = Math.round(val + credito);
  }
  const reservaSemana = num(c.reservaSemana);
  const antesSemana = Math.max(0, pendientes - reservaSemana);

  // IVA sobre cubiertos (opcional por evento)
  const ivaOn = !!c.iva.activo, ivaPct = num(c.iva.pct);
  const baseIva = Math.max(0, montoCub - credito) + montoPendiente + (pendientes > 0 ? 0 : 0);
  const ivaTotal = ivaOn ? Math.round(baseIva * ivaPct / 100) : 0;
  const ivaPendiente = ivaOn ? Math.max(0, ivaTotal - montoIva) : 0;

  // pagos por mes (para el cuadro mensual)
  const porMes = {};
  pagosCalc.forEach(p => { const k = ym(p.fecha); porMes[k] = porMes[k] || { monto: 0, cubiertos: 0, iva: 0 }; if (p.tipo === 'iva') porMes[k].iva += num(p.monto); else { porMes[k].monto += num(p.monto); porMes[k].cubiertos += p.cubiertos; } });
  let ac = 0;
  // pagos anteriores al mes base se suman al primer mes
  Object.keys(porMes).filter(k => k < desde).forEach(k => ac += porMes[k].cubiertos);
  meses.forEach(r => { const pm = porMes[r.mes] || { monto: 0, cubiertos: 0, iva: 0 }; r.pagado = pm.monto; r.cubPagados = pm.cubiertos; ac += pm.cubiertos; r.acum = ac; r.pendientes = Math.round((facturar - ac) * 10) / 10; });

  return {
    c, base, desde, hasta, meses, valorHoy, valorEnMes, ipcPendienteHoy, pagos: pagosCalc,
    pagados: acum, credito, facturar, equivFinal, pendientes, montoPendiente, aFavor, cubAFavor,
    reservaSemana, antesSemana, montoCub, ivaOn, ivaPct, ivaTotal, montoIva, ivaPendiente,
    sinValor: !base,
  };
}

function calcExtras(e) {
  const lines = (e.extras || []).map(x => {
    const cant = num(x.cantidad) || 1;
    const total = x.regalo ? 0 : Math.round(num(x.precio) * cant);
    const pagado = sum(x.pagos || [], p => p.monto);
    const costo = Math.round(num(x.costo) * cant);
    return { ...x, cant, total, pagado, saldo: total - pagado, costoTotal: costo };
  });
  return {
    lines,
    total: sum(lines, l => l.total), pagado: sum(lines, l => l.pagado), saldo: sum(lines, l => l.saldo),
    costo: sum(lines, l => l.costoTotal), sinContratar: lines.filter(l => !l.contratado).length,
  };
}

/* medios de pago: un pago puede combinar dos medios (p.medios = [{medio, monto}, {medio, monto}]) */
const medioTxt = p => (p.medios && p.medios.length > 1) ? p.medios.map(x => `${x.medio || '—'} ${fmt$(x.monto)}`).join(' + ') : (p.medio || '');
function camposMedios(p, montoLabel) {
  const L = CONF().listas.medios, comb = !!(p.medios && p.medios.length > 1);
  const lista = v => L.includes(v) || !v ? L : [...L, v];
  const m1 = comb ? p.medios[0] : { medio: p.medio, monto: p.monto };
  const m2 = comb ? p.medios[1] : { medio: L.find(x => x !== m1.medio) || '', monto: '' };
  return F.chk('combinar', 'Combinar dos medios de pago (ej.: parte en efectivo y parte por transferencia)', comb, 'full id="pComb"') +
    `<label class="f"><span id="pMontoLbl" data-l="${esc(montoLabel)}">${montoLabel}</span><input name="monto" id="pMonto" inputmode="decimal" value="${m1.monto === null || m1.monto === undefined ? '' : esc(m1.monto)}"></label>` +
    F.sel('medio', 'Medio', lista(m1.medio), m1.medio) +
    `<div class="full fgrid" id="comb2" style="grid-template-columns:1fr 1fr">` +
    F.num('monto2', 'Monto con el segundo medio (ARS)', m2.monto, 'id="pMonto2"') + F.sel('medio2', 'Segundo medio', lista(m2.medio), m2.medio) +
    `<div class="full" id="combTot"></div></div>`;
}
function bindMedios(form) {
  const u = () => {
    const on = $('#pComb', form).checked, lbl = $('#pMontoLbl', form);
    $('#comb2', form).style.display = on ? '' : 'none';
    lbl.textContent = on ? 'Monto con el primer medio (ARS)' : lbl.dataset.l;
    if (on) { const d = readForm(form); $('#combTot', form).innerHTML = `<div class="alert info">Total del pago: <b>${fmt$(num(d.monto) + num(d.monto2))}</b> = ${esc(d.medio)} ${fmt$(num(d.monto))} + ${esc(d.medio2)} ${fmt$(num(d.monto2))}</div>`; }
  };
  form.addEventListener('input', u); form.addEventListener('change', u); u();
}
// arma { monto total, medio, medios } a partir del formulario
function leerMedios(d) {
  if (!d.combinar || !num(d.monto2)) return { monto: num(d.monto), medio: d.medio, medios: null };
  const medios = [{ medio: d.medio, monto: num(d.monto) }, { medio: d.medio2, monto: num(d.monto2) }];
  return { monto: medios[0].monto + medios[1].monto, medio: medios.map(x => x.medio).join(' + '), medios };
}

/* resumen de un evento para listados */
function resumenEv(e) {
  const k = calcCuenta(e), x = calcExtras(e);
  return { k, x, pendiente: k.montoPendiente + k.ivaPendiente + Math.max(0, x.saldo) };
}

/* ====== interfaz: router, layout, formularios ====== */
let MODAL_OPEN = 0, PENDING_RENDER = false, SHELL = false;

const F = {
  text: (n, l, v = '', a = '') => `<label class="f ${a.includes('full') ? 'full' : ''}"><span>${l}</span><input name="${n}" value="${esc(v)}" ${a.replace('full', '')}></label>`,
  num: (n, l, v = '', a = '') => `<label class="f ${a.includes('full') ? 'full' : ''}"><span>${l}</span><input name="${n}" inputmode="decimal" value="${v === null || v === undefined ? '' : esc(v)}" ${a.replace('full', '')}></label>`,
  date: (n, l, v = '', a = '') => `<label class="f"><span>${l}</span><input type="date" name="${n}" value="${esc(v)}" ${a}></label>`,
  month: (n, l, v = '', a = '') => `<label class="f"><span>${l}</span><input type="month" name="${n}" value="${esc(v)}" ${a}></label>`,
  area: (n, l, v = '', a = '') => `<label class="f full"><span>${l}</span><textarea name="${n}" ${a}>${esc(v)}</textarea></label>`,
  sel: (n, l, opts, v = '', a = '') => `<label class="f ${a.includes('full') ? 'full' : ''}"><span>${l}</span><select name="${n}" ${a.replace('full', '')}>${opts.map(o => { const [val, txt] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v ?? '') ? 'selected' : ''}>${esc(txt)}</option>`; }).join('')}</select></label>`,
  chk: (n, l, v, a = '') => `<label class="chk ${a.includes('full') ? 'full' : ''}"><input type="checkbox" name="${n}" ${v ? 'checked' : ''} ${a.replace('full', '')}> ${l}</label>`,
  sep: t => `<div class="sep">${t}</div>`,
  hint: t => `<div class="hint full">${t}</div>`,
};
const opts = (list, empty = '— elegir —') => [['', empty], ...list];

function readForm(form) {
  const o = {};
  $$('[name]', form).forEach(el => { o[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
  return o;
}

function modal({ title, body, submit = 'Guardar', onSubmit, onOpen, danger, wide }) {
  const d = document.createElement('dialog');
  if (wide) d.style.maxWidth = '900px';
  d.innerHTML = `<form novalidate><div class="m-h"><h2>${title}</h2><button type="button" class="btn-sm" data-x>✕</button></div>
    <div class="fgrid">${body}</div>
    <div class="m-f">${danger ? `<button type="button" class="btn-danger" data-del style="margin-right:auto">${danger.label}</button>` : ''}
    <button type="button" data-x>Cancelar</button>${submit ? `<button class="btn-primary" type="submit">${submit}</button>` : ''}</div></form>`;
  document.body.appendChild(d);
  const form = $('form', d);
  const close = () => { d.close(); d.remove(); MODAL_OPEN = Math.max(0, MODAL_OPEN - 1); if (PENDING_RENDER) render(); };
  $$('[data-x]', d).forEach(b => b.onclick = close);
  d.addEventListener('cancel', e => { e.preventDefault(); close(); });
  form.onsubmit = e => { e.preventDefault(); const r = onSubmit && onSubmit(readForm(form), form); if (r !== false) close(); };
  if (danger) $('[data-del]', d).onclick = () => { close(); confirmar(danger.confirm, danger.fn); };
  MODAL_OPEN++; d.showModal();
  if (onOpen) onOpen(form);
  return { d, form, close };
}

function confirmar(msg, fn) {
  modal({ title: 'Confirmar', body: `<p class="full" style="margin:0">${esc(msg)}</p>`, submit: 'Sí, continuar', onSubmit: () => { setTimeout(fn, 0); } });
}

/* ---------- router ---------- */
const NAV = [
  ['inicio', 'Inicio'], ['calendario', 'Calendario'], ['eventos', 'Eventos'], ['clientes', 'Clientes'],
  ['ipc', 'Índices IPC'], ['extras', 'Catálogo de extras'], ['egresos', 'Egresos'], ['metricas', 'Métricas'], ['config', 'Configuración'],
];
const go = h => { location.hash = '#/' + h; };
function route() { const h = decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'inicio'; const [view, ...args] = h.split('/'); return { view, args }; }

const VIEWS = {};
/* ---------- tema claro / oscuro (se recuerda en cada dispositivo) ---------- */
const TEMA_KEY = 'salonDorado.tema';
function temaGuardado() { try { return localStorage.getItem(TEMA_KEY); } catch (e) { return null; } }
function temaActual() { return temaGuardado() || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); }
function aplicarTema() {
  const t = temaActual();
  document.documentElement.dataset.theme = t;
  const mc = document.querySelector('meta[name=theme-color]'); if (mc) mc.content = t === 'dark' ? '#1b1a18' : '#2b2a28';
  const b = document.getElementById('tema'); if (b) b.textContent = t === 'dark' ? '☀️ Modo claro' : '🌙 Modo oscuro';
}
function cambiarTema() {
  try { localStorage.setItem(TEMA_KEY, temaActual() === 'dark' ? 'light' : 'dark'); } catch (e) { }
  aplicarTema();
}
aplicarTema();
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!temaGuardado()) aplicarTema(); });

/* ---------- nombre para el saludo de Inicio ---------- */
function nombreUsuario() {
  const u = DB.user || {}, em = (u.email || '').toLowerCase();
  const nombres = CONF().nombres || {};
  if (nombres[em]) return nombres[em];
  if (em.startsWith('anibal')) return 'Anibal';
  if (em.startsWith('juan')) return 'Juan';
  return u.displayName || '';
}

function render() {
  if (MODAL_OPEN) { PENDING_RENDER = true; return; }
  PENDING_RENDER = false;
  const root = $('#root');
  if (DB.mode === 'firebase' && !DB.user) { SHELL = false; return renderLogin(root); }
  if (!SHELL) {
    root.innerHTML = `<div class="app"><nav class="side"><img src="${LOGO}" alt="Salón Dorado">
      ${NAV.map(([k, t]) => `<a href="#/${k}" data-nav="${k}">${t}</a>`).join('')}
      <a href="#" id="tema" class="tema-btn"></a>
      <div class="user">${DB.mode === 'demo' ? 'Modo demostración' : esc(DB.user.email) + ' · <a href="#" id="logout" style="display:inline;padding:0">Salir</a>'}</div></nav>
      <main id="main"></main></div>`;
    SHELL = true;
    const lo = $('#logout'); if (lo) lo.onclick = e => { e.preventDefault(); DB.logout(); };
    $('#tema').onclick = e => { e.preventDefault(); cambiarTema(); };
    aplicarTema();
  }
  const { view, args } = route();
  const navKey = { evento: 'eventos', cliente: 'clientes', imprimir: 'eventos', orden: 'eventos', timing: 'eventos', contrato: 'eventos' }[view] || view;
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === navKey));
  const main = $('#main');
  const fn = VIEWS[view] || VIEWS.inicio;
  const y = window.scrollY;
  main.innerHTML = (DB.mode === 'demo' ? `<div class="demo-banner no-print"><b>Modo demostración:</b> los datos son de ejemplo y se guardan solo en este navegador. En la app instalada se entra con usuario y clave, todo se guarda en la nube, y funcionan la impresión y la descarga del Excel. <a href="#" id="resetDemo">Restablecer datos de ejemplo</a></div>` : '') + fn(...args);
  const rd = $('#resetDemo'); if (rd) rd.onclick = e => { e.preventDefault(); confirmar('¿Volver a los datos de ejemplo? Se pierde lo cargado en la demo.', () => DB.resetDemo()); };
  if (fn.after) fn.after(...args);
  if (render._last === location.hash) window.scrollTo(0, y); else window.scrollTo(0, 0);
  render._last = location.hash;
}
window.addEventListener('hashchange', render);
document.addEventListener('focusout', () => { if (PENDING_RENDER && !MODAL_OPEN) setTimeout(() => { if (!document.activeElement || !document.activeElement.closest('#main input,#main select,#main textarea')) render(); }, 50); });

function onDataChange(remote) {
  if (remote && document.activeElement && document.activeElement.closest('#main input,#main select,#main textarea')) { PENDING_RENDER = true; return; }
  clearTimeout(onDataChange.t); onDataChange.t = setTimeout(render, remote ? 60 : 0);
}

function renderLogin(root) {
  root.innerHTML = `<div class="login"><div class="box"><img src="${LOGO}" alt="Salón Dorado">
    <form id="lf"><label class="f"><span>Email</span><input name="email" type="email" autocomplete="username" required></label>
    <label class="f"><span>Clave</span><input name="pass" type="password" autocomplete="current-password" required></label>
    <button class="btn-primary" type="submit" style="justify-content:center">Ingresar</button>
    <a href="#" id="olv" class="small center">Olvidé mi clave</a><div id="lerr" class="small" style="color:var(--rojo)"></div></form></div></div>`;
  $('#lf').onsubmit = async e => {
    e.preventDefault(); const f = readForm(e.target);
    try { await DB.login(f.email, f.pass); } catch (err) { $('#lerr').textContent = 'Email o clave incorrectos.'; }
  };
  $('#olv').onclick = async e => {
    e.preventDefault(); const em = $('[name=email]').value.trim(); if (!em) { $('#lerr').textContent = 'Escribí tu email arriba.'; return; }
    try { await DB.resetPass(em); $('#lerr').textContent = 'Te enviamos un mail para cambiar la clave.'; } catch (err) { $('#lerr').textContent = 'No se pudo enviar el mail.'; }
  };
}

/* delegación de clicks: data-go="ruta" */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-go]');
  if (t && !e.target.closest('a,button,input,select,label') ) { go(t.dataset.go); }
  else if (t && t.tagName === 'BUTTON') { go(t.dataset.go); }
});
const badgeEstado = e => { const s = estadoVisual(e); return `<span class="badge b-${s === 'vencido' ? 'pendiente' : s}">${{ reservado: 'Reservado', pendiente: 'Pendiente', cancelado: 'Cancelado', vencido: 'Pendiente vencido' }[s] || s}</span>`; };

/* ====== vistas: inicio, calendario, eventos, clientes ====== */

/* ---------- INICIO ---------- */
VIEWS.inicio = () => {
  const hoy = todayISO(), act = eventosActivos();
  const proximos = act.filter(e => e.estado === 'reservado' && e.fecha >= hoy && e.fecha <= addDays(hoy, 60)).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const pend = act.filter(e => e.estado === 'pendiente' && e.fecha >= hoy).sort((a, b) => (a.vencePendiente || '9').localeCompare(b.vencePendiente || '9'));
  const aniv = Object.values(S.eventos).filter(e => e.estado === 'reservado' && !e.aniversarioSaludado && e.fecha < hoy).map(e => ({ e, a: addMonths(ym(e.fecha), 12) + e.fecha.slice(7) })).filter(({ a }) => daysBetween(hoy, a) <= 21 && daysBetween(hoy, a) >= -10).sort((x, y) => x.a.localeCompare(y.a));
  const ipcAnt = addMonths(ym(hoy), -1);
  const faltaIpc = +hoy.slice(8) >= 12 && !(S.ipc[ipcAnt] && S.ipc[ipcAnt].valor !== null && S.ipc[ipcAnt].valor !== undefined && S.ipc[ipcAnt].valor !== '');
  const sinProv = act.filter(e => e.estado === 'reservado' && e.fecha >= hoy && e.fecha <= addDays(hoy, 30)).flatMap(e => calcExtras(e).lines.filter(l => !l.contratado).map(l => ({ e, l })));
  const anioRes = act.filter(e => e.estado === 'reservado' && e.fecha.startsWith(hoy.slice(0, 4))).length;
  const sigRes = act.filter(e => e.estado === 'reservado' && e.fecha.startsWith(String(+hoy.slice(0, 4) + 1))).length;
  const quien = nombreUsuario();
  return `<div class="top"><h1>${quien ? `¡Hola ${esc(quien)}!` : '¡Hola!'}</h1>
    <div class="actions"><button class="btn-primary" id="nuevoEv">+ Nuevo evento</button></div></div>
  ${faltaIpc ? `<div class="alert warn">Falta cargar el IPC de <b>${fmtYM(ipcAnt)}</b>. Sin ese dato los ajustes de este mes quedan pendientes. <a href="#/ipc">Cargar IPC</a></div>` : ''}
  <div class="cards">
    <div class="card"><div class="k">Eventos reservados ${hoy.slice(0, 4)}</div><div class="v">${anioRes}</div></div>
    <div class="card"><div class="k">Reservados ${+hoy.slice(0, 4) + 1}</div><div class="v">${sigRes}</div></div>
    <div class="card ${pend.length ? 'warn' : ''}"><div class="k">Pendientes de reserva</div><div class="v">${pend.length}</div></div>
    <div class="card"><div class="k">Próximos 60 días</div><div class="v">${proximos.length}</div></div>
  </div>
  <div class="grid2">
    <div class="panel"><div class="panel-h"><h2>Próximos eventos</h2><a href="#/calendario">Ver calendario</a></div>
      ${proximos.length ? `<ul class="list-clean">${proximos.map(e => { const r = resumenEv(e); return `<li data-go="evento/${e.id}" style="cursor:pointer"><div><b>${fmtDL(e.fecha)}</b> · ${esc(tituloEv(e))}<div class="small muted">${esc(nombreCli(cli(e.clienteId)))} · faltan ${daysBetween(hoy, e.fecha)} días</div></div><div class="right small">${r.k.pendientes > 0 ? `${fmtN(r.k.pendientes)} cub. pend.` : '<span class="badge b-ok">Cubiertos al día</span>'}${r.x.saldo > 0 ? `<br>Extras: ${fmt$(r.x.saldo)}` : ''}</div></li>`; }).join('')}</ul>` : '<p class="muted">No hay eventos en los próximos 60 días.</p>'}
    </div>
    <div class="panel"><div class="panel-h"><h2>Pendientes de reserva</h2></div>
      ${pend.length ? `<ul class="list-clean">${pend.map(e => { const v = e.vencePendiente; const venc = v && v < hoy; return `<li data-go="evento/${e.id}" style="cursor:pointer"><div><b>${fmtD(e.fecha)}</b> · ${esc(nombreCli(cli(e.clienteId)))}<div class="small muted">${esc(tipoEv(e))}</div></div><div class="small ${venc ? '' : 'muted'}">${v ? (venc ? `<span class="badge b-bad">Venció ${fmtD(v)}</span>` : `Vence ${fmtD(v)}`) : ''}</div></li>`; }).join('')}</ul>` : '<p class="muted">Nada pendiente.</p>'}
    </div>
    <div class="panel"><div class="panel-h"><h2>Primer aniversario</h2></div>
      <p class="small muted" style="margin-top:-6px">Familias que cumplen un año de su fiesta: un buen momento para saludarlas.</p>
      ${aniv.length ? `<ul class="list-clean">${aniv.map(({ e, a }) => { const c = cli(e.clienteId); const txt = `¡Hola ${c.nombre || ''}! Hoy se cumple un año de ${e.homenajeado ? 'la fiesta de ' + e.homenajeado : 'su fiesta'} en Salón Dorado. ¡Qué lindo fue compartirla con ustedes! Les mandamos un abrazo grande.`; return `<li><div><b>${fmtD(a)}</b> · ${esc(tituloEv(e))}<div class="small muted">${esc(nombreCli(c))}</div></div><div class="actions" style="display:flex;gap:6px">${c.celular ? `<a class="btn btn-sm btn-wa" target="_blank" href="${waLink(c.celular, txt)}">WhatsApp</a>` : ''}<button class="btn-sm" data-saludado="${e.id}">Listo</button></div></li>`; }).join('')}</ul>` : '<p class="muted">No hay aniversarios en las próximas 3 semanas.</p>'}
    </div>
    <div class="panel"><div class="panel-h"><h2>Extras sin contratar al proveedor</h2></div>
      <p class="small muted" style="margin-top:-6px">Eventos de los próximos 30 días.</p>
      ${sinProv.length ? `<ul class="list-clean">${sinProv.map(({ e, l }) => `<li data-go="evento/${e.id}" style="cursor:pointer"><div>${esc(l.nombre)}<div class="small muted">${fmtD(e.fecha)} · ${esc(nombreCli(cli(e.clienteId)))}</div></div><span class="badge b-warn">Sin contratar</span></li>`).join('')}</ul>` : '<p class="muted">Todo contratado.</p>'}
    </div>
  </div>`;
};
VIEWS.inicio.after = () => {
  $('#nuevoEv').onclick = () => formEvento();
  $$('[data-saludado]').forEach(b => b.onclick = () => { const e = ev(b.dataset.saludado); DB.save('eventos', { ...e, aniversarioSaludado: true }); toast('Marcado como saludado'); });
};

/* ---------- CALENDARIO ---------- */
VIEWS.calendario = (anio) => {
  const y0 = new Date().getFullYear();
  const y = +(anio || y0);
  const yearsData = [...new Set(Object.values(S.eventos).map(e => +e.fecha.slice(0, 4)))].filter(v => v < y0);
  const years = [...new Set([...yearsData, ...aniosCalendario(), y])].sort();
  const hoy = todayISO();
  const porFecha = {};
  eventosActivos().forEach(e => porFecha[e.fecha] = e);
  let html = `<div class="top"><h1>Calendario ${y}</h1><div class="actions"><div class="year-tabs">${years.map(v => `<a href="#/calendario/${v}" class="${v === y ? 'on' : ''}">${v}</a>`).join('')}</div><button id="addAnio" title="Agrega el año siguiente con sus feriados">+ Agregar año</button></div></div>
  <div class="panel"><div class="panel-h"><div class="legend"><span><i style="background:var(--rojo)"></i>Reservado</span><span><i style="background:var(--amarillo)"></i>Pendiente de reserva</span><span><i style="background:var(--verde-soft);border:1px solid #9fcca5"></i>Disponible (vie, sáb, dom y feriados)</span><span><i style="background:var(--gris)"></i>Lunes a jueves</span><span><i style="background:#7d4f25;border-radius:50%;width:7px;height:7px"></i>Feriado</span></div>
  <div class="small muted">${countAnio(y)}</div></div><div class="cal">`;
  for (let m = 0; m < 12; m++) {
    const first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
    const off = (first.getDay() + 6) % 7; // semana empieza lunes
    html += `<div class="month"><h3>${MESES[m]}</h3><div class="mgrid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<div class="dow">${d}</div>`).join('')}`;
    for (let i = 0; i < off; i++) html += '<div class="day empty"></div>';
    for (let d = 1; d <= days; d++) {
      const f = `${y}-${pad(m + 1)}-${pad(d)}`, wd = dow(f), e = porFecha[f];
      const fer = esFeriado(f);
      let cls = (wd === 5 || wd === 6 || wd === 0 || fer) ? 'free' : 'wk';
      let tip = fmtDL(f) + (fer ? ' · ' + nombreFeriado(f) : '');
      if (e) { cls = e.estado === 'reservado' ? 'res' : 'pen' + (estadoVisual(e) === 'vencido' ? ' venc' : ''); tip += ' · ' + nombreCli(cli(e.clienteId)) + ' · ' + tipoEv(e); }
      if (fer) cls += ' hol'; if (f === hoy) cls += ' today'; if (f < hoy) cls += ' pastday';
      html += `<div class="day ${cls}" title="${esc(tip)}" data-day="${f}">${d}</div>`;
    }
    html += '</div></div>';
  }
  const fers = Object.entries(feriadosAnio(y)).sort((a, b) => a[0].localeCompare(b[0]));
  const cargoAMano = (CONF().feriadosExtra || []).some(f => f.startsWith(y + '-'));
  const avisoPuente = FERIADOS_PUENTE[y] || cargoAMano ? '' : `<p class="small" style="color:var(--rojo)">Los puentes turísticos de ${y} todavía no están cargados. Cuando el Gobierno los anuncie, agregalos con <b>Editar feriados</b>.</p>`;
  return html + `</div></div><p class="small muted">Tocá un día libre para cargar un evento, o un día ocupado para ver la ficha y el estado de cuenta.</p>
  <div class="panel"><div class="panel-h"><h2>Feriados ${y}</h2><button id="edFerAnio">Editar feriados</button></div>${avisoPuente}
  <table><tbody>${fers.map(([f, n]) => `<tr><td style="white-space:nowrap">${fmtDL(f)}</td><td>${esc(n)}</td></tr>`).join('')}</tbody></table></div>`;
};
// años que se muestran en el calendario: el actual, los dos siguientes y los que se agregaron a mano
function aniosCalendario() {
  const y0 = new Date().getFullYear();
  return [...new Set([y0, y0 + 1, y0 + 2, ...(CONF().aniosExtra || []).map(Number)])].sort();
}
function formFeriadosAnio(y) {
  const c = CONF(), auto = feriadosAuto(y), quit = c.feriadosQuitados || [], nombres = c.feriadosNombres || {};
  const autoF = Object.keys(auto).sort();
  const extras = (c.feriadosExtra || []).filter(f => f.startsWith(y + '-') && !auto[f]).sort();
  modal({
    title: 'Feriados ' + y, wide: true,
    body: F.hint('Destildá un feriado si el Gobierno lo cambió. Abajo agregá los que falten (puentes turísticos, feriados nuevos o trasladados por decreto).') +
      autoF.map(f => F.chk('a_' + f, `${fmtDL(f)} · ${esc(auto[f])}`, !quit.includes(f), 'full')).join('') +
      F.area('extra', 'Feriados agregados a mano · uno por renglón: DD/MM/AAAA y el nombre (opcional)', extras.map(f => fmtD(f) + (nombres[f] ? ' ' + nombres[f] : '')).join('\n'), 'placeholder="15/08/' + y + ' Puente turístico" style="min-height:120px"'),
    onSubmit: d => {
      const nuevos = [], nuevosNom = {};
      for (const linea of d.extra.split(/\n+/).map(s => s.trim()).filter(Boolean)) {
        const m = linea.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(.*)$/);
        if (!m) { toast('No entendí la fecha "' + linea + '". Usá DD/MM/AAAA.'); return false; }
        const f = `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
        if (!m[3].startsWith(String(y))) { toast('La fecha ' + fmtD(f) + ' no es de ' + y + '.'); return false; }
        nuevos.push(f); if (m[4]) nuevosNom[f] = m[4];
      }
      const otrosExtra = (c.feriadosExtra || []).filter(f => !f.startsWith(y + '-') || auto[f]);
      const otrosNom = Object.fromEntries(Object.entries(nombres).filter(([f]) => !f.startsWith(y + '-')));
      const quitados = [...quit.filter(f => !f.startsWith(y + '-')), ...autoF.filter(f => !d['a_' + f])];
      DB.save('config', { ...(S.config.general || clean(DEFAULT_CONFIG)), id: 'general', feriadosExtra: [...otrosExtra, ...nuevos], feriadosNombres: { ...otrosNom, ...nuevosNom }, feriadosQuitados: quitados });
      toast('Feriados de ' + y + ' guardados');
    },
  });
}
function countAnio(y) { const a = eventosActivos().filter(e => e.fecha.startsWith(y)); return `${a.filter(e => e.estado === 'reservado').length} reservados · ${a.filter(e => e.estado === 'pendiente').length} pendientes`; }
VIEWS.calendario.after = (anio) => {
  const y = +(anio || new Date().getFullYear());
  $('#addAnio').onclick = () => {
    const nuevo = Math.max(...aniosCalendario(), y) + 1, g = S.config.general || clean(DEFAULT_CONFIG);
    DB.save('config', { ...g, id: 'general', aniosExtra: [...new Set([...(g.aniosExtra || []), nuevo])] }, true);
    toast('Se agregó ' + nuevo + ' con sus feriados'); go('calendario/' + nuevo);
  };
  $('#edFerAnio').onclick = () => formFeriadosAnio(y);
  $$('[data-day]').forEach(d => d.onclick = () => { const e = eventoEnFecha(d.dataset.day); if (e) go('evento/' + e.id); else formEvento(null, { fecha: d.dataset.day }); });
};

/* ---------- LISTA DE EVENTOS ---------- */
let FILTRO_EV = { anio: 'proximos', estado: '', q: '' };
VIEWS.eventos = () => {
  const y0 = new Date().getFullYear();
  const years = [...new Set([...Object.values(S.eventos).map(e => e.fecha.slice(0, 4)), ...aniosCalendario().map(String)])].sort().reverse();
  return `<div class="top"><h1>Eventos</h1><div class="actions"><button id="xls">Descargar base en Excel</button><button class="btn-primary" id="nuevoEv">+ Nuevo evento</button></div></div>
  <div class="panel"><div class="filters">
    <select id="fAnio"><option value="proximos">Próximos</option><option value="todos">Todos</option>${years.map(y => `<option>${y}</option>`).join('')}</select>
    <select id="fEstado"><option value="">Todos los estados</option><option value="reservado">Reservados</option><option value="pendiente">Pendientes</option><option value="cancelado">Cancelados</option></select>
    <input id="fQ" placeholder="Buscar nombre, homenajeado, celular…" style="min-width:240px">
  </div></div>
  <div class="panel tbl-wrap" id="tblEv"></div>`;
};
VIEWS.eventos.after = () => {
  $('#nuevoEv').onclick = () => formEvento();
  $('#xls').onclick = exportarExcel;
  $('#fAnio').value = FILTRO_EV.anio; $('#fEstado').value = FILTRO_EV.estado; $('#fQ').value = FILTRO_EV.q;
  const upd = () => {
    FILTRO_EV = { anio: $('#fAnio').value, estado: $('#fEstado').value, q: $('#fQ').value.trim().toLowerCase() };
    const hoy = todayISO();
    let list = Object.values(S.eventos);
    if (FILTRO_EV.anio === 'proximos') list = list.filter(e => e.fecha >= hoy);
    else if (FILTRO_EV.anio !== 'todos') list = list.filter(e => e.fecha.startsWith(FILTRO_EV.anio));
    if (FILTRO_EV.estado) list = list.filter(e => e.estado === FILTRO_EV.estado);
    if (FILTRO_EV.q) list = list.filter(e => { const c = cli(e.clienteId); return [c.nombre, c.apellido, c.celular, c.familia, e.homenajeado, tipoEv(e)].join(' ').toLowerCase().includes(FILTRO_EV.q); });
    list.sort((a, b) => FILTRO_EV.anio === 'proximos' ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha));
    $('#tblEv').innerHTML = list.length ? `<table><thead><tr><th>Fecha</th><th>Cliente</th><th>Evento</th><th class="num">Invitados</th><th>Estado</th><th class="num">Cub. pendientes</th><th class="num">Pendiente $ (hoy)</th></tr></thead><tbody>
      ${list.map(e => { const r = resumenEv(e); return `<tr class="click ${e.fecha < hoy ? 'past' : ''}" data-go="evento/${e.id}"><td class="nowrap">${fmtDL(e.fecha)}</td><td>${esc(nombreCli(cli(e.clienteId)))}</td><td>${esc(tituloEv(e))}</td><td class="num">${e.invitados || ''}</td><td>${badgeEstado(e)}</td><td class="num">${e.estado === 'cancelado' ? '' : fmtN(r.k.pendientes)}</td><td class="num">${e.estado === 'cancelado' ? '' : fmt$(r.pendiente)}</td></tr>`; }).join('')}
      </tbody></table><p class="small muted">${list.length} eventos</p>` : '<p class="muted">No hay eventos con esos filtros.</p>';
  };
  ['#fAnio', '#fEstado'].forEach(s => $(s).onchange = upd); $('#fQ').oninput = upd;
  upd();
};

/* ---------- FORMULARIO DE EVENTO ---------- */
function formEvento(id, pre = {}) {
  const e = id ? ev(id) : { estado: 'reservado', fechaContratacion: todayISO(), ...pre };
  const L = CONF().listas;
  const clientes = Object.values(S.clientes).sort((a, b) => nombreCli(a).localeCompare(nombreCli(b)));
  const nuevo = !id;
  const k = id ? getCuenta(e) : null;
  const body = `
    ${F.sel('clienteId', 'Cliente', [['__nuevo', '+ Cliente nuevo'], ...clientes.map(c => [c.id, nombreCli(c) + (c.celular ? ' · ' + fmtTel(c.celular) : '')])], e.clienteId || (pre.clienteId || '__nuevo'), 'full id="selCli"')}
    <div class="full fgrid" id="cliNuevo" style="grid-template-columns:1fr 1fr">
      ${F.text('c_nombre', 'Nombre', '')}${F.text('c_apellido', 'Apellido', '')}
      ${F.text('c_celular', 'Celular', '', 'placeholder="+54911 xxxx-xxxx" inputmode="tel"')}${F.text('c_familia', 'Miembros de la familia', '', 'placeholder="Ej.: Laura (mamá), Diego (papá), Sofi"')}
      ${selReligion('c_religion', '')}
    </div>
    ${F.sep('Evento')}
    ${F.sel('tipo', 'Tipo de evento', opts([...L.tipos, 'Otro']), e.tipo, 'id="selTipo"')}
    ${F.text('tipoOtro', 'Otro tipo (escribilo)', e.tipoOtro, 'id="tipoOtro"')}
    ${F.text('homenajeado', 'Homenajeado/a o novios', e.homenajeado)}
    ${F.date('fecha', 'Fecha del evento', e.fecha, 'required id="fFecha"')}
    ${F.num('invitados', 'Invitados (estimado inicial)', e.invitados)}
    ${F.date('fechaContratacion', 'Fecha en que contrató / consultó', e.fechaContratacion)}
    ${F.sel('estado', 'Estado', [['reservado', 'Reservado (rojo)'], ['pendiente', 'Pendiente de reserva (amarillo)'], ['cancelado', 'Cancelado (libera la fecha)']], e.estado, 'id="selEstado"')}
    <div id="vencBox">${F.date('vencePendiente', 'Vence la reserva pendiente', e.vencePendiente || addDays(todayISO(), CONF().validezPendiente))}</div>
    ${nuevo ? F.sep('Cubiertos (se puede completar después)') + F.num('valorBase', 'Valor del cubierto (ARS)', '') + F.num('cubiertosIniciales', 'Cubiertos contratados', '', 'id="cubIni" placeholder="Mínimo según el día"') : ''}
    ${F.area('notas', 'Notas', e.notas)}
    <div class="full small" id="fechaWarn"></div>`;
  modal({
    title: id ? 'Editar evento' : 'Nuevo evento', body,
    danger: id ? { label: 'Eliminar evento', confirm: '¿Eliminar este evento y su estado de cuenta? No se puede deshacer. (Si se canceló, mejor marcalo como Cancelado.)', fn: () => { DB.remove('eventos', id); go('eventos'); } } : null,
    onOpen: form => {
      const sync = () => {
        $('#cliNuevo', form).style.display = $('#selCli', form).value === '__nuevo' ? '' : 'none';
        $('#tipoOtro', form).closest('label').style.display = $('#selTipo', form).value === 'Otro' ? '' : 'none';
        $('#vencBox', form).style.display = $('#selEstado', form).value === 'pendiente' ? '' : 'none';
        const f = $('#fFecha', form).value, w = $('#fechaWarn', form);
        const otro = f && eventosActivos().find(x => x.fecha === f && x.id !== id);
        w.innerHTML = f ? `${fmtDL(f)} · mínimo ${minimoPorFecha(f)} cubiertos${otro ? `<div class="alert bad">Esa fecha ya está ocupada: ${esc(nombreCli(cli(otro.clienteId)))} (${otro.estado}).</div>` : ''}` : '';
        if ($('#cubIni', form)) $('#cubIni', form).placeholder = f ? `Mínimo ${minimoPorFecha(f)}` : 'Mínimo según el día';
      };
      form.addEventListener('change', sync); form.addEventListener('input', sync); sync();
    },
    onSubmit: d => {
      if (!d.fecha) { toast('Falta la fecha del evento.'); return false; }
      const otro = d.estado !== 'cancelado' && eventosActivos().find(x => x.fecha === d.fecha && x.id !== id);
      if (otro) { toast('Esa fecha ya está ocupada por otro evento. Cambiá la fecha o cancelá el otro evento.'); return false; }
      let clienteId = d.clienteId;
      if (clienteId === '__nuevo') {
        if (!d.c_nombre && !d.c_apellido) { toast('Completá el nombre del cliente.'); return false; }
        clienteId = DB.save('clientes', { nombre: d.c_nombre, apellido: d.c_apellido, celular: normTel(d.c_celular), familia: d.c_familia, religion: d.c_religion || '', creado: todayISO() }, true);
      }
      const obj = { ...(e.id ? e : {}), clienteId, tipo: d.tipo, tipoOtro: d.tipo === 'Otro' ? d.tipoOtro : '', homenajeado: d.homenajeado, fecha: d.fecha, invitados: numOrNull(d.invitados), fechaContratacion: d.fechaContratacion, estado: d.estado, vencePendiente: d.estado === 'pendiente' ? d.vencePendiente : '', notas: d.notas };
      if (!id) {
        obj.creado = new Date().toISOString();
        const c = cuentaDefaults(obj);
        c.valorBase = numOrNull(d.valorBase);
        if (d.cubiertosIniciales) c.cubiertosIniciales = num(d.cubiertosIniciales);
        obj.cuenta = c; obj.extras = []; obj.menu = {};
      } else if (e.fecha !== d.fecha && e.cuenta) {
        // si cambia el día, actualiza el mínimo solo si seguía el valor por defecto
        if (num(e.cuenta.minimo) === minimoPorFecha(e.fecha)) obj.cuenta = { ...e.cuenta, minimo: minimoPorFecha(d.fecha) };
      }
      const nid = DB.save('eventos', obj);
      if (!id) go('evento/' + nid);
    },
  });
}

/* ---------- CLIENTES ---------- */
let FILTRO_CLI = '', FILTRO_REL = '';
VIEWS.clientes = () => `<div class="top"><h1>Clientes</h1><div class="actions"><button id="xls">Descargar base en Excel</button><button class="btn-primary" id="nuevoCli">+ Nuevo cliente</button></div></div>
  <div class="panel filters"><input id="fQ" style="flex:1;min-width:200px" placeholder="Buscar por nombre, apellido, celular, familia…" value="${esc(FILTRO_CLI)}">
    <select id="fRel"><option value="">Todas las religiones</option>${[...new Set([...(CONF().listas.religiones || []), ...Object.values(S.clientes).map(c => c.religion).filter(Boolean)])].map(r => `<option ${r === FILTRO_REL ? 'selected' : ''}>${esc(r)}</option>`).join('')}<option value="__sin" ${FILTRO_REL === '__sin' ? 'selected' : ''}>Sin dato</option></select></div><div class="panel tbl-wrap" id="tblCli"></div>`;
VIEWS.clientes.after = () => {
  $('#xls').onclick = exportarExcel;
  $('#nuevoCli').onclick = () => formCliente();
  const upd = () => {
    FILTRO_CLI = $('#fQ').value.trim().toLowerCase();
    const evs = Object.values(S.eventos);
    FILTRO_REL = $('#fRel').value;
    let list = Object.values(S.clientes).filter(c => !FILTRO_CLI || [c.nombre, c.apellido, c.celular, c.familia].join(' ').toLowerCase().includes(FILTRO_CLI))
      .filter(c => !FILTRO_REL || (FILTRO_REL === '__sin' ? !c.religion : c.religion === FILTRO_REL));
    list.sort((a, b) => nombreCli(a).localeCompare(nombreCli(b)));
    $('#tblCli').innerHTML = list.length ? `<table><thead><tr><th>Cliente</th><th>Celular</th><th>Religión</th><th>Familia</th><th>Eventos</th></tr></thead><tbody>${list.map(c => {
      const es = evs.filter(e => e.clienteId === c.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
      return `<tr class="click" data-go="cliente/${c.id}"><td>${esc(nombreCli(c))}</td><td class="nowrap">${esc(fmtTel(c.celular))}</td><td class="small">${esc(c.religion || '')}</td><td class="small">${esc(c.familia || '')}</td><td class="small">${es.map(e => `${esc(tipoEv(e))} ${fmtD(e.fecha)}`).join('<br>')}</td></tr>`;
    }).join('')}</tbody></table><p class="small muted">${list.length} clientes</p>` : '<p class="muted">No hay clientes.</p>';
  };
  $('#fQ').oninput = upd; $('#fRel').onchange = upd; upd();
};
const selReligion = (n, v) => { const L = CONF().listas.religiones || []; return F.sel(n, 'Religión / colectividad', opts(!v || L.includes(v) ? L : [...L, v], '— sin dato —'), v || ''); };
function formCliente(id) {
  const c = id ? cli(id) : {};
  modal({
    title: id ? 'Editar cliente' : 'Nuevo cliente',
    body: F.text('nombre', 'Nombre', c.nombre) + F.text('apellido', 'Apellido', c.apellido) + F.text('celular', 'Celular', fmtTel(c.celular), 'placeholder="+54911 xxxx-xxxx" inputmode="tel"') + F.text('email', 'Email (opcional)', c.email) + selReligion('religion', c.religion) + F.area('familia', 'Miembros de la familia', c.familia) + F.area('notas', 'Notas', c.notas),
    danger: id ? { label: 'Eliminar cliente', confirm: '¿Eliminar este cliente? Sus eventos quedan sin cliente asignado.', fn: () => { DB.remove('clientes', id); go('clientes'); } } : null,
    onSubmit: d => { if (!d.nombre && !d.apellido) { toast('Completá el nombre.'); return false; } const nid = DB.save('clientes', { ...c, ...d, celular: normTel(d.celular), creado: c.creado || todayISO() }); if (!id) go('cliente/' + nid); },
  });
}
VIEWS.cliente = id => {
  const c = S.clientes[id]; if (!c) return '<p>Cliente no encontrado. <a href="#/clientes">Volver</a></p>';
  const es = Object.values(S.eventos).filter(e => e.clienteId === id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  return `<div class="top"><div><a href="#/clientes" class="small">← Clientes</a><h1>${esc(nombreCli(c))}</h1></div><div class="actions">${c.celular ? `<a class="btn btn-wa" target="_blank" href="${waLink(c.celular)}">WhatsApp</a>` : ''}<button id="edCli">Editar</button><button class="btn-primary" id="nuevoEv">+ Evento para este cliente</button></div></div>
  <div class="panel"><dl class="kv"><dt>Celular</dt><dd>${esc(fmtTel(c.celular)) || '—'}</dd><dt>Email</dt><dd>${esc(c.email || '—')}</dd><dt>Religión</dt><dd>${esc(c.religion || '—')}</dd><dt>Familia</dt><dd>${esc(c.familia || '—')}</dd><dt>Notas</dt><dd>${esc(c.notas || '—')}</dd></dl></div>
  <div class="panel"><h2>Eventos</h2>${es.length ? `<table><thead><tr><th>Fecha</th><th>Evento</th><th>Estado</th><th class="num">Pendiente $ (hoy)</th></tr></thead><tbody>${es.map(e => `<tr class="click" data-go="evento/${e.id}"><td>${fmtDL(e.fecha)}</td><td>${esc(tituloEv(e))}</td><td>${badgeEstado(e)}</td><td class="num">${fmt$(resumenEv(e).pendiente)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Sin eventos.</p>'}</div>`;
};
VIEWS.cliente.after = id => {
  if (!S.clientes[id]) return;
  $('#edCli').onclick = () => formCliente(id);
  $('#nuevoEv').onclick = () => formEvento(null, { clienteId: id });
};

/* ====== ficha del evento + estado de cuenta ====== */
VIEWS.evento = id => {
  const e = ev(id); if (!e) return '<p>Evento no encontrado. <a href="#/eventos">Volver</a></p>';
  const c = cli(e.clienteId), k = calcCuenta(e), x = calcExtras(e), hoy = todayISO();
  const menu = e.menu || {};
  const dias = daysBetween(hoy, e.fecha);
  return `<div class="top"><div><a href="#/eventos" class="small">← Eventos</a>
      <h1>${esc(tituloEv(e) || 'Evento')}</h1>
      <div>${badgeEstado(e)} <b>${fmtDL(e.fecha)}</b> ${dias >= 0 ? `<span class="muted">· faltan ${dias} días</span>` : '<span class="muted">· realizado</span>'}</div></div>
    <div class="actions">${c.celular ? `<a class="btn btn-wa" target="_blank" href="${waLink(c.celular)}">WhatsApp</a>` : ''}
      <button id="edEv">Editar datos</button><button data-go="contrato/${id}">Contrato</button><button data-go="orden/${id}" title="Menú, bebidas, menús especiales y ambientación, sin precios">Hoja para cocina y organizadora</button><button class="btn-gold" data-go="imprimir/${id}">Imprimir estado de cuenta</button></div></div>

  <div class="grid2">
    <div class="panel"><div class="panel-h"><h3>Cliente</h3><a href="#/cliente/${e.clienteId}">Ver ficha</a></div>
      <dl class="kv"><dt>Nombre</dt><dd>${esc(nombreCli(c))}</dd><dt>Celular</dt><dd>${esc(fmtTel(c.celular)) || '—'}</dd><dt>Familia</dt><dd>${esc(c.familia || '—')}</dd>
      <dt>Contrató</dt><dd>${fmtD(e.fechaContratacion) || '—'}</dd><dt>Invitados inicial</dt><dd>${e.invitados || '—'}</dd>
      ${e.estado === 'pendiente' ? `<dt>Vence</dt><dd>${fmtD(e.vencePendiente) || '—'}</dd>` : ''}
      <dt>Contrato</dt><dd>${linkOk(e.contratoLink) ? `<a target="_blank" rel="noopener" href="${esc(e.contratoLink)}">📎 Ver contrato firmado</a>` : `<a href="#/contrato/${id}" class="muted">Sin copia firmada · armar contrato</a>`}</dd>
      ${e.notas ? `<dt>Notas</dt><dd>${esc(e.notas)}</dd>` : ''}</dl></div>
    <div class="panel"><div class="panel-h"><h3>Menú</h3><button class="btn-sm" id="edMenu">Editar menú</button></div>
      <dl class="kv"><dt>Menú</dt><dd>${esc(menu.menu || '—')}</dd><dt>Principal adultos</dt><dd>${esc(menu.principalAdultos || '—')}</dd><dt>Guarnición adultos</dt><dd>${esc(menu.guarnicionAdultos || '—')}</dd>
      <dt>Principal niños</dt><dd>${esc(menu.principalNinos || '—')}</dd><dt>Guarnición niños</dt><dd>${esc(menu.guarnicionNinos || '—')}</dd>${menu.notas ? `<dt>Notas</dt><dd>${esc(menu.notas)}</dd>` : ''}</dl></div>
  </div>

  <div class="grid2">
    <div class="panel"><div class="panel-h"><h3>Bebida y menús especiales</h3><button class="btn-sm" id="edServ">Editar</button></div>
      ${(() => { const sv = e.servicio || {}, esp = (sv.especiales || []).filter(x => num(x.cant)), tot = sum(esp, x => x.cant);
        return `<dl class="kv"><dt>Barman</dt><dd>${{ si: 'Sí, agregan barman', no: 'No' }[sv.barman] || '—'}</dd>
        <dt>Bebida extra</dt><dd>${esc(BEBIDA_OPC[sv.bebida] || '—')}${sv.bebidaNota ? `<div class="small muted">${esc(sv.bebidaNota)}</div>` : ''}</dd>
        <dt>Menús especiales</dt><dd>${esp.length ? `<b>${fmtN(tot)}</b> en total${esp.map(x => `<div>${fmtN(x.cant)} × ${esc(x.tipo)}${x.detalle ? ` <span class="small muted">(${esc(x.detalle)})</span>` : ''}</div>`).join('')}` : (sv.barman || sv.bebida ? 'No tienen' : '—')}</dd>
        ${sv.notas ? `<dt>Notas</dt><dd>${esc(sv.notas)}</dd>` : ''}</dl>`; })()}</div>
    <div class="panel"><div class="panel-h"><h3>Ambientación</h3><button class="btn-sm" id="edAmb">Editar</button></div>
      ${(() => { const a = e.ambientacion || {};
        return `<dl class="kv"><dt>Centro de mesa</dt><dd>${esc(a.centroMesa || '—')}</dd><dt>Mantel</dt><dd>${esc(a.mantel || '—')}</dd>${a.notas ? `<dt>Notas</dt><dd>${esc(a.notas)}</dd>` : ''}</dl>`; })()}</div>
  </div>

  <div class="panel"><div class="panel-h"><h3>Timing</h3><div class="actions" style="display:flex;gap:6px;flex-wrap:wrap">${tieneTiming(e) ? `<button class="btn-sm" data-go="timing/${id}">Imprimir timing</button>` : ''}<button class="btn-sm" id="edTiming">${tieneTiming(e) ? 'Editar timing' : 'Armar timing'}</button></div></div>
    ${tieneTiming(e) ? tablaTiming(e.timing, 'small') : '<p class="muted small" style="margin:0">Todavía no tiene timing. Tocá <b>Armar timing</b> y elegí uno de los modelos.</p>'}</div>

  <div class="panel"><div class="panel-h"><h2>Cubiertos</h2><div class="actions" style="display:flex;gap:6px;flex-wrap:wrap">
      <button id="condic">Condiciones</button><button id="final">Número final de invitados</button><button class="btn-primary" id="pago">+ Registrar pago</button></div></div>
    ${k.sinValor ? '<div class="alert warn">Falta cargar el valor del cubierto. Tocá <b>Condiciones</b>.</div>' : ''}
    ${k.ipcPendienteHoy ? `<div class="alert warn">Este mes ajusta por IPC de ${fmtYM(addMonths(ym(hoy), -1))} y todavía no está cargado: el valor de hoy puede cambiar. <a href="#/ipc">Cargar IPC</a></div>` : ''}
    <div class="cards">
      <div class="card"><div class="k">Valor cubierto hoy</div><div class="v">${fmt$(k.valorHoy)}</div></div>
      <div class="card"><div class="k">Cubiertos a facturar</div><div class="v">${fmtN(k.facturar)}</div><div class="small muted">${k.c.final.confirmado ? `Final: ${num(k.c.final.adultos)} adultos + ${num(k.c.final.ninos)} niños ½${num(k.c.final.menores) ? ` + ${num(k.c.final.menores)} menores de 4` : ''}` : `Contratados · mínimo ${k.c.minimo}`}</div></div>
      <div class="card good"><div class="k">Cubiertos abonados</div><div class="v">${fmtN(k.pagados)}</div></div>
      <div class="card ${k.pendientes > 0 ? 'warn' : 'good'}"><div class="k">Cubiertos pendientes</div><div class="v">${fmtN(Math.max(0, k.pendientes))}</div>${k.pendientes > 0 && k.antesSemana > 0 && dias > 7 ? `<div class="small muted">${fmtN(k.antesSemana)} antes de la semana del evento · ${fmtN(Math.min(k.pendientes, k.reservaSemana))} esa semana</div>` : ''}</div>
      <div class="card ${k.montoPendiente > 0 ? 'bad' : ''}"><div class="k">Pendiente al valor de hoy</div><div class="v">${fmt$(k.montoPendiente)}</div></div>
      ${k.aFavor > 0 || k.cubAFavor > 0 ? `<div class="card good"><div class="k">A favor del cliente</div><div class="v">${fmt$(k.aFavor)}</div>${k.cubAFavor ? `<div class="small muted">${fmtN(k.cubAFavor)} cubiertos de más</div>` : ''}</div>` : ''}
      ${k.ivaOn ? `<div class="card ${k.ivaPendiente > 0 ? 'warn' : ''}"><div class="k">IVA ${fmtP(k.ivaPct)}</div><div class="v">${fmt$(k.ivaPendiente)}</div><div class="small muted">Total ${fmt$(k.ivaTotal)} · pagado ${fmt$(k.montoIva)}</div></div>` : ''}
    </div>
    <div class="small muted" style="margin-bottom:10px">Valor base ${fmt$(k.base)} (${fmtYM(k.desde)}) · ${num(k.c.mesesCongelado)} ${num(k.c.mesesCongelado) === 1 ? 'mes' : 'meses'} sin ajuste · reserva ${k.reservaSemana} cubiertos para la semana del evento${k.ivaOn ? '' : ' · sin IVA'}</div>

    <h3>Pagos</h3>
    ${k.pagos.length ? `<div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Concepto</th><th>Medio</th><th class="num">Monto</th><th class="num">Valor cubierto</th><th class="num">Cubiertos</th><th class="num">Acumulado</th><th class="num">Saldo a favor</th><th></th></tr></thead><tbody>
      ${k.pagos.map(p => `<tr><td>${fmtD(p.fecha)}</td><td>${p.tipo === 'iva' ? 'IVA' : p.sena ? 'Seña' : 'Pago'}${p.nota ? `<div class="small muted">${esc(p.nota)}</div>` : ''}</td><td class="small">${esc(medioTxt(p))}</td><td class="num">${fmt$(p.monto)}</td><td class="num">${p.tipo === 'iva' ? '' : fmt$(p.valor)}</td><td class="num">${p.tipo === 'iva' ? '' : fmtN(p.cubiertos)}</td><td class="num">${p.tipo === 'iva' ? '' : fmtN(p.acum)}</td><td class="num">${p.tipo === 'iva' ? '' : fmt$(p.credito)}</td><td class="right"><button class="btn-sm" data-pago="${p.id}">Editar</button></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="muted">Todavía no hay pagos. El primero suele ser la seña (' + CONF().sena + ' cubiertos).</p>'}

    <h3 style="margin-top:18px">Cuadro mes a mes</h3>
    <p class="small muted" style="margin-top:-4px">Cada mes ajusta con el IPC del mes anterior. Desmarcá “Ajusta” para no aplicar un mes, o escribí otro % para este cliente.</p>
    <div class="tbl-wrap"><table><thead><tr><th>Mes</th><th class="center">Ajusta</th><th>IPC de</th><th class="num">% aplicado</th><th class="num">Valor cubierto</th><th class="num">Pagado</th><th class="num">Cub. abonados</th><th class="num">Acumulado</th><th class="num">Pendientes</th></tr></thead><tbody>
      ${k.meses.map(r => `<tr class="${r.mes < ym(hoy) ? 'past' : ''} ${r.mes === ym(hoy) ? 'cur' : ''}"><td class="nowrap">${fmtYM(r.mes)}${r.i === 0 ? ' <span class="small muted">(base)</span>' : ''}</td>
        <td class="center">${r.i === 0 ? '' : `<input type="checkbox" data-aj="${r.mes}" ${r.aplica ? 'checked' : ''}>`}</td>
        <td class="small muted">${r.i === 0 ? '' : fmtYMc(r.ipcDe) + ' ' + (S.ipc[r.ipcDe] && S.ipc[r.ipcDe].valor !== null && S.ipc[r.ipcDe].valor !== undefined && S.ipc[r.ipcDe].valor !== '' ? fmtP(num(S.ipc[r.ipcDe].valor)) : '<span class="badge b-warn">sin cargar</span>')}</td>
        <td class="num">${r.i === 0 || !r.aplica ? '' : `<input data-pct="${r.mes}" value="${r.manual ? r.pct : ''}" placeholder="${r.pct !== null && !r.manual ? r.pct : '—'}" inputmode="decimal" title="Dejalo vacío para usar el IPC cargado">`}</td>
        <td class="num">${r.pend ? '<span class="badge b-warn">IPC pendiente</span> ' : ''}${fmt$(r.valor)}</td>
        <td class="num">${r.pagado ? fmt$(r.pagado) : ''}</td><td class="num">${r.cubPagados ? fmtN(r.cubPagados) : ''}</td><td class="num">${fmtN(r.acum)}</td><td class="num">${fmtN(Math.max(0, r.pendientes))}</td></tr>`).join('')}
    </tbody></table></div>
  </div>

  <div class="panel"><div class="panel-h"><h2>Extras</h2><button class="btn-primary" id="addExtra">+ Agregar extra</button></div>
    ${x.lines.length ? `<div class="tbl-wrap"><table><thead><tr><th>Extra</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Total</th><th class="num">Pagado</th><th class="num">Saldo</th><th class="num" title="Solo interno: no sale en la impresión">Costo (interno)</th><th class="center">Proveedor contratado</th><th></th></tr></thead><tbody>
      ${x.lines.map(l => `<tr><td>${esc(l.nombre)}${l.regalo ? ' <span class="badge b-ok">Obsequio</span>' : ''}${l.proveedor ? `<div class="small muted">Proveedor: ${esc(l.proveedor)}</div>` : ''}${l.nota ? `<div class="small muted">${esc(l.nota)}</div>` : ''}</td>
        <td class="num">${l.cant}</td><td class="num">${fmt$(l.precio)}</td><td class="num">${l.regalo ? '—' : fmt$(l.total)}</td><td class="num">${fmt$(l.pagado)}</td><td class="num">${l.saldo > 0 ? `<b>${fmt$(l.saldo)}</b>` : fmt$(l.saldo)}</td>
        <td class="num muted">${l.costo !== null && l.costo !== undefined && l.costo !== '' ? fmt$(l.costoTotal) : '—'}</td>
        <td class="center"><input type="checkbox" data-contr="${l.id}" ${l.contratado ? 'checked' : ''}></td>
        <td class="right nowrap"><button class="btn-sm" data-xpago="${l.id}">+ Pago</button> <button class="btn-sm" data-xed="${l.id}">Editar</button></td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="3">Total extras</td><td class="num">${fmt$(x.total)}</td><td class="num">${fmt$(x.pagado)}</td><td class="num">${fmt$(x.saldo)}</td><td class="num muted">${fmt$(x.costo)}</td><td colspan="2" class="small muted">Margen ${fmt$(x.total - x.costo)}</td></tr></tfoot></table></div>`
      : '<p class="muted">Sin extras contratados.</p>'}
  </div>

  <div class="panel"><div class="panel-h"><h2>Total pendiente del cliente</h2></div>
    <div class="cards"><div class="card"><div class="k">Cubiertos (al valor de hoy)</div><div class="v">${fmt$(k.montoPendiente)}</div></div>
    ${k.ivaOn ? `<div class="card"><div class="k">IVA</div><div class="v">${fmt$(k.ivaPendiente)}</div></div>` : ''}
    <div class="card"><div class="k">Extras</div><div class="v">${fmt$(Math.max(0, x.saldo))}</div></div>
    <div class="card bad"><div class="k">Total</div><div class="v">${fmt$(k.montoPendiente + k.ivaPendiente + Math.max(0, x.saldo))}</div></div></div>
    ${k.aFavor > 0 ? `<p class="small">A favor del cliente en cubiertos: <b>${fmt$(k.aFavor)}</b>.</p>` : ''}
  </div>`;
};

VIEWS.evento.after = id => {
  const e = ev(id); if (!e) return;
  $('#edEv').onclick = () => formEvento(id);
  $('#edMenu').onclick = () => formMenu(id);
  $('#edServ').onclick = () => formServicio(id);
  $('#edAmb').onclick = () => formAmbientacion(id);
  $('#edTiming').onclick = () => formTiming(id);
  $('#condic').onclick = () => formCondiciones(id);
  $('#final').onclick = () => formFinal(id);
  $('#pago').onclick = () => formPago(id);
  $$('[data-pago]').forEach(b => b.onclick = () => formPago(id, b.dataset.pago));
  $('#addExtra').onclick = () => formExtra(id);
  $$('[data-xed]').forEach(b => b.onclick = () => formExtra(id, b.dataset.xed));
  $$('[data-xpago]').forEach(b => b.onclick = () => formPagoExtra(id, b.dataset.xpago));
  $$('[data-contr]').forEach(b => b.onchange = () => { const E = clean(ev(id)); const l = E.extras.find(z => z.id === b.dataset.contr); l.contratado = b.checked; DB.save('eventos', E); });
  $$('[data-aj]').forEach(b => b.onchange = () => { const E = clean(ev(id)); E.cuenta = getCuenta(E); E.cuenta.ajustes[b.dataset.aj] = { ...(E.cuenta.ajustes[b.dataset.aj] || {}), aplica: b.checked }; DB.save('eventos', E); });
  $$('[data-pct]').forEach(b => b.onchange = () => { const E = clean(ev(id)); E.cuenta = getCuenta(E); const a = { ...(E.cuenta.ajustes[b.dataset.pct] || {}) }; const p = pct(b.value); if (p === null) delete a.pct; else a.pct = p; E.cuenta.ajustes[b.dataset.pct] = a; DB.save('eventos', E); });
};

function updCuenta(id, fn) { const E = clean(ev(id)); E.cuenta = getCuenta(E); fn(E.cuenta, E); DB.save('eventos', E); }

function formMenu(id) {
  const e = ev(id), m = e.menu || {}, L = CONF().listas;
  const s = (n, l, list) => F.sel(n, l, opts(list.includes(m[n]) || !m[n] ? list : [...list, m[n]]), m[n]);
  modal({
    title: 'Menú seleccionado',
    body: s('menu', 'Menú', L.menus) + '<div></div>' + s('principalAdultos', 'Plato principal adultos', L.principalAdultos) + s('guarnicionAdultos', 'Guarnición adultos', L.guarnicionAdultos) + s('principalNinos', 'Plato principal niños', L.principalNinos) + s('guarnicionNinos', 'Guarnición niños', L.guarnicionNinos) + F.area('notas', 'Notas del menú', m.notas) + F.hint('Las opciones de cada lista se editan en Configuración.'),
    onSubmit: d => { DB.save('eventos', { ...clean(e), menu: d }); },
  });
}

const BEBIDA_OPC = { no: 'No hay bebida extra', cliente: 'La traen ellos', salon: 'La provee el salón (se cobra aparte)' };

function formServicio(id) {
  const e = ev(id), sv = e.servicio || {}, L = CONF().listas;
  const prev = {}; (sv.especiales || []).forEach(x => { prev[x.tipo] = x; });
  const tipos = [...L.especiales, ...Object.keys(prev).filter(t => !L.especiales.includes(t))];
  const filas = tipos.map((t, i) => `<div class="esp-row full"><span>${esc(t)}</span><input name="espc_${i}" inputmode="numeric" placeholder="0" value="${esc(prev[t] ? prev[t].cant : '')}" aria-label="Cantidad ${esc(t)}"><input name="espd_${i}" placeholder="Detalle (opcional)" value="${esc(prev[t] ? prev[t].detalle || '' : '')}"></div>`).join('');
  modal({
    title: 'Bebida y menús especiales',
    body: F.sel('barman', 'Barman', [['', '— sin definir —'], ['si', 'Sí, agregan barman'], ['no', 'No']], sv.barman) +
      F.sel('bebida', 'Bebida extra', [['', '— sin definir —'], ...Object.entries(BEBIDA_OPC)], sv.bebida) +
      F.text('bebidaNota', 'Detalle de la bebida (qué traen, descorche, etc.)', sv.bebidaNota, 'full') +
      F.sep('Menús especiales: cuántos de cada uno') + filas + '<div class="full" id="espTot"></div>' +
      F.area('notas', 'Notas (alergias, intolerancias, a qué mesa va cada menú…)', sv.notas) +
      F.hint('Los tipos de menú especial se editan en Configuración → Menús especiales.'),
    onOpen: form => { const u = () => { const d = readForm(form); const t = tipos.reduce((a, _, i) => a + num(d['espc_' + i]), 0); $('#espTot', form).innerHTML = t ? `<div class="alert info">Total de menús especiales: <b>${fmtN(t)}</b></div>` : ''; }; form.oninput = u; u(); },
    onSubmit: d => {
      const especiales = tipos.map((t, i) => ({ tipo: t, cant: num(d['espc_' + i]), detalle: d['espd_' + i] })).filter(x => x.cant || x.detalle);
      DB.save('eventos', { ...clean(e), servicio: { barman: d.barman, bebida: d.bebida, bebidaNota: d.bebidaNota, especiales, notas: d.notas } });
    },
  });
}

function formAmbientacion(id) {
  const e = ev(id), a = e.ambientacion || {};
  const usados = [...new Set([...CONF().listas.centrosMesa, ...Object.values(S.eventos).map(z => (z.ambientacion || {}).centroMesa).filter(Boolean)])];
  modal({
    title: 'Ambientación',
    body: F.text('centroMesa', 'Centro de mesa elegido', a.centroMesa, 'full list="centrosDl" placeholder="Escribí o elegí uno de la lista"') + `<datalist id="centrosDl">${usados.map(c => `<option value="${esc(c)}">`).join('')}</datalist>` +
      F.sel('mantel', 'Mantel', [['', '— sin definir —'], 'Blanco', 'Negro'], a.mantel) + '<div></div>' +
      F.area('notas', 'Notas de ambientación', a.notas) +
      F.hint('Podés cargar los centros de mesa que ofrecen en Configuración → Centros de mesa para elegirlos de la lista.'),
    onSubmit: d => { DB.save('eventos', { ...clean(e), ambientacion: { centroMesa: d.centroMesa, mantel: d.mantel, notas: d.notas } }); },
  });
}

function formCondiciones(id) {
  const e = ev(id), c = getCuenta(e);
  modal({
    title: 'Condiciones de cubiertos',
    body: F.num('valorBase', 'Valor del cubierto (ARS)', c.valorBase) + F.month('mesBase', 'Mes del valor base', c.mesBase) +
      F.num('mesesCongelado', 'Meses sin ajuste después del mes base', c.mesesCongelado) + F.hint('Ej.: 1 = el mes siguiente mantiene el precio y desde el otro ajusta todos los meses. Igual podés desmarcar meses puntuales en el cuadro.') +
      F.num('minimo', `Mínimo de cubiertos (este día: ${minimoPorFecha(e.fecha)})`, c.minimo) + F.num('cubiertosIniciales', 'Cubiertos contratados', c.cubiertosIniciales) +
      F.num('reservaSemana', 'Cubiertos a abonar la semana del evento', c.reservaSemana) + '<div></div>' +
      F.sep('IVA') + F.chk('ivaActivo', 'Sumar IVA a los cubiertos (factura)', c.iva.activo) + F.num('ivaPct', 'IVA %', c.iva.pct),
    onSubmit: d => updCuenta(id, k => {
      k.valorBase = numOrNull(d.valorBase); k.mesBase = d.mesBase || k.mesBase; k.mesesCongelado = num(d.mesesCongelado);
      k.minimo = num(d.minimo); k.cubiertosIniciales = num(d.cubiertosIniciales) || k.minimo; k.reservaSemana = num(d.reservaSemana);
      k.iva = { activo: d.ivaActivo, pct: pct(d.ivaPct) ?? 21 };
    }),
  });
}

function formFinal(id) {
  const c = getCuenta(ev(id)), f = c.final;
  modal({
    title: 'Número final de invitados',
    body: F.num('adultos', 'Adultos y jóvenes (más de 10 años)', f.adultos) + F.num('ninos', 'Niños de 4 a 10 años (medio cubierto)', f.ninos) + F.num('menores', 'Menores de 4 años (no pagan)', f.menores) + '<div></div>' +
      F.chk('confirmado', 'Número confirmado: usar este total para la cuenta', f.confirmado, 'full') +
      F.hint(`Se facturan los adultos + la mitad de los niños, con un mínimo de ${c.minimo} cubiertos enteros.`) + '<div class="full" id="finPrev"></div>',
    onOpen: form => { const u = () => { const d = readForm(form); const eq = num(d.adultos) + num(d.ninos) * 0.5; $('#finPrev', form).innerHTML = `<div class="alert info">Equivalen a <b>${fmtN(eq)}</b> cubiertos → se facturan <b>${fmtN(Math.max(c.minimo, eq))}</b>. Total de personas: ${num(d.adultos) + num(d.ninos) + num(d.menores)}.</div>`; }; form.oninput = u; u(); },
    onSubmit: d => updCuenta(id, k => { k.final = { adultos: numOrNull(d.adultos), ninos: numOrNull(d.ninos), menores: numOrNull(d.menores), confirmado: d.confirmado }; }),
  });
}

function formPago(id, pid) {
  const e = ev(id), c = getCuenta(e), k = calcCuenta(e);
  const p = pid ? c.pagos.find(x => x.id === pid) : { fecha: todayISO(), tipo: 'cubiertos', sena: !c.pagos.length, medio: 'Transferencia' };
  const L = CONF().listas;
  const valorDe = f => k.valorEnMes(ym(f || todayISO()));
  const ini = pid ? p.valor : valorDe(p.fecha);
  modal({
    title: pid ? 'Editar pago' : 'Registrar pago',
    body: F.date('fecha', 'Fecha', p.fecha, 'id="pFecha"') + F.sel('tipo', 'Concepto', [['cubiertos', 'Pago de cubiertos'], ['iva', 'Pago de IVA']], p.tipo, 'id="pTipo"') +
      `<div class="full fgrid" id="cubBox" style="grid-template-columns:1fr 1fr">` +
      F.num('valor', 'Valor del cubierto aplicado', ini, 'id="pValor"') + F.num('cubiertos', 'Cubiertos (calcula el monto)', !pid && p.sena ? CONF().sena : '', 'id="pCub"') +
      F.chk('sena', 'Es la seña', p.sena) + '</div>' +
      camposMedios(p, 'Monto recibido (ARS)') +
      F.text('nota', 'Nota (ej.: USD 500 a $1.180)', p.nota, 'full') + '<div class="full" id="pPrev"></div>',
    danger: pid ? { label: 'Eliminar pago', confirm: '¿Eliminar este pago?', fn: () => updCuenta(id, k2 => { k2.pagos = k2.pagos.filter(x => x.id !== pid); }) } : null,
    onOpen: form => {
      const fv = $('#pValor', form), fc = $('#pCub', form), fm = $('#pMonto', form), fm2 = $('#pMonto2', form), comb = $('#pComb', form);
      const total = () => num(fm.value) + (comb.checked ? num(fm2.value) : 0);
      let tocoValor = !!pid;
      fv.oninput = () => { tocoValor = true; };
      $('#pFecha', form).onchange = () => { if (!tocoValor) fv.value = valorDe($('#pFecha', form).value); u(); };
      fc.oninput = () => { if (fc.value) fm.value = Math.max(0, Math.round(num(fc.value) * num(fv.value)) - (comb.checked ? num(fm2.value) : 0)); };
      const u = () => {
        $('#cubBox', form).style.display = $('#pTipo', form).value === 'iva' ? 'none' : '';
        const v = num(fv.value), m = total();
        if ($('#pTipo', form).value === 'iva') { $('#pPrev', form).innerHTML = `<div class="alert info">IVA pendiente: ${fmt$(k.ivaPendiente)}</div>`; return; }
        const credPrev = pid ? 0 : k.credito;
        const n = v > 0 ? Math.floor((m + credPrev) / v + 1e-9) : 0;
        const r = Math.round(m + credPrev - n * v);
        const mesPend = (k.meses.find(x => x.mes === ym($('#pFecha', form).value)) || {}).pend;
        $('#pPrev', form).innerHTML = (mesPend ? '<div class="alert warn">El IPC que ajusta ese mes todavía no está cargado. Si cobrás igual, revisá el valor aplicado.</div>' : '') +
          (v ? `<div class="alert info">${credPrev ? `Saldo a favor previo ${fmt$(credPrev)} + ` : ''}${fmt$(m)} ÷ ${fmt$(v)} = <b>${n} cubiertos</b> congelados${r ? ` · quedan <b>${fmt$(r)}</b> a favor` : ''}.</div>` : '');
      };
      bindMedios(form); form.addEventListener('input', u); form.addEventListener('change', u); u();
    },
    onSubmit: d => {
      const mp = leerMedios(d);
      if (!mp.monto) { toast('Falta el monto.'); return false; }
      if (d.tipo !== 'iva' && !num(d.valor)) { toast('Falta el valor del cubierto.'); return false; }
      updCuenta(id, k2 => {
        const obj = { id: pid || uid(), creado: (p && p.creado) || new Date().toISOString(), fecha: d.fecha, tipo: d.tipo, monto: mp.monto, valor: d.tipo === 'iva' ? null : num(d.valor), sena: d.tipo === 'iva' ? false : d.sena, medio: mp.medio, nota: d.nota };
        if (mp.medios) obj.medios = mp.medios;
        k2.pagos = pid ? k2.pagos.map(x => x.id === pid ? obj : x) : [...k2.pagos, obj];
      });
    },
  });
}

function formExtra(id, xid) {
  const e = ev(id), l = xid ? (e.extras || []).find(z => z.id === xid) : { cantidad: 1 };
  const cat = Object.values(S.extrasCat).filter(z => z.activo !== false).sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));
  let pagos = clean(l.pagos || []);
  const pagosHtml = () => pagos.length ? `<table><thead><tr><th>Fecha</th><th class="num">Monto</th><th>Medio</th><th></th></tr></thead><tbody>${pagos.map((p, i) => `<tr><td>${fmtD(p.fecha)}</td><td class="num">${fmt$(p.monto)}</td><td class="small">${esc(medioTxt(p))}</td><td class="right"><button type="button" class="btn-sm btn-danger" data-delp="${i}">Quitar</button></td></tr>`).join('')}</tbody></table>` : '<span class="muted small">Sin pagos.</span>';
  modal({
    title: xid ? 'Editar extra' : 'Agregar extra',
    body: (xid ? '' : F.sel('catId', 'Del catálogo', [['', '— Extra personalizado / combo —'], ...cat.map(z => [z.id, `${z.nombre} · ${fmt$(z.precio)}`])], '', 'full id="xCat"')) +
      F.text('nombre', 'Descripción (la ve el cliente)', l.nombre, 'full id="xNom"') + F.num('cantidad', 'Cantidad', l.cantidad) + F.num('precio', 'Precio unitario que se cobra (ARS)', l.precio, 'id="xPre"') +
      F.num('costo', 'Costo unitario (interno, no se imprime)', l.costo, 'id="xCos"') + F.text('proveedor', 'Proveedor', l.proveedor) +
      F.chk('regalo', 'Obsequio (sin cargo para el cliente)', l.regalo) + F.chk('contratado', 'Ya contraté al proveedor', l.contratado) + F.area('nota', 'Nota', l.nota) +
      (xid ? F.sep('Pagos de este extra') + `<div class="full" id="xPagos">${pagosHtml()}</div>` : F.sep('Pago inicial (opcional)') + F.num('pMonto', 'Monto pagado ahora', '') + F.date('pFecha', 'Fecha', todayISO())),
    danger: xid ? { label: 'Quitar extra', confirm: '¿Quitar este extra del evento?', fn: () => { const E = clean(ev(id)); E.extras = E.extras.filter(z => z.id !== xid); DB.save('eventos', E); } } : null,
    onOpen: form => {
      const s = $('#xCat', form);
      if (s) s.onchange = () => { const z = S.extrasCat[s.value]; if (!z) return; $('#xNom', form).value = z.nombre; $('#xPre', form).value = z.precio ?? ''; $('#xCos', form).value = z.costo ?? ''; };
      const bind = () => $$('[data-delp]', form).forEach(b => b.onclick = () => { pagos.splice(+b.dataset.delp, 1); $('#xPagos', form).innerHTML = pagosHtml(); bind(); });
      if (xid) bind();
    },
    onSubmit: d => {
      if (!d.nombre) { toast('Falta la descripción.'); return false; }
      const E = clean(ev(id)); E.extras = E.extras || [];
      const obj = { ...(l.id ? l : {}), id: xid || uid(), catId: l.catId || d.catId || '', nombre: d.nombre, cantidad: num(d.cantidad) || 1, precio: num(d.precio), costo: numOrNull(d.costo), proveedor: d.proveedor, regalo: d.regalo, contratado: d.contratado, nota: d.nota, pagos: xid ? pagos : (num(d.pMonto) ? [{ fecha: d.pFecha || todayISO(), monto: num(d.pMonto), medio: '' }] : []) };
      if (xid) E.extras = E.extras.map(z => z.id === xid ? obj : z); else E.extras.push(obj);
      DB.save('eventos', E);
    },
  });
}

function formPagoExtra(id, xid) {
  const e = ev(id), l = calcExtras(e).lines.find(z => z.id === xid);
  modal({
    title: 'Pago de extra: ' + esc(l.nombre),
    body: F.date('fecha', 'Fecha', todayISO()) + F.text('nota', 'Nota', '') + camposMedios({ medio: 'Transferencia', monto: l.saldo > 0 ? l.saldo : '' }, `Monto (saldo ${fmt$(l.saldo)})`),
    onOpen: form => bindMedios(form),
    onSubmit: d => { const mp = leerMedios(d); if (!mp.monto) { toast('Falta el monto.'); return false; } const E = clean(ev(id)); const z = E.extras.find(q => q.id === xid); const pg = { fecha: d.fecha, monto: mp.monto, medio: mp.medio, nota: d.nota }; if (mp.medios) pg.medios = mp.medios; z.pagos = [...(z.pagos || []), pg]; DB.save('eventos', E); },
  });
}

/* ====== IPC, catálogo de extras, egresos, métricas, configuración ====== */

/* ---------- IPC ---------- */
VIEWS.ipc = (anio) => {
  const y0 = new Date().getFullYear(), y = +(anio || y0);
  const years = [...new Set([y0 - 1, y0, y0 + 1, y0 + 2, y, ...Object.keys(S.ipc).map(k => +k.slice(0, 4))])].sort();
  const usados = new Set(eventosActivos().flatMap(e => calcCuenta(e).meses.filter(r => r.i > 0 && r.aplica && !r.manual).map(r => r.ipcDe)));
  return `<div class="top"><h1>Índices IPC</h1><div class="year-tabs">${years.map(v => `<a href="#/ipc/${v}" class="${v === y ? 'on' : ''}">${v}</a>`).join('')}</div></div>
  <div class="panel"><p class="small muted" style="margin-top:0">Cargá el % mensual cuando se publica (a mediados del mes siguiente). El IPC de un mes ajusta el valor del cubierto del mes que sigue: el de octubre ajusta noviembre.<br>Se guarda solo al salir de cada casillero. Usá coma o punto para decimales.</p>
  <table style="max-width:720px"><thead><tr><th>Mes del índice</th><th class="num">IPC %</th><th>Ajusta el valor de</th><th>Fuente / nota</th></tr></thead><tbody>
  ${MESES.map((mn, i) => { const k = `${y}-${pad(i + 1)}`, r = S.ipc[k] || {}; const falta = (r.valor === undefined || r.valor === null || r.valor === '') && usados.has(k) && k < ym(todayISO()); return `<tr><td>${mn} ${y} ${falta ? '<span class="badge b-warn">falta</span>' : ''}</td><td class="num"><input data-ipc="${k}" value="${r.valor ?? ''}" inputmode="decimal" style="width:90px"></td><td class="small muted">${fmtYM(addMonths(k, 1))}</td><td><input data-ipcn="${k}" value="${esc(r.nota || '')}" style="width:100%" placeholder="Ej.: IPC CABA"></td></tr>`; }).join('')}
  </tbody></table>
  ${(() => { const vals = MESES.map((_, i) => S.ipc[`${y}-${pad(i + 1)}`]).filter(r => r && r.valor !== '' && r.valor !== null && r.valor !== undefined); if (!vals.length) return ''; const acum = vals.reduce((a, r) => a * (1 + num(r.valor) / 100), 1); return `<p class="small">Acumulado ${y} (${vals.length} meses cargados): <b>${fmtP(Math.round((acum - 1) * 10000) / 100)}</b></p>`; })()}
  </div>`;
};
VIEWS.ipc.after = () => {
  $$('[data-ipc]').forEach(i => i.onchange = () => { const k = i.dataset.ipc, r = S.ipc[k] || { id: k }; DB.save('ipc', { ...r, id: k, valor: pct(i.value) }); });
  $$('[data-ipcn]').forEach(i => i.onchange = () => { const k = i.dataset.ipcn, r = S.ipc[k] || { id: k, valor: null }; DB.save('ipc', { ...r, id: k, nota: i.value.trim() }); });
};

/* ---------- CATÁLOGO DE EXTRAS ---------- */
VIEWS.extras = () => {
  const list = Object.values(S.extrasCat).sort((a, b) => (a.grupo || '').localeCompare(b.grupo || '') || (a.orden ?? 99) - (b.orden ?? 99));
  const grupos = [...new Set(list.map(z => z.grupo || 'Otros'))];
  return `<div class="top"><h1>Catálogo de extras</h1><div class="actions"><button class="btn-primary" id="nuevoX">+ Nuevo extra</button></div></div>
  <div class="panel"><p class="small muted" style="margin-top:0">Precios de lista y costo de referencia. Cuando agregás un extra a un evento se copian estos valores y los podés cambiar ahí (combos, atenciones). Cambiar el catálogo no modifica las cuentas ya cargadas.</p>
  ${grupos.map(g => `<h3 style="margin-top:14px">${esc(g)}</h3><table><thead><tr><th>Extra</th><th class="num">Precio</th><th class="num">Costo</th><th class="num">Margen</th><th></th></tr></thead><tbody>${list.filter(z => (z.grupo || 'Otros') === g).map(z => `<tr class="${z.activo === false ? 'past' : ''}"><td>${esc(z.nombre)}${z.activo === false ? ' <span class="badge b-cancelado">no se ofrece</span>' : ''}${z.desc ? `<div class="small muted">${esc(z.desc)}</div>` : ''}</td><td class="num">${fmt$(z.precio)}</td><td class="num">${z.costo === null || z.costo === undefined || z.costo === '' ? '<span class="muted">—</span>' : fmt$(z.costo)}</td><td class="num">${z.costo === null || z.costo === undefined || z.costo === '' ? '' : fmt$(num(z.precio) - num(z.costo))}</td><td class="right"><button class="btn-sm" data-xc="${z.id}">Editar</button></td></tr>`).join('')}</tbody></table>`).join('')}
  </div>`;
};
VIEWS.extras.after = () => { $('#nuevoX').onclick = () => formCat(); $$('[data-xc]').forEach(b => b.onclick = () => formCat(b.dataset.xc)); };
function formCat(id) {
  const z = id ? S.extrasCat[id] : { activo: true };
  const grupos = [...new Set(Object.values(S.extrasCat).map(q => q.grupo).filter(Boolean))];
  modal({
    title: id ? 'Editar extra del catálogo' : 'Nuevo extra',
    body: F.text('nombre', 'Nombre', z.nombre, 'full') + F.text('grupo', 'Grupo', z.grupo, 'list="grp"') + `<datalist id="grp">${grupos.map(g => `<option value="${esc(g)}">`).join('')}</datalist>` +
      F.num('precio', 'Precio (ARS)', z.precio) + F.num('costo', 'Costo (ARS)', z.costo) + F.area('desc', 'Descripción / condiciones', z.desc) + F.chk('activo', 'Se ofrece actualmente', z.activo !== false),
    danger: id ? { label: 'Eliminar', confirm: '¿Eliminar del catálogo? Los eventos que ya lo tienen no cambian.', fn: () => DB.remove('extrasCat', id) } : null,
    onSubmit: d => { if (!d.nombre) { toast('Falta el nombre.'); return false; } DB.save('extrasCat', { ...z, nombre: d.nombre, grupo: d.grupo, precio: num(d.precio), costo: numOrNull(d.costo), desc: d.desc, activo: d.activo, orden: z.orden ?? 99 }); },
  });
}

/* ---------- EGRESOS ---------- */
let FILTRO_EG = null;
VIEWS.egresos = () => {
  FILTRO_EG = FILTRO_EG || ym(todayISO());
  const list = Object.values(S.egresos).filter(g => ym(g.fecha) === FILTRO_EG).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const porCat = {}; list.forEach(g => porCat[g.categoria] = (porCat[g.categoria] || 0) + num(g.monto));
  return `<div class="top"><h1>Egresos</h1><div class="actions"><input type="month" id="fMes" value="${FILTRO_EG}" style="width:auto"><button class="btn-primary" id="nuevoG">+ Cargar egreso</button></div></div>
  <div class="grid2" style="grid-template-columns:2fr 1fr">
    <div class="panel tbl-wrap"><h2>${fmtYM(FILTRO_EG)}</h2>${list.length ? `<table><thead><tr><th>Fecha</th><th>Categoría</th><th>Detalle</th><th class="num">Monto</th></tr></thead><tbody>${list.map(g => `<tr class="click" data-eg="${g.id}"><td>${fmtD(g.fecha)}</td><td>${esc(g.categoria)}</td><td class="small">${esc(g.detalle || '')}</td><td class="num">${fmt$(g.monto)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3">Total</td><td class="num">${fmt$(sum(list, g => g.monto))}</td></tr></tfoot></table>` : '<p class="muted">Sin egresos cargados este mes.</p>'}</div>
    <div class="panel"><h3>Por categoría</h3>${Object.keys(porCat).length ? `<table><tbody>${Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num">${fmt$(v)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted small">—</p>'}</div>
  </div>`;
};
VIEWS.egresos.after = () => {
  $('#fMes').onchange = e => { FILTRO_EG = e.target.value || ym(todayISO()); render(); };
  $('#nuevoG').onclick = () => formEgreso();
  $$('[data-eg]').forEach(r => r.onclick = () => formEgreso(r.dataset.eg));
};
function formEgreso(id) {
  const g = id ? S.egresos[id] : { fecha: FILTRO_EG === ym(todayISO()) ? todayISO() : FILTRO_EG + '-01' };
  const cats = CONF().listas.egresos;
  modal({
    title: id ? 'Editar egreso' : 'Cargar egreso',
    body: F.date('fecha', 'Fecha', g.fecha) + F.sel('categoria', 'Categoría', opts(cats.includes(g.categoria) || !g.categoria ? cats : [...cats, g.categoria]), g.categoria, 'id="gCat"') +
      F.text('detalle', 'Detalle', g.detalle, 'full id="gDet"') + F.num('monto', 'Monto (ARS)', g.monto) + F.sel('eventoId', 'Asociado a un evento (opcional)', [['', '—'], ...eventosActivos().filter(e => Math.abs(daysBetween(g.fecha || todayISO(), e.fecha)) < 120).sort((a, b) => a.fecha.localeCompare(b.fecha)).map(e => [e.id, `${fmtD(e.fecha)} · ${nombreCli(cli(e.clienteId))}`])], g.eventoId),
    danger: id ? { label: 'Eliminar', confirm: '¿Eliminar este egreso?', fn: () => DB.remove('egresos', id) } : null,
    onOpen: form => { const u = () => { const c = $('#gCat', form).value; $('#gDet', form).placeholder = c === 'Empleados' ? 'Nombre del empleado' : c === 'Otros' ? 'Especificá el gasto' : ''; }; $('#gCat', form).onchange = u; u(); },
    onSubmit: d => { if (!d.categoria || !num(d.monto)) { toast('Completá categoría y monto.'); return false; } if ((d.categoria === 'Otros' || d.categoria === 'Empleados') && !d.detalle) { toast(d.categoria === 'Otros' ? 'Especificá qué es en "Detalle".' : 'Poné el nombre del empleado en "Detalle".'); return false; } DB.save('egresos', { ...g, ...d, monto: num(d.monto) }); FILTRO_EG = ym(d.fecha); },
  });
}

/* ---------- MÉTRICAS ---------- */
VIEWS.metricas = (anio) => {
  const y0 = new Date().getFullYear(), y = String(anio || y0);
  const years = [...new Set([y0 - 1, y0, y0 + 1, +y, ...Object.values(S.eventos).map(e => +e.fecha.slice(0, 4))])].sort();
  const act = eventosActivos();
  const rows = MESES.map((mn, i) => {
    const m = `${y}-${pad(i + 1)}`;
    const r = { m, mn, reservasHechas: 0, eventos: 0, invitados: 0, cajaCub: 0, cajaIva: 0, cajaExt: 0, egresos: 0, costoExt: 0, devCub: 0, devExt: 0, devCosto: 0 };
    act.forEach(e => {
      if (e.estado === 'reservado' && ym(e.fechaContratacion) === m) r.reservasHechas++;
      const k = getCuenta(e);
      k.pagos.forEach(p => { if (ym(p.fecha) === m) { if (p.tipo === 'iva') r.cajaIva += num(p.monto); else r.cajaCub += num(p.monto); } });
      (e.extras || []).forEach(l => (l.pagos || []).forEach(p => { if (ym(p.fecha) === m) r.cajaExt += num(p.monto); }));
      if (e.estado === 'reservado' && ym(e.fecha) === m) {
        r.eventos++; const kc = calcCuenta(e), x = calcExtras(e);
        r.invitados += kc.facturar;
        r.devCub += Math.max(0, kc.montoCub - kc.credito) + kc.montoPendiente;
        r.devExt += x.total; r.devCosto += x.costo;
      }
    });
    Object.values(S.egresos).forEach(g => { if (ym(g.fecha) === m) r.egresos += num(g.monto); });
    r.costoExt = r.devCosto;
    r.resultado = r.cajaCub + r.cajaExt - r.egresos - r.costoExt;
    return r;
  });
  const T = k => sum(rows, r => r[k]);
  const egCat = {}; Object.values(S.egresos).filter(g => g.fecha.startsWith(y)).forEach(g => egCat[g.categoria] = (egCat[g.categoria] || 0) + num(g.monto));
  const tiposAnio = {}; act.filter(e => e.estado === 'reservado' && e.fecha.startsWith(y)).forEach(e => { const t = tipoEv(e) || 'Sin tipo'; tiposAnio[t] = (tiposAnio[t] || 0) + 1; });
  const maxEv = Math.max(1, ...rows.map(r => r.eventos));
  return `<div class="top"><h1>Métricas ${y}</h1><div class="year-tabs">${years.map(v => `<a href="#/metricas/${v}" class="${String(v) === y ? 'on' : ''}">${v}</a>`).join('')}</div></div>
  <div class="cards">
    <div class="card"><div class="k">Eventos ${y}</div><div class="v">${T('eventos')}</div></div>
    <div class="card"><div class="k">Reservas cerradas en ${y}</div><div class="v">${T('reservasHechas')}</div></div>
    <div class="card good"><div class="k">Cobrado cubiertos</div><div class="v">${fmt$(T('cajaCub'))}</div></div>
    <div class="card good"><div class="k">Cobrado extras</div><div class="v">${fmt$(T('cajaExt'))}</div></div>
    <div class="card bad"><div class="k">Egresos + costo extras</div><div class="v">${fmt$(T('egresos') + T('costoExt'))}</div></div>
    <div class="card ${T('resultado') >= 0 ? 'good' : 'bad'}"><div class="k">Resultado de caja</div><div class="v">${fmt$(T('resultado'))}</div></div>
  </div>
  <div class="panel tbl-wrap"><h2>Caja: lo que entró y salió cada mes</h2>
  <p class="small muted" style="margin-top:-4px">Ingresos por fecha de cobro. <b>Tocá un mes para ver de qué cliente y evento vino cada cobro.</b> Costo de extras en el mes del evento. Los pesos son nominales: con inflación, comparar meses lejanos exagera el crecimiento.</p>
  <table><thead><tr><th>Mes</th><th class="num">Reservas cerradas</th><th class="num">Eventos</th><th class="num">Cobrado cubiertos</th><th class="num">Cobrado extras</th><th class="num">Egresos</th><th class="num">Costo extras</th><th class="num">Resultado</th></tr></thead><tbody>
  ${rows.map(r => `<tr class="click" data-mes="${r.m}" title="Ver el detalle de lo cobrado en ${r.mn}"><td class="nowrap">${r.mn} <span class="small muted">›</span></td><td class="num">${r.reservasHechas || ''}</td><td class="num"><span style="display:inline-block;height:8px;background:var(--gold-2);border-radius:4px;width:${r.eventos / maxEv * 50}px;margin-right:6px"></span>${r.eventos || ''}</td><td class="num">${r.cajaCub ? fmt$(r.cajaCub) : ''}</td><td class="num">${r.cajaExt ? fmt$(r.cajaExt) : ''}</td><td class="num">${r.egresos ? fmt$(r.egresos) : ''}</td><td class="num">${r.costoExt ? fmt$(r.costoExt) : ''}</td><td class="num" style="color:${r.resultado < 0 ? 'var(--rojo)' : 'inherit'}">${r.resultado ? fmt$(r.resultado) : ''}</td></tr>`).join('')}
  </tbody><tfoot><tr><td>Total</td><td class="num">${T('reservasHechas')}</td><td class="num">${T('eventos')}</td><td class="num">${fmt$(T('cajaCub'))}</td><td class="num">${fmt$(T('cajaExt'))}</td><td class="num">${fmt$(T('egresos'))}</td><td class="num">${fmt$(T('costoExt'))}</td><td class="num">${fmt$(T('resultado'))}</td></tr></tfoot></table>
  ${T('cajaIva') ? `<p class="small muted">IVA cobrado en el año (no incluido arriba): ${fmt$(T('cajaIva'))}</p>` : ''}</div>

  <div class="panel tbl-wrap"><h2>Por evento: lo que factura cada mes</h2>
  <p class="small muted" style="margin-top:-4px">Agrupado por la fecha del evento. Cubiertos = lo cobrado + lo pendiente al valor de hoy.</p>
  <table><thead><tr><th>Mes</th><th class="num">Eventos</th><th class="num">Cubiertos</th><th class="num">Facturado cubiertos</th><th class="num">Facturado extras</th><th class="num">Costo extras</th><th class="num">Margen extras</th><th class="num">Total facturado</th></tr></thead><tbody>
  ${rows.map(r => `<tr><td>${r.mn}</td><td class="num">${r.eventos || ''}</td><td class="num">${r.invitados ? fmtN(r.invitados) : ''}</td><td class="num">${r.devCub ? fmt$(r.devCub) : ''}</td><td class="num">${r.devExt ? fmt$(r.devExt) : ''}</td><td class="num">${r.devCosto ? fmt$(r.devCosto) : ''}</td><td class="num">${r.devExt ? fmt$(r.devExt - r.devCosto) : ''}</td><td class="num">${r.devCub + r.devExt ? fmt$(r.devCub + r.devExt) : ''}</td></tr>`).join('')}
  </tbody><tfoot><tr><td>Total</td><td class="num">${T('eventos')}</td><td class="num">${fmtN(T('invitados'))}</td><td class="num">${fmt$(T('devCub'))}</td><td class="num">${fmt$(T('devExt'))}</td><td class="num">${fmt$(T('devCosto'))}</td><td class="num">${fmt$(T('devExt') - T('devCosto'))}</td><td class="num">${fmt$(T('devCub') + T('devExt'))}</td></tr></tfoot></table></div>

  <div class="grid2">
    <div class="panel"><h3>Egresos ${y} por categoría</h3>${Object.keys(egCat).length ? `<table><tbody>${Object.entries(egCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num">${fmt$(v)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted small">Sin egresos.</p>'}</div>
    <div class="panel"><h3>Eventos ${y} por tipo</h3>${Object.keys(tiposAnio).length ? `<table><tbody>${Object.entries(tiposAnio).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<tr><td>${esc(c)}</td><td class="num">${v}</td></tr>`).join('')}</tbody></table>` : '<p class="muted small">Sin eventos.</p>'}</div>
  </div>`;
};

VIEWS.metricas.after = () => {
  $$('[data-mes]').forEach(tr => tr.onclick = () => detalleCobrosMes(tr.dataset.mes));
};
// cada cobro del mes (cubiertos, IVA y extras), con su cliente y evento
function cobrosDelMes(m) {
  const out = [];
  eventosActivos().forEach(e => {
    const c = nombreCli(cli(e.clienteId)), k = getCuenta(e);
    k.pagos.forEach(p => { if (ym(p.fecha) === m) out.push({ fecha: p.fecha, e, cliente: c, concepto: p.tipo === 'iva' ? 'IVA' : p.sena ? 'Seña' : 'Cubiertos', medio: medioTxt(p), monto: num(p.monto), iva: p.tipo === 'iva', nota: p.nota || '' }); });
    (e.extras || []).forEach(l => (l.pagos || []).forEach(p => { if (ym(p.fecha) === m) out.push({ fecha: p.fecha, e, cliente: c, concepto: 'Extra: ' + (l.nombre || ''), medio: medioTxt(p), monto: num(p.monto), iva: false, nota: p.nota || '' }); }));
  });
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.cliente.localeCompare(b.cliente));
}
function detalleCobrosMes(m) {
  const list = cobrosDelMes(m), sinIva = list.filter(x => !x.iva), iva = list.filter(x => x.iva);
  // resumen por cliente/evento
  const porEv = {}; sinIva.forEach(x => { const o = porEv[x.e.id] = porEv[x.e.id] || { x, total: 0 }; o.total += x.monto; });
  const resumen = Object.values(porEv).sort((a, b) => b.total - a.total);
  const body = list.length ? `<div class="full tbl-wrap"><table><thead><tr><th>Fecha</th><th>Cliente</th><th>Evento</th><th>Fecha evento</th><th>Concepto</th><th>Medio</th><th class="num">Monto</th></tr></thead><tbody>
    ${list.map(x => `<tr class="click" data-ev="${x.e.id}"${x.nota ? ` title="${esc(x.nota)}"` : ''}><td class="nowrap">${fmtD(x.fecha)}</td><td>${esc(x.cliente)}</td><td>${esc(tituloEv(x.e))}</td><td class="nowrap">${fmtD(x.e.fecha)}</td><td>${esc(x.concepto)}</td><td class="small">${esc(x.medio)}</td><td class="num">${fmt$(x.monto)}</td></tr>`).join('')}
    </tbody><tfoot><tr><td colspan="6">Total cobrado${iva.length ? ' (sin IVA)' : ''}</td><td class="num">${fmt$(sum(sinIva, x => x.monto))}</td></tr>${iva.length ? `<tr><td colspan="6">IVA cobrado</td><td class="num">${fmt$(sum(iva, x => x.monto))}</td></tr>` : ''}</tfoot></table></div>
    ${resumen.length > 1 ? `<div class="full"><h3 style="margin:14px 0 6px">Por cliente</h3><table><tbody>${resumen.map(o => `<tr class="click" data-ev="${o.x.e.id}"><td>${esc(o.x.cliente)}</td><td class="small">${esc(tituloEv(o.x.e))} · ${fmtD(o.x.e.fecha)}</td><td class="num">${fmt$(o.total)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <p class="small muted full">Tocá una fila para abrir la ficha del evento.</p>`
    : '<p class="muted full">No hubo cobros este mes.</p>';
  const { d, close } = modal({ title: 'Cobros de ' + fmtYM(m), body, submit: null, wide: true });
  $$('[data-ev]', d).forEach(tr => tr.onclick = () => { close(); go('evento/' + tr.dataset.ev); });
}

/* ---------- CONFIGURACIÓN ---------- */
VIEWS.config = () => {
  const c = CONF();
  return `<div class="top"><h1>Configuración</h1></div>
  <div class="grid2">
    <div class="panel"><div class="panel-h"><h2>Valores por defecto</h2><button id="edDef">Editar</button></div>
      <dl class="kv"><dt>Mínimo sábados</dt><dd>${c.minimos[5]} cubiertos</dd><dt>Mínimo viernes</dt><dd>${c.minimos[4]} cubiertos</dd><dt>Mínimo otros días</dt><dd>${c.minimos.otro} cubiertos</dd>
      <dt>Seña</dt><dd>${c.sena} cubiertos</dd><dt>Semana del evento</dt><dd>${c.reservaSemana} cubiertos</dd><dt>Meses sin ajuste</dt><dd>${c.mesesCongelado}</dd>
      <dt>Validez pendiente</dt><dd>${c.validezPendiente} días</dd><dt>IVA</dt><dd>${c.iva.pct}% · ${c.iva.activoPorDefecto ? 'activado por defecto' : 'desactivado por defecto'}</dd></dl>
      <p class="small muted">Aplican a los eventos nuevos. Cada evento se puede cambiar en sus Condiciones.</p></div>
    <div class="panel"><div class="panel-h"><h2>Feriados extra</h2><button id="edFer">Editar</button></div>
      <p class="small muted" style="margin-top:0">Los feriados nacionales (fijos, trasladables, Carnaval y Semana Santa) se calculan solos para cada año. Los puentes turísticos se cargan desde el <b>Calendario → Editar feriados</b> cuando el Gobierno los anuncia. Acá podés agregar fechas sueltas.</p>
      <p class="small">${(c.feriadosExtra || []).sort().map(fmtD).join(', ') || '—'}</p></div>
  </div>
  <div class="panel"><div class="panel-h"><h2>Timings modelo</h2><button id="addTm">+ Nuevo modelo</button></div>
    <p class="small muted" style="margin-top:0">Son la base que se carga en cada evento. Cambiarlos no modifica los timings que ya están cargados en los eventos.</p>
    <div class="grid3">${(c.timings || []).map((t, i) => `<div class="card"><div class="panel-h"><b>${esc(t.nombre)}</b><button class="btn-sm" data-tm="${i}">Editar</button></div>
      <div class="small">${tramosTiming(t).map(x => `${fmtHora(x.hora)} ${esc(x.momento)}`).join(' · ')}</div></div>`).join('')}</div></div>
  <div class="panel"><div class="panel-h"><h2>Listas de opciones</h2></div><div class="grid3">
    ${Object.entries(LISTA_LABELS).map(([k, t]) => `<div class="card"><div class="panel-h"><b>${t}</b><button class="btn-sm" data-lista="${k}">Editar</button></div><div class="small">${c.listas[k].map(esc).join(' · ')}</div></div>`).join('')}
  </div></div>
  <div class="panel"><h2>Datos</h2><div class="actions" style="display:flex;gap:8px;flex-wrap:wrap">
    <button id="xls">Descargar base de clientes (Excel)</button><button id="xlsEg">Descargar egresos y pagos (Excel)</button><button id="bk">Descargar respaldo completo</button><label class="btn">Restaurar respaldo<input type="file" id="rest" accept=".json" hidden></label></div>
    <p class="small muted">Conviene descargar un respaldo una vez por mes y guardarlo en tu Drive.</p></div>`;
};
VIEWS.config.after = () => {
  const c = CONF();
  const saveConf = patch => DB.save('config', { ...(S.config.general || clean(DEFAULT_CONFIG)), id: 'general', ...patch });
  $('#edDef').onclick = () => modal({
    title: 'Valores por defecto',
    body: F.num('sab', 'Mínimo sábados', c.minimos[5]) + F.num('vie', 'Mínimo viernes', c.minimos[4]) + F.num('otro', 'Mínimo otros días', c.minimos.otro) + F.num('sena', 'Seña (cubiertos)', c.sena) +
      F.num('reservaSemana', 'Cubiertos para la semana del evento', c.reservaSemana) + F.num('mesesCongelado', 'Meses sin ajuste', c.mesesCongelado) + F.num('validezPendiente', 'Validez de una reserva pendiente (días)', c.validezPendiente) + F.num('ivaPct', 'IVA %', c.iva.pct) + F.chk('ivaOn', 'Sumar IVA por defecto en eventos nuevos', c.iva.activoPorDefecto, 'full'),
    onSubmit: d => saveConf({ minimos: { 5: num(d.sab), 4: num(d.vie), otro: num(d.otro) }, sena: num(d.sena), reservaSemana: num(d.reservaSemana), mesesCongelado: num(d.mesesCongelado), validezPendiente: num(d.validezPendiente), iva: { pct: pct(d.ivaPct) ?? 21, activoPorDefecto: d.ivaOn } }),
  });
  $('#edFer').onclick = () => modal({
    title: 'Feriados extra', body: F.area('f', 'Una fecha por renglón (DD/MM/AAAA)', (c.feriadosExtra || []).sort().map(fmtD).join('\n'), 'style="min-height:180px"'),
    onSubmit: d => saveConf({ feriadosExtra: d.f.split(/\n+/).map(s => s.trim()).filter(Boolean).map(s => { const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${pad(m[2])}-${pad(m[1])}` : null; }).filter(Boolean) }),
  });
  const formModelo = i => {
    const lista = clean(c.timings || []), t = i === null ? { id: 'm' + uid(), nombre: '', fin: '', items: [] } : lista[i];
    modal({ title: i === null ? 'Nuevo timing modelo' : 'Timing modelo', wide: true,
      body: F.text('nombre', 'Nombre del modelo', t.nombre, 'class="full"') +
        F.area('items', 'Un momento por renglón: hora y nombre. Para una nota, agregá " | nota" al final.', t.items.map(x => `${x.hora} ${x.momento}${x.nota ? ' | ' + x.nota : ''}`).join('\n'), 'style="min-height:240px" placeholder="21:30 Recepción\n23:00 Presentación | Video de entrada"') +
        `<label class="f"><span>Termina a las</span><input type="time" name="fin" value="${esc(t.fin || '')}"></label>`,
      danger: i === null ? null : { label: 'Eliminar modelo', confirm: '¿Eliminar este timing modelo? Los eventos que ya lo tienen no cambian.', fn: () => { lista.splice(i, 1); saveConf({ timings: lista }); } },
      onSubmit: d => {
        if (!d.nombre) { toast('Poné un nombre al modelo.'); return false; }
        const items = [];
        for (const linea of d.items.split(/\n+/).map(x => x.trim()).filter(Boolean)) {
          const m = linea.match(/^(\d{1,2})[:.](\d{2})\s*(?:hs\.?)?\s+(.+)$/);
          if (!m) { toast('No entendí el renglón "' + linea + '". Empezá con la hora, ej.: 21:30 Recepción'); return false; }
          const [mom, nota] = m[3].split('|').map(x => x.trim());
          items.push({ hora: `${pad(m[1])}:${m[2]}`, momento: mom, ...(nota ? { nota } : {}) });
        }
        if (!items.length) { toast('Agregá al menos un momento.'); return false; }
        const nuevo = { ...t, nombre: d.nombre, fin: d.fin, items };
        if (i === null) lista.push(nuevo); else lista[i] = nuevo;
        saveConf({ timings: lista });
      } });
  };
  $$('[data-tm]').forEach(b => b.onclick = () => formModelo(+b.dataset.tm));
  $('#addTm').onclick = () => formModelo(null);
  $$('[data-lista]').forEach(b => b.onclick = () => { const k = b.dataset.lista; modal({ title: LISTA_LABELS[k], body: F.area('v', 'Una opción por renglón', c.listas[k].join('\n'), 'style="min-height:220px"'), onSubmit: d => saveConf({ listas: { ...c.listas, [k]: d.v.split('\n').map(s => s.trim()).filter(Boolean) } }) }); });
  $('#xls').onclick = exportarExcel;
  $('#xlsEg').onclick = exportarMovimientos;
  $('#bk').onclick = () => download(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), `respaldo-salon-dorado-${todayISO()}.json`);
  $('#rest').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      confirmar('Se van a cargar los datos del respaldo (se suman y reemplazan los que tengan el mismo id). ¿Seguir?', () => {
        COLS.forEach(col => Object.values(data[col] || {}).forEach(o => DB.save(col, o, true)));
        DB.onChange(false); toast('Respaldo restaurado');
      });
    } catch (err) { toast('El archivo no es un respaldo válido.'); }
  };
};

/* ====== impresión, Excel, demo e inicio ====== */

/* ---------- IMPRESIÓN (hoja en blanco, sin costos) ---------- */
let PRINT_OPTS = { cub: true, ext: true, mes: false };
VIEWS.imprimir = id => {
  const e = ev(id); if (!e) return '<p>Evento no encontrado.</p>';
  const c = cli(e.clienteId), k = calcCuenta(e), x = calcExtras(e), o = PRINT_OPTS;
  const tot = (o.cub ? k.montoPendiente + k.ivaPendiente : 0) + (o.ext ? Math.max(0, x.saldo) : 0);
  return `<div class="no-print print-opts"><a href="#/evento/${id}">← Volver al evento</a>
    <label class="chk"><input type="checkbox" data-po="cub" ${o.cub ? 'checked' : ''}> Cubiertos</label>
    <label class="chk"><input type="checkbox" data-po="mes" ${o.mes ? 'checked' : ''}> Detalle mes a mes</label>
    <label class="chk"><input type="checkbox" data-po="ext" ${o.ext ? 'checked' : ''}> Extras</label>
    <button class="btn-primary" onclick="window.print()">Imprimir</button></div>
  <div class="print-doc">
    <div class="ph"><img src="${LOGO}" alt="Salón Dorado"><div class="right"><div style="font-size:1.2rem;font-family:Georgia,serif">Estado de cuenta</div><div>Emitido el ${fmtD(todayISO())}</div></div></div>
    <table style="margin-bottom:6px"><tbody>
      <tr><td style="width:28%"><b>Cliente</b></td><td>${esc(nombreCli(c))}${c.celular ? ' · ' + esc(fmtTel(c.celular)) : ''}</td></tr>
      <tr><td><b>Evento</b></td><td>${esc(tituloEv(e))}</td></tr>
      <tr><td><b>Fecha</b></td><td>${fmtDL(e.fecha)}</td></tr>
    </tbody></table>
    ${o.cub ? `<h2>Cubiertos</h2>
    <table><tbody>
      <tr><td>Cubiertos ${k.c.final.confirmado ? 'finales' : 'contratados'}</td><td class="num">${fmtN(k.facturar)}${k.c.final.confirmado ? ` <span style="color:#777">(${num(k.c.final.adultos)} adultos + ${num(k.c.final.ninos)} niños de 4 a 10 años a ½)</span>` : ''}</td></tr>
      <tr><td>Cubiertos abonados (valor congelado)</td><td class="num">${fmtN(k.pagados)}</td></tr>
      <tr><td>Cubiertos pendientes</td><td class="num">${fmtN(Math.max(0, k.pendientes))}</td></tr>
      <tr><td>Valor del cubierto al ${fmtD(todayISO())}</td><td class="num">${fmt$(k.valorHoy)}</td></tr>
    </tbody></table>
    ${k.pagos.filter(p => p.tipo !== 'iva').length ? `<h3 style="margin-top:12px">Pagos recibidos</h3><table><thead><tr><th>Fecha</th><th>Concepto</th><th class="num">Importe</th><th class="num">Valor cubierto</th><th class="num">Cubiertos</th></tr></thead><tbody>
      ${k.pagos.filter(p => p.tipo !== 'iva').map(p => `<tr><td>${fmtD(p.fecha)}</td><td>${p.sena ? 'Seña' : 'Pago'}</td><td class="num">${fmt$(p.monto)}</td><td class="num">${fmt$(p.valor)}</td><td class="num">${fmtN(p.cubiertos)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="2">Total abonado</td><td class="num">${fmt$(k.montoCub)}</td><td></td><td class="num">${fmtN(k.pagados)}</td></tr></tfoot></table>` : ''}
    ${o.mes ? `<h3 style="margin-top:12px">Valor del cubierto mes a mes</h3><table><thead><tr><th>Mes</th><th class="num">Ajuste</th><th class="num">Valor cubierto</th></tr></thead><tbody>${k.meses.filter(r => r.mes <= ym(todayISO()) || r.i === 0).map(r => `<tr><td>${fmtYM(r.mes)}</td><td class="num">${r.i === 0 ? 'Valor inicial' : r.aplica ? (r.pct !== null ? fmtP(r.pct) : 'pendiente') : 'Sin ajuste'}</td><td class="num">${fmt$(r.valor)}</td></tr>`).join('')}</tbody></table>` : ''}
    <div class="tot" style="margin-top:10px"><table><tbody>
      ${k.credito > 0 && k.pendientes > 0 ? `<tr><td>Saldo a favor en pesos</td><td class="num">${fmt$(k.credito)}</td></tr>` : ''}
      <tr><td><b>Pendiente cubiertos (valor de hoy)</b></td><td class="num"><b>${fmt$(k.montoPendiente)}</b></td></tr>
      ${k.ivaOn ? `<tr><td>IVA ${fmtP(k.ivaPct)} (total ${fmt$(k.ivaTotal)}, abonado ${fmt$(k.montoIva)})</td><td class="num">${fmt$(k.ivaPendiente)}</td></tr>` : ''}
      ${k.aFavor > 0 && k.pendientes <= 0 ? `<tr><td>A favor del cliente</td><td class="num">${fmt$(k.aFavor)}</td></tr>` : ''}
    </tbody></table></div>
    ${k.pendientes > 0 ? `<p style="color:#666;font-size:11px">Los cubiertos pendientes se actualizan según las condiciones contratadas. Los cubiertos abonados quedan congelados.${k.reservaSemana && daysBetween(todayISO(), e.fecha) > 7 && k.antesSemana > 0 ? ` Se abonan ${fmtN(k.antesSemana)} cubiertos antes de la semana del evento y ${fmtN(Math.min(k.pendientes, k.reservaSemana))} durante esa semana.` : ''}</p>` : ''}` : ''}

    ${o.ext && x.lines.length ? `<h2>Adicionales</h2><table><thead><tr><th>Concepto</th><th class="num">Cant.</th><th class="num">Importe</th><th class="num">Abonado</th><th class="num">Saldo</th></tr></thead><tbody>
      ${x.lines.map(l => `<tr><td>${esc(l.nombre)}</td><td class="num">${l.cant}</td><td class="num">${l.regalo ? 'Obsequio' : fmt$(l.total)}</td><td class="num">${l.pagado ? fmt$(l.pagado) : '—'}</td><td class="num">${l.regalo ? '—' : fmt$(l.saldo)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="2">Total adicionales</td><td class="num">${fmt$(x.total)}</td><td class="num">${fmt$(x.pagado)}</td><td class="num">${fmt$(x.saldo)}</td></tr></tfoot></table>` : ''}

    <div class="tot" style="margin-top:16px"><table><tbody><tr><td style="font-size:1.05rem"><b>Total pendiente</b></td><td class="num" style="font-size:1.05rem"><b>${fmt$(tot)}</b></td></tr></tbody></table></div>
    <div class="foot">Salón Dorado · Villa Urquiza, Ciudad Autónoma de Buenos Aires</div>
  </div>`;
};
/* ---------- TIMING del evento ---------- */
const tieneTiming = e => !!(e.timing && (e.timing.items || []).length);
const minDe = h => { const [a, b] = String(h || '0:0').split(':').map(Number); return (a || 0) * 60 + (b || 0); };
const horaDe = m => { m = ((m % 1440) + 1440) % 1440; return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
const fmtHora = h => h ? `${+h.slice(0, 2)}.${h.slice(3, 5)}` : '';   // '00:45' → '0.45' (como en los timings de Canva)
// cada momento termina cuando empieza el siguiente; el último, a la hora de fin
function tramosTiming(t) {
  const it = (t.items || []).filter(x => x.hora || x.momento);
  return it.map((x, i) => ({ ...x, hasta: i < it.length - 1 ? it[i + 1].hora : t.fin || '' }));
}
function tablaTiming(t, cls = '') {
  return `<table class="${cls}"><tbody>${tramosTiming(t).map(x => `<tr><td class="nowrap" style="width:150px">${fmtHora(x.hora)}${x.hasta ? ' a ' + fmtHora(x.hasta) : ''} hs.</td><td><b>${esc(x.momento)}</b>${x.nota ? ` <span class="muted small">· ${esc(x.nota)}</span>` : ''}</td></tr>`).join('')}</tbody></table>`;
}
const plantillasTiming = () => CONF().timings || [];
function plantillaSugerida(e) {
  const P = plantillasTiming(), bb = /mitzv/i.test(tipoEv(e)), d = e.fecha ? dow(e.fecha) : 6;
  return (bb && d === 0 && P.find(p => p.id === 'barbat-dom')) || (bb && P.find(p => p.id === 'barbat-sab')) || P.find(p => p.id === 'noche') || P[0];
}

function formTiming(id) {
  const e = ev(id);
  const P = plantillasTiming();
  let t = tieneTiming(e) ? clean(e.timing) : null;
  if (!t) { const p = plantillaSugerida(e); t = p ? { plantilla: p.id, fin: p.fin, items: clean(p.items) } : { fin: '', items: [{ hora: '', momento: '' }] }; }
  const filas = () => t.items.map((x, i) => `<div class="tm-row" data-i="${i}">
      <input type="time" data-f="hora" value="${esc(x.hora || '')}" aria-label="Hora">
      <input data-f="momento" value="${esc(x.momento || '')}" placeholder="Momento (ej.: Recepción)" aria-label="Momento">
      <input data-f="nota" value="${esc(x.nota || '')}" placeholder="Nota (opcional)" aria-label="Nota">
      <span class="tm-btns"><button type="button" class="btn-sm" data-up="${i}" title="Subir">↑</button><button type="button" class="btn-sm" data-down="${i}" title="Bajar">↓</button><button type="button" class="btn-sm btn-danger" data-del-row="${i}" title="Quitar">✕</button></span></div>`).join('');
  const body = `${F.hint('Cada momento termina cuando empieza el siguiente. Si cambian los horarios, usá <b>Correr horarios</b> para mover todo junto, o cambiá la hora de un momento.')}
    <div class="full filters"><select id="tmPl">${P.map(p => `<option value="${esc(p.id)}" ${p.id === t.plantilla ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select><button type="button" id="tmCargar">Cargar este modelo</button></div>
    <div class="full" id="tmRows"></div>
    <div class="full filters"><button type="button" id="tmAdd">+ Agregar momento</button>
      <label class="f" style="flex-direction:row;align-items:center;gap:6px;margin-left:auto">Termina a las <input type="time" id="tmFin" style="width:auto" value="${esc(t.fin || '')}"></label></div>
    <div class="full filters" style="border-top:1px solid var(--line);padding-top:10px">Correr horarios
      <select id="tmDesde"></select>
      <input type="number" id="tmMin" step="5" value="30" style="width:80px"> minutos
      <button type="button" id="tmAtras">Más temprano</button><button type="button" id="tmAdel">Más tarde</button></div>`;
  const { d } = modal({ title: 'Timing · ' + esc(tituloEv(e) || 'Evento'), body, wide: true,
    danger: tieneTiming(e) ? { label: 'Borrar timing', confirm: '¿Borrar el timing de este evento?', fn: () => { const E = clean(ev(id)); delete E.timing; DB.save('eventos', E); } } : null,
    onSubmit: () => {
      leer();
      const items = t.items.map(x => ({ hora: x.hora || '', momento: (x.momento || '').trim(), ...(x.nota && x.nota.trim() ? { nota: x.nota.trim() } : {}) })).filter(x => x.hora || x.momento);
      if (!items.length) { toast('Agregá al menos un momento.'); return false; }
      DB.save('eventos', { ...clean(ev(id)), timing: { plantilla: t.plantilla || '', fin: $('#tmFin', d).value, items } });
      toast('Timing guardado');
    } });
  const leer = () => { $$('.tm-row', d).forEach(r => { const x = t.items[+r.dataset.i]; $$('[data-f]', r).forEach(inp => x[inp.dataset.f] = inp.value); }); t.fin = $('#tmFin', d).value; };
  const pintar = () => {
    $('#tmRows', d).innerHTML = filas();
    $('#tmDesde', d).innerHTML = `<option value="0">todo el timing</option>` + t.items.map((x, i) => i ? `<option value="${i}">desde ${esc(x.momento || 'momento ' + (i + 1))}</option>` : '').join('');
    $$('[data-del-row]', d).forEach(b => b.onclick = () => { leer(); t.items.splice(+b.dataset.delRow, 1); pintar(); });
    $$('[data-up]', d).forEach(b => b.onclick = () => { leer(); const i = +b.dataset.up; if (i > 0) { [t.items[i - 1], t.items[i]] = [t.items[i], t.items[i - 1]]; pintar(); } });
    $$('[data-down]', d).forEach(b => b.onclick = () => { leer(); const i = +b.dataset.down; if (i < t.items.length - 1) { [t.items[i + 1], t.items[i]] = [t.items[i], t.items[i + 1]]; pintar(); } });
  };
  pintar();
  $('#tmAdd', d).onclick = () => { leer(); const ult = t.items[t.items.length - 1]; t.items.push({ hora: ult && ult.hora ? horaDe(minDe(ult.hora) + 30) : '', momento: '' }); pintar(); };
  $('#tmCargar', d).onclick = () => {
    const p = P.find(z => z.id === $('#tmPl', d).value); if (!p) return;
    const cargar = () => { t = { plantilla: p.id, fin: p.fin, items: clean(p.items) }; $('#tmFin', d).value = p.fin || ''; pintar(); };
    leer(); if (t.items.some(x => x.momento)) { if (!window.__tmOk) { window.__tmOk = true; toast('Tocá de nuevo para reemplazar lo cargado por el modelo.'); setTimeout(() => window.__tmOk = false, 4000); return; } window.__tmOk = false; }
    cargar();
  };
  const correr = sign => {
    leer(); const m = num($('#tmMin', d).value) * sign, desde = +$('#tmDesde', d).value;
    if (!m) return;
    t.items.forEach((x, i) => { if (i >= desde && x.hora) x.hora = horaDe(minDe(x.hora) + m); });
    if (t.fin) { t.fin = horaDe(minDe(t.fin) + m); $('#tmFin', d).value = t.fin; }
    pintar(); toast(`Horarios corridos ${Math.abs(m)} minutos ${sign > 0 ? 'más tarde' : 'más temprano'}`);
  };
  $('#tmAdel', d).onclick = () => correr(1);
  $('#tmAtras', d).onclick = () => correr(-1);
}

// hoja para imprimir, con el estilo de los timings de Canva
const TIMING_OPTS = { notas: true };
VIEWS.timing = id => {
  const e = ev(id); if (!e) return '<p>Evento no encontrado.</p>';
  if (!tieneTiming(e)) return `<p>Este evento no tiene timing. <a href="#/evento/${id}">Volver</a></p>`;
  const o = TIMING_OPTS;
  return `<div class="no-print print-opts"><a href="#/evento/${id}">← Volver al evento</a>
    <label class="chk"><input type="checkbox" data-to="notas" ${o.notas ? 'checked' : ''}> Columna para anotar a mano</label>
    <button id="edT2">Editar horarios</button>
    <button class="btn-primary" onclick="window.print()">Imprimir / Guardar PDF</button></div>
  <div class="print-doc timing-doc">
    <div class="center"><img src="${LOGO}" alt="Salón Dorado" style="width:170px"></div>
    <div class="center" style="font-size:1.6rem;margin-top:14px">Timing</div>
    <div class="center" style="margin-top:4px">${esc(DIAS[dow(e.fecha)])} ${fmtD(e.fecha)}</div>
    <div class="center" style="color:#777;margin-top:2px">${esc(tituloEv(e))}</div>
    <table class="tm-print"><tbody>${tramosTiming(e.timing).map(x => `<tr>
      <td class="tm-h">${fmtHora(x.hora)}${x.hasta ? ' a ' + fmtHora(x.hasta) : ''} hs.</td>
      <td class="tm-m">${x.nota ? `<div class="tm-n">${esc(x.nota)}</div>` : ''}<b>${esc(x.momento)}</b></td>
      ${o.notas ? '<td class="tm-esc"></td>' : ''}</tr>`).join('')}</tbody></table>
  </div>`;
};
VIEWS.timing.after = id => {
  $$('[data-to]').forEach(i => i.onchange = () => { TIMING_OPTS[i.dataset.to] = i.checked; render(); });
  const b = $('#edT2'); if (b) b.onclick = () => formTiming(id);
};

/* ---------- contrato para firmar (se completa con los datos del evento) ---------- */
const linkOk = u => /^https?:\/\//i.test(String(u || '').trim());
const CT_CAMPOS = [
  ['fecha', 'Fecha del contrato', 'date'], ['resp', 'Responsable del salón', 'text'], ['respDni', 'DNI del responsable', 'text'],
  ['recibiDe', 'Recibí de (Sr./Sra.)', 'text'], ['monto', 'Suma recibida ($)', 'num'], ['concepto', 'En concepto de', 'concepto'],
  ['desde', 'Horario desde', 'time'], ['hasta', 'Horario hasta', 'time'], ['festejo', 'Festejando', 'text'], ['de', 'De (homenajeado/a)', 'text'],
  ['valor', 'Costo por persona ($)', 'num'], ['fijoHasta', 'Valor fijo hasta el', 'date'], ['indiceMes', 'Ajusta desde el índice de', 'month'],
  ['invitados', 'Invitados estimados', 'num'], ['minimo', 'Mínimo de cubiertos enteros', 'num'], ['tel', 'Teléfono del cliente', 'text'],
];
const CT_CONCEPTOS = ['Seña', 'Pago Parcial', 'Pago Total'];
let CT_DRAFT = null;   // { id, datos } lo que se está editando antes de guardar
function contratoAuto(e) {
  const c = cli(e.clienteId) || {}, k = calcCuenta(e), cu = k.c;
  const pagos = (cu.pagos || []).filter(x => x.tipo !== 'iva').sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
  const pg = pagos.find(x => x.sena) || pagos[0];
  const finCong = addMonths(k.desde, num(cu.mesesCongelado));
  const [fy, fm] = finCong.split('-').map(Number);
  const t = tieneTiming(e) ? tramosTiming(e.timing) : [];
  const yo = (CONF().contratoResp || {})[((DB.user || {}).email || '').toLowerCase()] || {};
  return {
    fecha: e.fechaContratacion || todayISO(), resp: yo.nombre || '', respDni: yo.dni || '',
    recibiDe: nombreCli(c), monto: pg ? String(num(pg.monto)) : '', concepto: 'Seña',
    desde: t.length ? t[0].hora : '', hasta: t.length ? t[t.length - 1].hasta : '',
    festejo: tipoEv(e), de: e.homenajeado || '',
    valor: num(cu.valorBase) ? String(num(cu.valorBase)) : '', fijoHasta: num(cu.valorBase) ? `${finCong}-${pad(new Date(fy, fm, 0).getDate())}` : '', indiceMes: num(cu.valorBase) ? finCong : '',
    invitados: e.invitados ? String(e.invitados) : '', minimo: String(num(cu.minimo) || ''), tel: fmtTel(c.celular) || '',
  };
}
function contratoDatos(e) {
  if (CT_DRAFT && CT_DRAFT.id === e.id) return CT_DRAFT.datos;
  const auto = contratoAuto(e), g = e.contrato || {};
  const d = {}; CT_CAMPOS.forEach(([k]) => d[k] = k in g ? g[k] : auto[k]);
  return d;
}
function contratoDoc(e, d) {
  const C = CONF(), sena = num(C.sena) || 20, semana = num(C.reservaSemana) || 30;
  const v = (x, w = 90) => x !== '' && x !== null && x !== undefined ? `<b class="ct-v">${esc(x)}</b>` : `<span class="ct-b" style="min-width:${w}px"></span>`;
  const [y, m, dd] = (d.fecha || '').split('-');
  const [ey, em, ed] = (e.fecha || '').split('-');
  const [hy, hm, hd] = (d.fijoHasta || '').split('-');
  const [iy, im] = (d.indiceMes || '').split('-');
  const mes = n => n ? MESES[+n - 1].toLowerCase() : '';
  const plata = x => x !== '' && x !== undefined ? Math.round(num(x)).toLocaleString('es-AR') : '';
  const hs = h => h ? fmtHora(h) : '';
  const conc = CT_CONCEPTOS.map(t => t === d.concepto ? `<b class="ct-v">${t}</b>` : `<s style="color:#999">${t}</s>`).join(' / ');
  return `<div class="print-doc contrato-doc">
    <div class="ct-logo"><img src="${LOGO}" alt="Salón Dorado"></div>
    <p>En C.A.B.A, a los ${v(dd ? +dd : '', 40)} días del mes de ${v(mes(m), 120)} del ${v(y, 60)}.</p>
    <p>Yo ${v(d.resp, 160)} DNI ${v(d.respDni, 110)} en carácter de responsable del Salón Dorado, sito en Av. Monroe 4878, C.A.B.A. dejo constancia de haber recibido de parte
    del Sr./Sra ${v(d.recibiDe, 260)} la suma de $ ${v(plata(d.monto), 160)} en concepto de ${conc} correspondiente a la contratación del Salón Dorado para la
    realización de un evento <u>PRIVADO</u>, con <u>Lista de Invitados</u>, a llevarse a cabo el día ${v(ed ? +ed : '', 40)} de ${v(mes(em), 110)} de ${v(ey, 60)} en el horario de ${v(hs(d.desde), 60)} a ${v(hs(d.hasta), 60)} hs. festejando
    ${v(d.festejo, 150)} de ${v(d.de, 200)}.</p>
    <p>El evento se celebrará en el Salón Dorado, incluyendo el servicio de comida y bebidas y demás prestaciones que se detallan en cartilla adjunta.</p>
    <p>El costo del mismo es de $ ${v(plata(d.valor), 110)} por persona, cuyo valor se mantendrá hasta el ${v(hd ? +hd : '', 40)} de ${v(mes(hm), 110)} de ${v(hy, 60)}, luego se irá ajustando mes a mes en forma
    acumulativa tomando como referencia el Índice de Precios al Consumidor o en su defecto el que lo reemplace brindado por el INDEC a partir del índice del mes de
    ${v(im ? mes(im) + ' de ' + iy : '', 130)}. Para hacerse efectiva dicha contratación deberá abonarse el importe correspondiente a ${sena} cubiertos al momento de la misma. Los pagos se realizarán en
    efectivo en el Salón. Para otras formas de pagos consultar previamente ya que podrán sufrir algún tipo de recargos. (Ej. + IVA). Se podrá ir cancelando y congelando cubiertos
    en forma voluntaria al valor del momento del pago. Los últimos ${semana} cubiertos deberán abonarse el lunes anterior al evento, junto con la entrega de la Lista definitiva de
    Invitados. Los importes de los invitados faltantes no serán reintegrados. Niños menores de 4 años no abonan y de 4 a 10 abonan el valor de medio cubierto.</p>
    <p><u>Impuestos y Cargos Extras</u>: Los impuestos de Sadaic y Aadi-Capif NO están incluidos, (A la fecha está suspendido su pago) si correspondiese abonarse los mismos deberán ser
    cancelados también el lunes anterior al evento.</p>
    <div class="ct-sec"><h3>Pagos en Moneda Extranjera</h3>
    <p>Se establece como forma de pago preferentemente el Peso Argentino. En caso de que el cliente opte por abonar en Dólares Estadounidenses, los mismos serán tomados al valor
    de Compra vigente al momento del pago, el cual resulta sensiblemente inferior al valor de mercado. Por tal motivo el Salón recomienda expresamente que el cliente realice el
    cambio de moneda por su cuenta en una casa de cambio o entidad de su confianza, ya que efectuar el cambio a través del Salón implica una cotización menos conveniente.</p></div>
    <div class="ct-sec"><h3>Cancelación del Evento</h3>
    <p>En caso de cancelación del evento la reserva de ${sena} cubiertos no será reintegrada. Los pagos voluntarios adicionales a la reserva serán devueltos en un 50% en cuatro cuotas
    mensuales consecutivas a partir de la fecha establecida para la realización del evento.</p></div>
    <div class="ct-sec"><h3>Condiciones Generales del Salón</h3>
    <p>NO se permite la participación de Organizadores de Eventos, la coordinación y organización del mismo estará bajo nuestra supervisión. Está prohibido ingresar
    elementos que puedan dañar el salón, como Pelotas, Aerosoles, Papel picado, Maquillajes, etc. (consultar antes de comprar)</p></div>
    <div class="ct-sec"><h3>Agregados al Evento</h3>
    <p>Nuestro equipo está a su disposición para asesorarlos sobre la contratación de servicios adicionales. Para consultas y contrataciones comunicarse con
    Juan al 11-34498917 o enviar un mail a anibalsevillaeventos@gmail.com</p>
    <p>Todos los agregados (Shows, decoración, cabinas de fotos, Stand de Glitter, etc.) deberán ser contratados exclusivamente a través de Salón Dorado.
    En casos excepcionales y únicamente con autorización previa el cliente podrá contratar proveedores externos, en dichos casos por cada servicio adicional contratado
    externamente se abonará un canon equivalente a dos (2) cubiertos.</p>
    <p>Esta condición aplica también a los servicios adicionales que sean obsequiados o regalados por terceros (familiares, amigos, conocidos, etc.), los cuales igualmente
    deberán contar con la autorización y abonar el canon correspondiente. No está permitido el ingreso de ningún agregado externo sin dicha autorización.</p>
    <p>No permitimos Bandas ni elementos de percusión. No facilitamos ni prestamos nuestros equipos (Micrófonos, parlantes, etc.).</p>
    <p>En cuanto a los servicios de Foto y Video, si lo desean proporcionaremos una lista de proveedores recomendados para que puedan elegir y solicitar presupuestos en forma directa.
    Dichos profesionales deberán proporcionar Nombre y Apellido, DNI y seguro de accidentes de trabajo de todas las personas que realicen tareas durante el evento.
    Solo se servirá como cortesía a fotógrafos y camarógrafos cuando los mismos no excedan la cantidad de 4 personas, los excedentes a dicha cantidad se cobrarán.</p></div>
    <div class="ct-sec ct-fin">
      <p>Invitados estimados: ${v(d.invitados ? fmtN(num(d.invitados)) : '', 60)} &nbsp;&nbsp; Mínimo de Cubiertos ENTEROS a abonar: ${v(d.minimo ? fmtN(num(d.minimo)) : '', 60)}</p>
      <p>Teléfono: ${v(d.tel, 180)}</p>
      <div class="ct-firmas"><div><div class="ct-linea"></div>CONTRATANTE<div class="ct-acl">Aclaración: ${esc(d.recibiDe || '')}</div></div>
        <div><div class="ct-linea"></div>POR SALÓN DORADO<div class="ct-acl">Aclaración: ${esc(d.resp || '')}</div></div></div>
    </div>
  </div>`;
}
VIEWS.contrato = id => {
  const e = ev(id); if (!e) return '<p>Evento no encontrado.</p>';
  const d = contratoDatos(e);
  const campo = ([k, l, t]) => t === 'concepto' ? F.sel(k, l, CT_CONCEPTOS.map(x => [x, x]), d[k])
    : t === 'num' ? F.text(k, l, d[k], 'inputmode="numeric"') : t === 'text' ? F.text(k, l, d[k])
    : `<label class="f"><span>${l}</span><input type="${t}" name="${k}" value="${esc(d[k] || '')}"></label>`;
  return `<div class="no-print print-opts"><a href="#/evento/${id}">← Volver al evento</a>
    <button class="btn-primary" onclick="window.print()">Imprimir / Guardar PDF</button></div>
  <div class="panel no-print"><div class="panel-h"><h3>Datos que se completan en el contrato</h3><button class="btn-sm" id="ctAuto">Volver a completar con los datos de la app</button></div>
    <p class="small muted" style="margin-top:0">Se completan solos con los datos del evento. Podés corregir cualquiera; si dejás uno vacío, sale la línea punteada para escribirlo a mano. Imprimí 2 copias: una para el cliente y otra para el salón.</p>
    <form id="ctForm" class="fgrid" onsubmit="return false">${CT_CAMPOS.map(campo).join('')}</form>
    <div style="display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap"><button class="btn-gold" id="ctSave">Guardar datos</button><span class="small muted" id="ctMsg"></span></div>
  </div>
  <div class="panel no-print"><div class="panel-h"><h3>Copia firmada</h3></div>
    <p class="small muted" style="margin-top:0">Escaneá el contrato firmado con el iPhone (Notas → cámara → Escanear documentos), guardalo en Google Drive o iCloud y pegá acá el link para compartir.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="ctLink" style="flex:1;min-width:240px" placeholder="https://drive.google.com/…" value="${esc(e.contratoLink || '')}"><button id="ctLinkSave">Guardar link</button>
    ${linkOk(e.contratoLink) ? `<a class="btn" target="_blank" rel="noopener" href="${esc(e.contratoLink)}">Abrir</a>` : ''}</div>
  </div>
  <div id="ctDoc">${contratoDoc(e, d)}</div>`;
};
VIEWS.contrato.after = id => {
  const e = ev(id); if (!e) return;
  const form = $('#ctForm');
  const leer = () => { const r = readForm(form), d = {}; CT_CAMPOS.forEach(([k]) => d[k] = String(r[k] ?? '').trim()); return d; };
  const upd = () => { CT_DRAFT = { id, datos: leer() }; $('#ctDoc').innerHTML = contratoDoc(ev(id), CT_DRAFT.datos); $('#ctMsg').textContent = 'Cambios sin guardar'; };
  form.addEventListener('input', upd); form.addEventListener('change', upd);
  const guardar = () => {
    const d = leer(), E = clean(ev(id)); E.contrato = d;
    const em = ((DB.user || {}).email || '').toLowerCase();
    const R = CONF().contratoResp || {};
    if (em && (d.resp || d.respDni) && (!R[em] || R[em].nombre !== d.resp || R[em].dni !== d.respDni))
      DB.save('config', { ...(S.config.general || clean(DEFAULT_CONFIG)), id: 'general', contratoResp: { ...R, [em]: { nombre: d.resp, dni: d.respDni } } });
    CT_DRAFT = null; DB.save('eventos', E);
  };
  $('#ctSave').onclick = () => { guardar(); toast('Datos del contrato guardados.'); };
  // imprime igual que las otras hojas (botón con window.print directo); los datos se guardan después de imprimir
  window.onafterprint = () => { if (CT_DRAFT && CT_DRAFT.id === id && location.hash.startsWith('#/contrato/')) { try { guardar(); } catch (err) { console.error(err); } } };
  $('#ctAuto').onclick = () => { CT_DRAFT = { id, datos: contratoAuto(ev(id)) }; render(); $('#ctMsg').textContent = 'Cambios sin guardar'; };
  $('#ctLinkSave').onclick = () => {
    const u = $('#ctLink').value.trim();
    if (u && !linkOk(u)) { toast('El link tiene que empezar con https://'); return; }
    const E = clean(ev(id)); E.contratoLink = u; DB.save('eventos', E); toast(u ? 'Link del contrato guardado.' : 'Link borrado.');
  };
  if (CT_DRAFT && CT_DRAFT.id === id) $('#ctMsg').textContent = 'Cambios sin guardar';
};

/* ---------- hoja de servicio para cocina y organizadora (sin precios) ---------- */
const ORDEN_OPTS = { cliente: true, menu: true, servicio: true, amb: true, timing: true, extras: true, obs: true };
VIEWS.orden = id => {
  const e = ev(id); if (!e) return '<p>Evento no encontrado.</p>';
  const c = cli(e.clienteId), k = calcCuenta(e), o = ORDEN_OPTS;
  const m = e.menu || {}, sv = e.servicio || {}, a = e.ambientacion || {};
  const esp = (sv.especiales || []).filter(x => num(x.cant));
  const fin = (k.c && k.c.final) || {};
  const conFinal = fin.confirmado || num(fin.adultos) || num(fin.ninos) || num(fin.menores);
  const fila = (t, v) => `<tr><td style="width:32%"><b>${t}</b></td><td>${v ? esc(v) : '<span style="color:#aaa">—</span>'}</td></tr>`;
  const extras = (e.extras || []).filter(l => l.nombre);
  const op = (k2, t) => `<label class="chk"><input type="checkbox" data-oo="${k2}" ${o[k2] ? 'checked' : ''}> ${t}</label>`;
  return `<div class="no-print print-opts"><a href="#/evento/${id}">← Volver al evento</a>
    ${op('cliente', 'Datos del cliente')}${op('menu', 'Menú')}${op('servicio', 'Bebida y especiales')}${op('amb', 'Ambientación')}${op('timing', 'Timing')}${op('extras', 'Adicionales')}${op('obs', 'Espacio para notas')}
    <button class="btn-primary" onclick="window.print()">Imprimir / Guardar PDF</button></div>
  <div class="print-doc">
    <div class="ph"><img src="${LOGO}" alt="Salón Dorado"><div class="right"><div style="font-size:1.2rem;font-family:Georgia,serif">Hoja de servicio</div><div>Cocina y organización</div><div style="color:#777">Impreso el ${fmtD(todayISO())}</div></div></div>
    <table style="margin-bottom:6px"><tbody>
      ${fila('Evento', tituloEv(e))}
      <tr><td style="width:32%"><b>Fecha</b></td><td><b style="font-size:1.1em">${fmtDL(e.fecha)}</b></td></tr>
      ${o.cliente ? fila('Cliente', nombreCli(c) + (c.celular ? ' · ' + fmtTel(c.celular) : '')) : ''}
      ${conFinal ? `<tr><td><b>Invitados (número final)</b></td><td><b>${fmtN(num(fin.adultos))}</b> adultos · <b>${fmtN(num(fin.ninos))}</b> niños de 4 a 10 · <b>${fmtN(num(fin.menores))}</b> menores de 4 · total <b>${fmtN(num(fin.adultos) + num(fin.ninos) + num(fin.menores))}</b>${fin.confirmado ? '' : ' <span style="color:#a3352e">(sin confirmar)</span>'}</td></tr>`
      : fila('Invitados (estimado)', e.invitados ? fmtN(e.invitados) + ' · todavía sin número final' : '')}
    </tbody></table>

    ${o.menu ? `<h2>Menú</h2><table><tbody>
      ${fila('Menú', m.menu)}${fila('Principal adultos', m.principalAdultos)}${fila('Guarnición adultos', m.guarnicionAdultos)}${fila('Principal niños', m.principalNinos)}${fila('Guarnición niños', m.guarnicionNinos)}
      ${m.notas ? fila('Notas del menú', m.notas) : ''}</tbody></table>` : ''}

    ${o.servicio ? `<h2>Menús especiales</h2>${esp.length ? `<table><thead><tr><th class="num" style="width:12%">Cant.</th><th>Tipo</th><th>Detalle</th></tr></thead><tbody>
      ${esp.map(x => `<tr><td class="num"><b>${fmtN(x.cant)}</b></td><td>${esc(x.tipo)}</td><td>${esc(x.detalle || '')}</td></tr>`).join('')}
      </tbody><tfoot><tr><td class="num">${fmtN(sum(esp, x => x.cant))}</td><td colspan="2">Total de menús especiales</td></tr></tfoot></table>` : '<p>No hay menús especiales.</p>'}
    <h2>Bebida</h2><table><tbody>
      ${fila('Barman', { si: 'Sí, agregan barman', no: 'No' }[sv.barman])}
      ${fila('Bebida extra', (BEBIDA_OPC[sv.bebida] || '') + (sv.bebidaNota ? ' · ' + sv.bebidaNota : ''))}
      ${sv.notas ? fila('Notas', sv.notas) : ''}</tbody></table>` : ''}

    ${o.amb ? `<h2>Ambientación</h2><table><tbody>
      ${fila('Centro de mesa', a.centroMesa)}${fila('Mantel', a.mantel)}${a.notas ? fila('Notas', a.notas) : ''}</tbody></table>` : ''}

    ${o.timing && tieneTiming(e) ? `<h2>Timing</h2>${tablaTiming(e.timing)}` : ''}

    ${o.extras && extras.length ? `<h2>Adicionales</h2><table><thead><tr><th>Adicional</th><th class="num" style="width:10%">Cant.</th><th>Proveedor</th></tr></thead><tbody>
      ${extras.map(l => `<tr><td>${esc(l.nombre)}</td><td class="num">${fmtN(num(l.cantidad) || 1)}</td><td>${esc([l.proveedor, l.contratado ? '' : 'falta confirmar proveedor'].filter(Boolean).join(' · '))}</td></tr>`).join('')}
      </tbody></table>` : ''}

    ${e.notas && o.cliente ? `<h2>Notas del evento</h2><p>${esc(e.notas)}</p>` : ''}
    ${o.obs ? `<h2>Observaciones</h2><div style="height:120px;border:1px solid #ddd;border-radius:6px"></div>` : ''}
    <div class="foot">Salón Dorado · Villa Urquiza, Ciudad Autónoma de Buenos Aires</div>
  </div>`;
};
VIEWS.orden.after = () => { $$('[data-oo]').forEach(i => i.onchange = () => { ORDEN_OPTS[i.dataset.oo] = i.checked; render(); }); };
VIEWS.imprimir.after = () => { $$('[data-po]').forEach(i => i.onchange = () => { PRINT_OPTS[i.dataset.po] = i.checked; render(); }); };

/* ---------- EXCEL (.xlsx sin librerías) ---------- */
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zip(files) { // files: [{name, data: Uint8Array}] sin compresión
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  files.forEach(f => {
    const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, 0, true); h.setUint16(12, 0x21, true);
    h.setUint32(14, crc, true); h.setUint32(18, sz, true); h.setUint32(22, sz, true); h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), nm, f.data);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true); cd.setUint16(12, 0, true); cd.setUint16(14, 0x21, true);
    cd.setUint32(16, crc, true); cd.setUint32(20, sz, true); cd.setUint32(24, sz, true); cd.setUint16(28, nm.length, true); cd.setUint32(42, off, true);
    central.push(new Uint8Array(cd.buffer), nm);
    off += 30 + nm.length + sz;
  });
  const cdSize = central.reduce((a, p) => a + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function xlsx(sheets) { // [{name, cols:[...], rows:[[...]]}]
  const enc = new TextEncoder(), x = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const col = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  const sheetXml = sh => {
    const all = [sh.cols, ...sh.rows];
    const widths = sh.cols.map((_, ci) => Math.min(50, Math.max(10, ...all.map(r => String(r[ci] ?? '').length + 2))));
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${all.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => { const ref = col(ci) + (ri + 1); const st = ri === 0 ? ' s="1"' : ''; return typeof v === 'number' && isFinite(v) ? `<c r="${ref}"${st}><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${x(v)}</t></is></c>`; }).join('')}</row>`).join('')}</sheetData>${sh.rows.length ? `<autoFilter ref="A1:${col(sh.cols.length - 1)}${sh.rows.length + 1}"/>` : ''}</worksheet>`;
  };
  const files = [
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${x(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF6EBDF"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
    ...sheets.map((s, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s)]),
  ];
  return zip(files.map(([name, s]) => ({ name, data: enc.encode(s) })));
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function exportarExcel() {
  const evs = Object.values(S.eventos).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const conEv = new Set(evs.map(e => e.clienteId));
  const cols = ['Nombre', 'Apellido', 'Celular', 'Celular (solo números)', 'Email', 'Religión', 'Miembros de la familia', 'Tipo de evento', 'Homenajeado/a', 'Fecha del evento', 'Día', 'Mes del evento', 'Fecha de contratación', 'Invitados iniciales', 'Cubiertos finales', 'Estado', 'Primer aniversario', 'Menú', 'Barman', 'Bebida extra', 'Menús especiales', 'Centro de mesa', 'Mantel', 'Notas'];
  const rows = evs.map(e => { const c = cli(e.clienteId), k = getCuenta(e); return [c.nombre || '', c.apellido || '', fmtTel(c.celular), c.celular || '', c.email || '', c.religion || '', c.familia || '', tipoEv(e), e.homenajeado || '', fmtD(e.fecha), DIAS[dow(e.fecha)], MESES[+e.fecha.slice(5, 7) - 1], fmtD(e.fechaContratacion), e.invitados ?? '', k.final.confirmado ? num(k.final.adultos) + num(k.final.ninos) + num(k.final.menores) : '', { reservado: 'Reservado', pendiente: 'Pendiente', cancelado: 'Cancelado' }[e.estado] || e.estado, fmtD(addMonths(ym(e.fecha), 12) + e.fecha.slice(7)), (e.menu || {}).menu || '', ...(() => { const sv = e.servicio || {}, a = e.ambientacion || {}; return [{ si: 'Sí', no: 'No' }[sv.barman] || '', BEBIDA_OPC[sv.bebida] || '', (sv.especiales || []).filter(x => num(x.cant)).map(x => `${x.cant} ${x.tipo}`).join(', '), a.centroMesa || '', a.mantel || '']; })(), e.notas || '']; });
  Object.values(S.clientes).filter(c => !conEv.has(c.id)).forEach(c => { const r = [c.nombre || '', c.apellido || '', fmtTel(c.celular), c.celular || '', c.email || '', c.religion || '', c.familia || '']; while (r.length < cols.length - 1) r.push(''); r[cols.indexOf('Estado')] = 'Sin evento'; r.push(c.notas || ''); rows.push(r); });
  download(xlsx([{ name: 'Clientes y eventos', cols, rows }]), `clientes-salon-dorado-${todayISO()}.xlsx`);
}
function exportarMovimientos() {
  const pagos = [];
  Object.values(S.eventos).forEach(e => {
    const c = nombreCli(cli(e.clienteId)), k = calcCuenta(e);
    k.pagos.forEach(p => pagos.push([fmtD(p.fecha), c, fmtD(e.fecha), p.tipo === 'iva' ? 'IVA' : p.sena ? 'Seña cubiertos' : 'Cubiertos', medioTxt(p), num(p.monto), p.tipo === 'iva' ? '' : num(p.valor), p.tipo === 'iva' ? '' : p.cubiertos, p.nota || '']));
    (e.extras || []).forEach(l => (l.pagos || []).forEach(p => pagos.push([fmtD(p.fecha), c, fmtD(e.fecha), 'Extra: ' + l.nombre, medioTxt(p), num(p.monto), '', '', p.nota || ''])));
  });
  pagos.sort((a, b) => a[0].split('/').reverse().join('').localeCompare(b[0].split('/').reverse().join('')));
  const eg = Object.values(S.egresos).sort((a, b) => a.fecha.localeCompare(b.fecha)).map(g => [fmtD(g.fecha), g.categoria, g.detalle || '', num(g.monto)]);
  download(xlsx([
    { name: 'Cobros', cols: ['Fecha', 'Cliente', 'Fecha evento', 'Concepto', 'Medio', 'Monto', 'Valor cubierto', 'Cubiertos', 'Nota'], rows: pagos },
    { name: 'Egresos', cols: ['Fecha', 'Categoría', 'Detalle', 'Monto'], rows: eg },
  ]), `movimientos-salon-dorado-${todayISO()}.xlsx`);
}

/* ---------- DATOS DE EJEMPLO (solo modo demo) ---------- */
function seedDemo() {
  COLS.forEach(c => S[c] = {});
  const put = (col, o) => { o.id = o.id || uid(); S[col][o.id] = clean(o); return o.id; };
  put('config', { ...clean(DEFAULT_CONFIG), id: 'general', catalogoCargado: true });
  EXTRAS_INICIALES.forEach(([grupo, nombre, precio, desc], i) => put('extrasCat', { grupo, nombre, precio, costo: Math.round(precio * 0.45 / 1000) * 1000, desc, orden: i, activo: true }));
  const hoy = todayISO(), mH = ym(hoy);
  // IPC de EJEMPLO (no son datos reales)
  for (let i = -14; i <= -1; i++) { const m = addMonths(mH, i); put('ipc', { id: m, valor: [2.1, 2.4, 1.9, 2.7, 2.2, 2.0, 2.5, 1.8, 2.3, 2.6, 2.0, 2.2, 1.9, 2.4][i + 14], nota: 'Ejemplo' }); }
  const nextDow = (from, d, plusWeeks) => { let f = addDays(from, plusWeeks * 7); while (dow(f) !== d) f = addDays(f, 1); return f; };
  const mk = (cl, e) => { const cid = put('clientes', { ...cl, creado: hoy }); const o = { clienteId: cid, extras: [], menu: {}, ...e }; o.cuenta = { ...cuentaDefaults(o), ...(e.cuenta || {}) }; return put('eventos', o); };
  // evento próximo con varios pagos
  const f1 = nextDow(hoy, 6, 3), c1 = addMonths(mH, -8) + '-12';
  mk({ nombre: 'Laura', apellido: 'Ejemplo Gómez', celular: '5491155550001', familia: 'Laura (mamá), Diego (papá), Sofía (homenajeada), Tomi (hermano)' },
    { tipo: 'Fiesta de XV', homenajeado: 'Sofía', fecha: f1, fechaContratacion: c1, invitados: 150, estado: 'reservado',
      menu: { menu: 'Menú 1 Fiesta XV', principalAdultos: 'Bondiola', guarnicionAdultos: 'Papas rústicas', principalNinos: 'Chicken fingers', guarnicionNinos: 'Papas bastón' },
      cuenta: { valorBase: 140000, mesBase: ym(c1), mesesCongelado: 2, minimo: 120, cubiertosIniciales: 150, reservaSemana: 30,
        pagos: [{ id: uid(), fecha: c1, tipo: 'cubiertos', monto: 2800000, valor: 140000, sena: true, medio: 'Transferencia' },
          { id: uid(), fecha: addMonths(ym(c1), 2) + '-05', tipo: 'cubiertos', monto: 3000000, valor: 140000, medio: 'Efectivo' },
          { id: uid(), fecha: addMonths(ym(c1), 5) + '-10', tipo: 'cubiertos', monto: 4500000, valor: 0, medio: 'Transferencia', nota: 'valor se completa abajo' }] },
      extras: [{ id: uid(), nombre: 'Pantalla LED todo el evento con VJ + fuegos (chispas) de entrada', cantidad: 1, precio: 450000, costo: 200000, contratado: true, proveedor: 'VJ Martín', pagos: [{ fecha: addMonths(ym(c1), 3) + '-02', monto: 450000, medio: 'Transferencia' }] },
        { id: uid(), nombre: 'Cabina de fotos / Espejo / 360 (2 hs)', cantidad: 1, precio: 400000, costo: 180000, regalo: true, contratado: false, nota: 'Promo de contratación' },
        { id: uid(), nombre: 'Stand glitter básico', cantidad: 1, precio: 550000, costo: 270000, contratado: false, nota: 'Precio especial', pagos: [{ fecha: addMonths(ym(c1), 6) + '-01', monto: 200000, medio: 'Efectivo' }] }] });
  // completa el valor del 3er pago con el valor ajustado de ese mes
  const e1 = Object.values(S.eventos)[0]; const k1 = calcCuenta(e1); e1.cuenta.pagos[2].valor = k1.valorEnMes(ym(e1.cuenta.pagos[2].fecha)); delete e1.cuenta.pagos[2].nota;
  // evento del año que viene recién señado
  const f2 = nextDow(addMonths(mH, 7) + '-01', 5, 0);
  mk({ nombre: 'Daniel', apellido: 'Ejemplo Katz', celular: '5491155550002', familia: 'Daniel y Ruth (papás), Ariel (homenajeado)' },
    { tipo: 'Bar Mitzvá', homenajeado: 'Ariel', fecha: f2, fechaContratacion: addDays(hoy, -20), invitados: 180, estado: 'reservado',
      cuenta: { valorBase: 150000, mesBase: mH, mesesCongelado: 1, minimo: 100, cubiertosIniciales: 180, pagos: [{ id: uid(), fecha: addDays(hoy, -20), tipo: 'cubiertos', monto: 3000000, valor: 150000, sena: true, medio: 'Transferencia' }] } });
  // pendiente de reserva
  mk({ nombre: 'Carla', apellido: 'Ejemplo Ruiz', celular: '5491155550003', familia: 'Carla y Nico (novios)' },
    { tipo: 'Casamiento', homenajeado: 'Carla y Nico', fecha: nextDow(addMonths(mH, 4) + '-01', 6, 1), fechaContratacion: addDays(hoy, -4), invitados: 160, estado: 'pendiente', vencePendiente: addDays(hoy, 6), cuenta: { valorBase: 155000, mesBase: mH } });
  // evento de hace un año (aniversario)
  const fa = addDays(addMonths(mH, -12) + hoy.slice(7), 5);
  mk({ nombre: 'Marcela', apellido: 'Ejemplo Paz', celular: '5491155550004', familia: 'Marcela (mamá), Valen (homenajeada)' },
    { tipo: 'Fiesta de XV', homenajeado: 'Valentina', fecha: fa, fechaContratacion: addMonths(ym(fa), -10) + '-03', invitados: 130, estado: 'reservado',
      cuenta: { valorBase: 110000, mesBase: addMonths(ym(fa), -10), mesesCongelado: 1, minimo: 120, cubiertosIniciales: 130, final: { adultos: 120, ninos: 14, menores: 3, confirmado: true },
        pagos: [{ id: uid(), fecha: addMonths(ym(fa), -10) + '-03', tipo: 'cubiertos', monto: 2200000, valor: 110000, sena: true, medio: 'Transferencia' }, { id: uid(), fecha: addDays(fa, -3), tipo: 'cubiertos', monto: 0, valor: 0, medio: 'Efectivo' }] } });
  const e4 = Object.values(S.eventos).find(e => e.fecha === fa); const v4 = calcCuenta(e4).valorEnMes(ym(addDays(fa, -3))); e4.cuenta.pagos[1].valor = v4; e4.cuenta.pagos[1].monto = 107 * v4;
  // egresos de ejemplo del mes pasado y este
  [[-1, 'Alquiler mensual', '', 2500000], [-1, 'Electricidad', '', 380000], [-1, 'Carnicería', '', 1650000], [-1, 'Empleados', 'Mozos evento', 900000], [0, 'Alquiler mensual', '', 2500000], [0, 'Mayorista', '', 820000], [0, 'Pauta', 'Instagram', 300000]]
    .forEach(([d, categoria, detalle, monto]) => put('egresos', { fecha: addMonths(mH, d) + '-05', categoria, detalle, monto }));
}

/* ---------- arranque ---------- */
(async function start() {
  try {
    await DB.init(onDataChange);
    DB.watchAuth(() => render());
  } catch (err) {
    console.error(err);
    $('#root').innerHTML = `<div class="login"><div class="box"><h2>No se pudo conectar</h2><p>Revisá la conexión a internet y la configuración de Firebase (config.js).</p><pre class="small">${esc(err.message)}</pre></div></div>`;
  }
})();
// acceso para soporte técnico desde la consola del navegador
window.SD = { S, DB, calcCuenta, calcExtras, getCuenta, ev, cli, todayISO, fmtTel };
