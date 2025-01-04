export const API_CONFIG = {
    // BASE_URL: 'http://localhost:8000/quotes',
    BASE_URL: 'https://quoteverse-backend-wpus5.ondigitalocean.app/quotes',
    MAX_QUOTE_COUNT: 1000,
    MAX_SIMILAR_QUOTE_COUNT: 50,
    MAX_SIMILAR_QUOTE_DISTANCE: 0.65,
    REQUEST_INTERVAL: 50,
    REQUEST_CHECK_INTERVAL: 1000,
    RANDOMIZE_QUOTES: true,
    AUTO_SEND: false
};

export const INSTRUCTIONS = {
    EMPTY_INPUT: 'Type in the search bar to look for quotes. Or hover over the points to explore new quotes.',
    NO_RESULTS: 'No results found.'
};

export const CANVAS_CONFIG = {
    DEFAULT_SCALE: 200,
    MIN_SCALE: 50,
    MAX_SCALE: 2000,
    ZOOM_FACTOR: 1.1,
    ZOOM_POINTS: false
}; 