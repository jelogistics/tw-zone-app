
let map;
let villageData;
let zones;
let popup;

const infoPanel = document.getElementById('infoPanel');
const zoneList = document.getElementById('zoneList');

document.getElementById('applyTokenBtn').addEventListener('click', startMap);
document.getElementById('searchBtn').addEventListener('click', runSearch);
document.getElementById('resetBtn').addEventListener('click', resetView);

async function startMap() {
  const token = document.getElementById('mapboxToken').value.trim();
  if (!token) {
    alert('Mapbox Public Token을 먼저 넣어주세요.');
    return;
  }

  mapboxgl.accessToken = token;

  const [geojsonRes, zonesRes] = await Promise.all([
    fetch('./data/tw-villages-taipei-newtaipei.geojson'),
    fetch('./data/zones-tw.json')
  ]);

  villageData = await geojsonRes.json();
  zones = await zonesRes.json();

  villageData.features = villageData.features.map((feature) => {
    const zone = findZoneByPostcode(feature.properties.postcode3);
    feature.properties.zoneId = zone?.zoneId || '';
    feature.properties.zoneName = zone?.zoneName || '미배정';
    feature.properties.zoneColor = zone?.color || '#d1d5db';
    feature.properties.zoneMemo = zone?.memo || '';
    return feature;
  });

  renderZoneList();

  if (map) {
    map.remove();
  }

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: [121.50, 25.05],
    zoom: 9.1
  });

  map.addControl(new mapboxgl.NavigationControl());

  map.on('load', () => {
    map.addSource('villages', {
      type: 'geojson',
      data: villageData
    });

    map.addLayer({
      id: 'villages-fill',
      type: 'fill',
      source: 'villages',
      paint: {
        'fill-color': ['get', 'zoneColor'],
        'fill-opacity': 0.6
      }
    });

    map.addLayer({
      id: 'villages-line',
      type: 'line',
      source: 'villages',
      paint: {
        'line-color': '#374151',
        'line-width': 0.7
      }
    });

    map.addLayer({
      id: 'villages-highlight',
      type: 'line',
      source: 'villages',
      paint: {
        'line-color': '#111827',
        'line-width': 3
      },
      filter: ['==', ['get', 'VILLCODE'], '']
    });

    map.on('click', 'villages-fill', (e) => {
      const feature = e.features[0];
      focusFeature(feature);
    });

    map.on('mouseenter', 'villages-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'villages-fill', () => {
      map.getCanvas().style.cursor = '';
    });
  });
}

function findZoneByPostcode(postcode) {
  return zones.find((zone) => zone.postalCodes.includes(String(postcode)));
}

function renderZoneList() {
  zoneList.innerHTML = '';
  zones.forEach((zone) => {
    const div = document.createElement('div');
    div.className = 'zone-item';
    div.innerHTML = `<span class="zone-swatch" style="background:${zone.color}"></span>${zone.zoneName}<br><small class="muted">${zone.postalCodes.join(', ')}</small>`;
    div.addEventListener('click', () => zoomToZone(zone));
    zoneList.appendChild(div);
  });
}

function zoomToZone(zone) {
  if (!map || !villageData) return;
  const matches = villageData.features.filter((f) => f.properties.zoneId === zone.zoneId);
  if (!matches.length) {
    alert('이 구역에 연결된 폴리곤이 없습니다.');
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();
  matches.forEach((feature) => addFeatureBounds(feature.geometry, bounds));
  map.fitBounds(bounds, { padding: 40 });

  map.setFilter('villages-highlight', ['in', ['get', 'VILLCODE'], ['literal', matches.map(m => m.properties.VILLCODE)]]);
  infoPanel.textContent = `구역명: ${zone.zoneName}\n우편번호: ${zone.postalCodes.join(', ')}\n메모: ${zone.memo || '-'}`;
}

function addFeatureBounds(geometry, bounds) {
  const coords = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  coords.forEach((polygon) => {
    polygon.forEach((ring) => {
      ring.forEach((coord) => bounds.extend(coord));
    });
  });
}

function focusFeature(feature) {
  if (!map) return;
  map.setFilter('villages-highlight', ['==', ['get', 'VILLCODE'], feature.properties.VILLCODE]);

  const html = `
    <strong>${feature.properties.COUNTYNAME} ${feature.properties.TOWNNAME} ${feature.properties.VILLNAME}</strong><br>
    우편번호(3자리): ${feature.properties.postcode3}<br>
    구역명: ${feature.properties.zoneName}<br>
    메모: ${feature.properties.zoneMemo || '-'}
  `;

  infoPanel.textContent = `행정구역: ${feature.properties.COUNTYNAME} ${feature.properties.TOWNNAME} ${feature.properties.VILLNAME}
우편번호(3자리): ${feature.properties.postcode3}
구역명: ${feature.properties.zoneName}
메모: ${feature.properties.zoneMemo || '-'}`;

  if (popup) popup.remove();
  popup = new mapboxgl.Popup()
    .setLngLat(getFeatureCenter(feature))
    .setHTML(html)
    .addTo(map);
}

function getFeatureCenter(feature) {
  const geometry = feature.geometry;
  const first = geometry.type === 'Polygon'
    ? geometry.coordinates[0][0]
    : geometry.coordinates[0][0][0];
  return first;
}

function runSearch() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!q || !map || !villageData) return;

  const feature = villageData.features.find((f) => {
    return String(f.properties.postcode3).includes(q)
      || String(f.properties.zoneName).toLowerCase().includes(q)
      || String(f.properties.TOWNNAME).toLowerCase().includes(q)
      || String(f.properties.VILLNAME).toLowerCase().includes(q);
  });

  if (!feature) {
    alert('검색 결과가 없습니다.');
    return;
  }

  focusFeature(feature);
  const bounds = new mapboxgl.LngLatBounds();
  addFeatureBounds(feature.geometry, bounds);
  map.fitBounds(bounds, { padding: 50, maxZoom: 12 });
}

function resetView() {
  if (!map) return;
  map.flyTo({ center: [121.50, 25.05], zoom: 9.1 });
  map.setFilter('villages-highlight', ['==', ['get', 'VILLCODE'], '']);
  infoPanel.textContent = '지도를 시작한 뒤 구역을 클릭하세요.';
  if (popup) popup.remove();
}
