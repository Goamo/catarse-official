import {
    brushSettings,
    brushType,
    layers,
    startLine,
    mouse,
    raycaster,
    camera,
    controls,
    scene,
    renderer,
    currentMode,
    isDrawing,
    cameraPositions,
    drawingPlane,
    strokes,
    redoStack,
    brightness,
    contrast,
    layerObjects,
    currentLayerIndex,
    setScene,
    setCamera,
    setControls,
    setRenderer,
    setIsDrawing,
    setStartLine,
    setRedoStack,
    setDrawingPlane,
    setCurrentMode
} from './globals.js';

let isShiftPressed = false;

export function initCanvas() {
    const newScene = new THREE.Scene();
    newScene.background = new THREE.Color(0xffffff);
    setScene(newScene);
    
    const newCamera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    newCamera.position.copy(new THREE.Vector3(
        cameraPositions["2D"].x,
        cameraPositions["2D"].y,
        cameraPositions["2D"].z
    ));
    setCamera(newCamera);
    
    const newRenderer = new THREE.WebGLRenderer({
        canvas: document.getElementById("unifiedCanvas"),
        antialias: true
    });
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    setRenderer(newRenderer);
    
    const newControls = new THREE.OrbitControls(
        newCamera,
        newRenderer.domElement
    );
    newControls.enabled = false;
    setControls(newControls);
    
    // Create drawing plane
    const planeGeometry = new THREE.PlaneGeometry(window.innerWidth/40, window.innerHeight/40);
	const planeMaterial = new THREE.MeshBasicMaterial({
		color: 0xf0f0f0,
		side: THREE.DoubleSide,
		transparent: true,
		opacity: 0.1,
		visible: true
	});
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);
    setDrawingPlane(plane);
    
    window.addEventListener('resize', onWindowResize);
    
    setupEventListeners();
    
    if (!layerObjects) {
        layerObjects = {};
    }
    
    document.querySelectorAll('.brush-item').forEach(item => {
        if (item.getAttribute('data-brush-type') === brushType) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    const brushButton = document.getElementById('brushButton');
    const brushNames = {
        'round': 'Круглая',
        'square': 'Квадратная',
        'spray': 'Спрей',
        'watercolor': 'Акварель',
        'oil': 'Масляная краска',
        'eraser': 'Ластик'
    };
    brushButton.textContent = brushNames[brushType] || 'Кисть';
    
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function setupEventListeners() {
    const canvas = document.getElementById("unifiedCanvas");
    
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    
    document.addEventListener("mouseup", stopDrawing);
    document.addEventListener("mouseleave", stopDrawing);
    
    canvas.addEventListener("contextmenu", handleRightClick);
    
	document.addEventListener("keydown", function(event) {
		if (event.key === "Shift") {
			isShiftPressed = true;
			if (currentMode === "3D") {
				controls.enabled = true;
			}
			updateMouseIndicator();
		}
	});
    
	document.addEventListener("keyup", function(event) {
		if (event.key === "Shift") {
			isShiftPressed = false;
			controls.enabled = false;
			updateMouseIndicator();
		}
	});
}


function handleRightClick(event) {
    event.preventDefault();
    
    if (currentMode === "3D" && isShiftPressed) {
        startCameraRotation(event);
    }
}

function startCameraRotation(event) {
    controls.enabled = true;
    
    const onMouseMove = function(moveEvent) {

    };
    
    const onMouseUp = function() {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        
        if (currentMode !== "3D") {
            controls.enabled = false;
        }
    };
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
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


function startDrawing(event) {
    if (event.button !== 0) return;
    
    if (layers.length === 0) {
        alert("Добавьте хотя бы один слой перед началом рисования!");
        return;
    }
    
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
    
    mouse.x = x;
    mouse.y = y;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObject(drawingPlane);
    
    if (intersects.length > 0) {
        const point = intersects[0].point;
        setStartLine(new THREE.Vector3(point.x, point.y, point.z));
        setIsDrawing(true);
    }
}

function draw(event) {
    if (!isDrawing || layers.length === 0) return;
    
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = (-(event.clientY - rect.top) / rect.height) * 2 + 1;
    
    mouse.x = x;
    mouse.y = y;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObject(drawingPlane);
    
    if (intersects.length > 0) {
        const point = intersects[0].point;
        
        if (startLine) {
            addLine(startLine, point);
            
            strokes.push({
                start: { x: startLine.x, y: startLine.y, z: startLine.z },
                end: { x: point.x, y: point.y, z: point.z },
                brushType: brushType,
                currentLayerIndex: currentLayerIndex
            });
            setRedoStack([]);
        }
        
        setStartLine(new THREE.Vector3(point.x, point.y, point.z));
    }
}

function addLine(startPoint, endPoint) {
    const settings = brushSettings[brushType];
    let object;
    
    if (brushType === "spray") {
        object = addSpray(endPoint, settings);
    } else if (brushType === "watercolor") {
        object = addWatercolor(endPoint, settings);
    } else if (brushType === "oil") {
        object = addOil(endPoint, settings);
    } else {
        const numPoints = 10;
        const points = [];
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const x = startPoint.x + (endPoint.x - startPoint.x) * t;
            const y = startPoint.y + (endPoint.y - startPoint.y) * t;
            const z = startPoint.z + (endPoint.z - startPoint.z) * t;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(50));
        
        const material = new THREE.LineBasicMaterial({
            color: settings.color,
            opacity: settings.opacity,
            transparent: true
        });
        
        object = new THREE.Line(geometry, material);
        scene.add(object);
        
        if (settings.thickness > 2) {
            for (let i = 0; i < points.length; i += 2) {
                const sphereGeometry = new THREE.SphereGeometry(settings.thickness / 100, 8, 8);
                const sphereMaterial = new THREE.MeshBasicMaterial({
                    color: settings.color,
                    opacity: settings.opacity,
                    transparent: true
                });
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.position.copy(points[i]);
                scene.add(sphere);
                
                if (!layerObjects[currentLayerIndex]) {
                    layerObjects[currentLayerIndex] = [];
                }
                layerObjects[currentLayerIndex].push(sphere);
            }
        }
    }
    
    if (object) {
        if (!layerObjects[currentLayerIndex]) {
            layerObjects[currentLayerIndex] = [];
        }
        layerObjects[currentLayerIndex].push(object);
    }
    
    return object;
}

function addSpray(point, settings) {
    const points = [];
    
    for (let i = 0; i < settings.sprayDensity; i++) {
        const offsetX = (Math.random() - 0.5) * settings.sprayRadius / 50;
        const offsetY = (Math.random() - 0.5) * settings.sprayRadius / 50;
        const offsetZ = currentMode === "3D" ? (Math.random() - 0.5) * settings.sprayRadius / 50 : 0;
        
        points.push(
            point.x + offsetX,
            point.y + offsetY,
            point.z + offsetZ
        );
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    
    const material = new THREE.PointsMaterial({
        color: settings.color,
        size: settings.thickness / 10,
        opacity: settings.opacity,
        transparent: true
    });
    
    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);
    return pointCloud;
}

function addWatercolor(point, settings) {
    const segments = 32;
    const geometry = new THREE.CircleGeometry(settings.spread / 50, segments);
    
    const material = new THREE.MeshBasicMaterial({
        color: settings.color,
        transparent: true,
        opacity: settings.opacity,
        side: THREE.DoubleSide
    });
    
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(point.x, point.y, point.z);
    
    if (currentMode === "2D") {
        circle.rotation.set(-Math.PI / 2, 0, 0);
    } else {
        circle.lookAt(camera.position);
    }
    
    scene.add(circle);
    return circle;
}

function addOil(point, settings) {
    const segments = 32;
    const geometry = new THREE.CircleGeometry(settings.thickness / 30, segments);
    
    const material = new THREE.MeshBasicMaterial({
        color: settings.color,
        transparent: true,
        opacity: settings.opacity,
        side: THREE.DoubleSide
    });
    
    const circle = new THREE.Mesh(geometry, material);
    circle.position.set(point.x, point.y, point.z);
    
    if (currentMode === "2D") {
        circle.rotation.set(-Math.PI / 2, 0, 0);
    } else {
        circle.lookAt(camera.position);
    }
    
    scene.add(circle);
    return circle;
}

function stopDrawing() {
    setIsDrawing(false);
    setStartLine(null);
}

export function undo() {
    if (strokes.length > 0) {
        const lastStroke = strokes.pop();
        redoStack.push(lastStroke);
        redrawCanvas();
    }
}

export function redo() {
    if (redoStack.length > 0) {
        const stroke = redoStack.pop();
        strokes.push(stroke);
        redrawCanvas();
    }
}

function redrawCanvas() {
    while (scene.children.length > 1) {
        const object = scene.children[1];
        scene.remove(object);
    }

    strokes.forEach(stroke => {
        const start = new THREE.Vector3(stroke.start.x, stroke.start.y, stroke.start.z);
        const end = new THREE.Vector3(stroke.end.x, stroke.end.y, stroke.end.z);
        addLine(start, end);
    });
}

export function toggleDrawingMode() {
    const button = document.getElementById("toggleModeButton");
    
    if (currentMode === "2D") {
        setCurrentMode("3D");
        button.textContent = "Переключить на 2D";
        
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
        
        controls.enabled = false;
        
        anime({
            targets: camera.position,
            x: cameraPositions["2D"].x,
            y: cameraPositions["2D"].y,
            z: cameraPositions["2D"].z,
            duration: 1000,
            easing: 'easeOutQuad',
            complete: function() {
                camera.lookAt(0, 0, 0);
            }
        });
        
        document.getElementById("mouseIndicator").style.display = "none";
    }
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}