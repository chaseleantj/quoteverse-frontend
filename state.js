class AppState {
    constructor() {
        this.existingQuotes = [];
        this.lastRequestTime = 0;
        this.coordinatesCache = new Map();
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

    getCachedCoordinates(quote) {
        return this.coordinatesCache.get(quote);
    }

    setCachedCoordinates(quote, coordinates) {
        this.coordinatesCache.set(quote, coordinates);
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.existingQuotes));
    }
}

export const appState = new AppState();
export default appState; 