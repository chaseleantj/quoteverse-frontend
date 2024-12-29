export const API_CONFIG = {
    // BASE_URL: 'http://localhost:8000/quotes',
    BASE_URL: 'https://wordverse-er3iz.ondigitalocean.app/quotes',
    MAX_QUOTE_COUNT: 1000,
    MAX_SIMILAR_QUOTE_COUNT: 20,
    MAX_SIMILAR_QUOTE_DISTANCE: 0.7,
    REQUEST_INTERVAL: 50,
    REQUEST_CHECK_INTERVAL: 1000,
    RANDOMIZE_QUOTES: true,
};

export const INSTRUCTIONS = {
    EMPTY_INPUT: 'Type in the search bar to find similar quotes. Or hover on the points to see the quotes.',
    NO_RESULTS: 'No results found.'
};

export const CANVAS_CONFIG = {
    DEFAULT_SCALE: 200,
    MIN_SCALE: 50,
    MAX_SCALE: 2000,
    ZOOM_FACTOR: 1.1,
}; 