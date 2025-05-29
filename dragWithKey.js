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

// Rotation-specific variables
let isRotationMode = false;
let rotationGizmo = null;
let isRotatingGizmo = false;
let activeRotationAxis = null;
let startAngle = 0;

// Scale-specific variables
let isScalingMode = false;
let scaleGizmo = null;
let isScalingGizmo = false;
let activeScaleAxis = null;
let startScale = new THREE.Vector3();

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

// Create rotation gizmo
function createRotationGizmo(position) {
    if (rotationGizmo) {
        scene.remove(rotationGizmo);
    }

    rotationGizmo = new THREE.Group();

    const radius = 2;
    const tube = 0.02;
    const radialSegments = 48;
    const tubularSegments = 48;

    // X axis ring (red)
    const xGeometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
    const xRing = new THREE.Mesh(xGeometry, xMaterial);
    xRing.rotation.y = Math.PI / 2;
    xRing.name = 'x-rotation';
    rotationGizmo.add(xRing);

    // Y axis ring (green)
    const yGeometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });
    const yRing = new THREE.Mesh(yGeometry, yMaterial);
    yRing.rotation.x = Math.PI / 2;
    yRing.name = 'y-rotation';
    rotationGizmo.add(yRing);

    // Z axis ring (blue)
    const zGeometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
    const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.8 });
    const zRing = new THREE.Mesh(zGeometry, zMaterial);
    zRing.name = 'z-rotation';
    rotationGizmo.add(zRing);

    rotationGizmo.position.copy(position);
    scene.add(rotationGizmo);
}

// Create scale gizmo
function createScaleGizmo(position) {
    if (scaleGizmo) {
        scene.remove(scaleGizmo);
    }

    scaleGizmo = new THREE.Group();

    // Create boxes for each axis
    const boxSize = 0.3; // Increased size
    const axisLength = 2;
    const lineWidth = 2; // Thicker lines

    // X axis (red)
    const xGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const xMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        transparent: true, 
        opacity: 0.8,
        depthTest: false // Make sure handles are always visible
    });
    const xBox = new THREE.Mesh(xGeometry, xMaterial);
    xBox.position.x = axisLength;
    xBox.name = 'x-scale';
    
    const xLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ]),
        new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            linewidth: lineWidth,
            depthTest: false
        })
    );
    
    const xGroup = new THREE.Group();
    xGroup.add(xLine);
    xGroup.add(xBox);
    xGroup.name = 'x-scale';
    scaleGizmo.add(xGroup);

    // Y axis (green)
    const yGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const yMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.8,
        depthTest: false
    });
    const yBox = new THREE.Mesh(yGeometry, yMaterial);
    yBox.position.y = axisLength;
    yBox.name = 'y-scale';
    
    const yLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, axisLength, 0)
        ]),
        new THREE.LineBasicMaterial({ 
            color: 0x00ff00,
            linewidth: lineWidth,
            depthTest: false
        })
    );
    
    const yGroup = new THREE.Group();
    yGroup.add(yLine);
    yGroup.add(yBox);
    yGroup.name = 'y-scale';
    scaleGizmo.add(yGroup);

    // Z axis (blue)
    const zGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const zMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x0000ff, 
        transparent: true, 
        opacity: 0.8,
        depthTest: false
    });
    const zBox = new THREE.Mesh(zGeometry, zMaterial);
    zBox.position.z = axisLength;
    zBox.name = 'z-scale';
    
    const zLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, axisLength)
        ]),
        new THREE.LineBasicMaterial({ 
            color: 0x0000ff,
            linewidth: lineWidth,
            depthTest: false
        })
    );
    
    const zGroup = new THREE.Group();
    zGroup.add(zLine);
    zGroup.add(zBox);
    zGroup.name = 'z-scale';
    scaleGizmo.add(zGroup);

    scaleGizmo.position.copy(position);
    scene.add(scaleGizmo);
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

function deleteSelectedObjects() {
    if (selectedObjects.size === 0) return;

    for (const obj of selectedObjects) {
        scene.remove(obj);
        removeSelectionBox(obj); // Удаление рамки выделения, если есть
    }

    selectedObjects.clear();

    // Удаление гизмо, если активны
    if (gizmo) {
        scene.remove(gizmo);
        gizmo = null;
    }

    if (rotationGizmo) {
        scene.remove(rotationGizmo);
        rotationGizmo = null;
    }

    if (scaleGizmo) {
        scene.remove(scaleGizmo);
        scaleGizmo = null;
    }

    updateButtonStates(); // Обновление состояния UI (если используется)
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
    if (selectedObjects.size > 0) {
        const center = new THREE.Vector3();
        for (const obj of selectedObjects) {
            center.add(obj.position);
        }
        center.divideScalar(selectedObjects.size);
        
        if (gizmo) {
            gizmo.position.copy(center);
        }
        if (rotationGizmo) {
            rotationGizmo.position.copy(center);
        }
        if (scaleGizmo) {
            scaleGizmo.position.copy(center);
        }
    }
}

// Function to enter selection mode
function enterSelectionMode() {
    // Exit other modes first
    if (isRotationMode) exitRotationMode();
    if (isScalingMode) exitScaleMode();
    
    // Toggle selection mode
    if (!isSelectionMode) {
        isSelectionMode = true;
        setIsDrawing(false);
        if (selectedObjects.size > 0) {
            const center = new THREE.Vector3();
            for (const obj of selectedObjects) {
                center.add(obj.position);
            }
            center.divideScalar(selectedObjects.size);
            createGizmo(center);
        }
    } else {
        exitSelectionMode();
    }
    updateButtonStates();
}

// Function to enter rotation mode
function enterRotationMode() {
    // Exit other modes first
    if (isSelectionMode) exitSelectionMode();
    if (isScalingMode) exitScaleMode();
    
    // Toggle rotation mode
    if (!isRotationMode) {
        isRotationMode = true;
        setIsDrawing(false);
        if (selectedObjects.size > 0) {
            const center = new THREE.Vector3();
            for (const obj of selectedObjects) {
                center.add(obj.position);
            }
            center.divideScalar(selectedObjects.size);
            createRotationGizmo(center);
        }
    } else {
        exitRotationMode();
    }
    updateButtonStates();
}

// Function to enter scale mode
function enterScaleMode() {
    // Exit other modes first
    if (isSelectionMode) exitSelectionMode();
    if (isRotationMode) exitRotationMode();
    
    // Toggle scale mode
    if (!isScalingMode) {
        isScalingMode = true;
        setIsDrawing(false);
        if (selectedObjects.size > 0) {
            const center = new THREE.Vector3();
            for (const obj of selectedObjects) {
                center.add(obj.position);
            }
            center.divideScalar(selectedObjects.size);
            createScaleGizmo(center);
        }
    } else {
        exitScaleMode();
    }
    updateButtonStates();
}

// Function to exit selection mode
function exitSelectionMode() {
    isSelectionMode = false;
    if (!isRotationMode && !isScalingMode) {
        removeAllSelectionBoxes();
        selectedObjects.clear();
    }
    isDragging = false;
    isDraggingGizmo = false;
    activeAxis = null;
    if (gizmo) {
        scene.remove(gizmo);
        gizmo = null;
    }
    if (!isRotationMode && !isScalingMode) {
        setIsDrawing(true);
    }
    updateButtonStates();
}

// Function to exit rotation mode
function exitRotationMode() {
    isRotationMode = false;
    if (!isSelectionMode && !isScalingMode) {
        removeAllSelectionBoxes();
        selectedObjects.clear();
    }
    if (rotationGizmo) {
        scene.remove(rotationGizmo);
        rotationGizmo = null;
    }
    if (!isSelectionMode && !isScalingMode) {
        setIsDrawing(true);
    }
    updateButtonStates();
}

// Function to exit scale mode
function exitScaleMode() {
    isScalingMode = false;
    if (!isSelectionMode && !isRotationMode) {
        removeAllSelectionBoxes();
        selectedObjects.clear();
    }
    if (scaleGizmo) {
        scene.remove(scaleGizmo);
        scaleGizmo = null;
    }
    if (!isSelectionMode && !isRotationMode) {
        setIsDrawing(true);
    }
    updateButtonStates();
}

// Function to exit all modes
function exitAllModes() {
    exitSelectionMode();
    exitRotationMode();
    exitScaleMode();
    removeAllSelectionBoxes();
    selectedObjects.clear();
    setIsDrawing(true);
    updateButtonStates();
}

// Key handlers
window.addEventListener('keydown', (event) => {
    if (event.repeat) return;

    if (event.key === 'Escape') {
        exitAllModes();
        return;
    }

    if (event.key.toLowerCase() === 't' || event.key.toLowerCase() === 'е') {
        enterSelectionMode();
    }
    
    if (event.key.toLowerCase() === 'r' || event.key.toLowerCase() === 'к') {
        enterRotationMode();
    }

    if (event.key.toLowerCase() === 's' || event.key.toLowerCase() === 'ы') {
        enterScaleMode();
    }

    // Удаление объектов по клавише Delete
    if (event.key === 'Delete') {
        deleteSelectedObjects();
    }
});

function onMouseDown(event) {
    if (event.button !== 0) return;
    if (!isSelectionMode && !isRotationMode && !isScalingMode) return;

    setIsDrawing(false);

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Check for scale gizmo interaction
    if (isScalingMode && scaleGizmo && selectedObjects.size > 0) {
        const scaleIntersects = raycaster.intersectObjects(scaleGizmo.children, true);
        if (scaleIntersects.length > 0) {
            isDraggingGizmo = true;
            isScalingGizmo = true;
            
            // Find the top-level group (x-scale, y-scale, or z-scale)
            let currentObj = scaleIntersects[0].object;
            while (currentObj.parent && currentObj.parent !== scaleGizmo) {
                currentObj = currentObj.parent;
            }
            activeScaleAxis = currentObj.name.split('-')[0];

            // Store initial scales
            for (const obj of selectedObjects) {
                obj.userData.startScale = obj.scale.clone();
            }

            // Set up drag plane
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);
            
            const axisVector = new THREE.Vector3();
            switch(activeScaleAxis) {
                case 'x': axisVector.set(1, 0, 0); break;
                case 'y': axisVector.set(0, 1, 0); break;
                case 'z': axisVector.set(0, 0, 1); break;
            }

            const planeNormal = new THREE.Vector3();
            planeNormal.crossVectors(axisVector, cameraDirection);
            planeNormal.crossVectors(planeNormal, axisVector);
            planeNormal.normalize();
            
            dragPlane.setFromNormalAndCoplanarPoint(planeNormal, scaleGizmo.position);

            if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
                startPosition.copy(intersection);
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            return;
        }
    }

    // Check for rotation gizmo interaction
    if (isRotationMode && rotationGizmo && selectedObjects.size > 0) {
        const rotationIntersects = raycaster.intersectObjects(rotationGizmo.children, true);
        if (rotationIntersects.length > 0) {
            isDraggingGizmo = true;
            isRotatingGizmo = true;
            const ring = rotationIntersects[0].object;
            activeRotationAxis = ring.name.split('-')[0];

            // Set up rotation plane based on the selected axis
            const planeNormal = new THREE.Vector3();
            switch(activeRotationAxis) {
                case 'x': planeNormal.set(1, 0, 0); break;
                case 'y': planeNormal.set(0, 1, 0); break;
                case 'z': planeNormal.set(0, 0, 1); break;
            }
            
            dragPlane.setFromNormalAndCoplanarPoint(planeNormal, rotationGizmo.position);
            
            if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
                const relativePoint = intersection.clone().sub(rotationGizmo.position);
                switch(activeRotationAxis) {
                    case 'x':
                        startAngle = Math.atan2(relativePoint.z, relativePoint.y);
                        break;
                    case 'y':
                        startAngle = Math.atan2(relativePoint.x, relativePoint.z);
                        break;
                    case 'z':
                        startAngle = Math.atan2(relativePoint.y, relativePoint.x);
                        break;
                }
            }

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            return;
        }
    }

    // Check for movement gizmo interaction
    if (isSelectionMode && gizmo && selectedObjects.size > 0) {
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
        obj !== rotationGizmo && 
        obj !== scaleGizmo &&
        !gizmo?.children.includes(obj) &&
        !rotationGizmo?.children.includes(obj) &&
        !scaleGizmo?.children.includes(obj)
    );

    const intersects = raycaster.intersectObjects(validObjects);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        
        if (event.ctrlKey) {
            if (selectedObjects.has(clickedObject)) {
                selectedObjects.delete(clickedObject);
                removeSelectionBox(clickedObject);
            } else {
                selectedObjects.add(clickedObject);
                createSelectionBox(clickedObject);
            }
        } else {
            if (!selectedObjects.has(clickedObject)) {
                removeAllSelectionBoxes();
                selectedObjects.clear();
                selectedObjects.add(clickedObject);
                createSelectionBox(clickedObject);
            }
        }

        // Update gizmos if we have selected objects
        if (selectedObjects.size > 0) {
            const center = new THREE.Vector3();
            for (const obj of selectedObjects) {
                center.add(obj.position);
            }
            center.divideScalar(selectedObjects.size);
            
            if (isSelectionMode) {
                createGizmo(center);
            } else if (isRotationMode) {
                createRotationGizmo(center);
            } else if (isScalingMode) {
                createScaleGizmo(center);
            }
        }
    } else if (!isDraggingGizmo && !event.ctrlKey) {
        // Clicked empty space without ctrl - clear selection
        removeAllSelectionBoxes();
        selectedObjects.clear();
        if (gizmo) {
            scene.remove(gizmo);
            gizmo = null;
        }
        if (rotationGizmo) {
            scene.remove(rotationGizmo);
            rotationGizmo = null;
        }
        if (scaleGizmo) {
            scene.remove(scaleGizmo);
            scaleGizmo = null;
        }
    }
}

function onMouseMove(event) {
    if ((!isDragging && !isDraggingGizmo) || selectedObjects.size === 0) return;

    setIsDrawing(false);

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (isRotatingGizmo && rotationGizmo) {
        const planeNormal = new THREE.Vector3();
        switch(activeRotationAxis) {
            case 'x': planeNormal.set(1, 0, 0); break;
            case 'y': planeNormal.set(0, 1, 0); break;
            case 'z': planeNormal.set(0, 0, 1); break;
        }

        dragPlane.setFromNormalAndCoplanarPoint(planeNormal, rotationGizmo.position);

        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
            const relativePoint = intersection.clone().sub(rotationGizmo.position);
            let currentAngle;
            
            switch(activeRotationAxis) {
                case 'x':
                    currentAngle = Math.atan2(relativePoint.z, relativePoint.y);
                    break;
                case 'y':
                    currentAngle = Math.atan2(relativePoint.x, relativePoint.z);
                    break;
                case 'z':
                    currentAngle = Math.atan2(relativePoint.y, relativePoint.x);
                    break;
            }
            
            let deltaAngle = currentAngle - startAngle;
            startAngle = currentAngle;

            for (const obj of selectedObjects) {
                switch(activeRotationAxis) {
                    case 'x':
                        obj.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), deltaAngle);
                        break;
                    case 'y':
                        obj.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), deltaAngle);
                        break;
                    case 'z':
                        obj.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), deltaAngle);
                        break;
                }
            }

            // Update selection boxes to match new rotation
            for (const [obj, box] of selectionBoxes) {
                box.rotation.copy(obj.rotation);
            }
        }
        return;
    }

    if (isScalingGizmo && scaleGizmo) {
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
            const delta = new THREE.Vector3();
            delta.subVectors(intersection, startPosition);

            const sensitivity = 0.5;
            let scaleFactor = 1;
            
            switch(activeScaleAxis) {
                case 'x': scaleFactor = 1 + (delta.x * sensitivity); break;
                case 'y': scaleFactor = 1 + (delta.y * sensitivity); break;
                case 'z': scaleFactor = 1 + (delta.z * sensitivity); break;
            }

            const minScale = 0.1;
            scaleFactor = Math.max(scaleFactor, minScale);

            for (const obj of selectedObjects) {
                const startScale = obj.userData.startScale;
                if (!startScale) continue;

                const newScale = new THREE.Vector3().copy(startScale);
                
                switch(activeScaleAxis) {
                    case 'x': newScale.x = startScale.x * scaleFactor; break;
                    case 'y': newScale.y = startScale.y * scaleFactor; break;
                    case 'z': newScale.z = startScale.z * scaleFactor; break;
                }

                obj.scale.copy(newScale);

                const selectionBox = selectionBoxes.get(obj);
                if (selectionBox) {
                    selectionBox.scale.copy(newScale);
                }
            }

            updateGizmoPosition();
        }
        return;
    }

    if (isDraggingGizmo && gizmo) {
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
            const intersectionPoint = intersection.clone();
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
            
            updateGizmoPosition();
            updateSelectionBoxes();
        }
    }
}

function onMouseUp() {
    isDragging = false;
    isDraggingGizmo = false;
    isRotatingGizmo = false;
    isScalingGizmo = false;
    activeAxis = null;
    activeRotationAxis = null;
    activeScaleAxis = null;

    // Clear stored positions and scales
    for (const obj of selectedObjects) {
        delete obj.userData.startPosition;
        delete obj.userData.startScale;
    }

    if (isSelectionMode || isRotationMode || isScalingMode) {
        setIsDrawing(false);
    } else {
        setIsDrawing(true);
    }

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
}

// Create control panel
function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'transform-panel';
    panel.style.cssText = `
        position: fixed;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        background-color: #ffffff;
        padding: 12px 20px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        z-index: 1000;
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
    `;

    // Create mode buttons
    const createModeButton = (icon, action, tooltip) => {
        const button = document.createElement('button');
        button.className = 'mode-button';
        button.innerHTML = icon;
        button.title = tooltip;
        button.style.cssText = `
            background-color: #007aff;
            color: #ffffff;
            border: none;
            padding: 10px;
            border-radius: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.3s ease, transform 0.2s ease;
            font-size: 20px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            width: 44px;
            height: 44px;
            text-align: center;
        `;

        // Hover styles
        button.addEventListener('mouseover', () => {
            if (!button.classList.contains('active')) {
                button.style.backgroundColor = '#0051d1';
                button.style.transform = 'translateY(-2px)';
            }
        });

        // Mouse out styles
        button.addEventListener('mouseout', () => {
            if (!button.classList.contains('active')) {
                button.style.backgroundColor = '#007aff';
                button.style.transform = 'translateY(0)';
            }
        });

        // Active styles
        button.addEventListener('click', () => {
            action();
            updateButtonStates();
        });

        return button;
    };

    // Move mode - using move arrows icon
    const moveButton = createModeButton('⇄', () => {
        enterSelectionMode();
    }, 'Move objects (T)');

    // Rotate mode - using rotate icon
    const rotateButton = createModeButton('↻', () => {
        enterRotationMode();
    }, 'Rotate objects (R)');

    // Scale mode - using expand icon
    const scaleButton = createModeButton('⤢', () => {
        enterScaleMode();
    }, 'Scale objects (S)');

    // Exit button - using close icon
    const exitButton = createModeButton('×', () => {
        exitAllModes();
    }, 'Exit all modes (Escape)');
    exitButton.style.marginTop = '5px';

    // Add buttons to panel
    panel.appendChild(moveButton);
    panel.appendChild(rotateButton);
    panel.appendChild(scaleButton);
    panel.appendChild(exitButton);

    // Add panel to document
    document.body.appendChild(panel);

    // Function to update button states
    window.updateButtonStates = function() {
        const buttons = [moveButton, rotateButton, scaleButton];
        const modes = [isSelectionMode, isRotationMode, isScalingMode];
        
        buttons.forEach((button, index) => {
            if (modes[index]) {
                button.style.backgroundColor = '#34c759';
                button.style.transform = 'translateY(-2px)';
                button.classList.add('active');
            } else {
                button.style.backgroundColor = '#007aff';
                button.style.transform = 'translateY(0)';
                button.classList.remove('active');
            }
        });

        exitButton.style.backgroundColor = '#007aff';
    };

    // Initial button states
    updateButtonStates();
}

// Modify enableDragAndDropWithKey to initialize the control panel
function enableDragAndDropWithKey() {
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    createControlPanel();
}

export { enableDragAndDropWithKey };
