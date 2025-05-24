// draw.js
import { scene, layerObjects, currentLayerIndex, raycaster, mouse, camera } from './globals.js';
import { brushSettings, brushType } from './brushTools.js';
import { ctx } from './coreCanvas.js';

/**
 * Рисует линию (или стирает) и обновляет список объектов слоя.
 * @param {number} x1 - начальная точка X
 * @param {number} y1 - начальная точка Y
 * @param {number} x2 - конечная точка X
 * @param {number} y2 - конечная точка Y
 */
export function drawLine(x1, y1, x2, y2) {
  const settings = brushSettings[brushType] ?? {};

  // ✅ Гарантируем, что массив объектов текущего слоя существует
  if (!Array.isArray(layerObjects[currentLayerIndex])) {
    layerObjects[currentLayerIndex] = [];
  }

  // 🧽 Стиратель
  if (brushType === "eraser") {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(layerObjects[currentLayerIndex]);
    intersects.forEach(({ object }) => {
      scene.remove(object);
      layerObjects[currentLayerIndex] = layerObjects[currentLayerIndex]
        .filter(o => o !== object);
    });
    return;
  }

  // ✏️ Рисуем обычную линию на canvas
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha              = settings.opacity ?? 1.0;
  ctx.strokeStyle              = settings.color   ?? "#000000";
  ctx.lineWidth                = settings.thickness ?? 10;
  ctx.lineCap                  = "round";
  ctx.lineJoin                 = "round";

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha              = 1.0;

  // ➕ Добавляем виртуальный объект линии в список слоя
  const lineObj = {
    type: 'line',
    x1, y1, x2, y2,
    settings: { ...settings },
    constructor: { name: 'Line' } // Нужно для корректного отображения в objectPanel
  };

  layerObjects[currentLayerIndex].push(lineObj);
}
