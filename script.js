import canvas from './canvas.js';
import { API_CONFIG, INSTRUCTIONS } from './config.js';
import { apiService } from './api.js';
import { appState } from './state.js';
import { sigmoid, interpolateColor, createPointElement } from './utils.js';


class QuoteVisualizer {
    constructor() {
        this.searchMode = 'quote'; // Default search mode
        this.setupDOMElements();
        this.setupEventListeners();
        this.initialize();
        this.requestTimeout = null;
        this.lastProcessedInput = '';
        this.startInputCheckInterval();
        this.searchModes = ['quote', 'author', 'book'];
        this.currentModeIndex = 0;  // quote is default (index 0)
    }

    setupDOMElements() {
        this.input = document.querySelector('input');
        this.similarQuotesContainer = document.querySelector('.similar-quotes-container');
        
        // Show initial instructions
        const instructions = document.createElement('div');
        instructions.className = 'quote-instructions';
        instructions.textContent = INSTRUCTIONS.EMPTY_INPUT;
        this.similarQuotesContainer.appendChild(instructions);
    }

    setupEventListeners() {
        appState.subscribe(() => this.refreshCanvas());
        
        // Only add keydown listener for Enter key
        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.handleUserInput();
            }
        });

        // Add input event listener to handle clearing
        this.input.addEventListener('input', () => {
            if (!this.input.value.trim()) {
                this.refreshCanvas();
                this.displaySimilarQuotes([]);
                this.lastProcessedInput = '';
            }
        });

        this.setupKeyboardShortcuts();
        this.setupSearchModeButtons();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + / to focus input
            if ((event.ctrlKey || event.metaKey) && event.key === '/') {
                event.preventDefault();
                document.activeElement === this.input ? this.input.blur() : this.input.focus();
            }
            
            // Tab to cycle through search modes
            if (event.key === 'Tab') {
                event.preventDefault();
                this.currentModeIndex = (this.currentModeIndex + 1) % this.searchModes.length;
                this.searchMode = this.searchModes[this.currentModeIndex];
                
                // Update UI to show active mode
                const buttons = document.querySelectorAll('.icon-button');
                buttons.forEach(btn => btn.classList.remove('active'));
                buttons[this.currentModeIndex].classList.add('active');
                
                // Update placeholder and process current input if exists
                this.updateSearchModeUI();
                if (this.input.value.trim()) {
                    this.processQuoteSubmission(this.input.value.trim());
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
        
        // If input is empty, show initial instructions
        if (!this.input.value.trim()) {
            const instructions = document.createElement('div');
            instructions.className = 'quote-instructions';
            instructions.textContent = INSTRUCTIONS.EMPTY_INPUT;
            this.similarQuotesContainer.appendChild(instructions);
            return;
        }
        
        // If no similar quotes found but input exists
        if (!similarQuotes?.length) {
            const noResults = document.createElement('div');
            noResults.className = 'quote-instructions';
            noResults.textContent = INSTRUCTIONS.NO_RESULTS;
            this.similarQuotesContainer.appendChild(noResults);
            return;
        }
        
        const sortedQuotes = [...similarQuotes].sort((a, b) => a.similarity - b.similarity);
        sortedQuotes.forEach(quote => this.createAndAppendQuoteElement(quote));
    }

    createAndAppendQuoteElement(quote) {
        const quoteElement = document.createElement('div');
        quoteElement.className = 'similar-quote';
        quoteElement.dataset.quoteId = quote.id;
        
        const elements = [
            { className: 'similar-quote-text', content: quote.text },
            { className: 'similar-quote-author', content: quote.author || 'Unknown' },
            // { className: 'similar-quote-similarity', content: `Distance: ${(quote.distance * 100).toFixed(1)}%` }
        ];

        if (quote.book) {
            elements.push({ className: 'similar-quote-book', content: quote.book });
        }

        elements.forEach(({ className, content }) => {
            const element = document.createElement('div');
            element.className = className;
            element.textContent = content;
            quoteElement.appendChild(element);
        });

        // Add copy icon
        const copyIcon = document.createElement('i');
        copyIcon.className = 'fa-regular fa-copy copy-icon';
        quoteElement.appendChild(copyIcon);

        // Copy functionality
        const copyQuote = async () => {
            const textToCopy = quote.text + ' - ' + (quote.author ? quote.author : 'Unknown');
            await navigator.clipboard.writeText(textToCopy);
            
            // Change icon to tick
            copyIcon.classList.remove('fa-regular', 'fa-copy');
            copyIcon.classList.add('fa-solid', 'fa-check');
            
            // Change back to copy icon after 500ms
            setTimeout(() => {
                copyIcon.classList.remove('fa-solid', 'fa-check');
                copyIcon.classList.add('fa-regular', 'fa-copy');
            }, 500);
        };

        // Add click handlers
        quoteElement.addEventListener('click', copyQuote);
        copyIcon.addEventListener('click', (e) => {
            e.stopPropagation();  // Prevent double copying
            copyQuote();
        });
        
        // Add hover event listeners (existing code)
        quoteElement.addEventListener('mouseenter', () => {
            const pointElement = document.querySelector(`.plot-point[data-quote-id="${quote.id}"]`);
            if (pointElement) {
                pointElement.classList.add('point-active');
            }
        });

        quoteElement.addEventListener('mouseleave', () => {
            const pointElement = document.querySelector(`.plot-point[data-quote-id="${quote.id}"]`);
            if (pointElement) {
                pointElement.classList.remove('point-active');
            }
        });
        
        this.similarQuotesContainer.appendChild(quoteElement);
    }

    async processQuoteSubmission(inputValue) {
        try {
            const searchResults = await apiService.searchQuotes(inputValue, this.searchMode);
            
            // Update state with new quotes while maintaining max quote count
            appState.updateQuotesWithSimilar(
                searchResults, 
                API_CONFIG.MAX_QUOTE_COUNT
            );
            
            this.updatePointVisualization(searchResults);
            this.displaySimilarQuotes(searchResults);
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
        
        // Create a map of similar quotes for O(1) lookup
        const similarQuotesMap = new Map(
            similarQuotes.map(q => [q.id, q])
        );
        
        // Update all points, including newly added ones
        appState.getQuotes().forEach(quote => {
            const similarQuote = similarQuotesMap.get(quote.id);
            if (!similarQuote) return;

            // For author/book search, use maximum intensity
            // For quote search, use distance-based intensity
            const brightness = this.searchMode === 'quote' 
                ? 1 - (similarQuote.distance || 0)
                : 1;
            
            const smoothFactor = sigmoid(brightness);
            
            const color = interpolateColor(
                getComputedStyle(document.documentElement).getPropertyValue('--color-point').trim(),
                getComputedStyle(document.documentElement).getPropertyValue('--color-point-bright').trim(),
                smoothFactor
            );
            
            const scale = this.searchMode === 'quote' ? 1 + (maxPointScale - 1) * smoothFactor : 1;
            
            const pointElement = document.querySelector(`.plot-point[data-quote-id="${quote.id}"]`);
            if (pointElement) {
                pointElement.classList.add('point-similar');
                pointElement.style.setProperty('--individual-point-color', color);
                pointElement.style.setProperty('--individual-point-scale', scale);
            }
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

    startInputCheckInterval() {
        if (API_CONFIG.AUTO_SEND) {
            setInterval(() => {
                const currentInput = this.input.value.trim();
                if (currentInput && currentInput !== this.lastProcessedInput) {
                    this.lastProcessedInput = currentInput;
                    this.processQuoteSubmission(currentInput);
                }
            }, API_CONFIG.REQUEST_CHECK_INTERVAL);
        }
    }

    async handleUserInput() {
        const inputValue = this.input.value.trim();
        
        if (!inputValue) {
            this.refreshCanvas();
            this.displaySimilarQuotes([]);
            return;
        }
        
        if (this.canSubmitRequest()) {
            this.processQuoteSubmission(inputValue);
            this.lastProcessedInput = inputValue;
        }
    }

    setupSearchModeButtons() {
        const quoteButton = document.querySelector('.icon-button:nth-child(1)');
        const authorButton = document.querySelector('.icon-button:nth-child(2)');
        const bookButton = document.querySelector('.icon-button:nth-child(3)');

        const buttons = [
            { element: quoteButton, mode: 'quote' },
            { element: authorButton, mode: 'author' },
            { element: bookButton, mode: 'book' }
        ];

        buttons.forEach(({ element, mode }, index) => {
            element.addEventListener('click', () => {
                this.searchMode = mode;
                this.currentModeIndex = index;
                buttons.forEach(btn => btn.element.classList.remove('active'));
                element.classList.add('active');
                this.updateSearchModeUI();
                if (this.input.value.trim()) {
                    this.processQuoteSubmission(this.input.value.trim());
                }
            });
        });
    }

    updateSearchModeUI() {
        const placeholders = {
            quote: 'Search for a quote...',
            author: 'Search by author name...',
            book: 'Search by book title...'
        };
        
        this.input.placeholder = placeholders[this.searchMode];
        // this.input.parentElement.setAttribute('data-search-mode', `Search by ${this.searchMode}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new QuoteVisualizer();
}); 