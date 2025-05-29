// controls.js
import {
  controls,
  currentMode,
  drawingPlane,
  setCurrentMode,
  camera,
  cameraPositions
} from './globals.js';
import { startDrawing, draw, stopDrawing } from './brushTools.js';
import { enableDragAndDropWithKey } from './dragWithKey.js';

let isShiftPressed = false;

export function setupEventListeners() {
  const canvas = document.getElementById("unifiedCanvas");

  // Initialize drag and drop functionality
  enableDragAndDropWithKey();

  // Рисование
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  document.addEventListener("mouseup", stopDrawing);
  document.addEventListener("mouseleave", stopDrawing);

  // Правый клик + Shift → вращение камеры
  canvas.addEventListener("contextmenu", handleRightClick);

  // Shift для включения OrbitControls
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup",   onKeyUp);
}

function onKeyDown(event) {
  if (event.key === "Shift") {
    isShiftPressed = true;
    if (currentMode === "3D") controls.enabled = true;
    updateMouseIndicator();
  }
}

function onKeyUp(event) {
  if (event.key === "Shift") {
    isShiftPressed = false;
    controls.enabled = false;
    updateMouseIndicator();
  }
}

function handleRightClick(event) {
  event.preventDefault();
  if (currentMode === "3D" && isShiftPressed) {
    startCameraRotation();
  }
}

function startCameraRotation() {
  controls.enabled = true;

  const onMouseMove = () => controls.update();
  const onMouseUp   = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup",   onMouseUp);
    if (currentMode !== "3D") controls.enabled = false;
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup",   onMouseUp);
}

function updateMouseIndicator() {
  const indicator = document.getElementById("mouseIndicator");
  if (!indicator) return;
  if (currentMode === "3D" && isShiftPressed) {
    indicator.textContent = "Режим: Вращение камеры";
    indicator.style.backgroundColor = "#FF9800";
  } else {
    indicator.textContent = "Режим: Рисование";
    indicator.style.backgroundColor = "#4CAF50";
  }
}

export function toggleDrawingMode() {
  const button = document.getElementById("toggleModeButton");

  if (currentMode === "2D") {
    setCurrentMode("3D");
    button.textContent = "Переключить на 2D";
    drawingPlane.visible = false;
    controls.enabled = false;

    anime({
      targets: camera.position,
      x: cameraPositions["3D"].x,
      y: cameraPositions["3D"].y,
      z: cameraPositions["3D"].z,
      duration: 1000,
      easing: 'easeOutQuad'
    });

    document.getElementById("mouseIndicator").style.display = "block";
    updateMouseIndicator();
  } else {
    setCurrentMode("2D");
    button.textContent = "Переключить на 3D";
    drawingPlane.rotation.set(0, 0, 0);
    drawingPlane.position.set(0, 0, 0);
    drawingPlane.visible = true;
    controls.enabled = false;

    anime({
      targets: camera.position,
      x: cameraPositions["2D"].x,
      y: cameraPositions["2D"].y,
      z: cameraPositions["2D"].z,
      duration: 1000,
      easing: 'easeOutQuad',
      complete: () => camera.lookAt(0, 0, 0)
    });

    document.getElementById("mouseIndicator").style.display = "none";
  }
}
