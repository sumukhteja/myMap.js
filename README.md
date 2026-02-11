# myMap.js 🗺️

A lightweight, designer-grade Slippy Map library built for high-performance canvas rendering and vintage aesthetics.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Size](https://img.shields.io/badge/size-22KB-green.svg)

## ✨ Why myMap.js?

Most map libraries are heavy and focus on utility over style. **myMap.js** was built for designers who want a premium, interactive cartography experience without the overhead of massive frameworks.

- **🎨 Designer Aesthetics**: Custom sub-pixel branding using variable fonts (Gyst Variable).
- **🚀 Canvas Rendering**: Draws GeoJSON directly to the canvas for silky-smooth performance and hover effects.
- **🔍 Smooth Zoom**: Supports fractional zoom levels (e.g., 2.5) instead of just integers.
- **📜 Vintage Engine**: Optional "Vintage Mode" with sepia filters and vignette overlays built-in.
- **🔌 Self-Contained**: Automatically handles dependencies like font loading.

---

## 🚀 Quick Start

### 1. Include the Library
Include the script in your HTML file:
```html
<script src="mymap.js"></script>
```

### 2. Basic Setup
Initialize the map by providing a container ID and configuration options:

```javascript
const map = new MyMap('map-container', {
    center: [30, 90],           // [lat, lng]
    zoom: 3.5,                  // Supports fractional zoom!
    bgImage: 'paper.jpg',       // Custom background texture
    vintageStyle: true,         // Enable sepia/vignette overlays
    attribution: 'myMap.js'     // Designer signature
});
```

### 3. Add GeoJSON
Load and style your vector data:

```javascript
map.addGeoJSON(worldData, {
    color: '#4a3b2a',            // Stroke color
    fillColor: 'rgba(93,64,55,0.1)',
    hoverColor: 'rgba(141,110,99,0.3)',
    weight: 1
});
```

---

## 🛠️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `center` | Array | `[0, 0]` | Initial center [Latitude, Longitude] |
| `zoom` | Number | `2` | Initial zoom level (supports decimals) |
| `minZoom` | Number | `0` | Minimum zoom level |
| `maxZoom` | Number | `18` | Maximum zoom level |
| `tileUrl` | String | `OSM Standard` | XYZ tile provider template |
| `showTiles` | Boolean | `true` | Toggle background map tiles |
| `bgImage` | String | `null` | URL for map background texture |
| `vintageStyle`| Boolean | `false` | Apply sepia and vignette effects |
| `attribution` | String | `myMap.js` | Custom brand signature |

---

## 🏗️ Architecture

- **Rendering**: HTML5 Canvas (2D Context)
- **Projections**: Web Mercator (EPSG:3857)
- **Interaction**: Custom Ray-Casting for GeoJSON hit detection
- **Controls**: Minimalist focused navigation pill (bottom-center)

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*“Designing the future of cartography, one pixel at a time.”*
