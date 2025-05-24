// brushTools.js
import { updateObjectList } from './objectPanel.js';
import * as globals from './globals.js';

// Начать рисование по mousedown
export function startDrawing(event) {
  if (event.button !== 0 || globals.layers.length === 0) return;
  const rect = event.target.getBoundingClientRect();
  globals.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  globals.mouse.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
  globals.raycaster.setFromCamera(globals.mouse, globals.camera);

  let finalPoint = null;
  if (globals.currentMode === "2D") {
    const intersects = globals.raycaster.intersectObject(globals.drawingPlane);
    if (intersects.length) {
      finalPoint = new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, 0);
    }
  } else {
    const planeNormal  = globals.camera.getWorldDirection(new THREE.Vector3());
    const planePoint   = globals.camera.position.clone().add(planeNormal.clone().multiplyScalar(5));
    const dynPlane     = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
    const intersection = new THREE.Vector3();
    if (globals.raycaster.ray.intersectPlane(dynPlane, intersection)) {
      finalPoint = intersection;
    }
  }

  if (finalPoint) {
    globals.setStartLine(finalPoint);
    globals.setIsDrawing(true);

    // ✅ СОЗДАЁМ ЕДИНУЮ ГРУППУ ДЛЯ ВСЕГО МАЗКА
  const strokeGroup = new THREE.Group();
  strokeGroup.userData.type = "line"; // 👈 ВАЖНО
  globals.scene.add(strokeGroup);
  setCurrentStrokeGroup(strokeGroup);
  }
}

// Рисование по mousemove
export function draw(event) {
  if (!globals.isDrawing ||
      globals.layers.length === 0 ||
      !globals.layers[globals.currentLayerIndex]?.visible) {
    return;
  }

  const rect = event.target.getBoundingClientRect();
  globals.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  globals.mouse.y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
  globals.raycaster.setFromCamera(globals.mouse, globals.camera);

  let nextPoint = null;
  if (globals.currentMode === "2D") {
    const intr = globals.raycaster.intersectObject(globals.drawingPlane);
    if (intr.length) {
      nextPoint = new THREE.Vector3(intr[0].point.x, intr[0].point.y, 0);
    }
  } else {
    const planeNormal  = globals.camera.getWorldDirection(new THREE.Vector3());
    const planePoint   = globals.camera.position.clone().add(planeNormal.clone().multiplyScalar(5));
    const dynPlane     = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, planePoint);
    const intersection = new THREE.Vector3();
    if (globals.raycaster.ray.intersectPlane(dynPlane, intersection)) {
      nextPoint = intersection;
    }
  }

  if (nextPoint && globals.startLine) {
    const distance = globals.startLine.distanceTo(nextPoint);
    if (distance < 0.01) return; // не рисуем, если точка почти не сдвинулась

  const group = addLineGroup(globals.startLine, nextPoint);




    globals.strokes.push({
      start: {
        x: globals.startLine.x,
        y: globals.startLine.y,
        z: globals.startLine.z
      },
      end: {
        x: nextPoint.x,
        y: nextPoint.y,
        z: nextPoint.z
      },
      brushType: globals.brushType,
      currentLayerIndex: globals.currentLayerIndex
    });

    globals.setRedoStack([]);
    globals.setStartLine(nextPoint.clone());

    
  }
}

// Остановка рисования
export function stopDrawing() {
  globals.setIsDrawing(false);
  globals.setStartLine(null);
  // Если текущая группа-штрих существует, добавляем её в объекты слоя
  if (globals.currentStrokeGroup) {
    // Убедимся, что массив объектов для текущего слоя существует
    globals.layerObjects[globals.currentLayerIndex] =
      globals.layerObjects[globals.currentLayerIndex] || [];

    // Добавляем один штрих-группу
    globals.layerObjects[globals.currentLayerIndex].push(globals.currentStrokeGroup);

    // Обновляем список объектов в UI
    updateObjectList();

    // Сброс текущей группы
    globals.setCurrentStrokeGroup(null);
  }
}

// Undo / Redo
export function undo() {
  if (globals.strokes.length) {
    const last = globals.strokes.pop();
    globals.setRedoStack([...globals.redoStack, last]);
    redrawCanvas();
  }
}

export function redo() {
  if (globals.redoStack.length) {
    const restored = globals.redoStack.pop();
    globals.strokes.push(restored);
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

    // ЛОГ после очистки сцены
  console.log("=== Scene children after clearing ===");
  globals.scene.children.forEach((child, i) => {
    console.log(`[${i}] ${child.type}`, child);
  });
  console.log("=== End of scene children log ===");
  

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
    
  });
  // ЛОГ после перерисовки
  console.log("=== Scene children after redraw ===");
  globals.scene.children.forEach((child, i) => {
    console.log(`[${i}] ${child.type}`, child);
  });
  console.log("=== End of scene children log ===");
}


// Функция создания линии/мазка
function addLineGroup(startPoint, endPoint) {
  const settings = globals.brushSettings[globals.brushType];
  const group    = new THREE.Group();
  group.userData.type = 'line'; // <- ВСТАВИТЬ ЗДЕСЬ

  if (globals.brushType === "spray") {
    group.add(addSpray(endPoint, settings));
  } else if (globals.brushType === "watercolor") {
    group.add(addWatercolor(endPoint, settings));
  } else if (globals.brushType === "oil") {
    group.add(addOil(endPoint, settings));
  } else {
    // простая линия
    const points = [];
    const numPts = 10;
    for (let i = 0; i <= numPts; i++) {
      const t = i / numPts;
      points.push(new THREE.Vector3(
        startPoint.x + (endPoint.x - startPoint.x) * t,
        startPoint.y + (endPoint.y - startPoint.y) * t,
        startPoint.z + (endPoint.z - startPoint.z) * t
      ));
    }

    const curve    = new THREE.CatmullRomCurve3(points);
    const geo      = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
    const mat      = new THREE.LineBasicMaterial({
      color:     settings.color,
      opacity:   settings.opacity,
      transparent: true
    });
    const lineMesh = new THREE.Line(geo, mat);
    group.add(lineMesh);

    if (settings.thickness > 2) {
      for (let i = 0; i < points.length; i += 2) {
        const sph = new THREE.Mesh(
          new THREE.SphereGeometry(settings.thickness / 100, 8, 8),
          new THREE.MeshBasicMaterial({
            color:       settings.color,
            opacity:     settings.opacity,
            transparent: true
          })
        );
        sph.position.copy(points[i]);
        group.add(sph);
      }
    }
  }

  globals.scene.add(group);
  return group;
}

// Эффекты
function addSpray(point, settings) {
  const coords = [];
  for (let i = 0; i < settings.sprayDensity; i++) {
    coords.push(
      point.x + (Math.random() - 0.5) * settings.sprayRadius / 50,
      point.y + (Math.random() - 0.5) * settings.sprayRadius / 50,
      globals.currentMode === "3D"
        ? (Math.random() - 0.5) * settings.sprayRadius / 50
        : 0
    );
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(coords, 3)
  );
  return new THREE.Points(
    geom,
    new THREE.PointsMaterial({
      color:       settings.color,
      size:        settings.thickness / 10,
      opacity:     settings.opacity,
      transparent: true
    })
  );
}

function addWatercolor(point, settings) {
  const geom = new THREE.CircleGeometry(settings.spread / 50, 32);
  const mat  = new THREE.MeshBasicMaterial({
    color:       settings.color,
    transparent: true,
    opacity:     settings.opacity,
    side:        THREE.DoubleSide,
    blending:    THREE.NormalBlending,
    depthWrite:  false,
    depthTest:   false
  });
  const mesh = new THREE.Mesh(geom, mat);
  if (globals.currentMode === "3D") mesh.lookAt(globals.camera.position);
  mesh.position.set(point.x, point.y, point.z);
  return mesh;
}

function addOil(point, settings) {
  const geom     = new THREE.CircleGeometry(settings.thickness / 30, 32);
  const matProps = {
    color:       settings.color,
    transparent: true,
    opacity:     settings.opacity,
    side:        THREE.DoubleSide
  };
  if (settings.blending) {
    matProps.blending      = THREE.CustomBlending;
    matProps.blendSrc      = THREE.SrcAlphaFactor;
    matProps.blendDst      = THREE.OneMinusSrcAlphaFactor;
    matProps.blendEquation = THREE.AddEquation;
  }
  const mesh = new THREE.Mesh(geom, new THREE.MeshBasicMaterial(matProps));
  if (globals.currentMode === "3D") mesh.lookAt(globals.camera.position);
  mesh.position.set(point.x, point.y, point.z);
  return mesh;
}
