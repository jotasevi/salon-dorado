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
  minimos: { 5: 120 /*sáb*/, 4: 100 /*vie*/, dom: 120, otro: 100 },
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
// una sola vez (pedido de Juan, nov 2026): los domingos por venir que tenían mínimo 100 pasan a 120.
// Los eventos que se pasan quedan anotados en config.domingos120 por si hay que revisarlos.
function migrarDomingos() {
  const g = S.config.general; if (!g || (g.migraciones || []).includes('domingos120')) return;
  const hoy = todayISO(), cambiados = [];
  Object.values(S.eventos).filter(e => e.estado !== 'cancelado' && e.fecha >= hoy && dow(e.fecha) === 0 && e.cuenta && num(e.cuenta.minimo) === 100).forEach(e => {
    const cu = { ...e.cuenta, minimo: 120 };
    if (num(cu.cubiertosIniciales) < 120) cu.cubiertosIniciales = 120;
    DB.save('eventos', { ...clean(e), cuenta: cu }, true);
    cambiados.push(e.id);
  });
  DB.save('config', { ...S.config.general, migraciones: [...((S.config.general || {}).migraciones || []), 'domingos120'], domingos120: cambiados });
  if (cambiados.length) toast(`Se pasaron ${cambiados.length} ${cambiados.length === 1 ? 'domingo' : 'domingos'} a mínimo 120 cubiertos.`);
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
      migrarConfig(); migrarDomingos();
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
    migrarDomingos();
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
const minimoPorFecha = f => { const c = CONF(); const d = f ? dow(f) : -1; return d === 6 ? num(c.minimos[5]) : d === 5 ? num(c.minimos[4]) : d === 0 ? num(c.minimos.dom) : num(c.minimos.otro); };
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
  const meses = []; let valor = base, real = base, m = desde, i = 0;
  while (m <= hasta && i < 120) {
    const aj = c.ajustes[m] || {};
    let aplica = false, p = null, pend = false, manual = false;
    if (i > 0) {
      aplica = aj.aplica !== undefined ? !!aj.aplica : i > congel;
      if (aplica) {
        if (aj.pct !== undefined && aj.pct !== null && aj.pct !== '') { p = num(aj.pct); manual = true; }
        else { const r = S.ipc[addMonths(m, -1)]; p = r && r.valor !== null && r.valor !== undefined && r.valor !== '' ? num(r.valor) : null; }
        if (p === null) pend = true; else { valor = Math.round(valor * (1 + p / 100)); real = Math.round(real * (1 + p / 100)); }
      }
    }
    // precio especial ("atención"): desde este mes el cubierto queda en ese valor y los ajustes siguientes parten de ahí.
    // "real" sigue el cálculo sin la atención, solo para verlo internamente.
    const especial = num(aj.valorFijo) > 0;
    if (especial) valor = num(aj.valorFijo);
    meses.push({ mes: m, i, aplica, pct: p, pend, manual, valor, real, especial, motivo: especial ? aj.motivo || '' : '', ipcDe: addMonths(m, -1) });
    m = addMonths(m, 1); i++;
  }
  const filaMes = mes => !meses.length ? null : mes <= meses[0].mes ? meses[0] : meses.find(x => x.mes === mes) || meses[meses.length - 1];
  const valorEnMes = mes => { const r = filaMes(mes); return r ? r.valor : base; };
  const mesHoy = ym(hoy);
  const valorHoy = valorEnMes(mesHoy);
  const conAtencion = meses.some(x => x.especial);
  const valorRealHoy = (filaMes(mesHoy) || { real: base }).real;
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
    c, base, desde, hasta, meses, valorHoy, valorEnMes, ipcPendienteHoy, conAtencion, valorRealHoy, pagos: pagosCalc,
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
  ['ipc', 'Índices IPC'], ['extras', 'Catálogo de extras'], ['egresos', 'Egresos'], ['personal', 'Personal'], ['metricas', 'Métricas'], ['config', 'Configuración'],
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

/* ---------- impresión aislada: copia solo la hoja a un iframe y se imprime eso (Safari se traba con la app entera) ---------- */
const HOJAS = { orden: 'Hoja de servicio', timing: 'Timing', contrato: 'Contrato', imprimir: 'Estado de cuenta', personalhoja: 'Personal' };
function prepararImpresion() {
  const { view, args } = route();
  const doc = $('#main .print-doc');
  let f = document.getElementById('printFrame');
  if (!HOJAS[view] || !doc) { if (f) f.remove(); return; }
  const e = ev(args[0]);
  const titulo = `${HOJAS[view]}${e ? ' - ' + tituloEv(e) : ''}`.replace(/[\/\\:*?"<>|]/g, '-');
  const html = `<!doctype html><html><head><meta charset="utf-8"><base href="${esc(location.href.split('#')[0])}"><title>${esc(titulo)}</title>
    <link rel="stylesheet" href="styles.css"><style>@page{size:A4;margin:12mm}html,body{background:#fff!important;margin:0;padding:0}.print-doc{border:none!important;padding:0!important;max-width:none!important;margin:0!important}</style></head>
    <body>${doc.outerHTML}</body></html>`;
  if (f && f.dataset.html === html) return;
  if (!f) {
    f = document.createElement('iframe'); f.id = 'printFrame'; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:absolute;left:-10000px;top:0;width:800px;height:1100px;border:0';
    document.body.appendChild(f);
  }
  f.dataset.html = html; f.dataset.ok = '';
  f.onload = () => { f.dataset.ok = '1'; };
  f.srcdoc = html;
}
function imprimirHoja() {
  const f = document.getElementById('printFrame');
  if (f && f.dataset.ok && f.contentWindow) {
    try { f.contentWindow.focus(); f.contentWindow.print(); return; } catch (err) { console.error(err); }
  }
  window.print();
}
window.imprimirHoja = imprimirHoja;   // app.js es un módulo: los onclick del HTML necesitan verla en window
const PDF_W = {"h":[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,761,556,556,222,556,333,1000,556,556,333,1000,667,333,1000,556,611,556,556,222,222,333,333,350,556,1000,333,1000,500,333,944,556,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500],"hb":[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,761,556,611,278,556,500,1000,556,556,333,1000,667,333,1000,611,611,611,611,278,278,500,500,350,556,1000,333,1000,556,333,944,611,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556],"t":[250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541,761,500,444,333,500,444,1000,500,500,333,1000,556,333,889,444,611,444,444,333,333,444,444,350,500,1000,333,980,389,333,722,444,444,722,250,333,500,500,500,500,200,500,333,760,276,500,564,333,760,333,400,564,300,300,333,500,453,250,333,300,310,500,750,750,750,444,722,722,722,722,722,722,889,667,611,611,611,611,333,333,333,333,722,722,722,722,722,722,722,564,722,722,722,722,722,722,556,500,444,444,444,444,444,444,667,444,444,444,444,444,278,278,278,278,500,500,500,500,500,500,500,564,500,500,500,500,500,500,500,500],"tb":[250,333,555,500,500,1000,833,278,333,333,500,570,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,930,722,667,722,722,667,611,778,778,389,500,778,667,944,722,778,611,778,722,556,667,722,722,1000,722,722,667,333,278,333,581,500,333,500,556,444,556,444,333,500,556,278,333,556,278,833,556,500,556,556,444,389,333,556,500,722,500,500,444,394,220,394,520,761,500,500,333,500,500,1000,500,500,333,1000,556,333,1000,500,667,500,500,333,333,500,500,350,500,1000,333,1000,389,333,722,500,444,722,250,333,500,500,500,500,220,500,333,747,300,500,570,333,747,333,400,570,300,300,333,556,540,250,333,300,330,500,750,750,750,500,722,722,722,722,722,722,1000,722,667,667,667,667,389,389,389,389,722,722,778,778,778,778,778,570,778,722,722,722,722,722,611,556,500,500,500,500,500,500,722,444,444,444,444,444,278,278,278,278,500,556,500,500,500,500,500,570,500,556,556,556,556,500,556,500]};

/* ---------- PDF propio (sin librerías): convierte la hoja que se ve en pantalla en un PDF A4 ----------
   Se arma una copia de la hoja con ancho fijo (800 px, igual que la impresión), se mide dónde cae cada palabra,
   fondo, borde e imagen, y se dibuja todo en el PDF. Sale igual desde el celular o la compu. */
const PDF_FONTS = { h: 'Helvetica', hb: 'Helvetica-Bold', t: 'Times-Roman', tb: 'Times-Bold' };
const PDF_EXTRA = { '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87, '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F, '→': 0x3E, '←': 0x3C, '✓': 0x76, '✔': 0x76 };
function pdfBytes(s) {
  const out = [];
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    if ((c >= 32 && c < 127) || (c >= 160 && c <= 255)) out.push(c);
    else if (PDF_EXTRA[ch]) out.push(PDF_EXTRA[ch]);
    else if (c === 9 || c === 10 || c === 13 || c === 0x202F || c === 0x2009) out.push(32);
    else if (c >= 0x1F000 || (c >= 0x2600 && c <= 0x27BF) || c === 0xFE0F) continue; // emojis: no entran en la tipografía del PDF
    else out.push(63);
  }
  return out;
}
const pdfTextW = (s, size, f) => pdfBytes(s).reduce((a, c) => a + (PDF_W[f][c - 32] || 500), 0) * size / 1000;
const pdfStr = s => pdfBytes(s).map(c => c === 40 || c === 41 || c === 92 ? '\\' + String.fromCharCode(c) : c < 127 ? String.fromCharCode(c) : '\\' + c.toString(8).padStart(3, '0')).join('');
const n2 = v => (Math.round(v * 100) / 100).toString();

class MiniPDF {
  constructor() { this.W = 595.28; this.H = 841.89; this.pages = []; this.imgs = []; }
  addPage() { this.cur = []; this.pages.push(this.cur); }
  op(s) { this.cur.push(s); }
  rgb(c, stroke) { this.op(`${n2(c[0] / 255)} ${n2(c[1] / 255)} ${n2(c[2] / 255)} ${stroke ? 'RG' : 'rg'}`); }
  rect(x, y, w, h, c) { this.rgb(c); this.op(`${n2(x)} ${n2(this.H - y - h)} ${n2(w)} ${n2(h)} re f`); }
  line(x1, y1, x2, y2, c, w, dash) { this.rgb(c, true); this.op(`${n2(w)} w ${dash ? `[${dash}] 0 d` : '[] 0 d'} ${n2(x1)} ${n2(this.H - y1)} m ${n2(x2)} ${n2(this.H - y2)} l S`); }
  text(x, yBase, s, size, f, c, targetW) {
    const w = pdfTextW(s, size, f); if (!w) return;
    const tz = targetW ? Math.max(70, Math.min(130, targetW / w * 100)) : 100;
    this.rgb(c);
    this.op(`BT /${f} ${n2(size)} Tf ${n2(tz)} Tz ${n2(x)} ${n2(this.H - yBase)} Td (${pdfStr(s)}) Tj ET`);
  }
  image(img, x, y, w, h) { this.op(`q ${n2(w)} 0 0 ${n2(h)} ${n2(x)} ${n2(this.H - y - h)} cm /Im${img.n} Do Q`); }
  addImage(bytes, w, h) { const img = { n: this.imgs.length + 1, bytes, w, h }; this.imgs.push(img); return img; }
  output() {
    const enc = new TextEncoder(), parts = [], offs = []; let len = 0;
    const push = b => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
    const objs = []; // cada objeto: [string antes, bytes stream?, string después]
    const add = (head, stream, tail) => { objs.push([head, stream, tail]); return objs.length; };
    const fontIds = {}; Object.entries(PDF_FONTS).forEach(([k, name]) => fontIds[k] = add(`<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`));
    const imgIds = this.imgs.map(im => add(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`, im.bytes, '\nendstream'));
    const res = `<< /Font << ${Object.keys(PDF_FONTS).map(k => `/${k} ${fontIds[k]} 0 R`).join(' ')} >> /XObject << ${this.imgs.map((im, i) => `/Im${im.n} ${imgIds[i]} 0 R`).join(' ')} >> >>`;
    const pagesId = objs.length + 1 + this.pages.length * 2 + 1;
    const pageIds = this.pages.map(ops => {
      const body = enc.encode(ops.join('\n'));
      const cId = add(`<< /Length ${body.length} >>\nstream\n`, body, '\nendstream');
      return add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources ${res} /Contents ${cId} 0 R >>`);
    });
    const pId = add(`<< /Type /Pages /Kids [${pageIds.map(i => i + ' 0 R').join(' ')}] /Count ${pageIds.length} >>`);
    const catId = add(`<< /Type /Catalog /Pages ${pId} 0 R >>`);
    push('%PDF-1.4\n'); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
    objs.forEach((o, i) => { offs.push(len); push(`${i + 1} 0 obj\n${o[0]}`); if (o[1]) push(o[1]); push(`${o[2] || ''}\nendobj\n`); });
    const xref = len;
    push(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root ${catId} 0 R >>\nstartxref\n${xref}\n%%EOF`);
    return new Blob(parts, { type: 'application/pdf' });
  }
}

function pdfColor(s) {
  const m = String(s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null;
  const p = m[1].split(/[ ,/]+/).filter(Boolean).map(parseFloat);
  const a = p.length > 3 ? p[3] : 1; if (a < 0.05) return null;
  return [0, 1, 2].map(i => Math.round(p[i] * a + 255 * (1 - a)));
}
function pdfImagen(el, cache) {
  const src = el.currentSrc || el.src; if (cache[src] !== undefined) return cache[src];
  try {
    const nw = el.naturalWidth, nh = el.naturalHeight; if (!nw || !nh) return cache[src] = null;
    const s = Math.min(1, 1400 / nw), c = document.createElement('canvas');
    c.width = Math.round(nw * s); c.height = Math.round(nh * s);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(el, 0, 0, c.width, c.height);
    const bin = atob(c.toDataURL('image/jpeg', 0.92).split(',')[1]), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return cache[src] = { bytes: u, w: c.width, h: c.height };
  } catch (err) { console.warn('imagen sin PDF', err); return cache[src] = null; }
}

// Mide la hoja y devuelve el PDF (Blob). Todo es sincrónico para que el celular permita compartir al toque.
function hojaAPdf(fuente) {
  const temaAntes = document.documentElement.dataset.theme;
  document.documentElement.dataset.theme = 'light';
  const box = document.createElement('div');
  box.style.cssText = 'position:absolute;left:-12000px;top:0;width:800px;background:#fff';
  const doc = fuente.cloneNode(true);
  doc.style.cssText += ';border:none;padding:0;margin:0;max-width:none;width:800px;box-shadow:none';
  // las imágenes de la copia ocupan lo mismo aunque todavía no estén decodificadas
  const _o = [...fuente.querySelectorAll('img')]; [...doc.querySelectorAll('img')].forEach((im, i) => { const o = _o[i]; if (o && o.naturalWidth) im.style.aspectRatio = `${o.naturalWidth} / ${o.naturalHeight}`; });
  box.appendChild(doc); document.body.appendChild(box);
  try {
    const R0 = doc.getBoundingClientRect(), X0 = R0.left, Y0 = R0.top, total = R0.height;
    const items = [], cands = [], forced = [], avoid = [], imgCache = {};
    const origImgs = [...fuente.querySelectorAll('img')], copyImgs = [...doc.querySelectorAll('img')];
    [doc, ...doc.querySelectorAll('*')].forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.no-print')) return;
      const r = el.getBoundingClientRect(); if (!r.width && !r.height) return;
      const x = r.left - X0, y = r.top - Y0, w = r.width, h = r.height;
      const bg = el === doc ? null : pdfColor(cs.backgroundColor);
      if (bg && !(bg[0] > 252 && bg[1] > 252 && bg[2] > 252)) items.push({ k: 'rect', x, y, w, h, c: bg });
      [['Top', x, y, x + w, y], ['Bottom', x, y + h, x + w, y + h], ['Left', x, y, x, y + h], ['Right', x + w, y, x + w, y + h]].forEach(([s, x1, y1, x2, y2]) => {
        const bw = parseFloat(cs[`border${s}Width`]), st = cs[`border${s}Style`], bc = pdfColor(cs[`border${s}Color`]);
        if (bw > 0 && st !== 'none' && st !== 'hidden' && bc) {
          const o = s === 'Top' || s === 'Left' ? bw / 2 : -bw / 2;
          items.push({ k: 'line', x1: s === 'Left' || s === 'Right' ? x1 + o : x1, y1: s === 'Top' || s === 'Bottom' ? y1 + o : y1, x2: s === 'Left' || s === 'Right' ? x2 + o : x2, y2: s === 'Top' || s === 'Bottom' ? y2 + o : y2, c: bc, w: bw, dash: st === 'dotted' ? `${bw} ${bw * 2}` : st === 'dashed' ? `${bw * 3} ${bw * 2}` : '' });
        }
      });
      if (el.tagName === 'IMG') {
        const orig = origImgs[copyImgs.indexOf(el)] || el;
        const im = pdfImagen(orig.complete ? orig : el, imgCache);
        if (im) items.push({ k: 'img', x, y, w, h, im });
      }
      if (/^(TR|P|H1|H2|H3|H4|LI|TABLE|UL|OL|DL|DT|DD|SECTION)$/.test(el.tagName) || (el.tagName === 'DIV' && el.parentElement === doc)) cands.push(y + h);
      if (cs.breakBefore === 'page' || cs.pageBreakBefore === 'always') forced.push(y);
      if ((cs.breakInside === 'avoid' || cs.pageBreakInside === 'avoid' || el.tagName === 'TR') && el !== doc) avoid.push([y, y + h]);
      if (/^H[1-4]$/.test(el.tagName) || el.tagName === 'THEAD') {   // un título o encabezado de tabla no queda solo al pie de la página
        let sig = el.tagName === 'THEAD' ? el.parentElement.querySelector('tbody tr') : el.nextElementSibling;
        if (sig && sig.tagName === 'TABLE') sig = sig.querySelector('tr');
        const rs = sig && sig.getBoundingClientRect(); if (rs && rs.height) avoid.push([y, rs.bottom - Y0]);
      }
    });
    // texto: cada palabra en su lugar exacto
    const tw = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT), rg = document.createRange();
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const p = n.parentElement; if (!p || p.closest('.no-print')) continue;
      const cs = getComputedStyle(p); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const c = pdfColor(cs.color) || [34, 34, 34], size = parseFloat(cs.fontSize) || 13;
      const bold = (parseInt(cs.fontWeight, 10) || 400) >= 600 || cs.fontWeight === 'bold';
      const fam1 = (cs.fontFamily.split(',')[0] || '').replace(/["']/g, '').trim(), serif = /georgia|times|garamond|cormorant|playfair|^serif$/i.test(fam1);
      const f = (serif ? 't' : 'h') + (bold ? 'b' : '');
      const under = /underline/.test(cs.textDecorationLine || cs.textDecoration || '');
      const upper = cs.textTransform === 'uppercase';
      const txt = n.nodeValue, re = /\S+/g; let m;
      while ((m = re.exec(txt))) {
        rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        const rects = rg.getClientRects(); if (!rects.length) continue;
        const r = rects[0]; if (!r.width) continue;
        items.push({ k: 'text', s: upper ? m[0].toUpperCase() : m[0], x: r.left - X0, y: r.top - Y0, w: r.width, h: r.height, size, f, c, under });
      }
    }
    // páginas A4 con márgenes de 12 mm, como la impresión
    const pdf = new MiniPDF(), M = 34, esc_ = (pdf.W - 2 * M) / 800, pageH = (pdf.H - 2 * M) / esc_;
    const textos = items.filter(i => i.k === 'text');
    const cortes = []; let y0 = 0;
    while (y0 < total - 1 && cortes.length < 60) {
      let end = Math.min(total, y0 + pageH);
      const fz = forced.filter(f => f > y0 + 5 && f < end).sort((a, b) => a - b)[0];
      if (fz) end = fz;
      else if (end < total) {
        const c = cands.filter(v => v > y0 + pageH * 0.5 && v <= end).sort((a, b) => b - a)[0];
        if (c) end = c;
        for (let vuelta = 0, antes = -1; vuelta < 8 && antes !== end; vuelta++) {   // repetir hasta que ningún bloque quede partido
          antes = end;
          avoid.forEach(([a, b]) => { if (a > y0 + 40 && a < end && b > end && b - a < pageH) end = a; });
          textos.forEach(t => { if (t.y < end && t.y + t.h > end && t.y > y0 + 10) end = t.y; });
        }
      }
      cortes.push([y0, end]); y0 = end;
    }
    if (!cortes.length) cortes.push([0, total]);
    const imgObjs = new Map();
    cortes.forEach(([a, b]) => {
      pdf.addPage();
      const X = v => M + v * esc_, Y = v => M + (v - a) * esc_;
      const dentro = (t, h) => t >= a - 0.5 && t < b - 0.5 && (t + h) <= b + 2;
      items.forEach(it => {
        if (it.k === 'rect') {
          const t = Math.max(a, it.y), u = Math.min(b, it.y + it.h); if (u - t < 0.5) return;
          pdf.rect(X(it.x), Y(t), it.w * esc_, (u - t) * esc_, it.c);
        } else if (it.k === 'line') {
          let t = Math.max(a, Math.min(it.y1, it.y2)), u = Math.min(b, Math.max(it.y1, it.y2));
          if (it.y1 === it.y2) { if (it.y1 < a - 0.5 || it.y1 > b + 0.5) return; t = u = it.y1; } else if (u - t < 0.5) return;
          pdf.line(X(it.x1), Y(t), X(it.x2), Y(u), it.c, Math.max(0.3, it.w * esc_), it.dash ? it.dash.split(' ').map(v => n2(v * esc_)).join(' ') : '');
        } else if (it.k === 'img') {
          if (!dentro(it.y, Math.min(it.h, b - a))) return;
          let o = imgObjs.get(it.im); if (!o) { o = pdf.addImage(it.im.bytes, it.im.w, it.im.h); imgObjs.set(it.im, o); }
          pdf.image(o, X(it.x), Y(it.y), it.w * esc_, it.h * esc_);
        } else if (it.k === 'text') {
          if (!dentro(it.y, it.h)) return;
          const size = it.size * esc_, base = Y(it.y) + (it.h * esc_ + size * 0.68) / 2;
          pdf.text(X(it.x), base, it.s, size, it.f, it.c, it.w * esc_);
          if (it.under) pdf.line(X(it.x), base + size * 0.15, X(it.x + it.w), base + size * 0.15, it.c, Math.max(0.4, size * 0.06));
        }
      });
    });
    return pdf.output();
  } finally {
    box.remove();
    if (temaAntes) document.documentElement.dataset.theme = temaAntes; else delete document.documentElement.dataset.theme;
  }
}

// Botón "Descargar PDF": en el celular abre el menú para compartir (guardar en Archivos, WhatsApp, Mail); en la compu descarga.
async function descargarPDF(nombre) {
  const src = $('#main .print-doc');
  if (!src) { toast('No hay hoja para convertir.'); return; }
  const { view, args } = route();
  const e = ev(args[0]);
  const base = nombre || `${HOJAS[view] || 'Hoja'}${e ? ' - ' + (tituloEv(e) || nombreCli(cli(e.clienteId))) + ' - ' + fmtD(e.fecha).replace(/\//g, '-') : ''}`;
  const file = base.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim() + '.pdf';
  let blob;
  try { blob = hojaAPdf(src); } catch (err) { console.error(err); toast('No se pudo armar el PDF. Probá con Imprimir → Guardar como PDF.'); return; }
  const tactil = (navigator.maxTouchPoints || 0) > 1 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  try {
    const f = new File([blob], file, { type: 'application/pdf' });
    if (tactil && navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: file }); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; console.warn(err); }
  download(blob, file);
  if (tactil) toast('PDF descargado: buscalo en Descargas / Archivos.');
}
window.descargarPDF = () => descargarPDF();

/* botones Atrás / Adelante (la app instalada en el celular no tiene los del navegador).
   Cada paso del historial guarda su número en history.state; así se sabe si hay para dónde ir. */
const NAVH = { cur: 0, max: 0 };
function marcarHistorial() {
  const st = history.state;
  if (!render._navIni) { try { NAVH.max = +sessionStorage.getItem('sd.navMax') || 0; } catch (e) { } }
  if (st && typeof st.idx === 'number') { NAVH.cur = st.idx; NAVH.max = Math.max(NAVH.max, st.idx); }
  else { NAVH.cur = render._navIni ? NAVH.cur + 1 : 0; NAVH.max = NAVH.cur; } // paso nuevo: lo que estaba adelante se descarta
  render._navIni = true;
  try { history.replaceState({ idx: NAVH.cur }, '', location.href); sessionStorage.setItem('sd.navMax', NAVH.max); } catch (e) { }
  const a = $('#navAtras'), b = $('#navAdel');
  if (a) a.disabled = NAVH.cur <= 0;
  if (b) b.disabled = NAVH.cur >= NAVH.max;
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
      <main id="main"></main></div>
      <div class="navbtns no-print"><button id="navAtras" title="Atrás" aria-label="Atrás">‹</button><button id="navAdel" title="Adelante" aria-label="Adelante">›</button></div>`;
    SHELL = true;
    $('#navAtras').onclick = () => history.back();
    $('#navAdel').onclick = () => history.forward();
    const lo = $('#logout'); if (lo) lo.onclick = e => { e.preventDefault(); DB.logout(); };
    $('#tema').onclick = e => { e.preventDefault(); cambiarTema(); };
    aplicarTema();
  }
  const { view, args } = route();
  const navKey = { evento: 'eventos', cliente: 'clientes', imprimir: 'eventos', orden: 'eventos', timing: 'eventos', contrato: 'eventos', personalhoja: 'personal' }[view] || view;
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === navKey));
  const main = $('#main');
  const fn = VIEWS[view] || VIEWS.inicio;
  const y = window.scrollY;
  main.innerHTML = (DB.mode === 'demo' ? `<div class="demo-banner no-print"><b>Modo demostración:</b> los datos son de ejemplo y se guardan solo en este navegador. En la app instalada se entra con usuario y clave, todo se guarda en la nube, y funcionan la impresión y la descarga del Excel. <a href="#" id="resetDemo">Restablecer datos de ejemplo</a></div>` : '') + fn(...args);
  const rd = $('#resetDemo'); if (rd) rd.onclick = e => { e.preventDefault(); confirmar('¿Volver a los datos de ejemplo? Se pierde lo cargado en la demo.', () => DB.resetDemo()); };
  if (fn.after) fn.after(...args);
  prepararImpresion();
  marcarHistorial();
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
let TOMADOS_MES = null;
// eventos tomados = reservas vigentes cuya fecha de contratación cae en el mes
const eventosTomados = m => Object.values(S.eventos).filter(e => e.estado === 'reservado' && ym(e.fechaContratacion) === m).sort((a, b) => (a.fechaContratacion || '').localeCompare(b.fechaContratacion || '') || a.fecha.localeCompare(b.fecha));
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
  const mesHoy = ym(hoy), mesAnt = addMonths(mesHoy, -1);
  TOMADOS_MES = TOMADOS_MES || mesHoy;
  const tomadosHoy = eventosTomados(mesHoy), tomadosAnt = eventosTomados(mesAnt), tomadosVer = eventosTomados(TOMADOS_MES);
  return `<div class="top"><h1>${quien ? `¡Hola ${esc(quien)}!` : '¡Hola!'}</h1>
    <div class="actions"><button class="btn-primary" id="nuevoEv">+ Nuevo evento</button></div></div>
  ${faltaIpc ? `<div class="alert warn">Falta cargar el IPC de <b>${fmtYM(ipcAnt)}</b>. Sin ese dato los ajustes de este mes quedan pendientes. <a href="#/ipc">Cargar IPC</a></div>` : ''}
  <div class="cards">
    <div class="card"><div class="k">Eventos reservados ${hoy.slice(0, 4)}</div><div class="v">${anioRes}</div></div>
    <div class="card"><div class="k">Reservados ${+hoy.slice(0, 4) + 1}</div><div class="v">${sigRes}</div></div>
    <div class="card ${pend.length ? 'warn' : ''}"><div class="k">Pendientes de reserva</div><div class="v">${pend.length}</div></div>
    <div class="card"><div class="k">Próximos 60 días</div><div class="v">${proximos.length}</div></div>
    <div class="card good"><div class="k">Eventos tomados en ${MESES[+mesHoy.slice(5) - 1].toLowerCase()}</div><div class="v">${tomadosHoy.length}</div><div class="small muted">${MESES[+mesAnt.slice(5) - 1]}: ${tomadosAnt.length}</div></div>
  </div>
  <div class="grid2">
    <div class="panel"><div class="panel-h"><h2>Eventos tomados por mes</h2>
      <div style="display:flex;gap:6px;align-items:center"><button class="btn-sm" id="tomAnt" title="Mes anterior">◀</button><b style="min-width:130px;text-align:center">${fmtYM(TOMADOS_MES)}</b><button class="btn-sm" id="tomSig" title="Mes siguiente">▶</button>${TOMADOS_MES !== mesHoy ? '<button class="btn-sm" id="tomHoy">Este mes</button>' : ''}</div></div>
      <p class="small muted" style="margin-top:-6px">Reservas cerradas en el mes (según la fecha en que contrataron): <b>${tomadosVer.length}</b></p>
      ${tomadosVer.length ? `<ul class="list-clean">${tomadosVer.map(e => `<li data-go="evento/${e.id}" style="cursor:pointer"><div><b>${fmtDL(e.fecha)}</b> · ${esc(tituloEv(e))}<div class="small muted">${esc(nombreCli(cli(e.clienteId)))} · contrató el ${fmtD(e.fechaContratacion)}</div></div>${badgeEstado(e)}</li>`).join('')}</ul>` : '<p class="muted">No se tomaron eventos ese mes.</p>'}
    </div>
    <div class="panel"><div class="panel-h"><h2>Próximos eventos</h2><a href="#/calendario">Ver calendario</a></div>
      ${proximos.length ? `<ul class="list-clean">${proximos.map(e => { const r = resumenEv(e); return `<li data-go="evento/${e.id}" style="cursor:pointer"><div><b>${fmtDL(e.fecha)}</b> · ${esc(tituloEv(e))}<div class="small muted">${esc(nombreCli(cli(e.clienteId)))} · faltan ${daysBetween(hoy, e.fecha)} días</div></div><div class="right small">${r.k.pendientes > 0 ? `${fmtN(r.k.pendientes)} cub. pend.` : '<span class="badge b-ok">Cubiertos al día</span>'}${r.x.saldo > 0 ? `<br>Extras: ${fmt$(r.x.saldo)}` : ''}</div></li>`; }).join('')}</ul>` : '<p class="muted">No hay eventos en los próximos 60 días.</p>'}
    </div>
    <div class="panel"><div class="panel-h"><h2>Pendientes de reserva</h2></div>
      ${pend.length ? `<ul class="list-clean">${pend.map(e => { const v = e.vencePendiente; const venc = v && v < hoy; return `<li data-go="evento/${e.id}" style="cursor:pointer"><div><b>${fmtD(e.fecha)}</b> · ${esc(nombreCli(cli(e.clienteId)))}<div class="small muted">${esc(tipoEv(e))}</div></div><div class="small ${venc ? '' : 'muted'}">${v ? (venc ? `<span class="badge b-bad">Venció ${fmtD(v)}</span>` : `Vence ${fmtD(v)}`) : ''}</div></li>`; }).join('')}</ul>` : '<p class="muted">Nada pendiente.</p>'}
    </div>
    ${panelRecordatorios() || '<div class="panel"><div class="panel-h"><h2>Para contactar</h2></div><p class="muted">No hay recordatorios pendientes.</p></div>'}
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
  $('#tomAnt').onclick = () => { TOMADOS_MES = addMonths(TOMADOS_MES, -1); render(); };
  $('#tomSig').onclick = () => { TOMADOS_MES = addMonths(TOMADOS_MES, 1); render(); };
  const th = $('#tomHoy'); if (th) th.onclick = () => { TOMADOS_MES = ym(todayISO()); render(); };
  bindRecordatorios();
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

/* ---------- RECORDATORIOS ----------
  - Automático: 3 meses (90 días) antes de cada evento reservado, "ofrecer adicionales". Se marca con e.adicionalesOk.
  - Manuales: en cada cliente, c.recordatorios = [{ id, fecha, motivo, hecho }]. Aparecen desde 7 días antes.
*/
const DIAS_ADICIONALES = 90;
function recordatoriosPend(hoy = todayISO(), soloCliente = null) {
  const r = [];
  eventosActivos().filter(e => e.estado === 'reservado' && !e.adicionalesOk && e.fecha >= hoy && daysBetween(hoy, e.fecha) <= DIAS_ADICIONALES && (!soloCliente || e.clienteId === soloCliente))
    .forEach(e => r.push({ tipo: 'adic', fecha: addDays(e.fecha, -DIAS_ADICIONALES), e, c: cli(e.clienteId) }));
  Object.values(S.clientes).filter(c => !soloCliente || c.id === soloCliente).forEach(c => (c.recordatorios || []).filter(x => !x.hecho && (soloCliente || x.fecha <= addDays(hoy, 7)))
    .forEach(x => r.push({ tipo: 'manual', fecha: x.fecha, x, c })));
  return r.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
}
function itemRecordatorio(r, hoy) {
  const c = r.c || {}, venc = r.fecha < hoy;
  if (r.tipo === 'adic') {
    const e = r.e, dias = daysBetween(hoy, e.fecha);
    const txt = `¡Hola ${c.nombre || ''}! ¿Cómo están? Faltan unos meses para ${e.homenajeado ? 'la fiesta de ' + e.homenajeado : 'su fiesta'} en Salón Dorado y queríamos contarles los adicionales que pueden sumar para ese día. ¿Les mandamos la lista?`;
    return `<li><div><b>Ofrecer adicionales</b> · ${esc(tituloEv(e))}<div class="small muted"><a href="#/cliente/${c.id}">${esc(nombreCli(c))}</a> · evento ${fmtD(e.fecha)} · faltan ${dias} días</div></div>
      <div class="actions" style="display:flex;gap:6px">${c.celular ? `<a class="btn btn-sm btn-wa" target="_blank" href="${waLink(c.celular, txt)}">WhatsApp</a>` : ''}<button class="btn-sm" data-go="evento/${e.id}">Ver evento</button><button class="btn-sm" data-adicok="${e.id}">Listo</button></div></li>`;
  }
  return `<li><div><b>${fmtD(r.fecha)}</b>${venc ? ' <span class="badge b-bad">atrasado</span>' : r.fecha === hoy ? ' <span class="badge b-warn">hoy</span>' : ''} · ${esc(r.x.motivo || 'Contactar')}<div class="small muted"><a href="#/cliente/${c.id}">${esc(nombreCli(c))}</a></div></div>
    <div class="actions" style="display:flex;gap:6px">${c.celular ? `<a class="btn btn-sm btn-wa" target="_blank" href="${waLink(c.celular)}">WhatsApp</a>` : ''}<button class="btn-sm" data-recedit="${c.id}|${r.x.id}">Editar</button><button class="btn-sm" data-recok="${c.id}|${r.x.id}">Listo</button></div></li>`;
}
function panelRecordatorios(soloCliente = null) {
  const hoy = todayISO(), list = recordatoriosPend(hoy, soloCliente);
  if (!soloCliente && !list.length) return '';
  return `<div class="panel"><div class="panel-h"><h2>Para contactar</h2>${soloCliente ? `<button class="btn-sm" data-recnuevo="${soloCliente}">+ Recordatorio</button>` : ''}</div>
    <p class="small muted" style="margin-top:-6px">${soloCliente ? 'Recordatorios de este cliente.' : 'Recordatorios de esta semana y eventos que están a 3 meses o menos (para ofrecerles adicionales).'}</p>
    ${list.length ? `<ul class="list-clean">${list.map(r => itemRecordatorio(r, hoy)).join('')}</ul>` : '<p class="muted">No hay recordatorios pendientes.</p>'}</div>`;
}
function formRecordatorio(cid, rid) {
  const c = S.clientes[cid], lista = c.recordatorios || [], x = rid ? lista.find(r => r.id === rid) : { fecha: addDays(todayISO(), 7), motivo: '' };
  modal({
    title: rid ? 'Editar recordatorio' : 'Nuevo recordatorio · ' + nombreCli(c),
    body: F.date('fecha', 'Fecha para contactarlos', x.fecha) + '<div></div>' + F.area('motivo', 'Motivo', x.motivo, 'placeholder="Ej.: confirmar menú de niños, mandar presupuesto de barra…"'),
    danger: rid ? { label: 'Eliminar', confirm: '¿Eliminar este recordatorio?', fn: () => DB.save('clientes', { ...clean(c), recordatorios: lista.filter(r => r.id !== rid) }) } : null,
    onSubmit: d => {
      if (!d.fecha) { toast('Falta la fecha.'); return false; }
      const obj = { ...x, id: rid || uid(), fecha: d.fecha, motivo: d.motivo, hecho: false };
      DB.save('clientes', { ...clean(c), recordatorios: rid ? lista.map(r => r.id === rid ? obj : r) : [...lista, obj] });
    },
  });
}
function bindRecordatorios() {
  $$('[data-adicok]').forEach(b => b.onclick = () => { const e = ev(b.dataset.adicok); DB.save('eventos', { ...clean(e), adicionalesOk: true }); toast('Listo: adicionales ofrecidos'); });
  $$('[data-recok]').forEach(b => b.onclick = () => { const [cid, rid] = b.dataset.recok.split('|'), c = S.clientes[cid]; DB.save('clientes', { ...clean(c), recordatorios: (c.recordatorios || []).map(r => r.id === rid ? { ...r, hecho: true, hechoEl: todayISO() } : r) }); toast('Recordatorio hecho'); });
  $$('[data-recedit]').forEach(b => b.onclick = () => { const [cid, rid] = b.dataset.recedit.split('|'); formRecordatorio(cid, rid); });
  $$('[data-recnuevo]').forEach(b => b.onclick = () => formRecordatorio(b.dataset.recnuevo));
}

/* ---------- CLIENTES ---------- */
let FCLI = { q: '', rel: '', orden: 'contrato-desc', anioC: '', anioE: '', tipo: '', estado: '', saldo: false };
// datos de cada cliente para ordenar y filtrar: eventos (sin cancelados), última contratación, próximo evento
function infoCli(c, hoy = todayISO()) {
  const es = Object.values(S.eventos).filter(e => e.clienteId === c.id).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const act = es.filter(e => e.estado !== 'cancelado');
  const contr = act.map(e => e.fechaContratacion).filter(Boolean).sort();
  const proximo = act.find(e => e.fecha >= hoy);
  return { es, act, contrato: contr.length ? contr[contr.length - 1] : '', proximo, ultimo: act.length ? act[act.length - 1] : null };
}
VIEWS.clientes = () => {
  const L = CONF().listas, evs = Object.values(S.eventos);
  const aniosC = [...new Set(evs.map(e => (e.fechaContratacion || '').slice(0, 4)).filter(Boolean))].sort().reverse();
  const aniosE = [...new Set(evs.map(e => e.fecha.slice(0, 4)))].sort().reverse();
  const tipos = [...new Set([...L.tipos, ...evs.map(tipoEv).filter(Boolean)])];
  const rels = [...new Set([...(L.religiones || []), ...Object.values(S.clientes).map(c => c.religion).filter(Boolean)])];
  const sel = (id, list) => `<select id="${id}">${list.map(([v, t]) => `<option value="${esc(v)}" ${String(FCLI[id.slice(1)]) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
  return `<div class="top"><h1>Clientes</h1><div class="actions"><button id="xls">Descargar base en Excel</button><button class="btn-primary" id="nuevoCli">+ Nuevo cliente</button></div></div>
  ${panelRecordatorios()}
  <div class="panel"><div class="filters"><input id="fq" style="flex:1;min-width:200px" placeholder="Buscar por nombre, apellido, celular, familia…" value="${esc(FCLI.q)}">
    ${sel('forden', [['contrato-desc', 'Contratación: más reciente primero'], ['contrato-asc', 'Contratación: más antigua primero'], ['evento-asc', 'Eventos: del más cercano al más lejano'], ['evento-desc', 'Eventos: del más lejano al más cercano'], ['nombre', 'Nombre (A–Z)']])}</div>
    <div class="filters" style="margin-top:8px">
    ${sel('fanioC', [['', 'Año de contratación: todos'], ...aniosC.map(y => [y, 'Contrataron en ' + y]), ['__sin', 'Sin fecha de contratación']])}
    ${sel('fanioE', [['', 'Año del evento: todos'], ...aniosE.map(y => [y, 'Evento en ' + y])])}
    ${sel('ftipo', [['', 'Todos los tipos de evento'], ...tipos.map(t => [t, t])])}
    ${sel('festado', [['', 'Estado: todos'], ['proximo', 'Con evento por venir'], ['realizado', 'Solo eventos realizados'], ['sin', 'Sin evento (o cancelado)']])}
    ${sel('frel', [['', 'Todas las religiones'], ...rels.map(r => [r, r]), ['__sin', 'Religión: sin dato']])}
    <label class="chk"><input type="checkbox" id="fsaldo" ${FCLI.saldo ? 'checked' : ''}> Con saldo pendiente</label>
    <button class="btn-sm" id="fLimpiar">Limpiar filtros</button></div></div>
  <div class="panel tbl-wrap" id="tblCli"></div>`;
};
VIEWS.clientes.after = () => {
  $('#xls').onclick = exportarExcel;
  $('#nuevoCli').onclick = () => formCliente();
  bindRecordatorios();
  const hoy = todayISO();
  const upd = () => {
    FCLI = { q: $('#fq').value.trim().toLowerCase(), orden: $('#forden').value, anioC: $('#fanioC').value, anioE: $('#fanioE').value, tipo: $('#ftipo').value, estado: $('#festado').value, rel: $('#frel').value, saldo: $('#fsaldo').checked };
    const F2 = FCLI;
    let list = Object.values(S.clientes).map(c => ({ c, i: infoCli(c, hoy) }))
      .filter(({ c }) => !F2.q || [c.nombre, c.apellido, c.celular, c.familia].join(' ').toLowerCase().includes(F2.q))
      .filter(({ c }) => !F2.rel || (F2.rel === '__sin' ? !c.religion : c.religion === F2.rel))
      .filter(({ i }) => !F2.anioC || (F2.anioC === '__sin' ? !i.contrato : i.act.some(e => (e.fechaContratacion || '').startsWith(F2.anioC))))
      .filter(({ i }) => !F2.anioE || i.act.some(e => e.fecha.startsWith(F2.anioE)))
      .filter(({ i }) => !F2.tipo || i.act.some(e => tipoEv(e) === F2.tipo))
      .filter(({ i }) => !F2.estado || (F2.estado === 'proximo' ? !!i.proximo : F2.estado === 'realizado' ? i.act.length && !i.proximo : !i.act.length))
      .filter(({ i }) => !F2.saldo || i.act.some(e => e.fecha >= hoy && resumenEv(e).pendiente > 0));
    const porNombre = (a, b) => nombreCli(a.c).localeCompare(nombreCli(b.c));
    const grupoEv = x => x.i.proximo ? 0 : x.i.ultimo ? 1 : 2;
    const vacio = (x, y, f) => (!x && !y) ? 0 : !x ? 1 : !y ? -1 : f();
    const ord = {
      'contrato-desc': (a, b) => vacio(a.i.contrato, b.i.contrato, () => b.i.contrato.localeCompare(a.i.contrato)) || porNombre(a, b),
      'contrato-asc': (a, b) => vacio(a.i.contrato, b.i.contrato, () => a.i.contrato.localeCompare(b.i.contrato)) || porNombre(a, b),
      // primero los que tienen evento por venir (por su próximo evento), después los ya realizados (el más reciente primero) y al final los sin evento
      'evento-asc': (a, b) => grupoEv(a) - grupoEv(b) || (a.i.proximo ? a.i.proximo.fecha.localeCompare(b.i.proximo.fecha) : a.i.ultimo ? b.i.ultimo.fecha.localeCompare(a.i.ultimo.fecha) : 0) || porNombre(a, b),
      'evento-desc': (a, b) => grupoEv(a) - grupoEv(b) || (a.i.proximo ? b.i.proximo.fecha.localeCompare(a.i.proximo.fecha) : a.i.ultimo ? b.i.ultimo.fecha.localeCompare(a.i.ultimo.fecha) : 0) || porNombre(a, b),
      nombre: porNombre,
    }[F2.orden] || porNombre;
    list.sort(ord);
    $('#tblCli').innerHTML = list.length ? `<table><thead><tr><th>Cliente</th><th>Celular</th><th>Contrató</th><th>Eventos</th><th>Religión</th><th>Familia</th></tr></thead><tbody>${list.map(({ c, i }) =>
      `<tr class="click" data-go="cliente/${c.id}"><td>${esc(nombreCli(c))}</td><td class="nowrap">${esc(fmtTel(c.celular))}</td><td class="nowrap small">${i.contrato ? fmtD(i.contrato) : '<span class="muted">—</span>'}</td><td class="small">${i.es.map(e => `${esc(tipoEv(e))} ${fmtD(e.fecha)}${e.estado === 'cancelado' ? ' <span class="muted">(cancelado)</span>' : ''}`).join('<br>')}</td><td class="small">${esc(c.religion || '')}</td><td class="small">${esc(c.familia || '')}</td></tr>`).join('')}</tbody></table><p class="small muted">${list.length} de ${Object.keys(S.clientes).length} clientes</p>` : '<p class="muted">No hay clientes con esos filtros.</p>';
  };
  $('#fq').oninput = upd;
  ['#forden', '#fanioC', '#fanioE', '#ftipo', '#festado', '#frel', '#fsaldo'].forEach(x => $(x).onchange = upd);
  $('#fLimpiar').onclick = () => { FCLI = { q: '', rel: '', orden: FCLI.orden, anioC: '', anioE: '', tipo: '', estado: '', saldo: false }; render(); };
  upd();
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
  ${panelRecordatorios(id)}
  <div class="panel"><h2>Eventos</h2>${es.length ? `<table><thead><tr><th>Fecha</th><th>Evento</th><th>Estado</th><th class="num">Pendiente $ (hoy)</th></tr></thead><tbody>${es.map(e => `<tr class="click" data-go="evento/${e.id}"><td>${fmtDL(e.fecha)}</td><td>${esc(tituloEv(e))}</td><td>${badgeEstado(e)}</td><td class="num">${fmt$(resumenEv(e).pendiente)}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Sin eventos.</p>'}</div>`;
};
VIEWS.cliente.after = id => {
  if (!S.clientes[id]) return;
  $('#edCli').onclick = () => formCliente(id);
  $('#nuevoEv').onclick = () => formEvento(null, { clienteId: id });
  bindRecordatorios();
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
      <div class="card"><div class="k">Valor cubierto hoy</div><div class="v">${fmt$(k.valorHoy)}</div>${k.conAtencion ? `<div class="small muted" title="Solo interno: no sale en la impresión">Precio especial · sin la atención sería ${fmt$(k.valorRealHoy)}</div>` : ''}</div>
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
    <div class="tbl-wrap"><table><thead><tr><th>Mes</th><th class="center">Ajusta</th><th>IPC de</th><th class="num">% aplicado</th><th class="num">Valor cubierto</th>${k.conAtencion ? '<th class="num" title="Solo interno: cómo estaría el cubierto sin el precio especial">Sin la atención</th>' : ''}<th class="num">Pagado</th><th class="num">Cub. abonados</th><th class="num">Acumulado</th><th class="num">Pendientes</th></tr></thead><tbody>
      ${k.meses.map(r => `<tr class="${r.mes < ym(hoy) ? 'past' : ''} ${r.mes === ym(hoy) ? 'cur' : ''}"><td class="nowrap">${fmtYM(r.mes)}${r.i === 0 ? ' <span class="small muted">(base)</span>' : ''}</td>
        <td class="center">${r.i === 0 ? '' : `<input type="checkbox" data-aj="${r.mes}" ${r.aplica ? 'checked' : ''}>`}</td>
        <td class="small muted">${r.i === 0 ? '' : fmtYMc(r.ipcDe) + ' ' + (S.ipc[r.ipcDe] && S.ipc[r.ipcDe].valor !== null && S.ipc[r.ipcDe].valor !== undefined && S.ipc[r.ipcDe].valor !== '' ? fmtP(num(S.ipc[r.ipcDe].valor)) : '<span class="badge b-warn">sin cargar</span>')}</td>
        <td class="num">${r.i === 0 || !r.aplica ? '' : `<input data-pct="${r.mes}" value="${r.manual ? r.pct : ''}" placeholder="${r.pct !== null && !r.manual ? r.pct : '—'}" inputmode="decimal" title="Dejalo vacío para usar el IPC cargado">`}</td>
        <td class="num">${r.pend ? '<span class="badge b-warn">IPC pendiente</span> ' : ''}${r.especial ? `<span class="badge b-ok" title="${esc(r.motivo || 'Precio especial')}">precio especial</span> ` : ''}${fmt$(r.valor)}${r.especial ? ` <button class="btn-sm" data-quitaesp="${r.mes}" title="Quitar el precio especial de este mes">✕</button>` : ''}${r.especial && r.motivo ? `<div class="small muted">${esc(r.motivo)}</div>` : ''}</td>${k.conAtencion ? `<td class="num small muted">${r.real !== r.valor ? fmt$(r.real) : ''}</td>` : ''}
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
  $$('[data-quitaesp]').forEach(b => b.onclick = () => confirmar('¿Quitar el precio especial de ' + fmtYM(b.dataset.quitaesp) + '? El cubierto vuelve al valor calculado por IPC (los pagos ya hechos no cambian).', () => updCuenta(id, k2 => { const a = { ...(k2.ajustes[b.dataset.quitaesp] || {}) }; delete a.valorFijo; delete a.motivo; delete a.pagoId; k2.ajustes[b.dataset.quitaesp] = a; })));
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
  // precio especial que fijó este mismo pago (si lo hay)
  const espMes = pid ? Object.keys(c.ajustes).find(m => c.ajustes[m].pagoId === pid && num(c.ajustes[m].valorFijo) > 0) : null;
  const espAj = espMes ? c.ajustes[espMes] : {}, espIni = !!espMes;
  modal({
    title: pid ? 'Editar pago' : 'Registrar pago',
    body: F.date('fecha', 'Fecha', p.fecha, 'id="pFecha"') + F.sel('tipo', 'Concepto', [['cubiertos', 'Pago de cubiertos'], ['iva', 'Pago de IVA']], p.tipo, 'id="pTipo"') +
      `<div class="full fgrid" id="cubBox" style="grid-template-columns:1fr 1fr">` +
      F.num('valor', 'Valor del cubierto aplicado', ini, 'id="pValor"') + F.num('cubiertos', 'Cubiertos (calcula el monto)', !pid && p.sena ? CONF().sena : '', 'id="pCub"') +
      F.chk('sena', 'Es la seña', p.sena) +
      F.chk('especial', 'Precio especial: desde este mes el cubierto le queda en el valor aplicado (y sigue ajustando por IPC desde ahí)', espIni, 'full id="pEsp"') +
      `<div class="full" id="espBox">${F.text('motivoEsp', 'Motivo de la atención (solo interno)', espAj.motivo || '', 'full placeholder="Ej.: le respetamos el precio de octubre"')}</div>` + '</div>' +
      camposMedios(p, 'Monto recibido (ARS)') +
      F.text('nota', 'Nota (ej.: USD 500 a $1.180)', p.nota, 'full') + '<div class="full" id="pPrev"></div>',
    danger: pid ? { label: 'Eliminar pago', confirm: '¿Eliminar este pago?', fn: () => updCuenta(id, k2 => { k2.pagos = k2.pagos.filter(x => x.id !== pid); Object.keys(k2.ajustes).forEach(m => { if (k2.ajustes[m].pagoId === pid) { const a = { ...k2.ajustes[m] }; delete a.valorFijo; delete a.motivo; delete a.pagoId; k2.ajustes[m] = a; } }); }) } : null,
    onOpen: form => {
      const fv = $('#pValor', form), fc = $('#pCub', form), fm = $('#pMonto', form), fm2 = $('#pMonto2', form), comb = $('#pComb', form);
      const total = () => num(fm.value) + (comb.checked ? num(fm2.value) : 0);
      let tocoValor = !!pid;
      fv.oninput = () => { tocoValor = true; };
      $('#pFecha', form).onchange = () => { if (!tocoValor) fv.value = valorDe($('#pFecha', form).value); u(); };
      fc.oninput = () => { if (fc.value) fm.value = Math.max(0, Math.round(num(fc.value) * num(fv.value)) - (comb.checked ? num(fm2.value) : 0)); };
      const u = () => {
        $('#cubBox', form).style.display = $('#pTipo', form).value === 'iva' ? 'none' : '';
        $('#espBox', form).style.display = $('#pEsp', form).checked ? '' : 'none';
        const v = num(fv.value), m = total();
        if ($('#pTipo', form).value === 'iva') { $('#pPrev', form).innerHTML = `<div class="alert info">IVA pendiente: ${fmt$(k.ivaPendiente)}</div>`; return; }
        const credPrev = pid ? 0 : k.credito;
        const n = v > 0 ? Math.floor((m + credPrev) / v + 1e-9) : 0;
        const r = Math.round(m + credPrev - n * v);
        const mesPend = (k.meses.find(x => x.mes === ym($('#pFecha', form).value)) || {}).pend;
        $('#pPrev', form).innerHTML = (mesPend ? '<div class="alert warn">El IPC que ajusta ese mes todavía no está cargado. Si cobrás igual, revisá el valor aplicado.</div>' : '') +
          (v ? `<div class="alert info">${credPrev ? `Saldo a favor previo ${fmt$(credPrev)} + ` : ''}${fmt$(m)} ÷ ${fmt$(v)} = <b>${n} cubiertos</b> congelados${r ? ` · quedan <b>${fmt$(r)}</b> a favor` : ''}.</div>` : '') +
          ($('#pEsp', form).checked && v ? `<div class="alert info">Desde ${fmtYM(ym($('#pFecha', form).value))} el cubierto de este cliente pasa a <b>${fmt$(v)}</b> (por IPC estaría en ${fmt$(k.valorEnMes(ym($('#pFecha', form).value)))}). Los meses siguientes ajustan desde este valor.</div>` : '');
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
        // precio especial: se guarda en el mes del pago, atado a este pago
        Object.keys(k2.ajustes).forEach(m => { if (k2.ajustes[m].pagoId === obj.id) { const a = { ...k2.ajustes[m] }; delete a.valorFijo; delete a.motivo; delete a.pagoId; k2.ajustes[m] = a; } });
        if (d.especial && d.tipo !== 'iva') k2.ajustes[ym(d.fecha)] = { ...(k2.ajustes[ym(d.fecha)] || {}), valorFijo: num(d.valor), motivo: d.motivoEsp || '', pagoId: obj.id };
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
      <dl class="kv"><dt>Mínimo sábados</dt><dd>${c.minimos[5]} cubiertos</dd><dt>Mínimo viernes</dt><dd>${c.minimos[4]} cubiertos</dd><dt>Mínimo domingos</dt><dd>${c.minimos.dom} cubiertos</dd><dt>Mínimo otros días</dt><dd>${c.minimos.otro} cubiertos</dd>
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
    body: F.num('sab', 'Mínimo sábados', c.minimos[5]) + F.num('vie', 'Mínimo viernes', c.minimos[4]) + F.num('dom', 'Mínimo domingos', c.minimos.dom) + F.num('otro', 'Mínimo otros días', c.minimos.otro) + F.num('sena', 'Seña (cubiertos)', c.sena) +
      F.num('reservaSemana', 'Cubiertos para la semana del evento', c.reservaSemana) + F.num('mesesCongelado', 'Meses sin ajuste', c.mesesCongelado) + F.num('validezPendiente', 'Validez de una reserva pendiente (días)', c.validezPendiente) + F.num('ivaPct', 'IVA %', c.iva.pct) + F.chk('ivaOn', 'Sumar IVA por defecto en eventos nuevos', c.iva.activoPorDefecto, 'full'),
    onSubmit: d => saveConf({ minimos: { 5: num(d.sab), 4: num(d.vie), dom: num(d.dom), otro: num(d.otro) }, sena: num(d.sena), reservaSemana: num(d.reservaSemana), mesesCongelado: num(d.mesesCongelado), validezPendiente: num(d.validezPendiente), iva: { pct: pct(d.ivaPct) ?? 21, activoPorDefecto: d.ivaOn } }),
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
let PRINT_OPTS = { cub: true, ext: true, mes: false, sal: false };   // sal: saldo de cubiertos en pesos (a valor de hoy, cambia con el IPC)
VIEWS.imprimir = id => {
  const e = ev(id); if (!e) return '<p>Evento no encontrado.</p>';
  const c = cli(e.clienteId), k = calcCuenta(e), x = calcExtras(e), o = PRINT_OPTS;
  const salCub = o.cub && o.sal;   // sin saldo: los cubiertos pendientes se muestran en cantidad, no en pesos
  const tot = (salCub ? k.montoPendiente + k.ivaPendiente : 0) + (o.ext ? Math.max(0, x.saldo) : 0);
  const cubPend = o.cub && !o.sal && k.pendientes > 0;
  return `<div class="no-print print-opts"><a href="#/evento/${id}">← Volver al evento</a>
    <label class="chk"><input type="checkbox" data-po="cub" ${o.cub ? 'checked' : ''}> Cubiertos</label>
    <label class="chk"><input type="checkbox" data-po="mes" ${o.mes ? 'checked' : ''}> Detalle mes a mes</label>
    <label class="chk" title="Tildalo solo si querés mostrar cuánto deben en pesos de cubiertos (se calcula a valor de hoy y cambia con el IPC)"><input type="checkbox" data-po="sal" ${o.sal ? 'checked' : ''}> Saldo en pesos</label>
    <label class="chk"><input type="checkbox" data-po="ext" ${o.ext ? 'checked' : ''}> Extras</label>
    <button class="btn-primary" onclick="imprimirHoja()">🖨️ Imprimir</button><button class="btn-gold" onclick="descargarPDF()">⬇ Descargar PDF</button></div>
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
      ${o.sal ? `<tr><td>Valor del cubierto al ${fmtD(todayISO())}</td><td class="num">${fmt$(k.valorHoy)}</td></tr>` : ''}
    </tbody></table>
    ${k.pagos.filter(p => p.tipo !== 'iva').length ? `<h3 style="margin-top:12px">Pagos recibidos</h3><table><thead><tr><th>Fecha</th><th>Concepto</th><th class="num">Importe</th><th class="num">Valor cubierto</th><th class="num">Cubiertos</th></tr></thead><tbody>
      ${k.pagos.filter(p => p.tipo !== 'iva').map(p => `<tr><td>${fmtD(p.fecha)}</td><td>${p.sena ? 'Seña' : 'Pago'}</td><td class="num">${fmt$(p.monto)}</td><td class="num">${fmt$(p.valor)}</td><td class="num">${fmtN(p.cubiertos)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="2">Total abonado</td><td class="num">${fmt$(k.montoCub)}</td><td></td><td class="num">${fmtN(k.pagados)}</td></tr></tfoot></table>` : ''}
    ${o.mes ? `<h3 style="margin-top:12px">Valor del cubierto mes a mes</h3><table><thead><tr><th>Mes</th><th class="num">Ajuste</th><th class="num">Valor cubierto</th></tr></thead><tbody>${k.meses.filter(r => r.mes <= ym(todayISO()) || r.i === 0).map(r => `<tr><td>${fmtYM(r.mes)}</td><td class="num">${r.i === 0 ? 'Valor inicial' : r.aplica ? (r.pct !== null ? fmtP(r.pct) : 'pendiente') : 'Sin ajuste'}</td><td class="num">${fmt$(r.valor)}</td></tr>`).join('')}</tbody></table>` : ''}
    <div class="tot" style="margin-top:10px"><table><tbody>
      ${k.credito > 0 && k.pendientes > 0 ? `<tr><td>Saldo a favor en pesos</td><td class="num">${fmt$(k.credito)}</td></tr>` : ''}
      ${o.sal ? `<tr><td><b>Pendiente cubiertos (valor de hoy)</b></td><td class="num"><b>${fmt$(k.montoPendiente)}</b></td></tr>
      ${k.ivaOn ? `<tr><td>IVA ${fmtP(k.ivaPct)} (total ${fmt$(k.ivaTotal)}, abonado ${fmt$(k.montoIva)})</td><td class="num">${fmt$(k.ivaPendiente)}</td></tr>` : ''}`
      : `<tr><td><b>Cubiertos pendientes</b></td><td class="num"><b>${fmtN(Math.max(0, k.pendientes))}</b></td></tr>`}
      ${k.aFavor > 0 && k.pendientes <= 0 ? `<tr><td>A favor del cliente</td><td class="num">${fmt$(k.aFavor)}</td></tr>` : ''}
    </tbody></table></div>
    ${k.pendientes > 0 ? `<p style="color:#666;font-size:11px">Los cubiertos pendientes se actualizan según las condiciones contratadas. Los cubiertos abonados quedan congelados.${k.reservaSemana ? ` La semana del evento se abonan los últimos ${fmtN(Math.min(k.pendientes, k.reservaSemana))} cubiertos.` : ''}</p>` : ''}` : ''}

    ${o.ext && x.lines.length ? `<h2>Adicionales</h2><table><thead><tr><th>Concepto</th><th class="num">Cant.</th><th class="num">Importe</th><th class="num">Abonado</th><th class="num">Saldo</th></tr></thead><tbody>
      ${x.lines.map(l => `<tr><td>${esc(l.nombre)}</td><td class="num">${l.cant}</td><td class="num">${l.regalo ? 'Obsequio' : fmt$(l.total)}</td><td class="num">${l.pagado ? fmt$(l.pagado) : '—'}</td><td class="num">${l.regalo ? '—' : fmt$(l.saldo)}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="2">Total adicionales</td><td class="num">${fmt$(x.total)}</td><td class="num">${fmt$(x.pagado)}</td><td class="num">${fmt$(x.saldo)}</td></tr></tfoot></table>` : ''}

    ${o.sal || !o.cub || (o.ext && x.saldo > 0) ? `<div class="tot" style="margin-top:16px"><table><tbody><tr><td style="font-size:1.05rem"><b>${cubPend ? 'Total pendiente en pesos (adicionales)' : 'Total pendiente'}</b></td><td class="num" style="font-size:1.05rem"><b>${fmt$(tot)}</b></td></tr>
      ${cubPend ? `<tr><td>Más cubiertos pendientes</td><td class="num">${fmtN(k.pendientes)}</td></tr>` : ''}</tbody></table></div>` : ''}
    <div class="foot">Salón Dorado · Villa Urquiza, Ciudad Autónoma de Buenos Aires</div>
  </div>`;
};

/* ---------- PERSONAL: mozos y camareras convocados por día ----------
   Se guarda dentro de la colección "config" (no hace falta tocar las reglas de Firestore):
   config/personal → { lista: [{ id, nombre, rol, tel, activo, tipo, tarifa }] }   (tarifa = cuánto cobra por jornada, privado)
   config/turnos-AAAA-MM → { dias: { 'AAAA-MM-DD': [ids de personas] }, no: {…}, pagado: { idPersona: true } } */
const ROLES_PERSONAL = ['Mozo', 'Camarera', 'Cocina', 'DJ', 'Iluminador', 'Guardarropas', 'Baños', 'Limpieza', 'Otro'];
/* cobros por categoría (privado): config/personal → tarifas: { salon: $, cocina: $, … } por jornada.
   Cada persona cobra la tarifa de su categoría principal (según su rol) + la de sus tareas extra (p.tareasExtra).
   Si tiene "tarifa propia" (p.tarifa), se usa esa en lugar de la suma. */
const CATS_PAGO = [['salon', 'Mozos y camareras'], ['cocina', 'Cocina'], ['dj', 'DJ'], ['iluminador', 'Iluminador'], ['guardarropas', 'Guardarropas'], ['banos', 'Baños'], ['limpieza', 'Limpieza']];
const catNombre = c => (CATS_PAGO.find(x => x[0] === c) || [c, c])[1];
const catDeRol = r => ({ Mozo: 'salon', Camarera: 'salon', Cocina: 'cocina', DJ: 'dj', Iluminador: 'iluminador', Guardarropas: 'guardarropas', 'Baños': 'banos', Limpieza: 'limpieza' })[r] || null;
const tarifasCat = () => (S.config.personal || {}).tarifas || {};
const tareasDe = p => [...new Set([catDeRol(p.rol), ...(p.tareasExtra || [])].filter(Boolean))];
function porJornada(p) {
  if (num(p.tarifa)) return { monto: num(p.tarifa), detalle: 'tarifa propia' };
  const t = tarifasCat(), tareas = tareasDe(p);
  return { monto: sum(tareas, c => num(t[c])), detalle: tareas.map(catNombre).join(' + '), faltan: tareas.filter(c => !num(t[c])).map(catNombre) };
}
// pagado por semana: config/turnos-AAAA-MM (del lunes) → pagadoSem: { lunes: { idPersona: fecha } }
const pagadoSem = (lunes, pid) => !!((((S.config['turnos-' + ym(lunes)] || {}).pagadoSem || {})[lunes] || {})[pid]);
function marcarPagadoSem(lunes, pid, v) {
  const id = 'turnos-' + ym(lunes), doc = S.config[id] || { id, dias: {} };
  const ps = { ...(doc.pagadoSem || {}) }, sem = { ...(ps[lunes] || {}) };
  if (v) sem[pid] = todayISO(); else delete sem[pid];
  ps[lunes] = sem;
  DB.save('config', { ...doc, id, pagadoSem: ps });
}
const personalLista = () => (S.config.personal || {}).lista || [];
const turnosDia = f => ((S.config['turnos-' + ym(f)] || {}).dias || {})[f] || [];
const ordenPersonal = (a, b) => (ROLES_PERSONAL.indexOf(a.rol) + 9) % 9 - (ROLES_PERSONAL.indexOf(b.rol) + 9) % 9 || (a.nombre || '').localeCompare(b.nombre || '');
const lunesDe = f => addDays(f, -((dow(f) + 6) % 7));
const DIAS_C = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
let PERS_SEM = null, PERS_MES = null;
// los montos (cobros) se muestran solo si se toca "Mostrar montos"; se recuerda en este dispositivo
const COBROS_KEY = 'sd-ver-cobros';
const verCobros = () => { try { return localStorage.getItem(COBROS_KEY) === '1'; } catch (e) { return false; } };
const pagadoMes = (mes, pid) => !!(((S.config['turnos-' + mes] || {}).pagado || {})[pid]);
function marcarPagado(mes, pid, v) {
  const id = 'turnos-' + mes, doc = S.config[id] || { id, dias: {} };
  const pagado = { ...(doc.pagado || {}) };
  if (v) pagado[pid] = true; else delete pagado[pid];
  DB.save('config', { ...doc, id, pagado });
}
function guardarPersonal(lista) { DB.save('config', { ...(S.config.personal || {}), id: 'personal', lista }); }
// cada día guarda quiénes vienen (dias[f]) y a quiénes se les preguntó y no pueden (no[f])
const noPuedeDia = f => ((S.config['turnos-' + ym(f)] || {}).no || {})[f] || [];
const estadoTurno = (f, pid) => turnosDia(f).includes(pid) ? 'si' : noPuedeDia(f).includes(pid) ? 'no' : '';
const esRefuerzo = p => p.tipo === 'refuerzo';
function marcarTurno(f, pid, est) {
  const id = 'turnos-' + ym(f), doc = S.config[id] || { id, dias: {} };
  const dias = { ...(doc.dias || {}) }, no = { ...(doc.no || {}) };
  const si = new Set(dias[f] || []), nn = new Set(no[f] || []);
  si.delete(pid); nn.delete(pid);
  if (est === 'si') si.add(pid); else if (est === 'no') nn.add(pid);
  if (si.size) dias[f] = [...si]; else delete dias[f];
  if (nn.size) no[f] = [...nn]; else delete no[f];
  DB.save('config', { ...doc, id, dias, no });
}
// días que se muestran: viernes, sábado y domingo, y cualquier otro con evento, feriado o gente anotada
const colsSemana = lunes => [...Array(7)].map((_, i) => addDays(lunes, i)).filter(f => [5, 6, 0].includes(dow(f)) || eventoEnFecha(f) || esFeriado(f) || turnosDia(f).length || noPuedeDia(f).length);
// filas: los fijos siempre; los de refuerzo solo si están anotados esa semana (o si los sumaste a mano)
function filasSemana(cols, extra = new Set()) {
  const lista = personalLista();
  const marcados = new Set(cols.flatMap(f => [...turnosDia(f), ...noPuedeDia(f)]));
  const fijos = lista.filter(p => p.activo !== false && !esRefuerzo(p)).sort(ordenPersonal);
  const refuerzo = lista.filter(p => esRefuerzo(p) && (marcados.has(p.id) || (p.activo !== false && extra.has(p.id)))).sort(ordenPersonal);
  const deBaja = lista.filter(p => p.activo === false && !esRefuerzo(p) && marcados.has(p.id)).sort(ordenPersonal);
  const otros = lista.filter(p => esRefuerzo(p) && p.activo !== false && !refuerzo.includes(p)).sort(ordenPersonal);
  return { fijos: [...fijos, ...deBaja], refuerzo, otros };
}
let PERS_EXTRA = new Set();
VIEWS.personal = () => {
  const hoy = todayISO();
  PERS_SEM = PERS_SEM || lunesDe(hoy); PERS_MES = PERS_MES || ym(hoy);
  const semana = [...Array(7)].map((_, i) => addDays(PERS_SEM, i));
  const cols = colsSemana(PERS_SEM);
  const lista = personalLista();
  const { fijos, refuerzo, otros } = filasSemana(cols, PERS_EXTRA);
  const fila = p => `<tr><td><b>${esc(p.nombre)}</b> <span class="small muted">${esc(p.rol || '')}${p.activo === false ? ' · de baja' : ''}</span></td>${cols.map(f => { const st = estadoTurno(f, p.id); return `<td class="center"><button type="button" class="turno t-${st || 'nada'}" data-turno="${f}|${p.id}" aria-label="${esc(p.nombre)} ${fmtD(f)}">${st === 'si' ? 'Sí' : st === 'no' ? 'No puede' : ''}</button></td>`; }).join('')}</tr>`;
  // resumen del mes
  const [yy, mm] = PERS_MES.split('-').map(Number), diasMes = new Date(yy, mm, 0).getDate();
  const delMes = [...Array(diasMes)].map((_, i) => `${PERS_MES}-${pad(i + 1)}`).filter(f => turnosDia(f).length);
  const resumen = lista.map(p => ({ p, fechas: delMes.filter(f => turnosDia(f).includes(p.id)) })).filter(r => r.fechas.length || r.p.activo !== false).sort((a, b) => b.fechas.length - a.fechas.length || ordenPersonal(a.p, b.p));
  const encab = f => { const e = eventoEnFecha(f); return `<th class="center" style="min-width:110px">${DIAS_C[dow(f)]} ${fmtD(f).slice(0, 5)}${f === hoy ? ' <span class="badge b-ok">hoy</span>' : ''}
      <div class="small" style="font-weight:400;text-transform:none;letter-spacing:0">${e ? `<a href="#/evento/${e.id}">${esc(nombreCli(cli(e.clienteId)))}</a><br><span class="muted">${esc(tipoEv(e))}${e.estado === 'pendiente' ? ' (pend.)' : ''}</span>` : `<span class="muted">${esFeriado(f) ? esc(nombreFeriado(f)) : 'Sin evento'}</span>`}</div></th>`; };
  return `<div class="top"><h1>Personal</h1><div class="actions"><button class="btn-primary" id="nuevaPers">+ Agregar persona</button></div></div>
  <div class="panel tbl-wrap"><div class="panel-h"><h2>¿Quiénes vienen?</h2>
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><button class="btn-sm" id="semAnt">◀</button><b style="min-width:190px;text-align:center">Semana del ${fmtD(semana[0]).slice(0, 5)} al ${fmtD(semana[6])}</b><button class="btn-sm" id="semSig">▶</button><button class="btn-sm" data-go="personalhoja/${PERS_SEM}">🖨️ Imprimir semana</button>${PERS_SEM !== lunesDe(hoy) ? '<button class="btn-sm" id="semHoy">Esta semana</button>' : ''}</div></div>
    <p class="small muted" style="margin-top:-4px">Tocá cada casillero para ir cambiando: <b>Sí</b> → <b>No puede</b> → vacío. Se guarda solo. Aparecen viernes, sábado y domingo, y cualquier otro día con evento o feriado.</p>
    ${!lista.length ? '<p class="muted">Todavía no cargaste a nadie. Tocá <b>+ Agregar persona</b>.</p>' : `<table><thead><tr><th>Persona</th>${cols.map(encab).join('')}</tr></thead><tbody>
      ${fijos.map(fila).join('')}
      ${refuerzo.length ? `<tr class="sep-row"><td colspan="${cols.length + 1}">De refuerzo</td></tr>${refuerzo.map(fila).join('')}` : ''}
      </tbody><tfoot><tr><td>Convocados</td>${cols.map(f => { const ids = turnosDia(f), pp = lista.filter(p => ids.includes(p.id)); const m = pp.filter(p => p.rol === 'Mozo').length, c = pp.filter(p => p.rol === 'Camarera').length; return `<td class="center">${ids.length}${ids.length ? `<div class="small muted" style="font-weight:400">${[[m, 'mozo', 'mozos'], [c, 'camarera', 'camareras'], [ids.length - m - c, 'otro', 'otros']].filter(z => z[0]).map(z => `${z[0]} ${z[0] === 1 ? z[1] : z[2]}`).join(' · ')}</div>` : ''}${ids.length ? `<button class="btn-sm" data-copiar="${f}" style="margin-top:4px">Copiar lista</button>` : ''}</td>`; }).join('')}</tr></tfoot></table>
      ${otros.length ? `<div style="margin-top:12px"><div class="small muted" style="margin-bottom:6px">De refuerzo · tocá un nombre para sumarlo a esta semana:</div><div style="display:flex;gap:6px;flex-wrap:wrap">${otros.map(p => `<button class="btn-sm" data-extra="${p.id}">+ ${esc(p.nombre)}</button>`).join('')}</div></div>` : ''}`}
  </div>
  <div class="grid2">
    <div class="panel"><div class="panel-h"><h2>Equipo</h2></div>
      ${lista.length ? `<ul class="list-clean">${[...lista].sort((a, b) => (a.activo === false) - (b.activo === false) || ordenPersonal(a, b)).map(p => `<li><div><b>${esc(p.nombre)}</b> <span class="small muted">${esc(p.rol || '')}</span>${esRefuerzo(p) ? ' <span class="badge b-warn">refuerzo</span>' : ''}${p.activo === false ? ' <span class="badge b-cancelado">de baja</span>' : ''}${p.tel ? `<div class="small muted">${esc(fmtTel(p.tel))}</div>` : ''}</div>
        <div style="display:flex;gap:6px">${p.tel ? `<a class="btn btn-sm btn-wa" target="_blank" href="${waLink(p.tel)}">WhatsApp</a>` : ''}<button class="btn-sm" data-pers="${p.id}">Editar</button></div></li>`).join('')}</ul>` : '<p class="muted">Sin personal cargado.</p>'}
    </div>
    <div class="panel"><div class="panel-h"><h2>Días trabajados</h2><input type="month" id="persMes" value="${PERS_MES}" style="width:auto"></div>
      ${delMes.length ? `<table><thead><tr><th>Persona</th><th class="num">Días</th><th>Fechas</th></tr></thead><tbody>${resumen.map(r => `<tr><td>${esc(r.p.nombre)} <span class="small muted">${esc(r.p.rol || '')}</span></td><td class="num"><b>${r.fechas.length}</b></td><td class="small">${r.fechas.map(f => `${DIAS_C[dow(f)]} ${fmtD(f).slice(0, 5)}`).join(', ')}</td></tr>`).join('')}</tbody></table>` : `<p class="muted">Sin convocatorias cargadas en ${fmtYM(PERS_MES).toLowerCase()}.</p>`}
    </div>
  </div>
  ${cobrosHtml(resumen)}`;
};
// sección privada: cuánto cobra cada uno y cuánto hay que pagarle por semana (no sale en la hoja impresa)
function cobrosHtml(resumen) {
  const ver = verCobros();
  const head = `<div class="panel-h"><h2>🔒 Cobros <span class="small muted" style="font-weight:400">· privado, no sale en la hoja impresa</span></h2><div style="display:flex;gap:6px;flex-wrap:wrap">${ver ? '<button class="btn-sm" id="tarifasCat">Tarifas por categoría</button>' : ''}<button class="btn-sm" id="verCobros">${ver ? '🙈 Ocultar montos' : '👁 Mostrar montos'}</button></div></div>`;
  if (!ver) return `<div class="panel">${head}<p class="muted small">Los montos están ocultos. Tocá <b>Mostrar montos</b> para verlos.</p></div>`;
  const t = tarifasCat(), sinTarifas = !CATS_PAGO.some(([c]) => num(t[c]));
  // semana elegida arriba (todos los días de lunes a domingo)
  const dias = [...Array(7)].map((_, i) => addDays(PERS_SEM, i));
  const semana = personalLista().map(p => ({ p, fechas: dias.filter(f => turnosDia(f).includes(p.id)), j: porJornada(p) })).filter(r => r.fechas.length).sort((a, b) => ordenPersonal(a.p, b.p));
  const tot = r => r.fechas.length * r.j.monto;
  const total = sum(semana, tot), pend = sum(semana.filter(r => !pagadoSem(PERS_SEM, r.p.id)), tot), sinMonto = semana.filter(r => !r.j.monto).length;
  const tabla = semana.length ? `<div class="tbl-wrap"><table><thead><tr><th>Persona</th><th>Tareas</th><th class="num">Días</th><th class="num">Por jornada</th><th class="num">A pagar</th><th class="center">Pagado</th></tr></thead><tbody>
    ${semana.map(r => `<tr><td>${esc(r.p.nombre)}</td><td class="small">${esc(r.j.detalle || '—')}${r.j.faltan && r.j.faltan.length ? ` <span class="badge b-warn" title="Falta cargar la tarifa de: ${esc(r.j.faltan.join(', '))}">sin tarifa</span>` : ''}</td>
      <td class="num">${r.fechas.length}<div class="small muted">${r.fechas.map(f => DIAS_C[dow(f)]).join(' ')}</div></td>
      <td class="num">${r.j.monto ? fmt$(r.j.monto) : `<button class="btn-sm" data-pers="${r.p.id}">Cargar</button>`}</td><td class="num"><b>${r.j.monto ? fmt$(tot(r)) : '—'}</b></td>
      <td class="center"><input type="checkbox" data-pagadosem="${r.p.id}" ${pagadoSem(PERS_SEM, r.p.id) ? 'checked' : ''} style="width:20px;height:20px" aria-label="Pagado a ${esc(r.p.nombre)}"></td></tr>`).join('')}
    </tbody><tfoot><tr><td colspan="2">Total de la semana</td><td class="num">${sum(semana, r => r.fechas.length)}</td><td></td><td class="num">${fmt$(total)}</td><td class="center small">${pend ? 'Falta ' + fmt$(pend) : sinMonto ? '' : 'Todo pagado ✓'}${sinMonto ? `<div class="muted">${sinMonto} sin monto</div>` : ''}</td></tr></tfoot></table></div>`
    : '<p class="muted">Nadie anotado con "Sí" esta semana.</p>';
  // resumen del mes (solo totales)
  const delMes = resumen.filter(r => r.fechas.length).map(r => ({ ...r, j: porJornada(r.p) }));
  const totMes = sum(delMes, r => r.fechas.length * r.j.monto);
  return `<div class="panel">${head}
    ${sinTarifas ? '<div class="alert warn">Todavía no cargaste las tarifas. Tocá <b>Tarifas por categoría</b> y poné cuánto cobra por jornada cada categoría (mozos y camareras, cocina, DJ…).</div>' : ''}
    <h3>Semana del ${fmtD(PERS_SEM).slice(0, 5)} al ${fmtD(addDays(PERS_SEM, 6))} <span class="small muted" style="font-weight:400">(se cambia con las flechas de arriba)</span></h3>
    <p class="small muted" style="margin-top:-4px">Días con <b>Sí</b> × lo que cobra cada uno por jornada: la tarifa de su categoría más la de sus tareas extra (se cargan en <b>Editar</b> de cada persona).</p>
    ${tabla}
    <p class="small" style="margin-top:12px">Total de ${fmtYM(PERS_MES).toLowerCase()}: <b>${fmt$(totMes)}</b> · ${sum(delMes, r => r.fechas.length)} jornadas <span class="muted">(el mes se elige en "Días trabajados")</span></p>
  </div>`;
}
function formTarifas() {
  const t = tarifasCat();
  modal({
    title: '🔒 Tarifas por categoría',
    body: F.hint('Cuánto cobra cada categoría por jornada (evento). Si alguien hace más de una tarea, se le suman. A una persona puntual le podés poner una tarifa propia en Editar.') +
      CATS_PAGO.map(([c, n]) => F.num('t_' + c, n + ' (ARS)', t[c] || '')).join(''),
    onSubmit: d => { const tarifas = {}; CATS_PAGO.forEach(([c]) => { if (num(d['t_' + c])) tarifas[c] = num(d['t_' + c]); }); DB.save('config', { ...(S.config.personal || {}), id: 'personal', lista: personalLista(), tarifas }); },
  });
}
VIEWS.personal.after = () => {
  $('#verCobros').onclick = () => { try { localStorage.setItem(COBROS_KEY, verCobros() ? '0' : '1'); } catch (e) { } render(); };
  $$('[data-pagadosem]').forEach(c => c.onchange = () => marcarPagadoSem(PERS_SEM, c.dataset.pagadosem, c.checked));
  const tc = $('#tarifasCat'); if (tc) tc.onclick = formTarifas;
  $('#nuevaPers').onclick = () => formPersonal();
  $('#semAnt').onclick = () => { PERS_SEM = addDays(PERS_SEM, -7); PERS_EXTRA = new Set(); render(); };
  $('#semSig').onclick = () => { PERS_SEM = addDays(PERS_SEM, 7); PERS_EXTRA = new Set(); render(); };
  const sh = $('#semHoy'); if (sh) sh.onclick = () => { PERS_SEM = lunesDe(todayISO()); PERS_EXTRA = new Set(); render(); };
  $('#persMes').onchange = e => { PERS_MES = e.target.value || ym(todayISO()); render(); };
  $$('[data-pers]').forEach(b => b.onclick = () => formPersonal(b.dataset.pers));
  $$('[data-turno]').forEach(c => c.onclick = () => { const [f, pid] = c.dataset.turno.split('|'); const st = estadoTurno(f, pid); marcarTurno(f, pid, st === '' ? 'si' : st === 'si' ? 'no' : ''); });
  $$('[data-extra]').forEach(b => b.onclick = () => { PERS_EXTRA.add(b.dataset.extra); render(); });
  $$('[data-copiar]').forEach(b => b.onclick = async () => {
    const f = b.dataset.copiar, e = eventoEnFecha(f), ids = turnosDia(f);
    const pp = personalLista().filter(p => ids.includes(p.id)).sort(ordenPersonal);
    const txt = `${DIAS[dow(f)]} ${fmtD(f)}${e ? ' · ' + tituloEv(e) : ''}\n` + pp.map(p => `- ${p.nombre} (${p.rol || ''})`).join('\n');
    try { await navigator.clipboard.writeText(txt); toast('Lista copiada: pegala en WhatsApp.'); } catch (err) { modal({ title: 'Lista del día', body: F.area('t', 'Copiala desde acá', txt, 'style="min-height:200px"'), submit: '' }); }
  });
};
/* hoja de la semana para imprimir (como la planilla en papel) */
VIEWS.personalhoja = lunes => {
  lunes = /^\d{4}-\d{2}-\d{2}$/.test(lunes || '') ? lunes : lunesDe(todayISO());
  const cols = colsSemana(lunes), { fijos, refuerzo, otros } = filasSemana(cols);
  const celda = (f, p) => { const st = estadoTurno(f, p.id); return `<td class="center">${st === 'si' ? '<b>Sí</b>' : st === 'no' ? '—' : ''}</td>`; };
  const fila = p => `<tr><td>${esc(p.nombre)}${p.rol && p.rol !== 'Otro' ? ` <span style="color:#888;font-size:11px">${esc(p.rol)}</span>` : ''}</td>${cols.map(f => celda(f, p)).join('')}</tr>`;
  const vacia = `<tr><td>&nbsp;</td>${cols.map(() => '<td></td>').join('')}</tr>`;
  const tot = f => turnosDia(f).length;
  return `<div class="no-print print-opts"><a href="#/personal">← Volver a Personal</a>
    <button class="btn-primary" onclick="imprimirHoja()">🖨️ Imprimir</button><button class="btn-gold" onclick="descargarPDF()">⬇ Descargar PDF</button></div>
  <div class="print-doc pers-doc">
    <div class="ph"><img src="${LOGO}" alt="Salón Dorado"><div class="right"><b style="font-size:16px">Personal</b><br>Semana del ${fmtD(lunes).slice(0, 5)} al ${fmtD(addDays(lunes, 6))}</div></div>
    <table class="pers-tbl"><thead><tr><th></th>${cols.map(f => { const e = eventoEnFecha(f); return `<th class="center">${DIAS[dow(f)]} ${fmtD(f).slice(0, 5)}<div style="font-weight:400;text-transform:none;letter-spacing:0;font-size:11px">${e ? esc(tipoEv(e)) + ' · ' + esc(nombreCli(cli(e.clienteId))) : ''}</div></th>`; }).join('')}</tr></thead>
    <tbody>${fijos.map(fila).join('')}${refuerzo.map(fila).join('')}${vacia}${vacia}</tbody>
    <tfoot><tr><td>Total</td>${cols.map(f => `<td class="center">${tot(f) || ''}</td>`).join('')}</tr></tfoot></table>
    ${otros.length ? `<h2>De refuerzo</h2><div class="pers-otros">${otros.map(p => `<div>${esc(p.nombre)}${p.tel ? ` <span style="color:#888">${esc(fmtTel(p.tel))}</span>` : ''}</div>`).join('')}</div>` : ''}
  </div>`;
};
function formPersonal(id) {
  const lista = personalLista(), p = id ? lista.find(x => x.id === id) : { rol: 'Mozo', activo: true };
  modal({
    title: id ? 'Editar persona' : 'Agregar persona',
    body: F.text('nombre', 'Nombre y apellido', p.nombre, 'full') + F.sel('rol', 'Rol', ROLES_PERSONAL.includes(p.rol) || !p.rol ? ROLES_PERSONAL : [...ROLES_PERSONAL, p.rol], p.rol) +
      F.text('tel', 'Celular (opcional)', fmtTel(p.tel), 'inputmode="tel" placeholder="+54911 xxxx-xxxx"') +
      F.sep('🔒 Cobro (privado)') +
      `<div class="full"><div class="small muted" style="margin-bottom:4px">Tareas extra que también hace (se suman a su sueldo):</div><div style="display:flex;gap:4px 14px;flex-wrap:wrap">${CATS_PAGO.map(([c, n]) => `<label class="chk"><input type="checkbox" name="tx_${c}" ${(p.tareasExtra || []).includes(c) ? 'checked' : ''}> ${esc(n)}</label>`).join('')}</div></div>` +
      F.num('tarifa', 'Tarifa propia por jornada (opcional)', p.tarifa || '', 'placeholder="Vacío = según categorías"') + '<div class="full small muted" id="pjPrev"></div>' +
      F.sel('tipo', 'En la grilla', [['fijo', 'Fijo: aparece siempre'], ['refuerzo', 'De refuerzo: se suma cuando lo convocás']], p.tipo || 'fijo', 'full') + F.chk('activo', 'Trabaja actualmente con nosotros', p.activo !== false, 'full') +
      F.hint('Si alguien deja de venir, destildá "Trabaja actualmente": deja de aparecer en la grilla pero se guardan sus días trabajados.'),
    onOpen: form => { const u = () => { const d = readForm(form); const q = porJornada({ rol: d.rol, tarifa: num(d.tarifa), tareasExtra: CATS_PAGO.map(([c]) => c).filter(c => d['tx_' + c]) }); $('#pjPrev', form).innerHTML = verCobros() ? (q.monto ? `Cobra <b>${fmt$(q.monto)}</b> por jornada (${esc(q.detalle)}).` : 'Sin monto: cargá las tarifas por categoría o una tarifa propia.') : ''; }; form.addEventListener('input', u); form.addEventListener('change', u); u(); },
    danger: id ? { label: 'Eliminar', confirm: '¿Eliminar a esta persona? Mejor dala de baja si querés conservar sus días trabajados.', fn: () => guardarPersonal(personalLista().filter(x => x.id !== id)) } : null,
    onSubmit: d => {
      if (!d.nombre) { toast('Falta el nombre.'); return false; }
      const obj = { ...(p.id ? p : {}), id: p.id || uid(), nombre: d.nombre, rol: d.rol, tel: normTel(d.tel), activo: d.activo, tipo: d.tipo || 'fijo', tarifa: num(d.tarifa) || null, tareasExtra: CATS_PAGO.map(([c]) => c).filter(c => d['tx_' + c] && c !== catDeRol(d.rol)) };
      guardarPersonal(id ? personalLista().map(x => x.id === id ? obj : x) : [...personalLista(), obj]);
    },
  });
}

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
    <button class="btn-primary" onclick="imprimirHoja()">🖨️ Imprimir</button><button class="btn-gold" onclick="descargarPDF()">⬇ Descargar PDF</button></div>
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
    <button class="btn-primary" id="ctPrint">🖨️ Imprimir</button><button class="btn-gold" id="ctPdf">⬇ Descargar PDF</button></div>
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
  let tPrep = 0;
  const upd = () => { CT_DRAFT = { id, datos: leer() }; $('#ctDoc').innerHTML = contratoDoc(ev(id), CT_DRAFT.datos); $('#ctMsg').textContent = 'Cambios sin guardar'; clearTimeout(tPrep); tPrep = setTimeout(prepararImpresion, 250); };
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
  $('#ctPrint').onclick = () => {
    clearTimeout(tPrep);
    const pend = !!(CT_DRAFT && CT_DRAFT.id === id);
    if (pend) { try { guardar(); } catch (err) { console.error(err); } }
    prepararImpresion(); imprimirHoja();
  };
  $('#ctPdf').onclick = () => {
    clearTimeout(tPrep);
    if (CT_DRAFT && CT_DRAFT.id === id) { try { guardar(); } catch (err) { console.error(err); } }
    descargarPDF();
  };
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
    <button class="btn-primary" onclick="imprimirHoja()">🖨️ Imprimir</button><button class="btn-gold" onclick="descargarPDF()">⬇ Descargar PDF</button></div>
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
