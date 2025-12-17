// Script to fetch municipality boundaries from OpenStreetMap and save as GeoJSON
const fetch = require('node-fetch');
const fs = require('fs');

// List of municipalities to fetch
const MUNICIPALITIES = [
  'Bhimavaram',
  'Eluru',
  'Tadepalligudem',
  'Tanuku'
];

// Overpass API query to get municipality boundaries
async function fetchMunicipalityBoundary(municipalityName) {
  const query = `
    [out:json][timeout:25];
    (
      relation["boundary"="administrative"]["admin_level"="8"]["name"="${municipalityName}"]["is_in:state"="Andhra Pradesh"];
      relation["boundary"="administrative"]["admin_level"="7"]["name"="${municipalityName}"]["is_in:state"="Andhra Pradesh"];
    );
    out geom;
  `;

  const url = `https://overpass-api.de/api/interpreter`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = await response.json();

    if (!data.elements || data.elements.length === 0) {
      console.log(`⚠️  No boundary found for ${municipalityName}`);
      return null;
    }

    // Convert OSM data to GeoJSON Polygon/MultiPolygon
    const element = data.elements[0];
    const coordinates = element.members
      .filter(m => m.role === 'outer')
      .map(m => m.geometry.map(g => [g.lon, g.lat]));

    const geometry = coordinates.length === 1
      ? { type: 'Polygon', coordinates }
      : { type: 'MultiPolygon', coordinates: coordinates.map(c => [c]) };

    return {
      type: 'Feature',
      properties: {
        name: municipalityName,
        osm_id: element.id,
        admin_level: element.tags.admin_level,
        state: 'Andhra Pradesh'
      },
      geometry
    };
  } catch (err) {
    console.error(`❌ Error fetching ${municipalityName}:`, err);
    return null;
  }
}

async function fetchAllMunicipalities() {
  const results = [];
  for (const name of MUNICIPALITIES) {
    const feature = await fetchMunicipalityBoundary(name);
    if (feature) results.push(feature);
  }
  const geoJSON = {
    type: 'FeatureCollection',
    features: results
  };
  const filename = 'west_godavari_municipalities.geojson';
  fs.writeFileSync(filename, JSON.stringify(geoJSON, null, 2));
  console.log('\n✅ COMPLETE!');
  console.log(`📁 Saved to: ${filename}`);
  console.log(`📊 Total municipalities: ${results.length}/${MUNICIPALITIES.length}`);
}

fetchAllMunicipalities().catch(console.error);