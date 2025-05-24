import { layers, layerObjects, scene, currentLayerIndex, setCurrentLayerIndex } from './globals.js';

export function addLayer() {
    const layerName = `Слой ${layers.length + 1}`;
    layers.push({ name: layerName, visible: true });
    setCurrentLayerIndex(layers.length - 1);
    updateLayerList();
}


export function removeLayer() {
    if (layers.length > 0) {
        layers.pop();
        updateLayerList();
    }
}

function updateLayerList() {
    const layerList = document.getElementById("layerList");
    layerList.innerHTML = "";

    layers.forEach((layer, index) => {
        const layerItem = document.createElement("div");
        layerItem.className = "layer-item";

        layerItem.innerHTML = `
            <span class="layer-name">${layer.name}</span>
            <button class="delete-layer-btn">🗑️</button>
        `;

        const deleteButton = layerItem.querySelector(".delete-layer-btn");
        deleteButton.addEventListener("click", () => deleteLayer(index));

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