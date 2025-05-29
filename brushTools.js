// brushTools.js
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { updateObjectList } from './objectPanel.js';
import * as globals from './globals.js';
import { strokes, redoStack, setRedoStack } from './globals.js';

// Store points for the current stroke
let currentStrokePoints = [];
let strokeMesh = null;
let strokeMaterial = null;
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 16; // Update every 16ms (approximately 60fps)

// Начать рисование по mousedown
export function startDrawing(event) {
  if (event.button !== 0 || globals.layers.length === 0) return;
  
  currentStrokePoints = [];
  const point = getIntersectionPoint(event);
  
  if (point) {
    currentStrokePoints.push(point);
    globals.setStartLine(point);
    globals.setIsDrawing(true);
  }
}

// Рисование по mousemove
export function draw(event) {
  if (!globals.isDrawing || !globals.layers[globals.currentLayerIndex]?.visible) return;

  const currentTime = performance.now();
  if (currentTime - lastUpdateTime < UPDATE_INTERVAL) return;
  lastUpdateTime = currentTime;

  const point = getIntersectionPoint(event);
  if (!point || !globals.startLine) return;

  // Adjust distance threshold based on brush type
  let minDistance = 0.01;
  if (globals.brushType === "watercolor" || globals.brushType === "oil") {
    minDistance = 0.005; // Smaller distance threshold for watercolor and oil
  }

  const distance = globals.startLine.distanceTo(point);
  if (distance < minDistance) return;

  const group = addLineGroup(globals.startLine, point);

  globals.strokes.push({
    start: {
      x: globals.startLine.x,
      y: globals.startLine.y,
      z: globals.startLine.z
    },
    end: {
      x: point.x,
      y: point.y,
      z: point.z
    },
    brushType: globals.brushType,
    currentLayerIndex: globals.currentLayerIndex
  });

  globals.setRedoStack([]);
  globals.setStartLine(point.clone());

  globals.layerObjects[globals.currentLayerIndex] = 
    globals.layerObjects[globals.currentLayerIndex] || [];
  globals.layerObjects[globals.currentLayerIndex].push(group);
  updateObjectList();
}

// Остановка рисования
export function stopDrawing() {
  globals.setIsDrawing(false);
  globals.setStartLine(null);
}

function getIntersectionPoint(event) {
  const rect = event.target.getBoundingClientRect();
  globals.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  globals.mouse.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
  globals.raycaster.setFromCamera(globals.mouse, globals.camera);

  if (globals.currentMode === "2D") {
    const intersects = globals.raycaster.intersectObject(globals.drawingPlane);
    return intersects.length ? new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, 0) : null;
  } else {
    // In 3D mode, create a dynamic plane that:
    // 1. Is parallel to the camera's view
    // 2. Passes through either:
    //    a. The last point if we're continuing a stroke
    //    b. A point 5 units in front of the camera if starting a new stroke
    const planeNormal = globals.camera.getWorldDirection(new THREE.Vector3());
    let planePoint;
    
    if (globals.startLine) {
      // If we have a previous point, make the plane pass through it
      planePoint = globals.startLine;
    } else {
      // For a new stroke, position the plane at a comfortable distance from the camera
      planePoint = globals.camera.position.clone().add(planeNormal.clone().multiplyScalar(5));
    }
    
    const dynPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
    const intersection = new THREE.Vector3();
    
    if (globals.raycaster.ray.intersectPlane(dynPlane, intersection)) {
      return intersection;
    }
    return null;
  }
}

function updateStrokeMesh() {
  if (currentStrokePoints.length < 2) return;

  // Create or update the stroke geometry
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(currentStrokePoints.length * 3);
  
  currentStrokePoints.forEach((point, i) => {
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
  });
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // Create or update the mesh
  if (!strokeMesh) {
    strokeMesh = new THREE.Line(geometry, strokeMaterial);
    globals.scene.add(strokeMesh);
  } else {
    strokeMesh.geometry.dispose();
    strokeMesh.geometry = geometry;
  }
}

// Undo / Redo
export function undo() {
  if (strokes.length > 0) {
    const lastStroke = strokes.pop();
    redoStack.push(lastStroke);
    redrawCanvas();
  }
}

export function redo() {
  if (redoStack.length > 0) {
    const strokeToRedo = redoStack.pop();
    strokes.push(strokeToRedo);
    redrawCanvas();
  }
}

// Полная перерисовка по истории
function redrawCanvas() {
  // Удаляем всё, кроме фонового объекта (предполагается, что он стоит на позиции 0)
  while (globals.scene.children.length > 1) {
    const obj = globals.scene.children[1];

    // Рекурсивно освобождаем геометрию и материалы всех потомков
    obj.traverse(child => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    globals.scene.remove(obj);
  }

  // Сброс массива layerObjects
  globals.layerObjects.length = 0;

  // Перерисовываем все штрихи из истории
  globals.strokes.forEach(stroke => {
    // Пропускаем скрытые слои
    if (!globals.layers[stroke.currentLayerIndex]?.visible) return;

    const start = new THREE.Vector3(
      stroke.start.x, stroke.start.y, stroke.start.z
    );
    const end = new THREE.Vector3(
      stroke.end.x, stroke.end.y, stroke.end.z
    );

    const grp = addLineGroup(start, end);

    globals.layerObjects[stroke.currentLayerIndex] =
      globals.layerObjects[stroke.currentLayerIndex] || [];
    globals.layerObjects[stroke.currentLayerIndex].push(grp);
  });
  
  updateObjectList();
}

function redrawStrokes() {
  // Clear existing strokes
  globals.scene.children.forEach(child => {
    if (child instanceof THREE.Line) {
      child.geometry.dispose();
      child.material.dispose();
      globals.scene.remove(child);
    }
  });

  // Redraw all strokes
  strokes.forEach(stroke => {
    const points = stroke.points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    
    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
      color: stroke.settings.color,
      opacity: stroke.settings.opacity,
      transparent: true,
      linewidth: stroke.settings.thickness
    });
    
    const mesh = new THREE.Line(geometry, material);
    globals.scene.add(mesh);
    
    if (!globals.layerObjects[stroke.currentLayerIndex]) {
      globals.layerObjects[stroke.currentLayerIndex] = [];
    }
    globals.layerObjects[stroke.currentLayerIndex].push(mesh);
  });
  
  updateObjectList();
}

// Функция создания линии/мазка
function addLineGroup(startPoint, endPoint) {
  const settings = globals.brushSettings[globals.brushType];
  const group = new THREE.Group();

  if (globals.brushType === "spray") {
    group.add(addSpray(endPoint, settings));
  } else if (globals.brushType === "watercolor") {
    group.add(addWatercolor(endPoint, settings));
  } else if (globals.brushType === "oil") {
    group.add(addOil(endPoint, settings));
  } else {
    const points = [];
    const numPts = 10;
    for (let i = 0; i <= numPts; i++) {
      const t = i / numPts;
      points.push(new THREE.Vector3(
        startPoint.x + (endPoint.x - startPoint.x) * t,
        startPoint.y + (endPoint.y - startPoint.y) * t,
        startPoint.z + (endPoint.z - startPoint.z) * t  // Interpolate Z coordinate
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
    const material = new THREE.LineBasicMaterial({
      color: settings.color,
      opacity: settings.opacity,
      transparent: true
    });
    const lineMesh = new THREE.Line(geometry, material);
    lineMesh.renderOrder = 1;
    group.add(lineMesh);

    if (settings.thickness > 2) {
      for (let i = 0; i < points.length; i += 2) {
        const sph = new THREE.Mesh(
          new THREE.SphereGeometry(settings.thickness / 100, 8, 8),
          new THREE.MeshBasicMaterial({
            color: settings.color,
            opacity: settings.opacity,
            transparent: true
          })
        );
        sph.position.copy(points[i]);
        sph.renderOrder = 1;
        group.add(sph);
      }
    }
  }

  group.renderOrder = 1;
  globals.scene.add(group);
  return group;
}

function addSpray(point, settings) {
  const coords = [];
  for (let i = 0; i < settings.sprayDensity; i++) {
    coords.push(
      point.x + (Math.random() - 0.5) * settings.sprayRadius / 50,
      point.y + (Math.random() - 0.5) * settings.sprayRadius / 50,
      point.z + (Math.random() - 0.5) * settings.sprayRadius / 50  // Add Z variation for 3D spray
    );
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(coords, 3)
  );
  const points = new THREE.Points(
    geom,
    new THREE.PointsMaterial({
      color: settings.color,
      size: settings.thickness / 10,
      opacity: settings.opacity,
      transparent: true,
      sizeAttenuation: true  // Enable size attenuation for 3D effect
    })
  );
  return points;
}

// Cache materials for reuse
const materialCache = {
  watercolor: new Map(),
  oil: new Map()
};

function getWatercolorMaterial(settings) {
  const key = `${settings.color}-${settings.opacity}`;
  if (!materialCache.watercolor.has(key)) {
    const material = new THREE.MeshBasicMaterial({
      color: settings.color,
      transparent: true,
      opacity: settings.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true
    });
    materialCache.watercolor.set(key, material);
  }
  return materialCache.watercolor.get(key);
}

function getOilMaterial(settings) {
  const key = `${settings.color}-${settings.opacity}`;
  if (!materialCache.oil.has(key)) {
    const material = new THREE.MeshBasicMaterial({
      color: settings.color,
      transparent: true,
      opacity: settings.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true
    });
    materialCache.oil.set(key, material);
  }
  return materialCache.oil.get(key);
}

function addWatercolor(point, settings) {
  const geom = new THREE.CircleGeometry(settings.spread / 30, 32);
  const mesh = new THREE.Mesh(geom, getWatercolorMaterial(settings));
  mesh.position.copy(point);  // Use full 3D position
  mesh.renderOrder = 1;
  
  // Make the watercolor circle face the camera
  if (globals.currentMode === "3D") {
    mesh.lookAt(globals.camera.position);
  }
  
  return mesh;
}

function addOil(point, settings) {
  const geom = new THREE.CircleGeometry(settings.thickness / 20, 32);
  const mesh = new THREE.Mesh(geom, getOilMaterial(settings));
  mesh.position.copy(point);  // Use full 3D position
  mesh.renderOrder = 1;
  
  // Make the oil stroke face the camera
  if (globals.currentMode === "3D") {
    mesh.lookAt(globals.camera.position);
  }
  
  return mesh;
}
