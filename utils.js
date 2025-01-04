export function sigmoid(x) {
    return 1 / (1 + Math.exp(-10 * (x - 0.6)));
}

export function interpolateColor(color1, color2, factor) {
    const rgbaPattern = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/;
    
    const parseRGBA = (color) => {
        const match = color.match(rgbaPattern);
        if (!match) return null;
        
        return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: match[4] ? parseFloat(match[4]) : 1
        };
    };

    const c1 = parseRGBA(color1);
    const c2 = parseRGBA(color2);

    if (!c1 || !c2) return color1;

    return `rgba(${
        Math.round(c1.r + (c2.r - c1.r) * factor)
    }, ${
        Math.round(c1.g + (c2.g - c1.g) * factor)
    }, ${
        Math.round(c1.b + (c2.b - c1.b) * factor)
    }, ${
        c1.a + (c2.a - c1.a) * factor
    })`;
}

export function createPointElement(color, scale, quoteId) {
    const point = document.createElement('div');
    point.className = 'plot-point';
    point.dataset.quoteId = quoteId;
    if (color) {
        point.style.backgroundColor = color;
    }
    if (scale) {
        point.style.transform = `scale(${scale})`;
    }
    return point;
} 