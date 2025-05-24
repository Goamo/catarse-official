import {
    brushSettings,
    brushType,
    setBrushType as setGlobalBrushType,
    setBrushColor as setGlobalBrushColor,
    setBrightness,
    setContrast
} from './globals.js';

export function toggleBrushDropdown() {
    const dropdown = document.getElementById("brushDropdown");
    dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
}

export function toggleBrushSettings() {
    const settingsDropdown = document.getElementById("brushSettingsDropdown");
    settingsDropdown.style.display =
        settingsDropdown.style.display === "block" ? "none" : "block";
}

export function setBrushType(type) {
    setGlobalBrushType(type);

    const brushItems = document.querySelectorAll('.brush-item');
    brushItems.forEach(item => {
        if (item.getAttribute('data-brush-type') === type) {
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
    brushButton.textContent = brushNames[type] || 'Кисть';
    
    toggleBrushDropdown();
}

export function updateBrushThickness(thickness) {
    brushSettings[brushType].thickness = thickness;
}

export function setColor(color) {
    setGlobalBrushColor(color);
    brushSettings[brushType].color = color;
}

export function updateOpacity(opacity) {
    brushSettings[brushType].opacity = opacity / 100;
}

export function updateBrightness(value) {
    setBrightness(parseInt(value, 10));
}

export function updateContrast(value) {
    setContrast(parseInt(value, 10));
}