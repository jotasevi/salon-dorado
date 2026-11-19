# Salón Dorado · App de gestión

App web de gestión de **Salón Dorado** (salón de eventos familiar en Villa Urquiza, CABA). La usan los dos dueños: Juan y su papá.
Idioma de la interfaz y de las respuestas: **español rioplatense**. El usuario no es programador: explicarle los cambios en palabras simples.

## Arquitectura
- HTML + JavaScript puro, sin build ni npm. Archivos: `index.html`, `app.js` (toda la lógica), `styles.css`, `config.js` (datos de Firebase), `manifest.json`, íconos.
- Datos en **Firebase Firestore** (SDK 10 cargado por CDN desde gstatic dentro de `app.js`), login con **Firebase Auth** (email y clave).
- Publicada con **GitHub Pages** desde la rama `main` (raíz). Cada commit en `main` se publica solo en 1–2 minutos: https://jotasevi.github.io/salon-dorado/
- Colecciones: `clientes`, `eventos` (con `cuenta` = condiciones, pagos, ajustes y número final, y `extras` = líneas con sus pagos), `ipc` (id `AAAA-MM`, `valor` %), `extrasCat`, `egresos`, `config` (doc `general`).
- Si se agrega una colección nueva, hay que sumarla también a `COLS` en `app.js` y a la lista de las reglas de Firestore (que se editan en la consola de Firebase).
- Sin `config.js` configurado, la app abre en modo demostración con datos de ejemplo en localStorage. `window.SD` expone el estado para depurar desde la consola.
- Vistas por hash (`#/inicio`, `#/calendario/2027`, `#/evento/ID`, `#/imprimir/ID`…), en el objeto `VIEWS`. Toda edición se hace en modales (`modal()`); no usar alert/confirm nativos (usar `toast()` y `confirmar()`).

## Reglas del negocio (no cambiar sin que Juan lo pida)
- Se vende por **cubierto** (precio por invitado, todo incluido). **"Cubierto pago, cubierto congelado"**: cada pago guarda el valor del cubierto de ese momento.
- Cubiertos de un pago = parte entera de (monto + saldo a favor previo) / valor. El resto queda **a favor en pesos** y se suma al pago siguiente.
- El valor se ajusta **mensualmente por IPC, compuesto**. El ajuste del mes M usa el IPC del mes M-1 (se publica a mediados de M). El mes base no ajusta, los N meses siguientes (`mesesCongelado`, configurable por evento) tampoco, y después ajusta todos los meses. Se puede destildar un mes puntual (ese índice **se pierde**, no se acumula) o poner un % distinto para un cliente.
- Seña: 20 cubiertos por defecto. Se piden 30 cubiertos para pagar la semana del evento (configurable).
- Mínimos: 120 cubiertos los sábados y domingos, 100 los viernes y otros días, editables por evento (excepciones como 110). El mínimo se cuenta en cubiertos enteros.
- Número final: adultos y jóvenes de más de 10 años = 1 cubierto, niños de 4 a 10 = ½, menores de 4 no pagan. Se factura máx(mínimo, adultos + ½ niños). Si pagaron de más, queda a favor.
- Pagos en dólares: se anotan siempre en pesos (con una nota del tipo de cambio).
- IVA 21% opcional por evento, apagado por defecto; se registra con pagos de tipo IVA.
- No puede haber dos eventos el mismo día. Estados: reservado (rojo), pendiente con vencimiento (amarillo), cancelado (libera la fecha).
- Extras: catálogo con precio y costo. Al agregarlos a un evento se copian (se pueden editar para combos u obsequios). **El costo nunca se muestra en la impresión para el cliente.**
- Impresión del estado de cuenta: hoja en blanco con el logo, sin costos internos.

## Al hacer cambios
- Mantener todo sin dependencias ni paso de build.
- Probar la lógica en modo demo antes de subir. No romper los datos existentes en Firestore: los campos nuevos tienen que tener un valor por defecto.
- Commits chicos y con mensaje en español.

## Personal (mozos y camareras)
- Sección "Personal" del menú. Se guarda en la colección `config` (así no hay que cambiar las reglas de Firestore): `config/personal` → `{ lista: [{ id, nombre, rol, tel, activo, tipo }] }` y `config/turnos-AAAA-MM` → `{ dias: { 'AAAA-MM-DD': [ids que vienen] }, no: { 'AAAA-MM-DD': [ids que no pueden] } }`.
- `tipo`: `fijo` (por defecto, siempre en la grilla) o `refuerzo` (aparece en la grilla solo si está anotado esa semana; si no, en la lista de abajo). Cada casillero rota Sí → No puede → vacío. Solo "Sí" cuenta para convocados y días trabajados.
- Hoja para imprimir la semana: `#/personalhoja/AAAA-MM-DD` (lunes), en `HOJAS`.
- Cobros (privado): tarifas por categoría en `config/personal` → `tarifas: { salon, cocina, dj, iluminador, guardarropas, banos, limpieza }` (por jornada; `CATS_PAGO`). Cada persona cobra la de su categoría (según `rol`, ver `catDeRol`) + la de sus `tareasExtra`; si tiene `tarifa` propia, se usa esa (`porJornada`). El panel "Cobros" muestra la semana elegida (días con "Sí" × por jornada) con casilla "Pagado" en `config/turnos-AAAA-MM` (del lunes) → `pagadoSem: { lunes: { idPersona: fecha } }`, y abajo el total del mes. (El viejo `pagado` mensual ya no se usa.) Los montos arrancan ocultos (botón Mostrar, recordado en localStorage `sd-ver-cobros`). **Nunca mostrar la tarifa en la hoja impresa ni en "Copiar lista".**

## PDF de las hojas (estado de cuenta, hoja de servicio, timing, contrato)
- Cada hoja tiene dos botones: "Imprimir" (`imprimirHoja()`, que usa un iframe aparte porque Safari se traba) y "Descargar PDF" (`descargarPDF()`).
- El PDF se genera sin librerías (`hojaAPdf` + `MiniPDF`): copia la `.print-doc` con 800 px de ancho fuera de pantalla, mide cada palabra, fondo, borde e imagen, y lo dibuja en un A4 con Helvetica/Times. Es todo sincrónico, para que en el celular `navigator.share` abra el menú de compartir (Archivos, WhatsApp). En la compu, descarga.
- Estado de cuenta: por defecto NO muestra el saldo en pesos de los cubiertos ni el valor del cubierto de hoy (opción "Saldo en pesos"). Solo dice: "La semana del evento se abonan los últimos N cubiertos".
