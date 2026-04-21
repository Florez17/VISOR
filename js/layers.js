/**
 * GEO-CEJA · Configuración de Capas WMS
 * ══════════════════════════════════════════════════════════════════
 * Cada capa corresponde a un layer publicado en GeoServer.
 * El "name" debe coincidir con "workspace:layer_name" de GeoServer.
 *
 * PARA AGREGAR MÁS CAPAS:
 * 1. Agrega la entrada aquí en LAYERS_CONFIG.
 * 2. Agrega el checkbox en index.html dentro del grupo correspondiente.
 * ══════════════════════════════════════════════════════════════════
 */

const LAYERS_CONFIG = {

  /* ── GRUPO: Clasificación del Suelo ────────────────────────────── */
  suelo_urbano: {
    geoserverLayer: 'plan:Suelo Urbano',
    label: 'Suelo Urbano',
    group: 'clasificacion',
    defaultOpacity: 0.75,
    description: 'Perímetro del suelo urbano del municipio de La Ceja del Tambo según el Plan Básico de Ordenamiento Territorial (PBOT) vigente.',
    source: 'Planeación Municipal – PBOT La Ceja',
    updated: '2023',
    style: ''    // nombre del estilo SLD en GeoServer (vacío = estilo por defecto)
  },
  suelo_expansion: {
    geoserverLayer: 'plan:Suelo_Expansion',
    label: 'Suelo de Expansión',
    group: 'clasificacion',
    defaultOpacity: 0.75,
    description: 'Áreas destinadas al crecimiento urbano futuro del municipio, definidas en el POT.',
    source: 'Planeación Municipal – PBOT La Ceja',
    updated: '2023',
    style: ''
  },
  suelo_rural: {
    geoserverLayer: 'plan:Suelo_Rural',
    label: 'Suelo Rural',
    group: 'clasificacion',
    defaultOpacity: 0.7,
    description: 'Zonas rurales del municipio destinadas a actividades agropecuarias, forestales y de conservación.',
    source: 'Planeación Municipal – PBOT La Ceja',
    updated: '2023',
    style: ''
  },
  suelo_proteccion: {
    geoserverLayer: 'laceja:suelo_proteccion',
    label: 'Suelo de Protección',
    group: 'clasificacion',
    defaultOpacity: 0.7,
    description: 'Áreas con restricciones de uso por sus características ambientales, paisajísticas o de riesgo.',
    source: 'Planeación Municipal – PBOT La Ceja',
    updated: '2023',
    style: ''
  },

  /* ── GRUPO: Usos del Suelo ─────────────────────────────────────── */
  uso_residencial: {
    geoserverLayer: 'plan:Usos_urbanos',
    label: 'Usos_urbanos',
    group: 'usos',
    defaultOpacity: 0.7,
    description: 'Clasificación usos del suelo urbano',
    source: 'Planeación Municipal',
    updated: '2023',
    style: ''
  },
  /*uso_comercial: {
    geoserverLayer: 'laceja:uso_comercial',
    label: 'Uso Comercial',
    group: 'usos',
    defaultOpacity: 0.7,
    description: 'Áreas autorizadas para actividades comerciales de escala local, zonal y municipal.',
    source: 'Planeación Municipal',
    updated: '2023',
    style: ''
  },
  uso_industrial: {
    geoserverLayer: 'laceja:uso_industrial',
    label: 'Uso Industrial',
    group: 'usos',
    defaultOpacity: 0.7,
    description: 'Zonas destinadas para el desarrollo de actividades industriales de mediana y gran escala.',
    source: 'Planeación Municipal',
    updated: '2023',
    style: ''
  },
  uso_dotacional: {
    geoserverLayer: 'laceja:uso_dotacional',
    label: 'Uso Dotacional',
    group: 'usos',
    defaultOpacity: 0.7,
    description: 'Equipamentos públicos: educación, salud, deporte, cultura, administración y servicios.',
    source: 'Planeación Municipal',
    updated: '2023',
    style: ''
  },
  uso_agricola: {
    geoserverLayer: 'laceja:uso_agricola',
    label: 'Uso Agrícola',
    group: 'usos',
    defaultOpacity: 0.7,
    description: 'Suelo rural destinado a la producción agropecuaria, caficultura y cultivos de la región.',
    source: 'Planeación Municipal / UPRA',
    updated: '2023',
    style: ''
  },*/

  /* ── GRUPO: Amenazas y Riesgos ─────────────────────────────────── */
  amenaza_inundacion: {
    geoserverLayer: 'laceja:amenaza_inundacion',
    label: 'Amenaza por Inundación',
    group: 'amenazas',
    defaultOpacity: 0.65,
    description: 'Zonificación de áreas con susceptibilidad alta, media y baja a inundaciones por desbordamiento de cuerpos de agua.',
    source: 'UNGRD / Planeación Municipal',
    updated: '2022',
    style: ''
  },
  amenaza_remocion: {
    geoserverLayer: 'laceja:amenaza_remocion',
    label: 'Amenaza Remoción en Masa',
    group: 'amenazas',
    defaultOpacity: 0.65,
    description: 'Zonas con susceptibilidad a deslizamientos, flujos de lodo y otros procesos de remoción en masa.',
    source: 'SGC / Planeación Municipal',
    updated: '2022',
    style: ''
  },
  riesgo_alto: {
    geoserverLayer: 'laceja:riesgo_alto',
    label: 'Riesgo Alto',
    group: 'amenazas',
    defaultOpacity: 0.7,
    description: 'Áreas con condición de riesgo alto no mitigable que requieren procesos de relocalización.',
    source: 'Planeación Municipal',
    updated: '2023',
    style: ''
  },
  riesgo_medio: {
    geoserverLayer: 'laceja:riesgo_medio',
    label: 'Riesgo Medio',
    group: 'amenazas',
    defaultOpacity: 0.7,
    description: 'Áreas con condición de riesgo medio, sujetas a medidas de mitigación y control.',
    source: 'Planeación Municipal',
    updated: '2023',
    style: ''
  },
  zona_recuperacion: {
    geoserverLayer: 'laceja:zona_recuperacion',
    label: 'Zona de Recuperación',
    group: 'amenazas',
    defaultOpacity: 0.65,
    description: 'Zonas con condición de riesgo mitigable en proceso de recuperación geomorfológica.',
    source: 'Planeación Municipal',
    updated: '2023',
    style: ''
  },

  /* ── GRUPO: Catastro ────────────────────────────────────────────── */
  predios_urbanos: {
    geoserverLayer: 'plan:Urbano',
    label: 'Predios Urbanos',
    group: 'catastro',
    defaultOpacity: 0.7,
    description: 'Polígonos de predios catastrados dentro del perímetro urbano, con información de matrícula y código catastral.',
    source: 'IGAC / Catastro Municipal',
    updated: '2024',
    style: ''
  },
  predios_rurales: {
    geoserverLayer: 'laceja:predios_rurales',
    label: 'Predios Rurales',
    group: 'catastro',
    defaultOpacity: 0.7,
    description: 'Predios catastrados en el área rural del municipio.',
    source: 'IGAC / Catastro Municipal',
    updated: '2024',
    style: ''
  },
  manzanas_catastrales: {
    geoserverLayer: 'laceja:manzanas_catastrales',
    label: 'Manzanas Catastrales',
    group: 'catastro',
    defaultOpacity: 0.6,
    description: 'División en manzanas del área urbana para la gestión catastral.',
    source: 'IGAC',
    updated: '2023',
    style: ''
  },
  nomenclatura_vial: {
    geoserverLayer: 'laceja:nomenclatura_vial',
    label: 'Nomenclatura Vial',
    group: 'catastro',
    defaultOpacity: 0.8,
    description: 'Red vial con nomenclatura oficial: carreras, calles, avenidas y transversales.',
    source: 'Secretaría de Obras Públicas / IGAC',
    updated: '2023',
    style: ''
  }

  /*
   * ══════════════════════════════════════════════════════════════
   * PLANTILLA PARA AGREGAR UNA NUEVA CAPA:
   * ══════════════════════════════════════════════════════════════
   * nueva_capa: {
   *   geoserverLayer: 'laceja:nombre_capa_en_geoserver',
   *   label: 'Nombre visible en la interfaz',
   *   group: 'nombre_del_grupo',       // debe coincidir con data-group en HTML
   *   defaultOpacity: 0.75,            // entre 0 y 1
   *   description: 'Descripción para el panel de información.',
   *   source: 'Fuente de la información',
   *   updated: '2024',
   *   style: ''                        // nombre del estilo SLD (vacío = default)
   * }
   * ══════════════════════════════════════════════════════════════
   */
};

// Registro interno de instancias WMS activas en el mapa
const WMS_LAYERS = {};
