// primitives.js
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { scene, camera, layerObjects, currentLayerIndex } from './globals.js';
import { updateObjectList } from './objectPanel.js';

export function insertPrimitive(type) {
  let geometry, material, mesh;
  const color = document.getElementById('primitiveColor').value;

  switch (type) {
    case "cube": geometry = new THREE.BoxGeometry(1,1,1); break;
    case "sphere": geometry = new THREE.SphereGeometry(0.5,32,32); break;
    case "cylinder": geometry = new THREE.CylinderGeometry(0.5,0.5,1,32); break;
    case "cone": geometry = new THREE.ConeGeometry(0.5,1,32); break;
    case "torus": geometry = new THREE.TorusGeometry(0.5,0.2,16,100); break;
    case "plane": geometry = new THREE.PlaneGeometry(1,1); break;
    case "square":
      geometry = shapeGeometry([-0.5,-0.5, 0.5,-0.5, 0.5,0.5, -0.5,0.5]);
      break;
    case "rectangle":
      geometry = shapeGeometry([-1,-0.5, 1,-0.5, 1,0.5, -1,0.5]);
      break;
    case "triangle":
      geometry = shapeGeometry([0,0.5, -0.5,-0.5, 0.5,-0.5]);
      break;
    case "equilateralTriangle":
      {
        const size = 1, h = Math.sqrt(3)/2 * size;
        geometry = shapeGeometry([-size/2, -h/3,  size/2, -h/3,  0, 2*h/3]);
      }
      break;
    case "circle":
      geometry = new THREE.CircleGeometry(0.5,64);
      break;
    case "ellipse":
      geometry = new THREE.ShapeGeometry(
        new THREE.Shape().absellipse(0,0,0.7,0.4,0,Math.PI*2)
      );
      break;
    case "star": geometry = starGeometry(); break;
    case "hexagon": geometry = polygonGeometry(6, 0.5); break;
    case "semicircle": geometry = semicircleGeometry(); break;
    case "ring": geometry = new THREE.RingGeometry(0.3,0.5,64); break;
    default:
      console.warn("Unknown primitive:", type);
      return;
  }

  material = new THREE.MeshPhongMaterial({ 
    color: color,
    side: THREE.DoubleSide
  });

  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  // Add to current layer
  if (!layerObjects[currentLayerIndex]) {
    layerObjects[currentLayerIndex] = [];
  }
  layerObjects[currentLayerIndex].push(mesh);

  updateObjectList();

  return mesh;
}

// Вспомогательные генераторы геометрии
function shapeGeometry(coords) {
  const shape = new THREE.Shape();
  shape.moveTo(coords[0], coords[1]);
  for (let i = 2; i < coords.length; i += 2) {
    shape.lineTo(coords[i], coords[i + 1]);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function polygonGeometry(sides, radius) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= sides; i++) {
    const ang = (i / sides) * Math.PI * 2;
    const x = Math.cos(ang) * radius;
    const y = Math.sin(ang) * radius;
    if (i === 0) shape.moveTo(x, y);
    else          shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function starGeometry() {
  const shape = new THREE.Shape();
  const outer = 0.5, inner = 0.2, spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const ang = (i * Math.PI) / spikes;
    const r = (i % 2 === 0 ? outer : inner);
    const x = Math.cos(ang) * r;
    const y = Math.sin(ang) * r;
    if (i === 0) shape.moveTo(x, y);
    else         shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

function semicircleGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.absarc(0, 0, 0.5, Math.PI, 0, false);
  shape.lineTo(-0.5, 0);
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}
