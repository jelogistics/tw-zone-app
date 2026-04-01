
let zones = [];
let selectedIndex = 0;

const zoneSelect = document.getElementById('zoneSelect');
const zoneId = document.getElementById('zoneId');
const zoneName = document.getElementById('zoneName');
const zoneColor = document.getElementById('zoneColor');
const postalCodes = document.getElementById('postalCodes');
const zoneMemo = document.getElementById('zoneMemo');
const jsonPreview = document.getElementById('jsonPreview');

init();

async function init() {
  const res = await fetch('./data/zones-tw.json');
  zones = await res.json();
  renderSelect();
  loadZone(0);
  bindEvents();
}

function bindEvents() {
  zoneSelect.addEventListener('change', () => loadZone(Number(zoneSelect.value)));
  document.getElementById('newZoneBtn').addEventListener('click', createZone);
  document.getElementById('saveZoneBtn').addEventListener('click', saveZone);
  document.getElementById('deleteZoneBtn').addEventListener('click', deleteZone);
  document.getElementById('downloadBtn').addEventListener('click', downloadJson);
}

function renderSelect() {
  zoneSelect.innerHTML = '';
  zones.forEach((zone, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = `${zone.zoneName} (${zone.zoneId})`;
    zoneSelect.appendChild(option);
  });
  updatePreview();
}

function loadZone(index) {
  selectedIndex = index;
  const zone = zones[index];
  if (!zone) return;
  zoneSelect.value = index;
  zoneId.value = zone.zoneId;
  zoneName.value = zone.zoneName;
  zoneColor.value = zone.color;
  postalCodes.value = zone.postalCodes.join(', ');
  zoneMemo.value = zone.memo || '';
}

function createZone() {
  zones.push({
    zoneId: `TW_ZONE_${String(zones.length + 1).padStart(3, '0')}`,
    zoneName: '새 구역',
    color: '#999999',
    postalCodes: [],
    memo: ''
  });
  renderSelect();
  loadZone(zones.length - 1);
}

function saveZone() {
  zones[selectedIndex] = {
    zoneId: zoneId.value.trim(),
    zoneName: zoneName.value.trim(),
    color: zoneColor.value,
    postalCodes: postalCodes.value
      .split(',')
      .map(v => v.trim())
      .filter(Boolean),
    memo: zoneMemo.value.trim()
  };
  renderSelect();
  loadZone(selectedIndex);
  alert('브라우저 안에서 수정되었습니다. 마지막으로 JSON 다운로드를 눌러 저장하세요.');
}

function deleteZone() {
  if (!confirm('현재 구역을 삭제할까요?')) return;
  zones.splice(selectedIndex, 1);
  renderSelect();
  loadZone(0);
}

function updatePreview() {
  jsonPreview.textContent = JSON.stringify(zones, null, 2);
}

function downloadJson() {
  updatePreview();
  const blob = new Blob([JSON.stringify(zones, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'zones-tw.json';
  a.click();
  URL.revokeObjectURL(url);
}
