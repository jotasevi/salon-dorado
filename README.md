# Salón Dorado · App de gestión

App web para manejar el calendario, los clientes, los estados de cuenta (cubiertos con ajuste por IPC y extras), los egresos y las métricas del salón.
Funciona en la computadora y en el celular, y se puede instalar como una app.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `app.js`, `styles.css` | La app |
| `config.js` | **Acá van los datos de tu proyecto de Firebase** |
| `firestore.rules` | Reglas de seguridad: quiénes pueden entrar (poner los mails reales) |
| `firebase.json` | Configuración para publicar con Firebase Hosting |
| `logo.png`, `icon-*.png`, `manifest.json` | Logo e íconos para instalarla en el celular |

Si `config.js` no tiene los datos de Firebase, la app abre en **modo demostración**, con datos de ejemplo guardados solo en ese navegador.

## Puesta en marcha (una sola vez, unos 20 minutos)

### 1. Crear el proyecto en Firebase
1. Entrá a <https://console.firebase.google.com> con tu cuenta de Google y tocá **Crear proyecto** (por ejemplo, `salon-dorado`). Google Analytics no hace falta.
2. **Firestore Database** → *Crear base de datos* → modo **producción** → ubicación `southamerica-east1 (São Paulo)`.
3. **Authentication** → *Comenzar* → **Correo electrónico/contraseña** → Habilitar.
   En la pestaña **Usuarios** → *Agregar usuario*: creá uno para vos y otro para tu papá (mail y clave).

### 2. Conectar la app
1. En Firebase: ⚙️ **Configuración del proyecto** → *Tus apps* → ícono **`</>`** (Web) → poné un nombre y registrá la app.
2. Firebase te muestra un bloque `firebaseConfig = { apiKey: ..., ... }`. Copiá esos valores en `config.js`, en lugar de `firebase: null`.
   (Esos datos no son secretos: lo que protege la información son las reglas del paso 3.)

### 3. Reglas de seguridad
1. Abrí `firestore.rules` y reemplazá `juan@ejemplo.com` y `papa@ejemplo.com` por los dos mails del paso 1.
2. En Firebase: **Firestore Database** → pestaña **Reglas** → pegá el contenido del archivo → **Publicar**.

### 4. Publicar la app (elegí una opción)

**Opción A · Firebase Hosting (recomendada)**: necesita Node.js instalado en la computadora.
```bash
npm install -g firebase-tools
firebase login
cd carpeta-de-la-app
firebase deploy --project ID-DE-TU-PROYECTO
```
Queda publicada en `https://ID-DE-TU-PROYECTO.web.app`. Este comando también publica las reglas de seguridad.

**Opción B · GitHub Pages**: subí todos los archivos a un repositorio de GitHub → *Settings* → *Pages* → *Deploy from branch* (`main`, carpeta raíz).
Después, en Firebase → **Authentication** → *Configuración* → **Dominios autorizados**, agregá `tu-usuario.github.io`.

### 5. Instalarla en el celular
Abrí la dirección de la app en el celular:
- **iPhone (Safari):** Compartir → *Agregar a pantalla de inicio*.
- **Android (Chrome):** menú ⋮ → *Instalar app* (o *Agregar a pantalla principal*).

## Uso diario: lo principal

- **Calendario:** rojo = reservado, amarillo = pendiente (con fecha de vencimiento), verde = disponible (viernes, sábados, domingos y feriados). Tocás un día libre para cargar un evento, o un día ocupado para abrir la ficha.
- **Índices IPC:** cargás el % de cada mes cuando se publica. El IPC de octubre ajusta el valor de noviembre, y así.
- **Ficha del evento → Cubiertos:**
  - *Condiciones:* valor del cubierto, meses sin ajuste, mínimo, cubiertos que se dejan para la semana del evento, IVA.
  - *Registrar pago:* calcula cuántos cubiertos se cancelan y congela ese valor. Lo que sobra queda como saldo a favor en pesos y se suma al pago siguiente.
  - *Cuadro mes a mes:* destildás un mes para no ajustarlo (ese índice se pierde), o escribís otro % solo para ese cliente.
  - *Número final:* adultos + niños de 4 a 10 años (medio cubierto) + menores de 4 (no pagan). Siempre respeta el mínimo de cubiertos enteros.
- **Extras:** se eligen del catálogo y se puede cambiar el precio en cada evento (combos, obsequios). El costo es interno y no sale en la impresión.
- **Imprimir estado de cuenta:** hoja en blanco con el logo y sin costos internos.
- **Excel:** desde *Eventos*, *Clientes* o *Configuración*, con una columna para cada dato, lista para campañas por WhatsApp.
- **Respaldo:** en *Configuración* → *Descargar respaldo completo*. Conviene hacerlo una vez por mes.
