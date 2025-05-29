import { layers, layerObjects, scene, currentLayerIndex, setCurrentLayerIndex } from './globals.js';

export function addLayer() {
    const layerName = `Слой ${layers.length + 1}`;
    layers.push({ name: layerName, visible: true });
    setCurrentLayerIndex(layers.length - 1);
    updateLayerList();
}

export function removeLayer() {
    if (layers.length > 0) {
        // Удаляем объекты слоя из сцены, если есть
        const removedIndex = layers.length - 1;
        if (layerObjects[removedIndex]) {
            layerObjects[removedIndex].forEach(obj => {
                if (obj && scene) scene.remove(obj);
            });
            delete layerObjects[removedIndex];
        }
        layers.pop();

        // Обновляем индекс текущего слоя
        if (currentLayerIndex >= layers.length) {
            setCurrentLayerIndex(layers.length - 1);
        }
        updateLayerList();
    }
}

export function toggleLayerVisibility(index) {
    if (layers[index]) {
        layers[index].visible = !layers[index].visible;
        
        // Update visibility of all objects in the layer
        if (layerObjects[index]) {
            layerObjects[index].forEach(object => {
                if (object && scene) {
                    object.visible = layers[index].visible;
                }
            });
        }
        
        updateLayerList();
    }
}

function updateLayerList() {
    const layerList = document.getElementById("layerList");
    layerList.innerHTML = "";

    layers.forEach((layer, index) => {
        const layerItem = document.createElement("div");
        layerItem.className = "layer-item";
        
        // Add visibility toggle button
        const visibilityButton = document.createElement("button");
        visibilityButton.className = "visibility-toggle";
        visibilityButton.innerHTML = layer.visible ? "👁️" : "👁️‍🗨️";
        visibilityButton.title = layer.visible ? "Скрыть слой" : "Показать слой";
        visibilityButton.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleLayerVisibility(index);
        });

        layerItem.innerHTML = `
            <span class="layer-name">${layer.name}</span>
            <div class="layer-controls">
                <button class="delete-layer-btn" title="Удалить слой">🗑️</button>
            </div>
        `;

        // Insert visibility button at the start
        layerItem.insertBefore(visibilityButton, layerItem.firstChild);

        // Add click handlers
        const deleteButton = layerItem.querySelector(".delete-layer-btn");
        deleteButton.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteLayer(index);
        });

        // Highlight current layer
        if (index === currentLayerIndex) {
            layerItem.classList.add("active");
        }

        // Add click handler to select layer
        layerItem.addEventListener("click", () => {
            setCurrentLayerIndex(index);
            updateLayerList(); // Refresh to update active states
        });

        layerList.appendChild(layerItem);
    });
}

export function deleteLayer(index) {
    if (layers[index]) {
        if (layerObjects[index]) {
            for (let i = 0; i < layerObjects[index].length; i++) {
                const object = layerObjects[index][i];
                if (object && scene) {
                    scene.remove(object);
                }
            }
            
            delete layerObjects[index];
        }
        
        layers.splice(index, 1);
        
        updateLayerList();
        
        if (index === currentLayerIndex && layers.length > 0) {
            setCurrentLayerIndex(layers.length - 1);
        }
    }
}