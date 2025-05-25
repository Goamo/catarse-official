import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';

export let isDrawing = false;
export let ctx;
export let brushType = "round";
export let brushColor = "#000000";
export let strokes = [];
export let redoStack = [];
export let layers = [];
export let currentLayerIndex = 0;
export let brightness = 0;
export let contrast = 0;
export let startLine = null;
export let renderer;
export let camera;
export let controls;
export let scene;
export let raycaster = new THREE.Raycaster();
export let mouse = new THREE.Vector2();
export let currentMode = "2D";
export let drawingPlane; 
export let layerObjects = {};

export let brushSettings = {
  round: {
    thickness: 10,
    color: "#000000",
    opacity: 1.0
  },
  square: {
    thickness: 10,
    color: "#000000",
    opacity: 1.0
  },
  spray: {
    thickness: 5,
    color: "#000000",
    opacity: 0.5,
    sprayRadius: 10,
    sprayDensity: 30
  },
  watercolor: {
    thickness: 20,
    color: "#000000",
    opacity: 0.3,
    spread: 15,
    blending: true
  },
  oil: {
    thickness: 15,
    color: "#000000",
    opacity: 0.8,
    blendMode: "multiply"   // ✅ blending mode for the oil brush
  },
  eraser: {
    thickness: 20,
    color: "#ffffff",
    opacity: 1.0
  }
};


export function setCtx(value) { ctx = value; }
export function setScene(value) { scene = value; }
export function setCamera(value) { camera = value; }
export function setControls(value) { controls = value; }
export function setRenderer(value) { renderer = value; }
export function setStartLine(value) { startLine = value; }
export function setIsDrawing(value) { isDrawing = value; }
export function setBrushType(value) {
  brushType = value;

  if (value !== "eraser") {
    brushSettings[value].color = brushColor;
  }
}
export function setBrushColor(value) {
  brushColor = value;

  if (brushType !== "eraser") {
    brushSettings[brushType].color = value;
  }
}

export function setCurrentMode(value) { currentMode = value; }
export function setRedoStack(value) { redoStack = value; }
export function setBrightness(value) { brightness = value; }
export function setContrast(value) { contrast = value; }
export function setDrawingPlane(value) { 
    drawingPlane = value;
}

export function setCurrentLayerIndex(value) { 
    currentLayerIndex = value; 
    if (!layerObjects[value]) {
        layerObjects[value] = [];
    }
}

export const cameraPositions = {
    "2D": { x: -1.04, y: -1.31, z: 13.50 },
    "3D": { x: 0.00, y: 0.01, z: 10.00 }
};

export function setCameraMode(mode) {
    const pos = cameraPositions[mode];
    camera.position.set(pos.x, pos.y, pos.z);
    camera.lookAt(0, 0, 0);
}

// Add window resize handler
export function handleResize() {
    const pos = cameraPositions[currentMode];
    if (pos.orthographic) {
        const aspect = window.innerWidth / window.innerHeight;
        const frustum = pos.frustum;
        camera.left = -frustum * aspect;
        camera.right = frustum * aspect;
        camera.top = frustum;
        camera.bottom = -frustum;
        camera.updateProjectionMatrix();
    } else {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
}