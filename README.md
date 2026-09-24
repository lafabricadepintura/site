# Catálogo Digital de Colores | La Fábrica Pinturas

Aplicación web moderna y optimizada desarrollada para explorar la paleta oficial de más de **3.000 colores** de **La Fábrica Pinturas**. Cuenta con simulador de iluminación en tiempo real (Luz Natural, Luz Cálida, Luz Fría), simulador de habitación, cálculo de armonías cromáticas, recomendación de colores similares mediante algoritmo perceptual **CIELAB ($\Delta E$)**, y botón directo para pedir cualquier color por WhatsApp.

---

## ✨ Características Principales

### 1. Paleta Oficial Completa (3.073 Colores)
- **Base de Datos Oficial**: 3.073 colores catalogados con sus nombres comerciales y códigos de formulación tintométrica.
- **Filtros por Tonalidad (Estilo Alba / AkzoNobel)**:
  - Botones circulares con muestras reales de cada familia cromática (*Blancos, Neutros Cálidos, Neutros Fríos, Rojos, Naranjas, Dorados, Amarillos, Limas, Verdes, Turquesas, Azules, Violetas*).
  - Selección única e intuitiva: al hacer clic en una familia se filtra de inmediato sin acumulación accidental.
- **Filtros por Tono & Acabado**:
  - Claros, Medios, Oscuros, Pasteles y Tonos Intensos.
- **Búsqueda Instantánea con Índice Precalculado**:
  - Búsqueda en tiempo real por nombre (ej: *"Escarcha Pura"*), código (ej: *"71YY"*), ID o código HEX con debouncing y respuesta en menos de 1 milisegundo.
- **Ordenamiento Flexible**:
  - Populares primero, de más claro a más oscuro, de más oscuro a más claro, alfabético (A-Z) o por código.

### 2. Vista de Detalle & Experiencia de Color
- **Deep-linking Directo**: Cada color cuenta con su propia URL compartible (ej: `#color=100`).
- **Simulador de Iluminación en Tiempo Real**:
  - ☀️ **Luz Natural (6500K)**
  - 💡 **Luz Cálida Hogar (2700K)**
  - 🏢 **Luz Fría / LED (4000K)**
- **Simulador de Habitación**: Vista previa realista de una pared ambientada con el color seleccionado para apreciar su comportamiento espacial.
- **Ideas de Combinación & Armonías**:
  - Sugerencias automáticas de tono más claro, tono más oscuro y acento de contraste complementario ($180^\circ$).
- **Colores Similares (CIELAB $\Delta E$)**:
  - Motor matemático perceptual que encuentra los 6 tonos más cercanos del catálogo y calcula su porcentaje de similitud visual.

### 3. Pedido Directo por WhatsApp
Al seleccionar cualquier color, la aplicación presenta un botón prominente:
> **"Pedir este color por WhatsApp"**

Genera de manera automática el mensaje preformateado hacia la tienda oficial (+54 221 498-9579):
```text
Hola! Me interesa este color:
Nombre: *Escarcha Pura*
Código: *71YY 90/027*
Tonalidad: *Blanco*
```

---

## 📂 Estructura del Proyecto

```
catalogo-colores/
├── index.html            # Interfaz principal limpia (HTML5 + Tailwind CSS + Lucide Icons)
├── app.js                # Lógica reactiva refactorizada (enrutamiento, búsqueda, filtros, CIELAB, WhatsApp)
├── styles.css            # Estilos personalizados, simulador de iluminación y escena de habitación
├── data/
│   ├── colors.json       # Dataset oficial de 3.073 colores
│   └── data.js           # Bundle JS para ejecución inmediata sin requerir servidor
├── scripts/
│   ├── process_data.py   # Script de procesamiento de coordenadas cromáticas (CIELAB / HSL)
│   └── test_refactor.js  # Suite de pruebas automatizadas
└── README.md             # Esta documentación
```

---

## 🚀 Despliegue y Ejecución

### Opción 1: Servidor Local
```bash
python3 -m http.server 3000
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### Opción 2: Uso Directo (Sin Servidor)
Puedes abrir el archivo `index.html` directamente con doble clic en cualquier navegador moderno.

### Opción 3: Producción
La aplicación es 100% estática (frontend vanilla HTML, CSS y JavaScript sin bundlers obligatorios). Puede publicarse en GitHub Pages, Vercel, Netlify o cualquier hosting web.
