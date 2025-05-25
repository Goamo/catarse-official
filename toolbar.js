import {
    brushSettings,
    brushType,
    setBrushType as setGlobalBrushType,
    setBrushColor,
    setBrightness,
    setContrast
} from './globals.js';

export function toggleBrushDropdown() {
    const dropdown = document.getElementById("brushDropdown");
    dropdown.style.display =
        dropdown.style.display === "none" ? "block" : "none";
}

export function toggleMeshDropdown() {
    const dropdown = document.getElementById("meshDropdown");
    dropdown.style.display =
        dropdown.style.display === "none" ? "block" : "none";
}

export function toggleBrushSettings() {
    const dropdown = document.getElementById("brushSettingsDropdown");
    dropdown.style.display =
        dropdown.style.display === "none" ? "block" : "none";
}

export function setBrushType(type) {
    setGlobalBrushType(type);
    document.querySelectorAll('.brush-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.brushType === type) {
            item.classList.add('active');
        }
    });
}

export function updateBrushThickness(value) {
    const currentBrush = brushSettings[brushType];
    if (currentBrush) {
        currentBrush.thickness = parseInt(value);
    }
}

export function setColor(value) {
    setBrushColor(value);
}

export function updateOpacity(value) {
    const currentBrush = brushSettings[brushType];
    if (currentBrush) {
        currentBrush.opacity = parseInt(value) / 100;
    }
}

export function updateBrightness(value) {
    // Implementation for brightness adjustment
    console.log('Brightness updated:', value);
}

export function updateContrast(value) {
    // Implementation for contrast adjustment
    console.log('Contrast updated:', value);
}
