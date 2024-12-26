import canvas from './canvas.js';
import { API_CONFIG } from './config.js';
import { apiService } from './api.js';
import { appState } from './state.js';

class QuoteVisualizer {
    constructor() {
        this.setupDOMElements();
        this.setupEventListeners();
        this.initialize();
        this.requestTimeout = null;
        this.lastProcessedInput = '';
        this.startInputCheckInterval();
    }

    setupDOMElements() {
        this.input = document.querySelector('input');
        this.similarQuotesContainer = document.querySelector('.similar-quotes-container');
    }

    setupEventListeners() {
        appState.subscribe(() => this.refreshCanvas());
        
        this.input.addEventListener('keydown', async () => {
            setTimeout(async () => {
                await this.handleUserInput();
            }, 10);
        });

        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                if (document.activeElement === this.input) {
                    this.input.blur();
                } else {
                    this.input.focus();
                }
            }
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

    displaySimilarQuotes(similarQuotes) {
        this.similarQuotesContainer.innerHTML = '';
        
        if (!similarQuotes || !similarQuotes.length) return;
        
        // Sort quotes by similarity (cosine distance, lowest first)
        const sortedQuotes = [...similarQuotes].sort((a, b) => a.similarity - b.similarity);
        
        sortedQuotes.forEach(quote => {
            const quoteElement = document.createElement('div');
            quoteElement.className = 'similar-quote';
            
            const textElement = document.createElement('div');
            textElement.className = 'similar-quote-text';
            textElement.textContent = quote.text;
            
            const authorElement = document.createElement('div');
            authorElement.className = 'similar-quote-author';
            authorElement.textContent = quote.author || 'Unknown';
            
            const similarityElement = document.createElement('div');
            similarityElement.className = 'similar-quote-similarity';
            similarityElement.textContent = `Distance: ${(quote.distance * 100).toFixed(1)}%`;
            
            quoteElement.appendChild(textElement);
            quoteElement.appendChild(authorElement);
            quoteElement.appendChild(similarityElement);
            
            this.similarQuotesContainer.appendChild(quoteElement);
        });
    }

    async processQuoteSubmission(inputValue) {
        try {
            const cachedSimilarQuotes = appState.getCachedSimilarQuotes(inputValue);
            const similarQuotes = cachedSimilarQuotes || await apiService.getSimilarQuotes(inputValue);
            
            if (!cachedSimilarQuotes) {
                appState.setCachedSimilarQuotes(inputValue, similarQuotes);
            }
            
            this.displaySimilarQuotes(similarQuotes);
        } catch (error) {
            console.error('Error submitting quote:', error);
        }
    }

    startInputCheckInterval() {
        setInterval(() => {
            const currentInput = this.input.value.trim();
            const isValid = currentInput !== '';
            const isChanged = currentInput !== this.lastProcessedInput;
            if (isValid && isChanged) {
                this.lastProcessedInput = currentInput;
                this.processQuoteSubmission(currentInput);
            }
        }, API_CONFIG.REQUEST_CHECK_INTERVAL);
    }

    async handleUserInput() {
        const inputValue = this.input.value.trim();
        
        if (!inputValue) {
            this.refreshCanvas();
            this.displaySimilarQuotes([]); // Clear similar quotes when input is empty
            return;
        }
        
        // Only process immediately if we can submit a request
        if (this.canSubmitRequest()) {
            await this.processQuoteSubmission(inputValue);
            this.lastProcessedInput = inputValue; // Update last processed input
        }
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new QuoteVisualizer();
}); 