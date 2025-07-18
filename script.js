// ===== DATASET GAMMA COMPLETO =====

// ===== CREDENCIALES DE AUTENTICACIÓN =====
const VALID_CREDENTIALS = {
    'Usuario 007': 'Swordfish123',
    'Alejandro': 'Arjona'
};

// ===== CONFIGURACIÓN DE COLORES POR AÑO =====
const YEAR_COLORS = {
    2018: '#2C3E50', // Negro/gris oscuro
    2019: '#27AE60', // Verde
    2020: '#3498DB', // Azul
    2021: '#F1C40F', // Amarillo
    2022: '#E67E22', // Naranja
    2023: '#9B59B6', // Morado
    2024: '#95A5A6', // Gris
    2025: '#E74C3C', // Rojo
    '2025p': '#000000' // Negro para estrellas 2025p
};

// ===== VARIABLES GLOBALES =====
let map;
let allData = [];
let filteredData = [];
let markersLayer;
let starsLayer2025p; // Nueva capa para estrellas 2025p
let heatmapConcentracion;
let heatmapVictimas;
let municipalBordersLayer;
let municipioChart;
let anualChart;
let fosasChart;
let fosasAnualChart;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    
    // Cargar datos iniciales desde EXCEL_DATA como respaldo
    allData = EXCEL_DATA;
    filteredData = [...allData];
    
    console.log('Dataset GAMMA cargado:', allData.length, 'registros');
    console.log('Total víctimas:', allData.reduce((sum, item) => sum + item.victimas, 0));
});

// ===== AUTENTICACIÓN =====
function initializeAuth() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (VALID_CREDENTIALS[username] === password) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        document.getElementById('currentUser').textContent = username;
        
        // Inicializar aplicación
        initializeApp();
        
        console.log('Login exitoso para:', username);
    } else {
        alert('Credenciales incorrectas. Solicita ayuda al administrador');
    }
}

function handleLogout() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
function initializeApp() {
    initializeMap();
    populateFilters();
    setupEventListeners();
    updateDashboard(allData);
    updateCharts(allData);
}

// ===== MAPA =====
function initializeMap() {
    // Crear mapa centrado en Jalisco
    map = L.map('map').setView([20.6597, -103.3496], 8);
    
    // Definir capas base
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    });
    
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, Maxar, Earthstar Geographics'
    });
    
    const terrainLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, HERE, Garmin, Intermap, increment P Corp.'
    });
    
    // Agregar capa base predeterminada (Relieve)
    terrainLayer.addTo(map);
    
    // Crear control de capas base
    const baseLayers = {
        "OSM": osmLayer,
        "Satelital": satelliteLayer,
        "Relieve": terrainLayer
    };
    
    // Guardar referencia a las capas base para uso posterior
    window.baseLayers = baseLayers;
    
    // Inicializar capas
    markersLayer = L.layerGroup().addTo(map);
    starsLayer2025p = L.layerGroup().addTo(map); // Nueva capa para estrellas 2025p
    
    // Agregar controles
    addHeatmapControl();
    
    // Cargar marcadores iniciales
    updateMapMarkers(allData);
    
    // Cargar bordes municipales
    loadMunicipalBorders();
}

function updateMapMarkers(data) {
    markersLayer.clearLayers();
    starsLayer2025p.clearLayers();
    
    // Obtener años seleccionados y estado de 2025p
    const selectedYears = getSelectedYears();
    const show2025p = getShow2025p();
    
    data.forEach(item => {
        // Manejar registros 2025p por separado
        if (item.año === '2025p') {
            if (show2025p) {
                createStar2025p(item);
            }
            return;
        }
        
        // Solo mostrar marcadores de años seleccionados (excluyendo 2025p)
        if (!selectedYears.includes(item.año.toString())) {
            return;
        }
        
        const color = YEAR_COLORS[item.año] || '#ff0000';
        
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
        
        const marker = L.marker([item.latitud, item.longitud], {
            icon: customIcon
        });
        
        const popupContent = `
            <div class="popup-content-compact">
                <h4>📍 ${item.municipio}</h4>
                <p><strong>🔢 Referencia:</strong> ${item.referencia}</p>
                <p><strong>👥 Víctimas:</strong> ${item.victimas}</p>
                <p><strong>📅 Año:</strong> ${item.año}</p>
                <p><strong>🚨 Delito:</strong> ${item.delito}</p>
                <p><strong>📍 Coordenadas:</strong> ${item.latitud.toFixed(4)}, ${item.longitud.toFixed(4)}</p>
                ${item.link ? `<p><strong>🔗 Fuente:</strong> <a href="${item.link}" target="_blank">Ver más información</a></p>` : ''}
            </div>
        `;
        
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });
}

// ===== FUNCIÓN PARA CREAR ESTRELLAS 2025P =====
function createStar2025p(item) {
    // Crear icono de estrella negra de 12px
    const starIcon = L.divIcon({
        className: 'star-marker-2025p',
        html: `<div style="color: #000000; font-size: 12px; text-shadow: 1px 1px 2px rgba(255,255,255,0.8);">★</div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
    
    const marker = L.marker([item.latitud, item.longitud], {
        icon: starIcon
    });
    
    // Pop-up especial para 2025p con indicador visual
    const popupContent = `
        <div class="popup-content-compact">
            <h4>⭐ ${item.municipio} (2025p)</h4>
            <p><strong>🔢 Referencia:</strong> ${item.referencia}</p>
            <p><strong>👥 Víctimas:</strong> ${item.victimas}</p>
            <p><strong>📅 Año:</strong> ${item.año}</p>
            <p><strong>🚨 Delito:</strong> ${item.delito}</p>
            <p><strong>📍 Coordenadas:</strong> ${item.latitud.toFixed(4)}, ${item.longitud.toFixed(4)}</p>
            ${item.link ? `<p><strong>🔗 Fuente:</strong> <a href="${item.link}" target="_blank">Ver más información</a></p>` : ''}
        </div>
    `;
    
    marker.bindPopup(popupContent);
    starsLayer2025p.addLayer(marker);
}

// ===== CONTROLES DEL MAPA =====
function addHeatmapControl() {
    const heatmapControl = L.control({position: 'topright'});
    
    heatmapControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-control-heatmap');
        
        div.innerHTML = `
            <h4>Mapa de Calor</h4>
            <div class="heatmap-container">
                <div class="checkbox-container">
                    <div class="checkbox-item">
                        <input type="checkbox" id="heatmapConcentracion">
                        <label for="heatmapConcentracion">Fosas</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="heatmapVictimas">
                        <label for="heatmapVictimas">Víctimas</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" id="municipalBorders" checked>
                        <label for="municipalBorders">Municipios</label>
                    </div>
                </div>
            </div>
            <h4>Mapa Base</h4>
            <div class="base-map-container">
                <div class="radio-container">
                    <div class="radio-item">
                        <input type="radio" id="baseOSM" name="baseLayer" value="OSM">
                        <label for="baseOSM">OSM</label>
                    </div>
                    <div class="radio-item">
                        <input type="radio" id="baseSatelital" name="baseLayer" value="Satelital">
                        <label for="baseSatelital">Satelital</label>
                    </div>
                    <div class="radio-item">
                        <input type="radio" id="baseRelieve" name="baseLayer" value="Relieve" checked>
                        <label for="baseRelieve">Relieve</label>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    };
    
    heatmapControl.addTo(map);
    
    // Event listeners para checkboxes y radio buttons
    setTimeout(() => {
        document.getElementById('heatmapConcentracion').addEventListener('change', toggleHeatmapConcentracion);
        document.getElementById('heatmapVictimas').addEventListener('change', toggleHeatmapVictimas);
        document.getElementById('municipalBorders').addEventListener('change', toggleMunicipalBorders);
        
        // Event listeners para radio buttons de mapa base
        document.getElementById('baseOSM').addEventListener('change', changeBaseLayer);
        document.getElementById('baseSatelital').addEventListener('change', changeBaseLayer);
        document.getElementById('baseRelieve').addEventListener('change', changeBaseLayer);
    }, 100);
}

// ===== MAPAS DE CALOR =====
function toggleHeatmapConcentracion() {
    const checkbox = document.getElementById('heatmapConcentracion');
    
    if (checkbox.checked) {
        if (heatmapConcentracion) {
            map.removeLayer(heatmapConcentracion);
        }
        
        const heatData = filteredData.map(item => [item.latitud, item.longitud, 1]);
        
        heatmapConcentracion = L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
        }).addTo(map);
        
        console.log('Mapa de calor de concentración activado');
    } else {
        if (heatmapConcentracion) {
            map.removeLayer(heatmapConcentracion);
            heatmapConcentracion = null;
        }
        
        console.log('Mapa de calor de concentración desactivado');
    }
}


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////



function toggleHeatmapVictimas() {
    const checkbox = document.getElementById('heatmapVictimas');
    
    if (checkbox.checked) {
        if (heatmapVictimas) {
            map.removeLayer(heatmapVictimas);
        }
        
        // Crear datos del mapa de calor usando valores reales de víctimas del nuevo dataset
        const heatData = filteredData.map(item => {
            const victimas = parseFloat(item.victimas) || 1;
            console.log(`Punto: ${item.municipio}, Colonia: ${item.colonia}, Víctimas: ${victimas}, Coords: [${item.latitud}, ${item.longitud}]`);
            return [parseFloat(item.latitud), parseFloat(item.longitud), victimas];
        });
        
        // Calcular el máximo de víctimas para normalización correcta con el nuevo dataset
        const maxVictimas = Math.max(...filteredData.map(item => parseFloat(item.victimas) || 1));
        console.log('✅ Máximo de víctimas encontrado en nuevo dataset:', maxVictimas);
        console.log('📊 Total de puntos en mapa de calor:', heatData.length);

        heatmapVictimas = L.heatLayer(heatData, {
            radius: 35,           // Radio optimizado para nueva densidad
            blur: 8,              // Blur ajustado para mejor visualización
            maxZoom: 12,          // Zoom máximo ajustado
            max: maxVictimas,     // Usar el máximo real del dataset
            gradient: {
                0.0001: 'rgba(0, 0, 255, 0.1)',      // Azul muy transparente (pocas víctimas)
                0.1: 'rgba(0, 255, 255, 0.4)',       // Cian (víctimas bajas)
                0.3: 'rgba(0, 255, 0, 0.6)',         // Verde (víctimas medias)
                0.5: 'rgba(255, 255, 0, 0.8)',       // Amarillo (víctimas altas)
                0.7: 'rgba(255, 165, 0, 0.9)',       // Naranja (víctimas muy altas)
                1.0: 'rgba(255, 0, 0, 1.0)'          // Rojo intenso (máximas víctimas)
            }
        }).addTo(map);

        console.log('🔥 Mapa de calor DELTA V1.2 - Actualizado con nuevo dataset');
        console.log('📈 Configuración: Radio=35, Blur=8, Max=' + maxVictimas);
        console.log('🎯 Dataset: 205 registros, 1944 víctimas totales');
        
    } else {
        if (heatmapVictimas) {
            map.removeLayer(heatmapVictimas);
            heatmapVictimas = null;
            console.log('❌ Mapa de calor de víctimas desactivado');
        }
    }
}

// ===== BORDES MUNICIPALES =====
async function loadMunicipalBorders() {
    try {
        // Cargar datos GeoJSON de municipios de Jalisco
        const response = await fetch('./jalisco_municipios.geojson');
        const jaliscoData = await response.json();
        
        // Filtrar solo los municipios del AMG
        const municipiosAMG = [
            'Guadalajara', 'Zapopan', 'San Pedro Tlaquepaque', 
            'Tlajomulco de Zuñiga', 'Tonala', 'El Salto', 
            'Juanacatlan', 'Ixtlahuacan de los Membrillos', 'Zapotlanejo'
        ]; 
        
        // Crear capa para municipios del AMG
        const amgFeatures = jaliscoData.features.filter(feature => {
            const municipioName = feature.properties.NOMGEO || feature.properties.name || feature.properties.NOM_MUN;
            return municipiosAMG.some(amgMun => 
                municipioName && municipioName.toLowerCase().includes(amgMun.toLowerCase().replace('ú', 'u').replace('á', 'a'))
            );
        });
        
        const amgBorders = {
            type: "FeatureCollection",
            features: amgFeatures
        };
        
        // Crear capa para el estado de Jalisco (todos los municipios)
        const jaliscoBorders = jaliscoData;
        
        // Agregar bordes de municipios del AMG
        const amgLayer = L.geoJSON(amgBorders, {
            style: function(feature) {
                const municipioName = feature.properties.NOMGEO || feature.properties.name || feature.properties.NOM_MUN;
                const municipiosConSombreado = ['Guadalajara', 'Zapopan', 'San Pedro Tlaquepaque','Tlajomulco de Zuñiga', 'Tonala', 'El Salto', 'Juanacatlan', 'Ixtlahuacan de los Membrillos', 'Zapotlanejo'];
                
                // Verificar si este municipio necesita sombreado
                const necesitaSombreado = municipiosConSombreado.some(mun => 
                    municipioName && municipioName.toLowerCase().includes(mun.toLowerCase().replace('ú', 'u').replace('á', 'a'))
                );
                
                return {
                    color: '#95B634',
                    weight: 2,
                    opacity: 0.5,
                    fillOpacity: necesitaSombreado ? 0.3 : 0.1,
                    fillColor: '#E74C3C'
                };
            },
            onEachFeature: function(feature, layer) {
                const municipioName = feature.properties.NOMGEO || feature.properties.name || feature.properties.NOM_MUN;
                layer.bindPopup(`<strong>Municipio AMG:</strong> ${municipioName}`);
            }
        });
        
        // Agregar bordes del estado de Jalisco
        const jaliscoLayer = L.geoJSON(jaliscoBorders, {
            style: {
                color: '#2C3E50',
                weight: 1,
                opacity: 0.6,
                fillOpacity: 0.1,
                dashArray: '3,3'
            },
            onEachFeature: function(feature, layer) {
                const municipioName = feature.properties.NOMGEO || feature.properties.name || feature.properties.NOM_MUN;
                layer.bindPopup(`<strong>Municipio:</strong> ${municipioName}`);
            }
        });
        
        // Crear grupo de capas
        municipalBordersLayer = L.layerGroup([jaliscoLayer, amgLayer]).addTo(map);
        
        console.log('✅ Bordes municipales cargados:', amgFeatures.length, 'municipios AMG y', jaliscoBorders.features.length, 'municipios totales');
        
    } catch (error) {
        console.error('Error cargando bordes municipales:', error);
        
        // Fallback a datos simplificados
        const municipalBorders = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": {"name": "Guadalajara"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-103.4200, 20.6200], [-103.3800, 20.6200], [-103.3800, 20.6800], 
                            [-103.3400, 20.6800], [-103.3400, 20.7200], [-103.4200, 20.7200], 
                            [-103.4200, 20.6200]
                        ]]
                    }
                },
                {
                    "type": "Feature", 
                    "properties": {"name": "Zapopan"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-103.4600, 20.6800], [-103.3400, 20.6800], [-103.3400, 20.7600],
                            [-103.4600, 20.7600], [-103.4600, 20.6800]
                        ]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"name": "Tlajomulco de Zúñiga"},
                    "geometry": {
                        "type": "Polygon", 
                        "coordinates": [[
                            [-103.5200, 20.4200], [-103.4400, 20.4200], [-103.4400, 20.5200],
                            [-103.5200, 20.5200], [-103.5200, 20.4200]
                        ]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"name": "Tonalá"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-103.2800, 20.6000], [-103.2200, 20.6000], [-103.2200, 20.6600],
                            [-103.2800, 20.6600], [-103.2800, 20.6000]
                        ]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"name": "El Salto"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-103.2400, 20.5000], [-103.1800, 20.5000], [-103.1800, 20.5600],
                            [-103.2400, 20.5600], [-103.2400, 20.5000]
                        ]]
                    }
                },
                {
                    "type": "Feature",
                    "properties": {"name": "San Pedro Tlaquepaque"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[
                            [-103.3400, 20.6000], [-103.2800, 20.6000], [-103.2800, 20.6400],
                            [-103.3400, 20.6400], [-103.3400, 20.6000]
                        ]]
                    }
                }
            ]
        };
        
        municipalBordersLayer = L.geoJSON(municipalBorders, {
            style: {
                color: '#2C3E50',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0,
                dashArray: '5,5'
            }
        }).addTo(map);
        
        console.log('✅ Bordes municipales cargados (fallback)');
    }
}

function toggleMunicipalBorders() {
    const checkbox = document.getElementById('municipalBorders');
    
    if (checkbox.checked) {
        if (municipalBordersLayer) {
            municipalBordersLayer.addTo(map);
            console.log('✅ Bordes municipales activados');
        }
    } else {
        if (municipalBordersLayer) {
            map.removeLayer(municipalBordersLayer);
            console.log('❌ Bordes municipales desactivados');
        }
    }
}

// ===== FILTROS =====
function populateFilters() {
    populateMunicipioFilter();
    populateDelitoFilter();
    setupTimelineControls();
}

function populateMunicipioFilter() {
    const municipioFilter = document.getElementById('municipioFilter');
    const municipios = [...new Set(allData.map(item => item.municipio))].sort();
    
    municipioFilter.innerHTML = '<option value="">Todos los municipios</option>';
    municipios.forEach(municipio => {
        const option = document.createElement('option');
        option.value = municipio;
        option.textContent = municipio;
        municipioFilter.appendChild(option);
    });
}

function populateDelitoFilter() {
    const delitoFilter = document.getElementById('delitoFilter');
    const delitos = [...new Set(allData.map(item => item.delito))].sort();
    
    delitoFilter.innerHTML = '<option value="">Todos los delitos</option>';
    delitos.forEach(delito => {
        const option = document.createElement('option');
        option.value = delito;
        option.textContent = delito;
        delitoFilter.appendChild(option);
    });
}

function setupTimelineControls() {
    const startYear = document.getElementById('startYear');
    const endYear = document.getElementById('endYear');
    const startYearValue = document.getElementById('startYearValue');
    const endYearValue = document.getElementById('endYearValue');
    
    startYear.addEventListener('input', function() {
        startYearValue.textContent = this.value;
    });
    
    endYear.addEventListener('input', function() {
        endYearValue.textContent = this.value;
    });
}

function setupEventListeners() {
    document.getElementById('applyFilters').addEventListener('click', applyAllFilters);
    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
    document.getElementById('exportResults').addEventListener('click', exportFilteredData);
    
    // Event listeners para filtros de año (sliders)
    document.getElementById('startYear').addEventListener('input', function() {
        document.getElementById('startYearValue').textContent = this.value;
    });
    
    document.getElementById('endYear').addEventListener('input', function() {
        document.getElementById('endYearValue').textContent = this.value;
    });
    
    // Event listeners para filtros de mes (selectores)
    document.getElementById('startMonth').addEventListener('change', function() {
        console.log('Mes de inicio cambiado a:', this.value);
    });
    
    document.getElementById('endMonth').addEventListener('change', function() {
        console.log('Mes de fin cambiado a:', this.value);
    });
    
    // Event listeners para la simbología por año
    setupYearSymbologyListeners();
}

// ===== FUNCIONES DE SIMBOLOGÍA POR AÑO =====
function setupYearSymbologyListeners() {
    const yearCheckboxes = document.querySelectorAll('.year-checkbox input[type="checkbox"]');
    
    yearCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            // Actualizar marcadores cuando cambie la selección
            updateMapMarkers(filteredData.length > 0 ? filteredData : allData);
        });
    });
    
    // Event listener específico para checkbox 2025p
    const checkbox2025p = document.getElementById('show2025p');
    if (checkbox2025p) {
        checkbox2025p.addEventListener('change', function() {
            // Actualizar marcadores cuando cambie la selección de 2025p
            updateMapMarkers(filteredData.length > 0 ? filteredData : allData);
        });
    }
}

function getSelectedYears() {
    const yearCheckboxes = document.querySelectorAll('.year-checkbox input[type="checkbox"]:checked');
    return Array.from(yearCheckboxes).map(checkbox => checkbox.value);
}

function getShow2025p() {
    const checkbox2025p = document.getElementById('show2025p');
    return checkbox2025p ? checkbox2025p.checked : false;
}

function applyAllFilters() {
    const municipioFilter = document.getElementById('municipioFilter').value;
    const delitoFilter = document.getElementById('delitoFilter').value;
    const startYear = parseInt(document.getElementById('startYear').value);
    const endYear = parseInt(document.getElementById('endYear').value);
    const startMonth = parseInt(document.getElementById('startMonth').value);
    const endMonth = parseInt(document.getElementById('endMonth').value);
    
    // Mapeo de nombres de meses en español a números (0-11)
    const monthMap = {
        'ENERO': 0, 'FEBRERO': 1, 'MARZO': 2, 'ABRIL': 3,
        'MAYO': 4, 'JUNIO': 5, 'JULIO': 6, 'AGOSTO': 7,
        'SEPTIEMBRE': 8, 'OCTUBRE': 9, 'NOVIEMBRE': 10, 'DICIEMBRE': 11
    };
    
    filteredData = allData.filter(item => {
        const municipioMatch = !municipioFilter || item.municipio === municipioFilter;
        const delitoMatch = !delitoFilter || item.delito === delitoFilter;
        
        // Filtrado por año
        const yearMatch = item.año >= startYear && item.año <= endYear;
        
        // Filtrado por mes
        let monthMatch = true;
        if (item.mes && monthMap.hasOwnProperty(item.mes.toUpperCase())) {
            const itemMonth = monthMap[item.mes.toUpperCase()];
            
            // Si el año de inicio y fin son diferentes, aplicar lógica especial
            if (startYear !== endYear) {
                if (item.año === startYear) {
                    monthMatch = itemMonth >= startMonth;
                } else if (item.año === endYear) {
                    monthMatch = itemMonth <= endMonth;
                } else if (item.año > startYear && item.año < endYear) {
                    monthMatch = true; // Años intermedios incluyen todos los meses
                }
            } else {
                // Mismo año: filtrar por rango de meses
                monthMatch = itemMonth >= startMonth && itemMonth <= endMonth;
            }
        }
        
        return municipioMatch && delitoMatch && yearMatch && monthMatch;
    });
    
    updateDashboard(filteredData);
    updateCharts(filteredData);
    updateMapMarkers(filteredData);
    
    // Actualizar mapas de calor si están activos
    if (document.getElementById('heatmapConcentracion').checked) {
        toggleHeatmapConcentracion();
        document.getElementById('heatmapConcentracion').checked = true;
        toggleHeatmapConcentracion();
    }
    
    if (document.getElementById('heatmapVictimas').checked) {
        toggleHeatmapVictimas();
        document.getElementById('heatmapVictimas').checked = true;
        toggleHeatmapVictimas();
    }
    
    console.log('Filtros aplicados. Registros filtrados:', filteredData.length);
}

function clearAllFilters() {
    document.getElementById('municipioFilter').value = '';
    document.getElementById('delitoFilter').value = '';
    document.getElementById('startYear').value = '2018';
    document.getElementById('endYear').value = '2025';
    document.getElementById('startMonth').value = '0';
    document.getElementById('endMonth').value = '11';
    document.getElementById('startYearValue').textContent = '2018';
    document.getElementById('endYearValue').textContent = '2025';
    
    filteredData = [...allData];
    updateDashboard(filteredData);
    updateCharts(filteredData);
    updateMapMarkers(filteredData);
    
    console.log('Filtros limpiados. Mostrando todos los datos:', filteredData.length);
}

// ===== DASHBOARD =====
function updateDashboard(data) {
    const totalRegistros = data.length;
    const totalVictimas = data.reduce((sum, item) => sum + item.victimas, 0);
    
    document.getElementById('totalRegistros').textContent = totalRegistros;
    document.getElementById('totalVictimas').textContent = totalVictimas;
}

// ===== GRÁFICAS =====
function updateCharts(data) {
    updateMunicipioChart(data);
    updateAnualChart(data);
    updateFosasChart(data);
    updateFosasAnualChart(data);
}

function updateMunicipioChart(data) {
    const municipioData = {};
    data.forEach(item => {
        municipioData[item.municipio] = (municipioData[item.municipio] || 0) + item.victimas;
    });
    
    const sortedData = Object.entries(municipioData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const ctx = document.getElementById('municipioChart').getContext('2d');
    
    if (municipioChart) {
        municipioChart.destroy();
    }
    
    municipioChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(([municipio]) => municipio),
            datasets: createStackedDatasets(sortedData, data)
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

function createStackedDatasets(sortedData, data) {
    const municipios = sortedData.map(([municipio]) => municipio);
    const years = Object.keys(YEAR_COLORS).filter(year => year !== '2025p').sort();
    
    return years.map(year => {
        const yearInt = parseInt(year);
        const chartData = municipios.map(municipio => {
            const municipioData = data.filter(item => 
                item.municipio === municipio && item.año === yearInt
            );
            return municipioData.reduce((sum, item) => sum + item.victimas, 0);
        });
        
        return {
            label: year,
            data: chartData,
            backgroundColor: YEAR_COLORS[year],
            borderColor: YEAR_COLORS[year],
            borderWidth: 1
        };
    });
}

function updateAnualChart(data) {
    // Definir los 9 municipios del AMG
    const municipiosAMG = [
        'Guadalajara',
        'Zapopan', 
        'San Pedro Tlaquepaque',
        'Tlajomulco de Zúñiga',
        'Tonala',
        'El Salto',
        'Juanacatlán',
        'Ixtlahuacan de los Membrillos',
        'Zapotlanejo'
    ];
    
    // Agrupar datos por año y municipio
    const anualData = {};
    data.forEach(item => {
        if (!anualData[item.año]) {
            anualData[item.año] = {};
        }
        
        // Determinar si es municipio AMG o Interior del estado
        const municipioKey = municipiosAMG.includes(item.municipio) ? item.municipio : 'Interior del estado';
        
        anualData[item.año][municipioKey] = (anualData[item.año][municipioKey] || 0) + item.victimas;
    });
    
    // Obtener años ordenados
    const años = Object.keys(anualData).sort();
    
    // Crear lista de municipios: 9 del AMG + Interior del estado
    const municipiosParaGrafico = [...municipiosAMG, 'Interior del estado'];
    
    // Crear datasets para cada municipio/grupo
    const datasets = municipiosParaGrafico.map((municipio, index) => {
        // Colores para los 9 municipios del AMG
        const coloresAMG = [
            '#2C3E50', '#27AE60', '#3498DB', '#F1C40F', '#E67E22', 
            '#9B59B6', '#95A5A6', '#E74C3C', '#34495E'
        ];
        
        // Color negro para Interior del estado
        const color = municipio === 'Interior del estado' ? '#000000' : coloresAMG[index];
        
        return {
            label: municipio,
            data: años.map(año => {
                return anualData[año] && anualData[año][municipio] ? anualData[año][municipio] : 0;
            }),
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1
        };
    });
    
    const ctx = document.getElementById('anualChart').getContext('2d');
    
    if (anualChart) {
        anualChart.destroy();
    }
    
    anualChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: años,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Año'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Víctimas'
                    }
                }
            }
        }
    });
}

// ===== NUEVOS GRÁFICOS DE FOSAS CLANDESTINAS =====

function updateFosasChart(data) {
    // Gráfico 1: Fosas clandestinas por municipio (Stacked Bar Chart)
    
    // Agrupar datos por municipio y año
    const fosasData = {};
    data.forEach(item => {
        if (!fosasData[item.municipio]) {
            fosasData[item.municipio] = {};
        }
        fosasData[item.municipio][item.año] = (fosasData[item.municipio][item.año] || 0) + 1;
    });
    
    // Calcular totales por municipio y ordenar descendente
    const municipioTotals = {};
    Object.keys(fosasData).forEach(municipio => {
        municipioTotals[municipio] = Object.values(fosasData[municipio]).reduce((sum, count) => sum + count, 0);
    });
    
    const municipiosOrdenados = Object.keys(municipioTotals)
        .sort((a, b) => municipioTotals[b] - municipioTotals[a])
        .slice(0, 8); // Mostrar top 8 municipios
    
    // Obtener todos los años únicos y ordenarlos
    const años = [...new Set(data.map(item => item.año))].sort();
    
    // Crear datasets para cada año (cada año será un segmento apilado)
    const coloresAños = {
        2018: '#2C3E50', // Negro/gris oscuro
        2019: '#27AE60', // Verde
        2020: '#3498DB', // Azul
        2021: '#F1C40F', // Amarillo
        2022: '#E67E22', // Naranja
        2023: '#9B59B6', // Morado
        2024: '#95A5A6', // Gris
        2025: '#E74C3C'  // Rojo
    };
    
    const datasets = años.map(año => {
        return {
            label: año.toString(),
            data: municipiosOrdenados.map(municipio => {
                return fosasData[municipio] && fosasData[municipio][año] ? fosasData[municipio][año] : 0;
            }),
            backgroundColor: coloresAños[año] || '#BDC3C7',
            borderColor: coloresAños[año] || '#BDC3C7',
            borderWidth: 1
        };
    });
    
    const ctx = document.getElementById('fosasChart').getContext('2d');
    
    if (fosasChart) {
        fosasChart.destroy();
    }
    
    fosasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: municipiosOrdenados,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Municipios'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Número de Fosas'
                    }
                }
            }
        }
    });
}

function updateFosasAnualChart(data) {
    // Definir los 9 municipios del AMG
    const municipiosAMG = [
        'Guadalajara',
        'Zapopan', 
        'San Pedro Tlaquepaque',
        'Tlajomulco de Zúñiga',
        'Tonalá',
        'El Salto',
        'Juanacatlán',
        'Ixtlahuacan de los Membrillos',
        'Zapotlanejo'
    ];
    
    // Agrupar datos por año y municipio
    const fosasAnualData = {};
    data.forEach(item => {
        if (!fosasAnualData[item.año]) {
            fosasAnualData[item.año] = {};
        }
        
        // Determinar si es municipio AMG o Interior del estado
        const municipioKey = municipiosAMG.includes(item.municipio) ? item.municipio : 'Interior del estado';
        
        fosasAnualData[item.año][municipioKey] = (fosasAnualData[item.año][municipioKey] || 0) + 1;
    });
    
    // Obtener años ordenados
    const años = Object.keys(fosasAnualData).sort();
    
    // Crear lista de municipios: 9 del AMG + Interior del estado
    const municipiosParaGrafico = [...municipiosAMG, 'Interior del estado'];
    
    // Crear datasets para cada municipio/grupo
    const datasets = municipiosParaGrafico.map((municipio, index) => {
        // Colores para los 9 municipios del AMG
        const coloresAMG = [
            '#2C3E50', '#27AE60', '#3498DB', '#F1C40F', '#E67E22', 
            '#9B59B6', '#95A5A6', '#E74C3C', '#34495E'
        ];
        
        // Color negro para Interior del estado
        const color = municipio === 'Interior del estado' ? '#000000' : coloresAMG[index];
        
        return {
            label: municipio,
            data: años.map(año => {
                return fosasAnualData[año] && fosasAnualData[año][municipio] ? fosasAnualData[año][municipio] : 0;
            }),
            backgroundColor: color,
            borderColor: color,
            borderWidth: 1
        };
    });
    
    const ctx = document.getElementById('fosasAnualChart').getContext('2d');
    
    if (fosasAnualChart) {
        fosasAnualChart.destroy();
    }
    
    fosasAnualChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: años,
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 8,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Año'
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Fosas Clandestinas'
                    }
                }
            }
        }
    });
}

// ===== EXPORTACIÓN =====
function exportFilteredData() {
    try {
        const dataToExport = filteredData.length > 0 ? filteredData : allData;
        
        if (dataToExport.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        // Encabezados exactos según especificación
        const headers = ['Referencia', 'Municipio', 'Colonia', 'Victimas', 'Año', 'Delito', 'Latitud', 'Longitud', 'Link'];
        
        // Función para escapar y formatear campos CSV correctamente
        function formatCSVField(value) {
            if (value === null || value === undefined) {
                return '""';
            }
            
            // Convertir a string y limpiar caracteres problemáticos
            let cleanValue = String(value)
                .replace(/"/g, '""')  // Escapar comillas dobles
                .trim();
            
            // Siempre envolver en comillas para consistencia
            return `"${cleanValue}"`;
        }
        
        // Crear contenido CSV con formato correcto
        const csvRows = [];
        
        // Agregar encabezados
        csvRows.push(headers.map(header => formatCSVField(header)).join(','));
        
        // Agregar datos
        dataToExport.forEach(item => {
            const row = [
                item.referencia || '',
                item.municipio || '',
                item.colonia || '', // Corregido: ahora incluye el campo colonia del dataset
                item.victimas || '',
                item.año || '',
                item.delito || '',
                item.latitud || '',
                item.longitud || '',
                item.link || ''
            ];
            
            csvRows.push(row.map(field => formatCSVField(field)).join(','));
        });
        
        // Unir todas las filas con saltos de línea
        const csvContent = csvRows.join('\n');
        
        // Agregar BOM para UTF-8
        const BOM = '\uFEFF';
        const csvWithBOM = BOM + csvContent;
        
        // Crear blob con codificación UTF-8 explícita
        const blob = new Blob([csvWithBOM], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        // Crear enlace de descarga
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `datos_victimas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL
        URL.revokeObjectURL(url);
        
        console.log('✅ Datos exportados correctamente:', dataToExport.length, 'registros');
        console.log('📁 Formato: CSV UTF-8 con estructura de filas y columnas');
        
    } catch (error) {
        console.error('❌ Error al exportar datos:', error);
        alert('Error al exportar los datos. Por favor, inténtelo de nuevo.');
    }
}

const EXCEL_DATA = [
    {
        "referencia": 1,
        "municipio": "Lagos de Moreno",
        "colonia": "Buenavista",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2018,
        "latitud": 21.3895113370408,
        "longitud": -101.965917175827,
        "link": "https://udgtv.com/noticias/lagos-de-moreno-la-ciudad-fuera-del-area-metropolitana-con-mayor-numero-de-inhumaciones-clandestinas/59276"
    },
    {
        "referencia": 2,
        "municipio": "El Salto",
        "colonia": "Las Pintitas",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2018,
        "latitud": 20.5577432493243,
        "longitud": -103.31138389172,
        "link": "https://lasillarota.com/estados/2018/6/7/suman-cuerpos-en-fosa-de-el-salto-jalisco-160628.html"
    },
    {
        "referencia": 3,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "La Cofradía",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.4719319547742,
        "longitud": -103.558600621071,
        "link": ""
    },
    {
        "referencia": 4,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Mirador",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2019,
        "latitud": 20.4990346168608,
        "longitud": -103.343539079088,
        "link": "https://www.informador.mx/jalisco/Encuentran-restos-humanos-en-Villa-Fontana-Aqua-20190117-0126.html"
    },
    {
        "referencia": 5,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.4702630516195,
        "longitud": -103.482287149344,
        "link": "https://www.zonadocs.mx/2019/06/25/metropoli-con-terror-y-en-silencio-las-fosas-dentro-de-tu-casa/"
    },
    {
        "referencia": 6,
        "municipio": "Zapopan",
        "colonia": "Nextipac",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2019,
        "latitud": 20.7835563323789,
        "longitud": -103.510216144596,
        "link": "https://www.zonadocs.mx/2019/06/25/metropoli-con-terror-y-en-silencio-las-fosas-dentro-de-tu-casa/"
    },
    {
        "referencia": 7,
        "municipio": "El Salto",
        "colonia": "Cab. Mun. El Salto",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.5200006473258,
        "longitud": -103.174986616342,
        "link": ""
    },
    {
        "referencia": 8,
        "municipio": "Zapopan",
        "colonia": "La Venta del Astillero",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2019,
        "latitud": 20.7307216747426,
        "longitud": -103.54001664956,
        "link": ""
    },
    {
        "referencia": 9,
        "municipio": "Villa Guerrero",
        "colonia": "Villa Guerrero",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2019,
        "latitud": 21.9949729918288,
        "longitud": -103.596059460411,
        "link": "https://www.zonadocs.mx/2019/06/25/metropoli-con-terror-y-en-silencio-las-fosas-dentro-de-tu-casa/"
    },
    {
        "referencia": 10,
        "municipio": "Zapopan",
        "colonia": "El Colli Urbano",
        "delito": "Fosa",
        "victimas": 17,
        "año": 2019,
        "latitud": 20.6432507882973,
        "longitud": -103.429482740249,
        "link": "https://www.zonadocs.mx/2019/06/25/metropoli-con-terror-y-en-silencio-las-fosas-dentro-de-tu-casa/"
    },
    {
        "referencia": 11,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Santa Cruz del Valle",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2019,
        "latitud": 20.5432389840214,
        "longitud": -103.339275118008,
        "link": "https://www.zonadocs.mx/2019/06/25/metropoli-con-terror-y-en-silencio-las-fosas-dentro-de-tu-casa/"
    },
    {
        "referencia": 12,
        "municipio": "Guadalajara",
        "colonia": "Quinta Velarde",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2019,
        "latitud": 20.6595595109624,
        "longitud": -103.332031152786,
        "link": "https://www.zonadocs.mx/2019/06/25/metropoli-con-terror-y-en-silencio-las-fosas-dentro-de-tu-casa/"
    },
    {
        "referencia": 13,
        "municipio": "Zapopan",
        "colonia": "El Campanario",
        "delito": "Fosa",
        "victimas": 30,
        "año": 2019,
        "latitud": 20.5932236508434,
        "longitud": -103.435363289287,
        "link": "https://www.zonadocs.mx/2019/06/25/metropoli-con-terror-y-en-silencio-las-fosas-dentro-de-tu-casa/"
    },
    {
        "referencia": 14,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Mirador",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.5008519759698,
        "longitud": -103.353397332453,
        "link": ""
    },
    {
        "referencia": 15,
        "municipio": "Lagos de Moreno",
        "colonia": "Ladera Grande",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2019,
        "latitud": 21.3691017430895,
        "longitud": -101.953409529161,
        "link": "https://udgtv.com/noticias/lagos-de-moreno-la-ciudad-fuera-del-area-metropolitana-con-mayor-numero-de-inhumaciones-clandestinas/59276"
    },
    {
        "referencia": 16,
        "municipio": "Pihuamo",
        "colonia": "Pihuamo",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 19.2547090645271,
        "longitud": -103.381562658628,
        "link": "https://www.jornada.com.mx/2019/12/30/estados/020n1est"
    },
    {
        "referencia": 17,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Santa Cruz de la Loma",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.485886021068,
        "longitud": -103.550939995525,
        "link": ""
    },
    {
        "referencia": 18,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "El Campesino",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2019,
        "latitud": 20.604866262275,
        "longitud": -103.332443723898,
        "link": ""
    },
    {
        "referencia": 19,
        "municipio": "El Salto",
        "colonia": "San Jose del Castillo",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.5091920364168,
        "longitud": -103.236249681963,
        "link": ""
    },
    {
        "referencia": 20,
        "municipio": "Ixtlahuacán de los Membrillos",
        "colonia": "Los Olivos",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2019,
        "latitud": 20.4455202653717,
        "longitud": -103.236996969028,
        "link": ""
    },
    {
        "referencia": 21,
        "municipio": "Tonalá",
        "colonia": "Santa Cruz de las Huertas",
        "delito": "Fosa",
        "victimas": 20,
        "año": 2019,
        "latitud": 20.6209176963335,
        "longitud": -103.265223535284,
        "link": ""
    },
    {
        "referencia": 22,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2019,
        "latitud": 20.4962025677515,
        "longitud": -103.364609420148,
        "link": ""
    },
    {
        "referencia": 23,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2019,
        "latitud": 20.4961539819963,
        "longitud": -103.364506175418,
        "link": ""
    },
    {
        "referencia": 24,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 9,
        "año": 2019,
        "latitud": 20.499479350252,
        "longitud": -103.361619752365,
        "link": "https://www.zonadocs.mx/2019/06/25/metropoli-con-terror-y-en-silencio-las-fosas-dentro-de-tu-casa/"
    },
    {
        "referencia": 25,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Mirador",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.4946959465542,
        "longitud": -103.345673366811,
        "link": ""
    },
    {
        "referencia": 26,
        "municipio": "Zapopan",
        "colonia": "La Primavera",
        "delito": "Fosa",
        "victimas": 43,
        "año": 2019,
        "latitud": 20.7188737723301,
        "longitud": -103.561646929457,
        "link": "https://www.zonadocs.mx/2019/09/11/el-pozo-de-los-horrores-en-jalisco/"
    },
    {
        "referencia": 27,
        "municipio": "Guadalajara",
        "colonia": "San Eugenio",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.6806747339209,
        "longitud": -103.290108923927,
        "link": ""
    },
    {
        "referencia": 28,
        "municipio": "Zapopan",
        "colonia": "La Primavera",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2019,
        "latitud": 20.7185912244324,
        "longitud": -103.56163606223,
        "link": "https://www.zonadocs.mx/2019/09/11/el-pozo-de-los-horrores-en-jalisco/"
    },
    {
        "referencia": 29,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Hacienda Santa Fe",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.5118853250087,
        "longitud": -103.380044126765,
        "link": ""
    },
    {
        "referencia": 30,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2019,
        "latitud": 20.4926117971955,
        "longitud": -103.353496765739,
        "link": ""
    },
    {
        "referencia": 31,
        "municipio": "Ixtlahuacán de los Membrillos",
        "colonia": "Los Olivos",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2019,
        "latitud": 20.4384307730674,
        "longitud": -103.23069965815,
        "link": ""
    },
    {
        "referencia": 32,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "El Zapote",
        "delito": "Fosa",
        "victimas": 31,
        "año": 2019,
        "latitud": 20.4880768671271,
        "longitud": -103.446261415573,
        "link": ""
    },
    {
        "referencia": 33,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "El Mirador",
        "delito": "Fosa",
        "victimas": 54,
        "año": 2019,
        "latitud": 20.4860198550781,
        "longitud": -103.342642649566,
        "link": ""
    },
    {
        "referencia": 34,
        "municipio": "Lagos de Moreno",
        "colonia": "Chipinque de Arriba",
        "delito": "Fosa",
        "victimas": 16,
        "año": 2019,
        "latitud": 21.4310347998051,
        "longitud": -101.908250660621,
        "link": "https://udgtv.com/noticias/lagos-de-moreno-la-ciudad-fuera-del-area-metropolitana-con-mayor-numero-de-inhumaciones-clandestinas/59276"
    },
    {
        "referencia": 35,
        "municipio": "Tonalá",
        "colonia": "Zalatitan",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2019,
        "latitud": 20.6582681041253,
        "longitud": -103.261917029334,
        "link": "http://www.especialistas.com.mx/genericas/detallenotaenlace.aspx?id=360253128&idc=2621&servicio=4&costo=8772"
    },
    {
        "referencia": 36,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Buenos Aires",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2019,
        "latitud": 20.604091645137,
        "longitud": -103.366452052142,
        "link": ""
    },
    {
        "referencia": 37,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "El Mirador",
        "delito": "Fosa",
        "victimas": 110,
        "año": 2019,
        "latitud": 20.4847299241422,
        "longitud": -103.34318062621,
        "link": ""
    },
    {
        "referencia": 38,
        "municipio": "Lagos de Moreno",
        "colonia": "0",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2019,
        "latitud": 21.4172647507238,
        "longitud": -101.894363379142,
        "link": "https://oem.com.mx/elsoldemexico/mexico/descubren-otra-fosa-clandestina-en-lagos-de-moreno-jalisco-15425297"
    },
    {
        "referencia": 39,
        "municipio": "Lagos de Moreno",
        "colonia": "La Estanzuela",
        "delito": "Fosa",
        "victimas": 9,
        "año": 2020,
        "latitud": 21.5153578216904,
        "longitud": -101.989512500246,
        "link": "https://oem.com.mx/elsoldemexico/mexico/descubren-otra-fosa-clandestina-en-lagos-de-moreno-jalisco-15425297"
    },
    {
        "referencia": 40,
        "municipio": "Zapopan",
        "colonia": "Lomas del Centinela",
        "delito": "Fosa",
        "victimas": 14,
        "año": 2020,
        "latitud": 20.7690913402164,
        "longitud": -103.36583386934,
        "link": "https://www.milenio.com/policia/zapopan-hallan-cuerpos-fosa-vistas-centinela"
    },
    {
        "referencia": 41,
        "municipio": "Jocotepec",
        "colonia": "Jocotepec",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2020,
        "latitud": 20.2747558490475,
        "longitud": -103.422314705178,
        "link": "https://oem.com.mx/eloccidental/policiaca/se-han-localizado-563-bolsas-con-restos-humanos-en-el-estado-15745949"
    },
    {
        "referencia": 42,
        "municipio": "Juanacatlán",
        "colonia": "El Saucillo",
        "delito": "Fosa",
        "victimas": 95,
        "año": 2020,
        "latitud": 20.4814939011607,
        "longitud": -103.108238256407,
        "link": "https://www.meganoticias.mx/guadalajara/noticia/el-cuerpo-de-luis-martin-duro-4-anos-en-semefo/607154"
    },
    {
        "referencia": 43,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "La Calerilla",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2020,
        "latitud": 20.5656362883708,
        "longitud": -103.400077960293,
        "link": "https://www.informador.mx/jalisco/En-lo-que-va-del-ano-la-Fiscalia-halla-17-fosas-arresta-solo-a-uno-20200520-0021.html"
    },
    {
        "referencia": 44,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Santa Cruz del Valle",
        "delito": "Fosa",
        "victimas": 30,
        "año": 2020,
        "latitud": 20.5469637075039,
        "longitud": -103.335377219503,
        "link": "https://www.cascadanoticias.com/noticias/jalisco-noticias/jalisco/desde-hace-un-ano-estaban-restos-de-karey-franco-en-ijcf"
    },
    {
        "referencia": 45,
        "municipio": "Zapopan",
        "colonia": "Nextipac",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2020,
        "latitud": 20.7647829192104,
        "longitud": -103.533812671443,
        "link": "https://www.proceso.com.mx/nacional/estados/2020/6/20/recuperan-75-bolsas-con-restos-humanos-de-fosas-clandestinas-en-jalisco-244878.html"
    },
    {
        "referencia": 46,
        "municipio": "El Salto",
        "colonia": "La Pedrera",
        "delito": "Fosa",
        "victimas": 27,
        "año": 2020,
        "latitud": 20.5455854538232,
        "longitud": -103.316610917386,
        "link": "https://oem.com.mx/elsoldemexico/mexico/hallan-fosa-clandestina-con-25-cuerpos-en-el-salto-jalisco-13096671"
    },
    {
        "referencia": 47,
        "municipio": "Zapopan",
        "colonia": "Agrícola",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2020,
        "latitud": 20.6159728692993,
        "longitud": -103.43212235837,
        "link": "https://jalisco.quadratin.com.mx/principal/van-215-cuerpos-hallados-en-fosas-de-jalisco-en-lo-que-va-del-2020/"
    },
    {
        "referencia": 48,
        "municipio": "Zapopan",
        "colonia": "Lomas del Refugio",
        "delito": "Fosa",
        "victimas": 42,
        "año": 2020,
        "latitud": 20.7472467085021,
        "longitud": -103.334227755933,
        "link": "https://oem.com.mx/eloccidental/policiaca/noticias-fosas-clandestinas-restos-humanos-identifican-cuerpos-santa-anita-y-la-higuera-15718194?token=-48247071"
    },
    {
        "referencia": 49,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "España",
        "delito": "Fosa",
        "victimas": 46,
        "año": 2020,
        "latitud": 20.5540927246676,
        "longitud": -103.447619442756,
        "link": "https://www.informador.mx/jalisco/Con-86-bolsas-con-restos-concluye-busqueda-en-fosa-de-Santa-Anita-20200702-0112.html"
    },
    {
        "referencia": 50,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Sur",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2020,
        "latitud": 20.4904532392129,
        "longitud": -103.411454066173,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=150332"
    },
    {
        "referencia": 51,
        "municipio": "El Salto",
        "colonia": "El Pedregal",
        "delito": "Fosa",
        "victimas": 30,
        "año": 2020,
        "latitud": 20.5087068309606,
        "longitud": -103.183940218077,
        "link": "https://animalpolitico.com/2020/07/hallan-cuerpos-fosa-clandestina-salto-jalisco"
    },
    {
        "referencia": 52,
        "municipio": "Lagos de Moreno",
        "colonia": "Tepeyac",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2020,
        "latitud": 21.375874644141,
        "longitud": -101.921814517128,
        "link": "https://oem.com.mx/eloccidental/policiaca/noticias-policiaca-localizacion-restos-personas-semienterradas-lagos-de-moreno-15723865?token=1818764635"
    },
    {
        "referencia": 53,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "El Campesino",
        "delito": "Fosa",
        "victimas": 10,
        "año": 2020,
        "latitud": 20.6048403314713,
        "longitud": -103.332538629478,
        "link": "https://www.milenio.com/policia/tlaquepaque-intervienen-fosa-clandestina"
    },
    {
        "referencia": 54,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "El Campesino",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2020,
        "latitud": 20.6047937771247,
        "longitud": -103.332631738171,
        "link": "https://www.milenio.com/policia/tlaquepaque-intervienen-fosa-clandestina"
    },
    {
        "referencia": 55,
        "municipio": "Tonalá",
        "colonia": "Las Torres",
        "delito": "Fosa",
        "victimas": 30,
        "año": 2020,
        "latitud": 20.6634754439815,
        "longitud": -103.253666702127,
        "link": "https://democratacoahuila.com/2021/05/19/localizan-al-menos-70-bolsas-con-restos-humanos-en-fosa-clandestina-de-tonala/?noamp=mobile&amp"
    },
    {
        "referencia": 56,
        "municipio": "Ixtlahuacán de los Membrillos",
        "colonia": "Los Olivos",
        "delito": "Fosa",
        "victimas": 34,
        "año": 2020,
        "latitud": 20.4346045623968,
        "longitud": -103.234938667051,
        "link": "https://oem.com.mx/eloccidental/policiaca/noticias-violencia-policiaca-suman-seis-victimas-localizadas-en-fosa-clandestina-de-ixtlahuacan-de-los-membrillos-13152115"
    },
    {
        "referencia": 57,
        "municipio": "El Salto",
        "colonia": "La Santa Cruz",
        "delito": "Fosa",
        "victimas": 134,
        "año": 2020,
        "latitud": 20.5192281132806,
        "longitud": -103.199635770993,
        "link": "https://www.infobae.com/mexico/2025/03/15/los-sabinos-la-mayor-fosa-clandestina-de-jalisco-donde-rescataron-134-cuerpos/"
    },
    {
        "referencia": 58,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "La Duraznera",
        "delito": "Fosa",
        "victimas": 12,
        "año": 2020,
        "latitud": 20.5939159865191,
        "longitud": -103.321468495914,
        "link": "https://www.ntv.com.mx/2020/10/26/localizan-100-cuerpos-humanos-en-3-fosas-clandestinas-en-jalisco/"
    },
    {
        "referencia": 59,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Fracc. Puertas del Angel",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2020,
        "latitud": 20.4522601069016,
        "longitud": -103.440758840497,
        "link": ""
    },
    {
        "referencia": 60,
        "municipio": "Chapala",
        "colonia": "Ajijic",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2020,
        "latitud": 20.3015105860685,
        "longitud": -103.285062996912,
        "link": "https://oem.com.mx/eloccidental/policiaca/noticias-descubren-nueva-fosa-en-chapala-han-encontrado-4-cuerpos-15748524.app.json"
    },
    {
        "referencia": 61,
        "municipio": "Chapala",
        "colonia": "Jaltepec",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2020,
        "latitud": 20.2956741411484,
        "longitud": -103.353027442417,
        "link": "https://udgtv.com/noticias/fiscalia-exhuma-cuerpos-de-fosa-clandestina-en-jocotepec/15892"
    },
    {
        "referencia": 62,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Mirador",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2020,
        "latitud": 20.4980948901757,
        "longitud": -103.352199265094,
        "link": "https://jalisco.quadratin.com.mx/principal/van-215-cuerpos-hallados-en-fosas-de-jalisco-en-lo-que-va-del-2020/"
    },
    {
        "referencia": 63,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Emiliano Zapata",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2020,
        "latitud": 20.5946608560639,
        "longitud": -103.272753047593,
        "link": "https://www.milenio.com/policia/tlaquepaque-localizan-craneo-humano-colonia-emiliano-zapata"
    },
    {
        "referencia": 64,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Santa Anita",
        "delito": "Fosa",
        "victimas": 18,
        "año": 2020,
        "latitud": 20.5455582715977,
        "longitud": -103.447336747612,
        "link": "https://oem.com.mx/eloccidental/policiaca/noticias-localizan-restos-humanos-en-un-predio-de-tlajomulco-podria-tratarse-de-una-fosa-15717503"
    },
    {
        "referencia": 65,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Villas Terranova",
        "delito": "Fosa",
        "victimas": 14,
        "año": 2020,
        "latitud": 20.4956789646127,
        "longitud": -103.40876769661,
        "link": "https://www.facebook.com/quierotvGDL/videos/ent%C3%A9rate-localizan-una-fosa-clandestina-en-la-colonia-villas-terranova-en-tlajom/307130960628478/?locale=es_LA"
    },
    {
        "referencia": 66,
        "municipio": "Guadalajara",
        "colonia": "Colinas de Huentitan",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2021,
        "latitud": 20.7265789040826,
        "longitud": -103.305156778525,
        "link": "https://oem.com.mx/eloccidental/policiaca/fosas-clandestinas-encontradas-en-donde-menos-te-imaginas-15747421"
    },
    {
        "referencia": 67,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2021,
        "latitud": 20.49547629829,
        "longitud": -103.36366076291,
        "link": "https://www.proceso.com.mx/nacional/2021/1/13/hallan-17-bolsas-con-restos-humanos-una-fosa-clandestina-en-tlajomulco-256221.html"
    },
    {
        "referencia": 68,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Zapote del Valle",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2021,
        "latitud": 20.5031948821063,
        "longitud": -103.302712888287,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=162447"
    },
    {
        "referencia": 69,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Los Hornos",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2021,
        "latitud": 20.5991385407021,
        "longitud": -103.272616428117,
        "link": "https://suracapulco.mx/encuentran-cuatro-cuerpos-y-12-bolsas-en-fosas-de-tlaquepaque-y-tlajomulco-jalisco/"
    },
    {
        "referencia": 70,
        "municipio": "Zapopan",
        "colonia": "Nextipac",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2021,
        "latitud": 20.7774481412249,
        "longitud": -103.505617953833,
        "link": "https://oem.com.mx/eloccidental/policiaca/noticias-policiaca-crimen-fiscalia-busca-cuerpos-en-fosa-de-santa-lucia-termina-trabajos-en-colinas-de-huentitan-13150275"
    },
    {
        "referencia": 71,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Villa Fontana Aqua",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2021,
        "latitud": 20.5018611772933,
        "longitud": -103.348285194962,
        "link": "https://jaliscorojo.com/2021/02/26/hallan-cadaver-calcinado-dentro-de-una-finca-en-villa-fontana-aqua-tlajomulco/"
    },
    {
        "referencia": 72,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Villa Fontana Aqua",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2021,
        "latitud": 20.5087078151773,
        "longitud": -103.346510742014,
        "link": "https://www.milenio.com/policia/tlajomulco-aseguran-departamentos-donde-localizaron-dos-cuerpos"
    },
    {
        "referencia": 73,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Paseos del Valle",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2021,
        "latitud": 20.52204772841,
        "longitud": -103.345723794097,
        "link": "https://bit.ly/3lwgUWo"
    },
    {
        "referencia": 74,
        "municipio": "Chapala",
        "colonia": "Chapala",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2021,
        "latitud": 20.294834801673,
        "longitud": -103.190297313922,
        "link": "https://www.lavozdelaribera.mx/localizan-fosa-clandestina-en-chapala/"
    },
    {
        "referencia": 75,
        "municipio": "Tonalá",
        "colonia": "Alamedas de Zalatitan",
        "delito": "Fosa",
        "victimas": 31,
        "año": 2021,
        "latitud": 20.6614964721011,
        "longitud": -103.254051177417,
        "link": "https://oem.com.mx/elsoldemexico/mexico/localizan-13-bolsas-con-restos-humanos-en-fosa-de-tonala-15405770"
    },
    {
        "referencia": 76,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Del Verde",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2021,
        "latitud": 20.5628716788056,
        "longitud": -103.285257290978,
        "link": "https://www.proceso.com.mx/nacional/estados/2021/6/29/hallan-dos-cadaveres-bolsas-con-restos-en-fosa-ubicada-en-tlaquepaque-266822.html"
    },
    {
        "referencia": 77,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Los Cántaros",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2021,
        "latitud": 20.5066333021799,
        "longitud": -103.336169777759,
        "link": "https://jalisco.quadratin.com.mx/sucesos/tlajomulco-el-municipio-con-mas-fosas-clandestinas-en-el-2021/"
    },
    {
        "referencia": 78,
        "municipio": "Zapopan",
        "colonia": "Jardines de Santa Ana",
        "delito": "Fosa",
        "victimas": 36,
        "año": 2021,
        "latitud": 20.6202600294654,
        "longitud": -103.464200220219,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Suman-24-bolsas-con-restos-humanos-extraidas-de-fosa-en-Santa-Ana-Tepetitlan-20231002-0128.html"
    },
    {
        "referencia": 79,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "San José Residencial",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2021,
        "latitud": 20.5460808963183,
        "longitud": -103.36074902075,
        "link": "https://www.jornada.com.mx/2021/07/09/estados/024n3est"
    },
    {
        "referencia": 80,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Sur",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2021,
        "latitud": 20.4919449974721,
        "longitud": -103.402368788063,
        "link": "https://www.proceso.com.mx/nacional/estados/2021/7/13/hallan-13-bolsas-con-restos-humanos-en-una-finca-de-tlajomulco-267711.html"
    },
    {
        "referencia": 81,
        "municipio": "Chapala",
        "colonia": "Santa Cruz de la Soledad",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2021,
        "latitud": 20.3167714275656,
        "longitud": -103.15877176313,
        "link": "https://www.lavozdelaribera.mx/localizan-fosa-clandestina-en-chapala/"
    },
    {
        "referencia": 82,
        "municipio": "El Salto",
        "colonia": "San Jose del Quince",
        "delito": "Fosa",
        "victimas": 12,
        "año": 2021,
        "latitud": 20.541184794749,
        "longitud": -103.293167718424,
        "link": "https://udgtv.com/noticias/localizan-fosa-clandestina-en-el-quince-el-salto-el-instituto-jalisciense-de-ciencias-forenses-llega-cinco-horas-despues/57504"
    },
    {
        "referencia": 83,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Los Abedules",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2021,
        "latitud": 20.5235634754593,
        "longitud": -103.449648402328,
        "link": "https://guardianocturna.mx/2021/06/localizan-los-restos-de-una-mujer-en-bolsas-de-plastico-en-acantilado-de-tlajomulco/"
    },
    {
        "referencia": 84,
        "municipio": "El Salto",
        "colonia": "Guadalupana",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2021,
        "latitud": 20.55686625885,
        "longitud": -103.289253160349,
        "link": "https://oem.com.mx/eloccidental/policiaca/cuatro-cuerpos-y-un-craneo-fueron-encontrados-este-domingo-en-la-zmg-15719864"
    },
    {
        "referencia": 85,
        "municipio": "Ojuelos",
        "colonia": "Matancillas",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2021,
        "latitud": 21.8910336086599,
        "longitud": -101.649204333376,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=174134"
    },
    {
        "referencia": 86,
        "municipio": "San Juan de los Lagos",
        "colonia": "La Peña del Halcón",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2021,
        "latitud": 21.2698617758727,
        "longitud": -102.354428813744,
        "link": "https://www.infobae.com/america/mexico/2021/04/14/encontraron-10-cadaveres-en-una-fosa-clandestina-en-jalisco/"
    },
    {
        "referencia": 87,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Fco I Madero I",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2021,
        "latitud": 20.6050257774889,
        "longitud": -103.372562390373,
        "link": "https://www.milenio.com/policia/tlaquepaque-continuan-los-trabajos-en-fosa"
    },
    {
        "referencia": 88,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Arvento",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2021,
        "latitud": 20.4480064062536,
        "longitud": -103.306759772633,
        "link": "https://heraldodemexico.com.mx/nacional/2022/11/1/colectivos-de-madres-buscadoras-senalan-zona-donde-hay-restos-humanos-453542.html"
    },
    {
        "referencia": 89,
        "municipio": "Tonalá",
        "colonia": "Alamedas de Zalatitan",
        "delito": "Fosa",
        "victimas": 31,
        "año": 2022,
        "latitud": 20.6600894962946,
        "longitud": -103.257560631003,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=177417"
    },
    {
        "referencia": 90,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Sur",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.4908748827459,
        "longitud": -103.417668379474,
        "link": "https://www.jornada.com.mx/noticia/2022/02/25/estados/buscadoras-de-desaparecidos-hallan-mas-fosas-en-tlajomulco-jalisco-7681"
    },
    {
        "referencia": 91,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.496961613997,
        "longitud": -103.364560487719,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Estas-son-las-fosas-clandestinas-encontradas-este-ano-20220425-0079.html"
    },
    {
        "referencia": 92,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2022,
        "latitud": 20.496752527809,
        "longitud": -103.363817070162,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Estas-son-las-fosas-clandestinas-encontradas-este-ano-20220425-0079.html"
    },
    {
        "referencia": 93,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2022,
        "latitud": 20.497205547883,
        "longitud": -103.365547839162,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Estas-son-las-fosas-clandestinas-encontradas-este-ano-20220425-0079.html"
    },
    {
        "referencia": 94,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 17,
        "año": 2022,
        "latitud": 20.4981580516284,
        "longitud": -103.363985500702,
        "link": "https://www.aztecajalisco.com/policiaca/chulavista-colonia-fincas-habitadas-fosas-clandestinas"
    },
    {
        "referencia": 95,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2022,
        "latitud": 20.497554024863,
        "longitud": -103.364798613655,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Estas-son-las-fosas-clandestinas-encontradas-este-ano-20220425-0079.html"
    },
    {
        "referencia": 96,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2022,
        "latitud": 20.4973565545743,
        "longitud": -103.36384030196,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Estas-son-las-fosas-clandestinas-encontradas-este-ano-20220425-0079.html"
    },
    {
        "referencia": 97,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2022,
        "latitud": 20.4978444223464,
        "longitud": -103.36471730236,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Estas-son-las-fosas-clandestinas-encontradas-este-ano-20220425-0079.html"
    },
    {
        "referencia": 98,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2022,
        "latitud": 20.4941854140561,
        "longitud": -103.365298097327,
        "link": "https://ntrguadalajara.com/post.php?id_nota=180330"
    },
    {
        "referencia": 99,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "San Lucas Evangelista",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2022,
        "latitud": 20.4079780171485,
        "longitud": -103.35477409253,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/14-bolsas-restos-humanos-fueron-encontradas-una-fosa-clandestina/"
    },
    {
        "referencia": 100,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2022,
        "latitud": 20.4945905185454,
        "longitud": -103.364859597127,
        "link": ""
    },
    {
        "referencia": 101,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2022,
        "latitud": 20.4946297222056,
        "longitud": -103.364018896413,
        "link": ""
    },
    {
        "referencia": 102,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2022,
        "latitud": 20.4949190360212,
        "longitud": -103.363772501874,
        "link": "https://www.debate.com.mx/guadalajara/Localizan-20-bolsas-con-posibles-restos-humanos-en-Jalisco-durante-segunda-jornada-de-busqueda-20220401-0424.html"
    },
    {
        "referencia": 103,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Felipe Angeles",
        "delito": "Fosa",
        "victimas": 14,
        "año": 2022,
        "latitud": 20.5982057925929,
        "longitud": -103.326766707248,
        "link": "https://www.tiktok.com/@guardianocturnamx/video/7082506599532612869"
    },
    {
        "referencia": 104,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Villas Terranova",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.4989464807957,
        "longitud": -103.400974880144,
        "link": "https://www.facebook.com/AZTECAJALISCO/videos/%C3%BAltimomomento-localizan-un-cuerpo-en-un-predio-de-la-col-colinas-del-roble-en-tl/2323370331355184/"
    },
    {
        "referencia": 105,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.505866589385,
        "longitud": -103.365227973507,
        "link": "https://www.facebook.com/RadioUdeG/videos/695200315018891"
    },
    {
        "referencia": 106,
        "municipio": "Guadalajara",
        "colonia": "San Joaquin",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.6713162630016,
        "longitud": -103.275697405826,
        "link": "https://oem.com.mx/eloccidental/policiaca/hallan-cuerpo-en-una-casa-de-la-colonia-san-joaquin-15741863"
    },
    {
        "referencia": 107,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 12,
        "año": 2022,
        "latitud": 20.5057863665391,
        "longitud": -103.365348307775,
        "link": "https://www.facebook.com/RadioUdeG/videos/695200315018891"
    },
    {
        "referencia": 108,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Villas Terranova",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.4978844162179,
        "longitud": -103.408516794175,
        "link": "https://www.zonadocs.mx/2022/05/15/venimos-a-buscar-lo-que-no-han-querido-encontrar-brigada-nacional-busqueda/"
    },
    {
        "referencia": 109,
        "municipio": "Puerto Vallarta",
        "colonia": "Palma Real",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.6795304275992,
        "longitud": -105.18820905865,
        "link": "https://vivepuertovallarta.mx/2022/04/18/confirman-localizacion-de-fosas-clandestinas-en-puerto-vallarta/"
    },
    {
        "referencia": 110,
        "municipio": "El Salto",
        "colonia": "Tototlán",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2022,
        "latitud": 20.5448477297386,
        "longitud": -102.786887151901,
        "link": ""
    },
    {
        "referencia": 111,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Fracc. Real del Valle",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2022,
        "latitud": 20.5420284697255,
        "longitud": -103.371459569572,
        "link": "https://www.milenio.com/policia/tlajomulco-localizan-bolsa-restos-humanos-casas-abandonadas"
    },
    {
        "referencia": 112,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2022,
        "latitud": 20.4942672253983,
        "longitud": -103.362543373271,
        "link": "https://ntrguadalajara.com/post.php?id_nota=180330"
    },
    {
        "referencia": 113,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "SEC 12122",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.4685549321754,
        "longitud": -103.440391982547,
        "link": "https://www.meganoticias.mx/XALAPA/noticia/localizan-restos-humanos-en-fosa-de-las-huertas/523230"
    },
    {
        "referencia": 114,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Sur",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2022,
        "latitud": 20.4882825595029,
        "longitud": -103.406225782404,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/madres-buscadoras-localizan-fosa-clandestina-tlajomulco-zuniga/"
    },
    {
        "referencia": 115,
        "municipio": "Zapopan",
        "colonia": "El Centinela",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.7798254606372,
        "longitud": -103.389786591104,
        "link": ""
    },
    {
        "referencia": 116,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Las Juntas",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.6052028086875,
        "longitud": -103.332589600995,
        "link": "https://oem.com.mx/eloccidental/policiaca/colectivo-en-busca-de-nuestros-corazones-perdidos-localiza-fosa-clandestina-en-las-juntas-tlaquepaque-15730086"
    },
    {
        "referencia": 117,
        "municipio": "El Salto",
        "colonia": "La Azucena",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2022,
        "latitud": 20.5039427694967,
        "longitud": -103.203993911224,
        "link": "https://www.infobae.com/mexico/2025/03/15/los-sabinos-la-mayor-fosa-clandestina-de-jalisco-donde-rescataron-134-cuerpos/"
    },
    {
        "referencia": 118,
        "municipio": "Zapopan",
        "colonia": "Indigena de Mezquitan",
        "delito": "Fosa",
        "victimas": 27,
        "año": 2022,
        "latitud": 20.7422127765205,
        "longitud": -103.33370828714,
        "link": "https://www.facebook.com/AZTECAJALISCO/videos/en-una-fosa-clandestina-en-el-tizate-zapopan-localizaron-veintiocho-bolsas-con-r/608865587345509/"
    },
    {
        "referencia": 119,
        "municipio": "Zapopan",
        "colonia": "La Higuera",
        "delito": "Fosa",
        "victimas": 27,
        "año": 2022,
        "latitud": 20.7536928904581,
        "longitud": -103.324512658187,
        "link": "https://www.reforma.com/hallan-restos-humanos-y-matan-a-dos-en-zapopan/ar2214909"
    },
    {
        "referencia": 120,
        "municipio": "Zapopan",
        "colonia": "El Colli Urbano",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2022,
        "latitud": 20.6431790063634,
        "longitud": -103.429231680749,
        "link": "https://www.facebook.com/AZTECAJALISCO/photos/a.688217761189848/5683916224953285/?type=3"
    },
    {
        "referencia": 121,
        "municipio": "Zapopan",
        "colonia": "Los Cántaros",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2022,
        "latitud": 20.4995218218048,
        "longitud": -103.339507956091,
        "link": "https://www.facebook.com/fundejoficial/photos/a.499064290428565/1667797190221930/?type=3&eid=ARCNrwR-tLCjUf5WdQNmleh-GvgqV3wDN9_vX8H2kpAKlL_ppQ2aAWSzQ7r2Zop4fSK7f7hanKFvkEko&locale=ms_MY&_rdr"
    },
    {
        "referencia": 122,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Cerro del Cuatro",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2022,
        "latitud": 20.6037312580697,
        "longitud": -103.363769071249,
        "link": "https://oem.com.mx/eloccidental/policiaca/buscan-restos-humanos-en-posible-fosa-de-tlajomulco-15720439.app.json"
    },
    {
        "referencia": 123,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "San Miguel Cuyutlán",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2022,
        "latitud": 20.4040508290522,
        "longitud": -103.397029672709,
        "link": "https://www.informador.mx/jalisco/Desaparecidos-en-Jalisco-Hallan-tres-cuerpos-en-el-Cerro-del-Cuatro-20220920-0139.html"
    },
    {
        "referencia": 124,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "San Antonio Juanacaxtle",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.5368538254826,
        "longitud": -103.153717599603,
        "link": "https://oneamexico.org/2023/07/06/descubren-madres-buscadoras-al-menos-10-fosas-clandestinas-en-tlajomulco-de-zuniga-jalisco/"
    },
    {
        "referencia": 125,
        "municipio": "Juanacatlán",
        "colonia": "San Antonio Juanacaxtle",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2022,
        "latitud": 20.5368538254826,
        "longitud": -103.153717599603,
        "link": "https://m.facebook.com/JuanacatlanNews/photos/%EF%B8%8F-%C3%BAltimominutoencuentran-fosa-clandestina-en-juanacatl%C3%A1nde-manera-preliminar-rep/552003363592298/"
    },
    {
        "referencia": 126,
        "municipio": "Tonalá",
        "colonia": "San Jose del Castillo",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2022,
        "latitud": 20.5084054528222,
        "longitud": -103.238591141397,
        "link": ""
    },
    {
        "referencia": 127,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "El Tapatio",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2022,
        "latitud": 20.6020626033178,
        "longitud": -103.326393320069,
        "link": "Encontraron presunta fosa clandestina en colonia El Tapatío"
    },
    {
        "referencia": 128,
        "municipio": "Zapopan",
        "colonia": "Arroyo Hondo Seccion II",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2022,
        "latitud": 20.7422373502734,
        "longitud": -103.341837557069,
        "link": "https://zmgnoticias.com/2022/10/21/suman-26-restos-humanos-localizados-en-fosa-clandestina/"
    },
    {
        "referencia": 129,
        "municipio": "El Salto",
        "colonia": "San Jose del Quince",
        "delito": "Fosa",
        "victimas": 14,
        "año": 2022,
        "latitud": 20.5406691831186,
        "longitud": -103.287390329336,
        "link": "https://planoinformativo.com/918208/alan-lleva-5-meses-en-la-morgue-y-no-se-lo-dan-a-su-madre/amp/espectaculos/"
    },
    {
        "referencia": 130,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Teopantli CalpullI",
        "delito": "Fosa",
        "victimas": 61,
        "año": 2023,
        "latitud": 20.5817071477434,
        "longitud": -103.576817698362,
        "link": "https://oem.com.mx/eloccidental/policiaca/tlajomulco-de-zuniga-lider-en-numero-de-fosas-clandestinas-15724370"
    },
    {
        "referencia": 131,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Teopantli CalpullI",
        "delito": "Fosa",
        "victimas": 23,
        "año": 2023,
        "latitud": 20.5822242809138,
        "longitud": -103.573411514546,
        "link": "https://oem.com.mx/eloccidental/policiaca/tlajomulco-de-zuniga-lider-en-numero-de-fosas-clandestinas-15724370"
    },
    {
        "referencia": 132,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2023,
        "latitud": 20.492302866877,
        "longitud": -103.351871664352,
        "link": "https://oem.com.mx/eloccidental/policiaca/tlajomulco-suman-cuatro-fosas-clandestinas-localizadas-este-ano-15721381"
    },
    {
        "referencia": 133,
        "municipio": "Zapopan",
        "colonia": "El Centinela",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2023,
        "latitud": 20.7789815773368,
        "longitud": -103.389597103724,
        "link": "https://guardianocturna.mx/2023/02/colectivo-encuentra-cuerpos-en-fosa-clandestina-de-zapopan/"
    },
    {
        "referencia": 134,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Cuxpala",
        "delito": "Fosa",
        "victimas": 50,
        "año": 2023,
        "latitud": 20.568507114218,
        "longitud": -103.64886316314,
        "link": "https://www.meganoticias.mx/guadalajara/noticia/localizan-74-de-5-fosas-en-jalisco/404718"
    },
    {
        "referencia": 135,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Paseos del Valle",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2023,
        "latitud": 20.5250485053492,
        "longitud": -103.325959844961,
        "link": "https://www.notisistema.com/noticias/investigan-posible-nueva-fosa-clandestina-en-tlajomulco-2/"
    },
    {
        "referencia": 136,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Villa Fontana Aqua",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2023,
        "latitud": 20.5075249690436,
        "longitud": -103.34539026195,
        "link": "https://www.notisistema.com/noticias/investigan-posible-nueva-fosa-clandestina-en-tlajomulco-2/"
    },
    {
        "referencia": 137,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Villas de San Sebastián",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2023,
        "latitud": 20.5228106594371,
        "longitud": -103.436637069149,
        "link": "https://oem.com.mx/eloccidental/policiaca/tlajomulco-van-104-bolsas-con-restos-humanos-extraidas-de-una-y-ya-localizaron-otra-15737603.app.json"
    },
    {
        "referencia": 138,
        "municipio": "Zapopan",
        "colonia": "Lomas del Refugio",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2023,
        "latitud": 20.7430787450939,
        "longitud": -103.334008735462,
        "link": "https://www.notisistema.com/noticias/intervienen-durante-mayo-cuatro-fosas-clandestinas-recuperan-restos-de-37-personas/"
    },
    {
        "referencia": 139,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas de San Agustín",
        "delito": "Fosa",
        "victimas": 57,
        "año": 2023,
        "latitud": 20.5190214140138,
        "longitud": -103.470605440273,
        "link": "https://oem.com.mx/eloccidental/policiaca/tlajomulco-de-zuniga-lider-en-numero-de-fosas-clandestinas-15724370"
    },
    {
        "referencia": 140,
        "municipio": "Guadalajara",
        "colonia": "Colinas de Huentitan",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2023,
        "latitud": 20.7283936953013,
        "longitud": -103.302787682188,
        "link": "https://oem.com.mx/eloccidental/policiaca/fosas-clandestinas-encontradas-en-donde-menos-te-imaginas-15747421"
    },
    {
        "referencia": 141,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Volcán Santa Cruz",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2023,
        "latitud": 20.5274150599616,
        "longitud": -103.506207696841,
        "link": "https://oem.com.mx/eloccidental/policiaca/hallan-restos-humanos-en-patio-de-casa-en-santa-fe-tlajomulco-13153101"
    },
    {
        "referencia": 142,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "San Lucas Evangelista",
        "delito": "Fosa",
        "victimas": 11,
        "año": 2023,
        "latitud": 20.393705107426,
        "longitud": -103.366201232972,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=200562"
    },
    {
        "referencia": 143,
        "municipio": "Zapopan",
        "colonia": "Lomas del Refugio",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2023,
        "latitud": 20.7475110232694,
        "longitud": -103.333758468545,
        "link": "https://oem.com.mx/eloccidental/policiaca/fosa-de-lomas-del-refugio-en-zapopan-se-han-extraido-33-bolsas-con-restos-humanos-15728975"
    },
    {
        "referencia": 144,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "La Arbolada",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2023,
        "latitud": 20.5216538133819,
        "longitud": -103.370144213788,
        "link": "https://www.infobae.com/mexico/2023/08/31/horror-en-tlajomulco-un-hombre-logro-escapar-de-sus-secuestradores-y-ayudo-al-hallazgo-de-dos-cadaveres/"
    },
    {
        "referencia": 145,
        "municipio": "Zapopan",
        "colonia": "Miguel Hidalgo",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2023,
        "latitud": 20.74760091506,
        "longitud": -103.333872876278,
        "link": "https://oem.com.mx/eloccidental/policiaca/fosa-de-lomas-del-refugio-en-zapopan-se-han-extraido-33-bolsas-con-restos-humanos-15728975"
    },
    {
        "referencia": 146,
        "municipio": "Zapopan",
        "colonia": "Santa Ana Tepetitlan",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2023,
        "latitud": 20.6186879153503,
        "longitud": -103.459868478783,
        "link": "https://oem.com.mx/eloccidental/policiaca/termina-busqueda-en-fosa-de-santa-ana-tepetitlan-hubo-19-bolsas-con-restos-oseos-13156444"
    },
    {
        "referencia": 147,
        "municipio": "Zapopan",
        "colonia": "Arenales Tapatíos",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2023,
        "latitud": 20.6369505794472,
        "longitud": -103.460968518781,
        "link": "https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.milenio.com/policia/zapopan-suman-26-bolsas-restos-humanos-fosa-clandestina&ved=2ahUKEwjM56XUgLqNAxV_LEQIHd7fBTIQFnoECB0QAQ&usg=AOvVaw2y4jF7d5_4L27NIofNSXkO"
    },
    {
        "referencia": 148,
        "municipio": "Guadalajara",
        "colonia": "San Antonio",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2023,
        "latitud": 20.6581218094929,
        "longitud": -103.31075025614,
        "link": "https://ntrguadalajara.com/post.php?id_nota=205984"
    },
    {
        "referencia": 149,
        "municipio": "Zapopan",
        "colonia": "Emiliano Zapata",
        "delito": "Fosa",
        "victimas": 27,
        "año": 2023,
        "latitud": 20.6520009957507,
        "longitud": -103.483195398446,
        "link": "https://oem.com.mx/eloccidental/policiaca/hallan-siete-fosas-clandestinas-en-un-predio-cercano-al-bosque-de-la-primavera-en-zapopan-15747360"
    },
    {
        "referencia": 150,
        "municipio": "Guadalajara",
        "colonia": "Las Conchas",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2023,
        "latitud": 20.6634213391481,
        "longitud": -103.343924412864,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/nuevamente-fueron-localizados-restos-humanos-la-colonia-las-conchas/"
    },
    {
        "referencia": 151,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Mirador",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2023,
        "latitud": 20.4920998442249,
        "longitud": -103.344173658283,
        "link": "https://guardianocturna.mx/2023/11/localizan-restos-humanos-ahora-en-tlajomulco-de-zuniga/"
    },
    {
        "referencia": 152,
        "municipio": "Zapopan",
        "colonia": "Mision de Santa Ana",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2024,
        "latitud": 20.6150111545375,
        "longitud": -103.458669530145,
        "link": "https://www.facebook.com/watch/?v=377917771652269"
    },
    {
        "referencia": 153,
        "municipio": "El Salto",
        "colonia": "La Pedrera",
        "delito": "Fosa",
        "victimas": 13,
        "año": 2024,
        "latitud": 20.5500250166464,
        "longitud": -103.31155415923,
        "link": "https://www.dallasnews.com/espanol/al-dia/mexico/2024/03/25/crematorio-clandestino-hornos-colonia-la-piedrera-el-salto-jalisco/"
    },
    {
        "referencia": 154,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Hacienda Santa Fe",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2024,
        "latitud": 20.523183859258,
        "longitud": -103.373255735077,
        "link": "https://www.meganoticias.mx/TEPIC/noticia/localizan-restos-humanos-en-fosa-de-las-huertas/523230"
    },
    {
        "referencia": 155,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Terralta",
        "delito": "Fosa",
        "victimas": 8,
        "año": 2024,
        "latitud": 20.6057106569389,
        "longitud": -103.363150186652,
        "link": "https://latinus.us/mexico/2024/4/8/colectivo-halla-al-menos-cinco-cuerpos-en-una-nueva-fosa-clandestina-en-san-pedro-tlaquepaque-112063.html"
    },
    {
        "referencia": 156,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Las Huertas",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2024,
        "latitud": 20.6189454330574,
        "longitud": -103.30735625089,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/localizan-otra-fosa-clandestina-la-colonia-las-huertas-tlaquepaque/"
    },
    {
        "referencia": 157,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Chulavista",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2024,
        "latitud": 20.4918971256821,
        "longitud": -103.351635238509,
        "link": "https://ntrguadalajara.com/post.php?id_nota=216472"
    },
    {
        "referencia": 158,
        "municipio": "Zapopan",
        "colonia": "Emiliano Zapata",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2024,
        "latitud": 20.6511523646796,
        "longitud": -103.484177017353,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/vuelven-localizar-restos-humanos-lomas-la-primavera-zapopan/"
    },
    {
        "referencia": 159,
        "municipio": "Zapopan",
        "colonia": "Las Cañadas",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2024,
        "latitud": 20.7580256070567,
        "longitud": -103.353489493006,
        "link": ""
    },
    {
        "referencia": 160,
        "municipio": "Ixtlahuacán de los Membrillos",
        "colonia": "Los Olivos",
        "delito": "Fosa",
        "victimas": 11,
        "año": 2024,
        "latitud": 20.4399641413614,
        "longitud": -103.232051067696,
        "link": "https://oem.com.mx/eloccidental/policiaca/suman-10-cuerpos-en-fosa-de-los-olivos-13150486"
    },
    {
        "referencia": 161,
        "municipio": "Guadalajara",
        "colonia": "Del Fresno",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2024,
        "latitud": 20.6644353890126,
        "longitud": -103.373493394177,
        "link": "https://www.milenio.com/politica/comunidad/terminan-trabajos-fosas-ixtlahuacan-pueblo-quieto"
    },
    {
        "referencia": 162,
        "municipio": "Zapopan",
        "colonia": "Paraisos del Colli",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2024,
        "latitud": 20.6466579486049,
        "longitud": -103.452953498645,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=217850"
    },
    {
        "referencia": 163,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Sur",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2024,
        "latitud": 20.4904937190487,
        "longitud": -103.411434348834,
        "link": "https://www.telediario.mx/local/localizan-fosa-clandestina-en-tlajomulco"
    },
    {
        "referencia": 164,
        "municipio": "Zapopan",
        "colonia": "Paraisos del Colli",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2024,
        "latitud": 20.6456917555982,
        "longitud": -103.452550923668,
        "link": "https://www.notisistema.com/noticias/recuperan-25-cadaveres-en-dos-fosas-clandestinas-en-zapopan/"
    },
    {
        "referencia": 165,
        "municipio": "Ixtlahuacán de los Membrillos",
        "colonia": "Los Olivos",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2024,
        "latitud": 20.4387728674957,
        "longitud": -103.231652932531,
        "link": "https://oem.com.mx/eloccidental/policiaca/suman-3-osamentas-exhumadas-en-fosa-de-los-olivos-en-ixtlahuacan-de-los-membrillos-13157032"
    },
    {
        "referencia": 166,
        "municipio": "Zapopan",
        "colonia": "Paraisos del Colli",
        "delito": "Fosa",
        "victimas": 21,
        "año": 2024,
        "latitud": 20.6458546740599,
        "longitud": -103.452697550283,
        "link": "https://www.notisistema.com/noticias/recuperan-25-cadaveres-en-dos-fosas-clandestinas-en-zapopan/"
    },
    {
        "referencia": 167,
        "municipio": "Zapopan",
        "colonia": "Paraisos del Colli",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2024,
        "latitud": 20.6457935796367,
        "longitud": -103.452811593206,
        "link": "https://www.notisistema.com/noticias/recuperan-25-cadaveres-en-dos-fosas-clandestinas-en-zapopan/"
    },
    {
        "referencia": 168,
        "municipio": "Zapopan",
        "colonia": "Mariano Otero",
        "delito": "Fosa",
        "victimas": 7,
        "año": 2024,
        "latitud": 20.6348157243816,
        "longitud": -103.45338981432,
        "link": "https://www.milenio.com/policia/zapopan-localizan-fosa-clandestina-mariano-otero"
    },
    {
        "referencia": 169,
        "municipio": "Zapopan",
        "colonia": "Miguel Hidalgo",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2024,
        "latitud": 20.7472689048441,
        "longitud": -103.335124042711,
        "link": "https://www.milenio.com/policia/zapopan-localizan-nueve-bolsas-restos-humanos-miguel-hidalgo"
    },
    {
        "referencia": 170,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Sur",
        "delito": "Fosa",
        "victimas": 6,
        "año": 2024,
        "latitud": 20.4874133511519,
        "longitud": -103.407315533679,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Hallan-colectivos-restos-humanos-en-Tlajomulco-20240615-0091.html"
    },
    {
        "referencia": 171,
        "municipio": "Zapopan",
        "colonia": "Lomas del Refugio",
        "delito": "Fosa",
        "victimas": 5,
        "año": 2024,
        "latitud": 20.7466197586622,
        "longitud": -103.336966445334,
        "link": "https://udgtv.com/noticias/autorizan-trabajo-en-la-fosa-de-la-colonia-lomas-del-refugio/254083"
    },
    {
        "referencia": 172,
        "municipio": "Zapopan",
        "colonia": "Indígena de Mezquitán",
        "delito": "Fosa",
        "victimas": 24,
        "año": 2024,
        "latitud": 20.7416800468165,
        "longitud": -103.333378701948,
        "link": "https://www.proceso.com.mx/nacional/estados/2025/1/20/localizan-24-cuerpos-en-una-fosa-clandestina-en-zapopan-preidentifican-seis-personas-344041.html"
    },
    {
        "referencia": 173,
        "municipio": "Lagos de Moreno",
        "colonia": "Presa La Sauceda",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2025,
        "latitud": 21.3622314261546,
        "longitud": -101.823948861153,
        "link": "https://web.ntrguadalajara.com/post.php?id_nota=226006"
    },
    {
        "referencia": 174,
        "municipio": "Zapopan",
        "colonia": "Santa Lucía",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.7941963138541,
        "longitud": -103.498413182719,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=226006"
    },
    {
        "referencia": 175,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Sur",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.4889367029511,
        "longitud": -103.402572630821,
        "link": "https://www.mural.com.mx/dos-colectivos-hallan-fosas-clandestinas-en-tlajomulco/ar2939473"
    },
    {
        "referencia": 176,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Fracc. Colinas de Desarrollo",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2025,
        "latitud": 20.4702509736344,
        "longitud": -103.42377239565,
        "link": "https://www.informador.mx/jalisco/Desaparecidos-en-Jalisco-Localizan-fosa-clandestina-en-un-fraccionamiento-en-Tlajomulco-20250121-0113.html"
    },
    {
        "referencia": 177,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Fracc. Colinas de Desarrollo",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.468803035806,
        "longitud": -103.424838493333,
        "link": "https://www.informador.mx/jalisco/Desaparecidos-en-Jalisco-Localizan-fosa-clandestina-en-un-fraccionamiento-en-Tlajomulco-20250121-0113.html"
    },
    {
        "referencia": 178,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Fracc. Colinas de Desarrollo",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.4689374435369,
        "longitud": -103.423494416024,
        "link": "https://www.informador.mx/jalisco/Desaparecidos-en-Jalisco-Localizan-fosa-clandestina-en-un-fraccionamiento-en-Tlajomulco-20250121-0113.html"
    },
    {
        "referencia": 179,
        "municipio": "Zapopan",
        "colonia": "Villa de Guadalupe",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.7556780090914,
        "longitud": -103.3449025501,
        "link": "https://issuu.com/ntrguadalajara.com/docs/2025-02-12"
    },
    {
        "referencia": 180,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Cerro del Cuatro",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.6039398268262,
        "longitud": -103.364672705427,
        "link": "https://www.milenio.com/policia/tlaquepaque-localizan-cuerpo-mujer-barranco-aires"
    },
    {
        "referencia": 181,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Paseos del Valle",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.5250669265561,
        "longitud": -103.332390412241,
        "link": ""
    },
    {
        "referencia": 182,
        "municipio": "Tonalá",
        "colonia": "El Sauz",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.5759056325293,
        "longitud": -103.252768087047,
        "link": "https://guardianocturna.mx/2025/02/escalofriante-hallazgo-cerca-del-cerro-del-gato/"
    },
    {
        "referencia": 183,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Nueva Santa Maria",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.6037239598644,
        "longitud": -103.38047172325,
        "link": "https://oem.com.mx/eloccidental/policiaca/hallan-fosa-en-la-nueva-santa-maria-21741510"
    },
    {
        "referencia": 184,
        "municipio": "Zapopan",
        "colonia": "La Venta del Astillero",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.7209030634416,
        "longitud": -103.544693532643,
        "link": "https://www.aztecajalisco.com/local/madres-buscadoras-podian-encontrar-cuerpos-fosa-clandestina-venta-astillero"
    },
    {
        "referencia": 185,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Los Puestos",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.603015264556,
        "longitud": -103.271283770219,
        "link": ""
    },
    {
        "referencia": 186,
        "municipio": "Ameca",
        "colonia": "San Antonio Matute",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.5708307224473,
        "longitud": -103.952437712661,
        "link": "https://www.telediario.mx/comunidad/jalisco-reporta-5-fosas-clandestinas-febrero"
    },
    {
        "referencia": 187,
        "municipio": "Zapopan",
        "colonia": "Las Agujas",
        "delito": "Fosa",
        "victimas": 27,
        "año": 2025,
        "latitud": 20.7925790406661,
        "longitud": -103.48508981343,
        "link": ""
    },
    {
        "referencia": 188,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Jardines de Santa Anita",
        "delito": "Fosa",
        "victimas": 4,
        "año": 2025,
        "latitud": 20.5535594529509,
        "longitud": -103.482975586454,
        "link": "https://www.informador.mx/jalisco/Seguridad-en-Jalisco-Hallan-fosa-clandestina-dentro-fraccionamiento-privado-en-Santa-Anita-20250303-0183.html"
    },
    {
        "referencia": 189,
        "municipio": "Teuchitlán",
        "colonia": "La Estanzuela",
        "delito": "Fosa",
        "victimas": 0,
        "año": 2025,
        "latitud": 20.6694088599817,
        "longitud": -103.817498344143,
        "link": "https://contralacorrupcion.mx/desde-2019-la-guardia-nacional-encontro-cuerpos-incinerados-en-teuchitlan/"
    },
    {
        "referencia": 190,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Cofradía de la Luz",
        "delito": "Fosa",
        "victimas": 2,
        "año": 2025,
        "latitud": 20.4769324559551,
        "longitud": -103.555212089036,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/colectivo-busqueda-localiza-dos-cuerpos-fosa-clandestina-la-cofradia-tlajomulco-zuniga/"
    },
    {
        "referencia": 191,
        "municipio": "El Arenal",
        "colonia": "Santa Cruz del Astillero",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.7408967015975,
        "longitud": -103.635348511663,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/colectivo-busqueda-localiza-restos-humanos-santa-cruz-astillero/"
    },
    {
        "referencia": 192,
        "municipio": "Ameca",
        "colonia": "Presa Tonchincalco",
        "delito": "Fosa",
        "victimas": 0,
        "año": 2025,
        "latitud": 20.4832348270606,
        "longitud": -103.944864249954,
        "link": "https://t.me/c/2356919651/105142"
    },
    {
        "referencia": 193,
        "municipio": "Lagos de Moreno",
        "colonia": "Hacienda San Bernardo",
        "delito": "Fosa",
        "victimas": 13,
        "año": 2025,
        "latitud": 21.3481147167096,
        "longitud": -101.84545459732,
        "link": "https://www.youtube.com/watch?v=r1wPMC9LKGQ"
    },
    {
        "referencia": 194,
        "municipio": "Guadalajara",
        "colonia": "Rancho Nuevo",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.7182422338827,
        "longitud": -103.329803453616,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/pensaron-que-era-una-fosa-clandestina-era-extremidad-un-hombre-victima-derrumbe/"
    },
    {
        "referencia": 195,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Los Abedules",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.5229942585774,
        "longitud": -103.449710371218,
        "link": "https://www.milenio.com/policia/tlajomulco-localizan-bolsas-negras-restos-humanos-predio"
    },
    {
        "referencia": 196,
        "municipio": "Tonalá",
        "colonia": "Cofradía de la Luz",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.4769212651646,
        "longitud": -103.55526242778,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/colectivo-busqueda-localiza-dos-cuerpos-fosa-clandestina-la-cofradia-tlajomulco-zuniga/"
    },
    {
        "referencia": 197,
        "municipio": "San Pedro Tlaquepaque",
        "colonia": "Romita",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.58768679329,
        "longitud": -103.334639165679,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/colectivo-busqueda-localiza-restos-humanos-la-colonia-romita-tlaquepaque/"
    },
    {
        "referencia": 198,
        "municipio": "Zapopan",
        "colonia": "Cerro de Copalita",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.8101900677918,
        "longitud": -103.435228614221,
        "link": "https://guardianocturna.mx/2025/04/localizaron-restos-oseos-cerca-de-copalita-zapopan/"
    },
    {
        "referencia": 199,
        "municipio": "Ixtlahuacán de los Membrillos",
        "colonia": "Capilla del Refugio",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.4378363344603,
        "longitud": -103.211987390927,
        "link": "https://www.youtube.com/watch?v=AoNwecKsmEo"
    },
    {
        "referencia": 200,
        "municipio": "Guadalajara",
        "colonia": "Balcones de Oblatos",
        "delito": "Fosa",
        "victimas": 3,
        "año": 2025,
        "latitud": 20.6877828117863,
        "longitud": -103.290439839869,
        "link": "https://www.aztecajalisco.com/local/localizan-restos-humanos-en-la-colonia-balcones-oblatos-guadalajara"
    },
    {
        "referencia": 201,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Lomas del Sur",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.4942072855318,
        "longitud": -103.414886612832,
        "link": "https://www.nmas.com.mx/nmas-local/programas/las-noticias-guadalajara/videos/localizan-posible-fosa-tlajomulco-hallaron-joven-semienterrado-ficha-busqueda/"
    },
    {
        "referencia": 202,
        "municipio": "Tonalá",
        "colonia": "Emiliano Zapata",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.6904934283806,
        "longitud": -103.257757877801,
        "link": "https://www.nmas.com.mx/guadalajara/localizan-nueva-fosa-clandestina-en-bodega-que-fungio-como-billar-en-tonala-jalisco/"
    },
    {
        "referencia": 203,
        "municipio": "Ixtlahuacán de los Membrillos",
        "colonia": "Capilla del Refugio",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.4372501575019,
        "longitud": -103.211726674643,
        "link": "https://www.milenio.com/policia/hallan-cuerpo-semienterrado-en-fraccionamiento-de-ixtlahuacan"
    },
    {
        "referencia": 204,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Las Varitas",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.5456438381804,
        "longitud": -103.45624867629,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=230607"
    },
    {
        "referencia": 205,
        "municipio": "Tlajomulco de Zúñiga",
        "colonia": "Santa Cruz del Valle",
        "delito": "Fosa",
        "victimas": 1,
        "año": 2025,
        "latitud": 20.5514925342444,
        "longitud": -103.344805738079,
        "link": "https://www.ntrguadalajara.com/post.php?id_nota=230607"
    }
];
// ===== MÓDULO DE ACTUALIZACIÓN EN TIEMPO REAL =====
class RealTimeDataManager {
    constructor() {
        this.googleSheetsUrl = 'https://docs.google.com/spreadsheets/d/19QoQTxAgK9MEuRtcfsJAP66a1gMj22Md/export?format=csv&gid=2076449079';
        this.updateInterval = 30000; // 30 segundos
        this.lastDataHash = null;
        this.isUpdating = false;
        this.intervalId = null;
        this.statusElement = null;
        this.createStatusIndicator();
        this.startAutoUpdate();
    }

    createStatusIndicator() {
        // Crear indicador de estado en el header
        const headerContent = document.querySelector('.header-content');
        if (headerContent) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'real-time-status';
            statusDiv.innerHTML = `
                <div class="status-indicator">
                    <span id="status-icon">🟢</span>
                    <span id="status-text">Monitoreo activo</span>
                    <button id="manual-update" title="Actualizar manualmente">🔄</button>
                </div>
            `;
            headerContent.appendChild(statusDiv);
            this.statusElement = statusDiv;

            // Event listener para actualización manual
            document.getElementById('manual-update').addEventListener('click', () => {
                this.updateData(true);
            });
        }
    }

    updateStatus(icon, text) {
        const statusIcon = document.getElementById('status-icon');
        const statusText = document.getElementById('status-text');
        if (statusIcon) statusIcon.textContent = icon;
        if (statusText) statusText.textContent = text;
    }

    async fetchDataFromGoogleSheets() {
        try {
            this.updateStatus('🔄', 'Verificando cambios...');
            
            const response = await fetch(this.googleSheetsUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            return this.parseCSVData(csvText);
        } catch (error) {
            console.error('Error fetching data from Google Sheets:', error);
            this.updateStatus('❌', 'Error de conexión');
            throw error;
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.split('\n');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) { // Skip header
            const line = lines[i].trim();
            if (!line) continue;
            
            const row = this.parseCSVRow(line);
            if (row.length >= 9) {
                try {
                    // Procesar año preservando "2025p" como string
                    const añoValue = row[4].trim();
                    let añoProcessed;
                    if (añoValue.endsWith('p')) {
                        añoProcessed = añoValue; // Mantener como string "2025p"
                    } else {
                        añoProcessed = parseInt(añoValue) || 2025;
                    }

                    const record = {
                        referencia: row[0].trim(),
                        municipio: row[1].trim(),
                        colonia: row[2].trim(),
                        victimas: parseInt(row[3]) || 1,
                        año: añoProcessed,
                        mes: row[5].trim().toUpperCase(),
                        latitud: parseFloat(row[6].replace(',', '.')),
                        longitud: parseFloat(row[7].replace(',', '.')),
                        link: row[8].trim(),
                        delito: "Fosa Clandestina"
                    };
                    
                    data.push(record);
                } catch (error) {
                    console.warn('Error processing row:', row, error);
                }
            }
        }
        
        return data;
    }

    parseCSVRow(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    calculateDataHash(data) {
        const dataString = JSON.stringify(data.map(item => ({
            ref: item.referencia,
            mun: item.municipio,
            vic: item.victimas,
            año: item.año,
            mes: item.mes
        })));
        
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    async updateData(isManual = false) {
        if (this.isUpdating && !isManual) return;
        
        this.isUpdating = true;
        
        try {
            const newData = await this.fetchDataFromGoogleSheets();
            const newHash = this.calculateDataHash(newData);
            
            if (this.lastDataHash === null || this.lastDataHash !== newHash) {
                // Datos han cambiado, actualizar
                allData = newData;
                filteredData = [...allData];
                
                // Actualizar mapa y gráficos
                updateMapMarkers(filteredData);
                updateCharts(allData);
                populateFilters();
                
                this.lastDataHash = newHash;
                
                const now = new Date().toLocaleTimeString();
                this.updateStatus('✅', `Actualizado: ${now}`);
                
                if (isManual) {
                    this.showNotification('Datos actualizados manualmente');
                } else {
                    this.showNotification('Nuevos datos detectados y cargados');
                }
                
                console.log('Datos actualizados:', newData.length, 'registros');
            } else {
                // No hay cambios
                const now = new Date().toLocaleTimeString();
                this.updateStatus('🟢', 'Monitoreo activo');
                
                if (isManual) {
                    this.showNotification('No hay cambios en los datos');
                }
            }
        } catch (error) {
            console.error('Error updating data:', error);
            this.updateStatus('❌', 'Error de conexión');
        } finally {
            this.isUpdating = false;
        }
    }

    showNotification(message) {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = 'real-time-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    startAutoUpdate() {
        // Actualización inicial
        this.updateData();
        
        // Configurar actualizaciones periódicas
        this.intervalId = setInterval(() => {
            this.updateData();
        }, this.updateInterval);
        
        console.log('Sistema de tiempo real iniciado - Actualizaciones cada 30 segundos');
    }

    stopAutoUpdate() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.updateStatus('⏸️', 'Monitoreo pausado');
    }
}

// Inicializar sistema de tiempo real después del login
let realTimeManager = null;

// Modificar la función initializeApp para incluir tiempo real
function initializeApp() {
    initializeMap();
    populateFilters();
    setupEventListeners();
    updateDashboard(allData);
    updateCharts(allData);
    
    // Inicializar sistema de tiempo real
    if (!realTimeManager) {
        realTimeManager = new RealTimeDataManager();
    }
}



// ===== FUNCIÓN PARA CAMBIAR CAPA BASE =====
function changeBaseLayer() {
    const selectedBase = document.querySelector('input[name="baseLayer"]:checked').value;
    
    // Remover todas las capas base actuales
    map.eachLayer(function(layer) {
        if (layer._url && (layer._url.includes('openstreetmap') || 
                          layer._url.includes('arcgisonline') || 
                          layer._url.includes('World_Imagery') || 
                          layer._url.includes('World_Topo_Map'))) {
            map.removeLayer(layer);
        }
    });
    
    // Agregar la nueva capa base seleccionada
    if (window.baseLayers && window.baseLayers[selectedBase]) {
        window.baseLayers[selectedBase].addTo(map);
    }
}

