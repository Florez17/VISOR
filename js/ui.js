/**
 * GEO-CEJA · Interacciones de Interfaz de Usuario
 */

// ══════════════════════════════════════════════════════════════════
// SIDEBAR TOGGLE
// ══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  const sidebar     = document.getElementById('sidebar');
  const toggleBtn   = document.getElementById('sidebarToggle');
  const toggleIcon  = document.getElementById('toggleIcon');

  toggleBtn.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('collapsed');
    toggleIcon.className = collapsed
      ? 'fa-solid fa-chevron-right'
      : 'fa-solid fa-chevron-left';
    setTimeout(() => { if (window.map) map.invalidateSize(); }, 320);
  });

  // ── Grupos de capas: colapsar / expandir ──────────────────────
  document.querySelectorAll('.group-header').forEach(header => {
    header.addEventListener('click', e => {
      if (e.target.closest('.switch-master')) return;
      const group     = header.dataset.group;
      const layersDiv = document.getElementById(`layers-${group}`);
      const chevron   = header.querySelector('.group-chevron');
      const isOpen    = layersDiv.style.display !== 'none';
      layersDiv.style.display = isOpen ? 'none' : 'block';
      chevron && chevron.classList.toggle('open', !isOpen);
    });
  });

  // Abrir grupos que ya tienen el checkbox marcado
  document.querySelectorAll('.group-master-toggle').forEach(toggle => {
    const group     = toggle.dataset.group;
    const layersDiv = document.getElementById(`layers-${group}`);
    const chevron   = document.querySelector(`[data-group="${group}"] .group-chevron`);
    if (toggle.checked && layersDiv) {
      layersDiv.style.display = 'block';
      chevron && chevron.classList.add('open');
    }
  });

  // ── Master toggle por grupo ───────────────────────────────────
  document.querySelectorAll('.group-master-toggle').forEach(masterToggle => {
    masterToggle.addEventListener('change', () => {
      const group   = masterToggle.dataset.group;
      const checked = masterToggle.checked;
      document.querySelectorAll(`.layer-cb[data-group="${group}"]`).forEach(cb => {
        cb.checked = checked;
        cb.dispatchEvent(new Event('change'));
      });
    });
  });

  // ── Toggle individual de capa ─────────────────────────────────
  document.querySelectorAll('.layer-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const layerKey = cb.dataset.layer;
      const cfg      = LAYERS_CONFIG[layerKey];
      if (!cfg || !window.map) return;

      const currentOpacity = layerOpacities[layerKey] !== undefined
        ? layerOpacities[layerKey]
        : cfg.defaultOpacity;

      toggleWMSLayer(layerKey, cb.checked, currentOpacity);

      const dot = cb.nextElementSibling;
      if (dot) dot.style.opacity = cb.checked ? '1' : '.35';
    });
  });

  // ── Basemap switcher ──────────────────────────────────────────
  document.querySelectorAll('.basemap-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => changeBasemap(thumb.dataset.basemap));
  });

  // ── Botón Ayuda ───────────────────────────────────────────────
  const btnHelp = document.getElementById('btnHelp');
  if (btnHelp) btnHelp.addEventListener('click', () => openModal('modalHelp'));

  // ── Herramientas ──────────────────────────────────────────────
  const btnLocate = document.getElementById('btnLocate');
  const btnPrint  = document.getElementById('btnPrint');

  if (btnLocate) btnLocate.addEventListener('click', locateUser);
  if (btnPrint)  btnPrint.addEventListener('click', printMap);

  // btnMeasureDist y btnMeasureArea desactivados — no se agregan listeners

  // ── Búsqueda ──────────────────────────────────────────────────
  const searchBtn   = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  if (searchBtn)   searchBtn.addEventListener('click', doSearch);
  if (searchInput) searchInput.addEventListener('keypress', e => {
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
  const ctrl    = document.getElementById('opacityControl');
  const slider  = document.getElementById('opacitySlider');
  const valueEl = document.getElementById('opacityValue');
  const nameEl  = document.getElementById('opacityLayerName');

  const currentVal = Math.round((layerOpacities[layerKey] !== undefined
    ? layerOpacities[layerKey]
    : cfg.defaultOpacity) * 100);

  slider.value        = currentVal;
  valueEl.textContent = `${currentVal}%`;
  nameEl.textContent  = cfg.label;
  ctrl.style.display  = 'block';

  slider.oninput = () => {
    const val = parseInt(slider.value) / 100;
    layerOpacities[layerKey] = val;
    valueEl.textContent = `${slider.value}%`;
    if (WMS_LAYERS[layerKey]) WMS_LAYERS[layerKey].setOpacity(val);
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
  const cfg  = LAYERS_CONFIG[layerKey];
  const body = document.getElementById('legendBody');
  document.getElementById('legendTitle').textContent = layerLabel;

  if (!cfg) {
    body.innerHTML = '<p style="color:var(--clr-text-muted);font-size:.8rem;padding:10px;">Capa no configurada.</p>';
    openModal('modalLegend');
    return;
  }

  body.innerHTML = '<div class="legend-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Cargando leyenda desde GeoServer…</div>';
  openModal('modalLegend');

  const params = new URLSearchParams({
    service:         'WMS',
    version:         GEOCEJA_CONFIG.geoserver.wmsVersion,
    request:         'GetLegendGraphic',
    layer:           cfg.geoserverLayer,
    format:          'image/png',
    legend_options:  'fontName:Montserrat;fontSize:11;fontAntiAliasing:true;forceLabels:on'
  });
  if (cfg.style) params.append('style', cfg.style);

  const url = `${GEOCEJA_CONFIG.geoserver.url}/wms?${params.toString()}`;
  const img = new Image();
  img.onload  = () => { body.innerHTML = `<img src="${url}" alt="Leyenda ${layerLabel}" class="legend-img" />`; };
  img.onerror = () => {
    body.innerHTML = `
      <div class="legend-img-error">
        <i class="fa-solid fa-circle-exclamation" style="font-size:1.5rem;color:var(--clr-warn);display:block;margin-bottom:8px;"></i>
        <strong>No se pudo cargar la leyenda.</strong><br>
        <span style="font-size:.7rem;color:var(--clr-text-muted);">
          Verifica que GeoServer esté disponible y que la capa <em>${cfg.geoserverLayer}</em> esté publicada.
        </span>
      </div>`;
  };
  img.src = url;
}

// ══════════════════════════════════════════════════════════════════
// INFORMACIÓN DE CAPA (botón i)
// ══════════════════════════════════════════════════════════════════
function showLayerInfo(layerKey) {
  const cfg   = LAYERS_CONFIG[layerKey];
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

// ══════════════════════════════════════════════════════════════════
// IMPRESIÓN CON LAYOUT INSTITUCIONAL
// ══════════════════════════════════════════════════════════════════
function printMap() {
  showToast('Preparando layout de impresión…');

  const center = map.getCenter();
  const scale  = getMapScale();
  const fecha  = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── Construir leyenda dinámica desde el sidebar ──────────────
  let leyendaHtml = '';

  document.querySelectorAll('.layer-cb:checked').forEach(cb => {
    const layerKey  = cb.dataset.layer;
    const cfg       = LAYERS_CONFIG[layerKey];
    if (!cfg) return;

    // Nombre del grupo al que pertenece la capa
    const groupEl   = document.getElementById(`group-${cb.dataset.group}`);
    const groupName = groupEl
      ? groupEl.querySelector('.group-name')?.textContent
      : cfg.group;

    // Color del dot de la capa
    const dot       = cb.nextElementSibling;
    const dotColor  = dot ? dot.style.background : '#888';

    // Verificar si tiene leyenda estática (.static-legend) en su grupo
    const staticLegend = document.querySelector(
      `#layers-${cb.dataset.group} .static-legend`
    );

    leyendaHtml += `
      <div class="pl-group">
        <div class="pl-group-name">
          <span class="pl-dot" style="background:${dotColor};"></span>
          ${cfg.label}
        </div>`;

    if (staticLegend) {
      // Copiar los ítems de la leyenda estática
      staticLegend.querySelectorAll('.legend-item').forEach(item => {
        const swatch = item.querySelector('.legend-swatch');
        const color  = swatch ? swatch.style.background : '#888';
        const text   = item.textContent.trim();
        leyendaHtml += `
          <div class="pl-item">
            <span class="pl-swatch" style="background:${color};"></span>
            <span>${text}</span>
          </div>`;
      });
    }

    leyendaHtml += `</div>`;
  });

  if (!leyendaHtml) {
    leyendaHtml = '<div class="pl-empty">Sin capas activas</div>';
  }

  // ── Crear overlay ─────────────────────────────────────────────
  const overlay  = document.createElement('div');
  overlay.id     = 'print-overlay';

  overlay.innerHTML = `
    <div class="po-header">
      <div class="po-logo">
      <img src="logo.png" alt="Logo" style="width:24px;height:24px;object-fit:contain;" />
      </div>
      <div class="po-titles">
        <div class="po-main">GEO-CEJA</div>
        <div class="po-sub">GEOVISOR MUNICIPAL · MUNICIPIO DE LA CEJA DEL TAMBO · ANTIOQUIA</div>
      </div>
      <div class="po-meta">
        <div><b>Fecha:</b> ${fecha}</div>
        <div><b>Zoom:</b> Nivel ${map.getZoom()}</div>
        <div><b>Dependencia:</b> Planeación Municipal</div>
      </div>
    </div>

    <div class="po-sidebar">
      <div class="po-block">
        <div class="po-title">Leyenda</div>
        <div class="po-legend-scroll">
          ${leyendaHtml}
        </div>
      </div>
      <div class="po-block">
        <div class="po-title">Escala Aproximada</div>
        <div class="po-scale-visual">
          <div class="po-seg"></div><div class="po-seg"></div>
          <div class="po-seg"></div><div class="po-seg"></div>
        </div>
        <div class="po-scale-labels">
          <span>0</span><span>${scale.half}</span><span>${scale.full}</span>
        </div>
      </div>
      <div class="po-block">
        <div class="po-title">Información Municipal</div>
        <div class="po-info">
          <div><b>Municipio:</b> La Ceja del Tambo</div>
          <div><b>Departamento:</b> Antioquia</div>
          <div><b>Código DANE:</b> 05376</div>
          <div><b>Área total:</b> 154 km²</div>
        </div>
      </div>
      <div class="po-block">
        <div class="po-title">Sistema de Referencia</div>
        <div class="po-info">
          <div><b>Datum:</b> MAGNA-SIRGAS</div>
          <div><b>Proyección:</b> WGS 84</div>
          <div><b>EPSG:</b> 4326</div>
        </div>
      </div>
    </div>

    <div class="po-north">N</div>

    <div class="po-coords">
      Lat: ${center.lat.toFixed(5)} | Lng: ${center.lng.toFixed(5)}
    </div>

    <div class="po-footer">
      <span>© Municipio de La Ceja del Tambo · Departamento Administrativo de Planeación</span>
      <span>GEO-CEJA · Sistema de Información Geográfica Municipal</span>
      <span>Generado: ${fecha}</span>
    </div>
  `;

  document.body.appendChild(overlay);

  // ── Estilos ───────────────────────────────────────────────────
  const style    = document.createElement('style');
  style.id       = 'print-overlay-style';
  style.textContent = `
    #print-overlay {
      position: fixed; inset: 0;
      z-index: 9999; pointer-events: none;
      font-family: 'Montserrat', sans-serif;
    }
    .po-header {
      position: absolute; top: 0; left: 0; right: 0; height: 52px;
      background: #0B3D2E; border-bottom: 3px solid #C8A84B;
      display: flex; align-items: center; padding: 0 14px; gap: 12px;
    }
    .po-logo {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg,#C8A84B,#9E7A28);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .po-main { font-size: 15pt; font-weight: 800; color: #C8A84B; letter-spacing:.06em; }
    .po-sub  { font-size: 7pt; color: rgba(255,255,255,.7); }
    .po-meta {
      margin-left: auto; text-align: right;
      font-size: 6.5pt; color: rgba(255,255,255,.75); line-height: 1.8;
    }
    .po-meta b { color: #C8A84B; }

    .po-sidebar {
      position: absolute; top: 52px; right: 0; bottom: 40px; width: 220px;
      background: rgba(255,255,255,0.97); border-left: 3px solid #0B3D2E;
      padding: 8px; display: flex; flex-direction: column; gap: 8px; overflow: hidden;
    }
    .po-block { flex-shrink: 0; }
    .po-title {
      font-size: 6.5pt; font-weight: 700; text-transform: uppercase;
      letter-spacing: .08em; color: #0B3D2E;
      border-bottom: 1.5px solid #C8A84B; padding-bottom: 2px; margin-bottom: 5px;
    }

    /* Leyenda dinámica */
    .po-legend-scroll { overflow: hidden; }
    .pl-group { margin-bottom: 6px; }
    .pl-group-name {
      display: flex; align-items: center; gap: 5px;
      font-size: 6.5pt; font-weight: 700; color: #0B3D2E;
      margin-bottom: 3px;
    }
    .pl-dot {
      width: 10px; height: 10px; border-radius: 2px;
      flex-shrink: 0; border: 1px solid rgba(0,0,0,.15);
    }
    .pl-item {
      display: flex; align-items: center; gap: 5px;
      padding: 1.5px 0 1.5px 4px; font-size: 6pt; color: #333; line-height: 1.4;
    }
    .pl-swatch {
      width: 10px; height: 10px; border-radius: 2px;
      flex-shrink: 0; border: 1px solid rgba(0,0,0,.15);
    }
    .pl-empty { font-size: 6.5pt; color: #999; }

    .po-scale-visual {
      display: flex; height: 8px; border: 1.5px solid #0B3D2E;
      overflow: hidden; margin-bottom: 2px;
    }
    .po-seg { flex: 1; border-right: 1.5px solid #0B3D2E; }
    .po-seg:last-child { border-right: none; }
    .po-seg:nth-child(odd)  { background: #0B3D2E; }
    .po-seg:nth-child(even) { background: #fff; }
    .po-scale-labels { display: flex; justify-content: space-between; font-size: 6pt; color: #333; }

    .po-info { font-size: 6.5pt; color: #444; line-height: 1.9; }
    .po-info b { color: #0B3D2E; }

    .po-north {
      position: absolute; top: 66px; left: 12px;
      width: 36px; height: 36px; background: rgba(255,255,255,.95);
      border: 2px solid #0B3D2E; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14pt; font-weight: 900; color: #0B3D2E;
    }
    .po-coords {
      position: absolute; bottom: 50px; left: 12px;
      background: rgba(255,255,255,.92); border: 1px solid #0B3D2E;
      border-radius: 3px; padding: 2px 8px; font-size: 6.5pt;
      font-family: 'Courier New', monospace; color: #0B3D2E;
    }
    .po-footer {
      position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
      background: #0B3D2E; border-top: 2px solid #C8A84B;
      display: flex; align-items: center; justify-content: space-between; padding: 0 14px;
      font-size: 6pt; color: rgba(255,255,255,.7);
    }

    @media print {
      @page { size: A4 landscape; margin: 0; }
      .app-header  { display: none !important; }
      .sidebar     { display: none !important; }
      .basemap-switcher        { display: none !important; }
      .opacity-control         { display: none !important; }
      .toast                   { display: none !important; }
      .leaflet-control-container { display: none !important; }
      #map {
        position: fixed !important; top: 0 !important; left: 0 !important;
        width: 100vw !important; height: 100vh !important; z-index: 1 !important;
      }
      #print-overlay { z-index: 9999 !important; pointer-events: none !important; }
    }
  `;
  document.head.appendChild(style);

  map.invalidateSize();
  map.setView(map.getCenter(), map.getZoom());

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      const el = document.getElementById('print-overlay');
      const st = document.getElementById('print-overlay-style');
      if (el) el.remove();
      if (st) st.remove();
      map.invalidateSize();
    }, 1500);
  }, 600);
}

// ══════════════════════════════════════════════════════════════════
// ESCALA DEL MAPA
// ══════════════════════════════════════════════════════════════════
function getMapScale() {
  const zoom           = map.getZoom();
  const lat            = map.getCenter().lat;
  const metersPerPixel = 156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);
  const totalMeters    = Math.round(metersPerPixel * map.getSize().x / 2);

  const niceNum = (m) => {
    const mag  = Math.pow(10, Math.floor(Math.log10(m)));
    const n    = m / mag;
    const nice = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10;
    return nice * mag;
  };

  const full = niceNum(totalMeters);
  const half = full / 2;
  const fmt  = v => v >= 1000 ? `${v / 1000} km` : `${v} m`;
  return { full: fmt(full), half: fmt(half) };
}

// ══════════════════════════════════════════════════════════════════
// BÚSQUEDA POR DIRECCIÓN (Nominatim)
// ══════════════════════════════════════════════════════════════════
function doSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  showToast('Buscando…');

  const params = new URLSearchParams({
    q:              `${query}, La Ceja, Antioquia, Colombia`,
    format:         'json',
    limit:          1,
    countrycodes:   GEOCEJA_CONFIG.nominatim.countrycodes,
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
    const item   = data[0];
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
// ESTILOS DE IMPRESIÓN BÁSICOS (respaldo)
// ══════════════════════════════════════════════════════════════════
const printStyle = document.createElement('style');
printStyle.textContent = `
@media print {
  @page { size: A4 landscape; margin: 0; }
  .app-header, .sidebar, .basemap-switcher,
  .opacity-control, .toast { display: none !important; }
  .app-body { top: 0 !important; }
  #map { position: fixed; inset: 0; width: 100vw; height: 100vh; }
}`;
document.head.appendChild(printStyle);