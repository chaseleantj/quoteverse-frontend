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
    }

    setupEventListeners() {
        appState.subscribe(() => this.refreshCanvas());
        
        this.input.addEventListener('keydown', async () => {
            setTimeout(async () => {
                await this.handleUserInput();
            }, 10);
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
            quote.coords[0],
            quote.coords[1],
            color,
            quote
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

    async processQuoteSubmission(inputValue) {
        try {
            const cachedSimilarQuotes = appState.getCachedSimilarQuotes(inputValue);
            const similarQuotes = cachedSimilarQuotes || await apiService.getSimilarQuotes(inputValue);
            
            if (!cachedSimilarQuotes) {
                appState.setCachedSimilarQuotes(inputValue, similarQuotes);
            }
            console.log(inputValue, similarQuotes); // remove later
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
            await this.processQuoteSubmission(inputValue);
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new QuoteVisualizer();
}); 