/**
 * Catálogo Digital de Colores - La Fábrica Pinturas
 * Lógica limpia y refactorizada: Enrutamiento, Filtros de Colores,
 * Búsqueda optimizada, Simulador de Iluminación y Pedido directo por WhatsApp
 */

// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN
// ==========================================
let allColors = [];
let filteredColors = [];
let currentColor = null;
let currentLighting = 'day';
let currentVisualMode = 'swatch';
let renderedCount = 0;
const BATCH_SIZE = 60;

// Configuración de la Tienda Oficial
const SELLER_PHONE = '542214989579';
const SELLER_NAME = 'La Fábrica Pinturas';

// Familias de Color Oficiales
const COLOR_FAMILIES = [
    { name: 'Todos', slug: 'all', hex: '#64748b' },
    { name: 'Blanco', slug: 'white', hex: '#F3F2EC' },
    { name: 'Neutros Cálidos', slug: 'warm_neutral', hex: '#D6C4B2' },
    { name: 'Neutros Fríos', slug: 'cool_neutral', hex: '#C0C4C8' },
    { name: 'Rojo', slug: 'red', hex: '#EF4444' },
    { name: 'Naranja', slug: 'orange', hex: '#F97316' },
    { name: 'Dorado', slug: 'gold', hex: '#D97706' },
    { name: 'Amarillo', slug: 'yellow', hex: '#EAB308' },
    { name: 'Lima', slug: 'lime', hex: '#84cc16' },
    { name: 'Verde', slug: 'green', hex: '#10B981' },
    { name: 'Turquesa', slug: 'teal', hex: '#06B6D4' },
    { name: 'Azul', slug: 'blue', hex: '#3B82F6' },
    { name: 'Violeta', slug: 'violet', hex: '#8B5CF6' }
];

const HUE_SLUG_TO_NAME = {
    'all': 'Todos',
    'todos': 'Todos',
    'white': 'Blanco',
    'blanco': 'Blanco',
    'warm_neutral': 'Neutros Cálidos',
    'neutros_calidos': 'Neutros Cálidos',
    'cool_neutral': 'Neutros Fríos',
    'neutros_frios': 'Neutros Fríos',
    'neutral': 'Neutros',
    'neutros': 'Neutros',
    'red': 'Rojo',
    'rojo': 'Rojo',
    'orange': 'Naranja',
    'naranja': 'Naranja',
    'gold': 'Dorado',
    'dorado': 'Dorado',
    'ocre': 'Dorado',
    'yellow': 'Amarillo',
    'amarillo': 'Amarillo',
    'lime': 'Lima',
    'lima': 'Lima',
    'green': 'Verde',
    'verde': 'Verde',
    'teal': 'Turquesa',
    'turquoise': 'Turquesa',
    'turquesa': 'Turquesa',
    'blue': 'Azul',
    'azul': 'Azul',
    'violet': 'Violeta',
    'violeta': 'Violeta',
    'popular': 'Populares',
    'populares': 'Populares'
};

const FAMILY_NAME_TO_SLUG = {
    'Todos': 'all',
    'Blanco': 'white',
    'Neutros Cálidos': 'warm_neutral',
    'Neutros Fríos': 'cool_neutral',
    'Neutros': 'neutral',
    'Rojo': 'red',
    'Naranja': 'orange',
    'Dorado': 'gold',
    'Amarillo': 'yellow',
    'Lima': 'lime',
    'Verde': 'green',
    'Turquesa': 'teal',
    'Azul': 'blue',
    'Violeta': 'violet',
    'Populares': 'popular'
};

// Mapeo seguro de tonos a slugs URL (evita problemas con barras '/' y espacios)
const TONE_SLUG_TO_NAME = {
    'todos': 'todos',
    'claro': 'Claro',
    'medio': 'Medio',
    'oscuro': 'Oscuro',
    'pastel': 'Pastel / Suave',
    'pastel_suave': 'Pastel / Suave',
    'intenso': 'Intenso / Vivo',
    'intenso_vivo': 'Intenso / Vivo'
};

const TONE_NAME_TO_SLUG = {
    'Claro': 'claro',
    'Medio': 'medio',
    'Oscuro': 'oscuro',
    'Pastel / Suave': 'pastel',
    'Intenso / Vivo': 'intenso'
};

// Filtros activos
const activeFilters = {
    search: '',
    family: '',     // Familia activa única (ej: 'Violeta' o '' para todos)
    tones: [],      // Array de tonos (ej: ['Claro', 'Pastel / Suave'])
    sort: 'popular'
};
window.activeFilters = activeFilters;

// ==========================================
// UTILIDADES AUXILIARES
// ==========================================
function safeCreateIcons() {
    if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}

function normalizeText(text) {
    if (!text) return '';
    return text.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let searchDebounceTimer = null;
function debounce(fn, delay = 120) {
    return (...args) => {
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => fn(...args), delay);
    };
}

// Precalcula el texto de búsqueda para cada color en una sola pasada O(N)
function indexColorsForSearch(colors) {
    for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        c._search = normalizeText(`${c.name} ${c.code} ${c.family} ${c.hex} ${c.id}`);
    }
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
let appInitialized = false;

async function initApp() {
    if (appInitialized) return;
    appInitialized = true;

    await loadData();
    parseUrlFilters();
    renderAlbaHueSwatches();
    renderTonePills();
    renderActiveFiltersBar();
    setupEventListeners();
    handleRoute();
    safeCreateIcons();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

window.addEventListener('load', () => {
    if (!appInitialized || allColors.length === 0) {
        initApp();
    }
    safeCreateIcons();
});

async function loadData() {
    // 1. Bundle rápido en memoria (window.APP_COLORS)
    if (window.APP_COLORS && window.APP_COLORS.length > 0) {
        allColors = window.APP_COLORS;
    } else {
        // 2. Carga vía Fetch de colors.json
        try {
            const colorsRes = await fetch('data/colors.json');
            if (colorsRes.ok) {
                allColors = await colorsRes.json();
            }
        } catch (e) {
            console.error("Error al cargar data/colors.json:", e);
        }

        if ((!allColors || allColors.length === 0) && window.APP_COLORS) {
            allColors = window.APP_COLORS;
        }
    }

    // Indexar para búsqueda ultra-rápida
    indexColorsForSearch(allColors);

    // Leer filtros iniciales de URL si existen
    parseUrlFilters();

    filteredColors = [...allColors];
    applyFiltersAndSorting();
}

function setupEventListeners() {
    const headerInput = document.getElementById('headerSearchInput');
    const mobileInput = document.getElementById('mobileSearchInput');

    const debouncedFilter = debounce((val) => {
        activeFilters.search = val.trim();
        syncUrlState();
        applyFiltersAndSorting();
    }, 120);

    const handleSearchInput = (val) => {
        // Sincronizar inputs visualmente al instante
        if (headerInput && headerInput.value !== val) headerInput.value = val;
        if (mobileInput && mobileInput.value !== val) mobileInput.value = val;

        const hasSearch = val.trim().length > 0;
        const headerClear = document.getElementById('headerClearSearch');
        const mobileClear = document.getElementById('mobileClearSearch');
        if (headerClear) headerClear.classList.toggle('hidden', !hasSearch);
        if (mobileClear) mobileClear.classList.toggle('hidden', !hasSearch);

        debouncedFilter(val);
    };

    if (headerInput) {
        headerInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
    }
    if (mobileInput) {
        mobileInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
    }

    // Atajo de teclado '/' para enfocar el buscador
    window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            if (headerInput) headerInput.focus();
        }
    });

    // Enrutamiento por Hash y popstate del navegador
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('popstate', handleRoute);

    // Scroll infinito con throttle ligero
    let scrollThrottle = false;
    window.addEventListener('scroll', () => {
        if (scrollThrottle) return;
        scrollThrottle = true;
        setTimeout(() => { scrollThrottle = false; }, 80);

        const catalogView = document.getElementById('catalogView');
        if (!catalogView || catalogView.classList.contains('hidden')) return;

        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.documentElement.scrollHeight;
        if (scrollPosition >= pageHeight - 380) {
            loadMoreColors();
        }
    }, { passive: true });
}

// ==========================================
// ENRUTAMIENTO (ROUTING)
// ==========================================
function handleRoute() {
    const rawHash = window.location.hash || '';

    if (rawHash.startsWith('#color=')) {
        const colorId = rawHash.replace('#color=', '').split('?')[0].trim();
        showColorDetail(colorId);
    } else {
        // Vista de catálogo
        const hadFilters = parseUrlFilters();
        if (hadFilters) {
            const headerInput = document.getElementById('headerSearchInput');
            const mobileInput = document.getElementById('mobileSearchInput');
            if (headerInput && headerInput.value !== activeFilters.search) headerInput.value = activeFilters.search;
            if (mobileInput && mobileInput.value !== activeFilters.search) mobileInput.value = activeFilters.search;

            const sortSelect = document.getElementById('sortSelect');
            if (sortSelect && activeFilters.sort) sortSelect.value = activeFilters.sort;

            renderAlbaHueSwatches();
            renderTonePills();
            renderActiveFiltersBar();
            applyFiltersAndSorting();
        }
        showCatalog();
    }
}

function navigateToCatalog() {
    // Preserva los filtros activos en la URL si existían
    syncUrlState();
    showCatalog();
}

function updateNavTabs(activeTab) {
    const headerSearch = document.getElementById('headerSearchWrapper');
    const mobileSearch = document.getElementById('mobileSearchWrapper');

    if (activeTab === 'colors' || activeTab === 'catalog') {
        if (headerSearch) headerSearch.classList.remove('opacity-0', 'pointer-events-none');
        if (mobileSearch) mobileSearch.classList.remove('hidden');
    } else {
        if (headerSearch) headerSearch.classList.add('opacity-0', 'pointer-events-none');
        if (mobileSearch) mobileSearch.classList.add('hidden');
    }

    safeCreateIcons();
}

function showCatalog() {
    const detailView = document.getElementById('detailView');
    const catalogView = document.getElementById('catalogView');

    if (detailView) detailView.classList.add('hidden');
    if (catalogView) catalogView.classList.remove('hidden');
    updateNavTabs('colors');

    // Asegurar renderizado si la grilla está vacía
    const grid = document.getElementById('colorsGrid');
    if (grid && grid.children.length === 0 && allColors.length > 0) {
        applyFiltersAndSorting();
    }
}

function showColorDetail(colorId) {
    if (!allColors || allColors.length === 0) {
        setTimeout(() => showColorDetail(colorId), 120);
        return;
    }

    const color = allColors.find(c => String(c.id) === String(colorId));
    if (!color) {
        navigateToCatalog();
        return;
    }

    currentColor = color;

    const catalogView = document.getElementById('catalogView');
    const detailView = document.getElementById('detailView');

    if (catalogView) catalogView.classList.add('hidden');
    if (detailView) detailView.classList.remove('hidden');
    updateNavTabs('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    renderColorDetail(color);
}

// ==========================================
// FILTRADO Y RENDERIZADO DEL CATÁLOGO
// ==========================================
function clearSearch() {
    const headerInput = document.getElementById('headerSearchInput');
    const mobileInput = document.getElementById('mobileSearchInput');
    if (headerInput) headerInput.value = '';
    if (mobileInput) mobileInput.value = '';

    const headerClear = document.getElementById('headerClearSearch');
    const mobileClear = document.getElementById('mobileClearSearch');
    if (headerClear) headerClear.classList.add('hidden');
    if (mobileClear) mobileClear.classList.add('hidden');

    activeFilters.search = '';
    syncUrlState();
    renderActiveFiltersBar();
    applyFiltersAndSorting();
}

function renderAlbaHueSwatches() {
    const target = document.getElementById('albaHueContainer');
    if (!target) return;

    const isAll = !activeFilters.family || activeFilters.family === 'Todos';

    target.innerHTML = COLOR_FAMILIES.map(fam => {
        const isActive = fam.name === 'Todos' ? isAll : (activeFilters.family === fam.name);

        const swatchBg = fam.name === 'Todos'
            ? 'background: conic-gradient(from 180deg, #EF4444, #F97316, #EAB308, #10B981, #06B6D4, #3B82F6, #8B5CF6, #EF4444);'
            : (fam.name === 'Neutros'
                ? 'background: linear-gradient(135deg, #D6C4B2, #C0C4C8);'
                : `background-color: ${fam.hex};`);

        return `
            <button onclick="toggleFamilyFilter('${fam.name}')" 
                    class="alba-hue-btn shrink-0 ${isActive ? 'is-active' : ''}"
                    title="${fam.name}" aria-label="Filtrar por familia ${fam.name}">
                <div class="alba-hue-circle" style="${swatchBg}">
                    ${isActive && fam.name !== 'Todos' ? '<span class="text-white drop-shadow font-black text-xs">✓</span>' : ''}
                </div>
                <span class="alba-hue-label">${fam.name}</span>
            </button>
        `;
    }).join('');
}

function toggleFamilyFilter(famName) {
    // Selección única: si ya está activa o es 'Todos', se desactiva
    if (famName === 'Todos' || activeFilters.family === famName) {
        activeFilters.family = '';
    } else {
        activeFilters.family = famName;
    }
    renderAlbaHueSwatches();
    renderActiveFiltersBar();
    syncUrlState();
    applyFiltersAndSorting();
}

function renderTonePills() {
    const isAll = !activeFilters.tones || activeFilters.tones.length === 0;

    document.querySelectorAll('.tone-pill').forEach(pill => {
        const tone = pill.getAttribute('data-tone');
        const isActive = tone === 'todos' ? isAll : (activeFilters.tones && activeFilters.tones.includes(tone));

        if (isActive) {
            pill.className = 'tone-pill px-2.5 py-1 text-xs rounded-lg bg-brand-500 text-slate-950 font-bold border border-brand-500 shadow-sm transition cursor-pointer';
        } else {
            pill.className = 'tone-pill px-2.5 py-1 text-xs rounded-lg bg-surface-800 font-medium text-slate-300 hover:bg-surface-700 border border-surface-700 transition cursor-pointer';
        }
    });
}

function toggleToneFilter(toneName) {
    if (toneName === 'todos') {
        activeFilters.tones = [];
    } else {
        if (!activeFilters.tones) activeFilters.tones = [];
        const index = activeFilters.tones.indexOf(toneName);
        if (index >= 0) {
            activeFilters.tones.splice(index, 1);
        } else {
            activeFilters.tones.push(toneName);
        }
    }
    renderTonePills();
    renderActiveFiltersBar();
    syncUrlState();
    applyFiltersAndSorting();
}

function renderActiveFiltersBar() {
    const bar = document.getElementById('activeFiltersBar');
    if (!bar) return;

    const hasFamily = activeFilters.family && activeFilters.family !== 'Todos';
    const hasTones = activeFilters.tones && activeFilters.tones.length > 0;
    const hasSearch = activeFilters.search && activeFilters.search.trim().length > 0;

    if (!hasFamily && !hasTones && !hasSearch) {
        bar.classList.add('hidden');
        return;
    }

    bar.classList.remove('hidden');

    const tagsContainer = document.getElementById('activeFilterTags');
    if (!tagsContainer) return;

    let html = '';

    // Tag de búsqueda
    if (hasSearch) {
        html += `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-750 text-white border border-surface-600">
                <i data-lucide="search" class="w-3 h-3 text-brand-400"></i>
                <span>"${escapeHtml(activeFilters.search)}"</span>
                <button onclick="clearSearch()" class="hover:text-rose-400 ml-1 font-bold cursor-pointer" title="Quitar búsqueda">×</button>
            </span>
        `;
    }

    // Tag de Tonalidad / Familia
    if (hasFamily) {
        html += `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500/15 text-brand-300 border border-brand-500/40">
                <span class="w-2 h-2 rounded-full bg-brand-400"></span>
                <span>Tonalidad: <strong>${escapeHtml(activeFilters.family)}</strong></span>
                <button onclick="toggleFamilyFilter('${activeFilters.family}')" class="hover:text-white font-bold ml-1 cursor-pointer" title="Quitar tonalidad ${escapeHtml(activeFilters.family)}">×</button>
            </span>
        `;
    }

    // Tags de Tonos
    if (hasTones) {
        activeFilters.tones.forEach(tone => {
            html += `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-750 text-slate-200 border border-surface-600">
                    <span>${escapeHtml(tone)}</span>
                    <button onclick="toggleToneFilter('${tone}')" class="hover:text-rose-400 font-bold ml-1 cursor-pointer" title="Quitar ${escapeHtml(tone)}">×</button>
                </span>
            `;
        });
    }

    tagsContainer.innerHTML = html;
    safeCreateIcons();
}

// ==========================================
// URL DEEP LINKING (Estilo Alba: filters/h_.../t_...)
// ==========================================
function syncUrlState() {
    const rawHash = window.location.hash || '';
    if (rawHash.startsWith('#color=')) {
        return;
    }

    const segments = [];

    // 1. Hue h_ (Familia única)
    if (activeFilters.family && activeFilters.family !== 'Todos') {
        const slug = FAMILY_NAME_TO_SLUG[activeFilters.family] || normalizeText(activeFilters.family).replace(/\s+/g, '_');
        segments.push(`h_${slug}`);
    }

    // 2. Tones t_ (Slugs limpios sin caracteres especiales ni barras)
    if (activeFilters.tones && activeFilters.tones.length > 0) {
        const toneSlugs = activeFilters.tones.map(t => TONE_NAME_TO_SLUG[t] || normalizeText(t)).filter(Boolean);
        if (toneSlugs.length > 0) {
            segments.push(`t_${toneSlugs.join(',')}`);
        }
    }

    // 3. Search q_
    if (activeFilters.search && activeFilters.search.trim().length > 0) {
        segments.push(`q_${encodeURIComponent(activeFilters.search.trim())}`);
    }

    let newHash = '#catalogo';
    if (segments.length > 0) {
        newHash = `#filters/${segments.join('/')}`;
    }

    if (window.location.hash !== newHash) {
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', newHash);
        } else {
            window.location.hash = newHash;
        }
    }
}

function parseUrlFilters() {
    const rawHash = window.location.hash || '';
    const rawSearch = window.location.search || '';

    if (!rawHash && !rawSearch) return false;
    if (rawHash === '#catalogo' || rawHash === '#paleta') return false;

    let changed = false;

    // 1. Análisis de ruta filters/h_.../t_.../q_...
    if (rawHash.includes('filters/') || rawHash.includes('h_') || rawHash.includes('t_') || rawHash.includes('q_')) {
        // h_ (Hue / Familia)
        const hMatch = rawHash.match(/h_([a-zA-Z0-9_\-]+)/i);
        if (hMatch) {
            const slug = hMatch[1].toLowerCase().trim();
            const matched = HUE_SLUG_TO_NAME[slug];
            if (matched && matched !== 'Todos') {
                activeFilters.family = matched;
                changed = true;
            } else if (!matched && slug.length > 0) {
                activeFilters.family = hMatch[1].trim();
                changed = true;
            }
        }

        // t_ (Tonos con slugs)
        const tMatch = rawHash.match(/t_([a-zA-Z0-9_,\-%]+)/i);
        if (tMatch) {
            const rawItems = decodeURIComponent(tMatch[1]).split(',').map(s => s.trim().toLowerCase());
            const resolved = [];
            rawItems.forEach(item => {
                if (TONE_SLUG_TO_NAME[item]) {
                    resolved.push(TONE_SLUG_TO_NAME[item]);
                } else if (item === 'claro') resolved.push('Claro');
                else if (item === 'medio') resolved.push('Medio');
                else if (item === 'oscuro') resolved.push('Oscuro');
                else if (item.includes('pastel')) resolved.push('Pastel / Suave');
                else if (item.includes('intenso')) resolved.push('Intenso / Vivo');
            });
            if (resolved.length > 0) {
                activeFilters.tones = resolved;
                changed = true;
            }
        }

        // q_ (Búsqueda de texto)
        const qMatch = rawHash.match(/q_([^\/\?#&]+)/i);
        if (qMatch) {
            activeFilters.search = decodeURIComponent(qMatch[1]).trim();
            changed = true;
        }
    }

    // 2. Soporte para query parameters tradicionales: ?familia=...&tonos=...
    const queryString = rawHash.includes('?') 
        ? rawHash.substring(rawHash.indexOf('?') + 1)
        : (rawSearch ? rawSearch.replace(/^\?/, '') : '');

    if (queryString) {
        const params = new URLSearchParams(queryString);
        if (params.has('familia') || params.has('h')) {
            const raw = (params.get('familia') || params.get('h')).split(',')[0].trim().toLowerCase();
            if (raw) {
                activeFilters.family = HUE_SLUG_TO_NAME[raw] || raw;
                changed = true;
            }
        }
        if (params.has('tonos') || params.has('t')) {
            const raw = params.get('tonos') || params.get('t');
            const list = raw.split(',').map(s => {
                const clean = s.trim().toLowerCase();
                return TONE_SLUG_TO_NAME[clean] || s.trim();
            }).filter(Boolean);
            if (list.length > 0) {
                activeFilters.tones = list;
                changed = true;
            }
        }
        if (params.has('q')) {
            activeFilters.search = params.get('q').trim();
            changed = true;
        }
        if (params.has('orden')) {
            activeFilters.sort = params.get('orden');
            changed = true;
        }
    }

    return changed;
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast("¡Enlace copiado al portapapeles! 🔗");
    } catch (e) {
        showToast("Copia este enlace de la barra de direcciones");
    }
    document.body.removeChild(ta);
}

function resetFilters() {
    activeFilters.search = '';
    activeFilters.family = '';
    activeFilters.tones = [];
    activeFilters.sort = 'popular';

    const headerInput = document.getElementById('headerSearchInput');
    const mobileInput = document.getElementById('mobileSearchInput');
    if (headerInput) headerInput.value = '';
    if (mobileInput) mobileInput.value = '';

    const headerClear = document.getElementById('headerClearSearch');
    const mobileClear = document.getElementById('mobileClearSearch');
    if (headerClear) headerClear.classList.add('hidden');
    if (mobileClear) mobileClear.classList.add('hidden');

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'popular';

    renderAlbaHueSwatches();
    renderTonePills();
    renderActiveFiltersBar();
    syncUrlState();
    applyFiltersAndSorting();
    showToast("Filtros restablecidos. Mostrando toda la paleta.");
}

function applySorting(sortMode) {
    activeFilters.sort = sortMode;
    syncUrlState();
    applyFiltersAndSorting();
}

function applyFiltersAndSorting() {
    let result = allColors;

    // 1. Filtro de búsqueda textual ultra-rápido por índice precalculado
    if (activeFilters.search) {
        const query = normalizeText(activeFilters.search);
        result = result.filter(c => c._search.includes(query));
    }

    // 2. Filtro de Familia / Hue (Selección única sin acumulación)
    if (activeFilters.family && activeFilters.family !== 'Todos') {
        const targetFamily = activeFilters.family;
        result = result.filter(c => {
            if (targetFamily === 'Populares') return c.isPopular;
            if (targetFamily === 'Neutros') return c.family && c.family.startsWith('Neutros');
            return c.family === targetFamily;
        });
    }

    // 3. Filtro de Tonos (Multi-selección)
    if (activeFilters.tones && activeFilters.tones.length > 0) {
        result = result.filter(c => {
            return activeFilters.tones.some(t => {
                if (t === 'Claro' || t === 'Medio' || t === 'Oscuro') {
                    return c.tone === t;
                }
                if (t === 'Pastel / Suave') {
                    return c.finish === 'Pastel / Suave';
                }
                if (t === 'Intenso / Vivo') {
                    return c.finish === 'Intenso / Vivo';
                }
                return false;
            });
        });
    }

    // 4. Ordenamiento
    const sorted = [...result];
    switch (activeFilters.sort) {
        case 'popular':
            sorted.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0) || parseInt(a.id, 10) - parseInt(b.id, 10));
            break;
        case 'light-asc':
            sorted.sort((a, b) => b.hsl[2] - a.hsl[2]);
            break;
        case 'light-desc':
            sorted.sort((a, b) => a.hsl[2] - b.hsl[2]);
            break;
        case 'name-asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'code-asc':
            sorted.sort((a, b) => a.code.localeCompare(b.code));
            break;
    }

    filteredColors = sorted;
    renderedCount = 0;

    // Actualizar contador
    const counter = document.getElementById('resultsCounter');
    if (counter) {
        counter.innerHTML = `Mostrando <strong class="text-white">${filteredColors.length.toLocaleString('es-AR')}</strong> de ${allColors.length.toLocaleString('es-AR')} colores`;
    }

    // Renderizar primer lote en la grilla
    const grid = document.getElementById('colorsGrid');
    if (grid) {
        grid.innerHTML = '';
        if (filteredColors.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full py-16 text-center text-slate-400 space-y-3">
                    <p class="text-base font-semibold">No se encontraron colores con los filtros seleccionados.</p>
                    <button onclick="resetFilters()" class="px-4 py-2 bg-brand-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-brand-400 transition cursor-pointer">
                        Restablecer Filtros
                    </button>
                </div>
            `;
            const loadMoreBtn = document.getElementById('loadMoreSection');
            if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        } else {
            loadMoreColors();
        }
    }

    renderActiveFiltersBar();
}

function loadMoreColors() {
    const grid = document.getElementById('colorsGrid');
    const loadMoreBtn = document.getElementById('loadMoreSection');
    if (!grid) return;

    if (renderedCount >= filteredColors.length) {
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        return;
    }

    const nextBatch = filteredColors.slice(renderedCount, renderedCount + BATCH_SIZE);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < nextBatch.length; i++) {
        fragment.appendChild(createColorCardElement(nextBatch[i]));
    }

    grid.appendChild(fragment);
    renderedCount += nextBatch.length;

    if (loadMoreBtn) {
        loadMoreBtn.classList.toggle('hidden', renderedCount >= filteredColors.length);
    }

    safeCreateIcons();
}

function createColorCardElement(color) {
    const card = document.createElement('div');
    card.className = 'swatch-card bg-surface-850 rounded-2xl border border-surface-750 overflow-hidden cursor-pointer flex flex-col justify-between group';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Color ${color.name}, código ${color.code}`);

    card.innerHTML = `
        <div class="h-28 sm:h-32 w-full relative transition-all" style="background-color: ${color.hex};">
            ${color.isPopular ? `
                <span class="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-black/50 backdrop-blur-md text-brand-400 border border-brand-500/30">
                    ★ POPULAR
                </span>
            ` : ''}
        </div>
        
        <div class="p-3 flex-1 flex flex-col justify-between">
            <div>
                <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                    <span class="truncate">${escapeHtml(color.family)}</span>
                </div>
                <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-brand-400 transition line-clamp-1 mt-0.5" title="${escapeHtml(color.name)}">
                    ${escapeHtml(color.name)}
                </h4>
            </div>
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-surface-800">
                <span class="text-[11px] font-mono text-slate-400 truncate">${escapeHtml(color.code)}</span>
                <span class="text-[10px] font-semibold text-brand-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                    Ver <i data-lucide="chevron-right" class="w-3 h-3 ml-0.5"></i>
                </span>
            </div>
        </div>
    `;

    card.addEventListener('click', () => selectColor(color.id));
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectColor(color.id);
        }
    });

    return card;
}

function selectColor(colorId) {
    window.location.hash = `#color=${colorId}`;
}

// ==========================================
// MOTOR DE SIMILITUD PERCEPTUAL CIELAB DELTA-E
// ==========================================
function calculateDeltaE(lab1, lab2) {
    const dL = lab1[0] - lab2[0];
    const da = lab1[1] - lab2[1];
    const db = lab1[2] - lab2[2];
    return Math.sqrt(dL * dL + da * da + db * db);
}

function findSimilarColors(targetColor, count = 6) {
    if (!targetColor || !targetColor.lab) return [];

    const scored = [];
    for (let i = 0; i < allColors.length; i++) {
        const other = allColors[i];
        if (other.id === targetColor.id) continue;

        const dE = calculateDeltaE(targetColor.lab, other.lab);
        // Porcentaje aproximado de similitud visual
        const similarity = Math.max(70, Math.min(99, Math.round(100 - (dE * 1.5))));
        scored.push({ color: other, dE, similarity });
    }

    scored.sort((a, b) => a.dE - b.dE);
    return scored.slice(0, count);
}

// ==========================================
// RENDERIZADO DE LA VISTA DE DETALLE
// ==========================================
function renderColorDetail(color) {
    if (!color) return;

    // Título y Código
    const title = document.getElementById('detailTitle');
    if (title) title.innerText = color.name;
    const badgeCode = document.getElementById('detailBadgeCode');
    if (badgeCode) badgeCode.innerText = color.code;
    const badgeType = document.getElementById('detailBadgeType');
    if (badgeType) badgeType.innerText = color.type;

    // Overlay de la muestra grande
    const overlayName = document.getElementById('detailOverlayName');
    if (overlayName) overlayName.innerText = color.name;
    const overlayCode = document.getElementById('detailOverlayCode');
    if (overlayCode) overlayCode.innerText = `Cód: ${color.code}`;
    const familyTag = document.getElementById('detailFamilyTag');
    if (familyTag) familyTag.innerText = color.family;

    const popBadge = document.getElementById('detailPopularBadge');
    if (popBadge) {
        popBadge.classList.toggle('hidden', !color.isPopular);
    }

    // Color a la muestra y al simulador de habitación
    const visualContainer = document.getElementById('visualSwatchContainer');
    const roomWall = document.getElementById('roomWall');
    if (visualContainer) {
        visualContainer.style.backgroundColor = color.hex;
    }
    if (roomWall) {
        roomWall.style.backgroundColor = color.hex;
    }

    // Resetear a Luz Natural
    setLighting('day');

    // Colores Similares
    renderSimilarColors(color);

    // Combinaciones de color
    renderHarmonies(color);

    safeCreateIcons();
}

function renderSimilarColors(targetColor) {
    const container = document.getElementById('similarColorsGrid');
    if (!container) return;

    const similar = findSimilarColors(targetColor, 6);
    container.innerHTML = similar.map(({ color, similarity }) => `
        <div onclick="selectColor('${color.id}')" 
             class="bg-surface-800 hover:bg-surface-750 p-2.5 rounded-xl border border-surface-700 hover:border-brand-500/50 cursor-pointer transition group"
             role="button" tabindex="0" title="${escapeHtml(color.name)} (${similarity}% similar)">
            <div class="w-full h-14 rounded-lg relative mb-2 border border-surface-700/60" style="background-color: ${color.hex};">
                <span class="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-brand-400">
                    ${similarity}%
                </span>
            </div>
            <div class="text-[11px] font-bold text-white group-hover:text-brand-400 transition truncate">${escapeHtml(color.name)}</div>
            <div class="text-[10px] font-mono text-slate-400 truncate">${escapeHtml(color.code)}</div>
        </div>
    `).join('');
}

function renderHarmonies(color) {
    const container = document.getElementById('harmoniesContainer');
    if (!container) return;

    // Calcular complemento exacto (matiz + 180°)
    const h = (color.hsl[0] + 180) % 360;
    const s = color.hsl[1];

    let bestComplement = null;
    let minScore = Infinity;

    // Búsqueda óptima O(N) sin instanciar arreglos pesados
    for (let i = 0; i < allColors.length; i++) {
        const c = allColors[i];
        const dh = Math.abs(c.hsl[0] - h);
        const normDh = Math.min(dh, 360 - dh);
        const score = normDh + Math.abs(c.hsl[1] - s) * 0.5;
        if (score < minScore) {
            minScore = score;
            bestComplement = c;
        }
    }
    const compColor = bestComplement || color;

    // Tonos monocromáticos más claro y más oscuro de la misma familia
    let monoLighter = null;
    let monoDarker = null;

    for (let i = 0; i < allColors.length; i++) {
        const c = allColors[i];
        if (c.family === color.family && c.id !== color.id) {
            if (c.hsl[2] > color.hsl[2] + 10 && (!monoLighter || c.hsl[2] < monoLighter.hsl[2])) {
                monoLighter = c;
            }
            if (c.hsl[2] < color.hsl[2] - 10 && (!monoDarker || c.hsl[2] > monoDarker.hsl[2])) {
                monoDarker = c;
            }
        }
    }

    const lightTarget = monoLighter || color;
    const darkTarget = monoDarker || color;

    container.innerHTML = `
        <div onclick="selectColor('${lightTarget.id}')" class="p-2 rounded-xl bg-surface-800 border border-surface-700 hover:border-brand-400 cursor-pointer transition" role="button" tabindex="0">
            <div class="h-10 rounded-lg mb-1.5 border border-surface-700/80" style="background-color: ${lightTarget.hex}"></div>
            <div class="text-[10px] font-semibold text-slate-300 truncate">Tono Claro</div>
            <div class="text-[9px] text-slate-400 truncate">${escapeHtml(lightTarget.name)}</div>
        </div>
        <div onclick="selectColor('${darkTarget.id}')" class="p-2 rounded-xl bg-surface-800 border border-surface-700 hover:border-brand-400 cursor-pointer transition" role="button" tabindex="0">
            <div class="h-10 rounded-lg mb-1.5 border border-surface-700/80" style="background-color: ${darkTarget.hex}"></div>
            <div class="text-[10px] font-semibold text-slate-300 truncate">Tono Oscuro</div>
            <div class="text-[9px] text-slate-400 truncate">${escapeHtml(darkTarget.name)}</div>
        </div>
        <div onclick="selectColor('${compColor.id}')" class="p-2 rounded-xl bg-surface-800 border border-surface-700 hover:border-brand-400 cursor-pointer transition" role="button" tabindex="0">
            <div class="h-10 rounded-lg mb-1.5 border border-surface-700/80" style="background-color: ${compColor.hex}"></div>
            <div class="text-[10px] font-semibold text-slate-300 truncate">Acento Contraste</div>
            <div class="text-[9px] text-slate-400 truncate">${escapeHtml(compColor.name)}</div>
        </div>
    `;
}

// ==========================================
// SIMULADOR DE ILUMINACIÓN Y VISTAS
// ==========================================
function setLighting(mode) {
    currentLighting = mode;
    const swatch = document.getElementById('visualSwatchContainer');
    const roomWall = document.getElementById('roomWall');
    const label = document.getElementById('activeLightLabel');

    const btnDay = document.getElementById('btnLightDay');
    const btnWarm = document.getElementById('btnLightWarm');
    const btnCool = document.getElementById('btnLightCool');

    const defaultBtnClass = 'py-2 px-2 rounded-xl text-xs font-semibold border transition bg-surface-800 border-surface-700 text-slate-300 cursor-pointer';

    if (btnDay) btnDay.className = defaultBtnClass;
    if (btnWarm) btnWarm.className = defaultBtnClass;
    if (btnCool) btnCool.className = defaultBtnClass;

    [swatch, roomWall].forEach(el => {
        if (!el) return;
        el.classList.remove('light-day', 'light-warm', 'light-cool');
        el.classList.add(`light-${mode}`);
    });

    if (mode === 'day') {
        if (label) label.innerText = 'Luz Natural (6500K)';
        if (btnDay) btnDay.className = 'py-2 px-2 rounded-xl text-xs font-bold border transition bg-brand-500/10 border-brand-500 text-brand-400 cursor-pointer';
    } else if (mode === 'warm') {
        if (label) label.innerText = 'Luz Cálida Hogar (2700K)';
        if (btnWarm) btnWarm.className = 'py-2 px-2 rounded-xl text-xs font-bold border transition bg-amber-500/10 border-amber-500 text-amber-400 cursor-pointer';
    } else if (mode === 'cool') {
        if (label) label.innerText = 'Luz Fría / LED (4000K)';
        if (btnCool) btnCool.className = 'py-2 px-2 rounded-xl text-xs font-bold border transition bg-cyan-500/10 border-cyan-500 text-cyan-400 cursor-pointer';
    }
}

function switchVisualMode(mode) {
    currentVisualMode = mode;
    const swatchContainer = document.getElementById('visualSwatchContainer');
    const roomContainer = document.getElementById('visualRoomContainer');
    const tabSwatch = document.getElementById('tabSwatch');
    const tabRoom = document.getElementById('tabRoom');

    if (mode === 'swatch') {
        if (swatchContainer) swatchContainer.classList.remove('hidden');
        if (roomContainer) roomContainer.classList.add('hidden');
        if (tabSwatch) tabSwatch.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition bg-surface-700 text-white shadow cursor-pointer';
        if (tabRoom) tabRoom.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white cursor-pointer';
    } else {
        if (swatchContainer) swatchContainer.classList.add('hidden');
        if (roomContainer) roomContainer.classList.remove('hidden');
        if (tabRoom) tabRoom.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition bg-surface-700 text-white shadow cursor-pointer';
        if (tabSwatch) tabSwatch.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition text-slate-400 hover:text-white cursor-pointer';
    }
}

// ==========================================
// PEDIDO Y COMPARTIR VÍA WHATSAPP
// ==========================================
function getDirectColorUrl(colorId) {
    const base = window.location.href.split('#')[0];
    return `${base}#color=${colorId}`;
}

function orderColorViaWhatsApp() {
    if (!currentColor) return;

    const phone = SELLER_PHONE;
    const message = 
`Hola! Me interesa este color:
Nombre: *${currentColor.name}*
Código: *${currentColor.code}*
Tonalidad: *${currentColor.family}*`;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
}

function shareCurrentColor() {
    if (!currentColor) return;
    const url = getDirectColorUrl(currentColor.id);

    if (navigator.share) {
        navigator.share({
            title: `Color: ${currentColor.name} - La Fábrica Pinturas`,
            text: `Mira este color para pintar: ${currentColor.name} (Cód: ${currentColor.code})`,
            url: url
        }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showToast("¡Enlace directo del color copiado al portapapeles!");
        }).catch(() => {
            fallbackCopy(url);
        });
    } else {
        fallbackCopy(url);
    }
}

// ==========================================
// NOTIFICACIONES TOAST
// ==========================================
let toastTimeout = null;
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const msgElem = document.getElementById('toastMessage');
    if (!toast || !msgElem) return;

    msgElem.innerText = message;
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}
