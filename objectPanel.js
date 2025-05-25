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
    primitive: [], // 3D-объекты (меши)
    line:      [], // 2D-линии
    other:     [], // всё прочее
  };

  for (const obj of objs) {
    if (obj?.type === 'line') {
      buckets.line.push(obj);
    } else if (obj?.isMesh) {
      buckets.primitive.push(obj);
    } else {
      buckets.other.push(obj);
    }
  }

  // Вывод секции
  function renderSection(label, items) {
    if (items.length === 0) return;

    const header = document.createElement('li');
    header.textContent = `${label} (${items.length})`;
    header.style.fontWeight = 'bold';
    objectListEl.appendChild(header);

    items.forEach((obj, i) => {
      const name = obj.type || obj.constructor?.name || 'Object';
      const li = document.createElement('li');
      li.textContent = `• ${name}`;
      objectListEl.appendChild(li);
    });
  }

  // Отображение в порядке
  renderSection('Примитивы',       buckets.primitive);
  renderSection('Линии',           buckets.line);
  renderSection('Другие объекты',  buckets.other);
}
