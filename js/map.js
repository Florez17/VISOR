/**
 * GEO-CEJA · Inicialización del mapa y mapas base
 */

// ── Definición de mapas base disponibles ──────────────────────────
const BASEMAPS = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }),

  satellite: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  }),

  topo: L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri, HERE, Garmin, FAO, NOAA, USGS',
    maxZoom: 19
  }),

  dark: L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB',
    subdomains: 'abcd',
    maxZoom: 20
  }),

  light: L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© CartoDB',
    subdomains: 'abcd',
    maxZoom: 20
  }),

  terrain: L.tileLayer(
    'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {
    attribution: '© Stamen Design',
    subdomains: 'abcd',
    maxZoom: 18
  }),

  watercolor: L.tileLayer(
    'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg', {
    attribution: '© Stamen Design',
    subdomains: 'abcd',
    maxZoom: 16
  }),

  none: L.tileLayer('', { attribution: '' })
};

let currentBasemap = 'osm';
let map;

// ── Inicializar mapa ───────────────────────────────────────────────
function initMap() {
  map = L.map('map', {
  center:    GEOCEJA_CONFIG.map.center,
  zoom:      GEOCEJA_CONFIG.map.zoom,
  minZoom:   GEOCEJA_CONFIG.map.minZoom,
  maxZoom:   GEOCEJA_CONFIG.map.maxZoom,
  zoomControl: false,
  zoomSnap:  0.25,   // el mapa se "engancha" cada 0.25 niveles
  zoomDelta: 0.5,    // cada clic en +/- avanza 0.5 niveles
  wheelPxPerZoomLevel: 120  // rueda del mouse más suave
  });

  // Controles
  L.control.zoom({ position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

  // Pantalla completa
  if (typeof L.control.fullscreen === 'function') {
    L.control.fullscreen({ position: 'topright' }).addTo(map);
  }

  // Mapa base inicial
  BASEMAPS.osm.addTo(map);

  // Eventos del mapa
  map.on('mousemove', onMouseMove);
  map.on('click', onMapClick);

  // Thumbnails dinámicos para los mapas base
  generateBasemapThumbs();
}

// ── Actualizar coordenadas en header ──────────────────────────────
function onMouseMove(e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);
  document.getElementById('coordText').textContent = `${lat}, ${lng}`;
}

// ── Click en el mapa: consultar WMS ───────────────────────────────
function onMapClick(e) {
  const activeLayers = Object.keys(WMS_LAYERS);
  if (activeLayers.length === 0) return;

  // Consultar la primera capa activa con GetFeatureInfo
  const layerKey = activeLayers[0];
  const wmsLayer = WMS_LAYERS[layerKey];
  const cfg = LAYERS_CONFIG[layerKey];
  if (!wmsLayer || !cfg) return;

  const size = map.getSize();
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const params = {
    service:      'WMS',
    version:      GEOCEJA_CONFIG.geoserver.wmsVersion,
    request:      'GetFeatureInfo',
    layers:       cfg.geoserverLayer,
    query_layers: cfg.geoserverLayer,
    bbox:         `${sw.lng},${sw.lat},${ne.lng},${ne.lat}`,
    width:        size.x,
    height:       size.y,
    srs:          'EPSG:4326',
    info_format:  'application/json',
    x:            Math.round(map.latLngToContainerPoint(e.latlng).x),
    y:            Math.round(map.latLngToContainerPoint(e.latlng).y),
    feature_count: 5
  };

  const url = `${GEOCEJA_CONFIG.geoserver.url}/wms?` + new URLSearchParams(params).toString();

  fetch(url)
    .then(r => r.json())
    .then(data => {
      if (data.features && data.features.length > 0) {
        showFeatureInfo(data.features[0], cfg.label, e.latlng);
      } else {
        showToast('Sin información en ese punto para la capa activa.');
      }
    })
    .catch(() => {
      showToast('No se pudo conectar con GeoServer. Verifica la configuración.');
    });
}

// ── Mostrar popup con información del feature ─────────────────────
function showFeatureInfo(feature, layerLabel, latlng) {
  const props = feature.properties || {};
  let html = `<div style="font-family:'Montserrat',sans-serif;min-width:200px;">
    <div style="font-size:.75rem;font-weight:700;color:#C8A84B;margin-bottom:8px;border-bottom:1px solid #2A3544;padding-bottom:5px;">
      ${layerLabel}
    </div>
    <table style="width:100%;border-collapse:collapse;">`;

  const keys = Object.keys(props);
  if (keys.length === 0) {
    html += '<tr><td style="color:#8A9BB0;font-size:.72rem;padding:4px;">Sin atributos disponibles.</td></tr>';
  } else {
    keys.forEach(k => {
      if (props[k] !== null && props[k] !== undefined && props[k] !== '') {
        html += `<tr>
          <td style="color:#8A9BB0;font-size:.68rem;padding:4px 6px 4px 0;font-weight:700;white-space:nowrap;">${k}</td>
          <td style="color:#E8EDF2;font-size:.68rem;padding:4px 0;">${props[k]}</td>
        </tr>`;
      }
    });
  }

  html += '</table></div>';

  L.popup({ maxWidth: 340 })
    .setLatLng(latlng)
    .setContent(html)
    .openOn(map);

  // Actualizar panel lateral de info
  updateLayerInfoPanel(props, layerLabel);
}

// ── Actualizar panel de info lateral ─────────────────────────────
function updateLayerInfoPanel(props, layerLabel) {
  const panel = document.getElementById('layerInfoContent');
  const keys = Object.keys(props);

  if (keys.length === 0) {
    panel.innerHTML = `<p style="color:var(--clr-text-muted);font-size:.72rem;padding:8px;">Sin atributos para esta selección.</p>`;
    return;
  }

  let rows = keys
    .filter(k => props[k] !== null && props[k] !== '')
    .map(k => `<tr><td>${k}</td><td>${props[k]}</td></tr>`)
    .join('');

  panel.innerHTML = `
    <div style="font-size:.68rem;color:var(--clr-accent);font-weight:700;margin-bottom:8px;">${layerLabel}</div>
    <table class="info-table">${rows}</table>`;
}

// ── Cambiar mapa base ─────────────────────────────────────────────
function changeBasemap(key) {
  if (!BASEMAPS[key]) return;
  if (currentBasemap && BASEMAPS[currentBasemap]) {
    map.removeLayer(BASEMAPS[currentBasemap]);
  }
  if (key !== 'none') BASEMAPS[key].addTo(map);

  // Asegura que los WMS estén por encima del basemap
  Object.values(WMS_LAYERS).forEach(l => l.bringToFront && l.bringToFront());

  currentBasemap = key;

  // UI: marcar activo
  document.querySelectorAll('.basemap-thumb').forEach(el => {
    el.classList.toggle('active', el.dataset.basemap === key);
  });
  showToast(`Mapa base: ${document.querySelector(`[data-basemap="${key}"] span`)?.textContent || key}`);
}

// ── Generar thumbnails de mapas base usando tiles reales ──────────
function generateBasemapThumbs() {
  // Los thumbnails usan imágenes de fallback en CSS; no es necesario
  // cargarlos aquí salvo si se quiere precalentar la caché.
}

// ── Añadir / quitar capa WMS en el mapa ──────────────────────────
function toggleWMSLayer(layerKey, visible, opacity) {
  const cfg = LAYERS_CONFIG[layerKey];
  if (!cfg) return;

  if (visible) {
    if (WMS_LAYERS[layerKey]) {
      WMS_LAYERS[layerKey].setOpacity(opacity !== undefined ? opacity : cfg.defaultOpacity);
      map.addLayer(WMS_LAYERS[layerKey]);
      return;
    }

    const wmsParams = {
      layers:      cfg.geoserverLayer,
      format:      GEOCEJA_CONFIG.wmsDefaults.format,
      transparent: GEOCEJA_CONFIG.wmsDefaults.transparent,
      version:     GEOCEJA_CONFIG.geoserver.wmsVersion,
      attribution: GEOCEJA_CONFIG.wmsDefaults.attribution,
      opacity:     opacity !== undefined ? opacity : cfg.defaultOpacity
    };
    if (cfg.style) wmsParams.styles = cfg.style;

    const wmsUrl = `${GEOCEJA_CONFIG.geoserver.url}/wms`;
    WMS_LAYERS[layerKey] = L.tileLayer.wms(wmsUrl, wmsParams);
    WMS_LAYERS[layerKey].addTo(map);

  } else {
    if (WMS_LAYERS[layerKey] && map.hasLayer(WMS_LAYERS[layerKey])) {
      map.removeLayer(WMS_LAYERS[layerKey]);
    }
  }
}

// ── Inicializar ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initMap);
