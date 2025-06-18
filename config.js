export const API_CONFIG = {
    // BASE_URL: 'http://localhost:8000/quotes',
    // BASE_URL: 'https://quoteverse-backend-wpus5.ondigitalocean.app/quotes',
    BASE_URL: 'https://quoteverse-backend.onrender.com/quotes',
    MAX_QUOTE_COUNT: 1000,
    MAX_SIMILAR_QUOTE_COUNT: 50,
    MAX_SIMILAR_QUOTE_DISTANCE: 0.55,
    REQUEST_INTERVAL: 50,
    REQUEST_CHECK_INTERVAL: 1000,
    RANDOMIZE_QUOTES: true,
    AUTO_SEND: true
};

export const MESSAGES = {
    EMPTY_INPUT: 'Type in the search bar to look for quotes. Press Enter to submit.',
    NO_RESULTS: 'No results found.',
    ERROR: 'An error occurred while fetching quotes. Please try again later.'
};

export const SEARCH_CONFIG = {
    placeholders: {
        quote: 'Search for a quote...',
        author: 'Search by author name...',
        book: 'Search by book title...'
    },
    labels: {
        quote: 'Search by quote',
        author: 'Search by author',
        book: 'Search by book'
    }
};

export const CANVAS_CONFIG = {
    DEFAULT_SCALE: 200,
    MIN_SCALE: 50,
    MAX_SCALE: 2000,
    ZOOM_FACTOR: 1.1,
    ZOOM_POINTS: false
}; 