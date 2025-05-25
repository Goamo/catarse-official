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

import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { 
  setScene, 
  setCamera, 
  setControls, 
  setRenderer,
  setDrawingPlane,
  scene,
  camera,
  controls,
  renderer
} from './globals.js';

// First, expose all functions to the global scope
Object.assign(window, {
  // Toolbar functions
  toggleBrushDropdown,
  toggleBrushSettings,
  toggleMeshDropdown,
  setBrushType,
  updateBrushThickness,
  setColor,
  updateOpacity,
  updateBrightness,
  updateContrast,
  
  // Drawing mode and layers
  toggleDrawingMode,
  addLayer,
  removeLayer,
  deleteLayer,
  
  // Drawing tools
  undo,
  redo,
  insertPrimitive
});

// Initialize the application when the window loads
window.addEventListener('load', function() {
  // 1) Initialize scene/camera/renderer/controls
  initCanvasScene();
  initCamera();
  initRenderer();
  initControls();
  createDrawingPlane();
  handleResize();

  // 2) Start render loop
  animate();

  // 3) Add first layer
  addLayer();

  // 4) Set up brush settings
  const defaultBrushType = "round";
  setBrushType(defaultBrushType);
  document.querySelectorAll('.brush-item').forEach(item => {
    if (item.dataset.brushType === defaultBrushType) {
      item.classList.add('active');
    }
  });

  // 5) Set up event listeners
  setupEventListeners();

  // Handle window resizing
  window.addEventListener('resize', handleResize);

  console.log("Initialization complete");
});
