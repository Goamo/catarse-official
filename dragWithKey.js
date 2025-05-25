import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { scene, camera, renderer, currentMode, setIsDrawing } from './globals.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const intersection = new THREE.Vector3();
const offset = new THREE.Vector3();
const startPosition = new THREE.Vector3();

let selectedObjects = new Set();
let isDragging = false;
let selectionBoxes = new Map(); // Map of object -> selectionBox
let isSelectionMode = false;
let activeAxis = null;
let gizmo = null;
let isDraggingGizmo = false;
let movementMode = 'axis'; // 'free' or 'axis'
let isTKeyPressed = false;

// Create arrow gizmo for axis movement
function createGizmo(position) {
    if (gizmo) {
        scene.remove(gizmo);
    }

    gizmo = new THREE.Group();

    // Create arrows for each axis
    const arrowLength = 2;
    const arrowHeadLength = 0.4;
    const arrowHeadWidth = 0.2;

    // X axis (red)
    const xArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        arrowLength,
        0xff0000,
        arrowHeadLength,
        arrowHeadWidth
    );
    xArrow.name = 'x-axis';
    xArrow.line.material.linewidth = 3;
    xArrow.cone.material.transparent = true;
    xArrow.cone.material.opacity = 0.8;
    gizmo.add(xArrow);

    // Y axis (green)
    const yArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        arrowLength,
        0x00ff00,
        arrowHeadLength,
        arrowHeadWidth
    );
    yArrow.name = 'y-axis';
    yArrow.line.material.linewidth = 3;
    yArrow.cone.material.transparent = true;
    yArrow.cone.material.opacity = 0.8;
    gizmo.add(yArrow);

    // Z axis (blue)
    const zArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        arrowLength,
        0x0000ff,
        arrowHeadLength,
        arrowHeadWidth
    );
    zArrow.name = 'z-axis';
    zArrow.line.material.linewidth = 3;
    zArrow.cone.material.transparent = true;
    zArrow.cone.material.opacity = 0.8;
    gizmo.add(zArrow);

    gizmo.position.copy(position);
    scene.add(gizmo);
}

function createSelectionBox(object) {
    if (selectionBoxes.has(object)) {
        return;
    }

    const SELECTION_COLOR = 0xffa500;
    const geometry = object.geometry.clone();
    const material = new THREE.MeshBasicMaterial({
        color: SELECTION_COLOR,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        wireframe: true
    });

    const selectionBox = new THREE.Mesh(geometry, material);
    selectionBox.position.copy(object.position);
    selectionBox.rotation.copy(object.rotation);
    selectionBox.scale.copy(object.scale);
    scene.add(selectionBox);
    
    selectionBoxes.set(object, selectionBox);
}

function removeSelectionBox(object) {
    const selectionBox = selectionBoxes.get(object);
    if (selectionBox) {
        scene.remove(selectionBox);
        selectionBoxes.delete(object);
    }
}

function removeAllSelectionBoxes() {
    for (const [object, box] of selectionBoxes) {
        scene.remove(box);
    }
    selectionBoxes.clear();
}

function updateSelectionBoxes() {
    for (const [object, box] of selectionBoxes) {
        box.position.copy(object.position);
    }
}

// Create gizmo at the center of all selected objects
function updateGizmoPosition() {
    if (gizmo && selectedObjects.size > 0) {
        const center = new THREE.Vector3();
        for (const obj of selectedObjects) {
            center.add(obj.position);
        }
        center.divideScalar(selectedObjects.size);
        gizmo.position.copy(center);
    }
}

// Function to enter selection mode
function enterSelectionMode() {
    isSelectionMode = true;
    setIsDrawing(false);
}

// Function to exit selection mode
function exitSelectionMode() {
    isSelectionMode = false;
    removeAllSelectionBoxes();
    selectedObjects.clear();
    isDragging = false;
    isDraggingGizmo = false;
    activeAxis = null;
    if (gizmo) {
        scene.remove(gizmo);
        gizmo = null;
    }
    setIsDrawing(true);
    movementMode = 'axis'; // Reset to default mode
    isTKeyPressed = false;
}

// Switch movement mode
function switchMovementMode(mode) {
    movementMode = mode;
    
    // Clean up any ongoing drag operations
    isDragging = false;
    isDraggingGizmo = false;
    activeAxis = null;
    
    if (mode === 'free') {
        if (gizmo) {
            scene.remove(gizmo);
            gizmo = null;
        }
    } else if (mode === 'axis' && selectedObjects.size > 0) {
        const center = new THREE.Vector3();
        for (const obj of selectedObjects) {
            center.add(obj.position);
        }
        center.divideScalar(selectedObjects.size);
        
        if (gizmo) {
            scene.remove(gizmo);
        }
        createGizmo(center);
    }
}

// Key handlers
window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 't' || event.key.toLowerCase() === 'е') {
        if (!isTKeyPressed) {
            isTKeyPressed = true;
            if (!isSelectionMode) {
                enterSelectionMode();
            }
        }
    } else if (isTKeyPressed && isSelectionMode) {
        if (event.key === '1') {
            switchMovementMode('free');
        } else if (event.key === '2') {
            switchMovementMode('axis');
        }
    }
});

window.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() === 't' || event.key.toLowerCase() === 'е') {
        isTKeyPressed = false;
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isSelectionMode) {
        exitSelectionMode();
    }
});

function onMouseDown(event) {
    if (event.button !== 0 || !isSelectionMode) return;

    setIsDrawing(false);

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check for gizmo interaction only in axis mode
    if (movementMode === 'axis' && gizmo && selectedObjects.size > 0) {
        const gizmoIntersects = raycaster.intersectObjects(gizmo.children, true);
        if (gizmoIntersects.length > 0) {
            isDraggingGizmo = true;
            const arrow = gizmoIntersects[0].object.parent;
            activeAxis = arrow.name.split('-')[0];
            
            for (const obj of selectedObjects) {
                obj.userData.startPosition = obj.position.clone();
            }

            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            
            const axisVector = new THREE.Vector3();
            switch(activeAxis) {
                case 'x': axisVector.set(1, 0, 0); break;
                case 'y': axisVector.set(0, 1, 0); break;
                case 'z': axisVector.set(0, 0, 1); break;
            }

            const planeNormal = new THREE.Vector3();
            planeNormal.crossVectors(axisVector, cameraDirection);
            planeNormal.crossVectors(planeNormal, axisVector);
            planeNormal.normalize();
            
            const centerPoint = gizmo.position.clone();
            dragPlane.setFromNormalAndCoplanarPoint(planeNormal, centerPoint);

            if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
                offset.copy(intersection).sub(centerPoint);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            return;
        }
    }

    // Get all valid objects for selection
    const validObjects = scene.children.filter(obj => 
        !selectionBoxes.has(obj) && 
        obj !== gizmo && 
        !gizmo?.children.includes(obj)
    );

    const intersects = raycaster.intersectObjects(validObjects);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        
        if (event.ctrlKey) {
            // Add to existing selection with Ctrl
            if (selectedObjects.has(clickedObject)) {
                selectedObjects.delete(clickedObject);
                removeSelectionBox(clickedObject);
            } else {
                selectedObjects.add(clickedObject);
                createSelectionBox(clickedObject);
            }
        } else {
            // Single selection
            if (!selectedObjects.has(clickedObject)) {
                removeAllSelectionBoxes();
                selectedObjects.clear();
                selectedObjects.add(clickedObject);
                createSelectionBox(clickedObject);
            }
        }

        // Update gizmo position if we have selected objects and in axis mode
        if (selectedObjects.size > 0 && movementMode === 'axis') {
            const center = new THREE.Vector3();
            for (const obj of selectedObjects) {
                center.add(obj.position);
            }
            center.divideScalar(selectedObjects.size);
            
            if (gizmo) {
                scene.remove(gizmo);
            }
            createGizmo(center);
        }

        // Start dragging if not using ctrl key
        if (!event.ctrlKey) {
            isDragging = true;
            startPosition.copy(intersects[0].point);

            // Set up drag plane for free movement
            const planeNormal = camera.getWorldDirection(new THREE.Vector3());
            dragPlane.setFromNormalAndCoplanarPoint(planeNormal, startPosition);

            if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
                offset.copy(intersection).sub(startPosition);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }
    } else if (!isDraggingGizmo && !event.ctrlKey) {
        // Clicked empty space without ctrl - clear selection
        removeAllSelectionBoxes();
        selectedObjects.clear();
        if (gizmo) {
            scene.remove(gizmo);
            gizmo = null;
        }
    }
}

function onMouseMove(event) {
    if ((!isDragging && !isDraggingGizmo) || selectedObjects.size === 0) return;

    setIsDrawing(false);

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        const intersectionPoint = intersection.clone();
        
        if (isDraggingGizmo && activeAxis && movementMode === 'axis') {
            // Axis-constrained movement
            const gizmoPosition = gizmo.position.clone();
            const delta = new THREE.Vector3().copy(intersectionPoint.sub(offset)).sub(gizmoPosition);
            
            for (const obj of selectedObjects) {
                const objNewPos = obj.userData.startPosition.clone();
                switch(activeAxis) {
                    case 'x': objNewPos.x += delta.x; break;
                    case 'y': objNewPos.y += delta.y; break;
                    case 'z': objNewPos.z += delta.z; break;
                }
                
                if (currentMode === "2D") {
                    objNewPos.z = 0;
                }
                
                obj.position.copy(objNewPos);
            }
        } else if (isDragging && movementMode === 'free') {
            // Free movement
            const delta = new THREE.Vector3().copy(intersectionPoint.sub(offset)).sub(startPosition);
            
            // Move all selected objects by the delta
            for (const obj of selectedObjects) {
                obj.position.add(delta);
                if (currentMode === "2D") {
                    obj.position.z = 0;
                }
            }
            
            // Update the start position for the next frame
            startPosition.copy(intersectionPoint.sub(offset));
        }

        // Update selection boxes and gizmo
        updateSelectionBoxes();
        if (movementMode === 'axis' && gizmo) {
            updateGizmoPosition();
        }
    }
}

function onMouseUp() {
    isDragging = false;
    isDraggingGizmo = false;
    activeAxis = null;

    // Clear stored start positions
    for (const obj of selectedObjects) {
        delete obj.userData.startPosition;
    }

    if (isSelectionMode) {
        setIsDrawing(false);
    }

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
}

function enableDragAndDropWithKey() {
    renderer.domElement.addEventListener('mousedown', onMouseDown);
}

export { enableDragAndDropWithKey };
