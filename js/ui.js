/**
 * GEO-CEJA · Interacciones de Interfaz de Usuario
 */

// ══════════════════════════════════════════════════════════════════
// SIDEBAR TOGGLE
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const toggleIcon = document.getElementById('toggleIcon');

  toggleBtn.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    toggleIcon.className = collapsed
      ? 'fa-solid fa-chevron-right'
      : 'fa-solid fa-chevron-left';
    // Notificar al mapa para que recalcule su tamaño
    setTimeout(() => { if (window.map) map.invalidateSize(); }, 320);
  });

  // ── Grupos de capas: colapsar / expandir ──────────────────────
  document.querySelectorAll('.group-header').forEach(header => {
    header.addEventListener('click', e => {
      // No procesar si el clic fue en el toggle switch
      if (e.target.closest('.switch-master')) return;

      const group = header.dataset.group;
      const layersDiv = document.getElementById(`layers-${group}`);
      const chevron = header.querySelector('.group-chevron');

      const isOpen = layersDiv.style.display !== 'none';
      layersDiv.style.display = isOpen ? 'none' : 'block';
      chevron.classList.toggle('open', !isOpen);
    });
  });

  // Abrir grupos que ya tienen el checkbox marcado
  document.querySelectorAll('.group-master-toggle').forEach(toggle => {
    const group = toggle.dataset.group;
    const layersDiv = document.getElementById(`layers-${group}`);
    const chevron = document.querySelector(`[data-group="${group}"] .group-chevron`);
    if (toggle.checked && layersDiv) {
      layersDiv.style.display = 'block';
      chevron && chevron.classList.add('open');
    }
  });

  // ── Master toggle por grupo ───────────────────────────────────
  // ── Master toggle por grupo ───────────────────────────────────
document.querySelectorAll('.group-master-toggle').forEach(masterToggle => {
  masterToggle.addEventListener('change', () => {
    const group = masterToggle.dataset.group;
    const checked = masterToggle.checked;
    const cbs = document.querySelectorAll(`.layer-cb[data-group="${group}"]`);

    if (checked) {
      // ENCENDER: dejar que cada capa dispare su propio listener normalmente
      cbs.forEach(cb => {
        cb.checked = true;
        cb.dispatchEvent(new Event('change'));
      });
      showToast(`Grupo activado.`);

    } else {
      // APAGAR: saltarse el bloqueo y apagar capas directamente
      cbs.forEach(cb => {
        cb.checked = false;

        // Apagar la capa WMS del mapa
        const layerKey = cb.dataset.layer;
        if (window.map) toggleWMSLayer(layerKey, false);

        // Apagar el dot visualmente
        const dot = cb.nextElementSibling;
        if (dot) dot.style.opacity = '.35';
      });
      showToast(`Grupo desactivado.`);
    }
  });
});

  // ── Toggle individual de capa ─────────────────────────────────
  // ── Toggle individual de capa ─────────────────────────────────
document.querySelectorAll('.layer-cb').forEach(cb => {
  cb.addEventListener('change', () => {

    // 🔒 BLOQUEO: verificar que el grupo esté activo primero
    const group = cb.dataset.group;
    const masterToggle = document.querySelector(`.group-master-toggle[data-group="${group}"]`);
    if (masterToggle && !masterToggle.checked) {
      cb.checked = false; // revertir el clic del usuario
      showToast('⚠️ Activa primero el grupo de capas con el interruptor.');
      return; // salir sin hacer nada más
    }

    const layerKey = cb.dataset.layer;
    const cfg = LAYERS_CONFIG[layerKey];
    if (!cfg) return;

    if (!window.map) return;  // mapa aún no inicializado

    const currentOpacity = layerOpacities[layerKey] !== undefined
      ? layerOpacities[layerKey]
      : cfg.defaultOpacity;

    toggleWMSLayer(layerKey, cb.checked, currentOpacity);

    // Actualizar estilo del dot
    const dot = cb.nextElementSibling;
    if (dot) dot.style.opacity = cb.checked ? '1' : '.35';
  });
});

  // ── Basemap switcher ──────────────────────────────────────────
  document.querySelectorAll('.basemap-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      changeBasemap(thumb.dataset.basemap);
    });
  });

  // ── Botón Ayuda ───────────────────────────────────────────────
  document.getElementById('btnHelp').addEventListener('click', () => {
    openModal('modalHelp');
  });

  // ── Herramientas ──────────────────────────────────────────────
  document.getElementById('btnLocate').addEventListener('click', locateUser);
  document.getElementById('btnPrint').addEventListener('click', printMap);
  document.getElementById('btnMeasureDist').addEventListener('click', () => startMeasure('distance'));
  document.getElementById('btnMeasureArea').addEventListener('click', () => startMeasure('area'));

  // ── Búsqueda ──────────────────────────────────────────────────
  document.getElementById('searchBtn').addEventListener('click', doSearch);
  document.getElementById('searchInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') doSearch();
  });

});

// ══════════════════════════════════════════════════════════════════
// OPACIDAD
// ══════════════════════════════════════════════════════════════════
const layerOpacities = {};
let currentOpacityLayer = null;

function openOpacityControl(btn, layerKey) {
  const cfg = LAYERS_CONFIG[layerKey];
  if (!cfg) return;

  currentOpacityLayer = layerKey;
  const ctrl = document.getElementById('opacityControl');
  const slider = document.getElementById('opacitySlider');
  const valueEl = document.getElementById('opacityValue');
  const nameEl  = document.getElementById('opacityLayerName');

  const currentVal = Math.round((layerOpacities[layerKey] !== undefined
    ? layerOpacities[layerKey]
    : cfg.defaultOpacity) * 100);

  slider.value = currentVal;
  valueEl.textContent = `${currentVal}%`;
  nameEl.textContent = cfg.label;
  ctrl.style.display = 'block';

  slider.oninput = () => {
    const val = parseInt(slider.value) / 100;
    layerOpacities[layerKey] = val;
    valueEl.textContent = `${slider.value}%`;
    if (WMS_LAYERS[layerKey]) {
      WMS_LAYERS[layerKey].setOpacity(val);
    }
  };
}

function closeOpacityControl() {
  document.getElementById('opacityControl').style.display = 'none';
  currentOpacityLayer = null;
}

// ══════════════════════════════════════════════════════════════════
// LEYENDA WMS
// ══════════════════════════════════════════════════════════════════
function showLegend(layerKey, layerLabel) {
  const cfg = LAYERS_CONFIG[layerKey];
  const body = document.getElementById('legendBody');
  document.getElementById('legendTitle').textContent = layerLabel;

  if (!cfg) {
    body.innerHTML = '<p style="color:var(--clr-text-muted);font-size:.8rem;padding:10px;">Capa no configurada.</p>';
    openModal('modalLegend');
    return;
  }

  // Mostrar primero los metadatos mientras carga la imagen
  body.innerHTML = `
    <div class="legend-meta">
      <p class="legend-desc">${cfg.description}</p>
      <table class="info-table" style="margin-top:10px;">
        <tr><td>Fuente</td><td>${cfg.source}</td></tr>
        <tr><td>Actualización</td><td>${cfg.updated}</td></tr>
      </table>
    </div>
    <div class="legend-symbol-title">Simbología</div>
    <div id="legendImgWrapper">
      <div class="legend-loading">
        <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando simbología desde GeoServer…
      </div>
    </div>`;

  openModal('modalLegend');

  // Cargar la imagen de simbología de GeoServer
  const params = new URLSearchParams({
    service:        'WMS',
    version:        GEOCEJA_CONFIG.geoserver.wmsVersion,
    request:        'GetLegendGraphic',
    layer:          cfg.geoserverLayer,
    format:         'image/png',
    legend_options: 'fontName:Montserrat;fontSize:11;fontAntiAliasing:true;forceLabels:on'
  });
  if (cfg.style) params.append('style', cfg.style);

  const url = `${GEOCEJA_CONFIG.geoserver.url}/wms?${params.toString()}`;
  const wrapper = document.getElementById('legendImgWrapper');
  const img = new Image();

  img.onload = () => {
    wrapper.innerHTML = `<img src="${url}" alt="Simbología ${layerLabel}" class="legend-img" />`;
  };
  img.onerror = () => {
    wrapper.innerHTML = `
      <div class="legend-img-error">
        <i class="fa-solid fa-circle-exclamation" style="font-size:1.2rem;color:var(--clr-warn);display:block;margin-bottom:6px;"></i>
        Simbología no disponible en GeoServer.<br>
        <span style="font-size:.68rem;color:var(--clr-text-muted);">Capa: <em>${cfg.geoserverLayer}</em></span>
      </div>`;
  };
  img.src = url;
}

// ══════════════════════════════════════════════════════════════════
// INFORMACIÓN DE CAPA (botón i)
// ══════════════════════════════════════════════════════════════════
function showLayerInfo(layerKey) {
  const cfg = LAYERS_CONFIG[layerKey];
  const panel = document.getElementById('layerInfoContent');

  if (!cfg) {
    panel.innerHTML = '<p style="color:var(--clr-text-muted);font-size:.72rem;padding:8px;">Información no disponible.</p>';
    return;
  }

  panel.innerHTML = `
    <div style="padding:4px 0;">
      <div style="font-size:.72rem;font-weight:700;color:var(--clr-accent);margin-bottom:10px;">${cfg.label}</div>
      <p style="font-size:.72rem;color:var(--clr-text);line-height:1.6;margin-bottom:10px;">${cfg.description}</p>
      <table class="info-table">
        <tr><td>Fuente</td><td>${cfg.source}</td></tr>
        <tr><td>Actualización</td><td>${cfg.updated}</td></tr>
      </table>
      <p style="font-size:.65rem;color:var(--clr-text-muted);margin-top:10px;">
        <i class="fa-solid fa-hand-pointer"></i> Haz clic sobre el mapa con esta capa activa para consultar sus atributos.
      </p>
    </div>`;

  // Scroll al panel
  document.getElementById('layerInfoPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ══════════════════════════════════════════════════════════════════
// MODALES
// ══════════════════════════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
// Cerrar al clic fuera
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ══════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════
let toastTimer;
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ══════════════════════════════════════════════════════════════════
// HERRAMIENTAS
// ══════════════════════════════════════════════════════════════════

// ── Localización del usuario ──────────────────────────────────────
function locateUser() {
  if (!navigator.geolocation) {
    showToast('La geolocalización no está disponible en tu navegador.');
    return;
  }
  showToast('Obteniendo tu ubicación…');
  navigator.geolocation.getCurrentPosition(pos => {
    const latlng = [pos.coords.latitude, pos.coords.longitude];
    map.setView(latlng, 16);
    L.marker(latlng)
      .addTo(map)
      .bindPopup('<b><i class="fa-solid fa-location-dot"></i> Mi ubicación</b>')
      .openPopup();
    showToast('Ubicación encontrada.');
  }, () => {
    showToast('No se pudo obtener la ubicación. Verifica los permisos.');
  });
}

// ── Impresión del mapa ────────────────────────────────────────────
function printMap() {
  showToast('Preparando impresión…');
  setTimeout(() => window.print(), 800);
}

// ── Medición (distancia / área) ───────────────────────────────────
let measureMode = null;
let measurePoints = [];
let measureLines = [];
let measurePolyline = null;
let measurePolygon = null;
const measureTooltips = [];

function startMeasure(mode) {
  stopMeasure();
  measureMode = mode;

  const btn = mode === 'distance'
    ? document.getElementById('btnMeasureDist')
    : document.getElementById('btnMeasureArea');
  btn.classList.add('active');

  map.getContainer().style.cursor = 'crosshair';
  showToast(mode === 'distance'
    ? 'Haz clic para trazar puntos. Doble clic para terminar.'
    : 'Haz clic para dibujar el polígono. Doble clic para terminar.');

  map.on('click', onMeasureClick);
  map.on('dblclick', onMeasureDoubleClick);
}

function stopMeasure() {
  map.off('click', onMeasureClick);
  map.off('dblclick', onMeasureDoubleClick);
  map.getContainer().style.cursor = '';
  if (measurePolyline) { map.removeLayer(measurePolyline); measurePolyline = null; }
  if (measurePolygon)  { map.removeLayer(measurePolygon);  measurePolygon  = null; }
  measureLines.forEach(l => map.removeLayer(l));
  measureTooltips.forEach(t => map.removeLayer(t));
  measureLines   = [];
  measurePoints  = [];
  measureMode    = null;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
}

function onMeasureClick(e) {
  measurePoints.push(e.latlng);
  if (measurePoints.length > 1) {
    if (measurePolyline) map.removeLayer(measurePolyline);
    measurePolyline = L.polyline(measurePoints, { color: '#C8A84B', weight: 2, dashArray: '6,4' }).addTo(map);
    if (measureMode === 'area' && measurePoints.length > 2) {
      if (measurePolygon) map.removeLayer(measurePolygon);
      measurePolygon = L.polygon(measurePoints, { color: '#C8A84B', fillColor: '#C8A84B', fillOpacity: .15, weight: 1 }).addTo(map);
    }
  }
  // Marcador de punto
  const m = L.circleMarker(e.latlng, { radius: 4, color: '#C8A84B', fillColor: '#C8A84B', fillOpacity: 1 }).addTo(map);
  measureLines.push(m);
}

function onMeasureDoubleClick(e) {
  measurePoints.push(e.latlng);
  let result;
  if (measureMode === 'distance') {
    let totalMeters = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      totalMeters += measurePoints[i - 1].distanceTo(measurePoints[i]);
    }
    result = totalMeters >= 1000
      ? `${(totalMeters / 1000).toFixed(3)} km`
      : `${totalMeters.toFixed(1)} m`;
    showToast(`📏 Distancia total: ${result}`, 6000);
  } else {
    const areaM2 = calculateArea(measurePoints);
    result = areaM2 >= 10000
      ? `${(areaM2 / 10000).toFixed(3)} ha`
      : `${areaM2.toFixed(1)} m²`;
    showToast(`📐 Área total: ${result}`, 6000);
  }
  stopMeasure();
}

function calculateArea(points) {
  // Shoelace formula (aproximada en lat/lng)
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = points[i].lng * Math.PI / 180;
    const yi = points[i].lat * Math.PI / 180;
    const xj = points[j].lng * Math.PI / 180;
    const yj = points[j].lat * Math.PI / 180;
    area += (xj - xi) * (2 + Math.sin(yi) + Math.sin(yj));
  }
  return Math.abs(area * 6371000 * 6371000 / 2);
}

// ══════════════════════════════════════════════════════════════════
// BÚSQUEDA POR DIRECCIÓN (Nominatim)
// ══════════════════════════════════════════════════════════════════
function doSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  showToast('Buscando…');

  const params = new URLSearchParams({
    q:            `${query}, La Ceja, Antioquia, Colombia`,
    format:       'json',
    limit:        1,
    countrycodes: GEOCEJA_CONFIG.nominatim.countrycodes,
    addressdetails: 1
  });

  fetch(`${GEOCEJA_CONFIG.nominatim.url}?${params.toString()}`, {
    headers: { 'Accept-Language': 'es' }
  })
  .then(r => r.json())
  .then(data => {
    if (!data || data.length === 0) {
      showToast('No se encontraron resultados. Intenta con otro término.');
      return;
    }
    const item = data[0];
    const latlng = [parseFloat(item.lat), parseFloat(item.lon)];
    map.setView(latlng, 16);

    L.marker(latlng)
      .addTo(map)
      .bindPopup(`<b>${item.display_name}</b>`)
      .openPopup();

    document.getElementById('searchInput').value = '';
    showToast(`📍 ${item.display_name.split(',')[0]}`);
  })
  .catch(() => {
    showToast('Error al realizar la búsqueda. Verifica la conexión a internet.');
  });
}

// ══════════════════════════════════════════════════════════════════
// ESTILOS DE IMPRESIÓN (inyectados dinámicamente)
// ══════════════════════════════════════════════════════════════════
const printStyle = document.createElement('style');
printStyle.textContent = `
@media print {
  .app-header, .sidebar, .basemap-switcher, .opacity-control, .toast { display: none !important; }
  .app-body { top: 0 !important; }
  #map { position: fixed; inset: 0; width: 100vw; height: 100vh; }
}`;
document.head.appendChild(printStyle);
