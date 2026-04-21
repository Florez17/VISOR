# GEO-CEJA · Geovisor Municipal de La Ceja del Tambo
## Guía de Instalación y Configuración

---

## Estructura de archivos

```
geoceja/
├── index.html          ← Página principal
├── css/
│   └── style.css       ← Estilos de la interfaz
├── js/
│   ├── config.js       ← ⚙️  CONFIGURACIÓN (editar primero)
│   ├── layers.js       ← Definición de capas WMS
│   ├── map.js          ← Inicialización del mapa y mapas base
│   └── ui.js           ← Interacciones de la interfaz
└── img/                ← Thumbnails opcionales de mapas base
```

---

## Paso 1 – Configurar GeoServer

Edita el archivo `js/config.js` y cambia la URL de GeoServer:

```javascript
geoserver: {
  url: 'http://TU-SERVIDOR:8080/geoserver',   // ← cambia esto
  workspace: 'laceja',
  wmsVersion: '1.1.1'
}
```

**Ejemplos de URL:**
- Local:  `http://localhost:8080/geoserver`
- Red:    `http://192.168.1.100:8080/geoserver`
- Web:    `https://geo.laceja.gov.co/geoserver`

---

## Paso 2 – Publicar capas en GeoServer

Cada capa en `js/layers.js` tiene un campo `geoserverLayer` con el formato `workspace:nombre_capa`.

Para que funcionen, debes tener publicadas en GeoServer las capas correspondientes en el workspace `laceja` (o el que hayas configurado).

**Ejemplo:** la capa `suelo_urbano` espera encontrar en GeoServer:
```
http://TU-SERVIDOR:8080/geoserver/laceja/wms
  ?SERVICE=WMS&REQUEST=GetMap&LAYERS=laceja:suelo_urbano
```

---

## Paso 3 – Agregar nuevas capas

### En `js/layers.js`, agrega la configuración:

```javascript
mi_nueva_capa: {
  geoserverLayer: 'laceja:nombre_en_geoserver',
  label: 'Mi Nueva Capa',
  group: 'catastro',          // nombre del grupo existente
  defaultOpacity: 0.75,
  description: 'Descripción de la capa.',
  source: 'Fuente',
  updated: '2024',
  style: ''                   // nombre del estilo SLD (vacío = default)
}
```

### En `index.html`, dentro del grupo correspondiente, agrega:

```html
<div class="layer-item">
  <label class="layer-toggle">
    <input type="checkbox" class="layer-cb" data-layer="mi_nueva_capa" data-group="catastro" />
    <span class="layer-dot" style="background:#FF5733"></span>
    <span class="layer-name">Mi Nueva Capa</span>
  </label>
  <div class="layer-actions">
    <button class="layer-btn" onclick="openOpacityControl(this, 'mi_nueva_capa')"><i class="fa-solid fa-circle-half-stroke"></i></button>
    <button class="layer-btn" onclick="showLegend('mi_nueva_capa', 'Mi Nueva Capa')"><i class="fa-solid fa-list"></i></button>
    <button class="layer-btn info-btn" onclick="showLayerInfo('mi_nueva_capa')"><i class="fa-solid fa-info"></i></button>
  </div>
</div>
```

---

## Paso 4 – Agregar un nuevo grupo de capas

1. En `index.html`, copia uno de los bloques `<div class="layer-group">` y ajusta:
   - `id="group-TUGRUPO"`
   - `data-group="TUGRUPO"`
   - Nombre, ícono y color del grupo

2. Agrega el estilo del ícono en `css/style.css`:
```css
.migrupo-icon { background: rgba(255,87,51,.2); color: #FF5733; }
```

---

## Paso 5 – Despliegue

La aplicación es **100% estática** (HTML + CSS + JS). Puedes servirla con:

### Apache / Nginx
Copia la carpeta `geoceja/` al directorio web del servidor.

### Servidor Python (desarrollo local)
```bash
cd geoceja
python3 -m http.server 8000
# Abre: http://localhost:8000
```

### Servidor Node.js (npx)
```bash
cd geoceja
npx serve .
```

---

## Funcionalidades incluidas

| Función | Descripción |
|---|---|
| 🗺️ 8 Mapas base | OSM, Satélite, Topográfico, Oscuro, Claro, Terreno, Acuarela, Sin fondo |
| 🔲 4 Grupos de capas | Clasificación Suelo, Usos, Amenazas, Catastro |
| 👁️ Opacidad por capa | Control deslizante individual por capa |
| ℹ️ Panel de información | Metadatos de la capa + atributos al hacer clic |
| 📏 Medición | Distancia y área con doble clic para terminar |
| 🔍 Búsqueda | Por dirección o lugar (Nominatim/OSM, gratuito) |
| 📍 Mi ubicación | Geolocalización del navegador |
| 🖨️ Impresión | Optimizado para impresión del mapa |
| 📋 Leyenda WMS | GetLegendGraphic desde GeoServer |
| 🖥️ Pantalla completa | Control nativo de Leaflet |

---

## CORS en GeoServer

Si el visor y GeoServer están en dominios diferentes, debes habilitar CORS en GeoServer.

En `GEOSERVER_HOME/webapps/geoserver/WEB-INF/web.xml`, descomenta el filtro CORS y agrega tu dominio.

---

## Soporte

**Departamenot Administrativo de Planeación Municipal – Municipio de La Ceja del Tambo, Antioquia**

---
*GEO-CEJA v1.0 · Sistema de Información Geográfica Municipal*
