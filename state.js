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
}

// Expose appState to the global window object
export const appState = new AppState();

// To test the appState in the console
window.appState = appState;
export default appState; 