// coreCanvas.js
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

import {
  cameraPositions,
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

export function initCanvasScene() {
  const newScene = new THREE.Scene();
  newScene.background = new THREE.Color(0xffffff);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  newScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  newScene.add(directionalLight);

  setScene(newScene);
}

export function initCamera() {
  const newCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  newCamera.position.copy(
    new THREE.Vector3(
      cameraPositions["2D"].x,
      cameraPositions["2D"].y,
      cameraPositions["2D"].z
    )
  );
  setCamera(newCamera);
}

export function initRenderer() {
  const newRenderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("unifiedCanvas"),
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true // ← ОБЯЗАТЕЛЬНО для сохранения изображения!
  });
  newRenderer.setSize(window.innerWidth, window.innerHeight);
  newRenderer.setPixelRatio(window.devicePixelRatio);
  
  setRenderer(newRenderer);

  // Делаем доступным глобально
  window.renderer = newRenderer;

  return newRenderer;
}

export function initControls() {
  const newControls = new OrbitControls(camera, renderer.domElement);
  newControls.enabled = false;
  setControls(newControls);
}

export function createDrawingPlane() {
  const planeGeometry = new THREE.PlaneGeometry(
    window.innerWidth / 40,
    window.innerHeight / 40
  );
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide, // Исправлено!
    transparent: true,
    depthWrite: false,
    // blending: THREE.AdditiveBlending, // если нужен эффект
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(plane);
  setDrawingPlane(plane);
}

export function handleResize() {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

export function animate() {
  requestAnimationFrame(animate);
  controls.update();
  const cameraPosDiv = document.getElementById("cameraPositionDisplay");
  if (cameraPosDiv && camera) {
    const { x, y, z } = camera.position;
    cameraPosDiv.textContent = `Camera: x=${x.toFixed(2)} y=${y.toFixed(2)} z=${z.toFixed(2)}`;
  }
  renderer.render(scene, camera);
}
