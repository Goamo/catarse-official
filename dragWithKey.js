import * as THREE from 'three';
import { scene, camera, renderer } from './globals.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;
const dragPlane = new THREE.Plane();
const intersection = new THREE.Vector3();
const offset = new THREE.Vector3();

let isTPressed = false;

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 't') {
    isTPressed = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key.toLowerCase() === 't') {
    isTPressed = false;
  }
});

function onMouseDown(event) {
  if (event.button !== 0 || !isTPressed) return;

  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    selectedObject = intersects[0].object;

    dragPlane.setFromNormalAndCoplanarPoint(
      camera.getWorldDirection(new THREE.Vector3()).clone().negate(),
      selectedObject.position
    );

    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
      offset.copy(intersection).sub(selectedObject.position);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }
}

function onMouseMove(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
    selectedObject.position.copy(intersection.sub(offset));
  }
}

function onMouseUp(event) {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
  selectedObject = null;
}

function enableDragAndDropWithKey() {
  renderer.domElement.addEventListener('mousedown', onMouseDown);
}

export { enableDragAndDropWithKey };
