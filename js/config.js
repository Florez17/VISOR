/**
 * GEO-CEJA · Configuración Central
 * ══════════════════════════════════════════════════════════════════
 * Edita este archivo para configurar tu GeoServer y el mapa.
 * ══════════════════════════════════════════════════════════════════
 */

const GEOCEJA_CONFIG = {

  // ── Coordenadas iniciales del mapa (La Ceja del Tambo, Antioquia) ──
  map: {
    center: [6.0228, -75.4297],   // [latitud, longitud]
    zoom: 13,
    minZoom: 8,
    maxZoom: 20
  },

  // ── GeoServer ──────────────────────────────────────────────────────
  // Cambia esta URL por la dirección de tu servidor GeoServer.
  // Ejemplo: 'http://192.168.1.100:8080/geoserver'
  //          'https://geo.laceja.gov.co/geoserver'
  geoserver: {
    url: 'https://geoserver.osorvilo.org/geoserver/wms',
    workspace: 'plan',          // nombre del workspace en GeoServer
    wmsVersion: '1.1.1'
  },

  // ── Parámetros comunes para las peticiones WMS ────────────────────
  wmsDefaults: {
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    attribution: '© Municipio de La Ceja · GEO-CEJA'
  },

  // ── Herramienta de búsqueda (Nominatim – OpenStreetMap gratuito) ──
  nominatim: {
    url: 'https://nominatim.openstreetmap.org/search',
    countrycodes: 'co',
    viewbox: '-76.0,-74.5,5.5,6.8',   // bounding box Antioquia
    bounded: 1
  }
};
