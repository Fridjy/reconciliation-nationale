/* =============================================
   HAITI GEOJSON MAP DATA

   This file loads the commune-level GeoJSON and
   exposes it as HAITI_GEO for the map renderer.

   The GeoJSON is loaded from data/haiti-communes.geojson
   If the file isn't available, falls back to empty.
   ============================================= */

let HAITI_GEO = null;

async function loadHaitiGeo() {
  try {
    const resp = await fetch('data/haiti/communes.geojson');
    if (!resp.ok) throw new Error('GeoJSON not found');
    HAITI_GEO = await resp.json();
    console.log(`Haiti map loaded: ${HAITI_GEO.features.length} communes`);
    return HAITI_GEO;
  } catch (e) {
    console.warn('Haiti GeoJSON not loaded:', e.message);
    return null;
  }
}
