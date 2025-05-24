// index.js
import {
  initCanvasScene,
  initCamera,
  initRenderer,
  initControls,
  createDrawingPlane,
  handleResize,
  animate
} from './coreCanvas.js';

import {
  startDrawing,
  draw,
  stopDrawing,
  undo,
  redo
} from './brushTools.js';

import { insertPrimitive } from './primitives.js';

import {
  setupEventListeners,
  toggleDrawingMode
} from './controls.js';

import { addLayer, removeLayer, deleteLayer } from './layers.js';
import {
  toggleBrushDropdown,
  toggleBrushSettings,
  toggleMeshDropdown,
  setBrushType,
  updateBrushThickness,
  setColor,
  updateOpacity,
  updateBrightness,
  updateContrast
} from './toolbar.js';

window.onload = function () {
  // A) Навешиваем глобальные слушатели из controls.js
  setupEventListeners();

  // 1) Инициализация сцены/камеры/рендера/контролов
  initCanvasScene();
  initCamera();
  initRenderer();
  initControls();
  createDrawingPlane();
  handleResize();

  // 2) Запуск цикла отрисовки
  animate();

  // 3) Добавление первого слоя
  addLayer();

  // 4) Настройка кистей из тулбара
  const defaultBrushType = "round";
  setBrushType(defaultBrushType);
  document.querySelectorAll('.brush-item').forEach(item => {
    if (item.dataset.brushType === defaultBrushType) {
      item.classList.add('active');
    }
  });

  // 5) Экспорт функций в window для inline-атрибутов
  window.toggleBrushDropdown   = toggleBrushDropdown;
  window.toggleBrushSettings   = toggleBrushSettings;
  window.toggleMeshDropdown    = toggleMeshDropdown;
  window.setBrushType          = setBrushType;
  window.updateBrushThickness  = updateBrushThickness;
  window.setColor              = setColor;
  window.updateOpacity         = updateOpacity;
  window.updateBrightness      = updateBrightness;
  window.updateContrast        = updateContrast;

  window.toggleDrawingMode     = toggleDrawingMode;
  window.addLayer              = addLayer;
  window.removeLayer           = removeLayer;
  window.deleteLayer           = deleteLayer;
  window.undo                  = undo;
  window.redo                  = redo;
  window.insertPrimitive       = insertPrimitive;

  console.log("Инициализация завершена");
};
