import { API_CONFIG } from './config.js';

class ApiService {
    async fetchExistingQuotes() {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/?count=${API_CONFIG.MAX_QUOTE_COUNT}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data.quotes;
        } catch (error) {
            console.error('Error fetching existing quotes:', error);
            throw error;
        }
    }

    async getQuoteCoordinates(quote) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/get-coords/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify([quote]),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data.coordinates[0].coords;
        } catch (error) {
            console.error('Error getting quote coordinates:', error);
            throw error;
        }
    }

    async getSimilarQuotes(quote) {
        const k = API_CONFIG.MAX_SIMILAR_QUOTE_COUNT;
        const max_distance = API_CONFIG.MAX_SIMILAR_QUOTE_DISTANCE;
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/get-similar-quotes/?k=${k}&max_distance=${max_distance}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify([quote]),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            return result.data.queries[0].similar_quotes;
        } catch (error) {
            console.error('Error getting similar quotes:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();
export default apiService; 