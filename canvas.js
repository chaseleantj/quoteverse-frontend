import { CANVAS_CONFIG } from './config.js';

class Canvas {
    constructor() {
        this.initializeContainer();
        this.initializeStyles();
        this.setupEventListeners();
        this.resize();
    }

    initializeContainer() {
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        });
        document.body.insertBefore(this.container, document.body.firstChild);
    }

    initializeStyles() {
        const rootStyles = getComputedStyle(document.documentElement);
        this.styles = {
            highlightColor: rootStyles.getPropertyValue('--button-hover-bg').trim(),
            defaultPointColor: rootStyles.getPropertyValue('--color-point').trim(),
            activePointColor: rootStyles.getPropertyValue('--color-point-active').trim()
        };
        this.scale = CANVAS_CONFIG.SCALE;
        this.pointRadius = CANVAS_CONFIG.POINT_RADIUS;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    worldToPixel(x, y) {
        return {
            x: this.centerX + x * this.scale,
            y: this.centerY - y * this.scale
        };
    }

    clear() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
    }

    createPointElement(color) {
        const point = document.createElement('div');
        point.className = 'plot-point';
        Object.assign(point.style, {
            position: 'absolute',
            backgroundColor: color || this.styles.defaultPointColor,
            pointerEvents: 'auto'
        });
        return point;
    }

    createTooltipElement(quote) {
        const tooltip = document.createElement('div');
        tooltip.className = 'point-tooltip';
        tooltip.textContent = quote;
        return tooltip;
    }

    plotPoint(x, y, color, quote) {
        const pixel = this.worldToPixel(x, y);
        const wrapper = document.createElement('div');
        Object.assign(wrapper.style, {
            position: 'absolute',
            left: `${pixel.x}px`,
            top: `${pixel.y}px`,
            pointerEvents: 'none'
        });

        const point = this.createPointElement(color);
        const tooltip = this.createTooltipElement(quote);

        wrapper.appendChild(point);
        wrapper.appendChild(tooltip);

        point.addEventListener('click', () => {
            this.handlePointClick(point, tooltip);
        });

        this.container.appendChild(wrapper);
    }

    handlePointClick(point, tooltip) {
        const tooltipActiveClass = 'tooltip-active';
        const pointActiveClass = 'point-active';

        point.classList.add(pointActiveClass);
        tooltip.classList.add(tooltipActiveClass);

        if (this.activeTimeout) {
            clearTimeout(this.activeTimeout);
        }

        this.activeTimeout = setTimeout(() => {
            point.classList.remove(pointActiveClass);
            tooltip.classList.remove(tooltipActiveClass);
            this.activeTimeout = null;
        }, 5000);
    }
}

export const canvas = new Canvas();
export default canvas; 