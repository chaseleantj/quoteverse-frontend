import { CANVAS_CONFIG } from './config.js';

class Canvas {
    constructor() {
        this.initializeContainer();
        this.initializeStyles();
        this.setupEventListeners();
        this.resize();
        
        // Properties for dragging
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = CANVAS_CONFIG.DEFAULT_SCALE;
        this.minScale = CANVAS_CONFIG.MIN_SCALE;
        this.maxScale = CANVAS_CONFIG.MAX_SCALE;
        
        // For pinch zoom
        this.touchDistance = 0;
    }

    initializeContainer() {
        this.container = document.createElement('div');
        this.container.className = 'canvas-container';
        document.body.insertBefore(this.container, document.body.firstChild);
    }

    initializeStyles() {
        const rootStyles = getComputedStyle(document.documentElement);
        this.styles = {
            highlightColor: rootStyles.getPropertyValue('--button-hover-bg').trim(),
            defaultPointColor: rootStyles.getPropertyValue('--color-point').trim(),
            activePointColor: rootStyles.getPropertyValue('--color-point-bright').trim()
        };
        this.scale = CANVAS_CONFIG.SCALE;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        
        // Event listeners for dragging
        this.container.addEventListener('mousedown', (e) => this.startDrag(e));
        this.container.addEventListener('mousemove', (e) => this.drag(e));
        this.container.addEventListener('mouseup', () => this.endDrag());
        this.container.addEventListener('mouseleave', () => this.endDrag());
        
        // Mouse wheel zoom
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.handleZoom(e);
        }, { passive: false });
        
        // Touch events for pinch zoom
        this.container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                this.touchDistance = this.getTouchDistance(e.touches);
            }
        });
        
        this.container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                this.handlePinchZoom(e);
            }
        });
    }

    startDrag(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
    }

    drag(e) {
        if (this.isDragging) {
            this.container.classList.add('dragging');
            const dx = e.clientX - this.startX;
            const dy = e.clientY - this.startY;
            
            this.offsetX += dx;
            this.offsetY += dy;
            
            this.startX = e.clientX;
            this.startY = e.clientY;

            // Update all point positions instead of triggering redraw
            this.updateAllPointPositions();
        }
    }

    endDrag() {
        this.isDragging = false;
        this.container.classList.remove('dragging');
    }

    resize() {
        const sidebarWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'));
        this.width = window.innerWidth - sidebarWidth;
        this.height = window.innerHeight;
        this.centerX = sidebarWidth + (this.width / 2);
        this.centerY = this.height / 2;
    }

    worldToPixel(x, y) {
        return {
            x: this.centerX + x * this.scale + this.offsetX,
            y: this.centerY - y * this.scale + this.offsetY
        };
    }

    clear() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    createPointElement(color, scale, quote) {
        const point = document.createElement('div');
        point.className = 'plot-point';
        point.dataset.quoteId = quote.id;
        if (color) {
            point.style.setProperty('--individual-point-color', color);
        }
        if (scale) {
            point.style.setProperty('--individual-point-scale', scale);
        }
        return point;
    }

    createTooltipElement(quote) {
        const tooltip = document.createElement('div');
        tooltip.className = 'point-tooltip';
        
        // Create text content with quote and author
        const quoteText = document.createTextNode(`${quote.text} - `);
        const authorSpan = document.createElement('em');
        authorSpan.textContent = quote.author || 'Unknown';
        
        tooltip.appendChild(quoteText);
        tooltip.appendChild(authorSpan);
        
        return tooltip;
    }

    plotPoint(x, y, color, scale, quote) {
        const pixel = this.worldToPixel(x, y);
        const wrapper = document.createElement('div');
        wrapper.className = 'point-wrapper';
        wrapper.style.left = `${pixel.x}px`;
        wrapper.style.top = `${pixel.y}px`;
        
        wrapper.dataset.worldX = x;
        wrapper.dataset.worldY = y;

        const point = this.createPointElement(color, scale, quote);
        const tooltip = this.createTooltipElement(quote);
        
        wrapper.appendChild(point);
        wrapper.appendChild(tooltip);
        this.container.appendChild(wrapper);
    }

    // Update all point positions based on current scale and offset
    updateAllPointPositions() {
        const points = this.container.querySelectorAll('.point-wrapper');
        points.forEach(wrapper => {
            // Get the original world coordinates from data attributes
            const worldX = parseFloat(wrapper.dataset.worldX);
            const worldY = parseFloat(wrapper.dataset.worldY);
            
            // Convert to new pixel coordinates
            const pixel = this.worldToPixel(worldX, worldY);
            wrapper.style.left = `${pixel.x}px`;
            wrapper.style.top = `${pixel.y}px`;
        });
    }

    handleZoom(e) {
        const zoomFactor = CANVAS_CONFIG.ZOOM_FACTOR;
        let direction = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;
        
        // Get mouse position relative to canvas
        const rect = this.container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        this.zoomTowardPoint(mouseX, mouseY, direction);
    }

    handlePinchZoom(e) {
        const newDistance = this.getTouchDistance(e.touches);
        const zoomFactor = newDistance / this.touchDistance;
        
        // Get center point of the two touches
        const rect = this.container.getBoundingClientRect();
        const centerX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
        const centerY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
        
        this.zoomTowardPoint(centerX, centerY, zoomFactor);
        this.touchDistance = newDistance;
    }

    getTouchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    zoomTowardPoint(targetX, targetY, zoomFactor) {
        const oldScale = this.scale;
        const newScale = Math.min(Math.max(this.scale * zoomFactor, this.minScale), this.maxScale);
        const actualZoomFactor = newScale / oldScale;

        if (newScale === this.scale) return;

        // Calculate the new offset to keep the target point stationary
        const newOffsetX = actualZoomFactor * this.offsetX + (1 - actualZoomFactor) * (targetX - this.centerX);
        const newOffsetY = actualZoomFactor * this.offsetY + (1 - actualZoomFactor) * (targetY - this.centerY);
        
        // Update the scale and offsets
        this.scale = newScale;
        this.offsetX = newOffsetX;
        this.offsetY = newOffsetY;

        // Set zoom scale CSS variable
        if (CANVAS_CONFIG.ZOOM_POINTS) {
            const zoomScale = Math.max(0.5, Math.min(2, this.scale / CANVAS_CONFIG.DEFAULT_SCALE));
            this.container.style.setProperty('--zoom-scale', zoomScale);
        }

        // Update all point positions
        this.updateAllPointPositions();
    }
}

export const canvas = new Canvas();
export default canvas; 