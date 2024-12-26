import canvas from './canvas.js';
import { API_CONFIG } from './config.js';
import { apiService } from './api.js';
import { appState } from './state.js';
import { sigmoid, interpolateColor, createPointElement } from './utils.js';

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
        
        this.input.addEventListener('keydown', () => {
            setTimeout(() => this.handleUserInput(), 10);
        });

        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                document.activeElement === this.input ? this.input.blur() : this.input.focus();
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
        appState.getQuotes().forEach(quote => this.plotQuote(quote));
    }

    plotQuote(quote, color, scale = 1) {
        canvas.plotPoint(quote.coords[0], quote.coords[1], color, scale, quote);
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
        if (!similarQuotes?.length) return;
        
        const sortedQuotes = [...similarQuotes].sort((a, b) => a.similarity - b.similarity);
        sortedQuotes.forEach(quote => this.createAndAppendQuoteElement(quote));
    }

    createAndAppendQuoteElement(quote) {
        const quoteElement = document.createElement('div');
        quoteElement.className = 'similar-quote';
        
        const elements = [
            { className: 'similar-quote-text', content: quote.text },
            { className: 'similar-quote-author', content: quote.author || 'Unknown' },
            { className: 'similar-quote-similarity', content: `Distance: ${(quote.distance * 100).toFixed(1)}%` }
        ];

        elements.forEach(({ className, content }) => {
            const element = document.createElement('div');
            element.className = className;
            element.textContent = content;
            quoteElement.appendChild(element);
        });
        
        this.similarQuotesContainer.appendChild(quoteElement);
    }

    async processQuoteSubmission(inputValue) {
        try {
            const similarQuotes = await this.getSimilarQuotesWithCache(inputValue);
            this.updatePointVisualization(similarQuotes);
            this.displaySimilarQuotes(similarQuotes);
        } catch (error) {
            console.error('Error submitting quote:', error);
        }
    }

    async getSimilarQuotesWithCache(inputValue) {
        const cachedQuotes = appState.getCachedSimilarQuotes(inputValue);
        if (cachedQuotes) return cachedQuotes;

        const similarQuotes = await apiService.getSimilarQuotes(inputValue);
        appState.setCachedSimilarQuotes(inputValue, similarQuotes);
        return similarQuotes;
    }

    updatePointVisualization(similarQuotes) {
        this.resetPointStyles();
        
        if (!similarQuotes?.length) return;
        
        const maxPointScale = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue('--max-point-scale')
        );
        
        similarQuotes.forEach(quote => {
            const existingQuote = appState.getQuotes().find(q => q.id === quote.id);
            if (!existingQuote) return;

            const brightness = 1 - quote.distance;
            const smoothFactor = sigmoid(brightness);
            
            const color = interpolateColor(
                getComputedStyle(document.documentElement).getPropertyValue('--color-point').trim(),
                getComputedStyle(document.documentElement).getPropertyValue('--color-point-bright').trim(),
                smoothFactor
            );
            
            const scale = 1 + (maxPointScale - 1) * smoothFactor;
            this.updatePointElement(quote.id, color, scale);
        });
    }

    resetPointStyles() {
        const defaultColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-point').trim();
            
        document.querySelectorAll('.plot-point').forEach(point => {
            point.style.setProperty('--individual-point-color', defaultColor);
            point.style.setProperty('--individual-point-scale', '1');
        });
    }

    updatePointElement(quoteId, color, scale) {
        const pointElement = document.querySelector(`.plot-point[data-quote-id="${quoteId}"]`);
        if (pointElement) {
            pointElement.style.setProperty('--individual-point-color', color);
            pointElement.style.setProperty('--individual-point-scale', scale);
        }
    }

    startInputCheckInterval() {
        setInterval(() => {
            const currentInput = this.input.value.trim();
            if (currentInput && currentInput !== this.lastProcessedInput) {
                this.lastProcessedInput = currentInput;
                this.processQuoteSubmission(currentInput);
            }
        }, API_CONFIG.REQUEST_CHECK_INTERVAL);
    }

    async handleUserInput() {
        const inputValue = this.input.value.trim();
        
        if (!inputValue) {
            this.refreshCanvas();
            this.displaySimilarQuotes([]);
            return;
        }
        
        if (this.canSubmitRequest()) {
            await this.processQuoteSubmission(inputValue);
            this.lastProcessedInput = inputValue;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuoteVisualizer();
}); 