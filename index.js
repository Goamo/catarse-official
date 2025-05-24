import { initCanvas, setupEventListeners, undo, redo, toggleDrawingMode } from './canvas.js';
import { addLayer, removeLayer, deleteLayer } from './layers.js';
import {
  toggleBrushDropdown,
  toggleBrushSettings,
  setBrushType,
  updateBrushThickness,
  setColor,
  updateOpacity,
  updateBrightness,
  updateContrast
} from './toolbar.js';

window.onload = function () {
  initCanvas();
  addLayer();

  const defaultBrushType = "round";
  setBrushType(defaultBrushType);
  
  document.querySelectorAll('.brush-item').forEach(item => {
    if (item.getAttribute('data-brush-type') === defaultBrushType) {
      item.classList.add('active');
    }
  });

  window.toggleBrushDropdown = toggleBrushDropdown;
  window.toggleBrushSettings = toggleBrushSettings;
  window.setBrushType = setBrushType;
  window.updateBrushThickness = updateBrushThickness;
  window.setColor = setColor;
  window.updateOpacity = updateOpacity;
  window.updateBrightness = updateBrightness;
  window.updateContrast = updateContrast;
  window.toggleDrawingMode = toggleDrawingMode;
  window.addLayer = addLayer;
  window.removeLayer = removeLayer;
  window.deleteLayer = deleteLayer;
  window.undo = undo;
  window.redo = redo;
  
  console.log("Инициализация завершена");
}