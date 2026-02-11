// ========================================
// myMap.js - Custom Slippy Map Library
// ========================================

class MyMap {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container ${containerId} not found`);
    }

    // Configuration
    this.center = options.center || [0, 0]; // [lat, lng]
    this.zoom = options.zoom || 2;
    this.minZoom = options.minZoom || 0;
    this.maxZoom = options.maxZoom || 18;
    this.tileSize = 256;
    this.tileUrl = options.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.showTiles = options.showTiles !== undefined ? options.showTiles : true;

    // Styling
    this.bgImage = options.bgImage || null;
    this.vintageStyle = options.vintageStyle || false;
    this.attribution = options.attribution || 'myMap.js';

    // State
    this.dragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.tiles = new Map();
    this.markers = [];
    this.geoJSONLayers = [];
    this.hoveredFeature = null;
    this.onFeatureHover = null;

    // Initialize
    this.loadFonts();
    this.setupDOM();
    this.setupEventListeners();
    this.render();
  }

  loadFonts() {
    const fontId = 'mymap-fonts';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href = 'https://use.typekit.net/ixx1riy.css';
      document.head.appendChild(link);
    }
  }

  setupDOM() {
    // Container setup
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.width = this.container.style.width || '100%';
    this.container.style.cursor = 'grab';
    this.container.style.backgroundColor = '#f4ecd8'; // Old paper color

    if (this.bgImage) {
      this.container.style.backgroundImage = `url('${this.bgImage}')`;
      this.container.style.backgroundSize = 'cover';
      this.container.style.backgroundPosition = 'center';
    }

    // Tile container
    this.tileContainer = document.createElement('div');
    this.tileContainer.style.position = 'absolute';
    this.tileContainer.style.top = '0';
    this.tileContainer.style.left = '0';
    this.tileContainer.style.width = '100%';
    this.tileContainer.style.height = '100%';
    this.tileContainer.style.pointerEvents = 'none';
    this.tileContainer.style.opacity = this.showTiles ? '1' : '0';
    this.container.appendChild(this.tileContainer);

    // GeoJSON Canvas Layer
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.pointerEvents = 'none';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Marker container
    this.markerContainer = document.createElement('div');
    this.markerContainer.style.position = 'absolute';
    this.markerContainer.style.top = '0';
    this.markerContainer.style.left = '0';
    this.markerContainer.style.width = '100%';
    this.markerContainer.style.height = '100%';
    this.markerContainer.style.pointerEvents = 'none';
    this.container.appendChild(this.markerContainer);

    // Resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.updateCanvasSize();
      this.render();
    });
    this.resizeObserver.observe(this.container);
    this.updateCanvasSize();

    // Zoom controls
    this.createZoomControls();

    // Attribution (Signature)
    this.createAttribution();
  }

  createAttribution() {
    const attr = document.createElement('div');
    attr.style.position = 'absolute';
    attr.style.bottom = '35px';
    attr.style.left = '45px';
    attr.style.zIndex = '1000';
    attr.style.pointerEvents = 'none';

    const text = document.createElement('div');
    text.style.display = 'flex';
    text.style.alignItems = 'center';
    text.style.gap = '8px';

    text.innerHTML = `
      <span style="font-size: 20px; font-family: 'gyst-variable', sans-serif; font-variation-settings: 'wght' 700; color: #3e2723; letter-spacing: 1px;">${this.attribution}</span>
    `;

    attr.appendChild(text);
    this.container.appendChild(attr);
  }

  updateCanvasSize() {
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  createZoomControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.position = 'absolute';
    controlsDiv.style.bottom = '35px';
    controlsDiv.style.left = '50%';
    controlsDiv.style.transform = 'translateX(-50%)';
    controlsDiv.style.zIndex = '1000';
    controlsDiv.style.display = 'flex';
    controlsDiv.style.alignItems = 'center';
    controlsDiv.style.gap = '30px';
    controlsDiv.style.padding = '8px 40px';
    controlsDiv.style.background = 'rgba(62, 39, 35, 0.03)';
    controlsDiv.style.borderBottom = '1px solid rgba(62, 39, 35, 0.1)';
    controlsDiv.style.pointerEvents = 'auto';

    const btnStyle = {
      cursor: 'pointer',
      fontSize: '24px',
      color: '#3e2723',
      userSelect: 'none',
      transition: 'opacity 0.3s, transform 0.3s',
      fontWeight: '300',
      opacity: '0.4',
      fontFamily: "'gyst-variable', sans-serif"
    };

    const zoomOutBtn = document.createElement('div');
    zoomOutBtn.innerHTML = '&minus;';
    Object.assign(zoomOutBtn.style, btnStyle);
    zoomOutBtn.onclick = () => this.zoomOut();

    const zoomInBtn = document.createElement('div');
    zoomInBtn.innerHTML = '&#43;';
    Object.assign(zoomInBtn.style, btnStyle);
    zoomInBtn.onclick = () => this.zoomIn();

    [zoomOutBtn, zoomInBtn].forEach(btn => {
      btn.onmouseenter = () => { btn.style.opacity = '1'; btn.style.transform = 'scale(1.1)'; };
      btn.onmouseleave = () => { btn.style.opacity = '0.4'; btn.style.transform = 'scale(1)'; };
    });

    controlsDiv.appendChild(zoomOutBtn);
    controlsDiv.appendChild(zoomInBtn);
    this.container.appendChild(controlsDiv);
  }

  setupEventListeners() {
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', (e) => {
      this.onMouseMove(e);
      this.handleHover(e);
    });
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

    // Touch events
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this));

    this.container.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  handleHover(e) {
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const feature = this.getFeatureAt(mouseX, mouseY);
    if (this.hoveredFeature !== feature) {
      this.hoveredFeature = feature;
      this.render();
      if (this.onFeatureHover) this.onFeatureHover(feature, e);
    }
  }

  getFeatureAt(mouseX, mouseY) {
    const scale = Math.pow(2, this.zoom) * this.tileSize;
    const centerPixel = this.latLngToPixel(this.center[0], this.center[1], this.zoom);
    const rect = this.container.getBoundingClientRect();

    const worldX = mouseX + centerPixel.x - rect.width / 2;
    const worldY = mouseY + centerPixel.y - rect.height / 2;

    const latLng = this.pixelToLatLng(worldX, worldY, this.zoom);
    const pt = [latLng.lng, latLng.lat];

    for (const layer of this.geoJSONLayers) {
      const features = layer.data.type === 'FeatureCollection' ? layer.data.features : [layer.data];
      for (const feature of features) {
        if (this.isPointInFeature(pt, feature)) return feature;
      }
    }
    return null;
  }

  isPointInFeature(pt, feature) {
    const geom = feature.geometry;
    if (!geom) return false;
    if (geom.type === 'Polygon') {
      return this.isPointInPoly(pt, geom.coordinates[0]);
    } else if (geom.type === 'MultiPolygon') {
      return geom.coordinates.some(poly => this.isPointInPoly(pt, poly[0]));
    }
    return false;
  }

  isPointInPoly(pt, poly) {
    let isIn = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
      if (intersect) isIn = !isIn;
    }
    return isIn;
  }

  // ========================================
  // Coordinate Transformations
  // ========================================

  latLngToWorld(lat, lng) {
    const x = (lng + 180) / 360;
    const clampedLat = Math.max(-85, Math.min(85, lat));
    const radClamped = clampedLat * Math.PI / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + radClamped / 2));
    const y = (1 - mercN / Math.PI) / 2;
    return { x, y };
  }

  worldToLatLng(x, y) {
    const lng = x * 360 - 180;
    const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y)));
    const lat = latRad * 180 / Math.PI;
    return { lat, lng };
  }

  latLngToPixel(lat, lng, zoom) {
    const world = this.latLngToWorld(lat, lng);
    const scale = Math.pow(2, zoom) * this.tileSize;
    return {
      x: world.x * scale,
      y: world.y * scale
    };
  }

  pixelToLatLng(x, y, zoom) {
    const scale = Math.pow(2, zoom) * this.tileSize;
    const world = {
      x: x / scale,
      y: y / scale
    };
    return this.worldToLatLng(world.x, world.y);
  }

  // ========================================
  // Event Handlers
  // ========================================

  onMouseDown(e) {
    this.dragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.container.style.cursor = 'grabbing';
  }

  onMouseMove(e) {
    if (!this.dragging) return;

    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;

    this.dragStart = { x: e.clientX, y: e.clientY };
    this.pan(dx, dy);
  }

  onMouseUp(e) {
    this.dragging = false;
    this.container.style.cursor = 'grab';
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomDelta = -e.deltaY / 500;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + zoomDelta));

    if (newZoom !== this.zoom) {
      this.updateZoom(newZoom, mouseX, mouseY);
    }
  }

  // Touch support
  touchStartDistance = null;

  onTouchStart(e) {
    if (e.touches.length === 1) {
      this.dragging = true;
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && this.dragging) {
      const dx = e.touches[0].clientX - this.dragStart.x;
      const dy = e.touches[0].clientY - this.dragStart.y;
      this.dragStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
      this.pan(dx, dy);
    } else if (e.touches.length === 2 && this.touchStartDistance) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const scale = distance / this.touchStartDistance;
      if (scale > 1.1) {
        this.zoomIn();
        this.touchStartDistance = distance;
      } else if (scale < 0.9) {
        this.zoomOut();
        this.touchStartDistance = distance;
      }
    }
  }

  onTouchEnd() {
    this.dragging = false;
    this.touchStartDistance = null;
  }

  // ========================================
  // Map Controls
  // ========================================

  pan(dx, dy) {
    const centerPixel = this.latLngToPixel(this.center[0], this.center[1], this.zoom);
    centerPixel.x -= dx;
    centerPixel.y -= dy;

    const newCenter = this.pixelToLatLng(centerPixel.x, centerPixel.y, this.zoom);
    this.center = [newCenter.lat, newCenter.lng];

    this.render();
  }

  zoomIn(mouseX, mouseY) {
    if (this.zoom >= this.maxZoom) return;
    this.updateZoom(this.zoom + 1, mouseX, mouseY);
  }

  zoomOut(mouseX, mouseY) {
    if (this.zoom <= this.minZoom) return;
    this.updateZoom(this.zoom - 1, mouseX, mouseY);
  }

  updateZoom(newZoom, mouseX, mouseY) {
    const rect = this.container.getBoundingClientRect();
    if (mouseX === undefined) mouseX = rect.width / 2;
    if (mouseY === undefined) mouseY = rect.height / 2;

    const mouseLatLng = this.pixelToLatLng(
      mouseX + this.latLngToPixel(this.center[0], this.center[1], this.zoom).x - rect.width / 2,
      mouseY + this.latLngToPixel(this.center[0], this.center[1], this.zoom).y - rect.height / 2,
      this.zoom
    );

    this.zoom = newZoom;

    const newMousePixel = this.latLngToPixel(mouseLatLng.lat, mouseLatLng.lng, this.zoom);
    const newCenterPixel = {
      x: newMousePixel.x - mouseX + rect.width / 2,
      y: newMousePixel.y - mouseY + rect.height / 2
    };

    const newCenter = this.pixelToLatLng(newCenterPixel.x, newCenterPixel.y, this.zoom);
    this.center = [newCenter.lat, newCenter.lng];

    this.render();
  }

  // ========================================
  // GeoJSON Rendering
  // ========================================

  addGeoJSON(data, options = {}) {
    this.geoJSONLayers.push({ data, options });
    this.render();
  }

  drawGeoJSON() {
    const rect = this.container.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);

    const centerPixel = this.latLngToPixel(this.center[0], this.center[1], this.zoom);
    const offsetX = rect.width / 2 - centerPixel.x;
    const offsetY = rect.height / 2 - centerPixel.y;

    this.geoJSONLayers.forEach(layer => {
      const { data, options } = layer;
      this.ctx.save();

      this.ctx.strokeStyle = options.color || '#4a3b2a';
      this.ctx.lineWidth = options.weight || 1.5;
      this.ctx.fillStyle = options.fillColor || 'rgba(210, 180, 140, 0.4)';
      this.ctx.lineJoin = 'round';
      this.ctx.lineCap = 'round';

      const features = data.type === 'FeatureCollection' ? data.features : [data];

      features.forEach(feature => {
        const geometry = feature.geometry;
        if (!geometry) return;

        const isHovered = this.hoveredFeature === feature;
        if (isHovered) {
          this.ctx.save();
          this.ctx.fillStyle = options.hoverColor || 'rgba(141, 110, 99, 0.6)';
          this.ctx.shadowBlur = 15;
          this.ctx.shadowColor = 'rgba(141, 110, 99, 0.8)';
        }

        if (geometry.type === 'Polygon') {
          this.drawPolygon(geometry.coordinates, offsetX, offsetY);
        } else if (geometry.type === 'MultiPolygon') {
          geometry.coordinates.forEach(poly => {
            this.drawPolygon(poly, offsetX, offsetY);
          });
        }

        if (isHovered) {
          this.ctx.restore();
        }
      });

      this.ctx.restore();
    });

    if (this.vintageStyle) {
      this.applyVintageOverlay();
    }
  }

  drawPolygon(coordinates, offsetX, offsetY) {
    this.ctx.beginPath();
    coordinates.forEach((ring, i) => {
      ring.forEach((coord, j) => {
        const pixel = this.latLngToPixel(coord[1], coord[0], this.zoom);
        const x = pixel.x + offsetX;
        const y = pixel.y + offsetY;

        if (j === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      });
      this.ctx.closePath();
    });
    this.ctx.fill();
    this.ctx.stroke();
  }

  applyVintageOverlay() {
    const rect = this.container.getBoundingClientRect();
    const gradient = this.ctx.createRadialGradient(
      rect.width / 2, rect.height / 2, 0,
      rect.width / 2, rect.height / 2, Math.max(rect.width, rect.height) * 0.7
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(60,40,20,0.2)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, rect.width, rect.height);
  }

  // ========================================
  // Rendering
  // ========================================

  render() {
    this.clearTiles();

    const rect = this.container.getBoundingClientRect();
    const centerPixel = this.latLngToPixel(this.center[0], this.center[1], this.zoom);

    if (this.showTiles) {
      const floorZoom = Math.floor(this.zoom);
      const scaleFactor = Math.pow(2, this.zoom - floorZoom);
      const effectiveTileSize = this.tileSize * scaleFactor;

      const topLeftPixel = {
        x: centerPixel.x - rect.width / 2,
        y: centerPixel.y - rect.height / 2
      };

      const minTileX = Math.floor(topLeftPixel.x / effectiveTileSize);
      const minTileY = Math.floor(topLeftPixel.y / effectiveTileSize);
      const maxTileX = Math.ceil((topLeftPixel.x + rect.width) / effectiveTileSize);
      const maxTileY = Math.ceil((topLeftPixel.y + rect.height) / effectiveTileSize);

      for (let x = minTileX; x <= maxTileX; x++) {
        for (let y = minTileY; y <= maxTileY; y++) {
          this.loadTile(x, y, floorZoom, centerPixel, rect, effectiveTileSize);
        }
      }
    }

    this.drawGeoJSON();
    this.updateMarkers();
  }

  loadTile(x, y, z, centerPixel, rect, displaySize) {
    const maxTile = Math.pow(2, z);
    const wrappedX = ((x % maxTile) + maxTile) % maxTile;
    if (y < 0 || y >= maxTile) return;

    const tileKey = `${z}-${wrappedX}-${y}`;
    if (this.tiles.has(tileKey)) {
      const img = this.tiles.get(tileKey);
      this.positionTile(img, x, y, centerPixel, rect, displaySize);
      return;
    }

    const img = document.createElement('img');
    img.style.position = 'absolute';
    img.style.imageRendering = 'crisp-edges';

    this.positionTile(img, x, y, centerPixel, rect, displaySize);

    const url = this.tileUrl
      .replace('{x}', wrappedX)
      .replace('{y}', y)
      .replace('{z}', z);

    img.src = url;
    img.onerror = () => { img.style.display = 'none'; };

    this.tileContainer.appendChild(img);
    this.tiles.set(tileKey, img);
  }

  positionTile(img, x, y, centerPixel, rect, displaySize) {
    const tilePixelX = x * displaySize;
    const tilePixelY = y * displaySize;
    const screenX = tilePixelX - centerPixel.x + rect.width / 2;
    const screenY = tilePixelY - centerPixel.y + rect.height / 2;

    img.style.width = `${displaySize}px`;
    img.style.height = `${displaySize}px`;
    img.style.left = `${screenX}px`;
    img.style.top = `${screenY}px`;
    img.style.display = 'block';
  }

  clearTiles() {
    this.tiles.forEach(tile => tile.style.display = 'none');
  }

  // ========================================
  // Markers
  // ========================================

  addMarker(lat, lng, options = {}) {
    const marker = document.createElement('div');
    marker.style.position = 'absolute';
    marker.style.width = options.width || '25px';
    marker.style.height = options.height || '41px';
    marker.style.marginLeft = '-12.5px';
    marker.style.marginTop = '-41px';
    marker.style.pointerEvents = 'auto';
    marker.style.cursor = 'pointer';
    marker.style.zIndex = '1000';

    if (!options.html) {
      marker.innerHTML = `
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
                fill="${options.color || '#5d4037'}" stroke="#fff" stroke-width="2"/>
          <circle cx="12.5" cy="12.5" r="4" fill="#fff"/>
        </svg>
      `;
    } else {
      marker.innerHTML = options.html;
    }

    if (options.onClick) {
      marker.addEventListener('click', options.onClick);
    }

    this.markerContainer.appendChild(marker);

    const markerObj = {
      element: marker,
      lat: lat,
      lng: lng,
      options: options
    };

    this.markers.push(markerObj);
    this.updateMarker(markerObj);
    return markerObj;
  }

  updateMarkers() {
    this.markers.forEach(marker => this.updateMarker(marker));
  }

  updateMarker(marker) {
    const pixel = this.latLngToPixel(marker.lat, marker.lng, this.zoom);
    const centerPixel = this.latLngToPixel(this.center[0], this.center[1], this.zoom);
    const rect = this.container.getBoundingClientRect();

    const x = pixel.x - centerPixel.x + rect.width / 2;
    const y = pixel.y - centerPixel.y + rect.height / 2;

    marker.element.style.left = `${x}px`;
    marker.element.style.top = `${y}px`;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MyMap;
}
