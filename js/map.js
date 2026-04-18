/* =============================================
   MAP — Haiti interactive map from GeoJSON
   Renders commune-level polygons colored by department
   ============================================= */

/* ----- PROJECTION ----- */
// Equirectangular projection tuned for Haiti
// Haiti bounds: ~lon -74.5 to -71.6, lat 18.0 to 20.1
const MAP_CONFIG = {
  svgWidth: 800,
  svgHeight: 500,
  padding: 20,
  // Bounding box (will be computed from data)
  minLon: -74.55,
  maxLon: -71.55,
  minLat: 18.0,
  maxLat: 20.15,
  // Aspect ratio correction for latitude ~19°N
  cosLat: Math.cos(19.0 * Math.PI / 180) // ≈ 0.946
};

function projectPoint(lon, lat) {
  const cfg = MAP_CONFIG;
  const lonRange = (cfg.maxLon - cfg.minLon) * cfg.cosLat;
  const latRange = cfg.maxLat - cfg.minLat;
  const scale = Math.min(
    (cfg.svgWidth - cfg.padding * 2) / lonRange,
    (cfg.svgHeight - cfg.padding * 2) / latRange
  );
  const x = cfg.padding + ((lon - cfg.minLon) * cfg.cosLat) * scale;
  const y = cfg.padding + ((cfg.maxLat - lat)) * scale;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

function coordsToPath(coords) {
  // coords is an array of [lon, lat] pairs (one ring)
  return coords.map((c, i) => {
    const [x, y] = projectPoint(c[0], c[1]);
    return (i === 0 ? 'M' : 'L') + x + ' ' + y;
  }).join(' ') + ' Z';
}

function geometryToPath(geometry) {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => coordsToPath(ring)).join(' ');
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(poly =>
      poly.map(ring => coordsToPath(ring)).join(' ')
    ).join(' ');
  }
  return '';
}

/* ----- DEPARTMENT COLORS ----- */
const DEPT_COLORS = {
  'Ouest': '#d4a24c',
  'Sud-Est': '#c0392b',
  'Nord': '#f1c40f',
  'Nord-Est': '#e67e22',
  'Artibonite': '#8a1812',
  'Centre': '#a0522d',
  'Sud': '#d62418',
  'Nippes': '#d4886c',
  "Grande'Anse": '#2c6e49',
  'Nord-Ouest': '#3a86c8',
  'Grand-Anse': '#2c6e49'
};

// Returns the department color for a commune, with lighter/darker shade based on intensity
function getDeptColor(deptName, intensity) {
  const hex = DEPT_COLORS[deptName] || '#ebdfc3';
  if (!intensity && intensity !== 0) return hex;
  // Lighten or darken based on intensity (0 = lighter, 1 = full color)
  const factor = 0.4 + intensity * 0.6; // range 0.4 to 1.0
  return blendColor(hex, factor);
}

function blendColor(hex, factor) {
  // Blend hex color towards white (factor=0 → white, factor=1 → original)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(255 - (255 - r) * factor);
  const ng = Math.round(255 - (255 - g) * factor);
  const nb = Math.round(255 - (255 - b) * factor);
  return '#' + [nr, ng, nb].map(c => c.toString(16).padStart(2, '0')).join('');
}

/* ----- DEPARTMENT LABEL POSITIONS ----- */
// Pre-computed centroids for department labels
function computeDeptCentroids(features) {
  const deptPoints = {};
  features.forEach(f => {
    const dept = f.properties.department;
    if (!deptPoints[dept]) deptPoints[dept] = { lons: [], lats: [] };
    const coords = f.geometry.type === 'Polygon'
      ? f.geometry.coordinates[0]
      : f.geometry.coordinates.flat(1)[0] || f.geometry.coordinates[0][0];
    if (coords) {
      coords.forEach(c => {
        deptPoints[dept].lons.push(c[0]);
        deptPoints[dept].lats.push(c[1]);
      });
    }
  });

  const centroids = {};
  Object.keys(deptPoints).forEach(dept => {
    const d = deptPoints[dept];
    const avgLon = d.lons.reduce((a, b) => a + b, 0) / d.lons.length;
    const avgLat = d.lats.reduce((a, b) => a + b, 0) / d.lats.length;
    centroids[dept] = projectPoint(avgLon, avgLat);
  });
  return centroids;
}

/* ----- MATCHING ----- */
function matchDepartment(where) {
  if (!where) return null;
  const lower = where.toLowerCase();
  if (/diaspora|dyaspora/.test(lower)) return 'diaspora';
  for (const d of DEPARTMENTS) {
    for (const alias of d.aliases) {
      if (lower.includes(alias)) return d.id;
    }
  }
  return null;
}

function getDeptCounts() {
  const counts = {};
  DEPARTMENTS.forEach(d => { counts[d.id] = { answers: 0, participants: 0, seeded: d.seedCount }; });
  counts.diaspora = { answers: 0, participants: 0, seeded: 0 };

  answers.forEach(a => {
    const deptId = matchDepartment(a.where);
    if (!deptId || !counts[deptId]) return;
    // Count 1 per person (form submission), not per question
    const hasAnyAnswer = QUESTIONS.some(q => {
      const val = a[q.id];
      const text = typeof val === 'object' ? (val && (val[currentLang] || val.ht || '')) : val;
      return text && text.trim();
    });
    if (hasAnyAnswer) {
      counts[deptId].participants += 1;
      counts[deptId].answers += 1;
    }
  });
  return counts;
}

function colorForCount(count, maxCount) {
  const scale = ['#f3ead7', '#f5c9a0', '#ec7a54', '#d62418', '#8a1812'];
  if (!count || count === 0) return scale[0];
  const ratio = count / Math.max(maxCount, 1);
  if (ratio < 0.2) return scale[1];
  if (ratio < 0.45) return scale[2];
  if (ratio < 0.75) return scale[3];
  return scale[4];
}

/* ----- DEPT NAME MAPPING (GeoJSON name → our ID) ----- */
const DEPT_NAME_TO_ID = {
  'Ouest': 'ouest',
  'Sud-Est': 'sud-est',
  'Nord': 'nord',
  'Nord-Est': 'nord-est',
  'Artibonite': 'artibonite',
  'Centre': 'centre',
  'Sud': 'sud',
  'Nippes': 'nippes',
  "Grande'Anse": 'grand-anse',
  'Grand-Anse': 'grand-anse',
  'Nord-Ouest': 'nord-ouest'
};

/* ----- RENDER ----- */
async function renderMap() {
  const svg = document.querySelector('.map-svg');
  if (!svg) return;

  // Load GeoJSON if not yet loaded
  if (!HAITI_GEO && typeof loadHaitiGeo === 'function') {
    await loadHaitiGeo();
  }

  // If GeoJSON available, render real map
  if (HAITI_GEO && HAITI_GEO.features) {
    renderGeoMap(svg);
  } else {
    renderFallbackMap(svg);
  }
}

function renderGeoMap(svg) {
  const features = HAITI_GEO.features;
  const counts = getDeptCounts();
  const totals = {};
  DEPARTMENTS.forEach(d => {
    totals[d.id] = (counts[d.id] ? counts[d.id].answers + counts[d.id].seeded : 0);
  });
  const maxTotal = Math.max(...Object.values(totals), 1);

  // Set viewBox
  svg.setAttribute('viewBox', `0 0 ${MAP_CONFIG.svgWidth} ${MAP_CONFIG.svgHeight}`);

  // Build SVG content
  let pathsHtml = '';

  // Render each commune
  features.forEach(f => {
    const deptName = f.properties.department;
    const deptId = DEPT_NAME_TO_ID[deptName] || deptName.toLowerCase().replace(/[' ]/g, '-');
    const communeName = f.properties.name;
    const total = totals[deptId] || 0;
    const fillColor = colorForCount(total, maxTotal);
    const isActive = selectedDept === deptId;
    const pathData = geometryToPath(f.geometry);

    pathsHtml += `<path
      class="dept-path${isActive ? ' active' : ''}"
      data-dept="${deptId}"
      data-commune="${communeName}"
      d="${pathData}"
      style="fill:${fillColor}"
    ><title>${communeName} · ${deptName}</title></path>`;
  });

  // Department labels
  const centroids = computeDeptCentroids(features);
  let labelsHtml = '';
  Object.keys(centroids).forEach(deptName => {
    const [cx, cy] = centroids[deptName];
    const deptId = DEPT_NAME_TO_ID[deptName] || deptName.toLowerCase().replace(/[' ]/g, '-');
    const total = totals[deptId] || 0;
    const intensity = total / maxTotal;
    const labelFill = intensity > 0.55 ? '#f3ead7' : '#0a0806';
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    const displayName = dept ? dept.name[currentLang] : deptName;

    labelsHtml += `
      <text class="dept-label" x="${cx}" y="${cy}" style="fill:${labelFill};">${displayName.toUpperCase()}</text>
      <text class="dept-count" x="${cx}" y="${cy + 14}" style="fill:${labelFill};">${total.toLocaleString()}</text>
    `;
  });

  // Compass
  const compassHtml = `
    <g transform="translate(${MAP_CONFIG.svgWidth - 40}, 30)" opacity="0.6">
      <circle r="14" fill="none" stroke="#0a0806" stroke-width="1"/>
      <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="#d62418"/>
      <text y="-18" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" letter-spacing="0.1em" fill="#0a0806">N</text>
    </g>
  `;

  // Department borders — render commune paths grouped by department with a thick outline
  let deptBordersHtml = '';
  const deptGroups = {};
  features.forEach(f => {
    const deptName = f.properties.department;
    const deptId = DEPT_NAME_TO_ID[deptName] || deptName.toLowerCase().replace(/[' ]/g, '-');
    if (!deptGroups[deptId]) deptGroups[deptId] = [];
    deptGroups[deptId].push(geometryToPath(f.geometry));
  });

  Object.keys(deptGroups).forEach(deptId => {
    const isActive = selectedDept === deptId;
    const combinedPath = deptGroups[deptId].join(' ');
    deptBordersHtml += `<path
      class="dept-border${isActive ? ' dept-border-active' : ''}"
      d="${combinedPath}"
      data-dept="${deptId}"
    />`;
  });

  // Diaspora polygon — placed to the right of Haiti
  const diasporaCounts = counts.diaspora || { answers: 0, participants: 0, seeded: 0 };
  const diasporaTotal = diasporaCounts.answers + diasporaCounts.seeded;
  totals['diaspora'] = diasporaTotal;
  const diasporaColor = colorForCount(diasporaTotal, maxTotal);
  const isActiveDiaspora = selectedDept === 'diaspora';
  const dx = MAP_CONFIG.svgWidth - 110;
  const dy = 180;

  const diasporaHtml = `
    <g class="diaspora-group">
      <line x1="${dx - 40}" y1="${dy + 40}" x2="${dx - 80}" y2="${dy + 40}"
        stroke="var(--ink, #0a0806)" stroke-width="1" stroke-dasharray="4 3" opacity="0.4"/>
      <polygon
        class="dept-path diaspora-polygon${isActiveDiaspora ? ' active' : ''}"
        data-dept="diaspora"
        points="${dx},${dy} ${dx + 80},${dy + 10} ${dx + 90},${dy + 45} ${dx + 75},${dy + 80} ${dx + 10},${dy + 85} ${dx - 10},${dy + 50} ${dx - 5},${dy + 15}"
        style="fill:${diasporaColor}; stroke:var(--ink, #0a0806); stroke-width:3.5;"
      ><title>Diaspora</title></polygon>
      <text class="dept-label" x="${dx + 40}" y="${dy + 40}" style="fill:${diasporaTotal / maxTotal > 0.55 ? '#f3ead7' : '#0a0806'};">DIASPORA</text>
      <text class="dept-count" x="${dx + 40}" y="${dy + 54}" style="fill:${diasporaTotal / maxTotal > 0.55 ? '#f3ead7' : '#0a0806'};">${diasporaTotal.toLocaleString()}</text>
    </g>
  `;

  svg.innerHTML = pathsHtml
    + '<g class="dept-borders-layer">' + deptBordersHtml + '</g>'
    + '<g id="dept-labels">' + labelsHtml + '</g>'
    + diasporaHtml
    + compassHtml;

  // Attach click handlers (communes + diaspora)
  svg.querySelectorAll('.dept-path').forEach(path => {
    path.addEventListener('click', () => selectDept(path.dataset.dept));
    path.style.cursor = 'pointer';
  });

  // Render sidebar + legend
  renderRanking(counts, totals, maxTotal);
  renderDeptDetail(counts);
  renderDeptLegend(counts, totals, maxTotal);
}

function renderFallbackMap(svg) {
  // Original simplified SVG paths as fallback
  svg.setAttribute('viewBox', '0 0 600 400');
  svg.innerHTML = `
    <path d="M 560 155 L 600 150 L 600 240 L 570 245 L 560 220 Z" fill="rgba(10,8,6,0.08)" stroke="none" />
    <path class="dept-path" data-dept="nord-ouest" d="M 65 140 L 145 120 L 170 145 L 165 180 L 120 195 L 80 185 L 60 165 Z" />
    <path class="dept-path" data-dept="nord" d="M 170 145 L 260 130 L 290 155 L 275 185 L 210 195 L 165 180 Z" />
    <path class="dept-path" data-dept="nord-est" d="M 290 155 L 375 145 L 395 175 L 365 200 L 305 200 L 275 185 Z" />
    <path class="dept-path" data-dept="artibonite" d="M 120 195 L 275 185 L 305 200 L 295 250 L 215 265 L 150 250 L 120 225 Z" />
    <path class="dept-path" data-dept="centre" d="M 295 250 L 305 200 L 365 200 L 395 225 L 380 275 L 310 280 Z" />
    <path class="dept-path" data-dept="ouest" d="M 150 250 L 295 250 L 310 280 L 290 320 L 215 335 L 155 320 L 130 290 Z" />
    <path class="dept-path" data-dept="sud-est" d="M 215 335 L 290 320 L 330 335 L 310 360 L 235 360 Z" />
    <path class="dept-path" data-dept="nippes" d="M 75 275 L 150 265 L 155 320 L 100 325 L 70 305 Z" />
    <path class="dept-path" data-dept="grand-anse" d="M 20 290 L 75 275 L 70 305 L 30 320 Z" />
    <path class="dept-path" data-dept="sud" d="M 30 320 L 100 325 L 155 320 L 165 355 L 90 360 L 35 345 Z" />
    <g id="dept-labels"></g>
    <g transform="translate(540, 30)" opacity="0.6">
      <circle r="14" fill="none" stroke="#0a0806" stroke-width="1"/>
      <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="#d62418"/>
      <text y="-18" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9" letter-spacing="0.1em" fill="#0a0806">N</text>
    </g>
  `;

  // Color and label the fallback map
  const counts = getDeptCounts();
  const totals = DEPARTMENTS.map(d => counts[d.id].answers + counts[d.id].seeded);
  const maxTotal = Math.max(...totals, 1);

  DEPARTMENTS.forEach(d => {
    const total = counts[d.id].answers + counts[d.id].seeded;
    const path = svg.querySelector(`.dept-path[data-dept="${d.id}"]`);
    if (path) {
      path.style.fill = colorForCount(total, maxTotal);
      path.classList.toggle('active', selectedDept === d.id);
    }
  });

  const labelGroup = svg.querySelector('#dept-labels');
  if (labelGroup) {
    labelGroup.innerHTML = DEPARTMENTS.map(d => {
      const total = counts[d.id].answers + counts[d.id].seeded;
      const intensity = total / maxTotal;
      const labelFill = intensity > 0.55 ? '#f3ead7' : '#0a0806';
      return `
        <text class="dept-label" x="${d.labelX}" y="${d.labelY}" style="fill:${labelFill};">${d.name[currentLang].toUpperCase()}</text>
        <text class="dept-count" x="${d.labelX}" y="${d.labelY + 13}" style="fill:${labelFill};">${total.toLocaleString()}</text>
      `;
    }).join('');
  }

  attachMapHandlers();
  const totalsObj = Object.fromEntries(DEPARTMENTS.map(d => [d.id, counts[d.id].answers + counts[d.id].seeded]));
  renderRanking(counts, totalsObj, maxTotal);
  renderDeptDetail(counts);
  renderDeptLegend(counts, totalsObj, maxTotal);
}

function renderRanking(counts, totals, maxTotal) {
  const rankList = document.getElementById('ranking-list');
  if (!rankList) return;

  // Include diaspora in ranking
  const diasporaCnt = counts.diaspora || { answers: 0, seeded: 0 };
  const diasporaTotal = diasporaCnt.answers + diasporaCnt.seeded;
  const diasporaEntry = {
    id: 'diaspora',
    name: { ht: 'Dyaspora', fr: 'Diaspora', en: 'Diaspora' },
    total: diasporaTotal
  };

  const ranked = DEPARTMENTS
    .map(d => ({ ...d, total: totals[d.id] || (counts[d.id].answers + counts[d.id].seeded) }))
    .concat(diasporaEntry)
    .sort((a, b) => b.total - a.total);
  const rankMax = ranked[0] ? ranked[0].total : 1;

  rankList.innerHTML = ranked.map((d, i) => {
    const pct = (d.total / rankMax) * 100;
    return `
      <div class="ranking-item ${selectedDept === d.id ? 'active' : ''}" onclick="selectDept('${d.id}')">
        <span class="ranking-pos">${String(i + 1).padStart(2, '0')}</span>
        <span class="ranking-name">${d.name[currentLang]}</span>
        <div class="ranking-bar-wrap"><div class="ranking-bar" style="width: ${pct}%"></div></div>
        <span class="ranking-val">${d.total}</span>
      </div>
    `;
  }).join('');
}

function renderDeptDetail(counts) {
  const detail = document.getElementById('dept-detail');
  if (!detail) return;

  if (!selectedDept) {
    detail.innerHTML = `
      <div class="dd-kicker">${i18n[currentLang]['dd-kicker-selected']}</div>
      <h4>\u2014</h4>
      <div class="dd-hint">${i18n[currentLang]['map-default-hint']}</div>
    `;
    return;
  }

  // Handle diaspora
  if (selectedDept === 'diaspora') {
    const c = counts.diaspora || { answers: 0, participants: 0, seeded: 0 };
    const total = c.answers + c.seeded;
    const diasporaName = DIASPORA_LABEL[currentLang] || 'Diaspora';
    const emptyState = total === 0
      ? `<div class="dd-empty">${i18n[currentLang]['dd-no-voices']}</div>`
      : `<div class="dept-stats-row">
           <div class="dept-stat"><div class="dd-n">${c.participants}</div><div class="dd-label">${i18n[currentLang]['dd-participants']}</div></div>
           <div class="dept-stat"><div class="dd-n">${total}</div><div class="dd-label">${i18n[currentLang]['dd-answers']}</div></div>
         </div>`;
    detail.innerHTML = `
      <div class="dd-kicker">${i18n[currentLang]['dd-kicker-selected']}</div>
      <h4>${diasporaName}</h4>
      ${emptyState}
    `;
    return;
  }

  const d = DEPARTMENTS.find(x => x.id === selectedDept);
  if (!d) return;
  const c = counts[selectedDept];
  const total = c.answers + c.seeded;

  const emptyState = total === 0
    ? `<div class="dd-empty">${i18n[currentLang]['dd-no-voices']}</div>`
    : `<div class="dept-stats-row">
         <div class="dept-stat"><div class="dd-n">${c.participants + Math.floor(c.seeded / 5)}</div><div class="dd-label">${i18n[currentLang]['dd-participants']}</div></div>
         <div class="dept-stat"><div class="dd-n">${total}</div><div class="dd-label">${i18n[currentLang]['dd-answers']}</div></div>
       </div>`;

  detail.innerHTML = `
    <div class="dd-kicker">${i18n[currentLang]['dd-kicker-selected']} \u00B7 ${d.capital}</div>
    <h4>${d.name[currentLang]}</h4>
    ${emptyState}
    ${total > 0 ? `<div style="margin-top:16px;"><button class="btn-primary" style="padding:10px 18px;font-size:11px;" onclick="document.getElementById('answers') ? document.getElementById('answers').scrollIntoView({behavior:'smooth'}) : window.location.href='index.html'">${i18n[currentLang]['dd-view-voices']}</button></div>` : ''}
  `;
}

function renderDeptLegend(counts, totals, maxTotal) {
  const el = document.getElementById('map-dept-legend');
  if (!el) return;

  el.innerHTML = DEPARTMENTS
    .map(d => {
      const total = totals[d.id] || 0;
      const color = colorForCount(total, maxTotal);
      const isActive = selectedDept === d.id;
      return `
        <div class="dept-legend-item ${isActive ? 'active' : ''}" onclick="selectDept('${d.id}')">
          <span class="dept-legend-swatch" style="background:${color};"></span>
          <span class="dept-legend-name">${d.name[currentLang]}</span>
          <span class="dept-legend-count">${total}</span>
        </div>
      `;
    }).join('');
}

function selectDept(deptId) {
  selectedDept = (selectedDept === deptId) ? null : deptId;
  renderMap();
}

function attachMapHandlers() {
  document.querySelectorAll('.dept-path').forEach(path => {
    path.addEventListener('click', () => selectDept(path.dataset.dept));
  });
}
