import {
    brushSettings,
    brushType,
    setBrushType as setGlobalBrushType,
    setBrushColor,
    setBrightness,
    setContrast
} from './globals.js';

// === Примитивы ===
const primitives2D = [
    { type: 'square', label: 'Квадрат', icon: '□' },
    { type: 'rectangle', label: 'Прямоугольник', icon: '▭' },
    { type: 'triangle', label: 'Треугольник', icon: '△' },
    { type: 'equilateralTriangle', label: 'Равносторонний треугольник', icon: '▲' },
    { type: 'circle', label: 'Круг', icon: '○' },
    { type: 'ellipse', label: 'Эллипс', icon: '⭕' },
    { type: 'star', label: 'Звезда', icon: '★' },
    { type: 'hexagon', label: 'Шестиугольник', icon: '⬡' },
    { type: 'semicircle', label: 'Полукруг', icon: '◗' },
    { type: 'ring', label: 'Кольцо', icon: '◎' },
];

const primitives3D = [
    { type: 'cube', label: 'Куб', icon: '⬛' },
    { type: 'sphere', label: 'Сфера', icon: '⚫' },
    { type: 'cylinder', label: 'Цилиндр', icon: '⬤' },
    { type: 'cone', label: 'Конус', icon: '▲' },
    { type: 'torus', label: 'Тор', icon: '⭕' },
    { type: 'plane', label: 'Плоскость', icon: '▭' },
];

// === Панель кистей ===
export function toggleBrushDropdown() {
    const dropdown = document.getElementById("brushDropdown");
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
    setBrightness(value);
}

export function updateContrast(value) {
    setContrast(value);
}

// === Панель примитивов ===
export function toggleMeshDropdown() {
    const category = document.getElementById("meshCategorySelect");
    const list = document.getElementById("meshDropdown");

    if (category.style.display === "none") {
        category.style.display = "block";
        list.style.display = "none";
    } else {
        category.style.display = "none";
        list.style.display = "none";
    }
}

export function showMeshList(type) {
    const meshDropdown = document.getElementById('meshDropdown');
    const category = document.getElementById('meshCategorySelect');
    category.style.display = 'none';
    meshDropdown.style.display = 'block';
    meshDropdown.innerHTML = '';

    const closeButton = document.createElement('span');
    closeButton.className = 'close-btn';
    closeButton.innerHTML = '×';
    closeButton.onclick = toggleMeshDropdown;
    meshDropdown.appendChild(closeButton);

    const colorLabel = document.createElement('label');
    colorLabel.htmlFor = 'primitiveColor';
    colorLabel.textContent = '🎨 Цвет фигуры:';
    colorLabel.style.display = 'block';
    colorLabel.style.marginTop = '10px';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = 'primitiveColor';
    colorInput.value = '#0077ff';
    colorInput.style.marginBottom = '10px';

    meshDropdown.appendChild(colorLabel);
    meshDropdown.appendChild(colorInput);

    const title = document.createElement('div');
    title.textContent = (type === '2D' ? '2D' : '3D') + ' Примитивы';
    title.style.marginTop = '10px';
    title.style.fontWeight = 'bold';
    meshDropdown.appendChild(title);

    const list = type === '2D' ? primitives2D : primitives3D;

    list.forEach(({ type, label, icon }) => {
        const div = document.createElement('div');
        div.className = 'mesh-item';
        div.title = label;
        div.innerHTML = icon;
        div.onclick = () => insertPrimitive(type);
        meshDropdown.appendChild(div);
    });
}

// === Глобальная функция для доступа из HTML ===
window.showMeshList = showMeshList;
