import canvas from './canvas.js';
import { API_CONFIG, COLORS } from './config.js';
import { apiService } from './api.js';
import { appState } from './state.js';

class QuoteVisualizer {
    constructor() {
        this.setupDOMElements();
        this.setupEventListeners();
        this.initialize();
    }

    setupDOMElements() {
        this.input = document.querySelector('input');
        this.button = document.querySelector('button');
    }

    setupEventListeners() {
        appState.subscribe(() => this.refreshCanvas());
        
        this.input.addEventListener('keydown', async () => {
            setTimeout(async () => {
                await this.handleUserInput();
            }, 10);
        });

        this.button.addEventListener('click', async () => {
            await this.handleUserInput();
        });
    }

    async initialize() {
        try {
            const quotes = await apiService.fetchExistingQuotes();
            appState.setQuotes(quotes);
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }

    refreshCanvas() {
        canvas.clear();
        this.plotAllExistingQuotes();
    }

    plotAllExistingQuotes() {
        appState.getQuotes().forEach(quote => {
            this.plotQuote(quote);
        });
    }

    plotQuote(quote, color) {
        canvas.plotPoint(
            quote.pca_coords[0],
            quote.pca_coords[1],
            color,
            quote.quote || 'Loading...'
        );
    }

    canSubmitRequest() {
        const currentTime = Date.now();
        const lastRequestTime = appState.getLastRequestTime();
        
        if (currentTime - lastRequestTime >= API_CONFIG.REQUEST_INTERVAL) {
            appState.updateLastRequestTime();
            return true;
        }
        return false;
    }

    animateButton() {
        this.button.style.transform = 'scale(0.98)';
        setTimeout(() => this.button.style.transform = '', 100);
    }

    async processQuoteSubmission(inputValue) {
        try {
            const cachedCoords = appState.getCachedCoordinates(inputValue);
            const coordinates = cachedCoords || await apiService.getQuoteCoordinates(inputValue);
            
            if (!cachedCoords) {
                appState.setCachedCoordinates(inputValue, coordinates);
            }

            this.refreshCanvas();
            this.plotQuote({ quote: inputValue, pca_coords: coordinates }, COLORS.HIGHLIGHT);
        } catch (error) {
            console.error('Error submitting quote:', error);
        }
    }

    async handleUserInput() {
        const inputValue = this.input.value.trim();
        
        if (!inputValue) {
            this.refreshCanvas();
            return;
        }
        
        if (this.canSubmitRequest()) {
            this.animateButton();
            await this.processQuoteSubmission(inputValue);
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new QuoteVisualizer();
}); 