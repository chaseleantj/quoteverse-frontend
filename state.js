class AppState {
    constructor() {
        this.existingQuotes = [];
        this.lastRequestTime = 0;
        this.similarQuotesCache = new Map();
        this.subscribers = new Set();
    }

    setQuotes(quotes) {
        this.existingQuotes = quotes;
        this.notifySubscribers();
    }

    getQuotes() {
        return this.existingQuotes;
    }

    updateLastRequestTime() {
        this.lastRequestTime = Date.now();
    }

    getLastRequestTime() {
        return this.lastRequestTime;
    }

    getCachedSimilarQuotes(quote) {
        return this.similarQuotesCache.get(quote);
    }

    setCachedSimilarQuotes(quote, similarQuotes) {
        this.similarQuotesCache.set(quote, similarQuotes);
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.existingQuotes));
    }

    updateQuotesWithSimilar(similarQuotes, maxQuotes) {
        // Create a Set of existing quote IDs for O(1) lookup
        const existingIds = new Set(this.existingQuotes.map(q => q.id));
        
        // Filter out similar quotes that are already in existing quotes
        const newQuotes = similarQuotes.filter(q => !existingIds.has(q.id));
        
        if (newQuotes.length === 0) return;

        // Remove least similar quotes to make room for new ones
        const quotesToKeep = this.existingQuotes.slice(0, maxQuotes - newQuotes.length);
        
        // Combine kept quotes with new similar quotes
        this.existingQuotes = [...quotesToKeep, ...newQuotes];
        
        this.notifySubscribers();
    }
}

// Expose appState to the global window object
export const appState = new AppState();

// To test the appState in the console
// window.appState = appState;
export default appState; 