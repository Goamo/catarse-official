// objectPanel.js
import { layerObjects, currentLayerIndex } from './globals.js';

/**
 * Обновляет список объектов в интерфейсе.
 * Показывает отдельно примитивы, линии и другие объекты.
 */
export function updateObjectList() {
  const objectListEl = document.getElementById('objectList');
  if (!objectListEl) return;

  objectListEl.innerHTML = ''; // очищаем

  const objs = layerObjects[currentLayerIndex] || [];

  if (objs.length === 0) {
    const li = document.createElement('li');
    li.textContent = '— Нет объектов —';
    objectListEl.appendChild(li);
    return;
  }

  // Группировка объектов
  const buckets = {
    primitive: [],
    line:      [],
    other:     [],
  };

  function classifyObject(obj) {
  // 👇 Специальный случай — "виртуальные" линии
  if (obj?.type === 'line' && typeof obj.x1 === 'number' && typeof obj.x2 === 'number') {
    return 'line';
  }

  const tagged = obj.userData?.type;
  if (tagged) return tagged;

  if (obj.type === 'Group') {
    const children = obj.children;

    if (children.length === 1 && children[0].type === 'Line') {
      return 'line';
    }

    if (children.some(child => child.isMesh)) {
      return 'primitive';
    }

    if (children.some(child => child.type === 'Points')) {
      return 'primitive';
    }

    return 'group';
  }

  if (obj.type === 'Line') return 'line';
  if (obj.isMesh) return 'primitive';
  return 'other';
}


  for (const obj of objs) {
    const type = classifyObject(obj);

    if (type === 'line') buckets.line.push(obj);
    else if (type === 'primitive') buckets.primitive.push(obj);
    else buckets.other.push(obj);
  }

  // Словарь читаемых названий
  const typeNames = {
  line:       'Line Stroke',
  spray:      'Spray',
  watercolor: 'Watercolor',
  oil:        'Oil',
  eraser:     'Eraser',
  group:      'Group',
  primitive:  'Primitive',
  other:      'Object'
};


  // Вывод секции
  function renderSection(label, items) {
    if (items.length === 0) return;

    const header = document.createElement('li');
    header.textContent = `${label} (${items.length})`;
    header.style.fontWeight = 'bold';
    objectListEl.appendChild(header);

    items.forEach((obj) => {
      const tag = obj.userData?.type;
      const name = tag && typeNames[tag]
        ? typeNames[tag]
        : obj.type || obj.constructor?.name || 'Object';

      const li = document.createElement('li');
      li.textContent = `• ${name}`;
      objectListEl.appendChild(li);
    });
  }

  // Отображение в порядке
  renderSection('Примитивы',      buckets.primitive);
  renderSection('Линии',          buckets.line);
  renderSection('Другие объекты', buckets.other);
}
